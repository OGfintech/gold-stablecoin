'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
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

// Mock shipments data
const mockShipments = [
  {
    id: 'SHP-2026-001',
    orderId: 'ORD-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    buyerName: 'Global Foods Inc.',
    carrier: 'Maersk Line',
    trackingNumber: 'MSKU1234567',
    transportMode: 'sea',
    origin: 'Cartagena, Colombia',
    destination: 'Rotterdam, Netherlands',
    estimatedDelivery: '2026-02-15',
    status: 'in_transit',
    documentsUploaded: 2,
    documentsRequired: 3,
    milestoneStatus: {
      shipped: true,
      customs: false,
      delivered: false,
    },
    createdAt: '2026-01-30',
  },
  {
    id: 'SHP-2026-002',
    orderId: 'ORD-2026-003',
    commodityName: 'Organic Raw Cotton',
    buyerName: 'TextileCo Asia',
    carrier: 'DHL Global Forwarding',
    trackingNumber: 'DHL9876543',
    transportMode: 'air',
    origin: 'Mumbai, India',
    destination: 'Shanghai, China',
    estimatedDelivery: '2026-02-05',
    status: 'customs',
    documentsUploaded: 3,
    documentsRequired: 3,
    milestoneStatus: {
      shipped: true,
      customs: true,
      delivered: false,
    },
    createdAt: '2026-01-25',
  },
  {
    id: 'SHP-2026-003',
    orderId: 'ORD-2026-004',
    commodityName: 'Premium Arabica Coffee Beans',
    buyerName: 'Cafe Milano',
    carrier: 'FedEx Freight',
    trackingNumber: 'FX123456789',
    transportMode: 'ground',
    origin: 'Bogota, Colombia',
    destination: 'Milan, Italy',
    estimatedDelivery: '2026-01-25',
    status: 'delivered',
    documentsUploaded: 3,
    documentsRequired: 3,
    milestoneStatus: {
      shipped: true,
      customs: true,
      delivered: true,
    },
    createdAt: '2026-01-15',
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

export default function SupplierShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Shipments</h1>
            <p className="text-gray-400 mt-1">Track and manage your shipments</p>
          </div>
          <Link
            href="/supplier/shipments/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Shipment
          </Link>
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
        <div className="space-y-4">
          {filteredShipments.map((shipment) => {
            const TransportIcon = transportIcons[shipment.transportMode] || Package
            return (
              <div
                key={shipment.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
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
                    <div className="text-sm text-gray-400 mb-3">Order: {shipment.orderId} • Buyer: {shipment.buyerName}</div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">{shipment.origin}</span>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="text-gray-300">{shipment.destination}</span>
                    </div>
                  </div>

                  {/* Milestone Progress */}
                  <div className="lg:w-72">
                    <div className="text-sm text-gray-400 mb-3">Payment Milestones</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.shipped ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.shipped ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : (
                            <Clock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className={shipment.milestoneStatus.shipped ? 'text-green-400' : 'text-gray-500'}>
                          Shipment (30%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.customs ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.customs ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : (
                            <Clock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className={shipment.milestoneStatus.customs ? 'text-green-400' : 'text-gray-500'}>
                          Customs Cleared (50%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          shipment.milestoneStatus.delivered ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          {shipment.milestoneStatus.delivered ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : (
                            <Clock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className={shipment.milestoneStatus.delivered ? 'text-green-400' : 'text-gray-500'}>
                          Delivered (20%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right mb-2">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                        shipment.documentsUploaded === shipment.documentsRequired
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        <FileText className="w-3 h-3" />
                        {shipment.documentsUploaded}/{shipment.documentsRequired} docs
                      </div>
                      <Link
                        href={`/supplier/shipments/${shipment.id}`}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Document Upload Prompt */}
                {shipment.documentsUploaded < shipment.documentsRequired && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {shipment.documentsRequired - shipment.documentsUploaded} document(s) pending upload
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-lg transition-colors">
                      Upload Documents
                    </button>
                  </div>
                )}
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
                  : 'Create a shipment when you have orders ready to ship'}
              </p>
              <Link
                href="/supplier/shipments/new"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Shipment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
