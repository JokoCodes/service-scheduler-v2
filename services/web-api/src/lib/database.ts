import { createSupabaseClient, createDrizzleClient, getDatabaseConfig } from '@service-scheduler/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Database configuration
const config = getDatabaseConfig()

// Supabase client (for auth and real-time features)
export const supabase = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey)

// Admin Supabase client (for server-side operations)
let adminClient: SupabaseClient | null = null

export const getAdminClient = () => {
  if (!adminClient) {
    if (!config.supabaseServiceRoleKey) {
      throw new Error('Service role key required for admin operations')
    }
    adminClient = createSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  }
  return adminClient
}

// Drizzle client (for direct database operations)
let drizzleClient: ReturnType<typeof createDrizzleClient> | null = null

export const getDrizzleClient = () => {
  if (!drizzleClient) {
    if (!config.connectionString) {
      throw new Error('Database connection string required for direct database operations')
    }
    drizzleClient = createDrizzleClient(config.connectionString)
  }
  return drizzleClient
}

// Export database client for direct queries
export const database = getDrizzleClient()

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    return !error
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
