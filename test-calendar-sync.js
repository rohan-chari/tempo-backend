const axios = require('axios');

// Test calendar sync payload
const testPayload = {
  "events": [
    {
      "id": "2A6C181E-E05B-4EC9-A0C9-FC7CE6F4DD96",
      "title": "Poop in nathan's bathroom",
      "startDate": "2025-08-10T23:00:00.000Z",
      "endDate": "2025-08-11T00:00:00.000Z",
      "isAllDay": false,
      "calendarId": "A68A1CD0-42B0-4EED-B5D2-245243247BC6",
      "calendarName": "Work",
      "userId": "rf9TtlsITXXcR2C2LHBh8W3VsEu2",
      "fetchedAt": "2025-08-10T18:55:41.749Z"
    },
    {
      "id": "2A6C181E-E05B-4EC9-A0C9-FC7CE6F4DD97",
      "title": "Team Meeting",
      "startDate": "2025-08-11T10:00:00.000Z",
      "endDate": "2025-08-11T11:00:00.000Z",
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
};

async function testCalendarSync() {
  try {
    console.log('Testing calendar sync...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    // Note: You'll need to get a valid JWT token from your auth endpoint first
    // For now, this is just a structure test
    const response = await axios.post('http://localhost:3000/api/calendar/sync', testPayload, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function testGetEvents() {
  try {
    console.log('\nTesting get calendar events...');
    
    const response = await axios.get('http://localhost:3000/api/calendar/events', {
      headers: {
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function testGetStats() {
  try {
    console.log('\nTesting get calendar stats...');
    
    const response = await axios.get('http://localhost:3000/api/calendar/stats', {
      headers: {
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('=== Calendar Sync API Tests ===\n');
  
  await testCalendarSync();
  await testGetEvents();
  await testGetStats();
  
  console.log('\n=== Tests completed ===');
}

runTests();
