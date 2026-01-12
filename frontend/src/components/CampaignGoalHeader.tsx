import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { CampaignGoal } from './types/campaignGoal';

interface CampaignGoalHeaderProps {
  goal: CampaignGoal;
  onEdit: () => void;
  onDelete: () => void;
}

const CampaignGoalHeader: React.FC<CampaignGoalHeaderProps> = ({ goal, onEdit, onDelete }) => {
  return (
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
            onClick={onEdit}
            className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md font-medium text-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 border border-red-200 shadow-sm hover:shadow-md font-medium text-sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignGoalHeader;
