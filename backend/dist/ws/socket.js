"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = registerSocketHandlers;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Message_1 = __importDefault(require("../models/Message"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
function registerSocketHandlers(io) {
    const userSockets = new Map(); // Store user socket mappings
    const userRooms = new Map(); // Store which rooms each user is in
    io.on('connection', (socket) => {
        console.log('[Socket] Client connected:', socket.id);
        let userId = null;
        // Authenticate user when they connect
        socket.on('authenticate', ({ token }) => {
            try {
                if (token) {
                    const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                    userId = payload.sub;
                    console.log('[Socket] User authenticated:', userId);
                    if (userId) {
                        userSockets.set(userId, socket.id);
                        console.log('[Socket] User socket mapped:', userId, '->', socket.id);
                        socket.emit('authenticated', { userId, socketId: socket.id }); // Send confirmation
                    }
                }
                else {
                    console.error('[Socket] No token provided');
                    socket.emit('auth_error', { message: 'No token provided' });
                }
            }
            catch (error) {
                console.error('[Socket] Authentication failed:', error);
                socket.emit('auth_error', { message: 'Authentication failed' });
            }
        });
        // Join a chat room
        socket.on('join_room', ({ roomId }) => {
            if (!userId) {
                console.error('[Socket] Cannot join room - user not authenticated');
                return;
            }
            console.log('[Socket] User', userId, 'joining room:', roomId);
            // Leave previous rooms
            const currentRooms = userRooms.get(userId) || new Set();
            currentRooms.forEach(room => {
                socket.leave(room);
                console.log('[Socket] Left room:', room);
            });
            // Join new room
            socket.join(roomId);
            currentRooms.clear();
            currentRooms.add(roomId);
            userRooms.set(userId, currentRooms);
            console.log('[Socket] User', userId, 'joined room:', roomId);
            socket.emit('room_joined', { roomId });
            // Get room info
            const room = io.sockets.adapter.rooms.get(roomId);
            const userCount = room ? room.size : 0;
            console.log('[Socket] Room', roomId, 'has', userCount, 'clients');
            // Notify all users in the room about the new user
            io.to(roomId).emit('user_joined_room', { userId, userCount });
        });
        // Handle direct chat messages
        socket.on('direct_message', async ({ message }) => {
            try {
                console.log('[Socket] Direct message received from user:', userId);
                console.log('[Socket] Message details:', {
                    recipient: message.recipient,
                    hasContent: !!message.content,
                    hasIv: !!message.iv,
                    timestamp: message.timestamp
                });
                if (!message || !message.recipient) {
                    console.error('[Socket] Invalid message format:', message);
                    socket.emit('error', { message: 'Invalid message format' });
                    return;
                }
                // Create a unique room ID for the two users
                const roomId = [userId, message.recipient].sort().join('_');
                console.log('[Socket] Broadcasting direct message to room:', roomId);
                // Make sure both users are in the room
                const recipientSocketId = userSockets.get(message.recipient);
                if (recipientSocketId) {
                    // Add recipient to the room if not already there
                    io.sockets.sockets.get(recipientSocketId)?.join(roomId);
                }
                // Store message in database
                try {
                    await Message_1.default.create({
                        sender: userId,
                        receiver: message.recipient,
                        ciphertext: message.content,
                        iv: message.iv,
                        authTag: message.authTag
                    });
                    console.log('[Socket] Direct message stored in database');
                }
                catch (error) {
                    console.error('[Socket] Failed to store direct message:', error);
                }
                // Broadcast to all users in the room (including sender for confirmation)
                io.to(roomId).emit('message', {
                    sender: userId,
                    content: message.content,
                    iv: message.iv,
                    timestamp: message.timestamp
                });
                console.log('[Socket] Direct message broadcasted to room:', roomId);
            }
            catch (error) {
                console.error('[Socket] Error handling direct message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle room chat messages
        socket.on('room_message', async ({ message }) => {
            try {
                console.log('[Socket] Room message received from user:', userId, 'Room ID:', message.roomId);
                console.log('[Socket] Message details:', {
                    roomId: message.roomId,
                    hasContent: !!message.content,
                    hasIv: !!message.iv,
                    timestamp: message.timestamp
                });
                if (!message || !message.roomId) {
                    console.error('[Socket] Invalid room message format:', message);
                    socket.emit('error', { message: 'Invalid room message format' });
                    return;
                }
                console.log('[Socket] Broadcasting room message to room:', message.roomId);
                // Make sure sender is in the room
                socket.join(message.roomId);
                // Store message in database
                try {
                    await Message_1.default.create({
                        sender: userId,
                        roomId: message.roomId,
                        ciphertext: message.content,
                        iv: message.iv,
                        authTag: message.authTag
                    });
                    console.log('[Socket] Room message stored in database');
                }
                catch (error) {
                    console.error('[Socket] Failed to store room message:', error);
                }
                // Broadcast to all users in the room
                io.to(message.roomId).emit('message', {
                    sender: userId,
                    content: message.content,
                    iv: message.iv,
                    timestamp: message.timestamp,
                    roomId: message.roomId
                });
                console.log('[Socket] Room message broadcasted to room:', message.roomId);
            }
            catch (error) {
                console.error('[Socket] Error handling room message:', error);
                socket.emit('error', { message: 'Failed to send room message' });
            }
        });
        // Handle key sharing between users
        socket.on('share_key', ({ peerId, keyHex, qber, eveDetected }) => {
            try {
                console.log('[Socket] Key sharing request from user:', userId, 'to peer:', peerId);
                if (!peerId || !keyHex) {
                    console.error('[Socket] Invalid key sharing format:', { peerId, hasKeyHex: !!keyHex });
                    socket.emit('error', { message: 'Invalid key sharing format' });
                    return;
                }
                // Find the peer's socket
                const peerSocketId = userSockets.get(peerId);
                if (!peerSocketId) {
                    console.log('[Socket] Peer not online:', peerId);
                    socket.emit('error', { message: 'Peer is not online' });
                    return;
                }
                // Send the key to the peer
                io.to(peerSocketId).emit('key_shared', {
                    peerId: userId,
                    keyHex,
                    qber,
                    eveDetected
                });
                console.log('[Socket] Key shared successfully with peer:', peerId);
            }
            catch (error) {
                console.error('[Socket] Error handling key sharing:', error);
                socket.emit('error', { message: 'Failed to share key' });
            }
        });
        // Handle room key sharing
        socket.on('share_room_key', ({ roomId, keyHex, qber, eveDetected }) => {
            try {
                console.log('[Socket] Room key sharing request from user:', userId, 'for room:', roomId);
                if (!roomId || !keyHex) {
                    console.error('[Socket] Invalid room key sharing format:', { roomId, hasKeyHex: !!keyHex });
                    socket.emit('error', { message: 'Invalid room key sharing format' });
                    return;
                }
                // Send the key to all users in the room
                io.to(roomId).emit('key_shared', {
                    roomId,
                    keyHex,
                    qber,
                    eveDetected
                });
                console.log('[Socket] Room key shared successfully with room:', roomId);
            }
            catch (error) {
                console.error('[Socket] Error handling room key sharing:', error);
                socket.emit('error', { message: 'Failed to share room key' });
            }
        });
        // Leave room
        socket.on('leave_room', ({ roomId }) => {
            if (!userId)
                return;
            console.log('[Socket] User', userId, 'leaving room:', roomId);
            socket.leave(roomId);
            const currentRooms = userRooms.get(userId);
            if (currentRooms) {
                currentRooms.delete(roomId);
                if (currentRooms.size === 0) {
                    userRooms.delete(userId);
                }
            }
            console.log('[Socket] User', userId, 'left room:', roomId);
        });
        socket.on('disconnect', () => {
            console.log('[Socket] Client disconnected:', socket.id, 'User:', userId);
            if (userId) {
                userSockets.delete(userId);
                userRooms.delete(userId);
                console.log('[Socket] User socket mapping and rooms removed:', userId);
            }
        });
    });
}
