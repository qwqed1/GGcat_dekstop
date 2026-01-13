const API_URL = import.meta.env.VITE_API_URL || 'https://ggcat.org'

export const WS_BASE_URL = API_URL
  .replace('https://', 'wss://')
  .replace('http://', 'ws://')
