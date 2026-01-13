// src/api/dailyRewards.js
import { apiFetch } from './client'

export function getDailyRewardsStatus(userId) {
  return apiFetch(`/api/daily-rewards/status/${userId}`)
}

export function claimFirstReward(userId) {
  return apiFetch(`/api/daily-rewards/claim/first?user_id=${userId}`, {
    method: 'POST',
  })
}

export function claimTenDaysReward(userId) {
  return apiFetch(`/api/daily-rewards/claim/ten-days?user_id=${userId}`, {
    method: 'POST',
  })
}
