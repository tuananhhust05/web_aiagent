import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Target, ArrowLeft } from 'lucide-react';
import { campaignGoalsAPI, campaignsAPI, conventionActivitiesAPI, groupsAPI, workflowsAPI } from '../lib/api';
import { CreateConventionCampaignModal, ContactSelectorModal } from './ConventionActivities';
import CampaignGoalHeader from '../components/CampaignGoalHeader';
import GoalKPISection from '../components/GoalKPISection';
import GoalTemplatesSection from '../components/GoalTemplatesSection';
import GoalCampaignsSection from '../components/GoalCampaignsSection';
import EditCampaignGoalModal from '../components/EditCampaignGoalModal';
import AISalesCoachWithTodo from '../components/AISalesCoachWithTodo';
import { Brain, BarChart3 } from 'lucide-react';
import { CampaignGoal, Campaign, GoalKPI } from '../components/types/campaignGoal';

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
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<GoalKPI | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mainTab, setMainTab] = useState<'overview' | 'ai-coach'>('overview');

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
        <CampaignGoalHeader 
          goal={goal} 
          onEdit={() => setShowEditModal(true)}
          onDelete={handleDelete} 
        />

        {/* Main Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200/50 shadow-sm w-full">
            <button
              onClick={() => setMainTab('overview')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mainTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setMainTab('ai-coach')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                mainTab === 'ai-coach'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              <Brain className="h-4 w-4" />
              Atlas
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {mainTab === 'overview' && (
          <>
            <GoalKPISection
              kpiData={kpiData}
              kpiLoading={kpiLoading}
              totalContactsReached={totalContactsReached}
            />

            <GoalTemplatesSection goal={goal} workflows={workflows} />

            <GoalCampaignsSection
              campaigns={relatedCampaigns}
              campaignsLoading={campaignsLoading}
              startingCampaignId={startingCampaignId}
              onCreateCampaign={handleCreateCampaign}
              onCampaignAction={handleCampaignAction}
            />
          </>
        )}

        {/* Atlas Tab */}
        {mainTab === 'ai-coach' && goal && (
          <AISalesCoachWithTodo
            goalId={goalId!}
            goalName={goal.name}
            goalDescription={goal.description}
          />
        )}
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

      {/* Edit Goal Modal */}
      {showEditModal && goal && (
        <EditCampaignGoalModal
          goal={goal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchGoalDetail();
          }}
        />
      )}
    </div>
  );
};

export default CampaignGoalDetail;
