'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from './OnboardingProvider'

// Confetti particle component
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB', '#3CB371']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = Math.random() * 10 + 5
  const duration = Math.random() * 2 + 2

  return (
    <div
      className="absolute w-2 h-2 rounded-sm animate-confetti"
      style={{
        left: `${x}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

export function WalletCreationSuccess() {
  const { state, completeOnboarding } = useOnboarding()
  const [showConfetti, setShowConfetti] = useState(true)
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; delay: number; x: number }[]>([])

  // Generate confetti particles
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      x: Math.random() * 100,
    }))
    setConfettiParticles(particles)

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleGetStarted = () => {
    completeOnboarding()
  }

  const walletAddress = state.generatedKeypair?.address || ''
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : ''

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((p) => (
            <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-md text-center relative z-10">
        {/* Animated success icon */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Glowing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 animate-pulse opacity-50 blur-lg"></div>

          {/* Main circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
            <svg className="w-14 h-14 text-white animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          🎉 Wallet Created Successfully!
        </h1>
        <p className="text-gray-400 mb-8">
          Your digital gold wallet is ready. You can now receive and hold gold-backed tokens.
        </p>

        {/* Wallet card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-8 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Your Wallet Address</span>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Active</span>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-amber-400 text-sm break-all">
            {shortAddress}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0.00</p>
              <p className="text-xs text-gray-500">GOLD Balance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">$0.00</p>
              <p className="text-xs text-gray-500">USD Value</p>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-8 text-left">
          <h3 className="text-white font-semibold mb-3">What's Next?</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">1</span>
              </div>
              <span>Fund your wallet with a deposit</span>
            </li>
            <li className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">2</span>
              </div>
              <span>Convert your deposit to gold-backed tokens</span>
            </li>
            <li className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">3</span>
              </div>
              <span>Track your gold holdings in real-time</span>
            </li>
          </ul>
        </div>

        {/* Get started button */}
        <button
          onClick={handleGetStarted}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-amber-500/25"
        >
          Start Using Your Wallet
        </button>

        {/* Security reminder */}
        <p className="text-gray-500 text-xs mt-6">
          Remember: Keep your secret key safe. It's the only way to recover your wallet.
        </p>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
