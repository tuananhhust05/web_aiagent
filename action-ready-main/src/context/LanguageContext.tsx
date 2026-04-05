import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "en" | "it";

const translations = {
  // Dashboard bar
  dashboard: { en: "Dashboard", it: "Cruscotto" },
  
  // Header
  actionReady: { en: "Action Ready", it: "Azioni Pronte" },
  headerSubtitle: {
    en: "Execution flashcards for sales follow-up",
    it: "Schede esecutive per il follow-up vendite",
  },
  headerDescription: {
    en: "Review one AI-prepared action at a time, expand the card, refine the draft, and move straight to the next task.",
    it: "Rivedi un'azione preparata dall'IA alla volta, espandi la scheda, perfeziona la bozza e passa al compito successivo.",
  },
  showing: { en: "Showing", it: "Mostrando" },
  of: { en: "of", it: "di" },
  tasks: { en: "tasks", it: "attività" },
  search: { en: "Search", it: "Cerca" },
  filters: { en: "Filters", it: "Filtri" },
  allChannels: { en: "All channels", it: "Tutti i canali" },
  analyzeNew: { en: "Analyze New", it: "Analizza Nuovo" },
  pasteEmail: { en: "Paste Email", it: "Incolla Email" },
  clearAll: { en: "Clear all", it: "Cancella tutto" },

  // Filter sidebar
  needsReview: { en: "Needs Review", it: "Da Rivedere" },
  overdue: { en: "Overdue", it: "In Ritardo" },
  completed: { en: "Completed", it: "Completato" },
  actions: { en: "Actions", it: "Azioni" },
  categories: { en: "Categories", it: "Categorie" },

  // Category labels
  all: { en: "All", it: "Tutti" },
  interested: { en: "Interested", it: "Interessato" },
  not_interested: { en: "Not interested", it: "Non interessato" },
  meeting_intent: { en: "Meeting intent", it: "Intento riunione" },
  not_now: { en: "Not now", it: "Non ora" },
  forwarded: { en: "Forwarded", it: "Inoltrato" },
  personal: { en: "Personal", it: "Personale" },

  // Content area
  executionQueue: { en: "EXECUTION QUEUE", it: "CODA ESECUZIONE" },
  executionQueueLabel: { en: "Execution Queue", it: "Coda Esecuzione" },
  overdueFollowups: { en: "Overdue Follow-ups", it: "Follow-up in Ritardo" },
  overdueEyebrow: { en: "OVERDUE", it: "IN RITARDO" },
  completedEyebrow: { en: "COMPLETED", it: "COMPLETATO" },
  oneTaskOneAction: { en: "One task. One action. Next card.", it: "Un compito. Un'azione. Prossima scheda." },
  recentlyShipped: { en: "Recently shipped actions", it: "Azioni completate di recente" },
  cards: { en: "cards", it: "schede" },
  tasksOlderThan5: {
    en: "Tasks older than 5 days stay visible here for quick intervention.",
    it: "Le attività più vecchie di 5 giorni restano visibili qui per un intervento rapido.",
  },
  noOverdueTasks: { en: "No overdue tasks", it: "Nessuna attività in ritardo" },
  allOnTrack: { en: "All tasks are on track. Great work!", it: "Tutte le attività sono in regola. Ottimo lavoro!" },
  noCompletedYet: { en: "No completed cards yet.", it: "Nessuna scheda completata." },
  completedWillAppear: {
    en: "Completed work will appear here once reps finish tasks.",
    it: "Il lavoro completato apparirà qui quando i rappresentanti finiranno le attività.",
  },
  noTasksMatch: { en: "No tasks match your filters.", it: "Nessuna attività corrisponde ai filtri." },
  tryAdjusting: {
    en: "Try adjusting your category or channel filters to see more tasks.",
    it: "Prova a modificare i filtri di categoria o canale per vedere più attività.",
  },

  // Card front
  emailResponse: { en: "Email Response", it: "Risposta Email" },
  callFollowup: { en: "Call Follow-up", it: "Follow-up Chiamata" },
  scheduleDemo: { en: "Schedule Demo", it: "Prenota Demo" },
  sendResources: { en: "Send Resources", it: "Invia Risorse" },
  complete: { en: "Complete", it: "Completa" },

  // Card expanded
  aiGeneratedDraft: { en: "AI Generated Draft", it: "Bozza Generata dall'IA" },
  draftReadyToSend: { en: "Draft Ready to Send", it: "Bozza Pronta per l'Invio" },
  toneDetectedAuto: { en: "Tone detected automatically", it: "Tono rilevato automaticamente" },
  tonesAvailable: { en: "tones available", it: "toni disponibili" },
  formal: { en: "Formal", it: "Formale" },
  professional: { en: "Professional", it: "Professionale" },
  conversational: { en: "Conversational", it: "Conversazionale" },
  friendly: { en: "Friendly", it: "Amichevole" },
  direct: { en: "Direct", it: "Diretto" },
  edit: { en: "Edit", it: "Modifica" },
  send: { en: "Send", it: "Invia" },
  saveDraft: { en: "Save Draft", it: "Salva Bozza" },
  showFullDraft: { en: "Show Full Draft", it: "Mostra Bozza Completa" },
  collapse: { en: "Collapse", it: "Comprimi" },
  strategicNextStep: { en: "Strategic next step", it: "Prossimo passo strategico" },
  objective: { en: "Objective", it: "Obiettivo" },
  keyTopics: { en: "Key topics", it: "Argomenti chiave" },
  whyThisStep: { en: "Why this step", it: "Perché questo passo" },
  decisionFactors: { en: "Decision factors", it: "Fattori decisionali" },
  viewOtherOptions: { en: "View other options", it: "Vedi altre opzioni" },

  // Neuroscientific Principles
  neurosciencePrinciples: { en: "Neuroscientific Principles Used", it: "Principi Neuroscientifici Utilizzati" },
  scarcity: { en: "Scarcity", it: "Scarsità" },
  lossAversion: { en: "Loss Aversion", it: "Avversione alla perdita" },
  temporalUrgency: { en: "Temporal Urgency", it: "Urgenza temporale" },
  socialProof: { en: "Social Proof", it: "Riprova sociale" },
  whyUsed: { en: "Why used", it: "Perché utilizzato" },
  effectOnProspect: { en: "Effect on prospect", it: "Effetto sul prospect" },
  exampleInText: { en: "Example in text", it: "Esempio nel testo" },
  scarcityWhy: {
    en: "Limited availability creates urgency and motivates faster decision-making.",
    it: "La disponibilità limitata crea urgenza e motiva decisioni più rapide.",
  },
  scarcityEffect: {
    en: "Prospect feels they might miss an exclusive opportunity if they delay.",
    it: "Il prospect percepisce di poter perdere un'opportunità esclusiva se ritarda.",
  },
  scarcityExample: {
    en: "\"We have limited slots available this quarter for onboarding new clients.\"",
    it: "\"Abbiamo posti limitati disponibili questo trimestre per l'onboarding di nuovi clienti.\"",
  },
  lossAversionWhy: {
    en: "People are more motivated by avoiding losses than acquiring equivalent gains.",
    it: "Le persone sono più motivate dall'evitare perdite che dall'acquisire guadagni equivalenti.",
  },
  lossAversionEffect: {
    en: "Prospect focuses on what they stand to lose by not acting.",
    it: "Il prospect si concentra su ciò che rischia di perdere non agendo.",
  },
  lossAversionExample: {
    en: "\"Without this solution, your team could continue losing 15 hours per week on manual tasks.\"",
    it: "\"Senza questa soluzione, il tuo team potrebbe continuare a perdere 15 ore a settimana in attività manuali.\"",
  },
  temporalUrgencyWhy: {
    en: "Time-bound framing accelerates commitment and reduces procrastination.",
    it: "L'inquadramento temporale accelera l'impegno e riduce la procrastinazione.",
  },
  temporalUrgencyEffect: {
    en: "Prospect feels compelled to respond within a specific timeframe.",
    it: "Il prospect si sente spinto a rispondere entro un periodo specifico.",
  },
  temporalUrgencyExample: {
    en: "\"I'd love to connect this week while the insights from our conversation are still fresh.\"",
    it: "\"Mi piacerebbe collegarci questa settimana mentre gli spunti della nostra conversazione sono ancora freschi.\"",
  },
  socialProofWhy: {
    en: "Demonstrating others' success builds trust and reduces perceived risk.",
    it: "Dimostrare il successo di altri costruisce fiducia e riduce il rischio percepito.",
  },
  socialProofEffect: {
    en: "Prospect gains confidence seeing peers who have benefited from the same solution.",
    it: "Il prospect acquisisce fiducia vedendo colleghi che hanno beneficiato della stessa soluzione.",
  },
  socialProofExample: {
    en: "\"Companies similar to yours have seen a 30% improvement in conversion rates.\"",
    it: "\"Aziende simili alla tua hanno visto un miglioramento del 30% nei tassi di conversione.\"",
  },

  // Sidebar nav
  meetingIntelligence: { en: "Meeting Intelligence", it: "Intelligenza Riunioni" },
  meetingInsight: { en: "Meeting Insight", it: "Insight Riunioni" },
  strategy: { en: "Strategy", it: "Strategia" },
  qnaEngine: { en: "QnA Engine", it: "Motore Q&A" },
  performance: { en: "Performance", it: "Prestazioni" },
  knowledge: { en: "Knowledge", it: "Conoscenza" },
  record: { en: "Record", it: "Registra" },
  invite: { en: "Invite", it: "Invita" },

  // Strategy modal
  strategyComingSoon: { en: "Strategy – Coming Soon", it: "Strategia – In Arrivo" },
  strategyDescription: {
    en: "We're building a dedicated Strategy hub to help you plan plays, align teams, and track strategic initiatives across your accounts. Stay tuned – this space is almost ready.",
    it: "Stiamo costruendo un hub Strategia dedicato per aiutarti a pianificare le azioni, allineare i team e monitorare le iniziative strategiche nei tuoi account. Resta sintonizzato – questo spazio è quasi pronto.",
  },
  strategyFeature1: { en: "Account playbooks and strategic plans", it: "Playbook account e piani strategici" },
  strategyFeature2: { en: "Cross-meeting themes and opportunities", it: "Temi e opportunità tra riunioni" },
  strategyFeature3: { en: "Smart suggestions powered by Meeting Intelligence", it: "Suggerimenti intelligenti basati su Meeting Intelligence" },
  gotIt: { en: "Got it", it: "Ho capito" },
  interactionSummary: { en: "Interaction Summary", it: "Riepilogo Interazioni" },
  viewFullHistory: { en: "View full history", it: "Vedi cronologia completa" },
  hideHistory: { en: "Hide history", it: "Nascondi cronologia" },
  seeCompleteChronology: { en: "See Complete Chronology", it: "Vedi Cronologia Completa" },

  // Due date filter pills
  dueAll: { en: "All", it: "Tutti" },
  dueToday: { en: "Today", it: "Oggi" },
  dueTomorrow: { en: "Tomorrow", it: "Domani" },
  dueIn2Days: { en: "In 2 days", it: "Tra 2 giorni" },
  dueIn3Days: { en: "In 3 days", it: "Tra 3 giorni" },
  dueIn4Days: { en: "In 4 days", it: "Tra 4 giorni" },
  dueOverdue: { en: "Overdue", it: "In Ritardo" },
  clickToSee: { en: "Click to see", it: "Clicca per vedere" },
  highlightedPhrase: { en: "Highlighted phrase", it: "Frase evidenziata" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[key]?.[lang] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
