import './ProfilePage.css'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Gift, 
  Users, 
  Settings, 
  LogOut, 
  Copy, 
  ChevronRight, 
  Crown,
  Wallet 
} from 'lucide-react'
import PageLayout from './PageLayout'
import Navigation from './Navigation'
import WithdrawModal from './WithdrawModal'
import InventoryModal from './InventoryModal'
import { useCurrency } from '../context/CurrencyContext'
import { useUser } from '../context/UserContext'
import { useLanguage } from '../context/LanguageContext'
import { getDropById } from '../api/cases'
import * as usersApi from '../api/users'
import { Player } from '@lottiefiles/react-lottie-player'
import { canWithdraw } from '../api/withdraw'

function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    selectedCurrency,
    formatAmount,
  } = useCurrency()
  
  const [top1Balance, setTop1Balance] = useState(0)
  
  // Scrol to inventory
  useEffect(() => {
    if (location.hash === '#inventory') {
      setTimeout(() => {
        const inventorySection = document.getElementById('inventory')
        if (inventorySection) {
          inventorySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [location.hash])
  
  const { user, settings, updateSettings, loading } = useUser()
  const { t, language, changeLanguage, languages, currentLanguage } = useLanguage()

  const level = user?.level || 1
  const xp = user?.xp || 0
  const BASE_XP = 1000
  const XP_STEP = 200
  const nextLevelXP = BASE_XP + (level - 1) * XP_STEP
  const levelProgressPercent = Math.min(100, Math.floor((xp / nextLevelXP) * 100))

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [withdrawInfo, setWithdrawInfo] = useState(null)
  const [notification, setNotification] = useState({ visible: false, message: '' })
  
  const showNotification = (message) => {
    setNotification({ visible: true, message })
    setTimeout(() => setNotification({ visible: false, message: '' }), 3000)
  }

  if (loading) return <div className="profile-page"><div className="profile-loading">Loading...</div></div>
  
  if (!user) return (
    <div className="profile-page">
      <div className="profile-error">
        <p>Failed to load profile</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  )

  const {
    id,
    username,
    firstname,
    inventory,
    url_image,
  } = user

  const [inventoryDrops, setInventoryDrops] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(true)
  
  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    async function loadWithdrawStatus() {
      try {
        const res = await canWithdraw(user.id)
        if (mounted) setWithdrawInfo(res)
      } catch (e) {
        console.error('Withdraw can check failed', e)
      }
    }
    loadWithdrawStatus()
    return () => (mounted = false)
  }, [user?.id])
  
  useEffect(() => {
    let mounted = true
    async function loadTop1Balance() {
      try {
        const res = await usersApi.getUsers()
        const users = Array.isArray(res) ? res : (res?.users ?? [])
        if (!users.length) return
        const maxBalance = Math.max(...users.map(u => Number(u.balance) || 0))
        if (mounted) setTop1Balance(maxBalance)
      } catch (e) {
        console.error('Failed to load top1 balance', e)
      }
    }
    loadTop1Balance()
    return () => (mounted = false)
  }, [])
  
  useEffect(() => {
    if (!inventory?.length) {
      setInventoryDrops([])
      setLoadingInventory(false)
      return
    }
    async function loadInventory() {
      setLoadingInventory(true)
      try {
        const uniqueIds = [...new Set(inventory.map(i => i.drop_id))]
        const drops = await Promise.all(uniqueIds.map(id => getDropById(id)))
        const dropMap = Object.fromEntries(drops.map(d => [d.id, d]))
        const reversedInventory = [...inventory].reverse()
        const expanded = reversedInventory.flatMap(item =>
          Array.from({ length: item.count }).map(() => dropMap[item.drop_id])
        )
        setInventoryDrops(expanded)
      } catch (e) {
        console.error('Failed to load inventory', e)
        setInventoryDrops([])
      } finally {
        setLoadingInventory(false)
      }
    }
    loadInventory()
  }, [inventory])

  const inventoryPreview = inventoryDrops.slice(0, 12)
  const displayName = firstname || username || t('common.guest')
  const avatar = url_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || id}`
  const totalInventoryCount = inventory?.reduce((sum, item) => sum + (item.count || 0), 0) || 0

  return (
    <PageLayout activePage="profile" className="profile-page">
      <div className="profile-content">
        
        {/* ===== USER INFO CARD ===== */}
        <div className="profile-header-card">
          <div className="profile-main-info">
            <div className="profile-avatar-wrapper">
              <img src={avatar} alt="avatar" className="profile-avatar" />
              <div className="profile-level-badge">{level}</div>
            </div>
            
            <div className="profile-text-info">
              <h2 className="profile-name">{displayName}</h2>
              <div className="profile-id-row">
                <span className="profile-id">ID: {id}</span>
                <button 
                  className="copy-id-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(String(id))
                    showNotification('ID copied')
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="profile-actions">
               {/* Language Selector */}
               <div 
                className="profile-action-btn language-btn"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <img src={currentLanguage.flag} alt={currentLanguage.name} className="lang-flag" />
                {showLanguageDropdown && (
                  <div className="language-dropdown">
                    {languages.map((lang) => (
                      <div
                        key={lang.id}
                        className={`language-option ${language === lang.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          changeLanguage(lang.id)
                          setShowLanguageDropdown(false)
                        }}
                      >
                        <img src={lang.flag} alt={lang.name} className="language-flag" />
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="profile-level-section">
            <div className="level-info">
              <span className="level-label">Level {level}</span>
              <span className="level-xp">{xp} / {nextLevelXP} XP</span>
            </div>
            <div className="level-progress-track">
              <div 
                className="level-progress-bar" 
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="profile-stats-grid">
          <div className="stat-card" onClick={() => navigate('/top-20')}>
            <div className="stat-icon-wrapper gold">
              <Crown size={20} />
            </div>
            <div className="stat-content">
               <span className="stat-label">{t('profile.top1') || 'Top 1'}</span>
               <span className="stat-value">{formatAmount(top1Balance)}</span>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => setIsWithdrawModalOpen(true)}>
             <div className="stat-icon-wrapper data">
              <Wallet size={20} />
             </div>
             <div className="stat-content">
               <span className="stat-label">{t('profile.balance') || 'Balance'}</span>
               <span className="stat-value">{formatAmount(user?.balance || 0)}</span>
             </div>
          </div>
        </div>

        {/* ===== PROMO BLOCKS ===== */}
        <div className="profile-promo-blocks">
          {/* Daily Promo */}
          <div className="promo-block daily-gift">
            <div className="promo-block-content">
              <div className="promo-icon-circle">
                <Gift size={24} color="#fff" />
              </div>
              <div className="promo-text">
                <h3>{t('profile.dailyPromo') || 'Daily Promo'}</h3>
                <p>@ggcat_gift</p>
              </div>
            </div>
            <a href="https://t.me/ggcat_gift" target="_blank" rel="noopener noreferrer" className="promo-action-btn white">
              {t('common.subscribe') || 'Subscribe'}
            </a>
          </div>

          {/* Partner Program */}
          <div className="promo-block partner-program">
            <div className="promo-block-content">
               <div className="promo-icon-circle">
                 <Users size={24} color="#fff" />
               </div>
               <div className="promo-text">
                 <h3>{t('nav.partner') || 'Partner Program'}</h3>
                 <p>{t('partner.inviteFriends') || 'Invite friends & earn'}</p>
               </div>
            </div>
            <button onClick={() => navigate('/partner')} className="promo-action-btn white">
               {t('common.goto') || 'Go to'}
            </button>
          </div>
        </div>

        {/* ===== INVENTORY ===== */}
        <div className="inventory-section-new" id="inventory">
          <div className="inventory-header-new">
            <h3>{t('profile.inventory')} <span className="count">{totalInventoryCount}</span></h3>
            <button className="sell-all-btn-new" onClick={() => setIsInventoryModalOpen(true)}>
              {t('profile.sellAll')}
            </button>
          </div>

          <div className="inventory-grid-new">
             {loadingInventory ? (
               <div className="inventory-loading">{t('common.loading')}...</div>
             ) : inventoryPreview.length === 0 ? (
               <div className="inventory-empty-state">
                  <Gift size={32} className="empty-icon" />
                  <p>{t('messages.emptyInventory')}</p>
               </div>
             ) : (
                inventoryPreview.map((item, i) => (
                  <div key={i} className="inventory-item-card">
                    {item.icon?.endsWith('.json') ? (
                      <Player autoplay loop src={item.icon} className="lottie-preview" />
                    ) : (
                      <img src={item.icon} alt={item.name} />
                    )}
                  </div>
                ))
             )}
             {inventoryPreview.length > 0 && (
                <button className="inventory-more-btn" onClick={() => setIsInventoryModalOpen(true)}>
                  <ChevronRight size={24} />
                </button>
             )}
          </div>
        </div>

        {/* ===== SETTINGS ===== */}
        <div className="settings-section-new">
          <h3>{t('profile.settings')}</h3>
          <div className="settings-list-new">
             <div className="setting-row">
                <div className="setting-info">
                   <span className="setting-name">{t('profile.hideLogin')}</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings?.hideLogin}
                    onChange={(e) => updateSettings({ hideLogin: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
             </div>

             <div className="setting-row">
                <div className="setting-info">
                   <span className="setting-name">{t('profile.vibration')}</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings?.vibrationEnabled}
                    onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
             </div>
          </div>
        </div>

        {/* Withdraw Button Fixed Bottom is optional, but user asked for "banner in profile is bad idea" so maybe just a button in flow or stats? 
            User didn't say remove withdraw button. I'll keep it as a main action block or floating.
            Let's put it as a primary button at the bottom of the content.
        */}
        <div className="profile-footer-actions">
           <button 
             className={`main-withdraw-btn ${!withdrawInfo?.can_withdraw ? 'inactive' : ''}`}
             onClick={() => setIsWithdrawModalOpen(true)}
           >
             {t('profile.withdraw')}
           </button>
        </div>

      </div>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        items={inventoryDrops}
        loading={loadingInventory}
      />

      {notification.visible && (
        <div className="notification">
          {notification.message}
        </div>
      )}
      
      <Navigation />
    </PageLayout>
  )
}

export default ProfilePage
