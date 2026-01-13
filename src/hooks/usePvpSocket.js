// hooks/usePvpSocket.js
import { useEffect, useRef, useState } from "react"
import { connectPvpWs, sendPvpBet } from "../api/pvpWs"

export function usePvpSocket({ onBots, onResult }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  
  // Используем refs для хранения актуальных callbacks
  const onBotsRef = useRef(onBots)
  const onResultRef = useRef(onResult)
  
  // Обновляем refs при каждом рендере
  useEffect(() => {
    onBotsRef.current = onBots
    onResultRef.current = onResult
  })

  useEffect(() => {
    socketRef.current = connectPvpWs({
      onBotsUpdate: (data) => onBotsRef.current?.(data),
      onResult: (data) => onResultRef.current?.(data),
      onError: () => setConnected(false),
    })

    socketRef.current.onopen = () => setConnected(true)
    socketRef.current.onclose = () => setConnected(false)

    return () => {
      socketRef.current?.close()
    }
  }, [])

  return {
    connected,
    sendBet: sendPvpBet,
  }
}
