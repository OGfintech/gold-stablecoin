'use client'

import { useState } from 'react'
import { BucketColumn } from './components/BucketColumn'
import { MoveModal } from './components/MoveModal'
import { UserCard, BucketUser } from './components/UserCard'

// Mock data for testing - in production this would come from an API
const mockUsers: BucketUser[] = [
  // Bucket 1 - Onboarding
  { id: '1', email: 'john.doe@email.com', name: 'John Doe', bucket: 1, status: 'email_verified', walletAddress: 'abc123...def', createdAt: '2026-01-28', kycStatus: 'not_started' },
  { id: '2', email: 'mary.smith@email.com', name: 'Mary Smith', bucket: 1, status: 'kyc_pending', walletAddress: 'xyz789...ghi', createdAt: '2026-01-29', kycStatus: 'pending' },
  { id: '3', email: 'peter.jones@email.com', name: 'Peter Jones', bucket: 1, status: 'wallet_created', walletAddress: 'mno456...pqr', createdAt: '2026-01-30', kycStatus: 'not_started' },

  // Bucket 2 - Deposits
  { id: '4', email: 'jane.williams@email.com', name: 'Jane Williams', bucket: 2, status: 'pending_review', walletAddress: 'stu111...vwx', createdAt: '2026-01-25', depositAmount: 10000, depositType: 'BANK' },
  { id: '5', email: 'tom.brown@email.com', name: 'Tom Brown', bucket: 2, status: 'confirmed', walletAddress: 'yza222...bcd', createdAt: '2026-01-26', depositAmount: 5000, depositType: 'USDT' },
  { id: '6', email: 'lisa.davis@email.com', name: 'Lisa Davis', bucket: 2, status: 'pending_review', walletAddress: 'efg333...hij', createdAt: '2026-01-27', depositAmount: 25000, depositType: 'UPLOAD' },

  // Bucket 3 - Minting
  { id: '7', email: 'bob.miller@email.com', name: 'Bob Miller', bucket: 3, status: 'in_queue', walletAddress: 'klm444...nop', createdAt: '2026-01-20', depositAmount: 15000, queuePosition: 1 },
  { id: '8', email: 'sarah.wilson@email.com', name: 'Sarah Wilson', bucket: 3, status: 'in_queue', walletAddress: 'qrs555...tuv', createdAt: '2026-01-21', depositAmount: 8000, queuePosition: 2 },

  // Bucket 4 - Completed
  { id: '9', email: 'alice.taylor@email.com', name: 'Alice Taylor', bucket: 4, status: 'active', walletAddress: 'wxy666...zab', createdAt: '2026-01-10', balance: 12500 },
  { id: '10', email: 'chris.anderson@email.com', name: 'Chris Anderson', bucket: 4, status: 'active', walletAddress: 'cde777...fgh', createdAt: '2026-01-12', balance: 5200 },
  { id: '11', email: 'emma.thomas@email.com', name: 'Emma Thomas', bucket: 4, status: 'active', walletAddress: 'ijk888...lmn', createdAt: '2026-01-15', balance: 32000 },
]

interface BucketInfo {
  id: number
  name: string
  description: string
  color: string
}

const buckets: BucketInfo[] = [
  { id: 1, name: 'Onboarding', description: 'Wallet creation & verification', color: 'blue' },
  { id: 2, name: 'Deposits', description: 'Deposit submission & review', color: 'amber' },
  { id: 3, name: 'Minting', description: 'In queue for token minting', color: 'purple' },
  { id: 4, name: 'Completed', description: 'Active users with tokens', color: 'green' },
]

export default function BucketsPage() {
  const [users, setUsers] = useState<BucketUser[]>(mockUsers)
  const [draggedUser, setDraggedUser] = useState<BucketUser | null>(null)
  const [targetBucket, setTargetBucket] = useState<number | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)

  const handleDragStart = (user: BucketUser) => {
    setDraggedUser(user)
  }

  const handleDragOver = (bucketId: number) => {
    if (draggedUser && draggedUser.bucket !== bucketId) {
      setTargetBucket(bucketId)
    }
  }

  const handleDrop = (bucketId: number) => {
    if (draggedUser && draggedUser.bucket !== bucketId) {
      setTargetBucket(bucketId)
      setShowMoveModal(true)
    }
  }

  const handleMoveConfirm = (reason: string, notes: string, sendEmail: boolean) => {
    if (draggedUser && targetBucket) {
      // Update user's bucket
      setUsers(prev => prev.map(u =>
        u.id === draggedUser.id ? { ...u, bucket: targetBucket } : u
      ))

      // In production, this would also:
      // 1. Call API to update user's bucket
      // 2. Log admin action
      // 3. Send notification email if selected

      console.log('Move confirmed:', {
        user: draggedUser.email,
        fromBucket: draggedUser.bucket,
        toBucket: targetBucket,
        reason,
        notes,
        sendEmail,
      })
    }

    // Reset state
    setDraggedUser(null)
    setTargetBucket(null)
    setShowMoveModal(false)
  }

  const handleMoveCancel = () => {
    setDraggedUser(null)
    setTargetBucket(null)
    setShowMoveModal(false)
  }

  const getUsersByBucket = (bucketId: number) => {
    return users.filter(u => u.bucket === bucketId)
  }

  const getTotalStats = () => {
    const bucket2Users = getUsersByBucket(2)
    const bucket3Users = getUsersByBucket(3)
    const bucket4Users = getUsersByBucket(4)

    const pendingDeposits = bucket2Users.reduce((sum, u) => sum + (u.depositAmount || 0), 0)
    const inQueue = bucket3Users.reduce((sum, u) => sum + (u.depositAmount || 0), 0)
    const totalMinted = bucket4Users.reduce((sum, u) => sum + (u.balance || 0), 0)

    return { pendingDeposits, inQueue, totalMinted }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Bucket Management</h1>
          <p className="text-gray-400 mt-1">Drag users between buckets to manage their onboarding status</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Pending Deposits</p>
            <p className="text-lg font-bold text-amber-400">${stats.pendingDeposits.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-gray-400">In Minting Queue</p>
            <p className="text-lg font-bold text-purple-400">${stats.inQueue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Total Minted</p>
            <p className="text-lg font-bold text-green-400">{stats.totalMinted.toLocaleString()} GOLD</p>
          </div>
        </div>
      </div>

      {/* Bucket Columns */}
      <div className="grid grid-cols-4 gap-4">
        {buckets.map(bucket => (
          <BucketColumn
            key={bucket.id}
            bucket={bucket}
            users={getUsersByBucket(bucket.id)}
            onDragStart={handleDragStart}
            onDragOver={() => handleDragOver(bucket.id)}
            onDrop={() => handleDrop(bucket.id)}
            isDropTarget={targetBucket === bucket.id}
            isDragging={!!draggedUser}
          />
        ))}
      </div>

      {/* Move Modal */}
      {showMoveModal && draggedUser && targetBucket && (
        <MoveModal
          user={draggedUser}
          fromBucket={buckets.find(b => b.id === draggedUser.bucket)!}
          toBucket={buckets.find(b => b.id === targetBucket)!}
          onConfirm={handleMoveConfirm}
          onCancel={handleMoveCancel}
        />
      )}
    </div>
  )
}
