import './TaskList.css'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'
import { activatePromo } from '../api/promo'
import { getUserById } from '../api/users'
import { useFreeSpin } from '../context/FreeSpinContext'
import { useEffect, useState } from 'react'
import {
  getDailyRewardsStatus,
  claimFirstReward,
  claimTenDaysReward,
} from '../api/dailyRewards'


function TaskList() {
  const { t } = useLanguage()
  const { user, setUser } = useUser()

  const [selectedOption, setSelectedOption] = useState(1)
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshFreeSpin } = useFreeSpin()
    const handleSelect = (option) => {
    setSelectedOption(option)
  }
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
  })
  const [rewards, setRewards] = useState(null)
  const [claiming, setClaiming] = useState(false)
  
  const showNotification = (message) => {
    setNotification({ visible: true, message })
  
    setTimeout(() => {
      setNotification({ visible: false, message: '' })
    }, 3000)
  }
  useEffect(() => {
    if (!user) return
  
    getDailyRewardsStatus(user.id)
      .then(setRewards)
      .catch(() => {})
  }, [user])
  

  const handleClaimFirst = async () => {
    if (!user || !rewards?.daily_reward.available) return
  
    try {
      setClaiming(true)
  
      await claimFirstReward(user.id)
  
      const freshUser = await getUserById(user.id)
      setUser(freshUser)
  
      const status = await getDailyRewardsStatus(user.id)
      setRewards(status)
  
      showNotification(t('tasks.rewardReceived'))
    } catch (e) {
      showNotification(e.message)
    } finally {
      setClaiming(false)
    }
  }
  
  const handleClaimTenDays = async () => {
    if (!user || !rewards?.ten_days_reward.available) return
  
    try {
      setClaiming(true)
  
      await claimTenDaysReward(user.id)
  
      const freshUser = await getUserById(user.id)
      setUser(freshUser)
  
      const status = await getDailyRewardsStatus(user.id)
      setRewards(status)
  
      showNotification(t('tasks.rewardReceived'))
    } catch (e) {
      showNotification(e.message)
    } finally {
      setClaiming(false)
    }
  }
  

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    if (!user) {
      showNotification(t('errors.notAuthorized'))

      return
    }
  
    try {
      setLoading(true)
  
      // 1️⃣ активируем промокод
      const res = await activatePromo(user.id, promoCode.trim())
  
      // 2️⃣ получаем обновлённого юзера
      const freshUser = await getUserById(user.id)
  
      // 3️⃣ обновляем UserContext
      setUser(freshUser)
      await refreshFreeSpin(user.id)
      // 4️⃣ UI feedback
      if (res.type === 'referral') {
        showNotification(
          t('promo.referralBonus', { amount: res.reward })
        )
      } else {
        showNotification(t('promo.activated'))
      }
      
  
      setPromoCode('')
    } catch (e) {
      showNotification(t('promo.error'))
    }
     finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="task-list">
  
      {/* FIRST LOGIN BONUS */}
      <div className="task-item">
        <div className="task-left">
          <span
            className={`task-check ${
              rewards?.daily_reward.used ? 'completed' : ''
            }`}
          >
            {rewards?.daily_reward.used && '✓'}
          </span>
  
          <span
            className={`task-text ${
              rewards?.daily_reward.used ? 'completed' : ''
            }`}
          >
            {t('tasks.play1Times')}
          </span>
        </div>
  
        <button
          className={`take-btn ${
            rewards?.daily_reward.available && !rewards?.daily_reward.used
              ? 'active'
              : 'inactive'
          }`}
          disabled={
            claiming ||
            rewards?.daily_reward.used ||
            !rewards?.daily_reward.available
          }
          onClick={handleClaimFirst}
        >
          {t('tasks.take')}
        </button>
      </div>
  
      {/* TEN DAYS BONUS */}
      <div className="task-item">
        <div className="task-left">
          <span
            className={`task-check ${
              rewards?.ten_days_reward.used ? 'completed' : ''
            }`}
          >
            {rewards?.ten_days_reward.used && '✓'}
          </span>
  
          <span
            className={`task-text ${
              rewards?.ten_days_reward.used ? 'completed' : ''
            }`}
          >
            {t('tasks.play10Times')}
          </span>
        </div>
  
        <button
          className={`take-btn ${
            rewards?.ten_days_reward.available && !rewards?.ten_days_reward.used
              ? 'active'
              : 'inactive'
          }`}
          disabled={
            claiming ||
            rewards?.ten_days_reward.used ||
            !rewards?.ten_days_reward.available
          }
          onClick={handleClaimTenDays}
        >
          {t('tasks.take')}
        </button>
      </div>
  
      {/* PROMO */}
      <div className="promo-row">
        <div className="promo-input">
          <input
            type="text"
            placeholder={t('tasks.promoPlaceholder')}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={loading}
          />
        </div>
  
        <button
          className="apply-btn"
          onClick={handleApplyPromo}
          disabled={loading || !promoCode.trim()}
        >
          {loading ? '...' : t('tasks.apply')}
        </button>
      </div>
  
      {notification.visible && (
        <div className="notification">
          {notification.message}
        </div>
      )}
    </div>
  )
  
}

export default TaskList
