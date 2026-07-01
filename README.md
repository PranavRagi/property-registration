# 🏠 Property Registration Platform

A full-stack real estate web application inspired by 99acres and MagicBricks, built as a portfolio project. Allows users to register, discover, and communicate about properties — with real-time chat, interactive maps, and analytics.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Frontend | https://property-registration.vercel.app |


---

## 🚀 Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Mapbox GL JS** — interactive property map (dynamic load, no npm install)
- **Socket.io Client** — real-time chat and notifications
- **Nominatim (OpenStreetMap)** — free geocoding with 3-strategy fallback
- **CSS-in-JS** — all styles as `React.CSSProperties` objects

### Backend
- **Node.js** + **Express.js**
- **MongoDB Atlas** + **Mongoose ODM**
- **Socket.io** — real-time messaging, typing indicators, read receipts
- **Cloudinary** — permanent cloud image storage
- **JWT Authentication** — stateless tokens, 24h expiry
- **bcrypt** — password hashing
- **Multer** — file upload middleware
- **QRCode (npm)** — auto QR generation per property and buyer

### Deployment
- **Frontend** → Vercel
- **Backend** → Railway
- **Database** → MongoDB Atlas (free tier)
- **Images** → Cloudinary (free tier)

---

## ✨ Features

### 🔐 Authentication
- Single unified account — switch between Buyer and Seller mode without re-login
- JWT-based authentication with 24h token expiry
- Auto logout on token expiry
- Admin panel with separate login at `/admin`

### 🏢 Seller Features
- Register properties with up to 4 images (stored on Cloudinary)
- Auto-generate Property ID (`PROP-2026-Name-001`)
- QR code generated per property — links to public property detail page
- Edit, delete, update property status (Available / Sold / On Hold)
- Seller Dashboard with search and stats
- My Properties page with CRUD operations

### 👤 Buyer Features
- Register buyer profile (budget range, preferred city, property type)
- Search properties by city, location, or property name
- QR code generated per buyer profile
- My Buyers page with CRUD operations
- Buyer Dashboard with market analytics

### 🗺️ Maps
- Mapbox interactive map with colour-coded property pins
  - 🟢 Available  🔴 Sold  🟡 On Hold
- Pin shows BHK count, click opens property detail popup
- Search bar filters pins in real time
- Nominatim geocoding — automatic, no manual lat/lng needed
- 3-strategy geocoding fallback handles typos and multi-city strings

### 📊 Analytics
- Role-aware — detects Seller vs Buyer automatically
- **Seller:** status distribution donut, price bar chart, city spread, BHK breakdown
- **Buyer:** avg price by city, property type distribution, city availability
- Built from scratch — no Recharts or charting library

### 💬 Real-time Messaging
- Live chat between Buyer and Seller (Socket.io rooms)
- Typing indicators with 2-second auto stop
- Read receipts (✓ sent, ✓✓ read)
- Image, audio, video file sharing with WhatsApp-style preview before send
- Notification bell with unread count, single-read and mark-all-read

### 🔐 Admin Panel (at `/admin`)
- Overview stats — users, properties, buyers
- Approve / Reject property listings
- Deactivate / Reactivate user accounts (blocked from login when deactivated)
- View all buyer registrations
- Users tab shows role badges (🏢 Seller / 👤 Buyer / 🔄 Seller & Buyer)

---

## 📁 Project Structure

```
property-registration/
├── backend/
│   ├── server.js          ← Express REST API (30+ routes)
│   ├── socket.js          ← Socket.io real-time events
│   ├── db.js              ← MongoDB models (Mongoose)
│   ├── migrate.js         ← One-time JSON → MongoDB migration script
│   ├── middleware/
│   │   └── auth.js        ← JWT verification middleware
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── AuthPage.tsx          ← Unified login/register
    │   │   ├── ModeSelect.tsx        ← First login mode picker (Seller/Buyer)
    │   │   ├── SellerDashboard.tsx   ← Seller stats + property search
    │   │   ├── BuyerDashboard.tsx    ← Property discovery + search
    │   │   ├── SellerForm.tsx        ← Property registration form (validated)
    │   │   ├── BuyerForm.tsx         ← Buyer profile form (validated)
    │   │   ├── MyProperties.tsx      ← Seller CRUD + status update
    │   │   ├── MyBuyers.tsx          ← Buyer profile CRUD
    │   │   ├── PropertyDetail.tsx    ← Public property page (QR scan lands here)
    │   │   ├── MapView.tsx           ← Mapbox map + search + filters
    │   │   ├── Analytics.tsx         ← Role-aware charts + stats
    │   │   ├── Messages.tsx          ← Chat page with conversation list
    │   │   ├── AdminDashboard.tsx    ← Admin panel
    │   │   └── AdminLogin.tsx        ← Admin login
    │   ├── components/
    │   │   ├── Sidebar.tsx           ← Navigation + mode switch
    │   │   ├── NotificationBell.tsx  ← Real-time notification bell
    │   │   ├── Chatwindow.tsx        ← Full chat UI component
    │   │   └── Lightbox.tsx          ← Image zoom component
    │   ├── hooks/
    │   │   └── useSocket.ts          ← Singleton Socket.io connection
    │   └── utils/
    │       ├── api.ts                ← Central fetch helper with auth headers
    │       └── auth.ts               ← Token + mode + role management
    └── package.json
```

---

## 🗄️ MongoDB Collections

| Collection | Description |
|---|---|
| `properties` | Property listings — images (Cloudinary), QR codes, status, verification |
| `buyers` | Buyer profiles — budget, city preference, QR codes |
| `users` | Unified user accounts (Seller + Buyer in one account) |
| `admins` | Admin accounts (separate from users) |
| `messages` | Chat messages per room — indexed by roomID |
| `notifications` | User notifications — read/unread state |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://property-registration.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=https://your-railway-app.up.railway.app
VITE_MAPBOX_TOKEN=pk.eyJ1...your_mapbox_token
```

---

## 💻 Local Development

### Prerequisites
```
Node.js v18+
MongoDB Atlas account (free tier)
Cloudinary account (free tier)
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

### One-time Data Migration (JSON → MongoDB)
```bash
cd backend
node migrate.js
# Migrates existing JSON data to MongoDB
# Safe to run multiple times — skips existing records
```

---

## 🔄 QR Code Flow

```
Seller registers property
  → Images uploaded to Cloudinary
  → QR generated → links to https://property-registration.vercel.app/property/PROP-ID
  → QR saved and displayed to seller

Buyer scans QR with phone camera
  → Opens property detail page (works from any network)
  → Full details: images, price, BHK, seller contact
  → "Show Interest" / Message seller button
```

---

## 🌐 API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/verify` | Verify JWT token |

### Properties
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register property + upload to Cloudinary |
| GET | `/properties` | Get all properties |
| GET | `/property/:id` | Get property by ID |
| PUT | `/property/:id` | Update property |
| DELETE | `/property/:id` | Delete property |
| PATCH | `/property/:id/status` | Update status only |
| GET | `/my-properties` | Logged-in seller's properties |
| GET | `/map/properties` | All properties for public map |

### Buyers
| Method | Route | Description |
|---|---|---|
| POST | `/buyer/register` | Register buyer profile |
| GET | `/buyers` | Get all buyers |
| GET | `/buyer/:id` | Get buyer by ID |
| PUT | `/buyer/:id` | Update buyer |
| DELETE | `/buyer/:id` | Delete buyer |
| GET | `/my-buyers` | Logged-in buyer's registrations |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/dashboard/seller/stats` | Seller statistics |
| GET | `/dashboard/buyer/stats` | Market statistics |
| GET | `/dashboard/properties` | All properties for buyer view |

### Admin
| Method | Route | Description |
|---|---|---|
| POST | `/admin/login` | Admin login |
| GET | `/admin/stats` | Overview statistics |
| GET | `/admin/properties` | All properties |
| GET | `/admin/users` | All unified user accounts |
| GET | `/admin/buyers` | All buyer registrations |
| PATCH | `/admin/property/:id/approve` | Approve property |
| PATCH | `/admin/property/:id/reject` | Reject property |
| DELETE | `/admin/property/:id` | Delete property |
| PATCH | `/admin/user/:id/deactivate` | Deactivate user |
| PATCH | `/admin/user/:id/reactivate` | Reactivate user |

### Messaging
| Method | Route | Description |
|---|---|---|
| GET | `/messages/:roomID` | Get chat history |
| GET | `/conversations` | Get all conversations |
| POST | `/upload-chat-file` | Upload image/audio/video in chat |
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/read` | Mark all as read |
| PATCH | `/notifications/read/:id` | Mark single as read |

---

## 📡 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join chat room |
| `send_message` | Client → Server | Send message |
| `receive_message` | Server → Client | New message received |
| `typing` | Client → Server | Start typing |
| `stop_typing` | Client → Server | Stop typing |
| `typing_status` | Server → Client | Typing indicator |
| `mark_read` | Client → Server | Mark messages as read |
| `messages_read` | Server → Client | Read receipt |
| `notification` | Server → Client | New notification |

---

## 🏗️ Development Phases

| Phase | Feature | Key Work |
|---|---|---|
| 1 | Seller Registration | Property form, image upload, QR generation, smart IP detection |
| 2 | Buyer Registration | Buyer profile, buyer QR, CRUD operations |
| 3 | Authentication | Unified login, JWT, role-based nav, mode switching |
| 4 | Admin Dashboard | Property approval, user management, stats |
| 5 | Real-time Messaging | Socket.io chat, file sharing, notification bell |
| 6 | Maps + Analytics | Mapbox map, Nominatim geocoding, role-aware charts |
| 7 | Database Migration | JSON → MongoDB Atlas with Mongoose |
| 8 | Deployment | Vercel + Railway + Cloudinary |

---

## 👨‍💻 Developer

**Pranav** — Final Year B.Tech CSE
Amrita Vishwa Vidyapeetham, Chennai Campus
Native: Hyderabad, Telangana

---

## 📄 License

Open source — built as a portfolio project.
