#!/usr/bin/env tsx

import { createSupabaseClient, getDatabaseConfig } from '../client'
import fs from 'fs'
import path from 'path'

async function runMigration(migrationFile: string) {
  console.log(`🚀 Running migration: ${migrationFile}`)
  
  try {
    // Get database configuration
    const config = getDatabaseConfig()
    
    if (!config.supabaseServiceRoleKey) {
      throw new Error('SERVICE_ROLE_KEY is required for migrations')
    }
    
    // Create admin client for migrations
    const supabase = createSupabaseClient(config.supabaseUrl, config.supabaseServiceRoleKey)
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'database-migrations', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log(`📄 Executing SQL from: ${migrationPath}`)
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
    
    console.log('✅ Migration completed successfully!')
    
    if (data) {
      console.log('📊 Migration output:', data)
    }
    
  } catch (error) {
    console.error('💥 Migration error:', error)
    process.exit(1)
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Please provide a migration file name')
  console.log('Usage: npm run migrate -- 002_staff_management.sql')
  process.exit(1)
}

runMigration(migrationFile)
