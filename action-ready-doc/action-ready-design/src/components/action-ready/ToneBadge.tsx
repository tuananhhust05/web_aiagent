import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ToneType } from './ToneSelector';

interface ToneBadgeProps {
  tone: ToneType;
}

export const ToneBadge: React.FC<ToneBadgeProps> = ({ tone }) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 py-1 animate-in fade-in duration-200">
      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {t("tone")}:
      </span>
      <span className="text-[9px] font-bold text-accent">{t(tone)}</span>
    </div>
  );
};

export default ToneBadge;
