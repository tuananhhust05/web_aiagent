import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  return (
    <AppLayout activeNav="Home">
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Select a page from the sidebar</p>
      </div>
    </AppLayout>
  );
};

export default Index;
