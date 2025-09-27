/* eslint-env jest */
import request, { Response as SuperRes } from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

function dumpFail(title: string, res: SuperRes) {
  console.log(`[AUTH:${title}] status=`, res.status);
  console.log(`[AUTH:${title}] body=`, res.body);
  console.log(`[AUTH:${title}] text=`, res.text);
}

describe("Auth flow: register/login/refresh/logout", () => {
  const email = `auth_${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken = "";
  let refreshToken = "";

  beforeAll(async () => {
    // فقط کاربرها رو پاک می‌کنیم
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email, password });

    if (res.status !== 201) dumpFail("register", res);
    expect(res.status).toBe(201);
  });

  it("logs in the user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email, password });

    if (res.status !== 200) dumpFail("login", res);
    expect(res.status).toBe(200);

    accessToken = String(res.body.accessToken);
    refreshToken = String(res.body.refreshToken);

    expect(accessToken.length).toBeGreaterThan(10);
    expect(refreshToken.length).toBeGreaterThan(10);
  });

  it("gets /auth/me with accessToken", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    if (res.status !== 200) dumpFail("me", res);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("refresh rotates refresh token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    if (res.status !== 200) dumpFail("refresh", res);
    expect(res.status).toBe(200);

    accessToken = String(res.body.accessToken);
    refreshToken = String(res.body.refreshToken);
    expect(accessToken.length).toBeGreaterThan(10);
    expect(refreshToken.length).toBeGreaterThan(10);
  });

  it("logout revokes the current refresh token", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .send({ refreshToken });

    if (res.status !== 200) dumpFail("logout", res);
    expect(res.status).toBe(200);
  });
});
