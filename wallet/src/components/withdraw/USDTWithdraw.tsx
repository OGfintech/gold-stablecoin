'use client'

import { useState } from 'react'

interface USDTWithdrawProps {
  onBack: () => void
  onClose: () => void
  goldBalance: string
}

export function USDTWithdraw({ onBack, onClose, goldBalance }: USDTWithdrawProps) {
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [network, setNetwork] = useState<'trc20' | 'erc20' | 'bep20'>('trc20')
  const [step, setStep] = useState<'amount' | 'address' | 'confirm' | 'submitted'>('amount')

  const maxGold = parseFloat(goldBalance) || 0
  const goldAmount = parseFloat(amount) || 0
  const fee = goldAmount * 0.005 // 0.5% fee
  const netAmount = goldAmount - fee
  const usdtAmount = netAmount * 65 // Convert to USDT at $65/gram

  const handleMax = () => {
    setAmount(maxGold.toString())
  }

  const handleSubmit = () => {
    setStep('submitted')

    // Store pending withdrawal in localStorage
    const pendingWithdrawals = JSON.parse(localStorage.getItem('pending_withdrawals') || '[]')
    pendingWithdrawals.push({
      id: Date.now(),
      type: 'usdt',
      goldAmount: goldAmount,
      usdtAmount: usdtAmount,
      fee: fee,
      walletAddress,
      network,
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Withdrawal Submitted!</h1>
            <p className="text-gray-400 mb-6">
              Your withdrawal of <span className="text-emerald-400 font-semibold">{usdtAmount.toFixed(2)} USDT</span> has been submitted.
            </p>

            {/* Details */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">GOLD Amount:</span>
                  <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee (0.5%):</span>
                  <span className="text-red-400">-{fee.toFixed(4)} GOLD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">You'll receive:</span>
                  <span className="text-emerald-400 font-semibold">{usdtAmount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">{network.toUpperCase()}</span>
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
                Your USDT will be sent within 1-24 hours after admin verification.
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
            <h1 className="text-xl font-bold text-white">Convert to USDT</h1>
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
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
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">You're converting:</span>
                      <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fee (0.5%):</span>
                      <span className="text-red-400">-{fee.toFixed(4)} GOLD</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">You'll receive:</span>
                      <span className="text-emerald-400 font-bold">{usdtAmount.toFixed(2)} USDT</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('address')}
                disabled={!amount || goldAmount <= 0 || goldAmount > maxGold}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            </>
          )}

          {step === 'address' && (
            <>
              {/* Network selection */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm text-gray-400 mb-3">Select Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'trc20', label: 'TRC-20', chain: 'Tron' },
                    { id: 'erc20', label: 'ERC-20', chain: 'Ethereum' },
                    { id: 'bep20', label: 'BEP-20', chain: 'BSC' },
                  ].map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNetwork(n.id as typeof network)}
                      className={`p-3 rounded-lg border transition-colors ${
                        network === n.id
                          ? 'border-emerald-500 bg-emerald-500/20 text-white'
                          : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="block font-semibold text-sm">{n.label}</span>
                      <span className="block text-xs opacity-70">{n.chain}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet address input */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <label className="block text-sm text-gray-400 mb-2">Your USDT Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={`Enter your ${network.toUpperCase()} address...`}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Make sure this is a valid {network.toUpperCase()} address that can receive USDT.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Double-check your address!</p>
                    <p className="text-amber-200/80">
                      Sending to the wrong address or wrong network will result in permanent loss of funds.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!walletAddress.trim() || walletAddress.length < 20}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">{goldAmount.toFixed(4)} GOLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fee (0.5%):</span>
                    <span className="text-red-400">-{fee.toFixed(4)} GOLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">{network.toUpperCase()}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">You'll receive:</span>
                      <span className="text-emerald-400 font-bold text-lg">{usdtAmount.toFixed(2)} USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination address */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <span className="text-xs text-gray-500">Sending to:</span>
                <p className="font-mono text-sm text-emerald-400 break-all mt-1">{walletAddress}</p>
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
