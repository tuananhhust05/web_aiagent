import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, User, Target, Play, Pause, Trash } from 'lucide-react';
import { campaignGoalsAPI, campaignsAPI } from '../lib/api';

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

const CampaignGoalDetail: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<CampaignGoal | null>(null);
  const [relatedCampaigns, setRelatedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail();
      fetchRelatedCampaigns();
    }
  }, [goalId]);

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
        await campaignsAPI.startCampaign(campaignId);
        alert('Campaign started successfully!');
      } else if (action === 'pause') {
        await campaignsAPI.pauseCampaign(campaignId);
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
      alert(`Failed to ${action} campaign`);
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Goal Preview */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Goal Preview</h2>
            <div
              className="rounded-lg p-6 text-white font-medium text-center min-h-[120px] flex flex-col justify-center"
              style={{ background: goal.color_gradient }}
            >
              <div className="text-2xl font-bold mb-2">{goal.name}</div>
              {goal.description && (
                <div className="text-lg opacity-90">{goal.description}</div>
              )}
            </div>
          </div>
        </div>

        {/* Goal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <p className="text-gray-900">{goal.name}</p>
              </div>
              
              {goal.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <p className="text-gray-900">{goal.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  goal.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {goal.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {goal.source && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Source</label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {goal.source}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-gray-900">{new Date(goal.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-gray-900">{new Date(goal.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Campaigns Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Campaigns</h3>
          
          {campaignsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading campaigns...</p>
            </div>
          ) : relatedCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No campaigns associated with this goal yet.</p>
              <p className="text-sm text-gray-500 mt-2">Campaigns using this goal will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relatedCampaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Link 
                          to={`/campaigns/${campaign.id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {campaign.name}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.type === 'manual' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {campaign.type}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-gray-600 text-sm mt-1">{campaign.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {campaign.contacts.length} contacts
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'start')}
                          className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </button>
                      )}
                      {campaign.status === 'active' && (
                        <button
                          onClick={() => handleCampaignAction(campaign.id, 'pause')}
                          className="flex items-center px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors"
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </button>
                      )}
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'delete')}
                        className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignGoalDetail;
