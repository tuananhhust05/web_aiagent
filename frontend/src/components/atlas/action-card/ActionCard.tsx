import { useState, useRef, useEffect } from "react";
import ActionCardFront from "./ActionCardFront";
import ActionCardExpanded from "./ActionCardExpanded";
import type { TodoItem } from "../../../lib/api";

export default function ActionCard({
  task,
  onResolve,
  onOpen,
  resolved,
}: {
  task: TodoItem;
  onResolve?: (id: string) => void;
  onOpen?: (task: TodoItem) => void;
  resolved?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (expanded && backRef.current) {
      setContainerH(backRef.current.scrollHeight);
    } else if (!expanded && frontRef.current) {
      setContainerH(frontRef.current.scrollHeight);
    }
  }, [expanded, task]);

  const handleResolve = () => {
    setResolving(true);
    setTimeout(() => onResolve?.(task.id), 320);
  };

  const handleOpen = () => {
    if (expanded) return;
    if (backRef.current) setContainerH(backRef.current.scrollHeight);
    setExpanded(true);
    onOpen?.(task);
  };

  const handleClose = () => {
    if (!expanded || resolved) return;
    if (frontRef.current) setContainerH(frontRef.current.scrollHeight);
    setExpanded(false);
  };

  return (
    <article
      className={`transition-all duration-300 ${resolving ? "pointer-events-none opacity-0 translate-y-3" : "animate-slide-in"} ${resolved ? "opacity-60" : ""}`}
      style={{ perspective: "1200px" }}
    >
      <div
        style={{
          height: containerH ? `${containerH}px` : "auto",
          transition: "height 600ms cubic-bezier(0.4, 0.2, 0.2, 1)",
        }}
      >
        <div
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: expanded ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 600ms cubic-bezier(0.4, 0.2, 0.2, 1)",
          }}
        >
          {/* Front face */}
          <div
            ref={frontRef}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <ActionCardFront
              task={task}
              onOpen={handleOpen}
              onResolve={!resolved ? handleResolve : undefined}
              resolved={resolved}
            />
          </div>

          {/* Back face */}
          <div
            ref={backRef}
            className="absolute top-0 left-0 w-full"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <ActionCardExpanded
              task={task}
              onFlipBack={handleClose}
              resolved={resolved}
              onResolve={!resolved ? handleResolve : undefined}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
