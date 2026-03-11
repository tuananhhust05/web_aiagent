import AtlasSidebar from "@/components/atlas/AtlasSidebar";
import ActionReadyHeader from "@/components/atlas/ActionReadyHeader";
import ActionFilterSidebar from "@/components/atlas/ActionFilterSidebar";
import ActionReadyContent from "@/components/atlas/ActionReadyContent";
import { ActionsProvider } from "@/context/ActionsContext";

const Index = () => {
  return (
    <ActionsProvider>
      <div className="flex min-h-screen bg-background">
        <AtlasSidebar />
        <div className="flex-1 flex flex-col">
          <ActionReadyHeader />
          <div className="flex flex-1 overflow-hidden">
            <ActionFilterSidebar />
            <ActionReadyContent />
          </div>
        </div>
      </div>
    </ActionsProvider>
  );
};

export default Index;
