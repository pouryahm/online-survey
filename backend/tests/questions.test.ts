/* eslint-env jest */
import request from "supertest";
import app from "../src/index";
import { prisma } from "../src/lib/prisma";

interface ChoiceDto {
  id: string;
  label: string;
  value: string;
  order: number;
}

describe("Questions & Choices CRUD", () => {
  const email = `q${Date.now()}@example.com`;
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
    const survey = await request(app)
      .post("/surveys")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Survey for Qs" })
      .expect(201);

    surveyId = survey.body.survey.id;
  });

  it("create a question", async () => {
    const question = await request(app)
      .post(`/surveys/${surveyId}/questions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Your age?",
        type: "NUMBER",
        required: true,
        order: 1,
      })
      .expect(201);

    questionId = question.body.question.id;
  });

  it("update the question", async () => {
    const updated = await request(app)
      .patch(`/questions/${questionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Q", required: false })
      .expect(200);

    expect(updated.body.question.title).toBe("Updated Q");
  });

  it("add choices to question", async () => {
    const res = await request(app)
      .post(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        label: "Yes",
        value: "yes",
        order: 1,
      })
      .expect(201);

    const res2 = await request(app)
      .post(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        label: "No",
        value: "no",
        order: 2,
      })
      .expect(201);

    // چک کنیم 2 گزینه اضافه شد
    const list = await request(app)
      .get(`/questions/${questionId}/choices`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const items: ChoiceDto[] = list.body.items;
    console.log("[TEST:choices-added]", items);

    expect(items.length).toBe(2);
  });

  it("delete the question", async () => {
    await request(app)
      .delete(`/questions/${questionId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});

