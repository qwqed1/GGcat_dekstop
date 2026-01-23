import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import InventoryModal from './InventoryModal'
import { 
  Plus, 
  ArrowUpRight, 
  Package, 
  ChevronDown, 
  Wallet,
  Menu
} from 'lucide-react'

const accountTypes = [
  { id: 'usdt', name: 'USDT TON', icon: '💎', amount: '1.22' },
  { id: 'btc', name: 'BTC', icon: '₿', amount: '0.0012' },
  { id: 'eth', name: 'ETH', icon: 'Ξ', amount: '0.15' },
  { id: 'ton', name: 'TON', icon: '💠', amount: '25.00' },
]

const gameCurrencies = [
  { id: 'coins', name: 'Монеты', icon: '🪙', amount: '1.22' },
  { id: 'gems', name: 'Кристаллы', icon: '💎', amount: '500' },
  { id: 'stars', name: 'Звезды', icon: '⭐', amount: '120' },
]

function Header() {
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user } = useUser()
  const { t } = useLanguage()

const {
  currencyOptions,
  selectedCurrency,
  setSelectedCurrency,
  hasFreeSpins,
  setHasFreeSpins,
} = useCurrency()

  const [showNotification, setShowNotification] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [showGameDropdown, setShowGameDropdown] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accountTypes[0])
  const [selectedGameCurrency, setSelectedGameCurrency] = useState(gameCurrencies[0])
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const visibleCurrencies = currencyOptions.filter((currency) => currency.id !== selectedCurrency.id)

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency)
    setIsDropdownOpen(false)
  }

  return (
    <header className="header">
      <Link className="logo" to="/" aria-label="На главную">
        <img src="/image/Text.svg" alt="GG Cat logo" />
      </Link>

      {/* Action Buttons */}
      <div className="header-actions">
        <button className="header-btn header-btn-deposit" onClick={() => setIsDepositModalOpen(true)}>
          <span className="header-btn-icon"><Plus size={18} strokeWidth={3} /></span>
          <span className="header-btn-text">{t('header.deposit')}</span>
        </button>
        <button className="header-btn header-btn-withdraw" onClick={() => setIsWithdrawModalOpen(true)}>
          <span className="header-btn-icon"><ArrowUpRight size={18} strokeWidth={2.5} /></span>
          <span className="header-btn-text">{t('header.withdraw')}</span>
        </button>
        <button className="header-btn header-btn-inventory" onClick={() => navigate('/profile#inventory')}>
          <span className="header-btn-icon"><Package size={18} /></span>
          <span className="header-btn-text">{t('header.inventory')}</span>
        </button>
      </div>
      
      <div className="header-right">
        <div className="balance-container">
          <div className={`balance-box ${isDropdownOpen ? 'open' : ''}`}>
             <div className="balance-info-wrapper">
              <div 
                className="balance-info" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="currency-icon">
                  <img src={selectedCurrency.icon} alt={selectedCurrency.id} />
                </span>
                <span className="balance-amount">{selectedCurrency.amount}</span>
                <span className={`balance-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
            <button
  className="plus-btn"
  onClick={() => setIsDepositModalOpen(true)}
>
              <Plus size={16} color="#000" strokeWidth={3} />
            </button>

            {isDropdownOpen && (
              <div className="currency-dropdown">
                {visibleCurrencies.map((currency) => (
                  <div 
                    key={currency.id}
                    className={`currency-option ${selectedCurrency.id === currency.id ? 'selected' : ''}`}
                    onClick={() => handleCurrencySelect(currency)}
                  >
                    <span className="currency-icon">
                      <img src={currency.icon} alt={currency.id} />
                    </span>
                    <span className="currency-amount">{currency.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        
        <div className="avatar" onClick={() => navigate('/profile')}>
        <img
  src={
    user?.url_image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`
  }
  alt="avatar"
/>

        </div>
      </div>

      {/* Balance Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="balance-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t('header.balance')}</h2>
            
            <div className="account-cards">
              {/* Account Type Card */}
              <div 
                className={`account-card ${activeAccountType === 'usdt' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAccountType('usdt')
                  setShowGameDropdown(false)
                  setShowAccountDropdown(!showAccountDropdown)
                }}
              >
                <div className="account-label">
                  {t('header.account')} • {selectedAccount.name}
                  <span className={`account-arrow ${showAccountDropdown ? 'open' : ''}`}><ChevronDown size={14} /></span>
                </div>
                <div className="account-balance">
                  <span className="account-icon">{selectedAccount.icon}</span>
                  <span>{selectedAccount.amount}</span>
                </div>
                
                {showAccountDropdown && (
                  <div className="modal-dropdown">
                    {accountTypes.map((acc) => (
                      <div 
                        key={acc.id}
                        className={`modal-dropdown-item ${selectedAccount.id === acc.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAccount(acc)
                          setShowAccountDropdown(false)
                        }}
                      >
                        <span className="dropdown-icon">{acc.icon}</span>
                        <span>{acc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Game Currency Card */}
              <div 
                className={`account-card ${activeAccountType === 'game' ? 'active' : ''}`}
                onClick={() => {
                  setActiveAccountType('game')
                  setShowAccountDropdown(false)
                  setShowGameDropdown(!showGameDropdown)
                }}
              >
                <div className="account-label">
                  {selectedGameCurrency.name}
                  <span className={`account-arrow ${showGameDropdown ? 'open' : ''}`}><ChevronDown size={14} /></span>
                </div>
                <div className="account-balance">
                  <span className="account-icon">{selectedGameCurrency.icon}</span>
                  <span>{selectedGameCurrency.amount}</span>
                </div>
                
                {showGameDropdown && (
                  <div className="modal-dropdown">
                    {gameCurrencies.map((curr) => (
                      <div 
                        key={curr.id}
                        className={`modal-dropdown-item ${selectedGameCurrency.id === curr.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGameCurrency(curr)
                          setShowGameDropdown(false)
                        }}
                      >
                        <span className="dropdown-icon">{curr.icon}</span>
                        <span>{curr.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bonus-card">
              <div className="bonus-info">
                <div className="bonus-label">{t('header.bonusAccount')}</div>
                <div className="bonus-balance">
                  <span className="account-icon">💎</span>
                  <span>1.22</span>
                </div>
              </div>
              <span className="bonus-arrow">›</span>
            </div>
            
            <button className="wallet-btn" onClick={() => {}}>Wallet</button>
          </div>
        </div>
      )}
    {/* Notification */}
      {showNotification && (
        <div className="notification">
          {t('header.bonusActivated')}
        </div>
      )}

<DepositModal
  isOpen={isDepositModalOpen}
  onClose={() => setIsDepositModalOpen(false)}
/>

<WithdrawModal
  isOpen={isWithdrawModalOpen}
  onClose={() => setIsWithdrawModalOpen(false)}
/>

<InventoryModal
  isOpen={isInventoryModalOpen}
  onClose={() => setIsInventoryModalOpen(false)}
/>

    </header>
  )
}

export default Header
