import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import Database from "better-sqlite3";
import { requireAdmin } from "~/lib/auth.middleware";

const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin role
  await requireAdmin(request);

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get activities from database
    const activities = db
      .prepare(
        `SELECT * FROM activity 
         ORDER BY timestamp DESC 
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset);

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

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Insert activity into database
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
