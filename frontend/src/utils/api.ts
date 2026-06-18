// const BASE = 'http://localhost:3001'
import { authHeader, logout } from './auth'

// ── Use Railway backend URL in production, relative path locally ──────────────
// const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BACKEND = "https://property-registration-production.up.railway.app"


export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response | null> {

  const isFormData = options.body instanceof FormData

  const res = await fetch(`${BACKEND}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...authHeader(),
      ...options.headers
    }
  })

  if (res.status === 401) {
    console.warn('[API] Token expired → logging out')
    logout()
    alert('Session expired. Please login again.')
    window.location.href = '/'
    return null
  }

  return res
}
