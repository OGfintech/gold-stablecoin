'use client'

import { useState } from 'react'

interface USDTDepositProps {
  onBack: () => void
  onClose: () => void
}

// USDT deposit wallet address (would come from backend in production)
const USDT_DEPOSIT_ADDRESS = 'TXkPz8BRKxzGLqGqGwVJZZhJDqBpX9NPFJ'

export function USDTDeposit({ onBack, onClose }: USDTDepositProps) {
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [step, setStep] = useState<'amount' | 'send' | 'confirm' | 'submitted'>('amount')
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(USDT_DEPOSIT_ADDRESS)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSubmit = () => {
    // In production, this would submit to the backend
    // For now, we'll just show a success state
    setStep('submitted')

    // Store pending deposit in localStorage
    const pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits') || '[]')
    pendingDeposits.push({
      id: Date.now(),
      type: 'usdt',
      amount: parseFloat(amount),
      txHash,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits))
  }

  // Submitted confirmation
  if (step === 'submitted') {
    return (
      <div className="fixed inset-0 bg-gray-900/95 flex flex-col z-50 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Deposit Submitted!</h1>
            <p className="text-gray-400 mb-8">
              Your USDT deposit of <span className="text-emerald-400 font-semibold">${amount}</span> has been submitted for verification.
            </p>

            {/* Status card */}
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Status</span>
                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Pending Verification</span>
              </div>
              <p className="text-gray-500 text-sm">
                An admin will verify your transaction and mint your GOLD tokens. This usually takes 1-24 hours.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
            >
              Back to Wallet
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex flex-col z-50 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold">USDT</span>
            </div>
            <h1 className="text-xl font-bold text-white">USDT Deposit</h1>
          </div>

          {step === 'amount' && (
            <>
              {/* Amount input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Amount (USDT)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-6">
                {[100, 500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Conversion preview */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">You'll receive approximately</span>
                    <span className="text-amber-400 font-bold">
                      {(parseFloat(amount) / 65).toFixed(4)} GOLD
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    *Based on current gold price of ~$65/gram. Final amount determined at minting.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep('send')}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </>
          )}

          {step === 'send' && (
            <>
              {/* Deposit address */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Send USDT (TRC-20) to this address:</label>
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-emerald-400 break-all mb-3">
                  {USDT_DEPOSIT_ADDRESS}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {hasCopied ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Address
                    </>
                  )}
                </button>
              </div>

              {/* Amount reminder */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount to send:</span>
                  <span className="text-white font-semibold">${amount} USDT</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                      <li>Only send USDT on TRC-20 network</li>
                      <li>Send exactly ${amount} USDT</li>
                      <li>Save your transaction hash</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('confirm')}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                I've Sent the USDT
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Transaction hash input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Transaction Hash (TxID)</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Enter your transaction hash..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">
                  You can find this in your wallet's transaction history after sending USDT.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm text-gray-400 mb-3">Deposit Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">${amount} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">TRC-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. GOLD:</span>
                    <span className="text-amber-400">{(parseFloat(amount) / 65).toFixed(4)} GOLD</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!txHash.trim()}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Submit Deposit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
