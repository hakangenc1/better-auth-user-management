# 🚀 Quick Reference Card

## New Features - At a Glance

### 🔐 Two-Factor Authentication
**Enable**: Dashboard → Profile → Two-Factor Auth → Enable 2FA
**Disable**: Dashboard → Profile → Two-Factor Auth → Disable 2FA
**Apps**: Google Authenticator, Authy, Microsoft Authenticator

### 📱 Session Management
**User View**: Dashboard → Profile → Sessions
**Admin View**: Dashboard → Sessions
**Actions**: Revoke session, Revoke all other sessions

### 👤 User Profile
**URL**: `/dashboard/profile`
**Tabs**: Profile, Security, Two-Factor Auth, Sessions
**Features**: Edit profile, Change password, Manage 2FA, View sessions

### 🔍 Advanced Search
**Location**: Dashboard → Users
**Filters**: Role, Status, Date Range
**Export**: CSV download available

### 💪 Bulk Operations
**Location**: Dashboard → Users
**Actions**: Ban, Unban, Role Change, Delete, Email
**How**: Select users → Bulk Actions dropdown

---

## 📍 Quick Navigation

| Feature | URL | Access |
|---------|-----|--------|
| Dashboard | `/dashboard` | All |
| Users | `/dashboard/users` | Admin |
| Sessions | `/dashboard/sessions` | Admin |
| Activity | `/dashboard/activity` | Admin |
| Profile | `/dashboard/profile` | All |

---

## 🎯 Common Tasks

### Enable 2FA:
1. Profile → Two-Factor Auth
2. Enable 2FA → Enter password
3. Scan QR code
4. Save backup codes

### Change Password:
1. Profile → Security
2. Enter current password
3. Enter new password
4. Confirm → All other sessions revoked

### Revoke Session:
1. Profile → Sessions (or Sessions page for admin)
2. Find session
3. Click Revoke

### Bulk Ban Users:
1. Users page
2. Check user boxes
3. Bulk Actions → Ban Selected
4. Confirm

### Search Users:
1. Users page
2. Type in search box OR
3. Click Filters → Set filters → Search

---

## 🔧 Configuration

### Session Limit:
```typescript
// app/lib/auth.server.ts
multiSession({ maximumSessions: 5 })
```

### 2FA Issuer:
```typescript
// app/lib/auth.server.ts
twoFactor({ issuer: "Your App Name" })
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on new pages | Restart dev server |
| 2FA not working | Check password, refresh page |
| Sessions not loading | Click Sessions tab |
| Bulk actions disabled | Select at least one user |

---

## 📦 Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Access app
http://localhost:5173
```

---

## ✅ Status: ALL FEATURES WORKING! 🎉
