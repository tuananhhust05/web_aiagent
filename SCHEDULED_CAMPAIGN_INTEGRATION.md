# Scheduled Campaign Integration với WhatsApp và Telegram

## Tổng quan
Tính năng scheduled campaign đã được tích hợp với WhatsApp và Telegram messaging, cho phép gửi tin nhắn tự động theo lịch trình đã định.

## Tính năng mới

### 1. Gửi tin nhắn WhatsApp
- Tự động gửi tin nhắn WhatsApp đến các contact có `whatsapp_number`
- Sử dụng cùng nội dung với `call_script` của campaign
- Logging chi tiết cho việc gửi tin nhắn

### 2. Gửi tin nhắn Telegram
- Tự động gửi tin nhắn Telegram đến các contact có `telegram_username`
- Sử dụng cùng nội dung với `call_script` của campaign
- Logging chi tiết cho việc gửi tin nhắn

### 3. Tích hợp với AI Calls
- Vẫn giữ nguyên chức năng gọi AI cho các contact có số điện thoại
- Kết hợp cả 3 phương thức: AI Call + WhatsApp + Telegram

## Cách hoạt động

### Scheduled Campaign Flow
1. **Scheduler kiểm tra** các campaign có `type: "scheduled"` và `status: "active"`
2. **Khi đến giờ** theo `schedule_settings`, scheduler sẽ:
   - Lấy danh sách contacts từ campaign
   - Với mỗi contact:
     - Gửi WhatsApp message (nếu có `whatsapp_number`)
     - Gửi Telegram message (nếu có `telegram_username`)
     - Thực hiện AI call (nếu có `phone`)

### Logging
Scheduler sẽ log chi tiết:
```
🚀 [CAMPAIGN] Starting Campaign: 'Campaign Name' (ID: xxx)
👥 [CAMPAIGN] Total Contacts: 5
📱 [WHATSAPP] Sending WhatsApp message to John Doe (+84 33 917 0155)
✅ [WHATSAPP] WhatsApp message sent to John Doe: {...}
📱 [TELEGRAM] Sending Telegram message to John Doe (@johndoe)
✅ [TELEGRAM] Telegram message sent to John Doe: {...}
🤖 [AI_CALL] Calling AI API for John Doe (+84 33 917 0155)
✅ [AI_CALL] AI call initiated for John Doe: {...}
📊 [CAMPAIGN] Summary: 1 calls made, 1 WhatsApp messages sent, 1 Telegram messages sent
```

## Cấu trúc dữ liệu

### Contact Schema
```json
{
  "_id": "ObjectId",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+84 33 917 0155",
  "whatsapp_number": "+84 33 917 0155",
  "telegram_username": "johndoe",
  "email": "john@example.com"
}
```

### Campaign Schema
```json
{
  "_id": "ObjectId",
  "name": "Scheduled Campaign",
  "type": "scheduled",
  "status": "active",
  "call_script": "Hello, this is a test message...",
  "contacts": ["ObjectId1", "ObjectId2"],
  "schedule_settings": {
    "frequency": "daily",
    "start_time": "2024-01-01T09:00:00",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

## API Endpoints

### WhatsApp Service
- **URL**: `http://3.106.56.62:8000/whatsapp/send`
- **Method**: POST
- **Payload**:
```json
{
  "phone_numbers": ["+84 33 917 0155"],
  "message": "Hello, this is a test message..."
}
```

### Telegram Service
- **URL**: `http://3.106.56.62:8000/telegram/send`
- **Method**: POST
- **Payload**:
```json
{
  "urls": ["https://web.telegram.org/k/#@johndoe"],
  "message": "Hello, this is a test message..."
}
```

## Testing

### Chạy test script
```bash
cd backend
python test_scheduled_integration.py
```

### Test thủ công
1. Tạo một scheduled campaign với contacts có WhatsApp/Telegram info
2. Set thời gian chạy trong tương lai gần
3. Monitor logs để xem kết quả

## Lưu ý quan trọng

### 1. Contact Data
- Contact phải có `whatsapp_number` để nhận WhatsApp message
- Contact phải có `telegram_username` để nhận Telegram message
- Contact phải có `phone` để nhận AI call

### 2. Error Handling
- Nếu WhatsApp/Telegram API lỗi, campaign vẫn tiếp tục với các contact khác
- Tất cả lỗi được log chi tiết để debug
- AI calls vẫn hoạt động bình thường nếu messaging services lỗi

### 3. Performance
- Tất cả operations đều async để không block scheduler
- Timeout 30 giây cho mỗi API call
- Logging chi tiết để monitor performance

## Troubleshooting

### Common Issues
1. **WhatsApp/Telegram API không hoạt động**
   - Kiểm tra network connection
   - Verify API endpoints
   - Check API credentials

2. **Contact không nhận được tin nhắn**
   - Verify contact có đúng `whatsapp_number`/`telegram_username`
   - Check message content
   - Review API response logs

3. **Scheduler không chạy**
   - Check campaign `status` = "active"
   - Verify `schedule_settings` format
   - Check scheduler logs

### Debug Commands
```bash
# Check scheduler status
tail -f logs/scheduler.log

# Test services individually
python -c "import asyncio; from app.services.whatsapp_service import whatsapp_service; asyncio.run(whatsapp_service.test_connection())"
python -c "import asyncio; from app.services.telegram_service import telegram_service; asyncio.run(telegram_service.test_connection())"
```

## Kết luận
Tính năng scheduled campaign đã được tích hợp hoàn chỉnh với WhatsApp và Telegram messaging. Hệ thống sẽ tự động gửi tin nhắn theo lịch trình đã định, kết hợp với AI calls để tối đa hóa hiệu quả marketing.















