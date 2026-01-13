import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { translations } from '../locales/translations'

const LanguageContext = createContext(null)

const LANGUAGES = [
  { id: 'ru', name: 'Русский', flag: '/image/twemoji_flag-russia.png' },
  { id: 'en', name: 'English', flag: '/image/twemoji_flag-uk.png' },
]

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('ggcat_language') || 'ru'
    } catch {
      return 'ru'
    }
  })

  const changeLanguage = useCallback((langId) => {
    setLanguage(langId)
    try {
      localStorage.setItem('ggcat_language', langId)
    } catch (err) {
      console.error('Failed to save language:', err)
    }
  }, [])

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }
    
    let result = value || key
    
    // Заменяем {{param}} на значения из params
    if (typeof result === 'string' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([param, val]) => {
        result = result.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), val)
      })
    }
    
    return result
  }, [language])

  const currentLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.id === language) || LANGUAGES[0]
  }, [language])

  const value = useMemo(() => ({
    language,
    changeLanguage,
    t,
    languages: LANGUAGES,
    currentLanguage,
  }), [language, changeLanguage, t, currentLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
