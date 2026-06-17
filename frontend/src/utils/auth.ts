// ── Token ─────────────────────────────────────────────────────────────────────
export function saveToken(token: string, username: string) {
  localStorage.setItem('token',    token)
  localStorage.setItem('username', username)
}

export function getToken():    string | null { return localStorage.getItem('token')    }
export function getUsername(): string | null { return localStorage.getItem('username') }
export function isLoggedIn():  boolean       { return !!getToken()                     }

export function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Mode ──────────────────────────────────────────────────────────────────────
export function getMode(): 'seller' | 'buyer' {
  return (localStorage.getItem('mode') as 'seller' | 'buyer') || 'buyer'
}

export function setMode(mode: 'seller' | 'buyer') {
  localStorage.setItem('mode', mode)
}

// ── First Login ───────────────────────────────────────────────────────────────
export function isFirstLogin(): boolean {
  return !localStorage.getItem('mode')
}

export function setFirstLoginDone(mode: 'seller' | 'buyer') {
  localStorage.setItem('mode', mode)
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('mode')
}

// ── Legacy (keep for admin compatibility) ─────────────────────────────────────
export function getRole(): string | null {
  // Admin still uses role, regular users use getMode()
  return localStorage.getItem('role')
}

export function saveAdminToken(token: string, username: string) {
  localStorage.setItem('token',    token)
  localStorage.setItem('username', username)
  localStorage.setItem('role',     'admin')
}