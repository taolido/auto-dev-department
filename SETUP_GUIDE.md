# Docker Desktop セットアップ & 作業再開ガイド

## 目次
1. [Docker Desktop のダウンロード](#1-docker-desktop-のダウンロード)
2. [インストール手順](#2-インストール手順)
3. [PC再起動後の確認](#3-pc再起動後の確認)
4. [この作業への戻り方](#4-この作業への戻り方)
5. [プロジェクトの起動方法](#5-プロジェクトの起動方法)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. Docker Desktop のダウンロード

### 手順

1. **ブラウザで以下のURLを開く**
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. **「Download for Windows」ボタンをクリック**
   - 青い大きなボタンです
   - ファイル名: `Docker Desktop Installer.exe`（約600MB）

3. **ダウンロード完了を待つ**
   - ダウンロードフォルダに保存されます

---

## 2. インストール手順

### 手順

1. **ダウンロードした `Docker Desktop Installer.exe` をダブルクリック**

2. **インストール画面が表示されたら**
   - ☑ 「Use WSL 2 instead of Hyper-V」 → **チェックを入れる（重要！）**
   - ☑ 「Add shortcut to desktop」 → お好みで
   - 「OK」をクリック

3. **インストール完了を待つ**（2-5分程度）

4. **「Close and restart」ボタンをクリック**
   - PCが再起動します

---

## 3. PC再起動後の確認

### 手順

1. **Windowsにログイン**

2. **Docker Desktop が自動起動する**
   - 右下のタスクトレイにクジラのアイコン 🐳 が表示される
   - 初回は起動に1-2分かかる

3. **クジラアイコンが動いていたら起動中、止まったら準備完了**

4. **利用規約が表示されたら「Accept」をクリック**

5. **アンケートが出たら「Skip」でOK**

### 確認方法

タスクトレイのクジラアイコンをクリック → 「Docker Desktop is running」と表示されればOK

---

## 4. この作業への戻り方

### 手順

1. **VSCode を開く**
   - スタートメニューから「Visual Studio Code」を起動

2. **WSL に接続**
   - VSCode左下の緑のボタン「><」をクリック
   - 「Connect to WSL」を選択
   - または「WSL: Ubuntu」を選択

3. **プロジェクトフォルダを開く**
   - メニュー「ファイル」→「フォルダーを開く」
   - 以下のパスを入力：
   ```
   /mnt/c/myproject/Auto-Dev Department
   ```
   - 「OK」をクリック

4. **ターミナルを開く**
   - メニュー「ターミナル」→「新しいターミナル」
   - または `Ctrl + @`

5. **Claude Code を起動**（必要な場合）
   ```bash
   claude
   ```

### 簡単な戻り方（VSCodeの履歴から）

1. VSCode を開く
2. 「ファイル」→「最近使用した項目を開く」
3. 「Auto-Dev Department」を選択

---

## 5. プロジェクトの起動方法

### 前提
- Docker Desktop が起動していること（タスクトレイにクジラ🐳）
- VSCode で WSL に接続していること

### 手順

1. **ターミナルでプロジェクトフォルダに移動**
   ```bash
   cd "/mnt/c/myproject/Auto-Dev Department"
   ```

2. **Docker が使えるか確認**
   ```bash
   docker --version
   ```
   → バージョンが表示されればOK

3. **プロジェクトを起動**
   ```bash
   docker-compose up
   ```
   - 初回は Docker イメージのダウンロードで5-10分かかる
   - 「Ready」や「Uvicorn running」が表示されたら起動完了

4. **ブラウザでアクセス**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API ドキュメント: http://localhost:8000/docs

### 停止方法

ターミナルで `Ctrl + C` を押す

または別のターミナルで：
```bash
docker-compose down
```

---

## 6. トラブルシューティング

### Docker Desktop が起動しない

1. タスクトレイのクジラアイコンを右クリック
2. 「Restart」を選択
3. 1-2分待つ

### 「docker: command not found」と表示される

1. Docker Desktop が起動しているか確認
2. WSL ターミナルを一度閉じて開き直す
3. それでもダメなら PC を再起動

### ポートが使用中（port already in use）

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :8000

# プロセスを終了（PID は上のコマンドで確認した数字）
kill -9 PID
```

### 全部リセットしたい

```bash
docker-compose down -v
docker system prune -a
```

---

## クイックリファレンス（よく使うコマンド）

| やりたいこと | コマンド |
|------------|---------|
| プロジェクト起動 | `docker-compose up` |
| バックグラウンド起動 | `docker-compose up -d` |
| 停止 | `docker-compose down` |
| ログ確認 | `docker-compose logs -f` |
| 再ビルド | `docker-compose up --build` |
| Claude Code 起動 | `claude` |

---

## プロジェクトの場所（忘れた時用）

```
Windows: C:\myproject\Auto-Dev Department
WSL:     /mnt/c/myproject/Auto-Dev Department
```

---

## 困ったら

1. このファイルを読み返す（場所: プロジェクト内の `SETUP_GUIDE.md`）
2. Claude Code で質問する
