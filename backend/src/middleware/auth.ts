import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

