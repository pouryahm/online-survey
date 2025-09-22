/* eslint-env jest */
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

describe("Questions & Choices CRUD", () => {
  const email = `qtest${Date.now()}@example.com`;
  const password = "P@ssw0rd!";
  let accessToken: string;
  let surveyId: string;
  let questionId: string;

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

  it("create a survey for questions", async () => {
    const res = await request(app)
      .post("/surveys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Survey for questions" })
      .expect(201);

    surveyId = res.body.survey.id;
  });

  it("create a question", async () => {
    const res = await request(app)
      .post(`/surveys/${surveyId}/questions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Your age?", type: "NUMBER", required: true, order: 1 })
      .expect(201);

    questionId = res.body.question.id;
    expect(res.body.question.title).toBe("Your age?");
  });

  it("update the question", async () => {
    const res = await request(app)
      .patch(`/questions/${questionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Q", required: false })
      .expect(200);

    expect(res.body.question.title).toBe("Updated Q");
    expect(res.body.question.required).toBe(false);
  });

  it("add choices to question", async () => {
    const res = await request(app)
      .post(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        choices: [
          { label: "Option A", value: "A" },
          { label: "Option B", value: "B" },
        ],
      })
      .expect(201);

    expect(res.body.count).toBe(2);
  });

  it("delete the question", async () => {
    await request(app)
      .delete(`/questions/${questionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const check = await prisma.question.findUnique({ where: { id: questionId } });
    expect(check).toBeNull();
  });
});
