import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PasswordPolicy {
  min_length: number
  min_zxcvbn_score: number
  max_password_history: number
  privileged_expiry_days: number
  standard_expiry_days: number
  lockout_attempts: number
  lockout_duration_minutes: number
  require_mfa_for_privileged: boolean
}

interface MFAMethod {
  id: string
  name: string
  description: string
  enabled: boolean
  users_enabled: number
}

interface SessionPolicy {
  idle_timeout_minutes: number
  max_session_hours: number
  allow_multiple_sessions: boolean
  require_reauth_for_sensitive: boolean
}

const DEFAULT_POLICY: PasswordPolicy = {
  min_length: 12,
  min_zxcvbn_score: 3,
  max_password_history: 5,
  privileged_expiry_days: 30,
  standard_expiry_days: 90,
  lockout_attempts: 5,
  lockout_duration_minutes: 30,
  require_mfa_for_privileged: true,
}

const MFA_METHODS: MFAMethod[] = [
  { id: 'totp', name: 'Authenticator App (TOTP)', description: 'Google Authenticator, Authy, Microsoft Authenticator', enabled: true, users_enabled: 42 },
  { id: 'email', name: 'Email OTP', description: 'One-time code sent to registered email', enabled: true, users_enabled: 45 },
  { id: 'sms', name: 'SMS OTP', description: 'One-time code sent to mobile phone', enabled: false, users_enabled: 0 },
  { id: 'webauthn', name: 'Hardware Key (WebAuthn)', description: 'YubiKey, Face ID, Touch ID', enabled: true, users_enabled: 12 },
]

const DEFAULT_SESSION: SessionPolicy = {
  idle_timeout_minutes: 30,
  max_session_hours: 8,
  allow_multiple_sessions: false,
  require_reauth_for_sensitive: true,
}

export default function AdminMFAPage() {
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY)
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>(MFA_METHODS)
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>(DEFAULT_SESSION)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<'password' | 'mfa' | 'session'>('password')
  const [tempPolicy, setTempPolicy] = useState<any>(DEFAULT_POLICY)

  const handleSavePolicy = () => {
    if (editingPolicy === 'password') {
      setPasswordPolicy(tempPolicy)
    } else if (editingPolicy === 'session') {
      setSessionPolicy(tempPolicy)
    }
    toast.success('Policy updated successfully')
    setShowPolicyDialog(false)
  }

  const toggleMFAMethod = (methodId: string) => {
    setMfaMethods(methods => methods.map(m => 
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    ))
    toast.success('MFA method updated')
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
        Authentication policies enforce how users prove their identity — satisfying ISO A.8.5 (secure authentication) and A.5.17 (authentication information). Changes take effect on next login.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">MFA coverage</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#D85A30' }}>98%</div>
            <div className="text-[11px] text-gray-400 mt-0.5">2 exceptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Password policy</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#185FA5' }}>v2.1</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Updated 3d ago</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Session timeout</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: '#1D9E75' }}>{sessionPolicy.idle_timeout_minutes}m</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Idle timeout</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Password policy</div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs"
              onClick={() => { setEditingPolicy('password'); setTempPolicy(passwordPolicy); setShowPolicyDialog(true); }}
            >
              Edit policy
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Min length</div>
              <div className="text-xl font-semibold mt-1">{passwordPolicy.min_length}</div>
              <div className="text-[10px] text-gray-400">characters</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Min strength</div>
              <div className="text-xl font-semibold mt-1">{passwordPolicy.min_zxcvbn_score}/4</div>
              <div className="text-[10px] text-gray-400">zxcvbn score</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">History</div>
              <div className="text-xl font-semibold mt-1">{passwordPolicy.max_password_history}</div>
              <div className="text-[10px] text-gray-400">previous passwords</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Lockout</div>
              <div className="text-xl font-semibold mt-1">{passwordPolicy.lockout_attempts}</div>
              <div className="text-[10px] text-gray-400">failed attempts</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border rounded-lg p-3">
              <div className="text-xs font-medium mb-2">Privileged accounts</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">{passwordPolicy.privileged_expiry_days} days</div>
                  <div className="text-[10px] text-gray-400">password expiry</div>
                </div>
                {passwordPolicy.require_mfa_for_privileged && (
                  <Badge variant="default" className="text-[10px] bg-green-100 text-green-800">MFA required</Badge>
                )}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs font-medium mb-2">Standard accounts</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">{passwordPolicy.standard_expiry_days} days</div>
                  <div className="text-[10px] text-gray-400">password expiry</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">MFA methods</div>
            <span className="text-[10px] text-gray-500">ISO A.8.5</span>
          </div>

          <div className="space-y-3">
            {mfaMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {method.id === 'totp' && '🔐'}
                    {method.id === 'email' && '📧'}
                    {method.id === 'sms' && '📱'}
                    {method.id === 'webauthn' && '🔑'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{method.name}</div>
                    <div className="text-[11px] text-gray-400">{method.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.enabled && (
                    <span className="text-[10px] text-gray-500">{method.users_enabled} users</span>
                  )}
                  <Switch 
                    checked={method.enabled} 
                    onCheckedChange={() => toggleMFAMethod(method.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">Session policy</div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs"
              onClick={() => { setEditingPolicy('session'); setTempPolicy(sessionPolicy); setShowPolicyDialog(true); }}
            >
              Edit policy
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Idle timeout</div>
              <div className="text-lg font-semibold mt-1">{sessionPolicy.idle_timeout_minutes} min</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Max session</div>
              <div className="text-lg font-semibold mt-1">{sessionPolicy.max_session_hours} hours</div>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                sessionPolicy.allow_multiple_sessions ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {sessionPolicy.allow_multiple_sessions && <span className="text-white text-[10px]">✓</span>}
              </div>
              <span className="text-xs">Allow multiple sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                sessionPolicy.require_reauth_for_sensitive ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {sessionPolicy.require_reauth_for_sensitive && <span className="text-white text-[10px]">✓</span>}
              </div>
              <span className="text-xs">Re-auth for sensitive actions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {editingPolicy === 'password' ? 'Password' : editingPolicy === 'session' ? 'Session' : 'MFA'} Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingPolicy === 'password' && (
              <>
                <div>
                  <Label className="text-xs">Minimum length</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.min_length}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, min_length: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Minimum zxcvbn score</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.min_zxcvbn_score}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, min_zxcvbn_score: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Password history</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.max_password_history}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, max_password_history: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Privileged expiry (days)</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.privileged_expiry_days}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, privileged_expiry_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Standard expiry (days)</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.standard_expiry_days}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, standard_expiry_days: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}
            {editingPolicy === 'session' && (
              <>
                <div>
                  <Label className="text-xs">Idle timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.idle_timeout_minutes}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, idle_timeout_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Max session hours</Label>
                  <Input 
                    type="number" 
                    value={tempPolicy.max_session_hours}
                    onChange={(e) => setTempPolicy({ ...tempPolicy, max_session_hours: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-blue-600" onClick={handleSavePolicy}>Save changes</Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowPolicyDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}