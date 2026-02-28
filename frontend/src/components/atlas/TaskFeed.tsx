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
    <div className="h-full overflow-y-auto scrollbar-blue-thin">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" aria-hidden />
          <span className="text-xs font-medium">Loading tasks…</span>
        </div>
      )}
      
      {!loading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Inbox className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-xs font-medium text-slate-700">{emptyState.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-[200px]">{emptyState.description}</p>
        </div>
      )}
      
      {!loading && tasks.length > 0 && (
        <div className="p-2 space-y-1.5" role="list">
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
