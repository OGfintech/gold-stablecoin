'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useOnboarding } from './OnboardingProvider'
import { ProgressIndicator } from './ProgressIndicator'

export function WelcomeScreen() {
  const { nextStep, skipOnboarding } = useOnboarding()
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className={`
        relative z-10 flex flex-col items-center text-center max-w-md
        transition-all duration-1000 ease-out
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        {/* Animated Logo */}
        <div className={`
          relative mb-8 transition-all duration-1000 delay-200
          ${isAnimated ? 'scale-100' : 'scale-75'}
        `}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full blur-2xl opacity-30 animate-pulse" />

          {/* Logo circle */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/20">
            <div className="w-28 h-28 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                AU
              </span>
            </div>
          </div>

          {/* Sparkle decorations */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-3 w-4 h-4 text-yellow-500 animate-pulse delay-150" />
        </div>

        {/* Title */}
        <h1 className={`
          text-4xl font-bold mb-4 transition-all duration-700 delay-300
          ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            AU Gold Block
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`
          text-xl text-gray-400 mb-2 transition-all duration-700 delay-400
          ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          Digital Gold, Real Value
        </p>

        {/* Description */}
        <p className={`
          text-gray-500 mb-12 transition-all duration-700 delay-500
          ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          Your gateway to gold-backed digital assets secured on the blockchain
        </p>

        {/* Progress indicator */}
        <div className={`
          mb-8 transition-all duration-700 delay-600
          ${isAnimated ? 'opacity-100' : 'opacity-0'}
        `}>
          <ProgressIndicator />
        </div>

        {/* CTA Button */}
        <button
          onClick={nextStep}
          className={`
            w-full py-4 px-8 bg-gradient-to-r from-yellow-500 to-yellow-600
            hover:from-yellow-400 hover:to-yellow-500
            text-gray-900 font-semibold rounded-xl
            shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30
            transition-all duration-300 transform hover:scale-[1.02]
            ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: '700ms' }}
        >
          Get Started
        </button>

        {/* Skip option */}
        <button
          onClick={skipOnboarding}
          className={`
            mt-4 text-gray-500 hover:text-gray-400 text-sm transition-colors
            ${isAnimated ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ transitionDelay: '800ms' }}
        >
          Skip introduction
        </button>
      </div>

      {/* Bottom decorative line */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent
        transition-opacity duration-1000 delay-1000
        ${isAnimated ? 'opacity-100' : 'opacity-0'}
      `} />
    </div>
  )
}
