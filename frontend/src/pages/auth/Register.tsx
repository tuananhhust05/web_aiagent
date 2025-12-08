import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, Zap, CheckCircle, Users, ArrowLeft, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { companiesAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import GoogleAuthButton from '../../components/GoogleAuthButton'

type AccountType = 'company' | 'employee' | null

interface Company {
  id?: string
  _id?: string  // MongoDB returns _id
  name: string
  industry?: string
}

// Helper to get company ID (handles both id and _id)
const getCompanyId = (company: Company | null): string | null => {
  if (!company) return null
  return company.id || company._id || null
}

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  company_id: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  // Load companies when employee registration form is shown
  useEffect(() => {
    if (accountType === 'employee') {
      loadCompanies()
    }
  }, [accountType])

  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const response = await companiesAPI.getPublicCompanies()
      console.log('📋 Companies loaded from API:', response.data)
      setCompanies(response.data)
    } catch (error) {
      console.error('Failed to load companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const companyId = getCompanyId(selectedCompany)
      console.log('📝 Registering with company_id:', companyId, 'selectedCompany:', selectedCompany)
      
      await signUp({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        username: data.username,
        password: data.password,
        company_id: companyId,
      })
      toast.success('Account created successfully!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = (data: any) => {
    const { user, is_new_user } = data
    if (is_new_user) {
      toast.success(`Welcome to For Skale, ${user.first_name}!`)
      navigate('/onboarding')
    } else {
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate('/dashboard')
    }
  }

  const handleGoogleError = (error: string) => {
    toast.error(error)
  }

  const features = [
    {
      icon: CheckCircle,
      title: 'Multi-Channel Marketing',
      description: 'Voice calls, email, WhatsApp, Telegram, LinkedIn'
    },
    {
      icon: CheckCircle,
      title: 'Unified Dashboard',
      description: 'Manage all channels from one platform'
    },
    {
      icon: CheckCircle,
      title: 'Advanced Analytics',
      description: 'Track performance across all channels'
    }
  ]

  // If company is selected, redirect to company registration
  const handleAccountTypeSelect = (type: AccountType) => {
    if (type === 'company') {
      navigate('/register-company')
    } else {
      setAccountType(type)
    }
  }

  // Account Type Selection UI
  if (accountType === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">
              Choose your account type
            </h1>
            <p className="text-gray-600 leading-relaxed font-light text-lg">
              Select how you want to use For Skale
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Company Card */}
            <button
              onClick={() => handleAccountTypeSelect('company')}
              className="group bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-8 text-left transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-600 group-hover:to-blue-500 transition-all duration-300">
                <Building2 className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Register as Company
              </h3>
              <p className="text-gray-600 font-light mb-4">
                Create a company account to manage your team, workflows, and campaigns. Ideal for businesses and organizations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Manage team members
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Role-based permissions
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Create custom workflows
                </li>
              </ul>
              <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                Get started <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            </button>

            {/* Employee Card */}
            <button
              onClick={() => handleAccountTypeSelect('employee')}
              className="group bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-8 text-left transition-all duration-300 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-600 group-hover:to-emerald-500 transition-all duration-300">
                <Users className="h-7 w-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Register as Employee
              </h3>
              <p className="text-gray-600 font-light mb-4">
                Join as an individual user or employee. You can join existing company teams or work independently.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Personal dashboard
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Join company teams
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Execute campaigns
                </li>
              </ul>
              <div className="mt-6 flex items-center text-emerald-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                Get started <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-gray-600 font-light">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Registration Form */}
        <div>
          {/* Back Button */}
          <button
            onClick={() => setAccountType(null)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to account type
          </button>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl shadow-blue-600/20">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">
              Create employee account
            </h1>
            <p className="text-gray-600 leading-relaxed font-light">
              Join as an individual user or employee to start using For Skale
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      {...register('first_name')}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      {...register('last_name')}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('username')}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Company Selection Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Choose the company you belong to. Leave empty to register as an independent user.
                </p>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <button
                    type="button"
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light text-left bg-white"
                  >
                    {selectedCompany ? (
                      <span className="text-gray-900">{selectedCompany.name}</span>
                    ) : (
                      <span className="text-gray-400">Select a company...</span>
                    )}
                  </button>
                  <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform duration-200 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                  
                  {/* Dropdown */}
                  {showCompanyDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-64 overflow-hidden">
                      {/* Search */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Options */}
                      <div className="max-h-48 overflow-y-auto">
                        {loadingCompanies ? (
                          <div className="p-4 text-center text-gray-500">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Loading companies...</span>
                          </div>
                        ) : filteredCompanies.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            {companySearch ? 'No companies found' : 'No companies available'}
                          </div>
                        ) : (
                          <>
                            {/* Option to clear selection */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCompany(null)
                                setShowCompanyDropdown(false)
                                setCompanySearch('')
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-500 text-sm border-b border-gray-100"
                            >
                              -- No company (Independent user) --
                            </button>
                            {filteredCompanies.map((company) => (
                              <button
                                key={company.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCompany(company)
                                  setShowCompanyDropdown(false)
                                  setCompanySearch('')
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                  getCompanyId(selectedCompany) === getCompanyId(company) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <div className="font-medium">{company.name}</div>
                                {company.industry && (
                                  <div className="text-xs text-gray-500 capitalize">{company.industry.replace('_', ' ')}</div>
                                )}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedCompany && (
                  <p className="mt-2 text-sm text-emerald-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    You will be registered as an employee of {selectedCompany.name}
                  </p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirm_password')}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="text-sm text-gray-600 font-light">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                    Privacy Policy
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-light">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              variant="register"
            />

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600 font-light">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">
                Scale your marketing across all channels
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                Join thousands of marketers using For Skale to manage voice calls, emails, WhatsApp, Telegram, and LinkedIn campaigns from one platform.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <feature.icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 font-light">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">SM</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah Martinez</h4>
                  <p className="text-sm text-gray-600 font-light">Marketing Director, GrowthCo</p>
                </div>
              </div>
              <p className="text-gray-600 italic font-light">
                "For Skale has transformed our marketing. We can now reach customers across all channels from one platform. Our campaign efficiency increased by 85%."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
