'use client'

import { useState } from 'react'
import { useOnboarding } from './OnboardingProvider'
import { ProgressIndicator } from './ProgressIndicator'

export function WalletCreationChoice() {
  const { nextStep, goToStep, skipOnboarding } = useOnboarding()
  const [showImport, setShowImport] = useState(false)
  const [importKey, setImportKey] = useState('')
  const [importError, setImportError] = useState('')

  const handleCreateNew = () => {
    nextStep() // Go to keypair-generation
  }

  const handleImport = () => {
    // Validate the secret key format (should be 64 hex characters)
    const cleanKey = importKey.trim()
    if (cleanKey.length !== 64 || !/^[a-fA-F0-9]+$/.test(cleanKey)) {
      setImportError('Invalid secret key format. Please enter a valid 64-character hex key.')
      return
    }

    // For import, skip generation and go directly to success
    // In a real implementation, this would derive the public key and address from the secret key
    // For now, we'll store the key and skip to wallet success
    try {
      // Store the imported wallet in localStorage
      const importedWallet = {
        address: cleanKey.substring(0, 64), // Simplified - in reality would derive from key
        publicKey: cleanKey, // Simplified
        secretKey: cleanKey,
      }
      localStorage.setItem('au_gold_wallet', JSON.stringify(importedWallet))
      goToStep('wallet-success')
    } catch (error) {
      setImportError('Failed to import wallet. Please check your secret key and try again.')
    }
  }

  if (showImport) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => setShowImport(false)}
            className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Import form */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Import Existing Wallet</h2>
            <p className="text-gray-400">
              Enter your secret key to restore your wallet. This key was provided when you first created your wallet.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-200 text-sm">
                Never share your secret key with anyone. AU Gold Block staff will never ask for your secret key.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Secret Key</label>
            <textarea
              value={importKey}
              onChange={(e) => {
                setImportKey(e.target.value)
                setImportError('')
              }}
              placeholder="Enter your 64-character secret key..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm resize-none h-24 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {importError && (
              <p className="text-red-400 text-sm mt-2">{importError}</p>
            )}
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={!importKey.trim()}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
      <div className="w-full max-w-md text-center">
        {/* Progress indicator */}
        <div className="mb-8">
          <ProgressIndicator phase={2} />
        </div>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Your Digital Gold Wallet
        </h1>
        <p className="text-gray-400 mb-10">
          Create a new wallet to start holding gold-backed tokens, or import an existing wallet to restore your assets.
        </p>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {/* Create New Wallet */}
          <button
            onClick={handleCreateNew}
            className="w-full p-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-500/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-white">Create New Wallet</h3>
                <p className="text-sm text-gray-400">Generate a secure new wallet address</p>
              </div>
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Import Existing */}
          <button
            onClick={() => setShowImport(true)}
            className="w-full p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-white">Import Existing Wallet</h3>
                <p className="text-sm text-gray-400">Restore using your secret key</p>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Skip option */}
        <button
          onClick={skipOnboarding}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
