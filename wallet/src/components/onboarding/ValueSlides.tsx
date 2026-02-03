'use client'

import { useEffect, useState } from 'react'
import { Coins, Building2, Shield, ChevronLeft, ChevronRight, Lock, Globe, TrendingUp } from 'lucide-react'
import { useOnboarding, OnboardingStep } from './OnboardingProvider'
import { ProgressIndicator } from './ProgressIndicator'

interface SlideData {
  step: OnboardingStep
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  description: string
  features: {
    icon: React.ReactNode
    text: string
  }[]
}

const slides: SlideData[] = [
  {
    step: 'value-1',
    icon: <Coins className="w-10 h-10" />,
    iconBg: 'from-yellow-500 to-yellow-600',
    title: 'Gold-Backed Tokens',
    subtitle: 'Real Gold, Digital Convenience',
    description: 'Each AU token represents ownership of physical gold stored in secure vaults. Combine the timeless value of gold with the flexibility of digital assets.',
    features: [
      { icon: <TrendingUp className="w-5 h-5" />, text: '1:1 backed by physical gold' },
      { icon: <Globe className="w-5 h-5" />, text: 'Trade 24/7, anywhere in the world' },
      { icon: <Lock className="w-5 h-5" />, text: 'No minimum investment required' },
    ],
  },
  {
    step: 'value-2',
    icon: <Building2 className="w-10 h-10" />,
    iconBg: 'from-blue-500 to-blue-600',
    title: 'Bank-Grade Custody',
    subtitle: 'Secured by HSBC Gold Vaults',
    description: 'Your gold is held in HSBC\'s world-class vault facilities. Every ounce is verified, audited, and insured for complete peace of mind.',
    features: [
      { icon: <Shield className="w-5 h-5" />, text: 'HSBC institutional-grade security' },
      { icon: <Globe className="w-5 h-5" />, text: 'Regular third-party audits' },
      { icon: <Lock className="w-5 h-5" />, text: 'Fully insured holdings' },
    ],
  },
  {
    step: 'value-3',
    icon: <Shield className="w-10 h-10" />,
    iconBg: 'from-green-500 to-green-600',
    title: 'Blockchain Security',
    subtitle: 'Transparent & Immutable',
    description: 'Every transaction is recorded on the blockchain, providing complete transparency and an immutable record of ownership that you control.',
    features: [
      { icon: <Lock className="w-5 h-5" />, text: 'You control your private keys' },
      { icon: <Globe className="w-5 h-5" />, text: 'Transparent on-chain certificates' },
      { icon: <TrendingUp className="w-5 h-5" />, text: 'Instant, low-cost transfers' },
    ],
  },
]

interface ValueSlideProps {
  slide: SlideData
}

function ValueSlide({ slide }: ValueSlideProps) {
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    setIsAnimated(false)
    const timer = setTimeout(() => setIsAnimated(true), 50)
    return () => clearTimeout(timer)
  }, [slide.step])

  return (
    <div className={`
      flex flex-col items-center text-center
      transition-all duration-500 ease-out
      ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
    `}>
      {/* Icon */}
      <div className={`
        relative mb-8 transition-all duration-700 delay-100
        ${isAnimated ? 'scale-100' : 'scale-75'}
      `}>
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.iconBg} rounded-full blur-xl opacity-30`} />
        <div className={`relative w-24 h-24 bg-gradient-to-br ${slide.iconBg} rounded-full flex items-center justify-center text-white shadow-lg`}>
          {slide.icon}
        </div>
      </div>

      {/* Title */}
      <h2 className={`
        text-3xl font-bold text-white mb-2 transition-all duration-500 delay-150
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {slide.title}
      </h2>

      {/* Subtitle */}
      <p className={`
        text-lg text-yellow-500 mb-4 transition-all duration-500 delay-200
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {slide.subtitle}
      </p>

      {/* Description */}
      <p className={`
        text-gray-400 mb-8 max-w-sm transition-all duration-500 delay-250
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {slide.description}
      </p>

      {/* Features */}
      <div className={`
        space-y-3 w-full max-w-sm transition-all duration-500 delay-300
        ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {slide.features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
          >
            <div className="text-yellow-500">
              {feature.icon}
            </div>
            <span className="text-gray-300 text-sm text-left">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ValueSlides() {
  const { state, nextStep, prevStep, skipOnboarding, completeOnboarding } = useOnboarding()

  const currentSlide = slides.find(s => s.step === state.currentStep)
  const isLastSlide = state.currentStep === 'value-3'
  const slideIndex = slides.findIndex(s => s.step === state.currentStep)

  if (!currentSlide) return null

  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding()
    } else {
      nextStep()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header with skip */}
      <div className="flex justify-end mb-8 relative z-10">
        <button
          onClick={skipOnboarding}
          className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <ValueSlide slide={currentSlide} />
      </div>

      {/* Navigation */}
      <div className="relative z-10 space-y-6 mt-8">
        {/* Progress indicator */}
        <ProgressIndicator />

        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={prevStep}
            disabled={slideIndex === 0}
            className={`
              flex-1 py-4 px-6 rounded-xl font-medium transition-all
              flex items-center justify-center gap-2
              ${slideIndex === 0
                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-semibold rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isLastSlide ? 'Get Started' : 'Next'}
            {!isLastSlide && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
