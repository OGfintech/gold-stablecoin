'use client'

import Link from 'next/link'
import { useRef } from 'react'
import {
  Wallet, Blocks, Shield, ArrowRight, Coins, TrendingUp, Users, Lock, LogIn,
  ChevronLeft, ChevronRight, FileText, ArrowRightLeft, Package, Ship,
  CreditCard, Globe, Landmark, BarChart3, CheckCircle, Clock, Zap
} from 'lucide-react'
import { useAuth } from '../providers'

// Horizontal scroll component
function ScrollSection({
  id,
  title,
  subtitle,
  children
}: {
  id: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section id={id} className="py-12 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="w-4 flex-shrink-0" /> {/* Left padding */}
        {children}
        <div className="w-4 flex-shrink-0" /> {/* Right padding */}
      </div>
    </section>
  )
}

// Tall card component like streaming services
function TallCard({
  title,
  description,
  icon: Icon,
  gradient,
  href,
  external,
  number,
  features
}: {
  title: string
  description: string
  icon: any
  gradient: string
  href: string
  external?: boolean
  number?: number
  features?: string[]
}) {
  const CardWrapper = external ? 'a' : Link
  const extraProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <CardWrapper
      href={href}
      {...extraProps}
      className={`group relative flex-shrink-0 w-72 h-96 ${gradient} rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-105 snap-start`}
    >
      {number && (
        <span className="absolute top-4 left-4 text-6xl font-bold text-white/20">
          {number}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="p-3 bg-white/10 backdrop-blur rounded-xl w-fit mb-4 group-hover:bg-white/20 transition-colors">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{description}</p>
        {features && (
          <div className="space-y-1 mb-4">
            {features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all">
          <span className="text-sm font-medium">Open</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </CardWrapper>
  )
}

// Feature card for How It Works
function StepCard({
  number,
  title,
  description,
  icon: Icon
}: {
  number: number
  title: string
  description: string
  icon: any
}) {
  return (
    <div className="flex-shrink-0 w-80 h-72 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 snap-start">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl font-bold text-yellow-500">{number}</span>
        <div className="p-3 bg-yellow-500/20 rounded-xl">
          <Icon className="w-6 h-6 text-yellow-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

// Stat card for metrics
function StatCard({
  label,
  value,
  change,
  icon: Icon
}: {
  label: string
  value: string
  change?: string
  icon: any
}) {
  return (
    <div className="flex-shrink-0 w-64 h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 snap-start">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-6 h-6 text-yellow-500" />
        {change && (
          <span className="text-green-400 text-sm font-medium">{change}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section id="hero" className="relative py-20 overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-gray-900 to-purple-900/20" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center text-center">
            {/* Full Logo */}
            <div className="mb-8">
              <img
                src="/logo.svg"
                alt="STTAURX - Strategic Trade Transmission & Arbitrage Risk X-ecution Solutions"
                className="h-24 md:h-32 mx-auto"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Blockchain Explorer
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-8">
              Your gateway to gold-backed stablecoins, commodities trade finance, and secure blockchain asset management.
            </p>

            {/* Auth Status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400">
                    {user?.address?.slice(0, 8)}...{user?.address?.slice(-6)}
                  </span>
                </div>
                <Link
                  href="/my-transactions"
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold rounded-xl transition-all"
                >
                  View My Transactions
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold transition-all"
              >
                <LogIn className="w-5 h-5" />
                Connect Wallet
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <ScrollSection id="stats" title="Platform Metrics" subtitle="Real-time blockchain statistics">
        <StatCard label="Current TPS" value="1,250" change="+12%" icon={Zap} />
        <StatCard label="Total Blocks" value="847,293" icon={Blocks} />
        <StatCard label="Transactions" value="2.4M" change="+8%" icon={ArrowRightLeft} />
        <StatCard label="Total Supply" value="50,000 GOLD" icon={Coins} />
        <StatCard label="Gold Backing" value="50 kg" icon={Landmark} />
        <StatCard label="Active Users" value="12,847" change="+23%" icon={Users} />
        <StatCard label="Staking APY" value="5.0%" icon={TrendingUp} />
        <StatCard label="Certificates" value="156" icon={FileText} />
      </ScrollSection>

      {/* Main Platform Apps */}
      <ScrollSection id="apps" title="Platform Applications" subtitle="Choose where you want to go">
        <TallCard
          number={1}
          title="Wallet"
          description="Manage your gold-backed stablecoins. Send, receive, stake, and track your holdings with secure key management."
          icon={Wallet}
          gradient="bg-gradient-to-br from-yellow-800 to-yellow-950"
          href="http://localhost:3002"
          external
          features={["Deposit & Withdraw", "Staking with Yield", "Secure Key Management"]}
        />
        <TallCard
          number={2}
          title="Explorer"
          description="Browse the blockchain. View blocks, transactions, and verify gold certificate backing."
          icon={Blocks}
          gradient="bg-gradient-to-br from-blue-800 to-blue-950"
          href="/dashboard"
          features={["Block History", "Transaction Tracking", "Certificate Verification"]}
        />
        <TallCard
          number={3}
          title="Admin Panel"
          description="Manage certificates, mint tokens, and oversee user onboarding with bucket management."
          icon={Shield}
          gradient="bg-gradient-to-br from-purple-800 to-purple-950"
          href="/admin"
          features={["Token Minting", "User Buckets", "Admin Controls"]}
        />
        <TallCard
          number={4}
          title="Marketplace"
          description="Trade commodities with Letters of Credit. Connect suppliers and buyers globally."
          icon={Package}
          gradient="bg-gradient-to-br from-green-800 to-green-950"
          href="http://localhost:3003"
          external
          features={["Commodities Trading", "Letter of Credit", "Global Suppliers"]}
        />
        <TallCard
          number={5}
          title="Documents"
          description="View and verify trade documents including Bills of Lading and Certificates of Origin."
          icon={FileText}
          gradient="bg-gradient-to-br from-orange-800 to-orange-950"
          href="/certificates"
          features={["Bill of Lading", "Certificate of Origin", "Quality Inspection"]}
        />
        <TallCard
          number={6}
          title="API Docs"
          description="Developer documentation for integrating with the STTAURX Platform APIs."
          icon={Globe}
          gradient="bg-gradient-to-br from-pink-800 to-pink-950"
          href="/docs"
          features={["REST API", "WebSocket Events", "SDK Libraries"]}
        />
      </ScrollSection>

      {/* Staking Section */}
      <ScrollSection id="staking" title="Staking & Yield" subtitle="Earn passive income on your GOLD tokens">
        <div className="flex-shrink-0 w-96 h-80 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30 snap-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Flexible Staking</h3>
              <p className="text-purple-400 text-sm">5.0% Base APY</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">No lock period required. Withdraw your tokens anytime while earning yields.</p>
          <div className="bg-black/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Lock Period</span>
              <span className="text-white">None</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yield Bonus</span>
              <span className="text-green-400">1.0x</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-96 h-80 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 border border-blue-500/30 snap-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">30-Day Lock</h3>
              <p className="text-blue-400 text-sm">7.5% APY (1.5x bonus)</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">Lock your tokens for 30 days to earn 50% more yield on your stake.</p>
          <div className="bg-black/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Lock Period</span>
              <span className="text-white">30 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yield Bonus</span>
              <span className="text-green-400">1.5x</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-96 h-80 bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-6 border border-green-500/30 snap-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">60-Day Lock</h3>
              <p className="text-green-400 text-sm">10% APY (2x bonus)</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">Double your yield rate by locking tokens for 60 days.</p>
          <div className="bg-black/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Lock Period</span>
              <span className="text-white">60 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yield Bonus</span>
              <span className="text-green-400">2.0x</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-96 h-80 bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 border border-yellow-500/30 snap-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">90-Day Lock</h3>
              <p className="text-yellow-400 text-sm">12.5% APY (2.5x bonus)</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">Maximum yield bonus for committed long-term stakers.</p>
          <div className="bg-black/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Lock Period</span>
              <span className="text-white">90 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Yield Bonus</span>
              <span className="text-green-400">2.5x</span>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Trade Finance Section */}
      <ScrollSection id="trade-finance" title="Trade Finance" subtitle="Commodities marketplace with Letter of Credit">
        <TallCard
          title="Supplier Portal"
          description="List your commodities, manage orders, and track shipments with integrated payment releases."
          icon={Package}
          gradient="bg-gradient-to-br from-emerald-800 to-emerald-950"
          href="http://localhost:3003/supplier"
          external
          features={["List Commodities", "Order Management", "Payment Tracking"]}
        />
        <TallCard
          title="Buyer Portal"
          description="Browse global commodities, purchase with Letter of Credit protection, track deliveries."
          icon={CreditCard}
          gradient="bg-gradient-to-br from-cyan-800 to-cyan-950"
          href="http://localhost:3003/buyer"
          external
          features={["Browse Commodities", "LC Protection", "Delivery Tracking"]}
        />
        <TallCard
          title="Trade Admin"
          description="5-bucket trade lifecycle management. Verify documents and manage settlements."
          icon={BarChart3}
          gradient="bg-gradient-to-br from-violet-800 to-violet-950"
          href="/admin/trades"
          features={["5-Stage Buckets", "Document Verification", "Settlement Control"]}
        />
        <TallCard
          title="Shipments"
          description="Track shipments in real-time. View Bill of Lading and shipping milestones."
          icon={Ship}
          gradient="bg-gradient-to-br from-sky-800 to-sky-950"
          href="http://localhost:3003/supplier/shipments"
          external
          features={["Real-time Tracking", "Bill of Lading", "Milestone Updates"]}
        />
      </ScrollSection>

      {/* How It Works */}
      <ScrollSection id="how-it-works" title="How It Works" subtitle="Getting started with STTAURX">
        <StepCard
          number={1}
          title="Create Wallet"
          description="Generate a secure wallet or import existing keys. Your gateway to the Gold Chain ecosystem."
          icon={Wallet}
        />
        <StepCard
          number={2}
          title="Get GOLD Tokens"
          description="Deposit funds and receive GOLD tokens backed 1:1 by physical gold reserves."
          icon={Coins}
        />
        <StepCard
          number={3}
          title="Stake for Yield"
          description="Stake your GOLD tokens to earn passive income from trade finance fees."
          icon={TrendingUp}
        />
        <StepCard
          number={4}
          title="Trade Commodities"
          description="Buy or sell commodities with Letter of Credit protection and secure payments."
          icon={Package}
        />
        <StepCard
          number={5}
          title="Track Everything"
          description="Monitor all transactions, shipments, and payments on the blockchain explorer."
          icon={Blocks}
        />
      </ScrollSection>

      {/* Admin Tools */}
      <ScrollSection id="admin-tools" title="Admin Tools" subtitle="Platform management and controls">
        <TallCard
          title="User Buckets"
          description="Manage user onboarding through 5-stage verification buckets."
          icon={Users}
          gradient="bg-gradient-to-br from-rose-800 to-rose-950"
          href="/admin/buckets"
          features={["KYC Verification", "Status Management", "Bulk Actions"]}
        />
        <TallCard
          title="Token Minting"
          description="Mint new GOLD tokens backed by verified gold certificates."
          icon={Coins}
          gradient="bg-gradient-to-br from-amber-800 to-amber-950"
          href="/admin"
          features={["Certificate Linking", "Mint Controls", "Supply Management"]}
        />
        <TallCard
          title="Certificates"
          description="Manage and verify gold backing certificates from vault custodians."
          icon={FileText}
          gradient="bg-gradient-to-br from-teal-800 to-teal-950"
          href="/certificates"
          features={["Upload Certs", "Verify Backing", "Audit Trail"]}
        />
        <TallCard
          title="Staking Config"
          description="Configure staking rates, lock periods, and yield distribution parameters."
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-indigo-800 to-indigo-950"
          href="/admin"
          features={["Set APY Rates", "Lock Periods", "Fee Distribution"]}
        />
      </ScrollSection>

      {/* Quick Links Footer */}
      <section id="links" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Quick Links</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Blocks', href: '/blocks' },
              { label: 'Transactions', href: '/transactions' },
              { label: 'Certificates', href: '/certificates' },
              { label: 'Admin', href: '/admin' },
              { label: 'Buckets', href: '/admin/buckets' },
              { label: 'Docs', href: '/docs' },
              { label: 'Login', href: '/login' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <img src="/logo.svg" alt="STTAURX" className="h-10 mx-auto mb-4" />
          <p className="text-gray-500">
            STTAURX Platform • 1 GOLD = 1 gram of physical gold
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Section anchors: #hero, #stats, #apps, #staking, #trade-finance, #how-it-works, #admin-tools, #links
          </p>
        </div>
      </footer>
    </div>
  )
}
