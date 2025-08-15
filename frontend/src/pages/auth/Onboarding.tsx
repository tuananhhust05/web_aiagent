import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, MessageSquare, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { userAPI, authAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const onboardingSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  tone: z.string().min(1, 'Tone is required'),
  language: z.string().min(1, 'Language is required'),
  gdpr_consent: z.boolean().refine((val) => val === true, 'GDPR consent is required'),
  terms_accepted: z.boolean().refine((val) => val === true, 'Terms acceptance is required'),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

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

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },

  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      industry: user?.industry || '',
      tone: user?.tone || 'professional',
      language: user?.language || 'en',
      gdpr_consent: user?.gdpr_consent || false,
      terms_accepted: user?.terms_accepted || false,
    },
  })

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true)
    try {
      // Update user profile
      const response = await userAPI.updateProfile({
        company_name: data.company_name,
        industry: data.industry,
        tone: data.tone,
        language: data.language,
      })

      // Accept terms and GDPR consent
      await authAPI.acceptTerms()
      await authAPI.gdprConsent()

      updateUser(response.data)
      toast.success('Onboarding completed successfully!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Onboarding failed')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      id: 1,
      title: 'Company Information',
      description: 'Tell us about your business',
      icon: Building2,
    },
    {
      id: 2,
      title: 'Communication Preferences',
      description: 'Set your voice agent style',
      icon: MessageSquare,
    },
    {
      id: 3,
      title: 'Legal & Consent',
      description: 'Terms and privacy policy',
      icon: Check,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-medium text-gray-900">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  {...register('company_name')}
                  type="text"
                  className="input mt-1"
                  placeholder="Enter your company name"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select {...register('industry')} className="input mt-1">
                  <option value="">Select your industry</option>
                  {industries.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Communication Preferences */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                  Communication Tone
                </label>
                <select {...register('tone')} className="input mt-1">
                  {tones.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
                {errors.tone && (
                  <p className="mt-1 text-sm text-red-600">{errors.tone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Primary Language
                </label>
                <select {...register('language')} className="input mt-1">
                  {languages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Legal & Consent */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('terms_accepted')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms_accepted" className="font-medium text-gray-700">
                    I accept the Terms of Service
                  </label>
                  <p className="text-gray-500">
                    By checking this box, you agree to our Terms of Service and acknowledge that
                    you have read and understood them.
                  </p>
                </div>
              </div>
              {errors.terms_accepted && (
                <p className="text-sm text-red-600">{errors.terms_accepted.message}</p>
              )}

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('gdpr_consent')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="gdpr_consent" className="font-medium text-gray-700">
                    I consent to data processing
                  </label>
                  <p className="text-gray-500">
                    I consent to the processing of my personal data in accordance with GDPR
                    requirements and the Privacy Policy.
                  </p>
                </div>
              </div>
              {errors.gdpr_consent && (
                <p className="text-sm text-red-600">{errors.gdpr_consent.message}</p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn btn-outline btn-md"
            >
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn btn-primary btn-md"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-md"
              >
                {isLoading ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
} 