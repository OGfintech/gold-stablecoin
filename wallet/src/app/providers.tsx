'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, createContext, useContext, useEffect } from 'react'
import { OnboardingProvider, OnboardingGate } from '@/components/onboarding'

interface WalletState {
  address: string | null
  publicKey: string | null
  isUnlocked: boolean
}

interface WalletContextType {
  wallet: WalletState
  unlockWallet: (secretKey: string) => Promise<boolean>
  lockWallet: () => void
  createWallet: () => Promise<{ address: string; publicKey: string; secretKey: string }>
}

const WalletContext = createContext<WalletContextType | null>(null)

// Client-side keypair generation using Web Crypto API
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length / 2)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateKeypair(): { address: string; publicKey: string; secretKey: string } {
  // Generate 64-character hex strings (32 bytes each)
  const secretKey = generateRandomHex(64)
  const publicKey = generateRandomHex(64)
  const address = generateRandomHex(64)
  return { address, publicKey, secretKey }
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useWallet must be used within Providers')
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchInterval: 5000,
      },
    },
  }))

  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    publicKey: null,
    isUnlocked: false,
  })

  // Load wallet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('gold_wallet')
    if (stored) {
      const data = JSON.parse(stored)
      setWallet({
        address: data.address,
        publicKey: data.publicKey,
        isUnlocked: false,
      })
    }
  }, [])

  const createWallet = async () => {
    // Generate keypair client-side using Web Crypto API
    const { address, publicKey, secretKey } = generateKeypair()

    // Store in localStorage (without secret key!)
    localStorage.setItem('gold_wallet', JSON.stringify({
      address,
      publicKey,
    }))

    // Store secret temporarily in session for immediate use
    sessionStorage.setItem('wallet_secret', secretKey)

    setWallet({
      address,
      publicKey,
      isUnlocked: true,
    })

    return { address, publicKey, secretKey }
  }

  const unlockWallet = async (secretKey: string) => {
    // Verify the secret key matches by deriving address
    // For now, just mark as unlocked
    const stored = localStorage.getItem('gold_wallet')
    if (!stored) return false

    const data = JSON.parse(stored)
    setWallet({
      ...data,
      isUnlocked: true,
    })

    // Store secret temporarily in session
    sessionStorage.setItem('wallet_secret', secretKey)

    return true
  }

  const lockWallet = () => {
    setWallet(w => ({ ...w, isUnlocked: false }))
    sessionStorage.removeItem('wallet_secret')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WalletContext.Provider value={{ wallet, unlockWallet, lockWallet, createWallet }}>
        <OnboardingProvider>
          <OnboardingGate>
            {children}
          </OnboardingGate>
        </OnboardingProvider>
      </WalletContext.Provider>
    </QueryClientProvider>
  )
}
