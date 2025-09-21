backend/
├─ prisma/
│ ├─ schema.prisma # مدل‌ها: User, RefreshToken, PasswordResetToken
│ └─ migrations/ # مایگریشن‌های Prisma
├─ src/
│ ├─ index.ts # ورودی اپ؛ وصل‌کردن میان‌افزارها و روترها
│ ├─ config/
│ │ ├─ env.ts # بارگذاری و اعتبارسنجی متغیرهای محیطی
│ │ └─ paths.ts # مسیرهای نسبی استاندارد: public, uploads, tmp, logs
│ ├─ lib/
│ │ └─ prisma.ts # کلاینت Prisma singleton
│ ├─ middleware/
│ │ ├─ cors.ts # CORS middleware + error handler
│ │ ├─ auth.ts # requireAuth (تأیید JWT و استخراج userId)
│ │ ├─ rateLimit.ts # loginLimiter, authSensitiveLimiter, globalLimiter
│ │ ├─ security.ts # helmetMw, compressionMw
│ │ └─ logger.ts # morgan logger
│ ├─ routes/
│ │ ├─ health.ts # GET /health
│ │ ├─ db.ts # GET /db/health (چک اتصال DB)
│ │ └─ auth.ts # register, login, me, refresh, logout, forgot, reset, change-password
│ ├─ services/
│ │ ├─ auth.ts # صدور Access/Refresh برای userId
│ │ ├─ token.ts # verify/rotate/revoke توکن‌های Refresh
│ │ ├─ password.ts # فراموشی/ریست رمز؛ ذخیره/اعتبارسنجی توکن
│ │ └─ mailer.ts # شبیه‌سازی ایمیل: نوشتن فایل در tmp/emails
│ ├─ utils/
│ │ ├─ jwt.ts # sign/verify با تایپ درست (بدون @types/jsonwebtoken)
│ │ ├─ hash.ts # sha256 برای هش توکن‌ها
│ │ └─ password.ts # bcrypt helpers (hash/verify)
│ └─ types/ # (درصورت نیاز) تایپ‌های سفارشی
├─ tests/
│ ├─ health.test.ts # تست /health
│ ├─ auth.flow.test.ts # ثبت‌نام/ورود/refresh/logout/me (flow کامل)
│ ├─ password.service.test.ts # فراموشی/ریست/تغییر رمز
│ └─ tsconfig.json # tsconfig مجزا برای تست‌ها
├─ .env.example # نمونه تنظیمات محیط
├─ eslint.config.cjs # ESLint v9 config (با ignores)
├─ jest.config.js # Jest + ts-jest یا ts-node-dev
├─ .prettierrc # Prettier
├─ tsconfig.json # TypeScript اصلی (rootDir=src)
└─ package.json # اسکریپت‌ها: dev, build, lint, test