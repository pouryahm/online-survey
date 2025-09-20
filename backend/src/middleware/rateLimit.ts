import { Request } from "express";
import rateLimit from "express-rate-limit";

// کلاینت‌ها پشت NAT: بهتره کلید رو بر اساس IP + ورودی بسازیم
const emailKey = (req: Request) =>
  `${req.ip}:${(req.body?.email as string) || ""}`;
const tokenKey = (req: Request) =>
  `${req.ip}:${(req.body?.token as string) || ""}`;
const userKey  = (req: Request) =>
  `${req.ip}:${(req as any).userId || ""}`;

// /auth/login : حداکثر 5 تلاش در 10 دقیقه برای هر IP+ایمیل
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  message: { error: "Too many login attempts. Try again later." },
});

// /auth/forgot : حداکثر 3 درخواست در 15 دقیقه برای هر IP+ایمیل
export const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  message: { error: "Too many requests. Try again later." },
});

// /auth/reset : حداکثر 5 درخواست در 15 دقیقه برای هر IP+توکن
export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tokenKey,
  message: { error: "Too many requests. Try again later." },
});

// /auth/change-password : حداکثر 10 درخواست در 10 دقیقه برای هر IP+کاربر
export const changePwLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { error: "Too many requests. Try again later." },
});
