import { apiFetch } from './client'

export const getCases = () => apiFetch('/cases/')



export const getCaseDrops = (caseId) =>
  apiFetch(`/case-drops/case/${caseId}`)

export const getDropById = (id) =>
  apiFetch(`/drops/${id}`)

export async function getAllDrops() {
  return apiFetch('/drops?limit=500')
}