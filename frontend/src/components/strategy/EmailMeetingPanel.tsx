import { useState, useEffect, useCallback } from 'react';
import { X, Brain, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Target, Shield, Check, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParticipantEmailDeal, DealStage, DealContext as DealContextType } from './types';
import { getCognitiveState, type InterestJourneyPoint, type InterestSignal, type DecisionFriction, type Stakeholder } from '@/data/mockStrategyData';
import { getStageTextColor, getStageBgColor } from '@/lib/stageColors';
import { meetingsAPI } from '@/lib/api';
import { useLanguage } from '@/components/strategy/LanguageContext';
import InterestJourney from './InterestJourney';
import StrategyActionItems from './StrategyActionItems';
import InterestSignals from './InterestSignals';
import DecisionFrictionComponent from './DecisionFriction';
import DealContextComponent from './DealContext';

interface LoadingStep {
  id: number;
  text: string;
  duration: number;
  status: 'pending' | 'active' | 'completed';
}

const STEP_DEFINITIONS = [
  { id: 2, text: 'loading.orbital.step2', duration: 2266 },
  { id: 3, text: 'loading.orbital.step3', duration: 2266 },
  { id: 4, text: 'loading.orbital.step4', duration: 2268 },
];

const WOW_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const colors = [
    'hsl(var(--forskale-teal) / 0.7)',
    'hsl(var(--forskale-cyan) / 0.6)',
    'hsl(var(--forskale-green) / 0.5)',
    'hsl(var(--forskale-cyan) / 0.8)',
  ];
  const sizes = [2, 3, 2, 4];
  return {
    key: i,
    size: sizes[i % 4],
    color: colors[i % 4],
    top: `${(i * 17 + 7) % 90 + 5}%`,
    left: `${(i * 13 + 6) % 88 + 6}%`,
    wx: `${(i % 2 === 0 ? 1 : -1) * (20 + (i * 3) % 40)}px`,
    wy: `${(i % 3 === 0 ? -1 : 1) * (15 + (i * 5) % 35)}px`,
    duration: `${6 + (i % 5)}s`,
    delay: `${(i * 0.3).toFixed(1)}s`,
  };
});

function OrbitalLoader({
  steps,
  emailName,
  t,
}: {
  steps: LoadingStep[];
  emailName: string;
  t: (k: string) => string;
}) {
  const [firstWord, ...restWords] = emailName.split(' ');
  const rest = restWords.join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: -160, left: -160,
          background: 'radial-gradient(hsl(var(--forskale-teal) / 0.10) 0%, transparent 70%)',
          animation: 'wow-aurora 14s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, bottom: -120, right: -120,
          background: 'radial-gradient(hsl(var(--forskale-cyan) / 0.08) 0%, transparent 70%)',
          animation: 'wow-aurora 18s ease-in-out infinite reverse',
        }} />
      </div>

      {WOW_PARTICLES.slice(0, 10).map(p => (
        <div
          key={p.key}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            background: p.color,
            top: p.top, left: p.left,
            opacity: 0,
            ['--wx' as any]: p.wx,
            ['--wy' as any]: p.wy,
            animation: `wow-particle ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      <div className="relative z-20 w-full max-w-sm px-5 text-center">
        <div className="relative mx-auto mb-5" style={{ width: 220, height: 220 }}>
          <div className="absolute inset-0 rounded-full border" style={{
            borderColor: 'hsl(var(--forskale-teal) / 0.22)',
            animation: 'wow-outer-pulse 3s ease-in-out infinite',
          }} />
          <div className="absolute rounded-full border" style={{
            inset: 22,
            borderColor: 'hsl(var(--forskale-teal) / 0.4)',
            animation: 'wow-spin-cw 8s linear infinite',
          }}>
            <span className="absolute rounded-full" style={{
              width: 9, height: 9, top: -4, left: '50%', marginLeft: -4,
              background: 'hsl(var(--forskale-cyan))',
              boxShadow: '0 0 12px hsl(var(--forskale-cyan))',
              animation: 'wow-orb-pulse 2s ease-in-out infinite',
            }} />
          </div>
          <div className="absolute rounded-full border" style={{
            inset: 44,
            borderColor: 'hsl(var(--forskale-teal) / 0.5)',
            animation: 'wow-spin-ccw 6s linear infinite',
          }}>
            <span className="absolute rounded-full" style={{
              width: 8, height: 8, top: '50%', left: -3, marginTop: -3,
              background: 'hsl(var(--forskale-green))',
              boxShadow: '0 0 10px hsl(var(--forskale-green))',
              animation: 'wow-orb-pulse 1.8s ease-in-out infinite',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center rounded-full" style={{
              width: 84, height: 84,
              background: 'hsl(var(--forskale-teal) / 0.10)',
              border: '1px solid hsl(var(--forskale-teal) / 0.45)',
              animation: 'wow-core-glow 3s ease-in-out infinite',
            }}>
              <Brain className="text-[hsl(var(--forskale-teal))]" style={{
                width: 40, height: 40,
                animation: 'wow-brain-float 3s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="rounded-full" style={{
            width: 3, height: 3,
            background: 'hsl(var(--forskale-teal))',
            animation: 'wow-orb-pulse 1.5s ease-in-out infinite',
          }} />
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--forskale-teal))] font-bold">
            ForSkale AI · Live Analysis
          </p>
          <span className="rounded-full" style={{
            width: 3, height: 3,
            background: 'hsl(var(--forskale-teal))',
            animation: 'wow-orb-pulse 1.5s ease-in-out 0.5s infinite',
          }} />
        </div>

        <h2 className="text-base font-bold text-foreground tracking-tight mb-0.5">
          {t('loading.orbital.analyzing')}{' '}
          <span className="text-[hsl(var(--forskale-teal))]">{firstWord}</span>
          {rest && <span className="text-foreground"> {rest}</span>}
        </h2>
        <p className="text-[10px] text-muted-foreground mb-4">AI strategy intelligence in progress</p>

        <div className="space-y-1.5 text-left">
          {steps.map((step) => {
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            return (
              <div
                key={step.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
                style={{
                  background: isActive || isCompleted ? 'hsl(var(--forskale-teal) / 0.06)' : 'hsl(var(--muted) / 0.5)',
                  borderColor: isActive
                    ? 'hsl(var(--forskale-teal) / 0.5)'
                    : isCompleted
                      ? 'hsl(var(--forskale-teal) / 0.3)'
                      : 'hsl(var(--border))',
                  boxShadow: isActive ? '0 0 12px hsl(var(--forskale-teal) / 0.15)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
                  ) : isActive ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-[hsl(var(--forskale-teal))] border-t-transparent animate-spin" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-foreground font-medium" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}>
                    {t(step.text)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MeetingInfo {
  id: string;
  title: string;
  event_start: string;
  main_contact: {
    name?: string;
    email?: string;
    company?: string;
  };
  participants: Array<{
    name?: string;
    email?: string;
    company?: string;
  }>;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

interface Props {
  deal: ParticipantEmailDeal;
  onClose: () => void;
}

interface EmailDealData {
  id: string;
  email: string;
  name?: string;
  company?: string;
  meetingCount: number;
  interestLevel: number;
  interestJourney: InterestJourneyPoint[];
  interestSignals: InterestSignal[];
  decisionFriction: DecisionFriction[];
  interestVelocity: number;
  daysAtCurrentLevel: number;
  stakeholders: Stakeholder[];
  actionItems: { id: string; title: string; priority: string; status: string; }[];
}

function generateEmailDealData(deal: ParticipantEmailDeal, meetings: MeetingInfo[]): EmailDealData {
  const meetingCount = meetings.length;
  const engagementScore = Math.min(meetingCount * 15, 85);
  const interestLevel = Math.round(engagementScore);

  const sortedMeetings = [...meetings].sort((a, b) =>
    new Date(a.event_start).getTime() - new Date(b.event_start).getTime()
  );

  const interestJourney: InterestJourneyPoint[] = sortedMeetings.slice(-4).map((m, idx) => {
    const baseLevel = 20 + (idx * 20);
    const level = Math.min(baseLevel + Math.round(Math.random() * 10), 95);
    return {
      date: m.event_start,
      interestLevel: level,
      cognitiveState: ['Attention', 'Curiosity', 'Trust', 'Validation'][Math.min(idx, 3)],
      change: idx === 0 ? 0 : Math.round((Math.random() - 0.3) * 15),
      event: m.title || 'Meeting',
      detail: m.title || 'Discussion',
      meetingTitle: m.title,
      participants: m.participants?.map(p => p.name || p.email || 'Unknown') || [],
    };
  });

  const interestSignals: InterestSignal[] = [];
  if (meetingCount >= 3) {
    interestSignals.push({
      date: new Date().toISOString(),
      event: 'Multiple meetings detected',
      type: 'positive',
      signalType: 'engagement_surge',
      behavior: `${meetingCount} meetings in the past period`,
      meaning: 'Sustained interest from this contact',
      impactPercent: Math.min(meetingCount * 3, 25),
    });
  }
  if (deal.company) {
    interestSignals.push({
      date: new Date().toISOString(),
      event: 'Company engagement detected',
      type: 'positive',
      signalType: 'company_engagement',
      behavior: `Active with ${deal.company}`,
      meaning: 'Organizational interest identified',
      impactPercent: 15,
    });
  }
  if (meetings.some(m => m.participants && m.participants.length > 2)) {
    interestSignals.push({
      date: new Date().toISOString(),
      event: 'Multi-stakeholder involvement',
      type: 'positive',
      signalType: 'multi_stakeholder',
      behavior: 'Multiple participants in meetings',
      meaning: 'Broader organizational interest',
      impactPercent: 12,
    });
  }

  const decisionFriction: DecisionFriction[] = [];
  if (meetingCount < 3) {
    decisionFriction.push({
      title: 'Limited engagement history',
      frictionLevel: meetingCount < 2 ? 'HIGH' : 'MEDIUM',
      blockingPercent: meetingCount < 2 ? 45 : 30,
      whyItMatters: 'Fewer touchpoints may indicate early exploration or hesitation',
      currentState: `${meetingCount} meeting(s) conducted`,
      effectOnInterest: 'Moderate uncertainty about commitment level',
      howToRemove: ['Schedule follow-up meeting', 'Share relevant case studies'],
      timeline: '1-2 weeks',
      successIndicator: '3+ meetings scheduled',
    });
  }
  if (!deal.company) {
    decisionFriction.push({
      title: 'Limited company context',
      frictionLevel: 'MEDIUM',
      blockingPercent: 25,
      whyItMatters: 'Unable to fully assess organizational buy-in',
      currentState: 'No company data available',
      effectOnInterest: 'Harder to personalize outreach',
      howToRemove: ['Research company background', 'Identify key stakeholders'],
      timeline: '3-5 days',
      successIndicator: 'Company profile enriched',
    });
  }

  const stakeholders: Stakeholder[] = meetings
    .flatMap(m => m.participants || [])
    .filter((p, idx, arr) => arr.findIndex(x => x.email === p.email) === idx)
    .slice(0, 5)
    .map((p, idx) => ({
      name: p.name || p.email || 'Unknown',
      title: 'Stakeholder',
      role: idx === 0 ? 'Champion' : 'Influencer',
      status: 'Engaged' as const,
      statusColor: idx === 0 ? 'green' : 'cyan',
      notes: `Met in ${meetings.find(m => m.participants?.some(x => x.email === p.email))?.title || 'meetings'}`,
      priority: idx === 0,
    }));

  return {
    id: deal.email,
    email: deal.email,
    name: deal.name,
    company: deal.company,
    meetingCount,
    interestLevel,
    interestJourney,
    interestSignals,
    decisionFriction,
    interestVelocity: meetingCount >= 3 ? 1 : 0,
    daysAtCurrentLevel: 7,
    stakeholders,
    actionItems: [
      { id: '1', title: `Schedule follow-up meeting with ${deal.name || deal.email}`, priority: 'High', status: 'pending' },
      { id: '2', title: 'Send meeting summary and next steps', priority: 'High', status: 'pending' },
      { id: '3', title: 'Research company background', priority: 'Medium', status: 'pending' },
    ],
  };
}

export default function EmailMeetingPanel({ deal, onClose }: Props) {
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<MeetingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<LoadingStep[]>(
    STEP_DEFINITIONS.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [visible, setVisible] = useState(false);

  const emailDisplay = deal.name || deal.email;
  const companyDisplay = deal.company || deal.email.split("@")[1] || "Unknown";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await meetingsAPI.getMeetingHistoryByEmail(deal.email);
        setMeetings(res.data.meetings || []);
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [deal.email]);

  useEffect(() => {
    if (loading || isGenerating) return;

    setIsGenerating(true);
    setSteps(STEP_DEFINITIONS.map(s => ({ ...s, status: 'pending' as const })));

    let currentStep = 0;
    const timeouts: number[] = [];

    const processNext = () => {
      if (currentStep >= STEP_DEFINITIONS.length) {
        timeouts.push(window.setTimeout(() => {
          setIsGenerating(false);
        }, 400));
        return;
      }

      setSteps(prev => prev.map(s => s.id === currentStep + 1 ? { ...s, status: 'active' } : s));

      timeouts.push(window.setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === currentStep + 1 ? { ...s, status: 'completed' } : s));
        currentStep++;
        processNext();
      }, STEP_DEFINITIONS[currentStep].duration));
    };

    processNext();
    return () => timeouts.forEach(clearTimeout);
  }, [loading, deal.email]);

  const isReady = !loading && !isGenerating;
  const emailDealData = isReady ? generateEmailDealData(deal, meetings) : null;
  const cogState = emailDealData ? getCognitiveState(emailDealData.interestLevel) : getCognitiveState(50);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const briefing = emailDealData ? {
    narrative: `Based on ${meetings.length} meetings with ${emailDisplay}, this contact shows ${meetings.length >= 5 ? 'strong' : meetings.length >= 2 ? 'moderate' : 'developing'} engagement. ${deal.company ? `The company ${deal.company} has shown interest through multiple touchpoints.` : 'The contact has participated in scheduled meetings that indicate active involvement.'}`,
    cognitiveStateExplanation: `The contact is at the ${cogState.name} stage, indicating ${meetings.length >= 5 ? 'high' : meetings.length >= 2 ? 'growing' : 'early'} interest based on meeting participation patterns.`,
    topPriorities: [
      'Continue engagement through follow-up meetings',
      'Identify key stakeholders in the conversation',
      'Understand pain points from meeting discussions',
    ],
    riskWarnings: meetings.length < 2 ? ['Limited meeting history - need more engagement'] : [],
  } : null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[65%] max-w-3xl z-50 flex flex-col bg-background border-l border-border shadow-2xl transition-transform duration-[350ms]",
          visible ? "translate-x-0" : "translate-x-full"
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.32, 1)' }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
            <div>
              <h3 className="text-sm font-bold text-foreground">{companyDisplay}</h3>
              <span className="text-xs text-muted-foreground">
                {emailDisplay} · {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto atlas-scrollbar">
          {loading || isGenerating ? (
            <OrbitalLoader
              steps={steps}
              emailName={companyDisplay}
              t={t}
            />
          ) : emailDealData && briefing ? (
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-[hsl(var(--forskale-teal)/0.04)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
                  <h4 className="text-xs font-bold text-[hsl(var(--forskale-teal))] uppercase tracking-wider">Strategic Briefing</h4>
                </div>
                <p className="text-[15px] leading-relaxed text-foreground">{briefing.narrative}</p>
              </div>

              {emailDealData.interestJourney.length > 0 && (
                <InterestJourney
                  journey={emailDealData.interestJourney}
                  companyName={companyDisplay}
                  interestVelocity={emailDealData.interestVelocity}
                  daysAtCurrentLevel={emailDealData.daysAtCurrentLevel}
                />
              )}

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-3 h-3 rounded-full", getStageBgColor(emailDealData.interestLevel))} />
                  <span className={cn("text-sm font-bold", getStageTextColor(emailDealData.interestLevel))}>{cogState.name}</span>
                  <span className="text-xs text-muted-foreground">· {emailDealData.interestLevel}%</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{briefing.cognitiveStateExplanation}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {briefing.topPriorities.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
                      <span className="text-xs font-semibold text-foreground">Top Priorities</span>
                    </div>
                    <ul className="space-y-1.5">
                      {briefing.topPriorities.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-[hsl(var(--forskale-teal))]">→</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {briefing.riskWarnings.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-foreground">Risk Warnings</span>
                    </div>
                    <ul className="space-y-1.5">
                      {briefing.riskWarnings.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-orange-500">⚠</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <StrategyActionItems deal={emailDealData as any} />

              {emailDealData.interestSignals.length > 0 && (
                <CollapsibleSection title="Interest Signals" icon={Sparkles} defaultOpen={false}>
                  <InterestSignals signals={emailDealData.interestSignals} interestLevel={emailDealData.interestLevel} />
                </CollapsibleSection>
              )}

              {emailDealData.decisionFriction.length > 0 && (
                <CollapsibleSection title="Decision Friction" icon={Shield} defaultOpen={false}>
                  <DecisionFrictionComponent
                    friction={emailDealData.decisionFriction}
                    roadmap={[]}
                    interestLevel={emailDealData.interestLevel}
                    daysAtCurrentLevel={emailDealData.daysAtCurrentLevel}
                  />
                </CollapsibleSection>
              )}

              <CollapsibleSection title="Deal Context" icon={Target} defaultOpen={false}>
                <DealContextComponent deal={{
                  company: companyDisplay || 'Unknown Company',
                  industry: 'N/A',
                  dealValue: 'N/A',
                  status: 'first_meeting' as any,
                  interestLevel: emailDealData.interestLevel,
                  previousInterestLevel: emailDealData.interestLevel - 5,
                  interestChange: 5,
                  daysAtCurrentLevel: emailDealData.daysAtCurrentLevel,
                  interestVelocity: emailDealData.interestVelocity,
                  currentStage: cogState.name,
                  crmStage: 'N/A',
                  crmMapping: { crmStage: 'N/A', cognitiveState: cogState.name, interestLevel: emailDealData.interestLevel, conversionLikelihood: 'medium', recommendedActions: [] },
                  lastContact: 0,
                  primaryContact: emailDealData.name || emailDealData.email,
                  primaryTitle: 'N/A',
                  stakeholderStatus: [],
                  biggestBlocker: 'N/A',
                  nextAction: 'N/A',
                  estimatedCloseDate: 'N/A',
                  dealAssessment: 'N/A',
                  situationSummary: 'N/A',
                  whyThisStage: [],
                  winFactors: [],
                  lossRisks: [],
                  interestJourney: emailDealData.interestJourney,
                  interestSignals: emailDealData.interestSignals,
                  decisionFriction: emailDealData.decisionFriction,
                  frictionRoadmap: [],
                  interestAlerts: [],
                  interestPatterns: [],
                  interactions: [],
                  stakeholders: emailDealData.stakeholders,
                  objections: [],
                  commitments: [],
                  strategies: [],
                  actionItems: [],
                  similarWins: [],
                  weeklyPlan: [],
                  redFlags: [],
                  emotionalTriggers: [],
                  objectionPsychology: [],
                  decisionProfile: [],
                  decisionProfileNote: '',
                  progressionNote: '',
                } as any} />
              </CollapsibleSection>

              <CollapsibleSection title="Meeting History" icon={Clock} defaultOpen={true}>
                <div className="space-y-3">
                  {[...meetings].sort((a, b) => new Date(b.event_start).getTime() - new Date(a.event_start).getTime()).map((meeting) => (
                    <div key={meeting.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                      <h4 className="text-sm font-semibold text-foreground truncate">{meeting.title || "Untitled Meeting"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(meeting.event_start).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      {meeting.main_contact?.company && (
                        <p className="text-xs text-muted-foreground mt-1">{meeting.main_contact.company}</p>
                      )}
                      {meeting.participants && meeting.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}