import { promises as fs, existsSync, mkdirSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import pg from 'pg';
import type { DatabaseConfig, SQLiteConfig, PostgreSQLConfig } from '~/types';

const { Pool } = pg;

/**
 * Result of a database connection test
 */
export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  errorType?: 'network' | 'authentication' | 'permissions' | 'filesystem' | 'unknown';
  suggestions?: string[];
}

/**
 * DatabaseConnectionManager handles database connection testing and adapter creation
 * for different database types (SQLite, PostgreSQL).
 */
export class DatabaseConnectionManager {
  /**
   * Test database connection based on configuration
   */
  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    try {
      if (config.type === 'sqlite' && config.sqlite) {
        return await this.testSQLiteConnection(config.sqlite);
      } else if (config.type === 'postgresql' && config.postgresql) {
        return await this.testPostgreSQLConnection(config.postgresql);
      } else {
        return {
          success: false,
          error: 'Invalid database configuration',
          errorType: 'unknown',
          suggestions: ['Ensure database type and configuration are properly specified']
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        errorType: 'unknown',
        suggestions: ['Check the error message for details', 'Verify your configuration is correct']
      };
    }
  }

  /**
   * Create database adapter based on configuration
   * Returns the appropriate adapter for Better Auth
   */
  async createAdapter(config: DatabaseConfig): Promise<any> {
    try {
      if (config.type === 'sqlite' && config.sqlite) {
        return this.createSQLiteAdapter(config.sqlite);
      } else if (config.type === 'postgresql' && config.postgresql) {
        return this.createPostgreSQLAdapter(config.postgresql);
      } else {
        throw new Error('Invalid database configuration: type must be "sqlite" or "postgresql"');
      }
    } catch (error: any) {
      throw new Error(`Failed to create database adapter: ${error.message}`);
    }
  }

  /**
   * Test SQLite connection
   * Checks file path accessibility and write permissions
   */
  private async testSQLiteConnection(config: SQLiteConfig): Promise<ConnectionTestResult> {
    try {
      const dbPath = path.resolve(config.filePath);
      const dbDir = path.dirname(dbPath);

      // Check if directory exists, create if it doesn't
      try {
        await fs.access(dbDir);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          try {
            await fs.mkdir(dbDir, { recursive: true });
          } catch (mkdirError: any) {
            return {
              success: false,
              error: `Cannot create database directory: ${mkdirError.message}`,
              errorType: 'filesystem',
              suggestions: this.getErrorSuggestions('filesystem', 'sqlite')
            };
          }
        } else {
          return {
            success: false,
            error: `Cannot access database directory: ${error.message}`,
            errorType: 'filesystem',
            suggestions: this.getErrorSuggestions('filesystem', 'sqlite')
          };
        }
      }

      // Try to open/create the database
      let db: Database.Database | null = null;
      try {
        db = new Database(dbPath);
        
        // Test write permissions by creating a test table
        db.exec('CREATE TABLE IF NOT EXISTS _connection_test (id INTEGER PRIMARY KEY)');
        db.exec('DROP TABLE IF EXISTS _connection_test');
        
        return {
          success: true
        };
      } catch (error: any) {
        if (error.message.includes('readonly') || error.message.includes('permission')) {
          return {
            success: false,
            error: `Database file is not writable: ${error.message}`,
            errorType: 'permissions',
            suggestions: this.getErrorSuggestions('permissions', 'sqlite')
          };
        }
        
        return {
          success: false,
          error: `Failed to open SQLite database: ${error.message}`,
          errorType: 'unknown',
          suggestions: this.getErrorSuggestions('unknown', 'sqlite')
        };
      } finally {
        if (db) {
          db.close();
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `SQLite connection test failed: ${error.message}`,
        errorType: 'unknown',
        suggestions: this.getErrorSuggestions('unknown', 'sqlite')
      };
    }
  }

  /**
   * Test PostgreSQL connection
   * Uses pg.Pool to test connection with provided credentials
   */
  private async testPostgreSQLConnection(config: PostgreSQLConfig): Promise<ConnectionTestResult> {
    let pool: pg.Pool | null = null;
    
    try {
      // Create connection pool
      pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000, // 5 second timeout
        max: 1 // Only need one connection for testing
      });

      // Test connection
      const client = await pool.connect();
      
      try {
        // Test basic query
        await client.query('SELECT 1');
        
        // Test schema accessibility if specified
        if (config.schema) {
          try {
            await client.query(`SET search_path TO ${config.schema}`);
          } catch (error: any) {
            return {
              success: false,
              error: `Schema '${config.schema}' is not accessible: ${error.message}`,
              errorType: 'permissions',
              suggestions: [
                `Verify that schema '${config.schema}' exists`,
                `Ensure user '${config.username}' has access to the schema`,
                'Try connecting without specifying a schema'
              ]
            };
          }
        }
        
        // Test write permissions by creating a test table
        try {
          const testTableName = '_connection_test_' + Date.now();
          await client.query(`CREATE TABLE ${testTableName} (id SERIAL PRIMARY KEY)`);
          await client.query(`DROP TABLE ${testTableName}`);
        } catch (error: any) {
          return {
            success: false,
            error: `User does not have CREATE TABLE permissions: ${error.message}`,
            errorType: 'permissions',
            suggestions: this.getErrorSuggestions('permissions', 'postgresql')
          };
        }
        
        return {
          success: true
        };
      } finally {
        client.release();
      }
    } catch (error: any) {
      // Determine error type based on error code/message
      let errorType: ConnectionTestResult['errorType'] = 'unknown';
      let suggestions: string[] = [];

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        errorType = 'network';
        suggestions = this.getErrorSuggestions('network', 'postgresql');
      } else if (error.code === '28P01' || error.message.includes('authentication') || error.message.includes('password')) {
        errorType = 'authentication';
        suggestions = this.getErrorSuggestions('authentication', 'postgresql');
      } else if (error.code === '3D000' || error.message.includes('database') && error.message.includes('does not exist')) {
        errorType = 'permissions';
        suggestions = [
          `Verify that database '${config.database}' exists`,
          'Check that the database name is spelled correctly',
          'Ensure the user has access to the database'
        ];
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        errorType = 'permissions';
        suggestions = this.getErrorSuggestions('permissions', 'postgresql');
      }

      return {
        success: false,
        error: error.message || 'Failed to connect to PostgreSQL',
        errorType,
        suggestions: suggestions.length > 0 ? suggestions : this.getErrorSuggestions('unknown', 'postgresql')
      };
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }

  /**
   * Get error suggestions based on error type and database type
   * Provides actionable troubleshooting guidance
   */
  private getErrorSuggestions(errorType: string, dbType: string): string[] {
    const suggestions: Record<string, Record<string, string[]>> = {
      sqlite: {
        filesystem: [
          'Ensure the directory exists and is writable',
          'Check file path permissions',
          'Verify the application has write access to the directory',
          'Try using an absolute path instead of a relative path'
        ],
        permissions: [
          'Check file permissions (should be readable and writable)',
          'Ensure the database file is not locked by another process',
          'Verify the application user has write permissions',
          'Try running with appropriate permissions'
        ],
        unknown: [
          'Verify the file path is correct',
          'Check that the directory exists',
          'Ensure SQLite is properly installed',
          'Review the error message for specific details'
        ]
      },
      postgresql: {
        network: [
          'Verify PostgreSQL server is running',
          'Check that host and port are correct',
          'Ensure firewall allows connections on the specified port',
          'Try connecting from the command line using psql',
          'Verify network connectivity to the database server'
        ],
        authentication: [
          'Verify username and password are correct',
          'Check that the user exists in PostgreSQL',
          'Ensure the user has login permissions',
          'Review pg_hba.conf for authentication settings',
          'Try connecting with psql to verify credentials'
        ],
        permissions: [
          'Ensure user has CREATE TABLE permissions',
          'Grant necessary privileges: GRANT CREATE ON DATABASE dbname TO username',
          'Verify user has access to the specified database',
          'Check that the user has sufficient privileges',
          'Review database and schema permissions'
        ],
        unknown: [
          'Check PostgreSQL server logs for details',
          'Verify all connection parameters are correct',
          'Ensure PostgreSQL version is compatible',
          'Try connecting with a PostgreSQL client tool',
          'Review the error message for specific guidance'
        ]
      }
    };

    return suggestions[dbType]?.[errorType] || [
      'Check the error message for details',
      'Verify your configuration is correct',
      'Consult the database documentation'
    ];
  }

  /**
   * Create SQLite adapter for Better Auth
   */
  private createSQLiteAdapter(config: SQLiteConfig): Database.Database {
    try {
      const dbPath = path.resolve(config.filePath);
      const dbDir = path.dirname(dbPath);
      
      // Ensure directory exists
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
      
      // Create and return database instance
      const db = new Database(dbPath);
      
      // Enable foreign keys for SQLite
      db.pragma('foreign_keys = ON');
      
      return db;
    } catch (error: any) {
      throw new Error(`Failed to create SQLite adapter: ${error.message}`);
    }
  }

  /**
   * Create PostgreSQL adapter for Better Auth
   * Returns a pg.Pool instance
   */
  private createPostgreSQLAdapter(config: PostgreSQLConfig): pg.Pool {
    try {
      const poolConfig: pg.PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        // Connection pool settings
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
      };
      
      // Set search_path if schema is specified
      if (config.schema) {
        poolConfig.options = `-c search_path=${config.schema},public`;
      }
      
      const pool = new Pool(poolConfig);
      
      // Handle pool errors
      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });
      
      return pool;
    } catch (error: any) {
      throw new Error(`Failed to create PostgreSQL adapter: ${error.message}`);
    }
  }
}
