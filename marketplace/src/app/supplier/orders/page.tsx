'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Eye,
  Search,
  Clock,
  CheckCircle,
  Truck,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Filter
} from 'lucide-react'

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    commodityId: 'LST001',
    buyerName: 'Global Foods Inc.',
    buyerId: 'buyer_001',
    quantity: 1000,
    unit: 'kg',
    totalPrice: '450',
    status: 'shipped',
    lcStatus: 'in_progress',
    milestoneCompleted: 1,
    createdAt: '2026-01-28T10:30:00Z',
    updatedAt: '2026-01-30T14:20:00Z',
  },
  {
    id: 'ORD-2026-002',
    commodityName: 'Premium Arabica Coffee Beans',
    commodityId: 'LST001',
    buyerName: 'European Traders Ltd.',
    buyerId: 'buyer_002',
    quantity: 2000,
    unit: 'kg',
    totalPrice: '900',
    status: 'lc_created',
    lcStatus: 'funded',
    milestoneCompleted: 0,
    createdAt: '2026-01-30T09:15:00Z',
    updatedAt: '2026-01-30T09:15:00Z',
  },
  {
    id: 'ORD-2026-003',
    commodityName: 'Organic Raw Cotton',
    commodityId: 'LST002',
    buyerName: 'TextileCo Asia',
    buyerId: 'buyer_003',
    quantity: 5000,
    unit: 'kg',
    totalPrice: '1250',
    status: 'customs',
    lcStatus: 'in_progress',
    milestoneCompleted: 2,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-29T16:45:00Z',
  },
  {
    id: 'ORD-2026-004',
    commodityName: 'Premium Arabica Coffee Beans',
    commodityId: 'LST001',
    buyerName: 'Cafe Milano',
    buyerId: 'buyer_004',
    quantity: 500,
    unit: 'kg',
    totalPrice: '225',
    status: 'completed',
    lcStatus: 'completed',
    milestoneCompleted: 3,
    createdAt: '2026-01-10T11:20:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
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

export default function SupplierOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.commodityName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'lc_created').length,
    inProgress: mockOrders.filter(o => ['shipped', 'customs'].includes(o.status)).length,
    completed: mockOrders.filter(o => o.status === 'completed').length,
    totalValue: mockOrders.reduce((acc, o) => acc + parseFloat(o.totalPrice), 0),
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Manage incoming orders and track payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Orders</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Awaiting Shipment</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">In Progress</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.inProgress}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Completed</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.totalValue.toLocaleString()} GOLD</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID, buyer, or commodity..."
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
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                      Buyer: {order.buyerName} • {order.quantity.toLocaleString()} {order.unit}
                    </p>
                  </div>

                  {/* Milestone Progress */}
                  <div className="lg:w-64">
                    <div className="text-sm text-gray-400 mb-2">Payment Progress</div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((milestone) => (
                        <div key={milestone} className="flex-1">
                          <div
                            className={`h-2 rounded-full ${
                              milestone <= order.milestoneCompleted
                                ? 'bg-green-500'
                                : 'bg-gray-700'
                            }`}
                          />
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {milestone === 1 ? '30%' : milestone === 2 ? '50%' : '20%'}
                          </div>
                        </div>
                      ))}
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
                      href={`/supplier/orders/${order.id}`}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </div>

                {/* Action Prompt */}
                {order.status === 'lc_created' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">LC funded - Ready to ship</span>
                    </div>
                    <Link
                      href={`/supplier/shipments/new?order=${order.id}`}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Create Shipment
                    </Link>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm">In transit - 30% payment released</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium">
                      +{(parseFloat(order.totalPrice) * 0.3).toFixed(2)} GOLD received
                    </span>
                  </div>
                )}

                {order.status === 'customs' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400">
                      <FileCheck className="w-4 h-4" />
                      <span className="text-sm">Customs cleared - 50% payment released</span>
                    </div>
                    <span className="text-green-400 text-sm font-medium">
                      +{(parseFloat(order.totalPrice) * 0.5).toFixed(2)} GOLD received
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No orders found</h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here when buyers purchase your commodities'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
