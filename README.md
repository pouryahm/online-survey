# Online Survey — Monorepo Starter

این ریپو اسکلت بک‌اند پرسشنامه‌ی آنلاین است:

- Node.js + TypeScript + Express  
- Postgres (Docker) + Prisma ORM  
- Jest/Supertest برای تست  
- ESLint v9 (Flat Config) + Prettier  
- GitHub Actions CI (Install → Prisma Generate → Lint → Build → Test)  
- سیستم مسیرهای نسبی (APP_ROOT + `src/config/paths.ts`)

---

## پیش‌نیازها
- Node.js LTS، Git، Docker Desktop  
- VS Code + افزونه‌های ESLint و Prettier (پیشنهادی)

---

## شروع سریع (Development)

```bash
git clone <repo-url>
cd online-survey

# دیتابیس
docker compose up -d
# Postgres → localhost:5432
# pgAdmin  → http://localhost:8081  (Email: admin@example.com , Pass: admin123)

# بک‌اند
cd backend
# اگر .env نداری:
# cp .env.example .env   (ویندوز: copy .env.example .env)
npm ci
npx prisma migrate dev --name init
npm run dev
```

- Health:  <http://localhost:3000/health>  → `{ "status": "ok" }`  
- DB:      <http://localhost:3000/db/health> → `{ "db": "ok" }`

---

## اسکریپت‌های backend

- `npm run dev`   → اجرای توسعه (ts-node-dev)  
- `npm run build` → `prisma generate && tsc`  
- `npm start`     → اجرای خروجی build  
- `npm test`      → Jest/Supertest  
- `npm run lint`  → ESLint (Flat Config)  
- `npm run format:write` → Prettier (اصلاح قالب کد)

---

## ساختار پوشه‌ها (خلاصه)

```
online-survey/
├─ backend/
│  ├─ src/
│  │  ├─ config/paths.ts
│  │  ├─ routes/health.ts
│  │  ├─ routes/db.ts
│  │  └─ index.ts
│  ├─ prisma/                # schema.prisma, migrations
│  ├─ public/ uploads/ tmp/ logs/
│  ├─ .env(.example)  tsconfig.json  eslint.config.cjs  jest.config.js
│  └─ package.json
├─ frontend/                 # در فازهای بعدی
├─ docker-compose.yml
└─ .github/workflows/ci.yml
```

---

## CI (GitHub Actions)
فایل ورک‌فلو: `.github/workflows/ci.yml`  
روی هر `push`/`PR` اجرا می‌شود: **Install → Prisma Generate → Lint → Build → Test**.  
پیشنهاد: روی شاخه‌ی `main` Branch Protection بگذارید که بدون CI سبز، merge نشود.

---

## مسیرهای نسبی
`src/config/paths.ts` با استفاده از `__dirname/../../` ریشه‌ی `backend` را پیدا می‌کند و مسیرهای `public/`, `uploads/`, `tmp/`, `logs/` را می‌سازد.  
در صورت نیاز می‌توانید با `APP_ROOT` در `.env` ریشه را override کنید (بدون تغییر کد).

---

## رفع خطاهای رایج

- **EPERM در ویندوز هنگام `prisma generate`**: همه‌ی پردازه‌های Node را ببندید، پوشه‌های `node_modules/.prisma` و `node_modules/@prisma/client` را حذف کنید، سپس `npx prisma generate`. در صورت نیاز `npm ci` دوباره.
- **TS6059 (tests خارج از rootDir)**: در `tsconfig.json` فقط `src/**/*.ts` را include کنید و `tests` را exclude کنید. (در این ریپو انجام شده.)
- **pgAdmin ایمیل نامعتبر**: از ایمیل استاندارد مثل `admin@example.com` استفاده کنید.
- **پورت اشغال**: پورت‌ها را در `docker-compose.yml` تغییر دهید (مثلاً `8082:80`).
