export type MethodologySource = 'internal' | 'external';

export type SalesMethodologyId =
  | 'meddic'
  | 'meddpicc'
  | 'spin'
  | 'bant'
  | 'challenger'
  | 'champ'
  | 'neat'
  | 'sandler';

export type DealComplexity = 'low' | 'medium' | 'high' | 'enterprise';
export type DealStage =
  | 'attention'
  | 'curiosity'
  | 'trust'
  | 'validation'
  | 'commitment'
  | 'decision'
  | 'lost';

export interface DealContext {
  companyName: string;
  dealValue?: number;
  stage: DealStage;
  stakeholders: number;
  hasChampion: boolean;
  hasEconomicBuyer: boolean;
  painClarity: number;
  urgencyScore: number;
  complexity: DealComplexity;
  objections: string[];
  sourceSignals: {
    fromMeetingIntelligence?: boolean;
    fromMeetingInsight?: boolean;
    fromPerformance?: boolean;
    fromQnAEngine?: boolean;
  };
}

export interface MethodologyDefinition {
  id: SalesMethodologyId;
  name: string;
  shortDescription: string;
  bestFor: string[];
  useWhen: string[];
  avoidWhen: string[];
  keyQuestions: string[];
  motionLabel: string;
  source: MethodologySource;
  sourceUrl?: string;
}

export interface MethodologyRecommendation {
  primary: MethodologyDefinition;
  secondary: MethodologyDefinition[];
  rationale: string[];
  executionPlan: string[];
  copyReadyMessage: string;
}

export interface LoaderStep {
  id: string;
  label: string;
  icon: string;
  tint: string;
  durationMs: number;
}

export interface StrategyAnalysisResult {
  score: number;
  verdict: string;
  summary: string;
  methodology: MethodologyRecommendation;
  nextActions: string[];
  futureBranches: Array<{
    if: string;
    then: string;
  }>;
  deeperLinks: Array<{
    label: string;
    productArea: 'Meeting Intelligence' | 'Meeting Insight' | 'Performance' | 'QnA Engine' | 'Action Ready';
  }>;
}

export interface ParticipantEmailDeal {
  email: string;
  name?: string;
  company?: string;
  meetingCount: number;
  lastMeetingDate?: string;
}
