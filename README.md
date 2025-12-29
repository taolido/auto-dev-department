# Auto-Dev Department

> 日常会話から、ソフトウェアが生まれる

チャットログから課題を自動抽出し、AIエージェントがソフトウェアを自律開発するシステムです。

## コンセプト

日々の業務コミュニケーションから課題を自動抽出し、ドメイン知識を持つ人間が選択するだけで、AIエージェントがソフトウェアを自律開発します。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | FastAPI (Python) |
| LLM | Gemini 3 Flash |
| Database | Firestore |
| Infrastructure | Cloud Run |

## エージェント構成

1. **Extractor Agent** - 会話ログから課題を抽出
2. **PM Agent** - 仮説要件定義書を生成
3. **Tech Lead Agent** - ファイル構成・設計を決定
4. **Coder Agent** - コードを生成
5. **Tester Agent** - テスト・自己修正（最大3回）

## クイックスタート

### 前提条件

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 環境変数の設定

```bash
cp backend/.env.example backend/.env
# .env ファイルを編集して必要なAPIキーを設定
```

### 開発サーバーの起動

**Docker Compose を使用する場合:**

```bash
docker-compose up
```

**ローカルで起動する場合:**

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (別ターミナル)
cd frontend
npm install
npm run dev
```

### アクセス

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## ディレクトリ構成

```
Auto-Dev Department/
├── frontend/                 # Next.js アプリケーション
│   ├── src/
│   │   ├── app/             # App Router ページ
│   │   ├── components/      # UIコンポーネント
│   │   ├── lib/             # ユーティリティ
│   │   └── types/           # TypeScript型定義
│   └── package.json
│
├── backend/                  # FastAPI アプリケーション
│   ├── app/
│   │   ├── agents/          # AIエージェント
│   │   ├── api/             # APIエンドポイント
│   │   ├── services/        # ビジネスロジック
│   │   └── models/          # データモデル
│   └── requirements.txt
│
├── docker-compose.yml        # ローカル開発環境
└── README.md
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /health | ヘルスチェック |
| POST | /api/sources/upload | ログファイルアップロード |
| POST | /api/sources/chatwork | Chatwork連携 |
| GET | /api/issues | 課題一覧取得 |
| POST | /api/issues/extract | 課題抽出実行 |
| POST | /api/requirements/generate | 要件定義生成 |
| POST | /api/developments/start | 開発開始 |

## ライセンス

MIT
