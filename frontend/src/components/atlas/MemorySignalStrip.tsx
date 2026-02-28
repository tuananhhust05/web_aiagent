import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface MemorySignal {
  id: string
  message: string
  type: 'warning' | 'urgent' | 'reminder'
  context?: string
  riskLevel?: 'low' | 'medium' | 'high'
  riskDescription?: string
  recommendedAction?: string
  taskId?: string
}

export interface MemorySignalStripProps {
  signals: MemorySignal[]
  onGoToReply?: (taskId: string) => void
}

const RISK_COLORS = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
}

export default function MemorySignalStrip({ signals, onGoToReply }: MemorySignalStripProps) {
  const [selectedSignal, setSelectedSignal] = useState<MemorySignal | null>(null)

  if (signals.length === 0) return null

  const handleChipClick = (signal: MemorySignal) => {
    setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)
  }

  const handleClose = () => {
    setSelectedSignal(null)
  }

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Header Strip */}
      <div className="bg-red-50 border-b border-red-100 px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 text-red-700 shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Attention Required</span>
          </div>
          
          {/* Signal Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {signals.map((signal) => (
              <button
                key={signal.id}
                type="button"
                onClick={() => handleChipClick(signal)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  selectedSignal?.id === signal.id
                    ? 'bg-red-600 text-white ring-2 ring-red-300'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {signal.message}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Detail Card */}
      {selectedSignal && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">{selectedSignal.message}</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context */}
            {selectedSignal.context && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Context
                </p>
                <p className="text-sm text-slate-700">
                  {selectedSignal.context}
                </p>
              </div>
            )}

            {/* Risk Level */}
            {selectedSignal.riskLevel && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Risk Level
                </p>
                <p className={cn('text-sm font-medium', RISK_COLORS[selectedSignal.riskLevel])}>
                  {selectedSignal.riskLevel.charAt(0).toUpperCase() + selectedSignal.riskLevel.slice(1)}
                  {selectedSignal.riskDescription && (
                    <span className="font-normal text-slate-600"> • {selectedSignal.riskDescription}</span>
                  )}
                </p>
              </div>
            )}

            {/* Recommended Action */}
            {selectedSignal.recommendedAction && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Recommended Action
                </p>
                <p className="text-sm text-slate-700">
                  {selectedSignal.recommendedAction}
                </p>
              </div>
            )}

            {/* CTA Button */}
            {selectedSignal.taskId && onGoToReply && (
              <button
                type="button"
                onClick={() => {
                  onGoToReply(selectedSignal.taskId!)
                  handleClose()
                }}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Prepared Reply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
