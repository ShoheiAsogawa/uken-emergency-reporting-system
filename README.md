# 店舗視察レポートアプリ

店舗視察の記録・管理を行うWebアプリケーションです。React、TypeScript、Tailwind CSS、Supabase、AWS S3を使用して構築されています。

## 機能

- 📊 **ダッシュボード**: 統計情報、ランク別分布、都道府県別トップ5
- 🔍 **店舗検索**: 検索・フィルタリング機能（都道府県、ランク、判定で絞り込み）
- ➕ **店舗登録/編集**: 詳細な店舗情報の記録
  - 都道府県選択（47都道府県）
  - レジ設置台数選択（0-5台）
  - 強豪競合業者選択
- 📸 **画像アップロード**: 複数画像のアップロード（AWS S3に保存）
- 📱 **モバイルレスポンシブ**: スマートフォンでも快適に使用可能
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
git clone https://github.com/ShoheiAsogawa/scout-visits-app.git
cd scout-visits-app

# 依存関係をインストール
npm install
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで `supabase/migrations/003_create_scout_visits_table.sql` を実行
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

# Gemini API設定（オプション）
VITE_GEMINI_API_ENDPOINT=your_lambda_endpoint_url
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` が自動的に開きます。

## 使用方法

1. 開発サーバーを起動すると、ブラウザで `http://localhost:5173` が自動的に開きます
2. **ダッシュボード**タブで統計情報を確認
3. **検索**タブで店舗を検索・フィルタリング
4. **新規登録**ボタンで新しい店舗視察レポートを追加
   - 画像をアップロードすると、自動的にAWS S3に保存されます
   - 店舗データはSupabaseに保存されます

## 技術スタック

- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Vite**: 高速なビルドツール
- **Tailwind CSS**: ユーティリティファーストのCSS
- **Lucide React**: アイコンライブラリ
- **Supabase**: バックエンド（データベース、認証）
- **AWS S3**: 画像ストレージ
- **AWS Lambda**: Gemini API呼び出し（オプション）

## データベーススキーマ

`scout_visits` テーブル:
- `id`: UUID (主キー)
- `user_id`: TEXT (ユーザーID)
- `date`: DATE (視察日)
- `facility_name`: TEXT (店舗名)
- `staff_name`: TEXT (担当者名)
- `rank`: TEXT ('S' | 'A' | 'B' | 'C')
- `judgment`: TEXT ('pending' | 'negotiating' | 'approved' | 'rejected')
- `prefecture`: TEXT (都道府県)
- `register_count`: INTEGER (レジ設置台数: 0-5)
- `strong_competitor`: TEXT (強豪競合業者)
- `environment`: TEXT (環境: '屋内' | '半屋内' | '屋外')
- `imitation_table`: TEXT (模擬テーブル設置: '設置可' | '条件付' | '不可')
- `overall_review`: TEXT (総合レビュー)
- `photo_url`: TEXT (画像URL: JSON配列)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## ビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## デプロイ

### Vercel

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをリンク
vercel link

# デプロイ
vercel --prod
```

### Netlify

- NetlifyダッシュボードからGitHubリポジトリをインポート
- ビルド設定を自動検出
- 環境変数を設定

### AWS Amplify

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/)にアクセス
2. 「New app」→「Host web app」をクリック
3. GitHubリポジトリを接続
4. 環境変数を設定
5. 「Save and deploy」をクリック

## ライセンス

MIT
