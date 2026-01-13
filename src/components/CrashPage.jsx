import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import './CrashPage.css'
import PageLayout from './PageLayout'
import Header from './Header'
import Navigation from './Navigation'
import BetModal from './BetModal'
import { useLanguage } from '../context/LanguageContext'
import { useCrashContext } from '../context/CrashContext'
import { getCrashBetsByRound, getCrashBotById } from '../api/crash'
import { getUserById } from '../api/users'
import { getDropById } from '../api/cases'
import { useUser } from '../context/UserContext'
import { maskUsername } from '../utils/maskUsername'
import { vibrate, VIBRATION_PATTERNS } from '../utils/vibration'
import { useCurrency } from '../context/CurrencyContext'


const MemoHeader = memo(Header)
const MemoNavigation = memo(Navigation)
const MemoBetModal = memo(BetModal)




// Компонент линии — волнистая, левая часть внизу, правая поднимается
const CrashLine = memo(function CrashLine({ multiplier, maxMultiplier }) {
  const progress = (multiplier - 1) / (maxMultiplier - 1)
  
  // Случайные смещения для волн (генерируются один раз)
  const waveOffsets = useRef(
    Array.from({ length: 6 }, () => (Math.random() - 0.5) * 2)
  ).current

  const wavePhase = useRef(Math.random() * Math.PI * 2).current
  
  // Генерируем путь линии
  const pathData = useMemo(() => {
    const width = 320
    const height = 280
    const startY = height - 10
    const endY = Math.max(5, startY - progress * (height - 15))

    const pointsCount = 24
    const waveCount = 3
    const amplitude = 4.5
    const points = Array.from({ length: pointsCount }, (_, idx) => {
      const t = idx / (pointsCount - 1)
      const x = t * width
      const controlY = startY - 5
      const baseY =
        (1 - t) * (1 - t) * startY +
        2 * (1 - t) * t * controlY +
        t * t * endY

      const offsetBucket = waveOffsets[Math.min(waveOffsets.length - 1, Math.floor(t * waveOffsets.length))]
      const envelope = Math.sin(Math.PI * t)
      const irregular = offsetBucket * 0.9 * envelope
      const wave = Math.sin(t * waveCount * Math.PI * 2 + wavePhase) * amplitude * envelope

      return { x, y: baseY + wave + irregular }
    })

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length - 2; i += 1) {
      const midX = (points[i].x + points[i + 1].x) / 2
      const midY = (points[i].y + points[i + 1].y) / 2
      d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`
    }
    d += ` Q ${points[points.length - 2].x} ${points[points.length - 2].y} ${points[points.length - 1].x} ${points[points.length - 1].y}`

    return d
  }, [progress, waveOffsets, wavePhase])

  return (
    <svg
      className="coeff-path"
      viewBox="0 0 320 280"
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        className="coeff-path-line-dynamic"
      />
    </svg>
  )
})

function CrashPage() {
  const { t } = useLanguage()
  const {
    gameState,
    setGameState,
    countdown,
    setCountdown,
    multiplier,
    setMultiplier,
    coefficientHistory,
    roundId: contextRoundId,
    setRoundId: setContextRoundId,
    send,
    connected,
    subscribe,
  } = useCrashContext()
  
  const coeffHistoryRef = useRef(null)
  const multiplierRafIdRef = useRef(null)
  const lastMultiplierUiUpdateRef = useRef(0)
  const [isBetModalOpen, setIsBetModalOpen] = useState(false)
  const catLottieRef = useRef(null)
  const [giftIconIndex, setGiftIconIndex] = useState(0)
  const [winModalOpen, setWinModalOpen] = useState(false)
  const [winData, setWinData] = useState(null) // { giftIcon, wonAmount, multiplier }
  const [explosionPlayed, setExplosionPlayed] = useState(false)
  const [bets, setBets] = useState({});
  const { user, setUser, settings } = useUser();
    const roundIdRef = useRef(null);
    const { selectedCurrency, formatAmount, formatWinAmount } = useCurrency()

  

  const [players, setPlayers] = useState([])
  const [hasBetThisRound, setHasBetThisRound] = useState(false)

  const myActiveBet = useMemo(() => {
    if (!user?.id) return null
  
    return players.find(
      p => p.userId === user.id && p.cashoutX === null
    )
  }, [players, user])
  
  const canCashout = gameState === 'flying' && Boolean(myActiveBet) && multiplier >= 1.25

  const usersCacheRef = useRef(new Map())
  const botsCacheRef = useRef(new Map())
  const betsReqIdRef = useRef(0)
  const canPlaceBet = gameState === 'countdown' && countdown > 0

const dropsCacheRef = useRef(new Map())
const myBetInRound = useMemo(() => {
  if (!user?.id) return null

  return players.find(p => p.userId === user.id)
}, [players, user])
const canBet =
gameState === 'countdown' &&
countdown > 0 &&
!myBetInRound &&
!hasBetThisRound

const handleCashout = () => {
  if (!canCashout || !myActiveBet || !user?.id) return

  send({
    event: 'cashout',
    user_id: user.id, // 🔥 ВАЖНО
  })
}

// Callback при размещении ставки - оптимистичное обновление
const handleBetPlaced = (betData) => {
  if (!user?.id) return
  
  // Устанавливаем флаг что ставка сделана
  setHasBetThisRound(true)
  
  // Добавляем пользователя в список игроков сразу (оптимистичное обновление)
  const newPlayer = {
    id: `temp-${Date.now()}`,
    userId: user.id,
    name: user.username || user.firstname || 'User',
    avatar: user.url_image || '/image/default-avatar.png',
    betAmount: betData?.amount || 0,
    autoCashoutX: betData?.autoCashoutX || null,
    cashoutX: null,
    gift: betData?.gift || false,
    giftId: betData?.giftId || null,
    giftIcon: betData?.giftIcon || null,
  }
  
  setPlayers(prev => {
    // Проверяем, нет ли уже этого пользователя
    const exists = prev.some(p => p.userId === user.id)
    if (exists) return prev
    return [newPlayer, ...prev]
  })
}



const loadBets = useCallback(async (roundId) => {
  if (!roundId) return // ⬅️ защита от undefined
  const reqId = ++betsReqIdRef.current

  try {
    const bets = await getCrashBetsByRound(roundId)

    // если уже ушёл новый запрос — этот игнорируем
    if (reqId !== betsReqIdRef.current) return

    const usersCache = usersCacheRef.current
    const botsCache = botsCacheRef.current

    const mapped = await Promise.all(
      bets.map(async (bet) => {
        let name = 'Unknown'
        let avatar = '/image/default-avatar.png'

        const isBot = bet.user_id < 0
        
        if (isBot) {
          const botId = Math.abs(bet.user_id)
          if (!botsCache.has(botId)) {
            botsCache.set(botId, await getCrashBotById(botId))
          }
          const bot = botsCache.get(botId)
          name = bot?.nickname ?? 'Bot'
          avatar = bot?.avatar_url ?? avatar
          // Боты всегда с маскировкой
          name = maskUsername(name)
        }

        if (bet.user_id > 0) {
          if (!usersCache.has(bet.user_id)) {
            usersCache.set(bet.user_id, await getUserById(bet.user_id))
          }
          const user = usersCache.get(bet.user_id)
          name = user?.username || user?.firstname || 'User'
          avatar = user?.url_image ?? avatar
        }

        let giftIcon = null

        if (bet.gift && bet.gift_id) {
          const dropsCache = dropsCacheRef.current
        
          if (!dropsCache.has(bet.gift_id)) {
            const drop = await getDropById(bet.gift_id)
            dropsCache.set(bet.gift_id, drop)
        
            // 🔥 DEBUG ДЛЯ БОТА
            if (bet.user_id < 0) {
              console.log('[BOT GIFT ICON]', {
                giftId: bet.gift_id,
                icon: drop?.icon_url || drop?.image,
                drop,
              })
            }
          }
        
          const drop = dropsCache.get(bet.gift_id)
          giftIcon = drop?.icon ?? null        }
        


        const betX =
          bet.cashout_multiplier ??
          bet.auto_cashout_x ??
          1

          return {
            id: bet.id,
            userId: bet.user_id, // 🔥 ВАЖНО
            name,
            avatar,
            betAmount: Number(bet.amount),
            autoCashoutX: bet.auto_cashout_x,
            cashoutX: bet.cashout_multiplier,
            gift: !!bet.gift,
            giftId: bet.gift_id ?? null,
            giftIcon,
            isBot,
          }
          
          
          
          
          
      })
    )

    // ещё раз защита от гонки
    if (reqId !== betsReqIdRef.current) return

    setPlayers(mapped)
  } catch (err) {
    console.error('Failed to load bets', err)
  }
}, [])

useEffect(() => {
  if (!roundIdRef.current) return

  // чаще всего ставки меняются в countdown
  const intervalMs = gameState === 'countdown' ? 700 : 2000

  const id = setInterval(() => {
    if (!roundIdRef.current) return
    loadBets(roundIdRef.current)
  }, intervalMs)

  return () => clearInterval(id)
}, [gameState, loadBets])


  // Подписка на сообщения WebSocket через контекст
  useEffect(() => {
    const handleMessage = (msg) => {
      switch (msg.event) {
        case "new_round": {
          roundIdRef.current = msg.round_id
          setHasBetThisRound(false)
          setExplosionPlayed(false)
          setPlayers([])
          loadBets(msg.round_id)
          break
        }
        case "cashout": {
          setPlayers(prev =>
            prev.map(p =>
              p.userId === msg.user_id
                ? { ...p, cashoutX: msg.multiplier }
                : p
            )
          )
        
          if (msg.user_id === user?.id) {
            getUserById(user.id)
              .then(freshUser => {
                setUser(freshUser)
              })
              .catch(err => {
                console.error('Failed to refresh user after cashout', err)
              })
        
            const myBet = players.find(p => p.userId === user.id)
        
            if (myBet) {
              setWinData({
                giftIcon: myBet.gift ? myBet.giftIcon : null,
                wonAmount: myBet.betAmount * msg.multiplier,
                multiplier: msg.multiplier,
                isGift: myBet.gift,
              })
              setWinModalOpen(true)
            }
          }
          break
        }
        
        case "bet_placed": {
          if (roundIdRef.current) {
            loadBets(roundIdRef.current)
          }
          break
        }
        
        case "state": {
          if (msg.round_id) {
            roundIdRef.current = msg.round_id
            loadBets(msg.round_id)
          }
          break
        }
        
        case "round_start": {
          if (settings?.vibrationEnabled) {
            vibrate(VIBRATION_PATTERNS.action)
          }
          if (msg.round_id) {
            roundIdRef.current = msg.round_id
            loadBets(msg.round_id)
          }
          break
        }
        
        case "tick": {
          if (!roundIdRef.current && msg.round_id) {
            roundIdRef.current = msg.round_id
            loadBets(msg.round_id)
          }
          break
        }
          
        case "crash":
          loadBets(msg.round_id)
          if (settings?.vibrationEnabled) {
            vibrate(VIBRATION_PATTERNS.crash)
          }
          break;
      }
    }

    const unsubscribe = subscribe(handleMessage)
    return unsubscribe
  }, [subscribe, loadBets, user, players, setUser, settings])
  
  

  const giftIcons = useMemo(
    () => [
      '/image/case_card1.png',
      '/image/case_card2.png',
      '/image/case_card3.png',
      '/image/case_card4.png',
    ],
    []
  )




  const getPlayerResultClass = (player) => {
    // проиграл
    if (gameState === 'postflight' && player.cashoutX === null) {
      return 'text-red'
    }
  
    // выиграл
    if (player.cashoutX !== null) {
      return 'text-green'
    }
  
    return ''
  }
  
  const getPlayerRowClass = (player) => {
    let classes = 'player-row'
    
    // При краше добавляем анимацию фона
    if (gameState === 'postflight') {
      if (player.cashoutX === null) {
        classes += ' player-row--lost'
      } else {
        classes += ' player-row--won'
      }
    }
    
    return classes
  }
  
  
  

  const getPlayerReward = (player) => {
    if (gameState === 'countdown') {
      return player.betAmount
    }
  
    // если был вывод — фикс
    if (player.cashoutX !== null) {
      return player.betAmount * player.cashoutX
    }
  
    if (gameState === 'flying') {
      return player.betAmount * multiplier
    }
  
    // postflight + cashoutX === null
    return 0
  }
  
  
  
  const getPlayerMultiplierLabel = (player) => {
    if (player.cashoutX) {
      return `x${player.cashoutX.toFixed(2)}`
    }
  
    if (gameState === 'flying') {
      return `x${multiplier.toFixed(2)}`
    }
  
    if (player.autoCashoutX) {
      return `x${player.autoCashoutX}`
    }
  
    return '—'
  }
  
  const getPlayerRewardLabel = (player) => {
    if (gameState === 'postflight' && !player.cashoutX) {
      return formatAmount(0)
    }
    return formatAmount(getPlayerReward(player))
  }
  
  
  useEffect(() => {
    if (coeffHistoryRef.current) {
      const rafId = requestAnimationFrame(() => {
        coeffHistoryRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [gameState])

  // Продолжительная вибрация во время полёта ракеты
  useEffect(() => {
    if (gameState !== 'flying' || !settings?.vibrationEnabled) return

    // Вибрация каждые 2 секунды пока ракета летит
    const vibrateInterval = setInterval(() => {
      vibrate(VIBRATION_PATTERNS.rocketFlight)
    }, 2300)

    // Первая вибрация сразу
    vibrate(VIBRATION_PATTERNS.rocketFlight)

    return () => clearInterval(vibrateInterval)
  }, [gameState, settings?.vibrationEnabled])

  return (
    <PageLayout activePage="crash" className="crash-page">
      <div className="crash-content">
        {/* Зона игры */}
        <div className={`crash-game-area ${gameState === 'countdown' ? 'crash-countdown' : ''} ${gameState === 'postflight' ? 'crash-postflight' : ''} ${gameState === 'postflight-done' ? 'crash-postflight-done' : ''} ${gameState !== 'countdown' ? 'crash-no-rays' : ''}`}>
          <div
            className={`cosmic-background ${gameState === 'flying' ? 'cosmic-background-active' : ''}`}
            aria-hidden="true"
          />
                    <div className="crash-game-area-fade" />
          {/* Анимации взрывов и полёта кота */}
          <div className="crash-animation-container">
          {gameState === 'countdown' && (
  <div className="countdown-display">
    <span className="countdown-number">
      {countdown === null ? '...' : countdown}
    </span>
  </div>
)}


            {gameState === 'flying' && (
              <>
                <CrashLine multiplier={multiplier} maxMultiplier={5} />

                <Player
                  autoplay={true}
                  loop={false}
                  keepLastFrame={true}
                  src="/animation/cat fly___.json"
                  className="lottie-cat"
                  style={{
                    transform: `translate(-50%, -50%) scale(${Math.min(0.9 + (multiplier - 1) * 0.075, 1.4)})`,
                  }}
                  lottieRef={(lottie) => {
                    catLottieRef.current = lottie
                  }}
                  onEvent={(event) => {
                    if (event === 'complete') {
                      const lottie = catLottieRef.current
                      if (lottie) {
                        const totalFrames = lottie.totalFrames
                        const loopStart = totalFrames - 180
                        lottie.loop = true
                        lottie.playSegments([loopStart, totalFrames], true)
                      }
                    }
                  }}
                />
              </>
            )}

{gameState === 'postflight' && !explosionPlayed && (
  <Player
    autoplay
    loop={false}
    keepLastFrame={false}
    src="/animation/vzryv2__.json"
    className="lottie-postflight"
    speed={1.18}
    onEvent={(event) => {
      if (event === 'complete') {
        setExplosionPlayed(true)
        setGameState('postflight-done')
      }
    }}
  />
)}

          </div>

          {gameState !== 'countdown' && (
            <div className={`multiplier-display ${gameState === 'postflight' || gameState === 'postflight-done' ? 'centered sparkle' : ''}`}>
              <span className="multiplier-value">x{multiplier.toFixed(2)}</span>
            </div>
          )}

          <div className="coeff-history-overlay">
            <div
              className="coeff-history"
              aria-label="История коэффициентов"
              ref={coeffHistoryRef}
            >
              {coefficientHistory.map((item, index) => {
                const displayValue = item.isPending
                  ? t('crash.waiting')
                  : item.isLive
                    ? multiplier.toFixed(2)
                    : item.value.toFixed(2)
                const key = item.isLive ? `live-${index}` : item.isPending ? `pending-${index}` : `${item.value}-${index}`
                return (
                  <div
                    key={key}
                    className={`coeff-history-item ${index === 0 ? 'active' : ''} ${item.isPending ? 'pending' : ''} ${item.isLive ? 'live' : ''}`}
                  >
                    {displayValue}
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Кнопка ставки */}
        <button
  className={`bet-button gg-btn-glow ${
    canCashout
      ? 'cashout'
      : !canBet
        ? 'disabled'
        : ''
  }`}
  onClick={() => {
    if (canCashout) {
      handleCashout()
    } else if (canBet) {
      setIsBetModalOpen(true)
    }
  }}
  disabled={!canBet && !canCashout}
>
  {canCashout
    ? `${t('crash.cashout')} x${multiplier.toFixed(2)}`
    : myBetInRound
      ? t('crash.betPlaced')       // 👈 НОВОЕ
      : canBet
        ? t('crash.placeBet')
        : t('crash.betsClosed')}
</button>





        {/* Модальное окно ставки */}
        <BetModal
  isOpen={isBetModalOpen}
  onClose={() => setIsBetModalOpen(false)}
  game="crash"
  mode="bet"
  canBet={canBet}
  onBetPlaced={handleBetPlaced}
/>



        {/* Список игроков */}
        <div className="players-list">
  {players.map(player => (
    <div key={player.id} className={getPlayerRowClass(player)}>
      <div className="player-info">
        <div className="player-avatar">
          <img src={player.avatar} alt={player.name} />
        </div>

        <div className="player-details">
          <span className="player-name">
                            {player.isBot 
                              ? player.name  // Боты уже замаскированы при загрузке
                              : (player.userId === user?.id && settings?.hideLogin) 
                                ? maskUsername(player.name) 
                                : player.name
                            }
                          </span>

          <div className="player-stats-row">
          <span className="stat-bet">
  {formatAmount(player.betAmount)}
</span>
<img
  src={selectedCurrency?.icon}
  className="coin-icon-small"
  alt="currency"
/>

            <span className="stat-multiplier">
  {getPlayerMultiplierLabel(player)}
</span>
          </div>
        </div>
      </div>

      <div className="player-reward">
        {!player.gift && (
          <div className="reward-amount-container">
<span className={`reward-amount ${getPlayerResultClass(player)}`}>
  {getPlayerRewardLabel(player)}
</span>
<img
  src={selectedCurrency?.icon}
  className="coin-icon-large"
  alt="currency"
/>

          </div>
        )}

        {player.gift && player.giftIcon && (
          <img
            src={player.giftIcon}
            className="gift-icon"
            alt="Gift"
          />
        )}
      </div>
    </div>
  ))}
</div>

      {/* Модальное окно выигрыша */}
      {winModalOpen && winData && (
        <div className="wheel-result-overlay" onClick={() => setWinModalOpen(false)}>
          <div className="wheel-result-modal" onClick={(e) => e.stopPropagation()}>
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
            <h2 className="wheel-result-title">{t('caseModal.congratulations')}</h2>
            <p className="crash-win-multiplier">x{winData.multiplier.toFixed(2)}</p>
            <div className="wheel-result-prize">
              <div className="wheel-result-card">
                <div className="wheel-result-prize-content">
                  {winData.isGift && winData.giftIcon ? (
                    <img src={winData.giftIcon} alt="Gift" className="wheel-result-image" />
                  ) : (
<img
  src={selectedCurrency?.icon}
  alt="currency"
  className="crash-win-coin-icon"
/>
                  )}
                </div>
              </div>
              <span className="case-result-price-below">
              <img
  src={selectedCurrency?.icon}
  alt="currency"
  className="wheel-result-coin"
/>
{formatWinAmount(winData.wonAmount)}

              </span>
            </div>
            <button className="wheel-result-close gg-btn-glow" onClick={() => setWinModalOpen(false)}>
              {t('caseModal.claim')}
            </button>
          </div>
        </div>
      )}
      </div>
    </PageLayout>
  )
}

export default CrashPage
