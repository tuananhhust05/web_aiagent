import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, MoreHorizontal, Edit, Trash2, Eye, Download, X, FileText } from 'lucide-react'
import { groupsAPI, contactsImportAPI, contactsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ContactGroups() {
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: groupsResponse, isLoading, error } = useQuery({
    queryKey: ['groups', { search }],
    queryFn: () => groupsAPI.getGroups({ search: search || undefined }),
  })

  const groups = groupsResponse?.data?.groups || []

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => groupsAPI.deleteGroup(groupId),
    onSuccess: () => {
      toast.success('Group deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setShowDeleteModal(false)
      setSelectedGroup(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete group')
    },
  })

  const handleDeleteGroup = () => {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Groups</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contact Groups</h1>
              <p className="text-gray-600 mt-2">Organize your contacts into groups for better management</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Groups Found</h3>
            <p className="text-gray-600 mb-6">
              {search ? 'No groups match your search criteria.' : 'Create your first group to organize your contacts.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                        style={{ backgroundColor: group.color ? `${group.color}20` : '#3B82F620' }}
                      >
                        <Users className="h-6 w-6" style={{ color: group.color || '#3B82F6' }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.member_count || 0} members</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        group.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/contacts/group/${group.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          // Handle edit - you can implement edit modal here
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Group"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['groups'] })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Group</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedGroup.name}"? This action cannot be undone and will remove all members from this group.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteGroupMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Create Group Modal Component
function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true
  })
  const [isImportMode, setIsImportMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importedContactIds, setImportedContactIds] = useState<string[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Fetch contacts for selection
  const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', { search: contactSearchTerm }],
    queryFn: () => contactsAPI.getContacts({ search: contactSearchTerm || undefined }),
  })

  const contacts = Array.isArray(contactsResponse?.data) ? contactsResponse.data : Array.isArray(contactsResponse) ? contactsResponse : []

  const importContactsMutation = useMutation({
    mutationFn: (file: File) => contactsImportAPI.importFromExcel(file),
    onSuccess: (response) => {
      const result = response.data
      setImportedContactIds(result.created_contact_ids || [])
      toast.success(`Successfully imported ${result.created_contacts} contacts`)
      if (result.errors > 0) {
        toast.error(`${result.errors} rows had errors`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import contacts')
    },
  })

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => groupsAPI.createGroup(data),
    onSuccess: (response) => {
      const groupId = response.data.id
      
      // Combine imported contacts and selected contacts
      const allContactIds = [...importedContactIds, ...selectedContactIds]
      
      // If we have contacts to add, add them to the group
      if (allContactIds.length > 0) {
        groupsAPI.addContactsToGroup(groupId, { contact_ids: allContactIds })
          .then(() => {
            toast.success(`Group created and ${allContactIds.length} contacts added successfully`)
            // Invalidate groups query to refresh the list with updated member count
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            // Force reload to ensure UI updates
            setTimeout(() => window.location.reload(), 1000)
          })
          .catch(() => {
            toast.success('Group created, but failed to add contacts')
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            setTimeout(() => window.location.reload(), 1000)
          })
      } else {
        toast.success('Group created successfully')
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        setTimeout(() => window.location.reload(), 1000)
      }
      
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create group')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGroupMutation.mutate(formData)
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContactIds(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId)
      } else {
        return [...prev, contactId]
      }
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-import when file is selected
      importContactsMutation.mutate(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setImportedContactIds([])
    // Reset the file input
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const downloadExampleExcel = () => {
    // Create sample data based on contacts structure
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+1234567890',
        'Company': 'Acme Corp',
        'Status': 'lead',
        'Source': 'website',
        'Notes': 'Interested in premium package'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone': '+0987654321',
        'Company': 'Tech Solutions',
        'Status': 'prospect',
        'Source': 'referral',
        'Notes': 'Follow up next week'
      }
    ]

    // Convert to CSV format
    const headers = Object.keys(sampleData[0])
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'contacts_import_example.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Example file downloaded successfully!')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create New Group</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Group Color
            </label>
            
            {/* Color Picker */}
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
            </div>

            {/* Preset Colors */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Or choose from presets:</p>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#3B82F6', // Blue
                  '#EF4444', // Red
                  '#10B981', // Green
                  '#F59E0B', // Yellow
                  '#8B5CF6', // Purple
                  '#EC4899', // Pink
                  '#06B6D4', // Cyan
                  '#84CC16', // Lime
                  '#F97316', // Orange
                  '#6366F1', // Indigo
                  '#14B8A6', // Teal
                  '#A855F7', // Violet
                  '#DC2626', // Red-600
                  '#059669', // Emerald-600
                  '#D97706', // Amber-600
                  '#7C3AED', // Violet-600
                  '#DB2777', // Pink-600
                  '#0891B2', // Sky-600
                  '#65A30D', // Lime-600
                  '#EA580C', // Orange-600
                  '#4338CA', // Indigo-600
                  '#0D9488', // Teal-600
                  '#9333EA', // Purple-600
                  '#BE185D'  // Rose-600
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      formData.color === color 
                        ? 'border-gray-400 ring-2 ring-gray-300' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active group
            </label>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Add Members</h4>
            
            <div className="flex items-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setIsImportMode(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !isImportMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select from Contacts
              </button>
              <button
                type="button"
                onClick={() => setIsImportMode(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isImportMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Import from Excel
              </button>
            </div>

            {isImportMode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Download example file to see the correct format:</p>
                  <button
                    type="button"
                    onClick={downloadExampleExcel}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Example
                  </button>
                </div>
                
                {selectedFile ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                          {importedContactIds.length > 0 && (
                            <p className="text-xs text-green-700 font-medium">
                              {importedContactIds.length} contacts imported
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="p-1 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                    {importContactsMutation.isPending && (
                      <div className="mt-2 flex items-center text-sm text-green-700">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Importing contacts...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer"
                    >
                      <div className="text-gray-400 mb-2">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-600">Click to upload Excel file</p>
                      <p className="text-sm text-gray-500 mt-1">Supports .xlsx, .xls, .csv files</p>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Select contacts to add to this group:</p>
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedContactIds.length} selected
                  </span>
                </div>
                
                {/* Contact Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Contacts List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {contactsLoading ? (
                    <div className="p-4 text-center">
                      <LoadingSpinner size="sm" />
                      <p className="text-sm text-gray-500 mt-2">Loading contacts...</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-4 text-center">
                      <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No contacts found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {contacts.map((contact: any) => {
                        const isSelected = selectedContactIds.includes(contact._id)
                        return (
                          <div
                            key={contact._id}
                            className={`flex items-center p-3 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleContactToggle(contact._id)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-600">
                                    {contact.first_name?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {contact.first_name} {contact.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {contact.email}
                                  </p>
                                </div>
                                {contact.phone && (
                                  <p className="text-xs text-gray-500 ml-2">
                                    {contact.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
