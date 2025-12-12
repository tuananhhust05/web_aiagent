# Pipeline Enhancement Plan

## Yêu cầu từ khách hàng

### 1. ✅ Multiple Pipelines Support
**Status**: Đã có sẵn
- Backend đã support tạo nhiều pipelines
- Frontend có PipelineSettings để tạo/edit pipelines
- Cần: Cải thiện UI để dễ dàng tạo và switch giữa các pipelines

### 2. ✅ Fully Customizable Pipelines
**Status**: Đã có cơ bản, cần enhance
- ✅ Custom stages (name, probability, color, order)
- ✅ Drag-and-drop ordering trong PipelineSettings
- ⚠️ Custom fields: Chưa có đầy đủ
- ⚠️ Custom probabilities: Có nhưng cần UI tốt hơn

### 3. ⚠️ Visual Layout - Panel Style Structure
**Status**: Cần cải thiện để match với screenshot
- ✅ Column-based pipeline view: Đã có
- ✅ Drag-and-drop between stages: Đã có
- ⚠️ Clean UI: Cần cải thiện để match với design
- ⚠️ Quick actions on deal cards: Cần thêm
- ⚠️ Footer statistics: Cần thêm
- ⚠️ Filter bar: Cần thêm

### 4. ❌ Negotiation Stage Auto-populate Interactions
**Status**: Chưa có (có thể postpone)
- Calls, emails, messages, notes, meetings tự động pull vào
- Cần tích hợp với các services khác (email, calls, etc.)

---

## Implementation Plan

### Phase 1: UI/UX Improvements (Priority: High)

#### 1.1 Enhance Pipeline Selector
- [ ] Thêm button "Create New Pipeline" trong dropdown
- [ ] Hiển thị pipeline type/business type
- [ ] Quick actions (Edit, Delete, Set as Default)

#### 1.2 Improve Column Header Design
- [ ] Hiển thị stage name và deal count rõ ràng hơn
- [ ] Thêm navigation arrows (left/right) để scroll columns
- [ ] Thêm stage color indicator
- [ ] Thêm menu để edit stage settings

#### 1.3 Enhance Deal Cards
- [ ] Match với design trong screenshot:
  - Company/Deal name prominent
  - Amount, closing date, owner, creation date
  - Activity indicators (calls, emails, meetings)
  - Days in stage indicator
  - Quick actions: View, Edit, Delete, Email, Call
- [ ] Hover effects và animations
- [ ] Better spacing và typography

#### 1.4 Add Footer Statistics
- [ ] Total amount per stage
- [ ] Weighted amount per stage (amount × probability)
- [ ] Progress bars showing weighted amount
- [ ] Summary totals across all stages

#### 1.5 Add Filter Bar
- [ ] Deal Owner filter
- [ ] Creation Date filter
- [ ] Last Activity Date filter
- [ ] Closing Date filter
- [ ] Advanced filters dropdown
- [ ] View type selector (All, Open, Won, Lost, etc.)

### Phase 2: Custom Fields & Advanced Customization (Priority: Medium)

#### 2.1 Custom Fields per Pipeline
- [ ] Backend: Add `custom_fields` to Pipeline model
- [ ] Frontend: UI để define custom fields
- [ ] Deal cards hiển thị custom fields
- [ ] Filter/search theo custom fields

#### 2.2 Enhanced Stage Customization
- [ ] Required fields per stage
- [ ] Stage-specific validation rules
- [ ] Stage templates
- [ ] Bulk stage operations

### Phase 3: Auto-populate Interactions (Priority: Low - Can Postpone)

#### 3.1 Integration Points
- [ ] Calls API integration
- [ ] Emails API integration
- [ ] Messages/WhatsApp/Telegram integration
- [ ] Notes API integration
- [ ] Meetings/Calendar integration

#### 3.2 Activity Feed per Deal
- [ ] Auto-populate activities in negotiation stage
- [ ] Activity timeline view
- [ ] Activity filters

---

## Current State Analysis

### ✅ What's Working
1. Multiple pipelines support (backend + basic UI)
2. Custom stages với name, probability, color, order
3. Drag-and-drop reordering trong PipelineSettings
4. Basic column-based kanban view
5. Drag-and-drop deals between stages
6. Pipeline selector dropdown

### ⚠️ What Needs Improvement
1. **UI Design**: Cần match với screenshot design
   - Column headers cần redesign
   - Deal cards cần more information và better layout
   - Footer statistics missing
   - Filter bar missing

2. **Pipeline Management UX**:
   - Dễ dàng tạo pipeline mới từ UI
   - Quick actions để edit/delete pipelines
   - Better pipeline selector

3. **Deal Card Information**:
   - Cần hiển thị đầy đủ thông tin như screenshot
   - Activity indicators
   - Quick actions

### ❌ What's Missing
1. Custom fields per pipeline
2. Footer statistics (total amount, weighted amount)
3. Filter bar với advanced filters
4. Auto-populate interactions (có thể postpone)

---

## Next Steps

### Immediate (This Week)
1. ✅ Fix loading issue (đã fix)
2. ⏳ Enhance deal cards với đầy đủ thông tin
3. ⏳ Add footer statistics
4. ⏳ Improve column header design
5. ⏳ Add filter bar

### Short-term (Next 2 Weeks)
1. Custom fields support
2. Enhanced pipeline management UI
3. Better quick actions
4. Activity indicators

### Long-term (Future)
1. Auto-populate interactions
2. Advanced analytics
3. Pipeline templates
4. Bulk operations

---

## Technical Notes

### Backend APIs Available
- `GET /api/pipelines/get_pipelines` - Get all pipelines
- `GET /api/pipelines/default` - Get or create default pipeline
- `POST /api/pipelines` - Create pipeline
- `PUT /api/pipelines/{pipeline_id}` - Update pipeline
- `GET /api/pipelines/{pipeline_id}/view` - Get pipeline kanban view
- `GET /api/pipelines/{pipeline_id}/analytics` - Get pipeline analytics

### Frontend Components
- `SalesPipeline.tsx` - Main kanban view
- `PipelineSettings.tsx` - Pipeline configuration modal
- `DealCreateModal.tsx` - Create deal modal
- `DealDetailModal.tsx` - Deal detail view
- `DealEditModal.tsx` - Edit deal modal

### Data Models
- Pipeline có stages với: name, probability, order, color, description
- Deal có: pipeline_id, stage_id, amount, contact info, dates, etc.

