# Setup Guide

Complete guide for setting up and configuring your user management application with database configuration wizard.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [Database Configuration](#database-configuration)
  - [SQLite Setup](#sqlite-setup)
  - [PostgreSQL Setup](#postgresql-setup)
- [Admin User Creation](#admin-user-creation)
- [Post-Setup Configuration](#post-setup-configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Database** (choose one):
  - SQLite (included, no additional setup required)
  - PostgreSQL (v12 or higher)

---

## Installation

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

```bash
# REQUIRED: Generate a secure secret key
# Use one of these commands:
openssl rand -base64 32
# OR
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Then set it in .env:
BETTER_AUTH_SECRET=your-generated-secret-here
BETTER_AUTH_URL=http://localhost:5173
```

**Important:** The `BETTER_AUTH_SECRET` must be at least 32 characters long and should be kept secure.

### 4. Start the Application

```bash
npm run dev
```

The application will start on `http://localhost:5173`

---

## Initial Setup

When you first access the application, you'll be automatically redirected to the **Setup Wizard** at `/setup`.

The setup wizard guides you through:

1. **Database Type Selection** - Choose between SQLite or PostgreSQL
2. **Database Configuration** - Enter connection details and test the connection
3. **Schema Migration** - Automatically create required database tables
4. **Admin User Creation** - Create your first administrator account
5. **Setup Completion** - Finalize setup and access your application

---

## Database Configuration

### SQLite Setup

SQLite is the simplest option and requires no additional database server.

#### Step 1: Select SQLite

In the setup wizard, select **SQLite** as your database type.

#### Step 2: Configure File Path

- **Default Path:** `./data/auth.db`
- **Custom Path:** You can specify any path (e.g., `/var/data/myapp.db`)

**Example:**
```
File Path: ./data/auth.db
```

#### Step 3: Test Connection

Click **Test Connection** to verify:
- The directory exists or can be created
- The application has write permissions
- The database file can be accessed

#### Common SQLite Issues

| Issue | Solution |
|-------|----------|
| Directory doesn't exist | The wizard will create it automatically |
| Permission denied | Ensure the application has write access to the directory |
| File locked | Close any other applications accessing the database |

---

### PostgreSQL Setup

PostgreSQL provides better performance and scalability for production environments.

#### Prerequisites

1. **PostgreSQL Server** installed and running
2. **Database created** for the application
3. **User credentials** with appropriate permissions

#### Step 1: Create Database

Connect to PostgreSQL and create a database:

```sql
-- Connect as postgres user
psql -U postgres

-- Create database
CREATE DATABASE userdb;

-- Create user (optional, if not using existing user)
CREATE USER myapp_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE userdb TO myapp_user;

-- Exit
\q
```

#### Step 2: Configure Connection in Setup Wizard

Select **PostgreSQL** and enter your connection details:

| Field | Description | Example |
|-------|-------------|---------|
| **Host** | Database server hostname or IP | `localhost` or `db.example.com` |
| **Port** | PostgreSQL port (default: 5432) | `5432` |
| **Database** | Database name | `userdb` |
| **Username** | Database user | `myapp_user` |
| **Password** | User password | `secure_password` |
| **Schema** (optional) | PostgreSQL schema | `public` (default) |
| **SSL** | Enable SSL connection | ☐ Unchecked for local, ☑ Checked for remote |

**Example Configuration:**
```
Host: localhost
Port: 5432
Database: userdb
Username: myapp_user
Password: ••••••••••••••
Schema: public
SSL: ☐
```

#### Step 3: Test Connection

Click **Test Connection** to verify:
- Network connectivity to the database server
- Authentication credentials are correct
- User has necessary permissions
- Database exists and is accessible

#### Common PostgreSQL Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | PostgreSQL not running | Start PostgreSQL: `sudo systemctl start postgresql` |
| Authentication failed | Wrong credentials | Verify username/password in PostgreSQL |
| Database does not exist | Database not created | Create database: `CREATE DATABASE userdb;` |
| Permission denied | Insufficient privileges | Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE userdb TO user;` |
| SSL connection error | SSL misconfiguration | Try disabling SSL for local connections |
| Timeout | Firewall blocking | Check firewall rules: `sudo ufw allow 5432` |

---

## Schema Migration

After successfully testing your database connection, the wizard will automatically:

1. **Generate Schema** - Create table definitions based on Better Auth requirements
2. **Apply Migrations** - Create the following tables:
   - `user` - User accounts and profiles
   - `session` - Active user sessions
   - `account` - OAuth provider accounts
   - `verification` - Email verification tokens
   - `twoFactor` - Two-factor authentication data
   - `activityLog` - User activity tracking

3. **Verify Schema** - Confirm all tables were created successfully

**Progress Indicator:**

```
✓ Generating schema...
✓ Creating user table...
✓ Creating session table...
✓ Creating account table...
✓ Creating verification table...
✓ Creating twoFactor table...
✓ Creating activityLog table...
✓ Migration complete!
```

### Migration Errors

If migration fails:

1. **Check Error Message** - The wizard displays which table failed
2. **Verify Permissions** - Ensure user has `CREATE TABLE` privileges
3. **Check Disk Space** - Ensure sufficient storage available
4. **Retry** - Click "Retry Migration" after fixing the issue

---

## Admin User Creation

After successful migration, create your administrator account:

### Required Fields

| Field | Requirements | Example |
|-------|-------------|---------|
| **Email** | Valid email address | `admin@example.com` |
| **Password** | Minimum 8 characters | `SecurePass123!` |
| **Confirm Password** | Must match password | `SecurePass123!` |
| **Name** | Display name | `Admin User` |

### Password Requirements

- ✓ At least 8 characters long
- ✓ Recommended: Mix of uppercase, lowercase, numbers, and symbols

**Password Strength Indicator:**

The wizard shows real-time password strength:
- 🔴 Weak
- 🟡 Medium  
- 🟢 Strong

### Admin Privileges

The created user will have:
- Full access to user management
- Ability to create/edit/delete users
- Access to activity logs
- System configuration permissions

---

## Post-Setup Configuration

### Setup Lock

After completing setup, the wizard is automatically locked:

- ✓ Setup wizard redirects to login page
- ✓ Configuration is encrypted and stored in `.data/config.json`
- ✓ Database credentials are secured

### First Login

1. Navigate to `/login`
2. Enter your admin email and password
3. Access the dashboard

### Resetting Setup (Admin Only)

If you need to reconfigure the database:

1. Log in as an administrator
2. Navigate to Settings → Advanced
3. Click "Reset Setup Configuration"
4. Confirm the action
5. Complete the setup wizard again

**Warning:** Resetting setup does not delete existing data, but you'll need to reconfigure database connection.

---

## Troubleshooting

### Setup Wizard Not Accessible

**Symptom:** Redirected to login instead of setup wizard

**Cause:** Setup already completed

**Solution:**
- If you need to reconfigure, use the admin reset feature
- Check `.data/config.json` exists (setup is complete)

---

### Environment Variable Errors

**Symptom:** Application fails to start with environment variable errors

**Cause:** Missing or invalid `.env` configuration

**Solution:**

1. Verify `.env` file exists:
```bash
ls -la .env
```

2. Check required variables are set:
```bash
cat .env | grep BETTER_AUTH
```

3. Ensure `BETTER_AUTH_SECRET` is at least 32 characters:
```bash
# Generate new secret
openssl rand -base64 32
```

4. Verify `BETTER_AUTH_URL` format:
```bash
# Should be: http://localhost:5173 or https://yourdomain.com
```

---

### Database Connection Failures

#### SQLite Issues

**Permission Denied:**
```bash
# Check directory permissions
ls -ld data/

# Fix permissions
chmod 755 data/
```

**File Locked:**
```bash
# Check for processes using the database
lsof data/auth.db

# Kill blocking processes if safe
kill <PID>
```

#### PostgreSQL Issues

**Connection Refused:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check PostgreSQL is listening
sudo netstat -plnt | grep 5432
```

**Authentication Failed:**
```sql
-- Reset user password
ALTER USER myapp_user WITH PASSWORD 'new_password';

-- Verify user exists
\du
```

**Database Does Not Exist:**
```sql
-- List databases
\l

-- Create database
CREATE DATABASE userdb;
```

**Permission Denied:**
```sql
-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE userdb TO myapp_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO myapp_user;
```

---

### Migration Failures

**Symptom:** Migration fails during table creation

**Common Causes:**

1. **Insufficient Permissions**
```sql
-- PostgreSQL: Grant CREATE permission
GRANT CREATE ON SCHEMA public TO myapp_user;
```

2. **Tables Already Exist**
```sql
-- Check existing tables
\dt

-- Drop tables if needed (WARNING: deletes data)
DROP TABLE IF EXISTS "user", "session", "account", "verification", "twoFactor", "activityLog";
```

3. **Disk Space**
```bash
# Check available space
df -h
```

---

### Configuration File Issues

**Symptom:** Application can't read configuration

**Location:** `.data/config.json`

**Check File:**
```bash
# Verify file exists
ls -la .data/config.json

# Check permissions (should be 600)
ls -l .data/config.json

# Fix permissions
chmod 600 .data/config.json
```

**Corrupted Configuration:**
```bash
# Backup current config
cp .data/config.json .data/config.json.backup

# Remove config to restart setup
rm .data/config.json

# Restart application and complete setup wizard again
```

---

## Advanced Configuration

### Custom Configuration Location

Set custom config directory via environment variable:

```bash
# In .env
CONFIG_DIR=/custom/path/to/config
```

### Skip Setup (Development Only)

For development/testing, bypass setup wizard:

```bash
# In .env
SKIP_SETUP=true
```

**Warning:** Only use this if you have a valid configuration file already.

### Database Connection Pooling

For PostgreSQL, configure connection pool settings:

```typescript
// In app/lib/db-connection.server.ts
const pool = new Pool({
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### SSL Configuration for PostgreSQL

For production PostgreSQL with SSL:

```typescript
// Enable SSL in setup wizard
SSL: ☑ Enabled

// Or configure manually in config
{
  "postgresql": {
    "ssl": {
      "rejectUnauthorized": true,
      "ca": "path/to/ca-certificate.crt"
    }
  }
}
```

### Backup Configuration

**Backup Database Configuration:**
```bash
# Backup config file
cp .data/config.json .data/config.json.backup

# Backup SQLite database
cp data/auth.db data/auth.db.backup

# Backup PostgreSQL database
pg_dump -U myapp_user userdb > backup.sql
```

### Migration from Hardcoded SQLite

If migrating from an older version with hardcoded SQLite:

1. **Backup existing database:**
```bash
cp data/auth.db data/auth.db.backup
```

2. **Remove old configuration** (if any)

3. **Start application** - Setup wizard will appear

4. **Select SQLite** and use same path: `./data/auth.db`

5. **Skip migration** - Tables already exist

6. **Create admin user** or use existing credentials

---

## Security Best Practices

### Production Deployment

1. **Use Strong Secrets:**
```bash
# Generate 64-character secret for production
openssl rand -base64 64
```

2. **Enable HTTPS:**
```bash
BETTER_AUTH_URL=https://yourdomain.com
```

3. **Secure Configuration File:**
```bash
# Ensure restrictive permissions
chmod 600 .data/config.json
chown appuser:appuser .data/config.json
```

4. **Use PostgreSQL for Production:**
- Better performance
- Better scalability
- Better backup options

5. **Enable SSL for Database:**
- Always use SSL for remote PostgreSQL connections
- Use certificate-based authentication when possible

6. **Regular Backups:**
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U myapp_user userdb > backups/userdb_$DATE.sql
```

---

## Getting Help

### Check Logs

Application logs provide detailed error information:

```bash
# View application logs
npm run dev

# Check for specific errors
npm run dev 2>&1 | grep ERROR
```

### Common Log Messages

| Message | Meaning | Action |
|---------|---------|--------|
| `Environment Variable Validation Failed` | Missing .env variables | Check .env file |
| `Database not configured` | Setup incomplete | Complete setup wizard |
| `Connection refused` | Database not accessible | Check database server |
| `Authentication failed` | Wrong credentials | Verify database credentials |

### Support Resources

- **Documentation:** Check README.md and other docs
- **Issues:** Report bugs on GitHub
- **Community:** Join discussions

---

## Quick Reference

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run migrate

# Create admin user (script)
npm run make-admin
```

### Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `.data/config.json` | Encrypted database configuration |
| `data/auth.db` | SQLite database (if using SQLite) |
| `SETUP_GUIDE.md` | This guide |
| `README.md` | Project overview |

### Default Ports

| Service | Port |
|---------|------|
| Application | 5173 |
| PostgreSQL | 5432 |

---

## Next Steps

After completing setup:

1. ✓ Log in with your admin account
2. ✓ Explore the dashboard
3. ✓ Create additional users
4. ✓ Configure user roles and permissions
5. ✓ Set up two-factor authentication
6. ✓ Review activity logs
7. ✓ Customize application settings

**Congratulations!** Your user management application is now configured and ready to use.
