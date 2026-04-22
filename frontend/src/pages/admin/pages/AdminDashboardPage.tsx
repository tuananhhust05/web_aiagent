import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Stats {
  totalUsers: number
  activeSessions: number
  mfaCoverage: number
  pendingReviews: number
}

interface RecentActivity {
  id: string
  title: string
  time: string
  category: string
  color: string
}

interface ControlCoverage {
  control: string
  description: string
  coverage: number
  color: string
}

interface PendingAction {
  item: string
  type: string
  isoControl: string
  due: string
  urgency: 'today' | 'overdue' | 'soon'
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 47,
    activeSessions: 19,
    mfaCoverage: 98,
    pendingReviews: 2,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/admin/dashboard/stats')
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const recentActivity: RecentActivity[] = [
    { id: '1', title: 'Sara M. — account activated', time: '2 min ago • Onboarding', category: 'Onboarding', color: '#185FA5' },
    { id: '2', title: 'Tom K. — offboarding initiated', time: '1h ago • HR triggered', category: 'Offboarding', color: '#E24B4A' },
    { id: '3', title: 'Access review overdue — Finance', time: '6h ago • Auto alert', category: 'Access Review', color: '#EF9F27' },
    { id: '4', title: 'Quarterly review completed — Dev', time: '2d ago • 100% signed off', category: 'Access Review', color: '#639922' },
    { id: '5', title: 'Password policy v2.1 enforced', time: '3d ago • Security', category: 'Security', color: '#1D9E75' },
  ]

  const controlCoverage: ControlCoverage[] = [
    { control: 'A.5.15 — Access control policy', coverage: 100, description: 'Access control policy', color: '#185FA5' },
    { control: 'A.5.16 — Identity management', coverage: 100, description: 'Identity management', color: '#185FA5' },
    { control: 'A.5.17 — Authentication info', coverage: 96, description: 'Authentication information', color: '#639922' },
    { control: 'A.5.18 — Access rights', coverage: 92, description: 'Access rights management', color: '#639922' },
    { control: 'A.6.1 — Screening', coverage: 100, description: 'Background screening', color: '#185FA5' },
    { control: 'A.6.5 — Responsibilities after termination', coverage: 100, description: 'Termination responsibilities', color: '#185FA5' },
    { control: 'A.8.2 — Privileged access', coverage: 88, description: 'Privileged access rights', color: '#EF9F27' },
    { control: 'A.8.5 — Secure auth', coverage: 100, description: 'Secure authentication', color: '#185FA5' },
  ]

  const pendingActions: PendingAction[] = [
    { item: 'Tom K. — revoke all access', type: 'Offboarding', isoControl: 'A.6.5', due: 'Today', urgency: 'today' },
    { item: 'Finance team — quarterly review', type: 'Access review', isoControl: 'A.5.18', due: 'Overdue', urgency: 'overdue' },
    { item: 'Dev team — MFA exception expires', type: 'MFA', isoControl: 'A.8.5', due: '3 days', urgency: 'soon' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Total users</div>
            <div className="text-2xl font-semibold mt-1">{stats.totalUsers}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">3 pending onboard</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Active sessions</div>
            <div className="text-2xl font-semibold mt-1">{stats.activeSessions}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">2 privileged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">MFA coverage</div>
            <div className="text-2xl font-semibold mt-1">{stats.mfaCoverage}%</div>
            <div className="text-[11px] text-gray-400 mt-0.5">1 exception granted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Access reviews due</div>
            <div className="text-2xl font-semibold mt-1">{stats.pendingReviews}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Next: 14 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-4">Recent activity</div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" 
                    style={{ backgroundColor: activity.color }}
                  />
                  <div>
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-[10px] text-gray-400">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-4">ISO 27001 control coverage</div>
            <div className="space-y-3">
              {controlCoverage.map((item) => (
                <div key={item.control}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">{item.control}</span>
                    <span className="font-medium">{item.coverage}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded mt-1 overflow-hidden">
                    <div 
                      className="h-full rounded transition-all" 
                      style={{ width: `${item.coverage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-4">Pending actions requiring attention</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">ISO control</th>
                <th className="pb-2 font-medium">Due</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingActions.map((action, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-0">
                  <td className="py-2">{action.item}</td>
                  <td className="py-2">
                    <Badge 
                      variant={action.type === 'Offboarding' ? 'destructive' : action.type === 'Access review' ? 'secondary' : 'outline'}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {action.type}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">
                      {action.isoControl}
                    </span>
                  </td>
                  <td className="py-2" style={{ color: action.urgency === 'overdue' || action.urgency === 'today' ? '#A32D2D' : undefined }}>
                    {action.due}
                  </td>
                  <td className="py-2">
                    <Button 
                      variant={action.type === 'Offboarding' ? 'destructive' : 'default'} 
                      size="sm" 
                      className="h-6 text-[10px] px-2"
                    >
                      {action.type === 'Offboarding' ? 'Revoke now' : action.type === 'Access review' ? 'Start review' : 'Review'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}