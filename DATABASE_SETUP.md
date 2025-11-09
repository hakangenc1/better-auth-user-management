# 🗄️ Database Setup Guide

## ✅ Database Migration Complete!

The database has been successfully migrated to support all new features.

---

## 📊 What Was Added

### New Tables:
1. **twoFactor** - Stores 2FA secrets and backup codes
   - `id` - Primary key
   - `secret` - TOTP secret (encrypted)
   - `backupCodes` - Recovery codes (encrypted)
   - `userId` - Foreign key to user
   - `createdAt` - Creation timestamp
   - `updatedAt` - Last update timestamp

### New Columns:

#### User Table:
- `twoFactorEnabled` - Boolean flag (0/1)
- `image` - Profile picture URL

#### Session Table:
- `ipAddress` - IP address of the session
- `userAgent` - Browser/device information

---

## 🚀 How to Run Migration

### First Time Setup:
```bash
# Run the migration
npm run db:migrate
```

### If You Already Have Data:
The migration is **safe** and **non-destructive**:
- ✅ Preserves all existing data
- ✅ Only adds new tables/columns
- ✅ Handles duplicate column errors gracefully
- ✅ Can be run multiple times safely

---

## 🔧 Manual Migration (If Needed)

If the automatic migration fails, you can run these SQL commands manually:

```sql
-- Create twoFactor table
CREATE TABLE IF NOT EXISTS twoFactor (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  backupCodes TEXT NOT NULL,
  userId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Add columns to user table
ALTER TABLE user ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0;
ALTER TABLE user ADD COLUMN image TEXT;

-- Add columns to session table
ALTER TABLE session ADD COLUMN ipAddress TEXT;
ALTER TABLE session ADD COLUMN userAgent TEXT;
```

---

## 📋 Database Schema

### Complete User Table:
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emailVerified INTEGER DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  banned INTEGER DEFAULT 0,
  banReason TEXT,
  banUntil TEXT,
  twoFactorEnabled INTEGER DEFAULT 0
);
```

### Complete Session Table:
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### TwoFactor Table:
```sql
CREATE TABLE twoFactor (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  backupCodes TEXT NOT NULL,
  userId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

---

## ✅ Verification

### Check if migration was successful:

```bash
# Using SQLite CLI
sqlite3 ./data/auth.db

# Check tables
.tables

# Should show:
# account  session  twoFactor  user  verification

# Check user table columns
PRAGMA table_info(user);

# Should include:
# twoFactorEnabled | INTEGER
# image | TEXT

# Check session table columns
PRAGMA table_info(session);

# Should include:
# ipAddress | TEXT
# userAgent | TEXT

# Exit
.quit
```

---

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove twoFactor table
DROP TABLE IF EXISTS twoFactor;

-- Remove new columns (SQLite doesn't support DROP COLUMN easily)
-- You would need to recreate the tables without these columns
-- Or just leave them (they won't cause issues)
```

**Note**: It's generally safe to leave the new columns even if not used.

---

## 🐛 Troubleshooting

### Error: "no such table: twoFactor"
**Solution**: Run the migration:
```bash
npm run db:migrate
```

### Error: "duplicate column name"
**Solution**: This is normal! The column already exists. The migration handles this gracefully.

### Error: "database is locked"
**Solution**: 
1. Stop the dev server
2. Run the migration
3. Restart the dev server

### Error: "unable to open database file"
**Solution**: Make sure the `data` directory exists:
```bash
mkdir data
npm run db:migrate
```

---

## 📦 Package.json Scripts

```json
{
  "db:init": "Initialize database schema",
  "db:migrate": "Run database migrations (NEW!)",
  "db:seed": "Seed database with example data",
  "db:reset": "Reset all users"
}
```

---

## 🎯 Next Steps

After running the migration:

1. ✅ Restart your dev server
2. ✅ Test 2FA functionality
3. ✅ Test session management
4. ✅ Check profile updates

---

## 💡 Tips

### Development:
- Run migration after pulling new code
- Migration is idempotent (safe to run multiple times)
- No data loss when running migration

### Production:
- Always backup database before migration
- Test migration on staging first
- Run migration during low-traffic period
- Monitor for errors after migration

---

## ✅ Migration Complete!

Your database is now ready for all new features:
- ✅ Two-Factor Authentication
- ✅ Multi-Session Management
- ✅ Profile Pictures
- ✅ Session Tracking

**Start using the new features!** 🚀
