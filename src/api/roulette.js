// src/api/roulette.js (или games.js — как у тебя принято)

import { apiFetch } from './client'

// 🎰 Платный спин
export async function roulettePaidSpin({ userId, amount, giftId }) {
  return apiFetch('/roulette/spin/paid', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      amount,
      gift_id: giftId,
    }),
  })
}

// 🎁 Бесплатный спин
export async function rouletteFreeSpin({ userId }) {
  return apiFetch(`/roulette/spin/free?user_id=${userId}`, {
    method: 'POST',
  })
}

// 🎯 Статус фриспина
export async function getFreeSpinStatus(userId) {
  return apiFetch(`/games/free-spin-status?user_id=${userId}`)
}

// 🕹️ Игра сыграна (увеличивает games_played)
export async function playGame(userId) {
  return apiFetch('/games/play', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

// 📅 Инициализация дня (создаёт запись если нет)
// 📅 Инициализация дня (query param)
export const initDay = (userId) => {
  return apiFetch(`/games/init-day?user_id=${Number(userId)}`, {
    method: 'POST',
  })
}


