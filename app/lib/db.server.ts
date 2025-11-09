import Database from "better-sqlite3";
import type { User } from "~/types";

/**
 * Get all users from the database
 * This function runs only on the server
 */
export function getAllUsers(): User[] {
  const db = new Database(process.env.DATABASE_URL || "./data/auth.db");
  
  try {
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
  } finally {
    db.close();
  }
}

/**
 * Update a user by ID
 * This function runs only on the server
 */
export function updateUserById(
  userId: string,
  data: {
    email?: string;
    name?: string;
    role?: string;
    emailVerified?: boolean;
  }
): void {
  const db = new Database(process.env.DATABASE_URL || "./data/auth.db");
  
  try {
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
  } finally {
    db.close();
  }
}

/**
 * Unban a user by ID
 * This function runs only on the server
 */
export function unbanUserById(userId: string): void {
  const db = new Database(process.env.DATABASE_URL || "./data/auth.db");
  
  try {
    db.prepare("UPDATE user SET banned = 0, banReason = NULL, banExpires = NULL WHERE id = ?").run(userId);
  } finally {
    db.close();
  }
}
