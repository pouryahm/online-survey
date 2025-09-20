import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';



export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7).trim(); // بعد از 'Bearer '
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    const sub = payload?.sub;
    if (typeof sub !== 'string') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.userId = sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
