import { useState } from 'react'
import { X } from 'lucide-react'

export interface PasteEmailModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    company: string
    contact: string
    deal: string
    direction: 'prospect' | 'sales'
    text: string
    date: string
  }) => Promise<void>
}

export default function PasteEmailModal({
  open,
  onClose,
  onSubmit,
}: PasteEmailModalProps) {
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [deal, setDeal] = useState('')
  const [direction, setDirection] = useState<'prospect' | 'sales'>('prospect')
  const [text, setText] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!text.trim()) {
      setError('Please paste or enter email content.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        company: company.trim(),
        contact: contact.trim(),
        deal: deal.trim(),
        direction,
        text: text.trim(),
        date,
      })
      setCompany('')
      setContact('')
      setDeal('')
      setText('')
      setDate(new Date().toISOString().slice(0, 10))
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-email-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 id="paste-email-title" className="text-lg font-semibold text-gray-900">
            Paste prospect reply
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="paste-company" className="block text-sm font-medium text-gray-700 mb-1">
              Company (auto)
            </label>
            <input
              id="paste-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Company name"
            />
          </div>
          <div>
            <label htmlFor="paste-contact" className="block text-sm font-medium text-gray-700 mb-1">
              Contact
            </label>
            <input
              id="paste-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Contact name or email"
            />
          </div>
          <div>
            <label htmlFor="paste-deal" className="block text-sm font-medium text-gray-700 mb-1">
              Deal
            </label>
            <input
              id="paste-deal"
              type="text"
              value={deal}
              onChange={(e) => setDeal(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Deal or opportunity"
            />
          </div>
          <div>
            <label htmlFor="paste-direction" className="block text-sm font-medium text-gray-700 mb-1">
              Email direction
            </label>
            <select
              id="paste-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'prospect' | 'sales')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            >
              <option value="prospect">Prospect</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <div>
            <label htmlFor="paste-text" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="paste-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Paste email content here…"
            />
          </div>
          <div>
            <label htmlFor="paste-date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="paste-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-lg hover:bg-[#2563EB] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-1"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
