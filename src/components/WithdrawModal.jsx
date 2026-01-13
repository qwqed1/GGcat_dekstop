import { useState, useRef, useEffect, useMemo } from 'react'
import './WithdrawModal.css'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'
import { useCurrency } from '../context/CurrencyContext'
import { createTonWithdraw, createDropWithdraw } from '../api/withdraw'
import { getUserById } from '../api/users'
import { getDropById } from '../api/cases'

function WithdrawModal({ isOpen, onClose }) {
  const { t } = useLanguage()
  const { user, setUser } = useUser()
  const { selectedCurrency } = useCurrency()

  const [activeTab, setActiveTab] = useState('coins')
  const [amount, setAmount] = useState('')
  const [selectedGift, setSelectedGift] = useState(null)

  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)

  const [dropsMap, setDropsMap] = useState({})

  /* ================= LOAD DROPS ================= */
  useEffect(() => {
    if (!isOpen || !user?.inventory?.length) return

    let cancelled = false

    const loadDrops = async () => {
      const result = {}
      for (const inv of user.inventory) {
        try {
          const drop = await getDropById(inv.drop_id)
          result[inv.drop_id] = drop
        } catch {}
      }
      if (!cancelled) setDropsMap(result)
    }

    loadDrops()
    return () => (cancelled = true)
  }, [isOpen, user])

  const inventoryGifts = useMemo(() => {
    if (!user?.inventory?.length) return []
    return user.inventory
      .map(inv => {
        const drop = dropsMap[inv.drop_id]
        if (!drop || inv.count <= 0) return null
        return { ...drop, count: inv.count }
      })
      .filter(Boolean)
  }, [user, dropsMap])

  /* ================= REFRESH USER ================= */
  const refreshUser = async () => {
    const fresh = await getUserById(user.id)
    setUser(fresh)
  }

  /* ================= TON ================= */
  const handleCoinsWithdraw = async () => {
    const value = Number(amount)
    if (!value || value <= 0) return

    await createTonWithdraw({
      userId: user.id,
      amount: value,
    })

    await refreshUser()
    onClose()
  }

  /* ================= GIFTS ================= */
  const handleGiftWithdraw = async () => {
    if (!selectedGift) return

    await createDropWithdraw({
      userId: user.id,
      dropId: selectedGift,
    })

    await refreshUser()
    onClose()
  }

  /* ================= DRAG ================= */
  const handleDragStart = (e) => {
    isDragging.current = true
    const y = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragStartY.current = y - currentTranslateY.current
    if (contentRef.current) {
      contentRef.current.style.transition = 'none'
    }
  }

  const handleDragMove = (e) => {
    if (!isDragging.current) return
    const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    const delta = Math.max(0, y - dragStartY.current)
    currentTranslateY.current = delta
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${delta}px)`
    }
  }

  const handleDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.3s ease'

      if (currentTranslateY.current > 100) {
        contentRef.current.style.transform = 'translateY(100%)'
        setTimeout(() => {
          onClose()
          currentTranslateY.current = 0
        }, 300)
      } else {
        contentRef.current.style.transform = 'translateY(0)'
        currentTranslateY.current = 0
      }
    }
  }

  // Обработчики для mouse events на document
  useEffect(() => {
    const handleMouseMove = (e) => handleDragMove(e)
    const handleMouseUp = () => handleDragEnd()

    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isOpen])

  // Сброс позиции при открытии
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)'
      currentTranslateY.current = 0
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="withdraw-modal-overlay"
      ref={modalRef}
      onClick={(e) => e.target === modalRef.current && onClose()}
    >
      <div
        className="withdraw-modal-content"
        ref={contentRef}
      >
        {/* Кнопка закрытия для десктопа */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close" />
        
        <div 
          className="withdraw-modal-handle" 
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="withdraw-modal-handle-bar" />
        </div>

        <h2 className="withdraw-modal-title">{t('withdraw.title')}</h2>

        {/* TABS */}
        <div className="withdraw-modal-tabs">
          <button
            className={`withdraw-modal-tab ${activeTab === 'coins' ? 'active' : ''}`}
            onClick={() => setActiveTab('coins')}
          >
            {t('withdraw.coins')}
          </button>
          <button
            className={`withdraw-modal-tab ${activeTab === 'gifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('gifts')}
          >
            {t('withdraw.gifts')}
          </button>
        </div>

        {/* COINS */}
        {activeTab === 'coins' && (
          <div className="withdraw-coins">
            <input
              className="withdraw-amount-input"
              type="text"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                let value = e.target.value
                // Заменяем запятые на точки для унификации
                value = value.replace(/,/g, '.')
                // Удаляем все символы кроме цифр и точек
                value = value.replace(/[^0-9.]/g, '')
                // Предотвращаем множественные точки
                const parts = value.split('.')
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('')
                }
                setAmount(value)
              }}
            />
            <button
              className="withdraw-submit-button"
              onClick={handleCoinsWithdraw}
              disabled={!amount}
            >
              {t('withdraw.withdrawButton')}
            </button>
          </div>
        )}

        {/* GIFTS */}
        {activeTab === 'gifts' && (
          <>
            <div className="withdraw-gifts-grid">
              {inventoryGifts.map(g => (
                <div
                  key={g.id}
                  className={`withdraw-gift ${selectedGift === g.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGift(g.id)}
                >
                  <img src={g.icon} alt={g.name} />
                  <span className="withdraw-gift-price">
                    {g.price}
                    <img src={selectedCurrency?.icon || '/image/Coin-Icon.svg'} alt="currency" className="withdraw-gift-currency-icon" />
                  </span>
                </div>
              ))}
            </div>

            <button
              className="withdraw-submit-button"
              onClick={handleGiftWithdraw}
              disabled={!selectedGift}
            >
              {t('withdraw.withdrawButton')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default WithdrawModal
