import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { Question } from './types';

// テスト用に問題数を減らし、正解インデックスを明確にした3問
const MOCK_QUESTIONS: Question[] = [
  { category: 'テスト', question: 'テスト問題1', options: ['正解A', 'B', 'C', 'D'], correct: 0, explanation: 'テスト解説1' },
  { category: 'テスト', question: 'テスト問題2', options: ['A', 'B', '正解C', 'D'], correct: 2, explanation: 'テスト解説2' },
  { category: 'テスト', question: 'テスト問題3', options: ['A', 'B', 'C', '正解D'], correct: 3, explanation: 'テスト解説3' },
];

// 全問回答して結果画面まで進むヘルパー（問題ごとに選択肢0番を選択）
async function completeAllQuestions(questionCount = MOCK_QUESTIONS.length) {
  const user = userEvent.setup();
  render(<App _questions={MOCK_QUESTIONS} />);
  await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));

  for (let i = 0; i < questionCount; i++) {
    await user.click(screen.getByTestId('option-0'));
    await user.click(screen.getByTestId('next-btn'));
  }
}

// ────────────────────────────────────────
// スタート画面
// ────────────────────────────────────────
describe('スタート画面', () => {
  it('初期表示でスタート画面が表示される', () => {
    render(<App _questions={MOCK_QUESTIONS} />);
    expect(screen.getByTestId('start-screen')).toBeInTheDocument();
  });

  it('「クイズをはじめよう！」の見出しが表示される', () => {
    render(<App _questions={MOCK_QUESTIONS} />);
    expect(screen.getByText('クイズをはじめよう！')).toBeInTheDocument();
  });

  it('スタートボタンが表示される', () => {
    render(<App _questions={MOCK_QUESTIONS} />);
    expect(screen.getByRole('button', { name: /クイズをスタート/ })).toBeInTheDocument();
  });

  it('初期状態でクイズ画面は表示されていない', () => {
    render(<App _questions={MOCK_QUESTIONS} />);
    expect(screen.queryByTestId('quiz-screen')).not.toBeInTheDocument();
  });
});

// ────────────────────────────────────────
// クイズ画面への遷移
// ────────────────────────────────────────
describe('クイズ画面への遷移', () => {
  it('スタートボタンを押すとクイズ画面が表示される', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('quiz-screen')).toBeInTheDocument();
  });

  it('スタート後、スタート画面が非表示になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.queryByTestId('start-screen')).not.toBeInTheDocument();
  });

  it('最初の問題カウントが「問題 1 / 3」になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('q-count')).toHaveTextContent('問題 1 / 3');
  });

  it('スタート時のスコアは「✓ 0 正解」', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 0 正解');
  });

  it('最初の問題テキストが表示される', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('question-text')).toHaveTextContent('テスト問題1');
  });
});

// ────────────────────────────────────────
// 選択肢の表示
// ────────────────────────────────────────
describe('選択肢の表示', () => {
  async function startQuiz() {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    return user;
  }

  it('4つの選択肢ボタンが表示される', async () => {
    await startQuiz();
    const options = within(screen.getByTestId('options')).getAllByRole('button');
    expect(options).toHaveLength(4);
  });

  it('選択肢のテキストが正しく表示される', async () => {
    await startQuiz();
    expect(screen.getByTestId('option-0')).toHaveTextContent('正解A');
    expect(screen.getByTestId('option-1')).toHaveTextContent('B');
    expect(screen.getByTestId('option-2')).toHaveTextContent('C');
    expect(screen.getByTestId('option-3')).toHaveTextContent('D');
  });

  it('回答前は選択肢ボタンがすべて有効（disabled=false）', async () => {
    await startQuiz();
    ['option-0', 'option-1', 'option-2', 'option-3'].forEach((id) => {
      expect(screen.getByTestId(id)).not.toBeDisabled();
    });
  });

  it('回答前は解説が表示されていない', async () => {
    await startQuiz();
    expect(screen.queryByTestId('explanation')).not.toBeInTheDocument();
  });

  it('回答前は「次の問題へ」ボタンが表示されていない', async () => {
    await startQuiz();
    expect(screen.queryByTestId('next-btn')).not.toBeInTheDocument();
  });
});

// ────────────────────────────────────────
// 回答後の状態
// ────────────────────────────────────────
describe('回答後の状態', () => {
  async function startAndAnswer(optionIdx: number) {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await user.click(screen.getByTestId(`option-${optionIdx}`));
    return user;
  }

  it('正解を選ぶと解説エリアが表示される', async () => {
    await startAndAnswer(0); // Q1のcorrect=0
    expect(screen.getByTestId('explanation')).toBeInTheDocument();
  });

  it('不正解を選んでも解説エリアが表示される', async () => {
    await startAndAnswer(1); // Q1のcorrect=0 なので不正解
    expect(screen.getByTestId('explanation')).toBeInTheDocument();
  });

  it('正解を選ぶと「✅ 正解！」が表示される', async () => {
    await startAndAnswer(0);
    expect(screen.getByTestId('answer-result')).toHaveTextContent('✅ 正解！');
  });

  it('不正解を選ぶと「❌ 不正解...」が表示される', async () => {
    await startAndAnswer(1);
    expect(screen.getByTestId('answer-result')).toHaveTextContent('❌ 不正解...');
  });

  it('回答後はすべての選択肢ボタンがdisabledになる', async () => {
    await startAndAnswer(0);
    ['option-0', 'option-1', 'option-2', 'option-3'].forEach((id) => {
      expect(screen.getByTestId(id)).toBeDisabled();
    });
  });

  it('回答後に「次の問題へ」ボタンが表示される', async () => {
    await startAndAnswer(0);
    expect(screen.getByTestId('next-btn')).toBeInTheDocument();
  });

  it('正解を選ぶとスコアが1になる', async () => {
    await startAndAnswer(0);
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 1 正解');
  });

  it('不正解を選んでもスコアは0のまま', async () => {
    await startAndAnswer(1);
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 0 正解');
  });

  it('disabled後に別の選択肢を押してもスコアが変化しない', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await user.click(screen.getByTestId('option-0')); // 正解
    // disabled なので click しても反応しない
    await user.click(screen.getByTestId('option-1'));
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 1 正解');
  });

  it('解説テキストが表示される', async () => {
    await startAndAnswer(0);
    expect(screen.getByTestId('explanation-text')).toHaveTextContent('テスト解説1');
  });
});

// ────────────────────────────────────────
// 問題の進行
// ────────────────────────────────────────
describe('問題の進行', () => {
  async function answerAndNext(user: ReturnType<typeof userEvent.setup>, optionIdx = 0) {
    await user.click(screen.getByTestId(`option-${optionIdx}`));
    await user.click(screen.getByTestId('next-btn'));
  }

  it('「次の問題へ」を押すと問題番号が2になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await answerAndNext(user);
    expect(screen.getByTestId('q-count')).toHaveTextContent('問題 2 / 3');
  });

  it('問題が進むと問題テキストが切り替わる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await answerAndNext(user);
    expect(screen.getByTestId('question-text')).toHaveTextContent('テスト問題2');
  });

  it('次の問題では解説が再び非表示になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await answerAndNext(user);
    expect(screen.queryByTestId('explanation')).not.toBeInTheDocument();
  });

  it('次の問題では選択肢が再び有効になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await answerAndNext(user);
    ['option-0', 'option-1', 'option-2', 'option-3'].forEach((id) => {
      expect(screen.getByTestId(id)).not.toBeDisabled();
    });
  });

  it('最後の問題では次ボタンのテキストが「結果を見る 🏆」になる', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    // Q1, Q2 を進め、最後のQ3で回答
    await answerAndNext(user);
    await answerAndNext(user);
    await user.click(screen.getByTestId('option-0')); // Q3に回答（まだ次に進まない）
    expect(screen.getByTestId('next-btn')).toHaveTextContent('結果を見る 🏆');
  });

  it('正解・不正解を連続して正しくスコアが累積される', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    await answerAndNext(user, 0); // Q1: correct=0 → 正解
    await answerAndNext(user, 0); // Q2: correct=2 → 不正解
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 1 正解');
  });
});

// ────────────────────────────────────────
// 結果画面
// ────────────────────────────────────────
describe('結果画面', () => {
  it('全問回答後に結果画面が表示される', async () => {
    await completeAllQuestions();
    expect(screen.getByTestId('result-screen')).toBeInTheDocument();
  });

  it('結果画面にクイズ画面は表示されない', async () => {
    await completeAllQuestions();
    expect(screen.queryByTestId('quiz-screen')).not.toBeInTheDocument();
  });

  it('「もう一度チャレンジ」ボタンが表示される', async () => {
    await completeAllQuestions();
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
  });

  it('スコアが結果画面に表示される（0点の場合）', async () => {
    const user = userEvent.setup();
    // 3問すべて不正解（選択肢1番、correct は各問0/2/3）
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByTestId('option-1')); // Q1: wrong, Q2: wrong, Q3: wrong
      await user.click(screen.getByTestId('next-btn'));
    }
    expect(screen.getByTestId('final-score')).toHaveTextContent('0');
  });

  it('全問正解の場合スコアが3と表示される', async () => {
    const user = userEvent.setup();
    render(<App _questions={MOCK_QUESTIONS} />);
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    // Q1:correct=0, Q2:correct=2, Q3:correct=3
    await user.click(screen.getByTestId('option-0'));
    await user.click(screen.getByTestId('next-btn'));
    await user.click(screen.getByTestId('option-2'));
    await user.click(screen.getByTestId('next-btn'));
    await user.click(screen.getByTestId('option-3'));
    await user.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('final-score')).toHaveTextContent('3');
  });

  it('正解数と不正解数の合計が問題数と一致する', async () => {
    await completeAllQuestions();
    const correct = parseInt(screen.getByTestId('correct-count').textContent ?? '0');
    const wrong = parseInt(screen.getByTestId('wrong-count').textContent ?? '0');
    expect(correct + wrong).toBe(MOCK_QUESTIONS.length);
  });

  it('ランクメッセージが表示される', async () => {
    await completeAllQuestions();
    const msg = screen.getByTestId('rank-msg');
    expect(msg.textContent?.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────
// リトライ
// ────────────────────────────────────────
describe('リトライ', () => {
  it('「もう一度チャレンジ」を押すとスタート画面に戻る', async () => {
    const user = userEvent.setup();
    await completeAllQuestions();
    await user.click(screen.getByTestId('retry-btn'));
    expect(screen.getByTestId('start-screen')).toBeInTheDocument();
  });

  it('リトライ後はスコアが0に戻る', async () => {
    const user = userEvent.setup();
    await completeAllQuestions();
    await user.click(screen.getByTestId('retry-btn'));
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('score')).toHaveTextContent('✓ 0 正解');
  });

  it('リトライ後は問題1から始まる', async () => {
    const user = userEvent.setup();
    await completeAllQuestions();
    await user.click(screen.getByTestId('retry-btn'));
    await user.click(screen.getByRole('button', { name: /クイズをスタート/ }));
    expect(screen.getByTestId('q-count')).toHaveTextContent('問題 1 / 3');
  });
});
