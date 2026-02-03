'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Package,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Minus,
  Plus,
  ShoppingCart,
  Eye,
  Star,
  Truck,
  FileCheck
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock commodity data (would come from API)
const mockCommodities: Record<string, any> = {
  'CMD001': {
    id: 'CMD001',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    supplierRating: 4.8,
    supplierOrders: 156,
    name: 'Premium Arabica Coffee Beans',
    category: 'coffee',
    description: 'High-altitude single origin coffee from Colombian highlands. Cupping score 85+. These beans are grown at elevations above 1,500 meters, ensuring optimal flavor development. Our coffee is shade-grown and hand-picked at peak ripeness.',
    quantity: 5000,
    unit: 'kg',
    pricePerUnit: '0.45',
    minOrderQuantity: 500,
    origin: 'Colombia',
    certifications: ['Organic Certified', 'Fair Trade', 'Rainforest Alliance'],
    images: [],
    status: 'active',
    views: 234,
    specs: {
      'Grade': 'Specialty Grade',
      'Processing': 'Washed',
      'Altitude': '1,500-2,000m',
      'Harvest': 'October-January',
      'Moisture': '10-12%',
      'Screen Size': '15-18'
    },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-28T14:30:00Z'
  },
  'CMD002': {
    id: 'CMD002',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    supplierRating: 4.8,
    supplierOrders: 156,
    name: 'Organic Raw Cotton',
    category: 'cotton',
    description: 'Premium organic cotton, suitable for high-end textile production. Grown without pesticides or synthetic fertilizers. GOTS certified for organic textile processing.',
    quantity: 10000,
    unit: 'kg',
    pricePerUnit: '0.25',
    minOrderQuantity: 1000,
    origin: 'India',
    certifications: ['Organic Certified', 'GOTS'],
    images: [],
    status: 'active',
    views: 189,
    specs: {
      'Staple Length': '28-30mm',
      'Micronaire': '3.8-4.2',
      'Strength': '28-30 g/tex',
      'Uniformity': '82-84%',
      'Trash Content': '<1%'
    },
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-25T11:00:00Z'
  },
  'CMD003': {
    id: 'CMD003',
    supplierId: 'supplier_002',
    supplierName: 'Chile Metals Corp',
    supplierRating: 4.9,
    supplierOrders: 89,
    name: 'Grade A Copper Cathode',
    category: 'copper',
    description: 'LME Grade A copper cathode, 99.99% purity. Direct from Chilean mines. Suitable for electrical applications, plumbing, and industrial manufacturing.',
    quantity: 2500,
    unit: 'MT',
    pricePerUnit: '890',
    minOrderQuantity: 25,
    origin: 'Chile',
    certifications: ['LME Certified', 'ISO 9001'],
    images: [],
    status: 'active',
    views: 98,
    specs: {
      'Purity': '99.99%',
      'LME Brand': 'Approved',
      'Weight per Cathode': '100-125 kg',
      'Dimensions': '1000 x 1000 x 10mm'
    },
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-01-30T10:00:00Z'
  },
  'CMD004': {
    id: 'CMD004',
    supplierId: 'supplier_003',
    supplierName: 'Gulf Oil Trading',
    supplierRating: 4.7,
    supplierOrders: 203,
    name: 'Brent Crude Oil',
    category: 'oil',
    description: 'Light sweet crude oil, API gravity 38 degrees. Low sulfur content makes it ideal for refining into gasoline and diesel.',
    quantity: 50000,
    unit: 'barrel',
    pricePerUnit: '1.05',
    minOrderQuantity: 1000,
    origin: 'UAE',
    certifications: [],
    images: [],
    status: 'active',
    views: 456,
    specs: {
      'API Gravity': '38°',
      'Sulfur Content': '0.37%',
      'Pour Point': '-6°C',
      'Viscosity': '3.5 cSt @ 40°C'
    },
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-29T16:00:00Z'
  }
}

const categoryEmoji: Record<string, string> = {
  gold: '🪙',
  coffee: '☕',
  oil: '🛢️',
  wheat: '🌾',
  copper: '🔶',
  cotton: '🧶',
  other: '📦',
}

export default function CommodityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [quantity, setQuantity] = useState(0)
  const [isOrdering, setIsOrdering] = useState(false)

  const commodity = mockCommodities[params.id as string]

  if (!commodity) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Commodity Not Found</h1>
          <p className="text-gray-400 mb-4">The commodity you're looking for doesn't exist.</p>
          <Link href="/commodities" className="text-yellow-500 hover:text-yellow-400">
            ← Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const minQty = commodity.minOrderQuantity
  const maxQty = commodity.quantity
  const totalPrice = (quantity * parseFloat(commodity.pricePerUnit)).toFixed(2)

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta
    if (newQty >= 0 && newQty <= maxQty) {
      setQuantity(newQty)
    }
  }

  const setMinQuantity = () => setQuantity(minQty)

  const handleOrder = async () => {
    if (!isAuthenticated) {
      router.push('/login?role=buyer&redirect=' + encodeURIComponent(`/commodities/${commodity.id}`))
      return
    }

    if (quantity < minQty) {
      alert(`Minimum order quantity is ${minQty} ${commodity.unit}`)
      return
    }

    setIsOrdering(true)
    // Would call API here
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push(`/buyer/orders/new?commodity=${commodity.id}&quantity=${quantity}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/commodities"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{categoryEmoji[commodity.category]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm capitalize">
                      {commodity.status}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {commodity.views} views
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">{commodity.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {commodity.origin}
                    </span>
                    <span>ID: {commodity.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">{commodity.description}</p>
            </div>

            {/* Specifications */}
            {commodity.specs && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Specifications</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(commodity.specs).map(([key, value]) => (
                    <div key={key} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">{key}</div>
                      <div className="text-white font-medium">{value as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {commodity.certifications.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Certifications</h2>
                <div className="flex flex-wrap gap-2">
                  {commodity.certifications.map((cert: string) => (
                    <span
                      key={cert}
                      className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Smart LC Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Protected by Smart Letter of Credit
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">30% on Shipment</div>
                    <div className="text-sm text-gray-400">When Bill of Lading verified</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">50% on Customs</div>
                    <div className="text-sm text-gray-400">When cleared at destination</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">20% on Delivery</div>
                    <div className="text-sm text-gray-400">When you confirm receipt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Order Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <div className="text-sm text-gray-400">Price per {commodity.unit}</div>
                <div className="text-3xl font-bold text-yellow-500">
                  {commodity.pricePerUnit} GOLD
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  ≈ ${(parseFloat(commodity.pricePerUnit) * 85).toFixed(2)} USD
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
                <div>
                  <div className="text-sm text-gray-400">Available</div>
                  <div className="text-white font-medium">
                    {commodity.quantity.toLocaleString()} {commodity.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Min. Order</div>
                  <div className="text-white font-medium">
                    {commodity.minOrderQuantity.toLocaleString()} {commodity.unit}
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Quantity ({commodity.unit})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(-100)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={quantity <= 0}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      if (val >= 0 && val <= maxQty) setQuantity(val)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center focus:outline-none focus:border-yellow-500/50"
                  />
                  <button
                    onClick={() => handleQuantityChange(100)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={quantity >= maxQty}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {quantity > 0 && quantity < minQty && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Min. order is {minQty} {commodity.unit}
                    <button onClick={setMinQuantity} className="underline">Set minimum</button>
                  </div>
                )}
              </div>

              {/* Total */}
              {quantity > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">{totalPrice} GOLD</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Platform Fee (0.5%)</span>
                    <span className="text-white">{(parseFloat(totalPrice) * 0.005).toFixed(2)} GOLD</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-yellow-500 font-bold text-xl">
                      {(parseFloat(totalPrice) * 1.005).toFixed(2)} GOLD
                    </span>
                  </div>
                </div>
              )}

              {/* Order Button */}
              <button
                onClick={handleOrder}
                disabled={quantity < minQty || isOrdering}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOrdering ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {isAuthenticated ? 'Place Order' : 'Login to Order'}
                  </>
                )}
              </button>

              {/* Supplier Info */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Supplier</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{commodity.supplierName}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {commodity.supplierRating} ({commodity.supplierOrders} orders)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
