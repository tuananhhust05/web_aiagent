import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface UploadResponse {
  success: boolean
  message: string
  filename?: string
}

export default function RAG() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setUploadResult(null)
    } else if (selectedFile) {
      setUploadResult({
        success: false,
        message: 'Please select a PDF file only.'
      })
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
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setUploadResult(null)
    } else if (droppedFile) {
      setUploadResult({
        success: false,
        message: 'Please drop a PDF file only.'
      })
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('https://4skale.com/rag/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: 'File uploaded successfully!',
          filename: file.name
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setUploadResult({
          success: false,
          message: result.message || 'Upload failed. Please try again.'
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Network error. Please check your connection and try again.'
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">RAG Document Upload</h1>
        <p className="text-gray-600">
          Upload PDF documents to enhance your AI agent's knowledge base with Retrieval-Augmented Generation (RAG).
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                Upload PDF Document
              </div>
              <p className="text-gray-500 mb-4">
                Drag and drop your PDF file here, or click to browse
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
                accept=".pdf"
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
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            How RAG Works
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">1</span>
              </div>
              <p>Upload your PDF documents to our secure knowledge base</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">2</span>
              </div>
              <p>Our AI processes and indexes the content for quick retrieval</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">3</span>
              </div>
              <p>Your AI agent can now access this knowledge to provide more accurate and contextual responses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
