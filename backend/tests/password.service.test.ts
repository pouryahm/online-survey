import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/utils/password";
import {
  createPasswordReset,
  requestPasswordResetByEmail,
  verifyPasswordResetTokenOrThrow,
  markPasswordResetUsed,
} from "../src/services/password";
import { describe, it, expect } from "@jest/globals";

const emailsDir = path.join(process.cwd(), "tmp", "emails");
const artifactsDir = path.join(process.cwd(), "tmp", "test-artifacts");

async function ensureClean(dir: string) {
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
}

describe("Password service flow", () => {
  it("creates reset token, writes dev email file, verifies/marks used, and stores an artifact", async () => {
    // 1) پوشههای خروجی تست را تمیز کن
    await ensureClean(emailsDir);
    await fs.promises.mkdir(artifactsDir, { recursive: true });

    // 2) یک کاربر تستی بساز
    const email = `reset_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: "Reset Test",
        password: await hashPassword("OldP@ssw0rd!"),
      },
    });

    // 3) مستقیماً توکن بساز (برای اینکه token خام را در آرتیفکت ذخیره کنیم)
    const { token, resetUrl, recordId, expiresAt } = await createPasswordReset(user.id, {
      ip: "127.0.0.1",
      userAgent: "jest-test",
    });
    expect(typeof token).toBe("string");
    expect(resetUrl).toContain("token=");
    expect(recordId).toBeTruthy();
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

    // 4) مسیر «ایمیل توسعه» را با سرویس عمومی تست کنیم (اینجا token را برنمی‌گرداند اما فایل باید ساخته شود)
    await requestPasswordResetByEmail(email, { ip: "127.0.0.1", userAgent: "jest-test" });

    // انتظار داریم داخل tmp/emails حداقل یک فایل ایجاد شده باشد
    const emailFiles = await fs.promises.readdir(emailsDir);
    expect(emailFiles.length).toBeGreaterThan(0);
    const lastEmailFile = path.join(emailsDir, emailFiles.sort().reverse()[0]);
    const emailContent = await fs.promises.readFile(lastEmailFile, "utf8");
    expect(emailContent).toContain("TO: " + email);
    expect(emailContent).toMatch(/reset/i);

    // 5) اعتبارسنجی توکن سپس مصرفکردن آن
    const rec = await verifyPasswordResetTokenOrThrow(token);
    expect(rec.id).toBe(recordId);
    expect(rec.userId).toBe(user.id);
    await markPasswordResetUsed(rec.id);

    // 6) دوباره verify باید خطای TOKEN_USED بدهد
    await expect(verifyPasswordResetTokenOrThrow(token)).rejects.toThrow("TOKEN_USED");

    // 7) ذخیره آرتیفکت گزارشی (برای بازبینی بعدی)
    const artifact = {
      when: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      reset: {
        recordId,
        resetUrl,
        expiresAt,
        devEmailFile: lastEmailFile,
      },
    };
    await fs.promises.writeFile(
      path.join(artifactsDir, "password-service.json"),
      JSON.stringify(artifact, null, 2),
      "utf8"
    );

    // پاکسازی سبک: کاربر تستی را حذف نکن تا اگر خواستی دستی هم تست کنی باقی بماند.
  });
});
