import { useState } from 'react'
import { ChevronRight, ChevronLeft, Sparkles, PhoneCall, BarChart3, Radio, BookOpen, Check } from 'lucide-react'

const ATLAS_TOUR_STORAGE_KEY = 'atlas_intro_tour_completed'

export function hasCompletedAtlasTour(): boolean {
  try {
    return localStorage.getItem(ATLAS_TOUR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAtlasTourCompleted(): void {
  try {
    localStorage.setItem(ATLAS_TOUR_STORAGE_KEY, '1')
  } catch {}
}

const steps = [
  {
    icon: PhoneCall,
    title: 'Call History',
    description: 'View your call history and AI analysis from your meetings.',
  },
  {
    icon: BarChart3,
    title: 'Insights',
    description: 'Track performance and trends across your calls.',
  },
  {
    icon: Radio,
    title: 'Record',
    description: 'Record meetings directly or from a meeting link.',
  },
  {
    icon: BookOpen,
    title: 'Knowledge',
    description: 'Upload documents so AI has context (Trial plan includes upload for proof of concept).',
  },
  {
    icon: Check,
    title: "You're all set!",
    description: 'Atlas Intelligence is ready to support you. Start from Call History or Record.',
  },
]

interface AtlasIntroTourProps {
  onComplete: () => void
}

export default function AtlasIntroTour({ onComplete }: AtlasIntroTourProps) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      setAtlasTourCompleted()
      onComplete()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSkip = () => {
    setAtlasTourCompleted()
    onComplete()
  }

  return (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Atlas introduction tour"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Atlas introduction tour</span>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-600 mb-4">
            <Icon className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{current.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-blue-600' : i < step ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Skip
            </button>
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
              {isLast ? 'Get started' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
