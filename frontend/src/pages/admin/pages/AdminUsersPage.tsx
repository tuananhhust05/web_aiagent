import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, UserPlus, RefreshCw } from 'lucide-react'

interface User {
  _id: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  role: string
  is_active: boolean
  locked?: boolean
  mfa_enabled?: boolean
  created_at: string
  last_login?: string
}

interface CreateUserForm {
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  password: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'offboarding'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    role: 'USER',
    password: '',
  })

  const stats = {
    active: users.filter(u => u.is_active && !u.locked).length,
    suspended: users.filter(u => u.locked).length,
    offboarding: 0,
    privileged: users.filter(u => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(u.role)).length,
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/users', { params: { limit: 100 } })
      setUsers(response.data.users || response.data)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      await api.post('/api/admin/users', createForm)
      toast.success('User created successfully')
      setShowCreateDialog(false)
      fetchUsers()
      setCreateForm({ email: '', username: '', first_name: '', last_name: '', role: 'USER', password: '' })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create user')
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/deactivate`)
      toast.success('User deactivated')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to deactivate user')
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/activate`)
      toast.success('User activated')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to activate user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active && !user.locked) ||
      (statusFilter === 'suspended' && user.locked) ||
      (statusFilter === 'offboarding' && !user.is_active)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusBadge = (user: User) => {
    if (!user.is_active) return <Badge variant="destructive" className="text-[10px]">Offboarding</Badge>
    if (user.locked) return <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">Suspended</Badge>
    return <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">Active</Badge>
  }

  const getInitials = (user: User) => {
    return (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        User accounts are created and deprovisioned based on approved HR requests only — satisfying ISO A.5.16 (identity management) and A.5.18 (access rights).
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Suspended</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#EF9F27' }}>{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Offboarding</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#E24B4A' }}>{stats.offboarding}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Privileged</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#7F77DD' }}>{stats.privileged}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">User directory</div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="w-3 h-3 mr-1" /> Provision user
            </Button>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 h-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-8 px-3 text-xs border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="offboarding">Offboarding</option>
            </select>
            <select 
              className="h-8 px-3 text-xs border rounded-md"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
              <option value="USER">User</option>
            </select>
            <Button variant="outline" size="sm" className="h-8" onClick={fetchUsers}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50">
                  <th className="px-3 py-2 font-medium rounded-l-md">User</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">MFA</th>
                  <th className="px-3 py-2 font-medium">Last login</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium rounded-r-md">Access</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-medium">
                          {getInitials(user)}
                        </div>
                        <div>
                          <div className="font-medium">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || user.email}</div>
                          <div className="text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{user.role}</td>
                    <td className="px-3 py-2">
                      {user.mfa_enabled ? (
                        <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">✓ On</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">Off</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{user.last_login || 'Never'}</td>
                    <td className="px-3 py-2">{getStatusBadge(user)}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">A.5.18</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provision new user</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <Input 
                type="email" 
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">First name</label>
                <Input 
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Last name</label>
                <Input 
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Username</label>
              <Input 
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role</label>
              <select 
                className="w-full h-9 px-3 text-sm border rounded-md"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                <option value="USER">User</option>
                <option value="COMPANY_ADMIN">Company Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Temporary password</label>
              <Input 
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-blue-600" onClick={handleCreateUser}>Create user</Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}