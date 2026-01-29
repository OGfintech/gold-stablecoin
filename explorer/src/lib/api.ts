const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface Metrics {
  blocks_produced: number
  total_transactions: number
  current_tps: number
  average_block_time_ms: number
  mempool_size: number
  total_supply: string
  total_supply_formatted: string
}

export interface Block {
  hash: string
  height: number
  previous_hash: string
  merkle_root: string
  state_root: string
  tx_count: number
  timestamp: string
  producer: string
  transactions?: Transaction[]
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

export interface CertificateStats {
  total_certificates: number
  active_certificates: number
  total_gold_oz: number
  total_minted: string
  total_mintable: string
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

export const api = {
  getMetrics: () => fetchApi<Metrics>('/api/v1/system/metrics'),

  getBlocks: (limit = 20, offset = 0) =>
    fetchApi<{ blocks: Block[]; total: number }>(`/api/v1/blocks?limit=${limit}&offset=${offset}`),

  getBlock: (height: number) =>
    fetchApi<Block>(`/api/v1/blocks/${height}`),

  getLatestBlock: () =>
    fetchApi<Block>('/api/v1/blocks/latest'),

  getTransactions: (limit = 20, offset = 0) =>
    fetchApi<{ transactions: Transaction[]; total: number }>(`/api/v1/transactions?limit=${limit}&offset=${offset}`),

  getTransaction: (hash: string) =>
    fetchApi<Transaction>(`/api/v1/transactions/${hash}`),

  getCertificates: () =>
    fetchApi<{ certificates: Certificate[]; total: number; stats: CertificateStats }>('/api/v1/certificates'),

  getCertificate: (id: string) =>
    fetchApi<Certificate>(`/api/v1/certificates/${id}`),

  generateKeypair: () =>
    postApi<{}, { address: string; public_key: string; secret_key: string }>('/api/v1/admin/keypair', {}),

  registerCertificate: (data: any) =>
    postApi<any, { tx_hash: string; status: string }>('/api/v1/certificates', data),

  mintTokens: (data: any) =>
    postApi<any, { tx_hash: string; status: string }>('/api/v1/tokens/mint', data),
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

export function shortenHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}
