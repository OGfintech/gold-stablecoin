'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Shield,
  Lock,
  KeyRound,
  Fingerprint,
  FileText,
  Link2,
  Zap,
  Search,
  CheckCircle,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'

// ============================================
// CONFIGURATION - Easy to modify
// ============================================
const CONFIG = {
  // Activation
  KEYBOARD_SHORTCUT: { ctrl: true, shift: true, key: 'A' },
  VOICE_PHRASE: 'initialize sttaurx alpha g',

  // Password
  PASSWORD: 'AUTrade88',

  // Timing (milliseconds)
  ICON_INTERVAL: 500,      // Time between each icon
  LOGO_DELAY: 2000,        // Logo display duration
  FADE_DURATION: 400,      // Octagon fade duration

  // Colors (Cyan/Teal theme - Iron Man style)
  COLORS: {
    primary: '#00D4FF',      // Cyan glow
    secondary: '#00F5D4',    // Teal accent
    tertiary: '#7B61FF',     // Purple highlight
    background: '#0A0E17',   // Dark background
    surface: '#111827',      // Surface color
  }
}

// Security icons data
const SECURITY_ICONS = [
  { icon: Shield, label: 'Rate Limiting Active', color: CONFIG.COLORS.primary },
  { icon: Lock, label: 'CORS Protected', color: CONFIG.COLORS.secondary },
  { icon: KeyRound, label: 'Encryption Enabled', color: CONFIG.COLORS.primary },
  { icon: Fingerprint, label: 'Firewall Active', color: CONFIG.COLORS.tertiary },
  { icon: KeyRound, label: 'Auth Required', color: CONFIG.COLORS.secondary },
  { icon: FileText, label: 'Audit Logging', color: CONFIG.COLORS.primary },
  { icon: Link2, label: 'Blockchain Healthy', color: CONFIG.COLORS.secondary },
  { icon: Zap, label: 'DDoS Protected', color: CONFIG.COLORS.tertiary },
  { icon: Search, label: 'Threat Monitoring', color: CONFIG.COLORS.primary },
  { icon: CheckCircle, label: 'System Secure', color: CONFIG.COLORS.secondary },
]

// ============================================
// OCTAGON COMPONENT
// ============================================
interface OctagonProps {
  icon: React.ElementType
  label: string
  color: string
  isActive: boolean
  index: number
}

function Octagon({ icon: Icon, label, color, isActive }: OctagonProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={{
        transitionDelay: isActive ? '0ms' : '200ms',
        zIndex: isActive ? 10 : 0
      }}
    >
      {/* Octagon shape with glowing border */}
      <div className="relative">
        {/* Outer glow */}
        <div
          className="absolute inset-0 blur-xl opacity-60"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            transform: 'scale(1.5)'
          }}
        />

        {/* Octagon SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
          style={{ filter: `drop-shadow(0 0 20px ${color})` }}
        >
          {/* Octagon path */}
          <polygon
            points="60,10 140,10 190,60 190,140 140,190 60,190 10,140 10,60"
            fill="transparent"
            stroke={color}
            strokeWidth="3"
            className="animate-pulse"
            style={{
              filter: `drop-shadow(0 0 10px ${color})`,
            }}
          />

          {/* Inner decorative lines */}
          <polygon
            points="70,25 130,25 175,70 175,130 130,175 70,175 25,130 25,70"
            fill="transparent"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Corner accents */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <circle
              key={i}
              cx={100 + 85 * Math.cos((angle * Math.PI) / 180)}
              cy={100 + 85 * Math.sin((angle * Math.PI) / 180)}
              r="4"
              fill={color}
              className="animate-ping"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: '1.5s' }}
            />
          ))}
        </svg>

        {/* Icon in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon
            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mb-4"
            style={{ color, filter: `drop-shadow(0 0 15px ${color})` }}
          />
          <span
            className="text-sm md:text-base lg:text-lg font-bold tracking-wider uppercase"
            style={{ color, textShadow: `0 0 10px ${color}` }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SCANNING LINES COMPONENT
// ============================================
function ScanLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-0.5 opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${CONFIG.COLORS.primary}, transparent)`,
          animation: 'scanV 3s linear infinite'
        }}
      />
      {/* Vertical scan line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 opacity-30"
        style={{
          background: `linear-gradient(180deg, transparent, ${CONFIG.COLORS.secondary}, transparent)`,
          animation: 'scanH 4s linear infinite'
        }}
      />
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SecurityPortalPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'standby' | 'animating' | 'logo' | 'password' | 'authenticated'>('standby')
  const [currentIconIndex, setCurrentIconIndex] = useState(-1)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const recognitionRef = useRef<any>(null)

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('sttaurx_authenticated')
      if (isAuth === 'true') {
        router.push('/dashboard')
      }
    }
  }, [router])

  // Audio disabled - only /start page has audio
  const playStartupSound = useCallback(() => {}, [])
  const playIconSound = useCallback(() => {}, [])
  const playErrorSound = useCallback(() => {}, [])
  const playSuccessSound = useCallback(() => {}, [])

  // Start the animation sequence
  const startSequence = useCallback(() => {
    if (phase !== 'standby') return

    playStartupSound()
    setPhase('animating')
    setCurrentIconIndex(0)
  }, [phase, playStartupSound])

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey === CONFIG.KEYBOARD_SHORTCUT.ctrl &&
        e.shiftKey === CONFIG.KEYBOARD_SHORTCUT.shift &&
        e.key.toUpperCase() === CONFIG.KEYBOARD_SHORTCUT.key
      ) {
        e.preventDefault()
        startSequence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [startSequence])

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setVoiceSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
            .toLowerCase()

          if (transcript.includes(CONFIG.VOICE_PHRASE)) {
            recognitionRef.current?.stop()
            setIsListening(false)
            startSequence()
          }
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          if (isListening && phase === 'standby') {
            try {
              recognitionRef.current?.start()
            } catch (e) {}
          }
        }
      }
    }
  }, [startSequence, isListening, phase])

  // Toggle voice listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.log('Voice recognition error')
      }
    }
  }

  // Animation sequence
  useEffect(() => {
    if (phase !== 'animating') return

    if (currentIconIndex < SECURITY_ICONS.length) {
      const timer = setTimeout(() => {
        playIconSound()
        setCurrentIconIndex(prev => prev + 1)
      }, CONFIG.ICON_INTERVAL)
      return () => clearTimeout(timer)
    } else {
      // Animation complete, show GO button
      setPhase('logo')
      // No auto-transition - user clicks GO button to proceed
    }
  }, [phase, currentIconIndex, playIconSound])

  // Handle password submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CONFIG.PASSWORD) {
      playSuccessSound()
      setPhase('authenticated')
      // Store auth in sessionStorage
      sessionStorage.setItem('sttaurx_authenticated', 'true')
      // No auto-redirect - user clicks Go button
    } else {
      playErrorSound()
      setAttempts(prev => prev + 1)
      setError(`Access Denied - Invalid Credentials (Attempt ${attempts + 1}/5)`)
      setPassword('')
      setTimeout(() => setError(''), 3000)

      if (attempts >= 4) {
        setError('Maximum attempts reached. System locked.')
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ backgroundColor: CONFIG.COLORS.background }}
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(${CONFIG.COLORS.primary}20 1px, transparent 1px),
            linear-gradient(90deg, ${CONFIG.COLORS.primary}20 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, ${CONFIG.COLORS.background} 70%)`
        }}
      />

      {/* Scan lines effect */}
      <ScanLines />

      {/* Corner decorations */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
        <div
          key={corner}
          className={`absolute w-32 h-32 ${
            corner.includes('top') ? 'top-4' : 'bottom-4'
          } ${corner.includes('left') ? 'left-4' : 'right-4'}`}
          style={{
            borderTop: corner.includes('top') ? `2px solid ${CONFIG.COLORS.primary}40` : 'none',
            borderBottom: corner.includes('bottom') ? `2px solid ${CONFIG.COLORS.primary}40` : 'none',
            borderLeft: corner.includes('left') ? `2px solid ${CONFIG.COLORS.primary}40` : 'none',
            borderRight: corner.includes('right') ? `2px solid ${CONFIG.COLORS.primary}40` : 'none',
          }}
        />
      ))}

      {/* Minimal HUD - only shown during animation and password phases */}
      {(phase === 'animating' || phase === 'password') && (
        <>
          <div className="absolute top-4 left-4 text-xs font-mono" style={{ color: CONFIG.COLORS.primary }}>
            <div className="opacity-40">STTAURX v2.0</div>
          </div>
          <div className="absolute top-4 right-4 text-xs font-mono text-right" style={{ color: CONFIG.COLORS.secondary }}>
            <div className="opacity-40">{phase.toUpperCase()}</div>
          </div>
        </>
      )}

      {/* STANDBY PHASE */}
      {phase === 'standby' && (
        <div className="text-center z-10">
          {/* Block Icon with Glowing Effect */}
          <div className="relative mb-12">
            {/* Outer glow rings */}
            <div
              className="absolute inset-0 blur-3xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${CONFIG.COLORS.primary}40 0%, transparent 60%)`,
                transform: 'scale(3)'
              }}
            />
            <div
              className="absolute inset-0 blur-xl"
              style={{
                background: `radial-gradient(circle, ${CONFIG.COLORS.secondary}30 0%, transparent 50%)`,
                transform: 'scale(2)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />

            {/* Rotating ring around icon */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'spin 10s linear infinite' }}
            >
              <div
                className="w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-dashed"
                style={{ borderColor: `${CONFIG.COLORS.primary}30` }}
              />
            </div>

            {/* Second rotating ring (opposite direction) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'spin 15s linear infinite reverse' }}
            >
              <div
                className="w-64 h-64 md:w-80 md:h-80 rounded-full border"
                style={{ borderColor: `${CONFIG.COLORS.secondary}20` }}
              />
            </div>

            {/* The Icon - Black & White */}
            <div className="relative flex items-center justify-center">
              <img
                src="/icon-bw.png"
                alt="STTAURX"
                className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 object-contain"
                style={{
                  filter: `drop-shadow(0 0 30px ${CONFIG.COLORS.primary}) drop-shadow(0 0 60px ${CONFIG.COLORS.primary}50)`,
                  animation: 'float 3s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          {/* Minimal text below icon */}
          <div
            className="text-xs md:text-sm tracking-[0.5em] uppercase mb-16 opacity-60"
            style={{ color: CONFIG.COLORS.primary }}
          >
            Security Terminal
          </div>

          <div className="space-y-6">
            {/* Keyboard shortcut */}
            <div
              className="text-sm tracking-wider flex items-center justify-center gap-2"
              style={{ color: CONFIG.COLORS.primary }}
            >
              <span className="opacity-60">Press</span>
              <kbd className="px-3 py-1.5 bg-gray-800/80 rounded border border-gray-700 font-mono text-xs">Ctrl</kbd>
              <span className="opacity-40">+</span>
              <kbd className="px-3 py-1.5 bg-gray-800/80 rounded border border-gray-700 font-mono text-xs">Shift</kbd>
              <span className="opacity-40">+</span>
              <kbd className="px-3 py-1.5 bg-gray-800/80 rounded border border-gray-700 font-mono text-xs">A</kbd>
              <span className="opacity-60">to initialize</span>
            </div>

            {/* Voice activation */}
            {voiceSupported && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-gray-600 text-sm">— or —</span>
                <button
                  onClick={toggleListening}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
                    isListening
                      ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Listening...</span>
                      <span className="flex gap-1">
                        <span className="w-1 h-3 bg-red-400 rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-3 bg-red-400 rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-3 bg-red-400 rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Voice Activate</span>
                    </>
                  )}
                </button>

                {isListening && (
                  <div
                    className="text-xs animate-pulse tracking-wider"
                    style={{ color: CONFIG.COLORS.tertiary }}
                  >
                    Say: &quot;Initialize STTAURX Alpha G&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANIMATION PHASE */}
      {phase === 'animating' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {SECURITY_ICONS.map((item, index) => (
            <Octagon
              key={index}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={index === currentIconIndex}
              index={index}
            />
          ))}

          {/* Progress indicator */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
            {SECURITY_ICONS.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: index <= currentIconIndex ? CONFIG.COLORS.primary : '#333',
                  boxShadow: index <= currentIconIndex ? `0 0 10px ${CONFIG.COLORS.primary}` : 'none'
                }}
              />
            ))}
          </div>

          {/* Status text */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm font-mono"
            style={{ color: CONFIG.COLORS.primary }}
          >
            INITIALIZING SECURITY PROTOCOLS... {Math.round(((currentIconIndex + 1) / SECURITY_ICONS.length) * 100)}%
          </div>
        </div>
      )}

      {/* LOGO PHASE - Now shows GO button */}
      {phase === 'logo' && (
        <div className="text-center z-10 animate-fadeIn">
          <div className="relative mb-8">
            {/* Glow effect */}
            <div
              className="absolute inset-0 blur-3xl"
              style={{
                background: `radial-gradient(circle, ${CONFIG.COLORS.secondary}40 0%, transparent 70%)`,
                transform: 'scale(2)',
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
            <CheckCircle
              className="w-24 h-24 mx-auto mb-4 relative"
              style={{ color: CONFIG.COLORS.secondary, filter: `drop-shadow(0 0 20px ${CONFIG.COLORS.secondary})` }}
            />
          </div>
          <div
            className="text-3xl font-bold tracking-wider mb-4"
            style={{ color: CONFIG.COLORS.secondary, textShadow: `0 0 20px ${CONFIG.COLORS.secondary}60` }}
          >
            SYSTEMS ONLINE
          </div>
          <div className="text-gray-400 mb-8">Security protocols verified</div>

          {/* GO Button */}
          <button
            onClick={() => {
              sessionStorage.setItem('sttaurx_authenticated', 'true')
              router.push('/dashboard')
            }}
            className="group relative px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-xl transition-all hover:scale-105 overflow-hidden"
            style={{
              backgroundColor: CONFIG.COLORS.primary,
              color: CONFIG.COLORS.background,
              boxShadow: `0 0 40px ${CONFIG.COLORS.primary}60, inset 0 0 20px rgba(255,255,255,0.1)`
            }}
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                animation: 'shimmer 2s infinite'
              }}
            />
            <span className="relative flex items-center gap-3">
              GO
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </div>
      )}

      {/* PASSWORD PHASE */}
      {phase === 'password' && (
        <div className="z-10 w-full max-w-md px-6 animate-fadeIn">
          <div
            className="p-8 rounded-2xl border backdrop-blur-sm relative overflow-hidden"
            style={{
              backgroundColor: `${CONFIG.COLORS.surface}90`,
              borderColor: `${CONFIG.COLORS.primary}30`,
              boxShadow: `0 0 50px ${CONFIG.COLORS.primary}20`
            }}
          >
            {/* Decorative corner lines */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2" style={{ borderColor: CONFIG.COLORS.primary }} />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2" style={{ borderColor: CONFIG.COLORS.primary }} />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2" style={{ borderColor: CONFIG.COLORS.primary }} />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2" style={{ borderColor: CONFIG.COLORS.primary }} />

            {/* Lock icon */}
            <div className="flex justify-center mb-6">
              <div
                className="p-4 rounded-full relative"
                style={{
                  backgroundColor: `${CONFIG.COLORS.primary}20`,
                  boxShadow: `0 0 30px ${CONFIG.COLORS.primary}30`
                }}
              >
                <Lock
                  className="w-12 h-12"
                  style={{ color: CONFIG.COLORS.primary }}
                />
                {/* Spinning ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${CONFIG.COLORS.primary}50`, animationDuration: '3s' }}
                />
              </div>
            </div>

            <h2
              className="text-2xl font-bold text-center mb-2 tracking-wider"
              style={{ color: CONFIG.COLORS.primary }}
            >
              ACCESS REQUIRED
            </h2>
            <p className="text-gray-500 text-center text-sm mb-6">
              Enter authorization code to proceed
            </p>

            {attempts >= 5 ? (
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <div className="text-red-400 font-bold">SYSTEM LOCKED</div>
                <div className="text-gray-500 text-sm mt-2">Maximum attempts exceeded</div>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <div className="relative mb-4">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-gray-900/80 border-2 rounded-lg text-white placeholder-gray-600 focus:outline-none transition-all font-mono tracking-wider"
                    style={{
                      borderColor: error ? '#ef4444' : `${CONFIG.COLORS.primary}50`,
                      boxShadow: error ? '0 0 20px #ef444440' : `0 0 20px ${CONFIG.COLORS.primary}20`
                    }}
                    autoFocus
                    disabled={attempts >= 5}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <div className="text-red-400 text-sm text-center mb-4 animate-pulse flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={attempts >= 5}
                  className="w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  style={{
                    backgroundColor: CONFIG.COLORS.primary,
                    color: CONFIG.COLORS.background,
                    boxShadow: `0 0 30px ${CONFIG.COLORS.primary}50`
                  }}
                >
                  Authenticate
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
                <Volume2 className="w-3 h-3" />
                <span>Biometric authentication available</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATED PHASE */}
      {phase === 'authenticated' && (
        <div className="text-center z-10 animate-fadeIn">
          <div className="relative mb-8">
            <div
              className="absolute inset-0 blur-3xl"
              style={{
                background: `radial-gradient(circle, ${CONFIG.COLORS.secondary}40 0%, transparent 70%)`,
                transform: 'scale(2)',
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
            <CheckCircle
              className="w-24 h-24 mx-auto mb-4 relative"
              style={{ color: CONFIG.COLORS.secondary, filter: `drop-shadow(0 0 20px ${CONFIG.COLORS.secondary})` }}
            />
          </div>
          <div
            className="text-3xl font-bold tracking-wider mb-4"
            style={{ color: CONFIG.COLORS.secondary, textShadow: `0 0 20px ${CONFIG.COLORS.secondary}60` }}
          >
            ACCESS GRANTED
          </div>
          <div className="text-gray-400 mb-8">Welcome to STTAURX Security Terminal</div>

          {/* GO Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="group relative px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-xl transition-all hover:scale-105 overflow-hidden"
            style={{
              backgroundColor: CONFIG.COLORS.primary,
              color: CONFIG.COLORS.background,
              boxShadow: `0 0 40px ${CONFIG.COLORS.primary}60, inset 0 0 20px rgba(255,255,255,0.1)`
            }}
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                animation: 'shimmer 2s infinite'
              }}
            />
            <span className="relative flex items-center gap-3">
              GO
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </div>
      )}

      {/* Global styles */}
      <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes scanV {
          0% { top: 0; }
          100% { top: 100%; }
        }

        @keyframes scanH {
          0% { left: 0; }
          100% { left: 100%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(2); }
          50% { opacity: 0.8; transform: scale(2.2); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
