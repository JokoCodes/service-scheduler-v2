const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './services/web-api/.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  // SQL from DATABASE_SETUP.md
  const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS services (
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
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE TABLE IF NOT EXISTS job_status_updates (
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
CREATE TABLE IF NOT EXISTS employee_availability (
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
CREATE TABLE IF NOT EXISTS employee_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id),
    skill TEXT NOT NULL,
    level TEXT, -- beginner, intermediate, advanced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

  try {
    console.log('Creating tables...');
    
    // Create tables using the Supabase SQL editor approach
    // Note: User needs to run this SQL manually in Supabase SQL Editor
    console.log('⚠️  Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(setupSQL);
    console.log('='.repeat(60) + '\n');
    
    // Check if tables exist by trying to query them
    const { data: servicesCheck } = await supabase.from('services').select('*').limit(1);
    const { data: profilesCheck } = await supabase.from('profiles').select('*').limit(1);
    
    if (!servicesCheck && !profilesCheck) {
      console.log('❌ Tables do not exist. Please run the SQL above in Supabase SQL Editor first.');
      return;
    }
    
    console.log('✅ Tables exist, proceeding with sample data...');
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    const { error: servicesError } = await supabase.from('services').insert([
      { name: 'House Cleaning', description: 'Complete house cleaning service', duration: 120, price: 150.00, category: 'Cleaning' },
      { name: 'Window Cleaning', description: 'Professional window cleaning', duration: 60, price: 80.00, category: 'Cleaning' },
      { name: 'Garden Maintenance', description: 'Lawn mowing and garden care', duration: 90, price: 100.00, category: 'Gardening' },
      { name: 'Deep Cleaning', description: 'Thorough deep cleaning service', duration: 180, price: 250.00, category: 'Cleaning' }
    ]);
    
    if (servicesError) {
      console.error('❌ Error inserting services:', servicesError.message);
    } else {
      console.log('✅ Services inserted');
    }
    
    const { error: customersError } = await supabase.from('customers').insert([
      { name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-0101', address: '123 Main St, Anytown, ST 12345' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '+1-555-0102', address: '456 Oak Ave, Anytown, ST 12346' },
      { name: 'Mike Brown', email: 'mike.brown@email.com', phone: '+1-555-0103', address: '789 Pine Rd, Anytown, ST 12347' },
      { name: 'Lisa Davis', email: 'lisa.davis@email.com', phone: '+1-555-0104', address: '321 Elm St, Anytown, ST 12348' }
    ]);
    
    if (customersError) {
      console.error('❌ Error inserting customers:', customersError.message);
    } else {
      console.log('✅ Customers inserted');
    }
    
    console.log('🎉 Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Supabase Dashboard → Authentication → Users');
    console.log('2. Create a user with email: admin@demo.com, password: admin123');
    console.log('3. Run the following SQL to create the admin profile:');
    console.log('');
    console.log('INSERT INTO profiles (id, name, position, is_active) VALUES');
    console.log("('[USER_UUID_FROM_AUTH_USERS]', 'Admin User', 'admin', true);");
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupDatabase();
