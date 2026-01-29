'use client'

import { useQuery } from '@tanstack/react-query'
import { useWallet } from '../providers'
import { walletApi, formatTokenAmount, shortenAddress, formatDate } from '@/lib/api'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Coins, FileText, AlertCircle, Flame } from 'lucide-react'
import Link from 'next/link'

export default function HistoryPage() {
  const { wallet } = useWallet()

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-transactions', wallet.address],
    queryFn: () => walletApi.getTransactions(wallet.address!),
    enabled: !!wallet.address,
    refetchInterval: 10000,
  })

  if (!wallet.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <p className="text-gray-400">Please create or import a wallet first</p>
        <Link href="/" className="text-yellow-500 hover:underline mt-2">
          Go to Wallet
        </Link>
      </div>
    )
  }

  const getTransactionIcon = (tx: any) => {
    if (tx.tx_type === 'Mint') {
      return <Coins className="w-5 h-5 text-yellow-400" />
    }
    if (tx.tx_type === 'Burn') {
      return <Flame className="w-5 h-5 text-red-400" />
    }
    if (tx.tx_type === 'RegisterCertificate') {
      return <FileText className="w-5 h-5 text-purple-400" />
    }
    // Transfer
    if (tx.from.toLowerCase() === wallet.address?.toLowerCase()) {
      return <ArrowUpRight className="w-5 h-5 text-red-400" />
    }
    return <ArrowDownLeft className="w-5 h-5 text-green-400" />
  }

  const getTransactionLabel = (tx: any) => {
    if (tx.tx_type === 'Mint') return 'Minted'
    if (tx.tx_type === 'Burn') return 'Burned'
    if (tx.tx_type === 'RegisterCertificate') return 'Certificate'

    if (tx.from.toLowerCase() === wallet.address?.toLowerCase()) {
      return 'Sent'
    }
    return 'Received'
  }

  const getAmountColor = (tx: any) => {
    if (tx.tx_type === 'Burn') return 'text-red-400'
    if (tx.from.toLowerCase() === wallet.address?.toLowerCase()) {
      return 'text-red-400'
    }
    return 'text-green-400'
  }

  const getAmountPrefix = (tx: any) => {
    if (tx.tx_type === 'Burn') return '-'
    if (tx.from.toLowerCase() === wallet.address?.toLowerCase()) {
      return '-'
    }
    return '+'
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Transaction History</h1>
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          {data?.total || 0} transactions
        </p>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : data?.transactions.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Send or receive tokens to see your history</p>
          </div>
        ) : (
          data?.transactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-gray-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  {getTransactionIcon(tx)}
                </div>
                <div>
                  <p className="font-medium">{getTransactionLabel(tx)}</p>
                  <p className="text-gray-500 text-sm">
                    {tx.tx_type === 'Transfer' && tx.to && (
                      <>
                        {tx.from.toLowerCase() === wallet.address?.toLowerCase()
                          ? `To: ${shortenAddress(tx.to)}`
                          : `From: ${shortenAddress(tx.from)}`
                        }
                      </>
                    )}
                    {tx.tx_type === 'Mint' && tx.to && `To: ${shortenAddress(tx.to)}`}
                    {tx.tx_type === 'Burn' && `From: ${shortenAddress(tx.from)}`}
                    {tx.tx_type === 'RegisterCertificate' && 'Certificate registered'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {formatDate(tx.timestamp)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {tx.amount && (
                  <p className={`font-semibold ${getAmountColor(tx)}`}>
                    {getAmountPrefix(tx)}{formatTokenAmount(tx.amount)}
                  </p>
                )}
                <p className={`text-xs mt-1 ${
                  tx.success === undefined ? 'text-yellow-400' :
                  tx.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tx.success === undefined ? 'Pending' :
                   tx.success ? 'Confirmed' : 'Failed'}
                </p>
                {tx.block_height !== undefined && (
                  <p className="text-gray-600 text-xs">
                    Block #{tx.block_height}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
