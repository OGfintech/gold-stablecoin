'use client'

import { Copy, RefreshCw, Shield } from 'lucide-react'
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
  // 1 STTAURX = 1 gram gold, 1 troy oz = 31.1035 grams
  const troyOz = (Number(balance) / 1e18 / 31.1035)

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-gold-900/30">
      {/* Gold gradient background */}
      <div className="bg-gradient-to-br from-[#C5963B] via-[#D4A843] to-[#E8C65D] p-6">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 gold-shimmer pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-900/70" />
            <span className="text-yellow-900/80 text-sm font-semibold tracking-wide uppercase">
              Total Balance
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-yellow-900/60 hover:text-yellow-900 transition-colors"
              aria-label="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Balance Amount */}
        <div className="relative mb-1">
          <div className="text-4xl font-bold text-white drop-shadow-sm">
            {balanceFormatted}
            <span className="text-lg ml-2 text-white/80 font-medium">STTAURX</span>
          </div>
        </div>

        {/* Dual denomination */}
        <div className="relative flex items-center gap-4 text-sm mb-5">
          <span className="text-yellow-900/80 font-medium">
            {troyOz.toFixed(4)} troy oz
          </span>
          <span className="text-yellow-900/40">|</span>
          <span className="text-yellow-900/80 font-medium">
            ${goldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>

        {/* Address Section */}
        <div className="relative pt-4 border-t border-yellow-700/30">
          <div className="flex items-center justify-between">
            <span className="text-yellow-900/60 text-xs font-medium uppercase tracking-wider">Wallet Address</span>
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-yellow-900/70 hover:text-yellow-900 text-sm font-mono transition-colors"
            >
              {shortenAddress(address)}
              <Copy className="w-3 h-3" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-yellow-900/80 text-right mt-1 font-medium">Copied!</p>
          )}
        </div>
      </div>
    </div>
  )
}
