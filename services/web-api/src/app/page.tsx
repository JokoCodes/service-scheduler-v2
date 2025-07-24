import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/database'

export default async function HomePage() {
  const dbHealthy = await checkDatabaseHealth()
  
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Service Scheduler Web API</h1>
      <p>Backend API service optimized for admin dashboard operations</p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h2>API Status</h2>
        <ul>
          <li>Service: <span style={{ color: 'green' }}>✅ Running</span></li>
          <li>Database: <span style={{ color: dbHealthy ? 'green' : 'red' }}>
            {dbHealthy ? '✅ Connected' : '❌ Connection Failed'}
          </span></li>
          <li>Port: 3001</li>
          <li>Environment: {process.env.NODE_ENV}</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Available Endpoints</h2>
        <ul>
          <li><code>POST /api/auth/login</code> - Admin/Employee authentication</li>
          <li><code>POST /api/auth/refresh</code> - Token refresh</li>
          <li><code>GET /api/bookings</code> - List bookings (with rich joins)</li>
          <li><code>POST /api/bookings</code> - Create new booking</li>
          <li><code>GET /api/employees</code> - List employees</li>
          <li><code>GET /api/customers</code> - List customers</li>
          <li><code>GET /api/services</code> - List services</li>
          <li><code>GET /api/dashboard</code> - Dashboard analytics</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Features</h2>
        <ul>
          <li>🔐 JWT & Supabase authentication</li>
          <li>📊 Rich data queries with joins</li>
          <li>📄 Bulk operations support</li>
          <li>📈 Analytics and reporting</li>
          <li>🔍 Advanced filtering and search</li>
          <li>📱 CORS enabled for web client</li>
        </ul>
      </div>

      <footer style={{ 
        marginTop: '3rem', 
        padding: '1rem 0', 
        borderTop: '1px solid #ddd',
        color: '#666'
      }}>
        <p>Service Scheduler V2 - Web API Service</p>
        <p>Built with Next.js 14, Supabase, and TypeScript</p>
      </footer>
    </div>
  )
}
