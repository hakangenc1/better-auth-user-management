# Admin Setup Guide

## Making a User an Admin

To access admin features like session management, user management, and activity logs, you need to have admin privileges.

### Method 1: Using the Make Admin Script (Recommended)

Run the interactive script to promote a user to admin:

```bash
npx tsx scripts/make-admin.ts
```

This will:
1. Show you a list of all users in the database
2. Let you select which user to make an admin
3. Update their role to "admin"

### Method 2: Direct Database Update

If you prefer to update the database directly:

```bash
npx tsx -e "
import Database from 'better-sqlite3';
const db = new Database('./data/auth.db');
db.prepare('UPDATE user SET role = ? WHERE email = ?').run('admin', 'your-email@example.com');
console.log('User updated to admin');
db.close();
"
```

Replace `your-email@example.com` with the email of the user you want to make an admin.

### Method 3: SQL Query

You can also use any SQLite client to run:

```sql
UPDATE user SET role = 'admin' WHERE email = 'your-email@example.com';
```

## After Making Changes

**Important:** After changing a user's role, they must:
1. Log out of the application
2. Log back in

The new admin permissions will then take effect.

## Checking Current Admin Users

To see which users are currently admins:

```bash
npx tsx -e "
import Database from 'better-sqlite3';
const db = new Database('./data/auth.db');
const admins = db.prepare('SELECT email, name, role FROM user WHERE role = ?').all('admin');
console.log('Current admins:', admins);
db.close();
"
```

## Admin Features

Once a user has admin role, they can access:

- **User Management** (`/dashboard/users`)
  - View all users
  - Create new users
  - Edit user information
  - Ban/unban users
  - Delete users
  - Change user roles
  - Bulk operations

- **Session Management** (`/dashboard/sessions`)
  - View all active sessions across the platform
  - Revoke specific sessions
  - Revoke all sessions for a user
  - Monitor session activity

- **Activity Log** (`/dashboard/activity`)
  - View all admin actions
  - Track user creation, deletion, bans, etc.
  - Monitor system activity

- **Profile Management** (`/dashboard/profile`)
  - Manage own profile
  - Enable/disable 2FA
  - Change password
  - View and manage own sessions

## Troubleshooting

### "Access denied" or 403 Forbidden errors

If you see these errors:
1. Check that your user has `role = 'admin'` in the database
2. Log out and log back in
3. Clear browser cache if needed

### Verify User Role

To check a specific user's role:

```bash
npx tsx -e "
import Database from 'better-sqlite3';
const db = new Database('./data/auth.db');
const user = db.prepare('SELECT email, name, role FROM user WHERE email = ?').get('your-email@example.com');
console.log('User:', user);
db.close();
"
```

## Security Notes

- Only trusted users should be given admin access
- Admin users can perform destructive operations (delete users, revoke sessions, etc.)
- All admin actions are logged in the activity table for audit purposes
- Consider implementing additional security measures for production environments:
  - IP whitelisting for admin access
  - Additional authentication factors
  - Time-based access restrictions
  - Regular audit log reviews
