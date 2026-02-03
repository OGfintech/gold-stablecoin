'use client'

import { useState } from 'react'
import { X, ArrowDownRight, AlertCircle, CheckCircle, Loader2, Lock, Unlock } from 'lucide-react'
import { stakingApi, parseStakingAmount, formatStakingAmount, LOCK_PERIODS, getEffectiveAPY } from '@/lib/staking-api'

interface StakeFlowProps {
  walletAddress: string
  walletBalance: string
  baseYieldRate?: number
  onClose: () => void
  onSuccess: () => void
}

export function StakeFlow({ walletAddress, walletBalance, baseYieldRate = 0.05, onClose, onSuccess }: StakeFlowProps) {
  const [amount, setAmount] = useState('')
  const [lockPeriod, setLockPeriod] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [resultData, setResultData] = useState<{ lockPeriod: number; effectiveRate: string } | null>(null)

  const availableBalance = Number(walletBalance) / 1e18
  const inputAmount = parseFloat(amount) || 0
  const isValidAmount = inputAmount > 0 && inputAmount <= availableBalance

  const selectedPeriod = LOCK_PERIODS.find(p => p.days === lockPeriod) || LOCK_PERIODS[0]
  const effectiveAPY = getEffectiveAPY(baseYieldRate, lockPeriod)

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }

  const handleMaxClick = () => {
    setAmount(availableBalance.toFixed(6))
  }

  const handleStake = async () => {
    if (!isValidAmount) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const amountInBaseUnits = parseStakingAmount(amount)
      const result = await stakingApi.stake(walletAddress, amountInBaseUnits, lockPeriod)
      setTxHash(result.tx_hash)
      setResultData({
        lockPeriod: result.lockPeriod,
        effectiveRate: result.effectiveYieldRateFormatted
      })
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2500)
    } catch (err: any) {
      setError(err.message || 'Failed to stake tokens')
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
          <h2 className="text-2xl font-bold text-white mb-2">Tokens Staked!</h2>
          <p className="text-gray-400 mb-2">
            You have successfully staked {amount} GOLD tokens.
          </p>
          {resultData && resultData.lockPeriod > 0 && (
            <p className="text-purple-400 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Locked for {resultData.lockPeriod} days at {resultData.effectiveRate} APY
            </p>
          )}
          {resultData && resultData.lockPeriod === 0 && (
            <p className="text-green-400 mb-2">
              <Unlock className="w-4 h-4 inline mr-1" />
              Flexible staking - withdraw anytime
            </p>
          )}
          <p className="text-sm text-gray-500 font-mono">
            TX: {txHash?.slice(0, 16)}...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Stake GOLD</h2>
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
          {/* Available Balance */}
          <div className="bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Available to Stake</p>
            <p className="text-2xl font-bold text-white">
              {formatStakingAmount(walletBalance)}
              <span className="text-sm text-yellow-400 ml-2">GOLD</span>
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Stake</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-4 text-xl font-medium text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                MAX
              </button>
            </div>
            {inputAmount > availableBalance && (
              <p className="text-red-400 text-sm mt-2">Insufficient balance</p>
            )}
          </div>

          {/* Lock Period Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Lock Period (Higher yields for longer locks)</label>
            <div className="grid grid-cols-2 gap-3">
              {LOCK_PERIODS.map((period) => {
                const periodAPY = getEffectiveAPY(baseYieldRate, period.days)
                const isSelected = lockPeriod === period.days
                return (
                  <button
                    key={period.days}
                    onClick={() => setLockPeriod(period.days)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {period.days === 0 ? (
                        <Unlock className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                      ) : (
                        <Lock className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                      )}
                      <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {period.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{period.description}</span>
                      <span className={`text-sm font-bold ${isSelected ? 'text-green-400' : 'text-green-500/70'}`}>
                        {(periodAPY * 100).toFixed(1)}%
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary Info */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Base APY</span>
              <span className="text-gray-300">{(baseYieldRate * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Lock Bonus</span>
              <span className="text-purple-400 font-medium">{selectedPeriod.bonus}x</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-purple-500/20">
              <span className="text-gray-400">Effective APY</span>
              <span className="text-green-400 font-bold">{(effectiveAPY * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Daily Yield</span>
              <span className="text-green-400 font-medium">
                +{(inputAmount * effectiveAPY / 365).toFixed(6)} GOLD
              </span>
            </div>
            {lockPeriod > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Unlock Date</span>
                <span className="text-orange-400 font-medium">
                  {new Date(Date.now() + lockPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Warning for locked staking */}
          {lockPeriod > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-200">
                Your tokens will be locked for {lockPeriod} days. You cannot unstake until the lock period expires.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleStake}
            disabled={!isValidAmount || isLoading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Staking...</span>
              </>
            ) : (
              <>
                {lockPeriod > 0 ? <Lock className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                <span>
                  Stake {amount || '0'} GOLD
                  {lockPeriod > 0 ? ` (${lockPeriod}d lock)` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
