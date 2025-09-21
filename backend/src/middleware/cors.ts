import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const allowList = new Set(env.FRONTEND_ORIGINS?.length ? env.FRONTEND_ORIGINS : (env.FRONTEND_ORIGIN ? [env.FRONTEND_ORIGIN] : ["http://localhost:5173"]));

const hasMessage = (e: unknown): e is { message: string } =>
  typeof e === "object" && e !== null &&
  "message" in e && typeof (e as Record<string, unknown>).message === "string";

export const corsMiddleware = cors({
  origin(origin, cb) {
    // CLI/Server-to-server بدون Origin: اجازه
    if (!origin) return cb(null, true);
    if (allowList.has(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: false, // از Authorization header استفاده میکنیم
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
});

export function corsErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (hasMessage(err) && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS_BLOCKED" });
  }
  return next(err);
}
