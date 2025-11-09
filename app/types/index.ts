// Type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "moderator" | "support";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean;
  banReason?: string;
  banUntil?: Date;
  twoFactorEnabled?: boolean;
  image?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: "user" | "admin" | "moderator" | "support";
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: "user" | "admin" | "moderator" | "support";
  emailVerified?: boolean;
  image?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SearchFilters {
  query?: string;
  role?: string;
  status?: "active" | "banned" | "pending" | "all";
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListUsersResponse {
  data: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Database Configuration Types

export interface SQLiteConfig {
  filePath: string;
}

export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema?: string;
  ssl?: boolean;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  sqlite?: SQLiteConfig;
  postgresql?: PostgreSQLConfig;
}

export interface SetupConfig {
  setupComplete: boolean;
  databaseConfig: DatabaseConfig;
  createdAt: string;
  updatedAt: string;
}

// Type guards for database configuration

export function isSQLiteConfig(config: DatabaseConfig): config is DatabaseConfig & { type: 'sqlite'; sqlite: SQLiteConfig } {
  return config.type === 'sqlite' && config.sqlite !== undefined;
}

export function isPostgreSQLConfig(config: DatabaseConfig): config is DatabaseConfig & { type: 'postgresql'; postgresql: PostgreSQLConfig } {
  return config.type === 'postgresql' && config.postgresql !== undefined;
}

export function isValidDatabaseConfig(config: DatabaseConfig): boolean {
  if (config.type === 'sqlite') {
    return isSQLiteConfig(config) && typeof config.sqlite.filePath === 'string' && config.sqlite.filePath.length > 0;
  }
  if (config.type === 'postgresql') {
    return isPostgreSQLConfig(config) && 
      typeof config.postgresql.host === 'string' &&
      typeof config.postgresql.port === 'number' &&
      typeof config.postgresql.database === 'string' &&
      typeof config.postgresql.username === 'string' &&
      typeof config.postgresql.password === 'string';
  }
  return false;
}
