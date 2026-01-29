import Link from 'next/link'
import { LucideIcon, Send, QrCode, FileText } from 'lucide-react'
import { IconBadge, IconBadgeColor } from '@/components/ui'

interface QuickAction {
  href: string
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

// Map colors to hover border colors
const hoverBorderColors: Record<IconBadgeColor, string> = {
  primary: 'hover:border-yellow-500/50',
  success: 'hover:border-green-500/50',
  danger: 'hover:border-red-500/50',
  warning: 'hover:border-yellow-500/50',
  info: 'hover:border-blue-500/50',
}

interface QuickActionsProps {
  actions?: QuickAction[]
  className?: string
}

export function QuickActions({
  actions = defaultActions,
  className = '',
}: QuickActionsProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon
        const hoverBorder = hoverBorderColors[action.color]

        return (
          <Link
            key={action.href}
            href={action.href}
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
          </Link>
        )
      })}
    </div>
  )
}
