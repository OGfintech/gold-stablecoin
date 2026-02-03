'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ship,
  Truck,
  Plane,
  Package,
  Search,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock shipments data for buyer
const mockShipments = [
  {
    id: 'SHP-2026-001',
    orderId: 'ORD-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    supplierName: 'Colombian Coffee Exports',
    carrier: 'Maersk Line',
    trackingNumber: 'MSKU1234567',
    transportMode: 'sea',
    origin: 'Cartagena, Colombia',
    destination: 'Rotterdam, Netherlands',
    estimatedDelivery: '2026-02-15',
    status: 'in_transit',
    progress: 45,
    documentsVerified: 2,
    documentsTotal: 3,
    milestoneStatus: {
      shipped: true,
      customs: false,
      delivered: false,
    },
    events: [
      { timestamp: '2026-01-30T14:00:00Z', location: 'Cartagena, Colombia', status: 'shipped', description: 'Goods loaded onto vessel' },
      { timestamp: '2026-01-31T08:00:00Z', location: 'Caribbean Sea', status: 'in_transit', description: 'Vessel departed port' },
      { timestamp: '2026-02-02T12:00:00Z', location: 'Atlantic Ocean', status: 'in_transit', description: 'In transit to destination' },
    ],
    createdAt: '2026-01-30T13:00:00Z'
  },
  {
    id: 'SHP-2026-003',
    orderId: 'ORD-2026-006',
    commodityName: 'Organic Raw Cotton',
    supplierName: 'Colombian Coffee Exports',
    carrier: 'DHL Global Forwarding',
    trackingNumber: 'DHL9876543',
    transportMode: 'air',
    origin: 'Mumbai, India',
    destination: 'Shanghai, China',
    estimatedDelivery: '2026-02-08',
    status: 'customs',
    progress: 80,
    documentsVerified: 3,
    documentsTotal: 3,
    milestoneStatus: {
      shipped: true,
      customs: true,
      delivered: false,
    },
    events: [
      { timestamp: '2026-01-25T09:00:00Z', location: 'Mumbai, India', status: 'shipped', description: 'Cargo departed' },
      { timestamp: '2026-01-26T14:00:00Z', location: 'Shanghai, China', status: 'arrived', description: 'Arrived at destination airport' },
      { timestamp: '2026-01-30T16:00:00Z', location: 'Shanghai, China', status: 'customs', description: 'Customs clearance in progress' },
    ],
    createdAt: '2026-01-25T08:00:00Z'
  },
]

const transportIcons: Record<string, any> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
}

const statusConfig: Record<string, { label: string; color: string }> = {
  preparing: { label: 'Preparing', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' },
  shipped: { label: 'Shipped', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  in_transit: { label: 'In Transit', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  customs: { label: 'In Customs', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  delivered: { label: 'Delivered', color: 'text-green-400 bg-green-500/20 border-green-500/30' },
}

export default function BuyerShipmentsPage() {
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

  const filteredShipments = mockShipments.filter(shipment => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.commodityName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockShipments.length,
    inTransit: mockShipments.filter(s => ['shipped', 'in_transit'].includes(s.status)).length,
    inCustoms: mockShipments.filter(s => s.status === 'customs').length,
    delivered: mockShipments.filter(s => s.status === 'delivered').length,
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Shipment Tracking</h1>
          <p className="text-gray-400 mt-1">Track your incoming deliveries</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Total Shipments</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">In Transit</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.inTransit}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">In Customs</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{stats.inCustoms}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm">Delivered</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{stats.delivered}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, tracking number, or commodity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'in_transit', 'customs', 'delivered'].map((status) => (
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

        {/* Shipments List */}
        <div className="space-y-6">
          {filteredShipments.map((shipment) => {
            const TransportIcon = transportIcons[shipment.transportMode] || Package
            return (
              <div
                key={shipment.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Shipment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-700 rounded-lg">
                          <TransportIcon className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{shipment.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${statusConfig[shipment.status]?.color}`}>
                              {statusConfig[shipment.status]?.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">{shipment.carrier} • {shipment.trackingNumber}</div>
                        </div>
                      </div>

                      <div className="text-white font-medium mb-1">{shipment.commodityName}</div>
                      <div className="text-sm text-gray-400 mb-3">
                        From: {shipment.supplierName} • Order: {shipment.orderId}
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">{shipment.origin}</span>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="text-gray-300">{shipment.destination}</span>
                      </div>
                    </div>

                    {/* Progress & ETA */}
                    <div className="lg:w-64">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm text-white">{shipment.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all"
                          style={{ width: `${shipment.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Progress */}
                <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.shipped ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.shipped ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm ${shipment.milestoneStatus.shipped ? 'text-green-400' : 'text-gray-500'}`}>
                          Shipped (30%)
                        </span>
                      </div>

                      <div className="w-8 h-px bg-gray-600" />

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.customs ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.customs ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm ${shipment.milestoneStatus.customs ? 'text-green-400' : 'text-gray-500'}`}>
                          Customs (50%)
                        </span>
                      </div>

                      <div className="w-8 h-px bg-gray-600" />

                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.delivered ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.delivered ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm ${shipment.milestoneStatus.delivered ? 'text-green-400' : 'text-gray-500'}`}>
                          Delivered (20%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        <FileText className="w-4 h-4 inline mr-1" />
                        {shipment.documentsVerified}/{shipment.documentsTotal} docs verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Events */}
                <div className="px-6 py-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400 mb-3">Recent Updates</div>
                  <div className="space-y-2">
                    {shipment.events.slice(-3).reverse().map((event, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                        <div className="flex-1">
                          <span className="text-white">{event.description}</span>
                          <span className="text-gray-500 ml-2">• {event.location}</span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredShipments.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <Ship className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No shipments found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Shipments will appear here when your orders are shipped'}
              </p>
              <Link
                href="/buyer/orders"
                className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400"
              >
                View My Orders <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
