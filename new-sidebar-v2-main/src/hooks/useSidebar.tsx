import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  transitioning: boolean;
  visuallyCollapsed: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const TRANSITION_MS = 300;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [visuallyCollapsed, setVisuallyCollapsed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTransition = useCallback((nextCollapsed: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setTransitioning(true);

    if (nextCollapsed) {
      setVisuallyCollapsed(true);
    }

    setCollapsed(nextCollapsed);

    timerRef.current = setTimeout(() => {
      setTransitioning(false);
      setVisuallyCollapsed(nextCollapsed);
    }, TRANSITION_MS);
  }, []);

  const toggle = useCallback(() => startTransition(!collapsed), [collapsed, startTransition]);
  const expand = useCallback(() => startTransition(false), [startTransition]);
  const collapse = useCallback(() => startTransition(true), [startTransition]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, transitioning, visuallyCollapsed, toggle, expand, collapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  }
  return ctx;
}
