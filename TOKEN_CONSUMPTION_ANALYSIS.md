# Phân Tích Mức Tiêu Thụ Token Cho Các Tính Năng

## Tổng Quan
Tài liệu này ước tính mức tiêu thụ token AI (Groq LLM) cho từng tính năng với 1 khách hàng bình thường.

**Model sử dụng:**
- **Meeting Intelligence & Call Insights:** `llama-3.1-8b-instant` (model lớn, chất lượng cao)
- **Action Ready & Q&A Engine:** `llama-3.1-8b-instant` (model nhỏ, tiết kiệm)

---

## 1. Meeting Intelligence (Phân Tích Cuộc Họp)

### 📍 File: [`backend/app/routers/meetings.py`](backend/app/routers/meetings.py)

### Tính Năng Chính:
1. **Atlas Meeting Insights** (`get_atlas_meeting_insights`) - Dòng 1658-1789
   - Phân tích transcript → Summary, Next Steps, Q&A
   - Sử dụng model: `llama-3.1-8b-instant`

2. **Meeting Feedback** (`get_meeting_feedback`) - Dòng 1792-1989
   - Performance metrics, AI coach feedback
   - Sử dụng model: `llama-3.1-8b-instant`

3. **Playbook Analysis** (`get_meeting_playbook_analysis`) - Dòng 1991+
   - So sánh với sales playbook
   - Sử dụng model: `llama-3.1-8b-instant`

### Ước Tính Token Cho 1 Meeting:

| Tính Năng | Input Tokens | Output Tokens | Tổng Tokens | Ghi Chú |
|-----------|-------------|---------------|-------------|---------|
| **Atlas Insights** | ~3,000 | ~800 | **~3,800** | Transcript + prompt → Summary/Next Steps/Q&A |
| **Feedback** | ~2,500 | ~600 | **~3,100** | Transcript + prompt → Metrics/Coaching |
| **Playbook Analysis** | ~3,500 | ~700 | **~4,200** | Transcript + playbook rules → Rule results |

**📊 Tổng Token/Meeting = ~11,100 tokens**

### Kịch Bản Sử Dụng:
- Khách hàng trung bình: **2-4 meetings/tuần**
- Token/tháng: 11,100 × 3 meetings/tuần × 4 tuần = **~133,200 tokens/tháng**

---

## 2. Call Insights (Phân Tích Cuộc Gọi)

### 📍 File: [`backend/app/routers/calls.py`](backend/app/routers/calls.py)

### Tính Năng Chính:
1. **Playbook Analysis** (`get_call_playbook_analysis`) - Dòng 537-720
   - So sánh call transcript với sales playbook
   - Sử dụng model: `llama-3.1-8b-instant` (qua service `analyze_call_against_playbook`)

### Ước Tính Token Cho 1 Call:

| Tính Năng | Input Tokens | Output Tokens | Tổng Tokens | Ghi Chú |
|-----------|-------------|---------------|-------------|---------|
| **Playbook Analysis** | ~2,500 | ~600 | **~3,100** | Transcript (ngắn hơn meeting) + rules |

**📊 Tổng Token/Call = ~3,100 tokens**

### Kịch Bản Sử Dụng:
- Khách hàng trung bình: **5-10 calls/tuần**
- Token/tháng: 3,100 × 7 calls/tuần × 4 tuần = **~86,800 tokens/tháng**

---

## 3. Action Ready (To-Do & Task Management)

### 📍 File: [`backend/app/routers/todo_ready.py`](backend/app/routers/todo_ready.py)

### Tính Năng Chính:
1. **Intent Classification** (`_classify_intent_for_text`) - Dòng 118-180
   - Phân loại email/meeting intent
   - Model: `llama-3.1-8b-instant`
   - Max tokens: 20

2. **Task Strategy Generation** (`_generate_task_strategy_with_ai`) - Dòng 260-312
   - Tạo chiến lược xử lý task
   - Model: `llama-3.1-8b-instant`
   - Max tokens: 600

3. **Email Script Suggestion** (`suggest_script_for_item`) - Dòng 544-608
   - Gợi ý email trả lời
   - Model: `llama-3.1-8b-instant`
   - Max tokens: 400

### Ước Tính Token Cho Mỗi Task:

| Tính Năng | Input Tokens | Output Tokens | Tổng Tokens | Frequency |
|-----------|-------------|---------------|-------------|-----------|
| **Intent Classification** | ~800 | ~20 | **~820** | Mỗi task (1 lần) |
| **Strategy Generation** | ~1,000 | ~600 | **~1,600** | On-demand (50% tasks) |
| **Email Script** | ~600 | ~400 | **~1,000** | On-demand (30% tasks) |

**📊 Token per Task:**
- Minimum (chỉ intent): **820 tokens**
- Average (intent + strategy): **2,420 tokens**
- Maximum (tất cả): **3,420 tokens**

### Kịch Bản Sử Dụng:
- **Auto-analyze**: 10 emails + 3 meetings/tuần = 13 tasks/tuần
- **Manual review**: 50% tasks cần strategy, 30% cần script
- Token/tháng: 
  - Intent: 820 × 13 × 4 = **42,640 tokens**
  - Strategy: 1,600 × 6.5 × 4 = **41,600 tokens**
  - Script: 1,000 × 3.9 × 4 = **15,600 tokens**
  - **Tổng: ~99,840 tokens/tháng**

---

## 4. Q&A Engine (Knowledge Base RAG)

### 📍 File: [`backend/app/services/qna_engine.py`](backend/app/services/qna_engine.py)

### Tính Năng Chính:
1. **Extract Questions** (`extract_questions_from_transcript`) - Dòng 36-141
   - Trích xuất câu hỏi từ transcript
   - Model: `llama-3.1-8b-instant` (nhỏ, tiết kiệm)
   - Input: 4,000 chars transcript
   - Max tokens: 500

2. **Generate Answer** (`generate_grounded_answer`) - Dòng 239-310
   - Tạo câu trả lời (có hoặc không grounded)
   - Model: `llama-3.1-8b-instant`
   - Max tokens: 500

3. **Simple Answer** (`generate_simple_answer`) - Dòng 313-372
   - Tạo câu trả lời đơn giản
   - Model: `llama-3.1-8b-instant`
   - Max tokens: 300

### Ước Tính Token:

| Tính Năng | Input Tokens | Output Tokens | Tổng Tokens | Ghi Chú |
|-----------|-------------|---------------|-------------|---------|
| **Extract Questions** | ~1,500 | ~200 | **~1,700** | Per call/meeting (1-3 questions) |
| **Generate Answer** | ~800 | ~200 | **~1,000** | Per question |
| **Total per Call** | - | - | **~4,700** | 1 extraction + 3 answers |

**📊 Token per Call = ~4,700 tokens**

### Kịch Bản Sử Dụng:
- Q&A extraction: **5 meetings/tháng** (không phải tất cả)
- Token/tháng: 4,700 × 5 = **~23,500 tokens/tháng**

---

## 📊 TỔNG HỢP CHO 1 KHÁCH HÀNG TRUNG BÌNH

### Mức Sử Dụng Trung Bình/Tháng:

| Tính Năng | Tokens/Tháng | % Tổng | Mô Tả |
|-----------|-------------|--------|-------|
| **Meeting Intelligence** | 133,200 | 38.5% | 3 meetings/tuần × 4 tuần |
| **Call Insights** | 86,800 | 25.1% | 7 calls/tuần × 4 tuần |
| **Action Ready** | 99,840 | 28.9% | 13 tasks/tuần × 4 tuần |
| **Q&A Engine** | 23,500 | 6.8% | 5 meetings/tháng |
| **Buffer (20%)** | 68,668 | - | Dự phòng cho spike |
| **TỔNG** | **~412,000** | 100% | **≈ 412K tokens/tháng** |

---

## 💰 PRICING ESTIMATION

### Groq API Pricing (tham khảo):
- **llama-3.1-8b-instant**: $0.59/1M input tokens, $0.79/1M output tokens
- **llama-3.1-8b-instant**: $0.05/1M input tokens, $0.08/1M output tokens

### Cost Breakdown (1 khách hàng/tháng):

**Meeting Intelligence + Call Insights + Playbook (70b model):**
- Input: ~(133.2k + 86.8k) × 0.7 = 154k tokens × $0.59/1M = **$0.09**
- Output: ~(133.2k + 86.8k) × 0.3 = 66k tokens × $0.79/1M = **$0.05**

**Action Ready (70b model):**
- Input: ~99.8k × 0.7 = 70k tokens × $0.59/1M = **$0.04**
- Output: ~99.8k × 0.3 = 30k tokens × $0.79/1M = **$0.02**

**Q&A Engine (8b instant model):**
- Input: ~23.5k × 0.7 = 16.5k tokens × $0.05/1M = **$0.001**
- Output: ~23.5k × 0.3 = 7k tokens × $0.08/1M = **$0.001**

**💵 Tổng Chi Phí AI/Khách Hàng/Tháng: ~$0.20 - $0.25**

---

## 📈 SCALING SCENARIOS

### Khách Hàng Nhỏ (Light User):
- 1-2 meetings/tuần, 3-5 calls/tuần, 5 tasks/tuần
- **~150K tokens/tháng**
- **Chi phí: ~$0.09/tháng**

### Khách Hàng Trung Bình (Normal User):
- 3 meetings/tuần, 7 calls/tuần, 13 tasks/tuần
- **~412K tokens/tháng**
- **Chi phí: ~$0.24/tháng**

### Khách Hàng Lớn (Power User):
- 5+ meetings/tuần, 15+ calls/tuần, 25+ tasks/tuần
- **~800K tokens/tháng**
- **Chi phí: ~$0.47/tháng**

### Team (10 users):
- **4.1M tokens/tháng**
- **Chi phí: ~$2.40/tháng**

### Enterprise (100 users):
- **41M tokens/tháng**
- **Chi phí: ~$24/tháng**

---

## 🎯 KẾT LUẬN & KHUYẾN NGHỊ

### Mức Token Ước Tính Cho Marketing Pricing:

1. **Per Feature Token Cost:**
   - **Meeting Intelligence**: 11,100 tokens/meeting
   - **Call Insights**: 3,100 tokens/call
   - **Action Ready**: 2,420 tokens/task (trung bình)
   - **Q&A Engine**: 4,700 tokens/extraction

2. **Typical Monthly Usage:**
   - **Starter Plan** (1 user): 150K-200K tokens (~$0.10-$0.12)
   - **Professional Plan** (1 user): 400K-500K tokens (~$0.24-$0.30)
   - **Team Plan** (5 users): 2M-2.5M tokens (~$1.20-$1.50)
   - **Enterprise Plan** (custom): Scale theo usage

3. **Pricing Strategy Recommendations:**
   - **Cost basis**: $0.25/user/month (AI cost only)
   - **Markup**: 20-40x → **$5-10/user/month** (competitive SaaS pricing)
   - **Bundle với infrastructure, storage, support**
   - **Free tier**: 50K tokens/month (≈ 4-5 meetings)
   - **Overage charges**: $10 per 100K tokens nếu vượt quota

### Optimization Tips:
- ✅ Đã sử dụng smaller model (8b-instant) cho Q&A & tasks
- ✅ Cache results (Meeting Insights, Feedback, Playbook Analysis)
- ✅ Truncate transcripts (4000 chars for Q&A, full for insights)
- ✅ Rate limiting & retry logic
- 🔄 Có thể optimize thêm: Batch processing, smart caching, conditional analysis

---

**📅 Last Updated:** 2026-03-06  
**📝 Prepared for:** Marketing Team - Pricing Strategy  
**🔗 Source Code References:** [`meetings.py`](backend/app/routers/meetings.py), [`calls.py`](backend/app/routers/calls.py), [`todo_ready.py`](backend/app/routers/todo_ready.py), [`qna_engine.py`](backend/app/services/qna_engine.py)
