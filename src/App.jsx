import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import './components/ModalDesktop.css'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Banner from './components/Banner'
import TaskList from './components/TaskList'
import GameCard from './components/GameCard'
import Navigation from './components/Navigation'
import PageLayout from './components/PageLayout'
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
    <PageLayout activePage="home">
      <div className="home-content">
        <div className="home-top-row">
          <div className="home-banner-wrapper">
            <Banner />
          </div>
          <div className="home-promo-wrapper">
            <TaskList />
          </div>
        </div>

        <h2>{t('home.games')}</h2>
        <div className="games-section">
          <GameCard title={t('home.roulette')} online={online[1]} />
          <GameCard title={t('home.crash')}    online={online[2]} />
          <GameCard title={t('home.wheel')}    online={online[3]} />
          <GameCard title={t('home.pvp')}      online={online[4]} />
          <GameCard title={t('home.upgrade')}  online={online[4]} />
        </div>
      </div>
    </PageLayout>
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
  const { loading } = useUser()

  // пока идёт инициализация пользователя
  if (loading) {
    return <Preloader progress={50} />
  }

    return (
      <>
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
      </>
    )
  }
  
  export default App