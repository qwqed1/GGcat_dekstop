import { apiFetch } from './client'

/* ===== GET ===== */

// список пользователей
export const getUsers = () =>
  apiFetch('/users/')

// получить пользователя по ID
export const getUserById = (userId) =>
  apiFetch(`/users/${userId}`)

// получить пользователя по telegram id
export const getUserByTgId = (tgId) =>
  apiFetch(`/users/tg/${tgId}`)

/* ===== POST ===== */

// создать пользователя
export const createUser = (data) =>
  apiFetch('/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

/* ===== PATCH ===== */

// частичное обновление пользователя
export const updateUser = (userId, data) =>
  apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

/* ===== DELETE ===== */

// удалить пользователя
export const deleteUser = (userId) =>
  apiFetch(`/users/${userId}`, {
    method: 'DELETE',
  })
