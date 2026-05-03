import AtlasSidebar from "@/components/atlas/AtlasSidebar";
import ActionReadyHeader from "@/components/atlas/ActionReadyHeader";
import ActionFilterSidebar from "@/components/atlas/ActionFilterSidebar";
import ActionReadyContent from "@/components/atlas/ActionReadyContent";
import DashboardTopBar from "@/components/atlas/DashboardTopBar";
import { ActionsProvider } from "@/context/ActionsContext";
import { LanguageProvider } from "@/context/LanguageContext";

const Index = () => {
  return (
    <LanguageProvider>
      <ActionsProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <AtlasSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardTopBar />
            <ActionReadyHeader />
            <div className="flex flex-1 overflow-hidden">
              <ActionFilterSidebar />
              <ActionReadyContent />
            </div>
          </div>
        </div>
      </ActionsProvider>
    </LanguageProvider>
  );
};

export default Index;
