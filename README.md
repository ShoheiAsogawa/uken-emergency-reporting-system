# NEON TRADE - トレードジャーナルアプリ

モダンで美しいUIを持つトレードジャーナルアプリケーションです。React、TypeScript、Tailwind CSS、Recharts、Supabase、AWS S3を使用して構築されています。

## 機能

- 📊 **ダッシュボード**: 詳細な統計とチャート分析
- 📝 **トレードジャーナル**: トレード履歴の記録と検索
- ➕ **新規トレード登録**: 簡単なフォームでトレードを記録
- 📱 **モバイルレスポンシブ**: スマートフォンでも快適に使用可能
- 🎨 **美しいUI**: ネオン風のモダンなデザイン
- ☁️ **クラウド連携**: Supabase（データベース）とAWS S3（画像ストレージ）

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn
- Supabaseアカウント
- AWSアカウント（S3バケット）

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン
git clone https://github.com/ShoheiAsogawa/neon-trade-app.git
cd neon-trade-app

# セットアップスクリプトを実行（推奨）
# Linux/Mac:
chmod +x scripts/setup-github.sh
./scripts/setup-github.sh

# Windows (PowerShell):
# .\scripts\setup-github.ps1

# または手動で:
npm install
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで `supabase/migrations/001_create_trades_table.sql` を実行
3. Settings > API から以下を取得:
   - Project URL
   - anon/public key

### 3. AWS S3のセットアップ

1. AWSコンソールでS3バケットを作成
2. バケットポリシーでパブリック読み取りを許可（またはCloudFrontを使用）
3. IAMユーザーを作成し、以下のポリシーを付与:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
4. アクセスキーIDとシークレットアクセスキーを取得

### 4. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成:

```env
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS S3設定
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
VITE_AWS_S3_BUCKET_NAME=your_s3_bucket_name

# オプション: 画像アップロードを必須にする場合
VITE_REQUIRE_IMAGE_UPLOAD=false
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` が自動的に開きます。

## 使用方法

1. 開発サーバーを起動すると、ブラウザで `http://localhost:3000` が自動的に開きます
2. **分析**タブで統計とチャートを確認
3. **履歴**タブで過去のトレードを検索・フィルタリング
4. **トレード登録**ボタンで新しいトレードを追加
   - 画像をアップロードすると、自動的にAWS S3に保存されます
   - トレードデータはSupabaseに保存されます

## 技術スタック

- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Vite**: 高速なビルドツール
- **Tailwind CSS**: ユーティリティファーストのCSS
- **Recharts**: チャートライブラリ
- **Lucide React**: アイコンライブラリ
- **Supabase**: バックエンド（データベース、認証）
- **AWS S3**: 画像ストレージ

## データベーススキーマ

`trades` テーブル:
- `id`: UUID (主キー)
- `user_id`: TEXT (ユーザーID)
- `symbol`: TEXT (通貨ペア)
- `side`: TEXT ('LONG' | 'SHORT')
- `entry_price`: NUMERIC (エントリー価格)
- `exit_price`: NUMERIC (決済価格)
- `quantity`: NUMERIC (数量)
- `pnl`: NUMERIC (損益)
- `date`: DATE (日付)
- `time`: TEXT (時刻)
- `logic`: TEXT (根拠・メモ)
- `timeframe`: TEXT (時間足)
- `strategy`: TEXT (戦略)
- `mood`: TEXT (メンタル)
- `image_url`: TEXT (画像URL)
- `status`: TEXT ('WIN' | 'LOSS' | 'BE')
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## ビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## GitHub連携と自動デプロイ

このプロジェクトはGitHubと連携して、常に最新バージョンが自動的にデプロイされるように設定されています。

### 自動デプロイの設定

詳細な手順は [DEPLOY.md](./DEPLOY.md) を参照してください。

#### クイックスタート

1. **Vercelを使用する場合（推奨）**
   ```bash
   # Vercel CLIをインストール
   npm i -g vercel
   
   # プロジェクトをリンク
   vercel link
   
   # デプロイ
   vercel --prod
   ```

2. **Netlifyを使用する場合**
   - NetlifyダッシュボードからGitHubリポジトリをインポート
   - ビルド設定を自動検出
   - 環境変数を設定

3. **GitHub Actionsのみ**
   - `.github/workflows/deploy.yml`が自動的に実行されます
   - `main`ブランチにプッシュすると自動ビルド

### GitHub Secretsの設定

リポジトリの「Settings」→「Secrets and variables」→「Actions」で以下を設定：

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_AWS_REGION
VITE_AWS_ACCESS_KEY_ID
VITE_AWS_SECRET_ACCESS_KEY
VITE_AWS_S3_BUCKET_NAME
```

### ワークフロー

- **CI**: プッシュ/プルリクエスト時に自動実行（型チェック、ビルド）
- **Deploy**: `main`ブランチへのプッシュ時に自動デプロイ
- **Update Check**: 毎日依存関係の更新をチェック

## トラブルシューティング

### Supabase接続エラー
- `.env`ファイルの環境変数が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認
- RLS（Row Level Security）ポリシーが正しく設定されているか確認

### S3アップロードエラー
- AWS認証情報が正しく設定されているか確認
- バケット名とリージョンが正しいか確認
- IAMポリシーで適切な権限が付与されているか確認

### デプロイエラー
- GitHub Secretsが正しく設定されているか確認
- ビルドログを確認してエラーを特定
- 環境変数が正しく設定されているか確認（詳細は[DEPLOY.md](./DEPLOY.md)を参照）

## コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

MIT
