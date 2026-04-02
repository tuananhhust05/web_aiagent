import { useState, useRef, useEffect } from 'react'
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
  Shield,
  BookOpen,
  PhoneCall,
  FileText,
  Link2,
  Brain,
  Flame,
  TrendingDown,
  ChevronsDown,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'
import {
  atlasAPI,
  type AtlasQnARecord,
  type AtlasQnAClassification,
  type AtlasQnAStatus,
  type AtlasQnAStats,
  type AtlasQnAOrigin,
} from '../lib/api'
type SortField = 'usage_count' | 'created_at' | 'last_used_at' | 'growth_percent'
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

const ORIGIN_CONFIG: Record<AtlasQnAOrigin, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  manual: { label: 'Manual', icon: Edit3, color: 'text-slate-600', bg: 'bg-slate-100' },
  ai_call_extracted: { label: 'AI from Call', icon: PhoneCall, color: 'text-violet-600', bg: 'bg-violet-50' },
  ai_knowledge_derived: { label: 'AI from Knowledge', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
}

/* ──────────────────────── Stat Card ──────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  gradient,
  bgGradient,
}: {
  label: string
  value: number | string
  icon: typeof TrendingUp
  trend?: number
  gradient: string
  bgGradient: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border/30 px-5 py-4 relative overflow-hidden group hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300">
      <div
        className={cn(
          'absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity',
          `bg-gradient-to-br ${bgGradient}`
        )}
      />

      <div className="flex items-center justify-between relative mb-3">
        <div className={cn('p-2 rounded-xl shadow-sm', `bg-gradient-to-br ${gradient}`)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>

      <div className="relative">
        <p className="text-sm font-bold font-display tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  )
}

/* ──────────────────────── Detail Modal ──────────────────────── */
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

  const itemOrigin = item?.origin || 'manual'
  const originConfig = ORIGIN_CONFIG[itemOrigin]
  const OriginIcon = originConfig?.icon || Edit3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/30 flex justify-between items-center bg-secondary/30">
          <h3 className="text-lg font-bold text-foreground">
            {isNew ? 'Add New Q&A' : isEditing ? 'Edit Q&A' : 'Q&A Details'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!isNew && item && !isEditing &&
            (() => {
              const itemStatus = item.status || 'draft'
              const itemClassification = item.classification || 'general'
              const statusConfig = STATUS_CONFIG[itemStatus] || STATUS_CONFIG.draft
              const classConfig = CLASSIFICATION_CONFIG[itemClassification] || CLASSIFICATION_CONFIG.general
              const ClassIcon = classConfig.icon

              return (
                <>
                  {/* Badges row */}
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border',
                        statusConfig.bg,
                        statusConfig.color,
                        statusConfig.border
                      )}
                    >
                      {statusConfig.label}
                    </span>
                    <span
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 border',
                        classConfig.bg,
                        classConfig.color
                      )}
                    >
                      <ClassIcon className="h-3 w-3" /> {classConfig.label}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                      {item.usage_count} Uses
                    </span>
                    {item.growth_percent !== undefined && item.growth_percent !== null && (
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-0.5',
                          item.growth_percent >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                        )}
                      >
                        {item.growth_percent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {item.growth_percent >= 0 ? '+' : ''}
                        {item.growth_percent}%
                      </span>
                    )}
                  </div>

                  {/* Origin / Grounding */}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className={cn('flex items-center gap-1', originConfig?.color)}>
                      <OriginIcon className="h-3.5 w-3.5" /> {originConfig?.label}
                    </span>
                    {item.is_grounded && (
                      <span className="flex items-center gap-1 text-teal-600">
                        <Shield className="h-3.5 w-3.5" />
                        Grounded
                        {item.grounding_confidence !== undefined && item.grounding_confidence !== null && (
                          <span className="opacity-80">({Math.round(item.grounding_confidence * 100)}%)</span>
                        )}
                      </span>
                    )}
                    {item.ai_confidence !== undefined && item.ai_confidence !== null && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> AI Confidence: {Math.round(item.ai_confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Source linking */}
                  {(item.source_call_id || item.source_doc_id || item.source_meeting_id) && (
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Source</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.source_call_id && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-blue-800 font-medium">
                            <PhoneCall className="h-4 w-4" />
                            Call: {item.source_call_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.source_meeting_id && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-blue-800 font-medium">
                            <Link2 className="h-4 w-4" />
                            {item.source_meeting_title || `Meeting ${item.source_meeting_id.slice(0, 8)}...`}
                          </span>
                        )}
                        {item.source_doc_id && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-medium">
                            <FileText className="h-4 w-4" />
                            {item.source_doc_name || `Doc ${item.source_doc_id.slice(0, 8)}...`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Friction score */}
                  {item.friction_score !== undefined && item.friction_score !== null && item.friction_score > 0 && (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Friction Score</p>
                        <span className="text-sm font-bold text-red-600">{Math.round(item.friction_score * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-red-600 rounded-full"
                          style={{ width: `${item.friction_score * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )
            })()}

          {/* Question / Answer fields */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Question</p>
              {isEditing ? (
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forskale-teal focus:border-transparent bg-background resize-none"
                  placeholder="Enter the question..."
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{item?.question}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Answer</p>
              {isEditing ? (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forskale-teal focus:border-transparent bg-background resize-none"
                  placeholder="Enter the canonical answer..."
                />
              ) : (
                <div className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 px-4 py-3 rounded-xl border border-border/30">
                  {item?.answer}
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Classification</p>
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
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                            classification === key
                              ? 'border-forskale-teal bg-forskale-teal/10 text-forskale-teal'
                              : 'border-border/30 text-muted-foreground hover:border-border'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {classification === 'product' && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Product Tag</p>
                    <input
                      type="text"
                      value={productTag}
                      onChange={(e) => setProductTag(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forskale-teal focus:border-transparent bg-background"
                      placeholder="e.g., Enterprise Plan"
                    />
                  </div>
                )}

                {classification === 'service' && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Service Tag</p>
                    <input
                      type="text"
                      value={serviceTag}
                      onChange={(e) => setServiceTag(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forskale-teal focus:border-transparent bg-background"
                      placeholder="e.g., Implementation"
                    />
                  </div>
                )}
              </>
            )}

            {!isNew && item && !isEditing && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="text-foreground font-medium">
                      {new Date(item.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {item.approved_at && (
                    <div>
                      <span className="text-muted-foreground">Approved by</span>
                      <p className="text-foreground font-medium">{item.approved_by_user_name || 'Admin'}</p>
                    </div>
                  )}
                  {item.last_used_at && (
                    <div>
                      <span className="text-muted-foreground">Last Used</span>
                      <p className="text-foreground font-medium">
                        {new Date(item.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary/30 border-t border-border/30 flex items-center justify-between">
          <div>
            {!isNew && canEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50/50 rounded-xl transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
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
                className="px-4 py-2.5 text-sm font-semibold text-foreground bg-card border border-border/30 rounded-xl hover:bg-secondary/50 shadow-sm transition-all duration-300"
              >
                <Edit3 className="h-3.5 w-3.5 inline mr-1" />
                Edit
              </button>
            )}
            {!isNew && (!item?.status || item?.status === 'draft') && canEdit && onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all duration-300"
              >
                <Check className="h-3.5 w-3.5 inline mr-1" />
                Approve
              </button>
            )}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => (isNew ? onClose() : setIsEditing(false))}
                  className="px-4 py-2.5 text-sm font-semibold text-foreground bg-card border border-border/30 rounded-xl hover:bg-secondary/50 shadow-sm transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-forskale-green to-forskale-teal rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-card border border-border/30 text-foreground text-sm font-semibold rounded-xl hover:bg-secondary/50 shadow-sm transition-all duration-300"
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

/* ──────────────────────── Main Page ──────────────────────── */
export default function AtlasQnAPage() {
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
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [extractTranscript, setExtractTranscript] = useState('')
  const [showScrollArrow, setShowScrollArrow] = useState(true)
  const questionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowScrollArrow(!entry.isIntersecting), { threshold: 0.1 })
    if (questionsRef.current) observer.observe(questionsRef.current)
    return () => observer.disconnect()
  }, [])

  const scrollToQuestions = () => {
    questionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  /* ── Queries & Mutations ── */
  const { data: qnaData, isLoading } = useQuery({
    queryKey: ['atlas-qna', searchQuery, classificationFilter, statusFilter, sortField, sortOrder, page],
    queryFn: () =>
      atlasAPI
        .listQna({
          search: searchQuery || undefined,
          classification: classificationFilter !== 'all' ? classificationFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sort_by: sortField,
          sort_order: sortOrder,
          page,
          limit: 20,
        })
        .then((r) => r.data),
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
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof atlasAPI.updateQna>[1] }) => atlasAPI.updateQna(id, data),
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

  const extractMutation = useMutation({
    mutationFn: (transcript: string) => atlasAPI.extractQna({ transcript }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['atlas-qna'] })
      queryClient.invalidateQueries({ queryKey: ['atlas-qna-stats'] })
      toast.success(`Extracted ${res.data.extracted_count} Q&A from transcript`)
      setIsExtractModalOpen(false)
      setExtractTranscript('')
      if (res.data.extracted_count > 0) {
        setStatusFilter('draft')
      }
    },
    onError: () => toast.error('Failed to extract Q&A'),
  })

  const items = qnaData?.items ?? []
  const total = qnaData?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const mockStats: AtlasQnAStats = stats || {
    total_questions: items.length,
    approved_count: items.filter((i) => i.status === 'approved').length,
    draft_count: items.filter((i) => i.status === 'draft').length,
    total_usage: items.reduce((sum, i) => sum + i.usage_count, 0),
    top_questions: items
      .slice(0, 5)
      .map((i) => ({ id: i.id, question: i.question, usage_count: i.usage_count, growth_percent: i.growth_percent ?? undefined })),
    trending_questions: items
      .filter((i) => i.growth_percent !== undefined && i.growth_percent !== null && i.growth_percent > 0)
      .sort((a, b) => (b.growth_percent ?? 0) - (a.growth_percent ?? 0))
      .slice(0, 5)
      .map((i) => ({ id: i.id, question: i.question, usage_count: i.usage_count, growth_percent: i.growth_percent ?? 0 })),
    classification_breakdown: {
      product: items.filter((i) => i.classification === 'product').length,
      service: items.filter((i) => i.classification === 'service').length,
      general: items.filter((i) => i.classification === 'general').length,
    },
    friction_breakdown: [
      {
        classification: 'product' as AtlasQnAClassification,
        avg_friction:
          items
            .filter((i) => i.classification === 'product' && i.friction_score)
            .reduce((s, i) => s + (i.friction_score ?? 0), 0) /
          (items.filter((i) => i.classification === 'product' && i.friction_score).length || 1),
        count: items.filter((i) => i.classification === 'product' && i.friction_score).length,
      },
      {
        classification: 'service' as AtlasQnAClassification,
        avg_friction:
          items
            .filter((i) => i.classification === 'service' && i.friction_score)
            .reduce((s, i) => s + (i.friction_score ?? 0), 0) /
          (items.filter((i) => i.classification === 'service' && i.friction_score).length || 1),
        count: items.filter((i) => i.classification === 'service' && i.friction_score).length,
      },
      {
        classification: 'general' as AtlasQnAClassification,
        avg_friction:
          items
            .filter((i) => i.classification === 'general' && i.friction_score)
            .reduce((s, i) => s + (i.friction_score ?? 0), 0) /
          (items.filter((i) => i.classification === 'general' && i.friction_score).length || 1),
        count: items.filter((i) => i.classification === 'general' && i.friction_score).length,
      },
    ],
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
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-forskale-teal" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-forskale-teal" />
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'service':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-background scrollbar-thin scroll-smooth">
      {/* Hero Screen */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue shadow-lg flex-shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Q&A Engine</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Knowledge-grounded, AI-powered question archive</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsExtractModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold hover:from-violet-600 hover:to-purple-700 shadow-sm transition-all duration-300"
              >
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Extract from Call</span>
                <span className="sm:hidden">Extract</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-forskale-green to-forskale-teal text-white text-xs font-semibold hover:shadow-lg shadow-sm transition-all duration-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Q&A</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              label="Total Questions"
              value={mockStats.total_questions}
              icon={HelpCircle}
              gradient="from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]"
              bgGradient="from-blue-500/10 to-cyan-500/10"
            />
            <StatCard
              label="Approved"
              value={mockStats.approved_count}
              icon={CheckCircle2}
              trend={12}
              gradient="from-emerald-500 to-teal-500"
              bgGradient="from-emerald-500/10 to-teal-500/10"
            />
            <StatCard
              label="Drafts"
              value={mockStats.draft_count}
              icon={FileEdit}
              gradient="from-amber-500 to-orange-500"
              bgGradient="from-amber-500/10 to-orange-500/10"
            />
            <StatCard
              label="Total Usage"
              value={mockStats.total_usage}
              icon={TrendingUp}
              trend={8}
              gradient="from-purple-500 to-pink-500"
              bgGradient="from-purple-500/10 to-pink-500/10"
            />
          </div>

          {/* Friction by Category */}
          {mockStats.friction_breakdown && mockStats.friction_breakdown.some((f) => f.count > 0) && (
            <div className="mb-8 bg-card rounded-3xl border border-border/30 px-6 pt-5 pb-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Friction by Category</h3>
                  <p className="text-xs text-muted-foreground">Objection intensity heatmap</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {mockStats.friction_breakdown
                  .filter((f) => f.count > 0)
                  .map((fb) => {
                    const classKey = (fb.classification || 'general') as AtlasQnAClassification
                    const classConf = CLASSIFICATION_CONFIG[classKey] || CLASSIFICATION_CONFIG.general
                    const ClassIcon = classConf.icon
                    const frictionPct = Math.round(fb.avg_friction * 100)
                    return (
                      <div
                        key={fb.classification}
                        className="px-4 py-3 rounded-xl border border-border/30 bg-secondary/30 hover:bg-secondary/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn('p-1.5 rounded-lg', classConf.bg)}>
                            <ClassIcon className={cn('h-4 w-4', classConf.color)} />
                          </span>
                          <span className="text-sm font-semibold text-foreground">{classConf.label}</span>
                          <span className="text-xs text-muted-foreground">({fb.count})</span>
                        </div>

                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                            style={{ width: `${frictionPct}%` }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Avg friction: <span className="font-semibold text-foreground">{frictionPct}%</span>
                        </p>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Pending alert */}
          {mockStats.draft_count > 0 && (
            <div className="mb-8 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">{mockStats.draft_count} Q&A pending approval</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('draft')
                  scrollToQuestions()
                }}
                className="px-4 py-2 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-xl hover:bg-amber-50 transition-all duration-300"
              >
                Review
              </button>
            </div>
          )}

          {/* Top Questions */}
          {mockStats.top_questions.length > 0 && (
            <div className="mb-8 bg-card rounded-3xl border border-border/30 px-6 pt-5 pb-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-forskale-green to-forskale-teal">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Top Questions</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {mockStats.top_questions.slice(0, 3).map((q, index) => {
                  const gradients = [
                    'from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]',
                    'from-purple-500 to-pink-500',
                    'from-emerald-500 to-teal-500',
                  ]

                  return (
                    <div
                      key={q.id}
                      className="bg-secondary/30 rounded-xl px-4 py-3 relative overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-secondary/50 transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        const fullItem = items.find((i) => i.id === q.id)
                        if (fullItem) {
                          setSelectedItem(fullItem)
                          setIsDetailOpen(true)
                        }
                      }}
                    >
                      <div className={cn('absolute top-0 left-0 w-1 h-full', `bg-gradient-to-b ${gradients[index]}`)} />

                      <div className="pl-3">
                        <span className={cn('text-2xl font-bold bg-clip-text text-transparent', `bg-gradient-to-r ${gradients[index]}`)}>
                          #{index + 1}
                        </span>
                        <p className="text-xs text-foreground/80 line-clamp-2 mt-2 mb-3">{q.question}</p>
                        <p className="text-sm font-semibold text-foreground">{q.usage_count} uses</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trending Questions */}
          {mockStats.trending_questions && mockStats.trending_questions.length > 0 && (
            <div className="mb-8 bg-card rounded-3xl border border-border/30 px-6 pt-5 pb-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Trending Questions</h3>
                  <p className="text-xs text-muted-foreground">Growing in frequency</p>
                </div>
              </div>
              <div className="space-y-3">
                {mockStats.trending_questions.slice(0, 5).map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all duration-300"
                    onClick={() => {
                      const fullItem = items.find((i) => i.id === q.id)
                      if (fullItem) {
                        setSelectedItem(fullItem)
                        setIsDetailOpen(true)
                      }
                    }}
                  >
                    <span className="text-lg font-bold text-emerald-500 w-8">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{q.question}</p>
                      <p className="text-xs text-muted-foreground">{q.usage_count} uses</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />+{q.growth_percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating scroll arrow */}
          {showScrollArrow && (
            <button
              onClick={scrollToQuestions}
              className="fixed right-6 bottom-20 lg:bottom-8 z-20 p-3 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] text-white shadow-[0_0_20px_hsl(var(--forskale-green)/0.5)] hover:shadow-[0_0_32px_hsl(var(--forskale-green)/0.7)] animate-bounce transition-shadow duration-300"
            >
              <ChevronsDown className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Questions Table */}
      <div ref={questionsRef} className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/30 overflow-hidden shadow-2xl">
          {/* Search Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/30 bg-secondary/30 backdrop-blur-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-forskale-teal focus:border-transparent bg-background"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative self-end">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-xl transition-all duration-300',
                  classificationFilter !== 'all' || statusFilter !== 'all'
                    ? 'border-forskale-teal bg-forskale-teal/10 text-forskale-teal'
                    : 'border-border/30 text-foreground hover:bg-secondary/50'
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {(classificationFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="w-5 h-5 rounded-full bg-forskale-teal text-white text-[10px] flex items-center justify-center">
                    {(classificationFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-2xl border border-border/30 p-4 z-20">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Classification</p>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setClassificationFilter('all')}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            classificationFilter === 'all' ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                          )}
                        >
                          All
                        </button>
                        {(Object.keys(CLASSIFICATION_CONFIG) as AtlasQnAClassification[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setClassificationFilter(key)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors',
                              classificationFilter === key
                                ? 'bg-secondary font-medium text-foreground'
                                : 'text-muted-foreground hover:bg-secondary/50'
                            )}
                          >
                            {(() => {
                              const Icon = CLASSIFICATION_CONFIG[key].icon
                              return <Icon className="h-3.5 w-3.5" />
                            })()}
                            {CLASSIFICATION_CONFIG[key].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            statusFilter === 'all' ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                          )}
                        >
                          All
                        </button>
                        {(Object.keys(STATUS_CONFIG) as AtlasQnAStatus[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setStatusFilter(key)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                              statusFilter === key ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
                            )}
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
                        className="w-full mt-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50/50 rounded-lg transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table — hidden on mobile, replaced by cards */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/30 text-left border-b border-border/30">
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Origin</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                    <button
                      type="button"
                      onClick={() => handleSort('usage_count')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      Usage
                      <SortIcon field="usage_count" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                    <button
                      type="button"
                      onClick={() => handleSort('growth_percent')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      Growth
                      <SortIcon field="growth_percent" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                    <button
                      type="button"
                      onClick={() => handleSort('last_used_at')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      Last Used
                      <SortIcon field="last_used_at" />
                    </button>
                  </th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border/20">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </td>
                  </tr>
                )}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">No Q&A found</p>
                      <p className="text-xs text-muted-foreground mt-1">Questions from calls will appear here</p>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  items.map((item) => {
                    const classification = item.classification || 'general'
                    const status = item.status || 'draft'
                    const origin = item.origin || 'manual'
                    const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG.general
                    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft
                    const originConfig_item = ORIGIN_CONFIG[origin] || ORIGIN_CONFIG.manual
                    const OriginIcon_item = originConfig_item.icon

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-secondary/30 cursor-pointer transition-all duration-300 group"
                        onClick={() => {
                          setSelectedItem(item)
                          setIsDetailOpen(true)
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground font-medium line-clamp-1 mb-1">{item.question}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{item.answer}</p>
                            </div>
                            {item.is_grounded && (
                              <span className="shrink-0 p-1 rounded-lg bg-teal-50" title="Grounded in Knowledge">
                                <Shield className="h-3 w-3 text-teal-600" />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                              getTypeColor(classification)
                            )}
                          >
                            {(() => {
                              const Icon = classConfig.icon
                              return <Icon className="h-3 w-3" />
                            })()}
                            {classConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                              originConfig_item.bg,
                              originConfig_item.color
                            )}
                          >
                            <OriginIcon_item className="h-3 w-3" />
                            {origin === 'ai_call_extracted' ? 'Call' : origin === 'ai_knowledge_derived' ? 'Docs' : 'Manual'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-foreground font-semibold">{item.usage_count}</span>
                        </td>

                        <td className="px-5 py-4">
                          {item.growth_percent !== undefined && item.growth_percent !== null ? (
                            <span
                              className={cn(
                                'text-xs font-semibold flex items-center gap-0.5',
                                item.growth_percent >= 0 ? 'text-emerald-600' : 'text-red-600'
                              )}
                            >
                              {item.growth_percent >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                              {item.growth_percent >= 0 ? '+' : ''}
                              {item.growth_percent}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {item.last_used_at ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(item.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                              setIsDetailOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-forskale-teal hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="h-4 w-4" />
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
            <div className="flex items-center justify-between px-6 py-3 border-t border-border/30 bg-secondary/30">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-medium text-foreground border border-border/30 rounded-xl hover:bg-secondary/50 disabled:opacity-50 transition-all duration-300"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-xs font-medium text-foreground border border-border/30 rounded-xl hover:bg-secondary/50 disabled:opacity-50 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-border/20">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="px-4 py-12 text-center">
              <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No Q&A found</p>
            </div>
          )}
          {!isLoading && items.map((item) => {
            const classification = item.classification || 'general'
            const status = item.status || 'draft'
            const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG.general
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft
            const ClassIcon = classConfig.icon
            return (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-4 py-4 hover:bg-secondary/30 transition-colors"
                onClick={() => {
                  setSelectedItem(item)
                  setIsDetailOpen(true)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 p-1.5 rounded-lg flex-shrink-0', classConfig.bg)}>
                    <ClassIcon className={cn('h-3.5 w-3.5', classConfig.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{item.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.answer}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold border', statusConfig.bg, statusConfig.color, statusConfig.border)}>
                        {statusConfig.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.usage_count} uses</span>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
              </button>
            )
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
              <p className="text-xs text-muted-foreground">{(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium text-foreground border border-border/30 rounded-lg hover:bg-secondary/50 disabled:opacity-50">Prev</button>
                <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium text-foreground border border-border/30 rounded-lg hover:bg-secondary/50 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
              },
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
        canEdit
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

      {/* Extract Q&A Modal */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-border/30">
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Extract Q&A from Call</h2>
                  <p className="text-xs text-muted-foreground">AI will extract questions and generate knowledge-grounded answers</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsExtractModalOpen(false)} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 rounded-xl bg-violet-50/50 border border-violet-200/50">
                <p className="text-xs text-violet-800 font-medium mb-2">How it works:</p>
                <ol className="text-xs text-violet-700 space-y-1.5 list-decimal list-inside">
                  <li>AI extracts customer questions and objections from transcript</li>
                  <li>Searches Knowledge base for grounded answers</li>
                  <li>If no knowledge found, generates fallback response</li>
                  <li>Creates draft Q&A entries for your review</li>
                </ol>
              </div>

              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Paste call transcript</label>
              <textarea
                value={extractTranscript}
                onChange={(e) => setExtractTranscript(e.target.value)}
                rows={10}
                placeholder={'Paste the call transcript here...\n\nExample:\nSales: Hi, how can I help you today?\nCustomer: I\'m interested in your enterprise plan. What\'s the pricing?\nSales: Great question! Our enterprise plan starts at...'}
                className="w-full px-4 py-3 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">Minimum 50 characters required. Longer transcripts yield better results.</p>
            </div>

            <div className="px-6 py-4 bg-secondary/30 border-t border-border/30 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExtractModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-foreground bg-card border border-border/30 rounded-xl hover:bg-secondary/50 shadow-sm transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => extractMutation.mutate(extractTranscript)}
                disabled={extractMutation.isPending || extractTranscript.length < 50}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-300"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Q&A
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
