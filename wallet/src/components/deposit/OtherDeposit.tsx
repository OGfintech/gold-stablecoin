'use client'

import { useState } from 'react'

interface OtherDepositProps {
  onBack: () => void
  onClose: () => void
}

type DepositMethod = 'cash' | 'check' | 'other'

export function OtherDeposit({ onBack, onClose }: OtherDepositProps) {
  const [method, setMethod] = useState<DepositMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [step, setStep] = useState<'method' | 'details' | 'submitted'>('method')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    setStep('submitted')

    // Store pending deposit in localStorage
    const pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits') || '[]')
    pendingDeposits.push({
      id: Date.now(),
      type: 'other',
      method,
      amount: parseFloat(amount),
      description,
      hasScreenshot: !!screenshot,
      status: 'pending_review',
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
            <p className="text-gray-400 mb-8">
              Your deposit request for <span className="text-purple-400 font-semibold">${amount}</span> has been submitted for admin review.
            </p>

            {/* Status card */}
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Status</span>
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">Pending Review</span>
              </div>
              <p className="text-gray-500 text-sm">
                An admin will review your deposit request and contact you if additional information is needed. This typically takes 1-2 business days.
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
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Other Deposit Methods</h1>
          </div>

          {step === 'method' && (
            <>
              <p className="text-gray-400 text-center mb-6">
                Select your deposit method. These require manual admin verification.
              </p>

              {/* Method options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setMethod('cash')
                    setStep('details')
                  }}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-800/80 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-lg">💵</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Cash Deposit</h3>
                      <p className="text-sm text-gray-400">In-person cash deposit at authorized location</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMethod('check')
                    setStep('details')
                  }}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-800/80 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-lg">📄</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Check / Money Order</h3>
                      <p className="text-sm text-gray-400">Bank check or money order deposit</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMethod('other')
                    setStep('details')
                  }}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-800/80 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-lg">🔄</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Other Method</h3>
                      <p className="text-sm text-gray-400">Admin-authorized alternative deposit</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-purple-200">
                    All alternative deposit methods require admin verification. Please provide clear documentation to expedite processing.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              {/* Amount input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Deposit Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white text-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    method === 'cash'
                      ? 'Location, date, and details of cash deposit...'
                      : method === 'check'
                      ? 'Check number, bank name, date...'
                      : 'Describe your deposit method and any relevant details...'
                  }
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Screenshot upload */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Upload Proof / Receipt
                </label>
                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  {screenshot ? (
                    <div className="text-emerald-400">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm">{screenshot.name}</p>
                      <button
                        onClick={() => setScreenshot(null)}
                        className="text-xs text-gray-400 hover:text-white mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm mb-1">Upload receipt or proof</p>
                      <p className="text-gray-500 text-xs">Photo of receipt, confirmation, etc.</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
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
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Submit for Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
