// Types
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type MethodologyElement = {
  elementId: string;
  name: string;
  detected: boolean;
  instances: number;
  transcriptReferences: string[];
  score: number;
};

export type MethodologyScore = {
  frameworkId: string;
  name: string;
  overallScore: number;
  confidence: ConfidenceLevel;
  elementsDetected: MethodologyElement[];
};

export type ExtractedElement = {
  id: string;
  name: string;
  description: string;
  source: 'challenger-sale' | 'gap-selling' | 'sandler' | 'external-research';
  confidence: number;
  timestamps: string[];
  transcriptSnippets: string[];
  addedToTemplates: boolean;
};

export type LLMModelResult = {
  modelId: string;
  modelName: string;
  icon: string;
  topFramework: string;
  topScore: number;
  status: 'initializing' | 'analyzing' | 'cross-referencing' | 'complete';
  completionTime: number; // seconds
};

export type NeuroscienceMetric = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
};

export type CompositeStep = {
  label: string;
  timeRange: string;
  methodology: string;
  description: string;
};

export type PlaybookAnalysis = {
  meetingId: string;
  analysisId: string;
  methodologies: MethodologyScore[];
  customElements: ExtractedElement[];
  llmModels: LLMModelResult[];
  neuroscienceMetrics: NeuroscienceMetric[];
  compositePlaybook: CompositeStep[];
  consensusScore: number;
  agreementLevel: number;
  createdAt: string;
};

// Mock data
export const mockLLMModels: LLMModelResult[] = [
  { modelId: 'claude', modelName: 'Claude Sonnet 4', icon: '🟣', topFramework: 'MEDDIC', topScore: 79, status: 'initializing', completionTime: 3 },
  { modelId: 'gpt4', modelName: 'GPT-4 Turbo', icon: '🟢', topFramework: 'MEDDIC', topScore: 81, status: 'initializing', completionTime: 5 },
  { modelId: 'gemini', modelName: 'Gemini Pro', icon: '🔵', topFramework: 'MEDDIC', topScore: 76, status: 'initializing', completionTime: 6 },
  { modelId: 'openclaw', modelName: 'OpenClaw', icon: '⚡', topFramework: 'MEDDIC', topScore: 82, status: 'initializing', completionTime: 7 },
];

export const mockMethodologyScores: MethodologyScore[] = [
  {
    frameworkId: 'meddic', name: 'MEDDIC', overallScore: 79, confidence: 'high',
    elementsDetected: [
      { elementId: 'm1', name: 'Metrics', detected: true, instances: 2, transcriptReferences: ['00:54', '02:47'], score: 75 },
      { elementId: 'm2', name: 'Economic Buyer', detected: true, instances: 1, transcriptReferences: ['01:25'], score: 80 },
      { elementId: 'm3', name: 'Decision Criteria', detected: true, instances: 2, transcriptReferences: ['02:42', '02:47'], score: 70 },
      { elementId: 'm4', name: 'Decision Process', detected: true, instances: 1, transcriptReferences: ['03:24'], score: 85 },
      { elementId: 'm5', name: 'Identify Pain', detected: true, instances: 3, transcriptReferences: ['00:42', '00:54', '01:02'], score: 90 },
      { elementId: 'm6', name: 'Champion', detected: false, instances: 0, transcriptReferences: [], score: 0 },
    ],
  },
  {
    frameworkId: 'discovery', name: 'Discovery Call', overallScore: 71, confidence: 'high',
    elementsDetected: [
      { elementId: 'd1', name: 'Company Overview', detected: true, instances: 2, transcriptReferences: ['00:22', '00:26'], score: 80 },
      { elementId: 'd2', name: 'Challenges', detected: true, instances: 3, transcriptReferences: ['00:42', '00:54', '01:02'], score: 85 },
      { elementId: 'd3', name: 'Goals', detected: true, instances: 1, transcriptReferences: ['01:09'], score: 60 },
      { elementId: 'd4', name: 'Current Tools', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'd5', name: 'Next Steps', detected: true, instances: 2, transcriptReferences: ['03:19', '03:33'], score: 90 },
    ],
  },
  {
    frameworkId: 'bant', name: 'BANT', overallScore: 65, confidence: 'medium',
    elementsDetected: [
      { elementId: 'b1', name: 'Budget', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'b2', name: 'Authority', detected: true, instances: 1, transcriptReferences: ['01:25'], score: 80 },
      { elementId: 'b3', name: 'Need', detected: true, instances: 3, transcriptReferences: ['00:42', '00:54', '01:02'], score: 90 },
      { elementId: 'b4', name: 'Timeline', detected: true, instances: 1, transcriptReferences: ['03:33'], score: 70 },
    ],
  },
  {
    frameworkId: 'spiced', name: 'SPICED', overallScore: 58, confidence: 'medium',
    elementsDetected: [
      { elementId: 's1', name: 'Situation', detected: true, instances: 2, transcriptReferences: ['00:22', '00:26'], score: 75 },
      { elementId: 's2', name: 'Pain', detected: true, instances: 2, transcriptReferences: ['00:54', '02:47'], score: 80 },
      { elementId: 's3', name: 'Impact', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 's4', name: 'Critical Event', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 's5', name: 'Decision', detected: true, instances: 1, transcriptReferences: ['03:24'], score: 60 },
    ],
  },
  {
    frameworkId: 'champ', name: 'CHAMP', overallScore: 55, confidence: 'medium',
    elementsDetected: [
      { elementId: 'c1', name: 'Challenges', detected: true, instances: 3, transcriptReferences: ['00:42', '00:54', '01:02'], score: 85 },
      { elementId: 'c2', name: 'Authority', detected: true, instances: 1, transcriptReferences: ['01:25'], score: 70 },
      { elementId: 'c3', name: 'Money', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'c4', name: 'Prioritization', detected: true, instances: 1, transcriptReferences: ['01:09'], score: 55 },
    ],
  },
  {
    frameworkId: 'spin', name: 'SPIN', overallScore: 52, confidence: 'low',
    elementsDetected: [
      { elementId: 'sp1', name: 'Situation', detected: true, instances: 2, transcriptReferences: ['00:22', '00:26'], score: 70 },
      { elementId: 'sp2', name: 'Problem', detected: true, instances: 2, transcriptReferences: ['00:42', '00:54'], score: 75 },
      { elementId: 'sp3', name: 'Implication', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'sp4', name: 'Need-Payoff', detected: true, instances: 1, transcriptReferences: ['03:04'], score: 50 },
    ],
  },
  {
    frameworkId: 'gpct', name: 'GPCT', overallScore: 48, confidence: 'low',
    elementsDetected: [
      { elementId: 'g1', name: 'Goals', detected: true, instances: 1, transcriptReferences: ['01:09'], score: 55 },
      { elementId: 'g2', name: 'Plans', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'g3', name: 'Challenges', detected: true, instances: 2, transcriptReferences: ['00:54', '02:47'], score: 70 },
      { elementId: 'g4', name: 'Timeline', detected: true, instances: 1, transcriptReferences: ['03:33'], score: 55 },
    ],
  },
  {
    frameworkId: 'demo', name: 'Demo Call', overallScore: 42, confidence: 'low',
    elementsDetected: [
      { elementId: 'de1', name: 'User Information', detected: true, instances: 1, transcriptReferences: ['00:22'], score: 60 },
      { elementId: 'de2', name: 'Open Questions', detected: true, instances: 2, transcriptReferences: ['00:42', '02:32'], score: 50 },
      { elementId: 'de3', name: 'Problems', detected: true, instances: 2, transcriptReferences: ['00:54', '02:47'], score: 65 },
      { elementId: 'de4', name: 'Demonstration', detected: false, instances: 0, transcriptReferences: [], score: 0 },
      { elementId: 'de5', name: 'Next Steps', detected: true, instances: 1, transcriptReferences: ['03:19'], score: 80 },
    ],
  },
];

export const mockCustomElements: ExtractedElement[] = [
  {
    id: 'ce1',
    name: 'Competitive Positioning Framework',
    description: 'Systematic approach to positioning against competitors without direct naming, using industry challenges and differentiation.',
    source: 'challenger-sale',
    confidence: 87,
    timestamps: ['02:32', '02:42'],
    transcriptSnippets: [
      '"Are you currently evaluating other vendors?" (02:32)',
      '"We had preliminary conversations with two providers, but nothing formal yet." (02:42)',
    ],
    addedToTemplates: false,
  },
  {
    id: 'ce2',
    name: 'Risk Mitigation Dialogue',
    description: 'Pattern of addressing implementation risks proactively through phased approach suggestions, reducing buyer anxiety.',
    source: 'sandler',
    confidence: 74,
    timestamps: ['02:47', '03:04'],
    transcriptSnippets: [
      '"One concern I have is implementation complexity." (02:47)',
      '"Would a phased rollout reduce that concern?" (03:04)',
    ],
    addedToTemplates: false,
  },
  {
    id: 'ce3',
    name: 'Stakeholder Expansion Technique',
    description: 'Identifying and including additional decision-makers organically through next-step planning.',
    source: 'gap-selling',
    confidence: 81,
    timestamps: ['03:19', '03:24'],
    transcriptSnippets: [
      '"Would it make sense to schedule a more detailed session?" (03:19)',
      '"I would prefer to bring someone from finance into that discussion." (03:24)',
    ],
    addedToTemplates: false,
  },
];

export const mockNeuroscienceMetrics: NeuroscienceMetric[] = [
  { id: 'ns1', label: 'Question Sequencing Effectiveness', score: 85, maxScore: 100 },
  { id: 'ns2', label: 'Cognitive Load Management', score: 78, maxScore: 100 },
  { id: 'ns3', label: 'Trust Building Patterns', score: 92, maxScore: 100 },
  { id: 'ns4', label: 'Decision Trigger Activation', score: 67, maxScore: 100 },
  { id: 'ns5', label: 'Emotional Engagement Score', score: 81, maxScore: 100 },
];

export const mockCompositePlaybook: CompositeStep[] = [
  { label: 'Opening & Rapport', timeRange: '0:00–0:22', methodology: 'Standard', description: 'Introductory context setting and acknowledgement' },
  { label: 'Situation Assessment', timeRange: '0:22–1:02', methodology: 'SPICED', description: 'Current state exploration and context gathering' },
  { label: 'Pain Discovery', timeRange: '1:02–2:32', methodology: 'SPIN + Custom', description: 'Deep-dive into operational challenges and priorities' },
  { label: 'Budget Qualification', timeRange: '2:32–3:04', methodology: 'BANT', description: 'Vendor landscape and implementation concerns' },
  { label: 'Next Steps & Close', timeRange: '3:04–3:52', methodology: 'MEDDIC', description: 'Follow-up scheduling with stakeholder expansion' },
];

export const mockAnalysisLogMessages = [
  "Detecting questioning sequences...",
  "Mapping objection handling patterns...",
  "Analyzing emotional resonance markers...",
  "Cross-referencing external methodology databases...",
  "Applying neuroscience decision-making models...",
  "Evaluating competitive positioning signals...",
  "Scoring stakeholder engagement depth...",
  "Identifying trust-building micro-patterns...",
  "Calculating composite methodology adherence...",
  "Finalizing multi-model consensus...",
];

// Full analysis result (what gets returned after analysis completes)
export const mockPlaybookAnalysis: PlaybookAnalysis = {
  meetingId: '1',
  analysisId: 'analysis-001',
  methodologies: mockMethodologyScores,
  customElements: mockCustomElements,
  llmModels: mockLLMModels.map(m => ({ ...m, status: 'complete' as const })),
  neuroscienceMetrics: mockNeuroscienceMetrics,
  compositePlaybook: mockCompositePlaybook,
  consensusScore: 79.5,
  agreementLevel: 94,
  createdAt: new Date().toISOString(),
};
