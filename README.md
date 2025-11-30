# AgentVoice - AI Voice Agent Platform

A comprehensive voice AI agent platform with authentication, contact management, and CRM integration.

## Features

### Milestone 5 - Authentication & Onboarding
- ✅ User registration and login
- ✅ Multi-step onboarding wizard
- ✅ Industry and tone selection
- ✅ GDPR consent and terms acceptance
- ✅ Password reset functionality
- ✅ User profile management

### Milestone 6 - Contact Management & CRM Integration
- ✅ Contact CRUD operations
- ✅ CSV import/export functionality
- ✅ Contact filtering and search
- ✅ CRM integration (HubSpot, Salesforce, Pipedrive)
- ✅ Contact synchronization
- ✅ Bulk operations

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - Authentication with python-jose
- **Pydantic** - Data validation and serialization
- **Docker** - Containerization

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icon library

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

#### Production Mode
1. Clone the repository:
```bash
git clone <repository-url>
cd agentvoice
```

2. Start production services:
```bash
# Option 1: Using script
chmod +x scripts/start-prod.sh
./scripts/start-prod.sh

# Option 2: Direct command
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:5173 (Production)
- Backend API: http://localhost:5173:8000
- API Documentation: http://localhost:5173:8000/docs

#### Development Mode
1. Start development services:
```bash
# Option 1: Using script
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh

# Option 2: Direct command
docker-compose -f docker-compose.dev.yml up -d
```

2. Access the application:
- Frontend: http://localhost:5173 (Development with hot reload)
- Backend API: http://localhost:5173:8000
- API Documentation: http://localhost:5173:8000/docs

### Local Development

1. Start MongoDB:
```bash
docker-compose up mongodb -d
```

2. Backend development:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Frontend development:
```bash
cd frontend
npm install
npm run dev
```

### Production Build

1. Build frontend for production:
```bash
cd frontend
npm run build:prod
```

2. Or use the build script:
```bash
cd frontend
chmod +x scripts/build-prod.sh
./scripts/build-prod.sh
```

3. Start production services:
```bash
docker-compose up -d
```

The production build includes:
- ✅ Code splitting and lazy loading
- ✅ Tree shaking and dead code elimination
- ✅ Vite preview server for production
- ✅ Optimized static assets
- ✅ Performance optimizations
- ✅ Production-only dependencies

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/accept-terms` - Accept terms of service
- `POST /api/auth/gdpr-consent` - GDPR consent

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `DELETE /api/users/me` - Delete account

### Contacts
- `GET /api/contacts` - List contacts with filtering
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/{id}` - Get contact details
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact
- `POST /api/contacts/import/csv` - Import contacts from CSV
- `POST /api/contacts/bulk-update` - Bulk update contacts
- `GET /api/contacts/stats/summary` - Contact statistics

### CRM Integration
- `GET /api/crm/providers` - List available CRM providers
- `GET /api/crm/connections` - Get user's CRM connections
- `POST /api/crm/connect/{provider}` - Connect to CRM
- `DELETE /api/crm/disconnect/{provider}` - Disconnect from CRM
- `POST /api/crm/sync/{provider}` - Sync contacts from CRM
- `POST /api/crm/export/{provider}` - Export contacts to CRM

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  first_name: String,
  last_name: String,
  company_name: String,
  industry: String,
  tone: String,
  language: String,
  phone: String,
  hashed_password: String,
  role: String,
  is_active: Boolean,
  is_verified: Boolean,
  gdpr_consent: Boolean,
  terms_accepted: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Contacts Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  company: String,
  job_title: String,
  status: String,
  source: String,
  notes: String,
  tags: Array,
  custom_fields: Object,
  created_at: Date,
  updated_at: Date,
  last_contacted: Date,
  crm_id: String,
  crm_source: String
}
```

### CRM Integrations Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  provider: String,
  credentials: Object,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

## Environment Variables

### Backend (.env)
```env
MONGODB_URL=mongodb://admin:password123@localhost:27017/agentvoice?authSource=admin
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:5173:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5173:8000
```

## Development

### Adding New Features

1. **Backend**: Add new models in `app/models/`, routes in `app/routers/`
2. **Frontend**: Add new pages in `src/pages/`, components in `src/components/`
3. **API**: Update `src/lib/api.ts` with new endpoints
4. **Types**: Add TypeScript interfaces as needed

### Code Style

- Backend: Follow PEP 8 with Black formatter
- Frontend: Use Prettier and ESLint
- Commits: Use conventional commits

## Deployment

### Production Setup

1. Update environment variables for production
2. Set up MongoDB Atlas or self-hosted MongoDB
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure monitoring and logging

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue on GitHub. 