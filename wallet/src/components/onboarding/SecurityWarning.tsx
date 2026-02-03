'use client'

interface SecurityWarningProps {
  variant?: 'info' | 'warning' | 'critical'
  title?: string
  children: React.ReactNode
  className?: string
}

export function SecurityWarning({
  variant = 'warning',
  title,
  children,
  className = ''
}: SecurityWarningProps) {
  const variants = {
    info: {
      container: 'bg-blue-500/10 border-blue-500/30',
      icon: 'text-blue-400',
      title: 'text-blue-300',
      text: 'text-blue-200',
    },
    warning: {
      container: 'bg-amber-500/10 border-amber-500/30',
      icon: 'text-amber-400',
      title: 'text-amber-300',
      text: 'text-amber-200',
    },
    critical: {
      container: 'bg-red-500/10 border-red-500/30',
      icon: 'text-red-400',
      title: 'text-red-300',
      text: 'text-red-200',
    },
  }

  const styles = variants[variant]

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    critical: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className={`${styles.container} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} mt-0.5 flex-shrink-0`}>
          {icons[variant]}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className={`${styles.title} font-semibold mb-1`}>{title}</h4>
          )}
          <div className={`${styles.text} text-sm`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Pre-configured warning messages for common security scenarios
export function SecretKeyWarning() {
  return (
    <SecurityWarning variant="critical" title="Critical Security Information">
      <ul className="space-y-2 mt-2">
        <li className="flex items-start gap-2">
          <span className="text-red-400">•</span>
          <span>Your secret key is the ONLY way to access your wallet</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-400">•</span>
          <span>If you lose it, your gold tokens are gone forever</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-400">•</span>
          <span>Never share your secret key with anyone</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-400">•</span>
          <span>AU Gold Block will never ask for your secret key</span>
        </li>
      </ul>
    </SecurityWarning>
  )
}

export function BackupReminderWarning() {
  return (
    <SecurityWarning variant="warning" title="Backup Your Secret Key">
      <p>
        Write down your secret key on paper and store it in a safe place.
        Do not store it digitally where it could be hacked or lost.
      </p>
    </SecurityWarning>
  )
}

export function NeverShareWarning() {
  return (
    <SecurityWarning variant="info">
      <p>
        Your secret key is generated on your device and never sent to our servers.
        Only you have access to your funds.
      </p>
    </SecurityWarning>
  )
}
