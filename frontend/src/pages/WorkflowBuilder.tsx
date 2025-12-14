import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { workflowsAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { 
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link,
  Workflow,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  PhoneCall,
  Users,
  ChevronDown,
  Building2,
  User,
  Eye,
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
    [key: string]: any
  }
  title: string
  description?: string
}

interface Connection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  strokeType?: 'solid' | 'dashed' // Loại đường: nét liền hoặc nét đứt
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
      { id: 'whatsapp_1', type: 'whatsapp', position: { x: 50, y: 100 }, data: {}, title: 'WhatsApp' },
      { id: 'ai-call_1', type: 'ai-call', position: { x: 300, y: 100 }, data: {}, title: 'AI Call' },
      { id: 'linkedin_1', type: 'linkedin', position: { x: 550, y: 100 }, data: {}, title: 'LinkedIn' },
      { id: 'telegram_1', type: 'telegram', position: { x: 800, y: 100 }, data: {}, title: 'Telegram' },
      { id: 'email_1', type: 'email', position: { x: 1050, y: 100 }, data: {}, title: 'Email' }
    ],
    connections: [
      { id: 'conn1', source: 'whatsapp_1', target: 'ai-call_1' },
      { id: 'conn2', source: 'ai-call_1', target: 'linkedin_1' },
      { id: 'conn3', source: 'linkedin_1', target: 'telegram_1' },
      { id: 'conn4', source: 'telegram_1', target: 'email_1' }
    ]
  },
  {
    id: 'workflow-2',
    name: 'Workflow 2: AI Call → LinkedIn → WhatsApp → Email → Telegram',
    description: 'Start with AI Call, then LinkedIn, WhatsApp, Email, and finish with Telegram',
    nodes: [
      { id: 'ai-call_2', type: 'ai-call', position: { x: 50, y: 100 }, data: {}, title: 'AI Call' },
      { id: 'linkedin_2', type: 'linkedin', position: { x: 300, y: 100 }, data: {}, title: 'LinkedIn' },
      { id: 'whatsapp_2', type: 'whatsapp', position: { x: 550, y: 100 }, data: {}, title: 'WhatsApp' },
      { id: 'email_2', type: 'email', position: { x: 800, y: 100 }, data: {}, title: 'Email' },
      { id: 'telegram_2', type: 'telegram', position: { x: 1050, y: 100 }, data: {}, title: 'Telegram' }
    ],
    connections: [
      { id: 'conn1', source: 'ai-call_2', target: 'linkedin_2' },
      { id: 'conn2', source: 'linkedin_2', target: 'whatsapp_2' },
      { id: 'conn3', source: 'whatsapp_2', target: 'email_2' },
      { id: 'conn4', source: 'email_2', target: 'telegram_2' }
    ]
  },
  {
    id: 'workflow-3',
    name: 'Workflow 3: LinkedIn → Email → AI Call → Telegram → WhatsApp',
    description: 'Start with LinkedIn, then Email, AI Call, Telegram, and finish with WhatsApp',
    nodes: [
      { id: 'linkedin_3', type: 'linkedin', position: { x: 50, y: 100 }, data: {}, title: 'LinkedIn' },
      { id: 'email_3', type: 'email', position: { x: 300, y: 100 }, data: {}, title: 'Email' },
      { id: 'ai-call_3', type: 'ai-call', position: { x: 550, y: 100 }, data: {}, title: 'AI Call' },
      { id: 'telegram_3', type: 'telegram', position: { x: 800, y: 100 }, data: {}, title: 'Telegram' },
      { id: 'whatsapp_3', type: 'whatsapp', position: { x: 1050, y: 100 }, data: {}, title: 'WhatsApp' }
    ],
    connections: [
      { id: 'conn1', source: 'linkedin_3', target: 'email_3' },
      { id: 'conn2', source: 'email_3', target: 'ai-call_3' },
      { id: 'conn3', source: 'ai-call_3', target: 'telegram_3' },
      { id: 'conn4', source: 'telegram_3', target: 'whatsapp_3' }
    ]
  },
  {
    id: 'workflow-4',
    name: 'Workflow 4: Email → WhatsApp → LinkedIn → AI Call → Telegram',
    description: 'Start with Email, then WhatsApp, LinkedIn, AI Call, and finish with Telegram',
    nodes: [
      { id: 'email_4', type: 'email', position: { x: 50, y: 100 }, data: {}, title: 'Email' },
      { id: 'whatsapp_4', type: 'whatsapp', position: { x: 300, y: 100 }, data: {}, title: 'WhatsApp' },
      { id: 'linkedin_4', type: 'linkedin', position: { x: 550, y: 100 }, data: {}, title: 'LinkedIn' },
      { id: 'ai-call_4', type: 'ai-call', position: { x: 800, y: 100 }, data: {}, title: 'AI Call' },
      { id: 'telegram_4', type: 'telegram', position: { x: 1050, y: 100 }, data: {}, title: 'Telegram' }
    ],
    connections: [
      { id: 'conn1', source: 'email_4', target: 'whatsapp_4' },
      { id: 'conn2', source: 'whatsapp_4', target: 'linkedin_4' },
      { id: 'conn3', source: 'linkedin_4', target: 'ai-call_4' },
      { id: 'conn4', source: 'ai-call_4', target: 'telegram_4' }
    ]
  },
  {
    id: 'workflow-5',
    name: 'Workflow 5: Telegram → AI Call → Email → WhatsApp → LinkedIn',
    description: 'Start with Telegram, then AI Call, Email, WhatsApp, and finish with LinkedIn',
    nodes: [
      { id: 'telegram_5', type: 'telegram', position: { x: 50, y: 100 }, data: {}, title: 'Telegram' },
      { id: 'ai-call_5', type: 'ai-call', position: { x: 300, y: 100 }, data: {}, title: 'AI Call' },
      { id: 'email_5', type: 'email', position: { x: 550, y: 100 }, data: {}, title: 'Email' },
      { id: 'whatsapp_5', type: 'whatsapp', position: { x: 800, y: 100 }, data: {}, title: 'WhatsApp' },
      { id: 'linkedin_5', type: 'linkedin', position: { x: 1050, y: 100 }, data: {}, title: 'LinkedIn' }
    ],
    connections: [
      { id: 'conn1', source: 'telegram_5', target: 'ai-call_5' },
      { id: 'conn2', source: 'ai-call_5', target: 'email_5' },
      { id: 'conn3', source: 'email_5', target: 'whatsapp_5' },
      { id: 'conn4', source: 'whatsapp_5', target: 'linkedin_5' }
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [drawStartNode, setDrawStartNode] = useState<string | null>(null)
  const [connectionStrokeType, setConnectionStrokeType] = useState<'solid' | 'dashed'>('solid') // Loại đường mặc định
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
        
        setNodes(loadedNodes)
        setConnections(workflow.connections || [])
        
        // Load campaign scripts from node.data.scripts if in campaign mode
        if (campaignId && (functionName || workflowId) && workflowSource === 'my') {
          const scripts: Record<string, string> = {}
          loadedNodes.forEach((node: Node) => {
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
        setHistory([{ nodes: loadedNodes, connections: workflow.connections || [] }])
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
  }, [connections, saveToHistory, isViewOnly])

  // Load workflow
  const loadWorkflow = (workflowId: string) => {
    const workflow = preBuiltWorkflows.find(w => w.id === workflowId)
    if (workflow) {
      const newNodes = [...workflow.nodes]
      const newConnections = [...workflow.connections]
      setNodes(newNodes)
      setConnections(newConnections)
      setSelectedNode(null)
      saveToHistory(newNodes, newConnections)
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
  
  // Handle wheel zoom và pan
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return
    
    e.preventDefault()
    
    // Ctrl + Wheel hoặc Cmd + Wheel để zoom
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Zoom point (vị trí chuột trên canvas trong không gian đã zoom)
      const zoomPointX = (mouseX - pan.x) / zoom
      const zoomPointY = (mouseY - pan.y) / zoom
      
      // Tính zoom mới
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(3, zoom * zoomDelta))
      
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

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedNode(null)
      if (isConnecting) {
        setIsConnecting(false)
        setConnectionStart(null)
        setTempConnection(null)
      }
    }
  }

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
        const nodeWidth = 192
        const nodeHeight = 80
        
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
          strokeType: connectionStrokeType // Lưu loại đường đã chọn
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
        strokeType: connectionStrokeType // Lưu loại đường đã chọn
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
  }, [showSourceDropdown])

  // Calculate smart bezier curve path for connections
  const getBezierPath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
  ): string => {
    const dx = targetX - sourceX
    
    // Tính toán control points dựa trên khoảng cách và hướng
    const curvature = 0.5
    const controlPointOffset = Math.min(Math.abs(dx) * curvature, 150)
    
    // Nếu nodes nằm ngang nhau, tạo curve dọc
    if (Math.abs(dx) < 50) {
      const midY = (sourceY + targetY) / 2
      return `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`
    }
    
    // Nếu source ở bên trái target
    if (dx > 0) {
      const cp1x = sourceX + controlPointOffset
      const cp1y = sourceY
      const cp2x = targetX - controlPointOffset
      const cp2y = targetY
      return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`
    }
    
    // Nếu source ở bên phải target (backward connection)
    const cp1x = sourceX - controlPointOffset
    const cp1y = sourceY
    const cp2x = targetX + controlPointOffset
    const cp2y = targetY
    return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Workflow className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">Workflow</h1>
            {isCampaignMode && (
              <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">
                Campaign Mode - Chỉnh sửa Script
              </span>
            )}
            {isViewOnly && !isCampaignMode && (
              <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded flex items-center gap-1">
                <Eye className="h-3 w-3" />
                View Only
              </span>
            )}
          </div>
          
          {/* Workflow Source Switcher - Always show if not in campaign mode */}
          {!isCampaignMode && (
            <div className="relative" data-source-dropdown>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                {workflowSource === 'my' && (
                  <>
                    <User className="h-4 w-4 text-blue-500" />
                    <span>My Workflow</span>
                  </>
                )}
                {workflowSource === 'company' && (
                  <>
                    <Building2 className="h-4 w-4 text-green-500" />
                    <span>Company Workflows</span>
                  </>
                )}
                {workflowSource === 'colleague' && selectedColleague && (
                  <>
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>{selectedColleague.first_name} {selectedColleague.last_name}</span>
                  </>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSourceDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* My Workflow */}
                  <button
                    onClick={() => {
                      setWorkflowSource('my')
                      setSelectedColleague(null)
                      setShowSourceDropdown(false)
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-left ${
                      workflowSource === 'my' ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <User className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">My Workflow</div>
                      <div className="text-xs text-gray-500">Edit your own workflow</div>
                    </div>
                  </button>
                  
                  {/* Divider */}
                  {colleagues.length > 0 && (
                    <div className="border-t border-gray-100 my-1">
                      <div className="px-4 py-2 text-xs text-gray-500 font-medium">Colleagues' Workflows</div>
                    </div>
                  )}
                  
                  {/* Colleagues */}
                  {colleagues.map((colleague) => (
                    <button
                      key={colleague.id}
                      onClick={() => {
                        setWorkflowSource('colleague')
                        setSelectedColleague(colleague)
                        setShowSourceDropdown(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left ${
                        workflowSource === 'colleague' && selectedColleague?.id === colleague.id 
                          ? 'bg-purple-50 text-purple-700' 
                          : ''
                      }`}
                    >
                      {colleague.avatar_url ? (
                        <img src={colleague.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                          {colleague.first_name?.[0]}{colleague.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{colleague.first_name} {colleague.last_name}</div>
                        <div className="text-xs text-gray-500 truncate">{colleague.email}</div>
                      </div>
                      <Eye className="h-3 w-3 text-gray-400" />
                    </button>
                  ))}
                  
                  {colleagues.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {user?.company_id 
                        ? 'No colleagues have workflows for this function'
                        : 'Join a company to see colleague workflows'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <span>Nodes: {nodes.length}</span>
            <span>Connections: {connections.length}</span>
            {isConnecting && <span className="text-blue-400">Connecting...</span>}
            {isDrawMode && (
              <span className="text-yellow-400">
                {!drawStartNode ? 'Click first node' : 'Click second node'}
              </span>
            )}
          </div>
        </div>
        
          <div className="flex items-center space-x-2">
          {!isViewOnly && (
            <>
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  historyIndex <= 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  historyIndex >= history.length - 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Redo className="h-4 w-4 mr-2" />
                Redo
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <button 
                onClick={() => {
                  setConnections([])
                  saveToHistory(nodes, [])
                }}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Connections
              </button>
              <button 
                onClick={handleDrawModeToggle}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isDrawMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Link className="h-4 w-4 mr-2" />
                {isDrawMode ? 'Cancel Draw' : 'Draw Connection'}
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-700 mr-1">Line:</span>
                <button
                  onClick={() => setConnectionStrokeType('solid')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    connectionStrokeType === 'solid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Solid line"
                >
                  ─
                </button>
                <button
                  onClick={() => setConnectionStrokeType('dashed')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    connectionStrokeType === 'dashed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Dashed line"
                >
                  ╌
                </button>
              </div>
            </>
          )}
            {functionName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                {isLoading && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Loading...
                  </span>
                )}
                {isSaving && !isLoading && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </span>
                )}
                {!isLoading && !isSaving && (
                  <span className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved
                  </span>
                )}
              </div>
            )}
            {selectedNode && !isViewOnly && (
              <button 
                onClick={() => deleteNode(selectedNode)}
              className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Node
              </button>
            )}
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-3">Workflow Library</h2>
            <div className="text-sm text-gray-600">
              Choose from pre-built workflows or create your own
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Pre-built Workflows</h3>
              {preBuiltWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white h-32 flex flex-col"
                  onClick={() => loadWorkflow(workflow.id)}
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
            onWheel={handleCanvasWheel}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              backgroundImage: `radial-gradient(circle, #E5E7EB 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: `${pan.x}px ${pan.y}px`
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
                  className={`absolute w-48 bg-white border-2 rounded-lg shadow-lg transition-all select-none ${
                    isDrawMode 
                      ? 'cursor-pointer border-yellow-400 shadow-yellow-400/20' 
                      : selectedNode === node.id 
                        ? 'border-blue-400 shadow-blue-400/20 cursor-move' 
                        : 'border-gray-600 hover:border-gray-500 cursor-move'
                  } ${draggingNodeId === node.id ? 'z-10' : ''} ${
                    drawStartNode === node.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
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
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 ${getNodeColor(node.type)} rounded flex items-center justify-center mr-2`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <span className="font-medium text-sm">{node.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">ID: {node.id.includes('_') ? node.id.split('_')[1] : node.id}</div>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          deleteNode(node.id)
                        }}
                        className="text-gray-600 hover:text-red-500 transition-colors p-1 z-10 relative"
                        title="Delete node"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Input Connection Point */}
                  <div 
                    className={`absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full cursor-pointer transition-all ${
                      isConnecting && connectionStart !== node.id 
                        ? 'bg-blue-400 border-2 border-blue-300' 
                        : 'bg-gray-300 border-2 border-gray-400 hover:bg-gray-400'
                    }`}
                    onClick={(e) => handleConnectionPointClick(e, node.id, 'input')}
                  />
                  
                  {/* Output Connection Point */}
                  <div 
                    className={`absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full cursor-pointer transition-all ${
                      isConnecting && connectionStart === node.id 
                        ? 'bg-green-400 border-2 border-green-300' 
                        : 'bg-gray-300 border-2 border-gray-400 hover:bg-gray-400'
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

                // Tính toán đơn giản và chính xác
                // Node: w-48 = 192px
                // Connection point: w-4 h-4 = 16px, positioned với -right-2 và -left-2
                // -right-2: right edge của connection = right edge của node - 8px
                //   => right edge = node.x + 192 - 8 = node.x + 184
                //   => center = node.x + 184 - 8 = node.x + 176
                // -left-2: left edge của connection = left edge của node - 8px  
                //   => left edge = node.x - 8
                //   => center = node.x - 8 + 8 = node.x
                const NODE_WIDTH = 192
                const CONNECTION_SIZE = 16
                const CONNECTION_OFFSET = 8
                const NODE_HEIGHT = 80
                
                // Center của connection points
                const outputCenterX = sourceNode.position.x + NODE_WIDTH - CONNECTION_OFFSET - (CONNECTION_SIZE / 2)
                const inputCenterX = targetNode.position.x - CONNECTION_OFFSET + (CONNECTION_SIZE / 2)
                const centerY = sourceNode.position.y + NODE_HEIGHT / 2
                
                // Path: rút ngắn ở cả 2 đầu để line không thừa ra ngoài connection points
                // Arrowhead có refX=10, tip ở (10,5), nên cần rút ngắn 10px ở cuối để tip vừa đúng center
                // Ở đầu rút ngắn xuống âm để line bắt đầu từ sâu trong connection point
                const arrowheadTipOffset = 0
                const startOffset = -15 // Âm để path bắt đầu từ sâu trong connection point
                const startX = outputCenterX - startOffset 
                const startY = centerY
                const endX = inputCenterX - arrowheadTipOffset // Rút ngắn để arrowhead tip vừa đúng center
                const endY = targetNode.position.y + NODE_HEIGHT / 2

                // Sử dụng bezier curve
                const path = getBezierPath(startX, startY, endX, endY)

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
                          fill="#3B82F6"
                          className="transition-all"
                        />
                      </marker>
                      <linearGradient id={`gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <path
                      d={path}
                      stroke={`url(#gradient-${connection.id})`}
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray={(connection.strokeType || 'solid') === 'dashed' ? '8,4' : 'none'}
                      markerEnd={`url(#arrowhead-${connection.id})`}
                      className="transition-all duration-200"
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(59, 130, 246, 0.3))'
                      }}
                    />
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
                        fill="#3B82F6"
                        opacity="0.7"
                      />
                    </marker>
                  </defs>
                  {(() => {
                    const sourceNode = nodes.find(n => n.id === connectionStart)
                    if (!sourceNode) return null
                    
                    // Tính toán tương tự như connection thật
                    const nodeWidth = 192
                    const nodeHeight = 80
                    const CONNECTION_SIZE = 16
                    const CONNECTION_OFFSET = 8
                    
                    // Center của output connection point
                    const outputCenterX = sourceNode.position.x + nodeWidth - CONNECTION_OFFSET - (CONNECTION_SIZE / 2)
                    // Bắt đầu từ ngoài connection point một chút (cộng thêm 8px)
                    const startX = outputCenterX + 16 // Ngoài connection point một chút
                    const startY = sourceNode.position.y + nodeHeight / 2
                    const endX = tempConnection.x
                    const endY = tempConnection.y
                    
                    const path = getBezierPath(startX, startY, endX, endY)
                    
                    return (
                  <path
                        d={path}
                    stroke="#3B82F6"
                        strokeWidth="2.5"
                    fill="none"
                        strokeDasharray="8,4"
                    markerEnd="url(#tempArrowhead)"
                        opacity="0.7"
                        className="animate-pulse"
                  />
                    )
                  })()}
                </svg>
              )}
            </div>
          </div>

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
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Node Properties</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            {(() => {
              const node = nodes.find(n => n.id === selectedNode)
              if (!node) return null
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Node Type</label>
                    <div className="flex items-center p-2 bg-white border border-gray-200 rounded-lg">
                      <div className={`w-6 h-6 ${getNodeColor(node.type)} rounded flex items-center justify-center mr-2`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <span className="text-sm">{node.title}</span>
                    </div>
                  </div>
                  
                  {/* Owner badge for colleague workflows */}
                  {workflowOwner && workflowSource === 'colleague' && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        {workflowOwner.avatar_url ? (
                          <img src={workflowOwner.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-medium">
                            {workflowOwner.first_name?.[0]}{workflowOwner.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-purple-900">
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
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                          type="text"
                          value={node.title}
                          onChange={(e) => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode ? { ...n, title: e.target.value } : n
                            ))
                          }}
                          className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                          value={node.description || ''}
                          onChange={(e) => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode ? { ...n, description: e.target.value } : n
                            ))
                          }}
                          rows={3}
                          className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Maximum Customer No-Response Time (seconds)
                        </label>
                    <div className="flex items-center gap-2">
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
                          className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
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
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">View only - Cannot edit colleague's workflow</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Campaign Script Editor */}
                  {isCampaignMode && campaignId && functionName && workflowSource === 'my' && (
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium mb-2">Script for Campaign</label>
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
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none font-mono text-sm"
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
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => deleteNode(selectedNode)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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
