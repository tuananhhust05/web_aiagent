import { useState } from 'react'

export interface CustomDateRangePopoverProps {
  fromDate: string | null
  toDate: string | null
  onApply: (from: string, to: string) => void
  onClose: () => void
}

export default function CustomDateRangePopover({
  fromDate,
  toDate,
  onApply,
  onClose,
}: CustomDateRangePopoverProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(fromDate ?? today)
  const [to, setTo] = useState(toDate ?? today)

  const handleApply = () => {
    if (from && to) onApply(from, to)
  }

  return (
    <>
      <div className="fixed inset-0 z-10" aria-hidden onClick={onClose} />
      <div
        className="absolute top-full right-0 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-20"
        role="dialog"
        aria-label="Select custom date range"
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="custom-from" className="block text-xs font-medium text-gray-600 mb-1">
              From
            </label>
            <input
              id="custom-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <div>
            <label htmlFor="custom-to" className="block text-xs font-medium text-gray-600 mb-1">
              To
            </label>
            <input
              id="custom-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!from || !to}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
