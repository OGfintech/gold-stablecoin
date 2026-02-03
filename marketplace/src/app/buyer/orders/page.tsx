'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  Truck,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Filter,
  Eye,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock orders data for buyer
const mockOrders = [
  {
    id: 'ORD-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    commodityId: 'CMD001',
    supplierName: 'Colombian Coffee Exports',
    supplierId: 'supplier_001',
    quantity: 1000,
    unit: 'kg',
    totalPrice: '450',
    status: 'shipped',
    lcStatus: 'in_progress',
    milestoneCompleted: 1,
    paymentReleased: '135',
    paymentPending: '315',
    shipmentId: 'SHP-2026-001',
    estimatedDelivery: '2026-02-15',
    createdAt: '2026-01-28T10:30:00Z',
    updatedAt: '2026-01-30T14:20:00Z',
  },
  {
    id: 'ORD-2026-005',
    commodityName: 'Grade A Copper Cathode',
    commodityId: 'CMD003',
    supplierName: 'Chile Metals Corp',
    supplierId: 'supplier_002',
    quantity: 50,
    unit: 'MT',
    totalPrice: '44500',
    status: 'lc_created',
    lcStatus: 'funded',
    milestoneCompleted: 0,
    paymentReleased: '0',
    paymentPending: '44500',
    shipmentId: null,
    estimatedDelivery: null,
    createdAt: '2026-01-31T09:00:00Z',
    updatedAt: '2026-01-31T09:00:00Z',
  },
  {
    id: 'ORD-2026-006',
    commodityName: 'Organic Raw Cotton',
    commodityId: 'CMD002',
    supplierName: 'Colombian Coffee Exports',
    supplierId: 'supplier_001',
    quantity: 2000,
    unit: 'kg',
    totalPrice: '500',
    status: 'customs',
    lcStatus: 'in_progress',
    milestoneCompleted: 2,
    paymentReleased: '400',
    paymentPending: '100',
    shipmentId: 'SHP-2026-003',
    estimatedDelivery: '2026-02-08',
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-30T16:00:00Z',
  },
  {
    id: 'ORD-2026-007',
    commodityName: 'Premium Arabica Coffee Beans',
    commodityId: 'CMD001',
    supplierName: 'Colombian Coffee Exports',
    supplierId: 'supplier_001',
    quantity: 500,
    unit: 'kg',
    totalPrice: '225',
    status: 'completed',
    lcStatus: 'completed',
    milestoneCompleted: 3,
    paymentReleased: '225',
    paymentPending: '0',
    shipmentId: 'SHP-2026-002',
    estimatedDelivery: '2026-01-25',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-25T14:00:00Z',
  },
]

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', icon: Clock },
  lc_created: { label: 'LC Funded', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: FileCheck },
  shipped: { label: 'Shipped', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Truck },
  customs: { label: 'In Customs', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: FileCheck },
  delivered: { label: 'Delivered', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: CheckCircle },
  completed: { label: 'Completed', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: AlertCircle },
}

export default function BuyerOrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'buyer')) {
      router.push('/login?role=buyer')
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading || !isAuthenticated || user?.role !== 'buyer') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.commodityName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: mockOrders.length,
    active: mockOrders.filter(o => ['lc_created', 'shipped', 'customs'].includes(o.status)).length,
    completed: mockOrders.filter(o => o.status === 'completed').length,
    totalSpent: mockOrders.reduce((acc, o) => acc + parseFloat(o.paymentReleased), 0),
    inEscrow: mockOrders.reduce((acc, o) => acc + parseFloat(o.paymentPending), 0),
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="text-gray-400 mt-1">Track your purchases and payments</p>
          </div>
          <Link
            href="/commodities"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Package className="w-5 h-5" />
            Browse Commodities
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Orders</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Active Orders</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats.active}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Completed</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Paid</div>
            <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.totalSpent.toLocaleString()} GOLD</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">In Escrow</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{stats.inEscrow.toLocaleString()} GOLD</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID, supplier, or commodity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'lc_created', 'shipped', 'customs', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Package
            return (
              <div
                key={order.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 ${statusConfig[order.status]?.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[order.status]?.label}
                      </span>
                      <span className="text-gray-500 text-sm">{order.id}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white">{order.commodityName}</h3>
                    <p className="text-gray-400 text-sm">
                      From: {order.supplierName} • {order.quantity.toLocaleString()} {order.unit}
                    </p>
                    {order.estimatedDelivery && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Payment Progress */}
                  <div className="lg:w-64">
                    <div className="text-sm text-gray-400 mb-2">Payment Progress</div>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3].map((milestone) => (
                        <div key={milestone} className="flex-1">
                          <div
                            className={`h-2 rounded-full ${
                              milestone <= order.milestoneCompleted
                                ? 'bg-green-500'
                                : 'bg-gray-700'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Released: {order.paymentReleased} GOLD</span>
                      <span>Pending: {order.paymentPending} GOLD</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-500">{order.totalPrice} GOLD</div>
                      <div className="text-sm text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/buyer/orders/${order.id}`}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </div>

                {/* Status-specific actions */}
                {order.status === 'lc_created' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Waiting for supplier to ship</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {order.totalPrice} GOLD in escrow
                    </span>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm">Shipment in transit</span>
                    </div>
                    <Link
                      href={`/buyer/shipments/${order.shipmentId}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Track Shipment →
                    </Link>
                  </div>
                )}

                {order.status === 'customs' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400">
                      <FileCheck className="w-4 h-4" />
                      <span className="text-sm">Customs clearance in progress</span>
                    </div>
                    <span className="text-green-400 text-sm">
                      80% released ({(parseFloat(order.totalPrice) * 0.8).toFixed(2)} GOLD)
                    </span>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Ready to confirm delivery</span>
                    </div>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors">
                      Confirm & Release Final Payment
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No orders found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by browsing commodities'}
              </p>
              <Link
                href="/commodities"
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Package className="w-4 h-4" />
                Browse Commodities
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
