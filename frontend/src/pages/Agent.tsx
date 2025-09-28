import { useState, useEffect } from 'react'
import { 
  Mic, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Languages,
  Save,
  MessageSquare
} from 'lucide-react'
import { ragAPI } from '../lib/api'

interface Language {
  code: string
  name: string
  native_name: string
  flag: string
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
        
      } catch (error) {
        console.error('Error loading agent config:', error)
        setSaveStatus('error')
      } finally {
        setLoading(false)
      }
    }
    
    loadAgentConfig()
  }, [])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      setSaveStatus('idle')
      
      await ragAPI.updateAgentConfig({
        language: selectedLanguage,
        prompt: prompt,
        first_message: firstMessage
      })
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
      
    } catch (error) {
      console.error('Error saving config:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
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
            <p className="text-sm text-gray-600">
              Language: {languages.find(lang => lang.code === selectedLanguage)?.flag} {languages.find(lang => lang.code === selectedLanguage)?.native_name}
            </p>
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
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
