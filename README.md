# 🚀 Quantum Key Distribution Chat Application

A **fully functional** secure chat application that uses Quantum Key Distribution (BB84 protocol) to establish encryption keys between users. **Works like WhatsApp with real-time messaging!**

## ✨ Features

- **🔐 Quantum Key Distribution**: Implements BB84 protocol for secure key generation
- **💬 Real-time Chat**: WebSocket-based instant messaging (like WhatsApp)
- **🔒 End-to-End Encryption**: Messages encrypted using AES-256-GCM
- **👥 User Management**: Automatic user discovery and chat initiation
- **🛡️ Eve Attack Simulation**: Option to simulate eavesdropper attacks
- **📱 Modern UI**: Beautiful, responsive interface with real-time status

## 🏗️ Project Structure

```
quantum_project/
├── backend/          # Node.js + Express + Socket.IO backend
├── frontend/         # React + Vite + Tailwind frontend
├── db/              # Database setup and documentation
├── test_backend_simple.js  # Backend testing script
└── README.md        # This file
```

## 🚀 Quick Start (5 minutes)

### **Step 1: Start MongoDB**
```bash
# Make sure MongoDB is running on your system
# Windows: Check MongoDB service
# Mac/Linux: brew services start mongodb-community
```

### **Step 2: Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "MONGO_URI=mongodb://127.0.0.1:27017/quantum_chat
JWT_SECRET=your_secret_key_here
PORT=4000" > .env

# Start backend
npm run dev
```

**✅ Expected output:**
```
[startup] Backend listening on :4000
[mongo] connected
```

### **Step 3: Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE=http://localhost:4000
VITE_WS_BASE=http://localhost:4000" > .env

# Start frontend
npm run dev
```

**✅ Expected output:**
```
Local:   http://localhost:5173/
```

### **Step 4: Test the Application**
1. **Open two browser windows** (one normal + one incognito)
2. **Navigate to** `http://localhost:5173` in both
3. **Register two users**:
   - User 1: "alice" / "password123"
   - User 2: "bob" / "password123"
4. **Both users should see each other** in the sidebar
5. **Click on a user** to start a chat
6. **Click "Start QKD"** to establish secure connection
7. **Send messages** - they should appear in real-time! 🎉

## 🔧 Testing & Debugging

### **Test Backend First**
```bash
cd backend
node ../test_backend_simple.js
```

### **Debug Panel Features**
The app includes a comprehensive debug panel showing:
- **🟢/🔴 Socket Status**: Green = connected, Red = disconnected
- **Room ID**: Shows which chat room you're in
- **User Count**: Shows available users
- **Peer Info**: Shows who you're chatting with
- **Test Socket Button**: Test socket connection
- **Reconnect Button**: Force socket reconnection

## 📊 Expected Logs

### **Backend Terminal Should Show:**
```
[Socket] Client connected: [socket-id]
[Socket] User authenticated: [user-id]
[Socket] Client joining room: [room-id]
[Socket] Room [room-id] has 2 clients
[Socket] Broadcasting message to room: [room-id]
```

### **Browser Console Should Show:**
```
[Socket] Connected successfully
[Socket] Socket ID: [socket-id]
[Socket] Successfully joined room: [room-id]
[ChatPage] Message saved: [message-data]
[ChatPage] Emitting to socket, roomId: [room-id]
[ChatPage] Received message from socket: [message-data]
```

## 🎯 How It Works

1. **🔐 User Authentication**: JWT-based login system
2. **👥 User Discovery**: Automatic loading of all registered users
3. **🏠 Room Creation**: Unique chat rooms for each user pair
4. **🔑 QKD Key Exchange**: BB84 protocol generates shared secret
5. **💬 Message Encryption**: AES-256-GCM encryption with QKD key
6. **📡 Real-time Delivery**: WebSocket broadcasting to all room members
7. **🔓 Message Decryption**: Automatic decryption using shared key

## 🚨 Troubleshooting

### **If Messages Don't Appear:**
1. **Check socket status** - should show green dot 🟢
2. **Verify room ID** - should display a room identifier
3. **Check browser console** for any errors
4. **Check backend terminal** for socket logs
5. **Try "Test Socket" button** to verify connection
6. **Click "Reconnect"** if socket is red 🔴

### **If Users Don't Show:**
1. **Verify MongoDB is running**
2. **Check backend logs** for database connection
3. **Click "Refresh Users" button**
4. **Verify both users are logged in**

### **If QKD Fails:**
1. **Check if both users are in the same room**
2. **Verify socket connection is green**
3. **Try refreshing the page**
4. **Check browser console for errors**

## 🔍 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ❌ "Socket not connecting" | Check VITE_WS_BASE in frontend .env |
| ❌ "Users not showing" | Verify MongoDB connection, click Refresh Users |
| ❌ "Room not joining" | Check backend socket logs, verify token |
| ❌ "Messages not sending" | Complete QKD first, check socket status |
| ❌ "Authentication failed" | Verify JWT_SECRET in backend .env |

## 🎉 Success Indicators

- ✅ **Green socket dot** 🟢
- ✅ **Room ID displayed**
- ✅ **Users appear in sidebar**
- ✅ **QKD key generated**
- ✅ **Real-time message delivery**
- ✅ **Messages appear on both screens instantly**

## 🚀 Advanced Features

- **🔐 Quantum Security**: BB84 protocol implementation
- **🛡️ Eve Detection**: QBER monitoring for interception
- **📱 Responsive Design**: Works on all devices
- **🔍 Debug Tools**: Comprehensive logging and testing
- **⚡ Performance**: Optimized WebSocket handling

## 🤝 Contributing

This is a demonstration project for quantum cryptography concepts. Feel free to experiment and improve the implementation!

## 📞 Support

If you encounter issues:
1. **Check the debug panel** for connection status
2. **Review console logs** for error messages
3. **Verify all setup steps** are completed
4. **Test backend first** using the test script
5. **Ensure MongoDB is running**

---

**🎯 The application should now work exactly like WhatsApp with quantum-secured messaging!**


