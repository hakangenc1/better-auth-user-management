# Async Function Fix - "users.filter is not a function"

## Error Fixed
```
TypeError: users.filter is not a function
at DashboardIndex (dashboard._index.tsx:23:19)
```

## Root Cause
The `getAllUsers()` function was changed from synchronous to async (to support dynamic database connections), but the dashboard index page wasn't updated to use `await`.

## Problem

### Before Fix
```typescript
// getAllUsers is now async (returns Promise)
export async function loader() {
  const users = getAllUsers(); // ❌ Missing await
  return { users }; // users is a Promise, not an array!
}

// Component tries to use users as array
const stats = {
  total: users.length, // ❌ Promise doesn't have .length
  active: users.filter(...) // ❌ Promise doesn't have .filter
};
```

## Solution

### After Fix
```typescript
export async function loader() {
  const users = await getAllUsers(); // ✅ Properly await
  return { users }; // users is now an array
}

// Component works correctly
const stats = {
  total: users.length, // ✅ Array has .length
  active: users.filter(...) // ✅ Array has .filter
};
```

## Files Fixed

1. **app/routes/dashboard._index.tsx**
   - Added `await` to `getAllUsers()` call in loader

2. **app/routes/dashboard.users.tsx**
   - Already fixed in previous update

## Why This Happened

When we made `getAllUsers()` support both SQLite and PostgreSQL, we had to:
1. Load configuration (async operation)
2. Create database adapter (async operation)
3. Query database (async for PostgreSQL)

This required changing the function signature from:
```typescript
export function getAllUsers(): User[]
```

To:
```typescript
export async function getAllUsers(): Promise<User[]>
```

All callers must now use `await` to get the actual array.

## Verification

After fix, the dashboard should:
- ✅ Display total users count
- ✅ Show active users count
- ✅ Show banned users count
- ✅ Show admin count
- ✅ Display user status chart
- ✅ No "filter is not a function" error

## Related Changes

This is part of the larger fix to support dynamic database connections:
- `getAllUsers()` now reads from configured database
- Works with both SQLite and PostgreSQL
- All callers must use `await`

## Testing Checklist

- [x] Dashboard index loads without errors
- [x] User statistics display correctly
- [x] User status chart renders
- [x] No console errors
- [x] Works with SQLite
- [x] Works with PostgreSQL

## Summary

The error was caused by forgetting to `await` an async function. The fix was simple: add `await` to the `getAllUsers()` call in the dashboard index loader.

**Key Takeaway:** When a function becomes async, all its callers must use `await`!
