import { type ActionFunctionArgs } from "react-router";
import { DatabaseConnectionManager } from "~/lib/db-connection.server";
import type { DatabaseConfig } from "~/types";
import { isValidDatabaseConfig } from "~/types";
import { 
  connectionTestLimiter, 
  getClientIp, 
  createRateLimitResponse 
} from "~/lib/rate-limiter.server";

/**
 * API endpoint for testing database connections
 * Validates configuration and tests connectivity before saving
 * Rate limited to prevent brute force attacks
 */

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return Response.json({ 
      success: false,
      error: 'Method not allowed' 
    }, { status: 405 });
  }

  // Apply rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = connectionTestLimiter.check(clientIp);
  
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for connection test from IP: ${clientIp}`);
    return createRateLimitResponse(rateLimitResult.retryAfter!);
  }

  try {
    // Parse request body
    const body = await request.json();
    
    // Validate database configuration
    const config = parseAndValidateConfig(body);
    
    if (!config) {
      return Response.json({
        success: false,
        error: 'Invalid database configuration',
        errorType: 'validation',
        suggestions: [
          'Ensure all required fields are provided',
          'Check that database type is either "sqlite" or "postgresql"',
          'Verify configuration matches the selected database type'
        ]
      }, { status: 400 });
    }
    
    // Test the connection
    const connectionManager = new DatabaseConnectionManager();
    const result = await connectionManager.testConnection(config);
    
    // Return test results with rate limit headers
    return Response.json(result, {
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
      },
    });
  } catch (error: any) {
    console.error('Connection test error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to test database connection',
      errorType: 'unknown',
      suggestions: [
        'Check the error message for details',
        'Verify your configuration is correct',
        'Ensure the database server is accessible'
      ]
    }, { status: 500 });
  }
}

/**
 * Parse and validate incoming database configuration
 * Returns validated config or null if invalid
 */
function parseAndValidateConfig(body: any): DatabaseConfig | null {
  try {
    // Check if body has required fields
    if (!body || typeof body !== 'object') {
      return null;
    }
    
    const { type } = body;
    
    // Validate database type
    if (type !== 'sqlite' && type !== 'postgresql') {
      return null;
    }
    
    // Build configuration object
    const config: DatabaseConfig = {
      type,
      sqlite: type === 'sqlite' ? body.sqlite : undefined,
      postgresql: type === 'postgresql' ? body.postgresql : undefined,
    };
    
    // Validate using type guard
    if (!isValidDatabaseConfig(config)) {
      return null;
    }
    
    // Additional validation for PostgreSQL
    if (type === 'postgresql' && config.postgresql) {
      const pg = config.postgresql;
      
      // Validate port number
      if (pg.port < 1 || pg.port > 65535) {
        return null;
      }
      
      // Validate required string fields are not empty
      if (!pg.host.trim() || !pg.database.trim() || !pg.username.trim()) {
        return null;
      }
    }
    
    // Additional validation for SQLite
    if (type === 'sqlite' && config.sqlite) {
      // Validate file path is not empty
      if (!config.sqlite.filePath.trim()) {
        return null;
      }
    }
    
    return config;
  } catch (error) {
    console.error('Config validation error:', error);
    return null;
  }
}
