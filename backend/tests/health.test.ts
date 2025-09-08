import request from "supertest";
import express from "express";
import { healthRouter } from "../src/routes/health";

describe("GET /health", () => {
  const app = express();
  app.use("/health", healthRouter);

  it("returns 200 and {status:'ok'}", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
