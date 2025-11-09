# Admin Permissions & Role-Based Access Control

## Overview

The application now enforces strict role-based access control where **only admins can perform updates**. Regular users have read-only access to the dashboard.

## Permission Levels

### Admin Users (`role: "admin"`)
✅ Full access to all features:
- Create, edit, and delete users
- Ban and unban users
- Change user roles
- Update email verification status
- Revoke sessions
- View and manage all activities
- Access all dashboard pages

### Regular Users (`role: "user"`)
⚠️ Read-only access:
- View dashboard pages
- View their own profile
- Manage their own sessions
- Change their own password
- Enable/disable their own 2FA
- ❌ Cannot create, edit, or delete other users
- ❌ Cannot ban/unban users
- ❌ Cannot change roles
- ❌ Cannot revoke other users' sessions
- ❌ Cannot access admin features

## Implementation

### Middleware Functions

**`requireAuth(request)`**
- Checks if user is authenticated
- Redirects to login if not authenticated
- Used for all protected routes

**`requireAdmin(request)`**
- Checks if user is authenticated AND has admin role
- Redirects to dashboard if not admin
- Redirects to login if not authenticated
- Used for all admin-only actions

### Protected Routes

All modification actions now require admin role:

```typescript
// app/routes/dashboard.users.tsx
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request); // Admin check
  // ... handle updates
}

// app/routes/api.activity.ts
export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request); // Admin check
  // ... fetch activities
}
```

### UI Restrictions

Non-admin users see disabled buttons and read-only indicators:

- **Create User button**: Disabled for non-admins
- **Edit/Ban/Delete buttons**: Disabled for non-admins
- **Page descriptions**: Show "(read-only)" for non-admins
- **Action buttons**: Visually disabled with `disabled` prop

## Fixed Issues

### 1. ✅ Email Verified Update
- Added `updateUserById()` function in `db.server.ts`
- Added "update" intent handler in dashboard.users action
- Email verified checkbox now properly updates the database

### 2. ✅ Sorting by Date
- **Users**: Sorted by `createdAt` DESC (newest first)
- **Sessions**: Sorted by `updatedAt` DESC (most recent activity first)
- **Activities**: Already sorted by `timestamp` DESC in database query

### 3. ✅ Admin-Only Access
- Added `requireAdmin()` middleware
- Protected all modification actions
- Added UI indicators for non-admin users
- Disabled action buttons for non-admin users

## Making a User Admin

To promote a user to admin:

```bash
npx tsx scripts/make-admin.ts
```

Or directly in the database:

```sql
UPDATE user SET role = 'admin' WHERE email = 'user@example.com';
```

**Important**: User must log out and log back in for role changes to take effect.

## Security Notes

1. **Server-Side Enforcement**: All permissions are enforced on the server, not just in the UI
2. **API Protection**: All API endpoints check admin role before allowing modifications
3. **Session-Based**: Role is checked from the current session, not from client-side state
4. **Audit Trail**: All admin actions are logged in the activity table

## Testing Permissions

### As Admin
1. Log in as admin user
2. All buttons should be enabled
3. Can create, edit, delete users
4. Can access all features

### As Regular User
1. Log in as non-admin user
2. All action buttons should be disabled
3. Can view but not modify data
4. Attempting API calls will return 403 Forbidden

## Error Handling

- **403 Forbidden**: Returned when non-admin tries to perform admin action
- **Redirect to /dashboard**: Non-admins accessing admin routes are redirected
- **UI Feedback**: Disabled buttons prevent accidental clicks
- **Toast Messages**: Clear error messages for permission issues
