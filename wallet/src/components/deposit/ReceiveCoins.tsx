'use client'

import { useState, useEffect } from 'react'

interface ReceiveCoinsProps {
  walletAddress: string
  onClose: () => void
}

export function ReceiveCoins({ walletAddress, onClose }: ReceiveCoinsProps) {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Generate simple QR code placeholder (in production, use a QR library)
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : ''

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex flex-col z-50 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Receive GOLD Tokens
            </h1>
            <p className="text-gray-400">
              Share your wallet address to receive gold-backed tokens
            </p>
          </div>

          {/* QR Code placeholder */}
          <div className="bg-white rounded-2xl p-6 mb-6 mx-auto max-w-[200px]">
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {/* Simple QR placeholder - in production use react-qr-code or similar */}
              <div className="grid grid-cols-5 gap-1 p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${
                      Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Wallet address */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <label className="block text-sm text-gray-400 mb-2">Your Wallet Address</label>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-amber-400 break-all mb-3">
              {walletAddress}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center justify-center gap-2"
            >
              {hasCopied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Address
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-200">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                  <li>Only send GOLD tokens to this address</li>
                  <li>Sending other tokens may result in loss</li>
                  <li>Transactions are irreversible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
