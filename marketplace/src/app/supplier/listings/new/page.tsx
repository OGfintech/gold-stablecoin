'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Info,
  CheckCircle,
  Package
} from 'lucide-react'

const categories = [
  { value: 'gold', label: 'Gold', emoji: '🪙' },
  { value: 'coffee', label: 'Coffee', emoji: '☕' },
  { value: 'oil', label: 'Oil', emoji: '🛢️' },
  { value: 'wheat', label: 'Wheat', emoji: '🌾' },
  { value: 'copper', label: 'Copper', emoji: '🔶' },
  { value: 'cotton', label: 'Cotton', emoji: '🧶' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

const units = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'MT', label: 'Metric Tons (MT)' },
  { value: 'barrel', label: 'Barrels' },
  { value: 'bushel', label: 'Bushels' },
  { value: 'lb', label: 'Pounds (lb)' },
]

const certifications = [
  'Organic Certified',
  'Fair Trade',
  'ISO 9001',
  'HACCP',
  'Rainforest Alliance',
  'UTZ Certified',
  'LBMA Certified',
  'Conflict-Free',
]

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    minOrderQuantity: '',
    origin: '',
    certifications: [] as string[],
    images: [] as string[],
  })

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/supplier/listings')
  }

  const totalValue = formData.quantity && formData.pricePerUnit
    ? (parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toLocaleString()
    : '0'

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/supplier/listings"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Listing</h1>
            <p className="text-gray-400">List your commodity for sale on STTAURX Marketplace</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= s
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 ? 'Basic Info' : s === 2 ? 'Details' : 'Review'}
              </span>
              {s < 3 && <div className="flex-1 h-px bg-gray-700" />}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commodity Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Premium Arabica Coffee Beans"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => updateField('category', cat.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        formData.category === cat.value
                          ? 'border-yellow-500 bg-yellow-500/10 text-white'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your commodity, quality, processing methods, etc."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 resize-none"
                />
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country of Origin *
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => updateField('origin', e.target.value)}
                  placeholder="e.g., Colombia"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Pricing & Inventory</h2>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  >
                    {units.map((unit) => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price per {formData.unit || 'unit'} (GOLD tokens) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerUnit}
                    onChange={(e) => updateField('pricePerUnit', e.target.value)}
                    placeholder="0.45"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500 font-medium">
                    GOLD
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  1 GOLD = 1 gram of physical gold (~$85 USD)
                </p>
              </div>

              {/* Min Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Order Quantity *
                </label>
                <input
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => updateField('minOrderQuantity', e.target.value)}
                  placeholder="500"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              {/* Total Value Preview */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-300">Listing Value Preview</span>
                </div>
                <div className="text-2xl font-bold text-yellow-500">
                  {totalValue} GOLD
                </div>
                <p className="text-sm text-gray-400">
                  Total inventory value at listed price
                </p>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Certifications (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCertification(cert)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.certifications.includes(cert)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {formData.certifications.includes(cert) && (
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                      )}
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Images (optional)
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-gray-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Click or drag to upload images</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Review Your Listing</h2>

              <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <span className="text-4xl">
                    {categories.find(c => c.value === formData.category)?.emoji || '📦'}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{formData.name || 'Untitled'}</h3>
                    <p className="text-gray-400">{formData.origin}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300">{formData.description || 'No description'}</p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-600">
                  <div>
                    <div className="text-sm text-gray-400">Quantity</div>
                    <div className="text-white font-medium">
                      {formData.quantity || '0'} {formData.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Price per {formData.unit}</div>
                    <div className="text-yellow-500 font-medium">
                      {formData.pricePerUnit || '0'} GOLD
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Min Order</div>
                    <div className="text-white font-medium">
                      {formData.minOrderQuantity || '0'} {formData.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Value</div>
                    <div className="text-yellow-500 font-medium">{totalValue} GOLD</div>
                  </div>
                </div>

                {/* Certifications */}
                {formData.certifications.length > 0 && (
                  <div className="pt-4 border-t border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">Certifications</div>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Smart LC Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400">Smart Letter of Credit</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      All orders will be secured with Smart LC. Payments are released automatically:
                      30% on shipment, 50% on customs clearance, 20% on delivery confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <Link
                href="/supplier/listings"
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!formData.name || !formData.category || !formData.origin)) ||
                  (step === 2 && (!formData.quantity || !formData.pricePerUnit || !formData.minOrderQuantity))
                }
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Publish Listing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
