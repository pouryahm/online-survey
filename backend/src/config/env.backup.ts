import "dotenv/config";

type Env = {
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_EXPIRES: string;
  FRONTEND_ORIGIN?: string;   // برای سازگاری قدیمی
  FRONTEND_ORIGINS: string[]; // ✅ لیست Originهای مجاز
  PWD_RESET_EXPIRES_MIN: number;
};

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

// ✅ کمکی: ENV کاما-جدا را به آرایه تبدیل کن
function csv(name: string, def?: string): string[] {
  const raw = process.env[name] ?? def ?? "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: req("DATABASE_URL"),
  JWT_ACCESS_SECRET: req("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: req("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,                    // اختیاری
  FRONTEND_ORIGINS: csv("FRONTEND_ORIGIN", "http://localhost:5173"), // ✅ جدید
  PWD_RESET_EXPIRES_MIN: Number(process.env.PWD_RESET_EXPIRES_MIN ?? 15),
};
