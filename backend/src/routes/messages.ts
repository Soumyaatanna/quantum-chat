import { Router } from 'express';
import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

router.get('/:peerId', authMiddleware, async (req: any, res) => {
  const { peerId } = req.params;
  const userId = req.userId;
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: peerId },
      { sender: peerId, receiver: userId },
    ],
  }).sort({ createdAt: 1 });
  res.json(messages);
});

router.post('/', authMiddleware, async (req: any, res) => {
  const { receiver, ciphertext, iv, authTag } = req.body || {};
  const message = await Message.create({ sender: req.userId, receiver, ciphertext, iv, authTag });
  res.json(message);
});

export default router;


