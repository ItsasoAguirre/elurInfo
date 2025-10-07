import { Database, setupDatabase } from '../utils/database'
import { logger } from '../utils/logger'
import { migrations, Migration } from './migrations'

interface MigrationRecord {
  version: number
  name: string
  applied_at: string
}

class MigrationRunner {
  private db: Database | null = null

  async initialize(): Promise<void> {
    this.db = await setupDatabase()
    await this.createMigrationsTable()
  }

  private async createMigrationsTable(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    if (!this.db) throw new Error('Database not initialized')

    return await this.db.all<MigrationRecord>(
      'SELECT version, name, applied_at FROM migrations ORDER BY version'
    )
  }

  async isVersionApplied(version: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM migrations WHERE version = ?',
      [version]
    )
    
    return (result?.count || 0) > 0
  }

  async recordMigration(migration: Migration): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.run(
      'INSERT INTO migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    )
  }

  async removeMigrationRecord(version: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.run(
      'DELETE FROM migrations WHERE version = ?',
      [version]
    )
  }

  async runMigrations(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    logger.info('Starting database migrations...')

    const appliedMigrations = await this.getAppliedMigrations()
    const appliedVersions = appliedMigrations.map(m => m.version)

    let migrationsRun = 0

    for (const migration of migrations) {
      if (!appliedVersions.includes(migration.version)) {
        logger.info(`Running migration ${migration.version}: ${migration.name}`)
        
        try {
          await migration.up(this.db!)
          await this.recordMigration(migration)
          migrationsRun++
          
          logger.info(`Migration ${migration.version} completed successfully`)
        } catch (error) {
          logger.error(`Migration ${migration.version} failed:`, error)
          throw error
        }
      } else {
        logger.debug(`Migration ${migration.version} already applied, skipping`)
      }
    }

    if (migrationsRun === 0) {
      logger.info('Database is up to date, no migrations needed')
    } else {
      logger.info(`Successfully applied ${migrationsRun} migration(s)`)
    }
  }

  async rollbackMigration(targetVersion?: number): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const appliedMigrations = await this.getAppliedMigrations()
    
    if (appliedMigrations.length === 0) {
      logger.info('No migrations to rollback')
      return
    }

    // Sort migrations in descending order for rollback
    const migrationsToRollback = appliedMigrations
      .filter(m => targetVersion === undefined || m.version > targetVersion)
      .sort((a, b) => b.version - a.version)

    if (migrationsToRollback.length === 0) {
      logger.info('No migrations to rollback')
      return
    }

    logger.info(`Rolling back ${migrationsToRollback.length} migration(s)`)

    for (const migrationRecord of migrationsToRollback) {
      const migration = migrations.find(m => m.version === migrationRecord.version)
      
      if (!migration) {
        logger.error(`Migration ${migrationRecord.version} not found in migrations list`)
        continue
      }

      logger.info(`Rolling back migration ${migration.version}: ${migration.name}`)
      
      try {
        await migration.down(this.db!)
        await this.removeMigrationRecord(migration.version)
        
        logger.info(`Migration ${migration.version} rolled back successfully`)
      } catch (error) {
        logger.error(`Rollback of migration ${migration.version} failed:`, error)
        throw error
      }
    }

    logger.info('Rollback completed successfully')
  }

  async getMigrationStatus(): Promise<{ applied: MigrationRecord[], pending: Migration[] }> {
    if (!this.db) {
      await this.initialize()
    }

    const appliedMigrations = await this.getAppliedMigrations()
    const appliedVersions = appliedMigrations.map(m => m.version)
    
    const pendingMigrations = migrations.filter(m => !appliedVersions.includes(m.version))

    return {
      applied: appliedMigrations,
      pending: pendingMigrations
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }
}

export const migrationRunner = new MigrationRunner()

// CLI functionality for running migrations standalone
if (require.main === module) {
  const command = process.argv[2]
  
  async function main() {
    try {
      switch (command) {
        case 'up':
          await migrationRunner.runMigrations()
          break
          
        case 'down':
          const targetVersion = process.argv[3] ? parseInt(process.argv[3]) : undefined
          await migrationRunner.rollbackMigration(targetVersion)
          break
          
        case 'status':
          const status = await migrationRunner.getMigrationStatus()
          console.log('\n=== Migration Status ===')
          console.log(`Applied migrations: ${status.applied.length}`)
          status.applied.forEach(m => {
            console.log(`  ✓ ${m.version}: ${m.name} (${m.applied_at})`)
          })
          console.log(`Pending migrations: ${status.pending.length}`)
          status.pending.forEach(m => {
            console.log(`  ○ ${m.version}: ${m.name}`)
          })
          break
          
        default:
          console.log('Usage:')
          console.log('  npm run migrate up     - Run pending migrations')
          console.log('  npm run migrate down   - Rollback last migration')
          console.log('  npm run migrate down N - Rollback to version N')
          console.log('  npm run migrate status - Show migration status')
      }
    } catch (error) {
      logger.error('Migration command failed:', error)
      process.exit(1)
    } finally {
      await migrationRunner.close()
    }
  }

  main()
}