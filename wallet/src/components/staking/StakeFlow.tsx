'use client'

import { useState } from 'react'
import { X, ArrowDownRight, AlertCircle, CheckCircle, Loader2, Lock, Unlock, Zap } from 'lucide-react'
import { stakingApi, parseStakingAmount, formatStakingAmount, STAKING_TIERS, getTierAPY } from '@/lib/staking-api'

interface StakeFlowProps {
  walletAddress: string
  walletBalance: string
  onClose: () => void
  onSuccess: () => void
}

export function StakeFlow({ walletAddress, walletBalance, onClose, onSuccess }: StakeFlowProps) {
  const [amount, setAmount] = useState('')
  const [lockPeriod, setLockPeriod] = useState(0)
  const [autoCompound, setAutoCompound] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [resultData, setResultData] = useState<{ lockPeriod: number; effectiveRate: string; tierName: string } | null>(null)

  const availableBalance = Number(walletBalance) / 1e18
  const inputAmount = parseFloat(amount) || 0
  const isValidAmount = inputAmount > 0 && inputAmount <= availableBalance

  const selectedTier = STAKING_TIERS.find(t => t.days === lockPeriod) || STAKING_TIERS[0]
  const effectiveAPY = getTierAPY(lockPeriod)

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
      const result = await stakingApi.stake(walletAddress, amountInBaseUnits, lockPeriod, autoCompound)
      setTxHash(result.tx_hash)
      setResultData({
        lockPeriod: result.lockPeriod,
        effectiveRate: result.effectiveYieldRateFormatted,
        tierName: result.tierName
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
      <div className="fixed inset-0 bg-vault-base/95 flex items-center justify-center z-50 p-4">
        <div className="bg-vault-card rounded-2xl max-w-md w-full p-6 text-center border border-vault-border">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tokens Staked!</h2>
          <p className="text-gray-400 mb-2">
            You have successfully staked {amount} STTAURX tokens.
          </p>
          {resultData && resultData.lockPeriod > 0 && (
            <p className="text-gold-200 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              {resultData.tierName} - Locked for {resultData.lockPeriod} days at {resultData.effectiveRate} APY
            </p>
          )}
          {resultData && resultData.lockPeriod === 0 && (
            <p className="text-emerald-400 mb-2">
              <Unlock className="w-4 h-4 inline mr-1" />
              Passive yield - withdraw anytime
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
    <div className="fixed inset-0 bg-vault-base/95 flex items-center justify-center z-50 p-4">
      <div className="bg-vault-card rounded-2xl max-w-md w-full border border-vault-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vault-border sticky top-0 bg-vault-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-300/20 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-gold-200" />
            </div>
            <h2 className="text-xl font-bold text-white">Stake STTAURX</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vault-cardHover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Available Balance */}
          <div className="bg-vault-base/50 rounded-xl p-4 border border-vault-border">
            <p className="text-sm text-gray-500 mb-1">Available to Stake</p>
            <p className="text-2xl font-bold text-white">
              {formatStakingAmount(walletBalance)}
              <span className="text-sm text-gold-200 ml-2">STTAURX</span>
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
                className="w-full bg-vault-base border border-vault-border rounded-xl px-4 py-4 text-xl font-medium text-white placeholder-gray-600 focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gold-300/20 text-gold-200 text-sm font-medium rounded-lg hover:bg-gold-300/30 transition-colors"
              >
                MAX
              </button>
            </div>
            {inputAmount > availableBalance && (
              <p className="text-red-400 text-sm mt-2">Insufficient balance</p>
            )}
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Select Staking Tier</label>
            <div className="space-y-3">
              {STAKING_TIERS.map((tier) => {
                const isSelected = lockPeriod === tier.days
                const tierColor = tier.days === 0
                  ? { border: 'border-emerald-500', bg: 'bg-emerald-500/15', text: 'text-emerald-400', apy: 'text-emerald-400' }
                  : tier.days === 90
                  ? { border: 'border-gold-300', bg: 'bg-gold-300/15', text: 'text-gold-200', apy: 'text-gold-200' }
                  : { border: 'border-purple-500', bg: 'bg-purple-500/15', text: 'text-purple-400', apy: 'text-purple-400' }
                return (
                  <button
                    key={tier.days}
                    onClick={() => setLockPeriod(tier.days)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? `${tierColor.border} ${tierColor.bg}`
                        : 'border-vault-border bg-vault-base/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tier.days === 0 ? (
                          <Unlock className={`w-5 h-5 ${isSelected ? tierColor.text : 'text-gray-500'}`} />
                        ) : (
                          <Lock className={`w-5 h-5 ${isSelected ? tierColor.text : 'text-gray-500'}`} />
                        )}
                        <div>
                          <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {tier.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                        </div>
                      </div>
                      <span className={`text-xl font-bold ${isSelected ? tierColor.apy : 'text-gray-500'}`}>
                        {tier.apyDisplay}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Auto-Compound Toggle */}
          <div className="flex items-center justify-between bg-vault-base/30 rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${autoCompound ? 'text-gold-200' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm font-medium text-white">Auto-Compound</p>
                <p className="text-xs text-gray-500">Automatically reinvest earned yield</p>
              </div>
            </div>
            <button
              onClick={() => setAutoCompound(!autoCompound)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoCompound ? 'bg-gold-300' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  autoCompound ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Summary Info */}
          <div className="bg-gold-300/8 border border-gold-300/15 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tier</span>
              <span className="text-gold-100 font-medium">{selectedTier.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">APY Rate</span>
              <span className="text-emerald-400 font-bold">{(effectiveAPY * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gold-300/10">
              <span className="text-gray-400">Est. Daily Yield</span>
              <span className="text-emerald-400 font-medium">
                +{(inputAmount * effectiveAPY / 365).toFixed(6)} STTAURX
              </span>
            </div>
            {lockPeriod > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lock Period</span>
                  <span className="text-amber-400 font-medium">{lockPeriod} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Unlock Date</span>
                  <span className="text-amber-400 font-medium">
                    {new Date(Date.now() + lockPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
            {autoCompound && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Auto-Compound</span>
                <span className="text-gold-200 font-medium">Enabled</span>
              </div>
            )}
          </div>

          {/* Warning for locked staking */}
          {lockPeriod > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200">
                Your tokens will be locked for {lockPeriod} days. You cannot unstake until the lock period expires. The contracted APY rate ({selectedTier.apyDisplay}) is guaranteed for the full lock period.
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
            className="w-full py-4 bg-gradient-to-r from-[#C5963B] to-[#D4A843] hover:from-[#D4A843] hover:to-[#E8C65D] rounded-xl font-semibold text-vault-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  Stake {amount || '0'} STTAURX
                  {lockPeriod > 0 ? ` - ${selectedTier.label}` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
