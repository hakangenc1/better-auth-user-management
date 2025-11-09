import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import Database from "better-sqlite3";
import { requireAdmin } from "~/lib/auth.middleware";
import { ConfigStore } from "~/lib/config.server";
import { DatabaseConnectionManager } from "~/lib/db-connection.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin role
  await requireAdmin(request);

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Load configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();

    if (!config || !config.databaseConfig) {
      return Response.json({ error: "Database configuration not found" }, { status: 500 });
    }

    // Create database adapter
    const connectionManager = new DatabaseConnectionManager();
    const adapter = await connectionManager.createAdapter(config.databaseConfig);

    let activities: any[] = [];

    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;

      // Get activities from SQLite database
      activities = db
        .prepare(
          `SELECT * FROM activity 
           ORDER BY timestamp DESC 
           LIMIT ? OFFSET ?`
        )
        .all(limit, offset);

      db.close();
    } else {
      // PostgreSQL
      const pool = adapter as any;

      const result = await pool.query(
        `SELECT * FROM activity 
         ORDER BY timestamp DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      activities = result.rows;
    }

    return Response.json({
      activities: activities.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return Response.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Require admin role
  await requireAdmin(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { action, user, target, type, metadata } = body;

    if (!action || !user || !type) {
      return Response.json(
        { error: "Missing required fields: action, user, type" },
        { status: 400 }
      );
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Load configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();

    if (!config || !config.databaseConfig) {
      return Response.json({ error: "Database configuration not found" }, { status: 500 });
    }

    // Create database adapter
    const connectionManager = new DatabaseConnectionManager();
    const adapter = await connectionManager.createAdapter(config.databaseConfig);

    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;

      // Insert activity into SQLite database
      db.prepare(
        `INSERT INTO activity (id, action, user, target, type, metadata, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        action,
        user,
        target || null,
        type,
        metadata ? JSON.stringify(metadata) : null,
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
          user,
          target || null,
          type,
          metadata ? JSON.stringify(metadata) : null,
          timestamp,
          timestamp
        ]
      );
    }

    return Response.json({
      success: true,
      activity: {
        id,
        action,
        user,
        target,
        type,
        metadata,
        timestamp: new Date(timestamp),
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return Response.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
