import { useState, useRef, useEffect } from 'react'
import './DepositModal.css'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'
import * as usersApi from '../api/users'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { apiFetch } from '../api/client'




function DepositModal({ isOpen, onClose }) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('stars')
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [amount, setAmount] = useState('')
  
  // Для свайпа
  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)

  const API_URL = import.meta.env.VITE_API_URL

  const { user, loading, setUser } = useUser()
  

  const [tonConnectUI] = useTonConnectUI()
const tonWallet = useTonWallet()
const [isPaying, setIsPaying] = useState(false)

const toNano = (value) => {
  return Math.floor(Number(value) * 1e9).toString()
}


const handleTonPay = async () => {
  const tonAmount = Number(amount)
  if (!tonAmount || tonAmount <= 0 || isPaying) return

  setIsPaying(true)

  try {
    // 1️⃣ create (учёт)
    await apiFetch('/api/ton/create', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        amount: tonAmount
      })
    })

    // 2️⃣ отправка TON
    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: import.meta.env.VITE_TON_RECEIVER,
          amount: toNano(tonAmount)
        }
      ]
    })

    // 3️⃣ success — ТОЛЬКО user_id
    await apiFetch('/api/ton/success', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id
      })
    })

    // 4️⃣ обновляем пользователя
    const updatedUser = await usersApi.getUserById(user.id)
    setUser(updatedUser)

    onClose()
  } catch (e) {
    console.error('TON pay error', e)
  } finally {
    setIsPaying(false)
  }
}




  // Сброс позиции при открытии
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)'
      currentTranslateY.current = 0
      setActiveTab('gifts')
      setSelectedCurrency(null)
      setAmount('')
    }
  }, [isOpen])
if (loading || !user) {
  return null // или disabled кнопки
}


  const handleStarsPay = async () => {
    if (!amount || Number(amount) <= 0) return
  
    try {
      const res = await fetch(`${API_URL}/api/stars/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          user_id: user.id
        })
      })
  
      if (!res.ok) {
        throw new Error('Create invoice failed')
      }
  
      const data = await res.json()
  
      window.Telegram.WebApp.openInvoice(data.invoice_link)
  
    } catch (e) {
      console.error('Stars pay error', e)
    }
  }
  
  useEffect(() => {
    const handler = async (event) => {
      console.log('invoiceClosed event:', event)
  
      if (event.status === 'paid') {
        try {
          // 1️⃣ подтверждаем депозит
          await fetch(`${API_URL}/api/stars/success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id
            })
          })
  
          // 2️⃣ получаем обновлённого пользователя
          const updatedUser = await usersApi.getUserById(user.id)
  
          // 3️⃣ обновляем контекст
          setUser(updatedUser)
  
        } catch (err) {
          console.error('Stars success / user refresh error', err)
        } finally {
          onClose()
        }
      }
    }
  
    window.Telegram.WebApp.onEvent('invoiceClosed', handler)
    return () => window.Telegram.WebApp.offEvent('invoiceClosed', handler)
  }, [API_URL, user.id, setUser, onClose])
  
  
  
  
  
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
    
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    let newTranslateY = clientY - dragStartY.current
    
    // Ограничиваем движение только вниз
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
      
      // Если свайпнули больше чем на 100px - закрываем
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

  // Клик по оверлею закрывает модал
  const handleOverlayClick = (e) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="deposit-modal-overlay" 
      ref={modalRef}
      onClick={handleOverlayClick}
    >
      <div 
        className="deposit-modal-content"
        ref={contentRef}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Кнопка закрытия (крестик) для десктопа */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close" />
        
        {/* Ручка для свайпа */}
        <div 
          className="deposit-modal-handle"
          onMouseDown={handleDragStart}
        >
          <div className="deposit-modal-handle-bar"></div>
        </div>

        {/* Заголовок */}
        <h2 className="deposit-modal-title">{t('deposit.title')}</h2>

        {/* Табы */}
        <div className="deposit-modal-tabs">
          <button 
            className={`deposit-modal-tab ${activeTab === 'gifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('gifts')}
          >
            {t('deposit.gifts')}
          </button>
          <button 
            className={`deposit-modal-tab ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            {t('deposit.wallet')}
          </button>
          {/* Криптобот временно отключен */}
          {/* <button 
            className={`deposit-modal-tab ${activeTab === 'crypto' ? 'active' : ''}`}
            onClick={() => setActiveTab('crypto')}
          >
            {t('deposit.cryptoBot')}
          </button> */}
        </div>

        {/* Контент табов */}
        <div className="deposit-modal-tabs-content">
          {/* Вкладка Подарки */}
          <div className={`deposit-tab-panel ${activeTab === 'gifts' ? 'active' : ''}`}>
          <div className="deposit-stars-content">
  <div className="deposit-amount-wrapper">
    <input
      type="text"
      inputMode="numeric"
      className="deposit-amount-input"
      placeholder={t('deposit.amount')}
      value={amount}
      onChange={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, '')
        setAmount(value)
      }}
    />
  </div>

  <button
    className="deposit-wallet-button"
    onClick={handleStarsPay}
    disabled={!amount}
  >
    {t('deposit.payStars')}
  </button>
</div>

          </div>

{/* Вкладка Кошелёк */}
<div className={`deposit-tab-panel ${activeTab === 'wallet' ? 'active' : ''}`}>
  <div className="deposit-wallet-content">

    {/* 1️⃣ КНОПКА ПОДКЛЮЧЕНИЯ */}
    {!tonWallet && (
      <button
        className="deposit-wallet-button"
        onClick={() => tonConnectUI.openModal()}
      >
        {t('deposit.connectWallet')}
      </button>
    )}

    {/* 2️⃣ КОШЕЛЁК ПОДКЛЮЧЕН */}
    {tonWallet && (
      <>
        <div className="deposit-wallet-message">
          {tonWallet.account.address.slice(0, 6)}...
          {tonWallet.account.address.slice(-4)}
        </div>

        {/* 3️⃣ ВВОД СУММЫ */}
        <div className="deposit-amount-wrapper">
          <input
            type="text"
            inputMode="decimal"
            className="deposit-amount-input"
            placeholder={t('deposit.amount')}
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
        </div>

        {/* 4️⃣ ОПЛАТА */}
        <button
          className="deposit-wallet-button"
          onClick={handleTonPay}
          disabled={!amount || isPaying}
        >
          {isPaying ? 'Processing...' : 'Pay with TON'}
        </button>
      </>
    )}

  </div>
</div>


          {/* Вкладка Crypto Bot */}
          <div className={`deposit-tab-panel ${activeTab === 'crypto' ? 'active' : ''}`}>
            <div className="deposit-crypto-content">
              <div className="deposit-amount-wrapper">
                <input
                  type="text"
                  inputMode="decimal"
                  className="deposit-amount-input"
                  placeholder={t('deposit.amount')}
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
              </div>
              <div className="deposit-currency-grid">
                <button 
                  className={`deposit-currency-button ${selectedCurrency === 'TON' ? 'active' : ''}`}
                  onClick={() => setSelectedCurrency('TON')}
                >
                  TON
                </button>
                <button 
                  className={`deposit-currency-button ${selectedCurrency === 'USDT' ? 'active' : ''}`}
                  onClick={() => setSelectedCurrency('USDT')}
                >
                  USDT
                </button>
                <button 
                  className={`deposit-currency-button ${selectedCurrency === 'TRX' ? 'active' : ''}`}
                  onClick={() => setSelectedCurrency('TRX')}
                >
                  TRX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DepositModal