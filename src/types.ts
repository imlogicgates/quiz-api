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

export type { Answer, GradeRequest, GradeResponse, GradeResult, QuizQuestion };
