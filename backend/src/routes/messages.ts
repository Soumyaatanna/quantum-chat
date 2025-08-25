import { Router } from 'express';
import Message from '../models/Message';
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
  try {
    const { peerId } = req.params;
    const userId = req.userId;
    
    if (!peerId) {
      return res.status(400).json({ error: 'peerId is required' });
    }
    
    console.log('[messages.get] Fetching messages between:', userId, 'and', peerId);
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: peerId },
        { sender: peerId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
    
    console.log('[messages.get] Found', messages.length, 'messages');
    res.json(messages);
  } catch (error: any) {
    console.error('[messages.get] error:', error);
    res.status(500).json({ error: 'failed_to_fetch_messages', detail: error.message });
  }
});

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { receiver, ciphertext, iv, authTag } = req.body || {};
    
    console.log('[messages.post] Creating message:', { 
      sender: req.userId, 
      receiver, 
      hasCiphertext: !!ciphertext, 
      hasIv: !!iv,
      body: req.body
    });
    
    if (!receiver || !ciphertext || !iv) {
      console.log('[messages.post] Validation failed:', { receiver: !!receiver, ciphertext: !!ciphertext, iv: !!iv });
      return res.status(400).json({ 
        error: 'receiver, ciphertext, and iv are required',
        received: { receiver: !!receiver, ciphertext: !!ciphertext, iv: !!iv }
      });
    }
    
    // Validate that receiver exists
    const User = require('../models/User').default;
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      console.log('[messages.post] Receiver not found:', receiver);
      return res.status(400).json({ error: 'receiver not found' });
    }
    
    const message = await Message.create({ 
      sender: req.userId, 
      receiver, 
      ciphertext, 
      iv, 
      authTag 
    });
    
    console.log('[messages.post] Message created successfully:', message._id);
    
    // Populate sender and receiver details for better response
    await message.populate('sender', 'username');
    await message.populate('receiver', 'username');
    
    res.json(message);
  } catch (error: any) {
    console.error('[messages.post] error:', error);
    res.status(500).json({ error: 'failed_to_create_message', detail: error.message });
  }
});

export default router;


