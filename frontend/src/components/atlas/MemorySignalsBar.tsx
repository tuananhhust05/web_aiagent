import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Bell, ChevronRight, X } from 'lucide-react'
import type { MemorySignal } from '../../lib/api'

export interface MemorySignalsBarProps {
  signals: MemorySignal[]
  onSelectTask: (taskId: string) => void
}

export default function MemorySignalsBar({ signals, onSelectTask }: MemorySignalsBarProps) {
  const [showAllPopup, setShowAllPopup] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(signals.length)

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        if (containerWidth < 400) {
          setVisibleCount(2)
        } else if (containerWidth < 600) {
          setVisibleCount(3)
        } else {
          setVisibleCount(5)
        }
      }
    }
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [signals.length])

  if (signals.length === 0) return null

  const displayedSignals = signals.slice(0, visibleCount)
  const hiddenCount = signals.length - visibleCount
  
  const handleSignalClick = (taskId: string) => {
    onSelectTask(taskId)
    setShowAllPopup(false)
  }
  
  return (
    <div
      ref={containerRef}
      className="px-3 lg:px-4 py-1.5 relative"
      role="region"
      aria-label="Memory signals and reminders"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-amber-600 shrink-0">
          <Bell className="h-3 w-3" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Reminders</span>
          <span className="text-[9px] font-medium bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">
            {signals.length}
          </span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <div className="flex items-center gap-1 overflow-hidden">
          {displayedSignals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSignalClick(s.task_id)}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium transition-all whitespace-nowrap shrink-0 ${
                s.severity === 'critical'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="max-w-[120px] truncate">{s.label}</span>
            </button>
          ))}
          
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllPopup(true)}
              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 whitespace-nowrap shrink-0"
            >
              +{hiddenCount} more
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        
        {signals.length > visibleCount && (
          <button
            type="button"
            onClick={() => setShowAllPopup(true)}
            className="ml-auto text-[9px] font-medium text-blue-600 hover:text-blue-700 hover:underline shrink-0"
          >
            Show all
          </button>
        )}
      </div>

      {/* All Reminders Popup */}
      {showAllPopup && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowAllPopup(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 mx-3 lg:mx-4 z-50 bg-white rounded-lg border border-slate-200 shadow-xl max-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[10px] font-semibold text-slate-900">All Reminders</span>
                <span className="text-[9px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  {signals.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPopup(false)}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[240px] scrollbar-blue-thin">
              <div className="p-2 space-y-1">
                {signals.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSignalClick(s.task_id)}
                    className={`w-full flex items-start gap-2 rounded-lg p-2 text-left transition-all ${
                      s.severity === 'critical'
                        ? 'bg-red-50 hover:bg-red-100 border border-red-200'
                        : 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <AlertTriangle 
                      className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                        s.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-medium ${
                        s.severity === 'critical' ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        {s.label}
                      </p>
                    </div>
                    <ChevronRight className={`h-3 w-3 shrink-0 ${
                      s.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
