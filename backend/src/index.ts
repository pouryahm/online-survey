import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { healthRouter } from './routes/health';
import { dbRouter } from './routes/db';
import { PATHS } from './config/paths';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// اطمینان از وجود پوشه‌ها
[PATHS.public(), PATHS.uploads(), PATHS.tmp(), PATHS.logs()].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// سرو فایل‌های استاتیک
app.use('/public', express.static(PATHS.public()));

// روت‌ها
app.use('/health', healthRouter);
app.use('/db', dbRouter);

// (اختیاری) دیباگ مسیرها
app.get('/diag/paths', (_req, res) => {
  res.json({
    root: PATHS.root(),
    public: PATHS.public(),
    uploads: PATHS.uploads(),
    tmp: PATHS.tmp(),
    logs: PATHS.logs(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
