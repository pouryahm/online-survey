// src/routes/auth.ts
import { Router } from 'express';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { issueTokensForUser } from '../services/auth';
import { requireAuth } from '../middleware/auth'; 
import { sha256 } from '../utils/hash';
import { verifyRefreshTokenOrThrow, revokeRefreshTokenById } from '../services/token';
import {
  requestPasswordResetByEmail,
  verifyPasswordResetTokenOrThrow,
  markPasswordResetUsed,
} from '../services/password';
import { hashPassword, verifyPassword } from '../utils/password';
import { loginLimiter, authSensitiveLimiter } from '../middleware/rateLimit';
// helper: type guard for error.message Ø¨Ø¯ÙˆÙ† any
const hasMessage = (e: unknown): e is { message: string } =>
  typeof e === 'object' && e !== null &&
  'message' in e && typeof (e as Record<string, unknown>).message === 'string';



export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(40).max(200),
  password: z.string().min(8),
});

const changeSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});


authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = RegisterSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true },
    });

    const { accessToken, refreshToken } = await issueTokensForUser(user.id, {
      userAgent: req.headers['user-agent'] as string | undefined,
      ip: req.ip,
    });

    return res.status(201).json({ user, accessToken, refreshToken });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const rec = await prisma.user.findUnique({ where: { email } });
    if (!rec) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, rec.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = await issueTokensForUser(rec.id, {
      userAgent: req.headers['user-agent'] as string | undefined,
      ip: req.ip,
    });

    const user = { id: rec.id, email: rec.email, name: rec.name };
    return res.json({ user, accessToken, refreshToken });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /auth/me  (Protected)
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
});


// ---- POST /auth/refresh ----
const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body);

    // 1) ØªØ§ÛŒÛŒØ¯ Ø§Ù…Ø¶Ø§ + ÙˆØ¬ÙˆØ¯ Ø¯Ø± DB + Ø¹Ø¯Ù… Ø§Ø¨Ø·Ø§Ù„/Ø§Ù†Ù‚Ø¶Ø§
    const { userId, record } = await verifyRefreshTokenOrThrow(refreshToken);

    // 2) Ø§Ø¨Ø·Ø§Ù„ ØªÙˆÚ©Ù† Ù‚Ø¯ÛŒÙ…ÛŒ (Rotation)
    await revokeRefreshTokenById(record.id);

    // 3) ØµØ¯ÙˆØ± Ø¬ÙØª Ø¬Ø¯ÛŒØ¯
    const { accessToken, refreshToken: newRt } = await issueTokensForUser(userId, {
      userAgent: req.headers['user-agent'] as string | undefined,
      ip: req.ip,
    });

    // (Ø§Ø®ØªÛŒØ§Ø±ÛŒ) Ú©Ø§Ø±Ø¨Ø± Ø±Ø§ Ù‡Ù… Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†ÛŒÙ…
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    return res.json({ user, accessToken, refreshToken: newRt });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', issues: err.issues });
    }
    // Ù†Ú¯Ø§Ø´Øª Ø®Ø·Ø§Ù‡Ø§ÛŒ Ø³Ø±ÙˆÛŒØ³
    const msg = (err as Error)?.message;
    if (msg === 'INVALID_TOKEN' || msg === 'TOKEN_NOT_FOUND' || msg === 'TOKEN_REVOKED' || msg === 'TOKEN_EXPIRED') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ---- POST /auth/logout ----
const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

authRouter.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = LogoutSchema.parse(req.body);

    // Ù¾ÛŒØ¯Ø§ Ú©Ø±Ø¯Ù† Ø±Ú©ÙˆØ±Ø¯ Ùˆ Ø§Ø¨Ø·Ø§Ù„
    const tokenHash = sha256(refreshToken);
    const rec = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!rec) return res.json({ ok: true }); // idempotent

    if (!rec.revokedAt) {
      await revokeRefreshTokenById(rec.id);
    }
    return res.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', issues: err.issues });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/forgot  -> Ù‡Ù…ÛŒØ´Ù‡ {ok:true} Ø¨Ø±Ù…ÛŒâ€ŒÚ¯Ø±Ø¯Ø§Ù†ÛŒÙ… ØªØ§ ÙˆØ¬ÙˆØ¯/Ø¹Ø¯Ù… ÙˆØ¬ÙˆØ¯ Ø§ÛŒÙ…ÛŒÙ„ Ù„Ùˆ Ù†Ø±ÙˆØ¯
authRouter.post('/forgot', authSensitiveLimiter, async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    await requestPasswordResetByEmail(email, {
      ip: req.ip,
      userAgent: (req.headers['user-agent'] as string) || undefined,
    });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// POST /auth/reset  -> Ø¨Ø§ token Ù…Ø¹ØªØ¨Ø±ØŒ Ù¾Ø³ÙˆØ±Ø¯ Ú©Ø§Ø±Ø¨Ø± Ø±Ø§ Ø¹ÙˆØ¶ Ù…ÛŒâ€ŒÚ©Ù†Ø¯ Ùˆ Ù‡Ù…Ù‡Ù” refresh tokenÙ‡Ø§ÛŒ Ø§Ùˆ Ø±Ø§ Ø¨Ø§Ø·Ù„ Ù…ÛŒâ€ŒÚ©Ù†Ø¯
authRouter.post('/reset', authSensitiveLimiter, async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const rec = await verifyPasswordResetTokenOrThrow(token);

    const newHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: rec.userId },
      data: { password: newHash },
    });

    // Ø§Ø¨Ø·Ø§Ù„ ØªÙ…Ø§Ù… Ø³Ø´Ù†â€ŒÙ‡Ø§ Ø¨Ø¹Ø¯ Ø§Ø² Ø±ÛŒØ³Øª (Ø§Ù…Ù†ÛŒØª Ø¨Ø§Ù„Ø§ØªØ±)
    await prisma.refreshToken.deleteMany({ where: { userId: rec.userId } });

    await markPasswordResetUsed(rec.id);
    return res.json({ ok: true });
} catch (err: unknown) {
  if (hasMessage(err)) {
    const msg = err.message;
    if (msg === 'TOKEN_NOT_FOUND' || msg === 'TOKEN_EXPIRED' || msg === 'TOKEN_USED') {
      return res.status(400).json({ error: msg });
    }
  }
  return next(err);
}
});

// POST /auth/change-password (Protected)
authRouter.post('/change-password', requireAuth, authSensitiveLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changeSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'INVALID_CURRENT_PASSWORD' });

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });

    // Ø§Ø¨Ø·Ø§Ù„ ØªÙ…Ø§Ù… refresh tokenÙ‡Ø§ÛŒ Ù‚Ø¨Ù„ÛŒ Ø¨Ø¹Ø¯ Ø§Ø² ØªØºÛŒÛŒØ± Ù¾Ø³ÙˆØ±Ø¯
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});







