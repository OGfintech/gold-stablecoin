'use client'

import { Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { formatTokenAmount, calculateGoldValue, shortenAddress } from '@/lib/api'

interface BalanceCardProps {
  balance: string
  address: string
  isLoading?: boolean
  onRefresh?: () => void
}

export function BalanceCard({
  balance,
  address,
  isLoading = false,
  onRefresh,
}: BalanceCardProps) {
  const [copied, setCopied] = useState(false)

  const balanceFormatted = formatTokenAmount(balance)
  const goldValue = calculateGoldValue(balance)

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-yellow-200 text-sm font-medium">Total Balance</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-yellow-200 hover:text-white transition-colors"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Balance Amount */}
      <div className="text-4xl font-bold text-white mb-1">
        {balanceFormatted}
        <span className="text-xl ml-2 text-yellow-200">GOLD</span>
      </div>

      {/* USD Value */}
      <div className="text-yellow-200 text-sm">
        ≈ ${goldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
      </div>

      {/* Address Section */}
      <div className="mt-4 pt-4 border-t border-yellow-500/30">
        <div className="flex items-center justify-between">
          <span className="text-yellow-200 text-sm">Address</span>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 text-yellow-200 hover:text-white text-sm font-mono transition-colors"
          >
            {shortenAddress(address)}
            <Copy className="w-3 h-3" />
          </button>
        </div>
        {copied && <p className="text-xs text-yellow-200 text-right mt-1">Copied!</p>}
      </div>
    </div>
  )
}
