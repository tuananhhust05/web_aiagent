import React, { createContext, useContext, useState, useCallback } from "react";

export type Lang = "IT" | "EN";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  tEN: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ── Translation dictionaries ──
const translations: Record<Lang, Record<string, string>> = {
  EN: {
    // AppLayout
    "topbar.title": "Meeting Intelligence",

    // Calendar
    "calendar.title": "CALENDAR",
    "calendar.week": "week",
    "calendar.month": "month",
    "calendar.sync": "Sync Calendar",
    "calendar.syncing": "Syncing…",
    "calendar.weekRange": "Mar 2 – 8, 2026",
    "calendar.monthRange": "March 2026",
    "calendar.noMeetings": "No meetings scheduled",
    "calendar.dayOpen": "This day is wide open",
    "calendar.dayDetails": "Day Details",
    "calendar.meeting": "meeting",
    "calendar.meetings": "meetings",
    "calendar.openContactCard": "Open Contact Card",
    "calendar.markComplete": "Mark Complete",
    "calendar.recordingAvailable": "Recording available",
    "calendar.attendees": "Attendees",
    "calendar.agenda": "Agenda",
    "calendar.actionItems": "Action Items",
    "calendar.notes": "Notes",
    "calendar.neuroInsights": "Neuro Insights",
    "calendar.approach": "Approach",
    "calendar.cognitiveBias": "Cognitive Bias",
    "calendar.crmUpdated": "CRM · Updated",
    "calendar.ofDealJourney": "of deal journey",
    "calendar.participants": "participants",
    "calendar.buyerInterest": "buyer interest",

    // Days
    "day.mon": "Mon",
    "day.tue": "Tue",
    "day.wed": "Wed",
    "day.thu": "Thu",
    "day.fri": "Fri",
    "day.sat": "Sat",
    "day.sun": "Sun",

    // Contact Card
    "contact.joinMeeting": "Join Meeting",
    "contact.botJoin": "Bot Join",
    "contact.groupDynamics": "Group Dynamics",
    "contact.decisionAlign": "Decision Align",
    "contact.riskCompat": "Risk Compat.",
    "contact.commComplex": "Comm. Complex",
    "contact.decisionMaker": "Decision Maker:",
    "contact.keyInfluencer": "Key Influencer:",
    "contact.frictionPoints": "Friction Points",
    "contact.cognitiveSnapshot": "Cognitive Snapshot",
    "contact.enrichProfile": "Enrich Profile",
    "contact.openingScript": "Opening Script (First 30s)",
    "contact.whyThisWorks": "Why This Works:",
    "contact.companyProfile": "Company Profile",
    "contact.industry": "Industry",
    "contact.sizeRevenue": "Size & Revenue",
    "contact.location": "Location",
    "contact.founded": "Founded",
    "contact.aiSalesCoach": "AI Sales Coach",
    "contact.usingCrmData": "Using CRM data",
    "contact.dealDiscovery": "Deal is in <strong>Discovery stage</strong> — Here's what to focus on:",
    "contact.seePreviousMeetings": "See previous meetings insights",
    "contact.reviewCrmData": "Review CRM data & past interactions",
    "contact.viewInsights": "View Insights",
    "contact.planStrategy": "Plan strategy for next negotiation stage",
    "contact.prepareApproach": "Prepare tailored approach & objection handling",
    "contact.createStrategy": "Create Strategy",
    "contact.scheduleReminder": "Schedule reminder in Action Ready",
    "contact.setFollowUp": "Set follow-up within 48 hours",
    "contact.createReminder": "Create Reminder",
    "contact.seeAllActionReady": "See All in Action Ready",

    // Sidebar
    "sidebar.home": "Home",
    "sidebar.meetingIntelligence": "Meeting Intelligence",
    "sidebar.meetingInsight": "Meeting Insight",
    "sidebar.strategy": "Strategy",
    "sidebar.actionReady": "Action Ready",
    "sidebar.qnaEngine": "QnA Engine",
    "sidebar.performance": "Performance",
    "sidebar.settings": "Settings",
    "sidebar.knowledge": "Knowledge",
    "sidebar.record": "Record",
    "sidebar.meetingTemplates": "Meeting Templates",
    "sidebar.strategyComingSoon": "Strategy – Coming Soon",
    "sidebar.strategyDescription": "A dedicated Strategy hub that guides you through every negotiation with clarity and confidence. This space will deliver strategy powered by advanced AI and Neuroscience, combining past conversations, critical context, and stakeholder insights – so you always know what to say next and how to move the discussion toward the desired outcome. Stay tuned",
    "sidebar.gotIt": "Got it",

    // Registration Wizard
    "registration.title": "Connect your calendar",
    "registration.description": "Plus needs access to your Google Calendar to auto-record meetings and share insights.",
    "registration.benefit1": "See all your upcoming meetings automatically",
    "registration.benefit2": "Start AI capture by adding the meeting bot",
    "registration.benefit3": "Turn every meeting into organized insights",
    "registration.permissions": "We request only the minimum permissions necessary.",
    "registration.continue": "Grant Permissions & Continue",

    // Recording Consent
    "consent.title": "Recording Consent Required",
    "consent.intro": "Recording and AI processing to be enabled.",
    "consent.responsible": "You are solely responsible for:",
    "consent.item1": "Informing ALL participants that recording is active",
    "consent.item2": "Obtaining valid consent from ALL participants",
    "consent.item3": "Ensuring compliance with applicable privacy laws",
    "consent.liability": "Responsibility for consent lies entirely with you.",
    "consent.disclaimer": "ForSkale is not responsible.",
    "consent.doNotProceed": "Do Not Proceed",
    "consent.continue": "I Understand — Continue",

    // Calendar Refresh Popup
    "refresh.message": "If you don't see any new meetings, remember to refresh the page or click <strong>Sync Calendar</strong>.",
    "refresh.dismiss": "I got it, don't show this again",

    // Sales Assistant Bot
    "bot.salesAssistance": "Sales Assistance",
    "bot.atlasSalesCoach": "Atlas Sales Coach",
    "bot.turnOnVolume": "Please turn on your volume",
    "bot.preparingBrief": "Preparing your meeting brief",
    "bot.startingIn": "Starting in",
    "bot.startingBriefIn": "Starting brief in",
    "bot.seconds": "seconds",
    "bot.yourMeetings": "Your Meetings",
    "bot.meetingsCount": "meetings",
    "bot.backToMeetings": "Back to meetings",
    "bot.planStrategy": "Plan Strategy",
    "bot.meetingParticipants": "Meeting Participants",
    "bot.companyOverview": "Company Overview",
    "bot.company": "Company",
    "bot.industry": "Industry",
    "bot.size": "Size",
    "bot.revenue": "Revenue",
    "bot.location": "Location",
    "bot.founded": "Founded",
    "bot.companyDescription": "Company Description",

    // Add Profile Dialog
    "addProfile.title": "Add Profile for",
    "addProfile.description": "This participant signed up with a personal email (e.g. Gmail), so we couldn't find their LinkedIn automatically. Paste their LinkedIn profile URL to enable enrichment.",
    "addProfile.label": "LinkedIn Profile URL",
    "addProfile.cancel": "Cancel",
    "addProfile.submit": "Add Profile",

    // Toast messages
    "toast.calendarSynced": "Calendar synced successfully",
    "toast.recordingConsent": "Recording consent acknowledged",
    "toast.leftMeeting": "Left meeting",
    "toast.actionItemCompleted": "Action item completed",
    "toast.actionItemReopened": "Action item reopened",
    "toast.meetingCompleted": "Meeting marked as completed",
    "toast.scriptCopied": "Script copied to clipboard",
    "toast.linkedinLinked": "LinkedIn profile linked for",

    // Meeting types
    "type.discovery": "discovery",
    "type.renewal": "renewal",
    "type.internal": "internal",

    // Status
    "status.completed": "completed",
    "status.upcoming": "upcoming",
    "status.inProgress": "in-progress",
  },
  IT: {
    // AppLayout
    "topbar.title": "Intelligence Riunioni",

    // Calendar
    "calendar.title": "CALENDARIO",
    "calendar.week": "settimana",
    "calendar.month": "mese",
    "calendar.sync": "Sincronizza Calendario",
    "calendar.syncing": "Sincronizzazione…",
    "calendar.weekRange": "2 – 8 Mar, 2026",
    "calendar.monthRange": "Marzo 2026",
    "calendar.noMeetings": "Nessuna riunione programmata",
    "calendar.dayOpen": "Questo giorno è completamente libero",
    "calendar.dayDetails": "Dettagli Giornata",
    "calendar.meeting": "riunione",
    "calendar.meetings": "riunioni",
    "calendar.openContactCard": "Apri Scheda Contatto",
    "calendar.markComplete": "Segna Completato",
    "calendar.recordingAvailable": "Registrazione disponibile",
    "calendar.attendees": "Partecipanti",
    "calendar.agenda": "Ordine del Giorno",
    "calendar.actionItems": "Azioni da Compiere",
    "calendar.notes": "Note",
    "calendar.neuroInsights": "Approfondimenti Neuro",
    "calendar.approach": "Approccio",
    "calendar.cognitiveBias": "Bias Cognitivo",
    "calendar.crmUpdated": "CRM · Aggiornato",
    "calendar.ofDealJourney": "del percorso trattativa",
    "calendar.participants": "partecipanti",
    "calendar.buyerInterest": "interesse acquirente",

    // Days
    "day.mon": "Lun",
    "day.tue": "Mar",
    "day.wed": "Mer",
    "day.thu": "Gio",
    "day.fri": "Ven",
    "day.sat": "Sab",
    "day.sun": "Dom",

    // Contact Card
    "contact.joinMeeting": "Partecipa alla Riunione",
    "contact.botJoin": "Bot Partecipa",
    "contact.groupDynamics": "Dinamiche di Gruppo",
    "contact.decisionAlign": "Allineamento Decisionale",
    "contact.riskCompat": "Compat. Rischio",
    "contact.commComplex": "Compless. Comunic.",
    "contact.decisionMaker": "Decisore:",
    "contact.keyInfluencer": "Influenzatore Chiave:",
    "contact.frictionPoints": "Punti di Attrito",
    "contact.cognitiveSnapshot": "Profilo Cognitivo",
    "contact.enrichProfile": "Arricchisci Profilo",
    "contact.openingScript": "Script d'Apertura (Primi 30s)",
    "contact.whyThisWorks": "Perché Funziona:",
    "contact.companyProfile": "Profilo Aziendale",
    "contact.industry": "Settore",
    "contact.sizeRevenue": "Dimensioni e Ricavi",
    "contact.location": "Sede",
    "contact.founded": "Fondata",
    "contact.aiSalesCoach": "Coach Vendite AI",
    "contact.usingCrmData": "Utilizzo dati CRM",
    "contact.dealDiscovery": "La trattativa è in fase di <strong>Scoperta</strong> — Ecco su cosa concentrarsi:",
    "contact.seePreviousMeetings": "Vedi approfondimenti riunioni precedenti",
    "contact.reviewCrmData": "Rivedi dati CRM e interazioni passate",
    "contact.viewInsights": "Vedi Approfondimenti",
    "contact.planStrategy": "Pianifica strategia per la prossima fase",
    "contact.prepareApproach": "Prepara approccio personalizzato e gestione obiezioni",
    "contact.createStrategy": "Crea Strategia",
    "contact.scheduleReminder": "Programma promemoria in Action Ready",
    "contact.setFollowUp": "Imposta follow-up entro 48 ore",
    "contact.createReminder": "Crea Promemoria",
    "contact.seeAllActionReady": "Vedi Tutto in Action Ready",

    // Sidebar
    "sidebar.home": "Home",
    "sidebar.meetingIntelligence": "Intelligence Riunioni",
    "sidebar.meetingInsight": "Approfondimenti Riunioni",
    "sidebar.strategy": "Strategia",
    "sidebar.actionReady": "Azioni Pronte",
    "sidebar.qnaEngine": "Motore Q&A",
    "sidebar.performance": "Prestazioni",
    "sidebar.settings": "Impostazioni",
    "sidebar.knowledge": "Conoscenza",
    "sidebar.record": "Registra",
    "sidebar.meetingTemplates": "Modelli Riunione",
    "sidebar.strategyComingSoon": "Strategia – Prossimamente",
    "sidebar.strategyDescription": "Un hub dedicato alla Strategia che ti guida attraverso ogni negoziazione con chiarezza e fiducia. Questo spazio fornirà strategie alimentate da AI avanzata e Neuroscienze, combinando conversazioni passate, contesto critico e approfondimenti sugli stakeholder – così saprai sempre cosa dire e come orientare la discussione verso il risultato desiderato. Resta sintonizzato",
    "sidebar.gotIt": "Capito",

    // Registration Wizard
    "registration.title": "Collega il tuo calendario",
    "registration.description": "Plus ha bisogno di accedere al tuo Google Calendar per registrare automaticamente le riunioni e condividere approfondimenti.",
    "registration.benefit1": "Vedi tutte le tue riunioni in arrivo automaticamente",
    "registration.benefit2": "Avvia la cattura AI aggiungendo il bot alla riunione",
    "registration.benefit3": "Trasforma ogni riunione in approfondimenti organizzati",
    "registration.permissions": "Richiediamo solo i permessi minimi necessari.",
    "registration.continue": "Concedi Permessi e Continua",

    // Recording Consent
    "consent.title": "Consenso alla Registrazione Richiesto",
    "consent.intro": "Registrazione ed elaborazione AI da abilitare.",
    "consent.responsible": "Sei l'unico responsabile per:",
    "consent.item1": "Informare TUTTI i partecipanti che la registrazione è attiva",
    "consent.item2": "Ottenere il consenso valido da TUTTI i partecipanti",
    "consent.item3": "Garantire la conformità alle leggi sulla privacy applicabili",
    "consent.liability": "La responsabilità del consenso è interamente tua.",
    "consent.disclaimer": "ForSkale non è responsabile.",
    "consent.doNotProceed": "Non Procedere",
    "consent.continue": "Ho Capito — Continua",

    // Calendar Refresh Popup
    "refresh.message": "Se non vedi nuove riunioni, ricorda di aggiornare la pagina o clicca <strong>Sincronizza Calendario</strong>.",
    "refresh.dismiss": "Ho capito, non mostrare più",

    // Sales Assistant Bot
    "bot.salesAssistance": "Assistenza Vendite",
    "bot.atlasSalesCoach": "Coach Vendite Atlas",
    "bot.turnOnVolume": "Per favore accendi il volume",
    "bot.preparingBrief": "Preparazione del briefing",
    "bot.startingIn": "Inizio tra",
    "bot.startingBriefIn": "Briefing tra",
    "bot.seconds": "secondi",
    "bot.yourMeetings": "Le Tue Riunioni",
    "bot.meetingsCount": "riunioni",
    "bot.backToMeetings": "Torna alle riunioni",
    "bot.planStrategy": "Pianifica Strategia",
    "bot.meetingParticipants": "Partecipanti alla Riunione",
    "bot.companyOverview": "Panoramica Aziendale",
    "bot.company": "Azienda",
    "bot.industry": "Settore",
    "bot.size": "Dimensioni",
    "bot.revenue": "Ricavi",
    "bot.location": "Sede",
    "bot.founded": "Fondata",
    "bot.companyDescription": "Descrizione Aziendale",

    // Add Profile Dialog
    "addProfile.title": "Aggiungi Profilo per",
    "addProfile.description": "Questo partecipante si è registrato con un'email personale (es. Gmail), quindi non abbiamo trovato il suo LinkedIn automaticamente. Incolla l'URL del profilo LinkedIn per abilitare l'arricchimento.",
    "addProfile.label": "URL Profilo LinkedIn",
    "addProfile.cancel": "Annulla",
    "addProfile.submit": "Aggiungi Profilo",

    // Toast messages
    "toast.calendarSynced": "Calendario sincronizzato con successo",
    "toast.recordingConsent": "Consenso alla registrazione confermato",
    "toast.leftMeeting": "Riunione abbandonata",
    "toast.actionItemCompleted": "Azione completata",
    "toast.actionItemReopened": "Azione riaperta",
    "toast.meetingCompleted": "Riunione segnata come completata",
    "toast.scriptCopied": "Script copiato negli appunti",
    "toast.linkedinLinked": "Profilo LinkedIn collegato per",

    // Meeting types
    "type.discovery": "scoperta",
    "type.renewal": "rinnovo",
    "type.internal": "interno",

    // Status
    "status.completed": "completato",
    "status.upcoming": "in arrivo",
    "status.inProgress": "in corso",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("IT");

  const t = useCallback(
    (key: string): string => {
      return translations[lang][key] || translations["EN"][key] || key;
    },
    [lang]
  );

  const tEN = useCallback(
    (key: string): string => {
      return translations["EN"][key] || key;
    },
    []
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tEN }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
