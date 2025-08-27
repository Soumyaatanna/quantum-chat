"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'unauthorized' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = payload.sub;
        next();
    }
    catch {
        return res.status(401).json({ error: 'unauthorized' });
    }
}
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password)
            return res.status(400).json({ error: 'username and password required' });
        const existing = await User_1.default.findOne({ username });
        if (existing)
            return res.status(409).json({ error: 'username taken' });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.default.create({ username, passwordHash });
        const token = jsonwebtoken_1.default.sign({ sub: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, username: user.username } });
    }
    catch (e) {
        console.error('[auth.signup] error', e?.message, e);
        if (e?.code === 11000)
            return res.status(409).json({ error: 'username taken' });
        res.status(500).json({ error: 'signup_failed', detail: e?.message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const user = await User_1.default.findOne({ username });
        if (!user)
            return res.status(401).json({ error: 'invalid_credentials' });
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'invalid_credentials' });
        const token = jsonwebtoken_1.default.sign({ sub: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, username: user.username } });
    }
    catch (e) {
        console.error('[auth.login] error', e?.message, e);
        res.status(500).json({ error: 'login_failed', detail: e?.message });
    }
});
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User_1.default.find({}, { username: 1, _id: 1 }).sort({ username: 1 });
        res.json(users);
    }
    catch (e) {
        console.error('[auth.users] error', e?.message, e);
        res.status(500).json({ error: 'failed_to_fetch_users', detail: e?.message });
    }
});
exports.default = router;
