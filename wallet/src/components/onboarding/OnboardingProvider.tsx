'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type OnboardingStep =
  // Phase 1: Welcome & Introduction
  | 'welcome'
  | 'value-1'
  | 'value-2'
  | 'value-3'
  // Phase 2: Wallet Creation & Security
  | 'wallet-choice'
  | 'keypair-generation'
  | 'secret-backup'
  | 'secret-verify'
  | 'wallet-success'
  // Complete
  | 'complete'

interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  hasSeenOnboarding: boolean
  isOnboardingActive: boolean
  // Phase 2 specific state
  walletCreated: boolean
  backupVerified: boolean
  generatedKeypair: {
    address: string
    publicKey: string
    secretKey: string
  } | null
}

interface OnboardingContextType {
  state: OnboardingState
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  goToStep: (step: OnboardingStep) => void
  resetOnboarding: () => void
  completeOnboarding: () => void
  // Phase 2 functions
  setGeneratedKeypair: (keypair: { address: string; publicKey: string; secretKey: string }) => void
  setBackupVerified: (verified: boolean) => void
  setWalletCreated: (created: boolean) => void
}

const STORAGE_KEY = 'au_gold_onboarding'

const STEP_ORDER: OnboardingStep[] = [
  // Phase 1: Welcome & Introduction
  'welcome',
  'value-1',
  'value-2',
  'value-3',
  // Phase 2: Wallet Creation & Security
  'wallet-choice',
  'keypair-generation',
  'secret-backup',
  'secret-verify',
  'wallet-success',
  // Complete
  'complete'
]

const defaultState: OnboardingState = {
  currentStep: 'welcome',
  completedSteps: [],
  hasSeenOnboarding: false,
  isOnboardingActive: true,
  // Phase 2 specific state
  walletCreated: false,
  backupVerified: false,
  generatedKeypair: null,
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState({
          ...defaultState,
          ...parsed,
          isOnboardingActive: !parsed.hasSeenOnboarding,
        })
      } catch (e) {
        console.error('Failed to parse onboarding state:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save state to localStorage on changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isLoaded])

  const nextStep = () => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep)
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1)
      const nextStepValue = STEP_ORDER[nextIndex]

      return {
        ...prev,
        currentStep: nextStepValue,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      }
    })
  }

  const prevStep = () => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return {
        ...prev,
        currentStep: STEP_ORDER[prevIndex],
      }
    })
  }

  const goToStep = (step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }))
  }

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true,
      isOnboardingActive: false,
      currentStep: 'complete',
    }))
  }

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true,
      isOnboardingActive: false,
      currentStep: 'complete',
      completedSteps: STEP_ORDER,
    }))
  }

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      ...defaultState,
      isOnboardingActive: true,
    })
  }

  // Phase 2 functions
  const setGeneratedKeypair = (keypair: { address: string; publicKey: string; secretKey: string }) => {
    setState(prev => ({
      ...prev,
      generatedKeypair: keypair,
    }))
  }

  const setBackupVerified = (verified: boolean) => {
    setState(prev => ({
      ...prev,
      backupVerified: verified,
    }))
  }

  const setWalletCreated = (created: boolean) => {
    setState(prev => ({
      ...prev,
      walletCreated: created,
    }))
  }

  // Don't render until we've loaded from localStorage
  if (!isLoaded) {
    return null
  }

  return (
    <OnboardingContext.Provider
      value={{
        state,
        nextStep,
        prevStep,
        skipOnboarding,
        goToStep,
        resetOnboarding,
        completeOnboarding,
        // Phase 2 functions
        setGeneratedKeypair,
        setBackupVerified,
        setWalletCreated,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

// Helper hook to get current step index for progress
export function useOnboardingProgress() {
  const { state } = useOnboarding()
  const currentIndex = STEP_ORDER.indexOf(state.currentStep)
  const totalSteps = STEP_ORDER.length - 1 // Exclude 'complete' from count

  // Determine which phase we're in
  const phase1Steps = ['welcome', 'value-1', 'value-2', 'value-3']
  const phase2Steps = ['wallet-choice', 'keypair-generation', 'secret-backup', 'secret-verify', 'wallet-success']

  const isPhase1 = phase1Steps.includes(state.currentStep)
  const isPhase2 = phase2Steps.includes(state.currentStep)

  const phase1Index = phase1Steps.indexOf(state.currentStep)
  const phase2Index = phase2Steps.indexOf(state.currentStep)

  return {
    currentIndex,
    totalSteps,
    progress: currentIndex / totalSteps,
    isFirstStep: currentIndex === 0,
    isLastStep: state.currentStep === 'wallet-success',
    // Phase-specific progress
    isPhase1,
    isPhase2,
    phase1Progress: isPhase1 ? phase1Index / (phase1Steps.length - 1) : 1,
    phase2Progress: isPhase2 ? phase2Index / (phase2Steps.length - 1) : 0,
    phase1Steps: phase1Steps.length,
    phase2Steps: phase2Steps.length,
    currentPhase1Step: phase1Index + 1,
    currentPhase2Step: phase2Index + 1,
  }
}
