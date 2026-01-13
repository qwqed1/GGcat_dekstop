import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { WS_BASE_URL } from '../config/ws'

const LiveFeedContext = createContext()

export function LiveFeedProvider({ children }) {
  const [liveDrops, setLiveDrops] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    const connect = () => {
      const url = `${WS_BASE_URL}/ws/drops/global`
      
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🟢 LiveFeed WS connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.event !== 'drop') return

          setLiveDrops(prev => [
            {
              id: `${msg.data.id}-${Date.now()}`,
              name: msg.data.name,
              type: msg.data.icon?.endsWith('.json') ? 'animation' : 'image',
              image: msg.data.icon,
              animation: msg.data.icon,
            },
            ...prev,
          ].slice(0, 50))
        } catch (e) {
          console.warn('LiveFeed WS parse error', e)
        }
      }

      ws.onerror = (e) => {
        console.error('🔴 LiveFeed WS error', e)
      }

      ws.onclose = () => {
        console.log('⚪ LiveFeed WS closed, reconnecting in 3s...')
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <LiveFeedContext.Provider value={{ liveDrops }}>
      {children}
    </LiveFeedContext.Provider>
  )
}

export function useLiveFeed() {
  const context = useContext(LiveFeedContext)
  if (!context) {
    throw new Error('useLiveFeed must be used within LiveFeedProvider')
  }
  return context
}
