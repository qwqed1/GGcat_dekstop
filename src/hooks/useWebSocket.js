import { useEffect, useRef } from 'react'

export function useWebSocket(url, { onMessage, onOpen, onClose, onError }) {
  const wsRef = useRef(null)

  useEffect(() => {
    if (!url) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('🟢 WS connected:', url)
      onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch (e) {
        console.warn('WS message parse error', e)
      }
    }

    ws.onerror = (e) => {
      console.error('🔴 WS error', e)
      onError?.(e)
    }

    ws.onclose = () => {
      console.log('⚪ WS closed:', url)
      onClose?.()
    }

    return () => {
      ws.close()
    }
  }, [url])

  return wsRef
}
