import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send, Loader2, RefreshCw, MessageCircle } from 'lucide-react'
import { whatsappAPI } from '../lib/api'
// import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Message {
  id: number
  conversation_id: number
  sender: string
  content: string
  type: string
  from_ai: number
  created_at: number
  updated_at: number
  is_summarized: number
}

interface MessagesResponse {
  status: string
  data: {
    messages: Message[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      limit: number
      has_next: boolean
      has_prev: boolean
    }
  }
}

export default function WhatsAppConversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const { data: messagesResponse, isLoading, error, refetch } = useQuery<MessagesResponse>({
    queryKey: ['whatsapp-messages', id, page],
    queryFn: async () => {
      console.log('🔄 Fetching WhatsApp messages...', { conversation_id: id, page })
      const response = await whatsappAPI.getMessages({
        conversation_id: parseInt(id!),
        page: page,
        limit: 20
      })
      console.log('✅ WhatsApp messages response:', response.data)
      return response.data
    },
    enabled: !!id,
    retry: 3,
  })

  // Update messages list when new data arrives
  useEffect(() => {
    if (messagesResponse?.data?.messages) {
      if (page === 1) {
        setAllMessages(messagesResponse.data.messages.reverse()) // Reverse to show oldest first
      } else {
        setAllMessages(prev => [...messagesResponse.data.messages.reverse(), ...prev])
      }
    }
  }, [messagesResponse, page])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (page === 1) {
      scrollToBottom()
    }
  }, [allMessages, page])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLoadMore = async () => {
    if (messagesResponse?.data?.pagination.has_prev && !isLoadingMore) {
      setIsLoadingMore(true)
      setPage(prev => prev + 1)
      setTimeout(() => setIsLoadingMore(false), 1000)
    }
  }

  const handleRefresh = () => {
    setPage(1)
    setAllMessages([])
    refetch()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const shouldShowDate = (message: Message, index: number) => {
    if (index === 0) return true
    
    const currentDate = new Date(message.created_at * 1000).toDateString()
    const previousDate = new Date(allMessages[index - 1].created_at * 1000).toDateString()
    
    return currentDate !== previousDate
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load messages
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            There was an error loading the conversation. Please try again.
          </p>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/whatsapp')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Conversation #{id}</h1>
                <p className="text-sm text-gray-500">WhatsApp Chat</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500 font-medium">Loading messages...</p>
            </div>
          </div>
        ) : allMessages.length > 0 ? (
          <div className="space-y-4">
            {/* Load More Button */}
            {messagesResponse?.data?.pagination.has_prev && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn btn-outline btn-sm"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load Earlier Messages'
                  )}
                </button>
              </div>
            )}

            {/* Messages */}
            {allMessages.map((message, index) => (
              <div key={message.id}>
                {/* Date separator */}
                {shouldShowDate(message, index) && (
                  <div className="flex justify-center my-6">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${message.from_ai ? 'justify-start' : 'justify-end'} mb-2`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.from_ai 
                      ? 'bg-white border border-gray-200 rounded-bl-md' 
                      : 'bg-blue-500 text-white rounded-br-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className={`flex justify-end mt-2 ${
                      message.from_ai ? 'text-gray-400' : 'text-blue-100'
                    }`}>
                      <span className="text-xs">
                        {formatTime(message.created_at)}
                        {message.from_ai === 0 && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No messages yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              This conversation doesn't have any messages yet.
            </p>
          </div>
        )}
      </div>

      {/* Input Area (Placeholder for future implementation) */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-3">
              <p className="text-gray-500 text-sm">Message input will be implemented here</p>
            </div>
            <button
              disabled
              className="p-3 bg-gray-200 text-gray-400 rounded-full cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
