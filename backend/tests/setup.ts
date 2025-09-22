/* tests/setup.ts */
import { prisma } from "../src/lib/prisma";

// بعد از همه‌ی تست‌ها، اتصال Prisma بسته بشه
afterAll(async () => {
  await prisma.$disconnect();
});
