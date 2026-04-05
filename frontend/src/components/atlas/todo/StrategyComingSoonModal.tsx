import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Target, Sparkles, Lightbulb } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface StrategyComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StrategyComingSoonModal = ({ open, onOpenChange }: StrategyComingSoonModalProps) => {
  const { t } = useLanguage();

  const features = [
    { icon: Target, textKey: "strategyFeature1" as const },
    { icon: Sparkles, textKey: "strategyFeature2" as const },
    { icon: Lightbulb, textKey: "strategyFeature3" as const },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-0 p-0 sm:rounded-2xl">
        <div className="relative bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] px-6 pb-6 pt-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Target className="h-7 w-7 text-white" strokeWidth={1.8} />
            </div>
            <DialogHeader className="items-center space-y-1">
              <DialogTitle className="text-xl font-bold text-white">
                {t("strategyComingSoon")}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("strategyDescription")}
          </DialogDescription>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.textKey} className="flex items-start gap-3 rounded-lg bg-muted/40 px-3.5 py-2.5">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--forskale-teal))]" strokeWidth={1.8} />
                <span className="text-xs leading-relaxed text-foreground/80">{t(f.textKey)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[0_4px_16px_hsl(var(--forskale-teal)/0.35)] active:scale-[0.98]"
          >
            {t("gotIt")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyComingSoonModal;
