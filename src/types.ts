export interface QuizQuestion {
  id: string | number;
  type: "text" | "checkbox" | "radio";
  question: string;
  choices?: string[];
  correctIndex?: number;
  correctIndexes?: number[];
  correctText?: string;
}

export interface Answer {
  id: string | number;
  value: string | number | number[];
}

export interface GradeRequest {
  answers: Answer[];
}

export interface GradeResult {
  id: string | number;
  correct: boolean;
}

export interface GradeResponse {
  score: number;
  total: number;
  results: GradeResult[];
}
