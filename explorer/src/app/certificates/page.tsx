'use client'

import { useQuery } from '@tanstack/react-query'
import { api, shortenHash, formatDate, formatTokenAmount } from '@/lib/api'
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: api.getCertificates,
    refetchInterval: 10000,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'FullyMinted': return <Clock className="w-5 h-5 text-yellow-400" />
      case 'Redeemed': return <XCircle className="w-5 h-5 text-red-400" />
      case 'Suspended': return <AlertCircle className="w-5 h-5 text-orange-400" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'FullyMinted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Redeemed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Suspended': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-yellow-500" />
          Gold Certificates
        </h1>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Certificates</p>
            <p className="text-2xl font-bold text-white mt-1">{data.stats.total_certificates}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Active Certificates</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{data.stats.active_certificates}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Gold (oz)</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{data.stats.total_gold_oz.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Minted</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{formatTokenAmount(data.stats.total_minted)}</p>
          </div>
        </div>
      )}

      {/* Certificates List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : data?.certificates.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            No certificates registered yet
          </div>
        ) : (
          data?.certificates.map((cert) => (
            <div
              key={cert.certificate_id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        <span className="ml-2">{cert.status}</span>
                      </span>
                      <span className="text-gray-400 font-mono text-sm">
                        {shortenHash(cert.certificate_id, 10)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{cert.hsbc_reference}</h3>
                    <p className="text-gray-400 mt-1">{cert.hsbc_branch}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-500">{cert.gold_amount_oz.toFixed(2)} oz</p>
                    <p className="text-gray-400">{cert.gold_amount_grams.toFixed(2)} grams</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Issue Date</p>
                    <p className="text-white">{formatDate(cert.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Registered At</p>
                    <p className="text-white">{formatDate(cert.registered_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Minted / Max</p>
                    <p className="text-white">
                      {formatTokenAmount(cert.minted_amount)} / {formatTokenAmount(cert.max_mintable)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Remaining</p>
                    <p className="text-green-400">{formatTokenAmount(cert.remaining_mintable)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Minting Progress</span>
                    <span className="text-gray-400">
                      {((BigInt(cert.minted_amount) * BigInt(100)) / BigInt(cert.max_mintable || 1)).toString()}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                      style={{
                        width: `${(BigInt(cert.minted_amount) * BigInt(100)) / BigInt(cert.max_mintable || 1)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
