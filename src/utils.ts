import { quizQuestions } from "./data";
import { Answer, QuizQuestion } from "./types";

export function getRandomQuestions(count: number = 10): QuizQuestion[] {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, quizQuestions.length));
}

export function isAnswerCorrect(
  question: QuizQuestion,
  answer: Answer
): boolean {
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
