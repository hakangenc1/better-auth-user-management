/**
 * Environment Variable Validation
 * 
 * Validates required environment variables on application startup
 * and provides clear error messages for missing or invalid variables.
 */

interface EnvConfig {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  SKIP_SETUP?: string;
  NODE_ENV?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are present and valid
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check BETTER_AUTH_SECRET
  if (!process.env.BETTER_AUTH_SECRET) {
    errors.push(
      'BETTER_AUTH_SECRET is required. This is used for encrypting credentials and session management.\n' +
      '  Generate a secure secret with: openssl rand -base64 32\n' +
      '  Add to .env file: BETTER_AUTH_SECRET=your-generated-secret'
    );
  } else if (process.env.BETTER_AUTH_SECRET.length < 32) {
    warnings.push(
      'BETTER_AUTH_SECRET should be at least 32 characters for security.\n' +
      '  Generate a stronger secret with: openssl rand -base64 32'
    );
  }

  // Check BETTER_AUTH_URL
  if (!process.env.BETTER_AUTH_URL) {
    errors.push(
      'BETTER_AUTH_URL is required. This is the base URL of your application.\n' +
      '  For development: BETTER_AUTH_URL=http://localhost:5173\n' +
      '  For production: BETTER_AUTH_URL=https://yourdomain.com'
    );
  } else {
    // Validate URL format
    try {
      const url = new URL(process.env.BETTER_AUTH_URL);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push(
          'BETTER_AUTH_URL must use http:// or https:// protocol.\n' +
          `  Current value: ${process.env.BETTER_AUTH_URL}`
        );
      }
    } catch (error) {
      errors.push(
        'BETTER_AUTH_URL is not a valid URL.\n' +
        `  Current value: ${process.env.BETTER_AUTH_URL}\n` +
        '  Expected format: http://localhost:5173 or https://yourdomain.com'
      );
    }
  }

  // Check NODE_ENV (warning only)
  if (!process.env.NODE_ENV) {
    warnings.push(
      'NODE_ENV is not set. Defaulting to "development".\n' +
      '  Set NODE_ENV=production for production deployments'
    );
  }

  // Check SKIP_SETUP (informational)
  if (process.env.SKIP_SETUP === 'true') {
    warnings.push(
      'SKIP_SETUP is enabled. Setup wizard will be bypassed.\n' +
      '  This should only be used for development/testing purposes.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets the validated environment configuration
 * Throws an error if validation fails
 */
export function getEnvConfig(): EnvConfig {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    result.warnings.forEach(warning => {
      console.warn(`  ${warning}\n`);
    });
  }

  // Throw error if validation fails
  if (!result.valid) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    result.errors.forEach(error => {
      console.error(`  ${error}\n`);
    });
    throw new Error(
      'Missing or invalid environment variables. Please check your .env file.\n' +
      'See .env.example for required variables.'
    );
  }

  return {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    SKIP_SETUP: process.env.SKIP_SETUP,
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
}

/**
 * Validates environment on module load (for early detection)
 * Only validates in production or when explicitly requested
 */
export function validateOnStartup(): void {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const result = validateEnvironment();

  // Always show warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    result.warnings.forEach(warning => {
      console.warn(`  ${warning}\n`);
    });
  }

  // Show errors but don't throw in development (allow setup wizard to run)
  if (!result.valid) {
    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ Environment Variable Validation Failed:\n');
      result.errors.forEach(error => {
        console.error(`  ${error}\n`);
      });
      throw new Error(
        'Missing or invalid environment variables. Please check your .env file.'
      );
    } else {
      console.warn('\n⚠️  Environment Variable Issues (non-fatal in development):\n');
      result.errors.forEach(error => {
        console.warn(`  ${error}\n`);
      });
    }
  }
}

/**
 * Helper to check if a specific environment variable is set
 */
export function hasEnvVar(key: keyof EnvConfig): boolean {
  return !!process.env[key];
}

/**
 * Helper to get an environment variable with a default value
 */
export function getEnvVar(key: keyof EnvConfig, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}
