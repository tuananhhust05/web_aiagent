import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  FileEdit,
  ChevronDown,
  X,
  AlertCircle,
  Package,
  Wrench,
  Building2,
  Clock,
  Eye,
  Edit3,
  Trash2,
  Check,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Zap,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'
import {
  atlasAPI,
  type AtlasQnARecord,
  type AtlasQnAClassification,
  type AtlasQnAStatus,
  type AtlasQnAStats,
} from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type SortField = 'usage_count' | 'created_at' | 'last_used_at'
type SortOrder = 'asc' | 'desc'

const CLASSIFICATION_CONFIG: Record<AtlasQnAClassification, { label: string; icon: typeof Package; color: string; bg: string; gradient: string }> = {
  product: { label: 'Product', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500 to-cyan-500' },
  service: { label: 'Service', icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50', gradient: 'from-purple-500 to-pink-500' },
  general: { label: 'General', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100', gradient: 'from-slate-500 to-slate-600' },
}

const STATUS_CONFIG: Record<AtlasQnAStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Draft', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  archived: { label: 'Archived', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
}

function StatCard({ label, value, icon: Icon, trend, gradient }: { label: string; value: number | string; icon: typeof TrendingUp; trend?: number; gradient: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
      <div className="flex items-center justify-between relative">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-2 relative">
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function QnADetailModal({
  item,
  isOpen,
  onClose,
  onSave,
  onApprove,
  onDelete,
  canEdit,
  isNew = false,
}: {
  item: AtlasQnARecord | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<AtlasQnARecord>) => void
  onApprove?: () => void
  onDelete?: () => void
  canEdit: boolean
  isNew?: boolean
}) {
  const [question, setQuestion] = useState(item?.question || '')
  const [answer, setAnswer] = useState(item?.answer || '')
  const [classification, setClassification] = useState<AtlasQnAClassification>(item?.classification || 'general')
  const [productTag, setProductTag] = useState(item?.product_tag || '')
  const [serviceTag, setServiceTag] = useState(item?.service_tag || '')
  const [isEditing, setIsEditing] = useState(isNew)

  if (!isOpen) return null

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer are required')
      return
    }
    onSave({
      question: question.trim(),
      answer: answer.trim(),
      classification,
      product_tag: productTag || undefined,
      service_tag: serviceTag || undefined,
    })
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-sm font-semibold text-slate-900">
            {isNew ? 'Add New Q&A' : isEditing ? 'Edit Q&A' : 'Q&A Details'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-blue-thin max-h-[calc(85vh-100px)]">
          {!isNew && item && !isEditing && (() => {
            const itemStatus = item.status || 'draft'
            const itemClassification = item.classification || 'general'
            const statusConfig = STATUS_CONFIG[itemStatus] || STATUS_CONFIG.draft
            const classConfig = CLASSIFICATION_CONFIG[itemClassification] || CLASSIFICATION_CONFIG.general
            const ClassIcon = classConfig.icon
            
            return (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', statusConfig.bg, statusConfig.color, statusConfig.border)}>
                {statusConfig.label}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1', classConfig.bg, classConfig.color)}>
                <ClassIcon className="h-3 w-3" />
                {classConfig.label}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {item.usage_count} uses
              </span>
            </div>
            )
          })()}

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1">Question</label>
              {isEditing ? (
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter the question..."
                />
              ) : (
                <p className="text-xs text-slate-900 bg-slate-50 px-3 py-2 rounded-lg break-words">{item?.question}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1">Answer</label>
              {isEditing ? (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter the canonical answer..."
                />
              ) : (
                <p className="text-xs text-slate-900 bg-slate-50 px-3 py-2 rounded-lg whitespace-pre-wrap break-words">{item?.answer}</p>
              )}
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Classification</label>
                  <div className="flex gap-1.5">
                    {(Object.keys(CLASSIFICATION_CONFIG) as AtlasQnAClassification[]).map((key) => {
                      const config = CLASSIFICATION_CONFIG[key]
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setClassification(key)}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all',
                            classification === key
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {classification === 'product' && (
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Product Tag</label>
                    <input
                      type="text"
                      value={productTag}
                      onChange={(e) => setProductTag(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Enterprise Plan"
                    />
                  </div>
                )}

                {classification === 'service' && (
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Service Tag</label>
                    <input
                      type="text"
                      value={serviceTag}
                      onChange={(e) => setServiceTag(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Implementation"
                    />
                  </div>
                )}
              </>
            )}

            {!isNew && item && !isEditing && (
              <div className="pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-500">Created</span>
                    <p className="text-slate-900 font-medium">
                      {new Date(item.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {item.approved_at && (
                    <div>
                      <span className="text-slate-500">Approved by</span>
                      <p className="text-slate-900 font-medium">{item.approved_by_user_name || 'Admin'}</p>
                    </div>
                  )}
                  {item.last_used_at && (
                    <div>
                      <span className="text-slate-500">Last Used</span>
                      <p className="text-slate-900 font-medium">
                        {new Date(item.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div>
            {!isNew && canEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-2.5 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-3 w-3 inline mr-1" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!isNew && !isEditing && canEdit && (
              <button
                type="button"
                onClick={() => {
                  setQuestion(item?.question || '')
                  setAnswer(item?.answer || '')
                  setClassification(item?.classification || 'general')
                  setProductTag(item?.product_tag || '')
                  setServiceTag(item?.service_tag || '')
                  setIsEditing(true)
                }}
                className="px-3 py-1.5 text-[10px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Edit3 className="h-3 w-3 inline mr-1" />
                Edit
              </button>
            )}
            {!isNew && (!item?.status || item?.status === 'draft') && canEdit && onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="px-3 py-1.5 text-[10px] font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Check className="h-3 w-3 inline mr-1" />
                Approve
              </button>
            )}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => isNew ? onClose() : setIsEditing(false)}
                  className="px-3 py-1.5 text-[10px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-[10px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AtlasQnAPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [classificationFilter, setClassificationFilter] = useState<AtlasQnAClassification | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AtlasQnAStatus | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('usage_count')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<AtlasQnARecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const isOwner = user?.workspace_role === 'owner' || user?.role === 'company_admin'

  const { data: qnaData, isLoading } = useQuery({
    queryKey: ['atlas-qna', searchQuery, classificationFilter, statusFilter, sortField, sortOrder, page],
    queryFn: () =>
      atlasAPI.listQna({
        search: searchQuery || undefined,
        classification: classificationFilter !== 'all' ? classificationFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortField,
        sort_order: sortOrder,
        page,
        limit: 20,
      }).then((r) => r.data),
    staleTime: 30 * 1000,
  })

  const { data: stats } = useQuery({
    queryKey: ['atlas-qna-stats'],
    queryFn: () => atlasAPI.getQnaStats().then((r) => r.data),
    staleTime: 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof atlasAPI.createQna>[0]) => atlasAPI.createQna(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atlas-qna'] })
      queryClient.invalidateQueries({ queryKey: ['atlas-qna-stats'] })
      toast.success('Q&A created')
      setIsCreating(false)
    },
    onError: () => toast.error('Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof atlasAPI.updateQna>[1] }) =>
      atlasAPI.updateQna(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atlas-qna'] })
      toast.success('Updated')
    },
    onError: () => toast.error('Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => atlasAPI.approveQna(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atlas-qna'] })
      queryClient.invalidateQueries({ queryKey: ['atlas-qna-stats'] })
      toast.success('Approved')
      setIsDetailOpen(false)
      setSelectedItem(null)
    },
    onError: () => toast.error('Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => atlasAPI.deleteQna(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atlas-qna'] })
      queryClient.invalidateQueries({ queryKey: ['atlas-qna-stats'] })
      toast.success('Deleted')
      setIsDetailOpen(false)
      setSelectedItem(null)
    },
    onError: () => toast.error('Failed'),
  })

  const items = qnaData?.items ?? []
  const total = qnaData?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const mockStats: AtlasQnAStats = stats || {
    total_questions: items.length,
    approved_count: items.filter((i) => i.status === 'approved').length,
    draft_count: items.filter((i) => i.status === 'draft').length,
    total_usage: items.reduce((sum, i) => sum + i.usage_count, 0),
    top_questions: items.slice(0, 5).map((i) => ({ id: i.id, question: i.question, usage_count: i.usage_count })),
    classification_breakdown: {
      product: items.filter((i) => i.classification === 'product').length,
      service: items.filter((i) => i.classification === 'service').length,
      general: items.filter((i) => i.classification === 'general').length,
    },
    recent_trend: [],
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-400" />
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-600" /> : <ArrowDown className="h-3 w-3 text-blue-600" />
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 overflow-hidden">
      {/* Header - Compact */}
      <header className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Q&A Engine</h1>
              <p className="text-[10px] text-slate-500">AI-powered question archive</p>
            </div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-semibold hover:from-blue-700 hover:to-purple-700 shadow-sm"
            >
              <Plus className="h-3 w-3" />
              Add Q&A
            </button>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-blue-thin p-4">
        {/* Stats Grid - Compact with gradients */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Questions" value={mockStats.total_questions} icon={HelpCircle} gradient="from-blue-500 to-cyan-500" />
          <StatCard label="Approved" value={mockStats.approved_count} icon={CheckCircle2} trend={12} gradient="from-emerald-500 to-teal-500" />
          <StatCard label="Pending Review" value={mockStats.draft_count} icon={FileEdit} gradient="from-amber-500 to-orange-500" />
          <StatCard label="Total Usage" value={mockStats.total_usage} icon={TrendingUp} trend={8} gradient="from-purple-500 to-pink-500" />
        </div>

        {/* Pending alert */}
        {mockStats.draft_count > 0 && isOwner && (
          <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-100">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-amber-800">
                {mockStats.draft_count} Q&A pending approval
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className="px-2.5 py-1 text-[10px] font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50"
            >
              Review
            </button>
          </div>
        )}

        {/* Top Questions - Colorful cards */}
        {mockStats.top_questions.length > 0 && (
          <div className="mb-4 bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded bg-gradient-to-br from-purple-500 to-pink-500">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-[11px] font-semibold text-slate-900">Top Questions</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {mockStats.top_questions.slice(0, 5).map((q, idx) => {
                const gradients = [
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-pink-500',
                  'from-emerald-500 to-teal-500',
                  'from-amber-500 to-orange-500',
                  'from-rose-500 to-red-500',
                ]
                return (
                  <div key={q.id} className="bg-slate-50 rounded-lg p-2 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradients[idx]}`} />
                    <div className="pl-2">
                      <span className={`text-lg font-bold bg-gradient-to-r ${gradients[idx]} bg-clip-text text-transparent`}>
                        #{idx + 1}
                      </span>
                      <p className="text-[9px] text-slate-600 line-clamp-2 mt-1">{q.question}</p>
                      <p className="text-[10px] font-semibold text-slate-900 mt-1">{q.usage_count} uses</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Search & Filter bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50/50">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search questions..."
                className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium border rounded-lg',
                  classificationFilter !== 'all' || statusFilter !== 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                )}
              >
                <Filter className="h-3 w-3" />
                Filters
                {(classificationFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                    {(classificationFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </button>

              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-20">
                    <div className="mb-3">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase mb-1.5">Classification</p>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setClassificationFilter('all')}
                          className={cn('w-full text-left px-2 py-1.5 rounded text-[10px]', classificationFilter === 'all' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50')}
                        >
                          All
                        </button>
                        {(Object.keys(CLASSIFICATION_CONFIG) as AtlasQnAClassification[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setClassificationFilter(key)}
                            className={cn('w-full text-left px-2 py-1.5 rounded text-[10px] flex items-center gap-1.5', classificationFilter === key ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50')}
                          >
                            {(() => { const Icon = CLASSIFICATION_CONFIG[key].icon; return <Icon className="h-3 w-3" /> })()}
                            {CLASSIFICATION_CONFIG[key].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase mb-1.5">Status</p>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className={cn('w-full text-left px-2 py-1.5 rounded text-[10px]', statusFilter === 'all' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50')}
                        >
                          All
                        </button>
                        {(Object.keys(STATUS_CONFIG) as AtlasQnAStatus[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setStatusFilter(key)}
                            className={cn('w-full text-left px-2 py-1.5 rounded text-[10px]', statusFilter === key ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50')}
                          >
                            {STATUS_CONFIG[key].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(classificationFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setClassificationFilter('all')
                          setStatusFilter('all')
                        }}
                        className="w-full mt-2 px-2 py-1.5 text-[10px] text-red-600 hover:bg-red-50 rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase">Question</th>
                  <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase w-24">Type</th>
                  <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase w-20">Status</th>
                  <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase w-20">
                    <button type="button" onClick={() => handleSort('usage_count')} className="flex items-center gap-1 hover:text-slate-700">
                      Usage
                      <SortIcon field="usage_count" />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase w-24">
                    <button type="button" onClick={() => handleSort('last_used_at')} className="flex items-center gap-1 hover:text-slate-700">
                      Last Used
                      <SortIcon field="last_used_at" />
                    </button>
                  </th>
                  <th className="px-3 py-2 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500">Loading...</p>
                    </td>
                  </tr>
                )}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[11px] font-medium text-slate-700">No Q&A found</p>
                      <p className="text-[10px] text-slate-500">Questions from calls will appear here</p>
                    </td>
                  </tr>
                )}
                {!isLoading && items.map((item) => {
                  const classification = item.classification || 'general'
                  const status = item.status || 'draft'
                  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG.general
                  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft
                  
                  return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedItem(item)
                      setIsDetailOpen(true)
                    }}
                  >
                    <td className="px-3 py-2">
                      <p className="text-[10px] text-slate-900 font-medium line-clamp-1">{item.question}</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{item.answer}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium', classConfig.bg, classConfig.color)}>
                        {(() => { const Icon = classConfig.icon; return <Icon className="h-2.5 w-2.5" /> })()}
                        {classConfig.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-medium', statusConfig.bg, statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] text-slate-900 font-semibold">{item.usage_count}</span>
                    </td>
                    <td className="px-3 py-2">
                      {item.last_used_at ? (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItem(item)
                          setIsDetailOpen(true)
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50/50">
              <p className="text-[10px] text-slate-500">
                {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-[10px] font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-[10px] font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <QnADetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedItem(null)
        }}
        onSave={(data) => {
          if (selectedItem) {
            updateMutation.mutate({ 
              id: selectedItem.id, 
              data: {
                question: data.question,
                answer: data.answer,
                classification: data.classification,
                product_tag: data.product_tag || undefined,
                service_tag: data.service_tag || undefined,
              }
            })
          }
        }}
        onApprove={() => {
          if (selectedItem) {
            approveMutation.mutate(selectedItem.id)
          }
        }}
        onDelete={() => {
          if (selectedItem && confirm('Delete this Q&A?')) {
            deleteMutation.mutate(selectedItem.id)
          }
        }}
        canEdit={isOwner}
      />

      <QnADetailModal
        item={null}
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSave={(data) => {
          createMutation.mutate({
            question: data.question || '',
            answer: data.answer || '',
            classification: data.classification || 'general',
            product_tag: data.product_tag || undefined,
            service_tag: data.service_tag || undefined,
            status: 'draft',
          })
        }}
        canEdit={true}
        isNew
      />
    </div>
  )
}
