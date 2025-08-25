# Quantum Key Distribution Chat Application

A secure chat application that uses Quantum Key Distribution (BB84 protocol) to establish encryption keys between users.

## Features

- **Quantum Key Distribution**: Implements BB84 protocol for secure key generation
- **End-to-End Encryption**: Messages are encrypted using AES-256-GCM
- **Real-time Chat**: WebSocket-based real-time messaging
- **User Authentication**: JWT-based user authentication system
- **Eve Attack Simulation**: Option to simulate eavesdropper attacks

## Project Structure

```
quantum_project/
├── backend/          # Node.js + Express backend
├── frontend/         # React + Vite frontend
├── db/              # Database setup and documentation
└── README.md        # This file
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or accessible)
- npm or yarn

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb://127.0.0.1:27017/quantum_chat
JWT_SECRET=your_secret_key_here
PORT=4000
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_BASE=http://localhost:4000
VITE_WS_BASE=http://localhost:4000
```

Start the frontend:
```bash
npm run dev
```

### 3. Database Setup

Ensure MongoDB is running and accessible at the URI specified in your backend `.env` file.

## Testing the Application

### 1. Test Backend

```bash
cd backend
node ../test_backend.js
```

### 2. Test Frontend

1. Open http://localhost:5173 in your browser
2. Register a new user account
3. Open another browser/incognito window and register another user
4. Log in with both users
5. Start a QKD session between the users
6. Send encrypted messages

## How It Works

1. **User Registration/Login**: Users create accounts and authenticate
2. **QKD Key Exchange**: Users perform BB84 protocol to generate a shared secret key
3. **Message Encryption**: Messages are encrypted using AES-256-GCM with the QKD key
4. **Secure Communication**: Encrypted messages are sent via WebSocket
5. **Message Decryption**: Recipients decrypt messages using the shared key

## Troubleshooting

### Common Issues

1. **Messages not sending**: Check that QKD has been completed and a key is established
2. **Users not showing**: Ensure the backend is running and MongoDB is accessible
3. **Socket connection issues**: Check that the WebSocket URL is correct in frontend config

### Debug Mode

The application includes extensive logging. Check the browser console and backend terminal for detailed information about:
- QKD key generation steps
- Message encryption/decryption
- Socket connections
- API requests

## Security Features

- **Quantum-resistant**: Uses BB84 protocol for key generation
- **Eavesdropper Detection**: QBER monitoring to detect interception attempts
- **End-to-End Encryption**: Messages are encrypted client-side
- **Secure Key Exchange**: Keys are never transmitted over the network

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/users` - Get all users (authenticated)
- `GET /api/messages/:peerId` - Get chat history
- `POST /api/messages` - Send a message
- `POST /api/qkd/bb84` - Start BB84 protocol

## Contributing

This is a demonstration project for quantum cryptography concepts. Feel free to experiment and improve the implementation!


