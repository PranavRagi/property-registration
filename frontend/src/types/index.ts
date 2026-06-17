export type PropertyStatus = 'Available' | 'On Hold' | 'Sold' | ''

export interface PropertyForm {
  propertyName:  string
  size:          string
  bedroomType:   string
  propertyType:  string
  positionDate:  string
  propertyAge:   string
  sqftPrice:     string
  boxPrice:      string
  neighbourhood: string
  geoLocation:   string
  sellerName:    string
  contactNo:     string
  email:         string
  status:        string
}

export interface Property {
  propertyID:    string
  propertyName:  string
  size:          string
  bedroomType:   string
  propertyType:  'Under Construction' | 'Immediate Available'
  positionDate:  string | null
  propertyAge:   string | null
  sqftPrice:     string
  boxPrice:      string | null
  neighbourhood: string
  geoLocation:   string
  sellerName:    string
  contactNo:     string
  email:         string
  images:        string[]
  qrCode:        string
  propertyURL:   string
  registeredAt:  string
  status:        string
  ownerUsername: string      // ← add this
  verified?:     boolean     // ← add this
  updatedAt?:    string      // ← add this
}

export interface BuyerForm {
  fullName:      string
  mobile:        string
  email:         string
  address:       string
  budgetMin:     string
  budgetMax:     string
  preferredCity: string
  preferredType: string
}

export interface Buyer {
  buyerID:       string
  fullName:      string
  mobile:        string
  email:         string
  address:       string
  budgetMin:     string
  budgetMax:     string
  preferredCity: string
  preferredType: string
  qrCode:        string
  buyerURL:      string
  status:        string
  ownerUsername: string      // ← add this
  registeredAt:  string
  updatedAt?:    string
}

// ── Auth types ────────────────────────────────────────────────────────────
export interface AuthUser {
  id:        string
  username:  string
  email:     string
  role:      'seller' | 'buyer' | 'admin'
  createdAt: string
}

// ── Dashboard Stats types ─────────────────────────────────────────────────
export interface SellerStats {
  total:     number
  available: number
  sold:      number
  onHold:    number
  verified:  number
  pending:   number
}

export interface BuyerStats {
  totalProperties: number
  totalCities:     number
  verified:        number
  available:       number
}

export interface AdminStats {
  totalProperties: number
  totalBuyers:     number
  totalSellers:    number
  pending:         number
  verified:        number
  rejected:        number
}

// ── Messaging & Notifications ─────────────────────────────────────────────────
export interface Message{
  id:string
  from:string
  to:string
  type: 'text' | 'file' | 'audio' | 'video'
  content: string
  propertyID: string | null
  timestamp: string
  read: boolean
}

export interface Conversation{
  roomID: string
  lastMessage: Message | null
  unread: number
}

export interface Notification{
  id:string
  to:string
  from:string
  type: 'newMessage' | 'newConversation'
  message:string
  roomID: string
  read: boolean
  timestamp: string
}

// ── Phase 6 — Map & Analytics ─────────────────────────────────────────────
export interface MapPropety{
  propertyID: string
  propertyName: string
  geoLocation: string
  neighbourhood: string
  bedroomType: string
  propertyType: string
  sqftPrice: string
  boxPrice: string | null
  status: string
  verified?: boolean | null
  images: string[]
}

export interface SellerAnalytics{
  total: number
  available: number
  sold: number
  onHold: number
  verified: number
  pending: number
}

export interface BuyerAnalytics {
  totalProperties: number
  totalCities: number
  verified: number
  available: number
}