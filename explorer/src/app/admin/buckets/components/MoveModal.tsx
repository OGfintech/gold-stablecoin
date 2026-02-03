'use client'

import { useState } from 'react'
import { BucketUser } from './UserCard'

interface BucketInfo {
  id: number
  name: string
  description: string
  color: string
}

interface MoveModalProps {
  user: BucketUser
  fromBucket: BucketInfo
  toBucket: BucketInfo
  onConfirm: (reason: string, notes: string, sendEmail: boolean) => void
  onCancel: () => void
}

const moveReasons: Record<string, string[]> = {
  // Moving to Bucket 1 (Onboarding)
  '1': [
    'Reset to onboarding',
    'KYC rejection - retry required',
    'Account verification issue',
    'User request',
  ],
  // Moving to Bucket 2 (Deposits)
  '2': [
    'Onboarding completed',
    'New deposit submitted',
    'Deposit review required',
    'Manual override',
  ],
  // Moving to Bucket 3 (Minting)
  '3': [
    'Deposit verified',
    'Ready for minting',
    'Priority queue',
    'Manual approval',
  ],
  // Moving to Bucket 4 (Completed)
  '4': [
    'Minting successful',
    'Tokens transferred',
    'Account activated',
    'Manual completion',
  ],
}

const colorMap: Record<string, { border: string; text: string }> = {
  blue: { border: 'border-blue-500', text: 'text-blue-400' },
  amber: { border: 'border-amber-500', text: 'text-amber-400' },
  purple: { border: 'border-purple-500', text: 'text-purple-400' },
  green: { border: 'border-green-500', text: 'text-green-400' },
}

export function MoveModal({ user, fromBucket, toBucket, onConfirm, onCancel }: MoveModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [sendEmail, setSendEmail] = useState(true)

  const reasons = moveReasons[toBucket.id.toString()] || ['Manual override']
  const fromColors = colorMap[fromBucket.color] || colorMap.blue
  const toColors = colorMap[toBucket.color] || colorMap.blue

  const handleConfirm = () => {
    if (!reason) return
    onConfirm(reason, notes, sendEmail)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Confirm Bucket Move</h2>
          <p className="text-sm text-gray-400 mt-1">
            This action will be logged in the admin audit trail.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-gray-900 font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Move visualization */}
          <div className="flex items-center justify-center gap-4">
            <div className={`px-4 py-2 rounded-lg border-2 ${fromColors.border} bg-gray-800`}>
              <span className={`text-sm font-medium ${fromColors.text}`}>{fromBucket.name}</span>
            </div>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className={`px-4 py-2 rounded-lg border-2 ${toColors.border} bg-gray-800`}>
              <span className={`text-sm font-medium ${toColors.text}`}>{toBucket.name}</span>
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason for move *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Additional notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Email notification toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
            />
            <span className="text-sm text-gray-300">
              Send email notification to user
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  )
}
