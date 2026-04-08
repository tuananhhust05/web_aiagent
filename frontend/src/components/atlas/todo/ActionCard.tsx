import { useState, useRef } from "react";
import ActionCardFront from "./action-card/ActionCardFront";
import ActionCardExpanded from "./action-card/ActionCardExpanded";
import { ActionCardData } from "./types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const ActionCard = ({
  data,
  onResolve,
  resolved,
  onEnsureAnalyzed,
}: {
  data: ActionCardData;
  onResolve?: (id: string) => void;
  resolved?: boolean;
  onEnsureAnalyzed?: (id: string) => Promise<ActionCardData | null>;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [resolving, setResolving] = useState(false);
  const [enrichedData, setEnrichedData] = useState<ActionCardData | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Track dirty state from ActionCardExpanded
  const isDirtyRef = useRef(false);
  // Reference to ActionCardExpanded's showUnsavedDialog trigger
  const triggerUnsavedRef = useRef<(() => void) | null>(null);

  const handleResolve = () => {
    setResolving(true);
    setTimeout(() => {
      onResolve?.(data.id);
      setOpen(false);
    }, 320);
  };

  const handleOpen = async () => {
    if (resolved) return;
    setOpen(true);
    if (onEnsureAnalyzed && !enrichedData) {
      setEnriching(true);
      try {
        const enriched = await onEnsureAnalyzed(data.id);
        if (enriched) setEnrichedData(enriched);
      } catch (e) {
        // silent fail — show original data
      } finally {
        setEnriching(false);
      }
    }
  };

  // Intercept Dialog close — if dirty, block and let ActionCardExpanded handle the dialog
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirtyRef.current && triggerUnsavedRef.current) {
      // Block close; trigger unsaved dialog inside ActionCardExpanded
      triggerUnsavedRef.current();
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <>
      <article
        className={`transition-all duration-300 ${resolving ? "pointer-events-none opacity-0 translate-y-3" : "animate-slide-in"} ${resolved ? "opacity-60" : ""}`}
      >
        <ActionCardFront
          data={data}
          onOpen={handleOpen}
          onResolve={!resolved ? handleResolve : undefined}
          resolved={resolved}
        />
      </article>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="action-ready-modal max-h-[80vh] w-[95vw] max-w-[1100px] overflow-hidden rounded-[20px] border border-border/40 bg-card/80 p-0 shadow-[0_20px_80px_hsl(var(--foreground)/0.25)] backdrop-blur-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 sm:rounded-[24px]"
        >
          <span className="sr-only">
            <DialogTitle>{data.title}</DialogTitle>
          </span>
          <ActionCardExpanded
            data={enrichedData ?? data}
            selectedTone={selectedTone}
            onToneChange={setSelectedTone}
            resolved={resolved}
            onResolve={!resolved ? handleResolve : undefined}
            enriching={enriching}
            onDirtyChange={(dirty) => {
              isDirtyRef.current = dirty;
            }}
            onRegisterUnsavedTrigger={(fn) => {
              triggerUnsavedRef.current = fn;
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionCard;
export type { ActionCardData } from "./types";
