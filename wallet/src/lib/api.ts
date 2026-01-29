const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface WalletBalance {
  address: string
  balance: string
  balance_formatted: string
  nonce: number
  is_admin: boolean
}

export interface Transaction {
  hash: string
  tx_type: string
  from: string
  to?: string
  amount?: string
  nonce: number
  timestamp: string
  block_height?: number
  success?: boolean
}

export interface Certificate {
  certificate_id: string
  hsbc_reference: string
  gold_amount_oz: number
  gold_amount_grams: number
  issue_date: string
  hsbc_branch: string
  status: string
  minted_amount: string
  max_mintable: string
  remaining_mintable: string
  registered_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  const data: ApiResponse<T> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'API request failed')
  }

  return data.data
}

async function postApi<T, R>(endpoint: string, body: T): Promise<R> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data: ApiResponse<R> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'API request failed')
  }

  return data.data
}

export const walletApi = {
  getBalance: (address: string) =>
    fetchApi<WalletBalance>(`/api/v1/wallet/${address}/balance`),

  getTransactions: (address: string) =>
    fetchApi<{ transactions: Transaction[]; total: number }>(`/api/v1/wallet/${address}/transactions`),

  getCertificates: (address: string) =>
    fetchApi<{ certificates: Certificate[]; total_gold_oz: number; total_gold_grams: number }>(
      `/api/v1/wallet/${address}/certificates`
    ),

  transfer: (data: {
    from: string
    public_key: string
    nonce: number
    to: string
    amount: string
    memo?: string
    signature: string
  }) => postApi<any, { tx_hash: string; status: string }>('/api/v1/wallet/transfer', data),
}

export function formatTokenAmount(amount: string): string {
  const value = BigInt(amount)
  const decimals = BigInt(10 ** 18)
  const whole = value / decimals
  const fraction = value % decimals

  if (fraction === BigInt(0)) {
    return whole.toString()
  }

  const fractionStr = fraction.toString().padStart(18, '0').slice(0, 6)
  return `${whole}.${fractionStr}`
}

export function parseTokenAmount(amount: string): string {
  const parts = amount.split('.')
  const whole = parts[0] || '0'
  const fraction = (parts[1] || '').padEnd(18, '0').slice(0, 18)
  return BigInt(whole + fraction).toString()
}

export function shortenAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

// Gold price (for display purposes - would use real API in production)
export const GOLD_PRICE_PER_GRAM = 65 // USD
export const GOLD_PRICE_PER_OZ = GOLD_PRICE_PER_GRAM * 31.1035

export function calculateGoldValue(tokens: string): number {
  const amount = parseFloat(formatTokenAmount(tokens))
  return amount * GOLD_PRICE_PER_GRAM
}
