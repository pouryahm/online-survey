import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

// اینترفیس اختصاصی برای اضافه کردن userId
export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    const sub = payload?.sub;
    if (typeof sub !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.userId = sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
