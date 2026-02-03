'use client'

export interface BucketUser {
  id: string
  email: string
  name: string
  bucket: number
  status: string
  walletAddress: string
  createdAt: string
  // Bucket 1 specific
  kycStatus?: 'not_started' | 'pending' | 'verified' | 'rejected'
  // Bucket 2 specific
  depositAmount?: number
  depositType?: 'USDT' | 'BANK' | 'UPLOAD'
  // Bucket 3 specific
  queuePosition?: number
  // Bucket 4 specific
  balance?: number
}

interface UserCardProps {
  user: BucketUser
  bucketColor: string
  onDragStart: () => void
}

const statusLabels: Record<string, { label: string; color: string }> = {
  // Bucket 1 statuses
  email_verified: { label: 'Email Verified', color: 'bg-blue-500/20 text-blue-400' },
  kyc_pending: { label: 'KYC Pending', color: 'bg-amber-500/20 text-amber-400' },
  wallet_created: { label: 'Wallet Created', color: 'bg-green-500/20 text-green-400' },
  // Bucket 2 statuses
  pending_review: { label: 'Pending Review', color: 'bg-amber-500/20 text-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400' },
  // Bucket 3 statuses
  in_queue: { label: 'In Queue', color: 'bg-purple-500/20 text-purple-400' },
  minting: { label: 'Minting...', color: 'bg-purple-500/20 text-purple-400 animate-pulse' },
  // Bucket 4 statuses
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
  inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' },
}

const depositTypeIcons: Record<string, string> = {
  USDT: '💵',
  BANK: '🏦',
  UPLOAD: '📄',
}

export function UserCard({ user, bucketColor, onDragStart }: UserCardProps) {
  const statusInfo = statusLabels[user.status] || { label: user.status, color: 'bg-gray-500/20 text-gray-400' }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    onDragStart()
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-750 transition-all hover:scale-[1.02] border border-gray-700 hover:border-gray-600"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Bucket-specific info */}
      <div className="space-y-1 text-xs">
        {/* Bucket 1: Onboarding info */}
        {user.bucket === 1 && user.kycStatus && (
          <div className="flex items-center justify-between text-gray-400">
            <span>KYC Status:</span>
            <span className={
              user.kycStatus === 'verified' ? 'text-green-400' :
              user.kycStatus === 'pending' ? 'text-amber-400' :
              user.kycStatus === 'rejected' ? 'text-red-400' :
              'text-gray-500'
            }>
              {user.kycStatus === 'not_started' ? 'Not Started' :
               user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
            </span>
          </div>
        )}

        {/* Bucket 2: Deposit info */}
        {user.bucket === 2 && user.depositAmount && (
          <>
            <div className="flex items-center justify-between text-gray-400">
              <span>Deposit:</span>
              <span className="text-amber-400 font-medium">
                ${user.depositAmount.toLocaleString()}
              </span>
            </div>
            {user.depositType && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Type:</span>
                <span className="text-white">
                  {depositTypeIcons[user.depositType]} {user.depositType}
                </span>
              </div>
            )}
          </>
        )}

        {/* Bucket 3: Queue info */}
        {user.bucket === 3 && (
          <>
            {user.queuePosition && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Queue Position:</span>
                <span className="text-purple-400 font-medium">#{user.queuePosition}</span>
              </div>
            )}
            {user.depositAmount && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Amount to Mint:</span>
                <span className="text-purple-400 font-medium">
                  ${user.depositAmount.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {/* Bucket 4: Balance info */}
        {user.bucket === 4 && user.balance && (
          <div className="flex items-center justify-between text-gray-400">
            <span>Balance:</span>
            <span className="text-green-400 font-medium">
              {user.balance.toLocaleString()} GOLD
            </span>
          </div>
        )}

        {/* Wallet address (truncated) */}
        <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-700 mt-2">
          <span>Wallet:</span>
          <span className="font-mono">{user.walletAddress}</span>
        </div>
      </div>

      {/* Drag handle indicator */}
      <div className="flex justify-center mt-2 pt-2 border-t border-gray-700">
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="w-1 h-1 rounded-full bg-gray-600" />
        </div>
      </div>
    </div>
  )
}
