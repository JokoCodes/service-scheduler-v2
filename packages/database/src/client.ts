import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Supabase client for authentication and real-time features
export const createSupabaseClient = (url: string, anonKey: string) => {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

// Drizzle client for direct database operations (server-side only)
export const createDrizzleClient = (connectionString: string) => {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  })
  
  return drizzle(client)
}

// Database configuration interface
export interface DatabaseConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey?: string
  connectionString?: string
}

// Environment-specific configurations
export const getDatabaseConfig = (): DatabaseConfig => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const connectionString = process.env.DATABASE_URL

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    connectionString
  }
}

// Helper function to create admin client (server-side only)
export const createAdminClient = (config: DatabaseConfig) => {
  if (!config.supabaseServiceRoleKey) {
    throw new Error('Service role key required for admin operations')
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
