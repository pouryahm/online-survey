/* eslint-env jest */
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

describe("Survey CRUD flow", () => {
  const email = `survey${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken: string;
  let surveyId: string;

  beforeAll(async () => {
    // پاک‌سازی دیتابیس
    await prisma.choice.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.survey.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("register & login user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email, password, name: "SurveyUser" })
      .expect(201);

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    accessToken = res.body.accessToken;
    expect(typeof accessToken).toBe("string");
  });

  it("creates a new survey", async () => {
    const res = await request(app)
      .post("/surveys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "My first survey", description: "Testing survey CRUD" })
      .expect(201);

    expect(res.body.survey.title).toBe("My first survey");
    surveyId = res.body.survey.id;
  });

  it("gets list of surveys for the user", async () => {
    const res = await request(app)
      .get("/surveys")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("gets survey by id", async () => {
    const res = await request(app)
      .get(`/surveys/${surveyId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.survey.id).toBe(surveyId);
    expect(res.body.survey.questions).toEqual([]); // هنوز سوالی نداره
  });

  it("updates the survey", async () => {
    const res = await request(app)
      .patch(`/surveys/${surveyId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated survey title", isPublished: true })
      .expect(200);

    expect(res.body.survey.title).toBe("Updated survey title");
    expect(res.body.survey.isPublished).toBe(true);
  });

  it("deletes the survey", async () => {
    await request(app)
      .delete(`/surveys/${surveyId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/surveys/${surveyId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.message).toBe("Survey not found");
  });
});
afterAll(async () => {
  await prisma.$disconnect();
});
