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
      className="px-4 lg:px-6 py-1.5"
      role="region"
      aria-label="Memory signals and reminders"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-amber-600 shrink-0">
          <Bell className="h-3 w-3" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Reminders</span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-blue-thin">
          {signals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectTask(s.task_id)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all focus:outline-none focus:ring-1 focus:ring-offset-1 whitespace-nowrap shrink-0 ${
                s.severity === 'critical'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-red-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500 border border-amber-200'
              }`}
            >
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="max-w-[160px] truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
