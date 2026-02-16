import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

/**
 * Plays a short chime using Web Audio API (two-tone welcome sound).
 */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const play = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration)
      osc.start(start)
      osc.stop(start + duration)
    }
    play(523.25, 0, 0.15)      // C5
    play(659.25, 0.15, 0.2)   // E5
    play(783.99, 0.35, 0.25)   // G5
  } catch {
    // ignore if AudioContext not supported
  }
}

interface AtlasWelcomeModalProps {
  onClose: () => void
  userName?: string
}

export default function AtlasWelcomeModal({ onClose, userName }: AtlasWelcomeModalProps) {
  const [visible, setVisible] = useState(false)
  const playedRef = useRef(false)

  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true
    playChime()
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Atlas"
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-500 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Welcome to Atlas Intelligence
          </h2>
          <p className="text-blue-100 text-lg">
            Your sales coach
          </p>
          {userName && (
            <p className="mt-2 text-white/90">
              Hi, {userName} — let’s make every conversation count.
            </p>
          )}
        </div>
        <div className="p-6 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setVisible(false)
              setTimeout(onClose, 200)
            }}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium flex items-center gap-2"
          >
            Get started
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
