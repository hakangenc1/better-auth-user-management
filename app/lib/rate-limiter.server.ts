/**
 * Rate Limiter for Setup Endpoints
 * Prevents brute force attacks by limiting requests per IP address
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequests: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (typically IP address)
   * @returns Object with allowed status and retry information
   */
  check(identifier: string): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
      };
    }

    // Within rate limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      this.requests.set(identifier, entry);

      return {
        allowed: true,
        remaining: this.maxRequests - entry.count,
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limit entries
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [identifier, entry] of this.requests.entries()) {
        if (now > entry.resetTime) {
          this.requests.delete(identifier);
        }
      }
    }, 5 * 60 * 1000);

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Get client IP address from request
 * Checks various headers for proxy/load balancer scenarios
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For header (most common for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the list
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(retryAfter: number, limit: number = 20): Response {
  return Response.json(
    {
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
      },
    }
  );
}

// Create rate limiter instances for different endpoints
// Connection test: 20 requests per 15 minutes (allow multiple testing attempts during setup)
export const connectionTestLimiter = new RateLimiter(20, 15 * 60 * 1000);

// Config save: 20 requests per 15 minutes (allow more attempts for configuration)
export const configSaveLimiter = new RateLimiter(20, 15 * 60 * 1000);

// Export for testing/admin purposes
export { RateLimiter };
