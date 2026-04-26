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

[bulletproof-react](https://github.com/alan2207/bulletproof-react) のレイアウト規約を Next.js App Router 向けに翻訳して採用する。`src/` ディレクトリ + import alias `@/*` 構成。

```
mitsumorukun2/
├─ src/
│  ├─ app/                 # Next.js App Router（ルーティングとページ層のみ）
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ globals.css
│  │  └─ <route>/page.tsx  # 各ルートはここに配置（feature 本体は features/ に置く）
│  ├─ components/          # アプリ全体で共有する UI コンポーネント
│  │  └─ ui/               # shadcn/ui コンポーネント（pnpm dlx shadcn@latest add で追加）
│  ├─ config/              # 環境変数の解釈・グローバル設定（envSchema など）
│  ├─ features/            # 機能（feature）単位のモジュール群（後述の内部構造を厳守）
│  │  └─ <feature-name>/
│  ├─ hooks/               # アプリ全体で共有する hooks
│  ├─ lib/                 # 外部サービス用クライアント等の再利用ライブラリ層
│  │  ├─ utils.ts          # shadcn 標準ユーティリティ（cn など）
│  │  ├─ db/               # Postgres クライアント（Prisma/Drizzle 等）
│  │  ├─ storage/          # MinIO (S3) クライアント
│  │  └─ openai/           # OpenAI クライアント・共通プロンプトユーティリティ
│  ├─ stores/              # アプリ全体のグローバルストア（Zustand 等）
│  ├─ testing/             # テストユーティリティ・モック
│  ├─ types/               # アプリ全体で共有する型
│  └─ utils/               # アプリ全体で共有する純粋関数ユーティリティ
├─ public/
├─ components.json         # shadcn 設定
├─ next.config.ts
├─ tsconfig.json
├─ docker-compose.yml      # Postgres + MinIO（未作成）
└─ .env.example
```

### features の内部構造

各 feature は自己完結させ、必要なサブディレクトリのみ作成する。

```
src/features/<feature-name>/
├─ api/         # サーバアクション / Route Handler 呼び出し / fetcher / その他 API ラッパ
├─ components/  # その feature 専用のコンポーネント
├─ hooks/       # その feature 専用の hooks
├─ stores/      # その feature 専用のストア
├─ types/       # その feature 専用の型
└─ utils/       # その feature 専用のユーティリティ
```

想定 feature 例（MVP）:
- `projects` — プロジェクト一覧/登録/詳細/編集
- `documents` — RFP アップロード・パーサー振り分け
  - 各種パーサーは `lib/parsers/<format>/` に置き、`documents` から呼び出す
- `extraction` — 要件抽出ジョブの起動・進捗・再実行
- `requirements` — 要件一覧表示・編集・エクスポート

### 依存方向ルール（unidirectional）

bulletproof-react の `import/no-restricted-paths` 規約に準拠する。

- `app/` → `features/`, `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` を import 可。
- `features/<X>/` → `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` を import 可。
- `features/<X>/` から **他 feature** (`features/<Y>/`) を import するのは**禁止**。共有が必要な要素は `lib/`・`components/`・`types/` に引き上げる。
- `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` から `app/` や `features/` を import するのは**禁止**（共有層は上位を知らない）。
- 違反に気づいたら、その場でリファクタするか TODO を残す。後で ESLint の `import/no-restricted-paths` を導入して機械的に強制する。

### 配置の判断基準

- ある画面や API 経路に閉じたコード → `features/<feature-name>/` の中
- 複数の feature や app 全体で共有 → `components/` `hooks/` `lib/` `utils/` `types/` のいずれか
- 新しい外部サービス連携（追加の DB クライアント等） → `lib/<service>/`
- ルーティング・ページ定義のみ → `app/`（ページ本体は薄く保ち、ロジックは `features/` から import）

### 命名規約

- ディレクトリ名: kebab-case（`features/project-list/`）
- React コンポーネントファイル: PascalCase（`ProjectCard.tsx`）
- それ以外の TS ファイル: kebab-case（`use-project-list.ts`, `extract-requirements.ts`）
- バレル `index.ts` は **必要なときだけ** 追加（過剰な再エクスポートは循環参照と tree-shaking 阻害の原因になるため避ける）

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
- **POC のデータ層**: Postgres / MinIO 接続前は、`features/*/api/*-repository.ts` にプロセスメモリ Map を置く。後で同インタフェースのまま DB アダプタへ差し替える（プロセス再起動でデータ消失する点に注意）。
- **shadcn Button の `asChild` 非対応**: 現在の base-nova スタイルは `@base-ui/react/button` ベースで `asChild` プロパティを持たない。ボタンとして表示したいリンクは `<Link className={buttonVariants({ variant: ... })}>` パターンで対応する。

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
