import Database from "better-sqlite3";

/**
 * Check if any users exist in the database
 * @returns true if at least one user exists, false otherwise
 */
export function hasUsers(): boolean {
  try {
    const db = new Database(process.env.DATABASE_URL || "./data/auth.db");
    const result = db.prepare("SELECT COUNT(*) as count FROM user").get() as { count: number };
    db.close();
    return result.count > 0;
  } catch (error) {
    // If table doesn't exist or other error, assume no users
    return false;
  }
}

/**
 * Get the total count of users in the database
 * @returns number of users
 */
export function getUserCount(): number {
  try {
    const db = new Database(process.env.DATABASE_URL || "./data/auth.db");
    const result = db.prepare("SELECT COUNT(*) as count FROM user").get() as { count: number };
    db.close();
    return result.count;
  } catch (error) {
    return 0;
  }
}
