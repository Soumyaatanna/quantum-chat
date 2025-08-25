import { Server, Socket } from 'socket.io';

interface JoinPayload { roomId: string; token?: string }
interface ChatPayload { roomId: string; message: any }

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join', ({ roomId }: JoinPayload) => {
      socket.join(roomId);
    });

    socket.on('chat', ({ roomId, message }: ChatPayload) => {
      socket.to(roomId).emit('chat', { message });
    });

    socket.on('disconnect', () => {});
  });
}


