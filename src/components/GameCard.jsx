import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import './GameCard.css'
import { useLanguage } from '../context/LanguageContext'

const caseItems = [
  { id: 1, image: '/image/Pumpkin.webp', name: 'Pumpkin' },
  { id: 2, image: '/image/Mask.webp', name: 'Mask' },
  { id: 3, image: '/image/La_Baboon.webp', name: 'La Baboon' },
  { id: 4, image: '/image/Huggy_Bear.webp', name: 'Huggy Bear' },
  { id: 5, image: '/image/Inferno.webp', name: 'Inferno' },
  { id: 6, image: '/image/Crypto_Boom.webp', name: 'Crypto Boom' },
  { id: 7, image: '/image/Cozy_Galaxy.webp', name: 'Cozy Galaxy' },
  { id: 8, image: '/image/Christmas.webp', name: 'Christmas' },
]

function GameCard({ title, online, type = 'default' }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [rouletteItems, setRouletteItems] = useState([])
  const [multiplierValue, setMultiplierValue] = useState('1.00')
  const [wheelAngle, setWheelAngle] = useState(0)
  const [isWheelSpinning, setIsWheelSpinning] = useState(false)
  const wheelAngleRef = useRef(0)
  const [upgradeWheelAngle, setUpgradeWheelAngle] = useState(0)
  const [isUpgradeSpinning, setIsUpgradeSpinning] = useState(false)
  const upgradeWheelAngleRef = useRef(0)
  
  useEffect(() => {
    if (title.toLowerCase() === 'кейсы' || title === t('home.roulette')) {
      const items = []
      for (let i = 0; i < 20; i++) {
        const randomItem = caseItems[Math.floor(Math.random() * caseItems.length)]
        items.push({ ...randomItem, uid: `${randomItem.id}-${i}-${Math.random().toString(36).slice(2)}` })
      }
      setRouletteItems(items)
    }
  }, [title, t])

  useEffect(() => {
    if (title === t('home.wheel')) {
      const spinWheel = () => {
        const current = wheelAngleRef.current
        const spins = 2 + Math.floor(Math.random() * 2)
        const extraAngle = Math.random() * 360
        const next = current + spins * 360 + extraAngle
        setIsWheelSpinning(true)
        setWheelAngle(next)
        window.setTimeout(() => {
          wheelAngleRef.current = next
          setIsWheelSpinning(false)
        }, 2000)
      }

      spinWheel()
      const interval = window.setInterval(spinWheel, 5000)
      return () => window.clearInterval(interval)
    }
  }, [title, t])

  useEffect(() => {
    if (title === t('home.upgrade')) {
      const spinUpgradeWheel = () => {
        const current = upgradeWheelAngleRef.current
        const spins = 2 + Math.floor(Math.random() * 2)
        const extraAngle = Math.random() * 360
        const next = current + spins * 360 + extraAngle
        setIsUpgradeSpinning(true)
        setUpgradeWheelAngle(next)
        window.setTimeout(() => {
          upgradeWheelAngleRef.current = next
          setIsUpgradeSpinning(false)
        }, 2000)
      }

      spinUpgradeWheel()
      const interval = window.setInterval(spinUpgradeWheel, 5000)
      return () => window.clearInterval(interval)
    }
  }, [title, t])

  useEffect(() => {
    if (title === t('home.crash')) {
      let startTime = Date.now()
      let crashPoint = 1.5 + Math.random() * 4

      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const multiplier = Math.pow(Math.E, 0.15 * elapsed)

        if (multiplier >= crashPoint) {
          setMultiplierValue(crashPoint.toFixed(2))
          setTimeout(() => {
            startTime = Date.now()
            crashPoint = 1.5 + Math.random() * 4
          }, 500)
        } else {
          setMultiplierValue(multiplier.toFixed(2))
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [title, t])

  const handleClick = () => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle === 'кейсы' || title === t('home.roulette')) {
      navigate('/cases')
    } else if (title === t('home.crash') || lowerTitle === 'crash' || lowerTitle === 'ракетка') {
      navigate('/crash')
    } else if (title === t('home.wheel') || lowerTitle === 'wheel') {
      navigate('/wheel')
    } else if (lowerTitle === 'pvp' || title === t('home.pvp')) {
      navigate('/pvp')
    } else if (lowerTitle === 'upgrade' || title === t('home.upgrade')) {
      navigate('/upgrade')
    }
  }

  const wheelItems = [
    { id: 1, image: '/image/Cozy_Galaxy.webp', name: 'Cozy Galaxy', type: 'purple' },
    { id: 2, image: '/image/Durovs_Figurine.webp', name: 'Durovs Figurine', type: 'blue' },
    { id: 3, image: '/image/Neon_Fuel.webp', name: 'Neon Fuel', type: 'purple' },
    { id: 4, image: '/image/Red_Menace.webp', name: 'Red Menace', type: 'blue' },
    { id: 5, image: '/image/Cozy_Galaxy.webp', name: 'Cozy Galaxy', type: 'purple' },
    { id: 6, image: '/image/Durovs_Figurine.webp', name: 'Durovs Figurine', type: 'blue' },
    { id: 7, image: '/image/Neon_Fuel.webp', name: 'Neon Fuel', type: 'purple' },
    { id: 8, image: '/image/Red_Menace.webp', name: 'Red Menace', type: 'blue' },
    { id: 9, image: '/image/Cozy_Galaxy.webp', name: 'Cozy Galaxy', type: 'purple' },
    { id: 10, image: '/image/Durovs_Figurine.webp', name: 'Durovs Figurine', type: 'blue' },
  ]

  const generateBannerSegmentPath = (index, total, innerRadius, outerRadius) => {
    const anglePerSegment = 360 / total
    const startAngle = (index * anglePerSegment - 90) * (Math.PI / 180)
    const endAngle = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180)
    const x1 = 100 + outerRadius * Math.cos(startAngle)
    const y1 = 100 + outerRadius * Math.sin(startAngle)
    const x2 = 100 + outerRadius * Math.cos(endAngle)
    const y2 = 100 + outerRadius * Math.sin(endAngle)
    const x3 = 100 + innerRadius * Math.cos(endAngle)
    const y3 = 100 + innerRadius * Math.sin(endAngle)
    const x4 = 100 + innerRadius * Math.cos(startAngle)
    const y4 = 100 + innerRadius * Math.sin(startAngle)
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`
  }

  const renderCasesContent = () => (
    <div className="game-card-cases-layout">
      {/* Маленькая рулетка слева */}
      <div className="game-card-mini-roulette">
        <div className="game-card-mini-roulette-track">
          {[...rouletteItems, ...rouletteItems].map((item, idx) => (
            <div key={`${item.uid}-${idx}`} className="game-card-mini-roulette-item">
              {item.animation ? (
                <Player
                  autoplay
                  loop
                  src={item.animation}
                  className="game-card-mini-roulette-animation"
                />
              ) : (
                <img src={item.image} alt={item.name} className="game-card-mini-roulette-image" />
              )}
            </div>
          ))}
        </div>
        <div className="game-card-mini-roulette-fade game-card-mini-roulette-fade--left" />
        <div className="game-card-mini-roulette-fade game-card-mini-roulette-fade--right" />
      </div>
      
      {/* Кот справа */}
      <div className="game-card-case-image">
        <img src="/image/Group 7188.png" alt="cat" />
      </div>
    </div>
  )

  const renderRouletteContent = () => (
    <div className="game-card-crash">
      {/* Луна слева сверху */}
      <img src="/image/Venus.png" alt="moon" className="game-card-moon" />
      
      {/* Плавно растущая кривая линия */}
      <svg className="game-card-wave-line" viewBox="0 0 200 100" preserveAspectRatio="none">
        <path 
          d="M0,95 C50,90 100,70 150,40 Q175,25 200,10" 
          className="game-card-wave-path"
        />
      </svg>
      
      {/* Летящий кот */}
      <Player
        autoplay
        loop
        src="/animation/cat fly___.json"
        className="game-card-flying-cat"
      />
      
      {/* Множитель */}
      <div className="game-card-crash-multiplier">
        <span className="crash-multiplier-x">x</span>
        <span className="crash-multiplier-value">{multiplierValue}</span>
      </div>
    </div>
  )

  const renderPvPContent = () => (
    <div className="game-card-pvp">
      <div className="pvp-cat pvp-cat--left">
        <img src="/image/cat1.svg" alt="cat1" />
      </div>
      <div className="game-card-vs">
        <span className="game-card-vs-v">V</span>
        <span className="game-card-vs-s">S</span>
      </div>
      <div className="pvp-cat pvp-cat--right">
        <img src="/image/cat2.svg" alt="cat2" />
      </div>
    </div>
  )

  const renderUpgradeContent = () => (
    <div className="game-card-upgrade">
      {/* Левая карточка - исходный предмет */}
      <div className="game-card-upgrade-gift">
        <img src="/image/Froggy.webp" alt="source" className="game-card-upgrade-item" />
      </div>

      {/* Левые стрелки - двойные стрелки вверх */}
      <div className="game-card-upgrade-arrows">
        <svg viewBox="0 0 20 24" className="upgrade-double-arrow">
          <defs>
            <linearGradient id="arrowGoldGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FFAF4D" />
              <stop offset="50%" stopColor="#FFF7A7" />
              <stop offset="100%" stopColor="#FFAF4D" />
            </linearGradient>
          </defs>
          {/* Верхняя стрелка - треугольник */}
          <path d="M10 0 L18 8 L2 8 Z" fill="url(#arrowGoldGradient)" />
          {/* Нижняя стрелка - треугольник */}
          <path d="M10 10 L18 18 L2 18 Z" fill="url(#arrowGoldGradient)" />
        </svg>
      </div>

      {/* Колесо шанса - статичное, стрелка крутится */}
      <div className="game-card-upgrade-wheel">
        <svg viewBox="0 0 100 100" className="game-card-upgrade-svg">
          {/* Фоновый круг */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#2c2c2e" strokeWidth="8" />
          {/* Зона шанса - статичная */}
          <circle 
            cx="50" cy="50" r="40" 
            fill="none" 
            stroke="url(#upgradeGradient)" 
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6 251.2"
          />
          <defs>
            <linearGradient id="upgradeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#BBFD44" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#BBFD44" />
            </linearGradient>
          </defs>
        </svg>
        {/* Стрелка-указатель крутится вокруг колеса */}
        <div 
          className={`game-card-upgrade-pointer${isUpgradeSpinning ? ' is-spinning' : ''}`}
          style={{ transform: `rotate(${upgradeWheelAngle}deg)` }}
        >
          <svg viewBox="0 0 12 20" className="upgrade-pointer-svg">
            <defs>
              <linearGradient id="pointerGoldGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFAF4D" />
                <stop offset="50%" stopColor="#FFF7A7" />
                <stop offset="100%" stopColor="#FFAF4D" />
              </linearGradient>
            </defs>
            <path d="M6 0 L12 16 L0 16 Z" fill="url(#pointerGoldGradient)" />
          </svg>
        </div>
        <div className="game-card-upgrade-center">
          <span className="game-card-upgrade-percent">50%</span>
        </div>
      </div>

      {/* Правые стрелки - двойные стрелки вверх */}
      <div className="game-card-upgrade-arrows">
        <svg viewBox="0 0 20 24" className="upgrade-double-arrow">
          {/* Верхняя стрелка - треугольник */}
          <path d="M10 0 L18 8 L2 8 Z" fill="url(#arrowGoldGradient)" />
          {/* Нижняя стрелка - треугольник */}
          <path d="M10 10 L18 18 L2 18 Z" fill="url(#arrowGoldGradient)" />
        </svg>
      </div>

      {/* Правая карточка - целевой предмет */}
      <div className="game-card-upgrade-gift game-card-upgrade-gift--target">
        <img src="/image/Midas_Pepe.webp" alt="target" className="game-card-upgrade-item" />
      </div>
    </div>
  )

  const renderWheelContent = () => (
    <div className="game-card-wheel">
      <div className="game-card-wheel-glow"></div>
      <div className="game-card-wheel-container">
        <div
          className={`game-card-wheel-fortune${isWheelSpinning ? ' is-spinning' : ''}`}
          style={{ transform: `rotate(${wheelAngle}deg)` }}
        >
          <svg viewBox="0 0 200 200" className="game-card-wheel-svg">
            <defs>
              <linearGradient id="bannerPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#6D28D9" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
              <linearGradient id="bannerBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
            </defs>
            {wheelItems.map((item, index) => (
              <path
                key={item.id}
                d={generateBannerSegmentPath(index, wheelItems.length, 20, 85)}
                fill={`url(#banner${item.type === 'purple' ? 'Purple' : 'Blue'}Gradient)`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            ))}
          </svg>
          {wheelItems.map((item, index) => {
            const angle = (index * 36) + 18
            return (
              <div
                key={`content-${item.id}`}
                className="game-card-wheel-segment-content"
                style={{ '--segment-angle': `${angle}deg` }}
              >
                <img src={item.image} alt={item.name} />
              </div>
            )
          })}
        </div>
        <div className="game-card-wheel-hub">
          <div className="game-card-wheel-hub-inner"></div>
        </div>
        <div className="game-card-wheel-pointer">
          <svg viewBox="0 0 60 80" className="game-card-wheel-arrow-svg">
            <defs>
              <radialGradient id="bannerTeardropGradient" cx="50%" cy="60%">
                <stop offset="0%" stopColor="#FFE680" />
                <stop offset="40%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FF8C00" />
              </radialGradient>
              <filter id="bannerTeardropGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M30 70 C30 70, 10 50, 10 30 C10 15, 18 5, 30 5 C42 5, 50 15, 50 30 C50 50, 30 70, 30 70 Z"
              fill="url(#bannerTeardropGradient)"
              filter="url(#bannerTeardropGlow)"
              stroke="#FFD700"
              strokeWidth="2"
            />
            <ellipse
              cx="25"
              cy="25"
              rx="8"
              ry="12"
              fill="rgba(255, 255, 255, 0.4)"
              filter="blur(2px)"
            />
          </svg>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle === 'кейсы' || title === t('home.roulette')) {
      return renderCasesContent()
    } else if (title === t('home.crash') || lowerTitle === 'crash' || lowerTitle === 'ракетка') {
      return renderRouletteContent()
    } else if (title === t('home.wheel') || lowerTitle === 'wheel') {
      return renderWheelContent()
    } else if (lowerTitle === 'pvp' || title === t('home.pvp')) {
      return renderPvPContent()
    } else if (lowerTitle === 'upgrade' || title === t('home.upgrade')) {
      return renderUpgradeContent()
    }
    return null
  }

  const getCardClass = () => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle === 'кейсы' || title === t('home.roulette')) {
      return 'game-card--cases'
    } else if (title === t('home.crash') || lowerTitle === 'crash' || lowerTitle === 'ракетка') {
      return 'game-card--roulette'
    } else if (title === t('home.wheel') || lowerTitle === 'wheel') {
      return 'game-card--wheel'
    } else if (lowerTitle === 'pvp' || title === t('home.pvp')) {
      return 'game-card--pvp'
    } else if (lowerTitle === 'upgrade' || title === t('home.upgrade')) {
      return 'game-card--upgrade'
    }
    return ''
  }

  return (
    <div className={`game-card ${getCardClass()}`} onClick={handleClick}>
      <div className="game-header">
        <span className="online-dot"></span>
        <span className="online-count">{online} {t('home.online')}</span>
      </div>
      
      <div className="game-card-visual">
        {renderContent()}
      </div>
      
      <div className="game-content">
        <h3 className="game-title">{title}</h3>
      </div>
    </div>
  )
}

export default GameCard
