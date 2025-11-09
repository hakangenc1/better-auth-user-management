/**
 * User Management Server Functions
 * Provides user CRUD operations using Better Auth and direct database access
 */

import { ConfigStore } from "./config.server";
import { DatabaseConnectionManager } from "./db-connection.server";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";

/**
 * Update user details including role
 */
export async function updateUser(userId: string, data: {
  email?: string;
  name?: string;
  emailVerified?: boolean;
  role?: string;
}) {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config) {
    throw new Error("Configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
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
    if (data.emailVerified !== undefined) {
      updates.push("emailVerified = ?");
      values.push(data.emailVerified ? 1 : 0);
    }
    if (data.role !== undefined) {
      updates.push("role = ?");
      values.push(data.role);
    }
    
    if (updates.length > 0) {
      values.push(userId);
      db.prepare(`UPDATE user SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }
  } else {
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
    if (data.emailVerified !== undefined) {
      updates.push(`"emailVerified" = $${paramIndex++}`);
      values.push(data.emailVerified);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }
    
    if (updates.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE "user" SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values);
    }
  }
}

/**
 * Ban a user
 */
export async function banUser(userId: string, reason?: string, expiresIn?: number) {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config) {
    throw new Error("Configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  const banExpires = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  
  if (config.databaseConfig.type === 'sqlite') {
    const db = adapter as Database.Database;
    db.prepare('UPDATE user SET banned = 1, banReason = ?, banExpires = ? WHERE id = ?')
      .run(reason || null, banExpires, userId);
  } else {
    const pool = adapter as any;
    await pool.query(
      'UPDATE "user" SET banned = true, "banReason" = $1, "banExpires" = $2 WHERE id = $3',
      [reason || null, banExpires, userId]
    );
  }
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string) {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config) {
    throw new Error("Configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  if (config.databaseConfig.type === 'sqlite') {
    const db = adapter as Database.Database;
    db.prepare('UPDATE user SET banned = 0, banReason = NULL, banExpires = NULL WHERE id = ?')
      .run(userId);
  } else {
    const pool = adapter as any;
    await pool.query(
      'UPDATE "user" SET banned = false, "banReason" = NULL, "banExpires" = NULL WHERE id = $1',
      [userId]
    );
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  const configStore = new ConfigStore();
  const config = await configStore.load();
  
  if (!config) {
    throw new Error("Configuration not found");
  }
  
  const connectionManager = new DatabaseConnectionManager();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  if (config.databaseConfig.type === 'sqlite') {
    const db = adapter as Database.Database;
    db.prepare('DELETE FROM user WHERE id = ?').run(userId);
  } else {
    const pool = adapter as any;
    await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);
  }
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  emailVerified?: boolean;
}) {
  const { auth } = await import("~/lib/auth.server");
  
  // Create user via Better Auth signup
  const result = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
  });
  
  if (!result || !result.user) {
    throw new Error("Failed to create user");
  }
  
  // Update role and email verification if needed
  if (data.role || data.emailVerified !== undefined) {
    const configStore = new ConfigStore();
    const config = await configStore.load();
    
    if (!config) {
      throw new Error("Configuration not found");
    }
    
    const connectionManager = new DatabaseConnectionManager();
    const adapter = await connectionManager.createAdapter(config.databaseConfig);
    
    if (config.databaseConfig.type === 'sqlite') {
      const db = adapter as Database.Database;
      const updates: string[] = [];
      const values: any[] = [];
      
      if (data.role) {
        updates.push("role = ?");
        values.push(data.role);
      }
      if (data.emailVerified !== undefined) {
        updates.push("emailVerified = ?");
        values.push(data.emailVerified ? 1 : 0);
      }
      
      if (updates.length > 0) {
        values.push(result.user.id);
        db.prepare(`UPDATE user SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
    } else {
      const pool = adapter as any;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.role) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.emailVerified !== undefined) {
        updates.push(`"emailVerified" = $${paramIndex++}`);
        values.push(data.emailVerified);
      }
      
      if (updates.length > 0) {
        values.push(result.user.id);
        await pool.query(`UPDATE "user" SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values);
      }
    }
  }
  
  return result.user;
}
