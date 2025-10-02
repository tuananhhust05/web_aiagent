import { useState, useEffect } from 'react'
import { 
  Mic, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Languages,
  Save,
  MessageSquare,
  Volume2,
  Play,
  Plus,
  Upload,
  X
} from 'lucide-react'
import { ragAPI } from '../lib/api'

interface Language {
  code: string
  name: string
  native_name: string
  flag: string
}

interface Voice {
  voice_id: string
  name: string
  category: string
  labels: {
    accent: string
    descriptive: string
    age: string
    gender: string
    language: string
    use_case: string
  }
  description: string
  preview_url: string
}

interface AgentConfig {
  agent_id: string
  name: string
  conversation_config: {
    agent: {
      language: string
      first_message: string
      prompt: {
        prompt: string
      }
    }
    tts: {
      voice_id: string
    }
  }
}

export default function Agent() {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [languages] = useState<Language[]>([
    { code: 'en', name: 'English', native_name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italian', native_name: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Russian', native_name: 'Русский', flag: '🇷🇺' },
    { code: 'es', name: 'Spanish', native_name: 'Español', flag: '🇪🇸' }
  ])
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Voice selection states
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [voicesLoading, setVoicesLoading] = useState(false)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  
  // Voice creation states
  const [showCreateVoiceForm, setShowCreateVoiceForm] = useState(false)
  const [voiceName, setVoiceName] = useState('')
  const [voiceDescription, setVoiceDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Voice selection states
  const [hasVoiceChanges, setHasVoiceChanges] = useState(false)
  const [showVoiceToast, setShowVoiceToast] = useState(false)
  const [selectedVoiceName, setSelectedVoiceName] = useState('')

  // Load agent configuration
  useEffect(() => {
    const loadAgentConfig = async () => {
      try {
        setLoading(true)
        const response = await ragAPI.getAgentConfig()
        const config = response.data
        
        setAgentConfig(config)
        setSelectedLanguage(config.conversation_config.agent.language || 'en')
        setPrompt(config.conversation_config.agent.prompt.prompt || '')
        setFirstMessage(config.conversation_config.agent.first_message || '')
        
        // Set current voice if available
        if (config.conversation_config.tts?.voice_id) {
          setSelectedVoice(config.conversation_config.tts.voice_id)
        }
        
      } catch (error) {
        console.error('Error loading agent config:', error)
        setSaveStatus('error')
      } finally {
        setLoading(false)
      }
    }
    
    loadAgentConfig()
  }, [])

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setVoicesLoading(true)
        const response = await ragAPI.getVoices()
        setVoices(response.data.voices || [])
      } catch (error) {
        console.error('Error loading voices:', error)
      } finally {
        setVoicesLoading(false)
      }
    }
    
    loadVoices()
  }, [])

  // Track voice changes
  useEffect(() => {
    const currentVoiceId = agentConfig?.conversation_config?.tts?.voice_id
    const hasChanges = Boolean(selectedVoice && selectedVoice !== currentVoiceId)
    setHasVoiceChanges(hasChanges)
  }, [selectedVoice, agentConfig])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  const handleVoiceSelection = (voiceId: string) => {
    setSelectedVoice(voiceId)
    
    // Show feedback for voice selection
    const voice = voices.find(v => v.voice_id === voiceId)
    if (voice) {
      setSelectedVoiceName(voice.name)
      setShowVoiceToast(true)
      
      // Auto hide toast after 3 seconds
      setTimeout(() => {
        setShowVoiceToast(false)
      }, 3000)
    }
  }

  const handleVoicePlay = async (voiceId: string, previewUrl: string) => {
    try {
      setPlayingVoice(voiceId)
      const audio = new Audio(previewUrl)
      await audio.play()
      audio.onended = () => setPlayingVoice(null)
    } catch (error) {
      console.error('Error playing voice preview:', error)
      setPlayingVoice(null)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      setSaveStatus('idle')
      
      const updateData: any = {
        language: selectedLanguage,
        prompt: prompt,
        first_message: firstMessage
      }
      
      // Include voice_id if a voice is selected
      if (selectedVoice) {
        updateData.voice_id = selectedVoice
      }
      
      await ragAPI.updateAgentConfig(updateData)
      
      // Reload agent config to get updated voice_id
      const response = await ragAPI.getAgentConfig()
      setAgentConfig(response.data)
      
      // Reset voice changes flag
      setHasVoiceChanges(false)
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
      
    } catch (error) {
      console.error('Error saving config:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/flac']
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid audio file (WAV, MP3, MP4, M4A, OGG, FLAC)')
        return
      }
      
      // Validate file size (25MB max)
      const maxSize = 25 * 1024 * 1024
      if (file.size > maxSize) {
        alert('File size must be less than 25MB')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleCreateVoice = async () => {
    if (!selectedFile || !voiceName.trim()) {
      alert('Please select a file and enter a voice name')
      return
    }

    try {
      setUploading(true)
      setUploadStatus('idle')
      
      await ragAPI.uploadVoice(selectedFile, voiceName.trim(), voiceDescription.trim() || undefined)
      
      setUploadStatus('success')
      
      // Reset form
      setVoiceName('')
      setVoiceDescription('')
      setSelectedFile(null)
      setShowCreateVoiceForm(false)
      
      // Reload voices
      const response = await ragAPI.getVoices()
      setVoices(response.data.voices || [])
      
      setTimeout(() => setUploadStatus('idle'), 3000)
      
    } catch (error) {
      console.error('Error creating voice:', error)
      setUploadStatus('error')
    } finally {
      setUploading(false)
    }
  }

  const handleCloseCreateForm = () => {
    setShowCreateVoiceForm(false)
    setVoiceName('')
    setVoiceDescription('')
    setSelectedFile(null)
    setUploadStatus('idle')
  }


  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Loading agent configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">AI Voice Agent</h1>
            <p className="text-lg text-gray-600 leading-relaxed">Configure your AI voice agent settings</p>
            {agentConfig && (
              <p className="text-sm text-gray-500">Agent: {agentConfig.name} ({agentConfig.agent_id})</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Language Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Language Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.native_name} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Languages className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Current Language</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {languages.find(lang => lang.code === selectedLanguage)?.native_name}
              </p>
            </div>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Voice Selection</h2>
            </div>
            <button
              onClick={() => setShowCreateVoiceForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Voice</span>
            </button>
          </div>
          
          {voicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading voices...</span>
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-8">
              <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No clone voices available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((voice) => {
                  const isActive = selectedVoice === voice.voice_id
                  const isCurrentlyUsed = agentConfig?.conversation_config?.tts?.voice_id === voice.voice_id
                  
                  return (
                  <div
                    key={voice.voice_id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                        isActive
                        ? 'border-primary-500 bg-primary-50'
                          : isCurrentlyUsed
                          ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                      onClick={() => handleVoiceSelection(voice.voice_id)}
                  >
                      {/* Active indicator */}
                      {isCurrentlyUsed && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Active
                        </div>
                      )}
                      
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{voice.name}</h3>
                          {isCurrentlyUsed && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVoicePlay(voice.voice_id, voice.preview_url)
                        }}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={playingVoice === voice.voice_id}
                      >
                        {playingVoice === voice.voice_id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                        ) : (
                          <Play className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Gender:</span>
                        <span className="capitalize">{voice.labels.gender}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Age:</span>
                        <span className="capitalize">{voice.labels.age}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Accent:</span>
                        <span className="capitalize">{voice.labels.accent}</span>
                      </div>
                      {voice.description && (
                        <p className="text-xs text-gray-500 mt-2">{voice.description}</p>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
              
              {selectedVoice && (
                <div className="space-y-3">
                  {/* Currently Used Voice */}
                  {agentConfig?.conversation_config?.tts?.voice_id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <Volume2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Currently Active Voice</span>
                      </div>
                      <p className="text-lg font-semibold text-green-900">
                        {voices.find(voice => voice.voice_id === agentConfig.conversation_config.tts.voice_id)?.name || 'Unknown Voice'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This voice is currently being used by your agent
                      </p>
                    </div>
                  )}
                  
                  {/* Selected Voice (if different from active) */}
                  {hasVoiceChanges && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                        <Volume2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">New Voice Selected</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                      <p className="text-lg font-semibold text-blue-900">
                    {voices.find(voice => voice.voice_id === selectedVoice)?.name}
                  </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Click "Save Configuration" to apply this voice to your agent
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Prompt Configuration</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Message
              </label>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter the first message the agent will say..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter the system prompt that defines the agent's behavior..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Configuration */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Configuration</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Language: {languages.find(lang => lang.code === selectedLanguage)?.flag} {languages.find(lang => lang.code === selectedLanguage)?.native_name}
              </p>
                <p>
                Voice: {voices.find(voice => voice.voice_id === selectedVoice)?.name || 'No voice selected'}
                </p>
              {hasVoiceChanges && (
                <div className="flex items-center space-x-2 text-blue-600 mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Voice change pending</span>
                </div>
              )}
            </div>
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 mt-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Configuration saved successfully!</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to save configuration. Please try again.</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleSaveConfig}
            disabled={saving}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              hasVoiceChanges 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {hasVoiceChanges ? 'Apply Voice Changes' : 'Save Configuration'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create Voice Modal */}
      {showCreateVoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Voice</h3>
                <button
                  onClick={handleCloseCreateForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Name *
                  </label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="Enter voice name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="Enter voice description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Click to upload audio file</p>
                        <p className="text-xs text-gray-500">
                          WAV, MP3, MP4, M4A, OGG, FLAC (max 25MB)
                        </p>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="voice-file-input"
                        />
                        <label
                          htmlFor="voice-file-input"
                          className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {uploadStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Voice created successfully!</span>
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Failed to create voice. Please try again.</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseCreateForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVoice}
                  disabled={uploading || !selectedFile || !voiceName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Voice'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Selection Toast */}
      {showVoiceToast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <Volume2 className="h-5 w-5" />
          <span>Selected voice: <strong>{selectedVoiceName}</strong></span>
          <button
            onClick={() => setShowVoiceToast(false)}
            className="ml-2 text-blue-200 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
