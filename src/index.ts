import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { quizQuestions } from "./data";
import {
  GradeRequest,
  GradeResponse,
  GradeResult,
  QuizQuestion,
} from "./types";
import { getRandomQuestions, isAnswerCorrect } from "./utils";

const app = new Hono();

// Add CORS middleware
app.use(
  "*",
  cors({
    origin: ["https://quiz-web-gules.vercel.app", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/api/quiz", (c) => {
  try {
    const questions = getRandomQuestions();

    const questionsForClient = questions.map((q: QuizQuestion) => {
      const { correctIndex, correctIndexes, correctText, ...question } = q;
      return question;
    });

    return c.json(questionsForClient);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return c.json({ error: "Failed to fetch quiz questions" }, 500);
  }
});

app.post("/api/grade", async (c) => {
  try {
    const body = (await c.req.json()) as GradeRequest;

    if (!body.answers || !Array.isArray(body.answers)) {
      return c.json(
        { error: "Invalid payload: answers must be an array" },
        400
      );
    }

    if (body.answers.length === 0) {
      return c.json(
        { error: "Invalid payload: answers array cannot be empty" },
        400
      );
    }

    for (const answer of body.answers) {
      if (!answer.id || answer.value === undefined || answer.value === null) {
        return c.json(
          { error: "Invalid payload: each answer must have id and value" },
          400
        );
      }
    }

    const results: GradeResult[] = [];
    let correctCount = 0;

    for (const answer of body.answers) {
      const question = quizQuestions.find((q) => q.id === answer.id);

      if (!question) {
        return c.json(
          { error: `Question with id ${answer.id} not found` },
          400
        );
      }

      const isCorrect = isAnswerCorrect(question, answer);
      results.push({
        id: answer.id,
        correct: isCorrect,
      });

      if (isCorrect) {
        correctCount++;
      }
    }

    const response: GradeResponse = {
      score: correctCount,
      total: body.answers.length,
      results,
    };

    return c.json(response);
  } catch (error) {
    console.error("Error grading quiz:", error);

    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    return c.json({ error: "Failed to grade quiz" }, 500);
  }
});

app.get("/", (c) => {
  return c.text("Quiz API is running!");
});

export const handler = handle(app);
