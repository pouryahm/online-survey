import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const dbRouter = Router();

dbRouter.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ db: 'ok' });
  } catch (err) {
    return res.status(500).json({ db: 'error', error: (err as Error).message });
  }
});
