import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔵 Auth middleware - Method:', req.method, 'Path:', req.path);
    
    const authHeader = req.headers.authorization;
    console.log('🔵 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.split(' ')[1];
    console.log('🔵 Token extracted:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    console.log('🔵 Token decoded:', decoded ? 'Success' : 'Failed');
    
    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    console.log('✅ Auth successful - userId:', req.userId);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export default authMiddleware;