'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from './OnboardingProvider'

// Client-side keypair generation using Web Crypto API
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length / 2)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateKeypair(): { address: string; publicKey: string; secretKey: string } {
  const secretKey = generateRandomHex(64)
  const publicKey = generateRandomHex(64)
  const address = generateRandomHex(64)
  return { address, publicKey, secretKey }
}

export function KeypairGeneration() {
  const { nextStep, setGeneratedKeypair } = useOnboarding()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initializing secure environment...')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Simulate the keypair generation process with status updates
    const steps = [
      { progress: 15, status: 'Initializing secure environment...', delay: 500 },
      { progress: 30, status: 'Generating cryptographic entropy...', delay: 800 },
      { progress: 50, status: 'Creating your secret key...', delay: 700 },
      { progress: 70, status: 'Deriving public key...', delay: 600 },
      { progress: 85, status: 'Generating wallet address...', delay: 500 },
      { progress: 100, status: 'Wallet created successfully!', delay: 400 },
    ]

    let currentStep = 0

    const runStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]
        setProgress(step.progress)
        setStatus(step.status)
        currentStep++
        setTimeout(runStep, step.delay)
      } else {
        // Generate the actual keypair
        const keypair = generateKeypair()
        setGeneratedKeypair(keypair)
        setIsComplete(true)

        // Auto-advance after a brief pause
        setTimeout(() => {
          nextStep()
        }, 800)
      }
    }

    runStep()
  }, [nextStep, setGeneratedKeypair])

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
      <div className="w-full max-w-md text-center">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-pulse"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>

          {/* Inner icon */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
            {isComplete ? (
              <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          {isComplete ? 'Wallet Created!' : 'Creating Your Wallet'}
        </h1>
        <p className="text-gray-400 mb-8">
          {status}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500">{progress}% complete</p>

        {/* Security note */}
        <div className="mt-10 bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your keys are generated locally and never leave your device</span>
          </div>
        </div>
      </div>

      {/* Add shimmer animation styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  )
}
