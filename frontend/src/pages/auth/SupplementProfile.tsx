import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Check, Building2, Users, Search, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { authAPI, companiesAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const supplementSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  industry: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  terms_accepted: z.boolean().refine((val) => val === true, 'You must accept the Terms of Service'),
  gdpr_consent: z.boolean().refine((val) => val === true, 'You must consent to data processing'),
  // User must choose workspace role (no default)
  workspace_role: z.enum(['owner', 'member'], { required_error: 'Please choose your role (Owner or Member).' }),
  company_id: z.string().optional(),
  company_name: z.string().optional(),
  company_website: z.string().optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  company_country: z.string().optional(),
}).refine((data) => {
  // If owner, company_name is required
  if (data.workspace_role === 'owner') {
    return !!data.company_name
  }
  // If member, company_id is required
  if (data.workspace_role === 'member') {
    return !!data.company_id
  }
  return true
}, {
  message: 'Company information is required',
  path: ['company_name']
})

type SupplementForm = z.infer<typeof supplementSchema>

const industries = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
]

export default function SupplementProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewUser = searchParams.get('is_new') === 'true'

  // Check if user already has a company (from auto-detection)
  const hasExistingCompany = !!user?.company_id

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<SupplementForm>({
    resolver: zodResolver(supplementSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone: user?.phone ?? '',
      industry: user?.industry ?? '',
      language: user?.language ?? 'en',
      terms_accepted: user?.terms_accepted ?? false,
      gdpr_consent: user?.gdpr_consent ?? false,
      workspace_role: (user?.workspace_role as 'owner' | 'member') || undefined,
      company_id: user?.company_id ?? undefined,
      company_name: user?.company_name ?? '',
      company_website: '',
      company_phone: '',
      company_address: '',
      company_country: '',
    },
  })

  const workspaceRole = watch('workspace_role')

  // Load companies list if role is member
  useEffect(() => {
    if (workspaceRole === 'member') {
      loadCompanies()
    }
  }, [workspaceRole])

  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const response = await companiesAPI.getPublicCompanies()
      const companiesList = response.data || []
      setCompanies(companiesList)
      setFilteredCompanies(companiesList)
    } catch (error: any) {
      console.error('Failed to load companies:', error)
      toast.error('Failed to load companies list')
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Filter companies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies)
    } else {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCompanies(filtered)
    }
  }, [searchQuery, companies])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false)
      }
    }

    if (showCompanyDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCompanyDropdown])

  const handleCompanySelect = (companyId: string) => {
    setValue('company_id', companyId)
    setShowCompanyDropdown(false)
    const selectedCompany = companies.find(c => c.id === companyId)
    if (selectedCompany) {
      setSearchQuery(selectedCompany.name)
    }
  }

  // Update search query when company_id changes externally
  useEffect(() => {
    const companyId = watch('company_id')
    if (companyId) {
      const selectedCompany = companies.find(c => c.id === companyId)
      if (selectedCompany && searchQuery !== selectedCompany.name) {
        setSearchQuery(selectedCompany.name)
      }
    }
  }, [watch('company_id'), companies])

  const onSubmit = async (data: SupplementForm) => {
    setIsLoading(true)
    try {
      const response = await authAPI.supplementProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
        industry: data.industry || undefined,
        language: data.language,
        workspace_role: data.workspace_role,
        company_id: data.company_id || undefined,
        company_name: data.company_name || undefined,
        company_website: data.company_website || undefined,
        company_phone: data.company_phone || undefined,
        company_address: data.company_address || undefined,
        company_country: data.company_country || undefined,
      })
      updateUser(response.data)
      toast.success('Profile updated. Welcome to Atlas!')
      navigate('/atlas/calendar', { state: { showWelcome: isNewUser }, replace: true })
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to save profile'
      toast.error(Array.isArray(message) ? message[0] : message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Complete your profile
          </h1>
          <p className="text-gray-600 font-light">
            Add a few details so we can personalize your experience. You can change these later.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  {...register('first_name')}
                  type="text"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="First name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  {...register('last_name')}
                  type="text"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry (optional)</label>
              <select
                {...register('industry')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select industry</option>
                {industries.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                {...register('language')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Workspace Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center justify-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  workspaceRole === 'owner' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    {...register('workspace_role')}
                    type="radio"
                    value="owner"
                    className="sr-only"
                  />
                  <Building2 className={`h-8 w-8 mb-2 ${workspaceRole === 'owner' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <div className={`font-semibold ${workspaceRole === 'owner' ? 'text-blue-900' : 'text-gray-900'}`}>Owner</div>
                    <div className="text-xs text-gray-500 mt-1">Create new company</div>
                  </div>
                </label>
                
                <label className={`relative flex flex-col items-center justify-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                  workspaceRole === 'member' 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    {...register('workspace_role')}
                    type="radio"
                    value="member"
                    className="sr-only"
                  />
                  <Users className={`h-8 w-8 mb-2 ${workspaceRole === 'member' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <div className={`font-semibold ${workspaceRole === 'member' ? 'text-green-900' : 'text-gray-900'}`}>Member</div>
                    <div className="text-xs text-gray-500 mt-1">Join existing company</div>
                  </div>
                </label>
              </div>
              {errors.workspace_role && (
                <p className="mt-2 text-sm text-red-600">{errors.workspace_role.message}</p>
              )}
              {hasExistingCompany && (
                <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  <strong>Note:</strong> Your account is already linked to <strong>{user?.company_name}</strong>. You can still change your role if needed.
                </p>
              )}
            </div>

            {/* Show info if user already has company */}
            {hasExistingCompany && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Company Already Linked</p>
                    <p className="text-sm text-green-700">
                      Your account has been automatically linked to <strong>{user?.company_name}</strong> based on your email domain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Company Form - Owner */}
            {workspaceRole === 'owner' && (
              <div className="space-y-4 p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Company Information
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fill in the information to create a new company
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('company_name')}
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website (optional)
                    </label>
                    <input
                      {...register('company_website')}
                      type="url"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      {...register('company_phone')}
                      type="tel"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (optional)
                  </label>
                  <input
                    {...register('company_address')}
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country (optional)
                  </label>
                  <input
                    {...register('company_country')}
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            )}

            {/* Company Selection - Member */}
            {workspaceRole === 'member' && (
              <div className="space-y-4 p-5 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Select Company
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Search and select the company you want to join
                </p>
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-600">Loading companies...</span>
                  </div>
                ) : (
                  <div className="relative" ref={companyDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Company <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setShowCompanyDropdown(true)
                          if (e.target.value === '') {
                            setValue('company_id', '')
                          }
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        placeholder="Type company name to search..."
                        className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setValue('company_id', '')
                            setShowCompanyDropdown(false)
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Company Dropdown */}
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompanies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => handleCompanySelect(company.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                              watch('company_id') === company.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.industry && (
                              <div className="text-sm text-gray-500">{company.industry}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {showCompanyDropdown && searchQuery && filteredCompanies.length === 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4">
                        <p className="text-sm text-gray-500 text-center">
                          No companies found
                        </p>
                      </div>
                    )}
                    
                    {/* Selected Company Display */}
                    {watch('company_id') && (
                      <div className="mt-3 p-3 bg-white border-2 border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {companies.find(c => c.id === watch('company_id'))?.name}
                            </p>
                            {companies.find(c => c.id === watch('company_id'))?.industry && (
                              <p className="text-sm text-gray-500">
                                {companies.find(c => c.id === watch('company_id'))?.industry}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setValue('company_id', '')
                              setSearchQuery('')
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {errors.company_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.company_id.message}</p>
                    )}
                    {companies.length === 0 && !loadingCompanies && (
                      <p className="mt-2 text-sm text-gray-500">
                        No companies available. Please create one as Owner.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('terms_accepted')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms of Service</a>.
                </span>
              </label>
              {errors.terms_accepted && (
                <p className="text-sm text-red-600">{errors.terms_accepted.message}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('gdpr_consent')}
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I consent to data processing in line with the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a> (GDPR).
                </span>
              </label>
              {errors.gdpr_consent && (
                <p className="text-sm text-red-600">{errors.gdpr_consent.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Continue to Atlas
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
