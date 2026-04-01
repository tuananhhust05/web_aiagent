import { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

const LEVELS = [
  { id: "new", labelKey: "levelNew" as const, icon: "🌱" },
  { id: "some", labelKey: "levelSome" as const, icon: "🔧" },
  { id: "experienced", labelKey: "levelExperienced" as const, icon: "🚀" },
]

interface Props {
  onContinue: (level: string) => void
  onBack: () => void
}

const StepFamiliarity = ({ onContinue, onBack }: Props) => {
  const [selected, setSelected] = useState("")
  const { t } = useLanguage()

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "hsl(0 0% 10%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {t("howFamiliar")}
      </h2>
      <p className="text-sm mb-8" style={{ color: "hsl(215 16% 47%)" }}>
        {t("familiarityHelp")}
      </p>

      <div className="flex flex-col gap-3 mb-10">
        {LEVELS.map((level) => {
          const isSelected = selected === level.id
          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className="group relative w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-left transition-all duration-300 border-2 overflow-hidden"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, hsla(199 80% 94% / 0.5), hsla(166 76% 97% / 0.5))"
                  : "hsla(0 0% 100% / 0.8)",
                backdropFilter: "blur(8px)",
                border: isSelected
                  ? "2px solid hsla(176 58% 55% / 0.6)"
                  : "2px solid hsl(214 32% 91%)",
                boxShadow: isSelected ? "0 8px 24px hsla(176 58% 55% / 0.2)" : "none",
                transform: "translateY(0)",
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#4ECDC4"
                  e.currentTarget.style.boxShadow = "0 8px 24px hsla(176 58% 55% / 0.15)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "hsl(214 32% 91%)"
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.transform = "translateY(0)"
                }
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, hsla(90 73% 48% / 0.1), hsla(176 58% 55% / 0.1))",
                }}
              >
                <span className="text-2xl">{level.icon}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: isSelected ? "hsl(0 0% 10%)" : "hsl(215 20% 40%)" }}>
                {t(level.labelKey)}
              </span>
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7ED321, #4ECDC4)" }}>
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="btn-back px-6 py-3 text-sm">
          {t("back")}
        </button>
        <button
          onClick={() => onContinue(selected)}
          disabled={!selected}
          className="px-8 py-3 text-sm"
          style={{
            background: selected ? "linear-gradient(135deg, #7ED321 0%, #4ECDC4 50%, #0B5394 100%)" : "hsl(214 32% 91%)",
            color: selected ? "#fff" : "hsl(215 16% 47%)",
            borderRadius: 16,
            fontWeight: 600,
            boxShadow: selected ? "0 10px 30px hsla(90 73% 48% / 0.3)" : "none",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "none",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseOver={(e) => selected && (e.currentTarget.style.transform = "translateY(-2px) scale(1.02)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
        >
          {t("continueToSetup")}
        </button>
      </div>
    </div>
  )
}

export default StepFamiliarity
