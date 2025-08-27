"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Room_1 = __importDefault(require("../models/Room"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all rooms for the authenticated user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const rooms = await Room_1.default.find({
            members: req.user.id
        }).populate('members', 'username');
        res.json(rooms);
    }
    catch (error) {
        console.error('[Rooms] Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});
// Create a new room
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { name, members } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }
        const room = new Room_1.default({
            name,
            members: [...(members || []), req.user.id],
            createdBy: req.user.id
        });
        await room.save();
        await room.populate('members', 'username');
        res.status(201).json(room);
    }
    catch (error) {
        console.error('[Rooms] Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});
// Get a specific room
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const room = await Room_1.default.findOne({
            _id: req.params.id,
            members: req.user.id
        }).populate('members', 'username');
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    }
    catch (error) {
        console.error('[Rooms] Error fetching room:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});
// Update a room
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { name, members } = req.body;
        const room = await Room_1.default.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found or not authorized' });
        }
        if (name)
            room.name = name;
        if (members)
            room.members = members;
        await room.save();
        await room.populate('members', 'username');
        res.json(room);
    }
    catch (error) {
        console.error('[Rooms] Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});
// Delete a room
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const room = await Room_1.default.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found or not authorized' });
        }
        res.json({ message: 'Room deleted successfully' });
    }
    catch (error) {
        console.error('[Rooms] Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});
// Add member to room
router.post('/:id/members', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { userId } = req.body;
        const room = await Room_1.default.findOne({
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
    }
    catch (error) {
        console.error('[Rooms] Error adding member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});
// Remove member from room
router.delete('/:id/members/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const room = await Room_1.default.findOne({
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
    }
    catch (error) {
        console.error('[Rooms] Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});
// Join room by ID
router.post('/:id/join', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const room = await Room_1.default.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Check if user is already a member
        const userObjectId = new (require('mongoose')).Types.ObjectId(req.user.id);
        if (room.members.some((member) => member.equals(userObjectId))) {
            return res.status(400).json({ error: 'User is already a member of this room' });
        }
        // Add user to room
        room.members.push(userObjectId);
        await room.save();
        // Populate room details
        await room.populate('members', 'username');
        res.json(room);
    }
    catch (error) {
        console.error('[Rooms] Error joining room:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});
exports.default = router;
