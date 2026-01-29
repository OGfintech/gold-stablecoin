'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, createContext, useContext, useEffect } from 'react'

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
    // Generate keypair using the API
    const response = await fetch('http://localhost:3001/api/v1/admin/keypair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate keypair')
    }

    const { address, public_key, secret_key } = result.data

    // Store in localStorage (without secret key!)
    localStorage.setItem('gold_wallet', JSON.stringify({
      address,
      publicKey: public_key,
    }))

    setWallet({
      address,
      publicKey: public_key,
      isUnlocked: true,
    })

    return { address, publicKey: public_key, secretKey: secret_key }
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
        {children}
      </WalletContext.Provider>
    </QueryClientProvider>
  )
}
