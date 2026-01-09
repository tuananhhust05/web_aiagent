import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  Eye,
  X,
  Clock,
  CheckCircle,
  ArrowLeft,
  Pencil,
  Inbox,
  List,
  UserCircle,
  Search,
  BarChart3,
  Settings,
  FileText,
} from 'lucide-react'

// Types
export type WorkflowSource = 'my' | 'company' | 'colleague'

export interface Colleague {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

interface HistoryState {
  nodes: any[]
  connections: any[]
}

interface NodeType {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  description: string
}

interface PreBuiltWorkflow {
  id: string
  name: string
  description: string
  nodes: any[]
  connections: any[]
}

interface WorkflowBuilderHeaderProps {
  // Workflow source states
  workflowSource: WorkflowSource
  setWorkflowSource: (source: WorkflowSource) => void
  colleagues: Colleague[]
  selectedColleague: Colleague | null
  setSelectedColleague: (colleague: Colleague | null) => void
  showSourceDropdown: boolean
  setShowSourceDropdown: (show: boolean) => void
  workflowOwner: Colleague | null
  
  // Mode states
  isCampaignMode: boolean
  isViewOnly: boolean
  
  // History states
  history: HistoryState[]
  historyIndex: number
  undo: () => void
  redo: () => void
  
  // Connection states
  connectionLabel: 'yes' | 'no'
  setConnectionLabel: (label: 'yes' | 'no') => void
  isDrawMode: boolean
  handleDrawModeToggle: () => void
  
  // Save/load states
  isLoading: boolean
  isSaving: boolean
  functionName: string | null
  
  // Node states
  selectedNode: string | null
  deleteNode: (nodeId: string) => void
  nodes: any[]
  connections: any[]
  setConnections: (connections: any[]) => void
  saveToHistory: (nodes: any[], connections: any[]) => void
  
  // Sidebar states
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  
  // Workflow loading
  loadWorkflow: (workflowId: string) => void
  
  // Node types and pre-built workflows
  nodeTypes: NodeType[]
  preBuiltWorkflows: PreBuiltWorkflow[]
  setDraggedNodeType: (type: string | null) => void
  
  // User
  user: any
  
  // New props for header design
  workflowTitle?: string
  workflowId?: string | null
  onWorkflowTitleChange?: (title: string) => void
  emailLimit?: { used: number; total: number }
  isActive?: boolean
  onActiveToggle?: (active: boolean) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function WorkflowBuilderHeader({
  // workflowSource,
  // setWorkflowSource,
  // colleagues,
  // selectedColleague,
  // setSelectedColleague,
  showSourceDropdown,
  setShowSourceDropdown,
  // workflowOwner,
  isCampaignMode,
  isViewOnly,
  // history,
  // historyIndex,
  // undo,
  // redo,
  connectionLabel,
  setConnectionLabel,
  // isDrawMode,
  // handleDrawModeToggle,
  isLoading,
  isSaving,
  functionName,
  selectedNode,
  deleteNode,
  // nodes,
  // connections,
  // setConnections,
  // saveToHistory,
  showSidebar,
  setShowSidebar,
  loadWorkflow,
  nodeTypes,
  preBuiltWorkflows,
  setDraggedNodeType,
  // user,
  workflowTitle,
  workflowId,
  onWorkflowTitleChange,
  emailLimit = { used: 0, total: 100 },
  isActive = true,
  onActiveToggle,
  activeTab = 'steps',
  onTabChange,
}: WorkflowBuilderHeaderProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  // Load workflow title from localStorage
  const getStoredWorkflowTitle = (id: string | null | undefined): string | null => {
    if (!id) return null
    try {
      const stored = localStorage.getItem(`workflow_title_${id}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }
  
  // Initialize title: priority: stored title > prop title > functionName > default
  const getInitialTitle = () => {
    if (workflowId) {
      const storedTitle = getStoredWorkflowTitle(workflowId)
      return storedTitle || workflowTitle || functionName || 'Untitled Workflow'
    }
    return workflowTitle || functionName || 'Untitled Workflow'
  }
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(getInitialTitle())
  
  // Update editedTitle when workflowTitle or workflowId changes
  useEffect(() => {
    const newTitle = getInitialTitle()
    setEditedTitle(newTitle)
  }, [workflowId, workflowTitle, functionName])
  
  // Save workflow title to localStorage
  const saveWorkflowTitle = (title: string, id: string | null | undefined) => {
    if (!id) return
    try {
      localStorage.setItem(`workflow_title_${id}`, JSON.stringify(title))
    } catch (error) {
      console.error('Failed to save workflow title to localStorage:', error)
    }
  }
  
  // Navigation tabs
  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'steps', label: 'Steps', icon: List },
    { id: 'people', label: 'People', icon: UserCircle },
    { id: 'preview', label: 'Preview', icon: Search },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'log', label: 'Log', icon: FileText },
  ]

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false)
      }
    }

    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSidebar, setShowSidebar])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showSourceDropdown && !target.closest('[data-source-dropdown]')) {
        setShowSourceDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSourceDropdown, setShowSourceDropdown])

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Row 1: Title and Status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* Left side: Back button + Title + Edit */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false)
                // Save to localStorage and notify parent
                if (editedTitle.trim()) {
                  if (workflowId) {
                    saveWorkflowTitle(editedTitle.trim(), workflowId)
                  }
                  if (onWorkflowTitleChange) {
                    onWorkflowTitleChange(editedTitle.trim())
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false)
                  // Save to localStorage and notify parent
                  if (editedTitle.trim()) {
                    if (workflowId) {
                      saveWorkflowTitle(editedTitle.trim(), workflowId)
                    }
                    if (onWorkflowTitleChange) {
                      onWorkflowTitleChange(editedTitle.trim())
                    }
                  }
                }
                if (e.key === 'Escape') {
                  setEditedTitle(getInitialTitle())
                  setIsEditingTitle(false)
                }
              }}
              className="text-lg font-semibold text-gray-900 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <>
              <h1 className="text-lg font-semibold text-gray-900">
                {editedTitle}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Edit title"
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </button>
            </>
          )}
        </div>
        
        {/* Right side: Email limit + Active toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Email limit:</span>
            <span className="font-medium">{emailLimit.used} / {emailLimit.total}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active</span>
            <button
              onClick={() => onActiveToggle && onActiveToggle(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Row 2: Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-gray-100 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isTabActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                // Settings tab opens sidebar instead of changing tab
                if (tab.id === 'settings') {
                  setShowSidebar(!showSidebar)
                } else {
                  onTabChange && onTabChange(tab.id)
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                isTabActive || (tab.id === 'settings' && showSidebar)
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Row 3: Action Tools (existing functionality) */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
        <div className="flex items-center space-x-2 flex-1">
        {/* Workflow Source Switcher - Temporarily commented out */}
        {/* {!isCampaignMode && (
          <div className="relative" data-source-dropdown>
            <button
              onClick={() => setShowSourceDropdown(!showSourceDropdown)}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-xs"
            >
              {workflowSource === 'my' && (
                <>
                  <User className="h-3 w-3 text-blue-500" />
                  <span>My Workflow</span>
                </>
              )}
              {workflowSource === 'company' && (
                <>
                  <Building2 className="h-3 w-3 text-green-500" />
                  <span>Company Workflows</span>
                </>
              )}
              {workflowSource === 'colleague' && selectedColleague && (
                <>
                  <Users className="h-3 w-3 text-purple-500" />
                  <span>{selectedColleague.first_name} {selectedColleague.last_name}</span>
                </>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSourceDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-50">
                <button
                  onClick={() => {
                    setWorkflowSource('my')
                    setSelectedColleague(null)
                    setShowSourceDropdown(false)
                  }}
                  className={`w-full flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 text-left ${
                    workflowSource === 'my' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <User className="h-3 w-3 text-blue-500" />
                  <div>
                    <div className="text-xs font-medium">My Workflow</div>
                    <div className="text-xs text-gray-500">Edit your own workflow</div>
                  </div>
                </button>

                {colleagues.length > 0 && (
                  <div className="border-t border-gray-100 my-1">
                    <div className="px-3 py-1.5 text-xs text-gray-500 font-medium">Colleagues' Workflows</div>
                  </div>
                )}

                {colleagues.map((colleague) => (
                  <button
                    key={colleague.id}
                    onClick={() => {
                      setWorkflowSource('colleague')
                      setSelectedColleague(colleague)
                      setShowSourceDropdown(false)
                    }}
                    className={`w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 text-left ${
                      workflowSource === 'colleague' && selectedColleague?.id === colleague.id
                        ? 'bg-purple-50 text-purple-700'
                        : ''
                    }`}
                  >
                    {colleague.avatar_url ? (
                      <img src={colleague.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                        {colleague.first_name?.[0]}{colleague.last_name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{colleague.first_name} {colleague.last_name}</div>
                      <div className="text-xs text-gray-500 truncate">{colleague.email}</div>
                    </div>
                    <Eye className="h-2.5 w-2.5 text-gray-400" />
                  </button>
                ))}

                {colleagues.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">
                    {user?.company_id
                      ? 'No colleagues have workflows for this function'
                      : 'Join a company to see colleague workflows'}
                  </div>
                )}
              </div>
            )}
          </div>
        )} */}

        {isCampaignMode && (
          <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
            Campaign Mode - Chỉnh sửa Script
          </span>
        )}
        {isViewOnly && !isCampaignMode && (
          <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Eye className="h-2.5 w-2.5" />
            View Only
          </span>
        )}

        {/* Action Buttons - Moved to left side */}
        {!isViewOnly && (
          <div className="flex items-center space-x-1 ml-4">
            {/* Temporarily commented out */}
            {/* <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                historyIndex <= 0
                  ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Undo className="h-4 w-4" />
              <span className="text-sm">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                historyIndex >= history.length - 1
                  ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Redo className="h-4 w-4" />
              <span className="text-sm">Redo</span>
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              onClick={() => {
                setConnections([])
                saveToHistory(nodes, [])
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Clear</span>
            </button>
            <button
              onClick={handleDrawModeToggle}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                isDrawMode
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Link className="h-4 w-4" />
              <span className="text-sm">{isDrawMode ? 'Cancel' : 'Draw'}</span>
            </button> */}
            <div className="flex items-center gap-1 px-2 py-1.5">
              <span className="text-xs text-gray-500 mr-1">Label:</span>
              <button
                onClick={() => setConnectionLabel('yes')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  connectionLabel === 'yes'
                    ? 'bg-green-50 text-green-700 border border-green-300'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setConnectionLabel('no')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  connectionLabel === 'no'
                    ? 'bg-red-50 text-red-700 border border-red-300'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Status and More Options */}
      <div className="flex items-center space-x-1">
        {functionName && (
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            {isLoading && (
              <span className="text-sm text-gray-600 flex items-center gap-1.5">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </span>
            )}
            {isSaving && !isLoading && (
              <span className="text-sm text-gray-600 flex items-center gap-1.5">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {!isLoading && !isSaving && (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>Saved</span>
              </span>
            )}
          </div>
        )}
        {selectedNode && !isViewOnly && (
          <button
            onClick={() => deleteNode(selectedNode)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">Delete</span>
          </button>
        )}
        {/* More Options Button - Toggle Sidebar - Temporarily commented out */}
        {/* <div className="relative" ref={sidebarRef}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {showSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="text-sm">More</span>
          </button>
        </div> */}

        {/* Sidebar Dropdown Menu */}
        <div className="relative" ref={sidebarRef}>
          {/* Sidebar Dropdown Menu */}
          {showSidebar && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow Library</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 text-sm text-gray-600 border-b border-gray-200">
                Choose from pre-built workflows or create your own
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Pre-built Workflows</h3>
                  {preBuiltWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white h-32 flex flex-col"
                      onClick={() => {
                        loadWorkflow(workflow.id)
                        setShowSidebar(false)
                      }}
                    >
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{workflow.name}</h4>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">{workflow.description}</p>

                      <div className="flex items-center space-x-1 mb-2">
                        {workflow.nodes.map((node, index) => (
                          <div key={node.id} className="flex items-center">
                            <div className={`w-6 h-6 ${nodeTypes.find(nt => nt.id === node.type)?.color} rounded flex items-center justify-center text-white text-xs`}>
                              {nodeTypes.find(nt => nt.id === node.type)?.icon}
                            </div>
                            {index < workflow.nodes.length - 1 && (
                              <div className="w-2 h-0.5 bg-gray-300 mx-1"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500">5 nodes • 4 connections</span>
                        <button className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                          Load
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Node Elements */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Node Elements</h3>
                  <div className="text-xs text-gray-500 mb-3">
                    Drag and drop nodes onto the canvas
                  </div>
                  {nodeTypes.map((nodeType) => (
                    <div
                      key={nodeType.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedNodeType(nodeType.id)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => setDraggedNodeType(null)}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-move bg-white h-20 flex items-center"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className={`w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                          {nodeType.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">{nodeType.name}</h4>
                          <p className="text-xs text-gray-600 truncate">{nodeType.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
