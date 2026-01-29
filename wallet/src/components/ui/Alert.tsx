import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
  showIcon?: boolean
}

const variantStyles: Record<AlertVariant, { bg: string; text: string; icon: typeof AlertCircle }> = {
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: AlertCircle,
  },
  success: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    icon: Info,
  },
}

export function Alert({
  variant = 'info',
  children,
  className = '',
  showIcon = true,
}: AlertProps) {
  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div
      className={`
        ${styles.bg} ${styles.text}
        px-4 py-3 rounded-lg
        flex items-start gap-2
        ${className}
      `}
    >
      {showIcon && <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 text-sm">{children}</div>
    </div>
  )
}
