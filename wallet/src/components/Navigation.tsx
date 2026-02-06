'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Send, QrCode, FileText, History, Shield } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Wallet },
  { href: '/send', label: 'Send', icon: Send },
  { href: '/receive', label: 'Receive', icon: QrCode },
  { href: '/certificates', label: 'Gold', icon: FileText },
  { href: '/history', label: 'History', icon: History },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Header */}
      <header className="p-4 border-b border-vault-border">
        <div className="flex items-center justify-between">
          <div className="w-8" />
          <div className="flex items-center space-x-2">
            <img src="/icon.svg" alt="STTAURX" className="w-10 h-10" />
            <span className="text-xl font-bold text-gold-300">STTAURX Wallet</span>
          </div>
          <Link
            href="/admin"
            className={`p-2 rounded-lg transition-colors ${
              pathname === '/admin' ? 'text-gold-300 bg-gold-300/10' : 'text-gray-600 hover:text-gray-400'
            }`}
            title="Admin Panel"
          >
            <Shield className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-vault-card border-t border-vault-border max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                  isActive
                    ? 'text-gold-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
