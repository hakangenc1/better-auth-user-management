# 🚀 Quick Start Guide - New Features

## Getting Started

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Initialize Database
The Better Auth plugins will automatically create the necessary tables on first run.

```bash
npm run db:init
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
Open http://localhost:5173

---

## 🎯 Feature Walkthrough

### For Regular Users:

#### Setup Two-Factor Authentication
1. Login to your account
2. Click "Profile" in the top navigation
3. Go to "Two-Factor Auth" tab
4. Click "Enable 2FA"
5. Enter your password when prompted
6. Scan the QR code with Google Authenticator or Authy
7. **IMPORTANT**: Save the backup codes shown!
8. Done! Next login will require 2FA code

#### Manage Your Sessions
1. Go to Profile → Sessions tab
2. See all your active logins
3. Click "Revoke" to logout from a specific device
4. Click "Revoke All Other Sessions" to logout everywhere except current device

#### Change Your Password
1. Go to Profile → Security tab
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click "Change Password"
6. All other sessions will be automatically revoked for security

---

### For Administrators:

#### Monitor All Sessions
1. Go to Dashboard → Sessions
2. See all active sessions across the platform
3. Search by user name, email, or device
4. Click "Revoke" to force logout a user
5. Click "Revoke All" to logout user from all devices

#### Use Advanced Search
1. Go to Dashboard → Users
2. Type in the search box to find users by name/email
3. Click "Filters" button to show advanced options
4. Select:
   - **Role**: Admin, Moderator, Support, User
   - **Status**: Active, Pending, Banned
   - **Date Range**: Created between specific dates
5. Click "Search"
6. Click "Export CSV" to download results

#### Perform Bulk Operations
1. Go to Dashboard → Users
2. Check the boxes next to users you want to modify
3. Click "Bulk Actions" dropdown
4. Choose an action:
   - **Ban Selected**: Ban multiple users at once
   - **Unban Selected**: Unban multiple users
   - **Make Admin/Moderator/User**: Change roles in bulk
   - **Send Email**: Send notification to selected users
   - **Delete Selected**: Permanently remove users
5. Confirm the action
6. Done!

---

## 🔐 Security Best Practices

### For Users:
- ✅ Enable 2FA immediately
- ✅ Use a strong, unique password
- ✅ Review active sessions regularly
- ✅ Revoke unknown sessions immediately
- ✅ Keep backup codes in a safe place
- ❌ Don't share your 2FA codes
- ❌ Don't use the same password elsewhere

### For Administrators:
- ✅ Monitor sessions regularly
- ✅ Review audit logs frequently
- ✅ Use bulk operations for efficiency
- ✅ Export user data for backups
- ✅ Revoke suspicious sessions immediately
- ❌ Don't share admin credentials
- ❌ Don't leave admin sessions open on shared computers

---

## 🎨 UI Components Created

### New Pages:
- `/dashboard/profile` - User profile management
- `/dashboard/sessions` - Admin session management

### New Components:
- `UserSearch` - Advanced search and filtering
- `BulkActions` - Bulk operation dropdown
- Profile tabs (Profile, Security, 2FA, Sessions)

---

## 🔧 Configuration

### Environment Variables
No new environment variables needed! Better Auth handles everything.

### Session Limits
Currently set to 5 sessions per user. To change:

```typescript
// app/lib/auth.server.ts
multiSession({
  maximumSessions: 10, // Change this number
})
```

### 2FA Issuer Name
To change the app name shown in authenticator apps:

```typescript
// app/lib/auth.server.ts
twoFactor({
  issuer: "Your App Name", // Change this
})
```

---

## 📱 Supported Authenticator Apps

For 2FA, users can use any TOTP-compatible app:
- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password
- LastPass Authenticator
- Any other TOTP app

---

## 🐛 Troubleshooting

### "2FA QR Code not showing"
- Make sure you entered the correct password
- Check browser console for errors
- Try refreshing the page

### "Session not appearing in list"
- Click the "Sessions" tab to load them
- Refresh the page
- Check if you're logged in

### "Bulk actions not working"
- Make sure you selected at least one user
- Check if you have admin permissions
- Look for error messages in the UI

### "Search not finding users"
- Check your spelling
- Try clearing filters
- Make sure the user exists

---

## 💡 Tips & Tricks

### For Users:
1. **Save Backup Codes**: When enabling 2FA, save the backup codes in a password manager
2. **Regular Session Review**: Check your sessions weekly
3. **Use Strong Passwords**: Combine letters, numbers, and symbols

### For Admins:
1. **Bulk Operations**: Select users with Shift+Click for faster selection
2. **Export Before Bulk Delete**: Always export user list before bulk deleting
3. **Session Monitoring**: Check sessions daily for suspicious activity
4. **Search Shortcuts**: Use filters to quickly find specific user groups

---

## 🎓 Learning Resources

### Better Auth Documentation:
- [Admin Plugin](https://better-auth.com/docs/plugins/admin)
- [Two-Factor Auth](https://better-auth.com/docs/plugins/2fa)
- [Multi-Session](https://better-auth.com/docs/plugins/multi-session)

### Video Tutorials:
- Setting up 2FA (Coming soon)
- Using Bulk Operations (Coming soon)
- Session Management (Coming soon)

---

## 🎉 You're All Set!

Your user management system now has enterprise-grade features:
- ✅ Two-Factor Authentication
- ✅ Session Management
- ✅ Advanced Search
- ✅ Bulk Operations
- ✅ User Profiles
- ✅ Enhanced Security

Start exploring and enjoy the new features! 🚀
