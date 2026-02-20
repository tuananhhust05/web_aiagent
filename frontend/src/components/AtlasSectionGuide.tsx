import { X } from 'lucide-react'
import type { AtlasSectionId } from '../lib/atlasOnboarding'

/**
 * Section-level hint — Slack-style (short, contextual) and Notion-style (one clear line + outcome).
 * One step at a time, no overwhelm.
 */
interface SectionCopy {
  title: string
  /** One short line: why this matters */
  why: string
  /** One short line: what you get */
  result: string
}

const SECTION_COPY: Record<AtlasSectionId, SectionCopy> = {
  calendar: {
    title: 'Calendar',
    why: 'Your meetings live here so Atlas can prep you and follow up.',
    result: 'See the week, join with one click, AI context ready for every call.',
  },
  calls: {
    title: 'Call History',
    why: 'Every conversation is analyzed so you never miss a commitment.',
    result: 'Summaries, playbook alignment, and feedback in one place.',
  },
  insights: {
    title: 'Insights',
    why: 'Track how you’re performing across calls and deals.',
    result: 'Trends and gaps so you can improve over time.',
  },
  todo: {
    title: 'To Do Ready',
    why: 'Next steps from your meetings, ready to execute.',
    result: 'Clear actions so nothing falls through the cracks.',
  },
  qna: {
    title: 'Rolling Q&A',
    why: 'Questions and answers that span your conversations.',
    result: 'See what’s open and what’s resolved in one place.',
  },
  knowledge: {
    title: 'Knowledge',
    why: 'Upload playbooks and docs so AI can use them in prep and follow-up.',
    result: 'Smarter suggestions grounded in your content.',
  },
  record: {
    title: 'Record',
    why: 'Add meetings by link or record live for Atlas to analyze.',
    result: 'Every important conversation captured and analyzed.',
  },
}

interface AtlasSectionGuideProps {
  sectionId: AtlasSectionId
  onClose: () => void
}

export default function AtlasSectionGuide({ sectionId, onClose }: AtlasSectionGuideProps) {
  const copy = SECTION_COPY[sectionId]
  if (!copy) return null

  return (
    <div
      className="fixed inset-0 z-[99] flex items-end justify-center sm:items-center p-4 pb-8 sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${copy.title} – quick guide`}
    >
      {/* Slack-style: light overlay, card feels like a tooltip */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 max-w-sm w-full overflow-hidden transition-all duration-200">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{copy.title}</h3>
          <p className="text-[13px] text-gray-600 leading-snug mb-2">
            {copy.why}
          </p>
          <p className="text-[13px] text-gray-500 leading-snug mb-3">
            {copy.result}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
