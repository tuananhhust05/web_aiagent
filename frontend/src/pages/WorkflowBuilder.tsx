import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  // Play, // Temporarily unused
  // Save, // Temporarily unused
  // Download, // Temporarily unused
  // Upload, // Temporarily unused
  // Settings, // Temporarily unused
  // Plus, // Temporarily unused
  Trash2,
  // Copy, // Temporarily unused
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  // Minimize2, // Temporarily unused
  // MousePointer, // Temporarily unused
  // Move, // Temporarily unused
  Link,
  Workflow,
  // Zap, // Temporarily unused
  // Database, // Temporarily unused
  Mail,
  // MessageSquare, // Temporarily unused
  // Calendar, // Temporarily unused
  // FileText, // Temporarily unused
  // Filter, // Temporarily unused
  // Code, // Temporarily unused
  // Globe, // Temporarily unused
  // Smartphone, // Temporarily unused
  // Bot, // Temporarily unused
  // User, // Temporarily unused
  Clock,
  CheckCircle,
  // AlertCircle, // Temporarily unused
  XCircle,
  // Phone, // Temporarily unused
  MessageCircle,
  Send,
  PhoneCall,
  // Mic, // Temporarily unused
  // Brain, // Temporarily unused
  Users,
  // Hash, // Temporarily unused
  // AtSign // Temporarily unused
} from 'lucide-react'

interface Node {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
  title: string
  description?: string
  status?: 'idle' | 'running' | 'success' | 'error'
}

interface Connection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
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

// Pre-built workflows with different node orders
const preBuiltWorkflows = [
  {
    id: 'workflow-1',
    name: 'Workflow 1: WhatsApp → AI Call → LinkedIn → Telegram → Email',
    description: 'Start with WhatsApp, then AI Call, LinkedIn, Telegram, and finish with Email',
    nodes: [
      { id: 'whatsapp_1', type: 'whatsapp', position: { x: 50, y: 100 }, data: {}, title: 'WhatsApp', status: 'idle' as const },
      { id: 'ai-call_1', type: 'ai-call', position: { x: 300, y: 100 }, data: {}, title: 'AI Call', status: 'idle' as const },
      { id: 'linkedin_1', type: 'linkedin', position: { x: 550, y: 100 }, data: {}, title: 'LinkedIn', status: 'idle' as const },
      { id: 'telegram_1', type: 'telegram', position: { x: 800, y: 100 }, data: {}, title: 'Telegram', status: 'idle' as const },
      { id: 'email_1', type: 'email', position: { x: 1050, y: 100 }, data: {}, title: 'Email', status: 'idle' as const }
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
      { id: 'ai-call_2', type: 'ai-call', position: { x: 50, y: 100 }, data: {}, title: 'AI Call', status: 'idle' as const },
      { id: 'linkedin_2', type: 'linkedin', position: { x: 300, y: 100 }, data: {}, title: 'LinkedIn', status: 'idle' as const },
      { id: 'whatsapp_2', type: 'whatsapp', position: { x: 550, y: 100 }, data: {}, title: 'WhatsApp', status: 'idle' as const },
      { id: 'email_2', type: 'email', position: { x: 800, y: 100 }, data: {}, title: 'Email', status: 'idle' as const },
      { id: 'telegram_2', type: 'telegram', position: { x: 1050, y: 100 }, data: {}, title: 'Telegram', status: 'idle' as const }
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
      { id: 'linkedin_3', type: 'linkedin', position: { x: 50, y: 100 }, data: {}, title: 'LinkedIn', status: 'idle' as const },
      { id: 'email_3', type: 'email', position: { x: 300, y: 100 }, data: {}, title: 'Email', status: 'idle' as const },
      { id: 'ai-call_3', type: 'ai-call', position: { x: 550, y: 100 }, data: {}, title: 'AI Call', status: 'idle' as const },
      { id: 'telegram_3', type: 'telegram', position: { x: 800, y: 100 }, data: {}, title: 'Telegram', status: 'idle' as const },
      { id: 'whatsapp_3', type: 'whatsapp', position: { x: 1050, y: 100 }, data: {}, title: 'WhatsApp', status: 'idle' as const }
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
      { id: 'email_4', type: 'email', position: { x: 50, y: 100 }, data: {}, title: 'Email', status: 'idle' as const },
      { id: 'whatsapp_4', type: 'whatsapp', position: { x: 300, y: 100 }, data: {}, title: 'WhatsApp', status: 'idle' as const },
      { id: 'linkedin_4', type: 'linkedin', position: { x: 550, y: 100 }, data: {}, title: 'LinkedIn', status: 'idle' as const },
      { id: 'ai-call_4', type: 'ai-call', position: { x: 800, y: 100 }, data: {}, title: 'AI Call', status: 'idle' as const },
      { id: 'telegram_4', type: 'telegram', position: { x: 1050, y: 100 }, data: {}, title: 'Telegram', status: 'idle' as const }
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
      { id: 'telegram_5', type: 'telegram', position: { x: 50, y: 100 }, data: {}, title: 'Telegram', status: 'idle' as const },
      { id: 'ai-call_5', type: 'ai-call', position: { x: 300, y: 100 }, data: {}, title: 'AI Call', status: 'idle' as const },
      { id: 'email_5', type: 'email', position: { x: 550, y: 100 }, data: {}, title: 'Email', status: 'idle' as const },
      { id: 'whatsapp_5', type: 'whatsapp', position: { x: 800, y: 100 }, data: {}, title: 'WhatsApp', status: 'idle' as const },
      { id: 'linkedin_5', type: 'linkedin', position: { x: 1050, y: 100 }, data: {}, title: 'LinkedIn', status: 'idle' as const }
    ],
    connections: [
      { id: 'conn1', source: 'telegram_5', target: 'ai-call_5' },
      { id: 'conn2', source: 'ai-call_5', target: 'email_5' },
      { id: 'conn3', source: 'email_5', target: 'whatsapp_5' },
      { id: 'conn4', source: 'whatsapp_5', target: 'linkedin_5' }
    ]
  }
]

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  // const [isDragging, setIsDragging] = useState(false) // Temporarily unused
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [connectionStartHandle, setConnectionStartHandle] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [drawStartNode, setDrawStartNode] = useState<string | null>(null)
  const [drawEndNode, setDrawEndNode] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  // const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }) // Temporarily unused

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ))
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => conn.source !== nodeId && conn.target !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  // useEffect(() => {
  //   const updateCanvasSize = () => {
  //     if (canvasRef.current) {
  //       const rect = canvasRef.current.getBoundingClientRect()
  //       setCanvasSize({ width: rect.width, height: rect.height })
  //     }
  //   }
  //   
  //   updateCanvasSize()
  //   window.addEventListener('resize', updateCanvasSize)
  //   return () => window.removeEventListener('resize', updateCanvasSize)
  // }, []) // Temporarily commented out - setCanvasSize is unused

  // Global mouse events for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingNode && draggedNodeId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
        const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y
        updateNodePosition(draggedNodeId, { x: newX, y: newY })
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDraggingNode(false)
      setDraggedNodeId(null)
    }

    if (isDraggingNode) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingNode, draggedNodeId, dragOffset, pan, zoom, updateNodePosition])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode)
        }
      }
      if (e.key === 'Escape') {
        setSelectedNode(null)
        setIsConnecting(false)
        setConnectionStart(null)
        setConnectionStartHandle(null)
        setTempConnection(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, deleteNode])

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: {},
      title: nodeTypes.find(nt => nt.id === type)?.name || type,
      status: 'idle'
    }
    setNodes(prev => [...prev, newNode])
  }, [])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null)
      if (isConnecting) {
        setIsConnecting(false)
        setConnectionStart(null)
        setConnectionStartHandle(null)
        setTempConnection(null)
      }
    }
  }

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setIsDraggingNode(true)
    setDraggedNodeId(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: (e.clientX - rect.left - pan.x) / zoom - node.position.x,
        y: (e.clientY - rect.top - pan.y) / zoom - node.position.y
      })
    }
  }

  const handleNodeDragStartOnCanvas = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId)
    setSelectedNode(nodeId)
  }

  const handleNodeDragEnd = () => {
    setIsDraggingNode(false)
    setDraggedNodeId(null)
  }

  const handleDrawModeToggle = () => {
    setIsDrawMode(!isDrawMode)
    setDrawStartNode(null)
    setDrawEndNode(null)
    setSelectedNode(null)
  }

  const handleNodeClickForDraw = (nodeId: string) => {
    if (!isDrawMode) return
    
    if (!drawStartNode) {
      setDrawStartNode(nodeId)
      setSelectedNode(nodeId)
    } else if (!drawEndNode && nodeId !== drawStartNode) {
      setDrawEndNode(nodeId)
      // Create connection
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        source: drawStartNode,
        target: nodeId,
        sourceHandle: 'output',
        targetHandle: 'input'
      }
      setConnections(prev => [...prev, newConnection])
      
      // Reset draw mode
      setIsDrawMode(false)
      setDrawStartNode(null)
      setDrawEndNode(null)
      setSelectedNode(null)
    }
  }

  const loadWorkflow = (workflowId: string) => {
    const workflow = preBuiltWorkflows.find(w => w.id === workflowId)
    if (workflow) {
      setNodes(workflow.nodes)
      setConnections(workflow.connections)
      setSelectedNode(null)
    }
  }



  const handleConnectionPointClick = (e: React.MouseEvent, nodeId: string, handle: 'input' | 'output') => {
    e.stopPropagation()
    
    if (!isConnecting) {
      // Start connection
      setIsConnecting(true)
      setConnectionStart(nodeId)
      setConnectionStartHandle(handle)
      
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        const x = handle === 'output' ? node.position.x + 192 : node.position.x
        const y = node.position.y + 48
        setTempConnection({ x, y })
      }
    } else {
      // Complete connection
      if (connectionStart && connectionStart !== nodeId) {
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          source: connectionStart,
          target: nodeId,
          sourceHandle: connectionStartHandle || undefined,
          targetHandle: handle
        }
        setConnections(prev => [...prev, newConnection])
      }
      
      setIsConnecting(false)
      setConnectionStart(null)
      setConnectionStartHandle(null)
      setTempConnection(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (isDraggingNode) {
      // handleNodeMouseMove(e) // Function not implemented yet
    } else if (isConnecting && tempConnection) {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom
        setTempConnection({ x, y })
      }
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.metaKey)) { // Middle mouse or Cmd+click
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }


  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  // const handleNodeDragStart = (e: React.DragEvent, nodeType: string) => {
  //   setDraggedNode(nodeType)
  // } // Temporarily unused

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      addNode(draggedNode, { x, y })
    }
    setDraggedNode(null)
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.id === type)
    return nodeType?.icon || <Workflow className="h-4 w-4" />
  }

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.id === type)
    return nodeType?.color || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-3 w-3 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-400" />
      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Workflow className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">Workflow</h1>
          </div>
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
            <button className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </button>
            <button className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Redo className="h-4 w-4 mr-2" />
              Redo
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button 
              onClick={() => setConnections([])}
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
            {selectedNode && (
              <button 
                onClick={() => deleteNode(selectedNode)}
                className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
                  className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
                  onClick={() => loadWorkflow(workflow.id)}
                >
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{workflow.name}</h4>
                  <p className="text-xs text-gray-600 mb-3">{workflow.description}</p>
                  
                  {/* Visual representation of the workflow */}
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
            
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">5 nodes • 4 connections</span>
                    <button className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                      Load
                </button>
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
            className="w-full h-full bg-white relative cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            style={{
              backgroundImage: `
                radial-gradient(circle, #E5E7EB 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          >
            {/* Grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {/* Render Nodes */}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute w-48 bg-white border-2 rounded-lg shadow-lg transition-all ${
                    isDrawMode 
                      ? 'cursor-pointer border-yellow-400 shadow-yellow-400/20' 
                      : selectedNode === node.id 
                        ? 'border-blue-400 shadow-blue-400/20 cursor-move' 
                        : 'border-gray-600 hover:border-gray-500 cursor-move'
                  } ${isDraggingNode && draggedNodeId === node.id ? 'z-10' : ''} ${
                    drawStartNode === node.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    transform: `scale(${zoom})`
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isDrawMode) {
                      handleNodeClickForDraw(node.id)
                    } else {
                      setSelectedNode(node.id)
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    console.log('Double click to delete node:', node.id)
                    deleteNode(node.id)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Right click to delete node:', node.id)
                    deleteNode(node.id)
                  }}
                  draggable
                  onDragStart={(e) => handleNodeDragStartOnCanvas(e, node.id)}
                  onDragEnd={handleNodeDragEnd}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 ${getNodeColor(node.type)} rounded flex items-center justify-center mr-2`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <span className="font-medium text-sm">{node.title}</span>
                      </div>
                      {getStatusIcon(node.status || 'idle')}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">ID: {node.id}</div>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Delete button clicked for node:', node.id)
                          deleteNode(node.id)
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="text-gray-600 hover:text-red-500 transition-colors p-1 z-10 relative"
                        title="Delete node"
                        style={{ pointerEvents: 'auto' }}
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

                // Calculate connection points at the center of the connection circles
                const startX = sourceNode.position.x + 192 + 8 // Node width + connection circle radius (8px from right edge)
                const startY = sourceNode.position.y + 40 // Node height / 2 (estimated)
                const endX = targetNode.position.x - 8 // Connection circle radius (8px from left edge)
                const endY = targetNode.position.y + 40 // Node height / 2 (estimated)

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
                        markerWidth="8"
                        markerHeight="6"
                        refX="7"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                  >
                    <path
                          d="M0,0 L0,6 L8,3 z"
                          fill="#3B82F6"
                        />
                      </marker>
                    </defs>
                    <path
                      d={`M ${startX} ${startY} L ${endX} ${endY}`}
                      stroke="#3B82F6"
                      strokeWidth="2"
                      fill="none"
                      markerEnd={`url(#arrowhead-${connection.id})`}
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
                      markerWidth="8"
                      markerHeight="6"
                      refX="7"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path
                        d="M0,0 L0,6 L8,3 z"
                        fill="#3B82F6"
                      />
                    </marker>
                  </defs>
                  <path
                    d={`M ${tempConnection.x} ${tempConnection.y} L ${tempConnection.x + 100} ${tempConnection.y}`}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6,3"
                    markerEnd="url(#tempArrowhead)"
                  />
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
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={node.status || 'idle'}
                      onChange={(e) => {
                        setNodes(prev => prev.map(n => 
                          n.id === selectedNode ? { ...n, status: e.target.value as any } : n
                        ))
                      }}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                    >
                      <option value="idle">Idle</option>
                      <option value="running">Running</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  
                  {/* Node-specific configuration */}
                  {node.type === 'linkedin' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-400">LinkedIn Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Action</label>
                        <select className="w-full p-2 bg-white border border-gray-300 rounded text-sm">
                          <option>Send Message</option>
                          <option>Connect Request</option>
                          <option>Post Update</option>
                          <option>Like Post</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Message Template</label>
                        <textarea 
                          placeholder="Enter your message template..."
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'email' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-purple-400">Email Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">To</label>
                        <input 
                          type="email" 
                          placeholder="recipient@example.com"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Subject</label>
                        <input 
                          type="text" 
                          placeholder="Email subject"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Template</label>
                        <textarea 
                          placeholder="Email content..."
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'whatsapp' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-green-400">WhatsApp Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          placeholder="+1234567890"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Message</label>
                        <textarea 
                          placeholder="WhatsApp message..."
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'ai-call' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-orange-400">AI Call Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          placeholder="+1234567890"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Script</label>
                        <textarea 
                          placeholder="AI call script..."
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Voice</label>
                        <select className="w-full p-2 bg-white border border-gray-300 rounded text-sm">
                          <option>Male Voice</option>
                          <option>Female Voice</option>
                          <option>Custom Voice</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'telegram' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-400">Telegram Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Chat ID</label>
                        <input 
                          type="text" 
                          placeholder="@username or chat_id"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Message</label>
                        <textarea 
                          placeholder="Telegram message..."
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'condition' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-yellow-400">Condition Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Condition</label>
                        <select className="w-full p-2 bg-white border border-gray-300 rounded text-sm">
                          <option>If email contains</option>
                          <option>If phone number exists</option>
                          <option>If LinkedIn connected</option>
                          <option>If response received</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Value</label>
                        <input 
                          type="text" 
                          placeholder="Condition value"
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  )}
                  
                  {node.type === 'delay' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-400">Delay Settings</h4>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Duration</label>
                        <div className="flex space-x-2">
                          <input 
                            type="number" 
                            placeholder="5"
                            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                          />
                          <select className="p-2 bg-gray-700 border border-gray-600 rounded text-sm">
                            <option>seconds</option>
                            <option>minutes</option>
                            <option>hours</option>
                            <option>days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => deleteNode(selectedNode)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Node
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

    </div>
  )
}
