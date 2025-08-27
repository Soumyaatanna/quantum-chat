"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all users (for chat interface)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const users = await User_1.default.find({}, 'username email createdAt');
        res.json(users);
    }
    catch (error) {
        console.error('[Users] Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Get user by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id, 'username email createdAt');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('[Users] Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
exports.default = router;
