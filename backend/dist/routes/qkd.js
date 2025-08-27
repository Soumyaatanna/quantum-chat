"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bb84_1 = require("../qkd/bb84");
const router = (0, express_1.Router)();
router.post('/bb84', (req, res) => {
    const { numPhotons = 128, eve = false } = req.body || {};
    console.log('[QKD] BB84 request:', { numPhotons, eve });
    const result = (0, bb84_1.simulateBB84)(Number(numPhotons), Boolean(eve));
    console.log('[QKD] BB84 result:', { keyLength: result.keyHex.length, qber: result.qber, eveDetected: result.eveDetected });
    res.json({ protocol: 'BB84', ...result });
});
// Test endpoint (no auth required)
router.get('/test', (req, res) => {
    const result = (0, bb84_1.simulateBB84)(128, false);
    res.json({
        message: 'QKD test successful',
        keyLength: result.keyHex.length,
        qber: result.qber,
        eveDetected: result.eveDetected,
        keyHex: result.keyHex.substring(0, 16) + '...' // Show first 16 chars
    });
});
// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'QKD service is running',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
