'use client'

import { useState } from 'react'
import { USDTDeposit } from './USDTDeposit'
import { BankWireDeposit } from './BankWireDeposit'
import { OtherDeposit } from './OtherDeposit'

type DepositType = 'select' | 'usdt' | 'bank-wire' | 'other'

interface DepositFlowProps {
  onClose: () => void
}

export function DepositFlow({ onClose }: DepositFlowProps) {
  const [depositType, setDepositType] = useState<DepositType>('select')

  const handleBack = () => {
    if (depositType === 'select') {
      onClose()
    } else {
      setDepositType('select')
    }
  }

  // Render selected deposit type
  if (depositType === 'usdt') {
    return <USDTDeposit onBack={handleBack} onClose={onClose} />
  }

  if (depositType === 'bank-wire') {
    return <BankWireDeposit onBack={handleBack} onClose={onClose} />
  }

  if (depositType === 'other') {
    return <OtherDeposit onBack={handleBack} onClose={onClose} />
  }

  // Deposit type selection screen
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Deposit to Mint GOLD
            </h1>
            <p className="text-gray-400">
              Choose how you'd like to deposit funds to mint gold-backed tokens
            </p>
          </div>

          {/* Deposit Options */}
          <div className="space-y-4">
            {/* USDT Option */}
            <button
              onClick={() => setDepositType('usdt')}
              className="w-full p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-sm">USDT</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">USDT Transfer</h3>
                  <p className="text-sm text-gray-400">Send USDT to our wallet address</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Instant</span>
                </div>
              </div>
            </button>

            {/* Bank Wire Option */}
            <button
              onClick={() => setDepositType('bank-wire')}
              className="w-full p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Bank Wire to HSBC</h3>
                  <p className="text-sm text-gray-400">Wire transfer to our HSBC custody account</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">1-3 Days</span>
                </div>
              </div>
            </button>

            {/* Other/Cash Option */}
            <button
              onClick={() => setDepositType('other')}
              className="w-full p-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Other / Cash Deposit</h3>
                  <p className="text-sm text-gray-400">Cash deposit or admin-authorized transfer</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">Manual</span>
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
                  <strong className="text-gray-300">1 GOLD = 1 gram of physical gold</strong>
                </p>
                <p>
                  Your deposit will be converted to GOLD tokens at the current market rate after admin verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
