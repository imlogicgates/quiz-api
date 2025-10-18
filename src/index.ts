import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { quizQuestions } from "./data";
import {
  Answer,
  GradeRequest,
  GradeResponse,
  GradeResult,
  QuizQuestion,
} from "./types";

const app = new Hono();

// Helper function to get random questions
function getRandomQuestions(count: number = 10): QuizQuestion[] {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, quizQuestions.length));
}

// Helper function to validate answer
function isAnswerCorrect(question: QuizQuestion, answer: Answer): boolean {
  if (question.type === "text") {
    return (
      question.correctText?.toLowerCase().trim() ===
      String(answer.value).toLowerCase().trim()
    );
  }

  if (question.type === "radio") {
    return question.correctIndex === answer.value;
  }

  if (question.type === "checkbox") {
    const correctIndexes = question.correctIndexes || [];
    const answerIndexes = Array.isArray(answer.value)
      ? answer.value
      : [answer.value];

    if (correctIndexes.length !== answerIndexes.length) {
      return false;
    }

    return correctIndexes.every((index: number) =>
      answerIndexes.includes(index)
    );
  }

  return false;
}

// GET /api/quiz endpoint
app.get("/api/quiz", (c) => {
  try {
    const questions = getRandomQuestions();

    // Remove correct answers from response
    const questionsForClient = questions.map((q) => {
      const { correctIndex, correctIndexes, correctText, ...question } = q;
      return question;
    });

    return c.json(questionsForClient);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return c.json({ error: "Failed to fetch quiz questions" }, 500);
  }
});

// POST /api/grade endpoint
app.post("/api/grade", async (c) => {
  try {
    const body = (await c.req.json()) as GradeRequest;

    // Validate request body
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

    // Validate each answer
    for (const answer of body.answers) {
      if (!answer.id || answer.value === undefined || answer.value === null) {
        return c.json(
          { error: "Invalid payload: each answer must have id and value" },
          400
        );
      }
    }

    // Grade the answers
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

// Health check endpoint
app.get("/", (c) => {
  return c.text("Quiz API is running!");
});

export const handler = handle(app);
