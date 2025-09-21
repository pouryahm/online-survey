import express from "express";
import dotenv from "dotenv";
import fs from "fs";

import { corsMiddleware, corsErrorHandler } from "./middleware/cors";
import { PATHS } from "./config/paths";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { dbRouter } from "./routes/db";
import { authRouter } from "./routes/auth";

dotenv.config();

const app = express();

// CORS قبل از روترها
app.use(corsMiddleware);

// به‌جای app.options('*', ...) — پاسخ جهانی برای preflight
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // هدرهای CORS همین الان توسط corsMiddleware ست شده‌اند
    return res.sendStatus(204);
  }
  next();
});

app.use(corsErrorHandler);

// JSON body
app.use(express.json());

// ساخت دایرکتوری‌ها اگر وجود ندارند
[PATHS.public(), PATHS.uploads(), PATHS.tmp(), PATHS.logs()].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// استاتیک و روترها
app.use("/public", express.static(PATHS.public()));
app.use("/health", healthRouter);
app.use("/db", dbRouter);
app.use("/auth", authRouter);

// شروع سرور
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
