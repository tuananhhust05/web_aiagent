import { AppLayout } from '@/components/atlas/AppLayout';
import KnowledgeConfig from './KnowledgeConfig';
import { ChevronDown } from 'lucide-react';

const Index = () => {
  return (
    <AppLayout>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-12 px-4 flex items-center justify-end border-b border-gray-200 bg-white">
          <button className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1.5 transition-colors">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-forskale-green to-forskale-teal flex items-center justify-center text-white text-xs font-semibold">
              R
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </header>

        <KnowledgeConfig />
      </div>
    </AppLayout>
  );
};

export default Index;
