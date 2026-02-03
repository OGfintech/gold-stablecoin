'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Shield,
  CheckCircle,
  AlertCircle,
  Wallet,
  FileCheck,
  Truck,
  Lock
} from 'lucide-react'
import { useAuth } from '@/app/providers'

// Mock commodity data
const mockCommodities: Record<string, any> = {
  'CMD001': {
    id: 'CMD001',
    supplierName: 'Colombian Coffee Exports',
    name: 'Premium Arabica Coffee Beans',
    category: 'coffee',
    pricePerUnit: '0.45',
    unit: 'kg',
    minOrderQuantity: 500,
    quantity: 5000,
    origin: 'Colombia'
  },
  'CMD002': {
    id: 'CMD002',
    supplierName: 'Colombian Coffee Exports',
    name: 'Organic Raw Cotton',
    category: 'cotton',
    pricePerUnit: '0.25',
    unit: 'kg',
    minOrderQuantity: 1000,
    quantity: 10000,
    origin: 'India'
  },
  'CMD003': {
    id: 'CMD003',
    supplierName: 'Chile Metals Corp',
    name: 'Grade A Copper Cathode',
    category: 'copper',
    pricePerUnit: '890',
    unit: 'MT',
    minOrderQuantity: 25,
    quantity: 2500,
    origin: 'Chile'
  },
}

const categoryEmoji: Record<string, string> = {
  gold: '🪙', coffee: '☕', oil: '🛢️', wheat: '🌾', copper: '🔶', cotton: '🧶', other: '📦',
}

export default function CreateOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading } = useAuth()

  const commodityId = searchParams.get('commodity')
  const initialQuantity = parseInt(searchParams.get('quantity') || '0')

  const [step, setStep] = useState(1)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [walletBalance] = useState('50000') // Mock balance

  const commodity = commodityId ? mockCommodities[commodityId] : null

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

  if (!commodity) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Commodity Selected</h1>
          <p className="text-gray-400 mb-4">Please select a commodity to order.</p>
          <Link href="/commodities" className="text-yellow-500 hover:text-yellow-400">
            ← Browse Commodities
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = quantity * parseFloat(commodity.pricePerUnit)
  const platformFee = subtotal * 0.005
  const total = subtotal + platformFee

  const milestone1 = subtotal * 0.3
  const milestone2 = subtotal * 0.5
  const milestone3 = subtotal * 0.2

  const hasEnoughBalance = parseFloat(walletBalance) >= total
  const meetsMinimum = quantity >= commodity.minOrderQuantity

  const handleSubmit = async () => {
    if (!meetsMinimum || !hasEnoughBalance || !agreed) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Would create order via API
    router.push('/buyer/orders?success=true')
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link
          href={`/commodities/${commodity.id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Commodity
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Create Order</h1>
          <p className="text-gray-400">Review and confirm your order with Smart Letter of Credit</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { num: 1, label: 'Review Order' },
            { num: 2, label: 'Confirm LC' },
            { num: 3, label: 'Complete' }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= s.num ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>
                {s.label}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-gray-700" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Review Order */}
            {step === 1 && (
              <>
                {/* Commodity Summary */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Order Details</h2>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{categoryEmoji[commodity.category]}</span>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{commodity.name}</h3>
                      <p className="text-gray-400 text-sm">
                        From: {commodity.supplierName} • {commodity.origin}
                      </p>
                      <div className="mt-2 text-yellow-500 font-medium">
                        {commodity.pricePerUnit} GOLD per {commodity.unit}
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Order Quantity ({commodity.unit})
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      min={commodity.minOrderQuantity}
                      max={commodity.quantity}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                    />
                    {!meetsMinimum && quantity > 0 && (
                      <p className="text-yellow-400 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Minimum order: {commodity.minOrderQuantity} {commodity.unit}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Payment Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal ({quantity} {commodity.unit})</span>
                      <span className="text-white">{subtotal.toFixed(2)} GOLD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee (0.5%)</span>
                      <span className="text-white">{platformFee.toFixed(2)} GOLD</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-700">
                      <span className="text-white font-medium">Total to Escrow</span>
                      <span className="text-yellow-500 font-bold text-xl">{total.toFixed(2)} GOLD</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Confirm LC */}
            {step === 2 && (
              <>
                {/* Smart LC Explanation */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Smart Letter of Credit
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Your payment will be held in escrow and released automatically as milestones are completed:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Truck className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">1. Shipment Verified</span>
                          <span className="text-yellow-500 font-medium">30% ({milestone1.toFixed(2)} GOLD)</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Released when Bill of Lading is uploaded and verified on-chain
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <FileCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">2. Customs Cleared</span>
                          <span className="text-purple-400 font-medium">50% ({milestone2.toFixed(2)} GOLD)</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Released when import documentation is verified at destination
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">3. Delivery Confirmed</span>
                          <span className="text-green-400 font-medium">20% ({milestone3.toFixed(2)} GOLD)</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Released when you confirm receipt and quality inspection
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Terms & Conditions</h2>
                  <div className="space-y-3 text-sm text-gray-300 mb-4">
                    <p>By placing this order, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Fund the full order amount ({total.toFixed(2)} GOLD) to escrow</li>
                      <li>Automatic milestone-based payment releases</li>
                      <li>Confirm delivery within 7 days of receipt</li>
                      <li>Dispute resolution process if issues arise</li>
                    </ul>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-gray-300">
                      I have read and agree to the Smart Letter of Credit terms and understand that
                      funds will be held in escrow until milestones are completed.
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h2>
                <p className="text-gray-400 mb-6">
                  Your Smart Letter of Credit has been created and {total.toFixed(2)} GOLD
                  has been transferred to escrow.
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                  <div className="text-sm text-gray-400 mb-1">Order ID</div>
                  <div className="text-white font-mono">ORD-2026-{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</div>
                </div>
                <p className="text-sm text-gray-400">
                  The supplier will be notified and will begin preparing your shipment.
                  You can track the progress in your orders page.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>

              {/* Commodity */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                <span className="text-2xl">{categoryEmoji[commodity.category]}</span>
                <div>
                  <div className="text-white font-medium text-sm">{commodity.name}</div>
                  <div className="text-gray-400 text-sm">{quantity} {commodity.unit}</div>
                </div>
              </div>

              {/* Pricing */}
              <div className="py-4 border-b border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{subtotal.toFixed(2)} GOLD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee</span>
                  <span className="text-white">{platformFee.toFixed(2)} GOLD</span>
                </div>
              </div>

              {/* Total */}
              <div className="py-4 border-b border-gray-700">
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-yellow-500 font-bold">{total.toFixed(2)} GOLD</span>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Wallet className="w-4 h-4" /> Your Balance
                  </span>
                  <span className={`font-medium ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(walletBalance).toLocaleString()} GOLD
                  </span>
                </div>
                {!hasEnoughBalance && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!meetsMinimum || quantity === 0}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to LC Terms
                  </button>
                )}

                {step === 2 && (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={!agreed || !hasEnoughBalance || isSubmitting}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Fund Escrow & Place Order
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                    >
                      Back to Review
                    </button>
                  </>
                )}

                {step === 3 && (
                  <Link
                    href="/buyer/orders"
                    className="block w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors text-center"
                  >
                    View My Orders
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
