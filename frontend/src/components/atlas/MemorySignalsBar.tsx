import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ChevronRight, X } from 'lucide-react'
import type { MemorySignal } from '../../lib/api'

export interface MemorySignalsBarProps {
  signals: MemorySignal[]
  onSelectTask: (taskId: string) => void
}

/** Single row: maximum number of visible items (the rest go into "Show more"). */
const MAX_VISIBLE_ITEMS = 4
/** Character limit for each item on the strip. */
const MAX_LABEL_CHARS = 22

function truncateLabel(label: string, max: number): string {
  if (label.length <= max) return label
  return label.slice(0, max).trim() + '…'
}

export default function MemorySignalsBar({ signals, onSelectTask }: MemorySignalsBarProps) {
  const [showAllPopup, setShowAllPopup] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [popupStyle, setPopupStyle] = useState({ top: 0, left: 0, minWidth: 0 })

  useEffect(() => {
    if (!showAllPopup || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPopupStyle({
      top: rect.bottom + 8,
      left: rect.left,
      minWidth: Math.max(rect.width, 280),
    })
  }, [showAllPopup])

  if (signals.length === 0) return null

  const displayedSignals = signals.slice(0, MAX_VISIBLE_ITEMS)
  const hiddenCount = signals.length - displayedSignals.length
  const showMoreButton = hiddenCount > 0
  
  const handleSignalClick = (taskId: string) => {
    onSelectTask(taskId)
    setShowAllPopup(false)
  }

  const popupContent = showAllPopup && (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setShowAllPopup(false)}
        aria-hidden
      />
      <div
        className="fixed z-[9999] bg-white rounded-xl border border-rose-200 shadow-xl max-h-[320px] overflow-hidden"
        style={{ top: popupStyle.top, left: popupStyle.left, minWidth: popupStyle.minWidth, maxWidth: 'min(400px, calc(100vw - 24px))' }}
        role="dialog"
        aria-label="Attention Required - all items"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 border-b border-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-semibold text-red-900">Attention Required</span>
            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {signals.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllPopup(false)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[260px] scrollbar-blue-thin">
          <div className="p-2 space-y-1.5">
            {signals.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSignalClick(s.task_id)}
                className="w-full flex items-center gap-3 rounded-xl p-3 text-left bg-red-50/80 hover:bg-red-100/80 border border-rose-200 transition-all"
              >
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="flex-1 min-w-0 text-[11px] font-medium text-red-900">
                  {s.label}
                </p>
                <ChevronRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
  
  return (
    <div
      ref={anchorRef}
      className="px-4 lg:px-5 py-3 bg-gradient-to-r from-red-50 to-rose-50 border-b border-rose-200/60 relative overflow-hidden"
      role="region"
      aria-label="Attention Required"
    >
      {/* Row 1: Title ▲ Attention Required */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-hidden />
        </div>
        <span className="text-xs font-semibold text-red-800">Attention Required</span>
      </div>

      {/* Row 2: Single line, no wrapping; each item has a character limit */}
      <div className="flex flex-nowrap gap-2 items-center overflow-hidden">
        {displayedSignals.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSignalClick(s.task_id)}
            title={s.label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 hover:border-slate-300 transition-all shrink-0 min-w-0 max-w-[180px]"
          >
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" aria-hidden />
            <span className="truncate">{truncateLabel(s.label, MAX_LABEL_CHARS)}</span>
          </button>
        ))}
        {showMoreButton && (
          <button
            type="button"
            onClick={() => setShowAllPopup(true)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/80 shrink-0"
          >
            Show more
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(popupContent, document.body)}
    </div>
  )
}
