# Activity Tracking System

## Overview

The activity tracking system has been upgraded to use a persistent database instead of localStorage. This ensures that activity logs are never lost and remain consistent across all sessions.

## Features

- **Database-backed storage**: All activities are stored in SQLite database
- **Automatic sync**: Activities refresh every 30 seconds
- **Manual refresh**: Refresh button to get latest activities on demand
- **Persistent data**: Activities survive browser cache clears and page refreshes
- **Indexed queries**: Fast retrieval with database indexes on timestamp and user

## Database Schema

```sql
CREATE TABLE activity (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user TEXT NOT NULL,
  target TEXT,
  type TEXT NOT NULL,
  metadata TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
)

-- Indexes for performance
CREATE INDEX idx_activity_timestamp ON activity(timestamp DESC)
CREATE INDEX idx_activity_user ON activity(user)
```

## API Endpoints

### GET /api/activity

Fetch activities from the database.

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "activities": [
    {
      "id": "1234567890-abc123",
      "action": "Created user",
      "user": "admin@example.com",
      "target": "user@example.com",
      "type": "create",
      "metadata": null,
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/activity

Log a new activity to the database.

**Request Body:**
```json
{
  "action": "Created user",
  "user": "admin@example.com",
  "target": "user@example.com",
  "type": "create",
  "metadata": { "additional": "data" }
}
```

**Response:**
```json
{
  "success": true,
  "activity": {
    "id": "1234567890-abc123",
    "action": "Created user",
    "user": "admin@example.com",
    "target": "user@example.com",
    "type": "create",
    "metadata": { "additional": "data" },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Usage

### Logging Activities

```typescript
import { useActivity } from "~/contexts/ActivityContext";

function MyComponent() {
  const { logActivity } = useActivity();

  const handleAction = async () => {
    await logActivity({
      action: "Updated user role",
      user: currentUser.email,
      target: targetUser.email,
      type: "role",
      metadata: { newRole: "admin" }
    });
  };
}
```

### Displaying Activities

```typescript
import { useActivity } from "~/contexts/ActivityContext";

function ActivityList() {
  const { activities, refreshActivities, isLoading } = useActivity();

  return (
    <div>
      <button onClick={refreshActivities}>Refresh</button>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        activities.map(activity => (
          <div key={activity.id}>{activity.action}</div>
        ))
      )}
    </div>
  );
}
```

## Migration

To create the activity table, run:

```bash
npx tsx scripts/migrate-db.ts
```

This will:
1. Create the `activity` table
2. Create indexes for performance
3. Preserve all existing data

## Benefits

1. **Data Persistence**: Activities are never lost, even if browser cache is cleared
2. **Performance**: Database indexes ensure fast queries even with thousands of activities
3. **Scalability**: Can handle large volumes of activity data
4. **Reliability**: Database transactions ensure data integrity
5. **Real-time Updates**: Automatic refresh keeps all users in sync
6. **Audit Trail**: Complete history of all admin actions

## Activity Types

- `create`: User creation
- `delete`: User deletion
- `ban`: User banned
- `unban`: User unbanned
- `edit`: User information edited
- `role`: User role changed
