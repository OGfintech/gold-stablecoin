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

export async function encryptSecret(secret: string, password: string): Promise<string> {
  const enc = new TextEncoder()

  // 1. Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // 2. Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // 3. Encrypt with AES-256-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc.encode(secret)
  )

  // 4. Encode as hex: salt:iv:ciphertext
  const toHex = (arr: Uint8Array) =>
    Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')

  return [toHex(salt), toHex(iv), toHex(new Uint8Array(encrypted))].join(':')
}

export async function decryptSecret(encrypted: string, password: string): Promise<string> {
  const enc = new TextEncoder()

  // 1. Parse salt:iv:ciphertext
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const fromHex = (hex: string) =>
    new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

  const salt = fromHex(parts[0])
  const iv = fromHex(parts[1])
  const ciphertext = fromHex(parts[2])

  // 2. Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  // 3. Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

// Generate a signature for a transaction
export async function signTransaction(message: Uint8Array, secretKey: string): Promise<string> {
  // In production, use @noble/ed25519 or similar
  // For now, we'll call the API which has signing capability
  // This is just a placeholder
  return secretKey // Would be actual signature
}
