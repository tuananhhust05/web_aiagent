import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";

const GOAL_KEYS: TranslationKey[] = [
  "goal1", "goal2", "goal3", "goal4", "goal5", "goal6",
  "goal7", "goal8", "goal9", "goal10", "goal11", "goal12", "goal13",
];

interface Props {
  onContinue: (selected: string[]) => void;
  onBack: () => void;
}

const StepGoals = ({ onContinue, onBack }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { t } = useLanguage();

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {t("whichGoals")}
      </h2>
      <p className="text-sm mb-6" style={{ color: "hsl(215 16% 47%)" }}>
        {t("goalsHelp")}
      </p>

      <div className="flex flex-wrap gap-2.5 mb-6">
        {GOAL_KEYS.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="relative group px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border-2 overflow-hidden"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, #7ED321, #4ECDC4)"
                  : "hsla(0 0% 100% / 0.8)",
                border: isSelected
                  ? "2px solid transparent"
                  : "2px solid hsl(214 32% 91%)",
                color: isSelected ? "#fff" : "hsl(215 25% 27%)",
                boxShadow: isSelected ? "0 4px 16px hsla(90 73% 48% / 0.3)" : "none",
                transform: "scale(1)",
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#4ECDC4";
                  e.currentTarget.style.boxShadow = "0 4px 12px hsla(176 58% 55% / 0.15)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "hsl(214 32% 91%)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {isSelected && <span className="text-xs">✓</span>}
                {t(key)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="btn-back px-6 py-3 text-sm">
          {t("back")}
        </button>
        <button
          onClick={() => onContinue(selected)}
          className="btn-continue px-8 py-3 text-sm"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
};

export default StepGoals;
