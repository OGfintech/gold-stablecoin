'use client'

import { X, ArrowDownRight, ArrowUpRight, Gift, Lock, Unlock, Clock, TrendingUp } from 'lucide-react'
import { formatStakingAmount, StakingTransaction, StakeInfo } from '@/lib/staking-api'

interface StakingHistoryProps {
  stakes: StakeInfo[]
  history: StakingTransaction[]
  onClose: () => void
}

export function StakingHistory({ stakes, history, onClose }: StakingHistoryProps) {
  // Group history by date
  const groupedHistory = history.reduce((groups, tx) => {
    const date = new Date(tx.timestamp).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {} as Record<string, StakingTransaction[]>)

  const sortedDates = Object.keys(groupedHistory).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  const getIcon = (type: string) => {
    switch (type) {
      case 'stake':
        return <ArrowDownRight className="w-4 h-4 text-purple-400" />
      case 'unstake':
        return <ArrowUpRight className="w-4 h-4 text-orange-400" />
      case 'claim':
        return <Gift className="w-4 h-4 text-green-400" />
      case 'yield_accrued':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stake':
        return 'Staked'
      case 'unstake':
        return 'Unstaked'
      case 'claim':
        return 'Claimed Yield'
      case 'yield_accrued':
        return 'Yield Accrued'
      default:
        return type
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'stake':
        return 'text-purple-400'
      case 'unstake':
        return 'text-orange-400'
      case 'claim':
      case 'yield_accrued':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-lg w-full border border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Staking History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Stakes Summary */}
          {stakes.length > 0 && stakes.some(s => Number(s.amount) > 0) && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Active Stakes</h3>
              <div className="space-y-2">
                {stakes.filter(s => Number(s.amount) > 0).map((stake, i) => (
                  <div
                    key={i}
                    className="bg-gray-700/50 rounded-xl p-4 border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {stake.isLocked ? (
                          <Lock className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Unlock className="w-4 h-4 text-green-400" />
                        )}
                        <span className="font-semibold text-white">
                          {formatStakingAmount(stake.amount)} GOLD
                        </span>
                      </div>
                      <span className="text-green-400 font-medium">
                        {stake.yieldRateFormatted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {stake.lockPeriod === 0 ? 'Flexible' : `${stake.lockPeriod}-day lock`}
                      </span>
                      {stake.isLocked ? (
                        <span className="text-orange-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {stake.daysRemaining} days left
                        </span>
                      ) : (
                        <span className="text-green-400">Unlocked</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Staked on {new Date(stake.stakedAt).toLocaleDateString()} at {new Date(stake.stakedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Transaction History</h3>

            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staking history yet. Start by staking some GOLD tokens!
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDates.map(date => (
                  <div key={date}>
                    <div className="text-xs text-gray-500 mb-2 sticky top-0 bg-gray-800 py-1">
                      {date}
                    </div>
                    <div className="space-y-2">
                      {groupedHistory[date].reverse().map((tx, i) => (
                        <div
                          key={i}
                          className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-700 rounded-lg">
                              {getIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {getTypeLabel(tx.type)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(tx.timestamp).toLocaleTimeString()}
                                {tx.lockPeriod && tx.lockPeriod > 0 && (
                                  <span className="ml-2 text-orange-400">
                                    <Lock className="w-3 h-3 inline mr-1" />
                                    {tx.lockPeriod}d lock
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${getAmountColor(tx.type)}`}>
                              {tx.type === 'unstake' ? '-' : '+'}
                              {formatStakingAmount(tx.amount)} GOLD
                            </p>
                            {tx.yieldRate && (
                              <p className="text-xs text-gray-500">
                                {(tx.yieldRate * 100).toFixed(2)}% APY
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yield Summary */}
          {history.some(tx => tx.type === 'claim') && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Total Yield Claimed
              </h3>
              <p className="text-2xl font-bold text-green-400">
                {formatStakingAmount(
                  history
                    .filter(tx => tx.type === 'claim')
                    .reduce((sum, tx) => sum + BigInt(tx.amount), BigInt(0))
                    .toString()
                )} GOLD
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
