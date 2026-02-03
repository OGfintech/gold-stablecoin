'use client'

import { useState } from 'react'
import { useOnboarding } from './OnboardingProvider'
import { ProgressIndicator } from './ProgressIndicator'
import { SecretKeyWarning } from './SecurityWarning'

export function SecretKeyBackup() {
  const { state, nextStep, prevStep } = useOnboarding()
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [hasConfirmed, setHasConfirmed] = useState(false)

  const secretKey = state.generatedKeypair?.secretKey || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secretKey)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const backupData = {
      wallet: 'AU Gold Block',
      created: new Date().toISOString(),
      address: state.generatedKeypair?.address,
      publicKey: state.generatedKeypair?.publicKey,
      secretKey: state.generatedKeypair?.secretKey,
      warning: 'NEVER SHARE THIS FILE WITH ANYONE. This file contains your secret key which gives full access to your wallet.',
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `au-gold-wallet-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleContinue = () => {
    if (hasConfirmed) {
      nextStep()
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50 overflow-y-auto">
      <div className="w-full max-w-lg py-8">
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
          Back
        </button>

        {/* Title section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Save Your Secret Key
          </h1>
          <p className="text-gray-400">
            This is the only way to recover your wallet. Save it somewhere safe!
          </p>
        </div>

        {/* Critical warning */}
        <div className="mb-6">
          <SecretKeyWarning />
        </div>

        {/* Secret key display */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400">Your Secret Key</label>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1"
            >
              {isRevealed ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Hide
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Reveal
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className={`font-mono text-sm break-all bg-gray-900 rounded p-4 text-amber-400 ${!isRevealed ? 'blur-md select-none' : ''}`}>
              {secretKey}
            </div>
            {!isRevealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsRevealed(true)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Click to reveal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopy}
            disabled={!isRevealed}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {hasCopied ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!isRevealed}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Backup
          </button>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 transition-colors ${hasConfirmed ? 'bg-amber-500 border-amber-500' : 'border-gray-600 group-hover:border-gray-500'}`}>
              {hasConfirmed && (
                <svg className="w-full h-full text-gray-900 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-gray-300 text-sm">
            I have saved my secret key in a safe place. I understand that if I lose this key, I will permanently lose access to my wallet and all gold tokens.
          </span>
        </label>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!hasConfirmed}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-500 disabled:hover:to-yellow-500 transition-all"
        >
          {hasConfirmed ? 'Continue to Verification' : 'Please confirm you saved your key'}
        </button>
      </div>
    </div>
  )
}
