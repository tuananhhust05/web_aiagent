import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Download, FileText, Calendar, Clock, CheckCircle, AlertTriangle, Users, Shield, Key, FileBarChart } from 'lucide-react'

interface Report {
  id: string
  name: string
  description: string
  type: 'user_access' | 'privilege_review' | 'compliance' | 'audit_summary' | 'policy_violation'
  generated_at: string
  period: string
  status: 'ready' | 'generating' | 'scheduled'
  size?: string
  download_url?: string
}

interface ScheduledReport {
  id: string
  name: string
  type: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  next_run: string
  recipients: string[]
  enabled: boolean
}

const AVAILABLE_REPORTS: Report[] = [
  { id: 'RPT-001', name: 'User access summary', description: 'All active users, their roles and last login', type: 'user_access', generated_at: '2024-10-20', period: '2024-10', status: 'ready', size: '245 KB' },
  { id: 'RPT-002', name: 'Privileged access review', description: 'Users with privileged access and their activity', type: 'privilege_review', generated_at: '2024-10-18', period: '2024-Q4', status: 'ready', size: '1.2 MB' },
  { id: 'RPT-003', name: 'Compliance status', description: 'ISO 27001 control compliance status', type: 'compliance', generated_at: '2024-10-15', period: '2024-Q4', status: 'ready', size: '890 KB' },
  { id: 'RPT-004', name: 'Audit log summary', description: 'Summary of all audit events for the period', type: 'audit_summary', generated_at: '2024-10-22', period: '2024-10', status: 'ready', size: '3.5 MB' },
  { id: 'RPT-005', name: 'Policy violation report', description: 'Users who violated password or session policies', type: 'policy_violation', generated_at: '2024-10-10', period: '2024-09', status: 'ready', size: '156 KB' },
]

const SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: 'SCH-001', name: 'Monthly access review', type: 'privilege_review', frequency: 'monthly', next_run: '2024-11-01', recipients: ['compliance@forskale.com'], enabled: true },
  { id: 'SCH-002', name: 'Weekly audit summary', type: 'audit_summary', frequency: 'weekly', next_run: '2024-10-28', recipients: ['security@forskale.com', 'ciso@forskale.com'], enabled: true },
  { id: 'SCH-003', name: 'Quarterly compliance', type: 'compliance', frequency: 'quarterly', next_run: '2025-01-01', recipients: ['compliance@forskale.com', 'legal@forskale.com'], enabled: false },
]

const REPORT_TYPES: Record<string, { icon: React.ElementType; color: string }> = {
  user_access: { icon: Users, color: '#185FA5' },
  privilege_review: { icon: Shield, color: '#7F77DD' },
  compliance: { icon: FileBarChart, color: '#639922' },
  audit_summary: { icon: FileText, color: '#D4537E' },
  policy_violation: { icon: AlertTriangle, color: '#EF9F27' },
}

export default function AdminReportsPage() {
  const [reports] = useState<Report[]>(AVAILABLE_REPORTS)
  const [scheduledReports] = useState<ScheduledReport[]>(SCHEDULED_REPORTS)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  const handleDownload = (report: Report) => {
    toast.success(`Downloading ${report.name}...`)
    const blob = new Blob([JSON.stringify({
      report_name: report.name,
      period: report.period,
      generated_at: report.generated_at,
      summary: report.description,
    }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.id}-${report.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerateNew = () => {
    toast.success('Report generation started. You will be notified when ready.')
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
        Reports provide documented evidence of IAM activities for internal audits, compliance reviews, and regulatory examinations. All reports should be retained per the data retention policy (7 years for financial records, 3 years for operational).
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total reports</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Ready to download</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#639922' }}>{reports.filter(r => r.status === 'ready').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Scheduled reports</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#7F77DD' }}>{scheduledReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total downloads (30d)</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#D4537E' }}>47</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Available reports</div>
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleGenerateNew}>
              Generate new report
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {reports.map((report) => {
              const TypeIcon = REPORT_TYPES[report.type]?.icon || FileText
              const color = REPORT_TYPES[report.type]?.color || '#185FA5'
              return (
                <div key={report.id} className="border rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <TypeIcon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">{report.id}</div>
                      <div className="text-sm font-medium mt-0.5">{report.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{report.description}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.period}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.generated_at}
                      </div>
                      {report.size && (
                        <div>{report.size}</div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-[10px]"
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Scheduled reports</div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowScheduleDialog(true)}>
              Schedule new report
            </Button>
          </div>

          <div className="space-y-3">
            {scheduledReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${report.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <div className="text-xs font-medium">{report.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {report.frequency} · Next: {report.next_run}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    {report.recipients.map(email => (
                      <div key={email} className="text-[10px] text-gray-400">{email}</div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-3">Report types & evidence mapping</div>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(REPORT_TYPES).map(([type, { icon: Icon, color }]) => (
              <div key={type} className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="text-[10px] font-medium mt-2 capitalize">{type.replace('_', ' ')}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  {type === 'user_access' && 'A.5.16, A.5.18'}
                  {type === 'privilege_review' && 'A.8.2'}
                  {type === 'compliance' && 'A.5.1'}
                  {type === 'audit_summary' && 'A.8.15'}
                  {type === 'policy_violation' && 'A.8.5'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule new report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-gray-500">
              Configure automatic report generation and delivery to specified recipients.
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowScheduleDialog(false)}>
              Save schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}