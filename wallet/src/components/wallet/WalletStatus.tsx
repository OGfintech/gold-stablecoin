'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

interface WalletStatusProps {
  isUnlocked: boolean
  onLock: () => void
  onUnlock: (secretKey: string) => Promise<boolean>
  className?: string
}

export function WalletStatus({
  isUnlocked,
  onLock,
  onUnlock,
  className = '',
}: WalletStatusProps) {
  const [showUnlockForm, setShowUnlockForm] = useState(false)
  const [secretInput, setSecretInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUnlock = async () => {
    if (!secretInput) return

    setIsLoading(true)
    setError(null)

    const success = await onUnlock(secretInput)

    if (!success) {
      setError('Failed to unlock wallet')
    } else {
      setShowUnlockForm(false)
    }

    setSecretInput('')
    setIsLoading(false)
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <>
              <Unlock className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Wallet Unlocked</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm">Wallet Locked</span>
            </>
          )}
        </div>

        {isUnlocked ? (
          <button
            onClick={onLock}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Lock
          </button>
        ) : (
          <button
            onClick={() => setShowUnlockForm(!showUnlockForm)}
            className="text-gold-300 hover:text-gold-200 text-sm transition-colors"
          >
            Unlock
          </button>
        )}
      </div>

      {/* Unlock Form */}
      {showUnlockForm && !isUnlocked && (
        <div className="mt-4 pt-4 border-t border-vault-border space-y-3">
          <Input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Enter your secret key"
            error={error || undefined}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <Button
            onClick={handleUnlock}
            fullWidth
            size="sm"
            loading={isLoading}
          >
            Unlock Wallet
          </Button>
        </div>
      )}
    </Card>
  )
}
