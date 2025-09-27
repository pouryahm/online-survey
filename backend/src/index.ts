import express from "express";
import dotenv from "dotenv";
import fs from "fs";

import { corsMiddleware, corsErrorHandler } from "./middleware/cors";
import { PATHS } from "./config/paths";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { dbRouter } from "./routes/db";
import { authRouter } from "./routes/auth";
import profileRouter from "./routes/profile";
import sessionsRouter from "./routes/sessions";
import surveysRouter from "./routes/surveys";
import questionsRouter from "./routes/questions";
import choicesRouter from "./routes/choices";

dotenv.config();
const app = express();

// Middleware ها
app.use(corsMiddleware);
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(corsErrorHandler);
app.use(express.json());

// ensure dirs
[PATHS.public(), PATHS.uploads(), PATHS.tmp(), PATHS.logs()].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// Routes
app.use("/public", express.static(PATHS.public()));
app.use("/health", healthRouter);
app.use("/db", dbRouter);
app.use("/auth", authRouter);
app.use(profileRouter);
app.use(sessionsRouter);
app.use(surveysRouter);
app.use(questionsRouter);
app.use(choicesRouter);

// فقط وقتی NODE_ENV !== test سرور ران بشه
if (process.env.NODE_ENV !== "test") {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

export default app;
