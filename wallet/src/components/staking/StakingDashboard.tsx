'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Coins, ArrowUpRight, ArrowDownRight, Gift, Info, Lock, Unlock, Clock, History } from 'lucide-react'
import { stakingApi, formatStakingAmount, formatDaysRemaining } from '@/lib/staking-api'
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
    refetchInterval: 10000,
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
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-6 border border-purple-500/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    )
  }

  const stakedAmount = stakingInfo?.stakedAmount || '0'
  const unlockableAmount = stakingInfo?.unlockableAmount || '0'
  const lockedAmount = stakingInfo?.lockedAmount || '0'
  const accumulatedYield = stakingInfo?.accumulatedYield || '0'
  const baseYieldRate = stakingInfo?.baseYieldRate || 0.05
  const stakes = stakingInfo?.stakes || []
  const hasStake = BigInt(stakedAmount) > BigInt(0)
  const hasYield = BigInt(accumulatedYield) > BigInt(0)
  const hasUnlockable = BigInt(unlockableAmount) > BigInt(0)
  const hasLocked = BigInt(lockedAmount) > BigInt(0)

  return (
    <>
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-6 border border-purple-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Staking</h2>
              <p className="text-sm text-gray-400">Earn yield on your GOLD tokens</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium text-sm">
              {(baseYieldRate * 100).toFixed(1)}% Base APY
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Total Staked */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Coins className="w-4 h-4" />
              <span>Total Staked</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatStakingAmount(stakedAmount)}
              <span className="text-sm text-purple-400 ml-2">GOLD</span>
            </p>
          </div>

          {/* Accumulated Yield */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Gift className="w-4 h-4" />
              <span>Earned Yield</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              +{formatStakingAmount(accumulatedYield)}
              <span className="text-sm text-green-300 ml-2">GOLD</span>
            </p>
          </div>
        </div>

        {/* Locked/Unlocked breakdown */}
        {hasStake && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Unlock className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Available</p>
                <p className="text-sm font-semibold text-green-400">
                  {formatStakingAmount(unlockableAmount)} GOLD
                </p>
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Locked</p>
                <p className="text-sm font-semibold text-orange-400">
                  {formatStakingAmount(lockedAmount)} GOLD
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Stakes Breakdown */}
        {stakes.length > 0 && hasStake && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Active Stakes</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stakes.filter(s => Number(s.amount) > 0).map((stake, i) => (
                <div key={i} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {stake.isLocked ? (
                      <Lock className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {formatStakingAmount(stake.amount)} GOLD
                      </p>
                      <p className="text-xs text-gray-500">
                        {stake.lockPeriod === 0 ? 'Flexible' : `${stake.lockPeriod}-day lock`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      {stake.yieldRateFormatted}
                    </p>
                    {stake.isLocked && (
                      <p className="text-xs text-orange-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDaysRemaining(stake.daysRemaining)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-200">
              Lock your tokens for higher yields: 30 days (1.5x), 60 days (2x), or 90 days (2.5x) the base APY.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowStakeModal(true)}
            className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors"
          >
            <ArrowDownRight className="w-5 h-5" />
            <span>Stake</span>
          </button>

          <button
            onClick={() => setShowUnstakeModal(true)}
            disabled={!hasUnlockable}
            className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasUnlockable && hasLocked ? 'All tokens are locked' : undefined}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Unstake</span>
          </button>

          <button
            onClick={handleClaimYield}
            disabled={!hasYield}
            className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gift className="w-5 h-5" />
            <span>Claim</span>
          </button>
        </div>

        {/* Staking History Preview */}
        {stakingInfo?.stakingHistory && stakingInfo.stakingHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <History className="w-3 h-3" />
                View All
              </button>
            </div>
            <div className="space-y-2">
              {stakingInfo.stakingHistory.slice(-3).reverse().map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === 'stake' && <ArrowDownRight className="w-4 h-4 text-purple-400" />}
                    {tx.type === 'unstake' && <ArrowUpRight className="w-4 h-4 text-orange-400" />}
                    {tx.type === 'claim' && <Gift className="w-4 h-4 text-green-400" />}
                    <span className="capitalize text-gray-300">{tx.type}</span>
                    {tx.lockPeriod && tx.lockPeriod > 0 && (
                      <span className="text-xs text-orange-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {tx.lockPeriod}d
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={
                      tx.type === 'unstake' ? 'text-orange-400' :
                      tx.type === 'claim' ? 'text-green-400' :
                      'text-purple-400'
                    }>
                      {tx.type === 'unstake' ? '-' : '+'}{formatStakingAmount(tx.amount)} GOLD
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
          baseYieldRate={baseYieldRate}
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
