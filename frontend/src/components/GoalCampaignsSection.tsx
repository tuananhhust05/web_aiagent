import React, { useState } from 'react';
import { Plus, Loader2, Target } from 'lucide-react';
import { Campaign } from './types/campaignGoal';
import CampaignCard from './CampaignCard';

interface GoalCampaignsSectionProps {
  campaigns: Campaign[];
  campaignsLoading: boolean;
  startingCampaignId: string | null;
  onCreateCampaign: () => void;
  onCampaignAction: (campaignId: string, action: 'start' | 'pause' | 'delete') => void;
}

const GoalCampaignsSection: React.FC<GoalCampaignsSectionProps> = ({
  campaigns,
  campaignsLoading,
  startingCampaignId,
  onCreateCampaign,
  onCampaignAction
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const inactiveCampaigns = campaigns.filter(c => c.status !== 'active');
  const displayedCampaigns = activeTab === 'active' ? activeCampaigns : inactiveCampaigns;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Campaigns</h3>
          <p className="text-gray-600 text-[15px]">Active and inactive campaigns for this goal</p>
        </div>
        <button
          onClick={onCreateCampaign}
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
      ) : displayedCampaigns.length === 0 ? (
        <div className="border border-dashed border-gray-200/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No {activeTab === 'active' ? 'active' : 'inactive'} campaigns</h3>
          <p className="text-gray-600 text-[15px]">Create your first campaign to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              startingCampaignId={startingCampaignId}
              onAction={onCampaignAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalCampaignsSection;
