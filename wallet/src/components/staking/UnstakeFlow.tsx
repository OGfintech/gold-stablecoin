'use client'

import { useState } from 'react'
import { X, ArrowUpRight, AlertCircle, CheckCircle, Loader2, Lock, Unlock, Info } from 'lucide-react'
import { stakingApi, parseStakingAmount, formatStakingAmount } from '@/lib/staking-api'

interface UnstakeFlowProps {
  walletAddress: string
  stakedBalance: string
  unlockableBalance: string
  onClose: () => void
  onSuccess: () => void
}

export function UnstakeFlow({ walletAddress, stakedBalance, unlockableBalance, onClose, onSuccess }: UnstakeFlowProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const totalStaked = Number(stakedBalance) / 1e18
  const availableToUnstake = Number(unlockableBalance) / 1e18
  const lockedAmount = totalStaked - availableToUnstake
  const inputAmount = parseFloat(amount) || 0
  const isValidAmount = inputAmount > 0 && inputAmount <= availableToUnstake

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }

  const handleMaxClick = () => {
    setAmount(availableToUnstake.toFixed(6))
  }

  const handleUnstake = async () => {
    if (!isValidAmount) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const amountInBaseUnits = parseStakingAmount(amount)
      const result = await stakingApi.unstake(walletAddress, amountInBaseUnits)
      setTxHash(result.tx_hash)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to unstake tokens')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tokens Unstaked!</h2>
          <p className="text-gray-400 mb-4">
            You have successfully unstaked {amount} GOLD tokens.
            <br />
            <span className="text-green-400">Funds returned to your wallet.</span>
          </p>
          <p className="text-sm text-gray-500 font-mono">
            TX: {txHash?.slice(0, 16)}...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Unstake GOLD</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Balance Breakdown */}
          <div className="space-y-3">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="w-4 h-4 text-green-400" />
                <p className="text-sm text-gray-400">Available to Unstake</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatStakingAmount(unlockableBalance)}
                <span className="text-sm text-green-300 ml-2">GOLD</span>
              </p>
            </div>

            {lockedAmount > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-orange-400" />
                  <p className="text-sm text-orange-300">Still Locked</p>
                </div>
                <p className="text-xl font-bold text-orange-400">
                  {lockedAmount.toFixed(6)}
                  <span className="text-sm text-orange-300 ml-2">GOLD</span>
                </p>
                <p className="text-xs text-orange-300/70 mt-1">
                  These tokens are in active lock periods and cannot be unstaked yet.
                </p>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Unstake</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-4 text-xl font-medium text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <button
                onClick={handleMaxClick}
                disabled={availableToUnstake === 0}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                MAX
              </button>
            </div>
            {inputAmount > availableToUnstake && (
              <p className="text-red-400 text-sm mt-2">
                Exceeds available balance. Some tokens may still be locked.
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Processing Time</span>
              <span className="text-green-400 font-medium">Instant</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Remaining Stake</span>
              <span className="text-gray-300 font-medium">
                {(totalStaked - inputAmount).toFixed(6)} GOLD
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unstake Fee</span>
              <span className="text-green-400 font-medium">0%</span>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-200">
              Unstaking will stop yield generation for the withdrawn amount. Any accumulated yield will remain claimable.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleUnstake}
            disabled={!isValidAmount || isLoading || availableToUnstake === 0}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Unstaking...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-5 h-5" />
                <span>Unstake {amount || '0'} GOLD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
