import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Search, Users, MoreHorizontal, Trash2, Edit, Phone, Mail, Building2, Upload, Download, X } from 'lucide-react'
import { groupsAPI, contactsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>()
  const [search, setSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [addMode, setAddMode] = useState<'existing' | 'import'>('existing')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const { data: group, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsAPI.getGroup(groupId!),
    enabled: !!groupId,
  })

  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => groupsAPI.getGroupMembers(groupId!),
    enabled: !!groupId,
  })

  const members = membersResponse?.data?.users || []

  // Get available contacts for adding to group
  const { data: availableContactsResponse } = useQuery({
    queryKey: ['available-contacts', groupId],
    queryFn: () => groupsAPI.getAvailableContacts(groupId!),
    enabled: !!groupId && showAddMembersModal,
  })

  const availableContacts = availableContactsResponse?.data?.contacts || []


  const addMembersMutation = useMutation({
    mutationFn: (data: any) => groupsAPI.addContactsToGroup(groupId!, data),
    onSuccess: () => {
      toast.success('Members added successfully')
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['available-contacts', groupId] })
      setShowAddMembersModal(false)
      setSelectedMembers([])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add members')
    },
  })

  const importContactsMutation = useMutation({
    mutationFn: (file: File) => groupsAPI.importContactsToGroup(groupId!, file),
    onSuccess: (response) => {
      const result = response.data
      toast.success(`Successfully imported ${result.created_contacts} contacts`)
      if (result.duplicate_phones.length > 0) {
        toast.error(`${result.duplicate_phones.length} contacts skipped due to duplicate phone numbers`)
      }
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      setShowAddMembersModal(false)
      setSelectedFile(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import contacts')
    },
  })

  const removeMembersMutation = useMutation({
    mutationFn: (data: any) => groupsAPI.removeContactsFromGroup(groupId!, data),
    onSuccess: () => {
      toast.success('Members removed successfully')
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      setShowRemoveModal(false)
      setSelectedMembers([])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove members')
    },
  })


  const handleAddMembers = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one contact')
      return
    }
    addMembersMutation.mutate({ contact_ids: selectedMembers })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImportContacts = () => {
    if (!selectedFile) {
      toast.error('Please select a file to import')
      return
    }
    importContactsMutation.mutate(selectedFile)
  }

  const downloadExampleExcel = () => {
    const csvContent = "First Name,Last Name,Email,Phone,Company\nJohn,Doe,john@example.com,+1234567890,Acme Corp\nJane,Smith,jane@example.com,+0987654321,Tech Inc"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'contacts_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRemoveMembers = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member')
      return
    }
    removeMembersMutation.mutate({ contact_ids: selectedMembers })
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (groupError || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
          <p className="text-gray-600 mb-6">The group you're looking for doesn't exist.</p>
          <Link
            to="/contacts/group"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  const filteredMembers = members.filter((member: any) =>
    member.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    member.contact_phone?.includes(search)
  )

  // Note: availableContacts logic removed since we only import from Excel

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/contacts/group"
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                  style={{ backgroundColor: group.color ? `${group.color}20` : '#3B82F620' }}
                >
                  <Users className="h-6 w-6" style={{ color: group.color || '#3B82F6' }} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                  <p className="text-gray-600 mt-1">{members.length} members</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddMembersModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Members
              </button>
            </div>
          </div>
          
          {group.description && (
            <div className="mt-4">
              <p className="text-gray-600">{group.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedMembers.length} selected
                  </span>
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members List */}
        {membersLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {search ? 'No Members Found' : 'No Members Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {search 
                ? 'No members match your search criteria.' 
                : 'Add members to this group to get started.'
              }
            </p>
            {!search && (
              <p className="text-gray-500 text-sm">
                Import contacts from Excel to add them to this group
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member: any) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-white font-semibold text-lg">
                          {member.contact_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.contact_name || 'Unknown Contact'}
                        </h3>
                        <p className="text-sm text-gray-500">Member since {new Date(member.added_at || member.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.contact_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.contact_id])
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.contact_id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {member.contact_email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {member.contact_email}
                      </div>
                    )}
                    {member.contact_phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {member.contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Remove Members Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Remove Members</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {selectedMembers.length} member(s) from this group?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMembers}
                disabled={removeMembersMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removeMembersMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add Members to Group</h3>
              <button
                onClick={() => setShowAddMembersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Selection */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setAddMode('existing')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  addMode === 'existing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Add Existing Contacts
              </button>
              <button
                onClick={() => setAddMode('import')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  addMode === 'import'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Import from Excel
              </button>
            </div>

            {addMode === 'existing' ? (
              /* Add Existing Contacts */
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableContacts.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No available contacts to add.</p>
                  ) : (
                    availableContacts.map((contact: any) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-white font-semibold">
                              {contact.first_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-sm text-gray-500">{contact.phone}</p>
                            )}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, contact.id])
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== contact.id))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowAddMembersModal(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMembers}
                    disabled={addMembersMutation.isPending || selectedMembers.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {addMembersMutation.isPending ? 'Adding...' : `Add ${selectedMembers.length} Members`}
                  </button>
                </div>
              </div>
            ) : (
              /* Import from Excel */
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
                        <Upload className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
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
                      id="excel-upload"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</p>
                      <p className="text-sm text-gray-500">Click to select or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-2">Supports .xlsx, .xls, .csv files</p>
                    </label>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Required columns: First Name, Last Name, Email</li>
                    <li>• Phone numbers must be unique (no duplicates with existing contacts)</li>
                    <li>• Duplicate phone numbers will be skipped</li>
                    <li>• Contacts will be automatically added to this group after import</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowAddMembersModal(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportContacts}
                    disabled={importContactsMutation.isPending || !selectedFile}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {importContactsMutation.isPending ? 'Importing...' : 'Import Contacts'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
