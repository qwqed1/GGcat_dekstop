import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useUser } from './UserContext'

const CurrencyContext = createContext(null)

/* ===== STATIC CURRENCIES (UI only) ===== */
const STATIC_CURRENCIES = [
  { id: 'coins', icon: '/image/ton_symbol.svg' },
  { id: 'gems', icon: '/image/Coin-Icon-one.svg' },
  { id: 'stars', icon: '/image/telegram-star.svg' },
  { id: 'shields', icon: '/image/Coin-Icon-three.svg' },
]

export function CurrencyProvider({ children }) {  
  const { user } = useUser()




  // 🔹 базовый баланс ВСЕГДА в TON
  const BASE_BALANCE = Number(user?.balance) || 0

  const [rates, setRates] = useState({})
  const [selectedCurrency, setSelectedCurrency] = useState(STATIC_CURRENCIES[0])
  const [hasFreeSpins, setHasFreeSpins] = useState(true)

  const NO_DECIMAL_CURRENCIES = ['stars', 'gems'] // звёзды и gems без дробной части


  const formatNumber = (value, decimals = 2) => {
    const floored =
      decimals === 0 ? Math.floor(value) : Number(value.toFixed(decimals))
  
    return floored
      .toLocaleString('ru-RU')
      .replace(/\s/g, '.') // 👈 ключевая строка
  }
  
  

  /* ===== LOAD RATES FROM BACKEND ===== */
  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/rates')
      .then((res) => res.json())
      .then(setRates)
      .catch(() => setRates({}))
  }, [])

  /* ===== CURRENCY OPTIONS (FOR HEADER DROPDOWN) ===== */
  const currencyOptions = useMemo(() => {
    return STATIC_CURRENCIES.map((c) => {
      const rate = rates[c.id]
  
      if (rate == null) {
        return { ...c, rate: null, amount: '—' }
      }
  
      const rawAmount = BASE_BALANCE / rate
      const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(c.id)
  
      return {
        ...c,
        rate,
        amount: isNoDecimal
          ? formatNumber(rawAmount, 0)
          : formatNumber(rawAmount, 2),
      }
    })
  }, [rates, BASE_BALANCE])
  

  /* ===== KEEP SELECTED CURRENCY IN SYNC ===== */
  const resolvedSelectedCurrency = useMemo(() => {
    return (
      currencyOptions.find((c) => c.id === selectedCurrency.id) ||
      currencyOptions[0]
    )
  }, [currencyOptions, selectedCurrency.id])

  /* ===== FORMAT ANY AMOUNT (TON → SELECTED CURRENCY) ===== */
  const formatAmount = (amount) => {
    if (!resolvedSelectedCurrency?.rate) return '—'
    const converted = Number(amount) / resolvedSelectedCurrency.rate
    const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(resolvedSelectedCurrency.id)
    return isNoDecimal ? Math.floor(converted).toString() : converted.toFixed(2)
  }

  /* ===== FORMAT WINNING AMOUNT (TON → SELECTED CURRENCY) ===== */
  const formatWinAmount = (amount) => {
    if (!resolvedSelectedCurrency?.rate) return '—'
    const converted = Number(amount) / resolvedSelectedCurrency.rate
    const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(resolvedSelectedCurrency.id)
    return isNoDecimal ? Math.floor(converted).toString() : converted.toFixed(2)
  }

  const value = useMemo(
    () => ({
      currencyOptions,
      selectedCurrency: resolvedSelectedCurrency,
      setSelectedCurrency,
      hasFreeSpins,
      setHasFreeSpins,
      formatAmount, // 👈 ВАЖНО
      formatWinAmount, // 👈 ВАЖНО для выигрышей
    }),
    [currencyOptions, resolvedSelectedCurrency, hasFreeSpins]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
