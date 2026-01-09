import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { workflowsAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import WorkflowBuilderHeader from '../components/WorkflowBuilderHeader'
import { 
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Workflow,
  Mail,
  MessageCircle,
  Send,
  PhoneCall,
  Users,
  Clock,
  Eye,
  XCircle,
  MoreVertical,
  X,
} from 'lucide-react'

// Workflow source types
type WorkflowSource = 'my' | 'company' | 'colleague'

interface Colleague {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

interface Node {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    max_no_response_time?: number // Maximum customer no-response time (seconds)
    actionTime?: string // "immediately" | "after X days" | "after X minutes" | "after X seconds"
    actionDelay?: number // Delay value
    actionDelayUnit?: 'immediately' | 'seconds' | 'minutes' | 'hours' | 'days'
    [key: string]: any
  }
  title: string
  description?: string
  isDecision?: boolean // For decision nodes like "Has Social Media Profile URL"
}

interface Connection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: 'yes' | 'no' // Yes (green) or No (red) label
}

const nodeTypes = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'bg-green-500',
    description: 'WhatsApp messaging & automation'
  },
  {
    id: 'ai-call',
    name: 'AI Call',
    icon: <PhoneCall className="h-4 w-4" />,
    color: 'bg-orange-500',
    description: 'AI-powered voice calls'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-600',
    description: 'LinkedIn automation & messaging'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-blue-500',
    description: 'Telegram bot & messaging'
  },
  {
    id: 'email',
    name: 'Email',
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-purple-500',
    description: 'Send or receive email'
  }
]

// Pre-built workflows
const preBuiltWorkflows = [
  {
    id: 'workflow-1',
    name: 'Workflow 1: WhatsApp → AI Call → LinkedIn → Telegram → Email',
    description: 'Start with WhatsApp, then AI Call, LinkedIn, Telegram, and finish with Email',
    nodes: [
      { id: 'whatsapp_1', type: 'whatsapp', position: { x: 400, y: 50 }, data: {}, title: 'WhatsApp' },
      { id: 'ai-call_1', type: 'ai-call', position: { x: 400, y: 200 }, data: {}, title: 'AI Call' },
      { id: 'linkedin_1', type: 'linkedin', position: { x: 400, y: 350 }, data: {}, title: 'LinkedIn' },
      { id: 'telegram_1', type: 'telegram', position: { x: 400, y: 500 }, data: {}, title: 'Telegram' },
      { id: 'email_1', type: 'email', position: { x: 400, y: 650 }, data: {}, title: 'Email' }
    ],
    connections: [
      { id: 'conn1', source: 'whatsapp_1', target: 'ai-call_1', label: 'yes' },
      { id: 'conn2', source: 'ai-call_1', target: 'linkedin_1', label: 'yes' },
      { id: 'conn3', source: 'linkedin_1', target: 'telegram_1', label: 'yes' },
      { id: 'conn4', source: 'telegram_1', target: 'email_1', label: 'yes' }
    ]
  },
  {
    id: 'workflow-2',
    name: 'Workflow 2: AI Call → LinkedIn → WhatsApp → Email → Telegram',
    description: 'Start with AI Call, then LinkedIn, WhatsApp, Email, and finish with Telegram',
    nodes: [
      { id: 'ai-call_2', type: 'ai-call', position: { x: 400, y: 50 }, data: {}, title: 'AI Call' },
      { id: 'linkedin_2', type: 'linkedin', position: { x: 400, y: 200 }, data: {}, title: 'LinkedIn' },
      { id: 'whatsapp_2', type: 'whatsapp', position: { x: 400, y: 350 }, data: {}, title: 'WhatsApp' },
      { id: 'email_2', type: 'email', position: { x: 400, y: 500 }, data: {}, title: 'Email' },
      { id: 'telegram_2', type: 'telegram', position: { x: 400, y: 650 }, data: {}, title: 'Telegram' }
    ],
    connections: [
      { id: 'conn1', source: 'ai-call_2', target: 'linkedin_2', label: 'yes' },
      { id: 'conn2', source: 'linkedin_2', target: 'whatsapp_2', label: 'yes' },
      { id: 'conn3', source: 'whatsapp_2', target: 'email_2', label: 'yes' },
      { id: 'conn4', source: 'email_2', target: 'telegram_2', label: 'yes' }
    ]
  },
  {
    id: 'workflow-3',
    name: 'Workflow 3: LinkedIn → Email → AI Call → Telegram → WhatsApp',
    description: 'Start with LinkedIn, then Email, AI Call, Telegram, and finish with WhatsApp',
    nodes: [
      { id: 'linkedin_3', type: 'linkedin', position: { x: 400, y: 50 }, data: {}, title: 'LinkedIn' },
      { id: 'email_3', type: 'email', position: { x: 400, y: 200 }, data: {}, title: 'Email' },
      { id: 'ai-call_3', type: 'ai-call', position: { x: 400, y: 350 }, data: {}, title: 'AI Call' },
      { id: 'telegram_3', type: 'telegram', position: { x: 400, y: 500 }, data: {}, title: 'Telegram' },
      { id: 'whatsapp_3', type: 'whatsapp', position: { x: 400, y: 650 }, data: {}, title: 'WhatsApp' }
    ],
    connections: [
      { id: 'conn1', source: 'linkedin_3', target: 'email_3', label: 'yes' },
      { id: 'conn2', source: 'email_3', target: 'ai-call_3', label: 'yes' },
      { id: 'conn3', source: 'ai-call_3', target: 'telegram_3', label: 'yes' },
      { id: 'conn4', source: 'telegram_3', target: 'whatsapp_3', label: 'yes' }
    ]
  },
  {
    id: 'workflow-4',
    name: 'Workflow 4: Email → WhatsApp → LinkedIn → AI Call → Telegram',
    description: 'Start with Email, then WhatsApp, LinkedIn, AI Call, and finish with Telegram',
    nodes: [
      { id: 'email_4', type: 'email', position: { x: 400, y: 50 }, data: {}, title: 'Email' },
      { id: 'whatsapp_4', type: 'whatsapp', position: { x: 400, y: 200 }, data: {}, title: 'WhatsApp' },
      { id: 'linkedin_4', type: 'linkedin', position: { x: 400, y: 350 }, data: {}, title: 'LinkedIn' },
      { id: 'ai-call_4', type: 'ai-call', position: { x: 400, y: 500 }, data: {}, title: 'AI Call' },
      { id: 'telegram_4', type: 'telegram', position: { x: 400, y: 650 }, data: {}, title: 'Telegram' }
    ],
    connections: [
      { id: 'conn1', source: 'email_4', target: 'whatsapp_4', label: 'yes' },
      { id: 'conn2', source: 'whatsapp_4', target: 'linkedin_4', label: 'yes' },
      { id: 'conn3', source: 'linkedin_4', target: 'ai-call_4', label: 'yes' },
      { id: 'conn4', source: 'ai-call_4', target: 'telegram_4', label: 'yes' }
    ]
  },
  {
    id: 'workflow-5',
    name: 'Workflow 5: Telegram → AI Call → Email → WhatsApp → LinkedIn',
    description: 'Start with Telegram, then AI Call, Email, WhatsApp, and finish with LinkedIn',
    nodes: [
      { id: 'telegram_5', type: 'telegram', position: { x: 400, y: 50 }, data: {}, title: 'Telegram' },
      { id: 'ai-call_5', type: 'ai-call', position: { x: 400, y: 200 }, data: {}, title: 'AI Call' },
      { id: 'email_5', type: 'email', position: { x: 400, y: 350 }, data: {}, title: 'Email' },
      { id: 'whatsapp_5', type: 'whatsapp', position: { x: 400, y: 500 }, data: {}, title: 'WhatsApp' },
      { id: 'linkedin_5', type: 'linkedin', position: { x: 400, y: 650 }, data: {}, title: 'LinkedIn' }
    ],
    connections: [
      { id: 'conn1', source: 'telegram_5', target: 'ai-call_5', label: 'yes' },
      { id: 'conn2', source: 'ai-call_5', target: 'email_5', label: 'yes' },
      { id: 'conn3', source: 'email_5', target: 'whatsapp_5', label: 'yes' },
      { id: 'conn4', source: 'whatsapp_5', target: 'linkedin_5', label: 'yes' }
    ]
  }
]

// History state interface
interface HistoryState {
  nodes: Node[]
  connections: Connection[]
}

export default function WorkflowBuilder() {
  const [searchParams] = useSearchParams()
  const functionName = searchParams.get('function') || null
  const workflowId = searchParams.get('workflowId') || null
  const campaignId = searchParams.get('campaign_id') || null
  const isCampaignMode = !!campaignId // Chỉ cho phép edit script, không edit structure
  const { user } = useAuth()
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1 / 1.75) // Zoom nhỏ lại 1.75 lần (khoảng 0.57)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [drawStartNode, setDrawStartNode] = useState<string | null>(null)
  const [connectionLabel, setConnectionLabel] = useState<'yes' | 'no'>('yes') // Connection label mặc định
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingScript, setIsSavingScript] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [nodeScripts, setNodeScripts] = useState<Record<string, string>>({})
  
  // Workflow source switcher states
  const [workflowSource, setWorkflowSource] = useState<WorkflowSource>('my')
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [workflowOwner, setWorkflowOwner] = useState<Colleague | null>(null)
  const [showSidebar, setShowSidebar] = useState(false) // Toggle sidebar menu
  const [workflowTitle, setWorkflowTitle] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [activeTab, setActiveTab] = useState('steps')
  
  // Popup state for adding node between connections
  const [showNodeTypePopup, setShowNodeTypePopup] = useState<{
    connectionId: string
    canvasPosition: { x: number; y: number } // Position in canvas coordinates
  } | null>(null)
  const [hoveredPlusButton, setHoveredPlusButton] = useState<string | null>(null)
  
  // Determine if user can edit (only edit own workflows, not company/colleague)
  const isViewOnly = workflowSource !== 'my' || isCampaignMode
  
  // Drag states - đơn giản và rõ ràng
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null) // For drag from sidebar
  const mouseMovedRef = useRef(false)
  
  // Panning states
  const [isPanning, setIsPanning] = useState(false)
  const [panStartPos, setPanStartPos] = useState<{ x: number; y: number } | null>(null)
  const [spacePressed, setSpacePressed] = useState(false)
  
  // Undo/Redo system
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isUndoRedoRef = useRef(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)

  // Save state to history
  const saveToHistory = useCallback((newNodes: Node[], newConnections: Connection[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ nodes: [...newNodes], connections: [...newConnections] })
      // Giới hạn history tối đa 50 bước
      if (newHistory.length > 50) {
        newHistory.shift()
        return newHistory
      }
      return newHistory
    })
    setHistoryIndex(prev => {
      const newIndex = prev + 1
      return newIndex >= 50 ? newIndex : newIndex
    })
  }, [historyIndex])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      const prevState = history[historyIndex - 1]
      setNodes([...prevState.nodes])
      setConnections([...prevState.connections])
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      const nextState = history[historyIndex + 1]
      setNodes([...nextState.nodes])
      setConnections([...nextState.connections])
      setHistoryIndex(prev => prev + 1)
    }
  }, [history, historyIndex])

  // Update node position
  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => {
      const newNodes = prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
      )
      // Chỉ save history khi kết thúc drag (trong mouseUp)
      return newNodes
    })
  }, [])

  // Load colleagues who have workflows for this function
  const loadColleagues = useCallback(async () => {
    if (!functionName) return
    
    try {
      console.log('🔄 Loading colleagues for function:', functionName)
      const response = await workflowsAPI.getColleaguesWithWorkflow(functionName)
      console.log('👥 Colleagues loaded:', response.data)
      setColleagues(response.data || [])
    } catch (error: any) {
      // 400 means user doesn't belong to a company - that's OK
      if (error.response?.status !== 400) {
        console.error('Error loading colleagues:', error)
      }
      setColleagues([])
    }
  }, [functionName])

  // Auto-arrange nodes vertically based on connections
  const arrangeNodesVertically = useCallback((nodes: Node[], connections: Connection[]): Node[] => {
    if (nodes.length === 0) return nodes
    
    // Build adjacency map
    const adjacencyMap = new Map<string, string[]>()
    const inDegree = new Map<string, number>()
    
    // Initialize
    nodes.forEach(node => {
      adjacencyMap.set(node.id, [])
      inDegree.set(node.id, 0)
    })
    
    // Build graph
    connections.forEach(conn => {
      const source = conn.source
      const target = conn.target
      if (adjacencyMap.has(source) && adjacencyMap.has(target)) {
        adjacencyMap.get(source)!.push(target)
        inDegree.set(target, (inDegree.get(target) || 0) + 1)
      }
    })
    
    // Topological sort
    const queue: string[] = []
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId)
      }
    })
    
    const sortedNodeIds: string[] = []
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      sortedNodeIds.push(nodeId)
      
      const neighbors = adjacencyMap.get(nodeId) || []
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1
        inDegree.set(neighborId, newDegree)
        if (newDegree === 0) {
          queue.push(neighborId)
        }
      })
    }
    
    // Add any remaining nodes (not in connections)
    nodes.forEach(node => {
      if (!sortedNodeIds.includes(node.id)) {
        sortedNodeIds.push(node.id)
      }
    })
    
    // Arrange nodes vertically
    const CENTER_X = 400
    const VERTICAL_SPACING = 400 // Tăng khoảng cách giữa các nodes để có nhiều không gian hơn và đường kết nối dài hơn
    const START_Y = 50
    
    const arrangedNodes = sortedNodeIds.map((nodeId, index) => {
      const node = nodes.find(n => n.id === nodeId)!
      return {
        ...node,
        position: {
          x: CENTER_X,
          y: START_Y + (index * VERTICAL_SPACING)
        }
      }
    })
    
    return arrangedNodes
  }, [])

  // Load workflow from database based on source
  const loadWorkflowFromDB = useCallback(async () => {
    // Priority: workflowId > functionName
    if (!workflowId && !functionName) return
    
    try {
      setIsLoading(true)
      setWorkflowOwner(null)
      
      let response
      
      // Load by workflow ID if provided (highest priority)
      if (workflowId) {
        console.log('Loading workflow by ID:', workflowId)
        response = await workflowsAPI.getWorkflowById(workflowId, campaignId || undefined)
        console.log('Workflow response:', response?.data)
      } else if (workflowSource === 'my') {
        response = await workflowsAPI.getWorkflow(functionName!)
      } else if (workflowSource === 'colleague' && selectedColleague) {
        response = await workflowsAPI.getColleagueWorkflow(selectedColleague.id, functionName!)
        setWorkflowOwner(selectedColleague)
      } else {
        // For company view, we'll show a list instead
        setNodes([])
        setConnections([])
        return
      }
      
      if (response?.data) {
        const workflow = response.data
        const loadedNodes = workflow.nodes || []
        console.log('Loaded nodes:', loadedNodes)
        console.log('Loaded connections:', workflow.connections || [])
        
        // Migrate old strokeType to label if needed
        const migratedConnections = (workflow.connections || []).map((conn: any) => {
          if (conn.strokeType && !conn.label) {
            // Migrate: solid -> yes, dashed -> no
            return {
              ...conn,
              label: conn.strokeType === 'solid' ? 'yes' : 'no'
            }
          }
          return conn
        })
        
        // Auto-arrange nodes vertically
        const arrangedNodes = arrangeNodesVertically(loadedNodes, migratedConnections)
        
        setNodes(arrangedNodes)
        setConnections(migratedConnections)
        
        // Center nodes trên màn hình khi load (sau khi DOM đã render)
        if (arrangedNodes.length > 0) {
          setTimeout(() => {
            if (canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect()
              const viewportWidth = rect.width
              const viewportHeight = rect.height
              
              // Tính toán bounding box của nodes
              const nodePositions = arrangedNodes.map(n => n.position)
              const minX = Math.min(...nodePositions.map(p => p.x))
              const maxX = Math.max(...nodePositions.map(p => p.x + 312)) // 312 là node width
              const minY = Math.min(...nodePositions.map(p => p.y))
              const maxY = Math.max(...nodePositions.map(p => p.y + 120)) // 120 là node height
              
              const nodesWidth = maxX - minX
              const nodesHeight = maxY - minY
              const nodesCenterX = minX + nodesWidth / 2
              const nodesCenterY = minY + nodesHeight / 2
              
              // Tính pan để center nodes
              const currentZoom = zoom
              const targetCenterX = viewportWidth / 2
              const targetCenterY = viewportHeight / 2
              
              const panX = targetCenterX - (nodesCenterX * currentZoom)
              const panY = targetCenterY - (nodesCenterY * currentZoom)
              
              setPan({ x: panX, y: panY })
            }
          }, 100)
        }
        
        // Load campaign scripts from node.data.scripts if in campaign mode
        if (campaignId && (functionName || workflowId) && workflowSource === 'my') {
          const scripts: Record<string, string> = {}
          arrangedNodes.forEach((node: Node) => {
            // Get script for this campaign from node.data.scripts array
            const scriptsArray = node.data?.scripts || []
            const campaignScript = scriptsArray.find((s: any) => s.campaign_id === campaignId)
            if (campaignScript) {
              scripts[node.id] = campaignScript.script || ''
            }
          })
          setNodeScripts(scripts)
        }
        
        // Initialize history with loaded workflow
        setHistory([{ nodes: arrangedNodes, connections: migratedConnections }])
        setHistoryIndex(0)
      } else {
        console.warn('No workflow data in response')
        setNodes([])
        setConnections([])
      }
    } catch (error: any) {
      // If workflow doesn't exist, start with empty state
      console.error('Error loading workflow:', error)
      if (error.response?.status !== 404) {
        console.error('Error details:', error.response?.data || error.message)
      }
      setNodes([])
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [workflowId, functionName, workflowSource, selectedColleague, campaignId])

  // Save workflow to database (with debounce)
  const saveWorkflowToDB = useCallback(async (nodesToSave: Node[], connectionsToSave: Connection[]) => {
    if ((!workflowId && !functionName) || isViewOnly) return // Don't save in view-only mode
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        if (workflowId) {
          // Save by workflow ID
          await workflowsAPI.updateWorkflowById(workflowId, {
            nodes: nodesToSave,
            connections: connectionsToSave
          })
        } else if (functionName) {
          // Fallback to function-based save
          await workflowsAPI.updateWorkflow(functionName, {
            nodes: nodesToSave,
            connections: connectionsToSave
          })
        }
      } catch (error) {
        console.error('Error saving workflow:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }, [workflowId, functionName, isViewOnly])

  // Save node script for campaign - save directly to node.data.scripts array
  const saveNodeScript = useCallback(async (nodeId: string, script: string) => {
    if (!campaignId || !functionName) return
    
    try {
      setIsSavingScript(true)
      
      // Update node with script in data.scripts array
      setNodes(prev => prev.map(node => {
        if (node.id !== nodeId) return node
        
        const scripts = node.data?.scripts || []
        // Find if script for this campaign already exists
        const scriptIndex = scripts.findIndex((s: any) => s.campaign_id === campaignId)
        
        let newScripts: Array<{script: string, campaign_id: string}>
        if (scriptIndex >= 0) {
          // Update existing script
          newScripts = [...scripts]
          newScripts[scriptIndex] = { script, campaign_id: campaignId }
        } else {
          // Add new script
          newScripts = [...scripts, { script, campaign_id: campaignId }]
        }
        
        // Save to database
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            scripts: newScripts
          }
        }
        
        // Update workflow in database
        if (workflowId) {
          workflowsAPI.updateWorkflowById(workflowId, {
            nodes: prev.map(n => n.id === nodeId ? updatedNode : n),
            connections: connections
          }).catch(err => console.error('Error saving script to workflow:', err))
        } else if (functionName) {
          workflowsAPI.updateWorkflow(functionName, {
            nodes: prev.map(n => n.id === nodeId ? updatedNode : n),
            connections: connections
          }).catch(err => console.error('Error saving script to workflow:', err))
        }
        
        return updatedNode
      }))
      
      setNodeScripts(prev => ({ ...prev, [nodeId]: script }))
    } catch (error) {
      console.error('Error saving node script:', error)
    } finally {
      setIsSavingScript(false)
    }
  }, [campaignId, functionName, connections])

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    if (isViewOnly) return // Don't allow deleting nodes in view-only mode
    setNodes(prev => {
      const newNodes = prev.filter(node => node.id !== nodeId)
      setConnections(prevConn => {
        const newConnections = prevConn.filter(conn => conn.source !== nodeId && conn.target !== nodeId)
        saveToHistory(newNodes, newConnections)
        return newConnections
      })
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
      return newNodes
    })
  }, [selectedNode, saveToHistory, isViewOnly])

  // Add node
  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    if (isViewOnly) return // Don't allow adding nodes in view-only mode
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position,
      data: {},
      title: nodeTypes.find(nt => nt.id === type)?.name || type
    }
    setNodes(prev => {
      const newNodes = [...prev, newNode]
      saveToHistory(newNodes, connections)
      return newNodes
    })
    return newNode
  }, [connections, saveToHistory, isViewOnly])

  // Insert node between two connected nodes
  const insertNodeBetweenConnection = useCallback((connectionId: string, nodeType: string) => {
    if (isViewOnly) return
    
    const connection = connections.find(c => c.id === connectionId)
    if (!connection) return
    
    const sourceNode = nodes.find(n => n.id === connection.source)
    const targetNode = nodes.find(n => n.id === connection.target)
    if (!sourceNode || !targetNode) return
    
    // Calculate position between source and target (middle point)
    const midX = (sourceNode.position.x + targetNode.position.x) / 2
    const midY = (sourceNode.position.y + targetNode.position.y) / 2
    
    // Create new node
    const newNodeId = `${Date.now()}`
    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: { x: midX, y: midY },
      data: {},
      title: nodeTypes.find(nt => nt.id === nodeType)?.name || nodeType
    }
    
    // Add new node to nodes
    const newNodes = [...nodes, newNode]
    
    // Remove old connection
    const newConnections = connections.filter(c => c.id !== connectionId)
    
    // Add two new connections: source -> newNode -> target
    const newConnection1: Connection = {
      id: `conn_${Date.now()}_1`,
      source: connection.source,
      target: newNodeId,
      sourceHandle: 'output',
      targetHandle: 'input',
      label: connection.label || 'yes'
    }
    
    const newConnection2: Connection = {
      id: `conn_${Date.now()}_2`,
      source: newNodeId,
      target: connection.target,
      sourceHandle: 'output',
      targetHandle: 'input',
      label: connection.label || 'yes'
    }
    
    setNodes(newNodes)
    setConnections([...newConnections, newConnection1, newConnection2])
    saveToHistory(newNodes, [...newConnections, newConnection1, newConnection2])
    
    // Close popup
    setShowNodeTypePopup(null)
  }, [nodes, connections, setConnections, saveToHistory, isViewOnly, nodeTypes])

  // Load workflow
  const loadWorkflow = (workflowId: string) => {
    const workflow = preBuiltWorkflows.find(w => w.id === workflowId)
    if (workflow) {
      const newNodes = [...workflow.nodes]
      // Cast connections to proper type
      const newConnections: Connection[] = workflow.connections.map(conn => ({
        ...conn,
        label: (conn.label === 'yes' || conn.label === 'no') ? conn.label : 'yes' as 'yes' | 'no'
      }))
      // Auto-arrange nodes vertically
      const arrangedNodes = arrangeNodesVertically(newNodes, newConnections)
      
      // Center nodes trên màn hình khi load
      setTimeout(() => {
        if (arrangedNodes.length > 0 && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect()
          const viewportWidth = rect.width
          const viewportHeight = rect.height
          
          // Tính toán bounding box của nodes
          const nodePositions = arrangedNodes.map(n => n.position)
          const minX = Math.min(...nodePositions.map(p => p.x))
          const maxX = Math.max(...nodePositions.map(p => p.x + 312))
          const minY = Math.min(...nodePositions.map(p => p.y))
          const maxY = Math.max(...nodePositions.map(p => p.y + 120))
          
          const nodesWidth = maxX - minX
          const nodesHeight = maxY - minY
          const nodesCenterX = minX + nodesWidth / 2
          const nodesCenterY = minY + nodesHeight / 2
          
          // Tính pan để center nodes
          const currentZoom = zoom
          const targetCenterX = viewportWidth / 2
          const targetCenterY = viewportHeight / 2
          
          const panX = targetCenterX - (nodesCenterX * currentZoom)
          const panY = targetCenterY - (nodesCenterY * currentZoom)
          
          setPan({ x: panX, y: panY })
        }
      }, 100)
      
      setNodes(arrangedNodes)
      setConnections(newConnections)
      setSelectedNode(null)
      saveToHistory(arrangedNodes, newConnections)
    }
  }

  // Handle node mouse down - bắt đầu drag node trên canvas
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // Không drag nếu click vào button hoặc connection point
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[class*="rounded-full"]')) {
      return
    }
    
    e.stopPropagation()
    e.preventDefault()
    
    const node = nodes.find(n => n.id === nodeId)
    if (!node || !canvasRef.current) return
    
    setSelectedNode(nodeId)
    setDraggingNodeId(nodeId)
    
        const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    // Tính toán offset từ vị trí chuột đến góc trên trái của node
    const nodeX = (node.position.x * zoom) + pan.x
    const nodeY = (node.position.y * zoom) + pan.y
    const offsetX = (mouseX - rect.left - nodeX) / zoom
    const offsetY = (mouseY - rect.top - nodeY) / zoom
    
    setDragOffset({ x: offsetX, y: offsetY })
    setDragStartPos({ x: mouseX, y: mouseY })
  }

  // Handle canvas mouse move
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    // Ưu tiên panning trước
    if (isPanning && panStartPos) {
      const deltaX = mouseX - panStartPos.x
      const deltaY = mouseY - panStartPos.y
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setPanStartPos({ x: mouseX, y: mouseY })
      return
    }
    
    // Nếu đang drag node
    if (draggingNodeId && dragOffset && dragStartPos) {
      // Check if mouse moved significantly
      const deltaX = Math.abs(mouseX - dragStartPos.x)
      const deltaY = Math.abs(mouseY - dragStartPos.y)
      if (deltaX > 3 || deltaY > 3) {
        mouseMovedRef.current = true
      }
      
      // Tính toán vị trí mới của node (không giới hạn)
      const newX = (mouseX - rect.left - pan.x) / zoom - dragOffset.x
      const newY = (mouseY - rect.top - pan.y) / zoom - dragOffset.y
      
      updateNodePosition(draggingNodeId, { 
        x: newX, 
        y: newY 
      })
    }
    // Nếu đang kết nối
    else if (isConnecting && tempConnection) {
      const x = (mouseX - rect.left - pan.x) / zoom
      const y = (mouseY - rect.top - pan.y) / zoom
      setTempConnection({ x, y })
    }
  }

  // Handle canvas mouse down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Không pan nếu đang drag node
    if (draggingNodeId) return
    
    // Middle mouse button hoặc Space + Left click hoặc Right click để pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && spacePressed)) {
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      setPanStartPos({ x: e.clientX, y: e.clientY })
      return
    }
  }

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    // Kết thúc panning
    if (isPanning) {
      setIsPanning(false)
      setPanStartPos(null)
    }
    
    // Nếu đang drag node, save vào history khi kết thúc
    if (draggingNodeId && mouseMovedRef.current) {
      saveToHistory(nodes, connections)
    }
    
    // Reset drag state
    setDraggingNodeId(null)
    setDragStartPos(null)
    setDragOffset(null)
    mouseMovedRef.current = false
  }
  
  // Refs để lưu giá trị mới nhất của zoom và pan cho wheel handler
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  
  // Cập nhật refs khi zoom hoặc pan thay đổi
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])
  
  useEffect(() => {
    panRef.current = pan
  }, [pan])

  // Handle wheel zoom và pan - using native event listener to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      // Sử dụng refs để lấy giá trị mới nhất mà không cần re-register listener
      const currentZoom = zoomRef.current
      const currentPan = panRef.current
      
      // Ctrl + Wheel hoặc Cmd + Wheel để zoom
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        // Zoom point (vị trí chuột trên canvas trong không gian đã zoom)
        const zoomPointX = (mouseX - currentPan.x) / currentZoom
        const zoomPointY = (mouseY - currentPan.y) / currentZoom
        
        // Tính zoom mới
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = Math.max(0.1, Math.min(3, currentZoom * zoomDelta))
        
        // Điều chỉnh pan để zoom point giữ nguyên vị trí trên màn hình
        const newPanX = mouseX - zoomPointX * newZoom
        const newPanY = mouseY - zoomPointY * newZoom
        
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })
      }
      // Shift + Wheel = pan ngang
      else if (e.shiftKey) {
        setPan(prev => ({
          x: prev.x - e.deltaY * 0.5,
          y: prev.y
        }))
      }
      // Wheel thông thường = pan
      else {
        setPan(prev => ({
          x: prev.x - e.deltaX * 0.5,
          y: prev.y - e.deltaY * 0.5
        }))
      }
    }

    // Register wheel event with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, []) // Empty dependency array - chỉ register một lần

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedNode(null)
      setShowNodeTypePopup(null) // Close popup when clicking on canvas
      if (isConnecting) {
        setIsConnecting(false)
        setConnectionStart(null)
        setTempConnection(null)
      }
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNodeTypePopup && !(event.target as HTMLElement).closest('[data-node-popup]')) {
        setShowNodeTypePopup(null)
      }
    }

    if (showNodeTypePopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNodeTypePopup])

  // Handle canvas drop - nhận node từ sidebar
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedNodeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      addNode(draggedNodeType, { x, y })
    }
    setDraggedNodeType(null)
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Connection handlers
  const handleConnectionPointClick = (e: React.MouseEvent, nodeId: string, handle: 'input' | 'output') => {
    e.stopPropagation()
    
    if (!isConnecting) {
      setIsConnecting(true)
      setConnectionStart(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (node && canvasRef.current) {
        const nodeWidth = 208
        const nodeHeight = 100
        
        const nodeX = handle === 'output' 
          ? node.position.x + nodeWidth - 16 // Center of output connection point
          : node.position.x // Center of input connection point
        const nodeY = node.position.y + nodeHeight / 2 // Center Y
        setTempConnection({ 
          x: nodeX, 
          y: nodeY 
        })
      }
    } else {
      if (connectionStart && connectionStart !== nodeId) {
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          source: connectionStart,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: handle,
          label: connectionLabel // Lưu label đã chọn
        }
        setConnections(prev => {
          const newConnections = [...prev, newConnection]
          saveToHistory(nodes, newConnections)
          return newConnections
        })
      }
      
      setIsConnecting(false)
      setConnectionStart(null)
      setTempConnection(null)
    }
  }

  // Draw mode
  const handleDrawModeToggle = () => {
    setIsDrawMode(!isDrawMode)
    setDrawStartNode(null)
    setSelectedNode(null)
  }

  const handleNodeClickForDraw = (nodeId: string) => {
    if (!isDrawMode) return
    
    if (!drawStartNode) {
      setDrawStartNode(nodeId)
      setSelectedNode(nodeId)
    } else if (nodeId !== drawStartNode) {
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        source: drawStartNode,
        target: nodeId,
        sourceHandle: 'output',
        targetHandle: 'input',
        label: connectionLabel // Lưu label đã chọn
      }
      setConnections(prev => {
        const newConnections = [...prev, newConnection]
        saveToHistory(nodes, newConnections)
        return newConnections
      })
      
      setIsDrawMode(false)
      setDrawStartNode(null)
      setSelectedNode(null)
    }
  }

  // Load colleagues on mount or when functionName changes
  useEffect(() => {
    if (functionName) {
      loadColleagues()
    }
  }, [functionName, loadColleagues])

  // Load workflow from database on mount or when source/colleague changes
  useEffect(() => {
    if (workflowId || functionName) {
      loadWorkflowFromDB()
    }
  }, [workflowId, functionName, workflowSource, selectedColleague, loadWorkflowFromDB])

  // Auto-save workflow when nodes or connections change (skip on initial load)
  const isInitialLoadRef = useRef(true)
  useEffect(() => {
    if (functionName && !isLoading) {
      // Skip save on initial load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
        return
      }
      
      saveWorkflowToDB(nodes, connections)
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [nodes, connections, functionName, isLoading, saveWorkflowToDB])
  
  // Reset initial load flag when functionName or workflowId changes
  useEffect(() => {
    isInitialLoadRef.current = true
  }, [functionName, workflowId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space để pan - but not when typing in input/textarea
      if (e.key === ' ') {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return // Allow space in input fields
        }
        e.preventDefault()
        setSpacePressed(true)
        return
      }
      
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode)
        }
      }
      if (e.key === 'Escape') {
        setSelectedNode(null)
      setIsConnecting(false)
      setConnectionStart(null)
      setTempConnection(null)
        setIsDrawMode(false)
        setDrawStartNode(null)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setSpacePressed(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedNode, deleteNode, undo, redo])

  // Global mouse up để đảm bảo drag kết thúc
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingNodeId(null)
      setDragStartPos(null)
      setDragOffset(null)
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])


  // Calculate orthogonal path for connections - đường vuông góc như ô bàn cờ
  const getBezierPath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
  ): string => {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    
    // Luôn tạo đường vuông góc (orthogonal)
    // Nếu nodes thẳng hàng theo chiều dọc (dx rất nhỏ), tạo đường thẳng đứng
    if (Math.abs(dx) < 5) {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
    
    // Nếu nodes thẳng hàng theo chiều ngang (dy rất nhỏ), tạo đường thẳng ngang
    if (Math.abs(dy) < 5) {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
    
    // Tạo đường vuông góc: đi thẳng đứng trước, rồi đi ngang, rồi đi thẳng đứng
    // Điểm giữa theo chiều dọc
    const midY = sourceY + (dy / 2)
    
    // Path: Start -> Mid (vertical down) -> Target X (horizontal) -> Target (vertical)
    return `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`
  }

  // Helper functions
  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.id === type)
    return nodeType?.icon || <Workflow className="h-4 w-4" />
  }

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.id === type)
    return nodeType?.color || 'bg-gray-500'
  }


  return (
    <div className="h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <WorkflowBuilderHeader
        workflowSource={workflowSource}
        setWorkflowSource={setWorkflowSource}
        colleagues={colleagues}
        selectedColleague={selectedColleague}
        setSelectedColleague={setSelectedColleague}
        showSourceDropdown={showSourceDropdown}
        setShowSourceDropdown={setShowSourceDropdown}
        workflowOwner={workflowOwner}
        isCampaignMode={isCampaignMode}
        isViewOnly={isViewOnly}
        history={history}
        historyIndex={historyIndex}
        undo={undo}
        redo={redo}
        connectionLabel={connectionLabel}
        setConnectionLabel={setConnectionLabel}
        isDrawMode={isDrawMode}
        handleDrawModeToggle={handleDrawModeToggle}
        isLoading={isLoading}
        isSaving={isSaving}
        functionName={functionName}
        selectedNode={selectedNode}
        deleteNode={deleteNode}
        nodes={nodes}
        connections={connections}
        setConnections={setConnections}
        saveToHistory={saveToHistory}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        loadWorkflow={loadWorkflow}
        nodeTypes={nodeTypes}
        preBuiltWorkflows={preBuiltWorkflows}
        setDraggedNodeType={setDraggedNodeType}
        user={user}
        workflowTitle={workflowTitle || functionName || undefined}
        workflowId={workflowId}
        onWorkflowTitleChange={(title) => setWorkflowTitle(title)}
        emailLimit={{ used: 0, total: 100 }}
        isActive={isActive}
        onActiveToggle={setIsActive}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className={`canvas-bg w-full h-full bg-white relative ${
              isPanning ? 'cursor-grabbing' : spacePressed ? 'cursor-grab' : 'cursor-default'
            }`}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              backgroundImage: `radial-gradient(circle, #E5E7EB 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              backgroundColor: '#FAFAFA'
            }}
          >
            {/* Transform container - không giới hạn không gian */}
            <div
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: '10000px',
                height: '10000px',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {/* Render Nodes */}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute w-52 bg-white border border-gray-200 rounded-lg shadow-sm transition-all select-none ${
                    isDrawMode 
                      ? 'cursor-pointer border-yellow-400 shadow-yellow-400/20' 
                      : selectedNode === node.id 
                        ? 'border-blue-400 shadow-md shadow-blue-400/10 cursor-move' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-move'
                  } ${draggingNodeId === node.id ? 'z-10' : ''} ${
                    drawStartNode === node.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: '312px', // Chiều ngang node nhân 1.5 lần (208 * 1.5 = 312)
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Chỉ handle click nếu không phải drag (mouse không di chuyển)
                    if (!mouseMovedRef.current) {
                    if (isDrawMode) {
                      handleNodeClickForDraw(node.id)
                    } else {
                      setSelectedNode(node.id)
                      }
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    deleteNode(node.id)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteNode(node.id)
                  }}
                >
                  <div className="p-4">
                    {/* Timing text - Action immediately / Action after X */}
                    <div className="flex items-center mb-3">
                      <Clock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-600 font-semibold">
                        {(() => {
                          const delay = node.data?.actionDelay
                          const unit = node.data?.actionDelayUnit || 'immediately'
                          if (unit === 'immediately' || !delay) {
                            return 'Action immediately'
                          }
                          const unitText = delay === 1 
                            ? unit.slice(0, -1) // Remove 's' for singular
                            : unit
                          return `Action after ${delay} ${unitText}`
                        })()}
                      </span>
                    </div>
                    
                    {/* Main content - Icon and Title */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className={`w-8 h-8 ${getNodeColor(node.type)} rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-sm`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm block text-gray-900">{node.title}</span>
                      </div>
                    </div>
                      {/* Vertical ellipsis for options */}
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 z-10 relative flex-shrink-0"
                        title="Node options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Description */}
                    {node.description && (
                      <div className="pl-11">
                        <span className="text-xs text-gray-500 block">
                          {node.description}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Input Connection Point - Top center for vertical layout, sát node */}
                  <div 
                    className={`absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full cursor-pointer transition-all z-10 ${
                      isConnecting && connectionStart !== node.id 
                        ? 'bg-blue-500 border-2 border-blue-300 shadow-lg' 
                        : 'bg-white border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500 shadow-sm'
                    }`}
                    onClick={(e) => handleConnectionPointClick(e, node.id, 'input')}
                  />
                  
                  {/* Output Connection Point - Bottom center for vertical layout, sát node */}
                  <div 
                    className={`absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full cursor-pointer transition-all z-10 ${
                      isConnecting && connectionStart === node.id 
                        ? 'bg-green-500 border-2 border-green-300 shadow-lg' 
                        : 'bg-white border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500 shadow-sm'
                    }`}
                    onClick={(e) => handleConnectionPointClick(e, node.id, 'output')}
                  />
                </div>
              ))}

              {/* Render Connections */}
              {connections.map((connection) => {
                const sourceNode = nodes.find(n => n.id === connection.source)
                const targetNode = nodes.find(n => n.id === connection.target)
                
                if (!sourceNode || !targetNode) return null

                // Tính toán cho vertical layout
                // Node: width = 312px (208 * 1.5), height = ~120px (với padding)
                // Connection points: w-5 h-5 = 20px, positioned ở top/bottom center, sát node
                // Top (input): centerX = node.x + NODE_WIDTH/2, centerY = node.y (sát node)
                // Bottom (output): centerX = node.x + NODE_WIDTH/2, centerY = node.y + NODE_HEIGHT (sát node)
                const NODE_WIDTH = 312
                const NODE_HEIGHT = 120 // Approximate height with padding
                
                // Center X của nodes (vertical layout - nodes centered)
                const sourceCenterX = sourceNode.position.x + NODE_WIDTH / 2
                const targetCenterX = targetNode.position.x + NODE_WIDTH / 2
                
                // Connection points - top/bottom center, sát node hơn nữa (dính liền hoàn toàn)
                const outputCenterX = sourceCenterX
                const outputCenterY = sourceNode.position.y + NODE_HEIGHT // Sát node hoàn toàn
                const inputCenterX = targetCenterX
                const inputCenterY = targetNode.position.y // Sát node hoàn toàn
                
                // Path: từ output (bottom) của source node đến input (top) của target node
                const startX = outputCenterX
                const startY = outputCenterY
                const endX = inputCenterX
                const endY = inputCenterY

                // Sử dụng bezier curve
                const path = getBezierPath(startX, startY, endX, endY)
                
                // Xác định màu và label dựa trên connection.label
                const label = connection.label || 'yes'
                const isYes = label === 'yes'
                const strokeColor = isYes ? '#22C55E' : '#EF4444' // Green for yes, red for no
                const arrowColor = isYes ? '#16A34A' : '#DC2626' // Darker green/red for arrow
                const labelText = isYes ? 'Yes' : 'No'
                
                // Tính toán vị trí giữa đường kẻ để đặt label Yes/No
                // Label cần ở giữa đường kẻ (điểm giữa của toàn bộ path)
                const dx = endX - startX
                const dy = endY - startY
                
                let midX, midY
                if (Math.abs(dx) < 5) {
                  // Đường thẳng đứng - label ở giữa
                  midX = (startX + endX) / 2
                  midY = (startY + endY) / 2
                } else {
                  // Đường gấp khúc - label ở giữa đoạn ngang (điểm giữa của path)
                  midY = startY + (dy / 2) // Điểm giữa theo chiều dọc (nơi đoạn ngang)
                  midX = (startX + endX) / 2 // Điểm giữa đoạn ngang
                }

                return (
                  <svg
                    key={connection.id}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                    width="100%"
                    height="100%"
                  >
                    <defs>
                      <marker
                        id={`arrowhead-${connection.id}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                  >
                    <path
                          d="M0,0 L0,10 L10,5 z"
                          fill={arrowColor}
                          className="transition-all"
                        />
                      </marker>
                    </defs>
                    <path
                      d={path}
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray="8,4" // Tất cả đường nối là nét đứt
                      markerEnd={`url(#arrowhead-${connection.id})`}
                      className="transition-all duration-200"
                      style={{
                        filter: `drop-shadow(0 1px 2px ${isYes ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'})`
                      }}
                    />
                    {/* Label text - styled like Genesy.ai with white box and matching border */}
                    <g>
                      <rect
                        x={midX - 20}
                        y={midY - 12}
                        width="40"
                        height="24"
                        rx="5"
                        fill="white"
                        stroke={strokeColor}
                        strokeWidth="2"
                      />
                      <text
                        x={midX}
                        y={midY + 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={strokeColor}
                        className="pointer-events-none select-none"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      >
                        {labelText}
                      </text>
                    </g>
                    
                    {/* Plus button on connection - positioned at midpoint, tách xa label */}
                    {!isViewOnly && (
                      <g>
                        <circle
                          cx={midX}
                          cy={midY + 40}
                          r={hoveredPlusButton === connection.id ? "12" : "10"}
                          fill={hoveredPlusButton === connection.id ? strokeColor : "white"}
                          stroke={strokeColor}
                          strokeWidth={hoveredPlusButton === connection.id ? "2" : "1.5"}
                          className="cursor-pointer transition-all duration-200"
                          style={{ pointerEvents: 'all' }}
                          onMouseEnter={() => setHoveredPlusButton(connection.id)}
                          onMouseLeave={() => setHoveredPlusButton(null)}
                          onClick={(e) => {
                            e.stopPropagation()
                            // Store canvas position (midX, midY + 40) for accurate popup placement
                            setShowNodeTypePopup({
                              connectionId: connection.id,
                              canvasPosition: { x: midX, y: midY + 40 }
                            })
                          }}
                        />
                        <text
                          x={midX}
                          y={midY + 44}
                          textAnchor="middle"
                          fontSize="12"
                          fill={hoveredPlusButton === connection.id ? "white" : strokeColor}
                          className="pointer-events-none select-none transition-colors duration-200"
                          fontWeight="600"
                        >
                          +
                        </text>
                      </g>
                    )}
                  </svg>
                )
              })}

              {/* Render Temp Connection */}
              {tempConnection && connectionStart && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 2 }}
                  width="100%"
                  height="100%"
                >
                  {(() => {
                    const sourceNode = nodes.find(n => n.id === connectionStart)
                    if (!sourceNode) return null
                    
                    // Tính toán tương tự như connection thật - vertical layout
                    const nodeWidth = 312
                    const nodeHeight = 120
                    
                    // Center của output connection point (bottom center), sát node
                    const outputCenterX = sourceNode.position.x + nodeWidth / 2
                    const outputCenterY = sourceNode.position.y + nodeHeight // Sát node
                    const startX = outputCenterX
                    const startY = outputCenterY
                    const endX = tempConnection.x
                    const endY = tempConnection.y
                    
                    const path = getBezierPath(startX, startY, endX, endY)
                    const tempLabel = connectionLabel
                    const tempIsYes = tempLabel === 'yes'
                    const tempStrokeColor = tempIsYes ? '#22C55E' : '#EF4444'
                    const tempArrowColor = tempIsYes ? '#16A34A' : '#DC2626'
                    
                    return (
                      <>
                  <defs>
                    <marker
                      id="tempArrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="10"
                      refY="5"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path
                        d="M0,0 L0,10 L10,5 z"
                              fill={tempArrowColor}
                        opacity="0.7"
                      />
                    </marker>
                  </defs>
                  <path
                        d={path}
                          stroke={tempStrokeColor}
                        strokeWidth="2.5"
                    fill="none"
                    markerEnd="url(#tempArrowhead)"
                        opacity="0.7"
                        className="animate-pulse"
                  />
                      </>
                    )
                  })()}
                </svg>
              )}

            </div>
          </div>

          {/* Node Type Selection Popup - Render outside transform container */}
          {showNodeTypePopup && canvasRef.current && (() => {
            // Calculate screen position from canvas coordinates
            const rect = canvasRef.current.getBoundingClientRect()
            const screenX = (showNodeTypePopup.canvasPosition.x * zoom) + pan.x + rect.left
            const screenY = (showNodeTypePopup.canvasPosition.y * zoom) + pan.y + rect.top
            
            return (
              <div
                data-node-popup
                className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 min-w-[160px]"
                style={{
                  left: `${screenX + 15}px`,
                  top: `${screenY}px`,
                  transform: 'translateY(-50%)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-1.5 px-1.5">
                  <h3 className="text-xs font-semibold text-gray-700">Steps</h3>
                  <button
                    onClick={() => setShowNodeTypePopup(null)}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {nodeTypes.map((nodeType) => (
                    <button
                      key={nodeType.id}
                      onClick={() => insertNodeBetweenConnection(showNodeTypePopup.connectionId, nodeType.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded transition-colors text-left group"
                    >
                      <div className={`w-6 h-6 ${nodeType.color} rounded flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {React.cloneElement(nodeType.icon as React.ReactElement, { className: "h-3 w-3" })}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{nodeType.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Canvas Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-64 bg-gray-50 border-l border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Node Properties</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            
            {(() => {
              const node = nodes.find(n => n.id === selectedNode)
              if (!node) return null
              
              return (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Node Type</label>
                    <div className="flex items-center p-1.5 bg-white border border-gray-200 rounded">
                      <div className={`w-5 h-5 ${getNodeColor(node.type)} rounded flex items-center justify-center mr-1.5`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <span className="text-xs">{node.title}</span>
                    </div>
                  </div>
                  
                  {/* Owner badge for colleague workflows */}
                  {workflowOwner && workflowSource === 'colleague' && (
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                      <div className="flex items-center gap-1.5">
                        {workflowOwner.avatar_url ? (
                          <img src={workflowOwner.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                            {workflowOwner.first_name?.[0]}{workflowOwner.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-medium text-purple-900">
                            {workflowOwner.first_name} {workflowOwner.last_name}
                          </div>
                          <div className="text-xs text-purple-600">Workflow Owner</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isViewOnly && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1.5">Name</label>
                        <input
                          type="text"
                          value={node.title}
                          onChange={(e) => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode ? { ...n, title: e.target.value } : n
                            ))
                          }}
                          className="w-full p-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1.5">Description</label>
                        <textarea
                          value={node.description || ''}
                          onChange={(e) => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode ? { ...n, description: e.target.value } : n
                            ))
                          }}
                          rows={3}
                          className="w-full p-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1.5">Action Timing</label>
                        <div className="space-y-1.5">
                          <select
                            value={node.data?.actionDelayUnit || 'immediately'}
                            onChange={(e) => {
                              setNodes(prev => prev.map(n => 
                                n.id === selectedNode ? { 
                                  ...n, 
                                  data: { 
                                    ...n.data, 
                                    actionDelayUnit: e.target.value as any,
                                    actionDelay: e.target.value === 'immediately' ? undefined : (n.data?.actionDelay || 1)
                                  } 
                                } : n
                              ))
                            }}
                            className="w-full p-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                          >
                            <option value="immediately">Action immediately</option>
                            <option value="seconds">Action after X seconds</option>
                            <option value="minutes">Action after X minutes</option>
                            <option value="hours">Action after X hours</option>
                            <option value="days">Action after X days</option>
                          </select>
                          {node.data?.actionDelayUnit && node.data.actionDelayUnit !== 'immediately' && (
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={node.data?.actionDelay || 1}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : 1
                                setNodes(prev => prev.map(n => 
                                  n.id === selectedNode ? { 
                                    ...n, 
                                    data: { 
                                      ...n.data, 
                                      actionDelay: value 
                                    } 
                                  } : n
                                ))
                              }}
                              placeholder="Delay value"
                              className="w-full p-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1.5">
                          Maximum Customer No-Response Time (seconds)
                        </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={node.data?.max_no_response_time || ''}
                      onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined
                        setNodes(prev => prev.map(n => 
                            n.id === selectedNode ? { 
                              ...n, 
                              data: { 
                                ...n.data, 
                                max_no_response_time: value 
                              } 
                            } : n
                          ))
                        }}
                          placeholder="Example: 300 (5 minutes)"
                          className="flex-1 p-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                        />
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {node.data?.max_no_response_time 
                            ? `≈ ${Math.floor((node.data.max_no_response_time || 0) / 60)} min ${(node.data.max_no_response_time || 0) % 60} sec`
                            : 'Not configured'
                          }
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum time to wait for customer response before moving to next node
                      </p>
                    </div>
                    </>
                  )}
                  
                  {/* View-only info message */}
                  {isViewOnly && !isCampaignMode && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                      <div className="flex items-center gap-1.5 text-amber-800">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">View only - Cannot edit colleague's workflow</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Campaign Script Editor */}
                  {isCampaignMode && campaignId && functionName && workflowSource === 'my' && (
                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-xs font-medium mb-1.5">Script for Campaign</label>
                      <textarea
                        value={nodeScripts[selectedNode] || ''}
                        onChange={(e) => {
                          const newScript = e.target.value
                          setNodeScripts(prev => ({ ...prev, [selectedNode]: newScript }))
                        }}
                        onBlur={() => {
                          if (selectedNode) {
                            saveNodeScript(selectedNode, nodeScripts[selectedNode] || '')
                          }
                        }}
                        onKeyDown={(e) => {
                          // Stop propagation to prevent canvas handlers from interfering
                          e.stopPropagation()
                        }}
                        onKeyUp={(e) => {
                          // Stop propagation to prevent canvas handlers from interfering
                          e.stopPropagation()
                        }}
                        rows={8}
                        placeholder="Enter script for this node..."
                        className="w-full p-1.5 bg-white border border-gray-300 rounded focus:border-blue-400 focus:outline-none font-mono text-xs"
                      />
                      {isSavingScript && (
                        <p className="text-xs text-gray-500 mt-1">Saving...</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        This script will be used for this campaign instead of the default workflow script
                      </p>
                    </div>
                  )}
                  
                  {!isViewOnly && (
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => deleteNode(selectedNode)}
                        className="w-full flex items-center justify-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Delete Node
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
