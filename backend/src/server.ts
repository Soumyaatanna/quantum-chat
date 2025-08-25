import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

import authRouter from './routes/auth';
import qkdRouter from './routes/qkd';
import messageRouter from './routes/messages';
import { registerSocketHandlers } from './ws/socket';

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/qkd', qkdRouter);
app.use('/api/messages', messageRouter);

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*'} });
registerSocketHandlers(io);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quantum_chat';
const PORT = Number(process.env.PORT || 4000);

async function start() {
  console.log('[startup] Connecting to MongoDB...');
  mongoose.connection.on('connected', () => console.log('[mongo] connected'));
  mongoose.connection.on('error', (err) => console.error('[mongo] error', err));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));
  await mongoose.connect(MONGO_URI);
  console.log(`[startup] Mongo connected at ${MONGO_URI.split('@').pop()}`);
  server.listen(PORT, () => console.log(`[startup] Backend listening on :${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


