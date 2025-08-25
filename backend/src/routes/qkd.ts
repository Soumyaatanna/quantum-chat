import { Router } from 'express';
import { simulateBB84 } from '../qkd/bb84.js';

const router = Router();

router.post('/bb84', (req, res) => {
  const { numPhotons = 128, eve = false } = req.body || {};
  const result = simulateBB84(Number(numPhotons), Boolean(eve));
  res.json({ protocol: 'BB84', ...result });
});

export default router;


