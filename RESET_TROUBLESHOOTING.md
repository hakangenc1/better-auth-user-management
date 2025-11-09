# Reset Troubleshooting Guide

## Issue: "User already exists" after reset

### Problem
After resetting the configuration and database, when trying to create a new admin user, you get the error:
```
User already exists. Use another email.
```

### Root Causes

1. **Database connection not closed** - The old database connection might still be cached
2. **Auth instance cached** - Better Auth instance might have cached user data
3. **Database file not deleted** (SQLite) - The physical database file still exists
4. **Incomplete data clearing** - Some tables weren't properly cleared

### Solutions

#### Solution 1: Restart Development Server (Recommended)

After running reset, **always restart your development server**:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

This ensures:
- All cached connections are closed
- Auth instance is recreated
- Fresh database connections are established

#### Solution 2: Use Command Line Reset

The command line reset is more thorough:

```bash
npm run reset-setup
```

Then restart the server:
```bash
npm run dev
```

#### Solution 3: Manual Database Cleanup

If the issue persists, manually delete the database:

**For SQLite:**
```bash
# Windows
del data\auth.db
del data\auth.db-shm
del data\auth.db-wal

# Linux/Mac
rm data/auth.db
rm data/auth.db-shm
rm data/auth.db-wal
```

**For PostgreSQL:**
```sql
-- Connect to your database
psql -U your_username -d your_database

-- Clear all data
DELETE FROM activity;
DELETE FROM "twoFactor";
DELETE FROM verification;
DELETE FROM account;
DELETE FROM session;
DELETE FROM "user";
```

#### Solution 4: Complete Fresh Start

For a completely fresh start:

1. **Stop the development server**
2. **Delete configuration:**
   ```bash
   # Windows
   del .data\config.encrypted.json
   
   # Linux/Mac
   rm .data/config.encrypted.json
   ```

3. **Delete database (SQLite):**
   ```bash
   # Windows
   del data\auth.db
   
   # Linux/Mac
   rm data/auth.db
   ```

4. **Restart server:**
   ```bash
   npm run dev
   ```

5. **Go through setup again:**
   ```
   http://localhost:5173/setup
   ```

### Enhanced Reset Implementation

The reset functionality has been enhanced to:

1. ✅ **Clear all database data** (DELETE statements)
2. ✅ **Close database connections** properly
3. ✅ **Reset auth instance** to clear cache
4. ✅ **Delete configuration** file
5. ✅ **Wait for operations** to complete (500ms delay)

### Verification Steps

After reset, verify everything is cleared:

**For SQLite:**
```bash
# Check if database file exists
ls data/auth.db

# If it exists, check if it has data
sqlite3 data/auth.db "SELECT COUNT(*) FROM user;"
# Should return 0
```

**For PostgreSQL:**
```sql
-- Check user count
SELECT COUNT(*) FROM "user";
-- Should return 0
```

### Prevention

To avoid this issue in the future:

1. **Always restart the server** after reset
2. **Use command line reset** for more reliable cleanup
3. **Wait a few seconds** after reset before starting setup
4. **Clear browser cache** if you see stale data

### Still Having Issues?

If you still see "User already exists" after trying all solutions:

1. **Check server console** for error messages
2. **Verify database is accessible**
3. **Check file permissions** on database files
4. **Try a different email** temporarily to test
5. **Check if another process** is using the database

### Debug Commands

**Check if database file is locked (SQLite):**
```bash
# Windows
handle.exe auth.db

# Linux/Mac
lsof | grep auth.db
```

**Check PostgreSQL connections:**
```sql
SELECT * FROM pg_stat_activity 
WHERE datname = 'your_database_name';
```

### Expected Behavior After Fix

After implementing the enhanced reset:

1. Reset button clicked → All data deleted
2. Database connection closed
3. Auth instance reset
4. Configuration deleted
5. 500ms wait period
6. Redirect to setup
7. **Server restart recommended**
8. Fresh setup with no conflicts

### Technical Details

The enhanced reset now:

```typescript
// 1. Clear all data
db.prepare('DELETE FROM user').run();

// 2. Close connection
db.close();

// 3. Reset auth instance
resetAuthInstance();

// 4. Delete config
await configStore.reset();

// 5. Wait for completion
await new Promise(resolve => setTimeout(resolve, 500));
```

This ensures proper cleanup and prevents the "user already exists" error.
