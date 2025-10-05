# Email Flow Documentation - AgentVoice

## Tổng quan
Hệ thống email của AgentVoice đã được triển khai hoàn chỉnh với tất cả các chức năng: tạo, đọc, cập nhật, xóa, gửi email, lưu lịch sử, tìm kiếm và thống kê.

## Cấu trúc Database

### Collection: `emails`
```json
{
  "_id": "ObjectId",
  "subject": "string",
  "content": "string", 
  "is_html": "boolean",
  "status": "draft|sending|sent|failed",
  "recipients": [
    {
      "email": "string",
      "name": "string",
      "contact_id": "string"
    }
  ],
  "attachments": [],
  "sent_count": "number",
  "failed_count": "number", 
  "total_recipients": "number",
  "created_by": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "sent_at": "datetime|null"
}
```

### Collection: `email_history`
```json
{
  "_id": "ObjectId",
  "email_id": "ObjectId",
  "action": "created|updated|sent|send_failed|send_exception|deleted",
  "status": "success|failed",
  "sent_count": "number",
  "failed_count": "number",
  "error": "string|null",
  "recipients": [],
  "email_subject": "string",
  "sent_at": "datetime",
  "created_by": "string"
}
```

## API Endpoints

### 1. Tạo Email
**POST** `/api/emails/`

**Request Body:**
```json
{
  "subject": "Welcome to AgentVoice",
  "content": "<h1>Welcome!</h1><p>Thank you for joining.</p>",
  "is_html": true,
  "recipients": [
    {
      "email": "user@example.com",
      "name": "User Name",
      "contact_id": "contact_123"
    }
  ],
  "group_ids": ["group_1", "group_2"],
  "contact_ids": ["contact_1", "contact_2"],
  "attachments": []
}
```

**Response:**
```json
{
  "id": "email_id",
  "subject": "Welcome to AgentVoice",
  "content": "<h1>Welcome!</h1><p>Thank you for joining.</p>",
  "is_html": true,
  "status": "draft",
  "recipients": [...],
  "attachments": [],
  "sent_count": 0,
  "failed_count": 0,
  "total_recipients": 1,
  "created_by": "user_id",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "sent_at": null
}
```

### 2. Lấy Danh sách Email
**GET** `/api/emails/listemails`

**Query Parameters:**
- `skip`: int (default: 0) - Số email bỏ qua
- `limit`: int (default: 50) - Số email tối đa trả về
- `status_filter`: string (optional) - Lọc theo trạng thái
- `search`: string (optional) - Tìm kiếm trong subject, content, recipients

**Response:**
```json
[
  {
    "id": "email_id",
    "subject": "Email Subject",
    "status": "sent",
    "total_recipients": 10,
    "sent_count": 10,
    "failed_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "sent_at": "2024-01-01T00:00:00Z"
  }
]
```

### 3. Lấy Email theo ID
**GET** `/api/emails/{email_id}`

**Response:** EmailResponse object

### 4. Cập nhật Email
**PUT** `/api/emails/{email_id}`

**Request Body:**
```json
{
  "subject": "Updated Subject",
  "content": "Updated content",
  "is_html": true,
  "status": "draft"
}
```

**Response:** EmailResponse object

### 5. Gửi Email
**POST** `/api/emails/{email_id}/send`

**Response:**
```json
{
  "success": true,
  "sent_count": 5,
  "failed_count": 0,
  "message": "Email sent successfully to 5 recipients"
}
```

### 6. Xóa Email
**DELETE** `/api/emails/{email_id}`

**Response:**
```json
{
  "message": "Email deleted successfully"
}
```

### 7. Tìm kiếm Email Nâng cao
**GET** `/api/emails/search`

**Query Parameters:**
- `q`: string - Từ khóa tìm kiếm
- `status_filter`: string (optional) - Lọc theo trạng thái
- `date_from`: string (optional) - Từ ngày (ISO format)
- `date_to`: string (optional) - Đến ngày (ISO format)
- `skip`: int (default: 0)
- `limit`: int (default: 50)

**Response:**
```json
{
  "emails": [...],
  "total": 100,
  "skip": 0,
  "limit": 50,
  "query": "search term"
}
```

### 8. Lịch sử Email
**GET** `/api/emails/history/{email_id}`

**Response:**
```json
{
  "email_id": "email_id",
  "email_subject": "Email Subject",
  "history": [
    {
      "id": "history_id",
      "email_id": "email_id",
      "action": "created",
      "status": "success",
      "sent_at": "2024-01-01T00:00:00Z",
      "created_by": "user_id"
    }
  ]
}
```

### 9. Tất cả Lịch sử Email
**GET** `/api/emails/history`

**Query Parameters:**
- `skip`: int (default: 0)
- `limit`: int (default: 50)

**Response:**
```json
{
  "history": [...],
  "total": 50,
  "skip": 0,
  "limit": 50
}
```

### 10. Thống kê Email
**GET** `/api/emails/stats/summary`

**Response:**
```json
{
  "total_emails": 100,
  "sent_emails": 80,
  "failed_emails": 5,
  "draft_emails": 15,
  "total_recipients": 1000,
  "successful_deliveries": 800,
  "failed_deliveries": 50
}
```

## Luồng Hoạt động

### 1. Tạo Email
1. User gửi POST request với thông tin email
2. Hệ thống lấy contacts từ groups và contact_ids
3. Loại bỏ duplicate recipients
4. Lưu email vào database với status "draft"
5. Lưu lịch sử "created" vào email_history
6. Trả về EmailResponse

### 2. Gửi Email
1. User gửi POST request đến `/send` endpoint
2. Hệ thống kiểm tra email tồn tại và chưa được gửi
3. Cập nhật status thành "sending"
4. Gọi email_service để gửi email thực tế
5. Cập nhật status và counts dựa trên kết quả
6. Lưu lịch sử gửi vào email_history
7. Trả về kết quả gửi

### 3. Lưu Lịch sử
Mọi thao tác đều được lưu vào `email_history`:
- **created**: Khi tạo email mới
- **updated**: Khi cập nhật email
- **sent**: Khi gửi email thành công
- **send_failed**: Khi gửi email thất bại
- **send_exception**: Khi có lỗi exception
- **deleted**: Khi xóa email

### 4. Tìm kiếm
Hỗ trợ tìm kiếm trong:
- Subject
- Content
- Recipients email
- Recipients name
- Lọc theo status
- Lọc theo khoảng thời gian

## Cấu hình SMTP

Cấu hình trong `backend/app/core/config.py`:
```python
SMTP_HOST: str = "smtp.gmail.com"
SMTP_PORT: int = 587
SMTP_SECURE: bool = False
SMTP_USER: str = "your-email@gmail.com"
SMTP_PASS: str = "your-app-password"
SMTP_FROM_EMAIL: str = "your-email@gmail.com"
SMTP_FROM_NAME: str = "Your Name"
```

## Bảo mật

- Tất cả endpoints yêu cầu authentication (JWT token)
- User chỉ có thể truy cập email của chính mình
- Email đã gửi không thể chỉnh sửa hoặc xóa
- Validation đầy đủ cho tất cả input

## Testing

Chạy script test:
```bash
python test_email_flow.py
```

Script sẽ test:
1. Health check
2. Tạo email
3. Lấy email theo ID
4. Cập nhật email
5. Danh sách email
6. Tìm kiếm email
7. Lịch sử email
8. Gửi email (optional)
9. Thống kê email
10. Xóa email (optional)

## Lỗi thường gặp

1. **Validation Error**: Kiểm tra tất cả required fields trong EmailResponse
2. **Authentication Error**: Đảm bảo JWT token hợp lệ
3. **SMTP Error**: Kiểm tra cấu hình SMTP và credentials
4. **Database Error**: Đảm bảo MongoDB đang chạy và kết nối được

## Mở rộng trong tương lai

1. **Template System**: Hỗ trợ email templates
2. **Scheduling**: Gửi email theo lịch
3. **Analytics**: Tracking mở email, click links
4. **Bulk Operations**: Gửi hàng loạt email
5. **Email Queue**: Xử lý email bất đồng bộ
6. **Attachments**: Hỗ trợ đính kèm file
