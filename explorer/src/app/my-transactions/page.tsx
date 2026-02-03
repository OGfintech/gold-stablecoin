'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightLeft, ArrowLeft, LogOut, ExternalLink, Copy, CheckCircle, Wallet } from 'lucide-react'
import { useAuth } from '../providers'
import { api, formatTokenAmount, shortenHash, formatDate } from '@/lib/api'
import { useState } from 'react'

export default function MyTransactionsPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth()
  const [copied, setCopied] = useState(false)

  // Fetch all transactions and filter by user address
  const { data: txData, isLoading, isError } = useQuery({
    queryKey: ['my-transactions', user?.address],
    queryFn: () => api.getTransactions(100),
    enabled: isAuthenticated && !!user?.address,
    refetchInterval: 10000,
  })

  // Filter transactions where user is sender or receiver
  const myTransactions = txData?.transactions.filter(tx =>
    tx.from === user?.address || tx.to === user?.address
  ) || []

  const handleCopyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Wallet Not Connected</h2>
        <p className="text-gray-400 text-center max-w-md">
          Please connect your wallet to view your transactions.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-medium transition-all"
        >
          Connect Wallet
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Transactions</h1>
            <p className="text-gray-400 text-sm">View all your blockchain activity</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>

      {/* Wallet Info Card */}
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Connected Wallet</p>
              <p className="text-white font-mono text-lg">{shortenHash(user?.address || '', 10)}</p>
            </div>
          </div>
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
          <div>
            <p className="text-gray-400 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-white">{myTransactions.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Sent</p>
            <p className="text-2xl font-bold text-orange-400">
              {myTransactions.filter(tx => tx.from === user?.address).length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Received</p>
            <p className="text-2xl font-bold text-green-400">
              {myTransactions.filter(tx => tx.to === user?.address).length}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-green-500" />
            Transaction History
          </h2>
          <span className="text-gray-400 text-sm">
            {myTransactions.length} transactions
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-400">Failed to load transactions</p>
            <p className="text-gray-500 text-sm mt-2">
              Make sure the mock server is running
            </p>
          </div>
        ) : myTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">No transactions found</p>
            <p className="text-gray-500 text-sm mt-2">
              Transactions involving your wallet will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {myTransactions.map((tx) => {
              const isSent = tx.from === user?.address
              const isReceived = tx.to === user?.address
              const isSelf = isSent && isReceived

              return (
                <Link
                  key={tx.hash}
                  href={`/transactions?hash=${tx.hash}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-750 transition-colors block"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      isSelf ? 'bg-purple-500/20' :
                      isSent ? 'bg-orange-500/20' : 'bg-green-500/20'
                    }`}>
                      <ArrowRightLeft className={`w-5 h-5 ${
                        isSelf ? 'text-purple-400' :
                        isSent ? 'text-orange-400' : 'text-green-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          tx.tx_type === 'Transfer' ? 'bg-green-500/20 text-green-400' :
                          tx.tx_type === 'Mint' ? 'bg-yellow-500/20 text-yellow-400' :
                          tx.tx_type === 'Burn' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {tx.tx_type}
                        </span>
                        <span className={`text-sm font-medium ${
                          isSelf ? 'text-purple-400' :
                          isSent ? 'text-orange-400' : 'text-green-400'
                        }`}>
                          {isSelf ? 'Self' : isSent ? 'Sent' : 'Received'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {isSent && !isSelf && `To: ${shortenHash(tx.to || '', 6)}`}
                        {isReceived && !isSelf && `From: ${shortenHash(tx.from, 6)}`}
                        {isSelf && 'To yourself'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {tx.amount && (
                      <p className={`font-medium ${
                        isSelf ? 'text-purple-400' :
                        isSent ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {isSent && !isSelf ? '-' : '+'}{formatTokenAmount(tx.amount)}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm font-mono">{shortenHash(tx.hash)}</p>
                    {tx.success !== undefined && (
                      <span className={`text-xs ${tx.success ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.success ? 'Success' : 'Failed'}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link
          href="/transactions"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ArrowRightLeft className="w-5 h-5" />
          <span>All Transactions</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
