import { useState, useEffect, useCallback, memo } from 'react'
import './PvPPage.css'
import './WheelPage.css'
import Header from './Header'
import Navigation from './Navigation'
import BetModal from './BetModal'
import { useUser } from '../context/UserContext'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { usePvpSocket } from "../hooks/usePvpSocket"
import { getUserById } from '../api/users'
const MemoHeader = memo(Header)
const MemoNavigation = memo(Navigation)
const MemoBetModal = memo(BetModal)
import { getDropById } from '../api/cases'


const getBodyParts = (t) => [
  { id: 'head', label: t('pvp.head'), icon: '🎯' },
  { id: 'body', label: t('pvp.body'), icon: '🛡️' },
  { id: 'legs', label: t('pvp.legs'), icon: '🦵' },
]

function PvPPage() {
  const { user, settings, setUser } = useUser()
  const { selectedCurrency, formatAmount } = useCurrency()
  const { t } = useLanguage()
  
  const bodyParts = getBodyParts(t)

  const [gameState, setGameState] = useState('waiting') // 'waiting' | 'countdown' | 'fighting' | 'result'
  const [isBetModalOpen, setIsBetModalOpen] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false)
  const [myBet, setMyBet] = useState(null)


  const normalizeBotStatus = (status) => {
    switch (status) {
      case "in_battle":
        return "fighting"
      case "waiting":
        return "waiting"
      case "win":
        return "win"
      case "lose":
        return "lose"
      case "draw":
        return "draw"
      default:
        return "waiting"
    }
  }
  const BOT_STATUS_UI = {
    waiting: {
      label: 'pvp.waiting',
      className: 'status-waiting',
      color: '#9CA3AF',
    },
    fighting: {
      label: 'pvp.statusFight',
      className: 'status-fighting',
      color: '#F59E0B',
    },
    win: {
      label: 'pvp.statusWin',
      className: 'status-win',
      color: '#22C55E',
    },
    lose: {
      label: 'pvp.statusLose',
      className: 'status-lose',
      color: '#EF4444',
    },
    draw: {
      label: 'pvp.statusDraw',
      className: 'status-draw',
      color: '#6366F1',
    },
  }
  
  
  const [pendingResult, setPendingResult] = useState(null)

  const [bots, setBots] = useState([])
  const [pvpResult, setPvpResult] = useState(null)
  
  const { connected, sendBet } = usePvpSocket({
    onBots: (rawBots) => {
      setBots(
        rawBots.map(b => ({
          ...b,
          status: normalizeBotStatus(b.status),
        }))
      )
    },
    onResult: async (data) => {
      setGameState("fighting")
      setBattleResult(null)
    
      // 👇 бот
      setOpponentBot({
        id: data.bot.id,
        nickname: data.bot.nickname,
        avatar_url: data.bot.avatar_url,
        type: data.bot.type,
        bet: data.bot.type === "coins" ? data.bot.amount : null,
        gift: data.bot.type === "gift" ? data.bot.gift : null,
        status:
          data.result === "win"
            ? "lose"
            : data.result === "lose"
            ? "win"
            : "draw",
      })
    
      // 👇 ставка игрока - сохраняем подарок если был подарок
      setMyBet(prev => {
        if (prev?.type === "gift") {
          return prev
        }
        return {
          type: "coins",
          amount: data.user_bet,
          currencyIcon: selectedCurrency?.icon,
        }
      })
    
      setTimeout(async () => {
        setBattleResult(data.result)
        setGameState("result")
    
        try {
          const freshUser = await getUserById(user.id)
          setUser(freshUser)
        } catch (e) {
          console.error("Failed to refresh user after pvp", e)
        }
      }, 5000)
    }
    
    
    
  })
  
  
  const players = bots.map(b => {
    const ui = BOT_STATUS_UI[b.status || "waiting"]
  
    return {
      id: b.id,
      name: b.nickname,
      src: b.avatar_url,
      bet: b.bet,
      status: b.status,
      ui,
    }
  })
  
  
  const [opponentBot, setOpponentBot] = useState(null)

  // Выбор атаки и защиты
  const [attackPart, setAttackPart] = useState(null)
  const [defendPart, setDefendPart] = useState(null)
  
  // Результат боя
  const [battleResult, setBattleResult] = useState(null) // 'win' | 'lose' | 'draw'
  
  // Точки ожидания
  const [waitingDots, setWaitingDots] = useState('')
  
  // Автовыбор через 5 секунд
  const [autoPickCountdown, setAutoPickCountdown] = useState(null)


  // Анимация точек ожидания
  useEffect(() => {
    if (!isWaitingForOpponent) return
    
    const interval = setInterval(() => {
      setWaitingDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)
    
    return () => clearInterval(interval)
  }, [isWaitingForOpponent])

  // Обратный отсчёт

  const handleStartGame = useCallback(() => {
    if (!attackPart || !defendPart || !myBet) return
    if (!connected) {
      console.warn("PvP WS not connected")
      return
    }

    // Отправляем ставку в WebSocket только когда выбор сделан
    if (myBet.type === "coins") {
      sendBet({
        user_id: user.id,
        amount: myBet.amount,
        gift: false,
      })
    } else if (myBet.type === "gift") {
      sendBet({
        user_id: user.id,
        amount: 0,
        gift: true,
        gift_id: myBet.gift_id || myBet.gift?.id,
      })
    }

    setIsWaitingForOpponent(true)
  }, [attackPart, defendPart, myBet, connected, sendBet, user?.id])

  const canStartGame = Boolean(attackPart && defendPart && myBet && gameState === 'waiting' && !isWaitingForOpponent)
  const showMatchPanel = Boolean(myBet || isWaitingForOpponent || gameState !== 'waiting')
  const displayUsername = user?.username ? `@${user.username}` : user?.firstname ? `@${user.firstname}` : '@Username'
  const displayAvatar = user?.url_image || user?.photo_url || '/image/ava1.png'
  const currencyIcon = selectedCurrency?.icon || '/image/Coin-Icon.svg'

  const isGameInProgress = Boolean(isWaitingForOpponent || gameState === 'countdown' || gameState === 'fighting')
  const isBetButtonDisabled = isGameInProgress || Boolean(myBet)
  
  // Автовыбор атаки/защиты через 5 секунд если есть ставка но нет выбора
  useEffect(() => {
    // Если нет ставки или уже выбраны оба - сбрасываем
    if (!myBet || (attackPart && defendPart)) {
      setAutoPickCountdown(null)
      return
    }
    
    // Запускаем таймер на 5 секунд
    setAutoPickCountdown(5)
    
    const interval = setInterval(() => {
      setAutoPickCountdown(prev => {
        if (prev === null || prev <= 1) {
          // Автовыбор случайных частей тела
          const randomParts = ['head', 'body', 'legs']
          
          if (!attackPart) {
            const randomAttack = randomParts[Math.floor(Math.random() * randomParts.length)]
            setAttackPart(randomAttack)
          }
          if (!defendPart) {
            const randomDefend = randomParts[Math.floor(Math.random() * randomParts.length)]
            setDefendPart(randomDefend)
          }
          
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [myBet, attackPart, defendPart])
  
  // Автоматический запуск игры когда выбор сделан (вручную или автоматически)
  useEffect(() => {
    if (!canStartGame) return
    handleStartGame()
  }, [canStartGame, handleStartGame])

  useEffect(() => {
    if (gameState !== 'result') return
    if (!battleResult) return
  
    setIsResultModalOpen(true)
  }, [gameState, battleResult])

  const restartGame = useCallback(() => {
    setGameState('waiting')
    setAttackPart(null)
    setDefendPart(null)
    setBattleResult(null)
    setIsResultModalOpen(false)
    setIsWaitingForOpponent(false)
    setMyBet(null)
    setOpponentBot(null) // ВОТ ТУТ
  }, [])
  

  const closeResultModal = useCallback(() => {
    restartGame()
  }, [restartGame])

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

  const handleBetSubmit = useCallback((payload) => {
    if (!payload) return
    if (payload.type === 'coins') {
      const numeric = Number(String(payload.amount ?? '').replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(numeric) || numeric <= 0) return
      const nextBet = {
        type: 'coins',
        amount: numeric,
        currencyIcon: payload.currency?.icon || selectedCurrency?.icon || '/image/Coin-Icon.svg',
      }
      setMyBet(nextBet)
      return
    }

    if (payload.type === 'gift') {
      const nextBet = {
        type: 'gift',
        gift: payload.gift || null,
        currencyIcon: payload.currency?.icon || selectedCurrency?.icon || '/image/Coin-Icon.svg',
      }
      setMyBet(nextBet)
    }
  }, [selectedCurrency?.icon])





  const handleBetClick = () => {
    if (isBetButtonDisabled) return
    setIsBetModalOpen(true)
  }
  

  return (
    <div className="app pvp-page">
      <MemoHeader />
      
      <main className="main-content pvp-content">
        {/* Зона игры */}
        <div className={`pvp-game-area ${gameState === 'countdown' ? 'pvp-countdown' : ''} ${gameState === 'result' ? 'pvp-result' : ''}`}>
          <div className="game-cosmic-background" aria-hidden="true" />
          <div className="pvp-game-area-fade" />
          
          {/* Анимация боя */}
          <div className="pvp-battle-container">
            {/* Левый кот */}
            <div className={`pvp-cat pvp-cat-left ${gameState === 'fighting' ? 'fighting' : ''} ${battleResult === 'win' ? 'winner' : ''} ${battleResult === 'lose' ? 'loser' : ''}`}>
              <img src="/image/cat1.svg" alt="Cat 1" className="pvp-cat-image" />
              {attackPart && gameState === 'waiting' && (
                <div className="pvp-cat-action attack">
                  <span className="action-icon">⚔️</span>
                  <span className="action-label">{bodyParts.find(p => p.id === attackPart)?.label}</span>
                </div>
              )}
            </div>

            {/* Центральная область */}
            <div className="pvp-center">
              {gameState === 'waiting' && !isWaitingForOpponent && (
                <div className="pvp-vs">{t('pvp.vs')}</div>
              )}

              {gameState === 'countdown' && (
                <div className="pvp-countdown-display">
                  <span className="countdown-number">{autoPickCountdown}</span>
                </div>
              )}
              
              {gameState === 'fighting' && (
                <div className="pvp-fighting-display">
                  <img src="/image/material-symbols_swords-rounded-active.svg" alt="Fight" className="fighting-icon" />
                </div>
              )}
              
              {gameState === 'result' && (
                <div className={`pvp-result-display ${battleResult}`}>
                  <span className="result-text">
                    {battleResult === 'win' && t('pvp.victory')}
                    {battleResult === 'lose' && t('pvp.defeat')}
                    {battleResult === 'draw' && t('pvp.draw')}
                  </span>
                </div>
              )}
            </div>

            {/* Правый кот */}
            <div className={`pvp-cat pvp-cat-right ${gameState === 'fighting' ? 'fighting' : ''} ${battleResult === 'lose' ? 'winner' : ''} ${battleResult === 'win' ? 'loser' : ''}`}>
              <img src="/image/cat2.svg" alt="Cat 2" className="pvp-cat-image" />
              {defendPart && gameState === 'waiting' && (
                <div className="pvp-cat-action defend">
                  <span className="action-icon">🛡️</span>
                  <span className="action-label">{bodyParts.find(p => p.id === defendPart)?.label}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {showMatchPanel && (
          <div className="pvp-match-panel">
            <div className="pvp-match-top">
            <div className="pvp-player-chip">
  <img
    className="pvp-player-avatar"
    src={displayAvatar}
    alt="You"
  />
  <span className="pvp-player-name">
    {displayUsername}
  </span>
</div>

              <div className="pvp-player-chip pvp-player-chip--right">
              <img
  className="pvp-player-avatar"
  src={opponentBot?.avatar_url || '/image/ava2.png'}
  alt="Opponent"
/>
<span className="pvp-player-name">
  {"@" + opponentBot?.nickname || t('pvp.waiting')}
</span>

              </div>
            </div>

            <div className="pvp-bets-row">

            <div className="pvp-bet-card">
                <div className="pvp-bet-title">{t('pvp.yourBet')}</div>
                {myBet?.type === 'gift' ? (
                  <div className="pvp-gift-bet">
                    <div className="pvp-gift-bet-price">
                      <img
                        src={myBet?.currencyIcon || selectedCurrency?.icon || '/image/Coin-Icon.svg'}
                        alt="currency"
                        className="pvp-gift-bet-currency-icon"
                      />
<span className="pvp-gift-bet-price-value">
  {formatAmount(myBet?.gift?.price ?? 0)}
</span>
                    </div>
                    <img
  className="pvp-gift-bet-image"
  src={myBet?.gift?.icon || '/image/case_card1.png'}
  alt={myBet?.gift?.name || 'gift'}
/>

                  </div>
                ) : (
<div className="pvp-bet-value">
<span>{formatAmount(myBet?.amount ?? 0)}</span>
  <img
    src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
    alt="currency"
    className="pvp-bet-currency-icon"
  />
</div>

                )}
              </div>

              <div className="pvp-bet-card">
              <div className="pvp-bet-title">{t('pvp.opponentBet')}</div>
              {opponentBot?.type === 'gift' ? (
  <div className="pvp-gift-bet">
    <div className="pvp-gift-bet-price">
      <img
        src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
        className="pvp-gift-bet-currency-icon"
      />
<span>{formatAmount(opponentBot.gift.price)}</span>
</div>
    <img
  className="pvp-gift-bet-image"
  src={opponentBot.gift.icon}
  alt={opponentBot.gift.name}
/>

  </div>
) : (
  <div className="pvp-bet-value">
<span>{formatAmount(opponentBot?.bet ?? 0)}</span>
<img
  src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
  alt="currency"
  className="pvp-bet-currency-icon"
/>

  </div>
)}

              </div>


            </div>
          </div>
        )}

        {/* Кнопка ставки */}
        <button
  className={`bet-button gg-btn-glow
    ${isBetButtonDisabled ? 'disabled' : ''}
    ${isWaitingForOpponent ? 'waiting' : ''}`}
  onClick={handleBetClick}
  disabled={isBetButtonDisabled}
>


          {isGameInProgress ? (
            <span className="waiting-text">
              <span className="pvp-waiting-spinner" aria-hidden="true" />
              {t('pvp.waiting')}{waitingDots}
            </span>
          ) : (
            t('pvp.placeBet')
          )}
        </button>
        {/* Текст автовыбора */}
        {autoPickCountdown !== null && (
          <div className="pvp-auto-pick-text">
            {t('pvp.autoPickIn')} {autoPickCountdown} {t('pvp.sec')}
          </div>
        )}

        {/* Модальное окно ставки */}
        <MemoBetModal
  game="pvp"
  isOpen={isBetModalOpen}
  onClose={() => setIsBetModalOpen(false)}
  onResult={async (result) => {
    // Только сохраняем ставку локально, НЕ отправляем в WebSocket
    // Отправка произойдёт когда выбор атаки/защиты будет сделан
    if (result.type === "coins") {
      setMyBet({
        type: "coins",
        amount: result.amount,
      })
    }

    if (result.type === "gift") {
      const drop = await getDropById(result.gift_id)
      setMyBet({
        type: "gift",
        gift: drop,
        gift_id: result.gift_id,
      })
    }
  }}
/>

        {/* Выбор атаки и защиты */}
        {gameState === 'waiting' && !isWaitingForOpponent && (
          <div className="pvp-selection-area">
            <div className="pvp-selection-block">
              <h3 className="selection-title">
                <span className="selection-icon">⚔️</span>
                {t('pvp.attack')}
              </h3>
              <div className="selection-options">
                {bodyParts.map(part => (
                  <button
                    key={`attack-${part.id}`}
                    className={`selection-button ${attackPart === part.id ? 'selected attack-selected' : ''}`}
                    onClick={() => setAttackPart(part.id)}
                  >
                    <span className="part-icon">{part.icon}</span>
                    <span className="part-label">{part.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pvp-selection-block">
              <h3 className="selection-title">
                <span className="selection-icon">🛡️</span>
                {t('pvp.defend')}
              </h3>
              <div className="selection-options">
                {bodyParts.map(part => (
                  <button
                    key={`defend-${part.id}`}
                    className={`selection-button ${defendPart === part.id ? 'selected defend-selected' : ''}`}
                    onClick={() => setDefendPart(part.id)}
                  >
                    <span className="part-icon">{part.icon}</span>
                    <span className="part-label">{part.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}



{isResultModalOpen && battleResult && (
            <div className="wheel-result-overlay" onClick={closeResultModal}>
            <div className={`wheel-result-modal ${battleResult === 'lose' ? 'wheel-result-modal--lose' : ''}`} onClick={(e) => e.stopPropagation()}>
              {battleResult === 'win' ? renderConfetti() : null}
              <div className="wheel-result-glow"></div>
              <h2 className="wheel-result-title">
  {battleResult === 'win' && t('pvp.victory')}
  {battleResult === 'lose' && t('pvp.defeat')}
  {battleResult === 'draw' && t('pvp.draw')}
</h2>

<div className="wheel-result-subtitle">
  {battleResult === 'win' && t('pvp.congratulations')}
  {battleResult === 'lose' && t('pvp.tryAgain')}
  {battleResult === 'draw' && t('pvp.draw')}
</div>


              {battleResult === 'win' && opponentBot?.type === 'gift' && opponentBot?.gift && (
  <div className="wheel-result-prize pvp-result-prize">
    <div className="wheel-result-card">
      <img
        src={opponentBot.gift.icon}
        alt={opponentBot.gift.name}
        className="wheel-result-gift-image"
      />
    </div>
    <div className="pvp-result-gift-name">
      {opponentBot.gift.name}
    </div>
    <div className="pvp-result-gift-price">
      <img
        src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
        alt="currency"
        className="pvp-result-gift-price-icon"
      />
      <span>{formatAmount(opponentBot.gift.price)}</span>
    </div>
  </div>
)}




              <button className="wheel-result-close gg-btn-glow" onClick={closeResultModal}>
                {t('pvp.ok')}
              </button>
            </div>
          </div>
        )}

        {/* Список игроков */}
        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className="player-row">
              <div className="player-info">
                <div className="player-avatar">
                  {player.src ? (
                    <img src={player.src} alt={player.name} />
                  ) : (
                    player.avatar
                  )}
                </div>
                <div className="player-details">
                  <span className="player-name">{player.name}</span>
                  <div className="player-stats-row">
                  <img
  src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
  alt="currency"
  className="coin-icon-small"
/>
                    <span className="stat-bet">
  {formatAmount(player.bet)}
</span>
                  </div>
                </div>
              </div>
              {player.bet && (
                <div className="player-reward">
                  <div className="reward-amount-container">
                  <img
  src={selectedCurrency?.icon || '/image/Coin-Icon.svg'}
  alt="currency"
  className="coin-icon-large"
/>                    <span className={`reward-amount ${player.gift ? 'text-green' : ''}`}>
  {formatAmount(player.bet)}
</span>

                  </div>
                  <div className="pvp-status">
                  <div className="pvp-status">
                  <span
  className={`status-badge ${player.ui.className}`}
  style={{ backgroundColor: player.ui.color }}
>
  {t(player.ui.label)}
</span>

</div>

                    
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      
      <MemoNavigation activePage="pvp" />
    </div>
  )
}

export default PvPPage