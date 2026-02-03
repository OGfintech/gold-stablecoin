'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Blocks, ArrowRightLeft, FileText, Settings, BookOpen, Users, LogIn, LogOut, Wallet, Home, Shield } from 'lucide-react'
import { useAuth } from '@/app/providers'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/blocks', label: 'Blocks', icon: Blocks },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/certificates', label: 'Certificates', icon: FileText },
  { href: '/admin', label: 'Admin', icon: Settings },
  { href: '/admin/buckets', label: 'Buckets', icon: Users },
  { href: '/admin/security', label: 'Security', icon: Shield },
  { href: '/docs', label: 'Docs', icon: BookOpen },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/icon.svg" alt="STTAURX" className="w-10 h-10" />
              <span className="text-xl font-bold text-yellow-500">STTAURX</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* Divider */}
            <div className="w-px h-8 bg-gray-700 mx-2" />

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/my-transactions"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/my-transactions'
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm">
                    {user?.address?.slice(0, 6)}...
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/login'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden lg:inline">Connect</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
