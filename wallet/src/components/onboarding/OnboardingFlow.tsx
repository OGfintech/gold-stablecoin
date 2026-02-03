'use client'

import { useOnboarding } from './OnboardingProvider'
import { WelcomeScreen } from './WelcomeScreen'
import { ValueSlides } from './ValueSlides'
import { WalletCreationChoice } from './WalletCreationChoice'
import { KeypairGeneration } from './KeypairGeneration'
import { SecretKeyBackup } from './SecretKeyBackup'
import { SecretKeyVerification } from './SecretKeyVerification'
import { WalletCreationSuccess } from './WalletCreationSuccess'

export function OnboardingFlow() {
  const { state } = useOnboarding()

  // If onboarding is complete, don't render anything
  if (!state.isOnboardingActive || state.currentStep === 'complete') {
    return null
  }

  // Render appropriate screen based on current step
  switch (state.currentStep) {
    // Phase 1: Welcome & Introduction
    case 'welcome':
      return <WelcomeScreen />
    case 'value-1':
    case 'value-2':
    case 'value-3':
      return <ValueSlides />

    // Phase 2: Wallet Creation & Security
    case 'wallet-choice':
      return <WalletCreationChoice />
    case 'keypair-generation':
      return <KeypairGeneration />
    case 'secret-backup':
      return <SecretKeyBackup />
    case 'secret-verify':
      return <SecretKeyVerification />
    case 'wallet-success':
      return <WalletCreationSuccess />

    default:
      return null
  }
}

// Wrapper component that shows onboarding OR the main app
interface OnboardingGateProps {
  children: React.ReactNode
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { state } = useOnboarding()

  // Show onboarding if it's active and not complete
  if (state.isOnboardingActive && state.currentStep !== 'complete') {
    return <OnboardingFlow />
  }

  // Otherwise show the main app
  return <>{children}</>
}
