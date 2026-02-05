import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  Video,
  ExternalLink,
  X,
  LogIn,
  FileText,
  Loader2
} from 'lucide-react'
import { meetingsAPI, MeetingPlatform, vexaAPI } from '../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Meeting {
  id: string
  title: string
  description?: string
  platform: MeetingPlatform
  link: string
  created_at: string
  updated_at: string
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'teams' as MeetingPlatform,
    link: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] = useState(false)
  const [transcriptionData, setTranscriptionData] = useState<any>(null)
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false)
  const [isJoining, setIsJoining] = useState<string | null>(null)

  useEffect(() => {
    loadMeetings()
  }, [platformFilter])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: 1,
        limit: 100
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      if (platformFilter !== 'all') {
        params.platform = platformFilter
      }
      
      const response = await meetingsAPI.getMeetings(params)
      setMeetings(response.data.meetings || [])
    } catch (error: any) {
      console.error('Error loading meetings:', error)
      toast.error('Failed to load meetings')
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.link.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      await meetingsAPI.createMeeting(formData)
      toast.success('Meeting created successfully')
      setIsCreateModalOpen(false)
      setFormData({ title: '', description: '', platform: 'teams', link: '' })
      loadMeetings()
    } catch (error: any) {
      console.error('Error creating meeting:', error)
      toast.error(error.response?.data?.detail || 'Failed to create meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeeting || !formData.title.trim() || !formData.link.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      await meetingsAPI.updateMeeting(editingMeeting.id, formData)
      toast.success('Meeting updated successfully')
      setIsEditModalOpen(false)
      setEditingMeeting(null)
      setFormData({ title: '', description: '', platform: 'teams', link: '' })
      loadMeetings()
    } catch (error: any) {
      console.error('Error updating meeting:', error)
      toast.error(error.response?.data?.detail || 'Failed to update meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return
    }

    try {
      await meetingsAPI.deleteMeeting(id)
      toast.success('Meeting deleted successfully')
      loadMeetings()
    } catch (error: any) {
      console.error('Error deleting meeting:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete meeting')
    }
  }

  const openEditModal = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      platform: meeting.platform,
      link: meeting.link
    })
    setIsEditModalOpen(true)
  }

  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setEditingMeeting(null)
    setFormData({ title: '', description: '', platform: 'teams', link: '' })
  }

  const getPlatformLabel = (platform: MeetingPlatform) => {
    switch (platform) {
      case 'teams':
        return 'Microsoft Teams'
      case 'zoom':
        return 'Zoom'
      case 'google_meet':
        return 'Google Meet'
      default:
        return platform
    }
  }

  const getPlatformColor = (platform: MeetingPlatform) => {
    switch (platform) {
      case 'teams':
        return 'bg-blue-100 text-blue-800'
      case 'zoom':
        return 'bg-blue-100 text-blue-800'
      case 'google_meet':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Extract native_meeting_id from Google Meet link
  const extractGoogleMeetId = (link: string): string | null => {
    try {
      const url = new URL(link)
      if (url.hostname.includes('meet.google.com')) {
        // Extract the meeting ID from pathname (e.g., /cvr-koad-bii)
        const pathParts = url.pathname.split('/').filter(p => p)
        if (pathParts.length > 0) {
          return pathParts[pathParts.length - 1]
        }
      }
      return null
    } catch (e) {
      // If URL parsing fails, try to extract manually
      const match = link.match(/meet\.google\.com\/([a-z-]+)/i)
      return match ? match[1] : null
    }
  }

  // Extract native_meeting_id and passcode from Teams link
  const extractTeamsInfo = (link: string): { meetingId: string | null; passcode: string | null } => {
    try {
      const url = new URL(link)
      if (url.hostname.includes('teams.live.com')) {
        // Extract meeting ID from pathname (e.g., /meet/9393123608347)
        const pathParts = url.pathname.split('/').filter(p => p)
        const meetingId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null
        
        // Extract passcode from query params (e.g., ?p=SUudHQgqn5KSAbBQ01)
        const passcode = url.searchParams.get('p')
        
        return { meetingId, passcode }
      }
      return { meetingId: null, passcode: null }
    } catch (e) {
      // If URL parsing fails, try to extract manually
      const meetingMatch = link.match(/teams\.live\.com\/meet\/(\d+)/i)
      const passcodeMatch = link.match(/[?&]p=([^&]+)/i)
      return {
        meetingId: meetingMatch ? meetingMatch[1] : null,
        passcode: passcodeMatch ? passcodeMatch[1] : null
      }
    }
  }

  const handleJoinMeeting = async (meeting: Meeting) => {
    if (meeting.platform === 'google_meet') {
      const meetingId = extractGoogleMeetId(meeting.link)
      if (!meetingId) {
        toast.error('Invalid Google Meet link')
        return
      }

      try {
        setIsJoining(meeting.id)
        await vexaAPI.joinGoogleMeet(meetingId)
        toast.success('Bot joined the meeting successfully!')
      } catch (error: any) {
        console.error('Error joining meeting:', error)
        toast.error(error.response?.data?.message || 'Failed to join meeting')
      } finally {
        setIsJoining(null)
      }
    } else if (meeting.platform === 'teams') {
      const { meetingId, passcode } = extractTeamsInfo(meeting.link)
      if (!meetingId) {
        toast.error('Invalid Teams meeting link')
        return
      }
      if (!passcode) {
        toast.error('Teams meeting link is missing passcode')
        return
      }

      try {
        setIsJoining(meeting.id)
        await vexaAPI.joinTeams(meetingId, passcode)
        toast.success('Bot joined the meeting successfully!')
      } catch (error: any) {
        console.error('Error joining meeting:', error)
        toast.error(error.response?.data?.message || 'Failed to join meeting')
      } finally {
        setIsJoining(null)
      }
    }
  }

  const handleGetTranscription = async (meeting: Meeting) => {
    if (meeting.platform === 'google_meet') {
      const meetingId = extractGoogleMeetId(meeting.link)
      if (!meetingId) {
        toast.error('Invalid Google Meet link')
        return
      }

      try {
        setIsLoadingTranscription(true)
        const response = await vexaAPI.getGoogleMeetTranscription(meetingId)
        setTranscriptionData(response.data)
        setIsTranscriptionModalOpen(true)
      } catch (error: any) {
        console.error('Error getting transcription:', error)
        toast.error(error.response?.data?.message || 'Failed to get transcription')
      } finally {
        setIsLoadingTranscription(false)
      }
    } else if (meeting.platform === 'teams') {
      const { meetingId } = extractTeamsInfo(meeting.link)
      if (!meetingId) {
        toast.error('Invalid Teams meeting link')
        return
      }

      try {
        setIsLoadingTranscription(true)
        const response = await vexaAPI.getTeamsTranscription(meetingId)
        setTranscriptionData(response.data)
        setIsTranscriptionModalOpen(true)
      } catch (error: any) {
        console.error('Error getting transcription:', error)
        toast.error(error.response?.data?.message || 'Failed to get transcription')
      } finally {
        setIsLoadingTranscription(false)
      }
    }
  }

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPlatform = platformFilter === 'all' || meeting.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Manage your meetings and video conference links</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Meeting</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                loadMeetings()
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Video className="h-4 w-4 text-gray-400" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Platforms</option>
            <option value="teams">Microsoft Teams</option>
            <option value="zoom">Zoom</option>
            <option value="google_meet">Google Meet</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || platformFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first meeting'}
            </p>
            {!searchTerm && platformFilter === 'all' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
              >
                Create Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                        {meeting.description && (
                          <div className="text-sm text-gray-500 mt-1">{meeting.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlatformColor(meeting.platform)}`}>
                        {getPlatformLabel(meeting.platform)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {(meeting.platform === 'google_meet' || meeting.platform === 'teams') && (
                          <>
                            <button
                              onClick={() => handleJoinMeeting(meeting)}
                              disabled={isJoining === meeting.id}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Join with Bot"
                            >
                              {isJoining === meeting.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Joining...</span>
                                </>
                              ) : (
                                <>
                                  <LogIn className="h-3 w-3" />
                                  <span>Join</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleGetTranscription(meeting)}
                              disabled={isLoadingTranscription}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Get Transcription"
                            >
                              {isLoadingTranscription ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="h-3 w-3" />
                                  <span>Transcription</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEditModal(meeting)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Meeting</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as MeetingPlatform })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="teams">Microsoft Teams</option>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Meeting</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as MeetingPlatform })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="teams">Microsoft Teams</option>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transcription Modal */}
      {isTranscriptionModalOpen && transcriptionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Meeting Transcription</h2>
              <button
                onClick={() => {
                  setIsTranscriptionModalOpen(false)
                  setTranscriptionData(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meeting Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-sm text-gray-900">{transcriptionData.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Platform</label>
                  <p className="text-sm text-gray-900">{transcriptionData.platform}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Native Meeting ID</label>
                  <p className="text-sm text-gray-900">{transcriptionData.native_meeting_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transcriptionData.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transcriptionData.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Meeting URL</label>
                  <a 
                    href={transcriptionData.constructed_meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>{transcriptionData.constructed_meeting_url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-sm text-gray-900">
                    {new Date(transcriptionData.start_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <p className="text-sm text-gray-900">
                    {transcriptionData.end_time 
                      ? new Date(transcriptionData.end_time).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Segments */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-3 block">
                  Transcription Segments ({transcriptionData.segments?.length || 0})
                </label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transcriptionData.segments && transcriptionData.segments.length > 0 ? (
                    transcriptionData.segments.map((segment: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                Segment {index + 1}
                              </span>
                              <span className="text-xs text-gray-400">
                                {segment.start}s - {segment.end}s
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{segment.text}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Speaker:</span>
                            <span className="ml-1 text-gray-900 font-medium">{segment.speaker || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Language:</span>
                            <span className="ml-1 text-gray-900">{segment.language || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Start Time:</span>
                            <span className="ml-1 text-gray-900">
                              {segment.absolute_start_time 
                                ? new Date(segment.absolute_start_time).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">End Time:</span>
                            <span className="ml-1 text-gray-900">
                              {segment.absolute_end_time 
                                ? new Date(segment.absolute_end_time).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created At:</span>
                            <span className="ml-1 text-gray-900">
                              {segment.created_at 
                                ? new Date(segment.created_at).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No segments available</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  setIsTranscriptionModalOpen(false)
                  setTranscriptionData(null)
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
