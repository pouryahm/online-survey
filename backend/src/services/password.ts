import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sha256 } from "../utils/hash";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "./mailer";

/** مدت اعتبار توکن به دقیقه (پیشفرض 15) */
const RESET_EXPIRES_MIN = Number(env.PWD_RESET_EXPIRES_MIN ?? "15");

/** ساخت لینک ریست برای کاربر  اگر FRONTEND_ORIGIN ست باشد به فرانت میرود وگرنه به بکاند */
function buildResetLink(token: string) {
  const origin = env.FRONTEND_ORIGIN || `http://localhost:${env.PORT ?? 3000}`;
  // اگر فرانت مشخص باشد مسیر استاندارد فرانت:
  if (env.FRONTEND_ORIGIN) return `${origin}/reset-password?token=${token}`;
  // در غیراینصورت بکاند را به عنوان fallback استفاده میکنیم:
  return `${origin}/auth/reset?token=${token}`;
}

/** ایجاد رکورد ریست و برگرداندن توکن خام + لینک ریست */
export async function createPasswordReset(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const token = crypto.randomBytes(32).toString("hex"); // 64 کاراکتر
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_EXPIRES_MIN * 60 * 1000);

  const rec = await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  const resetUrl = buildResetLink(token);
  return { token, resetUrl, recordId: rec.id, expiresAt };
}

/** درخواست ریست پسورد با ایمیل  اگر ایمیل وجود نداشته باشد باز هم ok میدهیم (leak نکنیم) */
export async function requestPasswordResetByEmail(email: string, meta?: { ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true }; // عدم افشای وجود/عدم وجود ایمیل

  const { resetUrl, recordId, expiresAt } = await createPasswordReset(user.id, meta);
  await sendPasswordResetEmail(user.email, resetUrl);

  // توکن خام را به کلاینت برنمیگردانیم (صرفا برای ایمیل/فایل dev استفاده شد)
  return { ok: true, recordId, expiresAt };
}

/** اعتبارسنجی توکن ریست  اگر نامعتبر باشد Error میاندازد */
export async function verifyPasswordResetTokenOrThrow(token: string) {
  const tokenHash = sha256(token);
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!rec) throw new Error("TOKEN_NOT_FOUND");
  if (rec.usedAt) throw new Error("TOKEN_USED");
  if (rec.expiresAt.getTime() <= Date.now()) throw new Error("TOKEN_EXPIRED");
  return rec;
}

/** علامتزدن توکن بهعنوان مصرفشده */
export async function markPasswordResetUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
