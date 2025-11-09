# Database Scripts

This directory contains scripts for managing the SQLite database.

## Available Scripts

### `init-db.ts`
Initializes the database schema by creating all required tables.

```bash
npm run db:init
```

**Creates:**
- `user` table
- `session` table
- `account` table
- `verification` table

### `seed.ts`
Seeds the database with example users.

```bash
npm run seed
```

**Creates:**
- Admin user: `admin@example.com` / `admin123`
- Regular user: `user@example.com` / `user12345`

**Note:** Skips users that already exist.

### `update-admin-role.ts`
Updates a user's role to admin.

```bash
npx tsx scripts/update-admin-role.ts
```

**Updates:**
- Sets `admin@example.com` to admin role

### `reset-users.ts`
Deletes all users from the database, allowing you to start fresh with the first-time setup.

```bash
npm run db:reset
```

**Deletes:**
- All sessions
- All accounts
- All verifications
- All users

**Use case:** Testing the first-time setup flow or starting completely fresh.

## Common Workflows

### Full Setup (with example users)
```bash
npm run db:seed
```
This runs `init-db.ts`, `seed.ts`, and `update-admin-role.ts` in sequence.

### Fresh Start (first-time setup UI)
```bash
npm run db:init    # Create tables
npm run db:reset   # Clear any existing users (optional)
npm run dev        # Start server - will show setup page
```

### Reset Everything
```bash
rm -rf data/       # Delete database file
npm run db:init    # Recreate tables
```

## Security Scripts

### `verify-config-security.ts`
Verifies that the configuration file security is properly set up.

```bash
npm run verify-config-security
```

**Checks:**
- Config directory is outside public directory
- Config directory is in `.gitignore`
- File permissions are set correctly (Unix systems)
- Directory permissions are set correctly (Unix systems)

**Use case:** Verify security configuration before deployment or after setup.

### `test-config-permissions.ts`
Tests that file permissions are correctly set when creating a config file.

```bash
npm run test-config-permissions
```

**Tests:**
- Creates a test config file
- Verifies file permissions (600 on Unix)
- Verifies directory permissions (700 on Unix)
- Cleans up test file

**Use case:** Testing the permission-setting functionality during development.

## Database Location

The SQLite database is stored at:
```
./data/auth.db
```

This location is configured in the `.env` file via the `DATABASE_URL` variable.

## Configuration Security

The database configuration (when using the setup wizard) is stored at:
```
./.data/config.json
```

This file contains encrypted database credentials and is:
- **Encrypted**: Passwords encrypted with AES-256-GCM
- **Protected**: File permissions set to 600 (owner read/write only)
- **Excluded**: Added to `.gitignore` to prevent version control commits
- **Secure**: Located outside the public directory

See [SECURITY.md](../SECURITY.md) for more details on configuration security.
