import React from 'react'
import { Mail, MessageCircle, Phone, Video, MoreVertical, RefreshCw } from 'lucide-react'
import { FaLinkedin, FaWhatsapp } from 'react-icons/fa'

interface PrioritizedProspect {
  id: string
  prospect_id: string
  prospect_name: string
  what: string
  when: string
  channel: 'Gmail' | 'Telegram' | 'AI Call' | 'Linkedin' | 'Whatsapp'
  priority?: number
  confidence?: number
  reasoning?: string
}

interface PrioritizedProspectsListProps {
  prospects: PrioritizedProspect[]
  selectedProspectId: string | null
  selectedActionId: string | null
  onSelectAction: (prospectId: string, actionId: string) => void
  onRegenerate?: () => void
  isGenerating?: boolean
}

const PrioritizedProspectsList: React.FC<PrioritizedProspectsListProps> = ({
  prospects,
  selectedProspectId,
  selectedActionId,
  onSelectAction,
  onRegenerate,
  isGenerating = false
}) => {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Gmail':
      case 'email':
        return <Mail className="h-4 w-4 text-gray-600" />
      case 'Whatsapp':
      case 'whatsapp':
        return <FaWhatsapp className="h-4 w-4 text-green-600" />
      case 'Linkedin':
      case 'linkedin':
        return <FaLinkedin className="h-4 w-4 text-blue-600" />
      case 'AI Call':
      case 'call':
        return <Phone className="h-4 w-4 text-gray-600" />
      case 'Telegram':
      case 'telegram':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'video_call':
        return <Video className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'Gmail':
      case 'email':
        return 'Gmail'
      case 'Whatsapp':
      case 'whatsapp':
        return 'WhatsApp'
      case 'Linkedin':
      case 'linkedin':
        return 'LinkedIn'
      case 'AI Call':
      case 'call':
        return 'AI Call'
      case 'Telegram':
      case 'telegram':
        return 'Telegram'
      case 'video_call':
        return 'Video Call'
      default:
        return channel
    }
  }

  const getWhenLabel = (when: string) => {
    const whenLower = when.toLowerCase()
    if (whenLower.includes('now')) {
      return 'Now'
    }
    if (whenLower.includes('today')) {
      // Check if it has a time like "today 4:00pm"
      const timeMatch = when.match(/(\d+)(:?\d*)\s*(am|pm|AM|PM)/i)
      if (timeMatch) {
        return `Today ${timeMatch[0]}`
      }
      return 'Today'
    }
    if (whenLower.includes('tomorrow')) {
      return 'Tomorrow'
    }
    if (whenLower.includes('friday')) {
      return 'Friday'
    }
    return when
  }

  // Sort prospects by priority and when
  const sortedProspects = [...prospects].sort((a, b) => {
    // Sort by priority first (higher priority first)
    const priorityA = a.priority || 0
    const priorityB = b.priority || 0
    if (priorityB !== priorityA) return priorityB - priorityA
    
    // Then by when (NOW > Today > Tomorrow > others)
    const whenA = a.when.toLowerCase()
    const whenB = b.when.toLowerCase()
    if (whenA.includes('now')) return -1
    if (whenB.includes('now')) return 1
    if (whenA.includes('today')) return -1
    if (whenB.includes('today')) return 1
    if (whenA.includes('tomorrow')) return -1
    if (whenB.includes('tomorrow')) return 1
    return 0
  })

  // Get avatar initial or use a default
  const getAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
        {initials}
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-100 shadow-lg shadow-sky-100/60">
      {/* Header */}
      <div className="px-6 py-4 border-b border-sky-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Prioritized Prospects</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button className="p-1.5 hover:bg-sky-50 rounded-xl transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sky-50 bg-sky-50/60">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.08em]">Prospect</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.08em]">What</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.08em]">When</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.08em]">Channel</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-[0.08em]">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white/80 divide-y divide-slate-100">
            {sortedProspects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No prioritized prospects found. Click "Regenerate" to generate prioritized prospects.
                </td>
              </tr>
            ) : (
              sortedProspects.map((prospect) => {
                const isSelected = selectedProspectId === prospect.prospect_id && selectedActionId === prospect.id
                
                return (
                  <tr
                    key={prospect.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50'
                        : 'hover:bg-sky-50/60'
                    }`}
                    onClick={() => onSelectAction(prospect.prospect_id, prospect.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getAvatar(prospect.prospect_name)}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{prospect.prospect_name}</span>
                          {prospect.confidence && (
                            <span className="text-xs text-slate-400">Confidence: {prospect.confidence.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{prospect.what}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-900">{getWhenLabel(prospect.when)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(prospect.channel)}
                        <span className="text-sm text-slate-900">{getChannelName(prospect.channel)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectAction(prospect.prospect_id, prospect.id)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-sm tracking-wide"
                      >
                        OPEN
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PrioritizedProspectsList
