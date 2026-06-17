// const BASE = 'http://localhost:3001'

import { authHeader, logout } from './auth'

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response | null> {
  const isFormData = options.body instanceof FormData

  const res = await fetch(endpoint, {   // ← no BASE, relative path
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
    alert('Session expired. Please login again.')  // ← typo fixed
    window.location.href = '/'
    return null
  }
  return res
}