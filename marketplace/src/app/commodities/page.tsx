'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, MapPin, Star, Shield, Package, ArrowRight } from 'lucide-react'
import { CommodityType } from '@/lib/types'

// Mock commodities data
const mockCommodities = [
  {
    id: 'comm_001',
    supplierId: 'gc_supplier_gold_corp',
    supplierName: 'Gold Mining Corp',
    type: 'Gold' as CommodityType,
    title: 'Fine Gold Bars (1kg)',
    description: '999.9 purity gold bars, LBMA certified. Direct from refinery.',
    quantity: 500,
    unit: 'kg',
    pricePerUnit: '62.50',
    origin: 'South Africa',
    certifications: ['LBMA', 'RJC'],
    rating: 4.9,
    trades: 234
  },
  {
    id: 'comm_002',
    supplierId: 'gc_supplier_agri_trade',
    supplierName: 'AgriTrade International',
    type: 'Coffee' as CommodityType,
    title: 'Arabica Green Coffee Beans',
    description: 'Premium grade specialty Arabica beans. Single origin, direct trade.',
    quantity: 50000,
    unit: 'kg',
    pricePerUnit: '0.08',
    origin: 'Brazil',
    certifications: ['Fair Trade', 'Rainforest Alliance'],
    rating: 4.7,
    trades: 156
  },
  {
    id: 'comm_003',
    supplierId: 'gc_supplier_oil_global',
    supplierName: 'Global Oil Trading',
    type: 'Oil' as CommodityType,
    title: 'Brent Crude Oil',
    description: 'Light sweet crude oil. FOB delivery from North Sea terminals.',
    quantity: 100000,
    unit: 'barrels',
    pricePerUnit: '1.20',
    origin: 'United Kingdom',
    certifications: ['ISO 9001'],
    rating: 4.8,
    trades: 89
  },
  {
    id: 'comm_004',
    supplierId: 'gc_supplier_agri_trade',
    supplierName: 'AgriTrade International',
    type: 'Wheat' as CommodityType,
    title: 'Hard Red Winter Wheat',
    description: 'High protein wheat for bread and baking. Harvest 2026.',
    quantity: 200000,
    unit: 'bushels',
    pricePerUnit: '0.012',
    origin: 'Argentina',
    certifications: ['Non-GMO'],
    rating: 4.6,
    trades: 78
  },
  {
    id: 'comm_005',
    supplierId: 'gc_supplier_metals_co',
    supplierName: 'Metals Trading Co',
    type: 'Copper' as CommodityType,
    title: 'LME Grade A Copper Cathodes',
    description: '99.99% purity copper cathodes. LME registered brand.',
    quantity: 1000,
    unit: 'tonnes',
    pricePerUnit: '13.50',
    origin: 'Chile',
    certifications: ['LME Approved'],
    rating: 4.8,
    trades: 145
  },
  {
    id: 'comm_006',
    supplierId: 'gc_supplier_cotton_tex',
    supplierName: 'Cotton Textiles Ltd',
    type: 'Cotton' as CommodityType,
    title: 'Upland Cotton Bales',
    description: 'Medium staple cotton, ideal for textiles. Quality certified.',
    quantity: 5000,
    unit: 'bales',
    pricePerUnit: '1.25',
    origin: 'India',
    certifications: ['BCI', 'GOTS'],
    rating: 4.5,
    trades: 67
  },
  {
    id: 'comm_007',
    supplierId: 'gc_supplier_agri_trade',
    supplierName: 'AgriTrade International',
    type: 'Soybeans' as CommodityType,
    title: 'Non-GMO Soybeans',
    description: 'Premium grade soybeans for processing. Certified non-GMO.',
    quantity: 100000,
    unit: 'bushels',
    pricePerUnit: '0.018',
    origin: 'Brazil',
    certifications: ['Non-GMO', 'RTRS'],
    rating: 4.7,
    trades: 112
  },
  {
    id: 'comm_008',
    supplierId: 'gc_supplier_gold_corp',
    supplierName: 'Gold Mining Corp',
    type: 'Gold' as CommodityType,
    title: 'Gold Coins (1oz Krugerrand)',
    description: 'South African Krugerrand coins. 1oz fine gold each.',
    quantity: 10000,
    unit: 'coins',
    pricePerUnit: '2.05',
    origin: 'South Africa',
    certifications: ['LBMA'],
    rating: 4.9,
    trades: 567
  },
]

const commodityTypes: CommodityType[] = ['Gold', 'Oil', 'Coffee', 'Wheat', 'Copper', 'Cotton', 'Soybeans']

const typeEmoji: Record<CommodityType, string> = {
  Gold: '🪙',
  Oil: '🛢️',
  Coffee: '☕',
  Wheat: '🌾',
  Copper: '🔶',
  Cotton: '🧶',
  Soybeans: '🫘'
}

function CommoditiesContent() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as CommodityType | null

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<CommodityType | null>(initialType)
  const [sortBy, setSortBy] = useState<'rating' | 'trades' | 'price'>('rating')

  const filteredCommodities = mockCommodities
    .filter(c => {
      if (selectedType && c.type !== selectedType) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.supplierName.toLowerCase().includes(query) ||
          c.origin.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'trades') return b.trades - a.trades
      return parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit)
    })

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Commodities</h1>
          <p className="text-gray-400">Find verified suppliers for global commodities</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodities, suppliers, origins..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="trades">Sort by Trades</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedType
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {commodityTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedType === type
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{typeEmoji[type]}</span>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-gray-400 mb-4">
          {filteredCommodities.length} listings found
        </div>

        {/* Commodity Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommodities.map(commodity => (
            <Link
              key={commodity.id}
              href={`/commodities/${commodity.id}`}
              className="bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500/30 transition-all overflow-hidden group"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{typeEmoji[commodity.type]}</div>
                    <div>
                      <div className="text-sm text-gray-400">{commodity.type}</div>
                      <div className="text-white font-semibold">{commodity.title}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {commodity.description}
                </p>

                {/* Price & Quantity */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-yellow-500">
                    {commodity.pricePerUnit}
                  </span>
                  <span className="text-gray-500">GOLD / {commodity.unit}</span>
                </div>

                <div className="text-sm text-gray-400 mb-4">
                  Available: {commodity.quantity.toLocaleString()} {commodity.unit}
                </div>

                {/* Certifications */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {commodity.certifications.map(cert => (
                    <span key={cert} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {cert}
                    </span>
                  ))}
                </div>

                {/* Supplier Info */}
                <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {commodity.origin}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      {commodity.rating}
                    </span>
                    <span className="text-gray-500">
                      {commodity.trades} trades
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{commodity.supplierName}</span>
                  <span className="text-yellow-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredCommodities.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No commodities found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommoditiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading commodities...</div>
      </div>
    }>
      <CommoditiesContent />
    </Suspense>
  )
}
