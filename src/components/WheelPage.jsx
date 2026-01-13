import { useState, useEffect, useRef } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import './WheelPage.css'
import Header from './Header'
import Navigation from './Navigation'
import { Player } from '@lottiefiles/react-lottie-player'
import BetModal from './BetModal'
import { useLiveFeed } from '../context/LiveFeedContext'
import { getDropById, getAllDrops } from '../api/cases'
import { rouletteFreeSpin } from '../api/roulette'
import { getUserById } from '../api/users'
import { useUser } from '../context/UserContext'
import { vibrate, VIBRATION_PATTERNS } from '../utils/vibration'
import { useFreeSpin } from '../context/FreeSpinContext'

// Wheel prizes - 10 segments with case card images and one Lottie animation


const NUM_LIGHTS = 32 // Number of lights around the wheel

function WheelPage() {
  const { selectedCurrency, hasFreeSpins, formatAmount, formatWinAmount } = useCurrency()
  const { t } = useLanguage()
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [wonPrize, setWonPrize] = useState(null)
  const [lightPhase, setLightPhase] = useState(0)
  const [showCrashModal, setShowCrashModal] = useState(false)
  const [showPrizesModal, setShowPrizesModal] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null) // Для аккордеона
  const wheelRef = useRef(null)
  const [wheelPrizes, setWheelPrizes] = useState([])
  const [allDrops, setAllDrops] = useState([])
  const { user, setUser, settings } = useUser()
  const {
    canFreeSpin,
    status: freeSpinStatus,
    registerPlay,
    refreshFreeSpin,   
    loading: freeSpinLoading,
  } = useFreeSpin()
  const handleFreeSpin = async () => {
    if (isSpinning || !user?.id || !canFreeSpin) return
  
    try {
      setIsSpinning(true)
  
      // 1) делаем бесплатный спин
      const result = await rouletteFreeSpin({ userId: user.id })
  
      // 2) сразу обновляем статус бесплатного спина (кнопка сменится немедленно)
      await registerPlay(user.id)
      await refreshFreeSpin(user.id)
  
      // 3) крутим колесо и показываем выигрыш
      await handleBetResult(result)
  
      // 4) обновляем юзера
      const freshUser = await getUserById(user.id)
      setUser(freshUser)
    } catch (e) {
      console.error('Free spin failed', e)
    } finally {
      setIsSpinning(false)
    }
  }
  
  
  


  const spinToSegment = (prizes, targetSegment) => {
    if (!prizes.length) return
  
    setIsSpinning(true)
    setShowResult(false)
  
    const segmentAngle = 360 / prizes.length
    const fullRotations = 6 * 360
  
    const desiredFinalPosition =
      (360 - (targetSegment * segmentAngle + segmentAngle / 2)) % 360
  
    const currentPosition = ((rotation % 360) + 360) % 360
    let rotationNeeded = desiredFinalPosition - currentPosition
    rotationNeeded = ((rotationNeeded % 360) + 360) % 360
  
    const newRotation = rotation + fullRotations + rotationNeeded
  
    setRotation(newRotation)
    setWonPrize(prizes[targetSegment])
  
    // Продолжительная вибрация во время спина
    if (settings?.vibrationEnabled) {
      vibrate(VIBRATION_PATTERNS.wheelSpin)
    }

    setTimeout(() => {
      setIsSpinning(false)
      setShowResult(true)
      // Вибрация при выигрыше
      if (settings?.vibrationEnabled) {
        vibrate(VIBRATION_PATTERNS.win)
      }
    }, 6000)
  }
  
  const handleBetResult = async (result) => {
    if (!result?.drop_id) {
      console.error('No drop_id in result', result)
      return
    }
  
    try {
      const drop = await getDropById(result.drop_id)
  
      const winDrop = {
        id: drop.id,
        basePrice: drop.price, // ⬅️ ВАЖНО
        image: drop.icon,
        animation: drop.lottie_anim,
        contentType: drop.lottie_anim ? 'animation' : 'image',
        type: drop.rarity === 'epic' ? 'purple' : 'blue',
      }
      
  
      const prizes = buildWheelPrizes(winDrop)
      setWheelPrizes(prizes)
  
      const targetSegment = prizes.findIndex(p => p.id === winDrop.id)
  
      spinToSegment(prizes, targetSegment)
    } catch (e) {
      console.error('Failed to load drop', e)
    }
  }
  
  const buildInitialWheel = () => {
    const TOTAL = 10
    if (!allDrops.length) return []

    const prizes = []

    while (prizes.length < TOTAL) {
      const r = allDrops[Math.floor(Math.random() * allDrops.length)]

      prizes.push({
        id: Math.random(),
        basePrice: r.price, // ✅
        image: r.icon,
        animation: r.lottie_anim,
        contentType: r.lottie_anim ? 'animation' : 'image',
        type: r.rarity === 'epic' ? 'purple' : 'blue',
      })
      
      
    }

    return prizes
  }

  const handleRefresh = () => {
    if (isSpinning || !allDrops.length) return
    const newPrizes = buildInitialWheel()
    setWheelPrizes(newPrizes)
    setRotation(0) // Сбросить позицию колеса
  }

  useEffect(() => {
    if (!allDrops.length) return
  
    // если колесо ещё пустое — инициализируем
    if (!wheelPrizes.length) {
      const initialPrizes = buildInitialWheel()
      setWheelPrizes(initialPrizes)
    }
  }, [allDrops])
  
  
  const buildWheelPrizes = (winDrop) => {
    const TOTAL = 10
  
    if (!allDrops.length) return [winDrop]
  
    // убираем выигрыш из возможных филлеров
    const fillers = allDrops.filter(d => d.id !== winDrop.id)
  
    const prizes = []
  
    // 1️⃣ выигрыш
    prizes.push(winDrop)
  
    // 2️⃣ добиваем случайными дропами с бэка
    while (prizes.length < TOTAL) {
      const r = fillers[Math.floor(Math.random() * fillers.length)]
  
      prizes.push({
        id: Math.random(),
        basePrice: r.price, // ✅
        image: r.icon,
        animation: r.lottie_anim,
        contentType: r.lottie_anim ? 'animation' : 'image',
        type: r.rarity === 'epic' ? 'purple' : 'blue',
      })
      
    }
  
    // 3️⃣ перемешиваем
    return prizes.sort(() => Math.random() - 0.5)
  }
  
  
  
  // Для свайпа prizes modal
  const prizesModalRef = useRef(null)
  const prizesContentRef = useRef(null)
  const prizesDragStartY = useRef(0)
  const prizesCurrentTranslateY = useRef(0)
  const prizesIsDragging = useRef(false)

  const currencyIcon = selectedCurrency?.icon || '/image/Coin-Icon.svg'
  const { liveDrops } = useLiveFeed()
  useEffect(() => {
    let cancelled = false
  
    const loadDrops = async () => {
      try {
        const drops = await getAllDrops()
        if (!cancelled) {
          setAllDrops(drops)
        }
      } catch (e) {
        console.error('Failed to load drops', e)
      }
    }
  
    loadDrops()
  
    return () => {
      cancelled = true
    }
  }, [])
  
  // Animate lights
  useEffect(() => {
    const interval = setInterval(() => {
      setLightPhase(prev => (prev + 1) % 4)
    }, isSpinning ? 80 : 400)
    return () => clearInterval(interval)
  }, [isSpinning])

  const handleSpin = () => {
    if (isSpinning) return
    setIsSpinning(true)
    setShowResult(false)
    
    const segmentAngle = 360 / wheelPrizes.length // 36 degrees per segment
    const fullRotations = (5 + Math.floor(Math.random() * 3)) * 360 // 5-7 full rotations
    const targetSegment = Math.floor(Math.random() * wheelPrizes.length)
    
    console.log('🎯 Target Segment:', targetSegment, 'Prize:', wheelPrizes[targetSegment])
    
    // Pointer is at top (0 degrees position)
    // Segment content is positioned at: index * segmentAngle + (segmentAngle / 2)
    // For segment 0: 0 + 18 = 18 degrees
    // For segment 1: 36 + 18 = 54 degrees, etc.
    
    // Keep gift/card visual positions intact and adjust only the rotation formula.
    // Segment drawing starts at top due to -90deg offset used in generateSegmentPath().
    // We want the chosen segment center to end up under the top pointer.
    const desiredFinalPosition = (360 - (targetSegment * segmentAngle + segmentAngle / 2)) % 360
    
    // Current wheel position (normalize to 0-360)
    const currentPosition = ((rotation % 360) + 360) % 360
    
    // Calculate how much more we need to rotate
    let rotationNeeded = desiredFinalPosition - currentPosition
    rotationNeeded = ((rotationNeeded % 360) + 360) % 360
    
    const newRotation = rotation + fullRotations + rotationNeeded
    
    console.log('📊 Current:', currentPosition.toFixed(1), 'Desired Final:', desiredFinalPosition.toFixed(1), 'Rotation Needed:', rotationNeeded.toFixed(1), 'New Total:', newRotation.toFixed(1))
    
    setRotation(newRotation)
    setWonPrize(wheelPrizes[targetSegment])
    
    setTimeout(() => {
      setIsSpinning(false)
      setShowResult(true)
      const finalPos = newRotation % 360
      console.log('✅ Final rotation:', finalPos.toFixed(1), 'Should be:', desiredFinalPosition.toFixed(1), 'Match:', Math.abs(finalPos - desiredFinalPosition) < 1)
    }, 6000)
  }

  const closeResult = () => {
    setShowResult(false)
  }

  const handleOpenDeposit = () => {
    setShowCrashModal(true)
  }

  const closeDepositModal = () => {
    setShowCrashModal(false)
  }

  const handleOpenPrizes = () => {
    setShowPrizesModal(true)
  }

  const closePrizesModal = () => {
    setShowPrizesModal(false)
  }

  // Сброс позиции prizes modal при открытии
  useEffect(() => {
    if (showPrizesModal && prizesContentRef.current) {
      prizesContentRef.current.style.transform = 'translateY(0)'
      prizesCurrentTranslateY.current = 0
    }
  }, [showPrizesModal])

  // Обработчики для свайпа prizes modal
  const handlePrizesDragStart = (e) => {
    prizesIsDragging.current = true
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    prizesDragStartY.current = clientY
    
    if (prizesContentRef.current) {
      prizesContentRef.current.style.transition = 'none'
    }
  }

  const handlePrizesDragMove = (e) => {
    if (!prizesIsDragging.current) return
    
    e.preventDefault()
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    let newTranslateY = clientY - prizesDragStartY.current
    
    // Ограничиваем движение только вниз
    if (newTranslateY < 0) newTranslateY = 0
    
    prizesCurrentTranslateY.current = newTranslateY
    
    if (prizesContentRef.current) {
      prizesContentRef.current.style.transform = `translateY(${newTranslateY}px)`
    }
  }

  const handlePrizesDragEnd = () => {
    if (!prizesIsDragging.current) return
    prizesIsDragging.current = false
    
    if (prizesContentRef.current) {
      prizesContentRef.current.style.transition = 'transform 0.3s ease-out'
      
      // Если свайпнули больше чем на 100px - закрываем
      if (prizesCurrentTranslateY.current > 100) {
        prizesContentRef.current.style.transform = 'translateY(100%)'
        setTimeout(() => {
          closePrizesModal()
          prizesCurrentTranslateY.current = 0
        }, 300)
      } else {
        prizesContentRef.current.style.transform = 'translateY(0)'
        prizesCurrentTranslateY.current = 0
      }
    }
  }

  // Обработчики для mouse events на document для prizes modal
  useEffect(() => {
    const handleMouseMove = (e) => handlePrizesDragMove(e)
    const handleMouseUp = () => handlePrizesDragEnd()

    if (showPrizesModal) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [showPrizesModal])

  // Generate segment path for SVG
  const generateSegmentPath = (index, total, innerRadius, outerRadius) => {
    const angle = 360 / total
    const startAngle = (index * angle - 90) * (Math.PI / 180)
    const endAngle = ((index + 1) * angle - 90) * (Math.PI / 180)
    
    const x1 = 150 + outerRadius * Math.cos(startAngle)
    const y1 = 150 + outerRadius * Math.sin(startAngle)
    const x2 = 150 + outerRadius * Math.cos(endAngle)
    const y2 = 150 + outerRadius * Math.sin(endAngle)
    const x3 = 150 + innerRadius * Math.cos(endAngle)
    const y3 = 150 + innerRadius * Math.sin(endAngle)
    const x4 = 150 + innerRadius * Math.cos(startAngle)
    const y4 = 150 + innerRadius * Math.sin(startAngle)
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`
  }

  return (
    <div className="wheel-page">
      <Header />

      <main className="wheel-main">
        {/* Live feed bar - same as CasesPage */}
        <div className="live-feed-bar">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">{t('cases.live')}</span>
          </div>
          <div className="live-items-wrapper">
            <div className="live-items-track">
              {liveDrops.map((drop, idx) => (
                <div key={`${drop.id}-${idx}`} className="live-item">
                  {drop.type === 'animation' && drop.animation ? (
                    <Player
                      autoplay
                      loop
                      src={drop.animation}
                      className="live-item-animation"
                    />
                  ) : (
                    <img
                      src={drop.image || '/image/mdi_gift.svg'}
                      alt={drop.name}
                      className="live-item-image"
                      onError={(e) => { e.target.src = '/image/mdi_gift.svg' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fortune Wheel Section */}
        <div className="wheel-section">
          {/* Cosmic background */}
          <div className="game-cosmic-background" aria-hidden="true" />
          {/* Background glow effect */}
          <div className="wheel-bg-glow"></div>
          
          <div className="wheel-container">
            {/* Outer glow ring */}
            <div className="wheel-outer-glow"></div>
            
            {/* Lights ring */}
            <div className="wheel-lights-ring">
              {[...Array(NUM_LIGHTS)].map((_, i) => {
                const angle = (i * 360) / NUM_LIGHTS
                const isLit = (i + lightPhase) % 2 === 0
                return (
                  <div
                    key={i}
                    className={`wheel-light ${isLit ? 'wheel-light--lit' : ''}`}
                    style={{
                      '--light-angle': `${angle}deg`,
                    }}
                  />
                )
              })}
            </div>
            
            {/* Main wheel */}
            <div 
              className={`wheel-fortune ${isSpinning ? 'wheel-fortune--spinning' : ''}`}
              style={{ transform: `rotate(${rotation}deg) scale(var(--wheel-scale))` }}
              ref={wheelRef}
            >
              <svg viewBox="0 0 300 300" className="wheel-svg">
                <defs>
                  {/* Gradient for purple segments */}
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#6D28D9" />
                    <stop offset="100%" stopColor="#4C1D95" />
                  </linearGradient>
                  {/* Gradient for blue segments */}
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                  {/* Shadow filter */}
                  <filter id="segmentShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                  </filter>
                </defs>
                
                {/* Wheel segments */}
                {wheelPrizes.map((prize, index) => (
                  <path
                    key={prize.id}
                    d={generateSegmentPath(index, wheelPrizes.length, 30, 130)}
                    fill={`url(#${prize.type === 'purple' ? 'purpleGradient' : 'blueGradient'})`}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    filter="url(#segmentShadow)"
                  />
                ))}
                
                {/* Segment dividers */}
                {wheelPrizes.map((_, index) => {
                  const angle = (index * 360 / wheelPrizes.length - 90) * (Math.PI / 180)
                  const x1 = 150 + 30 * Math.cos(angle)
                  const y1 = 150 + 30 * Math.sin(angle)
                  const x2 = 150 + 130 * Math.cos(angle)
                  const y2 = 150 + 130 * Math.sin(angle)
                  return (
                    <line
                      key={`divider-${index}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
              
              {/* Prize images/animations on segments */}
              {wheelPrizes.map((prize, index) => {
                const angle = (index * 360 / wheelPrizes.length) + (180 / wheelPrizes.length)
                
                // Оптимизация: JSON анимация только для 3 верхних сегментов (под стрелкой)
                // Вычисляем позицию сегмента относительно верха колеса
                const segmentAngle = 360 / wheelPrizes.length
                const normalizedRotation = ((rotation % 360) + 360) % 360
                const segmentPosition = (index * segmentAngle + normalizedRotation) % 360
                // Сегмент "наверху" если его позиция близка к 0 или 360 (±1 сегмент)
                const isNearTop = segmentPosition < segmentAngle * 1.5 || segmentPosition > 360 - segmentAngle * 1.5
                const shouldAnimate = isNearTop && prize.contentType === 'animation'
                
                return (
                  <div
                    key={`content-${prize.id}`}
                    className="wheel-segment-content"
                    style={{ '--segment-angle': `${angle}deg` }}
                  >
                    <span className="wheel-segment-price">
                      <img src={currencyIcon} alt="currency" className="wheel-segment-coin" />
                      {formatAmount(prize.basePrice)}
                      </span>
                    {prize.contentType === 'animation' ? (
                      <Player
                        autoplay
                        loop
                        src={prize.animation}
                        className="wheel-segment-animation"
                      />
                    ) : (
                      <img src={prize.image} alt="prize" className="wheel-segment-image" />
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Center hub */}
            <div className="wheel-center-hub">
              <div className="wheel-center-inner">
                <div className="wheel-center-shine"></div>
              </div>
            </div>
            
            {/* Pointer/Arrow - Teardrop shape */}
            <div className="wheel-pointer-arrow">
              <svg viewBox="0 0 60 80" className="wheel-arrow-svg">
                <defs>
                  <radialGradient id="teardropGradient" cx="50%" cy="40%">
                    <stop offset="0%" stopColor="#FFE680" />
                    <stop offset="40%" stopColor="#FFD700" />
                    <stop offset="70%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </radialGradient>
                  <filter id="teardropGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Teardrop/droplet shape */}
                <path 
                  d="M30 10 C30 10, 10 30, 10 50 C10 65, 18 75, 30 75 C42 75, 50 65, 50 50 C50 30, 30 10, 30 10 Z" 
                  fill="url(#teardropGradient)"
                  filter="url(#teardropGlow)"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                {/* White highlight for 3D effect */}
                <ellipse 
                  cx="25" 
                  cy="35" 
                  rx="8" 
                  ry="12" 
                  fill="rgba(255, 255, 255, 0.4)"
                  filter="blur(2px)"
                />
              </svg>
            </div>
          </div>

          {/* Buttons */}
          <div className="wheel-buttons-container">
            <div className="wheel-bet-hint">{t('wheel.betHint')}</div>
            <button
  className={`wheel-spin-btn gg-btn-glow ${isSpinning ? 'wheel-spin-btn--disabled' : ''}`}
  disabled={isSpinning}
  onClick={
    freeSpinStatus?.can_free_spin
      ? handleFreeSpin
      : handleOpenDeposit
  }
>
  <span className="wheel-spin-btn-text">
    {freeSpinStatus?.can_free_spin
      ? t('wheel.spin')
      : t('wheel.makeBet')}
  </span>
</button>


            <button className="wheel-prizes-btn" onClick={handleOpenPrizes}>
              {t('wheel.prizesList')}
            </button>
            <button 
              className="wheel-refresh-btn" 
              onClick={handleRefresh}
              disabled={isSpinning}
            >
              {t('wheel.refresh')}
            </button>
          </div>
        </div>

        {/* Result Modal */}
        {showResult && wonPrize && (
          <div className="wheel-result-overlay" onClick={closeResult}>
            <div className="wheel-result-modal" onClick={e => e.stopPropagation()}>
              <div className="wheel-result-glow"></div>
              <div className="gg-confetti" aria-hidden="true">
                {Array.from({ length: 28 }).map((_, i) => {
                  const x = (i * 37) % 100
                  const hue = (i * 47) % 360
                  const delay = i % 12
                  const rot = (i * 29) % 360
                  const d = i % 8
                  return (
                    <span
                      key={i}
                      className="gg-confetti-piece"
                      style={{
                        '--x': x,
                        '--hue': hue,
                        '--delay': delay,
                        '--rot': rot,
                        '--d': d,
                      }}
                    />
                  )
                })}
              </div>
              <h2 className="wheel-result-title">{t('wheel.congratulations')}</h2>
              <div className="wheel-result-prize">
                <div className="wheel-result-card">
                  <div className="wheel-result-prize-content">
                    {wonPrize.contentType === 'animation' ? (
                      <Player
                        autoplay
                        loop
                        src={wonPrize.animation}
                        className="wheel-result-animation"
                      />
                    ) : (
                      <img src={wonPrize.image} alt="prize" className="wheel-result-image" />
                    )}
                  </div>
                </div>
                <span className="case-result-price-below">
                  <img src={currencyIcon} alt="currency" className="wheel-result-coin" />
                  {formatWinAmount(wonPrize.basePrice)}
                                  </span>
              </div>
              <button className="wheel-result-close gg-btn-glow" onClick={closeResult}>
                {t('wheel.claim')}
              </button>
            </div>
          </div>
        )}

        {/* Bet Modal */}
<BetModal
  isOpen={showCrashModal}
  onClose={closeDepositModal}
  game="roulette"
  onResult={handleBetResult}
/>

        {/* Prizes Modal */}
        {showPrizesModal && (
          <div className="prizes-modal-overlay" onClick={closePrizesModal}>
            <div 
              className="prizes-modal-content" 
              onClick={e => e.stopPropagation()}
              ref={prizesContentRef}
              onMouseDown={handlePrizesDragStart}
              onTouchStart={handlePrizesDragStart}
              onTouchMove={handlePrizesDragMove}
              onTouchEnd={handlePrizesDragEnd}
            >
              <div className="prizes-modal-header">
                <div className="prizes-modal-handle">
                  <div className="prizes-modal-handle-bar"></div>
                </div>
                <h2 className="prizes-modal-title">{t('wheel.prizesList')}</h2>
              </div>
              <div className="prizes-modal-body">
                {(() => {
                  // Категории подарков с ценовыми диапазонами (в TON)
                  // РЕДАКТИРОВАТЬ ЦЕНЫ ЗДЕСЬ:
                  const GIFT_CATEGORIES = [
                    { key: 'exclusive', minPrice: 3000, maxPrice: Infinity, color: '#FFD700' },
                    { key: 'artifact', minPrice: 1000, maxPrice: 3000, color: '#FF6B6B' },
                    { key: 'mythic', minPrice: 700, maxPrice: 1000, color: '#E040FB' },
                    { key: 'legendary', minPrice: 300, maxPrice: 700, color: '#FF9800' },
                    { key: 'epic', minPrice: 100, maxPrice: 300, color: '#9C27B0' },
                    { key: 'rare', minPrice: 40, maxPrice: 100, color: '#2196F3' },
                    { key: 'uncommon', minPrice: 20, maxPrice: 40, color: '#4CAF50' },
                    { key: 'common', minPrice: 0, maxPrice: 20, color: '#9E9E9E' },
                  ]

                  // Группируем все дропы по категориям
                  const categorizedDrops = GIFT_CATEGORIES.map(cat => {
                    const drops = allDrops.filter(drop => 
                      drop.price >= cat.minPrice && drop.price < cat.maxPrice
                    ).sort((a, b) => b.price - a.price)
                    return { ...cat, drops }
                  }).filter(cat => cat.drops.length > 0)

                  const toggleCategory = (key) => {
                    setExpandedCategory(expandedCategory === key ? null : key)
                  }

                  return (
                    <div className="prizes-accordion">
                      {categorizedDrops.map(category => (
                        <div key={category.key} className="prizes-accordion-item">
                          <button 
                            className={`prizes-accordion-header ${expandedCategory === category.key ? 'expanded' : ''}`}
                            onClick={() => toggleCategory(category.key)}
                            style={{ '--category-color': category.color }}
                          >
                            <div className="prizes-accordion-title">
                              <span className="prizes-category-dot" style={{ background: category.color }}></span>
                              <span className="prizes-category-name">{t(`wheel.${category.key}`)}</span>
                              <span className="prizes-category-count">({category.drops.length})</span>
                            </div>
                            <div className="prizes-accordion-info">
                              <span className="prizes-category-price">
                                <img src={currencyIcon} alt="currency" className="prizes-section-price-icon" />
                                {formatAmount(category.minPrice)}+
                              </span>
                              <span className={`prizes-accordion-arrow ${expandedCategory === category.key ? 'expanded' : ''}`}>
                                ▼
                              </span>
                            </div>
                          </button>
                          
                          {expandedCategory === category.key && (
                            <div className="prizes-accordion-content">
                              <p className="prizes-category-desc">{t(`wheel.${category.key}Desc`)}</p>
                              <div className="prizes-grid">
                                {category.drops.map(drop => (
                                  <div key={drop.id} className="prize-card">
                                    <div className="prize-image">
                                      {drop.lottie_anim ? (
                                        <Player
                                          autoplay
                                          loop
                                          src={drop.lottie_anim}
                                          className="prize-animation"
                                        />
                                      ) : (
                                        <img 
                                          src={drop.icon} 
                                          alt={drop.name} 
                                          className="prize-img"
                                          loading="lazy"
                                        />
                                      )}
                                    </div>
                                    <span className="prize-price-badge">
                                      <img src={currencyIcon} alt="currency" className="prize-price-coin" />
                                      {formatAmount(drop.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      <Navigation activePage="wheel" />
    </div>
  )
}

export default WheelPage
