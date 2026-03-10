import * as React from "react";
import { cn } from "../../lib/utils";

export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <div
      className={cn("rounded-md border p-3 text-xs text-muted-foreground", className)}
      {...props}
    >
      Calendar component is not implemented in this build.
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
