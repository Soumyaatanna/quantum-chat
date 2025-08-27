import { Router, Request } from 'express';
import Room from '../models/Room';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

const router = Router();

// Get all rooms for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const rooms = await Room.find({
      members: req.user.id
    }).populate('members', 'username');
    
    res.json(rooms);
  } catch (error) {
    console.error('[Rooms] Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { name, members } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const room = new Room({
      name,
      members: [...(members || []), req.user.id],
      createdBy: req.user.id
    });
    
    await room.save();
    await room.populate('members', 'username');
    
    res.status(201).json(room);
  } catch (error) {
    console.error('[Rooms] Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get a specific room
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const room = await Room.findOne({
      _id: req.params.id,
      members: req.user.id
    }).populate('members', 'username');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('[Rooms] Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Update a room
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { name, members } = req.body;
    
    const room = await Room.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or not authorized' });
    }
    
    if (name) room.name = name;
    if (members) room.members = members;
    
    await room.save();
    await room.populate('members', 'username');
    
    res.json(room);
  } catch (error) {
    console.error('[Rooms] Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete a room
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const room = await Room.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or not authorized' });
    }
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('[Rooms] Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Add member to room
router.post('/:id/members', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { userId } = req.body;
    
    const room = await Room.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or not authorized' });
    }
    
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }
    
    await room.populate('members', 'username');
    res.json(room);
  } catch (error) {
    console.error('[Rooms] Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from room
router.delete('/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const room = await Room.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or not authorized' });
    }
    
    room.members = room.members.filter(member => member.toString() !== req.params.userId);
    await room.save();
    
    await room.populate('members', 'username');
    res.json(room);
  } catch (error) {
    console.error('[Rooms] Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Join room by ID
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if user is already a member
    const userObjectId = new (require('mongoose')).Types.ObjectId(req.user.id);
    if (room.members.some((member: any) => member.equals(userObjectId))) {
      return res.status(400).json({ error: 'User is already a member of this room' });
    }
    // Add user to room
    room.members.push(userObjectId);
    await room.save();
    
    // Populate room details
    await room.populate('members', 'username');
    
    res.json(room);
  } catch (error) {
    console.error('[Rooms] Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

export default router;

