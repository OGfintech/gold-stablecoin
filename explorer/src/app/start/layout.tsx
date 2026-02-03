import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'STTAURX Security Terminal',
  description: 'Secure access to STTAURX Platform',
}

export default function StartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simple wrapper - the page itself handles full-screen positioning
  return <>{children}</>
}
