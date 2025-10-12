import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MessageCircle, ArrowLeft, Loader2, RefreshCw, Upload, FileText, X } from 'lucide-react'
import { whatsappAPI } from '../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Conversation {
  id: number
  members: string[]
  created_at: number
  updated_at: number
  agentid: string
  lastMessage: {
    id: number
    sender: string
    content: string
    type: string
    from_ai: number
    created_at: number
    updated_at: number
  } | null
}

interface ConversationsResponse {
  status: string
  data: {
    conversations: Conversation[]
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

export default function WhatsApp() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [allConversations, setAllConversations] = useState<Conversation[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { data: conversationsResponse, isLoading, error, refetch } = useQuery<ConversationsResponse>({
    queryKey: ['whatsapp-conversations', page],
    queryFn: async () => {
      const response = await whatsappAPI.getConversations({
        member_id: "8386",
        page: page,
        limit: 10
      })
      return response.data
    },
    retry: 1,
    retryDelay: 1000,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => whatsappAPI.uploadRAGFile(file),
    onSuccess: () => {
      toast.success('RAG file uploaded successfully!')
      setSelectedFile(null)
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload RAG file')
    },
  })

  // Update conversations list when new data arrives
  useEffect(() => {
    if (conversationsResponse?.data?.conversations) {
      if (page === 1) {
        setAllConversations(conversationsResponse.data.conversations)
      } else {
        setAllConversations(prev => [...prev, ...conversationsResponse.data.conversations])
      }
    }
  }, [conversationsResponse, page])

  const handleLoadMore = async () => {
    if (conversationsResponse?.data?.pagination.has_next && !isLoadingMore) {
      setIsLoadingMore(true)
      setPage(prev => prev + 1)
      // Wait for the query to complete
      setTimeout(() => setIsLoadingMore(false), 1000)
    }
  }

  const handleRefresh = () => {
    setPage(1)
    setAllConversations([])
    refetch()
  }

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getContactName = (members: string[]) => {
    const contactMember = members.find(member => member !== "8386")
    if (!contactMember) return "Unknown Contact"
    
    // Extract phone number from whatsapp:+84339170155 format
    if (contactMember.startsWith('whatsapp:+')) {
      return contactMember.replace('whatsapp:+', '+')
    }
    return contactMember
  }

  const getContactAvatar = (members: string[]) => {
    const contactMember = members.find(member => member !== "8386")
    if (!contactMember) return "?"
    
    // Generate initials from phone number
    if (contactMember.startsWith('whatsapp:+')) {
      const phone = contactMember.replace('whatsapp:+', '')
      return phone.slice(-2) // Last 2 digits
    }
    return contactMember.slice(-2)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load conversations
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            There was an error loading your WhatsApp conversations. Please try again.
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
                <p className="text-sm text-gray-500">Phone: +14155238886</p>
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

      {/* RAG Training Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">RAG Training</h2>
              <p className="text-sm text-gray-600">Upload PDF files to train the AI model</p>
            </div>
          </div>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your PDF file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Only PDF files are supported for RAG training
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="btn btn-primary btn-sm"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Training...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Train Model
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    disabled={uploadMutation.isPending}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500 font-medium">Loading conversations...</p>
            </div>
          </div>
        ) : allConversations.length > 0 ? (
          <div className="space-y-1">
            {allConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => navigate(`/whatsapp/conversation/${conversation.id}`)}
                className="bg-white rounded-2xl p-4 hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {getContactAvatar(conversation.members)}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {getContactName(conversation.members)}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {conversation.lastMessage ? formatTime(conversation.lastMessage.created_at) : 'No messages'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.from_ai ? (
                            <span className="text-blue-600">AI: </span>
                          ) : (
                            <span className="text-gray-500">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">No messages yet</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex flex-col items-end space-y-1">
                    {conversation.lastMessage && conversation.lastMessage.from_ai === 0 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {conversationsResponse?.data?.pagination.has_next && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn btn-outline btn-lg"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No conversations yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Your WhatsApp conversations will appear here once you start chatting with customers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
