import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /surveys/:surveyId/questions - create a question
 */
router.post(
  "/surveys/:surveyId/questions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { surveyId } = req.params;
    const ownerId = req.userId!;
    const { title, type, required, order } = req.body;

    // بررسی مالکیت
    const survey = await prisma.survey.findFirst({ where: { id: surveyId, ownerId } });
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const question = await prisma.question.create({
      data: {
        surveyId,
        title,
        type,
        required: !!required,
        order: order ?? 0,
      },
    });

    res.status(201).json({ question });
  }
);

/**
 * PATCH /questions/:id - update question
 */
router.patch(
  "/questions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId!;
    const { title, type, required, order } = req.body;

    const question = await prisma.question.findFirst({
      where: { id, survey: { ownerId } },
    });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(required !== undefined ? { required } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });

    res.json({ question: updated });
  }
);

/**
 * DELETE /questions/:id - delete question
 */
router.delete(
  "/questions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId!;

    const question = await prisma.question.findFirst({
      where: { id, survey: { ownerId } },
    });
    if (!question) return res.status(404).json({ message: "Question not found" });

    await prisma.question.delete({ where: { id } });
    res.json({ message: "Question deleted" });
  }
);

/**
 * POST /questions/:id/choices - add choices to a question
 */
router.post(
  "/questions/:id/choices",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ownerId = req.userId!;
    const { choices } = req.body as { choices: { label: string; value: string; order?: number }[] };

    const question = await prisma.question.findFirst({
      where: { id, survey: { ownerId } },
    });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const created = await prisma.choice.createMany({
      data: choices.map((c) => ({
        questionId: id,
        label: c.label,
        value: c.value,
        order: c.order ?? 0,
      })),
    });

    res.status(201).json({ count: created.count });
  }
);

export default router;
