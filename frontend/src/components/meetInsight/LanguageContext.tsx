import React, { createContext, useContext } from "react";

export type MeetLang = "IT" | "EN";

const MeetLangContext = createContext<MeetLang>("EN");

export function MeetLangProvider({ language, children }: { language: MeetLang; children: React.ReactNode }) {
  return <MeetLangContext.Provider value={language}>{children}</MeetLangContext.Provider>;
}

export function useMeetLang(): MeetLang { return useContext(MeetLangContext); }

const meetTranslations = {
  "topbar.title": { EN: "Meeting Insight", IT: "Analisi Meeting" },
  "personalisation.lastReady": { EN: "Your last meeting insight is ready", IT: "La tua ultima analisi meeting è pronta" },
  "personalisation.allClear": { EN: "All meeting insights reviewed and you are on top", IT: "Tutte le analisi meeting revisionate — ottimo lavoro" },
  "browse.browse": { EN: "Browse", IT: "Esplora" },
  "browse.thisWeek": { EN: "This week", IT: "Questa settimana" },
  "browse.thisMonth": { EN: "This month", IT: "Questo mese" },
  "browse.allHistory": { EN: "All history", IT: "Tutto lo storico" },
  "browse.companies": { EN: "Companies", IT: "Aziende" },
  "browse.unviewedInsights": { EN: "Unviewed insights", IT: "Analisi non viste" },
  "browse.search": { EN: "Search", IT: "Cerca" },
  "browse.searchPlaceholder": { EN: "Company, date, topic...", IT: "Azienda, data, argomento..." },
  "tabs.allCompanies": { EN: "All Companies", IT: "Tutte le aziende" },
  "date.today": { EN: "Today", IT: "Oggi" },
  "date.yesterday": { EN: "Yesterday", IT: "Ieri" },
  "date.new": { EN: "new", IT: "nuovi" },
  "tab.evaluation": { EN: "Evaluation", IT: "Valutazione" },
  "tab.summary": { EN: "Smart Summary", IT: "Sintesi Intelligente" },
  "tab.enablement": { EN: "Enablement", IT: "Formazione" },
  "detail.overview": { EN: "Overview", IT: "Panoramica" },
  "detail.playbook": { EN: "of sales playbook executed", IT: "del playbook commerciale eseguito" },
  "detail.speakers": { EN: "speakers", IT: "partecipanti" },
} as const;

export type MeetTranslationKey = keyof typeof meetTranslations;

export function tMeet(key: MeetTranslationKey, lang: MeetLang): string {
  return meetTranslations[key]?.[lang] ?? meetTranslations[key]?.["EN"] ?? key;
}

export function useT() {
  const lang = useMeetLang();
  return (key: MeetTranslationKey) => tMeet(key, lang);
}
