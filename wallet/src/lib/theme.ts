/**
 * Centralized theme configuration
 * Dark mode + gold accents — "high-tech bank" aesthetic
 */

export const theme = {
  colors: {
    // Primary brand colors (gold)
    primary: {
      50: 'gold-50',
      100: 'gold-100',
      200: 'gold-200',
      300: 'gold-300',
      400: 'gold-400',
      500: 'gold-500',
      600: 'gold-600',
      700: 'gold-700',
      800: 'gold-800',
    },
    // Semantic colors
    success: {
      light: 'emerald-400',
      dark: 'emerald-500',
      bg: 'emerald-500/20',
    },
    danger: {
      light: 'red-400',
      dark: 'red-500',
      bg: 'red-500/20',
    },
    warning: {
      light: 'amber-400',
      dark: 'amber-500',
      bg: 'amber-500/20',
    },
    info: {
      light: 'blue-400',
      dark: 'blue-500',
      bg: 'blue-500/20',
    },
    // Surface colors (vault dark theme)
    surface: {
      base: 'vault-base',
      card: 'vault-card',
      cardHover: 'vault-cardHover',
      modal: 'vault-modal',
      border: 'vault-border',
      borderLight: 'gold-300/15',
    },
    // Text colors
    text: {
      primary: 'gray-50',
      secondary: 'gray-400',
      muted: 'gray-500',
      gold: 'gold-100',
    },
  },

  // Border radius values
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Spacing scale
  spacing: {
    card: 'p-4',
    cardLarge: 'p-6',
    section: 'space-y-6',
    stack: 'space-y-4',
    inline: 'gap-2',
    inlineLarge: 'gap-3',
  },

  // Icon sizes
  iconSize: {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    badge: 'w-10 h-10',
    badgeLarge: 'w-12 h-12',
    hero: 'w-16 h-16',
  },

  // Typography
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '4xl': 'text-4xl',
  },

  // Transitions
  transition: {
    default: 'transition-colors',
    all: 'transition-all',
    duration: 'duration-200',
  },
} as const

// Pre-composed class strings for common patterns
export const styles = {
  // Cards
  card: `bg-vault-card rounded-xl p-4`,
  cardLarge: `bg-vault-card rounded-2xl p-6`,
  cardInteractive: `bg-vault-card rounded-xl p-4 hover:bg-vault-cardHover transition-colors border border-vault-border`,

  // Buttons
  buttonPrimary: `bg-gold-300 hover:bg-gold-200 text-vault-base rounded-xl font-semibold transition-colors`,
  buttonSecondary: `bg-vault-card hover:bg-vault-cardHover rounded-lg transition-colors border border-vault-border`,

  // Text
  textPrimary: `text-gray-50`,
  textSecondary: `text-gray-400`,
  textMuted: `text-gray-500`,
  textGold: `text-gold-100`,

  // Icon badges
  iconBadge: `rounded-full flex items-center justify-center`,
} as const

// Semantic color mappings for transaction types
export const transactionColors = {
  mint: {
    bg: 'bg-gold-300/20',
    text: 'text-gold-200',
    icon: 'text-gold-200',
  },
  send: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  receive: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
} as const

// Status color mappings
export const statusColors = {
  active: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50',
  },
  pending: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/50',
  },
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/50',
  },
  info: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/50',
  },
} as const

// Action button color mappings
export const actionColors = {
  send: {
    bg: 'bg-emerald-500/20',
    icon: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/50',
  },
  receive: {
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
    hoverBorder: 'hover:border-blue-500/50',
  },
  certificates: {
    bg: 'bg-gold-300/20',
    icon: 'text-gold-200',
    hoverBorder: 'hover:border-gold-300/50',
  },
} as const
