import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface LifecycleRequest {
  id: string
  user: string
  email: string
  type: 'onboarding' | 'offboarding' | 'transfer'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  requester: string
  created_at: string
  target_date: string
  completed_date?: string
  steps: { name: string; completed: boolean; completed_at?: string }[]
}

const LIFECYCLE_REQUESTS: LifecycleRequest[] = [
  {
    id: 'LC-001',
    user: 'Sara Mitchell',
    email: 'sara.m@forskale.com',
    type: 'onboarding',
    status: 'in_progress',
    requester: 'HR - John Smith',
    created_at: '2024-11-10',
    target_date: '2024-11-15',
    steps: [
      { name: 'HR request submitted', completed: true, completed_at: '2024-11-10' },
      { name: 'Manager approval', completed: true, completed_at: '2024-11-11' },
      { name: 'Account created', completed: true, completed_at: '2024-11-12' },
      { name: 'MFA enrollment', completed: false },
      { name: 'Welcome email sent', completed: false },
    ],
  },
  {
    id: 'LC-002',
    user: 'Tom Kramer',
    email: 'tom.k@forskale.com',
    type: 'offboarding',
    status: 'in_progress',
    requester: 'HR - John Smith',
    created_at: '2024-11-08',
    target_date: '2024-11-12',
    steps: [
      { name: 'HR request submitted', completed: true, completed_at: '2024-11-08' },
      { name: 'Manager approval', completed: true, completed_at: '2024-11-09' },
      { name: 'Access revoked', completed: false },
      { name: 'Data exported', completed: false },
      { name: 'Account deactivated', completed: false },
    ],
  },
  {
    id: 'LC-003',
    user: 'Anna Schmidt',
    email: 'anna.s@forskale.com',
    type: 'onboarding',
    status: 'completed',
    requester: 'HR - Maria Garcia',
    created_at: '2024-10-28',
    target_date: '2024-11-01',
    completed_date: '2024-11-01',
    steps: [
      { name: 'HR request submitted', completed: true, completed_at: '2024-10-28' },
      { name: 'Manager approval', completed: true, completed_at: '2024-10-29' },
      { name: 'Account created', completed: true, completed_at: '2024-10-30' },
      { name: 'MFA enrollment', completed: true, completed_at: '2024-10-31' },
      { name: 'Welcome email sent', completed: true, completed_at: '2024-11-01' },
    ],
  },
]

export default function AdminLifecyclePage() {
  const [requests, setRequests] = useState<LifecycleRequest[]>(LIFECYCLE_REQUESTS)
  const [filter, setFilter] = useState<'all' | 'onboarding' | 'offboarding' | 'transfer'>('all')
  const [selectedRequest, setSelectedRequest] = useState<LifecycleRequest | null>(null)

  const filteredRequests = requests.filter(r => filter === 'all' || r.type === filter)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">Pending</Badge>
      case 'in_progress': return <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed': return <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled': return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
      default: return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'onboarding': return <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Onboarding</Badge>
      case 'offboarding': return <Badge variant="destructive" className="text-[10px]">Offboarding</Badge>
      case 'transfer': return <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800">Transfer</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
        Lifecycle management handles user onboarding and offboarding — satisfying ISO A.6.1 (screening) and A.6.5 (termination responsibilities). Each request follows an approved workflow with manager and HR involvement.
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total requests</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">In progress</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#639922' }}>{requests.filter(r => r.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#EF9F27' }}>{requests.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Completed (30d)</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#1D9E75' }}>{requests.filter(r => r.status === 'completed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Lifecycle requests</div>
            <div className="flex gap-2">
              {(['all', 'onboarding', 'offboarding', 'transfer'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{request.id}</span>
                      {getTypeBadge(request.type)}
                    </div>
                    <div className="text-sm font-medium mt-1">{request.user}</div>
                    <div className="text-[11px] text-gray-400">{request.email}</div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {request.status === 'completed' ? `Completed: ${request.completed_date}` : `Target: ${request.target_date}`}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] text-gray-500 mb-1">Progress</div>
                  <div className="flex gap-1">
                    {request.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                        title={step.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lifecycle request: {selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">User</div>
                  <div className="text-sm font-medium">{selectedRequest.user}</div>
                  <div className="text-[11px] text-gray-400">{selectedRequest.email}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-[10px] text-gray-500">Type</div>
                  <div className="text-sm font-medium capitalize">{selectedRequest.type}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium mb-2">Workflow steps</div>
                <div className="space-y-2">
                  {selectedRequest.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        step.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>{step.name}</div>
                        {step.completed_at && <div className="text-[10px] text-gray-400">{step.completed_at}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedRequest(null)}>Close</Button>
                {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                  <Button className="flex-1 bg-blue-600">Take action</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}