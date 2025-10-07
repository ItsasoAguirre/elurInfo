import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import { logger } from './logger'

export interface Database {
  db: sqlite3.Database
  close: () => Promise<void>
  run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>
  exec: (sql: string) => Promise<void>
}

class DatabaseManager {
  private static instance: DatabaseManager
  private database: sqlite3.Database | null = null
  private dbPath: string

  constructor() {
    this.dbPath = process.env['DATABASE_PATH'] || path.join(process.cwd(), 'data', 'elurinfo.db')
    this.ensureDataDirectory()
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      logger.info(`Created data directory: ${dataDir}`)
    }
  }

  async connect(): Promise<Database> {
    if (this.database) {
      return this.createDatabaseInterface(this.database)
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (error) => {
        if (error) {
          logger.error('Error opening database:', error)
          reject(error)
          return
        }

        logger.info(`Connected to SQLite database: ${this.dbPath}`)
        this.database = db

        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            logger.error('Error enabling foreign keys:', err)
            reject(err)
            return
          }

          // Enable WAL mode for better concurrent access
          db.run('PRAGMA journal_mode = WAL', (walErr) => {
            if (walErr) {
              logger.warn('Could not enable WAL mode:', walErr)
            } else {
              logger.info('WAL mode enabled')
            }

            resolve(this.createDatabaseInterface(db))
          })
        })
      })
    })
  }

  private createDatabaseInterface(db: sqlite3.Database): Database {
    return {
      db,
      close: (): Promise<void> => {
        return new Promise((resolve, reject) => {
          db.close((error) => {
            if (error) {
              logger.error('Error closing database:', error)
              reject(error)
            } else {
              logger.info('Database connection closed')
              this.database = null
              resolve()
            }
          })
        })
      },

      run: (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function(error) {
            if (error) {
              logger.error('Error running query:', { sql, params, error })
              reject(error)
            } else {
              resolve(this)
            }
          })
        })
      },

      get: <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
        return new Promise((resolve, reject) => {
          db.get(sql, params, (error, row) => {
            if (error) {
              logger.error('Error getting row:', { sql, params, error })
              reject(error)
            } else {
              resolve(row as T | undefined)
            }
          })
        })
      },

      all: <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (error, rows) => {
            if (error) {
              logger.error('Error getting rows:', { sql, params, error })
              reject(error)
            } else {
              resolve((rows || []) as T[])
            }
          })
        })
      },

      exec: (sql: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          db.exec(sql, (error) => {
            if (error) {
              logger.error('Error executing SQL:', { sql, error })
              reject(error)
            } else {
              resolve()
            }
          })
        })
      }
    }
  }

  async backup(): Promise<string> {
    if (!this.database) {
      throw new Error('Database not connected')
    }

    const backupDir = process.env['DATABASE_BACKUP_PATH'] || path.join(process.cwd(), 'data', 'backups')
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`)

    return new Promise((resolve, reject) => {
      try {
        // Simple file copy backup since sqlite3.backup method may not be available
        fs.copyFileSync(this.dbPath, backupPath)
        logger.info(`Database backed up to: ${backupPath}`)
        resolve(backupPath)
      } catch (error) {
        logger.error('Backup failed:', error)
        reject(error)
      }
    })
  }

  async vacuum(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not connected')
    }

    return new Promise((resolve, reject) => {
      this.database!.run('VACUUM', (error) => {
        if (error) {
          logger.error('VACUUM failed:', error)
          reject(error)
        } else {
          logger.info('Database vacuum completed')
          resolve()
        }
      })
    })
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance()

// Export setup function
export const setupDatabase = async (): Promise<Database> => {
  return await dbManager.connect()
}