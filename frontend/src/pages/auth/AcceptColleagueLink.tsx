import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, CheckCircle, Users } from 'lucide-react'
import { companiesAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

export default function AcceptColleagueLink() {
  const { linkToken } = useParams<{ linkToken: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  useEffect(() => {
    if (!linkToken) {
      toast.error('Invalid link')
      navigate('/login')
    }
  }, [linkToken, navigate])

  const handleAccept = async () => {
    if (!linkToken) return

    setIsLoading(true)
    try {
      const response = await companiesAPI.acceptColleagueLink(linkToken)
      const { company } = response.data

      // Update user info if available
      if (user) {
        const updatedUser = { ...user, company_id: company.id, company_name: company.name }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      toast.success(`Successfully joined ${company.name}!`)
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to accept colleague link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">
            Join Company
          </h1>
          <p className="text-gray-600 leading-relaxed font-light">
            You've been invited to join a company as a colleague
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    Colleague Invitation
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    By accepting, your account will be linked to this company. You'll be able to collaborate with your colleagues and access company workflows.
                  </p>
                </div>
              </div>
            </div>

            {companyInfo && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{companyInfo.name}</p>
                    <p className="text-sm text-gray-600">{companyInfo.business_model}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Accept & Join Company'
                )}
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


