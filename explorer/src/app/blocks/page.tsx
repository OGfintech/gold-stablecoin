'use client'

import { useQuery } from '@tanstack/react-query'
import { api, shortenHash, formatDate } from '@/lib/api'
import { Blocks, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function BlocksPage() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['blocks', page],
    queryFn: () => api.getBlocks(limit, page * limit),
    refetchInterval: 5000,
  })

  const totalPages = Math.ceil((data?.total || 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Blocks className="w-8 h-8 text-blue-500" />
          Blocks
        </h1>
        <p className="text-gray-400">
          Total: {data?.total.toLocaleString() || 0} blocks
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Height</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Hash</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Transactions</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Timestamp</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Producer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data?.blocks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No blocks yet
                </td>
              </tr>
            ) : (
              data?.blocks.map((block) => (
                <tr key={block.height} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-mono">
                      #{block.height}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {shortenHash(block.hash, 12)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${block.tx_count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      {block.tx_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {formatDate(block.timestamp)}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">
                    {shortenHash(block.producer, 8)}
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
