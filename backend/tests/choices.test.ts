/* eslint-env jest */
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

describe("Choice CRUD flow", () => {
  const email = `choice${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken: string;
  let surveyId: string;
  let questionId: string;
  let choiceId: string;

  beforeAll(async () => {
    await prisma.choice.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.survey.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("register & login user", async () => {
    await request(app).post("/auth/register").send({ email, password }).expect(201);
    const res = await request(app).post("/auth/login").send({ email, password }).expect(200);
    accessToken = res.body.accessToken;
  });

  it("create survey + question", async () => {
    const survey = await request(app)
      .post("/surveys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Survey with question" })
      .expect(201);
    surveyId = survey.body.survey.id;

    const question = await request(app)
      .post(`/surveys/${surveyId}/questions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Favorite color?", type: "SINGLE_CHOICE" })
      .expect(201);

    questionId = question.body.question.id;
  });

  it("create a choice", async () => {
    const res = await request(app)
      .post(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ label: "Red", value: "red", order: 1 })
      .expect(201);

    choiceId = res.body.choice.id;
    expect(res.body.choice.label).toBe("Red");
  });

  it("list choices of question", async () => {
    const res = await request(app)
      .get(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("update a choice", async () => {
    const res = await request(app)
      .patch(`/choices/${choiceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ label: "Blue" })
      .expect(200);

    expect(res.body.choice.label).toBe("Blue");
  });

  it("delete a choice", async () => {
    await request(app)
      .delete(`/choices/${choiceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.find((c: any) => c.id === choiceId)).toBeUndefined();
  });
});
