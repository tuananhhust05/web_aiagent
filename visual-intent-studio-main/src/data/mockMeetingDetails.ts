// ── Enhanced Meeting Details ──
// Rich mock data for calendar meetings with attendees, topics, action items, notes, and status

export interface MeetingAttendee {
  id: string;
  name: string;
  initials: string;
  email?: string;
  avatar?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  owner?: string;
}

export interface MeetingDetails {
  id: string;
  company: string;
  attendees: MeetingAttendee[];
  status: 'upcoming' | 'completed' | 'in-progress';
  topics: string[];
  actionItems: ActionItem[];
  notes: string;
  recordingUrl?: string;
}

// Keyed by meeting ID from MOCK_MEETINGS in CalendarView
export const MEETING_DETAILS: Record<string, MeetingDetails> = {
  "1": {
    id: "1",
    company: "Lavazza",
    attendees: [
      { id: "a1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "a2", name: "Marco Rossi", initials: "MR", email: "marco@lavazza.com" },
    ],
    status: "completed",
    topics: [
      "Product quality standards",
      "Supply chain optimization",
      "Sustainability initiatives",
    ],
    actionItems: [
      { id: "ai-1", title: "Provide quarterly report", completed: true, dueDate: "2026-03-10", owner: "Andrea Marino" },
      { id: "ai-2", title: "Schedule follow-up meeting", completed: false, dueDate: "2026-03-20", owner: "Andrea Marino" },
    ],
    notes: "Client satisfied with current partnership. Strong potential for Q3 expansion.",
  },
  "13": {
    id: "13",
    company: "ForSkale",
    attendees: [
      { id: "b1", name: "Andrea Marino", initials: "AM" },
      { id: "b2", name: "Laura Bianchi", initials: "LB" },
      { id: "b3", name: "Marco Romano", initials: "MR" },
      { id: "b4", name: "Giorgio Vittori", initials: "GV" },
      { id: "b5", name: "Sara Rossi", initials: "SR" },
    ],
    status: "upcoming",
    topics: [
      "Weekly objectives review",
      "Q2 targets alignment",
      "Pipeline updates",
    ],
    actionItems: [
      { id: "ai-3", title: "Update forecast numbers", completed: false, dueDate: "2026-03-03", owner: "Laura Bianchi" },
      { id: "ai-4", title: "Share client feedback summary", completed: false, dueDate: "2026-03-03", owner: "Marco Romano" },
    ],
    notes: "30-minute weekly sync. Recording available in Teams.",
    recordingUrl: "https://example.com/recording",
  },
  "2": {
    id: "2",
    company: "Nova Consulting",
    attendees: [
      { id: "c1", name: "Laura Bianchi", initials: "LB", email: "laura@novaconsulting.com" },
      { id: "c2", name: "Marco Romano", initials: "MR", email: "marco@novaconsulting.com" },
      { id: "c3", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
    ],
    status: "upcoming",
    topics: [
      "Enterprise solution implementation",
      "ROI analysis",
      "Deployment timeline",
    ],
    actionItems: [
      { id: "ai-5", title: "Send proposal", completed: false, dueDate: "2026-03-07", owner: "Andrea Marino" },
      { id: "ai-6", title: "Schedule technical deep-dive", completed: false, dueDate: "2026-03-10", owner: "Andrea Marino" },
    ],
    notes: "High-priority client. Enterprise deal potential worth $500K+",
  },
  "3": {
    id: "3",
    company: "Barilla Group",
    attendees: [
      { id: "d1", name: "Giorgio Vittori", initials: "GV", email: "giorgio@barilla.com" },
      { id: "d2", name: "Andrea Esposito", initials: "AE", email: "andrea.e@barilla.com" },
      { id: "d3", name: "Marco Neri", initials: "MN", email: "marco@barilla.com" },
      { id: "d4", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
    ],
    status: "upcoming",
    topics: [
      "Market expansion strategy",
      "Distribution channels optimization",
      "Pricing strategy review",
    ],
    actionItems: [
      { id: "ai-7", title: "Prepare competitive analysis", completed: false, dueDate: "2026-03-12", owner: "Giorgio Vittori" },
      { id: "ai-8", title: "Deliver market research report", completed: false, dueDate: "2026-03-15", owner: "Andrea Marino" },
    ],
    notes: "Strategic partnership discussion. Potential for long-term collaboration.",
  },
  "4": {
    id: "4",
    company: "Ferrero SpA",
    attendees: [
      { id: "e1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
    ],
    status: "upcoming",
    topics: [
      "Annual contract review",
      "Performance metrics analysis",
      "Renewal terms negotiation",
    ],
    actionItems: [
      { id: "ai-9", title: "Prepare contract renewal proposal", completed: false, dueDate: "2026-03-14", owner: "Andrea Marino" },
      { id: "ai-10", title: "Review Q1 performance data", completed: false, dueDate: "2026-03-06", owner: "Andrea Marino" },
    ],
    notes: "Key account review. Top 5 client. Current contract value: $250K annually.",
  },
  "5": {
    id: "5",
    company: "Pirelli",
    attendees: [
      { id: "f1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "f2", name: "Marco Ferretti", initials: "MF", email: "marco.f@pirelli.com" },
    ],
    status: "upcoming",
    topics: [
      "B2B partnership opportunities",
      "Product integration possibilities",
      "Market reach expansion",
    ],
    actionItems: [
      { id: "ai-11", title: "Technical specification review", completed: false, dueDate: "2026-03-12", owner: "Andrea Marino" },
      { id: "ai-12", title: "Prepare integration roadmap", completed: false, dueDate: "2026-03-20", owner: "Andrea Marino" },
    ],
    notes: "Exploring B2B partnership. Potential for product bundling.",
  },
  "6": {
    id: "6",
    company: "ForSkale",
    attendees: [
      { id: "g1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "g2", name: "Marco Verdi", initials: "MV", email: "marco.verdi@forskale.com" },
    ],
    status: "upcoming",
    topics: [
      "Career development discussion",
      "Q1 performance review",
      "Team feedback and goals",
    ],
    actionItems: [
      { id: "ai-13", title: "Prepare performance review document", completed: false, dueDate: "2026-03-06", owner: "Andrea Marino" },
      { id: "ai-14", title: "Discuss upskilling opportunities", completed: false, dueDate: "2026-03-06", owner: "Andrea Marino" },
    ],
    notes: "Quarterly 1-on-1 check-in. Strong performer, potential for promotion.",
  },
  "7": {
    id: "7",
    company: "UniCredit",
    attendees: [
      { id: "h1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "h2", name: "Francesca Conti", initials: "FC", email: "f.conti@unicredit.it" },
      { id: "h3", name: "Paolo Ricci", initials: "PR", email: "p.ricci@unicredit.it" },
    ],
    status: "upcoming",
    topics: [
      "Annual account performance review",
      "Renewal timeline discussion",
      "Cross-sell opportunities",
    ],
    actionItems: [
      { id: "ai-15", title: "Send annual performance summary", completed: false, dueDate: "2026-03-14", owner: "Andrea Marino" },
    ],
    notes: "Long-standing client. Annual review cycle begins.",
  },
  "8": {
    id: "8",
    company: "Campari Group",
    attendees: [
      { id: "i1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "i2", name: "Elena Moretti", initials: "EM", email: "e.moretti@campari.com" },
    ],
    status: "upcoming",
    topics: [
      "Brand strategy alignment",
      "Digital transformation roadmap",
      "Q2 campaign planning",
    ],
    actionItems: [
      { id: "ai-16", title: "Draft brand strategy proposal", completed: false, dueDate: "2026-03-18", owner: "Andrea Marino" },
    ],
    notes: "Discovery call to understand their digital transformation needs.",
  },
  "9": {
    id: "9",
    company: "Prada",
    attendees: [
      { id: "j1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "j2", name: "Valentina Serra", initials: "VS", email: "v.serra@prada.com" },
    ],
    status: "upcoming",
    topics: [
      "Partnership framework",
      "Luxury market positioning",
      "Joint venture feasibility",
    ],
    actionItems: [
      { id: "ai-17", title: "Prepare partnership proposal", completed: false, dueDate: "2026-03-20", owner: "Andrea Marino" },
    ],
    notes: "High-value partnership opportunity in luxury segment.",
  },
  "10": {
    id: "10",
    company: "Enel",
    attendees: [
      { id: "k1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "k2", name: "Luca Galli", initials: "LG", email: "l.galli@enel.com" },
      { id: "k3", name: "Sara Colombo", initials: "SC", email: "s.colombo@enel.com" },
    ],
    status: "upcoming",
    topics: [
      "Sustainability metrics review",
      "Green energy initiative update",
      "Internal process alignment",
    ],
    actionItems: [
      { id: "ai-18", title: "Compile sustainability report", completed: false, dueDate: "2026-03-22", owner: "Luca Galli" },
    ],
    notes: "Internal sync on sustainability targets and green energy initiatives.",
  },
  "11": {
    id: "11",
    company: "Generali",
    attendees: [
      { id: "l1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "l2", name: "Roberto Fontana", initials: "RF", email: "r.fontana@generali.com" },
    ],
    status: "upcoming",
    topics: [
      "Q1 pipeline review",
      "Renewal forecast",
      "Upsell opportunities",
    ],
    actionItems: [
      { id: "ai-19", title: "Prepare Q1 pipeline deck", completed: false, dueDate: "2026-03-22", owner: "Andrea Marino" },
    ],
    notes: "Quarterly pipeline check-in. Strong renewal candidate.",
  },
  "12": {
    id: "12",
    company: "Luxottica",
    attendees: [
      { id: "m1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "m2", name: "Chiara Lombardi", initials: "CL", email: "c.lombardi@luxottica.com" },
    ],
    status: "upcoming",
    topics: [
      "Lens innovation partnership",
      "R&D collaboration framework",
      "Market opportunity analysis",
    ],
    actionItems: [
      { id: "ai-20", title: "Send R&D collaboration brief", completed: false, dueDate: "2026-03-25", owner: "Andrea Marino" },
    ],
    notes: "Exploring innovation partnership in lens technology.",
  },
  "14": {
    id: "14",
    company: "Benetton",
    attendees: [
      { id: "n1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "n2", name: "Matteo Zanetti", initials: "MZ", email: "m.zanetti@benetton.com" },
      { id: "n3", name: "Giulia Ferro", initials: "GF", email: "g.ferro@benetton.com" },
    ],
    status: "upcoming",
    topics: [
      "Retail expansion strategy",
      "Digital storefront integration",
      "Customer analytics platform",
    ],
    actionItems: [
      { id: "ai-21", title: "Prepare retail expansion proposal", completed: false, dueDate: "2026-03-28", owner: "Andrea Marino" },
    ],
    notes: "Benetton looking to modernize their retail analytics stack.",
  },
  "15": {
    id: "15",
    company: "Illy Coffee",
    attendees: [
      { id: "o1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "o2", name: "Alessandra Greco", initials: "AG", email: "a.greco@illy.com" },
    ],
    status: "upcoming",
    topics: [
      "New market entry strategy",
      "Distribution partnership",
      "Brand positioning in APAC",
    ],
    actionItems: [
      { id: "ai-22", title: "Market entry analysis for APAC", completed: false, dueDate: "2026-03-30", owner: "Andrea Marino" },
    ],
    notes: "Illy exploring expansion into Asian markets. Discovery phase.",
  },
  "16": {
    id: "16",
    company: "Maserati",
    attendees: [
      { id: "p1", name: "Andrea Marino", initials: "AM", email: "andrea@forskale.com" },
      { id: "p2", name: "Davide Marchetti", initials: "DM", email: "d.marchetti@maserati.com" },
      { id: "p3", name: "Silvia Rizzo", initials: "SR", email: "s.rizzo@maserati.com" },
    ],
    status: "upcoming",
    topics: [
      "Fleet deal negotiations",
      "Volume pricing structure",
      "Delivery timeline alignment",
    ],
    actionItems: [
      { id: "ai-23", title: "Fleet pricing proposal", completed: false, dueDate: "2026-04-01", owner: "Davide Marchetti" },
      { id: "ai-24", title: "Logistics feasibility study", completed: false, dueDate: "2026-04-05", owner: "Andrea Marino" },
    ],
    notes: "Major fleet deal opportunity. Maserati expanding corporate fleet program.",
  },
};

export function getMeetingDetails(meetingId: string): MeetingDetails | null {
  return MEETING_DETAILS[meetingId] ?? null;
}
