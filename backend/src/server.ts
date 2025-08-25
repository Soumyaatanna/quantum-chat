import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

import authRouter from './routes/auth.js';
import qkdRouter from './routes/qkd.js';
import messageRouter from './routes/messages.js';
import { registerSocketHandlers } from './ws/socket.js';

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
  await mongoose.connect(MONGO_URI);
  server.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


