# Online Survey  Backend (Phase 0 & Phase 1)  
## 1) هدف و نیازمندی‌ها

### چشم‌انداز
پیاده‌سازی بک‌اند سرویس «نظرسنجی آنلاین» با تمرکز بر امنیت، کیفیت کد، و قابل‌حمل بودن (قابل اجرا روی هر سیستم/سرور بدون دردسر مسیرها).

### دامنه‌ی فازها
- **فاز 0 (زیرساخت توسعه):**
  - اسکلت پروژه‌ی Node.js/Express/TypeScript
  - تنظیمات ESLint v9 + Prettier + Jest
  - مسیرهای نسبی استاندارد برای فایل‌ها (`PATHS`) و سروینگ استاتیک `/public`
  - Docker Compose برای Postgres + pgAdmin
  - Prisma ORM + Health checks (`/health`, `/db/health`)
  - CI (GitHub Actions) برای lint/build/test (در فاز 0 راه افتاده)

- **فاز 1 (احراز هویت و امنیت):**
  - ثبت‌نام/ورود/خروج، `GET /auth/me`
  - **JWT Access/Refresh** با Rotation و ابطال Refreshهای قدیمی
  - فراموشی/ریست رمز با توکن یکبارمصرف و تاریخ انقضا
  - تغییر رمز (Protected)
  - محدودسازی نرخ (Rate Limit) برای مسیرهای حساس و سطح کل سیستم
  - اعتبارسنجی ورودی با **Zod**
  - **Helmet** (هدرهای امنیتی)، **Compression**، **Morgan** (لاگ)
  - تست‌های end-to-end سبک با Jest + Supertest

### نیازمندی‌های عملکردی
- کاربر می‌تواند:
  - ثبت‌نام کند، وارد شود، توکن تازه بگیرد (`/auth/refresh`) و خارج شود.
  - وضعیت خودش را ببیند (`/auth/me`) با Access Token معتبر.
  - درخواست فراموشی رمز بدهد و با توکن ایمیلی (شبیه‌سازی‌شده) رمز را ریست کند.
  - رمز فعلی‌اش را به رمز جدید تغییر دهد (Protected).

### نیازمندی‌های غیرعملکردی
- امنیت: هدرهای امنیتی، CORS کنترل‌شده، Rate-limit، ابطال توکن‌ها.
- کیفیت: Lint/Format اجباری، تست‌ها سبز.
- DX: مسیرهای نسبی، `.env.example`، اسکریپت‌های npm واضح.
- پایگاه‌داده: Postgres (لوکال با Docker)، Prisma migrations.

### تکنولوژی‌ها
- Node.js, Express, TypeScript
- Prisma + PostgreSQL
- Zod, bcryptjs, jsonwebtoken
- express-rate-limit, helmet, compression, morgan
- Jest, Supertest, ESLint v9, Prettier
- Docker Compose (Postgres, pgAdmin)

### اجرای سریع (Quick Start خلاصه)
1. `docker compose up -d` (در ریشه‌ی repo)
2. در `backend`:
   - کپی `.env.example` به `.env` و مقداردهی رازها
   - `npm i`
   - `npx prisma migrate dev`
   - `npm run dev`
3. تست: `npm test`  و  `curl http://localhost:3000/health`
