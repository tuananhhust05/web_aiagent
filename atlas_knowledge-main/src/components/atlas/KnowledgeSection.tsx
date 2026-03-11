import { useState } from 'react';
import { Search, Download, Trash2, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeCategory {
  id: string;
  name: string;
}

interface DocumentRow {
  id: string;
  name: string;
  category: string;
  hasSample: boolean;
  isUploaded: boolean;
}

interface KnowledgeSectionProps {
  title: string;
  categories: KnowledgeCategory[];
  documentsByCategory: Record<string, DocumentRow[]>;
}

const KnowledgeSection = ({ title, categories, documentsByCategory }: KnowledgeSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const currentDocs = documentsByCategory[selectedCategory] || [];
  const filteredDocs = currentDocs.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name || '';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="flex gap-5">
        {/* Category Sidebar */}
        <div className="w-[220px] shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <nav className="p-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-forskale-teal border-l-2 border-forskale-teal'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Documents Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Documents"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forskale-teal/40 focus:border-forskale-teal"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_160px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div>Document Name</div>
              <div>Sample</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredDocs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[1fr_160px_120px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{doc.name}</span>
                    </div>
                    <div>
                      {doc.hasSample && (
                        <button className="inline-flex items-center gap-1.5 text-sm text-forskale-teal hover:underline">
                          <Download className="h-4 w-4" />
                          Download Sample
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-sm font-medium text-forskale-teal border border-forskale-teal rounded-lg hover:bg-blue-50 transition-colors">
                        Upload
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No documents in this category yet.</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {filteredDocs.length} {selectedCategoryName} document{filteredDocs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeSection;
