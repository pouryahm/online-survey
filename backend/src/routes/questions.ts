import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { QuestionType } from "@prisma/client";

const router = Router();

/**
 * POST /surveys/:surveyId/questions
 * ایجاد یک سؤال جدید برای یک نظرسنجی
 */
router.post(
  "/surveys/:surveyId/questions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { surveyId } = req.params;
      const userId = req.userId!;
      const { type, title, required, order, choices } = req.body as {
        type: QuestionType;
        title: string;
        required?: boolean;
        order?: number;
        choices?: { label: string; value: string; order?: number }[];
      };

      console.log("[questions:POST] input", {
        surveyId,
        userId,
        type,
        title,
        required,
        order,
        choicesLen: choices?.length,
      });

      // چک مالکیت نظرسنجی
      const survey = await prisma.survey.findFirst({
        where: { id: surveyId, ownerId: userId },
        select: { id: true },
      });

      console.log("[questions:POST] survey lookup", {
        surveyId,
        userId,
        found: !!survey,
      });

      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      // ایجاد سؤال و گزینه‌ها (اگر وجود داشتند)
      const question = await prisma.question.create({
        data: {
          surveyId: survey.id,
          type,
          title,
          required: required ?? false,
          order: order ?? 0,
          choices:
            choices && choices.length > 0
              ? {
                  create: choices.map((c, idx) => ({
                    label: c.label,
                    value: c.value,
                    order: c.order ?? idx,
                  })),
                }
              : undefined,
        },
        include: { choices: true },
      });

      console.log("[questions:POST] created", {
        questionId: question.id,
        choices: question.choices.length,
      });

      return res.status(201).json({ question });
    } catch (err: unknown) {
      console.error("[questions:POST] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

/**
 * PATCH /questions/:id
 * ویرایش یک سؤال
 */
router.patch(
  "/questions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { title, required, order } = req.body as {
        title?: string;
        required?: boolean;
        order?: number;
      };

      console.log("[questions:PATCH] input", {
        id,
        userId,
        title,
        required,
        order,
      });

      const existing = await prisma.question.findFirst({
        where: { id, survey: { ownerId: userId } },
      });

      console.log("[questions:PATCH] ownership", {
        id,
        userId,
        found: !!existing,
      });

      if (!existing) {
        return res.status(404).json({ message: "Question not found" });
      }

      const updated = await prisma.question.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(required !== undefined ? { required } : {}),
          ...(typeof order === "number" ? { order } : {}),
        },
      });

      console.log("[questions:PATCH] updated", { id: updated.id });

      return res.json({ question: updated });
    } catch (err: unknown) {
      console.error("[questions:PATCH] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

/**
 * DELETE /questions/:id
 * حذف یک سؤال
 */
router.delete(
  "/questions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      console.log("[questions:DELETE] input", { id, userId });

      const existing = await prisma.question.findFirst({
        where: { id, survey: { ownerId: userId } },
        select: { id: true },
      });

      console.log("[questions:DELETE] ownership", {
        id,
        userId,
        found: !!existing,
      });

      if (!existing) {
        return res.status(404).json({ message: "Question not found" });
      }

      await prisma.question.delete({ where: { id } });

      console.log("[questions:DELETE] deleted", { id });

      return res.json({ message: "Question deleted" });
    } catch (err: unknown) {
      console.error("[questions:DELETE] error:", err);
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: err.message,
          stack: err.stack,
        });
      }
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: String(err) });
    }
  }
);

export default router;
