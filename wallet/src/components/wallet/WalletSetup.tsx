'use client'

import { useState } from 'react'
import { Wallet, Plus, Copy } from 'lucide-react'
import { Card, Button, Input, GradientBadge, IconBadge } from '@/components/ui'

interface WalletSetupProps {
  onCreateWallet: () => Promise<{ address: string; publicKey: string; secretKey: string }>
  onImportWallet: (secretKey: string) => Promise<boolean>
}

type SetupStep = 'initial' | 'import' | 'backup'

interface NewWalletData {
  address: string
  publicKey: string
  secretKey: string
}

export function WalletSetup({ onCreateWallet, onImportWallet }: WalletSetupProps) {
  const [step, setStep] = useState<SetupStep>('initial')
  const [secretInput, setSecretInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newWallet, setNewWallet] = useState<NewWalletData | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await onCreateWallet()
      setNewWallet(data)
      setStep('backup')
    } catch (e: any) {
      setError(e.message || 'Failed to create wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!secretInput) return

    setIsLoading(true)
    setError(null)

    try {
      const success = await onImportWallet(secretInput)
      if (!success) {
        setError('Failed to import wallet. Check your secret key.')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to import wallet')
    } finally {
      setIsLoading(false)
      setSecretInput('')
    }
  }

  const copySecretKey = () => {
    if (newWallet) {
      navigator.clipboard.writeText(newWallet.secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Backup screen after wallet creation
  if (step === 'backup' && newWallet) {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center">
          <IconBadge color="success" size="xl" className="mx-auto mb-4">
            <Wallet />
          </IconBadge>
          <h1 className="text-2xl font-bold">Wallet Created!</h1>
          <p className="text-gray-400 mt-2">Save your secret key securely</p>
        </div>

        <Card variant="interactive" className="border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm font-medium">
            WARNING: Save this secret key now! It will not be shown again.
          </p>
        </Card>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Your Address</label>
            <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm break-all mt-1">
              {newWallet.address}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Secret Key (SAVE THIS!)</label>
            <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm break-all mt-1">
              {newWallet.secretKey}
            </div>
          </div>
        </div>

        <Button onClick={copySecretKey} variant="secondary" fullWidth icon={<Copy className="w-4 h-4" />}>
          {copied ? 'Copied!' : 'Copy Secret Key'}
        </Button>

        <Button onClick={() => setNewWallet(null)} fullWidth size="lg">
          I've Saved My Secret Key
        </Button>
      </div>
    )
  }

  // Initial or import screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 pb-20">
      {/* Full Logo */}
      <img
        src="/logo.svg"
        alt="STTAURX"
        className="h-20 md:h-24"
      />

      <h1 className="text-2xl font-bold">Welcome to STTAURX Wallet</h1>
      <p className="text-gray-400 text-center max-w-xs">
        A secure wallet for your gold-backed stablecoin tokens
      </p>

      {error && (
        <Card variant="interactive" className="border-red-500/30 bg-red-500/10 max-w-xs">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      <Button
        onClick={handleCreate}
        fullWidth
        size="lg"
        loading={isLoading && step === 'initial'}
        icon={<Plus className="w-5 h-5" />}
        className="max-w-xs"
      >
        Create New Wallet
      </Button>

      <div className="text-center">
        <p className="text-gray-500 text-sm">or</p>
        <button
          onClick={() => setStep(step === 'import' ? 'initial' : 'import')}
          className="text-yellow-500 hover:underline text-sm mt-2"
        >
          Import Existing Wallet
        </button>
      </div>

      {step === 'import' && (
        <div className="w-full max-w-xs space-y-3">
          <Input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Enter your secret key"
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <Button
            onClick={handleImport}
            variant="secondary"
            fullWidth
            loading={isLoading}
          >
            Import Wallet
          </Button>
        </div>
      )}
    </div>
  )
}
