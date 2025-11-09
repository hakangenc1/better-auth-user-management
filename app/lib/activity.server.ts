import Database from "better-sqlite3";
import { ConfigStore } from "./config.server";
import { DatabaseConnectionManager } from "./db-connection.server";

/**
 * Server-side activity logging utility
 * Used for logging activities directly from API routes and server-side code
 * Works with both SQLite and PostgreSQL
 */

interface LogActivityParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the configured database
 * This is a server-side only function for use in API routes
 * Works with both SQLite and PostgreSQL
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
  } = params;

  try {
    // Load configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();

    if (!config || !config.databaseConfig) {
      console.warn("Database configuration not found, skipping activity log");
      return;
    }

    // Create database adapter
    const connectionManager = new DatabaseConnectionManager();
    const adapter = await connectionManager.createAdapter(config.databaseConfig);

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Prepare metadata
    const metadata = {
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
    };

    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;

      // Insert activity into SQLite database
      db.prepare(
        `INSERT INTO activity (id, action, user, target, type, metadata, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        action,
        userId,
        resourceId,
        'edit', // Default type for system actions
        JSON.stringify(metadata),
        timestamp,
        timestamp
      );

      db.close();
    } else {
      // PostgreSQL
      const pool = adapter as any;

      await pool.query(
        `INSERT INTO activity (id, action, "user", target, type, metadata, timestamp, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          action,
          userId,
          resourceId,
          'edit',
          JSON.stringify(metadata),
          timestamp,
          timestamp
        ]
      );
    }

    console.log(`Activity logged: ${action} by user ${userId}`);
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}
