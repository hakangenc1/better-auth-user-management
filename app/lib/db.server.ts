import Database from "better-sqlite3";
import type { User } from "~/types";
import { ConfigStore } from "./config.server";
import { DatabaseConnectionManager } from "./db-connection.server";

/**
 * Get all users from the configured database
 * Works with both SQLite and PostgreSQL
 * This function runs only on the server
 */
export async function getAllUsers(): Promise<User[]> {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config || !config.databaseConfig) {
    throw new Error("Database configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  try {
    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;
      
      const rows = db.prepare(`
        SELECT id, email, name, role, emailVerified, banned, banReason, banExpires, createdAt, updatedAt
        FROM user
      `).all() as any[];
      
      // Convert SQLite integers to booleans
      const users: User[] = rows.map(row => ({
        ...row,
        emailVerified: Boolean(row.emailVerified),
        banned: Boolean(row.banned),
      }));
      
      return users;
    } else {
      // PostgreSQL
      const pool = adapter as any;
      
      const result = await pool.query(`
        SELECT id, email, name, role, "emailVerified", banned, "banReason", "banExpires", "createdAt", "updatedAt"
        FROM "user"
      `);
      
      const users: User[] = result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        emailVerified: Boolean(row.emailVerified),
        banned: Boolean(row.banned),
        banReason: row.banReason,
        banExpires: row.banExpires,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      
      return users;
    }
  } finally {
    // Close connection for SQLite, PostgreSQL pool manages its own connections
    if (config.databaseConfig.type === 'sqlite') {
      (adapter as Database.Database).close();
    }
  }
}

/**
 * Update a user by ID
 * Works with both SQLite and PostgreSQL
 * This function runs only on the server
 */
export async function updateUserById(
  userId: string,
  data: {
    email?: string;
    name?: string;
    role?: string;
    emailVerified?: boolean;
  }
): Promise<void> {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config || !config.databaseConfig) {
    throw new Error("Database configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  try {
    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;
      const updates: string[] = [];
      const values: any[] = [];

      if (data.email !== undefined) {
        updates.push("email = ?");
        values.push(data.email);
      }
      if (data.name !== undefined) {
        updates.push("name = ?");
        values.push(data.name);
      }
      if (data.role !== undefined) {
        updates.push("role = ?");
        values.push(data.role);
      }
      if (data.emailVerified !== undefined) {
        updates.push("emailVerified = ?");
        values.push(data.emailVerified ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')");
        values.push(userId);
        
        const query = `UPDATE user SET ${updates.join(", ")} WHERE id = ?`;
        db.prepare(query).run(...values);
      }
    } else {
      // PostgreSQL
      const pool = adapter as any;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.emailVerified !== undefined) {
        updates.push(`"emailVerified" = $${paramIndex++}`);
        values.push(data.emailVerified);
      }

      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        values.push(userId);
        
        const query = `UPDATE "user" SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
        await pool.query(query, values);
      }
    }
  } finally {
    if (config.databaseConfig.type === 'sqlite') {
      (adapter as Database.Database).close();
    }
  }
}

/**
 * Unban a user by ID
 * Works with both SQLite and PostgreSQL
 * This function runs only on the server
 */
export async function unbanUserById(userId: string): Promise<void> {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config || !config.databaseConfig) {
    throw new Error("Database configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  try {
    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;
      db.prepare("UPDATE user SET banned = 0, banReason = NULL, banExpires = NULL WHERE id = ?").run(userId);
    } else {
      // PostgreSQL
      const pool = adapter as any;
      await pool.query('UPDATE "user" SET banned = false, "banReason" = NULL, "banExpires" = NULL WHERE id = $1', [userId]);
    }
  } finally {
    if (config.databaseConfig.type === 'sqlite') {
      (adapter as Database.Database).close();
    }
  }
}
