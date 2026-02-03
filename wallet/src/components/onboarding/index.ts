// Provider and hooks
export { OnboardingProvider, useOnboarding, useOnboardingProgress } from './OnboardingProvider'
export type { OnboardingStep } from './OnboardingProvider'

// Phase 1: Welcome & Introduction
export { WelcomeScreen } from './WelcomeScreen'
export { ValueSlides } from './ValueSlides'

// Phase 2: Wallet Creation & Security
export { WalletCreationChoice } from './WalletCreationChoice'
export { KeypairGeneration } from './KeypairGeneration'
export { SecretKeyBackup } from './SecretKeyBackup'
export { SecretKeyVerification } from './SecretKeyVerification'
export { WalletCreationSuccess } from './WalletCreationSuccess'
export { SecurityWarning, SecretKeyWarning, BackupReminderWarning, NeverShareWarning } from './SecurityWarning'

// Shared components
export { ProgressIndicator, ProgressBar } from './ProgressIndicator'
export { OnboardingFlow, OnboardingGate } from './OnboardingFlow'
