import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { playbooksAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

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

  return (
    <div className="h-full overflow-y-auto bg-[#f5f5f7]">
      <div className="px-8 py-6">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-white/70 text-gray-600"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Sales Playbook Templates
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                SilkChart AI will analyze each call to determine whether the sales playbook detailed below was executed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-6">
          {/* Left list */}
          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                Loading…
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left shadow-sm transition-colors ${
                    selectedId === t.id ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Custom playbook</div>
                    </div>
                  </div>
                </button>
              ))
            )}

            <button
              type="button"
              onClick={createTemplate}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline px-1"
            >
              <Plus className="h-4 w-4" />
              Create Custom Playbook
            </button>
          </div>

          {/* Right editor */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {selected ? (
              <>
                <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full text-lg font-semibold text-gray-900 outline-none bg-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Published for {user?.email || 'your account'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={deleteTemplate}
                      className="p-2 rounded-xl text-gray-500 hover:bg-gray-50"
                      aria-label="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl text-gray-500 hover:bg-gray-50"
                      aria-label="More"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {draftRules.map((rule, idx) => (
                    <div key={rule.id ?? idx} className="rounded-xl border border-gray-100 bg-white">
                      <div className="px-4 py-3 flex items-center gap-3">
                        <input
                          value={rule.label}
                          onChange={(e) =>
                            setDraftRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r))
                            )
                          }
                          placeholder="Rule"
                          className="flex-1 text-sm font-medium text-gray-900 outline-none bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setDraftRules((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          aria-label="Delete rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setDraftRules((prev) => [...prev, newRule()])}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add rule
                  </button>
                </div>

                <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-[#007AFF] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-gray-500">Select a template.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

