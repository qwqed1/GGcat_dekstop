import { useState } from 'react'
import './CasesPage.css'
import PageLayout from './PageLayout'
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
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)
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
    <PageLayout activePage="cases" className="cases-page">
      <div className="cases-content">
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

        {/* ===== HOW CASES WORK ===== */}
        <div className={`how-cases-work ${isHowItWorksOpen ? 'expanded' : 'collapsed'}`}>
          <div className="how-cases-header" onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}>
            <svg className="how-cases-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7v1m0 8v1m0-5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{t('cases.howItWorks')}</span>
            <svg className="how-cases-chevron" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="how-cases-content">
            <div className="how-cases-steps">
            <div className="how-case-step">
              <div className="step-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="step-icon">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="step-number">1</span>
              </div>
              <h4>{t('cases.step1Title')}</h4>
              <p>{t('cases.step1Desc')}</p>
            </div>

            <div className="how-case-step">
              <div className="step-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="step-icon">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 15h4M7 11h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="step-number">2</span>
              </div>
              <h4>{t('cases.step2Title')}</h4>
              <p>{t('cases.step2Desc')}</p>
            </div>

            <div className="how-case-step">
              <div className="step-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="step-icon">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12L12 21M12 12L4 7.5M12 12L20 7.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="step-number">3</span>
              </div>
              <h4>{t('cases.step3Title')}</h4>
              <p>{t('cases.step3Desc')}</p>
            </div>

            <div className="how-case-step">
              <div className="step-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" className="step-icon">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="step-number">4</span>
              </div>
              <h4>{t('cases.step4Title')}</h4>
              <p>{t('cases.step4Desc')}</p>
            </div>
          </div>

          <div className="useful-tips">
            <div className="useful-tips-header">
              <svg viewBox="0 0 24 24" fill="none" className="tips-icon">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('cases.usefulTips')}</span>
            </div>
            <ul className="tips-list">
              <li>{t('cases.tip1')}</li>
              <li>{t('cases.tip2')}</li>
              <li>{t('cases.tip3')}</li>
            </ul>
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
      </div>

      <CaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        caseData={selectedCase}
        isPaid={Number(selectedCase?.price) > 0}
      />
    </PageLayout>
  )
}

export default CasesPage
