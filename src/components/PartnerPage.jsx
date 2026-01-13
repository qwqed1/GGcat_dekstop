import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import './PartnerPage.css'
import { useUser } from '../context/UserContext'
import {
  createReferralPromo,
  updateReferralPromo,
  getMyReferralPromo,
  getReferralActivations
} from '../api/promo'



// Моковые данные для приглашенных друзей


function PartnerPage() {
  const navigate = useNavigate()
  const { selectedCurrency } = useCurrency()
  const { t } = useLanguage()
  const [promoCode, setPromoCode] = useState('')
  const [savedPromoCode, setSavedPromoCode] = useState('')
  const [isCreatingPromo, setIsCreatingPromo] = useState(false)
  const [friends, setFriends] = useState([])
  const [copied, setCopied] = useState(false)
  const [promoCopied, setPromoCopied] = useState(false)
  const { user } = useUser()
  const [loadingFriends, setLoadingFriends] = useState(true)
  

  const inviteLink = user?.refLink || ''

  useEffect(() => {
    if (!user) return
  
    const loadFriends = async () => {
      try {
        const res = await getReferralActivations(user.id)
        setFriends(res.users || [])
      } catch (e) {
        console.error('Failed to load referral activations', e)
      } finally {
        setLoadingFriends(false)
      }
    }
  
    loadFriends()
  }, [user])
  
  useEffect(() => {
    if (!user) return
  
    const loadMyPromo = async () => {
      try {
        const res = await getMyReferralPromo(user.id)
  
        if (res.exists) {
          setSavedPromoCode(res.code)
        }
      } catch (e) {
        console.error('Failed to load referral promo', e)
      }
    }
  
    loadMyPromo()
  }, [user])
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleInvite = () => {
    // Открыть Telegram для отправки приглашения
    const shareText = t('partner.shareText')
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  const writeToClipboard = async (text) => {
    if (!text) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }

      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCreatePromo = async () => {
    if (!promoCode.trim() || !user) return
  
    try {
      if (!savedPromoCode) {
        // СОЗДАНИЕ
        const res = await createReferralPromo(user.id, promoCode.trim())
        setSavedPromoCode(res.code)
      } else {
        // ОБНОВЛЕНИЕ
        const res = await updateReferralPromo(user.id, promoCode.trim())
        setSavedPromoCode(res.code)
      }
  
      setIsCreatingPromo(false)
      setPromoCode('')
    } catch (e) {
      alert(e.message || 'Promo error')
    }
  }
  

  const handleCancelPromo = () => {
    setIsCreatingPromo(false)
    setPromoCode('')
  }

  const handleCopyPromo = async () => {
    if (!savedPromoCode) return
    await writeToClipboard(savedPromoCode)
    setPromoCopied(true)
    setTimeout(() => setPromoCopied(false), 2000)
  }

  const handleEditPromo = () => {
    if (!savedPromoCode) {
      setIsCreatingPromo(true)
      return
    }
    setIsCreatingPromo(true)
    setPromoCode(savedPromoCode)
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('ru-RU')
  }
  

  return (
    <div className="partner-page">
      <Header />
      
      <main className="partner-content">
        <h1 className="partner-title">{t('partner.title')}</h1>

        {/* Invite Section */}
        <div className="invite-section">
          <button className="invite-btn" onClick={handleInvite}>
            {t('partner.invite')}
          </button>
          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`} 
            onClick={handleCopyLink}
            title={t('partner.copyLink')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <p className="partner-description">
          {t('partner.description')}
        </p>

        {/* Create Promo Code Section */}
        <div className="promo-section">
          <h2 className="promo-title">{t('partner.createPromo')}</h2>

          {!isCreatingPromo ? (
            savedPromoCode ? (
              <div className="promo-input-wrapper">
                <label className="promo-label">{t('partner.yourPromo')}:</label>
                <div className="promo-input-container">
                  <input
                    type="text"
                    className="promo-input"
                    value={savedPromoCode}
                    readOnly
                  />
                  <button className="promo-edit-btn" onClick={handleEditPromo} title={t('partner.createPromo')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16.5 3.5C17.3284 2.67157 18.6716 2.67157 19.5 3.5C20.3284 4.32843 20.3284 5.67157 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className={`promo-copy-btn ${promoCopied ? 'copied' : ''}`}
                    onClick={handleCopyPromo}
                    title={t('partner.copyLink')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
<button
  className="create-promo-btn"
  onClick={() => setIsCreatingPromo(true)}
>
                {t('partner.createPromo')}
              </button>
            )
          ) : (
            <div className="promo-input-wrapper">
              <label className="promo-label">{t('partner.promoLabel')}:</label>
              <div className="promo-input-container">
                <input
                  type="text"
                  className="promo-input"
                  placeholder={t('partner.enterPromo')}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  autoFocus
                />
                <button
                  className="promo-confirm-btn"
                  onClick={handleCreatePromo}
                  disabled={!promoCode.trim()}
                  title={t('common.save')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="promo-cancel-btn" onClick={handleCancelPromo} title={t('common.cancel')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invited Friends Section */}
        <div className="friends-section">
          <h2 className="friends-title">
            {t('partner.invitedFriends')}
            <span className="friends-count">({friends.length})</span>
          </h2>

          {friends.length === 0 ? (
            <div className="friends-empty">
              <p className="friends-hint">
                {t('partner.friendHint')}
              </p>
              <p className="friends-empty-text">{t('partner.noFriends')}</p>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map((friend, index) => (
                <div key={friend.id} className="friend-item">
                  <span className="friend-rank">{index + 1}</span>
                  <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
                  <span className="friend-name">{friend.firstname}</span>
                  <span className="friend-earnings">
                  {formatNumber(friend.totalDEP)}
                  <img src={selectedCurrency?.icon || '/image/Coin-Icon.svg'} alt={selectedCurrency?.id || 'TON'} className="ton-icon" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  )
}

export default PartnerPage
