console.log('🚀 Quantum Chat Application - COMPLETE DEBUGGING GUIDE');
console.log('=====================================================\n');

console.log('🔍 STEP 1: VERIFY MONGODB');
console.log('   - Make sure MongoDB is running');
console.log('   - Check connection: mongodb://127.0.0.1:27017');
console.log('   - Database should be: quantum_chat\n');

console.log('🔍 STEP 2: BACKEND SETUP');
console.log('   cd backend');
console.log('   npm install');
console.log('   Create .env file with:');
console.log('     MONGO_URI=mongodb://127.0.0.1:27017/quantum_chat');
console.log('     JWT_SECRET=your_secret_key_here');
console.log('     PORT=4000');
console.log('   npm run dev');
console.log('   ✅ Should see: "Backend listening on :4000"');
console.log('   ✅ Should see: "Mongo connected"\n');

console.log('🔍 STEP 3: FRONTEND SETUP');
console.log('   cd frontend');
console.log('   npm install');
console.log('   Create .env file with:');
console.log('     VITE_API_BASE=http://localhost:4000');
console.log('     VITE_WS_BASE=http://localhost:4000');
console.log('   npm run dev');
console.log('   ✅ Should see: "Local: http://localhost:5173"\n');

console.log('🔍 STEP 4: TESTING THE APPLICATION');
console.log('   1. Open http://localhost:5173 in Browser 1');
console.log('   2. Open http://localhost:5173 in Browser 2 (incognito)');
console.log('   3. Register user1 (e.g., "alice") in Browser 1');
console.log('   4. Register user2 (e.g., "bob") in Browser 2');
console.log('   5. Both users should see each other in sidebar');
console.log('   6. Click on a user to start chat');
console.log('   7. Click "Start QKD" to establish secure connection');
console.log('   8. Send messages - they should appear in real-time!\n');

console.log('🔍 STEP 5: DEBUGGING CHECKLIST');
console.log('   ✅ Backend running on port 4000');
console.log('   ✅ Frontend running on port 5173');
console.log('   ✅ MongoDB connected');
console.log('   ✅ Users can register and login');
console.log('   ✅ Users appear in each other\'s sidebar');
console.log('   ✅ Socket connection established (green dot)');
console.log('   ✅ Room ID is displayed');
console.log('   ✅ QKD key is generated');
console.log('   ✅ Messages are sent and received\n');

console.log('🔍 STEP 6: TROUBLESHOOTING');
console.log('   If messages don\'t appear:');
console.log('   1. Check browser console for errors');
console.log('   2. Check backend terminal for socket logs');
console.log('   3. Verify both users are in the same room');
console.log('   4. Ensure QKD is completed before messaging');
console.log('   5. Check if socket shows green dot (connected)');
console.log('   6. Verify room ID is displayed');
console.log('   7. Try clicking "Refresh Users" button\n');

console.log('🔍 STEP 7: EXPECTED LOGS');
console.log('   Backend should show:');
console.log('     [Socket] Client connected: [socket-id]');
console.log('     [Socket] User authenticated: [user-id]');
console.log('     [Socket] Client joined room: [room-id]');
console.log('     [Socket] Room [room-id] has 2 clients');
console.log('     [Socket] Broadcasting message to room: [room-id]');
console.log('');
console.log('   Frontend should show:');
console.log('     [Socket] Connected');
console.log('     [Socket] Successfully joined room: [room-id]');
console.log('     [ChatPage] Message saved: [message-data]');
console.log('     [ChatPage] Emitting to socket, roomId: [room-id]');
console.log('     [ChatPage] Received message from socket: [message-data]\n');

console.log('🎯 KEY POINTS TO REMEMBER:');
console.log('   1. BOTH users must be logged in');
console.log('   2. BOTH users must join the same room');
console.log('   3. QKD must be completed BEFORE sending messages');
console.log('   4. Socket must show green dot (connected)');
console.log('   5. Room ID must be displayed');
console.log('   6. Check console logs for any errors\n');

console.log('🚨 COMMON ISSUES:');
console.log('   ❌ "Users not showing" → Check backend logs, verify MongoDB');
console.log('   ❌ "Socket not connecting" → Check VITE_WS_BASE in frontend .env');
console.log('   ❌ "Messages not sending" → Verify QKD is completed');
console.log('   ❌ "Room not joining" → Check backend socket logs');
console.log('   ❌ "Authentication failed" → Check JWT_SECRET in backend .env\n');

console.log('🎉 SUCCESS INDICATORS:');
console.log('   ✅ Green socket dot');
console.log('   ✅ Room ID displayed');
console.log('   ✅ Users in sidebar');
console.log('   ✅ QKD key generated');
console.log('   ✅ Real-time message delivery');
console.log('   ✅ Messages appear on both screens\n');
