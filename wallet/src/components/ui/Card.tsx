import { ReactNode } from 'react'

export type CardVariant = 'default' | 'gradient' | 'interactive'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-gray-800',
  gradient: 'bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg',
  interactive: 'bg-gray-800 hover:bg-gray-750 transition-colors border border-gray-700',
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'md',
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-xl'
  const variantStyle = variantStyles[variant]
  const paddingStyle = paddingStyles[padding]

  const combinedStyles = `${baseStyles} ${variantStyle} ${paddingStyle} ${className}`

  if (onClick) {
    return (
      <button onClick={onClick} className={`${combinedStyles} w-full text-left`}>
        {children}
      </button>
    )
  }

  return <div className={combinedStyles}>{children}</div>
}

// Subcomponents for structured card content
Card.Header = function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`font-semibold ${className}`}>{children}</h3>
}

Card.Divider = function CardDivider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-gray-700 my-4 ${className}`} />
}

Card.Row = function CardRow({
  label,
  value,
  valueClassName = '',
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  )
}
