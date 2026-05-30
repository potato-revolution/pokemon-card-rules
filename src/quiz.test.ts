import { describe, it, expect } from 'vitest';
import {
  shuffle,
  calcPercentage,
  getRank,
  createInitialState,
  answerQuestion,
  advanceQuestion,
  isLastQuestion,
  isCorrectAnswer,
} from './quiz';
import { QUESTIONS, RANKS } from './data';
import type { Question } from './types';

// テスト用に正解インデックスが明確な3問
const MOCK_QUESTIONS: Question[] = [
  { category: 'テスト', question: 'Q1', options: ['正解', 'B', 'C', 'D'], correct: 0, explanation: 'E1' },
  { category: 'テスト', question: 'Q2', options: ['A', 'B', '正解', 'D'], correct: 2, explanation: 'E2' },
  { category: 'テスト', question: 'Q3', options: ['A', 'B', 'C', '正解'], correct: 3, explanation: 'E3' },
];

// ────────────────────────────────────────
// shuffle
// ────────────────────────────────────────
describe('shuffle', () => {
  it('返り値は元の配列と同じ要素をすべて含む', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
    expect([...result].sort()).toEqual([...arr].sort());
  });

  it('元の配列を変更しない（イミュータブル）', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('1要素の配列をそのまま返す', () => {
    expect(shuffle(['only'])).toEqual(['only']);
  });
});

// ────────────────────────────────────────
// calcPercentage
// ────────────────────────────────────────
describe('calcPercentage', () => {
  it('満点は100%', () => {
    expect(calcPercentage(20, 20)).toBe(100);
  });

  it('0点は0%', () => {
    expect(calcPercentage(0, 20)).toBe(0);
  });

  it('半分正解は50%', () => {
    expect(calcPercentage(10, 20)).toBe(50);
  });

  it('total=0のときゼロ除算せず0を返す', () => {
    expect(calcPercentage(0, 0)).toBe(0);
  });

  it('端数を四捨五入する（1/3 → 33%）', () => {
    expect(calcPercentage(1, 3)).toBe(33);
  });

  it('端数を四捨五入する（2/3 → 67%）', () => {
    expect(calcPercentage(2, 3)).toBe(67);
  });
});

// ────────────────────────────────────────
// getRank
// ────────────────────────────────────────
describe('getRank', () => {
  it('20/20（100%）でチャンピオンランクを返す', () => {
    expect(getRank(20, 20).min).toBe(100);
  });

  it('16/20（80%）でジムリーダーランクを返す', () => {
    expect(getRank(16, 20).min).toBe(80);
  });

  it('12/20（60%）でライバルトレーナーランクを返す', () => {
    expect(getRank(12, 20).min).toBe(60);
  });

  it('8/20（40%）でトレーナー見習いランクを返す', () => {
    expect(getRank(8, 20).min).toBe(40);
  });

  it('0/20（0%）ではじめてのトレーナーランクを返す', () => {
    expect(getRank(0, 20).min).toBe(0);
  });

  it('境界値：19/20（95%）はチャンピオンに含まれない', () => {
    expect(getRank(19, 20).min).toBe(80);
  });

  it('境界値：15/20（75%）はジムリーダーに含まれない', () => {
    expect(getRank(15, 20).min).toBe(60);
  });

  it('すべてのランクにemoji/title/msg が存在する', () => {
    RANKS.forEach((rank) => {
      expect(rank.emoji).toBeTruthy();
      expect(rank.title).toBeTruthy();
      expect(rank.msg).toBeTruthy();
    });
  });
});

// ────────────────────────────────────────
// createInitialState
// ────────────────────────────────────────
describe('createInitialState', () => {
  it('idx=0, score=0, answered=false で初期化される', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    expect(state.idx).toBe(0);
    expect(state.score).toBe(0);
    expect(state.answered).toBe(false);
  });

  it('渡した問題配列がそのまま格納される', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    expect(state.questions).toBe(MOCK_QUESTIONS);
  });
});

// ────────────────────────────────────────
// isCorrectAnswer
// ────────────────────────────────────────
describe('isCorrectAnswer', () => {
  it('正解インデックスを選ぶとtrueを返す', () => {
    const state = createInitialState(MOCK_QUESTIONS); // Q1のcorrect=0
    expect(isCorrectAnswer(state, 0)).toBe(true);
  });

  it('不正解インデックスを選ぶとfalseを返す', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    expect(isCorrectAnswer(state, 1)).toBe(false);
    expect(isCorrectAnswer(state, 2)).toBe(false);
    expect(isCorrectAnswer(state, 3)).toBe(false);
  });
});

// ────────────────────────────────────────
// answerQuestion
// ────────────────────────────────────────
describe('answerQuestion', () => {
  it('正解を選ぶとscoreが1増え、answered=trueになる', () => {
    const state = createInitialState(MOCK_QUESTIONS); // Q1のcorrect=0
    const next = answerQuestion(state, 0);
    expect(next.score).toBe(1);
    expect(next.answered).toBe(true);
  });

  it('不正解を選ぶとscoreは変わらず、answered=trueになる', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    const next = answerQuestion(state, 1);
    expect(next.score).toBe(0);
    expect(next.answered).toBe(true);
  });

  it('answered=true の状態では2重回答できない（scoreが変化しない）', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    const answered = answerQuestion(state, 0); // 正解 → score=1
    const doubled = answerQuestion(answered, 0); // 再度正解を選んでも
    expect(doubled.score).toBe(1);
  });

  it('元のstateオブジェクトを変更しない（イミュータブル）', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    answerQuestion(state, 0);
    expect(state.score).toBe(0);
    expect(state.answered).toBe(false);
  });

  it('Q2（correct=2）で選択肢2を選ぶとスコアが増える', () => {
    const base = createInitialState(MOCK_QUESTIONS);
    const atQ2 = advanceQuestion(base);
    const answered = answerQuestion(atQ2, 2);
    expect(answered.score).toBe(1);
  });
});

// ────────────────────────────────────────
// advanceQuestion
// ────────────────────────────────────────
describe('advanceQuestion', () => {
  it('idxが1増える', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    expect(advanceQuestion(state).idx).toBe(1);
  });

  it('answeredがfalseにリセットされる', () => {
    const state = { ...createInitialState(MOCK_QUESTIONS), answered: true };
    expect(advanceQuestion(state).answered).toBe(false);
  });

  it('scoreとquestionsはそのまま引き継がれる', () => {
    const state = { ...createInitialState(MOCK_QUESTIONS), score: 2 };
    const next = advanceQuestion(state);
    expect(next.score).toBe(2);
    expect(next.questions).toBe(MOCK_QUESTIONS);
  });

  it('元のstateを変更しない（イミュータブル）', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    advanceQuestion(state);
    expect(state.idx).toBe(0);
  });
});

// ────────────────────────────────────────
// isLastQuestion
// ────────────────────────────────────────
describe('isLastQuestion', () => {
  it('最後の問題（idx = length-1）のときtrueを返す', () => {
    const state = { ...createInitialState(MOCK_QUESTIONS), idx: MOCK_QUESTIONS.length - 1 };
    expect(isLastQuestion(state)).toBe(true);
  });

  it('最初の問題（idx=0）のときfalseを返す', () => {
    const state = createInitialState(MOCK_QUESTIONS);
    expect(isLastQuestion(state)).toBe(false);
  });

  it('最後の1つ前（idx = length-2）のときfalseを返す', () => {
    const state = { ...createInitialState(MOCK_QUESTIONS), idx: MOCK_QUESTIONS.length - 2 };
    expect(isLastQuestion(state)).toBe(false);
  });
});

// ────────────────────────────────────────
// QUESTIONS データ整合性
// ────────────────────────────────────────
describe('QUESTIONS データ整合性', () => {
  it('ちょうど20問存在する', () => {
    expect(QUESTIONS).toHaveLength(20);
  });

  it('全問題に4つの選択肢がある', () => {
    QUESTIONS.forEach((q, i) => {
      expect(q.options, `問題${i + 1}の選択肢数が不正`).toHaveLength(4);
    });
  });

  it('全問題のcorrectインデックスが0〜3の範囲内', () => {
    QUESTIONS.forEach((q, i) => {
      expect(q.correct, `問題${i + 1}のcorrectが範囲外`).toBeGreaterThanOrEqual(0);
      expect(q.correct, `問題${i + 1}のcorrectが範囲外`).toBeLessThanOrEqual(3);
    });
  });

  it('全問題にquestion・explanation・categoryが空でなく存在する', () => {
    QUESTIONS.forEach((q, i) => {
      expect(q.question, `問題${i + 1}のquestionが空`).toBeTruthy();
      expect(q.explanation, `問題${i + 1}のexplanationが空`).toBeTruthy();
      expect(q.category, `問題${i + 1}のcategoryが空`).toBeTruthy();
    });
  });

  it('全問題の選択肢が空文字でない', () => {
    QUESTIONS.forEach((q, i) => {
      q.options.forEach((opt, j) => {
        expect(opt, `問題${i + 1} 選択肢${j}が空`).toBeTruthy();
      });
    });
  });

  it('正解の選択肢テキストが選択肢リストに実際に存在する', () => {
    QUESTIONS.forEach((q, i) => {
      expect(
        q.options[q.correct],
        `問題${i + 1}: correct=${q.correct} は選択肢に存在しない`
      ).toBeDefined();
    });
  });
});
