import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export type ToneType = 'formal' | 'professional' | 'conversational';

export interface ToneSelectorProps {
  /** The tone detected by AI - never changes */
  detectedTone: ToneType;
  /** Currently selected tone by user */
  selectedTone: ToneType;
  /** Callback when user selects a different tone */
  onToneChange: (tone: ToneType) => void;
}

const TONES: ToneType[] = ['formal', 'professional', 'conversational'];

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  detectedTone,
  selectedTone,
  onToneChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-1">
      {/* Static AI Detection Label - Never Changes */}
      <p className="text-[9px] text-muted-foreground mb-1">
        🤖 {t("toneDetectedAuto")}:{' '}
        <span className="font-semibold text-accent">{t(detectedTone)}</span>
      </p>

      {/* Interactive Tone Tabs */}
      <div className="flex border-b border-border mb-1.5">
        {TONES.map((tone) => {
          const isDetected = tone === detectedTone;
          const isSelected = tone === selectedTone;

          return (
            <button
              key={tone}
              type="button"
              onClick={() => onToneChange(tone)}
              className={`relative whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                isSelected
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* AI Detection Indicator Dot */}
              {isDetected && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  title="AI-detected tone"
                />
              )}

              {/* Tone Label */}
              <span className={isDetected ? 'text-accent' : ''}>
                {t(tone)}
              </span>

              {/* Active Selection Underline */}
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToneSelector;
