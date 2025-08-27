import { Router } from 'express';
import { simulateBB84 } from '../qkd/bb84';

const router = Router();

router.post('/bb84', (req, res) => {
  const { numPhotons = 128, eve = false } = req.body || {};
  console.log('[QKD] BB84 request:', { numPhotons, eve });
  const result = simulateBB84(Number(numPhotons), Boolean(eve));
  console.log('[QKD] BB84 result:', { keyLength: result.keyHex.length, qber: result.qber, eveDetected: result.eveDetected });
  res.json({ protocol: 'BB84', ...result });
});

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  const result = simulateBB84(128, false);
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

export default router;


