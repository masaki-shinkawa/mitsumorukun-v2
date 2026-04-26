# みつもるくん2

RFP等のドキュメントから要件を抽出し、最終的に見積もり（FP算出）まで行うツール。

## ステータス

POC フェーズ。Next.js フルスタックで構築（FastAPI は使わない）。

## プロジェクト概要

### 想定フロー
プロジェクト一覧 → プロジェクト登録 → プロジェクト詳細 → RFPアップロード → 分析開始 → 要件一覧表示

### 抽出粒度
- **概算**: 機能レベル（大機能 → 中機能）
- **詳細**: 画面単位 / API単位まで分解

### MVP スコープ
1. プロジェクト管理（CRUD）
2. RFPアップロード（**Markdown のみ**、ただし将来の形式追加を見越したアーキテクチャ）
3. 概算/詳細の要件抽出（OpenAI API）
4. 要件一覧表示・編集・エクスポート

### 後続フェーズ
- Phase 2: Google SSO 認証、ユーザー/権限管理
- Phase 3: FP算出による見積もり、見積書ドラフト生成
- 対応ファイル形式拡張: PDF / Word / その他

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 16 (App Router, Turbopack) — フルスタックで完結
- **言語**: TypeScript 5
- **UI**: React 19 / Tailwind CSS v4 / shadcn/ui (style: `base-nova`, baseColor: `neutral`, icons: `lucide`)
- **パッケージマネージャ**: pnpm 10
- **DB**: PostgreSQL（Docker）
- **オブジェクトストレージ**: MinIO（S3互換、Docker）
- **LLM**: OpenAI API
  - メイン処理（要件抽出・FP算出・ドラフト生成）: `gpt-4o`
  - 軽量処理（チャンク要約など）: `gpt-4o-mini`

### ドキュメント形式の拡張性
RFP 取り込みは「ファイル形式 → 正規化済みテキスト/構造」へ変換する **パーサー層** を抽象化し、形式追加時はパーサー実装の追加のみで済ませる。
- MVP: Markdown パーサー
- 将来: PDF / Word / HTML 等

## ディレクトリ構成

`src/` ディレクトリ + import alias `@/*` 構成。

```
mitsumorukun2/
├─ src/
│  ├─ app/                 # Next.js App Router（layout.tsx, page.tsx, globals.css）
│  ├─ components/
│  │  └─ ui/               # shadcn/ui コンポーネント（pnpm dlx shadcn@latest add で追加）
│  └─ lib/
│     ├─ utils.ts          # shadcn 標準ユーティリティ（cn など）
│     ├─ parsers/          # ドキュメントパーサー（形式ごと）— 予定
│     ├─ extractors/       # 要件抽出（OpenAI 呼び出し）— 予定
│     ├─ db/               # Postgres アクセス — 予定
│     └─ storage/          # MinIO クライアント — 予定
├─ public/
├─ components.json         # shadcn 設定
├─ next.config.ts
├─ tsconfig.json
├─ docker-compose.yml      # Postgres + MinIO（未作成）
└─ .env.example
```

## 環境変数

`.env.example` 参照。`.env` は git 管理外。

**重要**: `.env` には API Token が含まれているため**閲覧禁止**。形式は `.env.example` を参照すること。

主要変数:
- `POSTGRES_*`: PostgreSQL 接続
- `MINIO_*`: MinIO 接続
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`: OpenAI
- `FRONTEND_PORT` (3000): Next.js
- `NEXT_PUBLIC_API_URL`: ブラウザ → API ベースURL

`BACKEND_PORT` は FastAPI 廃止に伴い未使用（後で .env.example から削除予定）。

## 開発コマンド

```bash
pnpm install          # 依存インストール
pnpm dev              # 開発サーバ起動（既定 http://localhost:3000、ポート使用中なら自動シフト）
pnpm build            # 本番ビルド
pnpm start            # 本番サーバ起動
pnpm lint             # ESLint 実行

# shadcn コンポーネント追加
pnpm dlx shadcn@latest add <component>     # 例: pnpm dlx shadcn@latest add card input
```

## 設計メモ

- POC のため認証なし。ローカル/社内ネットワーク前提で起動する。
- ユーザーは社内チーム共有を想定するため、Phase 2 で Google SSO を導入する設計余地を残す（プロジェクト/要件にオーナー列を持たせる等）。
- 抽出根拠（原文の引用箇所）を要件レコードに保持し、後で監査可能にする。
- 大規模ドキュメントはチャンク分割 → `gpt-4o-mini` で要約 → `gpt-4o` で構造化抽出、の二段構成。

## ドキュメント運用ルール（Claude 向け）

作業中に以下に該当する変更や知見が得られた場合、**ユーザーに指示されなくても CLAUDE.md を更新する**こと。

- 技術スタックやバージョンの変更（依存追加・削除、メジャーアップデート）
- ディレクトリ構成の変更
- 新しい開発コマンド・運用コマンドの追加
- データモデル・主要 API・主要画面の確定
- 設計判断や設計上の前提（採用理由・棄却した選択肢を含む）
- 環境変数の追加・廃止
- 既存ドキュメントの誤りや陳腐化に気づいたとき

陳腐化や重複が見られたら、追記だけでなく**積極的に整理・削除**する。

### スキル化の指針

**繰り返し行う定型作業や、特定手順をなぞる必要がある作業**に気づいた場合、ユーザーに提案したうえでプロジェクトスキル（`.claude/skills/<name>/SKILL.md`）として作成する。例:

- shadcn コンポーネント追加 + プロジェクト規約に沿ったラッパー生成
- 新しいドキュメントパーサーの追加（`lib/parsers/` への追加 + 登録 + テストひな型）
- DB マイグレーション作成・適用の標準フロー
- OpenAI 呼び出しの新しい抽出タスク追加（プロンプト + Zod スキーマ + ジョブ登録）

スキル作成の判断基準: 「2 回以上同じ手順を踏む見込みがあり、かつ手順が 3 ステップ以上ある」場合は候補。

## Git 運用ルール

- **個人開発のため `main` ブランチへ直接 commit & push してよい**（PR・レビュー不要）。
- ただし、commit は意味のある単位で分割する（機能追加・リファクタ・設定変更を混ぜない）。
- commit 前に `pnpm lint` / `pnpm build` を通すこと。
- 機密情報（`.env` の中身、API キー、トークン）は絶対にコミットしない。
