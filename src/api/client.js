const API_URL = import.meta.env.VITE_API_URL || 'https://ggcat.org'

if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL not set, using default:', API_URL)
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    throw new Error('API URL not configured')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}))
       throw new Error(errorData.detail || `API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
