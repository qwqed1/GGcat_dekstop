import './InventoryModal.css'
import { useEffect, useRef, useState } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'
import * as usersApi from '../api/users'

function InventoryModal({ isOpen, onClose, items, loading, onSellItem, onSellAll }) {
  const { selectedCurrency, formatAmount } = useCurrency()
  const { t } = useLanguage()
  const [sellingId, setSellingId] = useState(null)
  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)
  const { user, setUser } = useUser()

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)'
      currentTranslateY.current = 0
    }
  }, [isOpen])

  const sellItem = async (item) => {
    if (!user) return
  
    const inventory = [...user.inventory]
    const idx = inventory.findIndex(i => i.drop_id === item.id)
    if (idx === -1) return
  
    inventory[idx] = {
      ...inventory[idx],
      count: inventory[idx].count - 1,
    }
  
    if (inventory[idx].count <= 0) {
      inventory.splice(idx, 1)
    }
  
    const updatedUser = {
      ...user,
      balance: Number(user.balance) + Number(item.price || 0),
      inventory,
    }
  
    setUser(updatedUser)
  
    await usersApi.updateUser(user.id, {
      balance: updatedUser.balance,
      inventory,
    })
  }
  
  const sellAllItems = async () => {
    if (!user || !user.inventory?.length) return
  
    const itemsById = Object.fromEntries(
      items.map(item => [item.id, item])
    )
  
    const total = user.inventory.reduce((sum, inv) => {
      const drop = itemsById[inv.drop_id]
      if (!drop) return sum
  
      return sum + Number(drop.price || 0) * Number(inv.count || 0)
    }, 0)
  
    const nextBalance = Number(user.balance) + total
  
    if (!Number.isFinite(nextBalance)) {
      console.error('Bad balance', { total, user })
      return
    }
  
    const payload = {
      balance: nextBalance,
      inventory: [],
    }
  
    setUser(prev => ({ ...prev, ...payload }))
  
    const serverUser = await usersApi.updateUser(user.id, payload)
    setUser(serverUser)
  }

  // Начало свайпа/drag
  const handleDragStart = (e) => {
    isDragging.current = true
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragStartY.current = clientY - currentTranslateY.current
    
    if (contentRef.current) {
      contentRef.current.style.transition = 'none'
    }
  }

  // Движение свайпа/drag
  const handleDragMove = (e) => {
    if (!isDragging.current) return

    if (e?.type === 'touchmove' && e.cancelable) {
      e.preventDefault()
    }

    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    let newTranslateY = clientY - dragStartY.current
    if (newTranslateY < 0) newTranslateY = 0

    currentTranslateY.current = newTranslateY

    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${newTranslateY}px)`
    }
  }

  // Конец свайпа/drag
  const handleDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false

    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.3s ease-out'

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

  if (!isOpen) return null

  const handleSellItem = async (item, index) => {
    setSellingId(`${item.id}-${index}`)
    try {
      await sellItem(item)
    } finally {
      setSellingId(null)
    }
  }

  const handleSellAll = async () => {
    if (onSellAll) {
      await onSellAll()
    }
  }

  const totalValue = user?.inventory?.reduce((sum, inv) => {
    const item = items.find(i => i.id === inv.drop_id)
    if (!item) return sum
    return sum + Number(item.price || 0) * Number(inv.count || 0)
  }, 0) || 0

  const getRarityClass = (rarity) => {
    if (!rarity) return ''
    const r = rarity.toLowerCase()
    if (r === 'common') return 'rarity-common'
    if (r === 'rare') return 'rarity-rare'
    if (r === 'epic') return 'rarity-epic'
    if (r === 'legendary') return 'rarity-legendary'
    return ''
  }

  return (
    <div className="inventory-modal-overlay" onClick={onClose}>
      <div
        className="inventory-modal"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия для десктопа */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close" />
        
        <div
          className="inventory-modal-handle"
          role="button"
          tabIndex={0}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose()
          }}
        >
          <div className="inventory-modal-handle-bar" />
        </div>
        {/* Header */}
        <div className="inventory-modal-header">
          <h2 className="inventory-modal-title">
            {t('inventory.title')} <span>({items?.length || 0})</span>
          </h2>
        </div>

        {/* Actions */}
        <div className="inventory-modal-actions">
          <button
            className="sell-all-modal-btn"
            onClick={sellAllItems}
            disabled={!items?.length || loading}
          >
            {t('inventory.sellAll')}
          </button>
          <div className="total-value">
            {t('inventory.total')}:{' '}
            <span>{formatAmount(totalValue)}</span>
            <img
              src={selectedCurrency?.icon}
              alt="currency"
              style={{ width: 14, height: 14, marginLeft: 4 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="inventory-modal-content">
          {loading ? (
            <div className="inventory-modal-loading">{t('inventory.loading')}</div>
          ) : !items?.length ? (
            <div className="inventory-modal-empty">
              <img
                src="/image/mdi_gift (2).svg"
                alt="empty"
                className="inventory-modal-empty-icon"
              />
              <p className="inventory-modal-empty-text">
                {t('inventory.empty')}<br />
                {t('inventory.emptyHint')}
              </p>
            </div>
          ) : (
            <div className="inventory-modal-grid">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className={`inventory-modal-card ${getRarityClass(item.rarity)}`}
                >
                  <div className="inventory-modal-card-image">
                    {item.icon?.endsWith('.json') ? (
                      <Player
                        autoplay
                        loop
                        src={item.icon}
                        className="inventory-modal-card-lottie"
                      />
                    ) : (
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="inventory-modal-card-icon"
                      />
                    )}
                  </div>
                  <div className="inventory-modal-card-name" title={item.name}>
                    {item.name}
                  </div>
                  <div className="inventory-modal-card-price">
                    {formatAmount(Number(item.price || 0) * Number(item.count || 1))}
                    <img src={selectedCurrency?.icon} alt="currency" />
                  </div>
                  <button
                    className="inventory-modal-sell-btn"
                    onClick={() => handleSellItem(item, index)}
                    disabled={sellingId === `${item.id}-${index}`}
                  >
                    {sellingId === `${item.id}-${index}` ? t('inventory.selling') : t('inventory.sell')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryModal
