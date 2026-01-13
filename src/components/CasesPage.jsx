import { useState } from 'react'
import './CasesPage.css'

import Header from './Header'
import Navigation from './Navigation'
import CaseModal from './CaseModal'

import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useAppData } from '../context/AppDataContext'
import { Player } from '@lottiefiles/react-lottie-player'

import { useLiveFeed } from '../context/LiveFeedContext'


import AsyncImage from './AsyncImage'

/* ===== LIVE DROPS (пока мок, можно позже заменить WS) ===== */



function CasesPage() {
  const { selectedCurrency, formatAmount } = useCurrency()
  const { t } = useLanguage()
  const { cases } = useAppData()

  /* ===== STATE ===== */
  const [activeTab, setActiveTab] = useState('paid')
  const [selectedCase, setSelectedCase] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { liveDrops } = useLiveFeed()
  
  

  /* ===== SPLIT PAID / FREE ===== */
  const paidCases = cases.filter((c) => Number(c.price) > 0)
  const freeCases = cases.filter((c) => Number(c.price) === 0)

  const visibleCases = activeTab === 'paid' ? paidCases : freeCases

  /* ===== HANDLERS ===== */
  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCase(null)
  }

  return (
    <div className="cases-page">
      <Header />

      <main className="cases-main">
        {/* ===== LIVE FEED ===== */}
        <div className="live-feed-bar">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">{t('cases.live')}</span>
          </div>
          <div className="live-items-wrapper">
            <div className="live-items-track">
              {/* Элементы появляются справа и движутся влево */}
              {liveDrops.map((drop, idx) => (
                <div key={`${drop.id}-${idx}`} className="live-item">
                  {drop.type === 'animation' && drop.animation ? (
                    <Player
                      autoplay
                      loop
                      src={drop.animation}
                      className="live-item-animation"
                    />
                  ) : (
                    <img
                      src={drop.image || '/image/mdi_gift.svg'}
                      alt={drop.name}
                      className="live-item-image"
                      onError={(e) => { e.target.src = '/image/mdi_gift.svg' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="cases-tabs">
          <button
            className={`cases-tab ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            {t('cases.paid')}
          </button>
          <button
            className={`cases-tab ${activeTab === 'free' ? 'active' : ''}`}
            onClick={() => setActiveTab('free')}
          >
            {t('cases.free')}
          </button>
        </div>

        {/* ===== CASES GRID ===== */}
        <div className="cases-grid">
          {visibleCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="case-card-wrapper"
              onClick={() => handleCaseClick(caseItem)}
            >
              <div className="case-card">
                {/* Free badge remains top-left if free, but price moves down */}
                {Number(caseItem.price) === 0 && (
                  <div className="case-price-badge case-price-badge--free">
                    {t('common.free')}
                  </div>
                )}

                {/* IMAGE */}
                <AsyncImage
                  src={caseItem.main_image}
                  alt={caseItem.name}
                  className="case-item-image"
                />
              </div>

              {/* PRICE / FREE BADGE */}
              {Number(caseItem.price) > 0 && (
                <div className="case-price-below">
                  <img
                    src={selectedCurrency.icon}
                    alt={selectedCurrency.id}
                    className="price-diamond"
                  />
                  <span>{formatAmount(caseItem.price)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Navigation activePage="cases" />

      <CaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        caseData={selectedCase}
        isPaid={Number(selectedCase?.price) > 0}
      />
    </div>
  )
}

export default CasesPage
