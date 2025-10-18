import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

// Type definitions
interface QuizQuestion {
  id: string | number;
  type: "text" | "checkbox" | "radio";
  question: string;
  choices?: string[];
  correctIndex?: number;
  correctIndexes?: number[];
  correctText?: string;
}

interface Answer {
  id: string | number;
  value: string | number | number[];
}

interface GradeRequest {
  answers: Answer[];
}

interface GradeResult {
  id: string | number;
  correct: boolean;
}

interface GradeResponse {
  score: number;
  total: number;
  results: GradeResult[];
}

const app = new Hono();

// Sample quiz data
const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    type: "radio",
    question: "What is the capital of France?",
    choices: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
  },
  {
    id: 2,
    type: "checkbox",
    question: "Which of the following are programming languages?",
    choices: ["JavaScript", "HTML", "Python", "CSS"],
    correctIndexes: [0, 2],
  },
  {
    id: 3,
    type: "text",
    question: "What is 2 + 2?",
    correctText: "4",
  },
  {
    id: 4,
    type: "radio",
    question: "Which planet is closest to the Sun?",
    choices: ["Venus", "Mercury", "Earth", "Mars"],
    correctIndex: 1,
  },
  {
    id: 5,
    type: "checkbox",
    question: "Which are primary colors?",
    choices: ["Red", "Green", "Blue", "Yellow"],
    correctIndexes: [0, 2, 3],
  },
  {
    id: 6,
    type: "text",
    question: "What is the largest mammal in the world?",
    correctText: "blue whale",
  },
  {
    id: 7,
    type: "radio",
    question: "Who painted the Mona Lisa?",
    choices: [
      "Vincent van Gogh",
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Michelangelo",
    ],
    correctIndex: 2,
  },
  {
    id: 8,
    type: "checkbox",
    question: "Which are continents?",
    choices: ["Asia", "Europe", "Antarctica", "Greenland"],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 9,
    type: "text",
    question: "What is the chemical symbol for gold?",
    correctText: "Au",
  },
  {
    id: 10,
    type: "radio",
    question: "What is the smallest country in the world?",
    choices: ["Monaco", "Vatican City", "Liechtenstein", "San Marino"],
    correctIndex: 1,
  },
  {
    id: 11,
    type: "checkbox",
    question: "Which are renewable energy sources?",
    choices: ["Solar", "Coal", "Wind", "Nuclear"],
    correctIndexes: [0, 2],
  },
  {
    id: 12,
    type: "text",
    question: "What year did World War II end?",
    correctText: "1945",
  },
  {
    id: 13,
    type: "radio",
    question: "What is the largest ocean on Earth?",
    choices: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
  },
  {
    id: 14,
    type: "checkbox",
    question: "Which are programming paradigms?",
    choices: ["Object-Oriented", "Functional", "Procedural", "HTML"],
    correctIndexes: [0, 1, 2],
  },
  {
    id: 15,
    type: "text",
    question: "What is the speed of light in vacuum?",
    correctText: "299792458",
  },
];

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

    return correctIndexes.every((index) => answerIndexes.includes(index));
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
