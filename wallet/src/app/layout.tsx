import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gold Wallet',
  description: 'Wallet for gold-backed stablecoin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <Providers>
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
