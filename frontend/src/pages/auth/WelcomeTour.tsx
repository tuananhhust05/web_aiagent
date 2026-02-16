import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Sparkles, PhoneCall, BarChart3, Radio, BookOpen, Check, UserPlus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

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
    play(523.25, 0, 0.15)
    play(659.25, 0.15, 0.2)
    play(783.99, 0.35, 0.25)
  } catch {}
}

const tourSteps = [
  { icon: PhoneCall, title: 'Call History', description: 'View your call history and AI analysis from your meetings.' },
  { icon: BarChart3, title: 'Insights', description: 'Track performance and trends across your calls.' },
  { icon: Radio, title: 'Record', description: 'Record meetings directly or from a meeting link.' },
  { icon: BookOpen, title: 'Knowledge', description: 'Upload documents so AI has context (Trial plan includes upload for proof of concept).' },
  { icon: Check, title: "You're all set!", description: 'Atlas Intelligence is ready to support you.' },
]

/**
 * Intermediate page: Welcome (chime + AI welcome) + Atlas intro tour → then navigate to /supplement-profile.
 * Used whenever the user needs to complete profile (terms/gdpr or profile info).
 */
export default function WelcomeTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const playedRef = useRef(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isNew = searchParams.get('is_new') === 'true'

  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true
    playChime()
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const current = tourSteps[step]
  const Icon = current.icon
  const isLast = step === tourSteps.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate(`/supplement-profile?is_new=${isNew}`, { replace: true })
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-emerald-50/30 flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-lg transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Welcome block (chime plays on mount) */}
        <div className="bg-gradient-to-br from-blue-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white text-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            Welcome to Atlas Intelligence
          </h1>
          <p className="text-blue-100 text-lg">
            Your sales coach
          </p>
          {user?.first_name && (
            <p className="mt-2 text-white/90">
              Hi, {user.first_name} — let’s make every conversation count.
            </p>
          )}
        </div>

        {/* Tour */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Atlas introduction tour</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-600 mb-4">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{current.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex gap-2">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-5 bg-blue-600' : i < step ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                {isLast ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Complete profile
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
