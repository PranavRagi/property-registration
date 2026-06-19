import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { getToken } from '../utils/auth'

let socketInstance: Socket | null = null

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    // Reuse existing connection if already connected
    if (socketInstance?.connected) {
      socketRef.current = socketInstance
      return
    }

    // Create new socket connection
    socketInstance = io('https://property-registration-production.up.railway.app', {
      auth:       { token },
      path:       '/socket.io',
      transports: ['websocket', 'polling']
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log('🟢 Socket connected')
    })

    socketInstance.on('disconnect', () => {
      console.log('🔴 Socket disconnected')
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    return () => {
      // Don't disconnect on unmount — keep connection alive
    }
  }, [])

  return socketRef.current
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}