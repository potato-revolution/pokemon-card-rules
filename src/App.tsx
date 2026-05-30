import { useState, useCallback } from 'react';
import type { QuizState } from './types';
import type { Question } from './types';
import { QUESTIONS, RANKS } from './data';
import { shuffle, calcPercentage, createInitialState, answerQuestion, advanceQuestion, isLastQuestion, isCorrectAnswer } from './quiz';

type Screen = 'start' | 'quiz' | 'result';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

interface AppProps {
  /** テスト用: 注入する問題一覧（省略時は本番の20問をシャッフル） */
  _questions?: Question[];
}

export default function App({ _questions }: AppProps) {
  const [screen, setScreen] = useState<Screen>('start');
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const startQuiz = useCallback(() => {
    const source = _questions ?? QUESTIONS;
    setQuiz(createInitialState(_questions ? source : shuffle(source)));
    setScreen('quiz');
  }, [_questions]);

  const handleAnswer = useCallback((selectedIdx: number) => {
    setQuiz((prev) => (prev ? answerQuestion(prev, selectedIdx) : prev));
  }, []);

  const handleNext = useCallback(() => {
    setQuiz((prev) => {
      if (!prev) return prev;
      if (isLastQuestion(prev)) {
        setScreen('result');
        return prev;
      }
      return advanceQuestion(prev);
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setQuiz(null);
    setScreen('start');
  }, []);

  if (screen === 'start') {
    return (
      <div data-testid="start-screen">
        <h2>クイズをはじめよう！</h2>
        <p>全20問・4択形式で、答えのあとに解説がつきます。</p>
        <button onClick={startQuiz}>▶ クイズをスタート</button>
      </div>
    );
  }

  if (screen === 'quiz' && quiz) {
    const q = quiz.questions[quiz.idx];
    const total = quiz.questions.length;

    return (
      <div data-testid="quiz-screen">
        <div data-testid="q-count">問題 {quiz.idx + 1} / {total}</div>
        <div data-testid="score">✓ {quiz.score} 正解</div>

        <div data-testid="question-text">{q.question}</div>
        <div data-testid="question-category">{q.category}</div>

        <div data-testid="options">
          {q.options.map((opt, i) => {
            let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
            if (quiz.answered) {
              if (i === q.correct) state = 'correct';
              else if (i === quiz.idx && !isCorrectAnswer(quiz, i)) state = 'wrong';
              else state = 'muted';
            }
            return (
              <button
                key={i}
                data-testid={`option-${i}`}
                data-state={state}
                disabled={quiz.answered}
                onClick={() => handleAnswer(i)}
                aria-label={`${LETTERS[i]}: ${opt}`}
              >
                <span>{LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {quiz.answered && quiz.selectedIdx !== null && (
          <div data-testid="explanation">
            <div data-testid="answer-result">
              {isCorrectAnswer(quiz, quiz.selectedIdx) ? '✅ 正解！' : '❌ 不正解...'}
            </div>
            <div
              data-testid="explanation-text"
              dangerouslySetInnerHTML={{ __html: q.explanation }}
            />
          </div>
        )}

        {quiz.answered && (
          <button data-testid="next-btn" onClick={handleNext}>
            {isLastQuestion(quiz) ? '結果を見る 🏆' : '次の問題へ →'}
          </button>
        )}
      </div>
    );
  }

  if (screen === 'result' && quiz) {
    const { score, questions } = quiz;
    const total = questions.length;
    const pct = calcPercentage(score, total);
    const rank = RANKS.find((r) => pct >= r.min)!;

    return (
      <div data-testid="result-screen">
        <div data-testid="rank-emoji">{rank.emoji}</div>
        <div data-testid="rank-title">{rank.title}</div>
        <div data-testid="final-score">{score}</div>
        <div>問正解 / {total}問中</div>
        <div data-testid="correct-count">{score}</div>
        <div data-testid="wrong-count">{total - score}</div>
        <div data-testid="rank-msg">{rank.msg}</div>
        <button data-testid="retry-btn" onClick={resetQuiz}>
          🔄 もう一度チャレンジ
        </button>
      </div>
    );
  }

  return null;
}
