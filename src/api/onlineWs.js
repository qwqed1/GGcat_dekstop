import { WS_BASE_URL } from "../config/ws"

let socket = null

export function connectOnlineWs({ onUpdate, onError }) {
  socket = new WebSocket(`${WS_BASE_URL}/ws/online`)

  socket.onopen = () => {
    console.log("✅ Online WS connected")
  }

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)

      if (data.event === "online_update") {
        onUpdate?.(data.data)
      } else {
        console.warn("⚠️ Unknown online WS event:", data)
      }
    } catch (err) {
      console.error("❌ Online WS parse error", err)
    }
  }

  socket.onerror = (e) => {
    console.error("❌ Online WS error", e)
    onError?.(e)
  }

  socket.onclose = () => {
    console.log("🔌 Online WS closed")
  }

  return socket
}

export function disconnectOnlineWs() {
  if (socket) {
    socket.close()
    socket = null
  }
}
