import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'EN' | 'IT';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Top bar
  'topbar.title': { EN: 'Strategy', IT: 'Strategia' },

  // Personalized Attention Banner
  'banner.greeting.hello': { EN: 'Hello', IT: 'Ciao' },
  'banner.greeting.morning': { EN: 'Good morning', IT: 'Ciao' },
  'banner.greeting.afternoon': { EN: 'Good afternoon', IT: 'Buon pomeriggio' },
  'banner.greeting.evening': { EN: 'Good evening', IT: 'Buonasera' },
  'banner.briefing': { EN: 'Strategic Briefing', IT: 'Briefing Strategico' },
  'banner.active': { EN: 'Active', IT: 'Attivi' },
  'banner.critical': { EN: 'Critical', IT: 'Critici' },
  'banner.atRisk': { EN: 'At Risk', IT: 'A Rischio' },
  'banner.pipelineHealth': { EN: 'Pipeline Health', IT: 'Salute Pipeline' },
  'banner.needsAction': { EN: 'needs', IT: 'necessita' },
  'banner.couldMove': { EN: 'this could move', IT: 'questo potrebbe spostare' },
  'banner.noActiveDeals': { EN: 'No active deals requiring attention', IT: 'Nessun deal attivo che richiede attenzione' },
  'banner.monitorFor': { EN: 'monitor for progression signals', IT: 'monitorare per segnali di progressione' },
  'banner.isIn': { EN: 'is in', IT: 'è in' },
  'banner.at': { EN: 'at', IT: 'al' },

  // Deal Card Rail
  'rail.yourDeals': { EN: 'Your Deals', IT: 'I Tuoi Deal' },
  'rail.urgency': { EN: 'Urgency', IT: 'Urgenza' },
  'rail.interest': { EN: 'Interest', IT: 'Interesse' },
  'rail.recent': { EN: 'Recent', IT: 'Recenti' },

  // Revenue Dashboard
  'dashboard.pipelineValue': { EN: 'Pipeline Value', IT: 'Valore Pipeline' },
  'dashboard.weightedClose': { EN: 'Weighted Close', IT: 'Chiusura Ponderata' },
  'dashboard.atRiskRevenue': { EN: 'At Risk Revenue', IT: 'Ricavi a Rischio' },
  'dashboard.wonThisQuarter': { EN: 'Won This Quarter', IT: 'Vinti Questo Trimestre' },
  'dashboard.dealsInProgress': { EN: 'deals in progress', IT: 'deal in corso' },
  'dashboard.basedOnInterest': { EN: 'Based on current interest levels', IT: 'Basato sui livelli di interesse attuali' },
  'dashboard.noDealsAtRisk': { EN: 'No deals at risk', IT: 'Nessun deal a rischio' },
  'dashboard.noWinsYet': { EN: 'No wins yet', IT: 'Nessuna vittoria ancora' },
  'dashboard.pipelineHealthTitle': { EN: 'Pipeline Health', IT: 'Salute Pipeline' },
  'dashboard.stageDistribution': { EN: 'Stage Distribution', IT: 'Distribuzione Fasi' },
  'dashboard.won': { EN: 'Won', IT: 'Vinti' },
  'dashboard.active': { EN: 'Active', IT: 'Attivi' },
  'dashboard.atRisk': { EN: 'At Risk', IT: 'A Rischio' },
  'dashboard.lost': { EN: 'Lost', IT: 'Persi' },

  // Overlay Panel
  'overlay.strategicBriefing': { EN: 'Strategic Briefing', IT: 'Briefing Strategico' },
  'overlay.rerun': { EN: 'Re-run', IT: 'Riesegui' },
  'overlay.topPriorities': { EN: 'Top Priorities', IT: 'Priorità Principali' },
  'overlay.riskWarnings': { EN: 'Risk Warnings', IT: 'Avvisi di Rischio' },

  // Loading steps (legacy)
  'loading.step1': { EN: 'Reading conversation history...', IT: 'Lettura cronologia conversazioni...' },
  'loading.step2': { EN: 'Mapping stakeholder dynamics...', IT: 'Mappatura dinamiche stakeholder...' },
  'loading.step3': { EN: 'Detecting cognitive state signals...', IT: 'Rilevamento segnali stato cognitivo...' },
  'loading.step4': { EN: 'Calculating interest velocity...', IT: 'Calcolo velocità di interesse...' },
  'loading.step5': { EN: 'Identifying decision friction...', IT: 'Identificazione attrito decisionale...' },
  'loading.step6': { EN: 'Generating strategic briefing...', IT: 'Generazione briefing strategico...' },

  // Orbital loader steps
  'loading.orbital.analyzing': { EN: 'Analyzing', IT: 'Analisi di' },
  'loading.orbital.step1': { EN: 'Syncing with CRM records...', IT: 'Sincronizzazione con record CRM...' },
  'loading.orbital.step2': { EN: 'Analyzing stakeholder sentiment...', IT: 'Analisi sentimento stakeholder...' },
  'loading.orbital.step3': { EN: 'Running ForSkale Negotiation Playbook...', IT: 'Esecuzione Playbook Negoziazione ForSkale...' },
  'loading.orbital.step4': { EN: 'Generating strategic briefing...', IT: 'Generazione briefing strategico...' },

  // Banner bullet format
  'banner.bullet.toMove': { EN: 'to move', IT: 'per spostare' },
  'banner.bullet.to': { EN: 'to', IT: 'al' },
  'banner.bullet.monitor': { EN: 'monitor interest at', IT: 'monitorare interesse al' },

  // Interest Journey
  'journey.title': { EN: 'Interest Journey', IT: 'Percorso di Interesse' },
  'journey.velocity': { EN: 'Velocity', IT: 'Velocità' },
  'journey.plateau': { EN: 'Plateau', IT: 'Plateau' },
  'journey.trajectory': { EN: 'Trajectory', IT: 'Traiettoria' },
  'journey.strongGrowth': { EN: 'Strong growth', IT: 'Crescita forte' },
  'journey.healthyGrowth': { EN: 'Healthy growth', IT: 'Crescita sana' },
  'journey.slowGrowth': { EN: 'Slow growth', IT: 'Crescita lenta' },
  'journey.stalled': { EN: 'Stalled', IT: 'In stallo' },
  'journey.needsPush': { EN: 'Needs push to reach', IT: 'Necessita spinta per raggiungere' },

  // Strategy Action Items
  'actions.title': { EN: 'Actions to Move Interest', IT: 'Azioni per Spostare l\'Interesse' },
  'actions.subtitle': { EN: 'Each action removes specific decision friction and moves interest forward.', IT: 'Ogni azione rimuove attrito decisionale specifico e spinge l\'interesse avanti.' },
  'actions.critical': { EN: 'CRITICAL — Blocks everything else', IT: 'CRITICO — Blocca tutto il resto' },
  'actions.high': { EN: 'HIGH — Affects commitment', IT: 'ALTO — Influenza l\'impegno' },
  'actions.medium': { EN: 'MEDIUM / LOW — Schedule appropriately', IT: 'MEDIO / BASSO — Pianifica adeguatamente' },

  // Interest Signals
  'signals.title': { EN: 'What Moved Interest During Our Interactions', IT: 'Cosa Ha Mosso l\'Interesse Durante le Nostre Interazioni' },
  'signals.subtitle': { EN: 'AI-detected psychology signals from meetings and calls', IT: 'Segnali psicologici rilevati dall\'AI da riunioni e chiamate' },
  'signals.positive': { EN: 'Positive Signals (Interest went UP)', IT: 'Segnali Positivi (Interesse in CRESCITA)' },
  'signals.neutralNeg': { EN: 'Neutral/Negative Signals', IT: 'Segnali Neutri/Negativi' },
  'signals.signal': { EN: 'Signal', IT: 'Segnale' },
  'signals.behavior': { EN: 'Behavior', IT: 'Comportamento' },
  'signals.meaning': { EN: 'What it means', IT: 'Cosa significa' },
  'signals.psychEngine': { EN: 'Psychology Engine Reading', IT: 'Lettura Motore Psicologico' },

  // Decision Friction
  'friction.title': { EN: 'Decision Friction → Blocking Path to', IT: 'Attrito Decisionale → Blocco Percorso verso' },
  'friction.current': { EN: 'Current', IT: 'Attuale' },
  'friction.goal': { EN: 'Goal', IT: 'Obiettivo' },
  'friction.gap': { EN: 'Gap', IT: 'Gap' },
  'friction.requiresRemoval': { EN: 'Requires removal of decision friction', IT: 'Richiede rimozione attrito decisionale' },
  'friction.whyMatters': { EN: 'Why it matters', IT: 'Perché è importante' },
  'friction.currentState': { EN: 'Current state', IT: 'Stato attuale' },
  'friction.effect': { EN: 'Effect', IT: 'Effetto' },
  'friction.howToRemove': { EN: 'How to remove', IT: 'Come rimuovere' },
  'friction.timeline': { EN: 'Timeline', IT: 'Timeline' },
  'friction.success': { EN: 'Success', IT: 'Successo' },
  'friction.roadmap': { EN: 'Friction Removal Roadmap', IT: 'Roadmap Rimozione Attrito' },
  'friction.expected': { EN: 'Expected', IT: 'Previsto' },
  'friction.blocking': { EN: 'of blocking', IT: 'del blocco' },

  // CRM Sync
  'crm.title': { EN: 'CRM Integration & Deal Mapping', IT: 'Integrazione CRM e Mappatura Deal' },
  'crm.subtitle': { EN: 'How our Interest Level maps to their CRM stage', IT: 'Come il nostro Livello di Interesse si mappa alla fase CRM' },
  'crm.lastSynced': { EN: 'Last synced', IT: 'Ultima sincronizzazione' },
  'crm.inSync': { EN: 'In Sync', IT: 'Sincronizzato' },
  'crm.outOfSync': { EN: 'Out of Sync', IT: 'Non Sincronizzato' },
  'crm.interestPercent': { EN: 'Interest %', IT: 'Interesse %' },
  'crm.cognitiveState': { EN: 'Cognitive State', IT: 'Stato Cognitivo' },
  'crm.crmStage': { EN: 'CRM Stage', IT: 'Fase CRM' },

  // Deal Context
  'context.cognitiveState': { EN: 'Cognitive State', IT: 'Stato Cognitivo' },
  'context.interestLevel': { EN: 'Interest Level', IT: 'Livello di Interesse' },
  'context.daysAtStage': { EN: 'Days at Stage', IT: 'Giorni in Fase' },
  'context.velocity': { EN: 'Velocity', IT: 'Velocità' },
  'context.days': { EN: 'days', IT: 'giorni' },
  'context.keyInteractions': { EN: 'Key Interactions', IT: 'Interazioni Chiave' },
  'context.stakeholders': { EN: 'Stakeholders', IT: 'Stakeholder' },
  'context.objections': { EN: 'Objections & Status', IT: 'Obiezioni e Stato' },
  'context.raised': { EN: 'Raised', IT: 'Sollevata' },
  'context.response': { EN: 'Response', IT: 'Risposta' },
  'context.commitments': { EN: 'Promises & Commitments', IT: 'Promesse e Impegni' },
  'context.positiveSignals': { EN: 'Positive Signals Summary', IT: 'Riepilogo Segnali Positivi' },
  'context.frictionSources': { EN: 'Decision Friction Sources', IT: 'Fonti Attrito Decisionale' },

  // Collapsible sections in overlay
  'section.interestSignals': { EN: 'Interest Signals', IT: 'Segnali di Interesse' },
  'section.decisionFriction': { EN: 'Decision Friction Analysis', IT: 'Analisi Attrito Decisionale' },
  'section.crmSync': { EN: 'CRM Sync Status', IT: 'Stato Sincronizzazione CRM' },
  'section.dealContext': { EN: 'Deal Context & Stakeholders', IT: 'Contesto Deal e Stakeholder' },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('IT');

  const t = useCallback((key: string): string => {
    return translations[key]?.[language] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
