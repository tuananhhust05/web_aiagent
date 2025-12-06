import { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Plus, Database, Trash2, Eye } from 'lucide-react'
import { cn } from '../lib/utils'
import { ragAPI } from '../lib/api'

interface UploadResponse {
  success: boolean
  message: string
  filename?: string
}

interface Document {
  id: string
  name: string
  metadata: {
    created_at_unix_secs: number
    last_updated_at_unix_secs: number
    size_bytes: number
  }
  supported_usages: string[]
  access_info: {
    is_creator: boolean
    creator_name: string
    creator_email: string
    role: string
  }
  dependent_agents: Array<{
    id: string
    name: string
    type: string
    created_at_unix_secs: number
    access_level: string
  }>
  type: string
}


export default function RAG() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Helper function to truncate name to 10 characters + "..."
  const truncateName = (name: string): string => {
    if (name.length <= 10) return name
    return name.substring(0, 10) + '...'
  }

  // Fetch knowledge base list
  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true)
      const response = await ragAPI.getKnowledgeBases()
      console.log('API Response:', response.data) // Debug log - ElevenLabs raw data
      
      // Handle ElevenLabs API response format
      if (response.data && response.data.documents) {
        setDocuments(response.data.documents)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching knowledge bases:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  // Delete knowledge base
  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(documentId)
      await ragAPI.deleteKnowledgeBase(documentId)
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Show success message
      setUploadResult({
        success: true,
        message: `Document "${documentName}" deleted successfully!`
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadResult(null), 3000)
      
    } catch (error) {
      console.error('Error deleting document:', error)
      setUploadResult({
        success: false,
        message: 'Failed to delete document. Please try again.'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop()
      if (fileExtension === 'pdf' || fileExtension === 'docx') {
      setFile(selectedFile)
      setUploadResult(null)
      } else {
      setUploadResult({
        success: false,
          message: 'Please select a PDF or DOCX file only.'
      })
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop()
      if (fileExtension === 'pdf' || fileExtension === 'docx') {
      setFile(droppedFile)
      setUploadResult(null)
      } else {
      setUploadResult({
        success: false,
          message: 'Please drop a PDF or DOCX file only.'
      })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      await ragAPI.uploadKnowledgeBase(file)
      
        setUploadResult({
          success: true,
        message: `File "${file.name}" uploaded and added to agent successfully!`,
          filename: file.name
        })
        setFile(null)
      setShowUploadForm(false)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      // Refresh knowledge base list
      fetchKnowledgeBases()
      
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || 'Upload failed. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadResult(null)
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">RAG Knowledge Base</h1>
        <p className="text-gray-600">
          Manage your knowledge base and upload documents to enhance your AI agent's capabilities with Retrieval-Augmented Generation (RAG).
        </p>
      </div>

      {/* Knowledge Base List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Knowledge Bases</h2>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">Get started by uploading your first document.</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{truncateName(doc.name)}</h3>
                      <p className="text-xs text-gray-500">ID: {doc.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      disabled={deletingId === doc.id}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{(doc.metadata.size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(doc.metadata.created_at_unix_secs * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{doc.type}</span>
                  </div>
                </div>

                {doc.supported_usages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Supported usages:</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.supported_usages.map((usage) => (
                        <span key={usage} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {usage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {doc.dependent_agents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Connected agents:</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.dependent_agents.map((agent) => (
                        <span key={agent.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {truncateName(agent.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
                <button
                  onClick={() => {
                    setShowUploadForm(false)
                    setFile(null)
                    setUploadResult(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400',
            file ? 'border-green-400 bg-green-50' : ''
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                      Upload Document
              </div>
              <p className="text-gray-500 mb-4">
                      Drag and drop your PDF or DOCX file here, or click to browse
              </p>
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
              >
                Choose File
              </label>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
            </div>
          ) : (
            <div>
              <FileText className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                {file.name}
              </div>
              <p className="text-gray-500 mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>
                <button
                  onClick={removeFile}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className="mt-6">
            <div
              className={cn(
                'flex items-center p-4 rounded-md',
                uploadResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              )}
            >
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              )}
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  )}
                >
                  {uploadResult.message}
                </p>
                {uploadResult.filename && (
                  <p className="text-sm text-green-700 mt-1">
                    File: {uploadResult.filename}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
            How RAG Works
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start">
                    <div className="flex-shrink-0 w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">1</span>
              </div>
              <p>Upload your PDF documents to our secure knowledge base</p>
            </div>
            <div className="flex items-start">
                    <div className="flex-shrink-0 w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">2</span>
              </div>
              <p>Our AI processes and indexes the content for quick retrieval</p>
            </div>
            <div className="flex items-start">
                    <div className="flex-shrink-0 w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">3</span>
                    </div>
                    <p>Your AI agent can now access this knowledge to provide more accurate responses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
