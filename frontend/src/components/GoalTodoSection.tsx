import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Video,
  Send,
  Edit,
  Loader2,
  RefreshCw,
  AlertCircle,
  Zap,
  Target
} from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa'
import { campaignGoalsAPI } from '../lib/api'
import { toast } from 'react-hot-toast'

interface GoalTodoSectionProps {
  goalId: string
  goalName: string
  goalDescription?: string
}

interface TodoAction {
  id: string
  what: string
  when: string
  channel: 'email' | 'whatsapp' | 'linkedin' | 'call' | 'video_call'
  priority: 'high' | 'medium' | 'low'
  message?: string
  call_script?: string
  topics?: string[]
  reason: string
}

interface TodoItem {
  prospect_id: string
  prospect_name: string
  prospect_company: string
  actions: TodoAction[]
}

interface TodoData {
  todo_items: TodoItem[]
  summary?: string
}

const GoalTodoSection: React.FC<GoalTodoSectionProps> = ({
  goalId
}) => {
  const [editingAction, setEditingAction] = useState<{ itemId: string; actionId: string; content: string } | null>(null)
  const [forceRefresh, setForceRefresh] = useState(false)

  // Fetch to-do items
  const {
    data: todoData,
    isLoading,
    refetch,
    error
  } = useQuery<TodoData>({
    queryKey: ['goal-todo-items', goalId, forceRefresh],
    queryFn: async () => {
      try {
        const response = await campaignGoalsAPI.getGoalTodoItems(goalId, forceRefresh);
        console.log('📊 [GoalTodoSection] Raw API Response:', response);
        // Axios wraps response in .data
        const data = response.data;
        console.log('📊 [GoalTodoSection] Extracted Data:', data);
        console.log('📊 [GoalTodoSection] todo_items:', data?.todo_items);
        console.log('📊 [GoalTodoSection] todo_items type:', typeof data?.todo_items);
        console.log('📊 [GoalTodoSection] todo_items is array:', Array.isArray(data?.todo_items));
        
        // Validate data structure
        if (data && data.todo_items && Array.isArray(data.todo_items)) {
          console.log('✅ [GoalTodoSection] Data structure is valid');
          console.log('📊 [GoalTodoSection] Number of prospects:', data.todo_items.length);
          data.todo_items.forEach((item: any, idx: number) => {
            console.log(`📊 [GoalTodoSection] Prospect ${idx + 1}:`, {
              name: item.prospect_name,
              company: item.prospect_company,
              actions_count: item.actions?.length || 0,
              actions: item.actions
            });
          });
        } else {
          console.error('❌ [GoalTodoSection] Invalid data structure:', data);
        }
        
        return data;
      } catch (err) {
        console.error('❌ [GoalTodoSection] Error fetching todo items:', err);
        throw err;
      }
    },
    enabled: !!goalId,
    retry: 1
  })

  // Debug: Log todoData whenever it changes
  useEffect(() => {
    if (todoData) {
      console.log('📊 [GoalTodoSection] todoData updated:', todoData);
      console.log('📊 [GoalTodoSection] todo_items:', todoData.todo_items);
      console.log('📊 [GoalTodoSection] todo_items length:', todoData.todo_items?.length);
      console.log('📊 [GoalTodoSection] todo_items is array:', Array.isArray(todoData.todo_items));
      console.log('📊 [GoalTodoSection] Checking empty state:');
      console.log('  - todoData exists:', !!todoData);
      console.log('  - todo_items exists:', !!todoData.todo_items);
      console.log('  - todo_items is array:', Array.isArray(todoData.todo_items));
      console.log('  - todo_items length:', todoData.todo_items?.length);
    } else {
      console.log('📊 [GoalTodoSection] todoData is null/undefined');
    }
  }, [todoData])

  const handleRefresh = async () => {
    try {
      // First, clear the cache
      await campaignGoalsAPI.clearGoalTodoCache(goalId)
      console.log('✅ [GoalTodoSection] Cache cleared, generating new analysis...')
      
      // Then force refresh to generate new analysis
      setForceRefresh(true)
      await refetch()
      setForceRefresh(false)
      toast.success('To-do list regenerated successfully!')
    } catch (error: any) {
      console.error('❌ [GoalTodoSection] Error regenerating:', error)
      toast.error(error.response?.data?.detail || 'Failed to regenerate to-do list')
      setForceRefresh(false)
    }
  }

  // Send message mutation (placeholder - will need actual send API)
  const sendMessageMutation = useMutation({
    mutationFn: async (_data: { action: TodoAction; prospect: TodoItem }) => {
      // TODO: Implement actual send message API
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Message sent successfully!')
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })


  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />
      case 'linkedin':
        return <FaLinkedin className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'video_call':
        return <Video className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'bg-purple-50 text-purple-600 border-purple-200'
      case 'whatsapp':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'linkedin':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'call':
        return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'video_call':
        return 'bg-red-50 text-red-600 border-red-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleEdit = (itemId: string, actionId: string, currentContent: string) => {
    setEditingAction({ itemId, actionId, content: currentContent })
  }

  const handleSaveEdit = () => {
    if (editingAction) {
      // Update the action content (in real app, this would update state/API)
      setEditingAction(null)
      toast.success('Message updated')
    }
  }

  const handleSend = (action: TodoAction, prospect: TodoItem) => {
    sendMessageMutation.mutate({ action, prospect })
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Generating to-do items...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load To-Do Items</h3>
          <p className="text-gray-600 text-sm mb-4">Unable to generate to-do items at this time.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!todoData) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data</h3>
          <p className="text-gray-600 text-sm">Waiting for data...</p>
        </div>
      </div>
    )
  }

  // Validate todo_items before rendering
  const validTodoItems = todoData?.todo_items && Array.isArray(todoData.todo_items) && todoData.todo_items.length > 0
    ? todoData.todo_items
    : null;

  if (!validTodoItems) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No To-Do Items</h3>
          <p className="text-gray-600 text-sm mb-4">No prospects found for this goal.</p>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Debug Info:</p>
            <p>• todoData exists: {todoData ? 'Yes' : 'No'}</p>
            <p>• todo_items exists: {todoData?.todo_items ? 'Yes' : 'No'}</p>
            <p>• todo_items type: {todoData?.todo_items ? (Array.isArray(todoData.todo_items) ? 'Array' : typeof todoData.todo_items) : 'N/A'}</p>
            <p>• todo_items length: {todoData?.todo_items?.length || 0}</p>
            {todoData && (
              <pre className="mt-4 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(todoData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Atlas - To-Do List</h3>
              <p className="text-xs text-gray-600">Actionable tasks to achieve your goal</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate new to-do list analysis"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Analysis
              </>
            )}
          </button>
        </div>

        {todoData.summary && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100/50">
            <p className="text-sm text-gray-700 leading-relaxed">{todoData.summary}</p>
          </div>
        )}
      </div>

      {/* To-Do Items by Prospect */}
      <div className="space-y-6">
        {validTodoItems.map((item) => (
          <div
            key={item.prospect_id}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden"
          >
            {/* Prospect Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {item.prospect_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-lg">{item.prospect_name}</h4>
                  <p className="text-sm text-gray-600">{item.prospect_company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                    {item.actions.length} {item.actions.length === 1 ? 'action' : 'actions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions List - Always Expanded */}
            <div className="p-5 space-y-4">
              {item.actions.map((action, actionIndex) => (
                <div
                  key={action.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 transition-all shadow-sm"
                >
                  {/* Action Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-purple-700">{actionIndex + 1}</span>
                          </div>
                          <h5 className="font-semibold text-gray-900 text-base">{action.what}</h5>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${getChannelColor(action.channel)}`}>
                          {getChannelIcon(action.channel)}
                          {action.channel.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{action.when}</span>
                        </div>
                      </div>
                      {action.reason && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                          <p className="text-xs font-medium text-blue-900 mb-1">Why this action:</p>
                          <p className="text-sm text-blue-800">{action.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message or Call Script */}
                  {action.message && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-900">Ready-to-Send Message:</label>
                        <button
                          onClick={() => handleEdit(item.prospect_id, action.id, action.message || '')}
                          className="text-xs text-gray-600 hover:text-purple-600 flex items-center gap-1 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                      {editingAction?.itemId === item.prospect_id && editingAction?.actionId === action.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingAction.content}
                            onChange={(e) => setEditingAction(prev => prev ? { ...prev, content: e.target.value } : null)}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            rows={6}
                          />
                          <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit()}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                                >
                                  Save Changes
                                </button>
                            <button
                              onClick={() => setEditingAction(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {action.message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {action.call_script && (
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-gray-900 mb-2 block">Call Script & Topics:</label>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                          {action.call_script}
                        </p>
                        {action.topics && action.topics.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Topics to Cover:</div>
                            <div className="flex flex-wrap gap-2">
                              {action.topics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-200"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleSend(action, item)}
                      disabled={sendMessageMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendMessageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send {action.channel === 'email' ? 'Email' : action.channel === 'whatsapp' ? 'WhatsApp' : action.channel === 'linkedin' ? 'LinkedIn' : action.channel === 'call' ? 'Call' : 'Video Call'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GoalTodoSection
