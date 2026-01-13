import { useState, useRef, useEffect } from 'react'
import './CaseModal.css'
import './WheelPage.css'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import DepositModal from './DepositModal'
import { Player } from '@lottiefiles/react-lottie-player'
import { getCaseDrops, getDropById } from '../api/cases'
import { useUser } from '../context/UserContext'
import * as usersApi from '../api/users'
import AsyncImage from './AsyncImage'
import { vibrate, VIBRATION_PATTERNS } from '../utils/vibration'
import { useNavigate } from 'react-router-dom'
import { checkFreeCase, consumeFreeCase } from '../api/freeCases'
import { apiFetch } from '../api/client'



// Предметы внутри кейса (моковые данные)


function CaseModal({ isOpen, onClose, caseData, isPaid = true }) {
  const [view, setView] = useState('main') // 'main' | 'spin' | 'result'
  const [wonAmount, setWonAmount] = useState(0)
  const [wonItem, setWonItem] = useState(null)
  const [spinItems, setSpinItems] = useState([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const { selectedCurrency, formatAmount, formatWinAmount } = useCurrency()
  const { t } = useLanguage()
  const [caseItems, setCaseItems] = useState([])
  const [loadingDrops, setLoadingDrops] = useState(true)
  const { user, setUser, settings } = useUser()
  const navigate = useNavigate()
  const [freeAllowed, setFreeAllowed] = useState(false)
  const [freeChecked, setFreeChecked] = useState(false)
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')
  const casePrice = Number(caseData?.price || 0)
const userBalance = Number(user?.balance || 0)

const canOpenCase = isPaid
  ? userBalance >= casePrice
  : freeChecked && freeAllowed


  const [spinOffset, setSpinOffset] = useState(50)
  const [spinPhase, setSpinPhase] = useState('idle') // 'idle' | 'main' | 'settle'
  const spinTrackRef = useRef(null)
  const spinTrackInnerRef = useRef(null)
  const spinAnimationStartedRef = useRef(false)
  
  // Для свайпа
  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const dragStartY = useRef(0)
  const currentTranslateY = useRef(0)
  const isDragging = useRef(false)

  function playGame(userId) {
    return apiFetch(`/games/play?user_id=${userId}`, {
      method: 'POST',
    })
  }

  function updateInventory(inventory = [], dropId) {
    const next = [...inventory]
    const item = next.find(i => i.drop_id === dropId)
  
    if (item) {
      item.count += 1
    } else {
      next.push({ drop_id: dropId, count: 1 })
    }
  
    return next
  }
  
  function rollDrop(items) {
    const total = items.reduce((sum, i) => sum + i.chance, 0)
    let rand = Math.random() * total
  
    for (const item of items) {
      if (rand < item.chance) return item
      rand -= item.chance
    }
  
    return items[0]
  }
  
  useEffect(() => {
    if (!isOpen || isPaid || !user) return
  
    async function check() {
      try {
        const res = await checkFreeCase(user.id)
        setFreeAllowed(res.allowed)
      } catch (e) {
        console.error('Free case check failed', e)
        setFreeAllowed(false)
      } finally {
        setFreeChecked(true)
      }
    }
  
    check()
  }, [isOpen, isPaid, user])
  
  useEffect(() => {
    if (!isOpen || !caseData?.id) return
  
    async function loadCaseDrops() {
      setLoadingDrops(true)
  
      // 1. связи кейса
      const relations = await getCaseDrops(caseData.id)
  
      // 2. сами дропы
      const drops = await Promise.all(
        relations.map(async (rel) => {
          const drop = await getDropById(rel.drop_id)
          return {
            ...drop,
            IsNft: drop.IsNft,
            chance: rel.chance,
          
            image: drop.icon,
            animation: drop.lottie_anim,
          
            type: drop.lottie_anim ? 'animation' : 'image',
          }
          
        })
      )
  
      // Сортировка по цене от дорогих к дешёвым
      const sortedDrops = drops.sort((a, b) => b.price - a.price)
      setCaseItems(sortedDrops)
      setLoadingDrops(false)
    }
  
    loadCaseDrops()
  }, [isOpen, caseData?.id])
  

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setView('main')
      setWonAmount(0)
      setWonItem(null)
      setSpinItems([])
      setIsSpinning(false)
      if (contentRef.current) {
        contentRef.current.style.transform = 'translateY(0)'
        currentTranslateY.current = 0
      }
    }
  }, [isOpen])

  // Начало свайпа
  const handleDragStart = (e) => {
    isDragging.current = true
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY
    dragStartY.current = clientY - currentTranslateY.current
    
    if (contentRef.current) {
      contentRef.current.style.transition = 'none'
    }
  }

  // Движение свайпа
  const handleDragMove = (e) => {
    if (!isDragging.current) return
    
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
    let newTranslateY = clientY - dragStartY.current
    
    if (newTranslateY < 0) newTranslateY = 0
    
    currentTranslateY.current = newTranslateY
    
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${newTranslateY}px)`
    }
  }

  // Конец свайпа
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

  // Mouse events
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

  const handleOverlayClick = (e) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  useEffect(() => {
    if (view !== 'spin' || !isSpinning || !spinItems.length) return
    if (spinAnimationStartedRef.current) return

    spinAnimationStartedRef.current = true

    const startOffset = 50
    setSpinOffset(startOffset)

    const rafId = requestAnimationFrame(() => {
      const trackEl = spinTrackInnerRef.current
      const containerEl = spinTrackRef.current
      if (!trackEl || !containerEl) return

      const items = trackEl.querySelectorAll('.case-spin-item')
      const winnerEl =
        trackEl.querySelector('.case-spin-item--winning') ||
        items[Math.floor(items.length / 2)]
      if (!winnerEl) return

      const containerRect = containerEl.getBoundingClientRect()
      const winnerRect = winnerEl.getBoundingClientRect()

      const containerCenter = containerRect.left + containerRect.width / 2
      const winnerCenter = winnerRect.left + winnerRect.width / 2

      const delta = winnerCenter - containerCenter
      const finalOffset = startOffset - delta
      const overshootOffset = finalOffset - 15

      // Основная фаза движения
      setSpinPhase('main')
      setSpinOffset(overshootOffset)

      // Лёгкий откат к финальной позиции
      setTimeout(() => {
        setSpinPhase('settle')
        setSpinOffset(finalOffset)
      }, 4600)
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [view, isSpinning, spinItems])

  // Открытие кейса
  const handleOpenCase = async () => {



    
    if (isSpinning || !caseItems.length) return
  

    if (!isPaid) {
      try {
        await consumeFreeCase(user.id)
      } catch (e) {
        console.error('Failed to consume free case', e)
        return
      }
    }

    // ❌ защита на всякий случай
    if (isPaid && user.balance < casePrice) return
  
    // 🔥 СПИСЫВАЕМ БАЛАНС
    if (isPaid && user) {
      try {
        const updatedUser = await usersApi.updateUser(user.id, {
          balance: user.balance - casePrice,
        })
        await playGame(user.id)
        setUser(updatedUser)
      } catch (err) {
        console.error('Failed to deduct balance:', err)
        return
      }
    }
    const winning = rollDrop(caseItems)
  
    setWonItem(winning)
    setWonAmount(winning.price)
    if (user) {
      const updatedInventory = updateInventory(
        user.inventory || [],
        winning.id
      )
  
      try {
        const updatedUser = await usersApi.updateUser(user.id, {
          inventory: updatedInventory,
        })
  
        // 🔥 обновляем контекст
        setUser(updatedUser)
      } catch (err) {
        console.error('Failed to update inventory:', err)
      }
    }

    spinAnimationStartedRef.current = false
    setSpinPhase('idle')
    setSpinOffset(50)

    // Создаём длинную ленту предметов
    // Выигрышный предмет будет на позиции, которая окажется под маркером после анимации
    const totalItems = 30
    const winningPosition = 22 // Позиция под маркером после остановки
    
    const items = []
    for (let i = 0; i < totalItems; i++) {
      if (i === winningPosition) {
        // Вставляем выигрышный предмет
        items.push({ ...winning, uid: `win-${Math.random().toString(36).slice(2)}`, isWinning: true })
      } else {
        // Случайный предмет из списка
        const randomItem = caseItems[Math.floor(Math.random() * caseItems.length)]
        items.push({ ...randomItem, uid: `${randomItem.id}-${i}-${Math.random().toString(36).slice(2)}`, isWinning: false })
      }
    }

    setSpinItems(items)
    setView('spin')
    setIsSpinning(true)

    // Вибрация при спине кейса
    if (settings?.vibrationEnabled) {
      vibrate(VIBRATION_PATTERNS.spin)
    }

    // Длительность спина и затем показать результат
    setTimeout(() => {
      setIsSpinning(false)
      setView('result')
      // Вибрация при выигрыше
      if (settings?.vibrationEnabled) {
        vibrate(VIBRATION_PATTERNS.win)
      }
    }, 5200)
  }

  const handleResultOk = () => {
    onClose()
  }

  const currencyIcon = selectedCurrency?.icon || '/image/Coin-Icon.svg'
  const caseName = caseData?.name || (isPaid ? 'БЕСПЛАТНО 2.0' : 'FREE 2.0')

  if (!isOpen) return null

  if (view === 'result') {
    return (
      <>
        <div className="wheel-result-overlay" onClick={handleResultOk}>
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
            <p className="case-result-won-text">{t('caseModal.youWon')}</p>
            <div className="wheel-result-prize">
              <div className="wheel-result-card">
                <div className="wheel-result-prize-content">
                  {wonItem ? (
                    wonItem.type === 'animation' && wonItem.animation ? (
                      <Player
                        autoplay
                        loop
                        src={wonItem.animation}
                        className="wheel-result-animation"
                      />
                    ) : (
                      <img src={wonItem.image} alt="prize" className="wheel-result-image" />
                    )
                  ) : (
                    <img src="/image/case_card1.png" alt="prize" className="wheel-result-image" />
                  )}
                </div>
              </div>
              <span className="case-result-price-below">
                <img src={currencyIcon} alt="currency" className="wheel-result-coin" />
                {formatWinAmount(wonAmount)}
              </span>
            </div>
            <button className="wheel-result-close gg-btn-glow" onClick={handleResultOk}>
              {t('caseModal.claim')}
            </button>
          </div>
        </div>

        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
        />
      </>
    )
  }

  return (
    <div 
      className="case-modal-overlay" 
      ref={modalRef}
      onClick={handleOverlayClick}
    >
      <div 
        className={`case-modal-content ${view === 'result' ? 'case-modal-result' : ''}`}
        ref={contentRef}
      >
        {/* Ручка для свайпа */}
        <div 
          className="case-modal-handle"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="case-modal-handle-bar"></div>
        </div>

        {view === 'main' ? (
          <>
            {/* Заголовок кейса */}
            <h2 className="case-modal-title">{caseName}</h2>

            {/* Превью кейсов — бесконечная лента */}
            <div className="case-preview-row">
              <div className="case-preview-track">
                {[...Array(16)].map((_, i) => {
                  const previewItem = caseItems[i % caseItems.length]
                  return (
                    <div key={`preview-${i}`} className="case-preview-wrapper">
                      <div className="case-preview-item">
                        <div className="case-preview-gift">
                          {/* Верхний бар - только статика .webp */}
                          <AsyncImage
                            src={previewItem?.image}
                            alt={previewItem?.name || 'Gift'}
                            className="case-preview-image"
                          />
                        </div>
                      </div>
                      {/* Верхний бар декоративный - цены убраны */}
                    </div>
                  )
                })}
              </div>
              <div className="case-preview-fade case-preview-fade--left" />
              <div className="case-preview-fade case-preview-fade--right" />
            </div>

            {isPaid ? (
              /* Платный кейс */
              <>
<button
  className="case-open-button"
  onClick={() => {
    if (!canOpenCase) {
      alert(t('caseModal.notEnoughFunds'))
      return
    }
    handleOpenCase()
  }}
  disabled={isSpinning}
>
  {t('caseModal.open')}
</button>


                <div className="case-section-title">{t('caseModal.whatsInside')}</div>
                <div className="case-items-grid">
                  {caseItems.map((item) => (
                    <div key={item.id} className="case-item-wrapper">
                      <div className="case-item-card">
                      {item.IsNft && <span className="nft-label">NFT</span>}
                          <div className="case-item-image">
                          {item.animation ? (
                            <Player
                              autoplay
                              loop
                              src={item.animation}
                              className="case-item-animation"
                            />
                          ) : (
                            <AsyncImage
                              src={item.image}
                              alt={item.name || 'Gift'}
                              className="case-item-img"
                            />
                          )}
                        </div>
                      </div>
                      <div className="case-item-price-below">
                        <img src={currencyIcon} alt="currency" className="case-item-coin" />
                        <span>{formatAmount(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
) : (
  /* Бесплатный кейс */
  <>
    {canOpenCase ? (
      <button
        className="case-open-button"
        onClick={handleOpenCase}
        disabled={isSpinning}
      >
        {t('caseModal.open')}
      </button>
    ) : (
      <>
        <div className="case-info-box">
          <div className="case-info-icon">
            <img
              src="/image/Vector.png"
              alt="warning"
              className="case-info-icon-image"
            />
          </div>
          <p className="case-info-text">
            {t('caseModal.depositInfo')}
          </p>
        </div>

        <button
          className="case-deposit-button"
          onClick={() => setIsDepositModalOpen(true)}
        >
          {t('caseModal.depositFunds')}
        </button>

        <button
          className="case-promo-button"
          onClick={() => setShowPromoInput(true)}
        >
          {t('caseModal.activatePromo')}
        </button>

        {showPromoInput && (
          <div className="case-promo-input-container">
            <input
              type="text"
              className="case-promo-input"
              placeholder={t('tasks.promoPlaceholder')}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button
              className="case-promo-apply-button"
              onClick={async () => {
                if (!promoCode.trim()) return
                try {
                  const { activatePromo } = await import('../api/promo')
                  await activatePromo(user.id, promoCode.trim())
                  setPromoSuccess(t('promo.activated'))
                  setPromoError('')
                  setPromoCode('')
                  setShowPromoInput(false)
                  // Перезагрузить данные пользователя
                  const updatedUser = await usersApi.getUserById(user.id)
                  setUser(updatedUser)
                } catch (err) {
                  setPromoError(t('promo.error'))
                  setPromoSuccess('')
                }
              }}
            >
              {t('tasks.apply')}
            </button>
            {promoError && <div className="case-promo-error">{promoError}</div>}
            {promoSuccess && <div className="case-promo-success">{promoSuccess}</div>}
          </div>
        )}
      </>
    )}

               

                <div className="case-section-title">{t('caseModal.whatsInside')}</div>
                <div className="case-items-grid">
                  {caseItems.map((item) => (
                    <div key={item.id} className="case-item-wrapper">
                      <div className="case-item-card">
                        {item.IsNft && <span className="nft-label">NFT</span>}
                        <div className="case-item-image">
                          {item.type === 'animation' && item.animation ? (
                            <Player
                              autoplay
                              loop
                              src={item.animation}
                              className="case-item-animation"
                            />
                          ) : (
                            <AsyncImage
                              src={item.image}
                              alt={item.name || 'Gift'}
                              className="case-item-img"
                            />
                          )}
                        </div>
                      </div>
                      <div className="case-item-price-below">
                        <img src={currencyIcon} alt="currency" className="case-item-coin" />
                        <span>{formatAmount(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : view === 'spin' ? (
          <div className="case-spin-view">
            <div className="case-spin-wrapper">
              <div className="case-spin-marker">
                <img src="/image/Group 7188.png" alt="cat" className="case-spin-marker-cat" />
                <div className="case-spin-marker-line"></div>
              </div>
              <div className="case-spin-track" ref={spinTrackRef}>
                <div
                  className="case-spin-track-inner"
                  ref={spinTrackInnerRef}
                  style={{
                    transform: `translateX(${spinOffset}px)`,
                    transition: isSpinning
                      ? `transform ${
                          spinPhase === 'main' ? 4.6 : spinPhase === 'settle' ? 0.4 : 0
                        }s cubic-bezier(0.18, 0.89, 0.32, 1)`
                      : 'none',
                  }}
                >
                  {spinItems.map((item, index) => (
                    <div 
                      key={item.uid}
                      className={`case-spin-item ${
                        index % 3 === 0
                          ? 'case-spin-item--back'
                          : index % 2 === 0
                          ? 'case-spin-item--mid'
                          : ''
                      } ${item.isWinning ? 'case-spin-item--winning' : ''}`}
                    >
                      <div className="case-spin-gift">
                        {item.type === 'animation' && item.animation ? (
                          <Player
                            autoplay
                            loop
                            src={item.animation}
                            className="case-spin-animation"
                          />
                        ) : (
                          <AsyncImage
                            src={item.image}
                            alt={item.name || 'Gift'}
                            className="case-spin-image"
                          />
                        )}
                      </div>
                      <span className="case-spin-price">
                        <img src={selectedCurrency?.icon || '/image/Coin-Icon.svg'} alt="currency" />
                        {formatAmount(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="case-spin-fog case-spin-fog--left"></div>
                <div className="case-spin-fog case-spin-fog--right"></div>
              </div>
            </div>
            <div className="case-spin-caption">{t('caseModal.waiting')}</div>
          </div>
        ) : null}
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  )
}

export default CaseModal
