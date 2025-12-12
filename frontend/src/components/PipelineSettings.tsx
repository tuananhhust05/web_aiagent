import React, { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save,
  AlertCircle
} from 'lucide-react'
import { pipelinesAPI } from '../lib/api'
import LoadingSpinner from './ui/LoadingSpinner'

interface PipelineStage {
  id?: string
  name: string
  probability: number
  order: number
  color: string
  description?: string
}

interface Pipeline {
  id: string
  name: string
  description?: string
  business_type?: string
  is_default: boolean
  stages: PipelineStage[]
}

interface PipelineSettingsProps {
  isOpen: boolean
  onClose: () => void
  pipelineId?: string
  onSaved?: (pipelineId?: string) => void
}

const defaultColors = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
  '#22C55E', // green
  '#6B7280', // gray
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
]

const defaultStages: PipelineStage[] = [
  { name: 'Lead', probability: 10, order: 1, color: '#3B82F6' },
  { name: 'Qualified', probability: 25, order: 2, color: '#8B5CF6' },
  { name: 'Demo/Meeting', probability: 40, order: 3, color: '#F59E0B' },
  { name: 'Proposal Sent', probability: 60, order: 4, color: '#F97316' },
  { name: 'Negotiation', probability: 80, order: 5, color: '#EF4444' },
  { name: 'Closed Won', probability: 100, order: 6, color: '#22C55E' },
  { name: 'Closed Lost', probability: 0, order: 7, color: '#6B7280' },
]

const hexToHsl = (hex: string) => {
  const sanitized = hex.startsWith('#') ? hex.slice(1) : hex
  if (sanitized.length !== 6) return { h: 0, s: 100, l: 50 }
  const r = parseInt(sanitized.substring(0, 2), 16) / 255
  const g = parseInt(sanitized.substring(2, 4), 16) / 255
  const b = parseInt(sanitized.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const hslToHex = (h: number, s: number, l: number) => {
  const sat = s / 100
  const lig = l / 100
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lig - c / 2
  let r = 0, g = 0, b = 0
  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export default function PipelineSettings({ isOpen, onClose, pipelineId, onSaved }: PipelineSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [name, setName] = useState('Sales Pipeline')
  const [description, setDescription] = useState('')
  const [businessType, setBusinessType] = useState('general')
  const [isDefault, setIsDefault] = useState(true)
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && pipelineId) {
      fetchPipeline()
    } else if (isOpen && !pipelineId) {
      // Reset to defaults for new pipeline
      setName('Sales Pipeline')
      setDescription('')
      setBusinessType('general')
      setIsDefault(false) // Don't set as default by default for new pipelines
      setStages([...defaultStages]) // Create new array to avoid reference issues
      setError(null)
    }
  }, [isOpen, pipelineId])

  const fetchPipeline = async () => {
    if (!pipelineId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await pipelinesAPI.getPipeline(pipelineId)
      const pipeline = response.data
      
      setName(pipeline.name)
      setDescription(pipeline.description || '')
      setBusinessType(pipeline.business_type || 'general')
      setIsDefault(pipeline.is_default)
      setStages(pipeline.stages.length > 0 ? pipeline.stages : defaultStages)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Pipeline name is required')
      return
    }
    
    if (stages.length < 2) {
      setError('Pipeline must have at least 2 stages')
      return
    }
    
    // Validate all stage names
    const emptyStageNames = stages.filter(s => !s.name.trim())
    if (emptyStageNames.length > 0) {
      setError('All stages must have a name')
      return
    }
    
    // Validate all colors
    const invalidColors = stages.filter(s => !/^#[0-9A-F]{6}$/i.test(s.color))
    if (invalidColors.length > 0) {
      setError('All stages must have a valid color (hex format: #RRGGBB)')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        business_type: businessType,
        is_default: isDefault,
        stages: stages.map((stage, index) => ({
          name: stage.name.trim(),
          probability: Math.min(100, Math.max(0, stage.probability)),
          order: index + 1,
          color: stage.color.toUpperCase(), // Ensure uppercase hex
          description: stage.description?.trim() || undefined,
        })),
      }
      
      let createdId: string | undefined = pipelineId

      if (pipelineId) {
        await pipelinesAPI.updatePipeline(pipelineId, data)
      } else {
        const res = await pipelinesAPI.createPipeline(data)
        createdId = res.data?.id
      }
      
      onSaved?.(createdId)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save pipeline')
    } finally {
      setSaving(false)
    }
  }

  const addStage = () => {
    const newOrder = stages.length + 1
    const colorIndex = stages.length % defaultColors.length
    setStages([
      ...stages,
      {
        name: `Stage ${newOrder}`,
        probability: Math.min(50, (newOrder - 1) * 15),
        order: newOrder,
        color: defaultColors[colorIndex],
      },
    ])
  }

  const removeStage = (index: number) => {
    if (stages.length <= 2) {
      setError('Pipeline must have at least 2 stages')
      return
    }
    setStages(stages.filter((_, i) => i !== index))
  }

  const updateStage = (index: number, updates: Partial<PipelineStage>) => {
    setStages(stages.map((stage, i) => 
      i === index ? { ...stage, ...updates } : stage
    ))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newStages = [...stages]
    const draggedStage = newStages[draggedIndex]
    newStages.splice(draggedIndex, 1)
    newStages.splice(index, 0, draggedStage)
    
    setStages(newStages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120]">
      <div className="bg-white rounded-xl w-[90vw] max-w-[1200px] mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {pipelineId ? 'Edit Pipeline' : 'Create Pipeline'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pipeline Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sales Pipeline, Enterprise Deals"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="b2b">B2B</option>
                    <option value="b2c">B2C</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="smb">SMB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Describe this pipeline..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default pipeline for new deals
                </label>
              </div>

              {/* Stages */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Pipeline Stages
                  </label>
                  <button
                    onClick={addStage}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stage
                  </button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-4 bg-white rounded-lg border-2 transition-all ${
                        draggedIndex === index ? 'opacity-50 border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                      
                      {/* Color Picker with Preview */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Color Preview - Large */}
                        <div 
                          className="relative w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-105 flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                          onClick={() => {
                            const colorInput = document.getElementById(`color-input-${index}`) as HTMLInputElement
                            colorInput?.click()
                          }}
                          title="Click to open color picker"
                        >
                          {/* Validation indicator */}
                          {!/^#[0-9A-F]{6}$/i.test(stage.color) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                          )}
                        </div>
                        {/* Hidden Color Input */}
                        <input
                          id={`color-input-${index}`}
                          type="color"
                          value={stage.color.startsWith('#') ? stage.color : `#${stage.color}`}
                          onChange={(e) => {
                            const color = e.target.value.toUpperCase()
                            updateStage(index, { color })
                          }}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        />
                        {/* Hue slider (continuous bar) */}
                        {(() => {
                          const { h, s, l } = hexToHsl(stage.color)
                          const gradientStops = [
                            'hsl(0, 100%, 50%)',
                            'hsl(60, 100%, 50%)',
                            'hsl(120, 100%, 50%)',
                            'hsl(180, 100%, 50%)',
                            'hsl(240, 100%, 50%)',
                            'hsl(300, 100%, 50%)',
                            'hsl(360, 100%, 50%)',
                          ].join(', ')
                          return (
                            <div className="flex flex-col gap-1 w-40">
                              <input
                                type="range"
                                min={0}
                                max={360}
                                step={1}
                                value={h}
                                onChange={(e) => {
                                  const newHue = Number(e.target.value)
                                  const newColor = hslToHex(newHue, s || 90, l || 50)
                                  updateStage(index, { color: newColor })
                                }}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, ${gradientStops})`,
                                }}
                              />
                              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                Hue slider • current: {h}°
                              </div>
                            </div>
                          )
                        })()}
                        {/* Quick Color Palette */}
                        <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                          {defaultColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateStage(index, { color })
                              }}
                              className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${
                                stage.color.toUpperCase() === color.toUpperCase()
                                  ? 'border-gray-800 scale-110 shadow-md ring-2 ring-blue-300' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                              title={`Use ${color}`}
                            />
                          ))}
                        </div>
                        {/* Color Code Display */}
                        <div className="flex flex-col min-w-[120px]">
                          <input
                            type="text"
                            value={stage.color}
                            onChange={(e) => {
                              let color = e.target.value.trim()
                              // Allow partial input while typing
                              if (color === '' || color === '#') {
                                updateStage(index, { color: color || '#' })
                              } else if (/^#[0-9A-F]{0,6}$/i.test(color)) {
                                // Auto-format to uppercase
                                if (color.length === 7 && /^#[0-9A-F]{6}$/i.test(color)) {
                                  updateStage(index, { color: color.toUpperCase() })
                                } else {
                                  updateStage(index, { color })
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Validate and fix on blur
                              let color = e.target.value.trim()
                              if (!color.startsWith('#')) {
                                color = '#' + color
                              }
                              if (!/^#[0-9A-F]{6}$/i.test(color)) {
                                // Reset to default if invalid
                                updateStage(index, { color: defaultColors[0] })
                              } else {
                                updateStage(index, { color: color.toUpperCase() })
                              }
                            }}
                            className={`w-20 px-2 py-1 text-xs font-mono border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                              !/^#[0-9A-F]{6}$/i.test(stage.color) 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            placeholder="#3B82F6"
                            maxLength={7}
                            title="Hex color code (e.g., #3B82F6)"
                          />
                          {!/^#[0-9A-F]{6}$/i.test(stage.color) && (
                            <span className="text-xs text-red-500 mt-0.5">Invalid</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Stage Name */}
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => updateStage(index, { name: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Stage name"
                      />
                      
                      {/* Win Probability */}
                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          value={stage.probability}
                          onChange={(e) => updateStage(index, { probability: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
                          min={0}
                          max={100}
                        />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeStage(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Remove stage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Drag stages to reorder. Win probability is used to calculate weighted pipeline value (forecast).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

