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
  tierName?: string
  autoCompound?: boolean
}

export interface StakingTier {
  tierName: string
  displayName: string
  lockDays: number
  apyRate: number
  apyFormatted: string
  minStake: number
  maxStake: number | null
  isActive: boolean
}

export interface StakingPosition {
  address: string
  stakedAmount: string
  stakedAmountFormatted: string
  unlockableAmount: string
  unlockableAmountFormatted: string
  lockedAmount: string
  lockedAmountFormatted: string
  passiveYieldRate: number
  passiveYieldRateFormatted: string
  accumulatedYield: string
  accumulatedYieldFormatted: string
  lastUpdateTime: number
  stakes: StakeInfo[]
  stakingHistory: StakingTransaction[]
  totalStaked: string
  totalStakedFormatted: string
  tiers: Record<string, { apyRate: number; displayName: string; lockDays: number }>
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
  tierName: string
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

// Staking tier options (matches backend DB tiers)
export const STAKING_TIERS = [
  {
    days: 0,
    tierName: 'passive',
    label: 'Passive Yield',
    description: 'No lock - earn on idle balance',
    apy: 0.005,
    apyDisplay: '0.5%',
  },
  {
    days: 90,
    tierName: 'gold_lock',
    label: 'Gold Lock',
    description: '90-day lock for premium yield',
    apy: 0.05,
    apyDisplay: '5.0%',
  },
  {
    days: 180,
    tierName: 'platinum_lock',
    label: 'Platinum Lock',
    description: '180-day lock for maximum yield',
    apy: 0.15,
    apyDisplay: '15.0%',
  },
]

// Helper function
async function fetchApi<T>(endpoint: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${endpoint}`, { headers })
  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(json.error || 'API request failed')
  }
  return json.data
}

async function postApi<T, R>(endpoint: string, body: T, token?: string): Promise<R> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
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

  // Stake tokens with lock period (0=passive, 90=gold, 180=platinum)
  stake: (address: string, amount: string, lockPeriod: number = 0, autoCompound: boolean = false): Promise<StakeResult> =>
    postApi('/staking/stake', { address, amount, lockPeriod, autoCompound }),

  // Unstake tokens (only unlocked amounts)
  unstake: (address: string, amount: string): Promise<UnstakeResult> =>
    postApi('/staking/unstake', { address, amount }),

  // Claim accumulated yield
  claim: (address: string): Promise<ClaimResult> =>
    postApi('/staking/claim', { address }),

  // Get tier configs from admin endpoint
  getTiers: (token: string): Promise<{ tiers: StakingTier[] }> =>
    fetchApi('/admin/staking/tiers', token),
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

export const getTierByLockDays = (days: number) => {
  return STAKING_TIERS.find(t => t.days === days) || STAKING_TIERS[0]
}

export const getTierAPY = (lockPeriod: number): number => {
  const tier = getTierByLockDays(lockPeriod)
  return tier.apy
}
