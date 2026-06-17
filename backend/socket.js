const { Server }   = require('socket.io')
const jwt          = require('jsonwebtoken')
const { SECRET }   = require('./middleware/auth')
const { Message, Notification } = require('./db')

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  })

  // ── Auth middleware — verify JWT on connect ───────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('No token'))
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'))
      socket.user = decoded
      next()
    })
  })

  io.on('connection', (socket) => {
    const username = socket.user.username
    console.log(`\n🟢 Connected: ${username}`)

    // ── Join personal notification room ───────────────────────────────────
    socket.join(`user:${username}`)

    // ── Join a chat room ──────────────────────────────────────────────────
    socket.on('join_room', ({ roomID }) => {
      socket.join(roomID)
      console.log(`${username} joined room: ${roomID}`)
    })

    // ── Send message ──────────────────────────────────────────────────────
    socket.on('send_message', async ({ roomID, to, type, content, propertyID }) => {
      try {
        // Save message to MongoDB
        const message = await Message.create({
          id:         `MSG-${Date.now()}`,
          roomID,
          from:       username,
          to,
          type:       type || 'text',
          content,
          propertyID: propertyID || null,
          timestamp:  new Date().toISOString(),
          read:       false
        })

        // Emit to chat room (both users)
        io.to(roomID).emit('receive_message', message.toObject())

        // Save notification to MongoDB
        const notification = await Notification.create({
          id:        `NOTIF-${Date.now()}`,
          to,
          from:      username,
          type:      'new_message',
          message:   `${username} sent you a message`,
          roomID,
          read:      false,
          timestamp: new Date().toISOString()
        })

        // Push notification ONLY to recipient's personal room ✅
        io.to(`user:${to}`).emit('notification', notification.toObject())

        console.log(`💬 ${username} → ${to}: ${type}`)
      } catch (err) {
        console.error('send_message error:', err.message)
      }
    })

    // ── Typing indicator ──────────────────────────────────────────────────
    socket.on('typing', ({ to }) => {
      io.to(`user:${to}`).emit('typing_status', { from: username, typing: true })
    })

    socket.on('stop_typing', ({ to }) => {
      io.to(`user:${to}`).emit('typing_status', { from: username, typing: false })
    })

    // ── Mark messages as read ─────────────────────────────────────────────
    socket.on('mark_read', async ({ roomID }) => {
      try {
        // Mark messages as read in MongoDB
        await Message.updateMany(
          { roomID, to: username, read: false },
          { read: true }
        )

        // Mark notifications as read in MongoDB
        await Notification.updateMany(
          { to: username, roomID, read: false },
          { read: true }
        )

        io.to(roomID).emit('messages_read', { roomID, by: username })
      } catch (err) {
        console.error('mark_read error:', err.message)
      }
    })

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔴 Disconnected: ${username}`)
    })
  })

  return io
}

module.exports = { initSocket }