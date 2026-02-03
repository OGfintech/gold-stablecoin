'use client'

import { GoldCertificate } from '@/components/wallet/GoldCertificate'

export default function CertificatePreviewPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white text-center mb-8">
          Certificate Preview
        </h1>

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

        <div className="mt-12 grid gap-8">
          <h2 className="text-xl font-bold text-white text-center">Other Status Examples</h2>

          <GoldCertificate
            certificateId="CERT-2024-002-AU"
            hsbcReference="HSBC-GOLD-2024-92104"
            goldAmountOz={25.50}
            issueDate="2024-02-20"
            hsbcBranch="Singapore Branch"
            status="Pending"
            documentHash="b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567"
          />

          <GoldCertificate
            certificateId="CERT-2023-015-AU"
            hsbcReference="HSBC-GOLD-2023-45678"
            goldAmountOz={5.00}
            issueDate="2023-11-10"
            hsbcBranch="London Branch"
            status="Redeemed"
            documentHash="c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678"
          />
        </div>
      </div>
    </div>
  )
}
