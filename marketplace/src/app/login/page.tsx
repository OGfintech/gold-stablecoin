'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingCart, Building2, ArrowRight, Wallet } from 'lucide-react'
import { useAuth } from '@/app/providers'

const demoAccounts = {
  supplier: [
    { address: 'gc_supplier_gold_corp', name: 'Gold Mining Corp', country: 'South Africa' },
    { address: 'gc_supplier_agri_trade', name: 'AgriTrade International', country: 'Brazil' },
  ],
  buyer: [
    { address: 'gc_buyer_global_imports', name: 'Global Imports Ltd', country: 'United Kingdom' },
    { address: 'gc_buyer_euro_foods', name: 'EuroFoods Distribution', country: 'Germany' },
  ]
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [role, setRole] = useState<'supplier' | 'buyer'>(
    (searchParams.get('role') as 'supplier' | 'buyer') || 'supplier'
  )
  const [walletAddress, setWalletAddress] = useState('')

  const handleDemoLogin = (address: string) => {
    login(address, role)
    router.push(role === 'supplier' ? '/supplier' : '/buyer')
  }

  const handleCustomLogin = () => {
    if (walletAddress.trim()) {
      login(walletAddress.trim(), role)
      router.push(`/${role}/setup`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-xl">Au</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Connect to Marketplace</h1>
            <p className="text-gray-400">Choose your role to get started</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setRole('supplier')}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === 'supplier'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <Package className={`w-8 h-8 mx-auto mb-2 ${role === 'supplier' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className={`font-semibold ${role === 'supplier' ? 'text-blue-500' : 'text-gray-400'}`}>
                Supplier
              </div>
              <div className="text-xs text-gray-500 mt-1">Sell commodities</div>
            </button>

            <button
              onClick={() => setRole('buyer')}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === 'buyer'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <ShoppingCart className={`w-8 h-8 mx-auto mb-2 ${role === 'buyer' ? 'text-purple-500' : 'text-gray-400'}`} />
              <div className={`font-semibold ${role === 'buyer' ? 'text-purple-500' : 'text-gray-400'}`}>
                Buyer
              </div>
              <div className="text-xs text-gray-500 mt-1">Purchase commodities</div>
            </button>
          </div>

          {/* Demo Accounts */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Demo {role === 'supplier' ? 'Supplier' : 'Buyer'} Accounts
            </h3>
            <div className="space-y-3">
              {demoAccounts[role].map((account) => (
                <button
                  key={account.address}
                  onClick={() => handleDemoLogin(account.address)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    role === 'supplier' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    <Building2 className={`w-5 h-5 ${role === 'supplier' ? 'text-blue-400' : 'text-purple-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.country}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Wallet */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Connect Your Wallet
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address (gc_...)"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={handleCustomLogin}
                disabled={!walletAddress.trim()}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  walletAddress.trim()
                    ? role === 'supplier'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Connect & Register as {role === 'supplier' ? 'Supplier' : 'Buyer'}
              </button>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
