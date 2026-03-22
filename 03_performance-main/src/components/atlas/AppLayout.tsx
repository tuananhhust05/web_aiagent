import { AtlasSidebar } from "@/components/atlas/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AtlasSidebar />
      <div className="relative flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
