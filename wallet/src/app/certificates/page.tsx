'use client'

import { useQuery } from '@tanstack/react-query'
import { useWallet } from '../providers'
import { walletApi, formatDate, GOLD_PRICE_PER_GRAM, GOLD_PRICE_PER_OZ } from '@/lib/api'
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CertificatesPage() {
  const { wallet } = useWallet()

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-certificates', wallet.address],
    queryFn: () => walletApi.getCertificates(wallet.address!),
    enabled: !!wallet.address,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'FullyMinted': return <Clock className="w-4 h-4 text-yellow-400" />
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Gold Certificates</h1>
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Certificates backing your gold tokens
        </p>
      </div>

      {/* Summary Card */}
      {data && (
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl p-6 border border-yellow-600/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Gold (oz)</p>
              <p className="text-2xl font-bold text-yellow-500">
                {data.total_gold_oz.toFixed(2)}
              </p>
              <p className="text-gray-500 text-sm">
                ≈ ${(data.total_gold_oz * GOLD_PRICE_PER_OZ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Gold (grams)</p>
              <p className="text-2xl font-bold text-yellow-500">
                {data.total_gold_grams.toFixed(2)}
              </p>
              <p className="text-gray-500 text-sm">
                ≈ ${(data.total_gold_grams * GOLD_PRICE_PER_GRAM).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">HSBC Gold Certificates</p>
            <p className="text-gray-400 text-sm mt-1">
              Each token is backed 1:1 by physical gold stored in HSBC vaults.
              Certificates can be verified through HSBC's official channels.
            </p>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            Loading certificates...
          </div>
        ) : data?.certificates.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
            No certificates backing your tokens yet
          </div>
        ) : (
          data?.certificates.map((cert) => (
            <div
              key={cert.certificate_id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(cert.status)}
                    <span className="text-sm text-gray-400">{cert.status}</span>
                  </div>
                  <h3 className="font-semibold mt-1">{cert.hsbc_reference}</h3>
                  <p className="text-gray-500 text-sm">{cert.hsbc_branch}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-yellow-500">
                    {cert.gold_amount_oz.toFixed(2)} oz
                  </p>
                  <p className="text-gray-400 text-sm">
                    {cert.gold_amount_grams.toFixed(2)} g
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-gray-700">
                <div>
                  <p className="text-gray-500">Issue Date</p>
                  <p>{formatDate(cert.issue_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Registered</p>
                  <p>{formatDate(cert.registered_at)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-gray-500 text-xs font-mono break-all">
                  ID: {cert.certificate_id}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-gray-500 text-xs">
          Certificate information is provided for transparency. Physical gold is
          stored securely in HSBC vaults. For certificate verification, contact
          HSBC directly with the reference number.
        </p>
      </div>
    </div>
  )
}
