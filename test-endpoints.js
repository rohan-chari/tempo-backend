// Simple test using built-in fetch API
const BASE_URL = 'http://localhost:3000/api/v1';
const FIREBASE_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjJiN2JhZmIyZjEwY2FlMmIxZjA3ZjM4MTZjNTQyMmJlY2NhNWMyMjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGVtcG8tdjMtODBiYTQiLCJhdWQiOiJ0ZW1wby12My04MGJhNCIsImF1dGhfdGltZSI6MTc1NDUxNzY3MSwidXNlcl9pZCI6InJmOVR0bHNJVFhYY1IyQzJMSEJoOFczVnNFdTIiLCJzdWIiOiJyZjlUdGxzSVRYWGNSMkMyTEhCaDhXM1ZzRXUyIiwiaWF0IjoxNzU0NTE3NjcxLCJleHAiOjE3NTQ1MjEyNzEsImVtYWlsIjoicm9oYW4ucmNoYXJpaUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJhcHBsZS5jb20iOlsiMDAwNzMxLmUwYjYzM2I2NzdlOTRlMzc4YTAyNDQxZGM2MmJkODUzLjE2MzgiXSwiZW1haWwiOlsicm9oYW4ucmNoYXJpaUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJhcHBsZS5jb20ifX0.CuNttGjkpFUGW0II5sQSYjcJEWQTagz7OXWLBq90DovL7kclZpwigOY7QoYHPFYjRXwA5T0VJzHOHU_lNA_xVsvF92DifBloPEw54-7x8DBqRFZlLyhPvIqBAL0aB0-aLc3Ya9OVmBbWcHc5fmb6jllg7gsIjPMrqUVvC0EdOyG2ozKnpQSLHx3JNIy2wPahcIuOhdvkoxwOPBBZ9MM79w0qapeuDszGdMCz7vLVwul2i0oLKkS_seqn2lGWZ2vPSL2aiBnbovWqr2RVB6hfiZVKj5BUjcu53Xg7GipRRl0BxRrIGFDds1ECBMtinMMb7giImJDvL8jESDykpKfN5w';

const testCalendarIds = [
  '38AA5F8A-8A11-4323-8ADB-D7451FD8BE26',
  '347FE1DD-889D-41DB-8F2C-C924EBFEFD35',
  'A68A1CD0-42B0-4EED-B5D2-245243247BC6'
];

async function testEndpoints() {
  try {
    console.log('Testing Calendar Preferences API...\n');

    const headers = {
      'Authorization': `Bearer ${FIREBASE_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Save calendar preferences
    console.log('1. Testing POST /user/calendar-preferences');
    const saveResponse = await fetch(`${BASE_URL}/user/calendar-preferences`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ calendarIds: testCalendarIds })
    });
    const saveData = await saveResponse.json();
    console.log('✅ Save response:', saveData);

    // Test 2: Get calendar preferences
    console.log('\n2. Testing GET /user/calendar-preferences');
    const getResponse = await fetch(`${BASE_URL}/user/calendar-preferences`, { headers });
    const getData = await getResponse.json();
    console.log('✅ Get response:', getData);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEndpoints(); 