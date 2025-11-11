# Deals API Setup Guide

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test API Endpoints
```bash
# Test basic endpoints
curl http://localhost:8000/
curl http://localhost:8000/health

# Test deals endpoints (will return 401 without auth)
curl http://localhost:8000/api/deals
curl http://localhost:8000/api/deals/stats
```

### 3. Initialize Database Collection
```bash
cd backend
python init_deals_collection.py
```

## 🔧 Troubleshooting

### If you get "Not Found" error:

1. **Check if server is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check if deals routes are registered:**
   ```bash
   cd backend
   python check_routes.py
   ```

3. **Test API endpoints:**
   ```bash
   cd backend
   python simple_test.py
   ```

4. **Start server and test:**
   ```bash
   cd backend
   python start_and_test.py
   ```

## 📋 API Endpoints

### Deals Management
- `GET /api/deals` - List deals with pagination and filtering
- `GET /api/deals/{id}` - Get specific deal
- `POST /api/deals` - Create new deal
- `PUT /api/deals/{id}` - Update deal
- `DELETE /api/deals/{id}` - Delete deal
- `GET /api/deals/stats` - Get deal statistics

### Helper Endpoints
- `GET /api/deals/contacts/list` - Get contacts for deal creation
- `GET /api/deals/campaigns/list` - Get campaigns for deal creation

## 🔐 Authentication

All deals endpoints require authentication. You need to:
1. Register/Login to get access token
2. Include token in Authorization header: `Bearer <token>`

## 📊 Database

The deals collection will be created automatically when you:
1. Start the server
2. Make your first API call
3. Or run the initialization script

## 🎯 Expected Response

### Without Authentication (401):
```json
{
  "detail": "Not authenticated"
}
```

### With Authentication (200):
```json
{
  "deals": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "stats": {
    "total_deals": 0,
    "new_deals": 0,
    "contacted_deals": 0,
    "negotiation_deals": 0,
    "total_revenue": 0.0,
    "total_cost": 0.0,
    "total_profit": 0.0
  }
}
```

## 🚨 Common Issues

1. **"Not Found" Error**: Server not running or routes not registered
2. **"Connection Refused"**: Server not started
3. **"401 Unauthorized"**: Normal response without authentication
4. **"500 Internal Server Error"**: Database connection issue

## ✅ Success Indicators

- Server starts without errors
- `/health` endpoint returns `{"status": "healthy"}`
- `/api/deals` returns 401 (not 404)
- API docs available at `http://localhost:8000/docs`











