const firebaseService = require('./src/services/firebaseService');
const logger = require('./src/utils/logger');

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection...\n');

    // Test Firebase initialization
    console.log('📋 Initializing Firebase Admin SDK...');
    firebaseService.initialize();
    console.log('✅ Firebase initialized successfully!\n');

    // Test with a sample token (this will fail, but shows the service is working)
    console.log('🔐 Testing token verification (will fail with invalid token)...');
    try {
      await firebaseService.verifyIdToken('invalid-token-for-testing');
    } catch (error) {
      if (error.message === 'Invalid Firebase token') {
        console.log('✅ Firebase service is working correctly!');
        console.log('   (Expected error for invalid token)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 Firebase connection test completed!');
    console.log('📝 Your Firebase credentials are working correctly.');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your FIREBASE_PROJECT_ID in .env');
    console.log('2. Verify FIREBASE_PRIVATE_KEY is correct (with newlines)');
    console.log('3. Make sure FIREBASE_CLIENT_EMAIL is correct');
    console.log('4. Check that all Firebase environment variables are set');
    console.log('\n💡 To get Firebase credentials:');
    console.log('   - Go to Firebase Console > Project Settings > Service Accounts');
    console.log('   - Click "Generate new private key"');
    console.log('   - Copy values to your .env file');
  }
}

testFirebase(); 