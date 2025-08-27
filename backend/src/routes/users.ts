import { Router } from 'express';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all users (for chat interface)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt');
    res.json(users);
  } catch (error) {
    console.error('[Users] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'username email createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('[Users] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

