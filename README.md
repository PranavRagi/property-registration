#  Property Registration Platform

A full-stack real estate platform inspired by 99acres and MagicBricks, built as a portfolio project.

---

## 🚀 Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Mapbox GL (interactive maps)
- Socket.io Client (real-time chat)
- Recharts (analytics)

### Backend
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Socket.io (real-time messaging)
- JWT Authentication
- Multer (file uploads)
- QRCode (QR generation)

### Deployment
- Frontend → Vercel
- Backend → Railway
- Database → MongoDB Atlas

---

## ✨ Features

### 🔐 Authentication
- Single unified account (Buyer + Seller modes)
- JWT-based authentication (24h expiry)
- Mode switching via sidebar (no re-login needed)
- Admin panel with separate access

### 🏢 Seller Features
- Register properties with images (up to 4)
- Auto-generate Property ID (PROP-2026-Name-001)
- QR code generation for each property
- Edit, delete, update status (Available/Sold/On Hold)
- Seller Dashboard with analytics
- HashMap O(1) property search

### 👤 Buyer Features
- Register buyer profile with preferences
- Search properties by City or Property ID
- Interactive map with color-coded pins
- QR code scanning → property details
- Buyer Dashboard with market analytics

### 🔔 Real-time Features
- Live chat between Buyer and Seller (Socket.io)
- Real-time notifications (bell icon with count)
- Typing indicators and read receipts
- Image/Audio/Video file sharing in chat

### 🗺️ Maps + Analytics
- Mapbox interactive property map
- Color-coded pins (🟢 Available, 🔴 Sold, 🟡 On Hold)
- Seller analytics (status distribution, price charts)
- Buyer analytics (city-wise prices, BHK distribution)

### 🔐 Admin Panel
- Overview stats (users, properties, buyers)
- Approve/Reject property listings
- Deactivate/Reactivate user accounts
- Manage all buyer registrations

---

## 📁 Project Structure

```
property-registration/
├── backend/
│   ├── server.js          ← Express routes + API
│   ├── socket.js          ← Socket.io real-time events
│   ├── db.js              ← MongoDB models (Mongoose)
│   ├── migrate.js         ← One-time data migration script
│   ├── middleware/
│   │   └── auth.js        ← JWT verification middleware
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── AuthPage.tsx         ← Unified login/register
    │   │   ├── ModeSelect.tsx       ← First login mode picker
    │   │   ├── SellerDashboard.tsx  ← Seller stats + search
    │   │   ├── BuyerDashboard.tsx   ← Property search
    │   │   ├── MapView.tsx          ← Mapbox map
    │   │   ├── Analytics.tsx        ← Charts + stats
    │   │   ├── Messages.tsx         ← Chat page
    │   │   ├── AdminDashboard.tsx   ← Admin panel
    │   │   └── ...more pages
    │   ├── components/
    │   │   ├── Sidebar.tsx          ← Navigation + mode switch
    │   │   ├── NotificationBell.tsx ← Real-time notifications
    │   │   └── Chatwindow.tsx       ← Chat UI component
    │   ├── hooks/
    │   │   └── useSocket.ts         ← Socket.io connection
    │   └── utils/
    │       ├── api.ts               ← Central fetch helper
    │       └── auth.ts              ← Token + mode management
    └── package.json
```

---

## 🗄️ MongoDB Collections

| Collection | Description |
|------------|-------------|
| `properties` | Property listings with images, QR codes |
| `buyers` | Buyer profiles and preferences |
| `users` | Unified user accounts (seller + buyer) |
| `admins` | Admin accounts |
| `messages` | Chat messages per room |
| `notifications` | User notifications |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=https://your-railway-app.up.railway.app
VITE_MAPBOX_TOKEN=pk.eyJ1...your_mapbox_token
```

---

##  Local Development

### Prerequisites
```bash
Node.js v18+
MongoDB Atlas account
Mapbox account (free tier)
```

### Backend Setup
```bash
cd backend
npm install
# Create .env file with variables above
npm start
# Server runs at http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with variables above
npm run dev
# App runs at http://localhost:5173
```

### Admin Panel
```
http://localhost:5173/admin
```

---

##  QR Code Flow

```
Seller registers property
  → QR generated → links to property detail page
  → Seller shares QR image

Buyer scans QR with phone camera
  → Opens property detail page
  → Full details: images, price, seller contact
```

---

## 🌐 API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/verify` | Verify JWT token |

### Properties
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register property |
| GET | `/properties` | Get all properties |
| GET | `/property/:id` | Get property by ID |
| PUT | `/property/:id` | Update property |
| DELETE | `/property/:id` | Delete property |
| PATCH | `/property/:id/status` | Update status |
| GET | `/my-properties` | Get logged-in seller's properties |

### Buyers
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/buyer/register` | Register buyer |
| GET | `/buyers` | Get all buyers |
| GET | `/buyer/:id` | Get buyer by ID |
| PUT | `/buyer/:id` | Update buyer |
| DELETE | `/buyer/:id` | Delete buyer |
| GET | `/my-buyers` | Get logged-in buyer's registrations |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard/seller/stats` | Seller statistics |
| GET | `/dashboard/buyer/stats` | Market statistics |
| GET | `/dashboard/properties` | All properties for buyer |
| GET | `/map/properties` | Properties for map |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/login` | Admin login |
| GET | `/admin/stats` | Overview statistics |
| GET | `/admin/properties` | All properties |
| GET | `/admin/users` | All users |
| PATCH | `/admin/property/:id/approve` | Approve property |
| PATCH | `/admin/property/:id/reject` | Reject property |
| POST | `/admin/regenerate-qr` | Regenerate all QR codes |

### Messaging
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/messages/:roomID` | Get chat history |
| GET | `/conversations` | Get all conversations |
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/read` | Mark all as read |

---

##  Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_room` | Client → Server | Join chat room |
| `send_message` | Client → Server | Send message |
| `receive_message` | Server → Client | New message |
| `typing` | Client → Server | Start typing |
| `stop_typing` | Client → Server | Stop typing |
| `typing_status` | Server → Client | Typing indicator |
| `mark_read` | Client → Server | Mark as read |
| `messages_read` | Server → Client | Read receipt |
| `notification` | Server → Client | New notification |

---

## 👨‍💻 Developer

**Pranav** — Final Year B.Tech CSE  
Amrita Vishwa Vidyapeetham, Chennai Campus Hyderabad

---

