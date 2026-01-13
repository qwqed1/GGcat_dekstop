import { useNavigate } from 'react-router-dom'
import './Navigation.css'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useEffect, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { useFreeSpin } from '../context/FreeSpinContext'
import { initDay } from '../api/roulette'


function Navigation({ activePage = 'home' }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useUser()
  const { canFreeSpin, loading, refreshFreeSpin } = useFreeSpin()

  const hasFreeSpins = canFreeSpin && !loading

  const didInitRef = useRef(false)



  return (
    <nav className={`navigation ${hasFreeSpins ? '' : 'navigation--flat'}`}>
      <div 
        className={`nav-item ${activePage === 'cases' ? 'active' : ''}`}
        onClick={() => navigate('/cases')}
      >
        {activePage === 'cases' ? (
          <div className="nav-icon-wrapper icon-active">
            <img src="/image/mdi_gift (1).svg" alt="Cases" className="nav-icon" />
          </div>
        ) : (
          <div className="nav-icon-wrapper">
            <img src="/image/mdi_gift.svg" alt="Cases" className="nav-icon" />
          </div>
        )}
        <span className="nav-label">{t('nav.cases')}</span>
      </div>
      <div 
        className={`nav-item ${activePage === 'crash' ? 'active' : ''}`}
        onClick={() => navigate('/crash')}
      >
        {activePage === 'crash' ? (
          <div className="nav-icon-wrapper icon-active">
            <img src="/image/ion_rocket (1).svg" alt="Crash" className="nav-icon" />
          </div>
        ) : (
          <div className="nav-icon-wrapper">
            <img src="/image/ion_rocket.svg" alt="Crash" className="nav-icon" />
          </div>
        )}
        <span className="nav-label">{t('nav.crash')}</span>
      </div>
      <div 
        className={`nav-item center-item ${activePage === 'wheel' ? 'active' : ''}`}
        onClick={() => navigate('/wheel')}
      >
        {hasFreeSpins ? (
          <div className="baraban-container">
            <img src="/image/Union.svg" alt="Free" className="union-icon" />
            <img src="/image/Baraban.png" alt="Baraban" className="baraban-icon" />
          </div>
        ) : activePage === 'wheel' ? (
          <div className="roulette-icon-active">
            <img src="/image/Baraban_Off.svg" alt="Рулетка" className="nav-icon roulette-glow" />
          </div>
        ) : (
          <div className="nav-icon-wrapper">
            <img src="/image/Baraban_Off.svg" alt="Рулетка" className="nav-icon" />
          </div>
        )}
        {!hasFreeSpins && <span className="nav-label">{t('nav.roulette')}</span>}
      </div>
      <div 
        className={`nav-item ${activePage === 'pvp' ? 'active' : ''}`}
        onClick={() => navigate('/pvp')}
      >
        {activePage === 'pvp' ? (
          <div className="nav-icon-wrapper icon-active">
            <img src="/image/material-symbols_swords-rounded-active.svg" alt="PvP" className="nav-icon" />
          </div>
        ) : (
          <div className="nav-icon-wrapper">
            <img src="/image/material-symbols_swords-rounded.svg" alt="PvP" className="nav-icon" />
          </div>
        )}
        <span className="nav-label">{t('nav.pvp')}</span>
      </div>
      <div 
        className={`nav-item ${activePage === 'upgrade' ? 'active' : ''}`}
        onClick={() => navigate('/upgrade')}
      >
        {activePage === 'upgrade' ? (
          <div className="nav-icon-wrapper icon-active">
            <img src="/image/pajamas_upgrade-active.svg" alt="Upgrade" className="nav-icon" />
          </div>
        ) : (
          <div className="nav-icon-wrapper">
            <img src="/image/pajamas_upgrade.svg" alt="Upgrade" className="nav-icon" />
          </div>
        )}
        <span className="nav-label">{t('nav.upgrade')}</span>
      </div>
    </nav>
  )
}

export default Navigation
