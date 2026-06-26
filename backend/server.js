require('dotenv').config()
const { connectDB, Property, Buyer, User, Admin, Message, Notification } = require('./db')
const express  = require('express')
const cors     = require('cors')
const multer   = require('multer')
const QRCode   = require('qrcode')
const fs       = require('fs')
const path     = require('path')
const os       = require('os')
const http     = require('http')
const bcrypt   = require('bcrypt')
const jwt      = require('jsonwebtoken')
const { initSocket }          = require('./socket')
const { verifyToken, SECRET } = require('./middleware/auth')


const app    = express()
const PORT   = process.env.PORT || 3001

const cloudinary = require('cloudinary').v2
const {CloudinaryStorage} = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'property-registration',
    allowed_formats: ['jpeg','jpg','png','webp'],
    transformation: [{width:800, quality:'auto'}]
  }
})

const upload = multer({storage, limits:{files:4}})
// ── Get local network IP ──────────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  const priority   = ['wi-fi', 'wlan', 'ethernet', 'eth', 'en0', 'en1']

  for (const name of Object.keys(interfaces)) {
    const nameLower = name.toLowerCase()
    if (['vmware','virtualbox','vbox','vethernet','loopback','tap','tun','bluetooth']
        .some(v => nameLower.includes(v))) continue
    if (priority.some(p => nameLower.includes(p))) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    const nameLower = name.toLowerCase()
    if (['vmware','virtualbox','vbox','vethernet','tap','tun','bluetooth']
        .some(v => nameLower.includes(v))) continue
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

const LOCAL_IP   = getLocalIP()
const FRONTEND_URL = process.env.FRONTEND_URL || `http://${LOCAL_IP}:5173`
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const BUYERS_DIR = path.join(UPLOAD_DIR, 'buyers')

app.use(cors({
  origin:[
    'https://property-registration.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR))

// ── Multer setup ──────────────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = path.join(UPLOAD_DIR, 'temp')
//     fs.mkdirSync(dir, { recursive: true })
//     cb(null, dir)
//   },
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// })
// const upload = multer({ storage, limits: { files: 4 } })

// ── ID Generators ─────────────────────────────────────────────────────────────
function generatePropertyID(propertyName, count) {
  const year     = new Date().getFullYear()
  const safeName = propertyName.replace(/\s+/g, '')
  const num      = String(count + 1).padStart(3, '0')
  return `PROP-${year}-${safeName}-${num}`
}

function generateBuyerID(name, count) {
  const year     = new Date().getFullYear()
  const safeName = name.replace(/\s+/g, '')
  const num      = String(count + 1).padStart(3, '0')
  return `BUY-${year}-${safeName}-${num}`
}

// ── Admin middleware ──────────────────────────────────────────────────────────
function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required.' })
    next()
  })
}

// ════════════════════════════════════════════════════════════════════════════
// PROPERTY ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── POST /register ────────────────────────────────────────────────────────────
app.post('/register', upload.array('images', 4), async (req, res) => {
  try {
    const { propertyName, sellerName, geoLocation, size, bedroomType,
            propertyType, positionDate, propertyAge, sqftPrice,
            boxPrice, neighbourhood, contactNo, email } = req.body

    const count     = await Property.countDocuments()
    const duplicate = await Property.findOne({
      propertyName: { $regex: new RegExp(`^${propertyName}$`, 'i') },
      sellerName:   { $regex: new RegExp(`^${sellerName}$`,   'i') },
      geoLocation:  { $regex: new RegExp(`^${geoLocation}$`,  'i') }
    })

    if (duplicate) {
      console.log(`\n❌ Duplicate property: ${propertyName}`)
      return res.status(400).json({ success: false, message: 'Property already registered with same Seller and Location.' })
    }

    const propertyID = generatePropertyID(propertyName, count)
    const propDir    = path.join(UPLOAD_DIR, propertyID)
    fs.mkdirSync(propDir, { recursive: true })

    // const images = (req.files || []).map((file, i) => {
    //   const ext     = path.extname(file.originalname)
    //   const newPath = path.join(propDir, `img-${i + 1}${ext}`)
    //   fs.renameSync(file.path, newPath)
    //   return `/uploads/${propertyID}/img-${i + 1}${ext}`
    // })
    const images = (req.files || []).map(file => file.path)

    // QR → upload to Cloudinary too
    // declare URL first, then generate QR
    const propertyURL = `${FRONTEND_URL}/property/${propertyID}`
    const qrBuffer    = await QRCode.toBuffer(propertyURL)
    const qrUpload    = await cloudinary.uploader.upload(
      `data:image/png;base64,${qrBuffer.toString('base64')}`,
      { folder: 'property-registration/qr-codes' }
    )
    const qrCode = qrUpload.secure_url

    await Property.create({
      propertyID, propertyName, size, bedroomType, propertyType,
      positionDate:  positionDate || null,
      propertyAge:   propertyAge  || null,
      sqftPrice,     boxPrice: boxPrice || null,
      neighbourhood, geoLocation, sellerName, contactNo, email,
      images, qrCode, propertyURL,
      ownerUsername: req.body.ownerUsername || '',
      registeredAt:  new Date().toISOString()
    })

    console.log(`\n✅ Property Registered: ${propertyID}`)
    res.json({ success: true, propertyID, qrCode, propertyURL })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /property/:id ─────────────────────────────────────────────────────────
app.get('/property/:id', async (req, res) => {
  try {
    const property = await Property.findOne({ propertyID: req.params.id }).lean()
    if (!property) return res.status(404).json({ error: 'Property not found.' })
    res.json(property)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /properties ───────────────────────────────────────────────────────────
app.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find().lean()
    res.json(properties)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /property/:id ─────────────────────────────────────────────────────────
app.put('/property/:id', upload.array('images', 4), async (req, res) => {
  try {
    const existing = await Property.findOne({ propertyID: req.params.id })
    if (!existing) return res.status(404).json({ success: false, message: 'Property not found.' })

    const updateData = {
      propertyName:  req.body.propertyName  || existing.propertyName,
      size:          req.body.size          || existing.size,
      bedroomType:   req.body.bedroomType   || existing.bedroomType,
      propertyType:  req.body.propertyType  || existing.propertyType,
      positionDate:  req.body.positionDate  || existing.positionDate,
      propertyAge:   req.body.propertyAge   || existing.propertyAge,
      sqftPrice:     req.body.sqftPrice     || existing.sqftPrice,
      boxPrice:      req.body.boxPrice      || existing.boxPrice,
      neighbourhood: req.body.neighbourhood || existing.neighbourhood,
      geoLocation:   req.body.geoLocation   || existing.geoLocation,
      sellerName:    req.body.sellerName    || existing.sellerName,
      contactNo:     req.body.contactNo     || existing.contactNo,
      email:         req.body.email         || existing.email,
      updatedAt:     new Date().toISOString()
    }

    if (req.files && req.files.length > 0) {
      const propDir = path.join(UPLOAD_DIR, existing.propertyID)
      updateData.images = req.files.map((file, i) => {
        const ext     = path.extname(file.originalname)
        const newPath = path.join(propDir, `img-${i + 1}${ext}`)
        fs.renameSync(file.path, newPath)
        return `/uploads/${existing.propertyID}/img-${i + 1}${ext}`
      })
    }

    await Property.findOneAndUpdate({ propertyID: req.params.id }, updateData, { new: true })
    console.log(`\n✏️  Property Updated: ${req.params.id}`)
    res.json({ success: true, message: 'Property updated successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /property/:id ──────────────────────────────────────────────────────
app.delete('/property/:id', async (req, res) => {
  try {
    const deleted = await Property.findOneAndDelete({ propertyID: req.params.id })
    if (!deleted) return res.status(404).json({ success: false, message: 'Property not found.' })
    const propDir = path.join(UPLOAD_DIR, deleted.propertyID)
    if (fs.existsSync(propDir)) fs.rmSync(propDir, { recursive: true })
    res.json({ success: true, message: 'Property deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /property/:id/status ────────────────────────────────────────────────
app.patch('/property/:id/status', async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { propertyID: req.params.id },
      { status: req.body.status, updatedAt: new Date().toISOString() },
      { new: true }
    )
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' })
    res.json({ success: true, message: `Status updated to ${req.body.status}.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /my-properties ────────────────────────────────────────────────────────
app.get('/my-properties', verifyToken, async (req, res) => {
  try {
    const properties = await Property.find({
      ownerUsername: req.user.username
    }).lean()
    res.json(properties)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// BUYER ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── POST /buyer/register ──────────────────────────────────────────────────────
app.post('/buyer/register', async (req, res) => {
  try {
    const { fullName, mobile, email, address,
            budgetMin, budgetMax, preferredCity, preferredType } = req.body

    const duplicate = await Buyer.findOne({
      fullName: { $regex: new RegExp(`^${fullName}$`, 'i') },
      mobile,
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    })

    if (duplicate) {
      console.log(`\n❌ Duplicate buyer: ${fullName}`)
      return res.status(400).json({ success: false, message: 'Buyer already registered.' })
    }

    const count    = await Buyer.countDocuments()
    const buyerID  = generateBuyerID(fullName, count)
    const buyerURL = `${FRONTEND_URL}/buyer/${buyerID}`
    const buyerDir = path.join(BUYERS_DIR, buyerID)
    fs.mkdirSync(buyerDir, { recursive: true })

    const qrFilePath = path.join(buyerDir, 'qr-code.png')
    const buyerQRBuffer = await QRCode.toBuffer(buyerURL)
    const buyerQRUpload = await cloudinary.uploader.upload(
      `data:image/png;base64,${buyerQRBuffer.toString('base64')}`,
      { folder: 'property-registration/qr-codes' }
    )
    const buyerQRCode = buyerQRUpload.secure_url

    await Buyer.create({
      buyerID, fullName, mobile, email, address,
      budgetMin, budgetMax, preferredCity, preferredType,
      qrCode:        buyerQRCode,
      buyerURL,
      status:        '',
      ownerUsername: req.body.ownerUsername || '',
      registeredAt:  new Date().toISOString()
    })

    console.log(`\n✅ Buyer Registered: ${buyerID}`)
    res.json({ success: true, buyerID, qrCode: buyerQRCode, buyerURL })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /buyers ───────────────────────────────────────────────────────────────
app.get('/buyers', async (req, res) => {
  try {
    const buyers = await Buyer.find().lean()
    res.json(buyers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /buyer/:id ────────────────────────────────────────────────────────────
app.get('/buyer/:id', async (req, res) => {
  try {
    const buyer = await Buyer.findOne({ buyerID: req.params.id }).lean()
    if (!buyer) return res.status(404).json({ error: 'Buyer not found.' })
    res.json(buyer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /buyer/:id ────────────────────────────────────────────────────────────
app.put('/buyer/:id', async (req, res) => {
  try {
    const existing = await Buyer.findOne({ buyerID: req.params.id })
    if (!existing) return res.status(404).json({ success: false, message: 'Buyer not found.' })

    await Buyer.findOneAndUpdate(
      { buyerID: req.params.id },
      {
        fullName:      req.body.fullName      || existing.fullName,
        mobile:        req.body.mobile        || existing.mobile,
        email:         req.body.email         || existing.email,
        address:       req.body.address       || existing.address,
        budgetMin:     req.body.budgetMin     || existing.budgetMin,
        budgetMax:     req.body.budgetMax     || existing.budgetMax,
        preferredCity: req.body.preferredCity || existing.preferredCity,
        preferredType: req.body.preferredType || existing.preferredType,
        updatedAt:     new Date().toISOString()
      },
      { new: true }
    )

    console.log(`\n✏️  Buyer Updated: ${req.params.id}`)
    res.json({ success: true, message: 'Buyer updated successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /buyer/:id ─────────────────────────────────────────────────────────
app.delete('/buyer/:id', async (req, res) => {
  try {
    const deleted = await Buyer.findOneAndDelete({ buyerID: req.params.id })
    if (!deleted) return res.status(404).json({ success: false, message: 'Buyer not found.' })

    const buyerDir = path.join(BUYERS_DIR, deleted.buyerID)
    if (fs.existsSync(buyerDir)) fs.rmSync(buyerDir, { recursive: true })

    console.log(`\n🗑️  Buyer Deleted: ${deleted.buyerID}`)
    res.json({ success: true, message: 'Buyer deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /buyer/:id/status ───────────────────────────────────────────────────
app.patch('/buyer/:id/status', async (req, res) => {
  try {
    const buyer = await Buyer.findOneAndUpdate(
      { buyerID: req.params.id },
      { status: req.body.status, updatedAt: new Date().toISOString() },
      { new: true }
    )
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' })
    console.log(`\n🔄 Buyer Status: ${req.params.id} → ${req.body.status}`)
    res.json({ success: true, message: `Status updated to ${req.body.status}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /my-buyers ────────────────────────────────────────────────────────────
app.get('/my-buyers', verifyToken, async (req, res) => {
  try {
    const buyers = await Buyer.find({
      ownerUsername: req.user.username
    }).lean()
    res.json(buyers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── GET /auth/verify ──────────────────────────────────────────────────────────
app.get('/auth/verify', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user })
})

// ── POST /auth/register ───────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required.' })

    const existingUsername = await User.findOne({ username: new RegExp(`^${username}$`, 'i') })
    if (existingUsername)
      return res.status(400).json({ success: false, message: 'Username already taken.' })

    const existingEmail = await User.findOne({ email: new RegExp(`^${email}$`, 'i') })
    if (existingEmail)
      return res.status(400).json({ success: false, message: 'Email already registered.' })

    const hashed = await bcrypt.hash(password, 10)
    await User.create({
      id:        `USER-${Date.now()}`,
      username,  email,
      password:  hashed,
      active:    true,
      createdAt: new Date().toISOString()
    })

    console.log(`\n✅ User Registered: ${username}`)
    res.json({ success: true, message: 'Account created! Please login.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /auth/login ──────────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') })

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password.' })

    if (user.active === false)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' })

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    )

    console.log(`\n✅ User Logged In: ${username}`)
    res.json({ success: true, token, username: user.username })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── POST /admin/register ──────────────────────────────────────────────────────
app.post('/admin/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required.' })

    const existing = await Admin.findOne({ $or: [{ username }, { email }] })
    if (existing)
      return res.status(400).json({ success: false, message: 'Admin already exists.' })

    const hashed = await bcrypt.hash(password, 10)
    await Admin.create({
      id:        `ADMIN-${Date.now()}`,
      username,  email,
      password:  hashed,
      createdAt: new Date().toISOString()
    })

    console.log(`\n✅ Admin Registered: ${username}`)
    res.json({ success: true, message: 'Admin registered successfully!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /admin/login ─────────────────────────────────────────────────────────
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const admin = await Admin.findOne({ username })

    if (!admin || !(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials.' })

    const token = jwt.sign(
      { id: admin.id, role: 'admin', username: admin.username, email: admin.email },
      SECRET,
      { expiresIn: '24h' }
    )

    console.log(`\n✅ Admin Logged In: ${username}`)
    res.json({ success: true, token, role: 'admin', username: admin.username })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /admin/properties ─────────────────────────────────────────────────────
app.get('/admin/properties', verifyAdmin, async (req, res) => {
  try {
    const properties = await Property.find().lean()
    res.json(properties)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /admin/buyers ─────────────────────────────────────────────────────────
app.get('/admin/buyers', verifyAdmin, async (req, res) => {
  try {
    const buyers = await Buyer.find().lean()
    res.json(buyers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /admin/users ──────────────────────────────────────────────────────────
app.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().lean()
    res.json(users.map(u => ({ ...u, password: undefined })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /admin/sellers (alias for users) ─────────────────────────────────────
app.get('/admin/sellers', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().lean()
    res.json(users.map(u => ({ ...u, password: undefined })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /admin/property/:id/approve ────────────────────────────────────────
app.patch('/admin/property/:id/approve', verifyAdmin, async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { propertyID: req.params.id },
      { verified: true, verifiedAt: new Date().toISOString() },
      { new: true }
    )
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' })
    console.log(`\n✅ Property Approved: ${req.params.id}`)
    res.json({ success: true, message: 'Property approved.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /admin/property/:id/reject ─────────────────────────────────────────
app.patch('/admin/property/:id/reject', verifyAdmin, async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { propertyID: req.params.id },
      { verified: false, rejectedAt: new Date().toISOString() },
      { new: true }
    )
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' })
    console.log(`\n❌ Property Rejected: ${req.params.id}`)
    res.json({ success: true, message: 'Property rejected.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /admin/property/:id ────────────────────────────────────────────────
app.delete('/admin/property/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Property.findOneAndDelete({ propertyID: req.params.id })
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found.' })
    const propDir = path.join(UPLOAD_DIR, deleted.propertyID)
    if (fs.existsSync(propDir)) fs.rmSync(propDir, { recursive: true })
    console.log(`\n🗑️  Admin Deleted Property: ${req.params.id}`)
    res.json({ success: true, message: 'Property deleted.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /admin/buyer/:id/deactivate ────────────────────────────────────────
app.patch('/admin/buyer/:id/deactivate', verifyAdmin, async (req, res) => {
  try {
    const buyer = await Buyer.findOneAndUpdate(
      { buyerID: req.params.id },
      { active: false },
      { new: true }
    )
    if (!buyer) return res.status(404).json({ success: false, message: 'Not found.' })
    console.log(`\n🔒 Buyer Deactivated: ${req.params.id}`)
    res.json({ success: true, message: 'Buyer deactivated.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /admin/user/:id/deactivate ─────────────────────────────────────────
app.patch('/admin/user/:id/deactivate', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { id: req.params.id },
      { active: false },
      { new: true }
    )
    if (!user) return res.status(404).json({ error: 'User not found.' })
    console.log(`\n🔒 User Deactivated: ${req.params.id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /admin/user/:id/reactivate ─────────────────────────────────────────
app.patch('/admin/user/:id/reactivate', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { id: req.params.id },
      { active: true },
      { new: true }
    )
    if (!user) return res.status(404).json({ error: 'User not found.' })
    console.log(`\n✅ User Reactivated: ${req.params.id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /admin/stats ──────────────────────────────────────────────────────────
app.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const [users, buyers, properties] = await Promise.all([
      User.countDocuments(),
      Buyer.countDocuments(),
      Property.find().lean()
    ])
    res.json({
      totalUsers:      users,
      totalBuyers:     buyers,
      totalProperties: properties.length,
      pending:         properties.filter(p => p.verified == null).length,
      verified:        properties.filter(p => p.verified === true).length,
      rejected:        properties.filter(p => p.verified === false).length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── GET /dashboard/seller/stats ───────────────────────────────────────────────
app.get('/dashboard/seller/stats', verifyToken, async (req, res) => {
  try {
    const all = await Property.find({ ownerUsername: req.user.username }).lean()
    res.json({
      total:     all.length,
      available: all.filter(p => p.status === 'Available').length,
      sold:      all.filter(p => p.status === 'Sold').length,
      onHold:    all.filter(p => p.status === 'On Hold').length,
      verified:  all.filter(p => p.verified === true).length,
      pending:   all.filter(p => p.verified == null).length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /dashboard/buyer/stats ────────────────────────────────────────────────
app.get('/dashboard/buyer/stats', verifyToken, async (req, res) => {
  try {
    const all    = await Property.find().lean()
    const cities = [...new Set(all.map(p => p.geoLocation))]
    res.json({
      totalProperties: all.length,
      totalCities:     cities.length,
      verified:        all.filter(p => p.verified === true).length,
      available:       all.filter(p => p.status === 'Available').length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /dashboard/properties ─────────────────────────────────────────────────
app.get('/dashboard/properties', verifyToken, async (req, res) => {
  try {
    const properties = await Property.find().lean()
    res.json(properties)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /map/properties ───────────────────────────────────────────────────────
app.get('/map/properties', async (req, res) => {
  try {
    const props = await Property.find().lean()
    res.json(props.map(p => ({
      propertyID:    p.propertyID,
      propertyName:  p.propertyName,
      geoLocation:   p.geoLocation,
      neighbourhood: p.neighbourhood,
      bedroomType:   p.bedroomType,
      propertyType:  p.propertyType,
      sqftPrice:     p.sqftPrice,
      boxPrice:      p.boxPrice   || null,
      status:        p.status     || 'Available',
      verified:      p.verified   ?? null,
      images:        p.images     || []
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// MESSAGING + NOTIFICATION ROUTES (MongoDB)
// ════════════════════════════════════════════════════════════════════════════

// ── GET /messages/:roomID ─────────────────────────────────────────────────────
app.get('/messages/:roomID', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ roomID: req.params.roomID })
      .sort({ timestamp: 1 })
      .lean()
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /conversations ────────────────────────────────────────────────────────
app.get('/conversations', verifyToken, async (req, res) => {
  try {
    const username = req.user.username
    const rooms    = await Message.distinct('roomID', {
      $or: [{ from: username }, { to: username }]
    })

    const conversations = await Promise.all(rooms.map(async roomID => {
      const lastMessage = await Message.findOne({ roomID })
        .sort({ timestamp: -1 }).lean()
      const unread = await Message.countDocuments({
        roomID, to: username, read: false
      })
      return { roomID, lastMessage, unread }
    }))

    res.json(conversations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /notifications ────────────────────────────────────────────────────────
app.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ to: req.user.username })
      .sort({ timestamp: -1 })
      .lean()
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /notifications/read ─────────────────────────────────────────────────
app.patch('/notifications/read', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { to: req.user.username },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /notifications/read/:id ────────────────────────────────────────────
app.patch('/notifications/read/:id', verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { id: req.params.id, to: req.user.username },
      { read: true },
      { new: true }
    )
    if (!notif) return res.status(404).json({ error: 'Notification not found.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /upload-chat-file ────────────────────────────────────────────────────
const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_DIR, 'chat')
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
})

app.post('/upload-chat-file', verifyToken, chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  res.json({ url: `/uploads/chat/${req.file.filename}` })
})


const server = http.createServer(app)
initSocket(server)

// ── POST /admin/regenerate-qr ─────────────────────────────────────────────────
app.post('/admin/regenerate-qr', verifyAdmin, async (req, res) => {
  try {
    const properties = await Property.find()
    const buyers     = await Buyer.find()
    let   updated    = 0

    for (const p of properties) {
      const newURL     = `${FRONTEND_URL}/property/${p.propertyID}`
      const qrFilePath = path.join(UPLOAD_DIR, p.propertyID, 'qr-code.png')
      fs.mkdirSync(path.dirname(qrFilePath), { recursive: true })
      await QRCode.toFile(qrFilePath, newURL)
      await Property.findOneAndUpdate(
        { propertyID: p.propertyID },
        { propertyURL: newURL },
        { new: true }
      )
      updated++
      console.log(`✅ QR regenerated: ${p.propertyID} → ${newURL}`)
    }

    for (const b of buyers) {
      const newURL     = `${FRONTEND_URL}/buyer/${b.buyerID}`
      const qrFilePath = path.join(BUYERS_DIR, b.buyerID, 'qr-code.png')
      fs.mkdirSync(path.dirname(qrFilePath), { recursive: true })
      await QRCode.toFile(qrFilePath, newURL)
      await Buyer.findOneAndUpdate(
        { buyerID: b.buyerID },
        { buyerURL: newURL },
        { new: true }
      )
      updated++
      console.log(`✅ QR regenerated: ${b.buyerID} → ${newURL}`)
    }
    res.json({
      success: true,
      updated,
      message:      `${updated} QR codes regenerated!`,
      frontend_url: FRONTEND_URL
    })
  } catch (err) {
    console.error('QR regeneration error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    await connectDB()
    console.log('✅ MongoDB Connected')
    server.listen(PORT, '::', () => {
      console.log(`✅ Server running at http://[::1]:${PORT}`)
      console.log(`   Local   : http://localhost:${PORT}`)
      console.log(`   Network : http://${LOCAL_IP}:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Server failed to start:', err)
    process.exit(1)
  }
}

startServer()