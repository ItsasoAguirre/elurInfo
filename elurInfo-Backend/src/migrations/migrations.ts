import { Database } from '../utils/database'
import { logger } from '../utils/logger'

export interface Migration {
  version: number
  name: string
  up: (db: Database) => Promise<void>
  down: (db: Database) => Promise<void>
}

// Migration 001: Initial tables
export const migration001: Migration = {
  version: 1,
  name: 'initial_tables',
  up: async (db: Database) => {
    logger.info('Running migration 001: Creating initial tables')

    // Create avalanche reports table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS avalanche_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone TEXT NOT NULL,
        risk_level INTEGER CHECK(risk_level >= 1 AND risk_level <= 5),
        description TEXT,
        source_url TEXT,
        last_update DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create mountain forecasts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mountain_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone TEXT NOT NULL,
        forecast_json TEXT NOT NULL,
        valid_date DATE NOT NULL,
        last_update DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create municipal forecasts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS municipal_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        municipality_id TEXT NOT NULL,
        municipality_name TEXT,
        forecast_json TEXT NOT NULL,
        valid_date DATE NOT NULL,
        last_update DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create API cache table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        params TEXT,
        response_json TEXT NOT NULL,
        last_update DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(endpoint, params)
      )
    `)

    logger.info('Migration 001 completed successfully')
  },

  down: async (db: Database) => {
    logger.info('Rolling back migration 001')
    
    await db.exec('DROP TABLE IF EXISTS api_cache')
    await db.exec('DROP TABLE IF EXISTS municipal_forecasts')
    await db.exec('DROP TABLE IF EXISTS mountain_forecasts')
    await db.exec('DROP TABLE IF EXISTS avalanche_reports')
    
    logger.info('Migration 001 rollback completed')
  }
}

// Migration 002: Add indexes for performance
export const migration002: Migration = {
  version: 2,
  name: 'add_indexes',
  up: async (db: Database) => {
    logger.info('Running migration 002: Adding indexes')

    // Indexes for avalanche_reports
    await db.exec('CREATE INDEX IF NOT EXISTS idx_avalanche_reports_zone ON avalanche_reports(zone)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_avalanche_reports_last_update ON avalanche_reports(last_update)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_avalanche_reports_risk_level ON avalanche_reports(risk_level)')

    // Indexes for mountain_forecasts
    await db.exec('CREATE INDEX IF NOT EXISTS idx_mountain_forecasts_zone ON mountain_forecasts(zone)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_mountain_forecasts_valid_date ON mountain_forecasts(valid_date)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_mountain_forecasts_last_update ON mountain_forecasts(last_update)')

    // Indexes for municipal_forecasts
    await db.exec('CREATE INDEX IF NOT EXISTS idx_municipal_forecasts_municipality_id ON municipal_forecasts(municipality_id)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_municipal_forecasts_valid_date ON municipal_forecasts(valid_date)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_municipal_forecasts_last_update ON municipal_forecasts(last_update)')

    // Indexes for api_cache
    await db.exec('CREATE INDEX IF NOT EXISTS idx_api_cache_endpoint ON api_cache(endpoint)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_api_cache_last_update ON api_cache(last_update)')

    logger.info('Migration 002 completed successfully')
  },

  down: async (db: Database) => {
    logger.info('Rolling back migration 002')
    
    // Drop indexes
    await db.exec('DROP INDEX IF EXISTS idx_avalanche_reports_zone')
    await db.exec('DROP INDEX IF EXISTS idx_avalanche_reports_last_update')
    await db.exec('DROP INDEX IF EXISTS idx_avalanche_reports_risk_level')
    await db.exec('DROP INDEX IF EXISTS idx_mountain_forecasts_zone')
    await db.exec('DROP INDEX IF EXISTS idx_mountain_forecasts_valid_date')
    await db.exec('DROP INDEX IF EXISTS idx_mountain_forecasts_last_update')
    await db.exec('DROP INDEX IF EXISTS idx_municipal_forecasts_municipality_id')
    await db.exec('DROP INDEX IF EXISTS idx_municipal_forecasts_valid_date')
    await db.exec('DROP INDEX IF EXISTS idx_municipal_forecasts_last_update')
    await db.exec('DROP INDEX IF EXISTS idx_api_cache_endpoint')
    await db.exec('DROP INDEX IF EXISTS idx_api_cache_expires_at')
    await db.exec('DROP INDEX IF EXISTS idx_api_cache_last_update')
    
    logger.info('Migration 002 rollback completed')
  }
}

// Migration 003: Add update triggers
export const migration003: Migration = {
  version: 3,
  name: 'add_update_triggers',
  up: async (db: Database) => {
    logger.info('Running migration 003: Adding update triggers')

    // Trigger for avalanche_reports
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_avalanche_reports_updated_at
      AFTER UPDATE ON avalanche_reports
      BEGIN
        UPDATE avalanche_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `)

    // Trigger for mountain_forecasts
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_mountain_forecasts_updated_at
      AFTER UPDATE ON mountain_forecasts
      BEGIN
        UPDATE mountain_forecasts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `)

    // Trigger for municipal_forecasts
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_municipal_forecasts_updated_at
      AFTER UPDATE ON municipal_forecasts
      BEGIN
        UPDATE municipal_forecasts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `)

    logger.info('Migration 003 completed successfully')
  },

  down: async (db: Database) => {
    logger.info('Rolling back migration 003')
    
    await db.exec('DROP TRIGGER IF EXISTS trigger_avalanche_reports_updated_at')
    await db.exec('DROP TRIGGER IF EXISTS trigger_mountain_forecasts_updated_at')
    await db.exec('DROP TRIGGER IF EXISTS trigger_municipal_forecasts_updated_at')
    
    logger.info('Migration 003 rollback completed')
  }
}

// List of all migrations in order
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003
]