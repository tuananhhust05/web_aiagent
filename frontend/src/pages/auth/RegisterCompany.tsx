import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, CheckCircle } from 'lucide-react'
import { companiesAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

const registerCompanySchema = z.object({
  // Company fields
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  business_model: z.enum(['b2b', 'b2c', 'b2b2c'], {
    required_error: 'Please select a business model',
  }),
  industry: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  // Admin fields
  admin_email: z.string().email('Please enter a valid email address'),
  admin_first_name: z.string().min(2, 'First name must be at least 2 characters'),
  admin_last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.admin_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type RegisterCompanyForm = z.infer<typeof registerCompanySchema>

export default function RegisterCompany() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCompanyForm>({
    resolver: zodResolver(registerCompanySchema),
  })

  const onSubmit = async (data: RegisterCompanyForm) => {
    setIsLoading(true)
    try {
      const response = await companiesAPI.registerCompany({
        name: data.name,
        business_model: data.business_model,
        industry: data.industry || null,
        website: data.website || null,
        phone: data.phone || null,
        admin_email: data.admin_email,
        admin_first_name: data.admin_first_name,
        admin_last_name: data.admin_last_name,
        admin_password: data.admin_password,
      })
      
      const { access_token, user, company } = response.data
      
      // Store auth data using login method from useAuth
      login(user, access_token)
      
      toast.success(`Company ${company.name} registered successfully!`)
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Company registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: CheckCircle,
      title: 'Company Management',
      description: 'Manage your team and workflows from one place'
    },
    {
      icon: CheckCircle,
      title: 'Role-Based Access',
      description: 'Control permissions for admins and employees'
    },
    {
      icon: CheckCircle,
      title: 'Team Collaboration',
      description: 'Invite colleagues and share best practices'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Registration Form */}
        <div>
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl shadow-blue-600/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">
              Register your company
            </h1>
            <p className="text-gray-600 leading-relaxed font-light">
              Create a company account and become the admin to start managing your team
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Company Information */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="Your Company Name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Model *
                    </label>
                    <select
                      {...register('business_model')}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                    >
                      <option value="">Select business model</option>
                      <option value="b2b">B2B - Business to Business</option>
                      <option value="b2c">B2C - Business to Consumer</option>
                      <option value="b2b2c">B2B2C - Business to Business to Consumer</option>
                    </select>
                    {errors.business_model && (
                      <p className="mt-2 text-sm text-red-600">{errors.business_model.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        {...register('website')}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="https://example.com"
                      />
                      {errors.website && (
                        <p className="mt-2 text-sm text-red-600">{errors.website.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        {...register('admin_email')}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="admin@company.com"
                      />
                    </div>
                    {errors.admin_email && (
                      <p className="mt-2 text-sm text-red-600">{errors.admin_email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          {...register('admin_first_name')}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        />
                      </div>
                      {errors.admin_first_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          {...register('admin_last_name')}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        />
                      </div>
                      {errors.admin_last_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.admin_last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('admin_password')}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.admin_password && (
                      <p className="mt-2 text-sm text-red-600">{errors.admin_password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirm_password')}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-2 text-sm text-red-600">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Register Company
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:block">
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm font-light">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


