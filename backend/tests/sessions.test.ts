/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-explicit-any */

import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

describe("Sessions management flow", () => {
  const email = `s${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken1: string;
  let accessToken2: string;

  beforeAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("registers and logs in twice to create two sessions", async () => {
    // Register
    await request(app)
      .post("/auth/register")
      .send({ email, password, name: "SessionUser" })
      .expect(201);

    // First login
    const r1 = await request(app)
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    accessToken1 = r1.body.accessToken;

    // Second login
    const r2 = await request(app)
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    accessToken2 = r2.body.accessToken;

    // List sessions
    const list = await request(app)
      .get("/auth/sessions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(200);

    expect(list.body.items.length).toBeGreaterThanOrEqual(2);
  });

  it("revokes one session", async () => {
    const list = await request(app)
      .get("/auth/sessions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(200);
    const target = list.body.items[0];

    await request(app)
      .post(`/auth/sessions/${target.id}/revoke`)
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(200);

    const after = await request(app)
      .get("/auth/sessions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(200);

    const revoked = after.body.items.find((s: any) => s.id === target.id);
    expect(revoked.revokedAt).toBeTruthy();
  });

  it("logout-all revokes all sessions", async () => {
    await request(app)
      .post("/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken2}`)
      .expect(200);

    const after = await request(app)
      .get("/auth/sessions")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(200);

    expect(after.body.items.every((s: any) => s.revokedAt)).toBe(true);
  });
});
