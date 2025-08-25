import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

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

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'username taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });
    const token = jwt.sign({ sub: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e: any) {
    console.error('[auth.signup] error', e?.message, e);
    if (e?.code === 11000) return res.status(409).json({ error: 'username taken' });
    res.status(500).json({ error: 'signup_failed', detail: e?.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ sub: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e: any) {
    console.error('[auth.login] error', e?.message, e);
    res.status(500).json({ error: 'login_failed', detail: e?.message });
  }
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, _id: 1 }).sort({ username: 1 });
    res.json(users);
  } catch (e: any) {
    console.error('[auth.users] error', e?.message, e);
    res.status(500).json({ error: 'failed_to_fetch_users', detail: e?.message });
  }
});

export default router;


