# Enhanced Reset Functionality - Complete

## Overview
The reset functionality has been enhanced to **completely clear all database data** including users, sessions, and all related records before resetting the configuration.

## What Changed

### Before
- Only deleted configuration file
- Only deleted SQLite database file
- Data remained in PostgreSQL databases

### After
- ✅ **Clears all data from database tables** (users, sessions, accounts, 2FA, activity, verification)
- ✅ Resets auth instance
- ✅ Deletes configuration file
- ✅ Deletes SQLite database files
- ✅ Works with both SQLite and PostgreSQL

## Reset Process

### Step 1: Clear Database Data
The reset now **deletes all records** from these tables in order:
1. `activity` - All activity logs
2. `twoFactor` - All 2FA settings
3. `verification` - All email verification records
4. `account` - All OAuth/social accounts
5. `session` - All active sessions
6. `user` - **All users**

### Step 2: Reset Auth Instance
- Clears the Better Auth singleton instance
- Forces re-initialization on next request

### Step 3: Remove Configuration
- Deletes encrypted configuration file
- Clears setup completion status

### Step 4: Clean Up Files (SQLite only)
- Removes `auth.db`
- Removes `auth.db-shm`
- Removes `auth.db-wal`

## Implementation

### API Endpoint (`app/routes/api.setup.reset.ts`)

```typescript
// Enhanced to clear database data first
export async function action({ request }: ActionFunctionArgs) {
  // Step 1: Clear all database data
  if (config.databaseConfig.type === 'sqlite') {
    db.prepare('DELETE FROM activity').run();
    db.prepare('DELETE FROM "twoFactor"').run();
    db.prepare('DELETE FROM verification').run();
    db.prepare('DELETE FROM account').run();
    db.prepare('DELETE FROM session').run();
    db.prepare('DELETE FROM user').run();
  } else {
    // PostgreSQL
    await pool.query('DELETE FROM activity');
    await pool.query('DELETE FROM "twoFactor"');
    await pool.query('DELETE FROM verification');
    await pool.query('DELETE FROM account');
    await pool.query('DELETE FROM session');
    await pool.query('DELETE FROM "user"');
  }
  
  // Step 2: Reset auth instance
  resetAuthInstance();
  
  // Step 3: Reset configuration
  await configStore.reset();
}
```

### Command Line Script (`scripts/reset-setup.ts`)

```typescript
async function clearDatabaseData() {
  const db = new Database(dbPath);
  
  // Clear all data from tables
  db.prepare('DELETE FROM activity').run();
  db.prepare('DELETE FROM "twoFactor"').run();
  db.prepare('DELETE FROM verification').run();
  db.prepare('DELETE FROM account').run();
  db.prepare('DELETE FROM session').run();
  db.prepare('DELETE FROM user').run();
  
  db.close();
}
```

## Database Compatibility

### SQLite ✅
- Clears all data from tables
- Deletes database files
- Removes temporary files
- **Fully automated**

### PostgreSQL ✅
- Clears all data from tables using DELETE statements
- Tables remain but are empty
- Configuration removed
- **Fully automated** (optional: manually drop tables)

## Security Features

### Logging
All reset operations are logged with:
- Admin user information
- IP address
- Timestamp
- User agent

### Confirmation
- Double confirmation required in UI
- Clear warnings about data loss
- Cannot be undone

### Admin Only
- UI button only visible to admins
- API endpoint requires admin authentication
- Command line script bypasses auth (for emergency recovery)

## Usage

### Method 1: Dashboard UI (Recommended)
1. Log in as admin
2. Go to **Dashboard → Profile → System**
3. Click **Reset Setup**
4. Confirm the action
5. System redirects to setup wizard

### Method 2: Command Line
```bash
npm run reset-setup
```

## Console Output

### API Endpoint
```
🗑️  Clearing database data...
  - Clearing activity logs...
  - Clearing two-factor authentication...
  - Clearing verification records...
  - Clearing accounts...
  - Clearing sessions...
  - Clearing users...
✅ Database data cleared successfully
🔄 Resetting auth instance...
🗑️  Clearing configuration...
✅ Configuration cleared successfully
✨ Setup reset complete!
```

### Command Line Script
```
🔄 Resetting setup configuration and database...

🗑️  Clearing database data...
  - Clearing activity logs...
  - Clearing two-factor authentication...
  - Clearing verification records...
  - Clearing accounts...
  - Clearing sessions...
  - Clearing users...
✅ Database data cleared successfully

✅ Removed configuration file
✅ Removed SQLite database

✨ Setup reset complete!
   All users, sessions, and data have been deleted.
```

## Error Handling

### Database Errors
- If database cleanup fails, continues with config reset
- Logs warning but doesn't fail the entire operation
- Useful for corrupted databases

### File Errors
- Handles missing files gracefully
- Skips non-existent files
- Reports status for each operation

### PostgreSQL Connection Errors
- Attempts to clear data
- Falls back to config reset if connection fails
- User can manually clear data later

## Testing Checklist

- [x] SQLite data clearing works
- [x] PostgreSQL data clearing works
- [x] Configuration reset works
- [x] Auth instance reset works
- [x] File cleanup works
- [x] Error handling works
- [x] Logging works
- [x] UI confirmation works
- [x] Command line script works
- [x] Redirect to setup works

## Benefits

1. **Complete Reset** - No leftover data
2. **Database Agnostic** - Works with SQLite and PostgreSQL
3. **Safe** - Requires admin authentication
4. **Auditable** - All resets are logged
5. **Recoverable** - Can use command line if UI fails
6. **Clean** - Removes all traces of previous setup

## Files Modified

1. `app/routes/api.setup.reset.ts` - Enhanced API endpoint
2. `scripts/reset-setup.ts` - Enhanced command line script
3. `RESET_FUNCTIONALITY.md` - Updated documentation
4. `RESET_SETUP.md` - Updated guide

## Next Steps After Reset

1. **Restart development server**
   ```bash
   npm run dev
   ```

2. **Navigate to setup wizard**
   ```
   http://localhost:5173/setup
   ```

3. **Complete setup**
   - Choose database type
   - Configure connection
   - Create admin user
   - Start using the system

## Notes

- The reset is **permanent and cannot be undone**
- All users will be logged out immediately
- All sessions will be terminated
- All data will be permanently deleted
- Configuration must be set up again from scratch

This enhanced reset functionality ensures a truly clean slate for starting over!
