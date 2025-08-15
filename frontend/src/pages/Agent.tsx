import { Mic, ExternalLink } from 'lucide-react'

export default function Agent() {
  const handleOpenAgent = () => {
    // Open the local file in a new tab
    window.open('file:///C:/data/agentvoice/agentclient/transctiptionrealtime.html', '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">AI Voice Agent</h1>
            <p className="text-lg text-gray-600 leading-relaxed">Open your AI voice agent interface in a new tab</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agent Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Mic className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Voice Agent Interface</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Click the button below to open the AI voice agent interface in a new tab. 
              This will launch the transcription and voice interaction system.
            </p>
            <button
              // onClick={handleOpenAgent}
              className="btn btn-primary btn-lg group"
            >
              <ExternalLink className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
              <a href="file:///C:/data/agentvoice/agentclient/transctiptionrealtime.html" target="_blank">
                 Open Voice Agent
              </a>
              
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to use your AI Voice Agent</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Open Interface</h4>
                  <p className="text-sm text-gray-600">Click "Open Voice Agent" to launch the interface in a new tab</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Enable Microphone</h4>
                  <p className="text-sm text-gray-600">Allow microphone access when prompted by your browser</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Start Conversation</h4>
                  <p className="text-sm text-gray-600">Begin speaking with your AI agent for real-time transcription</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Path Info */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">File Location</h4>
            <p className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded-lg border">
              C:\data\agentvoice\agentclient\transctiptionrealtime.html
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
