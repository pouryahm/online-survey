# گزارشی از پیشرفت تا این لحظه (Whats Done)

## Phase 0 (زیرساخت)
- راه‌اندازی اسکلت Express + TypeScript
- **ESLint v9** مهاجرت از `.eslintrc` به `eslint.config.cjs` + رفع اخطارها
- **Prettier** و اسکریپت‌های format
- **Jest** و تنظیم تایپها برای تستها (جدا کردن tsconfig تست)
- **CORS** middleware + error handler و حذف الگوهای `*` که باعث خطای `path-to-regexp` میشد
- **PATHS** برای مسیرهای نسبی (public, uploads, tmp, logs) و سروینگ `/public`
- **Docker Compose**: Postgres + pgAdmin
- **Prisma**: راهاندازی `User` مدل پایه `prisma migrate dev`, `prisma studio`
- روتهای پایه: `/health`, `/db/health`
- **CI (GitHub Actions)** برای lint/build/test (در فاز 0 تنظیم شد)
- `.env.example` اولیه

## Phase 1 (احراز هویت و امنیت)
- **مدلها و مایگریشنها**
  - `User`, `RefreshToken` (هششده با sha256), `PasswordResetToken`
- **JWT Auth**
  - صدور Access/Refresh با تنظیمات انقضا از `.env`
  - **Rotation**: در `/auth/refresh` توکن قدیمی باطل و جفت جدید صادر میشود
  - `requireAuth` برای مسیرهای محافظتشده و `/auth/me`
  - `/auth/logout` ابطال Refresh (idempotent)
- **Password flows**
  - `/auth/forgot`  تولید توکن ریست و ذخیره در DB نوشتن ایمیل در `tmp/emails`
  - `/auth/reset`  اعتبارسنجی توکن تغییر پسورد حذف تمام Refreshهای کاربر
  - `/auth/change-password`  بررسی پسورد فعلی اعمال پسورد جدید حذف Refreshهای قبلی
- **اعتبارسنجی ورودی** با **Zod** (اسکیمای Register/Login/Refresh/Logout/Forgot/Reset/Change)
- **Rate limiting**
  - `loginLimiter` برای ورود ( تلاش/دقیقه  429)
  - `authSensitiveLimiter` برای forgot/reset/change ( رویداد/دقیقه)
  - `globalLimiter` سطح اپ ( درخواست/دقیقه)
  - استفاده از `ipKeyGenerator` برای IPv6-safe
- **امنیت و تجربه**
  - `helmet` (هدرها) `compression` (فشردهسازی) `morgan` (لاگ)
  - حذف `app.options('*', ...)` و جایگزینی با پاسخ عمومی OPTIONS (204) جهت سازگاری
- **تستها (همه سبز)**
  - `tests/health.test.ts` 
  - `tests/auth.flow.test.ts` (ثبتنام/ورود/me/refresh/logout) 
  - `tests/password.service.test.ts` (forgot/reset/change) 
- **رفع خطاهای مسیر و تایپ**
  - خطای `path-to-regexp` ناشی از `*`  اصلاح به هندل OPTIONS عمومی
  - حذف نیاز به `@types/jsonwebtoken` با امضای تایپشدهی داخلی برای `sign/verify`
  - جداسازی tsconfig تستها برای رفع ارورهای VS Code
  - چند مورد اخطار ESLint (پارامتر `next` بلااستفاده) با تغییر به `_next`

## وضعیت فعلی
- سرور: `npm run dev`  `[server] listening on http://localhost:3000`
- دیتابیس: با Docker Compose و Prisma مایگریت شده
- تستها: `npm test`   همه پاس
- هدرهای امنیتی فعال CORS پایدار Rate-limitها فعال
- ایمیل ریست شبیهسازی در `tmp/emails`

## گامهای بعدی پیشنهادی
- **Phase 1 ادامه**: پروفایل کاربر (ویرایش نام/ایمیل با تأیید) تایید ایمیل (optional)
- **Phase 2 (Survey)**: مدلهای Survey/Question/Choice/Response CRUDهای محافظتشده Rules سطح دسترسی
- تکمیل Template Repo فاز 1 (اسناد + اسکریپتهای bootstrap)
