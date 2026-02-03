'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  Globe,
  FileCheck,
  Truck,
  CheckCircle,
  ChevronRight,
  Package,
  Coins
} from 'lucide-react'

const stats = [
  { value: '$18T', label: 'Global Trade Finance Market' },
  { value: '< 1%', label: 'Platform Fees' },
  { value: 'Minutes', label: 'Settlement Time' },
  { value: '1:1', label: 'Gold Backing' },
]

const features = [
  {
    icon: Shield,
    title: 'Gold-Backed Stability',
    description: 'Every GOLD token backed 1:1 by physical gold in audited vaults. Zero currency risk.'
  },
  {
    icon: Clock,
    title: 'Instant Settlement',
    description: 'Payments release in minutes upon milestone verification, not 5-10 business days.'
  },
  {
    icon: FileCheck,
    title: 'Smart Letters of Credit',
    description: 'Automated 3-stage payments: 30% at shipment, 50% at customs, 20% at delivery.'
  },
  {
    icon: DollarSign,
    title: 'Lower Fees',
    description: 'Less than 1% total fees vs 3-7% with traditional trade finance.'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Trade with verified suppliers and buyers worldwide. No banking limitations.'
  },
  {
    icon: Coins,
    title: 'Earn Yield',
    description: 'Stake your GOLD tokens and earn 5-12.5% APY from trade finance fees.'
  }
]

const commodities = [
  { name: 'Gold', emoji: '🪙', volume: '$2.3B' },
  { name: 'Coffee', emoji: '☕', volume: '$890M' },
  { name: 'Oil', emoji: '🛢️', volume: '$1.8B' },
  { name: 'Wheat', emoji: '🌾', volume: '$650M' },
  { name: 'Copper', emoji: '🔶', volume: '$1.2B' },
  { name: 'Cotton', emoji: '🧶', volume: '$420M' },
]

const steps = [
  { step: 1, title: 'List or Browse', description: 'Suppliers list commodities, buyers browse global offerings' },
  { step: 2, title: 'Create Order', description: 'Buyer places order, Smart LC created with escrow' },
  { step: 3, title: 'Ship & Verify', description: 'Supplier ships, uploads Bill of Lading for verification' },
  { step: 4, title: 'Receive Payment', description: 'Automatic 3-stage payment release as milestones complete' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Full Logo */}
            <div className="mb-8">
              <img
                src="/logo.svg"
                alt="STTAURX - Strategic Trade Transmission & Arbitrage Risk X-ecution Solutions"
                className="h-24 md:h-32 mx-auto"
              />
            </div>

            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 text-sm">Gold-Backed Trade Finance</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Trade Commodities</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Without Borders
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              The world's first marketplace combining gold-backed payments with smart Letters of Credit.
              Get paid in minutes, not weeks. Fees under 1%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?role=supplier"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold px-8 py-4 rounded-xl transition-all"
              >
                <Package className="w-5 h-5" />
                Start Selling
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/commodities"
                className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-4 rounded-xl transition-all"
              >
                Browse Marketplace
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-800 border-y border-gray-700 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Problem */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
              <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-sm">✗</span>
                Traditional Trade Finance
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  5-10 days settlement through correspondent banks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  3-7% fees to intermediaries (banks, SWIFT, agents)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  20+ paper documents per transaction
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Currency volatility risk during settlement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  $1.7 trillion trade finance gap for SMEs
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8">
              <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-sm">✓</span>
                STTAURX Marketplace
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  Settlement in minutes, not days
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  Total fees under 1%
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  Digital documents verified on-chain
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  Gold-backed stability, zero FX risk
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  Open to businesses worldwide
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Smart LC Flow */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Smart Letter of Credit</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Automated 3-stage milestone payments protect both buyers and suppliers
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Stage 1 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-yellow-500 mb-2">30%</div>
                <h4 className="text-white font-semibold mb-2">Shipment</h4>
                <p className="text-gray-400 text-sm">
                  Released when Bill of Lading uploaded and verified. Goods are in transit.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <FileCheck className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-500 mb-2">50%</div>
                <h4 className="text-white font-semibold mb-2">Customs Cleared</h4>
                <p className="text-gray-400 text-sm">
                  Released upon import documentation verification. Duties cleared.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-500 mb-2">20%</div>
                <h4 className="text-white font-semibold mb-2">Delivered</h4>
                <p className="text-gray-400 text-sm">
                  Final payment on delivery confirmation and quality inspection.
                </p>
              </div>
            </div>

            <div className="text-center mt-8 text-gray-400">
              <p className="text-sm">
                Platform fee: 0.7% • Distributed to GOLD stakers as yield
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Trade on STTAURX?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The complete platform for international commodity trading
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/30 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commodities Preview */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Active Commodities</h2>
            <p className="text-gray-400">Trade the world's most sought-after commodities</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {commodities.map((commodity, i) => (
              <Link
                key={i}
                href={`/commodities?type=${commodity.name}`}
                className="bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/30 transition-all text-center group"
              >
                <div className="text-4xl mb-2">{commodity.emoji}</div>
                <div className="text-white font-semibold">{commodity.name}</div>
                <div className="text-xs text-gray-500 mt-1">{commodity.volume} traded</div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/commodities"
              className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              View All Listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400">From listing to payment in 4 simple steps</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-full">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold mb-4">
                      {step.step}
                    </div>
                    <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Trade?</h2>
            <p className="text-gray-400 mb-8">
              Join thousands of businesses trading commodities with gold-backed settlements
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?role=supplier"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all"
              >
                <Package className="w-5 h-5" />
                Register as Supplier
              </Link>
              <Link
                href="/login?role=buyer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-all"
              >
                <Globe className="w-5 h-5" />
                Register as Buyer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <img src="/logo.svg" alt="STTAURX" className="h-12" />
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
              <Link href="/commodities" className="hover:text-white">Browse</Link>
              <a href="http://localhost:3000" target="_blank" className="hover:text-white">Explorer</a>
              <a href="http://localhost:3002" target="_blank" className="hover:text-white">Wallet</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 STTAURX Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
