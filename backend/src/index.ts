import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { healthRouter } from "./routes/health";
import { dbRouter } from "./routes/db";
import { PATHS } from "./config/paths";
import { env } from "./config/env";   // ⬅️ جدید
import { authRouter } from './routes/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// اطمینان از وجود پوشه‌ها
[PATHS.public(), PATHS.uploads(), PATHS.tmp(), PATHS.logs()].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// استاتیک و روت‌ها
app.use("/public", express.static(PATHS.public()));
app.use("/health", healthRouter);
app.use("/db", dbRouter);

const PORT = env.PORT; // ⬅️ از env بخوان
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
app.use('/auth', authRouter);