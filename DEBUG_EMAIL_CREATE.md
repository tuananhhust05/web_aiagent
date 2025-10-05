# Debug Guide: Email Create Page - Contact Selection Issue

## Vấn đề
Trên trang `/emails/create`, khi chọn contact để gửi email, không có gì xảy ra.

## Các cải tiến đã thực hiện

### 1. ✅ Cải thiện UI/UX
- Thêm visual feedback khi chọn contact (highlight màu xanh)
- Hiển thị trạng thái "✓ Selected" cho contact đã chọn
- Thêm toast notification khi thêm/xóa contact
- Hiển thị số lượng contacts/groups available
- Thêm empty state khi không có contacts/groups

### 2. ✅ Thêm Debug Logging
- Console logs để track việc load contacts/groups
- Console logs để track việc chọn contact
- Error handling với toast notifications

### 3. ✅ Cải thiện Error Handling
- Toast error khi load contacts/groups thất bại
- Toast error khi contact đã được chọn
- Toast success khi thêm contact thành công

## Cách Debug

### Bước 1: Kiểm tra Console Logs
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Reload trang `/emails/create`
4. Kiểm tra các logs:
   ```
   🔄 Loading contacts...
   📧 Contacts response: {...}
   👥 Loaded contacts: X [...]
   🔄 Loading groups...
   📧 Groups response: {...}
   👥 Loaded groups: X [...]
   ```

### Bước 2: Kiểm tra API Response
1. Vào tab Network trong Developer Tools
2. Reload trang
3. Tìm requests đến `/api/contacts` và `/api/groups`
4. Kiểm tra response status và data

### Bước 3: Test API trực tiếp
Chạy script test:
```bash
python test_contacts_api.py
```

### Bước 4: Kiểm tra Contact Selection
1. Click "Add Contacts" button
2. Kiểm tra console logs khi click vào contact:
   ```
   ➕ Adding contact: {...}
   📋 Current selected contacts: [...]
   ✅ New selected contacts: [...]
   ```

## Các vấn đề có thể xảy ra

### 1. API không trả về data
**Triệu chứng:** Console log "👥 Loaded contacts: 0 []"
**Giải pháp:** 
- Kiểm tra backend có chạy không
- Kiểm tra database có contacts không
- Kiểm tra authentication

### 2. API trả về lỗi
**Triệu chứng:** Console log "❌ Error loading contacts"
**Giải pháp:**
- Kiểm tra network tab để xem error response
- Kiểm tra authentication token
- Kiểm tra CORS settings

### 3. Contact selection không hoạt động
**Triệu chứng:** Click contact không có console log
**Giải pháp:**
- Kiểm tra click event handler
- Kiểm tra contact data structure
- Kiểm tra React state updates

### 4. UI không update
**Triệu chứng:** Console log có nhưng UI không thay đổi
**Giải pháp:**
- Kiểm tra React state
- Kiểm tra component re-render
- Kiểm tra CSS/styling issues

## Cấu trúc Data Expected

### Contact Object
```json
{
  "_id": "contact_id",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

### API Response
```json
{
  "data": [
    {
      "_id": "contact_id",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

## Test Cases

### 1. No Contacts
- Tạo contacts trong database
- Hoặc mock data trong API

### 2. API Error
- Disconnect backend
- Check error handling

### 3. Authentication
- Check JWT token
- Check API headers

### 4. Network Issues
- Check CORS
- Check network connectivity

## Next Steps

1. **Kiểm tra Console Logs** - Xem có logs nào không
2. **Kiểm tra Network Tab** - Xem API calls có thành công không
3. **Kiểm tra Database** - Xem có contacts trong database không
4. **Test API trực tiếp** - Dùng script test_contacts_api.py

## Liên hệ
Nếu vẫn có vấn đề, hãy cung cấp:
- Console logs
- Network tab screenshots
- API response data
- Browser console errors
