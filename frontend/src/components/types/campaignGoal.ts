export interface CampaignGoal {
  id: string;
  name: string;
  description?: string;
  color_gradient: string;
  source?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
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

export interface GoalKPI {
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
