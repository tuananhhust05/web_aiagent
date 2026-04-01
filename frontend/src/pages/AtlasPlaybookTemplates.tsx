import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { playbooksAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet'

type PlaybookRule = { id?: string; label: string; description?: string }
type PlaybookTemplate = {
  id: string
  name: string
  rules: PlaybookRule[]
  is_default: boolean
}

function newRule(): PlaybookRule {
  return { id: crypto.randomUUID?.() ?? String(Date.now()), label: '', description: '' }
}

export default function AtlasPlaybookTemplates() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<PlaybookTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftRules, setDraftRules] = useState<PlaybookRule[]>([])
  const [saving, setSaving] = useState(false)
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false)

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  )

  const load = async () => {
    try {
      setLoading(true)
      const res = await playbooksAPI.list({ limit: 200 })
      const list = (res.data.templates ?? []) as PlaybookTemplate[]
      setTemplates(list)
      const def = list.find((t) => t.is_default) ?? list[0] ?? null
      setSelectedId((prev) => (prev && list.some((t) => t.id === prev) ? prev : def?.id ?? null))
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to load playbooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!selected) return
    setDraftName(selected.name)
    setDraftRules(selected.rules?.length ? selected.rules : [newRule()])
  }, [selectedId])

  const createTemplate = async () => {
    try {
      const name = 'Custom Sales Playbook'
      const res = await playbooksAPI.create({ name, rules: [] })
      await load()
      setSelectedId(res.data.id ?? null)
      toast.success('Playbook created')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to create playbook')
    }
  }

  const saveTemplate = async () => {
    if (!selected) return
    const cleanedRules = draftRules
      .map((r) => ({ ...r, label: (r.label || '').trim(), description: (r.description || '').trim() }))
      .filter((r) => r.label)
    if (!draftName.trim()) {
      toast.error('Name is required')
      return
    }
    if (cleanedRules.length === 0) {
      toast.error('Add at least 1 rule')
      return
    }
    try {
      setSaving(true)
      await playbooksAPI.update(selected.id, { name: draftName.trim(), rules: cleanedRules })
      toast.success('Saved')
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async () => {
    if (!selected) return
    if (!window.confirm('Delete this playbook template?')) return
    try {
      await playbooksAPI.delete(selected.id)
      toast.success('Deleted')
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const editorContent = selected ? (
    <>
      <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="w-full text-base sm:text-lg font-semibold text-foreground outline-none bg-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Published for {user?.email || 'your account'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={deleteTemplate}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
            aria-label="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            aria-label="More"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        {draftRules.map((rule, idx) => (
          <div key={rule.id ?? idx} className="rounded-xl border border-border bg-card">
            <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <input
                value={rule.label}
                onChange={(e) =>
                  setDraftRules((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r))
                  )
                }
                placeholder="Rule description"
                className="flex-1 text-sm font-medium text-foreground outline-none bg-transparent placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setDraftRules((prev) => prev.filter((_, i) => i !== idx))}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                aria-label="Delete rule"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDraftRules((prev) => [...prev, newRule()])}
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--forskale-teal))] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>

      <div className="p-4 sm:p-5 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={saveTemplate}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-[0_4px_12px_hsl(var(--forskale-teal)/0.4)] disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  ) : (
    <div className="p-10 text-center text-sm text-muted-foreground">
      {loading ? 'Loading…' : 'Select a template to edit.'}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-4 sm:px-8 py-4 sm:py-6 pb-24 lg:pb-6">
        <div className="flex items-start gap-3 mb-5 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              Sales Playbook Templates
            </h1>
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5 sm:mt-1">
              AI will analyze each call to determine whether the playbook rules were executed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-sm text-muted-foreground shadow-sm">
                Loading…
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No playbooks yet. Create one below.
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id)
                    setMobileEditorOpen(true)
                  }}
                  className={`w-full rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 text-left shadow-sm transition-all ${
                    selectedId === t.id
                      ? 'bg-[hsl(var(--forskale-teal)/0.06)] border-[hsl(var(--forskale-teal)/0.3)] shadow-md'
                      : 'bg-card border-border hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{t.rules?.length ?? 0} rule{(t.rules?.length ?? 0) !== 1 ? 's' : ''}</span>
                        {t.is_default && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] text-[10px] font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))
            )}

            <button
              type="button"
              onClick={createTemplate}
              className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--forskale-teal))] hover:underline px-1"
            >
              <Plus className="h-4 w-4" />
              Create Custom Playbook
            </button>
          </div>

          <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {editorContent}
          </div>
        </div>
      </div>

      <Sheet open={mobileEditorOpen} onOpenChange={setMobileEditorOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 overflow-hidden flex flex-col lg:hidden">
          <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileEditorOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <SheetTitle className="text-base font-semibold text-foreground truncate">
                {selected?.name || 'Playbook Editor'}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {editorContent}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
