import React from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface UnsavedChangesDialogProps {
  onSave: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ onSave, onDiscard }) => {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm bg-background/80 animate-in fade-in zoom-in-95 duration-200">
      <div className="mx-4 rounded-xl border border-border bg-card shadow-xl p-4 w-full max-w-[260px]">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-foreground">{t("unsavedChanges")}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
              {t("unsavedChangesMessage")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Save className="w-3 h-3" />
            {t("saveDraft")}
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
          >
            <X className="w-3 h-3" />
            {t("discard")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;
