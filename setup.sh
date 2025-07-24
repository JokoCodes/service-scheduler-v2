#!/bin/bash

echo "🚀 Service Scheduler V2 - Setup Script"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build shared packages
echo ""
echo "🔨 Building shared packages..."
npm run build:packages

# Check for environment files
echo ""
echo "🔧 Checking environment configuration..."

missing_env=false

if [ ! -f "services/web-api/.env.local" ]; then
    echo "⚠️  Missing: services/web-api/.env.local"
    echo "   Copy from services/web-api/.env.example and configure with your Supabase credentials"
    missing_env=true
fi

if [ ! -f "services/mobile-api/.env.local" ]; then
    echo "⚠️  Missing: services/mobile-api/.env.local"
    echo "   Copy from services/mobile-api/.env.example and configure with your Supabase credentials"
    missing_env=true
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  Missing: apps/web/.env.local"
    echo "   Copy from apps/web/.env.example and configure"
    missing_env=true
fi

if [ ! -f "apps/mobile/.env.local" ]; then
    echo "⚠️  Missing: apps/mobile/.env.local"
    echo "   Copy from apps/mobile/.env.example and configure"
    missing_env=true
fi

if [ "$missing_env" = true ]; then
    echo ""
    echo "⚠️  Environment files missing!"
    echo "Please follow the DATABASE_SETUP.md guide to configure your environment."
    echo ""
    echo "Quick setup:"
    echo "1. Create a Supabase project at https://supabase.com"
    echo "2. Copy .env.example to .env.local in each service/app directory"
    echo "3. Update the .env.local files with your Supabase credentials"
    echo "4. Run the SQL scripts in DATABASE_SETUP.md to create tables"
    echo "5. Run this setup script again"
else
    echo "✅ All environment files found"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Follow DATABASE_SETUP.md to configure your Supabase database"
echo "2. Start the development servers:"
echo "   npm run dev:web-api      # Web API (Port 3001)"
echo "   npm run dev:mobile-api   # Mobile API (Port 3002)"
echo "   npm run dev:web          # Web Dashboard (Port 3000)"
echo "   npm run dev:mobile       # Mobile App (Expo)"
echo ""
echo "🔗 Useful URLs:"
echo "   Web Dashboard: http://localhost:3000"
echo "   Web API: http://localhost:3001"
echo "   Mobile API: http://localhost:3002"
echo ""
echo "🎯 Demo Login: admin@demo.com / admin123"
echo ""
echo "Happy coding! 🚀"
