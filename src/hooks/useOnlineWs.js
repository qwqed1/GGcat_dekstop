import { useEffect, useState } from "react"
import { connectOnlineWs, disconnectOnlineWs } from "../api/onlineWs"

export function useOnlineWs() {
  const [online, setOnline] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  })

  useEffect(() => {
    const ws = connectOnlineWs({
      onUpdate: (data) => {
        setOnline(data)
      },
      onError: (err) => {
        console.error("Online WS error", err)
      },
    })

    return () => {
      disconnectOnlineWs()
    }
  }, [])

  return online
}
