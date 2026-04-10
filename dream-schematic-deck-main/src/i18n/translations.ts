export type Language = "IT" | "EN";

const translations = {
  // ── Top bar ──
  "topbar.title": { EN: "Meeting Insight", IT: "Analisi Meeting" },

  // ── PersonalisationCard ──
  "hello": { EN: "Hello", IT: "Ciao" },
  "meetings.today": { EN: "meeting today", IT: "meeting oggi" },
  "meetings.today.plural": { EN: "meetings today", IT: "meeting oggi" },
  "meetings.completed": { EN: "completed", IT: "completati" },
  "meetings.remaining": { EN: "remaining", IT: "rimanenti" },
  "meetings.allDone": { EN: "all done for today", IT: "tutto fatto per oggi" },
  "insights.notChecked.singular": { EN: "insight", IT: "insight" },
  "insights.notChecked.plural": { EN: "insights", IT: "insight" },
  "insights.notReviewed": { EN: "you haven't reviewed yet", IT: "non ancora revisionate" },
  "insights.notStrategized.singular": { EN: "meeting", IT: "meeting" },
  "insights.notStrategized.plural": { EN: "meetings", IT: "meeting" },
  "insights.reviewedNotStrategized": { EN: "reviewed but not yet strategized", IT: "revisionate ma non ancora strategizzate" },
  "insights.allClear": { EN: "All insights reviewed and strategized — you're on top of it!", IT: "Tutte le analisi revisionate e strategizzate — ottimo lavoro!" },

  // ── JustCompletedSection ──
  "justCompleted.title": { EN: "Just completed", IT: "Appena completati" },
  "justCompleted.subtitle": { EN: "from your last session", IT: "dalla tua ultima sessione" },
  "justCompleted.new": { EN: "new", IT: "nuovi" },
  "justCompleted.insightReady": { EN: "✓ Evaluation, key moments and next actions are ready", IT: "✓ Valutazione, momenti chiave e azioni successive pronti" },
  "justCompleted.generating": { EN: "Insight is being generated…", IT: "Analisi in generazione…" },
  "justCompleted.viewInsight": { EN: "View insight", IT: "Vedi analisi" },
  "justCompleted.processing": { EN: "Processing…", IT: "In elaborazione…" },

  // ── StatCards ──
  "stats.meetingsThisWeek": { EN: "Meetings this week", IT: "Meeting questa settimana" },
  "stats.belowInterest": { EN: "Below 40% interest", IT: "Sotto 40% interesse" },
  "stats.unreviewedInsights": { EN: "Unreviewed insights", IT: "Analisi non revisionate" },
  "stats.avgInterest": { EN: "Avg. Interest %", IT: "Interesse medio %" },

  // ── DashboardTabs ──
  "tabs.allMeetings": { EN: "All meetings", IT: "Tutti i meeting" },
  "tabs.belowInterest": { EN: "Below 40% interest", IT: "Sotto 40% interesse" },
  "tabs.unreviewedInsights": { EN: "Unreviewed insights", IT: "Analisi non revisionate" },
  "tabs.allCompanies": { EN: "All Companies", IT: "Tutte le aziende" },

  // ── Call Insights detail view ──
  "detail.overview": { EN: "Overview", IT: "Panoramica" },
  "detail.playbook": { EN: "of sales playbook executed", IT: "del playbook commerciale eseguito" },
  "detail.speakers": { EN: "speakers", IT: "partecipanti" },

  // ── Tabs ──
  "tab.evaluation": { EN: "Evaluation", IT: "Valutazione" },
  "tab.evaluation.subtitle": { EN: "What happened and what to do next", IT: "Cosa è successo e cosa fare" },
  "tab.enablement": { EN: "Enablement", IT: "Formazione" },
  "tab.enablement.subtitle": { EN: "Your performance and improvement areas", IT: "Le tue performance e aree di miglioramento" },
  "tab.summary": { EN: "Smart Summary", IT: "Sintesi Intelligente" },
  "tab.summary.subtitle": { EN: "Cross-meeting intelligence that tracks deal evolution and detects strategic shifts", IT: "Intelligence cross-meeting che traccia l'evoluzione del deal e rileva cambiamenti strategici" },

  // ── EvaluationTab ──
  "eval.callSummary": { EN: "Call Summary", IT: "Riepilogo Chiamata" },
  "eval.dealStage": { EN: "Deal Stage:", IT: "Fase Deal:" },
  "eval.likelihood": { EN: "likelihood", IT: "probabilità" },
  "eval.keyMoments": { EN: "Key Moments", IT: "Momenti Chiave" },
  "eval.nextActions": { EN: "Next Actions", IT: "Prossime Azioni" },
  "eval.nextActions.subtitle": { EN: "Your immediate priorities to move this deal forward", IT: "Le tue priorità immediate per far progredire questo deal" },
  "eval.sendEmail": { EN: "Send Email", IT: "Invia Email" },
  "eval.addToTasks": { EN: "Add to Tasks", IT: "Aggiungi ai Task" },
  "eval.setReminder": { EN: "Set Reminder", IT: "Imposta Promemoria" },
  "eval.prepareSuccess": { EN: "Prepare for Success", IT: "Preparati al Successo" },
  "eval.prepareSuccess.desc": { EN: "Get AI-powered guidance on meeting structure, talking points, and objection handling for your next interaction.", IT: "Ottieni suggerimenti AI su struttura del meeting, punti di discussione e gestione delle obiezioni per la prossima interazione." },
  "eval.strategizeNext": { EN: "Strategize Next Meeting", IT: "Strategizza Prossimo Meeting" },
  "eval.whyMatters": { EN: "Why These Actions Matter", IT: "Perché Queste Azioni Contano" },
  "eval.whyMatters.subtitle": { EN: "Here's what you uncovered and why it matters:", IT: "Ecco cosa hai scoperto e perché è importante:" },

  // ── Successful / Neutral / Needs Attention ──
  "status.successful": { EN: "Successful Progression", IT: "Progressione Positiva" },
  "status.neutral": { EN: "Neutral", IT: "Neutrale" },
  "status.needsAttention": { EN: "Needs Attention", IT: "Richiede Attenzione" },

  // ── EnablementTab ──
  "enablement.title": { EN: "Enablement & Skills Development", IT: "Formazione & Sviluppo Competenze" },
  "enablement.subtitle": { EN: "Your performance across all meetings", IT: "Le tue performance in tutti i meeting" },
  "enablement.basedOn": { EN: "Based on 12 meetings this month", IT: "Basato su 12 meeting questo mese" },
  "enablement.feedback": { EN: "Feedback", IT: "Feedback" },
  "enablement.playbook": { EN: "Playbook", IT: "Playbook" },
  "enablement.metrics": { EN: "Your Performance Metrics", IT: "Le Tue Metriche di Performance" },
  "enablement.aiCoach": { EN: "AI Coach Insights", IT: "Suggerimenti AI Coach" },
  "enablement.improve": { EN: "Where You Can Improve", IT: "Dove Puoi Migliorare" },
  "enablement.strengths": { EN: "Your Strengths", IT: "I Tuoi Punti di Forza" },
  "enablement.improving": { EN: "↑ improving", IT: "↑ in miglioramento" },
  "enablement.progress": { EN: "Your Progress Over Time", IT: "I Tuoi Progressi nel Tempo" },
  "enablement.progressSoon": { EN: "Progress tracking visualization coming soon", IT: "Visualizzazione progressi in arrivo" },
  "enablement.last7": { EN: "Last 7 days", IT: "Ultimi 7 giorni" },
  "enablement.last30": { EN: "Last 30 days", IT: "Ultimi 30 giorni" },
  "enablement.allTime": { EN: "All time", IT: "Da sempre" },

  // ── SummaryTab ──
  "summary.title": { EN: "Smart Summary", IT: "Sintesi Intelligente" },
  "summary.subtitle": { EN: "Cross-meeting intelligence that tracks deal evolution and detects strategic shifts", IT: "Intelligence cross-meeting che traccia l'evoluzione del deal e rileva cambiamenti strategici" },
  "summary.dealEvolution": { EN: "Deal Evolution", IT: "Evoluzione Deal" },
  "summary.dealEvolution.desc": { EN: "How this opportunity has progressed across meetings", IT: "Come questa opportunità è progredita nei meeting" },
  "summary.thenVsNow": { EN: "Then vs Now", IT: "Prima vs Ora" },
  "summary.dealHealth": { EN: "Deal Health Snapshot", IT: "Stato di Salute Deal" },
  "summary.discussionTopics": { EN: "Discussion Topics", IT: "Argomenti di Discussione" },
  "summary.topicEvolution": { EN: "Topic evolution across your meetings", IT: "Evoluzione degli argomenti nei tuoi meeting" },
  "summary.strategicDirection": { EN: "Strategic Direction", IT: "Direzione Strategica" },
  "summary.strategicDirection.desc": { EN: "Based on deal state, conversation patterns, and historical context", IT: "Basato su stato del deal, pattern conversazionali e contesto storico" },
  "summary.currentContext": { EN: "Current Meeting Context", IT: "Contesto Meeting Attuale" },
  "summary.rawData": { EN: "Raw data", IT: "Dati grezzi" },

  // ── BrowseNav ──
  "browse.browse": { EN: "Browse", IT: "Esplora" },
  "browse.thisWeek": { EN: "This week", IT: "Questa settimana" },
  "browse.thisMonth": { EN: "This month", IT: "Questo mese" },
  "browse.allHistory": { EN: "All history", IT: "Tutto lo storico" },
  "browse.companies": { EN: "Companies", IT: "Aziende" },

  // ── PersonalisationCard ──
  "personalisation.lastReady": { EN: "Your last meeting insight is ready", IT: "La tua ultima analisi meeting è pronta" },
  "personalisation.allClear": { EN: "All meeting insights reviewed and you are on top", IT: "Tutte le analisi meeting revisionate — ottimo lavoro" },

  // ── BrowseNav extras ──
  "browse.unviewedInsights": { EN: "Unviewed insights", IT: "Analisi non viste" },
  "browse.search": { EN: "Search", IT: "Cerca" },
  "browse.searchPlaceholder": { EN: "Company, date, topic...", IT: "Azienda, data, argomento..." },

  // ── Date labels ──
  "date.today": { EN: "Today", IT: "Oggi" },
  "date.yesterday": { EN: "Yesterday", IT: "Ieri" },
  "date.new": { EN: "new", IT: "nuovi" },

  // ── Misc ──
  "now": { EN: "Now", IT: "Adesso" },
  "within24h": { EN: "Within 24h", IT: "Entro 24h" },
  "thisWeek": { EN: "This week", IT: "Questa settimana" },
  "thisMonth": { EN: "This month", IT: "Questo mese" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  return entry?.[lang] ?? entry?.["EN"] ?? key;
}

export default translations;
