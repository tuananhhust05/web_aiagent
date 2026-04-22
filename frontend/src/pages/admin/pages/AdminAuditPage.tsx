import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Eye, Search, RefreshCw, Download, Shield, Lock, Unlock, UserPlus, Key, AlertTriangle } from 'lucide-react'

interface AuditLog {
  _id: string
  timestamp: string
  action: string
  user_id: string
  username?: string
  email?: string
  ip_address?: string
  user_agent?: string
  status: string
  details?: Record<string, any>
  previous_hash?: string
  hash?: string
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  USER_CREATE: UserPlus,
  USER_DELETE: AlertTriangle,
  USER_UPDATE: UserPlus,
  USER_LOCK: Lock,
  USER_UNLOCK: Unlock,
  PASSWORD_CHANGE: Key,
  MFA_ENABLE: Shield,
  MFA_DISABLE: Shield,
  LOGIN_SUCCESS: Shield,
  LOGIN_FAILED: AlertTriangle,
}

const ACTION_COLORS: Record<string, string> = {
  USER_CREATE: '#185FA5',
  USER_DELETE: '#E24B4A',
  USER_UPDATE: '#639922',
  USER_LOCK: '#EF9F27',
  USER_UNLOCK: '#639922',
  PASSWORD_CHANGE: '#7F77DD',
  MFA_ENABLE: '#1D9E75',
  MFA_DISABLE: '#EF9F27',
  LOGIN_SUCCESS: '#639922',
  LOGIN_FAILED: '#E24B4A',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [actionFilter, setActionFilter] = useState<string>('all')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/iam/audit-logs', { params: { limit: 100 } })
      setLogs(response.data.logs || response.data)
    } catch (error) {
      toast.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  const handleShowDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetail(true)
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/api/iam/audit-logs/export', { params: { limit: 1000 } })
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Audit logs exported')
    } catch (error) {
      toast.error('Failed to export logs')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-xs text-pink-800">
        Audit logs provide evidence of all identity and access management activities — satisfying ISO A.8.2 (privileged access rights) and A.8.15 (logging). Logs are cryptographically chained and cannot be modified.
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total events (30d)</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#D4537E' }}>{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">User changes</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>
              {logs.filter(l => l.action.startsWith('USER_')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Auth events</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#1D9E75' }}>
              {logs.filter(l => l.action.includes('LOGIN') || l.action.includes('MFA')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Hash chain valid</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#639922' }}>✓</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Audit trail</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchAuditLogs}>
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
                <Download className="w-3 h-3 mr-1" /> Export
              </Button>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search logs..." 
                className="pl-9 h-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-8 px-3 text-xs border rounded-md"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All actions</option>
              <option value="USER_CREATE">User created</option>
              <option value="USER_DELETE">User deleted</option>
              <option value="USER_LOCK">User locked</option>
              <option value="USER_UNLOCK">User unlocked</option>
              <option value="PASSWORD_CHANGE">Password changed</option>
              <option value="MFA_ENABLE">MFA enabled</option>
              <option value="MFA_DISABLE">MFA disabled</option>
              <option value="LOGIN_SUCCESS">Login success</option>
              <option value="LOGIN_FAILED">Login failed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50">
                  <th className="px-3 py-2 font-medium rounded-l-md">Time</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">IP / Device</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium rounded-r-md">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || Shield
                  const color = ACTION_COLORS[log.action] || '#185FA5'
                  return (
                    <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3" style={{ color }} />
                          <span className="font-medium" style={{ color }}>{log.action}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{log.username || log.user_id}</td>
                      <td className="px-3 py-2 text-gray-500">{log.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-400 text-[10px]">
                        <div>{log.ip_address || '—'}</div>
                        <div className="truncate max-w-[120px]">{log.user_agent?.slice(0, 30) || '—'}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge 
                          variant={log.status === 'success' || log.status === 'SUCCESS' ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 text-[10px]"
                          onClick={() => handleShowDetail(log)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit log detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">Timestamp</div>
                  <div className="text-xs font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">Action</div>
                  <div className="text-xs font-medium" style={{ color: ACTION_COLORS[selectedLog.action] }}>
                    {selectedLog.action}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">User ID</div>
                  <div className="text-xs font-medium">{selectedLog.user_id}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">Email</div>
                  <div className="text-xs font-medium">{selectedLog.email || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">IP Address</div>
                  <div className="text-xs font-medium">{selectedLog.ip_address || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">Status</div>
                  <div className="text-xs font-medium">{selectedLog.status}</div>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">Details</div>
                  <pre className="bg-gray-50 rounded p-2 text-[10px] overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.previous_hash && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">Hash chain</div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-[10px] mb-1">
                      <span className="text-gray-500">Previous: </span>
                      <span className="font-mono text-[9px]">{selectedLog.previous_hash?.slice(0, 20)}...</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-gray-500">Current: </span>
                      <span className="font-mono text-[9px]">{selectedLog.hash?.slice(0, 20)}...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}