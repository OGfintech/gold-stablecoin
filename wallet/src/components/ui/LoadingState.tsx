import { RefreshCw } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`p-8 text-center text-gray-400 ${className}`}>
      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
      <p>{message}</p>
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <RefreshCw className={`animate-spin ${className}`} />
  )
}
