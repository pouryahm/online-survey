import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /questions/:questionId/choices
 * ایجاد یک گزینه برای سوال
 */
router.post(
  "/questions/:questionId/choices",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { questionId } = req.params;
      const userId = req.userId!;
      const { label, value, order } = req.body as {
        label?: string;
        value?: string;
        order?: number;
      };

      if (!label || !value) {
        return res.status(400).json({ message: "label and value are required" });
      }

      const question = await prisma.question.findFirst({
        where: { id: questionId, survey: { ownerId: userId } },
        select: { id: true },
      });
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const choice = await prisma.choice.create({
        data: {
          questionId: question.id,
          label,
          value,
          ...(typeof order === "number" ? { order } : {}),
        },
      });

      return res.status(201).json({ choice });
    } catch (err) {
      console.error("[choices:POST] error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

/**
 * GET /questions/:questionId/choices
 * لیست گزینه‌های یک سوال
 */
router.get(
  "/questions/:questionId/choices",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { questionId } = req.params;
      const userId = req.userId!;

      const question = await prisma.question.findFirst({
        where: { id: questionId, survey: { ownerId: userId } },
        select: { id: true },
      });
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const items = await prisma.choice.findMany({
        where: { questionId: question.id },
        orderBy: { order: "asc" },
      });

      return res.json({ items });
    } catch (err) {
      console.error("[choices:GET list] error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

/**
 * PATCH /choices/:id
 * ویرایش یک گزینه
 */
router.patch(
  "/choices/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { label, value, order } = req.body as {
        label?: string;
        value?: string;
        order?: number;
      };

      const existing = await prisma.choice.findFirst({
        where: {
          id,
          question: { survey: { ownerId: userId } },
        },
        include: { question: true },
      });

      if (!existing) {
        return res.status(404).json({ message: "Choice not found" });
      }

      const updated = await prisma.choice.update({
        where: { id },
        data: {
          ...(label !== undefined ? { label } : {}),
          ...(value !== undefined ? { value } : {}),
          ...(typeof order === "number" ? { order } : {}),
        },
      });

      return res.json({ choice: updated });
    } catch (err) {
      console.error("[choices:PATCH] error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

/**
 * DELETE /choices/:id
 * حذف گزینه
 */
router.delete(
  "/choices/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const existing = await prisma.choice.findFirst({
        where: { id, question: { survey: { ownerId: userId } } },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ message: "Choice not found" });
      }

      await prisma.choice.delete({ where: { id } });
      return res.json({ message: "Choice deleted" });
    } catch (err) {
      console.error("[choices:DELETE] error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;
