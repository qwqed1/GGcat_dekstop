import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import './BetModal.css'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useCrashSocket } from '../hooks/useCrashSocket'
import { useUser } from '../context/UserContext'
import { getUserById } from '../api/users'
import { getDropById } from '../api/cases'// Примеры подарков (с эмодзи как заглушки)
import { roulettePaidSpin } from '../api/roulette'
import { apiFetch } from '../api/client'
function BetModal({
  isOpen,
  onClose,
  game = 'crash',
  mode = 'bet',
  canBet = true,
  onResult
}) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('coins') // 'gifts' | 'coins'
  const [selectedGift, setSelectedGift] = useState(null)
  const [autoCashout, setAutoCashout] = useState(false)
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState('1.30')
  const { selectedCurrency } = useCurrency()
  const { user, setUser } = useUser()
  
  // Минимальная ставка 0.5 TON
  const MIN_BET_TON = 0.5
  const NO_DECIMAL_CURRENCIES = ['stars', 'gems'] // валюты без дробной части
  const isNoDecimalCurrency = NO_DECIMAL_CURRENCIES.includes(selectedCurrency?.id)
  
  // Минимальная ставка в выбранной валюте
  const minBetInCurrency = useMemo(() => {
    const rate = selectedCurrency?.rate || 1
    const converted = MIN_BET_TON / rate
    return isNoDecimalCurrency ? Math.ceil(converted) : Number(converted.toFixed(2))
  }, [selectedCurrency?.rate, isNoDecimalCurrency])
  
  const LAST_BET_KEY = `crash_last_bet_${selectedCurrency?.id || 'default'}`
  
  const defaultBet = useMemo(() => {
    // Сначала проверяем localStorage
    const savedBet = localStorage.getItem(LAST_BET_KEY)
    if (savedBet && Number(savedBet) >= minBetInCurrency) {
      return savedBet
    }
    
    const balance = Number(user?.balance) || 0
    const rate = selectedCurrency?.rate || 1
    const balanceInCurrency = balance / rate
    const twentyPercent = balanceInCurrency * 0.2
    const bet = Math.max(minBetInCurrency, twentyPercent)
    return isNoDecimalCurrency ? Math.floor(bet).toString() : bet.toFixed(2)
  }, [user?.balance, isNoDecimalCurrency, minBetInCurrency, selectedCurrency?.rate, LAST_BET_KEY])
  
  const [betAmount, setBetAmount] = useState(defaultBet)
  
  // Используем useCrashSocket только для crash игры
  const { send, connected } = useCrashSocket(() => {}, { enabled: game === 'crash' })
  
  useEffect(() => {
    localStorage.setItem(LAST_BET_KEY, betAmount)
  }, [betAmount, LAST_BET_KEY])
  
  // Для свайпа
  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)
  const [drops, setDrops] = useState([])
  const [loadingDrops, setLoadingDrops] = useState(false)
  const [dropsMap, setDropsMap] = useState({})

  const [spinResult, setSpinResult] = useState(null)

  function playGame(userId) {
    return apiFetch(`/games/play?user_id=${userId}`, {
      method: 'POST',
    })
  }

  const handleBetResult = (result) => {
    setSpinResult(result)
    handleSpin(result)
  }
  
  const afterAnyBet = async () => {
    try {
      await playGame(user.id, game) // 🔥 XP / stats
      await refreshUser()           // 🔥 обновляем user в контексте
    } catch (e) {
      console.error('Play / refresh failed', e)
    }
  }
  

  const betHandlers = {
    crash: {
      coins: async ({ amount }) => {
        send({
          event: 'bet',
          user_id: user.id,
          amount,
          gift: false,
          gift_id: null,
          auto_cashout_x: autoCashout ? parseFloat(autoCashoutMultiplier) : null,
        })
      },
      gifts: async ({ giftId }) => {
        send({
          event: 'bet',
          user_id: user.id,
          amount: 0,
          gift: true,
          gift_id: giftId,
          auto_cashout_x: autoCashout ? parseFloat(autoCashoutMultiplier) : null,
        })
      },
    },
  
    roulette: {
      coins: async ({ amount }) => {
        return await roulettePaidSpin({
          userId: user.id,
          amount,
          giftId: null,
        })
      },
      gifts: async ({ giftId }) => {
        return await roulettePaidSpin({
          userId: user.id,
          amount: null,
          giftId,
        })
      },
      
    },

    pvp: {
      coins: async ({ amount }) => {
        return {
          type: 'coins',
          amount,
        }
      },
      gifts: async ({ giftId }) => {
        return {
          type: 'gift',
          gift_id: giftId,
        }
      },
    },
    
  }
  

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)'
      currentTranslateY.current = 0
    }
  }, [isOpen])

  // Обновляем betAmount при открытии модала или изменении баланса
  useEffect(() => {
    if (isOpen) {
      setBetAmount(defaultBet)
    }
  }, [isOpen, defaultBet])

  const sendBet = ({ amount, gift, giftId }) => {
    if (!connected || !user?.id) return
  
    switch (game) {
      case 'crash':
        send({
          event: 'bet',
          user_id: user.id,
          amount,
          gift,
          gift_id: giftId,
          auto_cashout_x: null,
        })
        break
  
      case 'dice':
        send({
          event: 'dice_bet',
          user_id: user.id,
          amount,
          chance: 50,
        })
        break
  
      case 'roulette':
        send({
          event: 'roulette_bet',
          user_id: user.id,
          amount,
          color: 'red',
        })
        break
  
      default:
        console.warn('Unknown game', game)
    }
  }

  useEffect(() => {
    if (!isOpen || !user?.inventory?.length) return
  
    let cancelled = false
  


    

    const loadDrops = async () => {
      const result = {}
  
      for (const inv of user.inventory) {
        try {
          const drop = await getDropById(inv.drop_id)
          result[inv.drop_id] = drop
        } catch (e) {
          console.error('Failed to load drop', inv.drop_id, e)
        }
      }
  
      if (!cancelled) {
        setDropsMap(result)
      }
    }
  
    loadDrops()
  
    return () => {
      cancelled = true
    }
  }, [isOpen, user])
  
  
  // Начало свайпа/drag
  const handleDragStart = (e) => {
    isDragging.current = true
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragStartY.current = clientY - currentTranslateY.current
    
    if (contentRef.current) {
      contentRef.current.style.transition = 'none'
    }
  }
  const refreshUser = async () => {
    if (!user?.id) return
  
    try {
      const freshUser = await getUserById(user.id)
      setUser(freshUser) // 🔥 обновляет ВЕСЬ APP
    } catch (e) {
      console.error('Failed to refresh user', e)
    }
  }
  
  const inventoryGifts = useMemo(() => {
    if (!user?.inventory?.length) return []
  
    return user.inventory
      .map(inv => {
        const drop = dropsMap[inv.drop_id]
        if (!drop || inv.count <= 0) return null
  
        return {
          ...drop,
          count: inv.count,
        }
      })
      .filter(Boolean)
  }, [user, dropsMap])
  
  
  
  
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

  const handleMaxClick = () => {
    if (!selectedCurrency?.amount) return
    // Парсим русский формат: точки как разделители тысяч, запятая как десятичный разделитель
    // Например: "1.234,56" -> "1234.56"
    const normalized = selectedCurrency.amount
      .replace(/\./g, '')  // убираем разделители тысяч
      .replace(',', '.')   // заменяем запятую на точку
    const numeric = normalized.replace(/[^0-9.]/g, '')
    const value = isNoDecimalCurrency 
      ? Math.floor(Number(numeric)).toString() 
      : numeric
    setBetAmount(value || '0')
  }

  const currencyIcon = selectedCurrency?.icon || '/image/Coin-Icon.svg'
  const currencyAmountLabel = selectedCurrency?.amount || '0'

  const isWithdrawMode = mode === 'withdraw'
  const titleText = isWithdrawMode ? t('betModal.withdraw') : t('betModal.placeBet')
  const primaryButtonText = isWithdrawMode ? t('betModal.withdraw') : t('betModal.placeBet')
  const isRoulette = game === 'roulette'

  // Проверяем, можно ли сделать ставку
  const betAmountNum = Number(betAmount)
  const isBetAmountValid = betAmountNum > 0 && betAmountNum >= minBetInCurrency
  
  // Проверяем баланс
  const balanceNum = Number(selectedCurrency?.amount?.replace(/[^0-9.,]/g, '').replace(',', '.') || 0)
  const hasEnoughBalance = betAmountNum <= balanceNum
  const canPlaceBet = canBet && isBetAmountValid && hasEnoughBalance

  const handleCoinsSubmit = async () => {
    if (!selectedCurrency?.rate || !user?.id) return
  
    const uiAmount = Number(betAmount)
    if (!uiAmount || uiAmount <= 0) return
    
    // Проверка минимальной ставки
    if (uiAmount < minBetInCurrency) {
      console.warn(`Minimum bet is ${minBetInCurrency}`)
      return
    }
  
    // конвертируем в TON
    const amountInTon = uiAmount * selectedCurrency.rate
  
    // PvP: проверка ТОЛЬКО по user.balance
    if (game === 'pvp') {
      const balanceTon = Number(user?.balance ?? 0)
  
      if (amountInTon > balanceTon) {
        console.warn('Not enough balance')
        return
      }
    }
  
    try {
      const handler = betHandlers[game]?.coins
      if (!handler) throw new Error('No coins handler')
  
      const result = await handler({ amount: amountInTon })

      await playGame(user.id)

      onResult?.(result)

      if (game !== 'pvp') {
        await refreshUser()
      }
      onClose()
    } catch (e) {
      console.error('Coins bet failed', e)
    }
  }
  
  
  
  
  
  
  
  

  const handleGiftsSubmit = async (giftIdOverride = null) => {
    const giftId = giftIdOverride || selectedGift
    if (!giftId || !user?.id) return
  
    // PvP: проверка, есть ли подарок в инвентаре
    if (game === 'pvp') {
      const hasGift = inventoryGifts.some(g => g.id === giftId)
      if (!hasGift) {
        console.warn('Gift not in inventory')
        return
      }
    }
  
    try {
      const handler = betHandlers[game]?.gifts
      if (!handler) throw new Error('No gifts handler')
  
      const result = await handler({ giftId })
  
      await playGame(user.id)

      onResult?.(result)
  

      if (game !== 'pvp') {
        await refreshUser()
      }
      onClose()
    } catch (e) {
      console.error('Gift bet failed', e)
    }
  }
  
  
  
  
  
  

  if (!isOpen) return null

  return (
    <div 
      className="bet-modal-overlay" 
      ref={modalRef}
      onClick={handleOverlayClick}
    >
      <div 
        className="bet-modal-content"
        ref={contentRef}
      >
        {/* Кнопка закрытия для десктопа */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close" />
        
        {/* Ручка для свайпа */}
        <div 
          className="bet-modal-handle"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="bet-modal-handle-bar"></div>
        </div>

        {/* Заголовок */}
        <h2 className="bet-modal-title">{titleText}</h2>

        {/* Табы */}
        <div className="bet-modal-tabs">
          <button 
            className={`bet-modal-tab ${activeTab === 'gifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('gifts')}
          >
            {t('betModal.gifts')}
          </button>
          <button 
            className={`bet-modal-tab ${activeTab === 'coins' ? 'active' : ''}`}
            onClick={() => setActiveTab('coins')}
          >
            {t('betModal.coins')}
          </button>
        </div>

        {/* Контент табов */}
        <div className="bet-modal-tabs-content">
          <div className={`bet-tab-panel ${activeTab === 'coins' ? 'active' : ''}`}>
            <div className="bet-modal-coins-content">
              <div className="bet-amount-header">
                <span className="bet-amount-label">{t('betModal.betAmount')}</span>
                <span className="bet-balance">{t('betModal.balance')}: {currencyAmountLabel}</span>
              </div>
              
              <div className="bet-amount-input-wrapper">
                <input
                  type="text"
                  className="bet-amount-input"
                  value={betAmount}
                  onChange={(e) => {
                    const regex = isNoDecimalCurrency ? /[^0-9]/g : /[^0-9.]/g
                    setBetAmount(e.target.value.replace(regex, ''))
                  }}
                  placeholder="0"
                />
                <div className="bet-amount-actions">
                  <img src={currencyIcon} alt="currency" className="bet-coin-icon" />
                  <button className="bet-max-button" onClick={handleMaxClick}>
                    MAX
                  </button>
                </div>
              </div>
              <div className={`bet-min-amount-hint ${betAmountNum > 0 && (betAmountNum < minBetInCurrency || !hasEnoughBalance) ? 'bet-min-amount-hint--error' : ''}`}>
                {betAmountNum > 0 && betAmountNum < minBetInCurrency 
                  ? `Минимальная ставка 0.5 TON (${minBetInCurrency} ${selectedCurrency?.name || ''})`
                  : betAmountNum > 0 && !hasEnoughBalance
                  ? `Недостаточно баланса. Доступно: ${currencyAmountLabel}`
                  : `${t('betModal.minBet')}: ${minBetInCurrency}`
                }
                <img src={currencyIcon} alt="currency" className="bet-min-coin-icon" />
              </div>

              {game === 'crash' && (
                <div className="auto-cashout-row">
                  <div className="auto-cashout-toggle">
                    <span className="auto-cashout-label">{t('betModal.autoCashout')}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={autoCashout}
                        onChange={(e) => setAutoCashout(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  {autoCashout && (
                    <div className="auto-cashout-input-wrapper">
                      <span className="auto-cashout-x">x</span>
                      <input
                        type="text"
                        className="auto-cashout-input"
                        value={autoCashoutMultiplier}
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
                          setAutoCashoutMultiplier(value)
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value)
                          if (isNaN(val) || val < 1.3) {
                            setAutoCashoutMultiplier('1.30')
                          }
                        }}
                        placeholder="1.30"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                className={`bet-submit-button ${!canPlaceBet ? 'disabled' : ''}`}
                onClick={handleCoinsSubmit}
                disabled={!canPlaceBet}
              >
                {canPlaceBet ? primaryButtonText : t('crash.betsClosed')}
              </button>

            </div>
          </div>

          <div className={`bet-tab-panel ${activeTab === 'gifts' ? 'active' : ''}`}>
            <div className="bet-modal-gifts-content">
              <div className="bet-gifts-grid">
                {inventoryGifts.map(gift => (
                  <div
                    key={gift.id}
                    className="bet-gift-card"
                  >
                    <div className="bet-gift-card-image">
                      <img src={gift.icon} alt={gift.name} />
                    </div>
                    <div className="bet-gift-card-name" title={gift.name}>
                      {gift.name}
                    </div>
                    <div className="bet-gift-card-price">
                      {gift.price?.toFixed(2) || '0.00'}
                      <img src={selectedCurrency?.icon || '/image/Coin-Icon.svg'} alt="currency" />
                    </div>
                    <button
                      className={`bet-gift-place-btn ${selectedGift === gift.id ? 'selected' : ''} ${!canBet || gift.price < 0.5 ? 'disabled' : ''}`}
                      onClick={() => {
                        if (canBet && gift.price >= 0.5) {
                          setSelectedGift(gift.id)
                          handleGiftsSubmit(gift.id)
                        }
                      }}
                      disabled={!canBet || gift.price < 0.5}
                      title={gift.price < 0.5 ? 'Минимальная ставка 0.5 TON' : ''}
                    >
                      {t('betModal.placeBet')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetModal