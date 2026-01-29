/**
 * Centralized theme configuration
 * Change these values to update the entire app's appearance
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: 'yellow-50',
      100: 'yellow-100',
      200: 'yellow-200',
      400: 'yellow-400',
      500: 'yellow-500',
      600: 'yellow-600',
      700: 'yellow-700',
      800: 'yellow-800',
    },
    // Semantic colors
    success: {
      light: 'green-400',
      dark: 'green-500',
      bg: 'green-500/20',
    },
    danger: {
      light: 'red-400',
      dark: 'red-500',
      bg: 'red-500/20',
    },
    warning: {
      light: 'yellow-400',
      dark: 'yellow-500',
      bg: 'yellow-500/20',
    },
    info: {
      light: 'blue-400',
      dark: 'blue-500',
      bg: 'blue-500/20',
    },
    // Surface colors
    surface: {
      base: 'gray-900',
      card: 'gray-800',
      cardHover: 'gray-750',
      border: 'gray-700',
      borderLight: 'gray-600',
    },
    // Text colors
    text: {
      primary: 'white',
      secondary: 'gray-400',
      muted: 'gray-500',
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
  card: `bg-${theme.colors.surface.card} ${theme.radius.md} ${theme.spacing.card}`,
  cardLarge: `bg-${theme.colors.surface.card} ${theme.radius.lg} ${theme.spacing.cardLarge}`,
  cardInteractive: `bg-${theme.colors.surface.card} ${theme.radius.md} ${theme.spacing.card} hover:bg-gray-750 ${theme.transition.default} border border-${theme.colors.surface.border}`,

  // Buttons
  buttonPrimary: `bg-${theme.colors.primary[600]} hover:bg-${theme.colors.primary[700]} ${theme.radius.md} font-semibold ${theme.transition.default}`,
  buttonSecondary: `bg-${theme.colors.surface.card} hover:bg-gray-700 ${theme.radius.sm} ${theme.transition.default}`,

  // Text
  textPrimary: `text-${theme.colors.text.primary}`,
  textSecondary: `text-${theme.colors.text.secondary}`,
  textMuted: `text-${theme.colors.text.muted}`,

  // Icon badges
  iconBadge: `${theme.radius.full} flex items-center justify-center`,
} as const

// Semantic color mappings for transaction types
export const transactionColors = {
  mint: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    icon: 'text-yellow-400',
  },
  send: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  receive: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    icon: 'text-green-400',
  },
} as const

// Status color mappings
export const statusColors = {
  active: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/50',
  },
  pending: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/50',
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
    bg: 'bg-green-500/20',
    icon: 'text-green-400',
    hoverBorder: 'hover:border-green-500/50',
  },
  receive: {
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
    hoverBorder: 'hover:border-blue-500/50',
  },
  certificates: {
    bg: 'bg-yellow-500/20',
    icon: 'text-yellow-400',
    hoverBorder: 'hover:border-yellow-500/50',
  },
} as const
