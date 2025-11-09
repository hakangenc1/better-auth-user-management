# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ✅ Issue: "NOT NULL constraint failed: twoFactor.createdAt"

**Cause**: The twoFactor table was created without default values for timestamps.

**Solution**: Run the migration again (it will recreate the table):
```bash
npm run db:migrate
```

**Status**: ✅ FIXED

---

### ✅ Issue: "Your Better Auth config includes advanced.generateId which is deprecated"

**Cause**: Old configuration using deprecated `generateId` option.

**Solution**: Already fixed in `app/lib/auth.server.ts`

**Status**: ✅ FIXED

---

### Issue: "no such table: twoFactor"

**Cause**: Database not migrated.

**Solution**: Run the migration:
```bash
npm run db:migrate
```

---

### Issue: "404 Not Found" on /dashboard/profile or /dashboard/sessions

**Cause**: Routes not registered or dev server not restarted.

**Solution**:
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Clear browser cache

---

### Issue: "2FA QR Code not showing"

**Possible Causes**:
1. Wrong password entered
2. Database not migrated
3. Better Auth plugin not configured

**Solutions**:
1. Make sure you enter the correct password
2. Run migration: `npm run db:migrate`
3. Restart dev server
4. Check browser console for errors

---

### Issue: "Sessions not loading"

**Possible Causes**:
1. Not clicking the Sessions tab
2. Not logged in as admin
3. No sessions exist

**Solutions**:
1. Click the "Sessions" tab to trigger loading
2. Make sure you're logged in as admin
3. Try logging in from another device/browser
4. Check browser console for errors

---

### Issue: "Profile update not working"

**Possible Causes**:
1. Network error
2. Not logged in
3. Invalid data

**Solutions**:
1. Check browser console for errors
2. Make sure you're logged in
3. Try refreshing the page
4. Check network tab in dev tools

---

### Issue: "Password change fails"

**Possible Causes**:
1. Wrong current password
2. New password too short (min 8 chars)
3. Passwords don't match

**Solutions**:
1. Verify current password is correct
2. Make sure new password is at least 8 characters
3. Make sure new password and confirm password match
4. Check error message for details

---

### Issue: "Database is locked"

**Cause**: Multiple processes accessing the database.

**Solution**:
1. Stop all dev servers
2. Close any database tools (DB Browser, etc.)
3. Wait a few seconds
4. Restart dev server

---

### Issue: "Module not found" errors

**Cause**: Missing dependencies.

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Or on Windows
rmdir /s /q node_modules
npm install
```

---

### Issue: "TypeScript errors in IDE"

**Cause**: IDE cache or type generation issues.

**Solution**:
1. Restart TypeScript server in IDE
2. Run type generation: `npm run typecheck`
3. Restart IDE
4. Clear IDE cache

---

### Issue: "Port 5173 already in use"

**Cause**: Another process using the port.

**Solution**:
```bash
# On Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or just use a different port
npm run dev -- --port 3000
```

---

### Issue: "Better Auth session not persisting"

**Possible Causes**:
1. Cookies blocked
2. Wrong domain
3. Secure cookies in development

**Solutions**:
1. Check browser cookie settings
2. Make sure you're on localhost
3. Check `NODE_ENV` is not set to production in development

---

### Issue: "Admin operations not working"

**Possible Causes**:
1. Not logged in as admin
2. User role not set correctly

**Solutions**:
1. Check your user role in database
2. Run: `npm run db:seed` to create admin user
3. Or manually update role in database:
```sql
UPDATE user SET role = 'admin' WHERE email = 'your@email.com';
```

---

### Issue: "Bulk operations not appearing"

**Cause**: Components not integrated yet.

**Solution**: The components are created but need to be integrated into the users page. Check `app/components/users/BulkActions.tsx` and `app/components/users/UserSearch.tsx`.

---

## 🔍 Debugging Tips

### Check Database:
```bash
# Open SQLite database
sqlite3 ./data/auth.db

# List tables
.tables

# Check user table
SELECT * FROM user;

# Check twoFactor table
SELECT * FROM twoFactor;

# Check sessions
SELECT * FROM session;

# Exit
.quit
```

### Check Logs:
- Browser console (F12)
- Terminal where dev server is running
- Network tab in browser dev tools

### Verify Configuration:
```bash
# Check if migration ran
npm run db:migrate

# Check if dependencies installed
npm list @radix-ui/react-tabs
npm list @radix-ui/react-dropdown-menu

# Check TypeScript
npm run typecheck
```

---

## 🆘 Still Having Issues?

### Steps to Take:
1. **Check all documentation files**:
   - `FINAL_SETUP_GUIDE.md`
   - `DATABASE_SETUP.md`
   - `WORKING_FEATURES.md`

2. **Verify setup**:
   ```bash
   # Clean install
   rm -rf node_modules
   npm install
   
   # Run migration
   npm run db:migrate
   
   # Start fresh
   npm run dev
   ```

3. **Check Better Auth docs**:
   - https://better-auth.com/docs
   - https://better-auth.com/docs/plugins/2fa
   - https://better-auth.com/docs/plugins/multi-session

4. **Reset database** (if needed):
   ```bash
   # Backup first!
   cp ./data/auth.db ./data/auth.db.backup
   
   # Reset
   npm run db:reset
   npm run db:seed
   npm run db:migrate
   ```

---

## ✅ Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Check dependencies
npm list better-auth

# 2. Check database
sqlite3 ./data/auth.db ".tables"

# 3. Check TypeScript
npm run typecheck

# 4. Start server
npm run dev
```

If all commands succeed, your setup is correct!

---

## 📞 Getting Help

### Before Asking for Help:
1. ✅ Read this troubleshooting guide
2. ✅ Check browser console for errors
3. ✅ Check terminal for errors
4. ✅ Try restarting dev server
5. ✅ Try clearing browser cache
6. ✅ Try running migration again

### When Asking for Help, Include:
- Error message (full text)
- Browser console output
- Terminal output
- Steps to reproduce
- What you've already tried

---

**Most issues can be solved by:**
1. Running the migration: `npm run db:migrate`
2. Restarting the dev server
3. Clearing browser cache

Good luck! 🚀
