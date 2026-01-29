// Wallet keystore utilities

export interface KeystoreData {
  address: string
  publicKey: string
  encryptedSecret?: string
  createdAt: string
}

const STORAGE_KEY = 'gold_wallet'

export function saveWallet(data: KeystoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadWallet(): KeystoreData | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as KeystoreData
  } catch {
    return null
  }
}

export function deleteWallet(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem('wallet_secret')
}

export function getSessionSecret(): string | null {
  return sessionStorage.getItem('wallet_secret')
}

export function setSessionSecret(secret: string): void {
  sessionStorage.setItem('wallet_secret', secret)
}

export function clearSessionSecret(): void {
  sessionStorage.removeItem('wallet_secret')
}

// Simple encryption (in production, use proper encryption)
export async function encryptSecret(secret: string, password: string): Promise<string> {
  // This is a placeholder - in production, use proper encryption like Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(secret)
  const key = encoder.encode(password.padEnd(32, '0').slice(0, 32))

  // XOR encryption (NOT secure - just for demo)
  const encrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length]
  }

  return btoa(String.fromCharCode(...encrypted))
}

export async function decryptSecret(encrypted: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const key = encoder.encode(password.padEnd(32, '0').slice(0, 32))

  const decrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key[i % key.length]
  }

  return new TextDecoder().decode(decrypted)
}

// Generate a signature for a transaction
export async function signTransaction(message: Uint8Array, secretKey: string): Promise<string> {
  // In production, use @noble/ed25519 or similar
  // For now, we'll call the API which has signing capability
  // This is just a placeholder
  return secretKey // Would be actual signature
}
