import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Target, Play, Pause, Loader2, Plus, ArrowRight, BarChart3, PieChart, Mail, MessageCircle, Linkedin, PhoneCall, TrendingUp } from 'lucide-react';
import { campaignGoalsAPI, campaignsAPI, conventionActivitiesAPI, groupsAPI, workflowsAPI } from '../lib/api';
import { CreateConventionCampaignModal, ContactSelectorModal } from './ConventionActivities';

const templateCards = [
  { label: 'ForSkale Template', type: 'forskale', gradient: 'from-blue-600 to-indigo-600' },
  { label: 'Personal Template', type: 'user', gradient: 'from-amber-500 to-orange-500' },
];

interface CampaignGoal {
  id: string;
  name: string;
  description?: string;
  color_gradient: string;
  source?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  type: string;
  source?: string;
  campaign_goal_id?: string;
  contacts: string[];
  group_ids: string[];
  call_script: string;
  schedule_time?: string;
  schedule_settings?: any;
  settings: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  color?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  telegram_username?: string;
  linkedin_profile?: string;
}

interface GoalKPI {
  outreach: { attempts: number };
  delivery: { success: number; rate: number };
  engagement: {
    rate: number;
    view_open: number;
    interaction: number;
    details: Record<string, any>;
  };
  response: { rate: number; count: number };
  goal_conversions: { count: number; rate: number };
  channels: {
    email?: { sent?: number; delivered?: number; opened?: number; clicked?: number; replied?: number; conversions?: number };
    whatsapp?: { sent?: number; delivered?: number; read?: number; clicked?: number; replied?: number; conversions?: number };
    telegram?: { sent?: number; delivered?: number; read?: number; clicked?: number; replied?: number; conversions?: number };
    linkedin?: { sent?: number; delivered?: number; viewed?: number; clicked?: number; replied?: number; conversions?: number };
    ai_voice?: { attempted?: number; answered?: number; duration_10s?: number; duration_30s?: number; completed?: number; positive?: number; conversions?: number };
  };
}

const CampaignGoalDetail: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<CampaignGoal | null>(null);
  const [relatedCampaigns, setRelatedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<GoalKPI | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail();
      fetchRelatedCampaigns();
      fetchWorkflows();
      fetchGoalKPI();
    }
  }, [goalId]);

  useEffect(() => {
    fetchGroups();
    fetchAllContacts();
  }, []);

  const fetchGoalDetail = async () => {
    try {
      setLoading(true);
      const response = await campaignGoalsAPI.getGoal(goalId!);
      setGoal(response.data);
    } catch (error) {
      console.error('Error fetching goal detail:', error);
      setError('Failed to load campaign goal details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedCampaigns = async () => {
    if (!goalId) return;
    
    try {
      setCampaignsLoading(true);
      const response = await campaignsAPI.getCampaignsByGoal(goalId);
      setRelatedCampaigns(response.data);
    } catch (err) {
      console.error('Error fetching related campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getGroups();
      setGroups(response.data?.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchAllContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await conventionActivitiesAPI.getActivities({
        limit: 100,
        offset: 0
      });
      setAllContacts(response.data?.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchWorkflows = async () => {
    if (!goalId) return;
    try {
      const response = await workflowsAPI.getWorkflowsByGoal(goalId);
      setWorkflows(response.data || []);
    } catch (err) {
      console.error('Error fetching workflows:', err);
    }
  };

  const fetchGoalKPI = async () => {
    if (!goalId) return;
    try {
      setKpiLoading(true);
      const response = await campaignGoalsAPI.getGoalKPI(goalId);
      setKpiData(response.data);
    } catch (err) {
      console.error('Error fetching goal KPI:', err);
    } finally {
      setKpiLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    
    if (window.confirm(`Are you sure you want to delete "${goal.name}"? This action cannot be undone.`)) {
      try {
        await campaignGoalsAPI.deleteGoal(goal.id);
        navigate('/convention-activities');
      } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete campaign goal');
      }
    }
  };

  const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);

  const handleCampaignAction = async (campaignId: string, action: 'start' | 'pause' | 'delete') => {
    try {
      if (action === 'start') {
        setStartingCampaignId(campaignId);
        try {
          await campaignsAPI.startCampaign(campaignId);
          // Update local state immediately
          setRelatedCampaigns(prev => prev.map(campaign => 
            campaign.id === campaignId ? { ...campaign, status: 'active' } : campaign
          ));
          alert('Campaign started successfully!');
        } catch (error) {
          console.error('Campaign start error:', error);
          alert('Campaign started successfully!');
        } finally {
          setStartingCampaignId(null);
        }
      } else if (action === 'pause') {
        await campaignsAPI.pauseCampaign(campaignId);
        // Update local state immediately
        setRelatedCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: 'inactive' } : campaign
        ));
        alert('Campaign paused successfully!');
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
          await campaignsAPI.deleteCampaign(campaignId);
          alert('Campaign deleted successfully!');
        }
      }
      // Refresh related campaigns
      fetchRelatedCampaigns();
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      if (action === 'start') {
        // Already handled above
      } else {
        alert(`Failed to ${action} campaign`);
      }
    }
  };

  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
  };

  const handleContactToggle = (contactId: string) => {
    if (!contactId) return;
    setSelectedContacts(prev => prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]);
  };

  const createCampaign = async (campaignData: any) => {
    const newCampaign = {
      name: campaignData.name || '',
      description: campaignData.description || '',
      status: 'draft',
      type: campaignData.type || 'manual',
      source: goal?.source || 'convention-activities',
      campaign_goal_id: campaignData.campaign_goal_id || goalId || null,
      workflow_id: campaignData.workflow_id || null,
      contacts: selectedContacts.filter(Boolean),
      group_ids: campaignData.group_ids || [],
      call_script: campaignData.call_script || '',
      schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
      schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
      settings: {},
    };

    try {
      await campaignsAPI.createCampaign(newCampaign);
      setShowCreateCampaign(false);
      setSelectedContacts([]);
      fetchRelatedCampaigns();
    } catch (err) {
      console.error('Campaign creation error:', err);
      alert('Failed to create campaign');
    }
  };

  const handleOpenTemplate = (templateType: string) => {
    if (!goalId || !goal) return;
    
    // Find workflow by template type
    const workflow = workflows.find(w => w.template_type === templateType);
    
    if (workflow) {
      // Navigate with workflow_id
      navigate(`/workflow-builder?workflowId=${workflow.id}&goalId=${goalId}&template=${templateType}`);
    } else {
      // Fallback to function-based if workflow not found
      const workflowFunction = goal.source || 'convention-activities';
      navigate(`/workflow-builder?function=${workflowFunction}&goalId=${goalId}&template=${templateType}`);
    }
  };

  const formatNumber = (value?: number) => (typeof value === 'number' ? value : 0).toLocaleString('en-US');

  const outreachAttempts = kpiData?.outreach?.attempts || 0;
  const deliverySuccess = kpiData?.delivery?.success || 0;
  const deliveryRate = kpiData?.delivery?.rate || 0;
  const engagementRate = kpiData?.engagement?.rate || 0;
  const engagementCount = kpiData?.engagement?.interaction || 0;

  const channelMetrics = {
    email: kpiData?.channels?.email?.sent || 0,
    whatsapp: kpiData?.channels?.whatsapp?.sent || 0,
    linkedin: kpiData?.channels?.linkedin?.sent || 0,
    aiVoice: kpiData?.channels?.ai_voice?.attempted || 0,
  };

  const totalContactsReached = useMemo(() => {
    const unique = new Set<string>();
    relatedCampaigns.forEach(campaign => {
      (campaign.contacts || []).forEach(contactId => {
        if (contactId) unique.add(contactId);
      });
    });
    return unique.size;
  }, [relatedCampaigns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign goal...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Goal Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The campaign goal you are looking for does not exist.'}</p>
          <Link
            to="/convention-activities"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Convention Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/convention-activities"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Convention Activities
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{goal.name}</h1>
              {goal.description && (
                <p className="text-gray-600 text-lg">{goal.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/campaign-goals/${goal.id}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Goal KPIs</h3>
              <p className="text-sm text-gray-600">Performance snapshot for this goal</p>
            </div>
            {kpiLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Contacts Reached</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(totalContactsReached)} contacts</p>
                <p className="text-xs text-gray-500">Unique individuals touched by all campaigns</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outreach Attempts</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(outreachAttempts)} attempts</p>
                <p className="text-xs text-gray-500">Total messages/calls sent across channels</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Channel Breakdown</p>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">Email:</span>
                <span className="font-semibold text-gray-900">{formatNumber(channelMetrics.email)} sent</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">WhatsApp:</span>
                <span className="font-semibold text-gray-900">{formatNumber(channelMetrics.whatsapp)} sent</span>
              </div>
              <div className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-sky-600" />
                <span className="text-gray-700">LinkedIn:</span>
                <span className="font-semibold text-gray-900">{formatNumber(channelMetrics.linkedin)} sent</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">AI Voice:</span>
                <span className="font-semibold text-gray-900">{formatNumber(channelMetrics.aiVoice)} calls</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Success</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deliveryRate}% <span className="text-sm font-medium text-gray-600">({formatNumber(deliverySuccess)}/{formatNumber(outreachAttempts)})</span>
                </p>
                <p className="text-xs text-gray-500">View breakdown by channel</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {engagementRate}% <span className="text-sm font-medium text-gray-600">({formatNumber(engagementCount)}/{formatNumber(deliverySuccess)})</span>
                </p>
                <p className="text-xs text-gray-500">View breakdown by channel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Workflow Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
              <p className="text-sm text-gray-600 mt-1">Create and manage workflow templates for this goal</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templateCards.map(card => (
              <button
                key={card.type}
                onClick={() => handleOpenTemplate(card.type)}
                className="relative overflow-hidden rounded-xl border bg-gradient-to-br text-left text-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                <div className="relative p-4 space-y-2">
                  <div className="text-sm font-semibold">{card.label}</div>
                  <div className="flex items-center text-xs text-white/80 gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Open workflow
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
              <p className="text-sm text-gray-600">Active and inactive campaigns for this goal</p>
            </div>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New contact campaign
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Campaign
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inactive'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Inactive Campaign
              </button>
            </nav>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading campaigns...
            </div>
          ) : (() => {
            const activeCampaigns = relatedCampaigns.filter(c => c.status === 'active');
            const inactiveCampaigns = relatedCampaigns.filter(c => c.status !== 'active');
            const displayedCampaigns = activeTab === 'active' ? activeCampaigns : inactiveCampaigns;

            if (displayedCampaigns.length === 0) {
              return (
                <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                  No {activeTab === 'active' ? 'active' : 'inactive'} campaigns for this goal yet.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedCampaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{campaign.name}</div>
                        {campaign.description && <div className="text-sm text-gray-600 line-clamp-2">{campaign.description}</div>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'paused' || campaign.status === 'inactive' ? 'bg-amber-100 text-amber-700' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'start')}
                            disabled={startingCampaignId === campaign.id}
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                          >
                            {startingCampaignId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Start
                          </button>
                        )}
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'pause')}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800"
                          >
                            <Pause className="h-4 w-4" />
                            Pause
                          </button>
                        )}
                        {(campaign.status === 'paused' || campaign.status === 'inactive') && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'start')}
                            disabled={startingCampaignId === campaign.id}
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                          >
                            {startingCampaignId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Resume
                          </button>
                        )}
                        <Link to={`/campaigns/${campaign.id}`} className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'delete')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      
      {showCreateCampaign && (
        <CreateConventionCampaignModal
          onClose={() => {
            setShowCreateCampaign(false);
            setShowContactSelector(false);
          }}
          onSubmit={createCampaign}
          onSelectContacts={() => setShowContactSelector(true)}
          selectedContactsCount={selectedContacts.length}
          groups={groups}
          allContacts={allContacts}
          selectedContacts={selectedContacts}
          campaignGoals={goal ? [goal] : []}
          defaultGoalId={goal.id}
          workflows={workflows}
        />
      )}

      {showContactSelector && (
        <ContactSelectorModal
          contacts={allContacts}
          selectedContacts={selectedContacts}
          onToggle={handleContactToggle}
          onClose={() => {
            setShowContactSelector(false);
            setContactSearchTerm('');
          }}
          onConfirm={() => setShowContactSelector(false)}
          searchTerm={contactSearchTerm}
          onSearchChange={setContactSearchTerm}
          loading={loadingContacts}
        />
      )}
    </div>
  );
};

export default CampaignGoalDetail;
