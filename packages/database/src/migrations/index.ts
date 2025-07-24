// Migration utilities and helpers

export interface Migration {
  id: string
  name: string
  up: () => Promise<void>
  down: () => Promise<void>
  createdAt: Date
}

export class MigrationRunner {
  private migrations: Migration[] = []

  addMigration(migration: Migration) {
    this.migrations.push(migration)
    this.migrations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async runMigrations() {
    console.log(`Running ${this.migrations.length} migrations...`)
    
    for (const migration of this.migrations) {
      try {
        console.log(`Running migration: ${migration.name}`)
        await migration.up()
        console.log(`✅ Migration ${migration.name} completed`)
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error)
        throw error
      }
    }
    
    console.log('All migrations completed successfully!')
  }

  async rollbackMigration(migrationId: string) {
    const migration = this.migrations.find(m => m.id === migrationId)
    
    if (!migration) {
      throw new Error(`Migration with ID ${migrationId} not found`)
    }

    try {
      console.log(`Rolling back migration: ${migration.name}`)
      await migration.down()
      console.log(`✅ Migration ${migration.name} rolled back`)
    } catch (error) {
      console.error(`❌ Rollback failed for ${migration.name}:`, error)
      throw error
    }
  }
}

export const migrationRunner = new MigrationRunner()
