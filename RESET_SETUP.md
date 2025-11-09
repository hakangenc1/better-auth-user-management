# Reset Setup Guide

If you encounter issues during setup or want to start fresh, you can reset the entire setup configuration and database.

## Method 1: Command Line (Recommended)

Run the reset script from your terminal:

```bash
npm run reset-setup
```

This will:
- ✅ **Clear all database data** (users, sessions, accounts, 2FA, activity logs)
- ✅ Delete the configuration file (`.data/config.encrypted.json`)
- ✅ Delete the SQLite database (`data/auth.db`)
- ✅ Clean up any database temporary files

After running the script:
1. **Restart your development server**
2. Navigate to `http://localhost:5173/setup`
3. Complete the setup wizard again

## Method 2: Manual Reset

If the script doesn't work, you can manually delete:

1. **Configuration file**: `.data/config.encrypted.json`
2. **SQLite database** (if using SQLite): `data/auth.db`, `data/auth.db-shm`, `data/auth.db-wal`
3. **Restart your development server**

## PostgreSQL Users

If you're using PostgreSQL, the reset script will:
1. **Clear all data** from existing tables (DELETE statements)
2. **Remove configuration** file

The tables will remain but be empty. If you want to also drop the tables, run:

```sql
-- Connect to your database
psql -U your_username -d your_database

-- Drop all tables
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS "twoFactor" CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
```

Then restart the setup wizard.

## Troubleshooting

### "Permission Denied" Error
Make sure you have write permissions to the `.data` and `data` directories.

### "File Not Found" Error
This is normal if you haven't completed setup yet. The script will skip missing files.

### Login Still Fails After Reset
1. Make sure you **restarted the development server**
2. Clear your browser cache and cookies
3. Try in an incognito/private window

## Need Help?

If you continue to experience issues:
1. Check the server console for error messages
2. Verify your database is accessible
3. Ensure all environment variables are set correctly (`.env` file)
