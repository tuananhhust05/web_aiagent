# Workflow Data Structure Documentation

## Tổng quan
Hệ thống lưu trữ và quản lý workflow theo từng function (chức năng) trong database. Mỗi workflow bao gồm các nodes và connections với đầy đủ thông tin về loại đường kết nối (nét liền/nét đứt).

## Database Schema

### Collection: `workflows`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "function": "string",
  "name": "string (optional)",
  "description": "string (optional)",
  "nodes": [
    {
      "id": "string",
      "type": "string",
      "position": {
        "x": "number",
        "y": "number"
      },
      "data": {},
      "title": "string (optional)",
      "status": "idle | running | success | error"
    }
  ],
  "connections": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "sourceHandle": "string (optional)",
      "targetHandle": "string (optional)",
      "strokeType": "solid | dashed"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Chi tiết các trường

### Root Level
- **`_id`**: ObjectId tự động của MongoDB
- **`user_id`**: ID của user sở hữu workflow
- **`function`**: Tên function/chức năng (ví dụ: `convention-activities`, `csm`, `deals`, `upsell`, `renewals`)
- **`name`**: Tên workflow (tùy chọn)
- **`description`**: Mô tả workflow (tùy chọn)
- **`nodes`**: Mảng các node trong workflow
- **`connections`**: Mảng các kết nối giữa các node
- **`created_at`**: Thời gian tạo workflow
- **`updated_at`**: Thời gian cập nhật workflow lần cuối

### Node Structure
- **`id`**: ID duy nhất của node (timestamp-based)
- **`type`**: Loại node (`whatsapp`, `ai-call`, `linkedin`, `telegram`, `email`)
- **`position`**: Vị trí node trên canvas
  - **`x`**: Tọa độ X
  - **`y`**: Tọa độ Y
- **`data`**: Dữ liệu bổ sung cho node (object rỗng hoặc custom data)
- **`title`**: Tiêu đề hiển thị của node (tùy chọn)
- **`status`**: Trạng thái node (`idle`, `running`, `success`, `error`)

### Connection Structure
- **`id`**: ID duy nhất của connection (timestamp-based với prefix `conn_`)
- **`source`**: ID của node nguồn
- **`target`**: ID của node đích
- **`sourceHandle`**: Handle của node nguồn (thường là `output`)
- **`targetHandle`**: Handle của node đích (thường là `input`)
- **`strokeType`**: Loại đường kết nối
  - **`solid`**: Đường nét liền
  - **`dashed`**: Đường nét đứt

## Ví dụ dữ liệu

### Workflow cho Convention Activities

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user_id": "user_123",
  "function": "convention-activities",
  "name": "Convention Activities Workflow",
  "description": "Workflow for managing convention activities",
  "nodes": [
    {
      "id": "1699123456789",
      "type": "whatsapp",
      "position": {
        "x": 100,
        "y": 200
      },
      "data": {},
      "title": "WhatsApp",
      "status": "idle"
    },
    {
      "id": "1699123456790",
      "type": "ai-call",
      "position": {
        "x": 400,
        "y": 200
      },
      "data": {},
      "title": "AI Call",
      "status": "idle"
    },
    {
      "id": "1699123456791",
      "type": "email",
      "position": {
        "x": 700,
        "y": 200
      },
      "data": {},
      "title": "Email",
      "status": "idle"
    }
  ],
  "connections": [
    {
      "id": "conn_1699123456792",
      "source": "1699123456789",
      "target": "1699123456790",
      "sourceHandle": "output",
      "targetHandle": "input",
      "strokeType": "solid"
    },
    {
      "id": "conn_1699123456793",
      "source": "1699123456790",
      "target": "1699123456791",
      "sourceHandle": "output",
      "targetHandle": "input",
      "strokeType": "dashed"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:45:00Z"
}
```

## API Endpoints

### 1. Get Workflow
**GET** `/api/workflows?function={functionName}`

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user_123",
  "function": "convention-activities",
  "name": "Convention Activities Workflow",
  "description": "Workflow for managing convention activities",
  "nodes": [...],
  "connections": [...],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:45:00Z"
}
```

**Status Codes:**
- `200 OK`: Workflow found
- `404 Not Found`: Workflow không tồn tại (trả về `null`)

### 2. Create Workflow
**POST** `/api/workflows`

**Request Body:**
```json
{
  "function": "convention-activities",
  "name": "Convention Activities Workflow",
  "description": "Workflow for managing convention activities",
  "nodes": [...],
  "connections": [...]
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user_123",
  "function": "convention-activities",
  "name": "Convention Activities Workflow",
  "description": "Workflow for managing convention activities",
  "nodes": [...],
  "connections": [...],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201 Created`: Workflow created successfully
- `400 Bad Request`: Workflow đã tồn tại cho function này

### 3. Update Workflow (Upsert)
**PUT** `/api/workflows?function={functionName}`

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "nodes": [...],
  "connections": [...]
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user_123",
  "function": "convention-activities",
  "name": "Updated Workflow Name",
  "nodes": [...],
  "connections": [...],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:45:00Z"
}
```

**Status Codes:**
- `200 OK`: Workflow updated hoặc created successfully

### 4. Delete Workflow
**DELETE** `/api/workflows?function={functionName}`

**Status Codes:**
- `204 No Content`: Workflow deleted successfully
- `404 Not Found`: Workflow không tồn tại

## Luồng hoạt động

### 1. Load Workflow
1. User truy cập `/workflow-builder?function=convention-activities`
2. Frontend đọc query param `function`
3. Gọi API `GET /api/workflows?function=convention-activities`
4. Nếu có workflow, load nodes và connections vào canvas
5. Nếu không có, bắt đầu với canvas trống

### 2. Auto-Save Workflow
1. User thay đổi nodes hoặc connections (thêm, xóa, di chuyển, vẽ connection)
2. Frontend debounce 1 giây
3. Gọi API `PUT /api/workflows?function=convention-activities` với dữ liệu mới
4. Backend update hoặc create workflow
5. Frontend hiển thị trạng thái "Saving..." → "Saved"

### 3. Lưu trữ StrokeType
- Khi user vẽ connection mới, `strokeType` được lưu từ state `connectionStrokeType`
- Khi load workflow, `strokeType` được restore và hiển thị đúng loại đường (solid/dashed)
- Mỗi connection có thể có `strokeType` riêng

## Các function được hỗ trợ

- `convention-activities`: Convention Activities workflow
- `csm`: Customer Success Management workflow
- `deals`: Deals workflow
- `upsell`: Upsell workflow
- `renewals`: Renewals workflow
- (Có thể thêm các function khác trong tương lai)

## Lưu ý

1. **User Isolation**: Mỗi user chỉ thấy và chỉnh sửa workflow của chính mình
2. **Function Uniqueness**: Mỗi user chỉ có 1 workflow cho mỗi function
3. **Auto-Save**: Workflow được tự động lưu sau 1 giây không có thay đổi
4. **StrokeType Default**: Nếu connection không có `strokeType`, mặc định là `solid`
5. **Node ID Format**: Node ID sử dụng timestamp để đảm bảo unique
6. **Connection ID Format**: Connection ID có format `conn_{timestamp}`

