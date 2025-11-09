# Security Features

This document outlines the security features implemented in the User Management Application.

## Authentication & Authorization

### Better Auth Configuration
- **Secure Session Management**: Sessions expire after 7 days with automatic renewal
- **Secure Cookies**: HTTP-only cookies in production
- **CSRF Protection**: Built-in cross-site request forgery protection
- **Password Hashing**: bcrypt with cost factor 10
- **Role-Based Access Control**: Admin-only access to management features

### Password Requirements
- Minimum length: 8 characters
- Maximum length: 128 characters
- Must contain:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number

## Rate Limiting

Rate limiting is applied per-endpoint to prevent abuse while allowing normal operations like session checks.

### Login Rate Limiting

**Password Login**
- **Window**: 15 minutes
- **Max Attempts**: 5 attempts per IP address
- **Storage**: SQLite database
- **Response**: 429 Too Many Requests with Retry-After header
- **Scope**: Only applies to `/api/auth/sign-in` endpoint

### Setup Rate Limiting
- **Window**: 15 minutes
- **Max Attempts**: 3 attempts per IP address
- **Storage**: SQLite database
- **Scope**: Only applies to first-time setup endpoint

### Session Checks
- **Rate Limiting**: Not applied to session validation endpoints
- **Reason**: Prevents false positives on page loads and navigation

### Account Lockout
- **Max Failed Attempts**: 5
- **Lockout Duration**: 15 minutes
- **Automatic Reset**: After lockout period expires

## Security Headers

The following security headers are automatically applied:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Input Validation & Sanitization

### Server-Side Validation
- All user inputs are validated using Zod schemas
- XSS prevention through input sanitization
- SQL injection prevention through parameterized queries
- Maximum input length enforcement

### Client-Side Validation
- React Hook Form with Zod validation
- Real-time feedback on form errors
- Type-safe form handling

## Database Security

### SQLite Configuration
- Parameterized queries prevent SQL injection
- Proper connection management (open/close)
- Type conversion for boolean values
- Separate server-only database module

### Data Protection
- Passwords never stored in plain text
- Sensitive data not exposed in API responses
- User sessions stored securely
- Automatic cleanup of expired sessions

## Configuration File Security

### Secure Storage
The application stores database configuration in `.data/config.json` with the following security measures:

#### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Derived from `BETTER_AUTH_SECRET` using scrypt
- **Sensitive Data**: Database passwords are encrypted before storage
- **Authentication**: GCM mode provides authenticated encryption

#### File Permissions
- **Unix/Linux/macOS**: 
  - Config file: `600` (owner read/write only)
  - Config directory: `700` (owner read/write/execute only)
- **Windows**: Uses NTFS ACLs (Access Control Lists)
- **Automatic**: Permissions set automatically on file creation

#### Location Security
- **Directory**: `.data/` (outside public directory)
- **Version Control**: Excluded via `.gitignore`
- **Web Access**: Not accessible via HTTP/HTTPS
- **Verification**: Automatic security checks on initialization

### Configuration Security Best Practices

1. **Never commit config files to version control**
   - `.data/` directory is in `.gitignore`
   - Verify with: `git status` should not show `.data/`

2. **Protect the encryption key**
   - `BETTER_AUTH_SECRET` must be kept secure
   - Use different secrets for dev/staging/production
   - Never log or expose the secret

3. **Verify file permissions** (Unix systems)
   ```bash
   # Check config file permissions
   ls -la .data/config.json
   # Should show: -rw------- (600)
   
   # Check directory permissions
   ls -ld .data/
   # Should show: drwx------ (700)
   ```

4. **Run security verification**
   ```bash
   npm run verify-config-security
   ```

### Security Verification Script

The application includes a verification script to check configuration security:

```bash
npx tsx scripts/verify-config-security.ts
```

This script verifies:
- ✅ Config directory is outside public directory
- ✅ Config directory is in `.gitignore`
- ✅ File permissions are set correctly (Unix systems)
- ✅ Directory permissions are set correctly (Unix systems)

### What Gets Encrypted

The following sensitive data is encrypted in the config file:
- PostgreSQL database passwords
- Any other credentials stored in the configuration

The following data is stored in plain text (non-sensitive):
- Database type (sqlite/postgresql)
- Database host and port
- Database name
- Username
- Schema name
- SSL settings
- Setup completion status

### Encryption Format

Encrypted values are stored with the prefix `encrypted:` followed by base64-encoded data:

```
encrypted:BASE64(salt + iv + authTag + encryptedData)
```

This format includes:
- **Salt**: Random 32-byte salt (for future key rotation)
- **IV**: Random 16-byte initialization vector
- **Auth Tag**: 16-byte authentication tag (GCM mode)
- **Encrypted Data**: The actual encrypted password

## Protected Routes

### Middleware Protection
- All dashboard routes require authentication
- Admin role verification on protected routes
- Automatic redirect to login for unauthorized access
- Session validation on every request

### Route Guards
- `/dashboard/*` - Requires authenticated admin user
- `/setup` - Only accessible when no users exist
- `/login` - Redirects to dashboard if already authenticated

## Security Logging

### Event Logging
Security events are logged for monitoring:
- Login attempts (success/failure)
- Rate limit violations
- Suspicious activity
- Authentication errors

### Log Format
```json
{
  "type": "login_attempt",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": "user-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Best Practices Implemented

### Development
- ✅ Environment variables for sensitive data
- ✅ Separate server-only modules (`.server.ts`)
- ✅ Type-safe database queries
- ✅ Error boundaries for graceful failures
- ✅ Secure random token generation

### Production Recommendations
- 🔒 Use HTTPS in production
- 🔒 Set strong `BETTER_AUTH_SECRET` environment variable
- 🔒 Enable secure cookies (`NODE_ENV=production`)
- 🔒 Implement email verification
- 🔒 Set up proper logging service
- 🔒 Regular security audits
- 🔒 Keep dependencies updated
- 🔒 Implement backup strategy

## Environment Variables

Required environment variables:

```env
# Required - Change in production!
BETTER_AUTH_SECRET=your-very-secure-random-secret-key

# Application URLs
BETTER_AUTH_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173

# Database
DATABASE_URL=./data/auth.db

# Node Environment
NODE_ENV=production  # Enables secure cookies
```

## Security Checklist

Before deploying to production:

### Authentication & Authorization
- [ ] Change `BETTER_AUTH_SECRET` to a strong random value
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Review and restrict `trustedOrigins`
- [ ] Test password login flow

### Security & Monitoring
- [ ] Set up proper logging service
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Set up alerts for rate limit violations
- [ ] Review and update CSP headers
- [ ] Test all rate limiting scenarios
- [ ] Perform security audit
- [ ] Update all dependencies

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Do not create public GitHub issues for security vulnerabilities.

## Additional Resources

- [Better Auth Documentation](https://better-auth.com)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/security)
- [SQLite Security](https://www.sqlite.org/security.html)
