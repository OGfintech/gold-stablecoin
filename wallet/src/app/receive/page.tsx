'use client'

import { useWallet } from '../providers'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Copy, Share2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ReceivePage() {
  const { wallet } = useWallet()
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareAddress = async () => {
    if (wallet.address && navigator.share) {
      try {
        await navigator.share({
          title: 'My Gold Wallet Address',
          text: wallet.address,
        })
      } catch {
        copyAddress()
      }
    } else {
      copyAddress()
    }
  }

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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Receive Tokens</h1>
      </div>

      <div className="text-center">
        <p className="text-gray-400">
          Share your address or QR code to receive gold-backed tokens
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-8 mx-auto w-fit">
        <QRCodeSVG
          value={wallet.address}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Address */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-2">Your Wallet Address</p>
        <p className="font-mono text-sm break-all">
          {wallet.address}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={copyAddress}
          className="py-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Copy className="w-5 h-5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={shareAddress}
          className="py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          Only send Gold tokens to this address. Sending other tokens may result in permanent loss.
        </p>
      </div>
    </div>
  )
}
