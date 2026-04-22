import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ControlCategory {
  id: string
  name: string
  description: string
  controls: Control[]
}

interface Control {
  id: string
  name: string
  description: string
  coverage: number
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable'
  last_reviewed: string
  evidence: string[]
}

const CONTROL_CATEGORIES: ControlCategory[] = [
  {
    id: 'A.5',
    name: 'Information Security Policies',
    description: 'Management direction and support for information security',
    controls: [
      { id: 'A.5.1', name: 'Information security policy', description: 'Policies for information security shall be defined, approved by management, published and communicated to employees', coverage: 100, status: 'compliant', last_reviewed: '2024-10-15', evidence: ['Policy document', 'Management approval'] },
      { id: 'A.5.2', name: 'Review of policies', description: 'Policies shall be reviewed at planned intervals or if significant changes occur', coverage: 100, status: 'compliant', last_reviewed: '2024-10-15', evidence: ['Review records'] },
    ],
  },
  {
    id: 'A.6',
    name: 'Organization of Information Security',
    description: 'Internal organization and responsibilities for information security',
    controls: [
      { id: 'A.6.1', name: 'Screening', description: 'Background verification checks shall be carried out on candidates for employment', coverage: 100, status: 'compliant', last_reviewed: '2024-09-01', evidence: ['HR screening records'] },
      { id: 'A.6.5', name: 'Termination responsibilities', description: 'Information security responsibilities shall remain valid after termination', coverage: 100, status: 'compliant', last_reviewed: '2024-09-15', evidence: ['Offboarding checklist', 'Access revocation logs'] },
    ],
  },
  {
    id: 'A.7',
    name: 'Human Resource Security',
    description: 'Security responsibilities for employees and contractors',
    controls: [
      { id: 'A.7.1', name: 'Background checks', description: 'Employment checks shall be verified before joining', coverage: 100, status: 'compliant', last_reviewed: '2024-09-01', evidence: ['Background check records'] },
      { id: 'A.7.2', name: 'Security awareness', description: 'Employees shall receive appropriate awareness education and training', coverage: 92, status: 'partial', last_reviewed: '2024-08-20', evidence: ['Training records', 'Awareness materials'] },
    ],
  },
  {
    id: 'A.8',
    name: 'Asset Management',
    description: 'Identification, ownership and protection of information assets',
    controls: [
      { id: 'A.8.2', name: 'Privileged access', description: 'The allocation of privileged access rights shall be restricted', coverage: 88, status: 'partial', last_reviewed: '2024-10-01', evidence: ['Privileged access list', 'Review records'] },
      { id: 'A.8.5', name: 'Secure authentication', description: 'Authentication information shall be securely managed', coverage: 100, status: 'compliant', last_reviewed: '2024-10-10', evidence: ['Password policy', 'MFA enrollment records'] },
      { id: 'A.8.15', name: 'Logging', description: 'Logs shall be produced, stored, protected from tampering', coverage: 100, status: 'compliant', last_reviewed: '2024-10-05', evidence: ['Audit log system', 'Hash chain verification'] },
    ],
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant': return <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Compliant</Badge>
    case 'partial': return <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">Partial</Badge>
    case 'non-compliant': return <Badge variant="destructive" className="text-[10px]">Non-compliant</Badge>
    case 'not-applicable': return <Badge variant="outline" className="text-[10px]">N/A</Badge>
    default: return null
  }
}

const getCoverageColor = (coverage: number) => {
  if (coverage >= 95) return '#639922'
  if (coverage >= 80) return '#EF9F27'
  return '#E24B4A'
}

export default function AdminISOCoveragePage() {
  const overallCoverage = Math.round(
    CONTROL_CATEGORIES.flatMap(c => c.controls).reduce((acc, ctrl) => acc + ctrl.coverage, 0) /
    CONTROL_CATEGORIES.flatMap(c => c.controls).length
  )

  const compliantControls = CONTROL_CATEGORIES.flatMap(c => c.controls).filter(c => c.status === 'compliant').length
  const totalControls = CONTROL_CATEGORIES.flatMap(c => c.controls).length

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
        ISO 27001 control coverage shows how well the IAM system satisfies each control requirement. Coverage is measured by automated evidence collection and manual review. This page satisfies A.5.18 (access rights) documentation requirements.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Overall coverage</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: getCoverageColor(overallCoverage) }}>
              {overallCoverage}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">across all controls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Controls assessed</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>
              {totalControls}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">{CONTROL_CATEGORIES.length} categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Fully compliant</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#639922' }}>
              {compliantControls}/{totalControls}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">controls met</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">ISO 27001 control mapping</div>
            <div className="flex gap-2">
              <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Compliant</Badge>
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">Partial</Badge>
              <Badge variant="destructive" className="text-[10px]">Non-compliant</Badge>
            </div>
          </div>

          <div className="space-y-6">
            {CONTROL_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{category.id}</span>
                  <div>
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-[11px] text-gray-400">{category.description}</div>
                  </div>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                  {category.controls.map((control) => (
                    <div key={control.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{control.id}</span>
                            {getStatusBadge(control.status)}
                          </div>
                          <div className="text-sm mt-0.5">{control.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold" style={{ color: getCoverageColor(control.coverage) }}>
                            {control.coverage}%
                          </div>
                        </div>
                      </div>

                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden mb-2">
                        <div 
                          className="h-full rounded transition-all"
                          style={{ width: `${control.coverage}%`, backgroundColor: getCoverageColor(control.coverage) }}
                        />
                      </div>

                      <div className="text-[10px] text-gray-500 mb-1">{control.description}</div>

                      <div className="flex gap-2 mt-2">
                        {control.evidence.map((e, idx) => (
                          <span key={idx} className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border">
                            {e}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] text-gray-400 mt-1">Last reviewed: {control.last_reviewed}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Coverage over time</div>
            <Button variant="outline" size="sm" className="h-8 text-xs">Generate report</Button>
          </div>

          <div className="h-40 flex items-end gap-2">
            {[85, 88, 90, 92, 94, 95, 96, 97, 98, 98].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t transition-all"
                  style={{ 
                    height: `${val}%`, 
                    backgroundColor: getCoverageColor(val),
                    minHeight: '20px'
                  }}
                />
                <span className="text-[9px] text-gray-400">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'][idx]}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-2">2024 Coverage Trend</div>
        </CardContent>
      </Card>
    </div>
  )
}