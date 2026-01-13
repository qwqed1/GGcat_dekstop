import { apiFetch } from './client'

export function checkFreeCase(userId) {
  return apiFetch(`/api/cases/free/check?user_id=${userId}`, {
    method: 'POST',
  })
}

export function consumeFreeCase(userId) {
  return apiFetch(`/api/cases/free/consume?user_id=${userId}`, {
    method: 'POST',
  })
}
