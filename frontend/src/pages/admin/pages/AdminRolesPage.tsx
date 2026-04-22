import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  description: string
  level: string
  users_count: number
  permissions: string[]
  iso_control: string
  last_modified: string
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

const PERMISSIONS: Permission[] = [
  { id: 'user:read', name: 'View users', description: 'Can view user list and profiles', category: 'User Management' },
  { id: 'user:write', name: 'Manage users', description: 'Can create, edit, deactivate users', category: 'User Management' },
  { id: 'role:read', name: 'View roles', description: 'Can view role definitions', category: 'Role Management' },
  { id: 'role:write', name: 'Manage roles', description: 'Can create and modify roles', category: 'Role Management' },
  { id: 'audit:read', name: 'View audit logs', description: 'Can access audit trail', category: 'Audit & Compliance' },
  { id: 'policy:read', name: 'View policies', description: 'Can view security policies', category: 'Policy Management' },
  { id: 'policy:write', name: 'Manage policies', description: 'Can modify security policies', category: 'Policy Management' },
  { id: 'mfa:manage', name: 'Manage MFA', description: 'Can enforce MFA settings', category: 'Security' },
]

const ROLES: Role[] = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full system access with all privileges', level: '1', users_count: 2, permissions: ['*'], iso_control: 'A.5.18', last_modified: '2024-01-15' },
  { id: 'COMPANY_ADMIN', name: 'Company Admin', description: 'Organization-level administrative access', level: '2', users_count: 5, permissions: ['user:*', 'role:read', 'audit:read', 'policy:read', 'mfa:manage'], iso_control: 'A.5.18', last_modified: '2024-02-10' },
  { id: 'IT_ADMIN', name: 'IT Admin', description: 'Technical administration without user deactivation', level: '3', users_count: 8, permissions: ['user:*', 'role:read', 'mfa:manage'], iso_control: 'A.8.2', last_modified: '2024-03-01' },
  { id: 'USER', name: 'Standard User', description: 'Regular employee access', level: '4', users_count: 32, permissions: [], iso_control: 'A.5.18', last_modified: '2024-01-20' },
]

const PERMISSION_CATEGORIES = ['User Management', 'Role Management', 'Audit & Compliance', 'Policy Management', 'Security']

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>(ROLES)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards')

  const getRoleBadgeColor = (level: string) => {
    switch (level) {
      case '1': return 'bg-red-100 text-red-800'
      case '2': return 'bg-purple-100 text-purple-800'
      case '3': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
        Roles define what users can do in the system. Assignments follow least-privilege principle — satisfying ISO A.5.15 (access control policy) and A.8.2 (privileged access rights).
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Defined roles</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#7F77DD' }}>{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Active assignments</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>{roles.reduce((acc, r) => acc + r.users_count, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Role definitions</div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'outline'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button 
                variant={viewMode === 'matrix' ? 'default' : 'outline'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setViewMode('matrix')}
              >
                Matrix
              </Button>
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <div 
                  key={role.id} 
                  className="border rounded-lg p-3 hover:border-purple-300 cursor-pointer transition-colors"
                  onClick={() => { setSelectedRole(role); setShowRoleDialog(true); }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">{role.name}</div>
                    <Badge className={`text-[10px] ${getRoleBadgeColor(role.level)}`}>Level {role.level}</Badge>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-2">{role.description}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">{role.users_count} users</span>
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">{role.iso_control}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-50">
                    <th className="px-3 py-2 font-medium rounded-l-md">Role</th>
                    {PERMISSION_CATEGORIES.map(cat => (
                      <th key={cat} className="px-3 py-2 font-medium text-center">{cat.split(' ')[0]}</th>
                    ))}
                    <th className="px-3 py-2 font-medium rounded-r-md">ISO</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-[10px] text-gray-400">{role.description}</div>
                      </td>
                      {PERMISSION_CATEGORIES.map(cat => {
                        const hasPermission = role.permissions.some(p => p.startsWith(cat.split(':')[0].toLowerCase())) || role.permissions.includes('*')
                        return (
                          <td key={cat} className="px-3 py-2 text-center">
                            {hasPermission ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">{role.iso_control}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-3">Available permissions</div>
          <div className="grid grid-cols-2 gap-3">
            {PERMISSIONS.map((perm) => (
              <div key={perm.id} className="border rounded-lg p-2">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-gray-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium">{perm.name}</div>
                    <div className="text-[10px] text-gray-400">{perm.description}</div>
                    <div className="text-[10px] text-purple-600 mt-1">{perm.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name}</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">{selectedRole.description}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Level</div>
                  <div className="font-medium">{selectedRole.level}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Users</div>
                  <div className="font-medium">{selectedRole.users_count}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">Permissions</div>
                <div className="flex flex-wrap gap-1">
                  {selectedRole.permissions.includes('*') ? (
                    <Badge variant="destructive" className="text-[10px]">Full access (*)</Badge>
                  ) : (
                    selectedRole.permissions.map(p => (
                      <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="text-[10px] text-gray-400">Last modified: {selectedRole.last_modified}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}