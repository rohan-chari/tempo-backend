const { parseCalendarIntent } = require('./src/services/calendarNlpService');

async function testNlpLogging() {
  console.log('=== Testing NLP Service with Enhanced Logging ===\n');

  const testMessages = [
    'Schedule lunch with John tomorrow at 1pm',
    'Book a meeting with the team next Friday at 3pm',
    'Set up a weekly standup every Monday at 9am',
    'Show me my calendar for next week',
  ];

  for (const message of testMessages) {
    console.log(`\n--- Testing: "${message}" ---`);
    try {
      const result = await parseCalendarIntent(message);
      console.log('✅ Success:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('Status:', error.status);
    }
    console.log('--- End Test ---\n');
  }
}

// Run the test
testNlpLogging().catch(console.error);
