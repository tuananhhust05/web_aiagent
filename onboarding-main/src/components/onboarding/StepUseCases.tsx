import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const USE_CASES_KEYS = [
  {
    id: "meeting-intelligence",
    titleKey: "meetingIntelligence" as const,
    subtitleKey: "meetingIntelligenceSub" as const,
    bulletKeys: ["meetingIntelligenceB1" as const, "meetingIntelligenceB2" as const, "meetingIntelligenceB3" as const],
  },
  {
    id: "sales-assistance",
    titleKey: "salesAssistance" as const,
    subtitleKey: "salesAssistanceSub" as const,
    bulletKeys: ["salesAssistanceB1" as const, "salesAssistanceB2" as const, "salesAssistanceB3" as const],
  },
  {
    id: "action-ready",
    titleKey: "actionReady" as const,
    subtitleKey: "actionReadySub" as const,
    bulletKeys: ["actionReadyB1" as const, "actionReadyB2" as const, "actionReadyB3" as const],
  },
  {
    id: "prospect-intelligence",
    titleKey: "prospectIntelligence" as const,
    subtitleKey: "prospectIntelligenceSub" as const,
    bulletKeys: ["prospectIntelligenceB1" as const, "prospectIntelligenceB2" as const, "prospectIntelligenceB3" as const],
  },
];

interface Props {
  onContinue: (selected: string[]) => void;
  onBack: () => void;
}

const StepUseCases = ({ onContinue, onBack }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { t } = useLanguage();

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="animate-fade-in">
      <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        {t("question2of4")}
      </p>
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {t("howToStart")}
      </h2>
      <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
        {t("pickAsManyAsYouWant")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {USE_CASES_KEYS.map((uc) => {
          const isSelected = selected.includes(uc.id);
          return (
            <button
              key={uc.id}
              onClick={() => toggle(uc.id)}
              className="text-left rounded-xl p-5 transition-all"
              style={{
                background: isSelected ? "rgba(78,205,196,0.15)" : "rgba(255,255,255,0.05)",
                border: isSelected ? "2px solid rgba(78,205,196,0.6)" : "2px solid rgba(255,255,255,0.1)",
              }}
            >
              <h3 className="text-base font-bold mb-1" style={{ color: "#fff" }}>{t(uc.titleKey)}</h3>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{t(uc.subtitleKey)}</p>
              <ul className="space-y-1">
                {uc.bulletKeys.map((bKey) => (
                  <li key={bKey} className="text-xs flex items-start gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#4ECDC4" }}>•</span>
                    {t(bKey)}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs font-semibold" style={{ color: isSelected ? "#4ECDC4" : "rgba(255,255,255,0.4)" }}>
                {isSelected ? t("selected") : t("select")}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="px-6 py-3 rounded-lg font-bold text-sm transition-all" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
          {t("back")}
        </button>
        <button
          onClick={() => onContinue(selected)}
          className="px-8 py-3 rounded-lg font-bold text-sm transition-all"
          style={{ background: "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(126,211,33,0.3)" }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
};

export default StepUseCases;
