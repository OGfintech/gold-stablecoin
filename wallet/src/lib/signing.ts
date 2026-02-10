import { signAsync, etc } from '@noble/ed25519'

/**
 * Sign a transaction client-side using Ed25519.
 * The private key NEVER leaves the client.
 *
 * Ed25519 (RFC 8032) internally hashes the message with SHA-512,
 * so we pass the deterministic serialization directly to signAsync.
 */
export async function signTransaction(
  tx: { from: string; to: string; amount: string; nonce: number; memo?: string },
  privateKeyHex: string
): Promise<string> {
  // 1. Serialize transaction data deterministically
  const message = JSON.stringify({
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    nonce: tx.nonce,
    memo: tx.memo || '',
  })

  // 2. Encode message to bytes
  const encoder = new TextEncoder()
  const messageBytes = encoder.encode(message)

  // 3. Sign with Ed25519 private key (signAsync handles SHA-512 internally per RFC 8032)
  const privateKey = etc.hexToBytes(privateKeyHex)
  const signature = await signAsync(messageBytes, privateKey)

  // 4. Return hex-encoded signature
  return etc.bytesToHex(signature)
}
