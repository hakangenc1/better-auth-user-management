# Reset Setup Functionality

## Overview
The system now includes a comprehensive reset functionality that allows administrators to reset all configuration and database data to start from scratch.

## Access Points

### 1. **Dashboard UI (Recommended for Admins)**
- Navigate to **Dashboard → Profile → System Tab**
- Only visible to users with **admin role**
- Click the "Reset Setup" button
- Confirm the action in the dialog

**Location:** `http://localhost:5173/dashboard/profile` → System tab

### 2. **Command Line (Alternative Method)**
```bash
npm run reset-setup
```

This script will:
- Delete the configuration file (`.data/config.encrypted.json`)
- Delete the SQLite database (`data/auth.db`)
- Clean up database temporary files

## What Gets Reset

### Database Data (Cleared First)
- ✅ **All users** - Every user account deleted
- ✅ **All sessions** - All active sessions terminated
- ✅ **All accounts** - OAuth/social accounts removed
- ✅ **All verification records** - Email verification data cleared
- ✅ **All 2FA settings** - Two-factor authentication removed
- ✅ **All activity logs** - Complete activity history deleted

### Configuration (Cleared After Data)
- ✅ Database connection settings
- ✅ Setup completion status
- ✅ All encrypted configuration data

### Database Files (SQLite Only)
- ✅ `auth.db` - Main database file
- ✅ `auth.db-shm` - Shared memory file
- ✅ `auth.db-wal` - Write-ahead log file

### Database (PostgreSQL)
For PostgreSQL users, the reset will:
1. **Clear all data** from existing tables (DELETE statements)
2. **Remove configuration** file

If you want to also drop the tables, run:

```sql
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS "twoFactor" CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
```

## Security Features

### Admin-Only Access
- Reset button only visible to admin users
- API endpoint requires admin authentication
- All reset attempts are logged for audit

### Confirmation Dialog
- Double confirmation required
- Clear warning about data loss
- Cannot be undone

### Activity Logging
All reset attempts are logged with:
- Admin user ID and email
- IP address
- Timestamp
- User agent

## After Reset

1. **Restart the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to setup wizard**
   ```
   http://localhost:5173/setup
   ```

3. **Complete the setup process**
   - Choose database type
   - Configure database connection
   - Create admin user
   - Complete setup

## Implementation Details

### Components
- **ResetSetupButton** (`app/components/setup/ResetSetupButton.tsx`)
  - Confirmation dialog
  - Loading states
  - Error handling

### API Endpoint
- **POST** `/api/setup/reset` (`app/routes/api.setup.reset.ts`)
  - Admin authentication required
  - **Step 1:** Clears all database data (users, sessions, etc.)
  - **Step 2:** Resets auth instance
  - **Step 3:** Removes configuration file
  - Activity logging
  - Comprehensive error handling

### Command Line Script
- **reset-setup.ts** (`scripts/reset-setup.ts`)
  - **Step 1:** Clears all database data from SQLite
  - **Step 2:** Removes configuration file
  - **Step 3:** Removes database files
  - Works without authentication

### Profile Integration
- **System Tab** (`app/routes/dashboard.profile.tsx`)
  - Admin-only visibility
  - Warning messages
  - Alternative method instructions

## Error Handling

### UI Errors
If the reset fails through the UI:
- Error message displayed
- Suggests using command line method
- Logs error to console

### Command Line Errors
If files don't exist:
- Script continues without error
- Skips missing files
- Completes successfully

## Use Cases

### Development
- Testing setup wizard
- Switching database types
- Clean slate for development

### Production Issues
- Corrupted configuration
- Database migration problems
- Starting over after errors

### Testing
- Automated testing scenarios
- Setup wizard testing
- Fresh environment creation

## Best Practices

1. **Backup First** (Production)
   - Export important data
   - Save configuration settings
   - Document custom changes

2. **Use Command Line** (Development)
   - Faster for frequent resets
   - No authentication required
   - Can be scripted

3. **Use UI** (Production)
   - Audit trail maintained
   - Admin authentication required
   - Confirmation required

## Troubleshooting

### Reset Button Not Visible
- Ensure you're logged in as admin
- Check user role in profile
- Verify admin permissions

### Reset Fails
1. Try command line method
2. Check file permissions
3. Verify database access
4. Check server logs

### Can't Access Setup After Reset
1. Clear browser cache
2. Try incognito/private window
3. Restart development server
4. Check server console for errors

## Related Files

- `app/components/setup/ResetSetupButton.tsx` - Reset button component
- `app/routes/api.setup.reset.ts` - Reset API endpoint
- `app/routes/dashboard.profile.tsx` - Profile page with system tab
- `scripts/reset-setup.ts` - Command line reset script
- `RESET_SETUP.md` - Detailed reset guide

## Security Considerations

- Only admins can access reset functionality
- All resets are logged for audit
- Requires explicit confirmation
- Cannot be undone
- Activity tracking maintained

## Future Enhancements

Potential improvements:
- [ ] Backup before reset option
- [ ] Selective reset (users only, config only)
- [ ] Export configuration before reset
- [ ] Email notification on reset
- [ ] Scheduled resets for testing environments
