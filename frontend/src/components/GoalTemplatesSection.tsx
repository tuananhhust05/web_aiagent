import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CampaignGoal } from './types/campaignGoal';

interface GoalTemplatesSectionProps {
  goal: CampaignGoal;
  workflows: any[];
}

const templateCards = [
  { label: 'ForSkale Template', type: 'forskale', gradient: 'from-blue-600 to-indigo-600' },
  { label: 'Personal Template', type: 'user', gradient: 'from-amber-500 to-orange-500' },
];

const GoalTemplatesSection: React.FC<GoalTemplatesSectionProps> = ({ goal, workflows }) => {
  const navigate = useNavigate();

  const handleOpenTemplate = (templateType: string) => {
    if (!goal.id || !goal) return;
    
    // Find workflow by template type
    const workflow = workflows.find(w => w.template_type === templateType);
    
    if (workflow) {
      // Navigate with workflow_id
      navigate(`/workflow-builder?workflowId=${workflow.id}&goalId=${goal.id}&template=${templateType}`);
    } else {
      // Fallback to function-based if workflow not found
      const workflowFunction = goal.source || 'convention-activities';
      navigate(`/workflow-builder?function=${workflowFunction}&goalId=${goal.id}&template=${templateType}`);
    }
  };

  return (
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
  );
};

export default GoalTemplatesSection;
