# AI Sales Copilot với RAG Rules - Flow Documentation

## Tổng quan

Khi user bấm nút **"Regenerate"** trong trang `/ai-sales-copilot`, hệ thống sẽ thực hiện một flow nâng cao để phân tích contacts và tạo prioritized prospects bằng cách:

1. Hỏi Groq về rules cần thiết dựa trên contact data
2. Tìm kiếm rules liên quan trong Weaviate (RAG)
3. Kết hợp rules + contact data
4. Gen chiến lược với context đầy đủ

---

## Flow chi tiết

### **Step 1: Lấy dữ liệu Contact**

**Endpoint:** `POST /api/prioritized-prospects/generate`

**Input:**
- `limit`: Số lượng contacts cần phân tích (default: 50, max: 100)
- `current_user`: User hiện tại (từ JWT token)

**Process:**
```python
# Lấy contacts với campaigns, goals, deals
contacts_data = await get_contacts_detailed_internal(...)

# Format contact data cho AI
contacts_for_ai = [
    {
        "id": contact.id,
        "name": f"{first_name} {last_name}",
        "email": email,
        "company": company,
        "campaigns": [...],
        "deals": [...]
    }
]
```

**Output:** List of contacts với đầy đủ context (campaigns, deals, goals)

---

### **Step 2: Hỏi Groq về Rules cần thiết**

**Mục đích:** Xác định loại rules/guidelines nào cần thiết để phân tích contacts này

**Process:**
```python
# Tạo prompt cho Groq
rules_query_prompt = f"""
Based on the following contact data, what rules or guidelines are needed 
to analyze and prioritize these prospects?

Contact Data Sample:
{contacts_data_summary}

Provide a brief description (maximum 3 sentences) of what rules or guidelines 
would be relevant for analyzing these contacts. Focus on sales strategies, 
qualification criteria, engagement rules, or best practices.
"""

# Call Groq API
POST https://api.groq.com/openai/v1/chat/completions
Model: llama-3.1-8b-instant
Max tokens: 200
Temperature: 0.5
```

**Input:**
- Sample contact data (5 contacts đầu tiên)
- Prompt yêu cầu rules description (max 3 câu)

**Output:**
- Text description về rules cần thiết (max 3 câu)
- Ví dụ: "Focus on qualification rules for B2B contacts with active campaigns, engagement strategies for high-value deals, and timing rules for follow-up actions."

**Fallback:**
- Nếu Groq fail → dùng default: `"sales strategies and best practices for contact analysis and prioritization"`

---

### **Step 3: Tìm kiếm Rules trong Weaviate (RAG Search)**

**Mục đích:** Tìm các rules liên quan từ knowledge base đã upload

**Process:**
```python
# 1. Vectorize rules query text
query_vector = vectorize_text(rules_query_text)
# Model: all-distilroberta-v1
# Dimension: 768

# 2. Search in Weaviate
collection = weaviate_client.collections.get("DataAiSaleCoach")

# 3. Semantic search với filter user_id
results = collection.query.near_vector(
    near_vector=query_vector,
    limit=5,  # Max 5 rules
    filters=Filter.by_property("user_id").equal(user_id),
    return_metadata=MetadataQuery(distance=True)
)
```

**Input:**
- Rules query text từ Step 2 (đã vectorized)
- `user_id`: Chỉ tìm trong dữ liệu của user hiện tại

**Output:**
- List of 5 rules (chunks) liên quan nhất từ Weaviate
- Mỗi rule có:
  - `content`: Nội dung rule
  - `doc_id`: ID của document gốc
  - `chunk_index`: Vị trí trong document
  - `similarity_score`: Độ tương đồng (0-1)

**Fallback:**
- Nếu không tìm thấy rules → `relevant_rules = []`
- Flow vẫn tiếp tục với general best practices

---

### **Step 4: Kết hợp Rules + Contact Data**

**Mục đích:** Tạo context đầy đủ cho AI analysis

**Process:**
```python
# Format rules context
if relevant_rules:
    rules_context = f"""
Relevant Sales Rules and Guidelines (from knowledge base):
{chr(10).join([f"- {rule}" for rule in relevant_rules[:5]])}

Use these rules and guidelines to inform your analysis and recommendations.
"""
else:
    rules_context = "\nNo specific rules found in knowledge base. Use general sales best practices.\n"

# Combine với contact data
prompt = f"""
You are an AI Sales Assistant. Analyze the following contacts...

{rules_context}

For each contact, determine:
1. What action should be taken
2. When to take action
3. Best channel to use
4. Priority score
5. Confidence score
6. Generated Content
7. AI Tips

Contacts Data:
{contacts_summary}
"""
```

**Input:**
- Rules từ Step 3 (max 5 rules)
- Contact data từ Step 1

**Output:**
- Comprehensive prompt bao gồm:
  - Rules context (nếu có)
  - Contact data chi tiết
  - Instructions cho AI

---

### **Step 5: Gen Chiến lược với Groq (Flow cũ)**

**Mục đích:** Tạo prioritized prospects với context đầy đủ

**Process:**
```python
# Call Groq API
POST https://api.groq.com/openai/v1/chat/completions
Model: llama-3.1-8b-instant
Temperature: 0.7
Max tokens: 8000

Payload:
{
    "messages": [
        {
            "role": "system",
            "content": "You are an AI Sales Assistant that generates prioritized prospects 
                        based on contact data, campaigns, goals, deals, and relevant sales rules. 
                        Always return a valid JSON array. Incorporate the provided rules and 
                        guidelines into your analysis."
        },
        {
            "role": "user",
            "content": prompt  // Từ Step 4
        }
    ]
}
```

**Input:**
- Prompt từ Step 4 (có rules + contact data)

**Output:**
- JSON array of prioritized prospects:
```json
[
  {
    "prospect_id": "contact_id",
    "prospect_name": "Contact Name",
    "what": "Specific action to take",
    "when": "When to take action",
    "channel": "Gmail|Telegram|AI Call|Linkedin|Whatsapp",
    "priority": 8,
    "confidence": 85.5,
    "reasoning": "Brief explanation",
    "generated_content": "Complete, ready-to-send content",
    "ai_tips": [
      {
        "title": "Tip title",
        "content": "Detailed tip content",
        "category": "personalization|timing|engagement|..."
      }
    ]
  }
]
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Regenerate" in /ai-sales-copilot              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Get Contact Data                                    │
│ - Fetch contacts with campaigns, goals, deals              │
│ - Format for AI processing                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Ask Groq about Rules                                │
│ - Send contact data sample to Groq                          │
│ - Ask: "What rules needed for analysis?"                    │
│ - Get rules description (max 3 sentences)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Search Rules in Weaviate (RAG)                      │
│ - Vectorize rules query text                                │
│ - Semantic search in DataAiSaleCoach collection             │
│ - Filter by user_id                                         │
│ - Get top 5 most relevant rules                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Combine Rules + Contact Data                        │
│ - Format rules context                                      │
│ - Combine with contact data                                 │
│ - Create comprehensive prompt                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Generate Strategy with Groq                         │
│ - Call Groq API with full context                           │
│ - Generate prioritized prospects                            │
│ - Include rules in analysis                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Return Prioritized Prospects                                │
│ - Save to database                                          │
│ - Display in UI                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Generate Prioritized Prospects

**Endpoint:** `POST /api/prioritized-prospects/generate`

**Query Parameters:**
- `limit` (optional): Number of contacts to analyze (default: 50, max: 100)

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Response:**
```json
[
  {
    "id": "prospect_id",
    "prospect_id": "contact_id",
    "prospect_name": "John Doe",
    "what": "Send introduction email about new product",
    "when": "Today",
    "channel": "Gmail",
    "priority": 8,
    "confidence": 85.5,
    "reasoning": "...",
    "generated_content": "...",
    "ai_tips": [...]
  }
]
```

---

## Error Handling & Fallbacks

### Step 2 (Groq Rules Query) fails:
- **Fallback:** Use default text: `"sales strategies and best practices for contact analysis and prioritization"`
- **Impact:** Flow continues, but may not find specific rules

### Step 3 (Weaviate Search) fails:
- **Fallback:** `relevant_rules = []`
- **Impact:** Flow continues without rules, uses general best practices

### Step 3 (No rules found):
- **Fallback:** `rules_context = "No specific rules found. Use general sales best practices."`
- **Impact:** Flow continues normally

### Step 5 (Groq Generation) fails:
- **Error:** Return HTTP 500
- **Impact:** User sees error, no prospects generated

---

## Logging

Mỗi step đều có logging chi tiết:

```
🤖 [PRIORITIZED PROSPECTS] Step 1: Asking Groq about required rules...
✅ [PRIORITIZED PROSPECTS] Step 1: Got rules query from Groq: ...
🔍 [PRIORITIZED PROSPECTS] Step 2: Searching Weaviate for relevant rules...
✅ [PRIORITIZED PROSPECTS] Step 2a: Vectorized rules query
✅ [PRIORITIZED PROSPECTS] Step 2: Found 5 relevant rules from Weaviate
📝 [PRIORITIZED PROSPECTS] Step 3: Creating final prompt with 5 rules...
🤖 [PRIORITIZED PROSPECTS] Step 4: Calling Groq API to generate prioritized prospects...
✅ [PRIORITIZED PROSPECTS] Step 4: Got response from Groq
```

---

## Security

- **User Isolation:** Tất cả queries đều filter theo `user_id`
  - Weaviate search: `Filter.by_property("user_id").equal(user_id)`
  - MongoDB queries: `{"user_id": current_user.id}`
  
- **Data Privacy:** 
  - Chỉ search trong rules của user hiện tại
  - Không thể truy cập rules của user khác

---

## Performance Considerations

1. **Step 2 (Groq Rules Query):**
   - Timeout: 30 seconds
   - Max tokens: 200 (nhanh)
   - Sample: Chỉ dùng 5 contacts đầu (giảm token)

2. **Step 3 (Weaviate Search):**
   - Limit: 5 results (nhanh)
   - Vector search: Optimized với index

3. **Step 5 (Groq Generation):**
   - Timeout: 60 seconds
   - Max tokens: 8000 (cho detailed output)
   - Batch processing: Xử lý nhiều contacts cùng lúc

---

## Dependencies

- **Groq API:** For AI analysis
- **Weaviate:** For RAG search (DataAiSaleCoach collection)
- **MongoDB:** For storing contacts, prospects
- **Vectorization Service:** `all-distilroberta-v1` model

---

## Example Flow Execution

### Input:
- 50 contacts với campaigns và deals
- User đã upload 3 PDF documents về sales strategies

### Execution:
1. **Step 1:** Lấy 50 contacts ✅
2. **Step 2:** Groq trả về: "Focus on B2B qualification rules, high-value deal engagement strategies, and follow-up timing guidelines" ✅
3. **Step 3:** Weaviate tìm được 5 chunks liên quan từ 3 PDFs ✅
4. **Step 4:** Combine rules + contacts ✅
5. **Step 5:** Groq gen 50 prioritized prospects với rules context ✅

### Output:
- 50 prioritized prospects với:
  - Actions based on rules từ knowledge base
  - Tips incorporating best practices từ documents
  - Personalized content using both contact data và rules

---

## Future Enhancements

1. **Caching:** Cache rules query results để giảm API calls
2. **Rule Ranking:** Weight rules theo relevance score
3. **Rule Context:** Include document metadata (filename, upload date)
4. **Multi-language:** Support rules in different languages
5. **Rule Updates:** Auto-refresh rules khi có documents mới
