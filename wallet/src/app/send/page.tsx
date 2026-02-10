'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '../providers'
import { walletApi, formatTokenAmount, parseTokenAmount, shortenAddress } from '@/lib/api'
import { Send, ArrowLeft, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Card, Button, Input, Modal, Alert, IconBadge } from '@/components/ui'
import { signTransaction } from '@/lib/signing'

// Validation constants
const ADDRESS_REGEX = /^[a-fA-F0-9]{64}$/
const AMOUNT_REGEX = /^\d*\.?\d*$/
const NETWORK_FEE = '0' // Free transactions for now

// Form field type
interface FormState {
  recipient: string
  amount: string
  memo: string
}

interface FormErrors {
  recipient?: string
  amount?: string
  general?: string
}

// Transaction status
type TxStatus = 'idle' | 'confirming' | 'sending' | 'success' | 'error'

export default function SendPage() {
  const { wallet } = useWallet()
  const queryClient = useQueryClient()

  // Form state
  const [form, setForm] = useState<FormState>({
    recipient: '',
    amount: '',
    memo: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  // Fetch balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance', wallet.address],
    queryFn: () => walletApi.getBalance(wallet.address!),
    enabled: !!wallet.address,
  })

  const balance = balanceData?.balance || '0'
  const balanceFormatted = formatTokenAmount(balance)
  const nonce = balanceData?.nonce || 0

  // Calculate amounts
  const parsedAmount = useMemo(() => {
    if (!form.amount || !AMOUNT_REGEX.test(form.amount)) return BigInt(0)
    try {
      return BigInt(parseTokenAmount(form.amount))
    } catch {
      return BigInt(0)
    }
  }, [form.amount])

  const remainingBalance = useMemo(() => {
    const balanceBigInt = BigInt(balance)
    const remaining = balanceBigInt - parsedAmount
    return remaining < BigInt(0) ? BigInt(0) : remaining
  }, [balance, parsedAmount])

  const remainingFormatted = formatTokenAmount(remainingBalance.toString())

  // Validation
  const validateField = useCallback((name: keyof FormState, value: string): string | undefined => {
    switch (name) {
      case 'recipient':
        if (!value) return 'Recipient address is required'
        if (!ADDRESS_REGEX.test(value)) return 'Invalid address format (64 hex characters expected)'
        if (value === wallet.address) return 'Cannot send to yourself'
        return undefined

      case 'amount':
        if (!value) return 'Amount is required'
        if (!AMOUNT_REGEX.test(value)) return 'Invalid amount format'
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue <= 0) return 'Amount must be greater than 0'
        try {
          const parsedAmt = BigInt(parseTokenAmount(value))
          if (parsedAmt > BigInt(balance)) return 'Insufficient balance'
        } catch {
          return 'Invalid amount'
        }
        return undefined

      default:
        return undefined
    }
  }, [wallet.address, balance])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    newErrors.recipient = validateField('recipient', form.recipient)
    newErrors.amount = validateField('amount', form.amount)

    if (!wallet.isUnlocked) {
      newErrors.general = 'Please unlock your wallet first'
    }

    setErrors(newErrors)
    return !newErrors.recipient && !newErrors.amount && !newErrors.general
  }, [form, validateField, wallet.isUnlocked])

  // Form handlers
  const handleChange = (name: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, [name]: value }))

    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (name: keyof FormState) => () => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, form[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const setMaxAmount = () => {
    setForm(prev => ({ ...prev, amount: balanceFormatted }))
    setTouched(prev => ({ ...prev, amount: true }))
    // Clear amount error since we're setting max balance
    setErrors(prev => ({ ...prev, amount: undefined }))
  }

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      // Get secret key from session (will be removed in P0.5-09)
      const secretKey = sessionStorage.getItem('wallet_secret')
      if (!secretKey) {
        throw new Error('Wallet is locked. Please unlock to send.')
      }

      const amount = parseTokenAmount(form.amount)

      // Sign transaction locally -- private key NEVER sent to server
      const signature = await signTransaction(
        {
          from: wallet.address!,
          to: form.recipient,
          amount,
          nonce: nonce,
          memo: form.memo || undefined,
        },
        secretKey
      )

      // Send ONLY the signature, not the private key
      const result = await walletApi.transfer({
        from: wallet.address!,
        public_key: wallet.publicKey!,
        nonce: nonce,
        to: form.recipient,
        amount,
        memo: form.memo || undefined,
        signature,  // Now a real Ed25519 signature
      })

      return result
    },
    onSuccess: (data) => {
      setTxHash(data.tx_hash)
      setTxStatus('success')
      // Invalidate balance query to refresh
      queryClient.invalidateQueries({ queryKey: ['balance', wallet.address] })
      queryClient.invalidateQueries({ queryKey: ['transactions', wallet.address] })
    },
    onError: (error: Error) => {
      setTxError(error.message)
      setTxStatus('error')
    },
  })

  // Handlers
  const handleReview = () => {
    if (validateForm()) {
      setTxStatus('confirming')
    }
  }

  const handleConfirmSend = async () => {
    setTxStatus('sending')
    setTxError(null)
    sendMutation.mutate()
  }

  const handleCloseModal = () => {
    if (txStatus !== 'sending') {
      setTxStatus('idle')
    }
  }

  const resetForm = () => {
    setForm({ recipient: '', amount: '', memo: '' })
    setErrors({})
    setTouched({})
    setTxStatus('idle')
    setTxHash(null)
    setTxError(null)
  }

  // No wallet state
  if (!wallet.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20">
        <IconBadge color="warning" size="xl" className="mb-4">
          <Send />
        </IconBadge>
        <p className="text-gray-400 mb-4">Please create or import a wallet first</p>
        <Button href="/" variant="primary">Go to Wallet</Button>
      </div>
    )
  }

  // Success state
  if (txStatus === 'success' && txHash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20 space-y-6">
        <IconBadge color="success" size="xl">
          <CheckCircle />
        </IconBadge>

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Transaction Sent!</h2>
          <p className="text-gray-400">Your tokens are on their way</p>
        </div>

        <Card className="w-full max-w-sm space-y-3">
          <Card.Row label="Amount" value={`${form.amount} GOLD`} valueClassName="text-green-400 font-semibold" />
          <Card.Row label="To" value={shortenAddress(form.recipient)} valueClassName="font-mono" />
          <Card.Divider />
          <div>
            <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-yellow-400 break-all flex-1">
                {txHash}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 w-full max-w-sm">
          <Button href="/" variant="secondary" fullWidth>
            Back to Wallet
          </Button>
          <Button onClick={resetForm} variant="primary" fullWidth>
            Send More
          </Button>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Send Tokens</h1>
      </div>

      {/* Balance Card */}
      <Card className="space-y-1">
        <p className="text-gray-400 text-sm">Available Balance</p>
        <p className="text-2xl font-bold text-yellow-500">
          {balanceLoading ? '...' : balanceFormatted} GOLD
        </p>
      </Card>

      {/* Alerts */}
      {!wallet.isUnlocked && (
        <Alert variant="warning">
          Wallet is locked. Please unlock from the home page to send transactions.
        </Alert>
      )}

      {errors.general && (
        <Alert variant="error">{errors.general}</Alert>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* Recipient */}
        <div>
          <Input
            label="Recipient Address"
            value={form.recipient}
            onChange={handleChange('recipient')}
            onBlur={handleBlur('recipient')}
            placeholder="Enter 64-character hex address"
            error={touched.recipient ? errors.recipient : undefined}
            className="font-mono text-sm"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">Amount</label>
          <div className="relative">
            <input
              type="text"
              value={form.amount}
              onChange={handleChange('amount')}
              onBlur={handleBlur('amount')}
              placeholder="0.00"
              className={`
                w-full bg-gray-700 rounded-lg px-4 py-3 pr-24
                border transition-colors
                ${touched.amount && errors.amount
                  ? 'border-red-500'
                  : 'border-gray-600 focus:border-yellow-500'
                }
                focus:outline-none
              `}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-gray-400 text-sm">GOLD</span>
              <button
                type="button"
                onClick={setMaxAmount}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
          {touched.amount && errors.amount && (
            <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Memo */}
        <Input
          label="Memo (optional)"
          value={form.memo}
          onChange={handleChange('memo')}
          placeholder="Add a note to this transaction"
        />
      </div>

      {/* Transaction Summary */}
      {form.amount && parseFloat(form.amount) > 0 && !errors.amount && (
        <Card className="space-y-3">
          <h3 className="font-semibold">Transaction Summary</h3>

          <Card.Row label="Send Amount" value={`${form.amount} GOLD`} />
          <Card.Row
            label="Network Fee"
            value={NETWORK_FEE === '0' ? 'Free' : `${NETWORK_FEE} GOLD`}
            valueClassName="text-green-400"
          />

          <Card.Divider />

          <Card.Row
            label="Total"
            value={`${form.amount} GOLD`}
            valueClassName="font-semibold"
          />
          <Card.Row
            label="Remaining Balance"
            value={`${remainingFormatted} GOLD`}
            valueClassName={remainingBalance === BigInt(0) ? 'text-yellow-400' : 'text-gray-300'}
          />
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleReview}
        disabled={!wallet.isUnlocked || !form.recipient || !form.amount}
        fullWidth
        size="lg"
        icon={<Send className="w-5 h-5" />}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700"
      >
        Review Transaction
      </Button>

      {/* Confirmation Modal */}
      <Modal
        isOpen={txStatus === 'confirming' || txStatus === 'sending' || txStatus === 'error'}
        onClose={handleCloseModal}
        title={txStatus === 'error' ? 'Transaction Failed' : 'Confirm Transaction'}
        showCloseButton={txStatus !== 'sending'}
      >
        {txStatus === 'error' ? (
          <div className="space-y-4">
            <Alert variant="error">
              {txError || 'Transaction failed. Please try again.'}
            </Alert>
            <Modal.Footer>
              <Button onClick={() => setTxStatus('idle')} variant="secondary" fullWidth>
                Go Back
              </Button>
              <Button onClick={handleConfirmSend} variant="primary" fullWidth>
                Retry
              </Button>
            </Modal.Footer>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Please review the details below before confirming.
            </p>

            <Card className="space-y-3">
              <Card.Row label="To" value={shortenAddress(form.recipient, 8)} valueClassName="font-mono" />
              <Card.Row label="Amount" value={`${form.amount} GOLD`} valueClassName="text-yellow-400 font-semibold" />
              {form.memo && <Card.Row label="Memo" value={form.memo} />}
              <Card.Divider />
              <Card.Row label="Network Fee" value="Free" valueClassName="text-green-400" />
              <Card.Row label="Total" value={`${form.amount} GOLD`} valueClassName="font-semibold" />
            </Card>

            <Alert variant="warning" showIcon>
              This transaction cannot be reversed. Please verify the recipient address carefully.
            </Alert>

            <Modal.Footer>
              <Button
                onClick={handleCloseModal}
                variant="secondary"
                fullWidth
                disabled={txStatus === 'sending'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSend}
                variant="primary"
                fullWidth
                loading={txStatus === 'sending'}
                className="bg-green-600 hover:bg-green-700"
              >
                {txStatus === 'sending' ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}
