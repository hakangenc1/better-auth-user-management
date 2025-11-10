# Reset Functionality Improvements

## Overview
The reset functionality has been enhanced to provide a complete cleanup that deletes all users, data, and configuration from scratch. This ensures a true fresh start for development or testing.

## What Gets Deleted

When you run the reset, the following are permanently deleted:

### User & Authentication Data
- ✓ All user accounts (including admin user)
- ✓ All sessions and authentication tokens
- ✓ All 2FA and verification data
- ✓ All account information

### Application Data
- ✓ All activity logs and history
- ✓ All application data

### Configuration & Database
- ✓ All configuration settings (config.json, config.encrypted.json)
- ✓ Entire database files from scratch (auth.db, auth.db-shm, auth.db-wal)

## How to Reset

### Method 1: Web UI Button
1. Navigate to `/setup` in your dashboard
2. Click the "Reset Setup" button (usually in the bottom-right corner)
3. Read the confirmation dialog carefully
4. Type "DELETE" to confirm
5. Click "Reset Setup"
6. Restart your development server

### Method 2: Command Line
Run the npm script:
```bash
npm run reset-setup
```

This will:
- Delete all configuration files
- Delete all database files
- Display a summary of what was cleared
- Provide next steps for setup

## After Reset

Once you've reset:

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to setup wizard**
   - Go to `http://localhost:5173/setup`
   - You'll be automatically redirected to the setup wizard

3. **Complete setup again**
   - Select your database type (SQLite or PostgreSQL)
   - Configure database connection
   - Run migrations
   - Create your new admin user

## Important Notes

⚠️ **This action is irreversible** - All data will be permanently deleted.

⚠️ **Requires admin authentication** - You must be logged in as an admin to use the web UI reset.

⚠️ **Server restart required** - The development server must be restarted for the changes to take effect.

✓ **Audit logging** - All reset attempts are logged for security purposes.

## Files Modified

- `app/routes/api.setup.reset.ts` - Enhanced endpoint to delete all data and config
- `scripts/reset-setup.ts` - Updated script with detailed messaging
- `app/components/setup/ResetSetupButton.tsx` - Improved UI with clearer warnings

## Security Considerations

- Reset attempts are logged with user information and IP address
- Only admin users can initiate resets through the web UI
- The command-line script should only be run in development environments
- Activity logs are created before any data is deleted
