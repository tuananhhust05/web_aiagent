import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { campaignsAPI, prioritizedProspectsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PrioritizedProspectsList from '../components/PrioritizedProspectsList'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
}

export default function AISalesCopilotPage() {
  const navigate = useNavigate()
  const activeTab: 'dashboard' | 'campaigns' = 'dashboard'
  const [timeFilter, setTimeFilter] = useState<'today' | 'thisWeek'>('today')

  // Fetch campaigns
  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns-for-copilot'],
    queryFn: () => campaignsAPI.getCampaigns({ limit: 100 }),
  })
  
  const queryClient = useQueryClient()
  
  // Fetch prioritized prospects
  const { data: prioritizedProspectsResponse, isLoading: prospectsLoading } = useQuery({
    queryKey: ['prioritized-prospects'],
    queryFn: () => prioritizedProspectsAPI.getPrioritizedProspects({ page: 1, limit: 100 }),
    enabled: activeTab === 'dashboard'
  })

  // Generate prioritized prospects mutation
  const generateMutation = useMutation({
    mutationFn: (limit?: number) => prioritizedProspectsAPI.generate({ limit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prioritized-prospects'] })
    }
  })

  const prioritizedProspects = prioritizedProspectsResponse?.data?.prospects || []

  // Calculate deals count (number of prioritized prospects)
  const dealsCount = prioritizedProspects.length

  const campaigns: Campaign[] = campaignsResponse?.data || []

  // Dashboard Tab
  if (activeTab === 'dashboard') {
    const handleSelectAction = (prospectId: string, actionId: string) => {
      navigate(`/ai-sales-copilot/${prospectId}/${actionId}`)
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Header Section */}
          <div className="mb-8">
            <div style={{paddingRight:0, paddingBottom:0}} className="relative overflow-hidden bg-white rounded-3xl border border-sky-100 shadow-xl shadow-sky-100/60 px-8 py-6 flex items-center justify-between">
              {/* Left: Logo, Greeting, Deals */}
              <div className="space-y-4 relative z-10 flex-1">
                {/* Logo and Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Atlas</h1>
                </div>

                {/* Greeting */}
                <div>
                  <p className="text-lg text-gray-800">
                    Hello, I'm Atlas, your <span className="font-semibold">AI Sales Coach</span>.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    I'm here to help you close your deals.
                  </p>
                </div>

                {/* Deals Counter */}
                <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="text-sm text-gray-700">
                    Deals Atlas is pushing today:{' '}
                    <span className="font-semibold text-gray-900">{dealsCount}</span>
                  </p>
                </div>
              </div>

              {/* Right: AI Sales Coach Image */}
              <div className="relative z-10 flex-shrink-0 ml-6">
                <div className="relative w-48 h-48 md:w-56 md:h-56 bg-white rounded-2xl">
                  {/* AI Sales Coach Image */}
                  <img
                    style={{position:'absolute',right:'-20px'}}
                    src="/images/ai_sales_coach.png"
                    alt="AI Sales Coach"
                    className="relative w-full h-full object-contain object-center"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="inline-flex space-x-1 bg-white/70 backdrop-blur-xl rounded-full p-1 border border-sky-100 shadow-sm">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                  timeFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('thisWeek')}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                  timeFilter === 'thisWeek'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          {/* Main Content - Table Layout */}
          <div className="mb-6">
            {prospectsLoading ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-100 p-12 text-center">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-gray-500 mt-4">Loading prioritized prospects...</p>
              </div>
            ) : (
              <PrioritizedProspectsList
                prospects={prioritizedProspects}
                selectedProspectId={null}
                selectedActionId={null}
                onSelectAction={handleSelectAction}
                onRegenerate={() => generateMutation.mutate(50)}
                isGenerating={generateMutation.isPending}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show campaigns list
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading campaigns...</p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-100 p-12 text-center max-w-2xl mx-auto shadow-lg shadow-sky-100/60">
            <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-sky-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-500">
              Create a campaign first to use AI Sales Coach.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-sky-100 p-6 hover:border-blue-300 hover:shadow-xl hover:shadow-sky-200/70 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-7 w-7 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">{campaign.description}</p>
                    )}
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs rounded-full border font-medium ${
                      campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      campaign.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
