const API_BASE = 'http://localhost:3001/api/v1'

// Types
export interface AdminUser {
  id: string
  email: string
  fullName: string | null
  role: string
  status: string
  kycStatus: string
  emailVerified: boolean
  autoCompound: boolean
  createdAt: string
  lastLoginAt: string | null
  wallets: {
    address: string
    balance: string
    lockedBalance: string
    status: string
  }[]
}

export interface StakingTierConfig {
  id: string
  tierName: string
  displayName: string
  lockDays: number
  apyRate: number
  apyFormatted: string
  minStake: number
  maxStake: number | null
  isActive: boolean
}

export interface StakingStats {
  totalStaked: string
  totalStakedFormatted: string
  totalStakers: number
  totalAccumulatedYield: string
  totalAccumulatedYieldFormatted: string
  stakingPoolFees: string
  stakingPoolFeesFormatted: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    fullName: string
    role: string
    status: string
    kycStatus: string
  }
  accessToken: string
  refreshToken: string
  expiresIn: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  token: string,
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const opts: RequestInit = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${endpoint}`, opts)
  const json: ApiResponse<T> = await res.json()

  if (!json.success) {
    throw new Error(json.error || `API request failed (${res.status})`)
  }
  return json.data
}

export const adminApi = {
  // Auth
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json: ApiResponse<LoginResponse> = await res.json()
    if (!json.success) throw new Error(json.error || 'Login failed')
    return json.data
  },

  // Users
  getUsers: (token: string): Promise<{ users: AdminUser[]; total: number }> =>
    apiRequest('GET', '/admin/users', token),

  updateKycStatus: (token: string, userId: string, status: string): Promise<{ user: AdminUser; message: string }> =>
    apiRequest('PUT', `/admin/users/${userId}/kyc-status`, token, { status }),

  // Staking tiers
  getTiers: (token: string): Promise<{ tiers: StakingTierConfig[] }> =>
    apiRequest('GET', '/admin/staking/tiers', token),

  updateTier: (
    token: string,
    tierName: string,
    data: { apyRate?: number; minStake?: number; maxStake?: number | null; isActive?: boolean }
  ): Promise<{ tier: StakingTierConfig; message: string }> =>
    apiRequest('PUT', `/admin/staking/tiers/${tierName}`, token, data as Record<string, unknown>),

  // Staking stats
  getStats: (token: string): Promise<StakingStats> =>
    apiRequest('GET', '/admin/staking/stats', token),

  // Mint tokens
  mintTokens: (token: string, to: string, amount: string): Promise<{ tx_hash: string; status: string }> =>
    apiRequest('POST', '/tokens/mint', token, { to, amount }),
}
