import { AlertTriangle, Bell } from 'lucide-react'
import type { MemorySignal } from '../../lib/api'

export interface MemorySignalsBarProps {
  signals: MemorySignal[]
  onSelectTask: (taskId: string) => void
}

export default function MemorySignalsBar({ signals, onSelectTask }: MemorySignalsBarProps) {
  if (signals.length === 0) return null
  
  return (
    <div
      className="px-6 lg:px-8 py-3"
      role="region"
      aria-label="Memory signals and reminders"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-amber-600">
          <Bell className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Reminders</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex flex-wrap items-center gap-2">
          {signals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectTask(s.task_id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                s.severity === 'critical'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-red-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500 border border-amber-200'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="max-w-[200px] truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
