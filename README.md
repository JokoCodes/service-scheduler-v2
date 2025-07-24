# Service Scheduler V2

A modern service business management platform with separate backend services optimized for web admin dashboard and mobile employee applications.

## 🏗️ Architecture

This is a **Backend-for-Frontend (BFF)** architecture with separate API services:

- **Web API Service**: Optimized for admin dashboard with bulk operations and rich data
- **Mobile API Service**: Optimized for mobile with lightweight payloads and real-time features
- **Shared Packages**: Common types, database schemas, and utilities

## 📁 Project Structure

```
service-scheduler-v2/
├── apps/
│   ├── web/                 # Next.js admin dashboard
│   └── mobile/             # React Native employee app
├── services/
│   ├── web-api/            # Backend API for web dashboard
│   └── mobile-api/         # Backend API for mobile app
├── packages/
│   ├── shared-types/       # TypeScript type definitions
│   ├── database/           # Database schemas and migrations
│   └── utils/              # Shared utility functions
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Supabase account (for database and auth)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/service-scheduler-v2.git
cd service-scheduler-v2

# Install all dependencies
npm run install:all

# Build shared packages first
npm run build:packages
```

### Environment Setup

Create `.env.local` files in each service and app:

**Services (.env.local)**:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
```

**Web App (.env.local)**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_WEB_API_URL=http://localhost:3001
```

**Mobile App (.env.local)**:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_MOBILE_API_URL=http://localhost:3002
```

### Development

```bash
# Start all services in development mode
npm run dev

# Or start individually:
npm run dev:web         # Web dashboard
npm run dev:mobile      # Mobile app
npm run dev:web-api     # Web API service
npm run dev:mobile-api  # Mobile API service
npm run dev:packages    # Watch mode for shared packages
```

## 📦 Packages

### @service-scheduler/shared-types

Common TypeScript interfaces and types:

- Database schema types
- Business logic interfaces  
- API request/response types
- Common utility types and constants

```typescript
import { Booking, Employee, ApiResponse } from '@service-scheduler/shared-types'
```

### @service-scheduler/database

Database configuration and utilities:

- Supabase client setup
- Drizzle ORM schema definitions
- Migration utilities
- Database connection management

```typescript
import { createSupabaseClient, createDrizzleClient } from '@service-scheduler/database'
```

### @service-scheduler/utils

Shared utility functions:

- Date and time manipulation
- Data validation with Zod schemas
- Formatting functions
- Common helpers

```typescript
import { formatDate, validateAndTransform, formatCurrency } from '@service-scheduler/utils'
```

## 🔧 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start web dashboard and mobile API service |
| `npm run dev:web` | Start web dashboard only |
| `npm run dev:mobile` | Start mobile app only |
| `npm run dev:web-api` | Start web API service only |
| `npm run dev:mobile-api` | Start mobile API service only |
| `npm run dev:packages` | Watch mode for all packages |
| `npm run build` | Build all apps and services |
| `npm run build:packages` | Build shared packages only |
| `npm run lint` | Run ESLint on all workspaces |
| `npm run type-check` | TypeScript type checking |
| `npm run clean` | Clean all build artifacts |

## 🗄️ Database Schema

The application uses Supabase with the following main entities:

- **Users**: Authentication (managed by Supabase Auth)
- **Profiles**: User profile information  
- **Customers**: Customer information
- **Services**: Available services
- **Bookings**: Service appointments
- **Job Status Updates**: Mobile tracking data
- **Employee Availability**: Work schedules
- **Employee Locations**: Real-time GPS tracking
- **Notifications**: Push notifications

## 🔐 Authentication

- **Web Dashboard**: NextAuth.js with Supabase provider
- **Mobile App**: Supabase Auth with JWT tokens
- **API Services**: JWT middleware for protected routes

## 📱 Features

### Web Dashboard (Admin)
- Customer management with bulk operations
- Service scheduling with calendar view
- Employee management and performance analytics
- Revenue reporting and business insights
- Bulk booking operations

### Mobile App (Employees)
- Job assignment notifications
- Real-time GPS tracking
- Photo capture and customer signatures
- Offline capability with sync
- Push notifications

### API Services

**Web API**:
- Optimized for bulk operations
- Rich data with joins and aggregations
- CSV export capabilities
- Advanced filtering and search

**Mobile API**:
- Lightweight payloads
- Real-time features with WebSockets
- Push notification integration
- Optimized for mobile data usage

## 🚀 Deployment

### Recommended Hosting

- **Web Dashboard**: Vercel (seamless Next.js deployment)
- **Mobile App**: Expo EAS Build
- **API Services**: Railway, Render, or DigitalOcean App Platform
- **Database**: Supabase (managed PostgreSQL)

### Environment Variables

Each service requires specific environment variables. See the `.env.example` files in each directory.

## 🧪 Testing

```bash
# Run tests for all packages
npm run test

# Run tests for specific package
npm run test --workspace=packages/utils
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)  
- [Deployment Guide](./docs/deployment.md)
- [Development Guide](./docs/development.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Check the [documentation](./docs/) for detailed guides
- Join our Discord community for real-time support

---

Built with ❤️ using TypeScript, Next.js, React Native, and Supabase
