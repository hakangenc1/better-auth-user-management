import Database from "better-sqlite3";
import { auth } from "../app/lib/auth.server";

const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

console.log("🔄 Running database migrations...");

try {
  // Drop existing twoFactor table if it exists (to recreate with proper defaults)
  console.log("Dropping existing twoFactor table if exists...");
  db.exec(`DROP TABLE IF EXISTS twoFactor`);
  
  // Create twoFactor table with proper defaults
  console.log("Creating twoFactor table...");
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
  console.log("✅ twoFactor table created");

  // Add twoFactorEnabled column to user table if it doesn't exist
  console.log("Adding twoFactorEnabled column to user table...");
  try {
    db.exec(`
      ALTER TABLE user ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0
    `);
    console.log("✅ twoFactorEnabled column added");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️  twoFactorEnabled column already exists");
    } else {
      throw error;
    }
  }

  // Add image column to user table if it doesn't exist
  console.log("Adding image column to user table...");
  try {
    db.exec(`
      ALTER TABLE user ADD COLUMN image TEXT
    `);
    console.log("✅ image column added");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️  image column already exists");
    } else {
      throw error;
    }
  }

  // Add ipAddress and userAgent columns to session table if they don't exist
  console.log("Adding ipAddress and userAgent columns to session table...");
  try {
    db.exec(`
      ALTER TABLE session ADD COLUMN ipAddress TEXT
    `);
    console.log("✅ ipAddress column added");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️  ipAddress column already exists");
    } else {
      throw error;
    }
  }

  try {
    db.exec(`
      ALTER TABLE session ADD COLUMN userAgent TEXT
    `);
    console.log("✅ userAgent column added");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️  userAgent column already exists");
    } else {
      throw error;
    }
  }

  // Create activity table for audit logging
  console.log("Creating activity table...");
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
  console.log("✅ activity table created");

  // Create index on timestamp for faster queries
  console.log("Creating index on activity.timestamp...");
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp DESC)
    `);
    console.log("✅ activity timestamp index created");
  } catch (error: any) {
    console.log("ℹ️  activity timestamp index already exists");
  }

  // Create index on user for faster user-specific queries
  console.log("Creating index on activity.user...");
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user)
    `);
    console.log("✅ activity user index created");
  } catch (error: any) {
    console.log("ℹ️  activity user index already exists");
  }

  console.log("\n✅ Database migration completed successfully!");
  console.log("\nNew tables and columns:");
  console.log("  - twoFactor table (for 2FA)");
  console.log("  - user.twoFactorEnabled column");
  console.log("  - user.image column");
  console.log("  - session.ipAddress column");
  console.log("  - session.userAgent column");
  console.log("  - activity table (for audit logging)");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
