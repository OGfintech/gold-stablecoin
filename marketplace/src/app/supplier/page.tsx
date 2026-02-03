'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock data for supplier dashboard
const stats = {
  activeListings: 8,
  pendingOrders: 3,
  inTransit: 5,
  totalEarnings: '45,230.50',
  thisMonth: '12,450.00',
  pendingPayments: '8,200.00'
}

const recentOrders = [
  { id: 'PO-2026-001', commodity: 'Gold Bars (1kg)', buyer: 'Global Imports Ltd', quantity: 50, value: '3,125.00', status: 'LC Issued' },
  { id: 'PO-2026-002', commodity: 'Arabica Coffee', buyer: 'EuroFoods Distribution', quantity: 5000, value: '400.00', status: 'Pending LC' },
  { id: 'PO-2026-003', commodity: 'Gold Coins', buyer: 'Asian Metals Co', quantity: 200, value: '410.00', status: 'Shipped' },
]

const recentPayments = [
  { id: 'PAY-001', order: 'PO-2026-001', stage: 'Shipment (30%)', amount: '937.50', status: 'Released', date: '2026-01-30' },
  { id: 'PAY-002', order: 'PO-2025-098', stage: 'Delivery (20%)', amount: '250.00', status: 'Released', date: '2026-01-28' },
  { id: 'PAY-003', order: 'PO-2026-003', stage: 'Shipment (30%)', amount: '123.00', status: 'Pending', date: '-' },
]

export default function SupplierDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'supplier')) {
      router.push('/login?role=supplier')
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading || !isAuthenticated || user?.role !== 'supplier') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Supplier Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user.companyName || 'Supplier'}</p>
          </div>
          <Link
            href="/supplier/listings/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Package className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.activeListings}</div>
            <div className="text-sm text-gray-400">Active Listings</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <ShoppingCart className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.pendingOrders}</div>
            <div className="text-sm text-gray-400">Pending Orders</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Truck className="w-6 h-6 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.inTransit}</div>
            <div className="text-sm text-gray-400">In Transit</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <DollarSign className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl font-bold text-yellow-500">{stats.totalEarnings}</div>
            <div className="text-sm text-gray-400">Total Earnings (GOLD)</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.thisMonth}</div>
            <div className="text-sm text-gray-400">This Month (GOLD)</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Clock className="w-6 h-6 text-orange-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.pendingPayments}</div>
            <div className="text-sm text-gray-400">Pending (GOLD)</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <Link href="/supplier/orders" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-700">
              {recentOrders.map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{order.commodity}</div>
                      <div className="text-sm text-gray-400">{order.buyer}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'Shipped' ? 'bg-purple-500/20 text-purple-400' :
                      order.status === 'LC Issued' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{order.id} • {order.quantity} units</span>
                    <span className="text-yellow-500 font-medium">{order.value} GOLD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Payment Releases</h2>
              <Link href="/supplier/payments" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-700">
              {recentPayments.map(payment => (
                <div key={payment.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{payment.stage}</div>
                      <div className="text-sm text-gray-400">{payment.order}</div>
                    </div>
                    <span className={`flex items-center gap-1 text-sm ${
                      payment.status === 'Released' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {payment.status === 'Released' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{payment.date}</span>
                    <span className="text-yellow-500 font-medium">{payment.amount} GOLD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/supplier/listings/new"
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors text-center"
            >
              <Plus className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-white font-medium">Add Listing</div>
            </Link>
            <Link
              href="/supplier/orders"
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors text-center"
            >
              <ShoppingCart className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-white font-medium">View Orders</div>
            </Link>
            <Link
              href="/supplier/shipments"
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-colors text-center"
            >
              <Truck className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-white font-medium">Track Shipments</div>
            </Link>
            <Link
              href="/supplier/payments"
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-colors text-center"
            >
              <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-medium">Payment History</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
