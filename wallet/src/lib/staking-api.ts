const API_BASE = 'http://localhost:3001/api/v1'

// Types
export interface StakeInfo {
  amount: string
  amountFormatted: string
  lockPeriod: number
  lockExpiry: number | null
  isLocked: boolean
  daysRemaining: number
  yieldRate: number
  yieldRateFormatted: string
  stakedAt: number
}

export interface StakingPosition {
  address: string
  stakedAmount: string
  stakedAmountFormatted: string
  unlockableAmount: string
  unlockableAmountFormatted: string
  lockedAmount: string
  lockedAmountFormatted: string
  baseYieldRate: number
  baseYieldRateFormatted: string
  accumulatedYield: string
  accumulatedYieldFormatted: string
  lastUpdateTime: number
  stakes: StakeInfo[]
  stakingHistory: StakingTransaction[]
  totalStaked: string
  totalStakedFormatted: string
  lockPeriodBonuses: Record<number, number>
}

export interface StakingTransaction {
  type: 'stake' | 'unstake' | 'claim' | 'yield_accrued'
  amount: string
  lockPeriod?: number
  lockExpiry?: number | null
  yieldRate?: number
  timestamp: string
  txHash?: string
}

export interface StakeResult {
  tx_hash: string
  status: string
  stakedAmount: string
  stakedAmountFormatted: string
  lockPeriod: number
  lockExpiry: number | null
  effectiveYieldRate: number
  effectiveYieldRateFormatted: string
  message: string
}

export interface UnstakeResult {
  tx_hash: string
  status: string
  unstakedAmount: string
  unstakedAmountFormatted: string
  remainingStake: string
  remainingStakeFormatted: string
  message: string
}

export interface ClaimResult {
  tx_hash: string
  status: string
  claimedAmount: string
  claimedAmountFormatted: string
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// Lock period options
export const LOCK_PERIODS = [
  { days: 0, label: 'Flexible', description: 'No lock, withdraw anytime', bonus: 1.0 },
  { days: 30, label: '30 Days', description: '1.5x yield bonus', bonus: 1.5 },
  { days: 60, label: '60 Days', description: '2x yield bonus', bonus: 2.0 },
  { days: 90, label: '90 Days', description: '2.5x yield bonus', bonus: 2.5 },
]

// Helper function
async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(json.error || 'API request failed')
  }
  return json.data
}

async function postApi<T, R>(endpoint: string, body: T): Promise<R> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<R> = await res.json()
  if (!json.success) {
    throw new Error(json.error || 'API request failed')
  }
  return json.data
}

// API Functions
export const stakingApi = {
  // Get staking position for address
  getStakingInfo: (address: string): Promise<StakingPosition> =>
    fetchApi(`/staking/${address}`),

  // Stake tokens with optional lock period
  stake: (address: string, amount: string, lockPeriod: number = 0): Promise<StakeResult> =>
    postApi('/staking/stake', { address, amount, lockPeriod }),

  // Unstake tokens (only unlocked amounts)
  unstake: (address: string, amount: string): Promise<UnstakeResult> =>
    postApi('/staking/unstake', { address, amount }),

  // Claim accumulated yield
  claim: (address: string): Promise<ClaimResult> =>
    postApi('/staking/claim', { address }),
}

// Formatting utilities
export const formatStakingAmount = (amount: string): string => {
  const num = Number(amount) / 1e18
  if (num === 0) return '0'
  if (num < 0.000001) return '< 0.000001'
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })
}

export const parseStakingAmount = (amount: string): string => {
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) return '0'
  return (BigInt(Math.floor(num * 1e6)) * BigInt(1e12)).toString()
}

export const formatDaysRemaining = (days: number): string => {
  if (days === 0) return 'Unlocked'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export const getEffectiveAPY = (baseRate: number, lockPeriod: number): number => {
  const period = LOCK_PERIODS.find(p => p.days === lockPeriod)
  return baseRate * (period?.bonus || 1.0)
}
