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

      console.log("[choices:POST] input", { questionId, userId, label, value, order });

      if (!label || !value) {
        return res.status(400).json({ message: "label and value are required" });
      }

      const question = await prisma.question.findFirst({
        where: { id: questionId, survey: { ownerId: userId } },
        select: { id: true },
      });

      console.log("[choices:POST] question lookup", {
        questionId,
        userId,
        found: !!question,
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

      console.log("[choices:POST] created", { choiceId: choice.id });
      return res.status(201).json({ choice });
    } catch (err: unknown) {
      console.error("[choices:POST] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res.status(500).json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

/**
 * GET /questions/:questionId/choices
 */
router.get(
  "/questions/:questionId/choices",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { questionId } = req.params;
      const userId = req.userId!;

      console.log("[choices:GET list] input", { questionId, userId });

      const question = await prisma.question.findFirst({
        where: { id: questionId, survey: { ownerId: userId } },
        select: { id: true },
      });

      console.log("[choices:GET list] question lookup", {
        questionId,
        userId,
        found: !!question,
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const items = await prisma.choice.findMany({
        where: { questionId: question.id },
        orderBy: { order: "asc" },
      });

      console.log("[choices:GET list] items", items);
      return res.json({ items });
    } catch (err: unknown) {
      console.error("[choices:GET list] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res.status(500).json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

/**
 * PATCH /choices/:id
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

      console.log("[choices:PATCH] input", { id, userId, label, value, order });

      const existing = await prisma.choice.findFirst({
        where: { id, question: { survey: { ownerId: userId } } },
      });

      console.log("[choices:PATCH] ownership check", { id, userId, found: !!existing });

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

      console.log("[choices:PATCH] updated", { id: updated.id });
      return res.json({ choice: updated });
    } catch (err: unknown) {
      console.error("[choices:PATCH] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res.status(500).json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

/**
 * DELETE /choices/:id
 */
router.delete(
  "/choices/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      console.log("[choices:DELETE] input", { id, userId });

      const existing = await prisma.choice.findFirst({
        where: { id, question: { survey: { ownerId: userId } } },
        select: { id: true },
      });

      console.log("[choices:DELETE] ownership check", { id, userId, found: !!existing });

      if (!existing) {
        return res.status(404).json({ message: "Choice not found" });
      }

      await prisma.choice.delete({ where: { id } });
      console.log("[choices:DELETE] deleted", { id });
      return res.json({ message: "Choice deleted" });
    } catch (err: unknown) {
      console.error("[choices:DELETE] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res.status(500).json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

export default router;
