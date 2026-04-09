import AppNavSidebar from "@/components/AppNavSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

export function AppLayout({ children, activeNav }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppNavSidebar activeNav={activeNav} />
      <div className="relative flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
