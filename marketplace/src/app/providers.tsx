'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (address: string, role: 'supplier' | 'buyer') => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  isLoading: true
})

export function useAuth() {
  return useContext(AuthContext)
}

// Demo accounts for testing
const DEMO_ACCOUNTS: Record<string, User> = {
  'gc_supplier_gold_corp': {
    address: 'gc_supplier_gold_corp',
    role: 'supplier',
    companyName: 'Gold Mining Corp',
    verified: true
  },
  'gc_supplier_agri_trade': {
    address: 'gc_supplier_agri_trade',
    role: 'supplier',
    companyName: 'AgriTrade International',
    verified: true
  },
  'gc_buyer_global_imports': {
    address: 'gc_buyer_global_imports',
    role: 'buyer',
    companyName: 'Global Imports Ltd',
    verified: true
  },
  'gc_buyer_euro_foods': {
    address: 'gc_buyer_euro_foods',
    role: 'buyer',
    companyName: 'EuroFoods Distribution',
    verified: true
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const stored = localStorage.getItem('marketplace_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem('marketplace_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (address: string, role: 'supplier' | 'buyer') => {
    // Check if demo account
    const demoUser = DEMO_ACCOUNTS[address]
    if (demoUser) {
      setUser(demoUser)
      localStorage.setItem('marketplace_user', JSON.stringify(demoUser))
      return
    }

    // Create new user
    const newUser: User = {
      address,
      role,
      verified: false
    }
    setUser(newUser)
    localStorage.setItem('marketplace_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('marketplace_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}
