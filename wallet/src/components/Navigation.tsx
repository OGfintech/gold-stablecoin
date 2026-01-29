'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Send, QrCode, FileText, History } from 'lucide-react'

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
      <header className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">Au</span>
          </div>
          <span className="text-xl font-bold text-yellow-500">Gold Wallet</span>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 max-w-md mx-auto">
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
                    ? 'text-yellow-500'
                    : 'text-gray-400 hover:text-white'
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
