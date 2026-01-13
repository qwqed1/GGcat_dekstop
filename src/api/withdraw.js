import { apiFetch } from './client'

/**
 * 🔎 Проверка: можно ли выводить
 * GET /withdraw/can?user_id=...
 */
export function canWithdraw(userId) {
  return apiFetch(`/withdraw/can?user_id=${userId}`)
}

/**
 * 📤 Создать заявку на вывод TON
 * POST /withdraw
 */
export function createTonWithdraw({ userId, amount }) {
  return apiFetch('/withdraw/', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      type: 'ton',
      ton_amount: amount,
    }),
  })
}

/**
 * 📤 Создать заявку на вывод DROP
 * POST /withdraw
 */
export function createDropWithdraw({ userId, dropId }) {
  return apiFetch('/withdraw/', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      type: 'drop',
      drop_id: dropId,
    }),
  })
}

/**
 * ✅ Пометить заявку выполненной (admin)
 * POST /withdraw/{id}/complete
 */
export function completeWithdraw(requestId) {
  return apiFetch(`/withdraw/${requestId}/complete`, {
    method: 'POST',
  })
}

/**
 * ❌ Отменить заявку (admin)
 * POST /withdraw/{id}/cancel
 */
export function cancelWithdraw(requestId) {
  return apiFetch(`/withdraw/${requestId}/cancel`, {
    method: 'POST',
  })
}
