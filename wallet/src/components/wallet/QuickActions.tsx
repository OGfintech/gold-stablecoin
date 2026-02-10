import Link from 'next/link'
import { LucideIcon, Send, QrCode, FileText, Coins, Download, ArrowUpRight } from 'lucide-react'
import { IconBadge, IconBadgeColor } from '@/components/ui'

interface QuickAction {
  href?: string
  onClick?: () => void
  label: string
  icon: LucideIcon
  color: IconBadgeColor
}

const defaultActions: QuickAction[] = [
  {
    href: '/send',
    label: 'Send',
    icon: Send,
    color: 'success',
  },
  {
    href: '/receive',
    label: 'Receive',
    icon: QrCode,
    color: 'info',
  },
  {
    href: '/certificates',
    label: 'Certificates',
    icon: FileText,
    color: 'primary',
  },
]

// Actions with deposit option for main dashboard
export const dashboardActions: QuickAction[] = [
  {
    onClick: undefined, // Will be set by parent
    label: 'Deposit',
    icon: Coins,
    color: 'warning',
  },
  {
    onClick: undefined, // Will be set by parent
    label: 'Receive',
    icon: Download,
    color: 'info',
  },
  {
    onClick: undefined, // Will be set by parent
    label: 'Withdraw',
    icon: ArrowUpRight,
    color: 'danger',
  },
]

// Map colors to hover border colors
const hoverBorderColors: Record<IconBadgeColor, string> = {
  primary: 'hover:border-gold-300/50',
  success: 'hover:border-emerald-500/50',
  danger: 'hover:border-red-500/50',
  warning: 'hover:border-gold-300/50',
  info: 'hover:border-blue-500/50',
}

interface QuickActionsProps {
  actions?: QuickAction[]
  className?: string
  onDeposit?: () => void
  onReceive?: () => void
  onWithdraw?: () => void
}

export function QuickActions({
  actions = defaultActions,
  className = '',
  onDeposit,
  onReceive,
  onWithdraw,
}: QuickActionsProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {actions.map((action, index) => {
        const Icon = action.icon
        const hoverBorder = hoverBorderColors[action.color]

        // Handle click actions
        const handleClick = action.label === 'Deposit' ? onDeposit :
                           action.label === 'Receive' ? onReceive :
                           action.label === 'Withdraw' ? onWithdraw :
                           action.onClick

        // If it has an href and no click handler, use Link
        if (action.href && !handleClick) {
          return (
            <Link
              key={action.href || action.label}
              href={action.href}
              className={`
                bg-vault-card rounded-xl p-4
                flex flex-col items-center gap-2
                hover:bg-vault-cardHover transition-colors
                border border-vault-border
                ${hoverBorder}
              `}
            >
              <IconBadge color={action.color} size="lg">
                <Icon />
              </IconBadge>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          )
        }

        // Otherwise use button
        return (
          <button
            key={action.label}
            onClick={handleClick}
            className={`
              bg-gray-800 rounded-xl p-4
              flex flex-col items-center gap-2
              hover:bg-gray-750 transition-colors
              border border-gray-700
              ${hoverBorder}
            `}
          >
            <IconBadge color={action.color} size="lg">
              <Icon />
            </IconBadge>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
