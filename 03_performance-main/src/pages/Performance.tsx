import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Info, Filter, Download, Plus, Check, TrendingUp, ArrowUp, ArrowRight, ArrowDown, CheckCircle2, Lightbulb, MessageSquare, User, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';

type TopicQuestion = {
  source: string;
  timestamp: string;
  question: string;
  suggestedAnswer: string;
  userActualAnswer: string;
  matchScore: number;
  keyPointsCovered: string[];
  learningOpportunities: string[];
};

const topicQuestions: Record<string, TopicQuestion[]> = {
  'Pricing and ROI': [
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '00:37',
      question: "What's the total cost of ownership?",
      userActualAnswer: "So the pricing really depends on your team size. We have different tiers, and everything is included — no surprises on your invoice.",
      suggestedAnswer: 'Total cost depends on team size and plan tier. We offer transparent pricing with no hidden fees.',
      matchScore: 88,
      keyPointsCovered: ['Mentioned team size tiers', 'Addressed transparent pricing', 'Reassured no hidden costs'],
      learningOpportunities: ['Could mention specific ROI timeline'],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '01:22',
      question: 'How quickly will we see ROI?',
      userActualAnswer: "You should start seeing value pretty quickly, honestly within the first couple of months most teams notice a real difference.",
      suggestedAnswer: 'Most customers see measurable ROI within 60-90 days of deployment.',
      matchScore: 72,
      keyPointsCovered: ['Mentioned quick timeline', 'Referenced team impact'],
      learningOpportunities: ['Be more specific with "60-90 days"', 'Use the word "measurable" for credibility'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '02:22',
      question: 'Are there any hidden fees?',
      userActualAnswer: "Nope, what you see is what you get. It's all in the subscription.",
      suggestedAnswer: 'No hidden fees. All pricing is transparent and included in your subscription tier.',
      matchScore: 82,
      keyPointsCovered: ['Confirmed no hidden fees', 'Referenced subscription model'],
      learningOpportunities: ['Use the word "transparent" for stronger reassurance'],
    },
  ],
  'Implementation timeline': [
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '00:34',
      question: 'How long does setup take?',
      userActualAnswer: "We can usually get you up and running in a few weeks. It depends on your team's availability for the onboarding sessions.",
      suggestedAnswer: 'Typical setup takes 2-3 weeks including onboarding and training.',
      matchScore: 75,
      keyPointsCovered: ['Mentioned few weeks timeline', 'Referenced onboarding'],
      learningOpportunities: ['Be precise: "2-3 weeks"', 'Mention training is included'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '01:26',
      question: 'Do you provide training?',
      userActualAnswer: "Yeah absolutely, we do full training for the whole team.",
      suggestedAnswer: 'Yes, we provide comprehensive onboarding training for all team members.',
      matchScore: 85,
      keyPointsCovered: ['Confirmed training availability', 'Mentioned full team coverage'],
      learningOpportunities: ['Use "comprehensive onboarding" for more professional framing'],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '03:50',
      question: "What's the go-live process?",
      userActualAnswer: "We do it in phases — start with a small group, then roll it out to everyone.",
      suggestedAnswer: 'We follow a phased rollout: pilot group first, then full team deployment.',
      matchScore: 90,
      keyPointsCovered: ['Described phased approach', 'Mentioned small group first', 'Full rollout second'],
      learningOpportunities: ['Use "pilot group" terminology'],
    },
  ],
  'Integration capabilities': [
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '03:12',
      question: 'Does it integrate with our CRM?',
      userActualAnswer: "Yes we integrate with the major CRMs — Salesforce, HubSpot, you name it.",
      suggestedAnswer: 'Yes, we integrate with Salesforce, HubSpot, and other major CRMs.',
      matchScore: 92,
      keyPointsCovered: ['Named specific CRMs', 'Confirmed broad integration support'],
      learningOpportunities: ['Could ask which CRM they use to personalize'],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '04:02',
      question: 'Can we connect our existing call tools?',
      userActualAnswer: "We work with Zoom and Teams for sure. I think we also support Google Meet.",
      suggestedAnswer: 'We support Zoom, Teams, Google Meet and other major platforms.',
      matchScore: 68,
      keyPointsCovered: ['Named Zoom and Teams'],
      learningOpportunities: ['Confirm Google Meet support with certainty', 'Avoid "I think" — project confidence'],
    },
  ],
  'Security and compliance': [
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '02:22',
      question: 'Is Atlas GDPR compliant?',
      userActualAnswer: "Yes, we take data privacy seriously. We're compliant with GDPR.",
      suggestedAnswer: 'Yes, Atlas follows GDPR principles and stores data on European servers.',
      matchScore: 55,
      keyPointsCovered: ['Confirmed GDPR compliance'],
      learningOpportunities: ['Mention European server storage', 'Add specifics about data handling practices'],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '01:22',
      question: 'Where is data stored?',
      userActualAnswer: "All our data is stored in Europe, fully encrypted.",
      suggestedAnswer: 'All data is stored on European-based infrastructure with full encryption.',
      matchScore: 91,
      keyPointsCovered: ['Mentioned European storage', 'Referenced full encryption'],
      learningOpportunities: ['Use "infrastructure" for more technical credibility'],
    },
  ],
  'Competitor comparisons': [
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '04:18',
      question: 'How is Atlas different from Gong?',
      userActualAnswer: "We're not just recording calls — we actually structure everything into actionable insights and coach your team in real time.",
      suggestedAnswer: 'Atlas structures calls into an actionable layer with playbook-driven coaching.',
      matchScore: 78,
      keyPointsCovered: ['Differentiated from recording', 'Mentioned actionable insights'],
      learningOpportunities: ['Use "playbook-driven coaching" as a key differentiator phrase'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '04:52',
      question: 'Why not just use Chorus?',
      userActualAnswer: "Chorus is more of a recording tool. We go further with real-time coaching and structured Q&A analysis.",
      suggestedAnswer: 'Atlas goes beyond recording — it provides real-time coaching and structured Q&A.',
      matchScore: 85,
      keyPointsCovered: ['Distinguished from recording', 'Mentioned real-time coaching', 'Referenced structured Q&A'],
      learningOpportunities: ['Lead with customer benefit rather than competitor weakness'],
    },
  ],
  'Other questions': [
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '00:37',
      question: 'Is Atlas a CRM replacement?',
      userActualAnswer: "No no, it's not a CRM. It works alongside your existing CRM.",
      suggestedAnswer: 'No, Atlas is not a CRM replacement.',
      matchScore: 95,
      keyPointsCovered: ['Clearly stated not a CRM', 'Mentioned working alongside existing tools'],
      learningOpportunities: [],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '01:26',
      question: 'How does Atlas improve objection handling?',
      userActualAnswer: "It picks up on the questions prospects keep asking and helps you prepare better answers over time.",
      suggestedAnswer: 'Atlas detects recurring prospect questions and aggregates them.',
      matchScore: 80,
      keyPointsCovered: ['Mentioned recurring questions', 'Referenced improvement over time'],
      learningOpportunities: ['Use "aggregates" for technical precision'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '03:54',
      question: 'Is Atlas expensive for a small sales team?',
      userActualAnswer: "It scales per user, so small teams pay less. It's designed to be accessible.",
      suggestedAnswer: 'Pricing scales per user, not per company.',
      matchScore: 88,
      keyPointsCovered: ['Explained per-user pricing', 'Addressed accessibility for small teams'],
      learningOpportunities: ['Emphasize "not per company" to remove ambiguity'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '04:24',
      question: 'Will Atlas help new SDRs get up to speed faster?',
      userActualAnswer: "Definitely. New reps can look at structured Q&A and playbook content to ramp up way faster.",
      suggestedAnswer: 'Yes, Atlas provides structured Q&A and playbook material to help new SDRs.',
      matchScore: 90,
      keyPointsCovered: ['Confirmed SDR ramp benefit', 'Mentioned structured Q&A and playbook'],
      learningOpportunities: ['Could reference specific ramp time reduction metrics'],
    },
    {
      source: 'Atlas Demo – Q&A Intelligence Validation', timestamp: '04:52',
      question: 'Will my team resist using another tool?',
      userActualAnswer: "That's a fair concern. The good news is it integrates into what you already use, so there's minimal change.",
      suggestedAnswer: "Atlas integrates into existing workflows, so it doesn't replace existing tools.",
      matchScore: 82,
      keyPointsCovered: ['Acknowledged concern', 'Mentioned integration with existing tools'],
      learningOpportunities: ['Use "workflows" to sound more process-oriented'],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '00:34',
      question: 'Does Atlas replace Salesforce?',
      userActualAnswer: "No, it complements Salesforce. It doesn't replace it.",
      suggestedAnswer: 'No, it does not replace Salesforce.',
      matchScore: 95,
      keyPointsCovered: ['Clear denial', 'Added "complements" for positive framing'],
      learningOpportunities: [],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '03:50',
      question: 'Why would representatives adopt this tool?',
      userActualAnswer: "Because it fits right into their calls and CRM — they don't have to change how they work.",
      suggestedAnswer: 'It integrates into calls and CRM workflows.',
      matchScore: 87,
      keyPointsCovered: ['Referenced call integration', 'Mentioned CRM workflows', 'Addressed ease of adoption'],
      learningOpportunities: [],
    },
    {
      source: 'Atlas Demo – Security & Enablement Deep Dive', timestamp: '04:02',
      question: 'What happens to our structured Q&A and playbook if we cancel our subscription?',
      userActualAnswer: "That depends on your plan, but we can definitely discuss data retention options.",
      suggestedAnswer: 'Data retention depends on your plan.',
      matchScore: 70,
      keyPointsCovered: ['Mentioned plan-dependent retention'],
      learningOpportunities: ['Be more specific about what happens to data', 'Prepare concrete retention policies to share'],
    },
  ],
};

// Helper: get alignment color classes
const getAlignmentColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-forskale-green', text: 'text-forskale-green', label: 'Excellent alignment', bgLight: 'bg-forskale-green/10', border: 'border-forskale-green/30' };
  if (score >= 50) return { bg: 'bg-forskale-blue', text: 'text-forskale-blue', label: 'Good alignment', bgLight: 'bg-forskale-blue/10', border: 'border-forskale-blue/30' };
  if (score >= 30) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Partial alignment', bgLight: 'bg-orange-500/10', border: 'border-orange-500/30' };
  return { bg: 'bg-destructive', text: 'text-destructive', label: 'Learning opportunity', bgLight: 'bg-destructive/10', border: 'border-destructive/30' };
};

// Calculate average alignment for a topic
const getTopicAvgScore = (questions: TopicQuestion[]) => {
  if (!questions.length) return 0;
  return Math.round(questions.reduce((sum, q) => sum + q.matchScore, 0) / questions.length);
};

// Chart data per metric per tab, keyed by date range
type ChartPoint = { name: string; value: number };

const salesPlaybookChartData: Record<string, Record<string, ChartPoint[]>> = {
  '7': {
    'Overall': [{ name: 'Mar 4', value: 52 }, { name: 'Mar 5', value: 58 }, { name: 'Mar 6', value: 65 }, { name: 'Mar 7', value: 71 }, { name: 'Mar 8', value: 68 }],
    'Handled objections': [{ name: 'Mar 4', value: 75 }, { name: 'Mar 5', value: 78 }, { name: 'Mar 6', value: 82 }, { name: 'Mar 7', value: 85 }, { name: 'Mar 8', value: 82 }],
    'Personalized demo': [{ name: 'Mar 4', value: 35 }, { name: 'Mar 5', value: 40 }, { name: 'Mar 6', value: 45 }, { name: 'Mar 7', value: 48 }, { name: 'Mar 8', value: 50 }],
    'Intro Banter': [{ name: 'Mar 4', value: 85 }, { name: 'Mar 5', value: 88 }, { name: 'Mar 6', value: 90 }, { name: 'Mar 7', value: 92 }, { name: 'Mar 8', value: 90 }],
    'Set Agenda': [{ name: 'Mar 4', value: 70 }, { name: 'Mar 5', value: 72 }, { name: 'Mar 6', value: 76 }, { name: 'Mar 7', value: 78 }, { name: 'Mar 8', value: 76 }],
    'Demo told a story': [{ name: 'Mar 4', value: 45 }, { name: 'Mar 5', value: 50 }, { name: 'Mar 6', value: 55 }, { name: 'Mar 7', value: 58 }, { name: 'Mar 8', value: 55 }],
  },
  '14': {
    'Overall': [{ name: 'Feb 25', value: 42 }, { name: 'Feb 26', value: 45 }, { name: 'Feb 27', value: 48 }, { name: 'Feb 28', value: 50 }, { name: 'Mar 1', value: 49 }, { name: 'Mar 2', value: 51 }, { name: 'Mar 3', value: 54 }, { name: 'Mar 4', value: 52 }, { name: 'Mar 5', value: 58 }, { name: 'Mar 6', value: 65 }, { name: 'Mar 7', value: 71 }, { name: 'Mar 8', value: 68 }, { name: 'Mar 9', value: 70 }, { name: 'Mar 10', value: 72 }],
    'Handled objections': [{ name: 'Feb 25', value: 62 }, { name: 'Feb 26', value: 65 }, { name: 'Feb 27', value: 68 }, { name: 'Feb 28', value: 70 }, { name: 'Mar 1', value: 72 }, { name: 'Mar 2', value: 74 }, { name: 'Mar 3', value: 73 }, { name: 'Mar 4', value: 75 }, { name: 'Mar 5', value: 78 }, { name: 'Mar 6', value: 82 }, { name: 'Mar 7', value: 85 }, { name: 'Mar 8', value: 82 }, { name: 'Mar 9', value: 84 }, { name: 'Mar 10', value: 83 }],
    'Personalized demo': [{ name: 'Feb 25', value: 22 }, { name: 'Feb 26', value: 25 }, { name: 'Feb 27', value: 28 }, { name: 'Feb 28', value: 30 }, { name: 'Mar 1', value: 32 }, { name: 'Mar 2', value: 33 }, { name: 'Mar 3', value: 34 }, { name: 'Mar 4', value: 35 }, { name: 'Mar 5', value: 40 }, { name: 'Mar 6', value: 45 }, { name: 'Mar 7', value: 48 }, { name: 'Mar 8', value: 50 }, { name: 'Mar 9', value: 49 }, { name: 'Mar 10', value: 51 }],
    'Intro Banter': [{ name: 'Feb 25', value: 78 }, { name: 'Feb 26', value: 80 }, { name: 'Feb 27', value: 82 }, { name: 'Feb 28', value: 84 }, { name: 'Mar 1', value: 83 }, { name: 'Mar 2', value: 85 }, { name: 'Mar 3', value: 86 }, { name: 'Mar 4', value: 85 }, { name: 'Mar 5', value: 88 }, { name: 'Mar 6', value: 90 }, { name: 'Mar 7', value: 92 }, { name: 'Mar 8', value: 90 }, { name: 'Mar 9', value: 91 }, { name: 'Mar 10', value: 90 }],
    'Set Agenda': [{ name: 'Feb 25', value: 60 }, { name: 'Feb 26', value: 62 }, { name: 'Feb 27', value: 64 }, { name: 'Feb 28', value: 66 }, { name: 'Mar 1', value: 65 }, { name: 'Mar 2', value: 67 }, { name: 'Mar 3', value: 69 }, { name: 'Mar 4', value: 70 }, { name: 'Mar 5', value: 72 }, { name: 'Mar 6', value: 76 }, { name: 'Mar 7', value: 78 }, { name: 'Mar 8', value: 76 }, { name: 'Mar 9', value: 77 }, { name: 'Mar 10', value: 78 }],
    'Demo told a story': [{ name: 'Feb 25', value: 30 }, { name: 'Feb 26', value: 33 }, { name: 'Feb 27', value: 35 }, { name: 'Feb 28', value: 38 }, { name: 'Mar 1', value: 40 }, { name: 'Mar 2', value: 42 }, { name: 'Mar 3', value: 44 }, { name: 'Mar 4', value: 45 }, { name: 'Mar 5', value: 50 }, { name: 'Mar 6', value: 55 }, { name: 'Mar 7', value: 58 }, { name: 'Mar 8', value: 55 }, { name: 'Mar 9', value: 57 }, { name: 'Mar 10', value: 56 }],
  },
  '30': {
    'Overall': [{ name: 'Week 1', value: 45 }, { name: 'Week 2', value: 52 }, { name: 'Week 3', value: 60 }, { name: 'Week 4', value: 68 }],
    'Handled objections': [{ name: 'Week 1', value: 65 }, { name: 'Week 2', value: 72 }, { name: 'Week 3', value: 78 }, { name: 'Week 4', value: 82 }],
    'Personalized demo': [{ name: 'Week 1', value: 25 }, { name: 'Week 2', value: 33 }, { name: 'Week 3', value: 40 }, { name: 'Week 4', value: 48 }],
    'Intro Banter': [{ name: 'Week 1', value: 80 }, { name: 'Week 2', value: 85 }, { name: 'Week 3', value: 88 }, { name: 'Week 4', value: 90 }],
    'Set Agenda': [{ name: 'Week 1', value: 62 }, { name: 'Week 2', value: 68 }, { name: 'Week 3', value: 73 }, { name: 'Week 4', value: 76 }],
    'Demo told a story': [{ name: 'Week 1', value: 32 }, { name: 'Week 2', value: 42 }, { name: 'Week 3', value: 50 }, { name: 'Week 4', value: 55 }],
  },
};

const speakingSkillsChartData: Record<string, Record<string, ChartPoint[]>> = {
  '7': {
    'Speech pace': [{ name: 'Mar 4', value: 138 }, { name: 'Mar 5', value: 140 }, { name: 'Mar 6', value: 142 }, { name: 'Mar 7', value: 145 }, { name: 'Mar 8', value: 144 }],
    'Talk ratio': [{ name: 'Mar 4', value: 52 }, { name: 'Mar 5', value: 55 }, { name: 'Mar 6', value: 58 }, { name: 'Mar 7', value: 61 }, { name: 'Mar 8', value: 60 }],
    'Longest customer monologue': [{ name: 'Mar 4', value: 42 }, { name: 'Mar 5', value: 45 }, { name: 'Mar 6', value: 47 }, { name: 'Mar 7', value: 50 }, { name: 'Mar 8', value: 49 }],
    'Questions asked': [{ name: 'Mar 4', value: 6 }, { name: 'Mar 5', value: 7 }, { name: 'Mar 6', value: 8 }, { name: 'Mar 7', value: 9 }, { name: 'Mar 8', value: 10 }],
    'Filler words': [{ name: 'Mar 4', value: 15 }, { name: 'Mar 5', value: 13 }, { name: 'Mar 6', value: 12 }, { name: 'Mar 7', value: 10 }, { name: 'Mar 8', value: 11 }],
  },
  '14': {
    'Speech pace': [{ name: 'Feb 25', value: 130 }, { name: 'Feb 26', value: 132 }, { name: 'Feb 27', value: 134 }, { name: 'Feb 28', value: 135 }, { name: 'Mar 1', value: 136 }, { name: 'Mar 2', value: 137 }, { name: 'Mar 3', value: 138 }, { name: 'Mar 4', value: 138 }, { name: 'Mar 5', value: 140 }, { name: 'Mar 6', value: 142 }, { name: 'Mar 7', value: 145 }, { name: 'Mar 8', value: 144 }, { name: 'Mar 9', value: 143 }, { name: 'Mar 10', value: 144 }],
    'Talk ratio': [{ name: 'Feb 25', value: 45 }, { name: 'Feb 26', value: 47 }, { name: 'Feb 27', value: 48 }, { name: 'Feb 28', value: 50 }, { name: 'Mar 1', value: 51 }, { name: 'Mar 2', value: 52 }, { name: 'Mar 3', value: 53 }, { name: 'Mar 4', value: 52 }, { name: 'Mar 5', value: 55 }, { name: 'Mar 6', value: 58 }, { name: 'Mar 7', value: 61 }, { name: 'Mar 8', value: 60 }, { name: 'Mar 9', value: 59 }, { name: 'Mar 10', value: 60 }],
    'Longest customer monologue': [{ name: 'Feb 25', value: 35 }, { name: 'Feb 26', value: 37 }, { name: 'Feb 27', value: 38 }, { name: 'Feb 28', value: 40 }, { name: 'Mar 1', value: 41 }, { name: 'Mar 2', value: 42 }, { name: 'Mar 3', value: 43 }, { name: 'Mar 4', value: 42 }, { name: 'Mar 5', value: 45 }, { name: 'Mar 6', value: 47 }, { name: 'Mar 7', value: 50 }, { name: 'Mar 8', value: 49 }, { name: 'Mar 9', value: 48 }, { name: 'Mar 10', value: 49 }],
    'Questions asked': [{ name: 'Feb 25', value: 4 }, { name: 'Feb 26', value: 4 }, { name: 'Feb 27', value: 5 }, { name: 'Feb 28', value: 5 }, { name: 'Mar 1', value: 6 }, { name: 'Mar 2', value: 6 }, { name: 'Mar 3', value: 7 }, { name: 'Mar 4', value: 6 }, { name: 'Mar 5', value: 7 }, { name: 'Mar 6', value: 8 }, { name: 'Mar 7', value: 9 }, { name: 'Mar 8', value: 10 }, { name: 'Mar 9', value: 9 }, { name: 'Mar 10', value: 10 }],
    'Filler words': [{ name: 'Feb 25', value: 20 }, { name: 'Feb 26', value: 19 }, { name: 'Feb 27', value: 18 }, { name: 'Feb 28', value: 17 }, { name: 'Mar 1', value: 16 }, { name: 'Mar 2', value: 16 }, { name: 'Mar 3', value: 15 }, { name: 'Mar 4', value: 15 }, { name: 'Mar 5', value: 13 }, { name: 'Mar 6', value: 12 }, { name: 'Mar 7', value: 10 }, { name: 'Mar 8', value: 11 }, { name: 'Mar 9', value: 10 }, { name: 'Mar 10', value: 11 }],
  },
  '30': {
    'Speech pace': [{ name: 'Week 1', value: 132 }, { name: 'Week 2', value: 137 }, { name: 'Week 3', value: 141 }, { name: 'Week 4', value: 144 }],
    'Talk ratio': [{ name: 'Week 1', value: 47 }, { name: 'Week 2', value: 52 }, { name: 'Week 3', value: 56 }, { name: 'Week 4', value: 60 }],
    'Longest customer monologue': [{ name: 'Week 1', value: 37 }, { name: 'Week 2', value: 42 }, { name: 'Week 3', value: 46 }, { name: 'Week 4', value: 49 }],
    'Questions asked': [{ name: 'Week 1', value: 5 }, { name: 'Week 2', value: 6 }, { name: 'Week 3', value: 8 }, { name: 'Week 4', value: 10 }],
    'Filler words': [{ name: 'Week 1', value: 18 }, { name: 'Week 2', value: 15 }, { name: 'Week 3', value: 12 }, { name: 'Week 4', value: 11 }],
  },
};

// Trend data for metric cards
const trendData: Record<string, Record<string, { value: number; direction: 'up' | 'down' | 'flat' }>> = {
  'Sales Playbook': {
    'Overall': { value: 12, direction: 'up' },
    'Handled objections': { value: 8, direction: 'up' },
    'Personalized demo': { value: 15, direction: 'up' },
    'Intro Banter': { value: 2, direction: 'flat' },
    'Set Agenda': { value: 6, direction: 'up' },
    'Demo told a story': { value: 18, direction: 'up' },
  },
  'Speaking Skills': {
    'Speech pace': { value: 4, direction: 'up' },
    'Talk ratio': { value: 10, direction: 'up' },
    'Longest customer monologue': { value: 12, direction: 'up' },
    'Questions asked': { value: 25, direction: 'up' },
    'Filler words': { value: 27, direction: 'down' },
  },
};

// Unit suffixes for chart Y-axis and tooltips
const metricUnits: Record<string, string> = {
  'Overall': '%', 'Handled objections': '%', 'Personalized demo': '%',
  'Intro Banter': '%', 'Set Agenda': '%', 'Demo told a story': '%',
  'Speech pace': ' wpm', 'Talk ratio': '%', 'Longest customer monologue': ' sec',
  'Questions asked': '', 'Filler words': '',
};

const MetricCard = ({ title, value, subtext, isActive = false, onClick, trend }: {
  title: string; value: string; subtext: string; isActive?: boolean; onClick?: () => void;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' };
}) => (
  <div
    onClick={onClick}
    className={cn(
      "flex flex-col rounded-xl border bg-secondary/30 backdrop-blur-sm px-4 py-3 transition-all duration-300 cursor-pointer group relative overflow-hidden",
      isActive ? "border-primary shadow-[0_0_20px_hsl(var(--forskale-teal)/0.2)]" : "border-border/30 hover:border-border/60",
      "hover:bg-secondary/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-forskale-green/5 to-forskale-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="flex items-center justify-center gap-1.5 mb-1.5 relative z-10">
      <span className="text-[11px] font-semibold text-muted-foreground text-center truncate">{title}</span>
      <Info className="h-2.5 w-2.5 text-muted-foreground/60 hover:text-primary transition-colors shrink-0" />
    </div>
    <div className="relative z-10 text-center mb-1">
      <p className={cn(
        "text-sm font-bold font-display tabular-nums transition-all duration-300",
        isActive
          ? "text-transparent bg-clip-text bg-gradient-to-r from-forskale-green to-forskale-teal"
          : "text-muted-foreground group-hover:text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtext}</p>
      {trend && (
        <div className={cn("flex items-center justify-center gap-0.5 mt-1 text-[10px] font-medium", {
          'text-forskale-green': trend.direction === 'up',
          'text-destructive': trend.direction === 'down',
          'text-muted-foreground': trend.direction === 'flat',
        })}>
          {trend.direction === 'up' && <ArrowUp className="h-2.5 w-2.5" />}
          {trend.direction === 'down' && <ArrowDown className="h-2.5 w-2.5" />}
          {trend.direction === 'flat' && <ArrowRight className="h-2.5 w-2.5" />}
          {trend.value}%
        </div>
      )}
    </div>
    <div className="mt-auto h-0.5 w-full bg-border/30 rounded-full overflow-hidden relative z-10">
      <div className={cn(
        "h-full transition-all duration-500 rounded-full",
        isActive
          ? "w-full bg-gradient-to-r from-forskale-green to-forskale-teal"
          : "w-0 group-hover:w-1/4 bg-muted-foreground/30"
      )} />
    </div>
  </div>
);

// Alignment Score Bar component
const AlignmentBar = ({ score, size = 'default' }: { score: number; size?: 'default' | 'mini' }) => {
  const colors = getAlignmentColor(score);
  const isMini = size === 'mini';
  return (
    <div className={cn("flex items-center gap-2", isMini ? "gap-1.5" : "gap-3")}>
      <div className={cn("flex-1 rounded-full overflow-hidden", isMini ? "h-1.5" : "h-2.5", "bg-border/20")}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bg)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("font-bold tabular-nums shrink-0", isMini ? "text-[11px]" : "text-sm", colors.text)}>
        {score}%
      </span>
    </div>
  );
};
// Collapsible Coaching Details component
const CoachingDetails = ({ keyPointsCovered, learningOpportunities }: { keyPointsCovered: string[]; learningOpportunities: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/10 bg-secondary/10 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-secondary/20 transition-all duration-200"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-primary" />
          View Coaching Details
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {keyPointsCovered.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-forskale-green mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> What you covered well
              </p>
              <ul className="space-y-1">
                {keyPointsCovered.map((point, pi) => (
                  <li key={pi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-forskale-green mt-0.5 shrink-0">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {learningOpportunities.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-forskale-blue mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Learning opportunities
              </p>
              <ul className="space-y-1">
                {learningOpportunities.map((point, pi) => (
                  <li key={pi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-forskale-blue mt-0.5 shrink-0">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type TabMetrics = {
  [key: string]: { title: string; value: string; subtext: string }[];
};

const tabMetrics: TabMetrics = {
  'Sales Playbook': [
    { title: 'Overall', value: '68%', subtext: 'Avg.' },
    { title: 'Handled objections', value: '82%', subtext: 'Avg.' },
    { title: 'Personalized demo', value: '45%', subtext: 'Avg.' },
    { title: 'Intro Banter', value: '90%', subtext: 'Avg.' },
    { title: 'Set Agenda', value: '76%', subtext: 'Avg.' },
    { title: 'Demo told a story', value: '55%', subtext: 'Avg.' },
  ],
  'Speaking Skills': [
    { title: 'Speech pace', value: '142', subtext: 'wpm Avg.' },
    { title: 'Talk ratio', value: '58%', subtext: 'Avg.' },
    { title: 'Longest customer monologue', value: '47', subtext: 'sec. Avg.' },
    { title: 'Questions asked', value: '8', subtext: 'Avg.' },
    { title: 'Filler words', value: '12', subtext: 'Avg.' },
  ],
};

const objectionTopics = [
  { topic: 'Pricing and ROI', percentage: 85, calls: 12, questions: 18 },
  { topic: 'Implementation timeline', percentage: 67, calls: 8, questions: 12 },
  { topic: 'Integration capabilities', percentage: 50, calls: 6, questions: 9 },
  { topic: 'Security and compliance', percentage: 42, calls: 5, questions: 7 },
  { topic: 'Competitor comparisons', percentage: 33, calls: 4, questions: 6 },
  { topic: 'Other questions', percentage: 25, calls: 3, questions: 8 },
];

const tabDescriptions: { [key: string]: string } = {
  'Sales Playbook': 'The graph below measures your playbook performance for each call, over time. Click a metric card to change the graph.',
  'Speaking Skills': 'The graph below measures speaking skills for each call, over time. Click a metric card to change the graph.',
  'Objection Handling': 'Compare your actual responses to playbook best practices. Color-coded alignment scores help you instantly spot strengths and coaching opportunities.',
};

const isObjectionHandling = (tab: string) => tab === 'Objection Handling';

const dateRangeOptions = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className="text-primary font-bold tabular-nums">
          {payload[0].value}{unit}
        </p>
      </div>
    );
  }
  return null;
};

const Performance = () => {
  const [activeTab, setActiveTab] = useState('Sales Playbook');
  const [activeMetric, setActiveMetric] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const tabs = ['Sales Playbook', 'Speaking Skills', 'Objection Handling'];
  const metrics = tabMetrics[activeTab] || [];
  const activeMetricResolved = activeMetric && metrics.some(m => m.title === activeMetric) ? activeMetric : metrics[0]?.title;

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setActiveMetric('');
  };

  // Close date dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showObjectionHandling = isObjectionHandling(activeTab);

  // Get chart data based on active tab, metric, and date range
  const getChartData = (): ChartPoint[] => {
    const dataSource = activeTab === 'Sales Playbook' ? salesPlaybookChartData : speakingSkillsChartData;
    return dataSource[dateRange]?.[activeMetricResolved] || [];
  };

  const chartData = getChartData();
  const unit = metricUnits[activeMetricResolved] || '';

  const getChartTitle = () => {
    const rangeName = dateRangeOptions.find(o => o.value === dateRange)?.label || 'Last 7 days';
    if (activeTab === 'Sales Playbook') {
      return `${activeMetricResolved} across calls (${rangeName.toLowerCase()})`;
    }
    return `${activeMetricResolved} across calls (${rangeName.toLowerCase()})`;
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-background text-foreground">
      <div className="absolute inset-0 bg-forskale-blue/[0.02] pointer-events-none" />

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 font-display">
              Performance across calls
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {tabDescriptions[activeTab]}
            </p>
          </div>
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/30 bg-secondary/30 text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary hover:text-foreground transition-all backdrop-blur-sm"
            >
              <Calendar className="h-4 w-4 text-primary" />
              {dateRangeOptions.find(o => o.value === dateRange)?.label}
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground/60 transition-transform", showDateDropdown && "rotate-180")} />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border/30 bg-background shadow-2xl overflow-hidden z-50">
                {dateRangeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setDateRange(opt.value); setShowDateDropdown(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      dateRange === opt.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-8 border-b border-border/30 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "pb-3 text-sm font-medium transition-all relative",
                activeTab === tab ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-forskale-green to-forskale-teal shadow-[0_0_8px_hsl(var(--forskale-teal))]" />
              )}
            </button>
          ))}
        </nav>

        {showObjectionHandling ? (
          /* Objection Handling — Coaching Comparison View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Playbook alignment by topic — expand to compare your answers
              </p>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 bg-background text-sm text-muted-foreground hover:bg-secondary/50 transition-all">
                <span className="text-primary">✦</span>
                Analyze last 5 days
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {objectionTopics.map((item) => {
                const isExpanded = expandedTopics[item.topic];
                const questions = topicQuestions[item.topic] || [];
                const avgScore = getTopicAvgScore(questions);
                const avgColors = getAlignmentColor(avgScore);
                return (
                  <div key={item.topic} className="rounded-xl border border-border/20 overflow-hidden transition-all duration-300">
                    <div
                      onClick={() => questions.length > 0 && toggleTopic(item.topic)}
                      className={cn(
                        "flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-all",
                        questions.length > 0 && "cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm font-bold text-forskale-green shrink-0">{item.percentage}%</span>
                        <span className="text-sm font-medium text-foreground">{item.topic}</span>
                        {/* Mini alignment bar for topic overview */}
                        <div className="flex items-center gap-2 ml-auto mr-4 w-32">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-border/20">
                            <div
                              className={cn("h-full rounded-full transition-all duration-700", avgColors.bg)}
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                          <span className={cn("text-[11px] font-bold tabular-nums", avgColors.text)}>{avgScore}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                        <span>{item.calls} calls · {item.questions} questions</span>
                        {questions.length > 0 ? (
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {questions.length > 0 && (
                        <div className="border-t border-border/20 bg-background divide-y divide-border/10">
                          {questions.map((q, i) => {
                            const scoreColors = getAlignmentColor(q.matchScore);
                            return (
                              <div key={i} className="px-6 py-5">
                                {/* Source & timestamp */}
                                <p className="text-xs text-muted-foreground mb-3">
                                  {q.source} at <span className="text-primary font-medium">{q.timestamp}</span>
                                </p>

                                {/* Customer Question */}
                                <div className="flex items-start gap-2 mb-4">
                                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-sm font-semibold text-foreground">{q.question}</p>
                                </div>

                                {/* Your Answer */}
                                <div className="rounded-lg border border-border/20 bg-secondary/20 p-4 mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Answer</span>
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed italic">"{q.userActualAnswer}"</p>
                                </div>

                                {/* Alignment Score */}
                                <div className={cn("rounded-lg border p-4 mb-3", scoreColors.bgLight, scoreColors.border)}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Playbook Alignment</span>
                                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", scoreColors.bgLight, scoreColors.text)}>
                                      {scoreColors.label}
                                    </span>
                                  </div>
                                  <AlignmentBar score={q.matchScore} />
                                </div>

                                {/* Suggested Answer */}
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Suggested Answer</span>
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed">{q.suggestedAnswer}</p>
                                </div>

                                {/* Key Points Analysis - Collapsible */}
                                {(q.keyPointsCovered.length > 0 || q.learningOpportunities.length > 0) && (
                                  <CoachingDetails keyPointsCovered={q.keyPointsCovered} learningOpportunities={q.learningOpportunities} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Metric Cards - Vertical on left */}
            <div className="flex flex-col gap-2 w-36 shrink-0">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.title}
                  {...metric}
                  isActive={activeMetricResolved === metric.title}
                  onClick={() => setActiveMetric(metric.title)}
                  trend={trendData[activeTab]?.[metric.title]}
                />
              ))}
            </div>

            {/* Chart on right */}
            <div className="flex-1 rounded-3xl border border-border/30 bg-secondary/20 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-2 flex items-center gap-3">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-gradient-to-r from-forskale-green to-forskale-teal text-primary-foreground">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <h3 className="text-sm font-semibold text-foreground transition-all duration-300">
                  {getChartTitle()}
                </h3>
              </div>

              <div className="px-6 pb-6">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 3" stroke="hsl(224, 30%, 20%)" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${unit}`} />
                      <RechartsTooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: 'hsl(174, 56%, 55%)', strokeWidth: 1, strokeDasharray: '4 3' }} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(174, 56%, 55%)"
                        strokeWidth={2}
                        fill="url(#chartFill)"
                        strokeLinecap="round"
                        animationDuration={600}
                        dot={{ r: 3, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                    <Filter className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-gradient-to-r from-forskale-green to-forskale-teal text-primary-foreground hover:opacity-90 transition-all">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
