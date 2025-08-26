const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testBackend() {
  try {
    console.log('🧪 Testing Backend Endpoints...\n');
    
    // Test 1: Health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', health.data);
    
    // Test 2: General test endpoint
    console.log('\n2️⃣ Testing general endpoint...');
    const test = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ Test endpoint passed:', test.data);
    
    // Test 3: Users endpoint (should fail without auth)
    console.log('\n3️⃣ Testing users endpoint without auth...');
    try {
      await axios.get(`${BASE_URL}/api/auth/users`);
      console.log('❌ Users endpoint should require auth');
    } catch (error) {
      console.log('✅ Users endpoint properly requires auth:', error.response.status);
    }
    
    console.log('\n🎉 Backend is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the frontend: cd frontend && npm run dev');
    console.log('   2. Open http://localhost:5173 in two browsers');
    console.log('   3. Register two users and test messaging');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check if backend is started: npm run dev');
    console.log('   3. Verify .env file exists in backend folder');
  }
}

testBackend();
