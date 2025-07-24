# Database Setup Guide

## 🎯 Single Supabase Database for Both Apps

You only need **ONE** Supabase database that serves both the web dashboard and mobile app through their respective API services.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: `service-scheduler-v2`
3. Set a strong database password
4. Wait for the project to be provisioned

## Step 2: Get Database Credentials

From your Supabase project dashboard, get these values:

```env
# From Project Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# From Project Settings > Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

## Step 3: Configure Environment Variables

Create `.env.local` files in both API services:

### Web API Service (`services/web-api/.env.local`)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-for-web-api
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Mobile API Service (`services/mobile-api/.env.local`)
```env
PORT=3002
HOST=0.0.0.0
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-for-mobile-api
```

### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_WEB_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="Service Scheduler"
NODE_ENV=development
```

### Mobile App (`apps/mobile/.env.local`)
```env
EXPO_PUBLIC_MOBILE_API_URL=http://localhost:3002
EXPO_PUBLIC_APP_NAME="Service Scheduler"
```

## Step 4: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    position TEXT,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- minutes
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_employee_id UUID REFERENCES profiles(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    service_address TEXT NOT NULL,
    notes TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job status updates (mobile tracking)
CREATE TABLE job_status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL,
    notes TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    photos TEXT[], -- Array of photo URLs
    customer_signature TEXT, -- Base64 signature
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee availability
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee locations (real-time tracking)
CREATE TABLE employee_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- JSON data
    priority TEXT NOT NULL DEFAULT 'medium',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee skills
CREATE TABLE employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    skill TEXT NOT NULL,
    level TEXT, -- beginner, intermediate, advanced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 5: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;

-- Policies for profiles (users can see their own profile)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for bookings (employees can see assigned bookings, admins see all)
CREATE POLICY "Employees can view assigned bookings" ON bookings FOR SELECT 
USING (
    assigned_employee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND position = 'admin')
);

-- Add more policies as needed for your security requirements
```

## Step 6: Create Test Data

```sql
-- Insert sample services
INSERT INTO services (name, description, duration, price, category) VALUES
('House Cleaning', 'Complete house cleaning service', 120, 150.00, 'Cleaning'),
('Window Cleaning', 'Professional window cleaning', 60, 80.00, 'Cleaning'),
('Garden Maintenance', 'Lawn mowing and garden care', 90, 100.00, 'Gardening'),
('Deep Cleaning', 'Thorough deep cleaning service', 180, 250.00, 'Cleaning');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101', '123 Main St, Anytown, ST 12345'),
('Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0102', '456 Oak Ave, Anytown, ST 12346'),
('Mike Brown', 'mike.brown@email.com', '+1-555-0103', '789 Pine Rd, Anytown, ST 12347'),
('Lisa Davis', 'lisa.davis@email.com', '+1-555-0104', '321 Elm St, Anytown, ST 12348');
```

## Step 7: Create Admin User

1. In Supabase Dashboard, go to **Authentication > Users**
2. Click **"Add user"**
3. Create admin user:
   ```
   Email: admin@demo.com
   Password: admin123
   ```
4. After creating, run this SQL to add profile:

```sql
-- Replace 'user-uuid-here' with the actual UUID from auth.users
INSERT INTO profiles (id, name, position, is_active) VALUES
('user-uuid-here', 'Admin User', 'admin', true);
```

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables configured in all services
- [ ] Database tables created
- [ ] Row Level Security policies set up
- [ ] Test data inserted
- [ ] Admin user created

## 🚀 Next Steps

Once your database is set up:

1. **Start the API services**:
   ```bash
   npm run dev:web-api     # Port 3001
   npm run dev:mobile-api  # Port 3002
   ```

2. **Start the frontend apps**:
   ```bash
   npm run dev:web         # Port 3000
   npm run dev:mobile      # Expo dev tools
   ```

3. **Test the connection**:
   - Visit http://localhost:3000
   - Login with admin@demo.com / admin123
   - Check that the dashboard loads

Your single Supabase database will now serve both applications with optimized access patterns through their respective API services!
