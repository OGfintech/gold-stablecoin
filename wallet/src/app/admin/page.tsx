'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Users, TrendingUp, Coins, Lock, AlertCircle,
  CheckCircle, LogOut, RefreshCw, Edit3, Save, X, Loader2,
  UserCheck, Banknote, Zap
} from 'lucide-react'
import {
  adminApi,
  AdminUser,
  StakingTierConfig,
  StakingStats,
  LoginResponse,
} from '@/lib/admin-api'

// ============================================
// LOGIN SCREEN
// ============================================
function AdminLogin({ onLogin }: { onLogin: (token: string, user: LoginResponse['user']) => void }) {
  const [email, setEmail] = useState('admin@sttaurx.io')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.login(email, password)
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        setError('Access denied. Admin privileges required.')
        return
      }
      onLogin(data.accessToken, data.user)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-vault-card rounded-2xl border border-vault-border p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gold-300/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-gold-200" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">STTAURX Management Console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-vault-base border border-vault-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin@STTAURX2026!"
              className="w-full bg-vault-base border border-vault-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold-300 hover:bg-gold-200 text-vault-base rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================
// STAKING TIER CARD
// ============================================
function TierCard({
  tier,
  onSave,
}: {
  tier: StakingTierConfig
  onSave: (tierName: string, apyRate: number, minStake: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [apyInput, setApyInput] = useState((tier.apyRate * 100).toFixed(2))
  const [minInput, setMinInput] = useState(tier.minStake.toString())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const tierColor =
    tier.lockDays === 0
      ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20' }
      : tier.lockDays === 90
      ? { border: 'border-gold-300/30', bg: 'bg-gold-300/10', text: 'text-gold-200', badge: 'bg-gold-300/20' }
      : { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20' }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const rate = parseFloat(apyInput) / 100
      const min = parseFloat(minInput) || 0
      await onSave(tier.tierName, rate, min)
      setMessage('Saved')
      setEditing(false)
      setTimeout(() => setMessage(null), 2000)
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`bg-vault-base/50 rounded-xl p-5 border ${tierColor.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tierColor.badge}`}>
            {tier.lockDays === 0 ? (
              <Zap className={`w-5 h-5 ${tierColor.text}`} />
            ) : (
              <Lock className={`w-5 h-5 ${tierColor.text}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{tier.displayName}</h3>
            <p className="text-xs text-gray-500">
              {tier.lockDays === 0 ? 'No lock period' : `${tier.lockDays}-day lock`}
            </p>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="p-2 hover:bg-vault-cardHover rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="p-2 hover:bg-vault-cardHover rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">APY Rate (%)</label>
            <input
              type="text"
              value={apyInput}
              onChange={(e) => setApyInput(e.target.value)}
              className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-white text-lg font-bold focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min Stake (STTAURX)</label>
            <input
              type="text"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-white focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-gold-300 hover:bg-gold-200 text-vault-base rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-500 text-sm">APY Rate</span>
            <span className={`text-2xl font-bold ${tierColor.text}`}>{tier.apyFormatted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Min Stake</span>
            <span className="text-gray-300">{tier.minStake} STTAURX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={tier.isActive ? 'text-emerald-400' : 'text-red-400'}>
              {tier.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs mt-2 ${message === 'Saved' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

// ============================================
// USER ROW
// ============================================
function UserRow({
  user,
  onKycUpdate,
  onMint,
}: {
  user: AdminUser
  onKycUpdate: (userId: string, status: string) => Promise<void>
  onMint: (address: string) => void
}) {
  const [kycDropdown, setKycDropdown] = useState(false)
  const [updating, setUpdating] = useState(false)

  const kycColors: Record<string, string> = {
    NONE: 'bg-gray-500/20 text-gray-400',
    PENDING: 'bg-amber-500/20 text-amber-400',
    VERIFIED: 'bg-emerald-500/20 text-emerald-400',
    PREMIUM: 'bg-blue-500/20 text-blue-400',
    INSTITUTIONAL: 'bg-purple-500/20 text-purple-400',
    REJECTED: 'bg-red-500/20 text-red-400',
  }

  const handleKyc = async (status: string) => {
    setUpdating(true)
    try {
      await onKycUpdate(user.id, status)
    } finally {
      setUpdating(false)
      setKycDropdown(false)
    }
  }

  const wallet = user.wallets[0]
  const balance = wallet ? (Number(wallet.balance) / 1e18).toFixed(2) : '0'

  return (
    <div className="bg-vault-base/30 rounded-xl p-4 border border-vault-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-white">{user.fullName || user.email}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${kycColors[user.kycStatus] || kycColors.NONE}`}>
            {user.kycStatus}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-vault-cardHover text-gray-400">
            {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Balance</p>
          <p className="text-white font-medium">{balance} STTAURX</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Status</p>
          <p className={user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}>
            {user.status}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Wallet</p>
          <p className="text-gray-400 font-mono text-xs truncate">
            {wallet ? wallet.address.slice(0, 12) + '...' : 'None'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {/* KYC Override */}
        <div className="relative">
          <button
            onClick={() => setKycDropdown(!kycDropdown)}
            disabled={updating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-cardHover hover:bg-gray-700 border border-vault-border rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
            KYC Override
          </button>
          {kycDropdown && (
            <div className="absolute bottom-full left-0 mb-1 bg-vault-card border border-vault-border rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
              {['VERIFIED', 'PREMIUM', 'INSTITUTIONAL', 'PENDING', 'NONE', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleKyc(s)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-vault-cardHover transition-colors ${
                    user.kycStatus === s ? 'text-gold-200 font-medium' : 'text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mint Tokens */}
        {wallet && (
          <button
            onClick={() => onMint(wallet.address)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-300/15 hover:bg-gold-300/25 border border-gold-300/20 rounded-lg text-xs font-medium text-gold-200 transition-colors"
          >
            <Coins className="w-3 h-3" />
            Mint
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// MINT MODAL
// ============================================
function MintModal({
  address,
  token,
  onClose,
  onSuccess,
}: {
  address: string
  token: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState('1000')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMint = async () => {
    setLoading(true)
    setError(null)
    try {
      const amountWei = (BigInt(Math.floor(parseFloat(amount) * 1e6)) * BigInt(1e12)).toString()
      const res = await adminApi.mintTokens(token, address, amountWei)
      setResult(`Minted ${amount} STTAURX. TX: ${res.tx_hash.slice(0, 16)}...`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-vault-base/95 flex items-center justify-center z-50 p-4">
      <div className="bg-vault-card rounded-2xl max-w-sm w-full border border-vault-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold-200" />
            <h2 className="text-lg font-bold text-white">Mint Tokens</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-vault-cardHover rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Address</label>
            <p className="text-sm text-gray-400 font-mono bg-vault-base rounded-lg px-3 py-2 truncate">
              {address}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount (STTAURX)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-vault-base border border-vault-border rounded-lg px-3 py-2.5 text-white text-lg font-bold focus:border-gold-300 focus:ring-1 focus:ring-gold-300 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-400 text-xs">{result}</p>
            </div>
          )}

          <button
            onClick={handleMint}
            disabled={loading || !amount}
            className="w-full py-3 bg-gold-300 hover:bg-gold-200 text-vault-base rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Banknote className="w-5 h-5" />}
            {loading ? 'Minting...' : `Mint ${amount} STTAURX`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN ADMIN DASHBOARD
// ============================================
export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<LoginResponse['user'] | null>(null)
  const [activeTab, setActiveTab] = useState<'tiers' | 'users'>('tiers')

  // Data
  const [tiers, setTiers] = useState<StakingTierConfig[]>([])
  const [stats, setStats] = useState<StakingStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mint modal
  const [mintAddress, setMintAddress] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [tiersData, statsData, usersData] = await Promise.all([
        adminApi.getTiers(token),
        adminApi.getStats(token),
        adminApi.getUsers(token),
      ])
      setTiers(tiersData.tiers)
      setStats(statsData)
      setUsers(usersData.users)
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes('expired') || err.message.includes('401')) {
        setToken(null)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogin = (accessToken: string, user: LoginResponse['user']) => {
    setToken(accessToken)
    setAdminUser(user)
  }

  const handleLogout = () => {
    setToken(null)
    setAdminUser(null)
    setTiers([])
    setUsers([])
    setStats(null)
  }

  const handleTierSave = async (tierName: string, apyRate: number, minStake: number) => {
    if (!token) return
    await adminApi.updateTier(token, tierName, { apyRate, minStake })
    await loadData()
  }

  const handleKycUpdate = async (userId: string, status: string) => {
    if (!token) return
    await adminApi.updateKycStatus(token, userId, status)
    await loadData()
  }

  // Not logged in
  if (!token) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Admin Header */}
      <div className="bg-vault-card rounded-2xl p-5 border border-vault-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-300/20 rounded-lg">
              <Shield className="w-6 h-6 text-gold-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Console</h1>
              <p className="text-xs text-gray-500">
                {adminUser?.email} ({adminUser?.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 hover:bg-vault-cardHover rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-vault-cardHover rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-vault-card rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Coins className="w-3.5 h-3.5" />
              Total Staked
            </div>
            <p className="text-lg font-bold text-white">{stats.totalStakedFormatted}</p>
          </div>
          <div className="bg-vault-card rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              Stakers
            </div>
            <p className="text-lg font-bold text-white">{stats.totalStakers}</p>
          </div>
          <div className="bg-vault-card rounded-xl p-4 border border-vault-border">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Yield Paid
            </div>
            <p className="text-lg font-bold text-emerald-400">{stats.totalAccumulatedYieldFormatted}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-vault-card rounded-xl p-1 border border-vault-border">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tiers'
              ? 'bg-gold-300/20 text-gold-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Staking Rates
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-gold-300/20 text-gold-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({users.length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Staking Tier Configuration</h2>
            <p className="text-xs text-gray-600">Changes apply to new stakes only</p>
          </div>
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onSave={handleTierSave} />
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500">User Management</h2>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onKycUpdate={handleKycUpdate}
              onMint={(addr) => setMintAddress(addr)}
            />
          ))}
        </div>
      )}

      {/* Mint Modal */}
      {mintAddress && token && (
        <MintModal
          address={mintAddress}
          token={token}
          onClose={() => setMintAddress(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
