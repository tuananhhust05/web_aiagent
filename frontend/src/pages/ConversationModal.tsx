import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Send, Loader2, Brain } from 'lucide-react'
import { inboxAPI } from '../lib/api'
import { toast } from 'react-hot-toast'
import AISalesCopilot from '../components/AISalesCopilot'

interface ConversationMessage {
  id: string
  platform: string
  contact: string
  content: string
  campaign_id?: string
  contact_id?: string
  created_at: string
  type?: 'incoming' | 'outgoing'
}

interface ConversationModalProps {
  campaignId: string
  contactUsername: string
  onClose: () => void
}

export default function ConversationModal({
  campaignId,
  contactUsername,
  onClose
}: ConversationModalProps) {
  const [message, setMessage] = useState('')
  const [showAICopilot, setShowAICopilot] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Fetch conversation history
  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', campaignId, contactUsername],
    queryFn: () => inboxAPI.getConversationHistory(campaignId, contactUsername, { limit: 100, skip: 0 }),
    enabled: !!campaignId && !!contactUsername
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => inboxAPI.sendMessage({
      campaign_id: campaignId,
      contact: contactUsername,
      content: content
    }),
    onSuccess: () => {
      setMessage('')
      // Refresh conversation history
      queryClient.invalidateQueries({ queryKey: ['conversation', campaignId, contactUsername] })
      // Also refresh inbox responses list
      queryClient.invalidateQueries({ queryKey: ['inbox-responses', campaignId] })
      toast.success('Message sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send message')
    }
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    sendMessageMutation.mutate(message.trim())
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const messages: ConversationMessage[] = conversation?.data || []

  const handleUseSuggestion = (suggestion: string) => {
    setMessage(suggestion)
    // Focus on textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      }
    }, 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-[95vw] mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conversation with {contactUsername}</h2>
              <p className="text-sm text-gray-500">Telegram</p>
            </div>
            <button
              onClick={() => setShowAICopilot(!showAICopilot)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                showAICopilot
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Brain className="h-4 w-4" />
              AI Coach
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${showAICopilot ? 'w-2/3' : 'w-full'}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.type === 'outgoing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.type === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-end space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </form>
          </div>

          {/* AI Sales Coach Sidebar */}
          {showAICopilot && (
            <div className="w-1/3 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4">
              <AISalesCopilot
                campaignId={campaignId}
                telegramUsername={contactUsername}
                onUseSuggestion={handleUseSuggestion}
                conversationHistory={messages.map(msg => ({
                  id: msg.id,
                  type: msg.type || 'incoming',
                  content: msg.content,
                  created_at: msg.created_at
                }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
