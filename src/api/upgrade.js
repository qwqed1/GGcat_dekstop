import { apiFetch } from './client'

export function upgradeItem({ user_id, from_drop_id, to_drop_id }) {
  return apiFetch('/upgrade/', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      from_drop_id,
      to_drop_id,
    }),
  })
}
