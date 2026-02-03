'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  ArrowRight,
  FileText,
  Globe
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock data for buyer dashboard
const stats = {
  activeOrders: 4,
  inTransit: 2,
  delivered: 12,
  totalSpent: '28,450.00',
  inEscrow: '5,200.00',
  released: '23,250.00'
}

const activeOrders = [
  { id: 'PO-2026-101', commodity: 'Copper Cathodes', supplier: 'Metals Trading Co', value: '2,700.00', status: 'Customs', progress: 80 },
  { id: 'PO-2026-102', commodity: 'Arabica Coffee', supplier: 'AgriTrade International', value: '1,200.00', status: 'Shipped', progress: 50 },
  { id: 'PO-2026-103', commodity: 'Cotton Bales', supplier: 'Cotton Textiles Ltd', value: '625.00', status: 'LC Issued', progress: 20 },
  { id: 'PO-2026-104', commodity: 'Gold Bars', supplier: 'Gold Mining Corp', value: '3,125.00', status: 'Pending LC', progress: 5 },
]

const recentDeliveries = [
  { id: 'PO-2025-095', commodity: 'Wheat', supplier: 'AgriTrade International', value: '850.00', date: '2026-01-25' },
  { id: 'PO-2025-092', commodity: 'Gold Coins', supplier: 'Gold Mining Corp', value: '1,025.00', date: '2026-01-20' },
  { id: 'PO-2025-088', commodity: 'Soybeans', supplier: 'AgriTrade International', value: '1,800.00', date: '2026-01-15' },
]

export default function BuyerDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

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

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Buyer Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user.companyName || 'Buyer'}</p>
          </div>
          <Link
            href="/commodities"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Commodities
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <ShoppingCart className="w-6 h-6 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.activeOrders}</div>
            <div className="text-sm text-gray-400">Active Orders</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Truck className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.inTransit}</div>
            <div className="text-sm text-gray-400">In Transit</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.delivered}</div>
            <div className="text-sm text-gray-400">Delivered</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="text-2xl font-bold text-yellow-500">{stats.totalSpent}</div>
            <div className="text-sm text-gray-400">Total Spent (GOLD)</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <Clock className="w-6 h-6 text-orange-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.inEscrow}</div>
            <div className="text-sm text-gray-400">In Escrow (GOLD)</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
            <div className="text-2xl font-bold text-white">{stats.released}</div>
            <div className="text-sm text-gray-400">Released (GOLD)</div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Orders</h2>
            <Link href="/buyer/orders" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {activeOrders.map(order => (
              <div key={order.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{order.commodity}</div>
                    <div className="text-sm text-gray-400">{order.supplier}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'Customs' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'Shipped' ? 'bg-purple-500/20 text-purple-400' :
                    order.status === 'LC Issued' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{order.progress}%</span>
                  <span className="text-yellow-500 font-medium">{order.value} GOLD</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Recent Deliveries</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {recentDeliveries.map(delivery => (
                <div key={delivery.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{delivery.commodity}</div>
                      <div className="text-sm text-gray-400">{delivery.supplier}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{delivery.date}</span>
                    <span className="text-yellow-500 font-medium">{delivery.value} GOLD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/commodities"
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-colors text-center"
              >
                <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-white font-medium">Browse Market</div>
              </Link>
              <Link
                href="/buyer/orders"
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors text-center"
              >
                <Package className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-white font-medium">My Orders</div>
              </Link>
              <Link
                href="/buyer/payments"
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-colors text-center"
              >
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-white font-medium">Payments</div>
              </Link>
              <a
                href="http://localhost:3002"
                target="_blank"
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors text-center"
              >
                <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-medium">Fund Wallet</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
