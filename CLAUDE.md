# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page quiz app about Pokémon card rules for beginners. No build step, no framework, no dependencies — everything lives in `index.html`.

## Deployment

**Preview to Vercel:**
```bash
vercel --scope potato-revolutions-projects
```

**Production to Vercel:**
```bash
vercel --prod --scope potato-revolutions-projects
```

**GitHub Pages** is also active at `https://potato-revolution.github.io/pokemon-card-rules/` and updates automatically on push to `main`.

## Architecture

`index.html` is self-contained with three sections:

- **CSS** (`<style>`) — CSS variables for the Pokémon color scheme (`--red`, `--yellow`, `--blue`), three screen layouts (`start-screen`, `quiz-screen`, `result-screen`), and `.is-correct` / `.is-wrong` / `.is-muted` classes applied to options after answering.
- **HTML** — Three `<div class="screen">` blocks; only the one with `.active` is displayed. Screens: `startScreen` → `quizScreen` → `resultScreen`.
- **JS** (`<script>`) — `QUESTIONS` array (20 objects with `category`, `question`, `options[]`, `correct` index, `explanation`), a `state` object tracking `{questions, idx, score, answered}`, and five functions: `startQuiz`, `renderQuestion`, `handleAnswer`, `nextQuestion`, `showResult`.

## Modifying Quiz Content

Questions are in the `QUESTIONS` array near the bottom of `index.html`. Each entry:

```js
{
    category: "カテゴリ名",
    question: "問題文",
    options: ["A", "B", "C", "D"],  // always 4 options
    correct: 2,                      // 0-based index of correct answer
    explanation: "解説（<strong>タグ使用可）"
}
```

Questions are shuffled on each `startQuiz()` call; option order is fixed.

## Rank Thresholds

Defined in the `RANKS` array (5 tiers: 100% / 80% / 60% / 40% / 0%). Edit there to change emoji, titles, and messages shown on the result screen.

# テストコード作成時の順守事項

## 絶対に守ってください！

### テストコードの品質
- テストは必ず実際の機能を検証すること
- `except(true).toBe(true)`のような意味のないアサーションは絶対に書かない
- 各テストケースは具体的な入力と期待される出力を検証すること
- モックは必要最小限に留め、実際の動作に近い形でテストすること

### ハードコーディングの禁止
- テストを通すためだけのハードコードは絶対に禁止
- 本番コードに`if (testMode)`のような条件分岐を入れない
- テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない
- 環境変数や設定ファイルを使用して、テスト環境と本番環境を適切に分離すること

### テスト実装の原則
- テストが失敗する状態から始めること（Red-Green-Refactor）
- 境界値、異常系、エラーケースも必ずテストすること
- カバレッジだけでなく、実際の品質を重視すること
- テストケース名は何をテストしているのか明確に記述すること

### 実装前の確認
- 機能の仕様を正しく理解してからテストを書くこと
- 不明な点があれば、仮の実装ではなく、ユーザーに確認すること