// src/routes/auth.ts
import { Router } from 'express';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { issueTokensForUser } from '../services/auth';

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

authRouter.post('/login', async (req, res) => {
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
