import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { CRM_CONVERSION_TABLE, type CRMMapping } from "@/data/mockStrategyData";
import { useLanguage } from '@/components/strategy/LanguageContext';

interface Props {
  mapping: CRMMapping;
}

export default function CRMSyncStatus({ mapping }: Props) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
        <h2 className="text-base font-bold text-foreground">{t('crm.title')}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t('crm.subtitle')}</p>

      <div className="rounded-lg bg-muted/50 p-4 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-foreground">{mapping.interestLevel}% ({mapping.cognitiveState})</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{mapping.crmStage}</span>
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
            mapping.inSync
              ? "bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]"
              : "bg-orange-500/10 text-orange-500",
          )}>
            {mapping.inSync ? `✅ ${t('crm.inSync')}` : `⚠️ ${t('crm.outOfSync')}`}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">{t('crm.lastSynced')}: {mapping.lastSynced}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">{t('crm.interestPercent')}</th>
              <th className="text-left py-2 text-muted-foreground font-medium">{t('crm.cognitiveState')}</th>
              <th className="text-left py-2 text-muted-foreground font-medium">{t('crm.crmStage')}</th>
            </tr>
          </thead>
          <tbody>
            {CRM_CONVERSION_TABLE.map((row, i) => {
              const isCurrentRange = mapping.cognitiveState === row.cognitiveState;
              return (
                <tr key={i} className={cn(
                  "border-b border-border/50 last:border-0",
                  isCurrentRange && "bg-[hsl(var(--forskale-teal)/0.05)]",
                )}>
                  <td className={cn("py-1.5", isCurrentRange ? "text-foreground font-semibold" : "text-muted-foreground")}>{row.interestRange}</td>
                  <td className={cn("py-1.5", isCurrentRange ? "text-foreground font-semibold" : "text-foreground")}>{row.cognitiveState}</td>
                  <td className={cn("py-1.5", isCurrentRange ? "text-foreground font-semibold" : "text-foreground")}>{row.crmStage}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

