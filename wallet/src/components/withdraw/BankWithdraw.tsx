'use client'

import { useState } from 'react'

interface BankWithdrawProps {
  onBack: () => void
  onClose: () => void
  goldBalance: string
}

interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  routingNumber: string
  swiftCode: string
  bankAddress: string
}

export function BankWithdraw({ onBack, onClose, goldBalance }: BankWithdrawProps) {
  const [amount, setAmount] = useState('')
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    bankAddress: '',
  })
  const [step, setStep] = useState<'amount' | 'bank' | 'confirm' | 'submitted'>('amount')

  const maxGold = parseFloat(goldBalance) || 0
  const goldAmount = parseFloat(amount) || 0
  const percentageFee = goldAmount * 0.01 // 1% fee
  const wireFee = 25 / 65 // $25 wire fee in GOLD
  const totalFee = percentageFee + wireFee
  const netAmount = goldAmount - totalFee
  const usdAmount = netAmount * 65 // Convert to USD at $65/gram

  const handleMax = () => {
    setAmount(maxGold.toString())
  }

  const updateBankDetails = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return bankDetails.bankName &&
           bankDetails.accountName &&
           bankDetails.accountNumber &&
           (bankDetails.routingNumber || bankDetails.swiftCode)
  }

  const handleSubmit = () => {
    setStep('submitted')

    // Store pending withdrawal in localStorage
    const pendingWithdrawals = JSON.parse(localStorage.getItem('pending_withdrawals') || '[]')
    pendingWithdrawals.push({
      id: Date.now(),
      type: 'bank',
      goldAmount: goldAmount,
      usdAmount: usdAmount,
      fee: totalFee,
      bankDetails,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals))
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

            <h1 className="text-2xl font-bold text-white mb-2">Withdrawal Submitted!</h1>
            <p className="text-gray-400 mb-6">
              Your bank withdrawal of <span className="text-blue-400 font-semibold">${usdAmount.toFixed(2)} USD</span> has been submitted.
            </p>

            {/* Details */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">GOLD Amount:</span>
                  <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee (1% + $25):</span>
                  <span className="text-red-400">-{totalFee.toFixed(4)} GOLD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">You'll receive:</span>
                  <span className="text-blue-400 font-semibold">${usdAmount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Bank:</span>
                  <span className="text-white">{bankDetails.bankName}</span>
                </div>
              </div>
            </div>

            {/* Status card */}
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Status</span>
                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Processing</span>
              </div>
              <p className="text-gray-500 text-sm">
                Your bank wire will be initiated within 1-2 business days. Funds typically arrive within 3-5 business days.
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
            <h1 className="text-xl font-bold text-white">Bank Wire Withdrawal</h1>
          </div>

          {step === 'amount' && (
            <>
              {/* Amount input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Amount (GOLD)</label>
                  <button
                    onClick={handleMax}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Max: {maxGold.toFixed(4)}
                  </button>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0000"
                  max={maxGold}
                  step="0.0001"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">Minimum withdrawal: 1 GOLD (~$65)</p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-6">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setAmount((maxGold * pct).toFixed(4))}
                    className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>

              {/* Conversion preview */}
              {goldAmount > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">You're withdrawing:</span>
                      <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fee (1%):</span>
                      <span className="text-red-400">-{percentageFee.toFixed(4)} GOLD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wire fee ($25):</span>
                      <span className="text-red-400">-{wireFee.toFixed(4)} GOLD</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">You'll receive:</span>
                      <span className="text-blue-400 font-bold">${usdAmount.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('bank')}
                disabled={!amount || goldAmount < 1 || goldAmount > maxGold}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </>
          )}

          {step === 'bank' && (
            <>
              {/* Bank details form */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => updateBankDetails('bankName', e.target.value)}
                    placeholder="e.g., Chase Bank, Bank of America"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankDetails.accountName}
                    onChange={(e) => updateBankDetails('accountName', e.target.value)}
                    placeholder="Full name as on bank account"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Account Number *</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                    placeholder="Your bank account number"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Routing # (US)</label>
                    <input
                      type="text"
                      value={bankDetails.routingNumber}
                      onChange={(e) => updateBankDetails('routingNumber', e.target.value)}
                      placeholder="9 digits"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">SWIFT (Int'l)</label>
                    <input
                      type="text"
                      value={bankDetails.swiftCode}
                      onChange={(e) => updateBankDetails('swiftCode', e.target.value)}
                      placeholder="SWIFT/BIC"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-2">Bank Address (Optional)</label>
                  <input
                    type="text"
                    value={bankDetails.bankAddress}
                    onChange={(e) => updateBankDetails('bankAddress', e.target.value)}
                    placeholder="Bank branch address"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!isFormValid()}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Review Withdrawal
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Summary */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm text-gray-400 mb-3">Withdrawal Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total fees:</span>
                    <span className="text-red-400">-{totalFee.toFixed(4)} GOLD</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700">
                    <span className="text-gray-400">You'll receive:</span>
                    <span className="text-blue-400 font-bold text-lg">${usdAmount.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {/* Bank details summary */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <span className="text-xs text-gray-500">Sending to:</span>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-white font-semibold">{bankDetails.accountName}</p>
                  <p className="text-gray-400">{bankDetails.bankName}</p>
                  <p className="text-gray-400">Account: ****{bankDetails.accountNumber.slice(-4)}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-200">
                    Please verify your bank details are correct. Incorrect information may delay your withdrawal.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                Confirm Withdrawal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
