'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Mic,
  MicOff,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'

// ============================================
// CONFIGURATION - Easy to modify
// ============================================
const CONFIG = {
  // Activation
  KEYBOARD_SHORTCUT: { ctrl: true, shift: true, key: 'A' },
  VOICE_PHRASE: 'initialize protocol og',

  // Timing (milliseconds)
  ICON_INTERVAL: 500,      // Time between each icon

  // Colors (Cyan/Teal theme - Iron Man style)
  COLORS: {
    primary: '#00D4FF',      // Cyan glow
    secondary: '#00F5D4',    // Teal accent
    tertiary: '#7B61FF',     // Purple highlight
    background: '#0A0E17',   // Dark background
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
function Octagon({ icon: Icon, label, color, isActive }: {
  icon: React.ElementType
  label: string
  color: string
  isActive: boolean
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={{ transitionDelay: isActive ? '0ms' : '200ms', zIndex: isActive ? 10 : 0 }}
    >
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
          <polygon
            points="60,10 140,10 190,60 190,140 140,190 60,190 10,140 10,60"
            fill="transparent"
            stroke={color}
            strokeWidth="3"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
          <polygon
            points="70,25 130,25 175,70 175,130 130,175 70,175 25,130 25,70"
            fill="transparent"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <circle
              key={i}
              cx={100 + 85 * Math.cos((angle * Math.PI) / 180)}
              cy={100 + 85 * Math.sin((angle * Math.PI) / 180)}
              r="4"
              fill={color}
              style={{ animation: `ping 1.5s ease-in-out infinite`, animationDelay: `${i * 100}ms` }}
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
// MAIN COMPONENT
// ============================================
export default function SecurityStartPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'standby' | 'animating' | 'password' | 'granted'>('standby')
  const [currentIconIndex, setCurrentIconIndex] = useState(-1)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const recognitionRef = useRef<any>(null)
  const hasStartedRef = useRef(false)  // Track if sequence has started
  // Simple beep using HTML5 Audio with base64 encoded sound
  const playBeep = useCallback((frequency: number = 800, duration: number = 100) => {
    try {
      // Create audio context only when needed
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000)

      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + duration / 1000)

      // Clean up after sound finishes
      setTimeout(() => audioCtx.close(), duration + 100)
    } catch (e) {
      console.log('Audio error:', e)
    }
  }, [])

  // Play startup sound effect (ascending tones)
  const playStartupSound = useCallback(() => {
    playBeep(400, 100)
    setTimeout(() => playBeep(600, 100), 100)
    setTimeout(() => playBeep(800, 150), 200)
  }, [playBeep])

  // Play icon sound
  const playIconSound = useCallback(() => {
    const freq = 600 + Math.floor(Math.random() * 400)
    playBeep(freq, 80)
  }, [playBeep])

  // Start the animation sequence
  const startSequence = useCallback(() => {
    if (phase !== 'standby' || hasStartedRef.current) return

    // Mark as started immediately to prevent any re-triggers
    hasStartedRef.current = true

    // Completely destroy voice recognition
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null
      recognitionRef.current.onend = null
      recognitionRef.current.onerror = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
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
          // Only process if we haven't started yet
          if (hasStartedRef.current) {
            recognitionRef.current?.stop()
            return
          }

          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
            .toLowerCase()

          if (transcript.includes(CONFIG.VOICE_PHRASE)) {
            startSequence()
          }
        }

        recognitionRef.current.onerror = () => setIsListening(false)
        recognitionRef.current.onend = () => {
          // Only restart if we haven't started the sequence yet
          if (isListening && !hasStartedRef.current && recognitionRef.current) {
            try { recognitionRef.current?.start() } catch (e) {}
          }
        }
      }
    }
  }, [startSequence, isListening, phase])

  // Toggle voice listening
  const toggleListening = () => {
    // Don't allow voice activation if sequence already started
    if (hasStartedRef.current) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {}
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
      setPhase('password')
    }
  }, [phase, currentIconIndex, playIconSound])

  // Go to dashboard
  const handleGo = () => {
    sessionStorage.setItem('sttaurx_authenticated', 'true')
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: CONFIG.COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 99999,
      }}
    >
      {/* Animated background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
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
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, transparent 0%, ${CONFIG.COLORS.background} 70%)`
        }}
      />

      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          opacity: 0.3,
          background: `linear-gradient(90deg, transparent, ${CONFIG.COLORS.primary}, transparent)`,
          animation: 'scanV 3s linear infinite'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '2px',
          opacity: 0.3,
          background: `linear-gradient(180deg, transparent, ${CONFIG.COLORS.secondary}, transparent)`,
          animation: 'scanH 4s linear infinite'
        }}
      />

      {/* STANDBY PHASE */}
      {phase === 'standby' && (
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          {/* Block Icon with Glowing Effect */}
          <div style={{ position: 'relative', marginBottom: '3rem' }}>
            {/* Outer glow rings */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: 'blur(40px)',
                background: `radial-gradient(circle, ${CONFIG.COLORS.primary}40 0%, transparent 60%)`,
                transform: 'scale(3)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />

            {/* Rotating ring */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 10s linear infinite'
              }}
            >
              <div
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  border: `2px dashed ${CONFIG.COLORS.primary}30`
                }}
              />
            </div>

            {/* Second rotating ring */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 15s linear infinite reverse'
              }}
            >
              <div
                style={{
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  border: `1px solid ${CONFIG.COLORS.secondary}20`
                }}
              />
            </div>

            {/* The Icon - Black & White */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/icon-bw.png"
                alt="STTAURX"
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 0 30px ${CONFIG.COLORS.primary}) drop-shadow(0 0 60px ${CONFIG.COLORS.primary}50)`,
                  animation: 'float 3s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          {/* Minimal text below icon */}
          <div
            style={{
              fontSize: '0.875rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              marginBottom: '4rem',
              opacity: 0.6,
              color: CONFIG.COLORS.primary
            }}
          >
            Security Terminal
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Keyboard shortcut */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: CONFIG.COLORS.primary }}>
              <span style={{ opacity: 0.6 }}>Press</span>
              <kbd style={{ padding: '0.375rem 0.75rem', background: 'rgba(31,41,55,0.8)', borderRadius: '0.375rem', border: '1px solid #374151', fontFamily: 'monospace', fontSize: '0.75rem' }}>Ctrl</kbd>
              <span style={{ opacity: 0.4 }}>+</span>
              <kbd style={{ padding: '0.375rem 0.75rem', background: 'rgba(31,41,55,0.8)', borderRadius: '0.375rem', border: '1px solid #374151', fontFamily: 'monospace', fontSize: '0.75rem' }}>Shift</kbd>
              <span style={{ opacity: 0.4 }}>+</span>
              <kbd style={{ padding: '0.375rem 0.75rem', background: 'rgba(31,41,55,0.8)', borderRadius: '0.375rem', border: '1px solid #374151', fontFamily: 'monospace', fontSize: '0.75rem' }}>A</kbd>
              <span style={{ opacity: 0.6 }}>to initialize</span>
            </div>

            {/* Voice activation */}
            {voiceSupported && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#4B5563', fontSize: '0.875rem' }}>— or —</span>
                <button
                  onClick={toggleListening}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${isListening ? 'rgba(239,68,68,0.5)' : '#374151'}`,
                    background: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(31,41,55,0.5)',
                    color: isListening ? '#F87171' : '#9CA3AF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none'
                  }}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  <span>{isListening ? 'Listening...' : 'Voice Activate'}</span>
                </button>

                {isListening && (
                  <div style={{ fontSize: '0.75rem', color: CONFIG.COLORS.tertiary, animation: 'pulse 1s ease-in-out infinite' }}>
                    Say: &quot;Initialize Protocol OG&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANIMATION PHASE */}
      {phase === 'animating' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {SECURITY_ICONS.map((item, index) => (
            <Octagon
              key={index}
              icon={item.icon}
              label={item.label}
              color={item.color}
              isActive={index === currentIconIndex}
            />
          ))}

          {/* Progress indicator */}
          <div style={{ position: 'absolute', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
            {SECURITY_ICONS.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: index <= currentIconIndex ? CONFIG.COLORS.primary : '#333',
                  boxShadow: index <= currentIconIndex ? `0 0 10px ${CONFIG.COLORS.primary}` : 'none',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>

          {/* Status text */}
          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: CONFIG.COLORS.primary
            }}
          >
            INITIALIZING SECURITY PROTOCOLS... {Math.round(((currentIconIndex + 1) / SECURITY_ICONS.length) * 100)}%
          </div>
        </div>
      )}

      {/* PASSWORD PHASE */}
      {phase === 'password' && (
        <div style={{ textAlign: 'center', zIndex: 10, animation: 'fadeIn 0.5s ease-out', width: '100%', maxWidth: '400px', padding: '0 1.5rem' }}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            {/* Glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: 'blur(40px)',
                background: `radial-gradient(circle, ${CONFIG.COLORS.primary}40 0%, transparent 70%)`,
                transform: 'scale(2)',
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
            <Lock
              size={72}
              style={{
                color: CONFIG.COLORS.primary,
                filter: `drop-shadow(0 0 20px ${CONFIG.COLORS.primary})`,
                margin: '0 auto 1rem'
              }}
            />
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
              color: CONFIG.COLORS.primary,
              textShadow: `0 0 20px ${CONFIG.COLORS.primary}60`
            }}
          >
            ACCESS REQUIRED
          </div>
          <div style={{ color: '#9CA3AF', marginBottom: '2rem', fontSize: '0.875rem' }}>Enter authorization code to proceed</div>

          {attempts >= 5 ? (
            <div style={{ textAlign: 'center' }}>
              <AlertTriangle size={64} style={{ color: '#EF4444', margin: '0 auto 1rem' }} />
              <div style={{ color: '#F87171', fontWeight: 'bold', fontSize: '1.25rem' }}>SYSTEM LOCKED</div>
              <div style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.5rem' }}>Maximum attempts exceeded</div>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const res = await fetch('http://localhost:3001/api/v1/auth/verify-portal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password }),
                })
                if (res.ok) {
                  setPhase('granted')
                } else {
                  setAttempts(prev => prev + 1)
                  setError(`Access Denied - Invalid Credentials (Attempt ${attempts + 1}/5)`)
                  setPassword('')
                  setTimeout(() => setError(''), 3000)
                }
              } catch {
                setError('Connection failed. Is the server running?')
                setTimeout(() => setError(''), 3000)
              }
            }}>
              {/* Glowing Password Input */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1rem 3rem 1rem 1rem',
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: `2px solid ${error ? '#EF4444' : CONFIG.COLORS.primary}`,
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    outline: 'none',
                    boxShadow: error
                      ? '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.1)'
                      : `0 0 20px ${CONFIG.COLORS.primary}40, 0 0 40px ${CONFIG.COLORS.primary}20, inset 0 0 20px ${CONFIG.COLORS.primary}10`,
                    transition: 'all 0.3s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <div style={{
                  color: '#F87171',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  animation: 'pulse 1s ease-in-out infinite'
                }}>
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* GO Button */}
              <button
                type="submit"
                disabled={attempts >= 5}
                style={{
                  position: 'relative',
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontSize: '1.25rem',
                  backgroundColor: CONFIG.COLORS.primary,
                  color: CONFIG.COLORS.background,
                  cursor: attempts >= 5 ? 'not-allowed' : 'pointer',
                  boxShadow: `0 0 40px ${CONFIG.COLORS.primary}60`,
                  transition: 'transform 0.2s',
                  overflow: 'hidden',
                  opacity: attempts >= 5 ? 0.5 : 1,
                }}
                onMouseOver={(e) => { if (attempts < 5) e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Shimmer effect */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.3,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  GO
                  <ArrowRight size={24} />
                </span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* GRANTED PHASE */}
      {phase === 'granted' && (
        <div style={{ textAlign: 'center', zIndex: 10, animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            {/* Glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: 'blur(40px)',
                background: `radial-gradient(circle, ${CONFIG.COLORS.secondary}40 0%, transparent 70%)`,
                transform: 'scale(2)',
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
            <CheckCircle
              size={96}
              style={{
                color: CONFIG.COLORS.secondary,
                filter: `drop-shadow(0 0 20px ${CONFIG.COLORS.secondary})`,
                margin: '0 auto 1rem'
              }}
            />
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
              color: CONFIG.COLORS.secondary,
              textShadow: `0 0 20px ${CONFIG.COLORS.secondary}60`
            }}
          >
            ACCESS GRANTED
          </div>
          <div style={{ color: '#9CA3AF', marginBottom: '2rem' }}>Welcome to STTAURX Security Terminal</div>

          {/* GO Button */}
          <button
            onClick={handleGo}
            style={{
              position: 'relative',
              padding: '1rem 3rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontSize: '1.25rem',
              backgroundColor: CONFIG.COLORS.primary,
              color: CONFIG.COLORS.background,
              cursor: 'pointer',
              boxShadow: `0 0 40px ${CONFIG.COLORS.primary}60`,
              transition: 'transform 0.2s',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: '0 auto'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Shimmer effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.3,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
            <span style={{ position: 'relative' }}>GO</span>
            <ArrowRight size={24} style={{ position: 'relative' }} />
          </button>
        </div>
      )}

      {/* Global styles */}
      <style>{`
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
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
