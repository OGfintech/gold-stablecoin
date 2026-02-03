'use client'

import { useState } from 'react'
import { USDTWithdraw } from './USDTWithdraw'
import { BankWithdraw } from './BankWithdraw'

type WithdrawType = 'select' | 'usdt' | 'bank'

interface WithdrawFlowProps {
  onClose: () => void
  goldBalance: string
}

export function WithdrawFlow({ onClose, goldBalance }: WithdrawFlowProps) {
  const [withdrawType, setWithdrawType] = useState<WithdrawType>('select')

  const handleBack = () => {
    if (withdrawType === 'select') {
      onClose()
    } else {
      setWithdrawType('select')
    }
  }

  // Render selected withdraw type
  if (withdrawType === 'usdt') {
    return <USDTWithdraw onBack={handleBack} onClose={onClose} goldBalance={goldBalance} />
  }

  if (withdrawType === 'bank') {
    return <BankWithdraw onBack={handleBack} onClose={onClose} goldBalance={goldBalance} />
  }

  // Withdraw type selection screen
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Withdraw / Liquidate
            </h1>
            <p className="text-gray-400">
              Convert your GOLD tokens to USDT or withdraw to your bank account
            </p>
          </div>

          {/* Current Balance */}
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Available Balance</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-amber-400">{parseFloat(goldBalance).toFixed(4)}</span>
                <span className="text-amber-400 ml-1">GOLD</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              ≈ ${(parseFloat(goldBalance) * 65).toFixed(2)} USD
            </div>
          </div>

          {/* Withdraw Options */}
          <div className="space-y-4">
            {/* USDT Option */}
            <button
              onClick={() => setWithdrawType('usdt')}
              className="w-full p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-sm">USDT</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Convert to USDT</h3>
                  <p className="text-sm text-gray-400">Receive USDT to your crypto wallet</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Fast</span>
                </div>
              </div>
            </button>

            {/* Bank Wire Option */}
            <button
              onClick={() => setWithdrawType('bank')}
              className="w-full p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Bank Wire Transfer</h3>
                  <p className="text-sm text-gray-400">Withdraw USD to your bank account</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">3-5 Days</span>
                </div>
              </div>
            </button>
          </div>

          {/* Info box */}
          <div className="mt-8 bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-400">
                <p className="mb-2">
                  <strong className="text-gray-300">Withdrawal fees apply</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>USDT: 0.5% conversion fee</li>
                  <li>Bank wire: 1% fee + $25 wire fee</li>
                  <li>Minimum withdrawal: 0.1 GOLD</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
