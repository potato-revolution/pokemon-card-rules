export interface Question {
  category: string;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface Rank {
  min: number;
  emoji: string;
  title: string;
  sub: string;
  msg: string;
}

export interface QuizState {
  questions: Question[];
  idx: number;
  score: number;
  answered: boolean;
  selectedIdx: number | null;
}
