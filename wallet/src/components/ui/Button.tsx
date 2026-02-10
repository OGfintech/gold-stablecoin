import { ReactNode, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  loading?: boolean
}

interface ButtonAsButtonProps extends ButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  href?: never
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gold-300 hover:bg-gold-200 text-vault-base',
  secondary: 'bg-vault-cardHover hover:bg-gray-700 text-white border border-vault-border',
  ghost: 'bg-transparent hover:bg-vault-card text-gray-400 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-4 text-sm',
  lg: 'py-4 px-6 text-base font-semibold',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]
  const widthStyle = fullWidth ? 'w-full' : ''

  const combinedStyles = `${baseStyles} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`

  const content = (
    <>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  )

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={combinedStyles}>
        {content}
      </Link>
    )
  }

  const { href, ...buttonProps } = props as ButtonAsButtonProps

  return (
    <button className={combinedStyles} disabled={loading} {...buttonProps}>
      {content}
    </button>
  )
}
