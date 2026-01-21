import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
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
      icon: Home,
      isLucide: true,
    },
    {
      id: 'cases',
      path: '/cases',
      label: t('nav.cases'),
      icon: '/image/mdi_gift.svg',
      iconActive: '/image/mdi_gift (1).svg',
      isLucide: false,
    },
    {
      id: 'crash',
      path: '/crash',
      label: t('nav.crash'),
      icon: '/image/ion_rocket.svg',
      iconActive: '/image/ion_rocket (1).svg',
      isLucide: false,
    },
    {
      id: 'wheel',
      path: '/wheel',
      label: t('nav.roulette'),
      icon: '/image/Baraban_Off.svg',
      iconActive: '/image/Baraban_Off.svg',
      hasBadge: hasFreeSpins,
      isLucide: false,
    },
    {
      id: 'pvp',
      path: '/pvp',
      label: t('nav.pvp'),
      icon: '/image/material-symbols_swords-rounded.svg',
      iconActive: '/image/material-symbols_swords-rounded-active.svg',
      isLucide: false,
    },
    {
      id: 'upgrade',
      path: '/upgrade',
      label: t('nav.upgrade'),
      icon: '/image/pajamas_upgrade.svg',
      iconActive: '/image/pajamas_upgrade-active.svg',
      isLucide: false,
    },
  ]

  const extraItems = [
    {
      id: 'partner',
      path: '/partner',
      label: t('nav.partner') || 'Partner',
      icon: Users,
      isLucide: true,
    },
    {
      id: 'top20',
      path: '/top-20',
      label: t('nav.top20') || 'Top 20',
      icon: Trophy,
      isLucide: true,
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
          {!isCollapsed && (
             <div className="sidebar-section-title">{t('sidebar.games') || 'Games'}</div>
          )}
         
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const active = isActive(item.path)
              
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <span className="sidebar-icon">
                    {item.isLucide ? (
                      <item.icon 
                        size={24} 
                        color={active ? "#BBFD44" : "#9CA3AF"}
                        strokeWidth={2}
                      />
                    ) : (
                      <img 
                        src={active ? item.iconActive : item.icon} 
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
              )
            })}
            
            {/* Separator line */}
            <div className="sidebar-divider" />
            
            {extraItems.map((item) => {
              const active = isActive(item.path)
              
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <span className="sidebar-icon">
                    <item.icon 
                      size={24} 
                      color={active ? "#BBFD44" : "#9CA3AF"}
                      strokeWidth={2}
                    />
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <button className="sidebar-toggle" onClick={onToggle}>
        {isCollapsed ? (
            <ChevronRight size={20} color="#fff" />
        ) : (
            <ChevronLeft size={20} color="#fff" />
        )}
      </button>
    </aside>
  )
}

export default Sidebar
