import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Brain,
  Send,
  Loader2,
  MessageSquare,
  Lightbulb,
  Sparkles,
  Copy,
  Check
} from 'lucide-react'
import { campaignGoalsAPI } from '../lib/api'
import { toast } from 'react-hot-toast'

interface AISalesCoachChatProps {
  goalId: string
  goalName: string
  goalDescription?: string
  context?: {
    todo_items?: any[]
    prospect_info?: any
    message?: string
    call_script?: string
    summary?: string
  }
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: {
    suggestions?: string[]
    message_variations?: Array<{ version: string; message: string }>
    call_preparation?: {
      key_points?: string[]
      potential_objections?: string[]
      responses?: string[]
    }
    simulated_response?: string
  }
}

const AISalesCoachChat: React.FC<AISalesCoachChatProps> = ({
  goalId,
  goalName,
  context
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI Sales Coach for "${goalName}". I'm here to help you:\n\n• Understand why certain follow-ups are suggested\n• Get different versions of messages\n• Prepare for calls\n• Simulate prospect responses\n• Answer any sales questions\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = useMutation({
    mutationFn: (question: string) =>
      campaignGoalsAPI.chatWithSalesCoach(goalId, {
        question,
        context
      }),
    onSuccess: (data) => {
      const response = data.data || data
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer || 'No response',
        timestamp: new Date(),
        data: {
          suggestions: response.suggestions,
          message_variations: response.message_variations,
          call_preparation: response.call_preparation,
          simulated_response: response.simulated_response
        }
      }
      setMessages(prev => [...prev, newMessage])
      setInput('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to get response from AI Sales Coach')
    }
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatMutation.isPending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    chatMutation.mutate(input.trim())
  }

  const handleCopy = (text: string, index: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Sales Coach</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              
              {/* Message Variations */}
              {message.data?.message_variations && message.data.message_variations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-gray-700">Message Variations:</span>
                  </div>
                  <div className="space-y-2">
                    {message.data.message_variations.map((variation, idx) => (
                      <div key={idx} className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600 capitalize">{variation.version}</span>
                          <button
                            onClick={() => handleCopy(variation.message, `${message.id}-var-${idx}`)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            {copiedIndex === `${message.id}-var-${idx}` ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{variation.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call Preparation */}
              {message.data?.call_preparation && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-gray-700">Call Preparation:</span>
                  </div>
                  {message.data.call_preparation.key_points && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 mb-1">Key Points:</div>
                      <ul className="space-y-1">
                        {message.data.call_preparation.key_points.map((point, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.data.call_preparation.potential_objections && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 mb-1">Potential Objections:</div>
                      <ul className="space-y-1">
                        {message.data.call_preparation.potential_objections.map((obj, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-amber-600 mt-1">⚠</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.data.call_preparation.responses && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Suggested Responses:</div>
                      <ul className="space-y-1">
                        {message.data.call_preparation.responses.map((resp, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Simulated Response */}
              {message.data?.simulated_response && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-700">Simulated Prospect Response:</span>
                  </div>
                  <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200/50">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap italic">
                      "{message.data.simulated_response}"
                    </p>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.data?.suggestions && message.data.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Suggestions:</div>
                  <ul className="space-y-1">
                    {message.data.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder="Ask me anything about your sales strategy..."
            rows={2}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInput('Why is this follow-up suggested?')}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Why this follow-up?
          </button>
          <button
            type="button"
            onClick={() => setInput('Give me 3 different versions of this message')}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Message variations
          </button>
          <button
            type="button"
            onClick={() => setInput('Help me prepare for this call')}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Prepare for call
          </button>
          <button
            type="button"
            onClick={() => setInput('How might the prospect respond?')}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Simulate response
          </button>
        </div>
      </form>
    </div>
  )
}

export default AISalesCoachChat
