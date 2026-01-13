import { createContext, useContext, useState, useCallback } from 'react'
import { getCases } from '../api/cases'

const AppDataContext = createContext(null)

export const useAppData = () => useContext(AppDataContext)

export function AppDataProvider({ children }) {
  const [cases, setCases] = useState([])
  const [rates, setRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const preloadImages = useCallback(async (imageUrls) => {
    const promises = imageUrls.map((url) => {
      return new Promise((resolve) => {
        if (!url) {
          resolve()
          return
        }
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve
        img.src = url
      })
    })
    await Promise.all(promises)
  }, [])

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setProgress(10)

      const ratesResponse = await fetch(import.meta.env.VITE_API_URL + '/rates')
      const ratesData = await ratesResponse.json()
      setRates(ratesData)
      setProgress(30)

      const casesData = await getCases()
      setCases(casesData)
      setProgress(50)

      const caseImages = casesData.map((c) => c.main_image).filter(Boolean)
      await preloadImages(caseImages)
      setProgress(70)

      const staticImages = [
        '/image/ton_symbol.svg',
        '/image/Coin-Icon-one.svg',
        '/image/telegram-star.svg',
        '/image/Coin-Icon-three.svg',
        '/image/Pumpkin.webp',
        '/image/Red_Menace.webp',
        '/image/Neon_Fuel.webp',
        '/image/Midas_Pepe.webp',
        '/image/Mask.webp',
        '/image/La_Baboon.webp',
        '/image/Inferno.webp',
        '/image/Huggy_Bear.webp',
        '/image/Froggy.webp',
        '/image/Cozy_Galaxy.webp',
        '/image/Christmas.webp',
      ]
      await preloadImages(staticImages)
      setProgress(100)

      setLoading(false)
    } catch (err) {
      console.error('Failed to preload data:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [preloadImages])

  return (
    <AppDataContext.Provider
      value={{
        cases,
        rates,
        loading,
        progress,
        error,
        loadAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}
