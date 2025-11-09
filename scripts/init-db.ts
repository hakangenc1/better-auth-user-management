import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_URL || "./data/auth.db";

async function initDatabase() {
    console.log("Initializing database schema...");
    console.log(`Database path: ${dbPath}`);

    const db = new Database(dbPath);

    try {
        // Create user table
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
        banExpires INTEGER
      );
    `);

        // Create session table
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
      );
    `);

        // Create account table
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
      );
    `);

        // Create verification table
        db.exec(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `);

        console.log("✅ Database schema initialized successfully!");
        console.log("✅ Tables created: user, session, account, verification");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        throw error;
    } finally {
        db.close();
    }
}

initDatabase().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
