'use client'

import { useState } from 'react'
import { Shield, CheckCircle, Copy, ExternalLink } from 'lucide-react'

interface CertificateProps {
  certificateId: string
  hsbcReference: string
  goldAmountOz: number
  issueDate: string
  hsbcBranch: string
  status: 'Active' | 'Redeemed' | 'Pending'
  documentHash?: string
  ownerAddress?: string
}

export function GoldCertificate({
  certificateId,
  hsbcReference,
  goldAmountOz,
  issueDate,
  hsbcBranch,
  status,
  documentHash,
  ownerAddress,
}: CertificateProps) {
  const [copied, setCopied] = useState(false)

  const copyHash = () => {
    if (documentHash) {
      navigator.clipboard.writeText(documentHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusColors = {
    Active: 'bg-green-500/20 text-green-400 border-green-500/30',
    Redeemed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Outer decorative border */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 rounded-2xl" />

      {/* Inner border pattern */}
      <div className="absolute inset-[3px] bg-gradient-to-br from-yellow-800 via-yellow-900 to-yellow-800 rounded-2xl" />
      <div className="absolute inset-[6px] bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 rounded-xl" />

      {/* Main certificate body */}
      <div className="relative m-[9px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-yellow-600/30">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Shield className="w-8 h-8 text-gray-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
            CERTIFICATE OF AUTHENTICITY
          </h1>
          <p className="text-yellow-600/80 text-sm mt-1 tracking-widest">GOLD-BACKED DIGITAL ASSET</p>
        </div>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent" />
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent" />
        </div>

        {/* Certificate Details */}
        <div className="space-y-4">
          {/* HSBC Reference - Large */}
          <div className="text-center py-4 bg-gray-800/50 rounded-lg border border-yellow-600/20">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">HSBC Reference Number</p>
            <p className="text-2xl font-mono font-bold text-white">{hsbcReference}</p>
          </div>

          {/* Gold Amount - Prominent */}
          <div className="text-center py-6 bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg border border-yellow-600/30">
            <p className="text-yellow-500/80 text-xs uppercase tracking-wider mb-2">Certified Gold Holdings</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {goldAmountOz.toFixed(2)}
              </span>
              <span className="text-xl text-yellow-500">Troy Ounces</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              ≈ ${(goldAmountOz * 2650).toLocaleString()} USD at current market value
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Certificate ID</p>
              <p className="text-white font-mono text-sm truncate">{certificateId}</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Issue Date</p>
              <p className="text-white">{new Date(issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Custodian Branch</p>
              <p className="text-white">{hsbcBranch}</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                <CheckCircle className="w-3 h-3" />
                {status}
              </span>
            </div>
          </div>

          {/* Document Hash */}
          {documentHash && (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Document Hash (SHA-256)</p>
                <button
                  onClick={copyHash}
                  className="text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white font-mono text-xs break-all">{documentHash}</p>
            </div>
          )}

          {/* Owner Address */}
          {ownerAddress && (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Registered Owner</p>
              <p className="text-white font-mono text-xs break-all">{ownerAddress}</p>
            </div>
          )}
        </div>

        {/* Decorative line */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent" />
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent" />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-2">
            This certificate verifies the existence and ownership of physical gold held in custody.
          </p>
          <p className="text-gray-600 text-xs">
            Issued by AU Gold Block • Secured on Blockchain • Backed by HSBC Gold Custody
          </p>
        </div>

        {/* Verification badge */}
        <div className="absolute top-4 right-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo/Preview component
export function CertificatePreview() {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <GoldCertificate
        certificateId="CERT-2024-001-AU"
        hsbcReference="HSBC-GOLD-2024-78432"
        goldAmountOz={10.00}
        issueDate="2024-01-15"
        hsbcBranch="Hong Kong Main Branch"
        status="Active"
        documentHash="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
        ownerAddress="7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
      />
    </div>
  )
}
