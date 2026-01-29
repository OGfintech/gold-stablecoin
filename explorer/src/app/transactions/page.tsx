'use client'

import { useQuery } from '@tanstack/react-query'
import { api, shortenHash, formatDate, formatTokenAmount } from '@/lib/api'
import { ArrowRightLeft, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function TransactionsPage() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.getTransactions(limit, page * limit),
    refetchInterval: 5000,
  })

  const totalPages = Math.ceil((data?.total || 0) / limit)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Transfer': return 'bg-green-500/20 text-green-400'
      case 'Mint': return 'bg-yellow-500/20 text-yellow-400'
      case 'Burn': return 'bg-red-500/20 text-red-400'
      case 'RegisterCertificate': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-green-500" />
          Transactions
        </h1>
        <p className="text-gray-400">
          Total: {data?.total.toLocaleString() || 0} transactions
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Hash</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Type</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">From / To</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Amount</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Block</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data?.transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No transactions yet
                </td>
              </tr>
            ) : (
              data?.transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {shortenHash(tx.hash, 10)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm ${getTypeColor(tx.tx_type)}`}>
                      {tx.tx_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-gray-400">{shortenHash(tx.from, 6)}</span>
                      {tx.to && (
                        <>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">{shortenHash(tx.to, 6)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {tx.amount ? (
                      <span className="text-white font-medium">
                        {formatTokenAmount(tx.amount)}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {tx.block_height !== undefined ? (
                      <span className="text-blue-400">#{tx.block_height}</span>
                    ) : (
                      <span className="text-yellow-400">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {tx.success === undefined ? (
                      <span className="text-yellow-400">Pending</span>
                    ) : tx.success ? (
                      <span className="text-green-400">Success</span>
                    ) : (
                      <span className="text-red-400">Failed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-t border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
