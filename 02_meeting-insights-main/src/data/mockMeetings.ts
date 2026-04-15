import { subDays } from 'date-fns';
import type { MeetingCall } from '../types/meeting';

function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = subDays(new Date(), n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_MEETINGS: MeetingCall[] = [
  // ── TODAY (daysAgo(0)) ──────────────────────────────────────────────
  {
    id: 'call-atlas-security',
    title: 'ForSkale Demo – Security Deep Dive',
    company: 'ForSkale Corp',
    date: daysAgo(0, 9, 45),
    duration: '18:45',
    interestScore: 45,
    evalStatus: 'Pending',
    sourceType: 'Call',
    actionCount: 0,
    keyMoments: [],
    insightUnread: true,
    strategizeNotDone: true,
    freshInsight: true,
  },
  {
    id: 'call-lavazza-intro',
    title: 'Lavazza A Modo Mio – Introductory Commercial Discussion',
    company: 'Lavazza',
    date: daysAgo(0, 8, 10),
    duration: '4:02',
    interestScore: 35,
    evalStatus: 'Evaluated',
    sourceType: 'Call',
    actionCount: 3,
    keyMoments: [
      { timestamp: '00:54', description: 'Client expressed budget concerns', sentiment: 'negative' },
      { timestamp: '02:30', description: 'Positive reaction to pricing model', sentiment: 'positive' },
    ],
    insightUnread: true,
    strategizeNotDone: true,
    freshInsight: true,
  },
  {
    id: 'call-unilever-first',
    title: 'Unilever First Contact',
    company: 'Unilever',
    date: daysAgo(0, 11, 3),
    duration: '6:30',
    interestScore: 35,
    evalStatus: 'Evaluated',
    sourceType: 'Call',
    actionCount: 0,
    keyMoments: [],
    insightUnread: true,
    strategizeNotDone: false,
    freshInsight: true,
  },

  // ── YESTERDAY (daysAgo(1)) ─────────────────────────────────────────
  {
    id: 'call-atlas-workflow',
    title: 'ForSkale Workflow Overview – Platform Capabilities',
    company: 'ForSkale Corp',
    date: daysAgo(1, 12, 30),
    duration: '12:30',
    interestScore: 55,
    evalStatus: 'Evaluated',
    sourceType: 'Both',
    actionCount: 2,
    keyMoments: [
      { timestamp: '01:12', description: 'Stakeholder asked about integrations', sentiment: 'neutral' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },

  // ── 2 DAYS AGO (daysAgo(2)) ────────────────────────────────────────
  {
    id: 'call-atlas-qa',
    title: 'ForSkale Demo – Q&A Follow-up',
    company: 'ForSkale Corp',
    date: daysAgo(2, 8, 15),
    duration: '8:15',
    interestScore: 65,
    evalStatus: 'Evaluated',
    sourceType: 'Call',
    actionCount: 0,
    keyMoments: [
      { timestamp: '00:45', description: 'Confirmed next steps with CTO', sentiment: 'positive' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },

  // ── 3 DAYS AGO (daysAgo(3)) ────────────────────────────────────────
  {
    id: 'call-nestle-supply',
    title: 'Nestlé Supply Chain Review',
    company: 'Nestlé',
    date: daysAgo(3, 22, 10),
    duration: '22:10',
    interestScore: 75,
    evalStatus: 'Evaluated',
    sourceType: 'Both',
    actionCount: 1,
    keyMoments: [
      { timestamp: '03:20', description: 'Discussed logistics timeline', sentiment: 'neutral' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },
  {
    id: 'call-nestle-pricing',
    title: 'Nestlé – Pricing Discussion',
    company: 'Nestlé',
    date: daysAgo(3, 15, 0),
    duration: '15:00',
    interestScore: 75,
    evalStatus: 'Evaluated',
    sourceType: 'CRM',
    actionCount: 2,
    keyMoments: [
      { timestamp: '02:10', description: 'Price objection raised', sentiment: 'negative' },
      { timestamp: '03:00', description: 'Agreed on volume discount structure', sentiment: 'positive' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },

  // ── 4 DAYS AGO (daysAgo(4)) ────────────────────────────────────────
  {
    id: 'call-ferrero-closing',
    title: 'Ferrero – Closing Call',
    company: 'Ferrero',
    date: daysAgo(4, 9, 0),
    duration: '30:00',
    interestScore: 90,
    evalStatus: 'Evaluated',
    sourceType: 'Both',
    actionCount: 3,
    keyMoments: [
      { timestamp: '04:30', description: 'Verbal agreement on contract terms', sentiment: 'positive' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },

  // ── NOVA CONSULTING ─────────────────────────────────────────────────
  {
    id: 'call-nova-discovery',
    title: 'Nova Consulting – Discovery Call',
    company: 'Nova Consulting',
    date: daysAgo(1, 14, 0),
    duration: '22:10',
    interestScore: 55,
    evalStatus: 'Evaluated',
    sourceType: 'Call',
    actionCount: 2,
    keyMoments: [
      { timestamp: '05:20', description: 'Discussed pain points in current workflow', sentiment: 'neutral' },
      { timestamp: '14:00', description: 'Interest in enterprise tier', sentiment: 'positive' },
    ],
    insightUnread: true,
    strategizeNotDone: true,
    freshInsight: false,
  },

  // ── BARILLA GROUP ───────────────────────────────────────────────────
  {
    id: 'call-barilla-review',
    title: 'Barilla Group – Quarterly Business Review',
    company: 'Barilla Group',
    date: daysAgo(2, 10, 30),
    duration: '35:45',
    interestScore: 72,
    evalStatus: 'Evaluated',
    sourceType: 'Both',
    actionCount: 4,
    keyMoments: [
      { timestamp: '08:15', description: 'Positive feedback on ROI metrics', sentiment: 'positive' },
      { timestamp: '22:40', description: 'Asked about multi-region rollout', sentiment: 'positive' },
    ],
    insightUnread: false,
    strategizeNotDone: true,
    freshInsight: false,
  },
  {
    id: 'call-barilla-followup',
    title: 'Barilla Group – Technical Follow-up',
    company: 'Barilla Group',
    date: daysAgo(5, 15, 0),
    duration: '18:20',
    interestScore: 68,
    evalStatus: 'Evaluated',
    sourceType: 'Call',
    actionCount: 1,
    keyMoments: [
      { timestamp: '10:00', description: 'Integration requirements discussed', sentiment: 'neutral' },
    ],
    insightUnread: false,
    strategizeNotDone: false,
    freshInsight: false,
  },

  // ── PIRELLI ─────────────────────────────────────────────────────────
  {
    id: 'call-pirelli-intro',
    title: 'Pirelli – Initial Outreach',
    company: 'Pirelli',
    date: daysAgo(3, 11, 15),
    duration: '12:05',
    interestScore: 30,
    evalStatus: 'Pending',
    sourceType: 'CRM',
    actionCount: 0,
    keyMoments: [
      { timestamp: '03:45', description: 'Expressed hesitation about timeline', sentiment: 'negative' },
    ],
    insightUnread: true,
    strategizeNotDone: true,
    freshInsight: false,
  },
];
