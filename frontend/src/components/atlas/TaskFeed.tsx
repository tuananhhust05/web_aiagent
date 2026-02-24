import { Loader2, Inbox } from 'lucide-react'
import type { TodoItem } from '../../lib/api'
import type { TodoActiveTab } from '../../stores/useToDoStore'
import TaskCard from './TaskCard'

export interface TaskFeedProps {
  tasks: TodoItem[]
  activeTab: TodoActiveTab
  loading?: boolean
  onOpenTask: (task: TodoItem) => void
  onMarkDone: (task: TodoItem) => void
  onRegenerate?: (task: TodoItem) => void
  onSnooze?: (task: TodoItem) => void
}

const TAB_EMPTY_MESSAGES: Record<TodoActiveTab, { title: string; description: string }> = {
  ready: {
    title: 'No tasks ready to send',
    description: 'New tasks from emails and meetings will appear here',
  },
  needs_input: {
    title: 'No tasks need input',
    description: 'Tasks requiring your input will appear here',
  },
  overdue: {
    title: 'No overdue tasks',
    description: 'Great job staying on top of your tasks!',
  },
  completed: {
    title: 'No completed tasks',
    description: 'Completed tasks will be shown here',
  },
}

export default function TaskFeed({
  tasks,
  activeTab,
  loading,
  onOpenTask,
  onMarkDone,
  onRegenerate,
  onSnooze,
}: TaskFeedProps) {
  const emptyState = TAB_EMPTY_MESSAGES[activeTab]
  
  return (
    <div className="h-full overflow-y-auto">
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" aria-hidden />
          <span className="text-sm font-medium">Loading tasks…</span>
        </div>
      )}
      
      {!loading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">{emptyState.title}</p>
          <p className="text-sm text-slate-500 mt-1 max-w-[240px]">{emptyState.description}</p>
        </div>
      )}
      
      {!loading && tasks.length > 0 && (
        <div className="p-3 space-y-2" role="list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onMarkDone={onMarkDone}
              onRegenerate={onRegenerate}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </div>
  )
}
