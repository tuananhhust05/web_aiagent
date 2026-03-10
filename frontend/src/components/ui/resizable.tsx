import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "../../lib/utils";

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
}

const ResizablePanelGroup = ({ className, direction = "horizontal", ...props }: ResizablePanelGroupProps) => (
  <div
    className={cn(
      "flex h-full w-full",
      direction === "vertical" && "flex-col",
      className,
    )}
    {...props}
  />
);

const ResizablePanel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1", className)} {...props} />
);

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean;
}

const ResizableHandle = ({ withHandle, className, ...props }: ResizableHandleProps) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
