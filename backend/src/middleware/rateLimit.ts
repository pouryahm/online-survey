import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

// محدودکننده ورود ( تلاش در  دقیقه)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req),
  message: { error: "TOO_MANY_LOGIN_ATTEMPTS" },
});

// محدودکننده اکشنهای حساس احراز هویت (فراموشی/ریست/تغییر رمز)
export const authSensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req),
});

// محدودکننده عمومی کل API (نرم)
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req),
});
