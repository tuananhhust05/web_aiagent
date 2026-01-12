import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Loader2, ArrowRight } from 'lucide-react';
import { Campaign } from './types/campaignGoal';

interface CampaignCardProps {
  campaign: Campaign;
  startingCampaignId: string | null;
  onAction: (campaignId: string, action: 'start' | 'pause' | 'delete') => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, startingCampaignId, onAction }) => {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 hover:shadow-md hover:border-gray-300/50 transition-all duration-300 hover:-translate-y-0.5 space-y-4">
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
              onClick={() => onAction(campaign.id, 'start')}
              disabled={startingCampaignId === campaign.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {startingCampaignId === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Start
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => onAction(campaign.id, 'pause')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200"
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
          )}
          {(campaign.status === 'paused' || campaign.status === 'inactive') && (
            <button
              onClick={() => onAction(campaign.id, 'start')}
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
            onClick={() => onAction(campaign.id, 'delete')}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
