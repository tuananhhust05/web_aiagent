import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Users,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { contactsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface ImportPreview {
  total: number
  valid: number
  invalid: number
  preview: any[]
  errors: string[]
}

export default function ContactImport() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const importMutation = useMutation({
    mutationFn: (data: { file: File; preview: ImportPreview }) =>
      contactsAPI.importContacts(data.file),
    onSuccess: () => {
      toast.success('Contacts imported successfully!')
      setFile(null)
      setPreview(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import contacts')
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      handlePreview(uploadedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  })

  const handlePreview = async (file: File) => {
    setIsPreviewing(true)
    try {
      // In a real implementation, this would call the backend to preview the file
      // For now, we'll simulate the preview
      const mockPreview: ImportPreview = {
        total: 150,
        valid: 142,
        invalid: 8,
        preview: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            company: 'TechCorp',
            status: 'valid'
          },
          {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1234567891',
            company: 'InnovateCo',
            status: 'valid'
          },
          {
            first_name: 'Bob',
            last_name: 'Johnson',
            email: 'invalid-email',
            phone: '+1234567892',
            company: 'StartupXYZ',
            status: 'invalid'
          }
        ],
        errors: [
          'Row 3: Invalid email format',
          'Row 7: Missing required field "email"',
          'Row 12: Phone number format invalid'
        ]
      }
      
      setTimeout(() => {
        setPreview(mockPreview)
        setIsPreviewing(false)
      }, 1500)
    } catch (error) {
      toast.error('Failed to preview file')
      setIsPreviewing(false)
    }
  }

  const handleImport = () => {
    if (file && preview) {
      importMutation.mutate({ file, preview })
    }
  }

  const downloadTemplate = () => {
    const csvContent = `first_name,last_name,email,phone,company,title,notes
John,Doe,john.doe@example.com,+1234567890,TechCorp,CEO,Interested in our solution
Jane,Smith,jane.smith@example.com,+1234567891,InnovateCo,CTO,Follow up needed
Bob,Johnson,bob.johnson@example.com,+1234567892,StartupXYZ,Founder,Hot lead`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
              Import Contacts
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Upload your contact list from CSV or Excel files to get started quickly
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Imported Today</p>
                <p className="text-2xl font-bold text-gray-900">+45</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Download Template</h3>
                <p className="text-gray-600">Get our CSV template to ensure proper formatting</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn btn-outline btn-md group w-full"
            >
              <FileText className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Download CSV Template
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
                <p className="text-gray-600">Drag and drop your CSV or Excel file here</p>
              </div>
            </div>

            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600 font-medium">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">CSV, XLS, or XLSX files up to 10MB</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Import Button */}
          {file && preview && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Import</h3>
                  <p className="text-gray-600">
                    {preview.valid} valid contacts will be imported
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{preview.valid}</p>
                  <p className="text-sm text-gray-500">valid contacts</p>
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="btn btn-primary btn-lg group w-full"
              >
                {importMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Import {preview.valid} Contacts
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {isPreviewing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 font-medium">Analyzing your file...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            </div>
          )}

          {preview && !isPreviewing && (
            <>
              {/* Preview Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">File Preview</h3>
                    <p className="text-gray-600">Review your data before importing</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{preview.total}</p>
                    <p className="text-sm text-gray-600">Total Rows</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{preview.valid}</p>
                    <p className="text-sm text-gray-600">Valid</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{preview.invalid}</p>
                    <p className="text-sm text-gray-600">Invalid</p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Sample Data</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.preview.map((contact, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {contact.email}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {contact.company}
                            </td>
                            <td className="px-4 py-3">
                              {contact.status === 'valid' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Validation Errors</h3>
                      <p className="text-gray-600">Please fix these issues before importing</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {preview.errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Instructions */}
          {!file && !preview && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to import your contacts?
                </h3>
                <p className="text-gray-600 mb-6">
                  Follow these steps to get your contacts imported quickly and accurately.
                </p>
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <span className="text-gray-700">Download our CSV template</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <span className="text-gray-700">Fill in your contact data</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <span className="text-gray-700">Upload and preview your file</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <span className="text-gray-700">Import your contacts</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 