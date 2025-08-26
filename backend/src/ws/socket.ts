import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface ChatPayload { 
  message: any 
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function registerSocketHandlers(io: Server) {
  const userSockets = new Map<string, string>(); // Store user socket mappings
  const userRooms = new Map<string, Set<string>>(); // Store which rooms each user is in

  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Client connected:', socket.id);

    let userId: string | null = null;

    // Authenticate user when they connect
    socket.on('authenticate', ({ token }) => {
      try {
        if (token) {
          const payload: any = jwt.verify(token, JWT_SECRET);
          userId = payload.sub;
          console.log('[Socket] User authenticated:', userId);

          if (userId) {
            userSockets.set(userId, socket.id);
            console.log('[Socket] User socket mapped:', userId, '->', socket.id);
            socket.emit('authenticated', { userId, socketId: socket.id }); // Send confirmation
          }
        }
      } catch (error) {
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

    // Handle chat messages
    socket.on('chat', ({ message }: ChatPayload) => {
      try {
        console.log('[Socket] Chat message received from user:', userId, 'Message ID:', message._id);
        console.log('[Socket] Message details:', {
          sender: message.sender,
          receiver: message.receiver,
          hasCiphertext: !!message.ciphertext,
          hasIv: !!message.iv,
          timestamp: message.createdAt
        });

        if (!message || !message.receiver) {
          console.error('[Socket] Invalid message format:', message);
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }

        // Extract receiver ID - handle both string and object formats
        let receiverId: string;
        if (typeof message.receiver === 'string') {
          receiverId = message.receiver;
        } else if (message.receiver && typeof message.receiver === 'object' && message.receiver._id) {
          receiverId = message.receiver._id;
        } else {
          console.error('[Socket] Invalid receiver format:', message.receiver);
          socket.emit('error', { message: 'Invalid receiver format' });
          return;
        }

        // Create a unique room ID for the two users
        const roomId = [userId, receiverId].sort().join('_');
        
        console.log('[Socket] Broadcasting message to room:', roomId);
        console.log('[Socket] Room participants:', Array.from(io.sockets.adapter.rooms.get(roomId) || []));
        
        // Broadcast to all users in the room (including sender for confirmation)
        io.to(roomId).emit('chat', { message });
        console.log('[Socket] Message broadcasted to room:', roomId);
        
        // Send confirmation to sender
        socket.emit('message_sent', { message });
        
        // Log the broadcast for debugging
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          console.log('[Socket] Message sent to', room.size, 'clients in room', roomId);
        } else {
          console.log('[Socket] Warning: Room', roomId, 'does not exist or is empty');
        }
      } catch (error) {
        console.error('[Socket] Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
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
        
      } catch (error) {
        console.error('[Socket] Error handling key sharing:', error);
        socket.emit('error', { message: 'Failed to share key' });
      }
    });

    // Leave room
    socket.on('leave_room', ({ roomId }) => {
      if (!userId) return;
      
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


