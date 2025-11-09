import Database from "better-sqlite3";

/**
 * Server-side activity logging utility
 * Used for logging activities directly from API routes and server-side code
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
 * Log an activity to the database
 * This is a server-side only function for use in API routes
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
    // Get database connection
    const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

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

    // Insert activity into database
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

    console.log(`Activity logged: ${action} by user ${userId}`);
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}
