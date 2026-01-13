const API_URL = import.meta.env.VITE_API_URL

export const WS_BASE_URL = API_URL
  .replace('https://', 'wss://')
  .replace('http://', 'ws://')
