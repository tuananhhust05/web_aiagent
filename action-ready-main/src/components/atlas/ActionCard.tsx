import { useState, useRef } from "react";
import ActionCardFront from "./action-card/ActionCardFront";
import ActionCardExpanded from "./action-card/ActionCardExpanded";
import { ActionCardData } from "./action-card/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ActionCard = ({
  data,
  onResolve,
  resolved,
}: {
  data: ActionCardData;
  onResolve?: (id: string) => void;
  resolved?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [resolving, setResolving] = useState(false);

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

  const handleOpen = () => {
    if (resolved) return;
    setOpen(true);
  };

  // Intercept Dialog close — if dirty, block and let ActionCardExpanded handle the dialog
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirtyRef.current && triggerUnsavedRef.current) {
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
          <VisuallyHidden.Root>
            <DialogTitle>{data.title}</DialogTitle>
          </VisuallyHidden.Root>
          <ActionCardExpanded
            data={data}
            selectedTone={selectedTone}
            onToneChange={setSelectedTone}
            resolved={resolved}
            onResolve={!resolved ? handleResolve : undefined}
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
export type { ActionCardData } from "./action-card/types";
