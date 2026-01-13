import { apiFetch } from './client'

/* ===== ROUNDS ===== */

// получить раунд
export const getCrashRound = (roundId) =>
  apiFetch(`/crash-rounds/${roundId}`)

// ставки по раунду
export const getCrashBetsByRound = (roundId) =>
  apiFetch(`/crash-bets/round/${roundId}`)

/* ===== BOTS ===== */

export const getCrashBotById = (botId) =>
  apiFetch(`/crash-bots/${botId}`)
