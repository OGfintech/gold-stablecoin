'use client'

import { useState, useEffect, useMemo } from 'react'
import { useOnboarding } from './OnboardingProvider'
import { ProgressIndicator } from './ProgressIndicator'
import { SecurityWarning } from './SecurityWarning'

export function SecretKeyVerification() {
  const { state, nextStep, prevStep, setBackupVerified, setWalletCreated } = useOnboarding()
  const [userInput, setUserInput] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [showError, setShowError] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const secretKey = state.generatedKeypair?.secretKey || ''

  // Generate random verification challenge
  // Ask for specific character positions from the secret key
  const verificationChallenge = useMemo(() => {
    if (!secretKey) return { positions: [], expectedValue: '' }

    // Generate 3 random positions to verify
    const positions: number[] = []
    while (positions.length < 3) {
      const pos = Math.floor(Math.random() * secretKey.length) + 1 // 1-indexed for user friendliness
      if (!positions.includes(pos)) {
        positions.push(pos)
      }
    }
    positions.sort((a, b) => a - b)

    // Get expected characters at those positions
    const expectedValue = positions.map(p => secretKey[p - 1]).join('')

    return { positions, expectedValue }
  }, [secretKey])

  const handleVerify = () => {
    const cleanInput = userInput.trim().toLowerCase()
    const expected = verificationChallenge.expectedValue.toLowerCase()

    if (cleanInput === expected) {
      setIsVerified(true)
      setShowError(false)
      setBackupVerified(true)
      setWalletCreated(true)

      // Store wallet in localStorage (only address and publicKey, never the secretKey)
      if (state.generatedKeypair) {
        localStorage.setItem('au_gold_wallet', JSON.stringify({
          address: state.generatedKeypair.address,
          publicKey: state.generatedKeypair.publicKey,
        }))
      }

      // Auto-advance after celebration animation
      setTimeout(() => {
        nextStep()
      }, 1500)
    } else {
      setShowError(true)
      setAttempts(prev => prev + 1)
      setUserInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.length === 3) {
      handleVerify()
    }
  }

  // Handle showing hint after multiple failed attempts
  const showHint = attempts >= 3

  if (isVerified) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
        <div className="text-center">
          {/* Success animation */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Successful!</h1>
          <p className="text-gray-400">Your backup has been verified. Setting up your wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-6">
          <ProgressIndicator phase={2} />
        </div>

        {/* Back button */}
        <button
          onClick={prevStep}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Secret Key
        </button>

        {/* Title section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Verify Your Backup
          </h1>
          <p className="text-gray-400">
            Let's make sure you saved your secret key correctly
          </p>
        </div>

        {/* Verification challenge */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">
            Enter the characters at positions{' '}
            <span className="font-bold text-amber-400">
              {verificationChallenge.positions.join(', ')}
            </span>{' '}
            from your secret key:
          </p>

          {/* Visual guide */}
          <div className="bg-gray-900/50 rounded p-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">Example: If your key starts with "a1b2c3..."</p>
            <div className="flex gap-1 font-mono text-sm">
              {['a', '1', 'b', '2', 'c', '3', '.', '.', '.'].map((char, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-500">{i + 1}</span>
                  <span className="text-gray-400">{char}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input field */}
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value.slice(0, 3))
                setShowError(false)
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter 3 characters"
              maxLength={3}
              className={`w-full bg-gray-900 border-2 ${showError ? 'border-red-500' : 'border-gray-700 focus:border-amber-500'} rounded-lg p-4 text-center text-2xl font-mono tracking-widest text-amber-400 focus:ring-0 focus:outline-none transition-colors`}
              autoFocus
            />
            {showError && (
              <p className="text-red-400 text-sm mt-2 text-center">
                Incorrect characters. Please try again.
              </p>
            )}
          </div>

          {/* Hint after multiple attempts */}
          {showHint && (
            <SecurityWarning variant="info" className="mt-4">
              <p>
                Having trouble? Go back and reveal your secret key to find the characters at positions{' '}
                <strong>{verificationChallenge.positions.join(', ')}</strong>.
              </p>
            </SecurityWarning>
          )}
        </div>

        {/* Why we verify */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-sm">
              This verification ensures you've actually saved your secret key. Without it, you won't be able to recover your wallet or access your gold tokens.
            </p>
          </div>
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={userInput.length !== 3}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Verify Backup
        </button>

        {/* Skip verification (development only, could be removed in production) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => {
              setBackupVerified(true)
              setWalletCreated(true)
              if (state.generatedKeypair) {
                localStorage.setItem('au_gold_wallet', JSON.stringify({
                  address: state.generatedKeypair.address,
                  publicKey: state.generatedKeypair.publicKey,
                }))
              }
              nextStep()
            }}
            className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-400 transition-colors"
          >
            [DEV] Skip verification
          </button>
        )}
      </div>
    </div>
  )
}
