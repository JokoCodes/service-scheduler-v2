# API Services

This directory contains the backend API services for the Service Scheduler application, implementing a **Backend-for-Frontend (BFF)** architecture.

## 🏗️ Architecture Overview

We have two separate API services, each optimized for their specific client applications:

### Web API Service (`web-api/`)
- **Technology**: Next.js 14 App Router
- **Port**: 3001
- **Target Client**: Admin web dashboard
- **Optimization**: Rich data queries with joins, bulk operations, analytics

### Mobile API Service (`mobile-api/`)
- **Technology**: Fastify
- **Port**: 3002  
- **Target Client**: React Native employee app
- **Optimization**: Lightweight payloads, real-time features, mobile data efficiency

## 🚀 Quick Start

### Prerequisites
1. **Supabase Project**: Create a Supabase project at https://supabase.com
2. **Environment Variables**: Copy `.env.example` to `.env.local` in each service directory
3. **Shared Packages**: Ensure shared packages are built (`npm run build:packages` from root)

### Development

Start both services:
```bash
# From project root
npm run dev:web-api       # Starts web API on port 3001
npm run dev:mobile-api    # Starts mobile API on port 3002

# Or start both
npm run dev
```

### Individual Service Development

**Web API Service**:
```bash
cd services/web-api
npm run dev
```

**Mobile API Service**:
```bash
cd services/mobile-api
npm run dev
```

## 🔧 API Endpoints

### Web API Service (Port 3001)

**Authentication**:
- `POST /api/auth/login` - Admin/Employee login
- `POST /api/auth/refresh` - Refresh token

**Bookings (Admin Optimized)**:
- `GET /api/bookings` - List bookings with rich joins
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

**Bulk Operations**:
- `POST /api/bookings/bulk` - Bulk create/update
- `GET /api/bookings/export` - Export to CSV

**Analytics**:
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/analytics` - Business analytics

### Mobile API Service (Port 3002)

**Authentication**:
- `POST /api/auth/login` - Employee login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

**Jobs (Mobile Optimized)**:
- `GET /api/jobs/active` - Employee's active jobs (lightweight)
- `GET /api/jobs/:id` - Job details
- `POST /api/jobs/update` - Update job status with location/photos
- `POST /api/jobs/:id/photos` - Upload job photos

**Location Tracking**:
- `POST /api/location/update` - Update employee location

**Notifications**:
- `GET /api/notifications` - Get employee notifications  
- `PATCH /api/notifications/:id/read` - Mark as read

**Employee Profile**:
- `GET /api/employee/profile` - Employee profile

**WebSocket** (Real-time):
- `WS /ws` - Real-time job updates and notifications

## 🔐 Authentication

Both services support **dual authentication**:

1. **Supabase Auth**: Direct integration with Supabase authentication
2. **JWT Tokens**: Custom JWT tokens for additional flexibility

### Token Format
```json
{
  "id": "user_uuid",
  "email": "user@example.com", 
  "role": "admin|employee",
  "name": "User Name"
}
```

### Authentication Headers
```
Authorization: Bearer <token>
# or
Authorization: <token>
```

## 🗄️ Database Integration

Both services use the **shared database package** (`@service-scheduler/database`):

- **Supabase Client**: For authentication and real-time features
- **Drizzle ORM**: For type-safe database operations (optional)
- **Admin Client**: Service role for server-side operations

## 📱 Mobile-Specific Features

The Mobile API service includes optimizations specifically for React Native:

### Lightweight Payloads
- Minimal data transfer
- Pre-computed display values
- Optimized JSON structure

### Real-time Features
- WebSocket connections for live updates
- Push notification integration
- Location tracking

### File Upload
- Multipart file upload for photos
- Image optimization and compression
- Supabase Storage integration

### Offline Support
- Optimistic updates
- Sync capabilities
- Local caching strategies

## 🔍 Error Handling

Both services use consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["Validation error"]
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions  
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## 🧪 Testing

```bash
# Run tests for web API
cd services/web-api
npm test

# Run tests for mobile API  
cd services/mobile-api
npm test

# Or test all from root
npm run test --workspace=services/web-api
npm run test --workspace=services/mobile-api
```

## 📊 Performance Monitoring

### Web API Service
- Rich queries optimized for admin operations
- Bulk operation support
- Database connection pooling
- Response caching for analytics

### Mobile API Service  
- Lightweight response payloads
- Connection pooling for high concurrency
- Real-time WebSocket management
- File upload optimization

## 🚀 Production Deployment

### Recommended Hosting

**Web API Service**:
- Vercel (seamless Next.js deployment)
- Railway or Render
- DigitalOcean App Platform

**Mobile API Service**:
- Railway or Render (excellent Node.js support)
- DigitalOcean App Platform
- AWS ECS or Google Cloud Run

### Environment Variables

Each service requires specific environment variables. See the `.env.example` files in each service directory.

### Health Checks

Both services provide health check endpoints:
- Web API: `GET /api/health`
- Mobile API: `GET /health`

## 🔧 Development Tips

1. **Shared Types**: Always update shared types when changing API interfaces
2. **Database Changes**: Update both the database package and API services
3. **Testing**: Test with actual mobile devices for mobile API
4. **Performance**: Monitor query performance and optimize for your use case
5. **Security**: Never commit environment variables to version control

---

Built with ❤️ using Next.js 14, Fastify, TypeScript, and Supabase
