# Calendar Sync API Documentation

## Overview

The Calendar Sync API allows frontend applications to synchronize calendar events with the backend database. This system supports storing, retrieving, and managing calendar events for authenticated users.

## Database Schema

### Calendar Events Table

```sql
CREATE TABLE calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  calendar_id VARCHAR(255) NOT NULL,
  calendar_name VARCHAR(255) NOT NULL,
  firebase_uid VARCHAR(128) NOT NULL,
  fetched_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_user (event_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_event_id (event_id),
  INDEX idx_calendar_id (calendar_id),
  INDEX idx_firebase_uid (firebase_uid),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date)
);
```

## API Endpoints

### 1. Sync Calendar Events

**POST** `/api/calendar/sync`

Synchronizes calendar events from the frontend to the backend database.

#### Request Body

```json
{
  "events": [
    {
      "id": "2A6C181E-E05B-4EC9-A0C9-FC7CE6F4DD96",
      "title": "Team Meeting",
      "startDate": "2025-08-10T23:00:00.000Z",
      "endDate": "2025-08-11T00:00:00.000Z",
      "isAllDay": false,
      "calendarId": "A68A1CD0-42B0-4EED-B5D2-245243247BC6",
      "calendarName": "Work",
      "userId": "rf9TtlsITXXcR2C2LHBh8W3VsEu2",
      "fetchedAt": "2025-08-10T18:55:41.749Z"
    }
  ],
  "userId": "rf9TtlsITXXcR2C2LHBh8W3VsEu2",
  "timestamp": "2025-08-10T18:55:51.751Z",
  "source": "calendar_sync"
}
```

#### Response

```json
{
  "success": true,
  "message": "Successfully synced 1 calendar events",
  "data": {
    "success": true,
    "message": "Successfully synced 1 calendar events",
    "eventsCount": 1,
    "timestamp": "2025-08-10T19:00:00.000Z"
  }
}
```

### 2. Get Calendar Events

**GET** `/api/calendar/events`

Retrieves calendar events for the authenticated user.

#### Query Parameters

- `startDate` (optional): Filter events from this date (ISO string)
- `endDate` (optional): Filter events until this date (ISO string)
- `calendarId` (optional): Filter by specific calendar ID

#### Response

```json
{
  "success": true,
  "message": "Calendar events retrieved successfully",
  "data": {
    "events": [
      {
        "id": 1,
        "event_id": "2A6C181E-E05B-4EC9-A0C9-FC7CE6F4DD96",
        "user_id": 1,
        "title": "Team Meeting",
        "start_date": "2025-08-10T23:00:00.000Z",
        "end_date": "2025-08-11T00:00:00.000Z",
        "is_all_day": false,
        "calendar_id": "A68A1CD0-42B0-4EED-B5D2-245243247BC6",
        "calendar_name": "Work",
        "firebase_uid": "rf9TtlsITXXcR2C2LHBh8W3VsEu2",
        "fetched_at": "2025-08-10T18:55:41.749Z",
        "created_at": "2025-08-10T19:00:00.000Z",
        "updated_at": "2025-08-10T19:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### 3. Get Events by Date Range

**GET** `/api/calendar/events/range`

Retrieves calendar events within a specific date range.

#### Query Parameters

- `startDate` (required): Start date (ISO string)
- `endDate` (required): End date (ISO string)
- `calendarId` (optional): Filter by specific calendar ID

#### Response

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [...],
    "count": 5,
    "startDate": "2025-08-10T00:00:00.000Z",
    "endDate": "2025-08-17T23:59:59.999Z"
  }
}
```

### 4. Get Upcoming Events

**GET** `/api/calendar/upcoming`

Retrieves upcoming calendar events for the next N days.

#### Query Parameters

- `days` (optional): Number of days to look ahead (default: 7)

#### Response

```json
{
  "success": true,
  "message": "Upcoming events retrieved successfully",
  "data": {
    "events": [...],
    "count": 3,
    "days": 7
  }
}
```

### 5. Get Calendar Statistics

**GET** `/api/calendar/stats`

Retrieves statistics about the user's calendar events.

#### Response

```json
{
  "success": true,
  "message": "Calendar statistics retrieved successfully",
  "data": {
    "totalEvents": 25,
    "calendars": {
      "Work": 15,
      "Personal": 10
    },
    "upcomingEvents": 8,
    "pastEvents": 17
  }
}
```

### 6. Delete Calendar Event

**DELETE** `/api/calendar/events/:eventId`

Deletes a specific calendar event.

#### Response

```json
{
  "success": true,
  "message": "Calendar event deleted successfully",
  "data": {
    "success": true,
    "message": "Calendar event deleted successfully"
  }
}
```

## Authentication

All calendar endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: User or event not found
- `500 Internal Server Error`: Server-side error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Sync calendar events
const syncEvents = async (events, userId) => {
  const response = await fetch('/api/calendar/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      events,
      userId,
      timestamp: new Date().toISOString(),
      source: 'calendar_sync'
    })
  });
  
  return response.json();
};

// Get upcoming events
const getUpcomingEvents = async (days = 7) => {
  const response = await fetch(`/api/calendar/upcoming?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Testing

Use the provided test script to verify the API functionality:

```bash
node test-calendar-sync.js
```

## Database Migration

To set up the calendar events table, run the migration:

```bash
node src/database/migrations/run-migrations.js
```

This will create the `calendar_events` table with all necessary indexes and constraints.

## Notes

- Events are uniquely identified by the combination of `event_id` and `user_id`
- The sync operation replaces all existing events for a user with the new events
- All timestamps are stored in UTC format
- The system supports multiple calendars per user
- Events are automatically cleaned up when a user is deleted (CASCADE)
