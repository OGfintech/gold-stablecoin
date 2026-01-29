'use client'

import Link from 'next/link'
import { Coins, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, IconBadge, EmptyState, LoadingState } from '@/components/ui'
import { Transaction, formatTokenAmount, shortenAddress, formatDate } from '@/lib/api'

interface TransactionListProps {
  transactions: Transaction[]
  currentAddress: string
  isLoading?: boolean
  maxItems?: number
  showViewAll?: boolean
  viewAllHref?: string
  className?: string
}

function getTransactionType(tx: Transaction, currentAddress: string) {
  const isMint = tx.tx_type === 'Mint'
  const isBurn = tx.tx_type === 'Burn'
  const isOutgoing = tx.from === currentAddress

  if (isMint) return 'mint'
  if (isBurn) return 'burn'
  return isOutgoing ? 'send' : 'receive'
}

const transactionConfig = {
  mint: {
    label: 'Mint',
    color: 'primary' as const,
    icon: Coins,
    prefix: '+',
    amountClass: 'text-green-400',
    description: 'Token Minting',
  },
  burn: {
    label: 'Burn',
    color: 'danger' as const,
    icon: Coins,
    prefix: '-',
    amountClass: 'text-red-400',
    description: 'Token Burn',
  },
  send: {
    label: 'Sent',
    color: 'danger' as const,
    icon: ArrowUpRight,
    prefix: '-',
    amountClass: 'text-red-400',
    description: (tx: Transaction) => `To: ${shortenAddress(tx.to || '')}`,
  },
  receive: {
    label: 'Received',
    color: 'success' as const,
    icon: ArrowDownLeft,
    prefix: '+',
    amountClass: 'text-green-400',
    description: (tx: Transaction) => `From: ${shortenAddress(tx.from)}`,
  },
}

function TransactionRow({
  tx,
  currentAddress,
}: {
  tx: Transaction
  currentAddress: string
}) {
  const type = getTransactionType(tx, currentAddress)
  const config = transactionConfig[type]
  const Icon = config.icon
  const description = typeof config.description === 'function'
    ? config.description(tx)
    : config.description

  return (
    <div className="p-4 hover:bg-gray-750 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconBadge color={config.color}>
            <Icon />
          </IconBadge>
          <div>
            <p className="font-medium text-sm">{config.label}</p>
            <p className="text-gray-400 text-xs">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold text-sm ${config.amountClass}`}>
            {config.prefix}{tx.amount ? formatTokenAmount(tx.amount) : '0'}
          </p>
          <p className="text-gray-500 text-xs">{formatDate(tx.timestamp)}</p>
        </div>
      </div>
    </div>
  )
}

export function TransactionList({
  transactions,
  currentAddress,
  isLoading = false,
  maxItems,
  showViewAll = false,
  viewAllHref = '/history',
  className = '',
}: TransactionListProps) {
  const displayedTransactions = maxItems
    ? transactions.slice(0, maxItems)
    : transactions

  return (
    <Card padding="sm" className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          Recent Transactions
        </h3>
        {showViewAll && (
          <Link href={viewAllHref} className="text-yellow-400 text-sm hover:underline">
            View All
          </Link>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading transactions..." />
      ) : displayedTransactions.length === 0 ? (
        <EmptyState
          icon={<Coins />}
          title="No transactions yet"
          description="Your transaction history will appear here"
        />
      ) : (
        <div className="divide-y divide-gray-700">
          {displayedTransactions.map((tx) => (
            <TransactionRow
              key={tx.hash}
              tx={tx}
              currentAddress={currentAddress}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
