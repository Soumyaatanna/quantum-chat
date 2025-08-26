const io = require('socket.io-client');

console.log('🧪 Testing Socket Connection for Real-time Messaging');
console.log('==================================================\n');

const BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'test_token_123'; // This will fail auth but we can see connection

async function testSocketConnection() {
  try {
    console.log('🔌 Connecting to socket server...');
    const socket = io(BASE_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('   Socket ID:', socket.id);
      console.log('   Connected to:', BASE_URL);
      
      // Test authentication
      console.log('\n🔐 Testing authentication...');
      socket.emit('authenticate', { token: TEST_TOKEN });
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    
    socket.on('connect_error', (err) => {
      console.log('❌ Socket connection error:', err.message);
    });
    
    socket.on('authenticated', (data) => {
      console.log('✅ Authentication successful:', data);
    });
    
    socket.on('auth_error', (data) => {
      console.log('❌ Authentication failed (expected):', data.message);
    });
    
    socket.on('error', (data) => {
      console.log('❌ Socket error:', data.message);
    });
    
    // Test message sending
    setTimeout(() => {
      if (socket.connected) {
        console.log('\n📤 Testing message sending...');
        const testMessage = {
          _id: 'test_msg_123',
          sender: 'user1',
          receiver: 'user2',
          ciphertext: 'test_cipher',
          iv: 'test_iv',
          createdAt: new Date()
        };
        
        console.log('   Sending test message:', testMessage);
        socket.emit('chat', { message: testMessage });
        
        // Listen for confirmation
        socket.on('message_sent', (data) => {
          console.log('✅ Message sent confirmation received:', data);
        });
      }
    }, 2000);
    
    // Clean up after 5 seconds
    setTimeout(() => {
      console.log('\n🧹 Cleaning up...');
      socket.disconnect();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

console.log('📋 Test Steps:');
console.log('   1. Make sure backend is running: npm run dev (in backend folder)');
console.log('   2. Backend should show: "Backend listening on :4000"');
console.log('   3. Run this test: node test_socket_debug.js');
console.log('   4. Check backend terminal for socket logs');
console.log('\n🚀 Starting test...\n');

testSocketConnection();
