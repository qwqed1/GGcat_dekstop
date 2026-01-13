import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'

import Header from './components/Header'
import Banner from './components/Banner'
import TaskList from './components/TaskList'
import GameCard from './components/GameCard'
import Navigation from './components/Navigation'
import ProfilePage from './components/ProfilePage'
import CrashPage from './components/CrashPage'
import CasesPage from './components/CasesPage'
import PartnerPage from './components/PartnerPage'
import WheelPage from './components/WheelPage'
import Top20Page from './components/Top20Page'
import PvPPage from './components/PvPPage'
import UpgradePage from './components/UpgradePage'
import Preloader from './components/Preloader'
import { initTelegram } from './telegram'
import { CurrencyProvider } from './context/CurrencyContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { useUser } from './context/UserContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { LiveFeedProvider } from './context/LiveFeedContext'
import { FreeSpinProvider, useFreeSpin } from './context/FreeSpinContext'
import { CrashProvider } from './context/CrashContext'
import { useOnlineWs} from './hooks/useOnlineWs'
/* ================= HOME ================= */

function HomePage() {
  const { t } = useLanguage()
  const online = useOnlineWs()
  return (
    <div className="app home-page">
      <Header />

      <main className="main-content">
        <Banner />
        <TaskList />

        <div className="games-section">
          <GameCard title={t('home.roulette')} online={online[1]} />
          <GameCard title={t('home.crash')}    online={online[2]} />
          <GameCard title={t('home.wheel')}    online={online[3]} />
          <GameCard title={t('home.pvp')}      online={online[4]} />
          <GameCard title={t('home.upgrade')}  online={online[4]} />
        </div>
      </main>

      <Navigation />
    </div>
  )
}

/* ================= APP ================= */

function AppContent() {
  const { loading: appDataLoading, progress, loadAllData } = useAppData()
  const { user } = useUser()
  const { initToday } = useFreeSpin()

  // глобальная загрузка данных
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 🔥 ИНИЦИАЛИЗАЦИЯ ДНЯ — СТРОГО ПОСЛЕ USER
  useEffect(() => {
    if (!user?.id) return

    initToday(user.id)
  }, [user?.id, initToday])



  if (appDataLoading) {
    return <Preloader progress={progress} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/crash" element={<CrashPage />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/wheel" element={<WheelPage />} />
        <Route path="/top-20" element={<Top20Page />} />
        <Route path="/pvp" element={<PvPPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
      </Routes>
    </BrowserRouter>
  )
}


function App() {
  const { initUser, loading } = useUser()

  useEffect(() => {
    initTelegram()
  }, [])
  useEffect(() => {
    const preventZoom = (e) => {
      // Ctrl + колесо
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }
  
    const preventKeyZoom = (e) => {
      // Ctrl + + / - / =
      if (
        e.ctrlKey &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
      ) {
        e.preventDefault()
      }
    }
  
    window.addEventListener('wheel', preventZoom, { passive: false })
    window.addEventListener('keydown', preventKeyZoom)
  
    return () => {
      window.removeEventListener('wheel', preventZoom)
      window.removeEventListener('keydown', preventKeyZoom)
    }
  }, [])
  
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return
  
    tg.ready()
  
    // 🔥 ВСЕГДА пытаемся раскрыть
    tg.expand()
  
    // 🔁 повтор при изменении viewport
    tg.onEvent('viewportChanged', () => {
      tg.expand()
    })
  
    // 🔁 повтор при возврате в фокус
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        tg.expand()
      }
    })
  
    if (tg.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user
  
      initUser({
        tg_id: String(tgUser.id),
        username: tgUser.username || `tg_${tgUser.id}`,
        firstname: tgUser.first_name || 'Guest',
        photo_url: tgUser.photo_url || null,
      })
    } else {
      initUser({
        tg_id: 'local',
        username: 'localuser',
        firstname: 'Guest',
        photo_url: null,
      })
    }
  }, [])
  

  // пока идёт инициализация пользователя
  if (loading) {
    return <Preloader progress={0} />
  }


    return (
      <LanguageProvider>
        <FreeSpinProvider>
          <CurrencyProvider>
            <AppDataProvider>
              <LiveFeedProvider>
                <CrashProvider>
                  <AppContent />
                </CrashProvider>
              </LiveFeedProvider>
            </AppDataProvider>
          </CurrencyProvider>
        </FreeSpinProvider>
      </LanguageProvider>
    )
  }
  
  export default App