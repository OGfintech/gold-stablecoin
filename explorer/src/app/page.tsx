'use client'

import { useQuery } from '@tanstack/react-query'
import { api, formatTokenAmount, shortenHash, formatDate } from '@/lib/api'
import { Activity, Blocks, ArrowRightLeft, FileText, Gauge, Database } from 'lucide-react'
import Link from 'next/link'

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-gray-700`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: api.getMetrics,
    refetchInterval: 2000,
  })

  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(5),
    refetchInterval: 5000,
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.getTransactions(5),
    refetchInterval: 5000,
  })

  const { data: certData } = useQuery({
    queryKey: ['certificates'],
    queryFn: api.getCertificates,
    refetchInterval: 10000,
  })

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2 text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm">Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current TPS"
          value={metrics?.current_tps.toFixed(1) || '0'}
          subtitle="Transactions per second"
          icon={Gauge}
          color="text-yellow-500"
        />
        <StatCard
          title="Block Height"
          value={metrics?.blocks_produced || 0}
          subtitle="Total blocks"
          icon={Blocks}
          color="text-blue-500"
        />
        <StatCard
          title="Total Transactions"
          value={metrics?.total_transactions.toLocaleString() || '0'}
          subtitle="All time"
          icon={ArrowRightLeft}
          color="text-green-500"
        />
        <StatCard
          title="Total Supply"
          value={metrics?.total_supply_formatted || '0'}
          subtitle="Gold-backed tokens"
          icon={Database}
          color="text-purple-500"
        />
      </div>

      {/* Certificate Stats */}
      {certData && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-700/30 rounded-xl p-6 border border-yellow-600/30">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            Gold Certificate Backing
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Certificates</p>
              <p className="text-2xl font-bold text-yellow-500">{certData.stats.total_certificates}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Certificates</p>
              <p className="text-2xl font-bold text-green-500">{certData.stats.active_certificates}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Gold (oz)</p>
              <p className="text-2xl font-bold text-yellow-500">{certData.stats.total_gold_oz.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Gold (grams)</p>
              <p className="text-2xl font-bold text-yellow-500">{(certData.stats.total_gold_oz * 31.1035).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Blocks */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Blocks className="w-5 h-5 text-blue-500" />
              Recent Blocks
            </h2>
            <Link href="/blocks" className="text-blue-400 text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {blocksLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : blocksData?.blocks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No blocks yet</div>
            ) : (
              blocksData?.blocks.map((block) => (
                <Link
                  key={block.height}
                  href={`/blocks?height=${block.height}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
                        #{block.height}
                      </span>
                      <span className="text-gray-400 text-sm">{shortenHash(block.hash)}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{formatDate(block.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{block.tx_count} txns</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-green-500" />
              Recent Transactions
            </h2>
            <Link href="/transactions" className="text-green-400 text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {txLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : txData?.transactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No transactions yet</div>
            ) : (
              txData?.transactions.map((tx) => (
                <Link
                  key={tx.hash}
                  href={`/transactions?hash=${tx.hash}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        tx.tx_type === 'Transfer' ? 'bg-green-500/20 text-green-400' :
                        tx.tx_type === 'Mint' ? 'bg-yellow-500/20 text-yellow-400' :
                        tx.tx_type === 'Burn' ? 'bg-red-500/20 text-red-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {tx.tx_type}
                      </span>
                      <span className="text-gray-400 text-sm">{shortenHash(tx.hash)}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      From: {shortenHash(tx.from, 6)}
                    </p>
                  </div>
                  <div className="text-right">
                    {tx.amount && <p className="text-white">{formatTokenAmount(tx.amount)}</p>}
                    {tx.success !== undefined && (
                      <span className={`text-sm ${tx.success ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.success ? 'Success' : 'Failed'}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
