import { useState } from "react";
import ActionCardFront from "./action-card/ActionCardFront";
import ActionCardExpanded from "./action-card/ActionCardExpanded";
import { ActionCardData } from "./action-card/types";

const ActionCard = ({ data, onResolve, resolved }: { data: ActionCardData; onResolve?: (id: string) => void; resolved?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [showFullDraft, setShowFullDraft] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [resolving, setResolving] = useState(false);

  const tones = data.toneOptions || ["Professional", "Warm", "Direct"];

  const handleResolve = () => {
    setResolving(true);
    setTimeout(() => onResolve?.(data.id), 320);
  };

  const handleOpen = () => {
    if (expanded) return;
    setShowDraft(false);
    setShowFullDraft(false);
    setExpanded(true);
  };

  const handleClose = () => {
    if (!expanded || resolved) return;
    setShowDraft(false);
    setShowFullDraft(false);
    setExpanded(false);
  };

  return (
    <article
      className={`transition-all duration-300 ${resolving ? "pointer-events-none opacity-0 translate-y-3" : "animate-slide-in"} ${resolved ? "opacity-60" : ""}`}
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative w-full transition-transform ease-[cubic-bezier(0.4,0.2,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: expanded ? "rotateY(180deg)" : "rotateY(0deg)",
          transitionDuration: "600ms",
        }}
      >
        {/* Front face - visible when not expanded */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            display: expanded ? "none" : "block",
          }}
        >
          <ActionCardFront
            data={data}
            onOpen={handleOpen}
            onResolve={!resolved ? handleResolve : undefined}
            resolved={resolved}
          />
        </div>

        {/* Back face - visible when expanded */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            display: expanded ? "block" : "none",
          }}
        >
          <ActionCardExpanded
            data={data}
            selectedTone={selectedTone}
            tones={tones}
            showDraft={showDraft}
            showFullDraft={showFullDraft}
            onToneChange={setSelectedTone}
            onToggleDraft={() => setShowDraft((prev) => !prev)}
            onToggleFullDraft={() => setShowFullDraft((prev) => !prev)}
            onFlipBack={handleClose}
            resolved={resolved}
            onResolve={!resolved ? handleResolve : undefined}
          />
        </div>
      </div>
    </article>
  );
};

export default ActionCard;
export type { ActionCardData } from "./action-card/types";
