import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Lightweight welcome — inspired by Slack (concise, one CTA) and Notion (clean, minimal).
 * Optional chime; no heavy hero so it feels like a quick "What's Atlas?" card.
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
      gain.gain.setValueAtTime(0.12, start)
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration)
      osc.start(start)
      osc.stop(start + duration)
    }
    play(523.25, 0, 0.12)
    play(659.25, 0.12, 0.18)
  } catch {
    // ignore
  }
}

export type AtlasWelcomeRole = 'sales_employee' | 'sales_manager' | 'exploring'

interface AtlasWelcomeModalProps {
  onClose: () => void
  userName?: string
  role?: AtlasWelcomeRole
}

const BULLETS = [
  'Prep and follow-up for every meeting',
  'Calls, insights, and playbook in one place',
  'Next steps and Q&A that don’t slip',
  'Close more deals with less busywork',
]

function getHeadline(role: AtlasWelcomeRole): string {
  switch (role) {
    case 'sales_employee':
      return 'Your personal Sales Coach'
    case 'sales_manager':
    case 'exploring':
    default:
      return "Atlas is your sales coach. Let's do your first negotiation."
  }
}

export default function AtlasWelcomeModal({ onClose, userName, role: propRole }: AtlasWelcomeModalProps) {
  const [visible, setVisible] = useState(false)
  const playedRef = useRef(false)

  const role: AtlasWelcomeRole = propRole ?? 'exploring'
  const headline = getHeadline(role)

  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true
    playChime()
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Atlas"
    >
      <div
        className={`relative bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full mx-4 overflow-hidden transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
        }`}
      >
        {/* Notion-style: minimal header, no big gradient */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {headline}
          </h2>
          {userName && (
            <p className="mt-1 text-sm text-gray-500">
              Hi {userName}
            </p>
          )}
        </div>

        {/* Slack-style: short bullets, scannable */}
        <ul className="px-6 py-2 space-y-2">
          {BULLETS.map((text, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* Single CTA — Notion/Slack: one primary action */}
        <div className="px-6 pb-6 pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => {
              setVisible(false)
              setTimeout(onClose, 150)
            }}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            Start Exploring
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
