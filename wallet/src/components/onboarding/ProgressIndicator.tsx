'use client'

import { useOnboardingProgress } from './OnboardingProvider'

interface ProgressIndicatorProps {
  totalDots?: number
  phase?: 1 | 2
}

export function ProgressIndicator({ totalDots, phase }: ProgressIndicatorProps) {
  const {
    currentIndex,
    isPhase1,
    isPhase2,
    currentPhase1Step,
    currentPhase2Step,
    phase1Steps,
    phase2Steps,
  } = useOnboardingProgress()

  // Determine which phase we're showing
  const showPhase = phase || (isPhase1 ? 1 : isPhase2 ? 2 : 1)

  // Get the appropriate values based on phase
  const currentStep = showPhase === 1 ? currentPhase1Step : currentPhase2Step
  const totalSteps = totalDots || (showPhase === 1 ? phase1Steps : phase2Steps)
  const isCurrentPhase = showPhase === 1 ? isPhase1 : isPhase2
  const isPastPhase = showPhase === 1 ? isPhase2 : false

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Phase label */}
      <div className="text-xs text-gray-500">
        Phase {showPhase}: {showPhase === 1 ? 'Introduction' : 'Wallet Setup'}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isActive = isCurrentPhase && stepNumber === currentStep
          const isCompleted = isPastPhase || (isCurrentPhase && stepNumber < currentStep)

          return (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-300 ease-out
                ${isActive
                  ? 'w-8 bg-gradient-to-r from-amber-400 to-yellow-500'
                  : isCompleted
                    ? 'w-2 bg-amber-500/60'
                    : 'w-2 bg-gray-600'
                }
              `}
            />
          )
        })}
      </div>
    </div>
  )
}

export function ProgressBar() {
  const { progress } = useOnboardingProgress()

  return (
    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
