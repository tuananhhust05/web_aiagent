export type EvalStatus = 'Evaluated' | 'Pending' | 'Processing';
export type SourceType = 'Call' | 'CRM' | 'Both';

export type CognitiveState =
  | 'Lost' | 'Attention' | 'Curiosity' | 'Interest'
  | 'Problem Recognition' | 'Trust' | 'Evaluation'
  | 'Validation' | 'Hard Commitment' | 'Decision'
  | 'Not Scored';

export interface KeyMoment {
  timestamp: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface MeetingCall {
  id: string;
  title: string;
  company: string;
  date: string;
  duration: string;
  interestScore: number | null; // 0-100, null = not scored
  evalStatus: EvalStatus;
  sourceType: SourceType;
  actionCount: number;
  keyMoments: KeyMoment[];
  insightUnread: boolean;
  strategizeNotDone: boolean;
  freshlyCompleted?: boolean;
  /** true = insight ready & user hasn't clicked "View insight" yet */
  freshInsight?: boolean;
}

export interface DateGroup {
  label: string;
  dateKey: string;
  meetings: MeetingCall[];
  expanded: boolean;
  /** Count of meetings in this group where freshInsight === true */
  freshInsightCount: number;
}

export interface CompanyTimeline {
  company: string;
  meetings: MeetingCall[];
  dateRange: string;
}

export interface DashboardStats {
  totalThisWeek: number;
  needsStrategy: number;
  unreviewedInsights: number;
  avgInterest: number;
}
