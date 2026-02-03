'use client'

import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  FileText,
  Truck,
  CheckCircle,
  DollarSign,
  Shield,
  Clock,
  ArrowRight,
  ArrowDown,
  Coins,
  Building2,
  Globe,
  FileCheck
} from 'lucide-react'

const supplierSteps = [
  {
    step: 1,
    icon: Building2,
    title: 'Register & Verify',
    description: 'Create your supplier account, complete KYC verification, and connect your GOLD wallet.',
    details: ['Company registration', 'Identity verification', 'Wallet connection']
  },
  {
    step: 2,
    icon: Package,
    title: 'List Commodities',
    description: 'Add your products with detailed specifications, pricing, and certifications.',
    details: ['Product details', 'Set GOLD price', 'Upload certifications']
  },
  {
    step: 3,
    icon: ShoppingCart,
    title: 'Accept Orders',
    description: 'Review purchase orders from verified buyers and accept the Smart LC terms.',
    details: ['Review buyer details', 'Confirm terms', 'LC auto-created']
  },
  {
    step: 4,
    icon: Truck,
    title: 'Ship & Upload Docs',
    description: 'Ship the goods and upload required documents (Bill of Lading, Certificate of Origin).',
    details: ['Ship goods', 'Upload Bill of Lading', '30% payment released']
  },
  {
    step: 5,
    icon: DollarSign,
    title: 'Receive Payments',
    description: 'Automatic milestone payments: 30% at shipment, 50% at customs, 20% at delivery.',
    details: ['Automatic releases', 'GOLD to your wallet', 'Complete transparency']
  },
]

const buyerSteps = [
  {
    step: 1,
    icon: Building2,
    title: 'Register & Verify',
    description: 'Create your buyer account, complete KYC verification, and fund your GOLD wallet.',
    details: ['Company registration', 'Identity verification', 'Fund wallet with GOLD']
  },
  {
    step: 2,
    icon: Globe,
    title: 'Browse Marketplace',
    description: 'Search and filter commodities from verified suppliers worldwide.',
    details: ['Search by type/origin', 'View certifications', 'Compare prices']
  },
  {
    step: 3,
    icon: FileText,
    title: 'Create Order',
    description: 'Place order and create Smart LC. GOLD tokens are escrowed automatically.',
    details: ['Select quantity', 'Review LC terms', 'GOLD escrowed']
  },
  {
    step: 4,
    icon: FileCheck,
    title: 'Track Shipment',
    description: 'Monitor shipment progress and verify documents as they\'re uploaded.',
    details: ['Real-time tracking', 'Document verification', 'Milestone updates']
  },
  {
    step: 5,
    icon: CheckCircle,
    title: 'Confirm Delivery',
    description: 'Inspect goods and confirm delivery to release final payment.',
    details: ['Quality inspection', 'Confirm receipt', 'Trade completed']
  },
]

const paymentStages = [
  {
    percent: 30,
    trigger: 'Shipment',
    icon: Truck,
    color: 'yellow',
    description: 'Released when supplier uploads verified Bill of Lading'
  },
  {
    percent: 50,
    trigger: 'Customs Cleared',
    icon: FileCheck,
    color: 'blue',
    description: 'Released when import documentation is verified'
  },
  {
    percent: 20,
    trigger: 'Delivery',
    icon: CheckCircle,
    color: 'green',
    description: 'Released when buyer confirms receipt and quality'
  },
]

const benefits = [
  {
    icon: Clock,
    title: 'Minutes, Not Weeks',
    supplier: 'Receive payment as milestones complete',
    buyer: 'Funds protected until delivery confirmed'
  },
  {
    icon: DollarSign,
    title: 'Lowest Fees',
    supplier: 'Keep more of your sale price',
    buyer: 'Total platform fee under 1%'
  },
  {
    icon: Shield,
    title: 'Protected Trade',
    supplier: 'Guaranteed payment on verified milestones',
    buyer: 'Escrow protection until delivery'
  },
  {
    icon: Coins,
    title: 'Gold Stability',
    supplier: 'No currency volatility during transit',
    buyer: 'Stable value throughout trade'
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">How STTAURX Works</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Trade commodities globally with gold-backed payments and automated Smart Letters of Credit
          </p>
        </div>

        {/* Overview Graphic */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="grid md:grid-cols-5 gap-4 items-center text-center">
              <div className="p-4">
                <Package className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Supplier Lists</div>
              </div>
              <div className="hidden md:block">
                <ArrowRight className="w-8 h-8 text-gray-600 mx-auto" />
              </div>
              <div className="p-4">
                <FileText className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Smart LC Created</div>
              </div>
              <div className="hidden md:block">
                <ArrowRight className="w-8 h-8 text-gray-600 mx-auto" />
              </div>
              <div className="p-4">
                <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Auto Payments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Flow */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">For Suppliers</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {supplierSteps.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-full">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-black font-bold text-sm mb-3">
                    {step.step}
                  </div>
                  <step.icon className="w-6 h-6 text-blue-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                  <ul className="space-y-1">
                    {step.details.map((d, j) => (
                      <li key={j} className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-blue-400" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < supplierSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Flow */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">For Buyers</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {buyerSteps.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-full">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">
                    {step.step}
                  </div>
                  <step.icon className="w-6 h-6 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                  <ul className="space-y-1">
                    {step.details.map((d, j) => (
                      <li key={j} className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-purple-400" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < buyerSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Smart LC Payment Stages */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Smart Letter of Credit</h2>
            <p className="text-gray-400">Automated 3-stage milestone payments</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="space-y-6">
                {paymentStages.map((stage, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-${stage.color}-500/20`}>
                        <stage.icon className={`w-8 h-8 text-${stage.color}-500`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-3xl font-bold text-${stage.color}-500`}>{stage.percent}%</span>
                          <span className="text-white font-semibold">{stage.trigger}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{stage.description}</p>
                      </div>
                    </div>
                    {i < paymentStages.length - 1 && (
                      <div className="absolute left-8 top-16 h-6 w-px bg-gray-700" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <p className="text-sm text-gray-400">
                  Platform fee: <span className="text-yellow-500 font-semibold">0.7%</span> •
                  Distributed to GOLD token stakers as yield
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Comparison */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Benefits for Everyone</h2>
            <p className="text-gray-400">A better way to trade commodities globally</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-white font-semibold mb-4">{benefit.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-400 mt-0.5" />
                    <span className="text-sm text-gray-400">{benefit.supplier}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span className="text-sm text-gray-400">{benefit.buyer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Trading?</h2>
          <p className="text-gray-400 mb-8">
            Join the future of global trade finance today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?role=supplier"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <Package className="w-5 h-5" />
              Start Selling
            </Link>
            <Link
              href="/login?role=buyer"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              Start Buying
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
