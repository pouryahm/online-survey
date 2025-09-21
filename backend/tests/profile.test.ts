/// <reference types="jest" />
/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-explicit-any */

import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

describe("Profile API (GET/PATCH /auth/profile)", () => {
  const email = `p${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken: string;

  beforeAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("registers and logs in to obtain accessToken", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email, password, name: "Profile User" })
      .expect(201);

    const r = await request(app)
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    accessToken = r.body.accessToken;
    expect(typeof accessToken).toBe("string");
  });

  it("GET /auth/profile returns current user profile", async () => {
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.name).toBe("Profile User");
  });

  it("PATCH /auth/profile rejects invalid name", async () => {
    const bad = await request(app)
      .patch("/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: 12345 })
      .expect(400);

    expect(bad.body.message).toBeDefined();
  });

  it("PATCH /auth/profile updates name and returns updated profile", async () => {
    const res = await request(app)
      .patch("/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "New Name" })
      .expect(200);

    expect(res.body.user.name).toBe("New Name");

    const res2 = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res2.body.user.name).toBe("New Name");
  });
});
