'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Coins, ArrowUpRight, ArrowDownRight, Gift, Info, Lock, Unlock, Clock, History, Zap } from 'lucide-react'
import { stakingApi, formatStakingAmount, formatDaysRemaining, STAKING_TIERS, getTierByLockDays } from '@/lib/staking-api'
import { StakeFlow } from './StakeFlow'
import { UnstakeFlow } from './UnstakeFlow'
import { StakingHistory } from './StakingHistory'

interface StakingDashboardProps {
  walletAddress: string
  walletBalance: string
}

export function StakingDashboard({ walletAddress, walletBalance }: StakingDashboardProps) {
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const { data: stakingInfo, isLoading, refetch } = useQuery({
    queryKey: ['staking', walletAddress],
    queryFn: () => stakingApi.getStakingInfo(walletAddress),
    enabled: !!walletAddress,
    refetchInterval: 60000,
  })

  const handleClaimYield = async () => {
    if (!stakingInfo || BigInt(stakingInfo.accumulatedYield) === BigInt(0)) return

    try {
      await stakingApi.claim(walletAddress)
      refetch()
    } catch (error) {
      console.error('Failed to claim yield:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-vault-card rounded-2xl p-6 border border-vault-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-vault-cardHover rounded w-1/3" />
          <div className="h-20 bg-vault-cardHover rounded" />
          <div className="h-10 bg-vault-cardHover rounded w-1/2" />
        </div>
      </div>
    )
  }

  const stakedAmount = stakingInfo?.stakedAmount || '0'
  const unlockableAmount = stakingInfo?.unlockableAmount || '0'
  const lockedAmount = stakingInfo?.lockedAmount || '0'
  const accumulatedYield = stakingInfo?.accumulatedYield || '0'
  const passiveRate = stakingInfo?.passiveYieldRate || 0.005
  const stakes = stakingInfo?.stakes || []
  const hasStake = BigInt(stakedAmount) > BigInt(0)
  const hasYield = BigInt(accumulatedYield) > BigInt(0)
  const hasUnlockable = BigInt(unlockableAmount) > BigInt(0)
  const hasLocked = BigInt(lockedAmount) > BigInt(0)

  return (
    <>
      <div className="bg-vault-card rounded-2xl p-6 border border-vault-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-300/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-gold-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Yield & Staking</h2>
              <p className="text-sm text-gray-500">Earn yield on your STTAURX</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-medium text-sm">
              {(passiveRate * 100).toFixed(1)}% Passive
            </span>
          </div>
        </div>

        {/* Tier Overview Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {STAKING_TIERS.map((tier) => (
            <div
              key={tier.tierName}
              className={`rounded-xl p-3 text-center border ${
                tier.days === 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : tier.days === 90
                  ? 'bg-gold-300/10 border-gold-300/20'
                  : 'bg-purple-500/10 border-purple-500/20'
              }`}
            >
              <p className={`text-lg font-bold ${
                tier.days === 0
                  ? 'text-emerald-400'
                  : tier.days === 90
                  ? 'text-gold-200'
                  : 'text-purple-400'
              }`}>
                {tier.apyDisplay}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{tier.label}</p>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Staked */}
          <div className="bg-vault-base/50 rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Coins className="w-4 h-4" />
              <span>Total Staked</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatStakingAmount(stakedAmount)}
              <span className="text-sm text-gold-300 ml-2">STTAURX</span>
            </p>
          </div>

          {/* Accumulated Yield */}
          <div className="bg-vault-base/50 rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Gift className="w-4 h-4" />
              <span>Earned Yield</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              +{formatStakingAmount(accumulatedYield)}
              <span className="text-sm text-emerald-300 ml-2">STTAURX</span>
            </p>
          </div>
        </div>

        {/* Locked/Unlocked breakdown */}
        {hasStake && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-vault-base/30 rounded-lg p-3 flex items-center gap-3 border border-vault-border">
              <div className="p-2 bg-emerald-500/15 rounded-lg">
                <Unlock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-sm font-semibold text-emerald-400">
                  {formatStakingAmount(unlockableAmount)} STTAURX
                </p>
              </div>
            </div>
            <div className="bg-vault-base/30 rounded-lg p-3 flex items-center gap-3 border border-vault-border">
              <div className="p-2 bg-amber-500/15 rounded-lg">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Locked</p>
                <p className="text-sm font-semibold text-amber-400">
                  {formatStakingAmount(lockedAmount)} STTAURX
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Stakes Breakdown */}
        {stakes.length > 0 && hasStake && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Stakes</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stakes.filter(s => Number(s.amount) > 0).map((stake, i) => {
                const tier = getTierByLockDays(stake.lockPeriod)
                return (
                  <div key={i} className="bg-vault-base/30 rounded-lg p-3 flex items-center justify-between border border-vault-border">
                    <div className="flex items-center gap-3">
                      {stake.isLocked ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatStakingAmount(stake.amount)} STTAURX
                        </p>
                        <p className="text-xs text-gray-500">
                          {tier.label}
                          {stake.autoCompound && (
                            <span className="ml-1.5 text-gold-200">
                              <Zap className="w-3 h-3 inline" /> Auto
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        {stake.yieldRateFormatted}
                      </p>
                      {stake.isLocked && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDaysRemaining(stake.daysRemaining)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-gold-300/8 border border-gold-300/15 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gold-200 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gold-100">
              All balances earn 0.5% passive yield. Lock for higher rates: Gold Lock (90d) at 5% or Platinum Lock (180d) at 15% APY.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowStakeModal(true)}
            className="flex items-center justify-center gap-2 py-3 bg-gold-300 hover:bg-gold-200 text-vault-base rounded-xl font-semibold transition-colors"
          >
            <ArrowDownRight className="w-5 h-5" />
            <span>Stake</span>
          </button>

          <button
            onClick={() => setShowUnstakeModal(true)}
            disabled={!hasUnlockable}
            className="flex items-center justify-center gap-2 py-3 bg-vault-cardHover hover:bg-gray-700 border border-vault-border rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasUnlockable && hasLocked ? 'All tokens are locked' : undefined}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Unstake</span>
          </button>

          <button
            onClick={handleClaimYield}
            disabled={!hasYield}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gift className="w-5 h-5" />
            <span>Claim</span>
          </button>
        </div>

        {/* Staking History Preview */}
        {stakingInfo?.stakingHistory && stakingInfo.stakingHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-vault-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-gold-200 hover:text-gold-100 flex items-center gap-1 transition-colors"
              >
                <History className="w-3 h-3" />
                View All
              </button>
            </div>
            <div className="space-y-2">
              {stakingInfo.stakingHistory.slice(-3).reverse().map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === 'stake' && <ArrowDownRight className="w-4 h-4 text-gold-200" />}
                    {tx.type === 'unstake' && <ArrowUpRight className="w-4 h-4 text-amber-400" />}
                    {tx.type === 'claim' && <Gift className="w-4 h-4 text-emerald-400" />}
                    <span className="capitalize text-gray-300">{tx.type}</span>
                    {tx.lockPeriod && tx.lockPeriod > 0 && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {tx.lockPeriod}d
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={
                      tx.type === 'unstake' ? 'text-amber-400' :
                      tx.type === 'claim' ? 'text-emerald-400' :
                      'text-gold-200'
                    }>
                      {tx.type === 'unstake' ? '-' : '+'}{formatStakingAmount(tx.amount)} STTAURX
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStakeModal && (
        <StakeFlow
          walletAddress={walletAddress}
          walletBalance={walletBalance}
          onClose={() => setShowStakeModal(false)}
          onSuccess={() => {
            setShowStakeModal(false)
            refetch()
          }}
        />
      )}

      {showUnstakeModal && (
        <UnstakeFlow
          walletAddress={walletAddress}
          stakedBalance={stakedAmount}
          unlockableBalance={unlockableAmount}
          onClose={() => setShowUnstakeModal(false)}
          onSuccess={() => {
            setShowUnstakeModal(false)
            refetch()
          }}
        />
      )}

      {showHistoryModal && (
        <StakingHistory
          stakes={stakes}
          history={stakingInfo?.stakingHistory || []}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  )
}
