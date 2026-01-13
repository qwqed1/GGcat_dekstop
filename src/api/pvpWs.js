import { WS_BASE_URL } from "../config/ws"

let socket = null

export function connectPvpWs({ onBotsUpdate, onResult, onError }) {
  socket = new WebSocket(`${WS_BASE_URL}/ws/pvp`)

  socket.onopen = () => {
    console.log("✅ PvP WS connected")
  }

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data)

    switch (data.event) {
      case "pvp_bots_update":
        onBotsUpdate?.(data.bots)
        break

      case "pvp_result":
        onResult?.(data)
        break

      default:
        console.warn("⚠️ Unknown WS event:", data)
    }
  }

  socket.onerror = (e) => {
    console.error("❌ PvP WS error", e)
    onError?.(e)
  }

  socket.onclose = () => {
    console.log("🔌 PvP WS closed")
  }

  return socket
}

export function sendPvpBet(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ PvP WS not connected")
    return
  }

  socket.send(JSON.stringify({
    event: "bet",
    ...payload
  }))
}
