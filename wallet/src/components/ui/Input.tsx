import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  error?: string
  className?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-gray-400 text-sm mb-1">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-gray-700 rounded-lg px-4 py-3 text-sm
            border border-gray-600
            focus:border-yellow-500 focus:outline-none
            placeholder:text-gray-500
            transition-colors
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
