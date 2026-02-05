import { useState, useRef, useEffect } from 'react'
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Sparkles,
  Trash2,
  Calendar,
  File,
  Cloud,
  Zap,
  Brain,
  ArrowUp,
  Loader2,
  Download,
  AlertCircle
} from 'lucide-react'
import { cn } from '../lib/utils'
import { ragAPI } from '../lib/api'

interface Document {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'processed' | 'processing' | 'failed'
  type: 'pdf'
  pages: number
  total_chunks?: number
  error_message?: string
}

export default function RAGSalesCoach() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  // Poll for updates if there are processing documents
  useEffect(() => {
    const hasProcessing = documents.some(doc => doc.status === 'processing')
    if (!hasProcessing) return

    const interval = setInterval(() => {
      loadDocuments().catch(console.error)
    }, 5000) // Poll every 5 seconds
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.map(d => d.id + d.status).join(',')]) // Only re-run when status changes

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await ragAPI.getRAGDocuments()
      setDocuments(response.data)
    } catch (error: any) {
      console.error('Failed to load documents:', error)
      // Show error but don't block UI
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      if (fileExtension === 'pdf') {
        setFile(droppedFile)
      } else {
        alert('Only PDF files are supported')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop()
      if (fileExtension === 'pdf') {
        setFile(selectedFile)
      } else {
        alert('Only PDF files are supported')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    
    try {
      await ragAPI.uploadRAGDocument(file)
      
      // Reload documents to get the latest status
      await loadDocuments()
      
      setFile(null)
      setUploading(false)
      setShowUploadModal(false)
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert(error.response?.data?.detail || 'Failed to upload document')
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await ragAPI.deleteRAGDocument(id)
      await loadDocuments()
    } catch (error: any) {
      console.error('Delete failed:', error)
      alert(error.response?.data?.detail || 'Failed to delete document')
    }
  }

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await ragAPI.downloadRAGDocument(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Download failed:', error)
      alert(error.response?.data?.detail || 'Failed to download document')
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                RAG Atlas
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Upload documents to enhance your Atlas with intelligent knowledge retrieval
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {documents.length}
            </div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {documents.filter(d => d.status === 'processed').length}
            </div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-6 border border-pink-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Cloud className="h-6 w-6 text-pink-600" />
              </div>
              <Sparkles className="h-5 w-5 text-pink-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatFileSize(documents.reduce((acc, doc) => acc + doc.size, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Storage</div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowUploadModal(true)}
            className="group relative inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <Upload className="h-5 w-5" />
            <span>Upload Document</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
          </button>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Documents</h2>
          
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <Loader2 className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading documents...</h3>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-6">Upload your first document to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        doc.type === 'pdf' 
                          ? "bg-red-50" 
                          : "bg-blue-50"
                      )}>
                        <File className={cn(
                          "h-6 w-6",
                          doc.type === 'pdf' ? "text-red-600" : "text-blue-600"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          {doc.status === 'processed' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                          {doc.status === 'processing' && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                          )}
                          {doc.status === 'failed' && (
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                          {doc.total_chunks && doc.total_chunks > 0 && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              <span>{doc.total_chunks} chunks</span>
                            </div>
                          )}
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.status === 'failed' && doc.error_message && (
                            <span className="text-red-600 text-xs">Error: {doc.error_message}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDownload(doc.id, doc.name)}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Download document"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Upload Document</h3>
                    <p className="text-gray-600 mt-1">Add a new document to your knowledge base</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      setFile(null)
                      removeFile()
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
                    dragActive
                      ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50/50",
                    file ? "border-green-400 bg-green-50/30" : ""
                  )}
                >
                  {!file ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                        <ArrowUp className="h-10 w-10 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          Drag & drop your file
                        </h4>
                        <p className="text-gray-600 mb-6">
                          or click to browse from your computer
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="h-5 w-5" />
                          Choose File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Supported formats: PDF only (Max 50MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-100 mb-4">
                        <FileText className="h-10 w-10 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {file.name}
                        </h4>
                        <p className="text-gray-600 mb-6">
                          {formatFileSize(file.size)}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Cloud className="h-5 w-5" />
                                Upload Document
                              </>
                            )}
                          </button>
                          <button
                            onClick={removeFile}
                            disabled={uploading}
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">How it works</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold mt-0.5">1.</span>
                          <span>Upload your document (PDF format only)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold mt-0.5">2.</span>
                          <span>Our AI processes and indexes the content automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold mt-0.5">3.</span>
                          <span>Your Atlas can now access this knowledge for smarter responses</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
