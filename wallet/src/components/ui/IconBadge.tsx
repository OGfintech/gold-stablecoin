import { ReactNode } from 'react'

export type IconBadgeColor = 'primary' | 'success' | 'danger' | 'warning' | 'info'
export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl'

interface IconBadgeProps {
  children: ReactNode
  color?: IconBadgeColor
  size?: IconBadgeSize
  className?: string
}

const colorStyles: Record<IconBadgeColor, { bg: string; icon: string }> = {
  primary: {
    bg: 'bg-gold-300/20',
    icon: 'text-gold-200',
  },
  success: {
    bg: 'bg-emerald-500/20',
    icon: 'text-emerald-400',
  },
  danger: {
    bg: 'bg-red-500/20',
    icon: 'text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/20',
    icon: 'text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
  },
}

const sizeStyles: Record<IconBadgeSize, { container: string; icon: string }> = {
  sm: {
    container: 'w-8 h-8',
    icon: '[&>svg]:w-4 [&>svg]:h-4',
  },
  md: {
    container: 'w-10 h-10',
    icon: '[&>svg]:w-5 [&>svg]:h-5',
  },
  lg: {
    container: 'w-12 h-12',
    icon: '[&>svg]:w-5 [&>svg]:h-5',
  },
  xl: {
    container: 'w-16 h-16',
    icon: '[&>svg]:w-8 [&>svg]:h-8',
  },
}

export function IconBadge({
  children,
  color = 'primary',
  size = 'md',
  className = '',
}: IconBadgeProps) {
  const colorStyle = colorStyles[color]
  const sizeStyle = sizeStyles[size]

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        ${colorStyle.bg}
        ${sizeStyle.container}
        ${sizeStyle.icon}
        ${colorStyle.icon}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Convenience wrapper for gradient backgrounds (like hero icons)
export function GradientBadge({
  children,
  size = 'xl',
  className = '',
}: {
  children: ReactNode
  size?: IconBadgeSize
  className?: string
}) {
  const sizeStyle = sizeStyles[size]

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        bg-gradient-to-br from-[#D4A843] to-[#C5963B]
        ${sizeStyle.container}
        ${sizeStyle.icon}
        text-vault-base
        ${className}
      `}
    >
      {children}
    </div>
  )
}
