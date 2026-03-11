import { useState } from "react";
import { Search, SlidersHorizontal, Sparkles, Mail } from "lucide-react";

const ActionReadyHeader = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b border-border bg-card px-5 py-3.5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-forskale-blue">
            Action Ready
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Execution flashcards for sales follow-up
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Review one AI-prepared action at a time, expand the card, refine the draft, and move straight to the next task.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-[180px] rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-accent hover:text-foreground">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-accent hover:text-foreground">
            <Sparkles size={16} />
            <span className="hidden sm:inline">Analyze New</span>
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-4 text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.4)]">
            <Mail size={16} />
            <span>Paste Email</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ActionReadyHeader;
