import { Router } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import Room from '../models/Room';
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

// Get direct messages between two users
router.get('/direct/:peerId', authMiddleware, async (req: any, res) => {
  try {
    const { peerId } = req.params;
    const userId = req.userId;
    
    if (!peerId) {
      return res.status(400).json({ error: 'peerId is required' });
    }
    
    console.log('[messages.get] Fetching direct messages between:', userId, 'and', peerId);
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: peerId },
        { sender: peerId, receiver: userId },
      ],
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');
    
    console.log('[messages.get] Found', messages.length, 'messages');
    res.json(messages);
  } catch (error: any) {
    console.error('[messages.get] error:', error);
    res.status(500).json({ error: 'failed_to_fetch_messages', detail: error?.message || String(error) });
  }
});

// Get room messages
router.get('/room/:roomId', authMiddleware, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;
    
    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' });
    }
    
    // Check if user is member of the room
    const room = await Room.findOne({
      _id: roomId,
      members: userId
    });
    
    if (!room) {
      return res.status(403).json({ error: 'not_member_of_room' });
    }
    
    console.log('[messages.get] Fetching room messages for room:', roomId);
    
    const messages = await Message.find({
      roomId: roomId
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username');
    
    console.log('[messages.get] Found', messages.length, 'room messages');
    res.json(messages);
  } catch (error: any) {
    console.error('[messages.get] error:', error);
    res.status(500).json({ error: 'failed_to_fetch_messages', detail: error?.message || String(error) });
  }
});

router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { receiver, roomId, ciphertext, iv, authTag } = req.body || {};
    
    console.log('[messages.post] Creating message:', { 
      sender: req.userId, 
      receiver, 
      roomId,
      hasCiphertext: !!ciphertext, 
      hasIv: !!iv,
      body: req.body
    });
    
    if (!ciphertext || !iv) {
      console.log('[messages.post] Validation failed:', { ciphertext: !!ciphertext, iv: !!iv });
      return res.status(400).json({ 
        error: 'bad_request',
        detail: 'ciphertext and iv are required',
        received: { ciphertext: !!ciphertext, iv: !!iv }
      });
    }
    
    // Check if it's a direct message or room message
    if (receiver && !roomId) {
      // Direct message
      if (typeof receiver !== 'string') {
        return res.status(400).json({ error: 'bad_request', detail: 'receiver must be a string user id' });
      }
      const receiverUser = await User.findById(receiver);
      if (!receiverUser) {
        console.log('[messages.post] Receiver not found:', receiver);
        return res.status(404).json({ error: 'receiver_not_found', detail: 'Receiver user does not exist' });
      }
      
      const message = await Message.create({ 
        sender: req.userId, 
        receiver, 
        ciphertext, 
        iv, 
        authTag 
      });
      
      console.log('[messages.post] Direct message created successfully:', message._id);
      await message.populate('sender', 'username');
      await message.populate('receiver', 'username');
      
      res.json(message);
    } else if (roomId && !receiver) {
      // Room message
      if (typeof roomId !== 'string') {
        return res.status(400).json({ error: 'bad_request', detail: 'roomId must be a string' });
      }
      
      // Check if user is member of the room
      const room = await Room.findOne({
        _id: roomId,
        members: req.userId
      });
      
      if (!room) {
        console.log('[messages.post] User not member of room:', roomId);
        return res.status(403).json({ error: 'not_member_of_room', detail: 'User is not a member of this room' });
      }
      
      const message = await Message.create({ 
        sender: req.userId, 
        roomId, 
        ciphertext, 
        iv, 
        authTag 
      });
      
      console.log('[messages.post] Room message created successfully:', message._id);
      await message.populate('sender', 'username');
      
      res.json(message);
    } else {
      return res.status(400).json({ 
        error: 'bad_request', 
        detail: 'Either receiver (for direct) or roomId (for room) must be provided, not both' 
      });
    }
  } catch (error: any) {
    console.error('[messages.post] error:', error);
    // Forward Mongoose validation/cast errors clearly
    const status = error?.name === 'ValidationError' || error?.name === 'CastError' ? 400 : 500;
    res.status(status).json({ error: 'failed_to_create_message', detail: error?.message || String(error) });
  }
});

export default router;


