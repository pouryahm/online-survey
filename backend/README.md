# Backend (Node.js + TS + Express)

## راه‌اندازی
```bash
npm ci
cp .env.example .env    # در ویندوز: copy .env.example .env
npx prisma migrate dev --name init
npm run dev
```

### Environment
```
PORT=3000
DATABASE_URL="postgresql://os_user:os_pass@localhost:5432/os_db?schema=public"
# APP_ROOT=   # اختیاری: اگر خواستید ریشه را در سرور override کنید
```

### مسیرهای نسبی (paths.ts)
- `src/config/paths.ts` ریشه‌ی backend را از روی `__dirname/../../` محاسبه می‌کند.
- دایرکتوری‌های داده: `public/`, `uploads/`, `tmp/`, `logs/`
- سرو استاتیک: `/public/*`

### اسکریپت‌ها
- `dev` → ts-node-dev
- `build` → prisma generate + tsc
- `start` → اجرای خروجی build
- `test` → Jest/Supertest
- `lint`/`lint:fix` → ESLint (Flat Config)
- `format`/`format:write` → Prettier

### تست‌ها
```bash
npm test
```

### Prisma
- اسکیما: `prisma/schema.prisma`
- دستورها:
  ```bash
  npx prisma migrate dev --name <name>
  npx prisma generate
  npx prisma studio
  ```

### عیب‌یابی
- **EPERM در ویندوز**:
  1) همه‌ی پروسه‌های Node را ببندید: `Get-Process node | Stop-Process -Force`
  2) حذف `.prisma` و `@prisma/client` از `node_modules`
  3) `npx prisma generate`
- **اتصال DB**: `GET /db/health` باید `{db:"ok"}` برگرداند.
- **پورت‌ها**: اگر 3000 اشغال است، `PORT` را در `.env` تغییر دهید.

### CI
- Workflow در ریشه: `.github/workflows/ci.yml` (Install → Generate → Lint → Build → Test)

### ساختار
```
src/
  config/paths.ts
  routes/health.ts
  routes/db.ts
  index.ts
prisma/
public/ uploads/ tmp/ logs/
```
