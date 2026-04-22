import { cn } from "@/lib/utils";
import { Bell, TrendingUp } from "lucide-react";
import type { InterestAlert } from "@/data/mockStrategyData";

interface Props {
  alerts: InterestAlert[];
  interestLevel: number;
  daysAtCurrentLevel: number;
  interestVelocity: number;
}

const severityConfig = {
  critical: { bg: 'bg-destructive/5', border: 'border-destructive/20', icon: '🚨', textColor: 'text-destructive' },
  warning: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', icon: '⚠️', textColor: 'text-orange-500' },
  info: { bg: 'bg-[hsl(var(--badge-blue-bg))]', border: 'border-[hsl(var(--forskale-blue)/0.2)]', icon: '📊', textColor: 'text-[hsl(var(--forskale-blue))]' },
  success: { bg: 'bg-[hsl(var(--badge-green-bg))]', border: 'border-[hsl(var(--status-great)/0.2)]', icon: '🟢', textColor: 'text-[hsl(var(--status-great))]' },
};

export default function InterestMonitoring({ alerts, interestLevel, daysAtCurrentLevel, interestVelocity }: Props) {
  if (alerts.length === 0) return null;

  const activeAlerts = alerts.filter(a => a.isActive);
  const predictiveAlerts = activeAlerts.filter(a => a.type === 'predictive');
  const statusAlerts = activeAlerts.filter(a => a.type !== 'predictive');

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
        <h2 className="text-base font-bold text-foreground">Interest Monitoring & Alerts</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Real-time tracking of interest momentum and early warnings
      </p>

      {/* Current status */}
      <div className="rounded-lg bg-muted/50 p-3 mb-4 flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Interest: <span className="font-bold text-foreground">{interestLevel}%</span></span>
        <span className="text-muted-foreground">Days at level: <span className={cn("font-bold", daysAtCurrentLevel > 7 ? "text-destructive" : "text-foreground")}>{daysAtCurrentLevel}</span></span>
        <span className="text-muted-foreground">Expected range: <span className="text-foreground">4-7 days</span></span>
        <span className={cn("font-medium", daysAtCurrentLevel >= 5 ? "text-orange-500" : "text-[hsl(var(--status-great))]")}>
          {daysAtCurrentLevel >= 7 ? '🚨 ALERT' : daysAtCurrentLevel >= 5 ? '⚠️ APPROACHING' : '✅ NORMAL'}
        </span>
      </div>

      {/* Status alerts */}
      {statusAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {statusAlerts.map((alert, i) => {
            const config = severityConfig[alert.severity];
            return (
              <div key={i} className={cn("rounded-lg border p-3", config.border, config.bg)}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{config.icon}</span>
                  <span className={cn("text-xs font-semibold", config.textColor)}>{alert.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{alert.description}</p>
                <p className="text-[10px] text-foreground mt-1"><span className="font-medium text-[hsl(var(--forskale-teal))]">Action:</span> {alert.action}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Predictive alerts */}
      {predictiveAlerts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Predictive Alerts (Before problems happen)</p>
          <div className="space-y-2">
            {predictiveAlerts.map((alert, i) => {
              const config = severityConfig[alert.severity];
              return (
                <div key={i} className={cn("rounded-lg border p-3", config.border, config.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>📊</span>
                    <span className="text-xs font-semibold text-foreground">{alert.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Predicted: {alert.description}</p>
                  <p className="text-[10px] text-foreground mt-1"><span className="font-medium text-[hsl(var(--forskale-teal))]">Recommendation:</span> {alert.action}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

