import { apiFetch } from './client'

// создать реферальный промокод
export const createReferralPromo = (userId, code) =>
  apiFetch(`/promo/referral/create?user_id=${userId}&code=${code}`, {
    method: 'POST',
  })

// обновить реферальный промокод
export const updateReferralPromo = (userId, newCode) =>
  apiFetch(`/promo/referral/update?user_id=${userId}&new_code=${newCode}`, {
    method: 'PUT',
  })

  export const getMyReferralPromo = (userId) =>
    apiFetch(`/promo/referral/my?user_id=${userId}`)
  
  export const getReferralActivations = (userId) =>
    apiFetch(`/promo/referral/activations?user_id=${userId}`)
  

  export const activatePromo = (userId, code) =>
    apiFetch(`/promo/activate?user_id=${userId}&code=${encodeURIComponent(code)}`, {
      method: 'POST',
    })