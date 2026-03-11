# Knowledge Configuration — Frontend Technical Specification

> **Purpose:** This document describes every UI element, user interaction, state change, and data flow on the Knowledge Configuration page. A backend developer should be able to fully understand and integrate with this frontend by reading this file alone.

---

## Table of Contents

1. [Page Overview](#1-page-overview)
2. [Page Layout & Structure](#2-page-layout--structure)
3. [Component Architecture](#3-component-architecture)
4. [Data Models & Interfaces](#4-data-models--interfaces)
5. [Section: Your Company Knowledge](#5-section-your-company-knowledge)
6. [Section: Client Company Knowledge](#6-section-client-company-knowledge)
7. [Detailed Interaction Map](#7-detailed-interaction-map)
8. [State Management](#8-state-management)
9. [API Contract Suggestions](#9-api-contract-suggestions)
10. [File Upload Flow](#10-file-upload-flow)
11. [Search & Filtering Logic](#11-search--filtering-logic)
12. [Styling & Design Tokens](#12-styling--design-tokens)
13. [Edge Cases & Empty States](#13-edge-cases--empty-states)
14. [Accessibility Notes](#14-accessibility-notes)

---

## 1. Page Overview

**Route:** `/knowledge-config`  
**Page Component:** `src/pages/KnowledgeConfig.tsx`  
**Purpose:** Allows users to manage knowledge base documents that train the Atlas AI. Documents are organized into categories, split into two independent sections: "Your Company Knowledge" and "Client Company Knowledge."

**Key Behaviors:**
- Both sections are visible simultaneously (vertical stack, no tabs).
- Each section has its own independent sidebar for category navigation and its own document table.
- Categories and documents are currently hardcoded (mock data). Backend integration will replace these with API calls.

---

## 2. Page Layout & Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky, white bg, bottom border)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Title: "Knowledge Configuration"                            │   │
│  │  Subtitle: "Train Atlas AI with YOUR company information..." │   │
│  │                                          [Sync CRM] button   │   │
│  └──────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  SCROLLABLE CONTENT AREA (p-8, space-y-10)                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  SECTION 1: "Your Company Knowledge"                          │  │
│  │  ┌──────────┐  ┌──────────────────────────────────────────┐   │  │
│  │  │ Category │  │  Document Table                           │   │  │
│  │  │ Sidebar  │  │  ┌─────────────────────────────────────┐ │   │  │
│  │  │          │  │  │ Search Bar                           │ │   │  │
│  │  │ • Prod.. │  │  ├─────────────────────────────────────┤ │   │  │
│  │  │ • Pric.. │  │  │ Header: Name | Sample | Actions     │ │   │  │
│  │  │ • Obje.. │  │  ├─────────────────────────────────────┤ │   │  │
│  │  │ • Comp.. │  │  │ Row 1: file.txt | Download | Upload │ │   │  │
│  │  │ • Poli.. │  │  │ Row 2: file.txt | Download | Upload │ │   │  │
│  │  │          │  │  │ ...                                  │ │   │  │
│  │  └──────────┘  │  └─────────────────────────────────────┘ │   │  │
│  │                │  "3 Product Info documents"               │   │  │
│  │                └──────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  SECTION 2: "Client Company Knowledge"                        │  │
│  │  (identical layout to Section 1, independent state)           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### Component Tree

```
KnowledgeConfig (page)
├── Header
│   ├── Title + Subtitle
│   └── "Sync CRM" Button (with RefreshCw icon)
├── KnowledgeSection (title="Your Company Knowledge")
│   ├── Category Sidebar (left, 220px fixed width)
│   │   └── Category Button × N
│   └── Document Table (right, flex-1)
│       ├── Search Input
│       ├── Table Header (Document Name | Sample | Actions)
│       ├── Table Rows × N
│       │   ├── FileText Icon + Document Name
│       │   ├── "Download Sample" link (if hasSample=true)
│       │   └── Action Buttons: [Upload] [Plus] [Trash]
│       └── Document Count Footer
└── KnowledgeSection (title="Client Company Knowledge")
    └── (same structure as above, independent state)
```

### File Locations

| Component | File Path |
|---|---|
| KnowledgeConfig (page) | `src/pages/KnowledgeConfig.tsx` |
| KnowledgeSection | `src/components/atlas/KnowledgeSection.tsx` |

---

## 4. Data Models & Interfaces

### KnowledgeCategory

```typescript
interface KnowledgeCategory {
  id: string;       // Unique identifier, e.g. "product-info"
  name: string;     // Display name, e.g. "Product Info"
}
```

### DocumentRow

```typescript
interface DocumentRow {
  id: string;           // Unique document ID, e.g. "1"
  name: string;         // File name, e.g. "product_catalog_2026.txt"
  category: string;     // Foreign key to KnowledgeCategory.id
  hasSample: boolean;   // Whether a sample template is available for download
  isUploaded: boolean;  // Whether the user has uploaded their own version
}
```

### KnowledgeSectionProps

```typescript
interface KnowledgeSectionProps {
  title: string;                                    // Section heading
  categories: KnowledgeCategory[];                  // List of categories for sidebar
  documentsByCategory: Record<string, DocumentRow[]>; // Documents keyed by category ID
}
```

---

## 5. Section: Your Company Knowledge

### Categories (Sidebar Items)

| ID | Display Name | # of Default Documents |
|---|---|---|
| `product-info` | Product Info | 3 |
| `pricing-plans` | Pricing & Plans | 2 |
| `objection-handling` | Objection Handling | 2 |
| `competitive-intel` | Competitive Intel | 2 |
| `company-policies` | Company Policies | 2 |

### Default Documents

#### Product Info (`product-info`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 1 | `product_catalog_2026.txt` | ✅ | ❌ |
| 2 | `feature_specifications.txt` | ✅ | ❌ |
| 3 | `pricing_guide.txt` | ✅ | ❌ |

#### Pricing & Plans (`pricing-plans`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 4 | `pricing_tiers.txt` | ✅ | ❌ |
| 5 | `discount_rules.txt` | ✅ | ❌ |

#### Objection Handling (`objection-handling`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 6 | `common_objections.txt` | ✅ | ❌ |
| 7 | `rebuttals_guide.txt` | ✅ | ❌ |

#### Competitive Intel (`competitive-intel`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 8 | `competitor_analysis.txt` | ✅ | ❌ |
| 9 | `battle_cards.txt` | ✅ | ❌ |

#### Company Policies (`company-policies`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 10 | `data_privacy_policy.txt` | ✅ | ❌ |
| 11 | `sla_commitments.txt` | ✅ | ❌ |

---

## 6. Section: Client Company Knowledge

### Categories (Sidebar Items)

| ID | Display Name | # of Default Documents |
|---|---|---|
| `client-product-info` | Client Product Info | 3 |
| `client-pricing-plans` | Client Pricing & Plans | 2 |
| `client-objection-handling` | Client Objection Handling | 2 |
| `client-competitive-intel` | Client Competitive Intel | 2 |
| `client-company-policies` | Client Company Policies | 2 |

### Default Documents

#### Client Product Info (`client-product-info`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 12 | `client_product_catalog.txt` | ✅ | ❌ |
| 13 | `client_feature_specs.txt` | ✅ | ❌ |
| 14 | `client_pricing_guide.txt` | ✅ | ❌ |

#### Client Pricing & Plans (`client-pricing-plans`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 15 | `client_pricing_tiers.txt` | ✅ | ❌ |
| 16 | `client_discount_rules.txt` | ✅ | ❌ |

#### Client Objection Handling (`client-objection-handling`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 17 | `client_common_objections.txt` | ✅ | ❌ |
| 18 | `client_rebuttals_guide.txt` | ✅ | ❌ |

#### Client Competitive Intel (`client-competitive-intel`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 19 | `client_competitor_analysis.txt` | ✅ | ❌ |
| 20 | `client_battle_cards.txt` | ✅ | ❌ |

#### Client Company Policies (`client-company-policies`)
| ID | File Name | Has Sample | Is Uploaded |
|---|---|---|---|
| 21 | `client_data_privacy_policy.txt` | ✅ | ❌ |
| 22 | `client_sla_commitments.txt` | ✅ | ❌ |

---

## 7. Detailed Interaction Map

### 7.1 Header — "Sync CRM" Button

| Property | Value |
|---|---|
| **Element** | `<button>` with `RefreshCw` icon |
| **Location** | Top-right of sticky header |
| **Current Behavior** | No handler attached (UI-only placeholder) |
| **Expected Backend Behavior** | Triggers a CRM sync job. Should call an API endpoint (e.g., `POST /api/knowledge/sync-crm`). Show loading spinner on the button during sync. Display success/error toast on completion. |

---

### 7.2 Category Sidebar — Category Click

| Property | Value |
|---|---|
| **Element** | Category `<button>` in sidebar |
| **Trigger** | `onClick` |
| **State Changed** | `selectedCategory` (local state in `KnowledgeSection`) |
| **Visual Effect** | Active category gets: `bg-blue-50`, `text-forskale-teal`, `border-l-2 border-forskale-teal`. All other categories revert to default gray styling. |
| **Data Effect** | Document table re-renders to show `documentsByCategory[selectedCategory]`. Search query is NOT reset (persists across category switches). |
| **Default Selection** | First category in the array is selected on mount (`categories[0].id`). |

**Important:** Each `KnowledgeSection` instance has its own independent `selectedCategory` state. Clicking a category in "Your Company Knowledge" does NOT affect "Client Company Knowledge" and vice versa.

---

### 7.3 Search Bar — Text Input

| Property | Value |
|---|---|
| **Element** | `<input type="text">` with `Search` icon |
| **Trigger** | `onChange` (real-time, no debounce) |
| **State Changed** | `searchQuery` (local state in `KnowledgeSection`) |
| **Filter Logic** | `doc.name.toLowerCase().includes(searchQuery.toLowerCase())` |
| **Scope** | Filters ONLY documents in the currently selected category |
| **Placeholder** | "Search Documents" |
| **Persistence** | Search query persists when switching categories within the same section |

**Important:** Each section has its own independent `searchQuery`. Searching in one section does not affect the other.

---

### 7.4 Document Row — "Download Sample" Link

| Property | Value |
|---|---|
| **Element** | `<button>` with `Download` icon + "Download Sample" text |
| **Visibility** | Only shown if `doc.hasSample === true` |
| **Current Behavior** | No handler attached (UI-only placeholder) |
| **Expected Backend Behavior** | Should trigger a file download. Backend should provide a download URL/endpoint, e.g., `GET /api/knowledge/samples/{documentId}`. The response should be a file download (Content-Disposition: attachment). |
| **Styling** | Teal colored text (`text-forskale-teal`), underline on hover |

---

### 7.5 Document Row — "Upload" Button

| Property | Value |
|---|---|
| **Element** | `<button>` with text "Upload" |
| **Current Behavior** | No handler attached (UI-only placeholder) |
| **Expected Backend Behavior** | Should open a file picker dialog (native browser `<input type="file">`). On file selection, upload the file to `POST /api/knowledge/documents/{documentId}/upload` (multipart/form-data). Update `isUploaded` to `true` on success. Show upload progress indicator. Display success/error toast. |
| **Styling** | Outlined button with teal border and text (`text-forskale-teal border-forskale-teal`), blue-50 background on hover |
| **Accepted File Types** | Should be restricted to `.txt`, `.md`, `.pdf`, `.docx` (suggested — currently not enforced) |

---

### 7.6 Document Row — "Plus" Button (+)

| Property | Value |
|---|---|
| **Element** | `<button>` with `Plus` icon |
| **Current Behavior** | No handler attached (UI-only placeholder) |
| **Expected Backend Behavior** | Should open a modal/dialog to add a new document to the current category. The modal should contain: a text input for document name, an optional file upload field, and a submit button. On submit, call `POST /api/knowledge/documents` with `{ name, category, file? }`. Add the new document to the table on success. |
| **Styling** | Gray icon (`text-gray-400`), darker gray on hover (`hover:text-gray-600`) |

---

### 7.7 Document Row — "Trash" Button (Delete)

| Property | Value |
|---|---|
| **Element** | `<button>` with `Trash2` icon |
| **Current Behavior** | No handler attached (UI-only placeholder) |
| **Expected Backend Behavior** | Should show a confirmation dialog ("Are you sure you want to delete this document?"). On confirm, call `DELETE /api/knowledge/documents/{documentId}`. Remove the document from the table on success. Display success/error toast. |
| **Styling** | Gray icon (`text-gray-400`), red on hover (`hover:text-red-500`) |

---

### 7.8 Document Count Footer

| Property | Value |
|---|---|
| **Element** | `<p>` text below the document table |
| **Content** | `"{count} {categoryName} document(s)"` |
| **Dynamic Values** | `count` = number of filtered documents (after search). `categoryName` = display name of selected category. |
| **Pluralization** | Uses "document" if count === 1, otherwise "documents" |
| **Example** | "3 Product Info documents" |

---

## 8. State Management

### Per-Section Local State (React `useState`)

Each `KnowledgeSection` component manages TWO pieces of state independently:

```
┌─────────────────────────────────────────────┐
│  KnowledgeSection ("Your Company Knowledge") │
│                                               │
│  selectedCategory: string                     │
│    - Default: categories[0].id                │
│    - Changed by: clicking sidebar category    │
│                                               │
│  searchQuery: string                          │
│    - Default: ""                              │
│    - Changed by: typing in search input       │
│    - Persists across category switches        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  KnowledgeSection ("Client Company Knowledge")│
│                                               │
│  selectedCategory: string                     │
│    - Default: categories[0].id                │
│    - Changed by: clicking sidebar category    │
│                                               │
│  searchQuery: string                          │
│    - Default: ""                              │
│    - Changed by: typing in search input       │
│    - Persists across category switches        │
└─────────────────────────────────────────────┘
```

### Derived/Computed Values

```typescript
// Documents for the currently selected category
const currentDocs = documentsByCategory[selectedCategory] || [];

// Documents filtered by search query
const filteredDocs = currentDocs.filter((doc) =>
  doc.name.toLowerCase().includes(searchQuery.toLowerCase())
);

// Display name of the selected category
const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name || '';
```

### State Flow Diagram

```
User clicks category → setSelectedCategory(cat.id)
                      → currentDocs recalculated
                      → filteredDocs recalculated (with existing searchQuery)
                      → Table re-renders with new documents
                      → Footer count updates

User types in search → setSearchQuery(value)
                      → filteredDocs recalculated
                      → Table re-renders with filtered documents
                      → Footer count updates
```

---

## 9. API Contract Suggestions

Below are suggested REST API endpoints the backend should implement to fully support this frontend:

### 9.1 Categories

```
GET /api/knowledge/categories?type=user
GET /api/knowledge/categories?type=client

Response: {
  categories: [
    { id: string, name: string }
  ]
}
```

### 9.2 Documents by Category

```
GET /api/knowledge/documents?categoryId={categoryId}

Response: {
  documents: [
    {
      id: string,
      name: string,
      category: string,
      hasSample: boolean,
      isUploaded: boolean,
      uploadedAt?: string (ISO 8601),
      fileSize?: number (bytes),
      fileType?: string (MIME type)
    }
  ]
}
```

### 9.3 Download Sample

```
GET /api/knowledge/samples/{documentId}

Response: File download (Content-Disposition: attachment; filename="sample_file.txt")
```

### 9.4 Upload Document

```
POST /api/knowledge/documents/{documentId}/upload
Content-Type: multipart/form-data

Body: {
  file: File
}

Response: {
  success: boolean,
  document: DocumentRow (updated)
}
```

### 9.5 Add Document

```
POST /api/knowledge/documents
Content-Type: application/json (or multipart/form-data if file included)

Body: {
  name: string,
  category: string,
  file?: File
}

Response: {
  success: boolean,
  document: DocumentRow (newly created)
}
```

### 9.6 Delete Document

```
DELETE /api/knowledge/documents/{documentId}

Response: {
  success: boolean
}
```

### 9.7 Sync CRM

```
POST /api/knowledge/sync-crm

Response: {
  success: boolean,
  syncedDocuments: number,
  errors?: string[]
}
```

---

## 10. File Upload Flow

### Current State (Frontend Only)
The upload button exists but has no handler. Here is the recommended implementation flow:

```
1. User clicks "Upload" button on a document row
   │
2. Browser file picker opens (accept: .txt, .md, .pdf, .docx)
   │
3. User selects a file
   │
4. Frontend validates:
   │  - File size (max 10MB suggested)
   │  - File type (allowed extensions)
   │  - If validation fails → show error toast, stop
   │
5. Frontend shows upload progress:
   │  - Replace "Upload" button with progress bar or spinner
   │  - Disable other actions on that row
   │
6. Send file to backend:
   │  POST /api/knowledge/documents/{documentId}/upload
   │  Content-Type: multipart/form-data
   │
7. On success:
   │  - Update document.isUploaded = true
   │  - Show success toast ("File uploaded successfully")
   │  - Optionally change "Upload" button to "Replace" or show uploaded indicator
   │
8. On failure:
      - Show error toast with message
      - Restore "Upload" button to original state
```

---

## 11. Search & Filtering Logic

### Algorithm
```typescript
// Input
const searchQuery: string;  // from user input
const currentDocs: DocumentRow[];  // docs in selected category

// Processing
const filteredDocs = currentDocs.filter((doc) =>
  doc.name.toLowerCase().includes(searchQuery.toLowerCase())
);

// Output: filteredDocs rendered in table
```

### Characteristics
- **Case insensitive:** "PRODUCT" matches "product_catalog.txt"
- **Partial match:** "cat" matches "product_catalog.txt"
- **No debounce:** Filters on every keystroke (acceptable for small datasets)
- **Scope:** Only filters within the currently selected category
- **Persistence:** Query persists when switching categories (may filter results in new category)
- **Empty query:** Shows all documents in the category

### Backend Considerations
- If backend pagination is added, search should be a query parameter: `GET /api/knowledge/documents?categoryId=x&search=query`
- For large datasets (100+ docs per category), consider server-side search with debounce

---

## 12. Styling & Design Tokens

### Colors Used

| Token/Class | Usage | Hex Approximation |
|---|---|---|
| `text-gray-900` | Primary text (headings, doc names) | #111827 |
| `text-gray-700` | Secondary text (inactive categories) | #374151 |
| `text-gray-500` | Tertiary text (subtitle, footer count) | #6B7280 |
| `text-gray-400` | Icon default color | #9CA3AF |
| `text-forskale-teal` | Active category, links, primary actions | Custom teal |
| `bg-white` | Page background, cards, header | #FFFFFF |
| `bg-gray-50` | Table header, category hover | #F9FAFB |
| `bg-blue-50` | Active category background, upload hover | #EFF6FF |
| `border-gray-200` | Card borders, dividers | #E5E7EB |
| `border-gray-300` | Input borders, secondary button borders | #D1D5DB |
| `border-gray-100` | Table row dividers | #F3F4F6 |
| `hover:text-red-500` | Delete icon hover | #EF4444 |

### Layout Constants

| Property | Value |
|---|---|
| Category sidebar width | 220px (fixed) |
| Page horizontal padding | 32px (p-8) |
| Section vertical spacing | 40px (space-y-10) |
| Card border radius | 12px (rounded-xl) |
| Header padding | px-8 py-5 |
| Table row padding | px-5 py-3.5 |
| Table grid columns | `1fr 160px 120px` |

### Typography

| Element | Classes |
|---|---|
| Page title | `text-2xl font-bold tracking-tight` |
| Page subtitle | `text-sm text-gray-500` |
| Section heading | `text-lg font-semibold` |
| Category name | `text-sm font-medium` |
| Document name | `text-sm text-gray-900` |
| Table header | `text-xs font-semibold uppercase tracking-wider` |
| Footer text | `text-sm text-gray-500` |

---

## 13. Edge Cases & Empty States

### No Documents in Category
When a category has no documents (or all are filtered out by search):

```
┌──────────────────────────────────────┐
│                                      │
│        [FileText icon, gray]         │
│                                      │
│  "No documents in this category yet."│
│                                      │
└──────────────────────────────────────┘
```

- Icon: `FileText`, `h-10 w-10`, `text-gray-300`
- Text: `text-sm text-gray-500`
- Padding: `px-5 py-12` (generous vertical padding)

### Search Finds No Results
Same empty state as above is shown. The footer will read: "0 {CategoryName} documents"

### Category Has No `hasSample` Documents
The "Sample" column cell is simply empty (no download link shown).

---

## 14. Accessibility Notes

### Current Implementation
- All interactive elements are `<button>` (keyboard accessible)
- Search input has `placeholder` text but no `<label>` (should add `aria-label`)
- Icons use Lucide React (SVG), no alt text needed as they're decorative alongside text
- Color contrast: Gray text on white background meets WCAG AA for `text-gray-500` and above
- Focus states: Search input has `focus:ring-2 focus:ring-forskale-teal/40`

### Recommended Improvements for Backend Integration
- Add `aria-label="Search documents"` to search input
- Add `aria-current="true"` to the active category button
- Add `aria-label` to icon-only buttons (Plus, Trash): `"Add document"`, `"Delete document"`
- Add keyboard navigation for category sidebar (arrow keys)
- Add `role="status"` and `aria-live="polite"` to document count footer for screen reader updates

---

## Summary of Required Backend Integration Points

| # | Action | Trigger | Suggested Endpoint | Priority |
|---|---|---|---|---|
| 1 | Fetch categories | Page load | `GET /api/knowledge/categories` | High |
| 2 | Fetch documents | Category click / page load | `GET /api/knowledge/documents` | High |
| 3 | Upload document | "Upload" button click | `POST /api/knowledge/documents/{id}/upload` | High |
| 4 | Download sample | "Download Sample" click | `GET /api/knowledge/samples/{id}` | Medium |
| 5 | Add document | "Plus" button click | `POST /api/knowledge/documents` | Medium |
| 6 | Delete document | "Trash" button click | `DELETE /api/knowledge/documents/{id}` | Medium |
| 7 | Sync CRM | "Sync CRM" button click | `POST /api/knowledge/sync-crm` | Low |
| 8 | Search documents | Search input typing | Client-side (or server-side for large datasets) | Low |

---

*Generated from frontend source code. Last updated: March 2026.*
