import { betterAuth } from "better-auth";
import { admin, twoFactor, multiSession } from "better-auth/plugins";
import bcrypt from "bcrypt";
import { ConfigStore } from "./config.server";
import { DatabaseConnectionManager } from "./db-connection.server";

/**
 * Auth instance singleton
 * Initialized lazily on first access
 */
let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Error thrown when setup is incomplete
 */
export class SetupIncompleteError extends Error {
  constructor(message: string = 'Database not configured. Please complete setup.') {
    super(message);
    this.name = 'SetupIncompleteError';
  }
}

/**
 * Initialize the auth instance with dynamic database configuration
 * Loads configuration from ConfigStore and creates appropriate adapter
 */
async function initializeAuth(): Promise<ReturnType<typeof betterAuth>> {
  // Return existing instance if already initialized
  if (authInstance) {
    return authInstance;
  }

  try {
    // Load configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();

    // Check if setup is complete
    if (!config || !config.setupComplete) {
      throw new SetupIncompleteError();
    }

    // Create database adapter based on configuration
    const connectionManager = new DatabaseConnectionManager();
    const adapter = await connectionManager.createAdapter(config.databaseConfig);

    // Initialize Better Auth with dynamic adapter
    authInstance = betterAuth({
      database: adapter,
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
      trustedOrigins: ["http://localhost:5173"],

      // Security: Use environment variable for secret
      secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",

      // Advanced security options
      advanced: {
        // Use secure cookies in production
        useSecureCookies: process.env.NODE_ENV === "production",
      },

      // Session configuration
      session: {
        // Session expires after 7 days
        expiresIn: 60 * 60 * 24 * 7,
        // Update session activity every 24 hours
        updateAge: 60 * 60 * 24,
      },

      // Rate limiting: Disabled globally, handled per-endpoint in routes
      // This prevents session checks from being rate limited
      rateLimit: {
        enabled: false,
      },

      // Email and password authentication
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        // Password hashing with bcrypt
        password: {
          hash: async (password) => {
            return await bcrypt.hash(password, 10);
          },
          verify: async ({ hash, password }) => {
            return await bcrypt.compare(password, hash);
          },
        },
        // Password requirements
        minPasswordLength: 8,
        maxPasswordLength: 128,
      },

      // Admin plugin for role-based access
      plugins: [
        admin({
          defaultRole: "user",
          async isAdmin(user: { role: string }) {
            return user.role === "admin";
          },
        }),
        twoFactor({
          // Two-factor authentication plugin
          issuer: "User Management System",
        }),
        multiSession({
          // Multi-session management plugin
          maximumSessions: 5, // Max 5 active sessions per user
        }),
      ],
    });

    return authInstance;
  } catch (error) {
    // Re-throw SetupIncompleteError as-is
    if (error instanceof SetupIncompleteError) {
      throw error;
    }
    
    // Wrap other errors
    throw new Error(`Failed to initialize auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reset the auth instance
 * Used when configuration changes or for testing
 */
export function resetAuthInstance(): void {
  authInstance = null;
}

/**
 * Proxy-based auth export for lazy loading
 * Automatically initializes auth on first access to any property or method
 */
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get: (_target, prop) => {
    // Special handling for 'api' - it's an object with methods
    if (prop === 'api') {
      return new Proxy({}, {
        get: (_apiTarget, apiProp) => {
          return async (...args: any[]) => {
            const instance = await initializeAuth();
            const apiObject = (instance as any).api;
            const method = apiObject[apiProp];
            
            if (typeof method === 'function') {
              return method.apply(apiObject, args);
            }
            
            return method;
          };
        }
      });
    }
    
    // Special handling for 'handler' - it's a direct function
    if (prop === 'handler') {
      return async (request: Request) => {
        const instance = await initializeAuth();
        return instance.handler(request);
      };
    }
    
    // For '$Infer', return the type
    if (prop === '$Infer') {
      return {} as any;
    }
    
    // For other properties, return a function that initializes and accesses the property
    return async (...args: any[]) => {
      const instance = await initializeAuth();
      const value = (instance as any)[prop];
      
      // If it's a function, call it with the provided arguments
      if (typeof value === 'function') {
        return value.apply(instance, args);
      }
      
      // Otherwise, return the value
      return value;
    };
  }
});

export type Session = typeof auth.$Infer.Session;
