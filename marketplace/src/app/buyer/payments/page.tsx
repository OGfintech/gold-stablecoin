'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  ExternalLink,
  Wallet,
  TrendingUp,
  Filter
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock payment data for buyer
const mockPayments = [
  {
    id: 'PAY-2026-001',
    orderId: 'ORD-2026-001',
    lcId: 'LC-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    supplierName: 'Colombian Coffee Exports',
    type: 'escrow_deposit',
    milestone: null,
    amount: '450',
    status: 'completed',
    description: 'Initial escrow deposit for Letter of Credit',
    txHash: '0x1a2b3c4d5e6f...',
    createdAt: '2026-01-28T10:30:00Z',
  },
  {
    id: 'PAY-2026-002',
    orderId: 'ORD-2026-001',
    lcId: 'LC-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    supplierName: 'Colombian Coffee Exports',
    type: 'milestone_release',
    milestone: 1,
    amount: '135',
    status: 'completed',
    description: 'Milestone 1: Shipment confirmed (30%)',
    txHash: '0x2b3c4d5e6f7g...',
    createdAt: '2026-01-30T14:00:00Z',
  },
  {
    id: 'PAY-2026-003',
    orderId: 'ORD-2026-006',
    lcId: 'LC-2026-006',
    commodityName: 'Organic Raw Cotton',
    supplierName: 'IndiaTextile Corp',
    type: 'escrow_deposit',
    milestone: null,
    amount: '1,250',
    status: 'completed',
    description: 'Initial escrow deposit for Letter of Credit',
    txHash: '0x3c4d5e6f7g8h...',
    createdAt: '2026-01-25T09:00:00Z',
  },
  {
    id: 'PAY-2026-004',
    orderId: 'ORD-2026-006',
    lcId: 'LC-2026-006',
    commodityName: 'Organic Raw Cotton',
    supplierName: 'IndiaTextile Corp',
    type: 'milestone_release',
    milestone: 1,
    amount: '375',
    status: 'completed',
    description: 'Milestone 1: Shipment confirmed (30%)',
    txHash: '0x4d5e6f7g8h9i...',
    createdAt: '2026-01-26T14:00:00Z',
  },
  {
    id: 'PAY-2026-005',
    orderId: 'ORD-2026-006',
    lcId: 'LC-2026-006',
    commodityName: 'Organic Raw Cotton',
    supplierName: 'IndiaTextile Corp',
    type: 'milestone_release',
    milestone: 2,
    amount: '625',
    status: 'completed',
    description: 'Milestone 2: Customs cleared (50%)',
    txHash: '0x5e6f7g8h9i0j...',
    createdAt: '2026-01-30T16:00:00Z',
  },
  {
    id: 'PAY-2026-006',
    orderId: 'ORD-2026-006',
    lcId: 'LC-2026-006',
    commodityName: 'Organic Raw Cotton',
    supplierName: 'IndiaTextile Corp',
    type: 'milestone_release',
    milestone: 3,
    amount: '250',
    status: 'pending',
    description: 'Milestone 3: Delivery confirmed (20%)',
    txHash: null,
    createdAt: '2026-02-01T00:00:00Z',
  },
]

const paymentTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  escrow_deposit: {
    label: 'Escrow Deposit',
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    icon: ArrowUpRight
  },
  milestone_release: {
    label: 'Milestone Release',
    color: 'text-green-400 bg-green-500/20 border-green-500/30',
    icon: ArrowDownRight
  },
  refund: {
    label: 'Refund',
    color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    icon: ArrowDownRight
  },
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-green-400', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-400', icon: AlertCircle },
}

export default function BuyerPaymentsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

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

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.commodityName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || payment.type === typeFilter
    return matchesSearch && matchesType
  })

  // Calculate stats
  const stats = {
    totalDeposited: mockPayments
      .filter(p => p.type === 'escrow_deposit' && p.status === 'completed')
      .reduce((acc, p) => acc + parseFloat(p.amount.replace(',', '')), 0),
    totalReleased: mockPayments
      .filter(p => p.type === 'milestone_release' && p.status === 'completed')
      .reduce((acc, p) => acc + parseFloat(p.amount.replace(',', '')), 0),
    pendingRelease: mockPayments
      .filter(p => p.type === 'milestone_release' && p.status === 'pending')
      .reduce((acc, p) => acc + parseFloat(p.amount.replace(',', '')), 0),
    transactionCount: mockPayments.filter(p => p.status === 'completed').length,
  }

  const inEscrow = stats.totalDeposited - stats.totalReleased

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Payment History</h1>
          <p className="text-gray-400 mt-1">Track your escrow deposits and milestone releases</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ArrowUpRight className="w-4 h-4" />
              Total Deposited
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalDeposited.toLocaleString()} GOLD</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              In Escrow
            </div>
            <div className="text-2xl font-bold text-yellow-400">{inEscrow.toLocaleString()} GOLD</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ArrowDownRight className="w-4 h-4" />
              Released to Suppliers
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.totalReleased.toLocaleString()} GOLD</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Pending Release
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.pendingRelease.toLocaleString()} GOLD</div>
          </div>
        </div>

        {/* Escrow Summary Card */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 rounded-xl border border-yellow-500/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Smart Letter of Credit Escrow</h2>
              <p className="text-gray-400 text-sm">
                Your funds are securely held in escrow and released automatically based on verified milestones
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-400">Milestone 1</div>
                <div className="text-lg font-bold text-green-400">30%</div>
                <div className="text-xs text-gray-500">Shipment</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Milestone 2</div>
                <div className="text-lg font-bold text-green-400">50%</div>
                <div className="text-xs text-gray-500">Customs</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Milestone 3</div>
                <div className="text-lg font-bold text-green-400">20%</div>
                <div className="text-xs text-gray-500">Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by payment ID, order, or commodity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'escrow_deposit', 'milestone_release'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  typeFilter === type
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type === 'all' ? 'All Payments' : paymentTypeConfig[type]?.label || type}
              </button>
            ))}
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const typeConfig = paymentTypeConfig[payment.type]
            const TypeIcon = typeConfig?.icon || CreditCard
            const statusInfo = statusConfig[payment.status]
            const StatusIcon = statusInfo?.icon || Clock

            return (
              <div
                key={payment.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        payment.type === 'escrow_deposit' ? 'bg-blue-500/20' : 'bg-green-500/20'
                      }`}>
                        <TypeIcon className={`w-5 h-5 ${
                          payment.type === 'escrow_deposit' ? 'text-blue-400' : 'text-green-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${typeConfig?.color}`}>
                            {typeConfig?.label}
                          </span>
                          {payment.milestone && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Stage {payment.milestone}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 text-sm ${statusInfo?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo?.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">{payment.id}</div>
                      </div>
                    </div>

                    <div className="text-white font-medium mb-1">{payment.description}</div>
                    <div className="text-sm text-gray-400">
                      {payment.commodityName} • {payment.supplierName}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Order: {payment.orderId} • LC: {payment.lcId}
                    </div>
                  </div>

                  {/* Amount & Details */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        payment.type === 'escrow_deposit' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {payment.type === 'escrow_deposit' ? '-' : ''}{payment.amount} GOLD
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {payment.txHash && (
                      <Link
                        href={`/explorer/tx/${payment.txHash}`}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Transaction Hash */}
                {payment.txHash && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>Tx: {payment.txHash}</span>
                    </div>
                    <Link
                      href={`/buyer/orders/${payment.orderId}`}
                      className="text-yellow-500 hover:text-yellow-400 text-sm flex items-center gap-1"
                    >
                      View Order <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Pending Payment Notice */}
                {payment.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Awaiting milestone completion</span>
                    </div>
                    <Link
                      href={`/buyer/shipments`}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-lg transition-colors"
                    >
                      Track Shipment
                    </Link>
                  </div>
                )}
              </div>
            )
          })}

          {filteredPayments.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No payments found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Payment history will appear here when you create orders'}
              </p>
              <Link
                href="/commodities"
                className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400"
              >
                Browse Commodities <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
