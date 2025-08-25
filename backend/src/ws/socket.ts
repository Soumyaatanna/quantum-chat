import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface JoinPayload { roomId: string; token?: string }
interface ChatPayload { roomId: string; message: any }

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Client connected:', socket.id);
    
    // Store user info in socket
    let userId: string | null = null;
    
    socket.on('join', ({ roomId, token }: JoinPayload) => {
      try {
        // Verify token and get user ID
        if (token) {
          const payload: any = jwt.verify(token, JWT_SECRET);
          userId = payload.sub;
          console.log('[Socket] User authenticated:', userId);
        }
        
        console.log('[Socket] Client joining room:', roomId, 'User:', userId);
        
        // Leave any previous rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
            console.log('[Socket] Left room:', room);
          }
        });
        
        // Join the new room
        socket.join(roomId);
        console.log('[Socket] Client joined room:', roomId);
        
        // Send confirmation to the client
        socket.emit('joined', { roomId, userId });
        
        // Get all clients in the room
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          console.log('[Socket] Room', roomId, 'has', room.size, 'clients');
        }
        
      } catch (error) {
        console.error('[Socket] Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('chat', ({ roomId, message }: ChatPayload) => {
      try {
        console.log('[Socket] Broadcasting message to room:', roomId, 'from user:', userId);
        
        // Broadcast to all clients in the room except sender
        socket.to(roomId).emit('chat', { message });
        console.log('[Socket] Message broadcasted to room:', roomId);
        
        // Also emit to sender for confirmation
        socket.emit('message_sent', { message });
        
        // Log room status
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          console.log('[Socket] Room', roomId, 'currently has', room.size, 'clients');
        }
        
      } catch (error) {
        console.error('[Socket] Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id, 'User:', userId);
    });
  });
}


