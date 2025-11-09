# Database Dynamic Connection Fix

## Problem Fixed
The application was hardcoded to use SQLite only, even when PostgreSQL was configured. Users couldn't see data from their PostgreSQL database.

## Root Cause
The `app/lib/db.server.ts` file was hardcoded to:
- Always use SQLite (`better-sqlite3`)
- Always connect to `./data/auth.db`
- Ignore the configured database settings

## Solution Implemented

### Dynamic Database Connection

The `db.server.ts` file now:
1. **Reads configuration** from ConfigStore
2. **Detects database type** (SQLite or PostgreSQL)
3. **Uses appropriate adapter** from DatabaseConnectionManager
4. **Executes correct SQL syntax** for each database type

### Key Changes

#### Before (Hardcoded SQLite)
```typescript
export function getAllUsers(): User[] {
  const db = new Database("./data/auth.db"); // ❌ Hardcoded
  const rows = db.prepare("SELECT * FROM user").all();
  return rows;
}
```

#### After (Dynamic)
```typescript
export async function getAllUsers(): Promise<User[]> {
  const config = await configStore.load();
  const adapter = await connectionManager.createAdapter(config.databaseConfig);
  
  if (config.databaseConfig.type === 'sqlite') {
    // SQLite queries
    const db = adapter as Database.Database;
    return db.prepare("SELECT * FROM user").all();
  } else {
    // PostgreSQL queries
    const pool = adapter as any;
    const result = await pool.query('SELECT * FROM "user"');
    return result.rows;
  }
}
```

## Functions Updated

### 1. `getAllUsers()`
- **Before:** Synchronous, SQLite only
- **After:** Async, supports both SQLite and PostgreSQL
- **Returns:** Promise<User[]>

### 2. `updateUserById()`
- **Before:** Synchronous, SQLite only
- **After:** Async, supports both databases
- **Returns:** Promise<void>

### 3. `unbanUserById()`
- **Before:** Synchronous, SQLite only
- **After:** Async, supports both databases
- **Returns:** Promise<void>

## SQL Syntax Differences Handled

### SQLite
```sql
SELECT id, email, name FROM user
UPDATE user SET name = ? WHERE id = ?
```

### PostgreSQL
```sql
SELECT id, email, name FROM "user"
UPDATE "user" SET name = $1 WHERE id = $2
```

Key differences:
- **Table names:** PostgreSQL uses quotes for case-sensitive names
- **Parameters:** SQLite uses `?`, PostgreSQL uses `$1, $2, $3`
- **Booleans:** SQLite uses 0/1, PostgreSQL uses true/false
- **Timestamps:** SQLite uses `datetime('now')`, PostgreSQL uses `NOW()`

## Files Modified

1. **app/lib/db.server.ts**
   - Made all functions async
   - Added configuration loading
   - Added database type detection
   - Added PostgreSQL support

2. **app/routes/dashboard.users.tsx**
   - Updated loader to await `getAllUsers()`

## Database Type Detection

```typescript
const config = await configStore.load();

if (config.databaseConfig.type === 'sqlite') {
  // Use SQLite adapter and syntax
} else if (config.databaseConfig.type === 'postgresql') {
  // Use PostgreSQL adapter and syntax
}
```

## Connection Management

### SQLite
- Opens connection for each operation
- Closes connection after operation
- Uses `db.close()`

### PostgreSQL
- Uses connection pool
- Pool manages connections automatically
- No need to close individual connections

## Testing

### SQLite
```bash
# Should show users from SQLite database
sqlite3 data/auth.db "SELECT * FROM user;"
```

### PostgreSQL
```bash
# Should show users from PostgreSQL database
psql -U user -d database -c "SELECT * FROM \"user\";"
```

## Benefits

1. ✅ **Database Agnostic** - Works with configured database
2. ✅ **No Hardcoding** - Reads from configuration
3. ✅ **Proper SQL Syntax** - Uses correct syntax for each database
4. ✅ **Connection Management** - Properly manages connections
5. ✅ **Type Safe** - Full TypeScript support
6. ✅ **Error Handling** - Graceful error handling

## Migration Guide

If you were using the old functions:

### Before
```typescript
const users = getAllUsers(); // Synchronous
```

### After
```typescript
const users = await getAllUsers(); // Async
```

All functions are now async and return Promises.

## Verification

After this fix, verify data is coming from the correct database:

1. **Check configuration:**
   ```typescript
   const config = await configStore.load();
   console.log(config.databaseConfig.type); // 'sqlite' or 'postgresql'
   ```

2. **Add test user in PostgreSQL:**
   ```sql
   INSERT INTO "user" (id, email, name, role) 
   VALUES ('test-id', 'test@example.com', 'Test User', 'user');
   ```

3. **Verify in dashboard:**
   - Navigate to Dashboard → Users
   - Should see the test user

## Troubleshooting

### Users not showing
1. Check configuration is loaded correctly
2. Verify database connection works
3. Check database has users
4. Restart development server

### Wrong database being used
1. Check `.data/config.encrypted.json` exists
2. Verify configuration has correct database type
3. Restart server after configuration change

### SQL errors
1. Check database type matches configuration
2. Verify table names are correct
3. Check column names match schema

## Summary

The application now dynamically connects to the configured database (SQLite or PostgreSQL) instead of being hardcoded to SQLite. All database operations now work with both database types, using the appropriate SQL syntax and connection management for each.

**Key Takeaway:** The app now respects your database configuration and fetches data from the correct database!
