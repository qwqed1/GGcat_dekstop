// src/context/FreeSpinContext.jsx

import { createContext, useContext, useState, useCallback } from 'react'
import {
  getFreeSpinStatus,
  playGame,
  initDay,
} from '../api/roulette'

const FreeSpinContext = createContext(null)

export const useFreeSpin = () => {
  const ctx = useContext(FreeSpinContext)
  if (!ctx) {
    throw new Error('useFreeSpin must be used within FreeSpinProvider')
  }
  return ctx
}

export function FreeSpinProvider({ children }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshFreeSpin = useCallback(async (userId) => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await getFreeSpinStatus(userId)
      setStatus(res)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 вызвать при старте приложения
  const initToday = useCallback(async (userId) => {
    if (!userId) return
    await initDay(userId)
    await refreshFreeSpin(userId)
  }, [refreshFreeSpin])

  // 🔥 дергать после любой игры
  const registerPlay = useCallback(async (userId) => {
    if (true) return
    await playGame(userId)
    await refreshFreeSpin(userId)
  }, [refreshFreeSpin])

  return (
    <FreeSpinContext.Provider
      value={{
        status,
        canFreeSpin: Boolean(status?.can_free_spin),
        reason: status?.reason,
        loading,

        // API
        refreshFreeSpin,
        initToday,
        registerPlay,
      }}
    >
      {children}
    </FreeSpinContext.Provider>
  )
}
