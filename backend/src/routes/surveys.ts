import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /surveys - create a new survey
 */
router.post("/surveys", requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;
  const ownerId = req.userId!;

  const survey = await prisma.survey.create({
    data: {
      title,
      ownerId,
      ...(description ? { description } : {}), // ✅ فقط اگر description وجود داشت
    },
  });

  res.status(201).json({ survey });
});

/**
 * GET /surveys - list surveys of current user
 */
router.get("/surveys", requireAuth, async (req: AuthRequest, res: Response) => {
  const ownerId = req.userId!;

  const surveys = await prisma.survey.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ items: surveys });
});

/**
 * GET /surveys/:id - get survey with questions + choices
 */
router.get("/surveys/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const ownerId = req.userId!;

    const survey = await prisma.survey.findFirst({
    where: { id, ownerId },
    include: {
        questions: {
        include: { choices: true },
        },
    },
    orderBy: { createdAt: "desc" }, // اگر نیاز داری
    });


  if (!survey) return res.status(404).json({ message: "Survey not found" });
  res.json({ survey });
});

/**
 * PATCH /surveys/:id - update survey
 */
router.patch("/surveys/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const ownerId = req.userId!;
  const { title, description, isPublished } = req.body;

  const survey = await prisma.survey.findFirst({ where: { id, ownerId } });
  if (!survey) return res.status(404).json({ message: "Survey not found" });

  const updated = await prisma.survey.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
    },
  });

  res.json({ survey: updated });
});

/**
 * DELETE /surveys/:id - delete survey
 */
router.delete("/surveys/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const ownerId = req.userId!;

  const survey = await prisma.survey.findFirst({ where: { id, ownerId } });
  if (!survey) return res.status(404).json({ message: "Survey not found" });

  await prisma.survey.delete({ where: { id } });
  res.json({ message: "Survey deleted" });
});

export default router;
