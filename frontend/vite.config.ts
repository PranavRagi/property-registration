import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://[::1]:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // ← allow network access
    port: 5173,
    proxy: {
      // ── Core ─────────────────────────────────────────────
      '/register':      { target: BACKEND, changeOrigin: true },

      // ── /property — bypass GET /:id to React, rest to backend
      '/property': {
        target:       BACKEND,
        changeOrigin: true,
        bypass: (req) => {
          // GET /property/PROP-xxx → React handles (property detail page)
          if (req.method === 'GET' && /^\/property\/[^/]+$/.test(req.url || '')) {
            return req.url
          }
          // PUT, DELETE, PATCH, GET /property/:id/status → backend
          return null
        }
      },

      '/properties':       { target: BACKEND, changeOrigin: true },
      '/uploads':          { target: BACKEND, changeOrigin: true },

      // ── Auth ─────────────────────────────────────────────
      '/auth':             { target: BACKEND, changeOrigin: true },

      // ── Admin API routes ──────────────────────────────────
      '/admin/login':         { target: BACKEND, changeOrigin: true },
      '/admin/register':      { target: BACKEND, changeOrigin: true },
      '/admin/stats':         { target: BACKEND, changeOrigin: true },
      '/admin/properties':    { target: BACKEND, changeOrigin: true },
      '/admin/buyers':        { target: BACKEND, changeOrigin: true },
      '/admin/sellers':       { target: BACKEND, changeOrigin: true },
      '/admin/users':         { target: BACKEND, changeOrigin: true },
      '/admin/property':      { target: BACKEND, changeOrigin: true },
      '/admin/buyer':         { target: BACKEND, changeOrigin: true },
      '/admin/seller':        { target: BACKEND, changeOrigin: true },
      '/admin/user':          { target: BACKEND, changeOrigin: true },
      '/admin/regenerate-qr': { target: BACKEND, changeOrigin: true },

      // ── Buyer ─────────────────────────────────────────────
      // bypass GET /buyer/:id to React (buyer detail page)
      '/buyer': {
        target:       BACKEND,
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET' && /^\/buyer\/[^/]+$/.test(req.url || '')) {
            return req.url
          }
          return null
        }
      },

      '/buyers':           { target: BACKEND, changeOrigin: true },

      // ── Dashboard ─────────────────────────────────────────
      '/dashboard':        { target: BACKEND, changeOrigin: true },
      '/my-properties':    { target: BACKEND, changeOrigin: true },
      '/my-buyers':        { target: BACKEND, changeOrigin: true },

      // ── Phase 6 — Map ─────────────────────────────────────
      '/map':              { target: BACKEND, changeOrigin: true },

      // ── Phase 5 — Messaging & Notifications ───────────────
      '/messages':         { target: BACKEND, changeOrigin: true },
      '/conversations':    { target: BACKEND, changeOrigin: true },
      '/notifications':    { target: BACKEND, changeOrigin: true },
      '/upload-chat-file': { target: BACKEND, changeOrigin: true },

      // ── Socket.io WebSocket ───────────────────────────────
      '/socket.io': {
        target:       BACKEND,
        ws:           true,
        changeOrigin: true
      }
    }
  }
})