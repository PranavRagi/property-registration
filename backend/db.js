// ── db.js — MongoDB connection + Mongoose models ──────────────────────────────
const mongoose = require('mongoose')

// ── Connect ───────────────────────────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'propertydb'
    })
    console.log('✅ MongoDB connected successfully')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const PropertySchema = new mongoose.Schema({
  propertyID:    { type: String, required: true, unique: true },
  propertyName:  String,
  size:          String,
  bedroomType:   String,
  propertyType:  String,
  positionDate:  String,
  propertyAge:   String,
  sqftPrice:     String,
  boxPrice:      String,
  neighbourhood: String,
  geoLocation:   String,
  sellerName:    String,
  contactNo:     String,
  email:         String,
  images:        [String],
  qrCode:        String,
  propertyURL:   String,
  ownerUsername: String,
  registeredAt:  String,
  status:        { type: String, default: 'Available' },
  // verified:      { type: mongoose.Schema.Types.Mixed, default: null },
  verified: { type: Boolean, default: null },
  verifiedAt:    String,
  updatedAt:     String,
}, { _id: true })

const UserSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  username:     { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  createdAt:    String,
  migratedFrom: [String],
  active:       { type: Boolean, default: true },
}, { _id: true })

const BuyerSchema = new mongoose.Schema({
  buyerID:       { type: String, required: true, unique: true },
  fullName:      String,
  mobile:        String,
  email:         String,
  address:       String,
  budgetMin:     String,
  budgetMax:     String,
  preferredCity: String,
  preferredType: String,
  qrCode:        String,
  buyerURL:      String,
  status:        { type: String, default: 'Active' },
  ownerUsername: String,
  registeredAt:  String,
  updatedAt:     String,
  active:        { type: Boolean, default: true },
}, { _id: true })

const AdminSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  username:  { type: String, required: true, unique: true },
  email:     String,
  password:  String,
  createdAt: String,
}, { _id: true })

const MessageSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  roomID:     { type: String, required: true, index: true },
  from:       String,
  to:         String,
  type:       { type: String, default: 'text' },
  content:    String,
  propertyID: String,
  timestamp:  String,
  read:       { type: Boolean, default: false },
}, { _id: true })

const NotificationSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  to:        { type: String, index: true },
  from:      String,
  type:      String,
  message:   String,
  roomID:    String,
  read:      { type: Boolean, default: false },
  timestamp: String,
}, { _id: true })

// ── Models ────────────────────────────────────────────────────────────────────
const Property     = mongoose.model('Property',     PropertySchema)
const User         = mongoose.model('User',         UserSchema)
const Buyer        = mongoose.model('Buyer',        BuyerSchema)
const Admin        = mongoose.model('Admin',        AdminSchema)
const Message      = mongoose.model('Message',      MessageSchema)
const Notification = mongoose.model('Notification', NotificationSchema)

module.exports = { connectDB, Property, User, Buyer, Admin, Message, Notification }