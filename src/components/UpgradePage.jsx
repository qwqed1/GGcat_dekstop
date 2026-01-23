import { useState, useEffect, useCallback, useRef, memo } from 'react'
import './UpgradePage.css'
import './WheelPage.css'
import PageLayout from './PageLayout'
import Header from './Header'
import Navigation from './Navigation'
import GameFaq from './GameFaq'
import { useUser } from '../context/UserContext'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'

import { getAllDrops } from '../api/cases'
import { upgradeItem } from '../api/upgrade'


const MemoHeader = memo(Header)
const MemoNavigation = memo(Navigation)



function UpgradePage() {
  const { user, setUser } = useUser()
  const { selectedCurrency, formatAmount, formatWinAmount } = useCurrency()
  const { t } = useLanguage()
  
  const [sourceItem, setSourceItem] = useState(null)
  const [targetItem, setTargetItem] = useState(null)
  const [gameState, setGameState] = useState('idle') // 'idle' | 'spinning' | 'win' | 'lose'
  const [chance, setChance] = useState(50)
  const [resultText, setResultText] = useState(null)
  const [allDrops, setAllDrops] = useState([])
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const currentAngleRef = useRef(Math.PI / 2)
  const isSpinningRef = useRef(false)
  const lastIsWinRef = useRef(null)
  const WIN_CENTER = Math.PI / 2
  const WIN_HALF_ANGLE = (chance / 100) * Math.PI
  const [winItem, setWinItem] = useState(null)

  // Рассчёт шанса на основе цен
  useEffect(() => {
    if (sourceItem && targetItem) {
      const calculatedChance = Math.min(95, Math.max(5, (sourceItem.price / targetItem.price) * 100))
      setChance(Math.round(calculatedChance * 100) / 100)
    } else {
      setChance(50)
    }
  }, [sourceItem, targetItem])
  useEffect(() => {
    getAllDrops().then(setAllDrops)
  }, [])

  const inventoryItems = (user?.inventory
  ?.map(inv => {
    const drop = allDrops.find(d => d.id === inv.drop_id)
    if (!drop) return null

    return {
      ...drop,
      count: inv.count,
    }
  })
  .filter(Boolean) || [])
  .sort((a, b) => b.price - a.price) // сортировка по цене от дорогих к дешёвым
  const upgradeTargets = allDrops
    .filter(drop => drop.UseInUpgrade === true)
    .sort((a, b) => b.price - a.price) // сортировка по цене от дорогих к дешёвым
  
  const canSelectTarget = (drop) => {
    if (!sourceItem) return true
  

  
    return true
  }
  
  
  
  
  // Canvas drawing
  const drawWheel = useCallback((rotationAngle) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 85
    // Угол на каждую сторону от нижней точки (PI/2).
    // При 50% halfAngle = PI/2 (до боковых меток 50%), при 100% halfAngle = PI (до верхней метки 100%).
    const halfAngle = (chance / 100) * Math.PI
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 1. Фоновый круг (серый трек)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#2c2c2e'
    ctx.lineWidth = 12
    ctx.stroke()
    
    // 2. Засечки
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 1
    for (let i = 0; i < 60; i++) {
      ctx.rotate((Math.PI * 2) / 60)
      ctx.beginPath()
      ctx.moveTo(radius + 12, 0)
      ctx.lineTo(radius + 20, 0)
      ctx.stroke()
    }
    ctx.restore()
    
    // 3. Зона победы (желто-оранжевая дуга)
    const gradient = ctx.createLinearGradient(0, centerY + radius, 0, centerY - radius)
    gradient.addColorStop(0, '#ff6600')
    gradient.addColorStop(0.5, '#ffcc00')
    gradient.addColorStop(1, '#BBFD44')
    
    // Левая дуга (от низа влево вверх)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI / 2, Math.PI / 2 + halfAngle, false)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.stroke()
    
    // Правая дуга (от низа вправо вверх)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI / 2, Math.PI / 2 - halfAngle, true)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.stroke()
    
    // 4. Внутренний тёмный круг
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // 5. Стрелка (курсор) - вращается вокруг колеса
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotationAngle)
    
    const pointerGradient = ctx.createLinearGradient(radius - 12, 0, radius + 12, 0)
    pointerGradient.addColorStop(0, '#FFAF4D')
    pointerGradient.addColorStop(0.5, '#FFF7A7')
    pointerGradient.addColorStop(1, '#FFAF4D')

    ctx.beginPath()
    ctx.fillStyle = pointerGradient
    ctx.shadowBlur = 12
    ctx.shadowColor = '#FFAF4D'
    ctx.moveTo(radius - 8, 0)
    ctx.lineTo(radius + 8, -6)
    ctx.lineTo(radius + 8, 6)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    
    // 6. Метка 100% сверху (боковые 50% вынесены в HTML)
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.shadowBlur = 8
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.fillText('100%', centerX, 12)
    ctx.restore()
  }, [chance])



  // Инициализация canvas
  useEffect(() => {
    drawWheel(Math.PI / 2)
  }, [drawWheel, chance])

  useEffect(() => {
    // при выборе нового предмета для ставки
    setTargetItem(null)
  }, [sourceItem])
  

  const handleSourceSelect = useCallback((gift) => {
    if (gameState !== 'idle') return
    setSourceItem(gift)
  }, [gameState])

  const handleTargetSelect = useCallback((gift) => {
    if (gameState !== 'idle') return
    setTargetItem(gift)
  }, [gameState])

  const handleUpgrade = useCallback(async () => {
    if (!sourceItem || !targetItem || gameState !== 'idle' || isSpinningRef.current) return
  
    isSpinningRef.current = true
    setGameState('spinning')
    setResultText(null)
  
    let response
    try {
      response = await upgradeItem({
        user_id: user.id,
        from_drop_id: sourceItem.id,
        to_drop_id: targetItem.id,
      })
    } catch (e) {
      console.error(e)
      isSpinningRef.current = false
      setGameState('idle')
      return
    }
    
  
    const isWin = response.result === 'win'
    lastIsWinRef.current = isWin
  
    const TWO_PI = Math.PI * 2
    const halfAngle = (chance / 100) * Math.PI
    const buffer = 0.08
  
    const normalize = (a) => {
      const m = a % TWO_PI
      return m < 0 ? m + TWO_PI : m
    }

    const normalizeAngle = (a) => {
      const TWO_PI = Math.PI * 2
      const m = a % TWO_PI
      return m < 0 ? m + TWO_PI : m
    }
    
    let targetAngle

    if (isWin) {
      // ✅ СТРОГО внутри win-зоны
      const safeHalf = Math.max(0, WIN_HALF_ANGLE - 0.15)
      targetAngle =
        WIN_CENTER + (Math.random() * 2 - 1) * safeHalf
    }  else {
      const gap = 0.25 // побольше зазор
      const leftFrom = WIN_CENTER + WIN_HALF_ANGLE + gap
      const leftTo = WIN_CENTER + Math.PI
    
      const rightFrom = WIN_CENTER - Math.PI
      const rightTo = WIN_CENTER - WIN_HALF_ANGLE - gap
    
      const zones = [
        [leftFrom, leftTo],
        [rightFrom, rightTo],
      ]
    
      const [from, to] = zones[Math.floor(Math.random() * zones.length)]
      targetAngle = normalizeAngle(from + Math.random() * (to - from))
    }
    
    
  
    const totalRotation = targetAngle + TWO_PI * 5
    let startAngle = normalize(currentAngleRef.current)
    let startTime = null
    const duration = 4000
  
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
  
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / duration
  
      if (progress < 1) {
        currentAngleRef.current =
          startAngle + (totalRotation - startAngle) * easeOutCubic(progress)
        drawWheel(currentAngleRef.current)
        animationRef.current = requestAnimationFrame(animate)
      }  else {
        currentAngleRef.current = targetAngle
        drawWheel(currentAngleRef.current)
        isSpinningRef.current = false
      
        if (isWin) {
          setGameState('win')
          setResultText(t('upgrade.success'))
          setWinItem(targetItem)
        } else {
          setGameState('lose')
          setResultText(t('upgrade.failed'))
        }
      

        setUser(prev => {
          if (!prev?.inventory) return prev
        
          const inventory = [...prev.inventory]
        
          // 🔻 списываем исходный предмет
          const fromIdx = inventory.findIndex(
            i => i.drop_id === sourceItem.id
          )
          if (fromIdx !== -1) {
            inventory[fromIdx] = {
              ...inventory[fromIdx],
              count: inventory[fromIdx].count - 1,
            }
            if (inventory[fromIdx].count <= 0) {
              inventory.splice(fromIdx, 1)
            }
          }
        
          // 🔺 если win — добавляем целевой предмет
          if (isWin) {
            const toIdx = inventory.findIndex(
              i => i.drop_id === targetItem.id
            )
            if (toIdx !== -1) {
              inventory[toIdx] = {
                ...inventory[toIdx],
                count: inventory[toIdx].count + 1,
              }
            } else {
              inventory.push({
                drop_id: targetItem.id,
                count: 1,
              })
            }
          }
        
          return {
            ...prev,
            inventory,
          }
        })
        
      
        // ✅ СБРАСЫВАЕМ ВЫБОР ПРЕДМЕТОВ
        setSourceItem(null)
        setTargetItem(null)
      }
      
    }
  
    animationRef.current = requestAnimationFrame(animate)
  }, [sourceItem, targetItem, chance, gameState, drawWheel, user, t])
  

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const closeResultModal = useCallback(() => {
    const isWin = !!lastIsWinRef.current
    setGameState('idle')
    setResultText(null)
    if (!isWin) {
      setSourceItem(null)
    } else {
      setSourceItem(null)
      setTargetItem(null)
    }
  }, [])

  const renderConfetti = () => (
    <div className="gg-confetti" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 37) % 100
        const hue = (i * 47) % 360
        const rot = (i * 61) % 360
        const d = (i * 13) % 30
        const delay = (i * 7) % 20

        return (
          <span
            key={i}
            className="gg-confetti-piece"
            style={{
              '--x': x,
              '--hue': hue,
              '--rot': rot,
              '--d': d,
              '--delay': delay,
            }}
          />
        )
      })}
    </div>
  )

  const currencyIcon = selectedCurrency?.icon || '/image/Coin-Icon.svg'

  return (
    <PageLayout activePage="upgrade" className="upgrade-page">
      <div className="upgrade-content">
        {/* Основная зона апгрейда */}
        <div className={`upgrade-game-area ${gameState}`}>
          <div className="game-cosmic-background" aria-hidden="true" />
          <div className="upgrade-game-area-fade" />
          
          <div className="upgrade-main-container">
            {/* Колесо шанса - сверху */}
            <div className="upgrade-wheel-container">
              <div className="upgrade-wheel">
                <canvas 
                  ref={canvasRef} 
                  width="210" 
                  height="210" 
                  className="upgrade-wheel-canvas"
                />
                
                {/* Центр с процентом */}
                <div className={`upgrade-wheel-center ${gameState}`}>
                  <span className={`upgrade-chance-value ${resultText ? (gameState === 'win' ? 'win' : 'lose') : ''}`}>
                    {resultText || `${chance.toFixed(2)}%`}
                  </span>
                  <span className="upgrade-chance-label">
                    {chance >= 75 ? t('upgrade.highChance') : chance >= 40 ? t('upgrade.mediumChance') : t('upgrade.lowChance')}
                  </span>
                </div>
              </div>
            </div>

            {/* Карточки под колесом */}
            <div className="upgrade-boxes-row">
              {/* Левая коробка - исходный предмет */}
              <div className={`upgrade-box upgrade-box-source ${sourceItem ? 'has-item' : ''} ${gameState === 'lose' ? 'losing' : ''}`}>
                {sourceItem ? (
                  <>
                    <img
                      src={sourceItem.icon || sourceItem.image}
                      alt={sourceItem.name}
                      className="upgrade-item-image"
                    />
                    <div className="upgrade-box-content">
                      <div className="upgrade-item-price">
                        <img src={currencyIcon} alt="currency" className="upgrade-currency-icon" />
                        <span>{formatAmount(sourceItem.price)}</span>
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="upgrade-box-empty">
                    <div className="upgrade-box-arrow">
                      <img src="/image/mdi_gift.svg" alt="gift" className="upgrade-box-gift-icon" />
                    </div>
                    <span>{t('upgrade.selectItem')}</span>
                  </div>
                )}
              </div>

              {/* Правая коробка - целевой предмет */}
              <div className={`upgrade-box upgrade-box-target ${targetItem ? 'has-item' : ''} ${gameState === 'win' ? 'winning' : ''}`}>
                {targetItem ? (
                  <>
<img
  src={targetItem.icon || targetItem.image}
  alt={targetItem.name}
  className="upgrade-item-image"
/>
                    <div className="upgrade-box-content">
                      <div className="upgrade-item-price">
                        <img src={currencyIcon} alt="currency" className="upgrade-currency-icon" />
                        <span>{formatAmount(targetItem.price)}</span>
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="upgrade-box-empty">
                    <div className="upgrade-box-arrow">
                      <img src="/image/mdi_gift.svg" alt="gift" className="upgrade-box-gift-icon" />
                    </div>
                    <span>{t('upgrade.selectTarget')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Кнопка апгрейда - на всю ширину */}
          <button 
            className={`bet-button gg-btn-glow upgrade-full-btn ${gameState !== 'idle' ? 'disabled' : ''} ${(!sourceItem || !targetItem) ? 'inactive' : ''}`}
            onClick={handleUpgrade}
            disabled={gameState !== 'idle' || !sourceItem || !targetItem}
          >
            {t('upgrade.upgrade')}
          </button>
          
          {(gameState === 'win' || gameState === 'lose') && (
            <div className={`wheel-result-overlay ${gameState === 'lose' ? 'wheel-result-overlay--lose' : ''}`} onClick={closeResultModal}>
              <div className={`wheel-result-modal ${gameState === 'lose' ? 'wheel-result-modal--lose' : ''}`} onClick={(e) => e.stopPropagation()}>
                {gameState === 'win' ? renderConfetti() : null}
                <div className="wheel-result-glow"></div>
                <h2 className="wheel-result-title">{gameState === 'win' ? t('upgrade.success') : t('upgrade.failed')}</h2>
                <div className="wheel-result-subtitle">
                  {gameState === 'win'
                    ? t('upgrade.congratulations')
                    : t('upgrade.tryAgain')}
                </div>
                {gameState === 'win' && (
                  <div className="wheel-result-prize">
                    <div className="wheel-result-card">
                      <span className="wheel-result-price">
                        <img src={currencyIcon} alt="currency" className="wheel-result-coin" />
                        {formatWinAmount(winItem?.price ?? 0)}
                        </span>
                      <div className="wheel-result-prize-content">
                      <img
  src={winItem?.icon || winItem?.image || '/image/case_card1.png'}
  alt="prize"
  className="wheel-result-image"
/>

                      </div>
                    </div>
                  </div>
                )}
                <button className="wheel-result-close gg-btn-glow" onClick={closeResultModal}>
                  {t('upgrade.ok')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <GameFaq game="upgrade" />

        {/* Выбор предметов - Ваши предметы */}
        <div className="upgrade-selection-section">
          <h3 className="upgrade-section-title">{t('upgrade.yourItems')}</h3>
          <div className="upgrade-gifts-grid">
{inventoryItems.length === 0 ? (
  <div className="upgrade-empty-inventory">
    {t('upgrade.noGifts')}
  </div>
) : (
  inventoryItems.map((gift) => (
    <div
      key={gift.id}
      className={`upgrade-gift-card ${sourceItem?.id === gift.id ? 'selected' : ''}`}
      onClick={() => handleSourceSelect(gift)}
    >
      <div className="upgrade-gift-price">
        <img src={currencyIcon} />
        <span>{formatAmount(gift.price)}</span>
        </div>

      <img
        src={gift.icon || gift.image}
        alt={gift.name}
        className="upgrade-gift-image"
      />

      {gift.count > 1 && (
        <div className="upgrade-gift-count">x{gift.count}</div>
      )}
    </div>
  ))
)}

          </div>
        </div>

        {/* Выбор целевых предметов */}
        <div className="upgrade-selection-section">
          <h3 className="upgrade-section-title">{t('upgrade.upgradeTargets')}</h3>
          <div className="upgrade-gifts-grid">
          {upgradeTargets.map((gift) => {
  const disabled = !canSelectTarget(gift)

  return (
    <div
      key={gift.id}
      className={`upgrade-gift-card target
        ${targetItem?.id === gift.id ? 'selected' : ''}
        ${disabled ? 'disabled' : ''}
      `}
      onClick={() => {
        if (!disabled) handleTargetSelect(gift)
      }}
    >
      <div className="upgrade-gift-price">
        <img src={currencyIcon} />
        <span>{formatAmount(gift.price)}</span>
        </div>

      <img
        src={gift.icon || gift.image}
        alt={gift.name}
        className="upgrade-gift-image"
      />
    </div>
  )
})}


          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default UpgradePage