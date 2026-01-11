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
      // Auto-switch to inactive tab after creating campaign (since new campaigns are 'draft' status)
      setActiveTab('inactive');
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
    telegram: kpiData?.channels?.telegram?.sent || 0,
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-[15px]">Loading campaign goal...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Campaign Goal Not Found</h2>
          <p className="text-gray-600 mb-8 text-[15px] leading-relaxed">{error || 'The campaign goal you are looking for does not exist.'}</p>
          <Link
            to="/convention-activities"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Convention Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header - Apple Style */}
        <div className="mb-12">
          <Link
            to="/convention-activities"
            className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">{goal.name}</h1>
              {goal.description && (
                <p className="text-lg text-gray-600 mb-4 leading-relaxed max-w-2xl">{goal.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/campaign-goals/${goal.id}/edit`)}
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 border border-red-200 shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* KPI Section - Apple Style */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8 mb-10 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Goal KPIs</h3>
              <p className="text-gray-600 text-[15px]">Performance snapshot for this goal</p>
            </div>
            {kpiLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl p-6 border border-blue-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contacts Reached</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{formatNumber(totalContactsReached)}</p>
                <p className="text-xs text-gray-500">Unique individuals touched</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <PieChart className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Outreach Attempts</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{formatNumber(outreachAttempts)}</p>
                <p className="text-xs text-gray-500">Messages/calls sent</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200/50 my-8" />

          <div className="space-y-4 mb-8">
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Channel Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 text-center">
                <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(channelMetrics.email)}</div>
              </div>
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 text-center">
                <MessageCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500 mb-1">WhatsApp</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(channelMetrics.whatsapp)}</div>
              </div>
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 text-center">
                <MessageCircle className="h-5 w-5 text-sky-500 mx-auto mb-2" />
                <div className="text-xs text-gray-500 mb-1">Telegram</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(channelMetrics.telegram)}</div>
              </div>
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 text-center">
                <Linkedin className="h-5 w-5 text-sky-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500 mb-1">LinkedIn</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(channelMetrics.linkedin)}</div>
              </div>
              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 text-center">
                <PhoneCall className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <div className="text-xs text-gray-500 mb-1">AI Voice</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(channelMetrics.aiVoice)}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200/50 my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Delivery Success</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {deliveryRate}%
                </p>
                <p className="text-xs text-gray-500">{formatNumber(deliverySuccess)} / {formatNumber(outreachAttempts)}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-2xl p-6 border border-amber-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Engagement Rate</p>
                <p className="text-3xl font-semibold text-gray-900 mb-1">
                  {engagementRate}%
                </p>
                <p className="text-xs text-gray-500">{formatNumber(engagementCount)} / {formatNumber(deliverySuccess)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Workflow Section - Apple Style */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8 mb-10 hover:shadow-md transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Templates</h3>
            <p className="text-gray-600 text-[15px]">Create and manage workflow templates for this goal</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templateCards.map(card => (
              <button
                key={card.type}
                onClick={() => handleOpenTemplate(card.type)}
                className="relative overflow-hidden rounded-2xl border-0 text-left text-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-6 space-y-3">
                  <div className="text-base font-semibold">{card.label}</div>
                  <div className="flex items-center text-xs text-white/90 gap-1.5 group-hover:text-white transition-colors">
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    Open workflow
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns - Apple Style */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Campaigns</h3>
              <p className="text-gray-600 text-[15px]">Active and inactive campaigns for this goal</p>
            </div>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>

          {/* Tabs - Apple Style */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200/50 shadow-sm w-full">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              Active Campaign
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'inactive'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              Inactive Campaign
            </button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[15px]">Loading campaigns...</span>
            </div>
          ) : (() => {
            const activeCampaigns = relatedCampaigns.filter(c => c.status === 'active');
            const inactiveCampaigns = relatedCampaigns.filter(c => c.status !== 'active');
            const displayedCampaigns = activeTab === 'active' ? activeCampaigns : inactiveCampaigns;

            if (displayedCampaigns.length === 0) {
              return (
                <div className="border border-dashed border-gray-200/50 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No {activeTab === 'active' ? 'active' : 'inactive'} campaigns</h3>
                  <p className="text-gray-600 text-[15px]">Create your first campaign to get started</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedCampaigns.map(campaign => (
                  <div key={campaign.id} className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 hover:shadow-md hover:border-gray-300/50 transition-all duration-300 hover:-translate-y-0.5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-[15px] mb-1">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{campaign.description}</div>
                        )}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        campaign.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                        campaign.status === 'paused' || campaign.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        campaign.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'start')}
                            disabled={startingCampaignId === campaign.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            {startingCampaignId === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Start
                          </button>
                        )}
                        {campaign.status === 'active' && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'pause')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Pause
                          </button>
                        )}
                        {(campaign.status === 'paused' || campaign.status === 'inactive') && (
                          <button
                            onClick={() => handleCampaignAction(campaign.id, 'start')}
                            disabled={startingCampaignId === campaign.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            {startingCampaignId === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Resume
                          </button>
                        )}
                        <Link 
                          to={`/campaigns/${campaign.id}`} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'delete')}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
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
