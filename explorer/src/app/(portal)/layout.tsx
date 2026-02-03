import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { Providers } from '../providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'STTAURX Security Terminal',
  description: 'Secure access to STTAURX Platform',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <Providers>
          {/* No Navigation - Full screen portal */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
