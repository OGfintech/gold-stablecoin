'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, AlertTriangle, Activity, Globe, Server, Lock, Database,
  Eye, RefreshCw, ExternalLink, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Clock, Zap, Users, TrendingUp, ArrowLeft, Settings, Play, Pause,
  X, Ban, MapPin, Filter, Download, Search, ChevronRight, AlertCircle
} from 'lucide-react'

// Types for detailed data
interface SecurityEvent {
  id: string
  timestamp: Date
  type: string
  ip: string
  country: string
  countryCode: string
  city?: string
  userAgent?: string
  endpoint?: string
  status: 'blocked' | 'allowed' | 'flagged'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: string
}

interface BlockedIP {
  ip: string
  reason: string
  blockedAt: Date
  expiresAt?: Date
  permanent: boolean
}

interface BlockedRegion {
  code: string
  name: string
  blockedAt: Date
  reason: string
}

// Generate mock security events
const generateMockEvents = (type: string, count: number): SecurityEvent[] => {
  const countries = [
    { name: 'China', code: 'CN', cities: ['Beijing', 'Shanghai', 'Shenzhen'] },
    { name: 'Russia', code: 'RU', cities: ['Moscow', 'St. Petersburg'] },
    { name: 'United States', code: 'US', cities: ['New York', 'Los Angeles', 'Chicago'] },
    { name: 'Brazil', code: 'BR', cities: ['São Paulo', 'Rio de Janeiro'] },
    { name: 'India', code: 'IN', cities: ['Mumbai', 'Delhi', 'Bangalore'] },
    { name: 'Germany', code: 'DE', cities: ['Berlin', 'Munich', 'Frankfurt'] },
    { name: 'South Korea', code: 'KR', cities: ['Seoul', 'Busan'] },
    { name: 'Nigeria', code: 'NG', cities: ['Lagos', 'Abuja'] },
  ]

  const endpoints = ['/api/auth/login', '/api/admin/users', '/api/staking/stake', '/api/transactions', '/api/wallets']
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'curl/7.68.0',
    'python-requests/2.28.0',
    'Scrapy/2.6.1',
    'Mozilla/5.0 (compatible; Googlebot/2.1)',
  ]

  return Array.from({ length: count }, (_, i) => {
    const country = countries[Math.floor(Math.random() * countries.length)]
    const minutesAgo = Math.floor(Math.random() * 120)

    return {
      id: `evt-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
      type,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: country.name,
      countryCode: country.code,
      city: country.cities[Math.floor(Math.random() * country.cities.length)],
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      status: Math.random() > 0.1 ? 'blocked' : 'flagged',
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
      details: type === 'Failed Login' ? 'Invalid credentials' : type === 'Rate Limit' ? 'Exceeded 100 req/min' : undefined,
    }
  })
}

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg'
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl' | 'full'
}) {
  if (!isOpen) return null

  const sizeClasses = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-gray-800 rounded-2xl border border-gray-700 w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Security Events Detail Modal
function SecurityEventsModal({
  isOpen,
  onClose,
  title,
  eventType,
  events,
  onBlockIP,
  onBlockRegion
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  eventType: string
  events: SecurityEvent[]
  onBlockIP: (ip: string, reason: string) => void
  onBlockRegion: (code: string, name: string, reason: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')

  // Get unique countries from events
  const countries = [...new Set(events.map(e => e.country))].sort()

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' ||
      event.ip.includes(searchTerm) ||
      event.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCountry = filterCountry === '' || event.country === filterCountry
    const matchesSeverity = filterSeverity === '' || event.severity === filterSeverity
    return matchesSearch && matchesCountry && matchesSeverity
  })

  // Group by country for stats
  const countryStats = events.reduce((acc, event) => {
    if (!acc[event.country]) {
      acc[event.country] = { count: 0, code: event.countryCode }
    }
    acc[event.country].count++
    return acc
  }, {} as Record<string, { count: number; code: string }>)

  const sortedCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b.count - a.count)

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Events</p>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Blocked</p>
            <p className="text-2xl font-bold text-green-400">
              {events.filter(e => e.status === 'blocked').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Unique IPs</p>
            <p className="text-2xl font-bold text-yellow-400">
              {new Set(events.map(e => e.ip)).size}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Countries</p>
            <p className="text-2xl font-bold text-purple-400">
              {Object.keys(countryStats).length}
            </p>
          </div>
        </div>

        {/* Top Attacking Countries */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            Top Attack Origins
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sortedCountries.slice(0, 8).map(([country, stats]) => (
              <div
                key={country}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCountryFlag(stats.code)}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{country}</p>
                    <p className="text-gray-500 text-xs">{stats.count} events</p>
                  </div>
                </div>
                <button
                  onClick={() => onBlockRegion(stats.code, country, `High attack volume from ${country}`)}
                  className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title={`Block all traffic from ${country}`}
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search IP, country, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Events Table */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Time</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">IP Address</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Location</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Endpoint</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Severity</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 50).map((event) => (
                  <tr key={event.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <p className="text-white text-sm">{formatTime(event.timestamp)}</p>
                      <p className="text-gray-500 text-xs">{event.timestamp.toLocaleTimeString()}</p>
                    </td>
                    <td className="p-4">
                      <code className="text-yellow-400 text-sm bg-gray-800 px-2 py-1 rounded">
                        {event.ip}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span>{getCountryFlag(event.countryCode)}</span>
                        <div>
                          <p className="text-white text-sm">{event.country}</p>
                          {event.city && <p className="text-gray-500 text-xs">{event.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-gray-400 text-sm">{event.endpoint}</code>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${severityColors[event.severity]}`}>
                        {event.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.status === 'blocked' ? 'bg-green-500/20 text-green-400' :
                        event.status === 'flagged' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onBlockIP(event.ip, `${event.type} from ${event.country}`)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
                      >
                        <Ban className="w-3 h-3" />
                        Block IP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEvents.length > 50 && (
            <div className="p-4 text-center text-gray-500 border-t border-gray-800">
              Showing 50 of {filteredEvents.length} events
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// Blocked IPs Modal
function BlockedIPsModal({
  isOpen,
  onClose,
  blockedIPs,
  onUnblock
}: {
  isOpen: boolean
  onClose: () => void
  blockedIPs: BlockedIP[]
  onUnblock: (ip: string) => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Blocked IP Addresses" size="lg">
      <div className="space-y-4">
        {blockedIPs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No IP addresses are currently blocked</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedIPs.map((blocked) => (
              <div
                key={blocked.ip}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-lg"
              >
                <div>
                  <code className="text-red-400 font-medium">{blocked.ip}</code>
                  <p className="text-gray-500 text-sm mt-1">{blocked.reason}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Blocked: {blocked.blockedAt.toLocaleString()}
                    {blocked.permanent ? ' (Permanent)' : blocked.expiresAt ? ` • Expires: ${blocked.expiresAt.toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => onUnblock(blocked.ip)}
                  className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// Blocked Regions Modal
function BlockedRegionsModal({
  isOpen,
  onClose,
  blockedRegions,
  onUnblockRegion
}: {
  isOpen: boolean
  onClose: () => void
  blockedRegions: BlockedRegion[]
  onUnblockRegion: (code: string) => void
}) {
  const allRegions = [
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'KP', name: 'North Korea' },
    { code: 'IR', name: 'Iran' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'VN', name: 'Vietnam' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Region Blocking" size="lg">
      <div className="space-y-6">
        {/* Currently Blocked */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Currently Blocked Regions</h3>
          {blockedRegions.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 rounded-xl">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No regions are currently blocked</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {blockedRegions.map((region) => (
                <div
                  key={region.code}
                  className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCountryFlag(region.code)}</span>
                    <div>
                      <p className="text-white font-medium">{region.name}</p>
                      <p className="text-red-400 text-xs">{region.reason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUnblockRegion(region.code)}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Block */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Block High-Risk Regions</h3>
          <div className="grid grid-cols-2 gap-3">
            {allRegions.filter(r => !blockedRegions.find(br => br.code === r.code)).map((region) => (
              <button
                key={region.code}
                className="flex items-center justify-between p-4 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCountryFlag(region.code)}</span>
                  <span className="text-white">{region.name}</span>
                </div>
                <Ban className="w-5 h-5 text-gray-600 group-hover:text-red-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Warning</p>
              <p className="text-gray-400 text-sm mt-1">
                Blocking entire regions will prevent all legitimate users from those countries from accessing your platform.
                Consider using rate limiting and IP-based blocking instead for more targeted protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Country flag helper
function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    CN: '🇨🇳', RU: '🇷🇺', US: '🇺🇸', BR: '🇧🇷', IN: '🇮🇳',
    DE: '🇩🇪', KR: '🇰🇷', NG: '🇳🇬', KP: '🇰🇵', IR: '🇮🇷',
    VN: '🇻🇳', GB: '🇬🇧', FR: '🇫🇷', JP: '🇯🇵', AU: '🇦🇺',
  }
  return flags[code] || '🌍'
}

// Simulated security metrics with event data
const useSecurityMetrics = () => {
  const [metrics, setMetrics] = useState({
    requestsPerMinute: 127,
    blockedRequests: 3,
    activeConnections: 42,
    failedLogins: 1,
    suspiciousIPs: 0,
    rateLimitHits: 12,
    sqlInjectionAttempts: 5,
    xssAttempts: 3,
  })

  const [events] = useState({
    requests: generateMockEvents('Request', 100),
    blocked: generateMockEvents('Blocked', 25),
    connections: generateMockEvents('Connection', 42),
    failedLogins: generateMockEvents('Failed Login', 15),
    suspiciousIPs: generateMockEvents('Suspicious', 8),
    rateLimit: generateMockEvents('Rate Limit', 30),
    sqlInjection: generateMockEvents('SQL Injection', 12),
    xss: generateMockEvents('XSS Attempt', 8),
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        requestsPerMinute: Math.floor(Math.random() * 100) + 80,
        blockedRequests: Math.floor(Math.random() * 8),
        activeConnections: Math.floor(Math.random() * 50) + 20,
        failedLogins: Math.floor(Math.random() * 5),
        suspiciousIPs: Math.floor(Math.random() * 3),
        rateLimitHits: Math.floor(Math.random() * 20) + 5,
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return { metrics, events }
}

// Status badge component
function StatusBadge({ status }: { status: 'secure' | 'warning' | 'critical' }) {
  const colors = {
    secure: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const icons = {
    secure: CheckCircle,
    warning: AlertTriangle,
    critical: XCircle,
  }

  const Icon = icons[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${colors[status]}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Clickable Metric card component
function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  status,
  onClick,
  clickable = false
}: {
  title: string
  value: string | number
  icon: any
  change?: string
  status?: 'secure' | 'warning' | 'critical'
  onClick?: () => void
  clickable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-xl p-4 border border-gray-700 transition-all ${
        clickable
          ? 'cursor-pointer hover:border-yellow-500/50 hover:bg-gray-750 group'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 transition-colors" />
        {status && <StatusBadge status={status} />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-gray-400 text-sm">{title}</p>
        {clickable && (
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 transition-colors" />
        )}
        {change && (
          <span className={`text-xs ${change.startsWith('+') ? 'text-red-400' : 'text-green-400'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

// Collapsible section
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge
}: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {badge}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-gray-700">{children}</div>}
    </div>
  )
}

// Kaspersky Threat Map Component
function KasperskyThreatMap() {
  const [mapConfig, setMapConfig] = useState({
    theme: 'dark' as 'dark' | 'light',
    height: 450,
    lang: 'en'
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  const widgetUrl = `https://cybermap.kaspersky.com/widget/dynamic/${mapConfig.theme}?lang=${mapConfig.lang}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Powered by</span>
          <span className="text-green-400 font-semibold">Kaspersky</span>
        </div>
      </div>

      {showConfig && (
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Theme</label>
              <select
                value={mapConfig.theme}
                onChange={(e) => setMapConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select
                value={mapConfig.lang}
                onChange={(e) => setMapConfig(prev => ({ ...prev, lang: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={mapConfig.height}
                onChange={(e) => setMapConfig(prev => ({ ...prev, height: parseInt(e.target.value) || 450 }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur rounded-full">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-white">{isPlaying ? 'LIVE THREATS' : 'PAUSED'}</span>
        </div>

        <iframe
          src={widgetUrl}
          width="100%"
          height={mapConfig.height}
          frameBorder="0"
          title="Kaspersky Cyberthreat Real-Time Map"
          style={{ display: isPlaying ? 'block' : 'none', minHeight: '450px' }}
        />

        {!isPlaying && (
          <div className="flex items-center justify-center bg-gray-900" style={{ height: mapConfig.height }}>
            <div className="text-center">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Threat map paused</p>
              <button
                onClick={() => setIsPlaying(true)}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                Resume Live View
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-gray-500 text-sm">Data provided by Kaspersky Security Network</p>
        <a
          href="https://cybermap.kaspersky.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
        >
          Full Screen Map <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

// Checklist item
function ChecklistItem({ label, checked, critical }: { label: string; checked: boolean; critical?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-5 h-5 rounded flex items-center justify-center ${
        checked ? 'bg-green-500/20' : critical ? 'bg-red-500/20' : 'bg-gray-700'
      }`}>
        {checked ? <CheckCircle className="w-4 h-4 text-green-400" /> : <div className={`w-2 h-2 rounded-full ${critical ? 'bg-red-500' : 'bg-gray-500'}`} />}
      </div>
      <span className={checked ? 'text-gray-400' : 'text-white'}>{label}</span>
      {critical && !checked && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Critical</span>}
    </div>
  )
}

// Main Component
export default function SecurityDashboardPage() {
  const { metrics, events } = useSecurityMetrics()

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([
    { ip: '192.168.1.100', reason: 'Brute force attack', blockedAt: new Date(Date.now() - 3600000), permanent: false, expiresAt: new Date(Date.now() + 86400000) },
    { ip: '10.0.0.55', reason: 'SQL Injection attempt', blockedAt: new Date(Date.now() - 7200000), permanent: true },
  ])
  const [blockedRegions, setBlockedRegions] = useState<BlockedRegion[]>([])

  const handleBlockIP = (ip: string, reason: string) => {
    if (!blockedIPs.find(b => b.ip === ip)) {
      setBlockedIPs([...blockedIPs, {
        ip,
        reason,
        blockedAt: new Date(),
        permanent: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }])
      alert(`IP ${ip} has been blocked for 24 hours`)
    }
  }

  const handleUnblockIP = (ip: string) => {
    setBlockedIPs(blockedIPs.filter(b => b.ip !== ip))
  }

  const handleBlockRegion = (code: string, name: string, reason: string) => {
    if (!blockedRegions.find(r => r.code === code)) {
      setBlockedRegions([...blockedRegions, {
        code,
        name,
        blockedAt: new Date(),
        reason
      }])
      alert(`All traffic from ${name} has been blocked`)
    }
  }

  const handleUnblockRegion = (code: string) => {
    setBlockedRegions(blockedRegions.filter(r => r.code !== code))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-green-500" />
              Security Monitoring Center
            </h1>
            <p className="text-gray-400">Click any metric to view details and take action</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('blockedIPs')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Ban className="w-4 h-4 text-red-400" />
            <span>Blocked IPs ({blockedIPs.length})</span>
          </button>
          <button
            onClick={() => setActiveModal('blockedRegions')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 text-orange-400" />
            <span>Regions ({blockedRegions.length})</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Protected</span>
          </div>
        </div>
      </div>

      {/* Clickable Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MetricCard
          title="Requests/min"
          value={metrics.requestsPerMinute}
          icon={Activity}
          status="secure"
          clickable
          onClick={() => setActiveModal('requests')}
        />
        <MetricCard
          title="Blocked"
          value={metrics.blockedRequests}
          icon={Shield}
          status={metrics.blockedRequests > 5 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('blocked')}
        />
        <MetricCard
          title="Connections"
          value={metrics.activeConnections}
          icon={Users}
          clickable
          onClick={() => setActiveModal('connections')}
        />
        <MetricCard
          title="Failed Logins"
          value={metrics.failedLogins}
          icon={Lock}
          status={metrics.failedLogins > 3 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('failedLogins')}
        />
        <MetricCard
          title="Suspicious IPs"
          value={metrics.suspiciousIPs}
          icon={AlertTriangle}
          status={metrics.suspiciousIPs > 0 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('suspiciousIPs')}
        />
        <MetricCard
          title="Rate Limits"
          value={metrics.rateLimitHits}
          icon={Zap}
          status={metrics.rateLimitHits > 15 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('rateLimit')}
        />
        <MetricCard
          title="SQL Injection"
          value={metrics.sqlInjectionAttempts}
          icon={Database}
          status={metrics.sqlInjectionAttempts > 0 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('sqlInjection')}
        />
        <MetricCard
          title="XSS Attempts"
          value={metrics.xssAttempts}
          icon={AlertCircle}
          status={metrics.xssAttempts > 0 ? 'warning' : 'secure'}
          clickable
          onClick={() => setActiveModal('xss')}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CollapsibleSection
            title="Kaspersky Global Threat Map"
            icon={Globe}
            badge={<span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs ml-2">LIVE</span>}
          >
            <KasperskyThreatMap />
          </CollapsibleSection>
        </div>

        <div className="space-y-4">
          <CollapsibleSection title="Protection Status" icon={Shield}>
            <div className="space-y-1">
              <ChecklistItem label="Rate Limiting Active" checked={true} />
              <ChecklistItem label="DDoS Protection" checked={true} />
              <ChecklistItem label="SQL Injection Filter" checked={true} />
              <ChecklistItem label="NoSQL Injection Filter" checked={true} />
              <ChecklistItem label="XSS Protection" checked={true} />
              <ChecklistItem label="CSRF Tokens" checked={false} critical />
              <ChecklistItem label="Security Headers" checked={true} />
              <ChecklistItem label="IP Blocklist Active" checked={blockedIPs.length > 0} />
              <ChecklistItem label="Region Blocking" checked={blockedRegions.length > 0} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Quick Actions" icon={Zap}>
            <div className="space-y-2">
              <button
                onClick={() => setActiveModal('blockedIPs')}
                className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-750 rounded-lg transition-colors"
              >
                <Ban className="w-5 h-5 text-red-400" />
                <span>Manage Blocked IPs</span>
              </button>
              <button
                onClick={() => setActiveModal('blockedRegions')}
                className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-750 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5 text-orange-400" />
                <span>Manage Region Blocking</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-750 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                <span>Refresh Blocklists</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Emergency Lockdown</span>
              </button>
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Event Detail Modals */}
      <SecurityEventsModal
        isOpen={activeModal === 'requests'}
        onClose={() => setActiveModal(null)}
        title="Request Activity Details"
        eventType="Request"
        events={events.requests}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'blocked'}
        onClose={() => setActiveModal(null)}
        title="Blocked Requests Details"
        eventType="Blocked"
        events={events.blocked}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'connections'}
        onClose={() => setActiveModal(null)}
        title="Active Connections Details"
        eventType="Connection"
        events={events.connections}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'failedLogins'}
        onClose={() => setActiveModal(null)}
        title="Failed Login Attempts"
        eventType="Failed Login"
        events={events.failedLogins}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'suspiciousIPs'}
        onClose={() => setActiveModal(null)}
        title="Suspicious IP Activity"
        eventType="Suspicious"
        events={events.suspiciousIPs}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'rateLimit'}
        onClose={() => setActiveModal(null)}
        title="Rate Limit Violations"
        eventType="Rate Limit"
        events={events.rateLimit}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'sqlInjection'}
        onClose={() => setActiveModal(null)}
        title="SQL Injection Attempts"
        eventType="SQL Injection"
        events={events.sqlInjection}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />
      <SecurityEventsModal
        isOpen={activeModal === 'xss'}
        onClose={() => setActiveModal(null)}
        title="XSS Attack Attempts"
        eventType="XSS"
        events={events.xss}
        onBlockIP={handleBlockIP}
        onBlockRegion={handleBlockRegion}
      />

      {/* IP and Region Management Modals */}
      <BlockedIPsModal
        isOpen={activeModal === 'blockedIPs'}
        onClose={() => setActiveModal(null)}
        blockedIPs={blockedIPs}
        onUnblock={handleUnblockIP}
      />
      <BlockedRegionsModal
        isOpen={activeModal === 'blockedRegions'}
        onClose={() => setActiveModal(null)}
        blockedRegions={blockedRegions}
        onUnblockRegion={handleUnblockRegion}
      />
    </div>
  )
}
