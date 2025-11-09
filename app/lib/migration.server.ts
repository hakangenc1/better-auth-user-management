import Database from 'better-sqlite3';
import pg from 'pg';
import type { DatabaseConfig } from '../types';

const { Pool } = pg;

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  tablesCreated?: string[];
  error?: string;
  failedTable?: string;
  progress?: string[];
}

/**
 * Progress callback for migration operations
 */
export type MigrationProgressCallback = (message: string) => void;

/**
 * MigrationManager handles database schema creation and migration
 * for different database types (SQLite, PostgreSQL).
 */
export class MigrationManager {
  private config: DatabaseConfig;
  private progressCallback?: MigrationProgressCallback;

  constructor(config: DatabaseConfig, progressCallback?: MigrationProgressCallback) {
    this.config = config;
    this.progressCallback = progressCallback;
  }

  /**
   * Run migrations for the configured database
   * Creates all required tables for Better Auth and custom features
   */
  async runMigrations(): Promise<MigrationResult> {
    const progress: string[] = [];
    
    try {
      this.logProgress('Starting database migration...', progress);
      
      // Apply migrations based on database type
      const result = await this.applyMigrations();
      
      if (!result.success) {
        return result;
      }
      
      this.logProgress('Verifying schema...', progress);
      
      // Verify schema was created correctly
      const verified = await this.verifySchema();
      
      if (!verified) {
        return {
          success: false,
          error: 'Schema verification failed',
          progress
        };
      }
      
      this.logProgress('Migration completed successfully!', progress);
      
      return {
        success: true,
        tablesCreated: result.tablesCreated,
        progress
      };
    } catch (error: any) {
      this.logProgress(`Migration failed: ${error.message}`, progress);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during migration',
        progress
      };
    }
  }

  /**
   * Apply migrations to database
   * Creates all required tables for authentication and custom features
   */
  private async applyMigrations(): Promise<MigrationResult> {
    const progress: string[] = [];
    const tablesCreated: string[] = [];
    
    try {
      if (this.config.type === 'sqlite' && this.config.sqlite) {
        return await this.applySQLiteMigrations();
      } else if (this.config.type === 'postgresql' && this.config.postgresql) {
        return await this.applyPostgreSQLMigrations();
      } else {
        return {
          success: false,
          error: 'Invalid database configuration',
          progress
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Migration failed',
        progress
      };
    }
  }

  /**
   * Apply migrations for SQLite database
   */
  private async applySQLiteMigrations(): Promise<MigrationResult> {
    const progress: string[] = [];
    const tablesCreated: string[] = [];
    let db: Database.Database | null = null;
    
    try {
      const dbPath = this.config.sqlite!.filePath;
      this.logProgress(`Connecting to SQLite database at ${dbPath}...`, progress);
      
      db = new Database(dbPath);
      
      // Create user table
      this.logProgress('Creating user table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          emailVerified INTEGER NOT NULL DEFAULT 0,
          name TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          banned INTEGER NOT NULL DEFAULT 0,
          banReason TEXT,
          banExpires INTEGER,
          twoFactorEnabled INTEGER DEFAULT 0,
          image TEXT
        )
      `);
      tablesCreated.push('user');
      this.logProgress('✓ User table created', progress);
      
      // Create session table
      this.logProgress('Creating session table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS session (
          id TEXT PRIMARY KEY,
          expiresAt INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          userId TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
        )
      `);
      tablesCreated.push('session');
      this.logProgress('✓ Session table created', progress);
      
      // Create account table
      this.logProgress('Creating account table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS account (
          id TEXT PRIMARY KEY,
          accountId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          userId TEXT NOT NULL,
          accessToken TEXT,
          refreshToken TEXT,
          idToken TEXT,
          accessTokenExpiresAt INTEGER,
          refreshTokenExpiresAt INTEGER,
          scope TEXT,
          password TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
        )
      `);
      tablesCreated.push('account');
      this.logProgress('✓ Account table created', progress);
      
      // Create verification table
      this.logProgress('Creating verification table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS verification (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt INTEGER NOT NULL,
          createdAt INTEGER,
          updatedAt INTEGER
        )
      `);
      tablesCreated.push('verification');
      this.logProgress('✓ Verification table created', progress);
      
      // Create twoFactor table
      this.logProgress('Creating twoFactor table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS twoFactor (
          id TEXT PRIMARY KEY,
          secret TEXT NOT NULL,
          backupCodes TEXT NOT NULL,
          userId TEXT NOT NULL UNIQUE,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
        )
      `);
      tablesCreated.push('twoFactor');
      this.logProgress('✓ TwoFactor table created', progress);
      
      // Create activity table for audit logging
      this.logProgress('Creating activity table...', progress);
      db.exec(`
        CREATE TABLE IF NOT EXISTS activity (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          user TEXT NOT NULL,
          target TEXT,
          type TEXT NOT NULL,
          metadata TEXT,
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      tablesCreated.push('activity');
      this.logProgress('✓ Activity table created', progress);
      
      // Create indexes
      this.logProgress('Creating indexes...', progress);
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp DESC)
      `);
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user)
      `);
      this.logProgress('✓ Indexes created', progress);
      
      return {
        success: true,
        tablesCreated,
        progress
      };
    } catch (error: any) {
      this.logProgress(`Error: ${error.message}`, progress);
      return {
        success: false,
        error: `SQLite migration failed: ${error.message}`,
        progress
      };
    } finally {
      if (db) {
        db.close();
      }
    }
  }

  /**
   * Apply migrations for PostgreSQL database
   */
  private async applyPostgreSQLMigrations(): Promise<MigrationResult> {
    const progress: string[] = [];
    const tablesCreated: string[] = [];
    let pool: pg.Pool | null = null;
    
    try {
      const pgConfig = this.config.postgresql!;
      this.logProgress(`Connecting to PostgreSQL database at ${pgConfig.host}:${pgConfig.port}...`, progress);
      
      pool = new Pool({
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        user: pgConfig.username,
        password: pgConfig.password,
        ssl: pgConfig.ssl ? { rejectUnauthorized: false } : false,
      });
      
      const client = await pool.connect();
      
      try {
        // Set schema if specified
        if (pgConfig.schema) {
          await client.query(`SET search_path TO ${pgConfig.schema}`);
        }
        
        // Create user table
        this.logProgress('Creating user table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "user" (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
            name TEXT NOT NULL,
            "createdAt" TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            banned BOOLEAN NOT NULL DEFAULT FALSE,
            "banReason" TEXT,
            "banExpires" TIMESTAMP,
            "twoFactorEnabled" BOOLEAN DEFAULT FALSE,
            image TEXT
          )
        `);
        tablesCreated.push('user');
        this.logProgress('✓ User table created', progress);
        
        // Create session table
        this.logProgress('Creating session table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS session (
            id TEXT PRIMARY KEY,
            "expiresAt" TIMESTAMP NOT NULL,
            token TEXT NOT NULL UNIQUE,
            "createdAt" TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP NOT NULL,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "userId" TEXT NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
          )
        `);
        tablesCreated.push('session');
        this.logProgress('✓ Session table created', progress);
        
        // Create account table
        this.logProgress('Creating account table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS account (
            id TEXT PRIMARY KEY,
            "accountId" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "accessToken" TEXT,
            "refreshToken" TEXT,
            "idToken" TEXT,
            "accessTokenExpiresAt" TIMESTAMP,
            "refreshTokenExpiresAt" TIMESTAMP,
            scope TEXT,
            password TEXT,
            "createdAt" TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
          )
        `);
        tablesCreated.push('account');
        this.logProgress('✓ Account table created', progress);
        
        // Create verification table
        this.logProgress('Creating verification table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS verification (
            id TEXT PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            "expiresAt" TIMESTAMP NOT NULL,
            "createdAt" TIMESTAMP,
            "updatedAt" TIMESTAMP
          )
        `);
        tablesCreated.push('verification');
        this.logProgress('✓ Verification table created', progress);
        
        // Create twoFactor table
        this.logProgress('Creating twoFactor table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "twoFactor" (
            id TEXT PRIMARY KEY,
            secret TEXT NOT NULL,
            "backupCodes" TEXT NOT NULL,
            "userId" TEXT NOT NULL UNIQUE,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
          )
        `);
        tablesCreated.push('twoFactor');
        this.logProgress('✓ TwoFactor table created', progress);
        
        // Create activity table for audit logging
        this.logProgress('Creating activity table...', progress);
        await client.query(`
          CREATE TABLE IF NOT EXISTS activity (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            "user" TEXT NOT NULL,
            target TEXT,
            type TEXT NOT NULL,
            metadata TEXT,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        tablesCreated.push('activity');
        this.logProgress('✓ Activity table created', progress);
        
        // Create indexes
        this.logProgress('Creating indexes...', progress);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp DESC)
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_activity_user ON activity("user")
        `);
        this.logProgress('✓ Indexes created', progress);
        
        return {
          success: true,
          tablesCreated,
          progress
        };
      } finally {
        client.release();
      }
    } catch (error: any) {
      this.logProgress(`Error: ${error.message}`, progress);
      return {
        success: false,
        error: `PostgreSQL migration failed: ${error.message}`,
        progress
      };
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }

  /**
   * Verify that all required tables exist in the database
   */
  async verifySchema(): Promise<boolean> {
    try {
      if (this.config.type === 'sqlite' && this.config.sqlite) {
        return await this.verifySQLiteSchema();
      } else if (this.config.type === 'postgresql' && this.config.postgresql) {
        return await this.verifyPostgreSQLSchema();
      }
      return false;
    } catch (error: any) {
      console.error('Schema verification failed:', error);
      return false;
    }
  }

  /**
   * Verify SQLite schema
   */
  private async verifySQLiteSchema(): Promise<boolean> {
    let db: Database.Database | null = null;
    
    try {
      const dbPath = this.config.sqlite!.filePath;
      db = new Database(dbPath);
      
      const requiredTables = ['user', 'session', 'account', 'verification', 'twoFactor', 'activity'];
      
      for (const table of requiredTables) {
        const result = db.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
        ).get(table);
        
        if (!result) {
          console.error(`Table '${table}' not found`);
          return false;
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('SQLite schema verification failed:', error);
      return false;
    } finally {
      if (db) {
        db.close();
      }
    }
  }

  /**
   * Verify PostgreSQL schema
   */
  private async verifyPostgreSQLSchema(): Promise<boolean> {
    let pool: pg.Pool | null = null;
    
    try {
      const pgConfig = this.config.postgresql!;
      pool = new Pool({
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        user: pgConfig.username,
        password: pgConfig.password,
        ssl: pgConfig.ssl ? { rejectUnauthorized: false } : false,
      });
      
      const client = await pool.connect();
      
      try {
        // Set schema if specified
        const schema = pgConfig.schema || 'public';
        
        const requiredTables = ['user', 'session', 'account', 'verification', 'twoFactor', 'activity'];
        
        for (const table of requiredTables) {
          const result = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
            [schema, table]
          );
          
          if (result.rows.length === 0) {
            console.error(`Table '${table}' not found in schema '${schema}'`);
            return false;
          }
        }
        
        return true;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('PostgreSQL schema verification failed:', error);
      return false;
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }

  /**
   * Log progress message
   */
  private logProgress(message: string, progress: string[]): void {
    progress.push(message);
    if (this.progressCallback) {
      this.progressCallback(message);
    }
  }
}
