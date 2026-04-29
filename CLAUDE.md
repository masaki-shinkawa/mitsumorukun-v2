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
- **DB**: PostgreSQL（Docker） + Prisma 7（driver adapter `@prisma/adapter-pg` 経由）
- **オブジェクトストレージ**: MinIO（S3互換、Docker） + AWS SDK v3 (`@aws-sdk/client-s3`)
- **LLM**: OpenAI API
  - メイン処理（要件抽出・FP算出・ドラフト生成）: `gpt-4o`
  - 軽量処理（チャンク要約など）: `gpt-4o-mini`

### ドキュメント形式の拡張性

RFP 取り込みは「ファイル形式 → 正規化済みテキスト/構造」へ変換する **パーサー層** を抽象化し、形式追加時はパーサー実装の追加のみで済ませる。

- MVP: Markdown パーサー
- 将来: PDF / Word / HTML 等

## ディレクトリ構成

[bulletproof-react](https://github.com/alan2207/bulletproof-react) のレイアウト規約を Next.js App Router 向けに翻訳して採用しつつ、複数 feature を束ねるシェルのために [Feature-Sliced Design (FSD)](https://feature-sliced.design/) の **widgets レイヤ**だけを部分的に取り入れている。`src/` ディレクトリ + import alias `@/*` 構成。

レイヤの依存階層（上が下を import 可、逆は不可）:

```
app  →  widgets  →  features  →  components / lib / hooks / stores / types / utils / config
```

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
│  ├─ widgets/             # 複数 feature を束ねるページシェル（FSD の widgets 相当）
│  │  └─ <page-or-area>/   # 例: projects/ProjectTabs.tsx
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
├─ prisma/
│  ├─ schema.prisma        # Prisma スキーマ（Project / Document）
│  └─ migrations/          # マイグレーション履歴（git 管理）
├─ src/generated/prisma/   # Prisma 生成物（git 管理外、postinstall で再生成）
├─ prisma.config.ts        # Prisma 7 必須の設定（POSTGRES_* から DATABASE_URL を組み立て）
├─ components.json         # shadcn 設定
├─ next.config.ts
├─ tsconfig.json
├─ docker-compose.yml      # Postgres + MinIO（Next.js はホストで実行）
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

bulletproof-react の `import/no-restricted-paths` 規約をベースに、FSD の widgets レイヤを足した依存階層を採用する。

- `app/` → `widgets/`, `features/`, `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` を import 可。
- `widgets/<X>/` → `features/`, `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` を import 可。**複数の feature を組み合わせるシェルは原則ここに置く**。
- `widgets/<X>/` から他 widget や `app/` を import するのは**禁止**。
- `features/<X>/` → `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` を import 可。
- `features/<X>/` から **他 feature** (`features/<Y>/`) や `widgets/`, `app/` を import するのは**禁止**。共有が必要な要素は `lib/`・`components/`・`types/` に引き上げるか、束ねる側を `widgets/` に置く。
- `components/`, `hooks/`, `lib/`, `stores/`, `types/`, `utils/`, `config/` から `app/`, `widgets/`, `features/` を import するのは**禁止**（共有層は上位を知らない）。
- 違反に気づいたら、その場でリファクタするか TODO を残す。後で ESLint の `import/no-restricted-paths` を導入して機械的に強制する。

### 配置の判断基準

- ある画面や API 経路に閉じたコード → `features/<feature-name>/` の中
- **複数 feature を束ねるページシェル**（タブ・レイアウト・複合ダッシュボード等） → `widgets/<page-or-area>/`（例: `widgets/projects/ProjectTabs.tsx`）
- 単独 feature に閉じない汎用 UI（ボタン・入力・カード等） → `components/`（`components/ui/` は shadcn 由来）
- アプリ全体で共有する hooks / 型 / 純粋関数 → `hooks/` / `types/` / `utils/`
- 新しい外部サービス連携（追加の DB クライアント等） → `lib/<service>/`
- ルーティング・ページ定義のみ → `app/`（ページ本体は薄く保ち、シェルは `widgets/` から、ロジックは `features/` から import）

### 命名規約

- ディレクトリ名: kebab-case（`features/project-list/`）
- React コンポーネントファイル: PascalCase（`ProjectCard.tsx`）
- それ以外の TS ファイル: kebab-case（`use-project-list.ts`, `extract-requirements.ts`）
- バレル `index.ts` は **必要なときだけ** 追加（過剰な再エクスポートは循環参照と tree-shaking 阻害の原因になるため避ける）

## 環境変数

`.env.example` 参照。`.env` は git 管理外。

**重要**: `.env` には API Token が含まれているため**閲覧禁止**。形式は `.env.example` を参照すること。

主要変数:

- `POSTGRES_*`: PostgreSQL 接続。`DATABASE_URL` は持たず、`prisma.config.ts` と `lib/db/client.ts` がここから組み立てる。
- `MINIO_*`: MinIO 接続（`MINIO_BUCKET` で使用バケットを指定。初回アクセス時に自動作成）。
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`: OpenAI
- `FRONTEND_PORT` (3000): Next.js

## 開発コマンド

```bash
pnpm install            # 依存インストール
pnpm dev                # Next.js 開発サーバのみ起動（DB/MinIO は別途）
pnpm dev:full           # docker compose up -d した上で Next.js dev サーバを起動
pnpm stop               # FRONTEND_PORT (既定 3000) を握っているプロセスを停止
pnpm restart            # stop → install → dev:full（package.json 変更時の安全な再起動）
pnpm build              # 本番ビルド
pnpm start              # 本番サーバ起動
pnpm lint               # ESLint 実行

# Docker サービス（Postgres + MinIO）
pnpm services:up        # 起動
pnpm services:down      # 停止
pnpm services:logs      # ログ追従
pnpm services:ps        # 状態確認
pnpm services:clean     # 停止 + ボリューム削除（破壊的）

# Prisma
pnpm db:migrate         # マイグレーション作成 + 適用（dev）
pnpm db:generate        # Prisma Client 再生成（postinstall でも自動実行）
pnpm db:studio          # Prisma Studio（GUI でテーブル閲覧）

# shadcn コンポーネント追加
pnpm dlx shadcn@latest add <component>     # 例: pnpm dlx shadcn@latest add card input
```

## Docker 運用

- 開発時は **Next.js はホストで `pnpm dev`、Postgres と MinIO だけ Docker で動かす** 構成。Windows/macOS の Docker bind mount で HMR が遅くなるのを避けるため（[Next.js 公式ガイド](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/02-guides/local-development.mdx) §8 参照）。
- エントリポイントは `package.json` の scripts に集約（Make は使わない＝Windows でも追加インストール不要）：
  - `pnpm services:up` / `services:down` / `services:logs` / `services:ps` — docker compose 操作
  - `pnpm dev` — Next.js のみ（DB/MinIO は別途起動済み前提）
  - `pnpm dev:full` — `services:up` 後に `next dev`（DB/MinIO ごとまとめて立ち上げ）
  - `pnpm services:clean` — `docker compose down -v`（**ボリューム削除を伴う破壊的操作**）
- 本番イメージが必要になったら `next.config.ts` に `output: 'standalone'` を追加し、別途 multi-stage の `Dockerfile` を用意する（未作成）。

## Claude Code から dev サーバを再起動する手順

`package.json` / `pnpm-lock.yaml` / `next.config.ts` 等を変更したあと、走っている dev サーバを安全に作り直したい場合に使う。**TaskStop は同一セッション内のバックグラウンドタスクしか止められない** ため、別セッションから前セッションの dev を止める手段として、ポート番号ベースの停止スクリプトを用意している。

仕組み:

- `scripts/stop-dev.mjs` が `FRONTEND_PORT`（既定 3000）を LISTEN しているプロセスを OS から探して kill する。Windows は `netstat` + `taskkill /F /T`、Unix は `lsof` + `kill -TERM`。PID ファイルは持たないので、Claude Code セッションをまたいでも確実に止められる。
- 冪等：listener が無ければ no-op で終了する。

典型フロー（package.json を変更した後）:

```bash
pnpm restart
# = pnpm stop && pnpm install && pnpm dev:full
```

- `pnpm restart` の `dev:full` は通常 fg で走るので、Claude Code から呼ぶ場合は `run_in_background: true` で投げて、ログは出力ファイル経由で読む。
- 別セッションから止めるだけなら `pnpm stop` 単体で OK。

## 設計メモ

- POC のため認証なし。ローカル/社内ネットワーク前提で起動する。
- ユーザーは社内チーム共有を想定するため、Phase 2 で Google SSO を導入する設計余地を残す（プロジェクト/要件にオーナー列を持たせる等）。
- 抽出根拠（原文の引用箇所）を要件レコードに保持し、後で監査可能にする。
- 大規模ドキュメントはチャンク分割 → `gpt-4o-mini` で要約 → `gpt-4o` で構造化抽出、の二段構成。
- **データ層**: `features/*/api/*-repository.ts` から `lib/db/client.ts`（Prisma シングルトン）と `lib/storage/client.ts`（MinIO）を呼ぶ。リポジトリ関数は async。Project / Document メタは Postgres、ドキュメント本体は MinIO の `MINIO_BUCKET` バケットに `projects/<projectId>/<uuid>-<safeFileName>` で保存。Document 削除時は DB → MinIO の順で消し、MinIO 失敗はログのみ（DB を真実とみなす）。
- **Prisma 7 構成上の注意**: `url` を `schema.prisma` に書けないので `prisma.config.ts` 必須。`prisma.config.ts` 側で `POSTGRES_*` から `DATABASE_URL` を組み立てている（`.env` に `DATABASE_URL` を別途持たない方針）。`PrismaClient` には `@prisma/adapter-pg` を必ず渡す（adapter なしでは動かない）。Prisma Client の出力先は `src/generated/prisma`（gitignore 済み、`postinstall` で自動生成）。
- **shadcn Button の `asChild` 非対応**: 現在の base-nova スタイルは `@base-ui/react/button` ベースで `asChild` プロパティを持たない。ボタンとして表示したいリンクは `<Link className={buttonVariants({ variant: ... })}>` パターンで対応する。
- **ページ横幅**: `app/` 配下の各ページコンテナは `mx-auto w-full max-w-5xl px-6 py-10`（= 1024px 上限）で統一する。ページごとに `max-w-2xl` / `max-w-6xl` 等のバラつきを生まないこと。任意値 `max-w-[1024px]` ではなくデフォルトトークン `max-w-5xl` を使う。

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
