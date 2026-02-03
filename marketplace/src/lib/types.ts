// Marketplace types

export type CommodityType = 'Gold' | 'Oil' | 'Coffee' | 'Wheat' | 'Copper' | 'Cotton' | 'Soybeans'

export interface Commodity {
  id: string
  supplierId: string
  supplierName: string
  type: CommodityType
  title: string
  description: string
  quantity: number
  unit: string
  pricePerUnit: string
  currency: 'GOLD'
  minOrder: number
  maxOrder: number
  origin: string
  certifications: string[]
  images: string[]
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  address: string
  companyName: string
  country: string
  verified: boolean
  rating: number
  totalTrades: number
  joinedAt: string
  commodities: string[]
}

export interface Buyer {
  id: string
  address: string
  companyName: string
  country: string
  verified: boolean
  totalPurchases: number
  joinedAt: string
}

export type OrderStatus = 'Pending LC' | 'LC Issued' | 'Shipped' | 'Customs' | 'Delivered' | 'Settled' | 'Disputed'

export interface PurchaseOrder {
  id: string
  buyerId: string
  buyerName: string
  supplierId: string
  supplierName: string
  commodityId: string
  commodityTitle: string
  commodityType: CommodityType
  quantity: number
  unit: string
  pricePerUnit: string
  totalValue: string
  status: OrderStatus
  lcId?: string
  createdAt: string
  updatedAt: string
}

export type LCStatus = 'Draft' | 'Active' | 'Shipping' | 'Customs' | 'Delivered' | 'Settled' | 'Disputed'

export interface LetterOfCredit {
  id: string
  lcNumber: string
  poId: string
  buyerId: string
  supplierId: string
  amount: string
  paymentTerms: {
    stage1Percent: number // Shipment - default 30%
    stage2Percent: number // Customs - default 50%
    stage3Percent: number // Delivery - default 20%
  }
  paymentsReleased: {
    stage1: boolean
    stage1Amount: string
    stage1Date?: string
    stage2: boolean
    stage2Amount: string
    stage2Date?: string
    stage3: boolean
    stage3Amount: string
    stage3Date?: string
  }
  documents: TradeDocument[]
  platformFee: string
  status: LCStatus
  createdAt: string
  updatedAt: string
}

export type DocumentType = 'Bill of Lading' | 'Certificate of Origin' | 'Quality Inspection' | 'Delivery Proof' | 'Commercial Invoice' | 'Packing List'

export interface TradeDocument {
  id: string
  lcId: string
  type: DocumentType
  filename: string
  hash: string
  uploadedBy: string
  uploadedAt: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
}

export interface StakingPosition {
  id: string
  address: string
  stakedAmount: string
  lockPeriod: number // 0, 30, 60, 90 days
  startDate: string
  unlockDate: string
  baseRate: number
  bonusMultiplier: number
  effectiveRate: number
  accruedYield: string
  status: 'active' | 'locked' | 'unlocking'
}

// Auth types
export interface User {
  address: string
  role: 'supplier' | 'buyer' | 'admin'
  companyName?: string
  verified: boolean
}
