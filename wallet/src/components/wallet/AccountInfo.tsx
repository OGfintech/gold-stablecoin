import { Card } from '@/components/ui'

interface AccountInfoProps {
  nonce: number
  isAdmin: boolean
  totalTransactions?: number
  className?: string
}

export function AccountInfo({
  nonce,
  isAdmin,
  totalTransactions,
  className = '',
}: AccountInfoProps) {
  return (
    <Card className={`space-y-3 ${className}`}>
      <h3 className="font-semibold">Account Info</h3>

      <Card.Row
        label="Nonce"
        value={nonce}
        valueClassName="font-mono"
      />

      <Card.Row
        label="Admin"
        value={isAdmin ? 'Yes' : 'No'}
        valueClassName={isAdmin ? 'text-green-400' : 'text-gray-500'}
      />

      {totalTransactions !== undefined && (
        <Card.Row
          label="Total Transactions"
          value={totalTransactions}
          valueClassName="font-mono"
        />
      )}
    </Card>
  )
}
