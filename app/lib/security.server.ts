/**
 * Security utilities and middleware for the application
 * Server-side only
 */

import Database from "better-sqlite3";

/**
 * Rate limiter using SQLite
 */
export class RateLimiter {
  private db: Database.Database;
  private tableName = "rate_limits";

  constructor() {
    this.db = new Database(process.env.DATABASE_URL || "./data/auth.db");
    this.initTable();
  }

  private initTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        resetAt INTEGER NOT NULL
      )
    `);
  }

  /**
   * Check if request is rate limited
   * @param key - Unique identifier (e.g., IP address, user ID)
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  async check(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const resetAt = now + windowMs;

    try {
      // Clean up expired entries
      this.db.prepare(`DELETE FROM ${this.tableName} WHERE resetAt < ?`).run(now);

      // Get current count
      const row = this.db.prepare(`SELECT count, resetAt FROM ${this.tableName} WHERE key = ?`).get(key) as 
        { count: number; resetAt: number } | undefined;

      if (!row) {
        // First attempt
        this.db.prepare(`INSERT INTO ${this.tableName} (key, count, resetAt) VALUES (?, 1, ?)`).run(key, resetAt);
        return {
          allowed: true,
          remaining: maxAttempts - 1,
          resetAt: new Date(resetAt),
        };
      }

      if (row.count >= maxAttempts) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(row.resetAt),
        };
      }

      // Increment count
      this.db.prepare(`UPDATE ${this.tableName} SET count = count + 1 WHERE key = ?`).run(key);

      return {
        allowed: true,
        remaining: maxAttempts - row.count - 1,
        resetAt: new Date(row.resetAt),
      };
    } finally {
      // Don't close the database connection as it's shared
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string) {
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE key = ?`).run(key);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default (not ideal for production)
  return "unknown";
}

/**
 * Validate and sanitize input
 */
export function sanitizeInput(input: string): string {
  // Remove any potential XSS attempts
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Check if password meets security requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Security headers for responses
 */
export function getSecurityHeaders(): HeadersInit {
  return {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // Enable XSS protection
    "X-XSS-Protection": "1; mode=block",
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Content Security Policy
    "Content-Security-Policy": 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self';",
    // Permissions Policy
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(event: {
  type: "login_attempt" | "login_success" | "login_failure" | "rate_limit" | "suspicious_activity";
  ip: string;
  userAgent?: string;
  userId?: string;
  details?: string;
}) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp}`, JSON.stringify(event, null, 2));
  
  // In production, you would send this to a logging service
  // or store in a dedicated security log table
}
