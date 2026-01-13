import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { WS_BASE_URL } from '../config/ws'

const WS_URL = `${WS_BASE_URL}/ws/crash?token=supersecret`
const RECONNECT_DELAY = 2000
const HEARTBEAT_INTERVAL = 30000

const initialHistoryValues = [1.0, 1.2, 4.96, 5.42, 8.5, 4.95, 4.0]
const initialHistory = initialHistoryValues.map(value => ({ value, isPending: false }))

const CrashContext = createContext(null)

export function CrashProvider({ children }) {
  const [gameState, setGameState] = useState('countdown')
  const [countdown, setCountdown] = useState(null)
  const [multiplier, setMultiplier] = useState(1.0)
  const [coefficientHistory, setCoefficientHistory] = useState(initialHistory)
  const [roundId, setRoundId] = useState(null)
  const [connected, setConnected] = useState(false)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const isUnmountedRef = useRef(false)
  const prevGameState = useRef(null)
  const handleMessageRef = useRef(null)
  const subscribersRef = useRef(new Set())

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'ping' }))
      }
    }, HEARTBEAT_INTERVAL)
  }, [])

  const handleMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'new_round': {
        setRoundId(msg.round_id)
        setGameState('countdown')
        setMultiplier(1.0)
        
        if (msg.betting_ends_at) {
          const now = Date.now() / 1000
          const left = Math.max(0, Math.ceil(msg.betting_ends_at - now))
          setCountdown(left)
        }
        break
      }
      
      case 'state': {
        if (msg.round_id) {
          setRoundId(msg.round_id)
        }
        
        if (msg.phase === 'betting') {
          setGameState('countdown')
          if (msg.betting_ends_at) {
            const now = Date.now() / 1000
            const left = Math.max(0, Math.ceil(msg.betting_ends_at - now))
            setCountdown(left)
          }
        }
        
        if (msg.phase === 'running') {
          setGameState('flying')
          setMultiplier(msg.multiplier ?? 1)
        }
        
        if (msg.phase === 'crashed') {
          setGameState('postflight')
        }
        break
      }
      
      case 'round_start': {
        setGameState('flying')
        if (msg.round_id) {
          setRoundId(msg.round_id)
        }
        break
      }
      
      case 'tick': {
        if (!roundId && msg.round_id) {
          setRoundId(msg.round_id)
        }
        if (gameState !== 'flying') {
          setGameState('flying')
        }
        setMultiplier(msg.multiplier)
        break
      }
      
      case 'crash': {
        setMultiplier(msg.multiplier)
        setGameState('postflight')
        break
      }
    }
  }, [gameState, roundId])

  // Обновляем ref при каждом рендере
  useEffect(() => {
    handleMessageRef.current = handleMessage
  })

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return
    
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'pong') return
        handleMessageRef.current?.(msg)
        // Уведомляем всех подписчиков
        subscribersRef.current.forEach(callback => callback(msg))
      } catch {
        console.warn('Bad WS message', event.data)
      }
    }

    ws.onerror = (error) => {
      console.error('Crash WS error:', error)
    }

    ws.onclose = () => {
      setConnected(false)
      clearTimers()
      
      if (!isUnmountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, RECONNECT_DELAY)
      }
    }
  }, [startHeartbeat, clearTimers])

  // Обратный отсчёт
  useEffect(() => {
    if (gameState !== 'countdown') return
    if (countdown === null) return

    const timer = setInterval(() => {
      setCountdown(c => (c !== null ? Math.max(0, c - 1) : null))
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, countdown])

  // Обновление истории коэффициентов
  useEffect(() => {
    const previousState = prevGameState.current

    if (gameState === 'countdown' && previousState !== 'countdown') {
      setCoefficientHistory(prevHistory => {
        if (prevHistory[0]?.isPending || prevHistory[0]?.isLive) {
          return prevHistory
        }
        const updatedHistory = [{ value: null, isPending: true, isLive: false }, ...prevHistory]
        return updatedHistory.slice(0, 14)
      })
    }

    if (gameState === 'flying' && previousState !== 'flying') {
      setCoefficientHistory(prevHistory => {
        const updatedHistory = [...prevHistory]
        if (updatedHistory[0]?.isPending) {
          updatedHistory[0] = { value: 1.0, isPending: false, isLive: true }
        } else if (!updatedHistory[0]?.isLive) {
          updatedHistory.unshift({ value: 1.0, isPending: false, isLive: true })
        }
        return updatedHistory.slice(0, 14)
      })
    }

    prevGameState.current = gameState
  }, [gameState])

  // Фиксируем коэффициент после краша
  useEffect(() => {
    if (gameState === 'postflight') {
      setCoefficientHistory(prevHistory => {
        const nextValue = Number(multiplier.toFixed(2))
        const updatedHistory = [...prevHistory]
        if (updatedHistory[0]?.isLive) {
          updatedHistory[0] = { value: nextValue, isPending: false, isLive: false }
        } else if (updatedHistory[0]?.isPending) {
          updatedHistory[0] = { value: nextValue, isPending: false }
        } else {
          updatedHistory.unshift({ value: nextValue, isPending: false })
        }
        return updatedHistory.slice(0, 14)
      })
    }
  }, [gameState, multiplier])

  // Подключаемся к WebSocket при монтировании
  useEffect(() => {
    isUnmountedRef.current = false
    connect()

    return () => {
      isUnmountedRef.current = true
      clearTimers()
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  // Подписка на сообщения WebSocket
  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback)
    return () => subscribersRef.current.delete(callback)
  }, [])

  const value = {
    gameState,
    setGameState,
    countdown,
    setCountdown,
    multiplier,
    setMultiplier,
    coefficientHistory,
    setCoefficientHistory,
    roundId,
    setRoundId,
    connected,
    send,
    subscribe,
  }

  return (
    <CrashContext.Provider value={value}>
      {children}
    </CrashContext.Provider>
  )
}

export function useCrashContext() {
  const context = useContext(CrashContext)
  if (!context) {
    throw new Error('useCrashContext must be used within CrashProvider')
  }
  return context
}
