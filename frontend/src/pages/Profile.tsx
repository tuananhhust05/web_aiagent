import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Lock,
  // Settings,  // temporarily unused (Voice Agent tab commented out)
  Trash2,
  Save,
  Building2,
  Phone,
  Mail,
  Globe,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { userAPI, authAPI, companiesAPI } from '../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type CompanyForm = z.infer<typeof companySchema>

export default function Profile() {
  const { user, updateUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isCompanyLoading, setIsCompanyLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [, setCompany] = useState<any>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)

  // Check if user is company owner/admin
  const isCompanyOwner = user?.workspace_role === 'owner' || user?.role === 'company_admin'

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company_name: user?.company_name || '',
      industry: user?.industry || '',
      tone: user?.tone || '',
      language: user?.language || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    formState: { errors: companyErrors },
    reset: resetCompanyForm,
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      domain: '',
      website: '',
      phone: '',
      address: '',
      country: '',
      tax_id: '',
    },
  })

  // Load company info if user is owner
  useEffect(() => {
    if (isCompanyOwner && user?.company_id) {
      loadCompany()
    }
  }, [isCompanyOwner, user?.company_id])

  const loadCompany = async () => {
    setLoadingCompany(true)
    try {
      const response = await companiesAPI.getMyCompany()
      setCompany(response.data)
      resetCompanyForm({
        name: response.data.name || '',
        domain: response.data.domain || '',
        website: response.data.website || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        country: response.data.country || '',
        tax_id: response.data.tax_id || '',
      })
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load company information')
      }
    } finally {
      setLoadingCompany(false)
    }
  }

  const onCompanySubmit = async (data: CompanyForm) => {
    setIsCompanyLoading(true)
    try {
      const response = await companiesAPI.updateMyCompany(data)
      setCompany(response.data)
      toast.success('Company information updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update company information')
    } finally {
      setIsCompanyLoading(false)
    }
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      const response = await userAPI.updateProfile(data)
      updateUser(response.data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsPasswordLoading(true)
    try {
      await authAPI.changePassword(data)
      toast.success('Password changed successfully!')
      resetPasswordForm()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteAccount()
      toast.success('Account deleted successfully')
      setShowDeleteConfirm(false)
      // Sign out and clear all data
      signOut()
      // Redirect to login
      navigate('/login', { replace: true })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete account')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    // { id: 'voice', label: 'Voice Agent', icon: Settings },
  ]

  return (
    <div className="h-full overflow-hidden bg-muted/30">
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-12">

        {/* Header */}
        <div className="mb-5 sm:mb-8 flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight mb-1 sm:mb-2">
              Account Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-card shadow-md flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 shadow-md">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-1 sm:gap-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[hsl(var(--forskale-teal))] text-[hsl(var(--forskale-teal))]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-5 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">Personal Information</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Update your account details and preferences</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        {...registerProfile('first_name')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                      />
                    </div>
                    {profileErrors.first_name && (
                      <p className="mt-2 text-sm text-red-500">{profileErrors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        {...registerProfile('last_name')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                      />
                    </div>
                    {profileErrors.last_name && (
                      <p className="mt-2 text-sm text-red-500">{profileErrors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        {...registerProfile('email')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="mt-2 text-sm text-red-500">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="tel"
                        {...registerProfile('phone')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      {...registerProfile('company_name')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                      readOnly={isCompanyOwner}
                    />
                  </div>
                  {isCompanyOwner && (
                    <p className="mt-1 text-xs text-muted-foreground">Edit company details in the Company section below</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Company Information Section - Only for Owners */}
              {isCompanyOwner && (
                <div className="mt-8 pt-8 border-t border-border">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[hsl(var(--forskale-blue)/0.1)] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--forskale-blue))]" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">Company Information</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage your company details and settings</p>
                    </div>
                  </div>

                  {loadingCompany ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-muted-foreground">Loading company information...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerCompany('name')}
                            className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                          />
                          {companyErrors.name && (
                            <p className="mt-2 text-sm text-red-500">{companyErrors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Domain
                          </label>
                          <input
                            type="text"
                            {...registerCompany('domain')}
                            className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                            placeholder="example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Website
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                              type="url"
                              {...registerCompany('website')}
                              className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Phone
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                              type="tel"
                              {...registerCompany('phone')}
                              className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                              placeholder="+1 234 567 8900"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          {...registerCompany('address')}
                          className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                          placeholder="Company address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            {...registerCompany('country')}
                            className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                            placeholder="Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Tax ID
                          </label>
                          <input
                            type="text"
                            {...registerCompany('tax_id')}
                            className="w-full px-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                            placeholder="Tax identification number"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isCompanyLoading}
                          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {isCompanyLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Company Information
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-5 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">Change Password</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Update your password to keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 max-w-full sm:max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      {...registerPassword('current_password')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                    />
                  </div>
                  {passwordErrors.current_password && (
                    <p className="mt-2 text-sm text-red-500">{passwordErrors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      {...registerPassword('new_password')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                    />
                  </div>
                  {passwordErrors.new_password && (
                    <p className="mt-2 text-sm text-red-500">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      {...registerPassword('confirm_password')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-[hsl(var(--forskale-teal))] focus:border-[hsl(var(--forskale-teal))] transition-all duration-200"
                    />
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="mt-2 text-sm text-red-500">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isPasswordLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      {/* Danger Zone */}
      <div className="mt-8 sm:mt-12">
        <div className="bg-card rounded-2xl shadow-sm border border-red-500/20 p-4 sm:p-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Danger Zone</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Irreversible and destructive actions</p>
            </div>
          </div>

          <div className="border-t border-red-500/20 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h4 className="font-semibold text-foreground">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-semibold text-sm transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md border border-border">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}