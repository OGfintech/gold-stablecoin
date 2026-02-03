'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Store,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Truck,
  DollarSign,
  Building2
} from 'lucide-react'
import { useAuth } from '@/app/providers'

export function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  const publicLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/commodities', label: 'Browse', icon: Store },
    { href: '/how-it-works', label: 'How It Works', icon: FileText },
  ]

  const supplierLinks = [
    { href: '/supplier', label: 'Dashboard', icon: Building2 },
    { href: '/supplier/listings', label: 'My Listings', icon: Package },
    { href: '/supplier/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/supplier/shipments', label: 'Shipments', icon: Truck },
    { href: '/supplier/payments', label: 'Payments', icon: DollarSign },
  ]

  const buyerLinks = [
    { href: '/buyer', label: 'Dashboard', icon: Building2 },
    { href: '/commodities', label: 'Browse', icon: Store },
    { href: '/buyer/orders', label: 'My Orders', icon: ShoppingCart },
    { href: '/buyer/payments', label: 'Payments', icon: DollarSign },
  ]

  const roleLinks = user?.role === 'supplier' ? supplierLinks : user?.role === 'buyer' ? buyerLinks : []

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/icon.svg" alt="STTAURX" className="w-10 h-10" />
            <span className="text-xl font-bold text-yellow-500">STTAURX</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-1">
            {/* Public links always visible */}
            {publicLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
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
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* Role-specific links */}
            {isAuthenticated && roleLinks.length > 0 && (
              <>
                <div className="w-px h-8 bg-gray-700 mx-2" />
                {roleLinks.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </>
            )}

            {/* Divider */}
            <div className="w-px h-8 bg-gray-700 mx-2" />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 hidden lg:block">
                  {user?.companyName || user?.address?.slice(0, 12)}...
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  user?.role === 'supplier' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {user?.role}
                </span>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login?role=supplier"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname.includes('supplier')
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden md:inline">Sell</span>
                </Link>
                <Link
                  href="/login?role=buyer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname.includes('buyer')
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden md:inline">Buy</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
