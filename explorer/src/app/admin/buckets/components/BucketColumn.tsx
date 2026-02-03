'use client'

import { BucketUser, UserCard } from './UserCard'

interface BucketInfo {
  id: number
  name: string
  description: string
  color: string
}

interface BucketColumnProps {
  bucket: BucketInfo
  users: BucketUser[]
  onDragStart: (user: BucketUser) => void
  onDragOver: () => void
  onDrop: () => void
  isDropTarget: boolean
  isDragging: boolean
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400',
  },
}

export function BucketColumn({
  bucket,
  users,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget,
  isDragging,
}: BucketColumnProps) {
  const colors = colorMap[bucket.color] || colorMap.blue

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    onDragOver()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop()
  }

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        isDropTarget
          ? `${colors.border} ${colors.bg} scale-[1.02]`
          : 'border-gray-700 bg-gray-800/50'
      } ${isDragging ? 'cursor-move' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Bucket Header */}
      <div className={`p-4 border-b ${isDropTarget ? colors.border : 'border-gray-700'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold ${colors.text}`}>{bucket.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
            {users.length}
          </span>
        </div>
        <p className="text-xs text-gray-500">{bucket.description}</p>
      </div>

      {/* User Cards */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No users in this bucket
          </div>
        ) : (
          users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              bucketColor={bucket.color}
              onDragStart={() => onDragStart(user)}
            />
          ))
        )}
      </div>

      {/* Drop indicator */}
      {isDropTarget && (
        <div className={`mx-2 mb-2 py-3 border-2 border-dashed ${colors.border} rounded-lg text-center`}>
          <span className={`text-sm ${colors.text}`}>Drop here</span>
        </div>
      )}
    </div>
  )
}
