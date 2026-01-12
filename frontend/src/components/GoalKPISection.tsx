import React from 'react';
import { BarChart3, PieChart, Mail, MessageCircle, Linkedin, PhoneCall, TrendingUp, Loader2 } from 'lucide-react';
import { GoalKPI } from './types/campaignGoal';

interface GoalKPISectionProps {
  kpiData: GoalKPI | null;
  kpiLoading: boolean;
  totalContactsReached: number;
}

const formatNumber = (value?: number) => (typeof value === 'number' ? value : 0).toLocaleString('en-US');

const GoalKPISection: React.FC<GoalKPISectionProps> = ({ kpiData, kpiLoading, totalContactsReached }) => {
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

  return (
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
  );
};

export default GoalKPISection;
