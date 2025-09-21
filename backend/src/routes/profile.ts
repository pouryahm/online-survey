import { Router, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

import type { Request } from "express";

interface AuthRequest extends Request {
  userId?: string;
}

const router = Router();

// GET /auth/profile
router.get("/auth/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

// PATCH /auth/profile
router.patch("/auth/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Invalid name" });
  }

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { name },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  res.json({ user });
});

export default router;
