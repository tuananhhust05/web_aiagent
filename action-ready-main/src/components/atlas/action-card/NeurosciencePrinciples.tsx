import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { NeurosciencePrinciple } from "./types";

const NeurosciencePrinciples = ({ principles }: { principles: NeurosciencePrinciple[] }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  const toggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (!principles.length) return null;

  return (
    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400 mb-1.5">
        <Brain size={11} />
        {t("neurosciencePrinciples")}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {principles.map((p, i) => {
          const isOpen = expandedIndex === i;
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                isOpen
                  ? "bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200"
                  : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/60"
              }`}
            >
              {p.title}
              {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          );
        })}
      </div>

      {expandedIndex !== null && principles[expandedIndex] && (
        <div className="mt-2.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border-l-2 border-indigo-400 dark:border-indigo-500 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-indigo-500 dark:text-indigo-400">
                {t("whyUsed")}
              </span>
              <p className="text-xs text-foreground leading-snug">{principles[expandedIndex].explanation}</p>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-indigo-500 dark:text-indigo-400">
                {t("highlightedPhrase")}
              </span>
              <p className="text-xs italic text-muted-foreground leading-snug">"{principles[expandedIndex].highlightedPhrase}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeurosciencePrinciples;
