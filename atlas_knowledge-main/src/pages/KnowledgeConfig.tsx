import { RefreshCw } from 'lucide-react';
import KnowledgeSection from '@/components/atlas/KnowledgeSection';

const userCategories = [
  { id: 'product-info', name: 'Product Info' },
  { id: 'pricing-plans', name: 'Pricing & Plans' },
  { id: 'objection-handling', name: 'Objection Handling' },
  { id: 'competitive-intel', name: 'Competitive Intel' },
  { id: 'company-policies', name: 'Company Policies' },
];

const clientCategories = [
  { id: 'client-product-info', name: 'Client Product Info' },
  { id: 'client-pricing-plans', name: 'Client Pricing & Plans' },
  { id: 'client-objection-handling', name: 'Client Objection Handling' },
  { id: 'client-competitive-intel', name: 'Client Competitive Intel' },
  { id: 'client-company-policies', name: 'Client Company Policies' },
];

const userDocuments = {
  'product-info': [
    { id: '1', name: 'product_catalog_2026.txt', category: 'product-info', hasSample: true, isUploaded: false },
    { id: '2', name: 'feature_specifications.txt', category: 'product-info', hasSample: true, isUploaded: false },
    { id: '3', name: 'pricing_guide.txt', category: 'product-info', hasSample: true, isUploaded: false },
  ],
  'pricing-plans': [
    { id: '4', name: 'pricing_tiers.txt', category: 'pricing-plans', hasSample: true, isUploaded: false },
    { id: '5', name: 'discount_rules.txt', category: 'pricing-plans', hasSample: true, isUploaded: false },
  ],
  'objection-handling': [
    { id: '6', name: 'common_objections.txt', category: 'objection-handling', hasSample: true, isUploaded: false },
    { id: '7', name: 'rebuttals_guide.txt', category: 'objection-handling', hasSample: true, isUploaded: false },
  ],
  'competitive-intel': [
    { id: '8', name: 'competitor_analysis.txt', category: 'competitive-intel', hasSample: true, isUploaded: false },
    { id: '9', name: 'battle_cards.txt', category: 'competitive-intel', hasSample: true, isUploaded: false },
  ],
  'company-policies': [
    { id: '10', name: 'data_privacy_policy.txt', category: 'company-policies', hasSample: true, isUploaded: false },
    { id: '11', name: 'sla_commitments.txt', category: 'company-policies', hasSample: true, isUploaded: false },
  ],
};

const clientDocuments = {
  'client-product-info': [
    { id: '12', name: 'client_product_catalog.txt', category: 'client-product-info', hasSample: true, isUploaded: false },
    { id: '13', name: 'client_feature_specs.txt', category: 'client-product-info', hasSample: true, isUploaded: false },
    { id: '14', name: 'client_pricing_guide.txt', category: 'client-product-info', hasSample: true, isUploaded: false },
  ],
  'client-pricing-plans': [
    { id: '15', name: 'client_pricing_tiers.txt', category: 'client-pricing-plans', hasSample: true, isUploaded: false },
    { id: '16', name: 'client_discount_rules.txt', category: 'client-pricing-plans', hasSample: true, isUploaded: false },
  ],
  'client-objection-handling': [
    { id: '17', name: 'client_common_objections.txt', category: 'client-objection-handling', hasSample: true, isUploaded: false },
    { id: '18', name: 'client_rebuttals_guide.txt', category: 'client-objection-handling', hasSample: true, isUploaded: false },
  ],
  'client-competitive-intel': [
    { id: '19', name: 'client_competitor_analysis.txt', category: 'client-competitive-intel', hasSample: true, isUploaded: false },
    { id: '20', name: 'client_battle_cards.txt', category: 'client-competitive-intel', hasSample: true, isUploaded: false },
  ],
  'client-company-policies': [
    { id: '21', name: 'client_data_privacy_policy.txt', category: 'client-company-policies', hasSample: true, isUploaded: false },
    { id: '22', name: 'client_sla_commitments.txt', category: 'client-company-policies', hasSample: true, isUploaded: false },
  ],
};

const KnowledgeConfig = () => {
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Knowledge Configuration
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Train Atlas AI with YOUR company information to provide intelligent assistance during calls.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <RefreshCw className="h-4 w-4" />
              Sync CRM
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-10">
        <KnowledgeSection
          title="Your Company Knowledge"
          categories={userCategories}
          documentsByCategory={userDocuments}
        />
        <KnowledgeSection
          title="Client Company Knowledge"
          categories={clientCategories}
          documentsByCategory={clientDocuments}
        />
      </div>
    </div>
  );
};

export default KnowledgeConfig;
