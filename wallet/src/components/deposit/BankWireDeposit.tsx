'use client'

import { useState } from 'react'

interface BankWireDepositProps {
  onBack: () => void
  onClose: () => void
}

// HSBC Bank details (would come from backend in production)
const HSBC_BANK_DETAILS = {
  bankName: 'HSBC Hong Kong',
  accountName: 'AU Gold Block Holdings Ltd',
  accountNumber: 'XXX-XXXXXX-XXX',
  swiftCode: 'HSBCHKHHHKH',
  bankAddress: '1 Queen\'s Road Central, Hong Kong',
  currency: 'USD',
}

export function BankWireDeposit({ onBack, onClose }: BankWireDepositProps) {
  const [amount, setAmount] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [step, setStep] = useState<'amount' | 'details' | 'confirm' | 'submitted'>('amount')
  const [hasCopied, setHasCopied] = useState<string | null>(null)

  // Generate unique reference ID
  const generateReferenceId = () => {
    const id = `AUG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    setReferenceId(id)
    return id
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(field)
      setTimeout(() => setHasCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

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
      type: 'bank-wire',
      amount: parseFloat(amount),
      referenceId,
      hasScreenshot: !!screenshot,
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Wire Transfer Submitted!</h1>
            <p className="text-gray-400 mb-6">
              Your bank wire deposit of <span className="text-blue-400 font-semibold">${amount}</span> has been submitted.
            </p>

            {/* Reference ID reminder */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-blue-300 text-sm mb-2">Your Reference ID:</p>
              <p className="font-mono text-blue-400 font-bold">{referenceId}</p>
              <p className="text-xs text-gray-500 mt-2">Include this in your wire transfer memo/reference field</p>
            </div>

            {/* Status card */}
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Status</span>
                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Awaiting Wire</span>
              </div>
              <p className="text-gray-500 text-sm">
                Once we receive your wire transfer (1-3 business days), an admin will verify and mint your GOLD tokens.
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
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Bank Wire to HSBC</h1>
          </div>

          {step === 'amount' && (
            <>
              {/* Amount input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum deposit: $1,000 USD</p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-6">
                {[1000, 5000, 10000, 50000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    ${val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Conversion preview */}
              {amount && parseFloat(amount) >= 1000 && (
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
                onClick={() => {
                  generateReferenceId()
                  setStep('details')
                }}
                disabled={!amount || parseFloat(amount) < 1000}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              {/* Reference ID */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <label className="block text-sm text-blue-300 mb-1">Your Reference ID</label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-blue-400 font-bold">{referenceId}</span>
                  <button
                    onClick={() => handleCopy(referenceId, 'ref')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {hasCopied === 'ref' ? '✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-blue-200/70 mt-1">Include this in your wire transfer memo</p>
              </div>

              {/* Bank details */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm text-gray-400 mb-3">HSBC Bank Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Bank Name', value: HSBC_BANK_DETAILS.bankName },
                    { label: 'Account Name', value: HSBC_BANK_DETAILS.accountName },
                    { label: 'Account Number', value: HSBC_BANK_DETAILS.accountNumber },
                    { label: 'SWIFT Code', value: HSBC_BANK_DETAILS.swiftCode },
                    { label: 'Bank Address', value: HSBC_BANK_DETAILS.bankAddress },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <p className="text-white text-sm">{item.value}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(item.value, item.label)}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        {hasCopied === item.label ? '✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount reminder */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount to wire:</span>
                  <span className="text-white font-semibold">${parseFloat(amount).toLocaleString()} USD</span>
                </div>
              </div>

              <button
                onClick={() => setStep('confirm')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-indigo-400 transition-all"
              >
                I've Initiated the Wire
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Screenshot upload (optional) */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Upload Wire Confirmation (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  {screenshot ? (
                    <div className="text-emerald-400">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm">{screenshot.name}</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm mb-2">Drop image or click to upload</p>
                      <p className="text-gray-500 text-xs">Screenshot of wire confirmation</p>
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

              {/* Summary */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm text-gray-400 mb-3">Deposit Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">${parseFloat(amount).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <span className="text-blue-400">{referenceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. GOLD:</span>
                    <span className="text-amber-400">{(parseFloat(amount) / 65).toFixed(4)} GOLD</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
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
