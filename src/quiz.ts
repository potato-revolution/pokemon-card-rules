import { RANKS } from './data';
import type { QuizState, Question, Rank } from './types';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function calcPercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

export function getRank(score: number, total: number): Rank {
  const pct = calcPercentage(score, total);
  return RANKS.find((r) => pct >= r.min)!;
}

export function createInitialState(questions: Question[]): QuizState {
  return { questions, idx: 0, score: 0, answered: false, selectedIdx: null };
}

export function isCorrectAnswer(state: QuizState, selectedIdx: number): boolean {
  return selectedIdx === state.questions[state.idx].correct;
}

export function answerQuestion(state: QuizState, selectedIdx: number): QuizState {
  if (state.answered) return state;
  return {
    ...state,
    score: isCorrectAnswer(state, selectedIdx) ? state.score + 1 : state.score,
    answered: true,
    selectedIdx,
  };
}

export function advanceQuestion(state: QuizState): QuizState {
  return { ...state, idx: state.idx + 1, answered: false, selectedIdx: null };
}

export function isLastQuestion(state: QuizState): boolean {
  return state.idx === state.questions.length - 1;
}
