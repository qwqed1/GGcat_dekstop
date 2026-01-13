import { useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'
import { useLanguage } from '../context/LanguageContext'
import { useFreeSpin } from '../context/FreeSpinContext'

function Sidebar({ isCollapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { canFreeSpin, loading } = useFreeSpin()
  const hasFreeSpins = canFreeSpin && !loading

  const menuItems = [
    {
      id: 'home',
      path: '/',
      label: t('nav.home') || 'Home',
      isHomeIcon: true,
    },
    {
      id: 'cases',
      path: '/cases',
      label: t('nav.cases'),
      icon: '/image/mdi_gift.svg',
      iconActive: '/image/mdi_gift (1).svg',
    },
    {
      id: 'crash',
      path: '/crash',
      label: t('nav.crash'),
      icon: '/image/ion_rocket.svg',
      iconActive: '/image/ion_rocket (1).svg',
    },
    {
      id: 'wheel',
      path: '/wheel',
      label: t('nav.roulette'),
      icon: '/image/Baraban_Off.svg',
      iconActive: '/image/Baraban_Off.svg',
      hasBadge: hasFreeSpins,
    },
    {
      id: 'pvp',
      path: '/pvp',
      label: t('nav.pvp'),
      icon: '/image/material-symbols_swords-rounded.svg',
      iconActive: '/image/material-symbols_swords-rounded-active.svg',
    },
    {
      id: 'upgrade',
      path: '/upgrade',
      label: t('nav.upgrade'),
      icon: '/image/pajamas_upgrade.svg',
      iconActive: '/image/pajamas_upgrade-active.svg',
    },
    {
      id: 'partner',
      path: '/partner',
      label: t('nav.partner') || 'Partner',
      isPartnerIcon: true,
    },
    {
      id: 'top20',
      path: '/top-20',
      label: t('nav.top20') || 'Top 20',
      isTopIcon: true,
    },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNavClick = (path) => {
    navigate(path)
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('sidebar.games') || 'Games'}</div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="sidebar-icon">
                  {item.isHomeIcon ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive(item.path) ? "#BBFD44" : "#9CA3AF"}>
                      <path d="M12 3L4 9V21H9V14H15V21H20V9L12 3Z"/>
                    </svg>
                  ) : item.isPartnerIcon ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive(item.path) ? "#BBFD44" : "#9CA3AF"}>
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  ) : item.isTopIcon ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive(item.path) ? "#BBFD44" : "#9CA3AF"}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  ) : (
                    <img 
                      src={isActive(item.path) ? item.iconActive : item.icon} 
                      alt={item.label} 
                    />
                  )}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {item.hasBadge && <span className="sidebar-badge">FREE</span>}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <button className="sidebar-toggle" onClick={onToggle}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path 
            d={isCollapsed ? "M7 4L13 10L7 16" : "M13 4L7 10L13 16"} 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </aside>
  )
}

export default Sidebar
