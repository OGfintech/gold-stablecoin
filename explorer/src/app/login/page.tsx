'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, ArrowLeft, Key, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../providers'

// Demo wallets for easy testing
const DEMO_WALLETS = [
  { address: 'gc_alice123456789abcdef', name: 'Alice (Demo)' },
  { address: 'gc_bob987654321fedcba', name: 'Bob (Demo)' },
  { address: 'gc_charlie555444333222', name: 'Charlie (Demo)' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user } = useAuth()
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (walletAddress: string) => {
    setError('')
    setIsConnecting(true)

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Validate address format (simple check)
    if (!walletAddress || walletAddress.length < 10) {
      setError('Invalid wallet address')
      setIsConnecting(false)
      return
    }

    login(walletAddress)
    setIsConnecting(false)
    router.push('/my-transactions')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleConnect(address)
  }

  // If already logged in, show status
  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Already Connected</h1>
            <p className="text-gray-400 mb-4">
              Your wallet is connected:
            </p>
            <p className="text-green-400 font-mono text-sm bg-gray-900 rounded-lg p-3 mb-6">
              {user?.address}
            </p>
            <div className="flex gap-3">
              <Link
                href="/my-transactions"
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-medium transition-all text-center"
              >
                View Transactions
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all text-center"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connect Wallet</h1>
          <p className="text-gray-400">
            Connect your Gold Chain wallet to view your transactions
          </p>
        </div>

        {/* Manual Entry Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
          <div className="relative mb-4">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="gc_yourwalletaddress..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !address}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or use demo wallet</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Demo Wallets */}
        <div className="space-y-3">
          {DEMO_WALLETS.map((wallet) => (
            <button
              key={wallet.address}
              onClick={() => handleConnect(wallet.address)}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-500 font-bold text-sm">
                  {wallet.name.charAt(0)}
                </span>
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-medium">{wallet.name}</p>
                <p className="text-gray-500 text-sm font-mono">
                  {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-white mt-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}
