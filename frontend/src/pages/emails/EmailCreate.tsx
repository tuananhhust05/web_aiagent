import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Save, 
  Send, 
  ArrowLeft, 
  Users, 
  UserPlus,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { emailsAPI, contactsAPI, groupsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CKEditorComponent from '../../components/ui/CKEditor'

interface Contact {
  _id: string
  email: string
  first_name: string
  last_name: string
}

interface Group {
  _id: string
  name: string
  member_count: number
}

const EmailCreate: React.FC = () => {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [isHtml, setIsHtml] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [showGroupSelector, setShowGroupSelector] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadContacts()
    loadGroups()
  }, [])

  const loadContacts = async () => {
    try {
      console.log('🔄 Loading contacts...')
      const response = await contactsAPI.getContacts({ limit: 1000 })
      console.log('📧 Contacts response:', response)
      const contactsData = response.data || []
      console.log('👥 Loaded contacts:', contactsData.length, contactsData)
      setContacts(contactsData)
    } catch (error) {
      console.error('❌ Error loading contacts:', error)
      toast.error('Failed to load contacts')
      setContacts([])
    }
  }

  const loadGroups = async () => {
    try {
      console.log('🔄 Loading groups...')
      const response = await groupsAPI.getGroups()
      console.log('📧 Groups response:', response)
      const groupsData = response.data || []
      console.log('👥 Loaded groups:', groupsData.length, groupsData)
      setGroups(groupsData)
    } catch (error) {
      console.error('❌ Error loading groups:', error)
      toast.error('Failed to load groups')
      setGroups([])
    }
  }

  const handleSaveDraft = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    try {
      setLoading(true)
      const emailData = {
        subject: subject.trim(),
        content: content.trim(),
        is_html: isHtml,
        recipients: selectedContacts.map(contact => ({
          email: contact.email,
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          contact_id: contact._id
        })),
        group_ids: selectedGroups.map(group => group._id),
        contact_ids: selectedContacts.map(contact => contact._id),
        attachments: []
      }

      await emailsAPI.createEmail(emailData)
      toast.success('Email saved as draft')
      navigate('/emails')
    } catch (error: any) {
      console.error('Error saving email:', error)
      toast.error('Failed to save email')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter email content')
      return
    }

    if (selectedContacts.length === 0 && selectedGroups.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    try {
      setLoading(true)
      const emailData = {
        subject: subject.trim(),
        content: content.trim(),
        is_html: isHtml,
        recipients: selectedContacts.map(contact => ({
          email: contact.email,
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          contact_id: contact._id
        })),
        group_ids: selectedGroups.map(group => group._id),
        contact_ids: selectedContacts.map(contact => contact._id),
        attachments: []
      }

      const response = await emailsAPI.createEmail(emailData)
      const emailId = response.data.id

      // Send the email
      await emailsAPI.sendEmail(emailId)
      toast.success('Email sent successfully')
      navigate('/emails')
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const addContact = (contact: Contact) => {
    console.log('➕ Adding contact:', contact)
    console.log('📋 Current selected contacts:', selectedContacts)
    
    if (!selectedContacts.find(c => c._id === contact._id)) {
      const newSelectedContacts = [...selectedContacts, contact]
      console.log('✅ New selected contacts:', newSelectedContacts)
      setSelectedContacts(newSelectedContacts)
      toast.success(`Added ${contact.first_name} ${contact.last_name}`)
    } else {
      console.log('⚠️ Contact already selected')
      toast.error('Contact already selected')
    }
  }

  const removeContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c._id !== contactId))
  }

  const addGroup = (group: Group) => {
    if (!selectedGroups.find(g => g._id === group._id)) {
      setSelectedGroups([...selectedGroups, group])
      toast.success(`Added group: ${group.name}`)
    } else {
      toast.error('Group already selected')
    }
  }

  const removeGroup = (groupId: string) => {
    setSelectedGroups(selectedGroups.filter(g => g._id !== groupId))
  }

  const totalRecipients = selectedContacts.length + selectedGroups.reduce((sum, group) => sum + group.member_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/emails')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Email</h1>
            <p className="text-gray-600">Compose and send marketing emails</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Draft</span>
          </button>
          
          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
            <span>Send Email</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isHtml}
                    onChange={(e) => setIsHtml(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">HTML Editor</span>
                </label>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{previewMode ? 'Edit' : 'Preview'}</span>
                </button>
              </div>
            </div>
            
            {previewMode ? (
              <div 
                className="min-h-96 p-4 border border-gray-300 rounded-lg bg-gray-50"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : isHtml ? (
              <CKEditorComponent
                value={content}
                onChange={setContent}
                placeholder="Enter email content..."
                height={400}
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter email content..."
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipients</h3>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowContactSelector(!showContactSelector)}
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Contacts</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {contacts.length} available
                  </span>
                  {showContactSelector && <span className="text-xs">(Click to close)</span>}
                </button>
                
                {showContactSelector && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {contacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No contacts available</p>
                        <p className="text-xs">Create contacts first</p>
                      </div>
                    ) : (
                      contacts.map(contact => {
                        const isSelected = selectedContacts.find(c => c._id === contact._id)
                        return (
                          <div
                            key={contact._id}
                            onClick={() => addContact(contact)}
                            className={`p-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{contact.first_name} {contact.last_name}</div>
                                <div className="text-xs text-gray-500">{contact.email}</div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600 text-xs font-medium">✓ Selected</div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setShowGroupSelector(!showGroupSelector)}
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Add Groups</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {groups.length} available
                  </span>
                  {showGroupSelector && <span className="text-xs">(Click to close)</span>}
                </button>
                
                {showGroupSelector && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {groups.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No groups available</p>
                        <p className="text-xs">Create groups first</p>
                      </div>
                    ) : (
                      groups.map(group => {
                        const isSelected = selectedGroups.find(g => g._id === group._id)
                        return (
                          <div
                            key={group._id}
                            onClick={() => addGroup(group)}
                            className={`p-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{group.name}</div>
                                <div className="text-xs text-gray-500">{group.member_count} members</div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600 text-xs font-medium">✓ Selected</div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Recipients */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Selected Recipients ({totalRecipients})
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedContacts.map(contact => (
                  <div key={contact._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                      <div className="text-gray-500">{contact.email}</div>
                    </div>
                    <button
                      onClick={() => removeContact(contact._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {selectedGroups.map(group => (
                  <div key={group._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-gray-500">{group.member_count} members</div>
                    </div>
                    <button
                      onClick={() => removeGroup(group._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Recipients:</span>
                <span className="font-medium">{totalRecipients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Individual Contacts:</span>
                <span className="font-medium">{selectedContacts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Groups:</span>
                <span className="font-medium">{selectedGroups.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailCreate
