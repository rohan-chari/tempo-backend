const databaseConnection = require('./src/database/connection');
const firebaseService = require('./src/services/firebaseService');
const logger = require('./src/utils/logger');

async function testConnections() {
  try {
    console.log('🔍 Testing connections...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    await databaseConnection.initialize();
    console.log('✅ Database connected successfully!\n');

    // Test Firebase initialization
    console.log('🔥 Testing Firebase initialization...');
    firebaseService.initialize();
    console.log('✅ Firebase initialized successfully!\n');

    console.log('🎉 All connections working! Your backend is ready.');
    
    // Close database connection
    await databaseConnection.close();
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your .env file has correct database credentials');
    console.log('3. Verify Firebase credentials are correct');
    console.log('4. Ensure the tempo_db database exists');
  }
}

testConnections(); 