import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  userId?: string;
}

const router = Router();

router.get("/auth/sessions", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const sessions = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, ip: true, userAgent: true, revokedAt: true },
  });
  res.json({ items: sessions });
});

router.post("/auth/sessions/:id/revoke", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const token = await prisma.refreshToken.findFirst({ where: { id, userId } });
  if (!token) return res.status(404).json({ message: "Session not found" });
  if (token.revokedAt) return res.status(200).json({ message: "Already revoked" });

  await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  res.json({ message: "Revoked" });
});

router.post("/auth/logout-all", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  res.json({ message: "All sessions revoked" });
});

export default router;
