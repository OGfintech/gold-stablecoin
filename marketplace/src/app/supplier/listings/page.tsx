'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../providers'
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  Filter,
  TrendingUp,
  Pause,
  Play
} from 'lucide-react'

// Mock data for listings
const mockListings = [
  {
    id: 'LST001',
    name: 'Premium Arabica Coffee Beans',
    category: 'coffee',
    quantity: 5000,
    unit: 'kg',
    pricePerUnit: '0.45',
    minOrderQuantity: 500,
    origin: 'Colombia',
    status: 'active',
    views: 234,
    orders: 3,
    createdAt: '2026-01-15',
  },
  {
    id: 'LST002',
    name: 'Organic Raw Cotton',
    category: 'cotton',
    quantity: 10000,
    unit: 'kg',
    pricePerUnit: '0.25',
    minOrderQuantity: 1000,
    origin: 'India',
    status: 'active',
    views: 189,
    orders: 1,
    createdAt: '2026-01-20',
  },
  {
    id: 'LST003',
    name: 'Grade A Copper Cathode',
    category: 'copper',
    quantity: 2500,
    unit: 'MT',
    pricePerUnit: '890',
    minOrderQuantity: 25,
    origin: 'Chile',
    status: 'paused',
    views: 98,
    orders: 0,
    createdAt: '2026-01-25',
  },
]

const categoryEmoji: Record<string, string> = {
  gold: '🪙',
  coffee: '☕',
  oil: '🛢️',
  wheat: '🌾',
  copper: '🔶',
  cotton: '🧶',
  other: '📦',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  sold_out: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function SupplierListingsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalValue = mockListings.reduce((acc, l) =>
    acc + (parseFloat(l.pricePerUnit) * l.quantity), 0
  )

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Listings</h1>
            <p className="text-gray-400 mt-1">Manage your commodity listings</p>
          </div>
          <Link
            href="/supplier/listings/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Listings</div>
            <div className="text-2xl font-bold text-white mt-1">{mockListings.length}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {mockListings.filter(l => l.status === 'active').length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Views</div>
            <div className="text-2xl font-bold text-white mt-1">
              {mockListings.reduce((acc, l) => acc + l.views, 0)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Inventory Value</div>
            <div className="text-2xl font-bold text-yellow-500 mt-1">
              {totalValue.toLocaleString()} GOLD
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'paused', 'sold_out'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Commodity</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Inventory</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Price</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Performance</th>
                  <th className="text-right text-gray-400 font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryEmoji[listing.category]}</span>
                        <div>
                          <div className="font-medium text-white">{listing.name}</div>
                          <div className="text-sm text-gray-400">
                            {listing.origin} • ID: {listing.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {listing.quantity.toLocaleString()} {listing.unit}
                      </div>
                      <div className="text-sm text-gray-400">
                        Min: {listing.minOrderQuantity} {listing.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-yellow-500 font-medium">
                        {listing.pricePerUnit} GOLD/{listing.unit}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total: {(parseFloat(listing.pricePerUnit) * listing.quantity).toLocaleString()} GOLD
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[listing.status]}`}>
                        {listing.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{listing.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{listing.orders} orders</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/supplier/listings/${listing.id}/edit`}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </Link>
                        <button
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title={listing.status === 'active' ? 'Pause listing' : 'Activate listing'}
                        >
                          {listing.status === 'active' ? (
                            <Pause className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Play className="w-4 h-4 text-green-400" />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === listing.id ? null : listing.id)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          {openMenu === listing.id && (
                            <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <Link
                                href={`/commodities/${listing.id}`}
                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                              >
                                View Public
                              </Link>
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">
                                Duplicate
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No listings found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first listing to start selling'}
              </p>
              <Link
                href="/supplier/listings/new"
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
