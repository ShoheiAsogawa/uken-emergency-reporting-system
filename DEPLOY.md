# デプロイメントガイド

このドキュメントでは、GitHubと連携して自動デプロイを設定する方法を説明します。

## 概要

このプロジェクトは以下の方法で自動デプロイできます：

1. **Vercel** - 推奨（最も簡単）
2. **Netlify** - 代替オプション
3. **GitHub Actions** - カスタムデプロイ

## 前提条件

- GitHubリポジトリが作成されていること
- Supabaseプロジェクトがセットアップされていること
- AWS S3バケットが作成されていること

## 方法1: Vercel（推奨）

### 1. Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでサインアップ/ログイン

### 2. プロジェクトのインポート

1. Vercelダッシュボードで「New Project」をクリック
2. GitHubリポジトリを選択
3. プロジェクト設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. 環境変数の設定

Vercelダッシュボードの「Settings」→「Environment Variables」で以下を追加：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_AWS_S3_BUCKET_NAME=your_bucket_name
```

### 4. GitHub Secretsの設定（オプション）

GitHub ActionsでVercelにデプロイする場合：

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 以下のSecretsを追加：

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

**Vercel Tokenの取得方法:**
- Vercelダッシュボード → Settings → Tokens
- 新しいトークンを作成

**Org IDとProject IDの取得方法:**
- Vercel CLIを使用: `vercel link`
- または、プロジェクトの`.vercel/project.json`から取得

### 5. 自動デプロイの確認

- `main`ブランチにプッシュすると自動的にデプロイされます
- プルリクエストごとにプレビューデプロイが作成されます

## 方法2: Netlify

### 1. Netlifyアカウントの作成

1. [Netlify](https://netlify.com)にアクセス
2. GitHubアカウントでサインアップ/ログイン

### 2. プロジェクトのインポート

1. Netlifyダッシュボードで「Add new site」→「Import an existing project」
2. GitHubリポジトリを選択
3. ビルド設定：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 3. 環境変数の設定

Netlifyダッシュボードの「Site settings」→「Environment variables」で以下を追加：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_AWS_S3_BUCKET_NAME=your_bucket_name
```

### 4. GitHub Secretsの設定（オプション）

GitHub ActionsでNetlifyにデプロイする場合：

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 以下のSecretsを追加：

```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

**Netlify Tokenの取得方法:**
- Netlifyダッシュボード → User settings → Applications → New access token

**Site IDの取得方法:**
- Netlifyダッシュボード → Site settings → General → Site details

## 方法3: GitHub Actionsのみ

### 1. GitHub Secretsの設定

GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」で以下を追加：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_AWS_S3_BUCKET_NAME=your_bucket_name
```

### 2. ワークフローの確認

`.github/workflows/deploy.yml`が正しく設定されているか確認してください。

### 3. デプロイの実行

- `main`ブランチにプッシュすると自動的にビルドが実行されます
- ビルド成果物はGitHub ActionsのArtifactsに保存されます

## 環境変数の管理

### 開発環境

プロジェクトルートに`.env`ファイルを作成：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_AWS_S3_BUCKET_NAME=your_bucket_name
```

### 本番環境

- **Vercel**: ダッシュボードの環境変数設定を使用
- **Netlify**: ダッシュボードの環境変数設定を使用
- **GitHub Actions**: GitHub Secretsを使用

## デプロイメントの確認

### デプロイログの確認

1. **Vercel**: ダッシュボードの「Deployments」タブ
2. **Netlify**: ダッシュボードの「Deploys」タブ
3. **GitHub Actions**: リポジトリの「Actions」タブ

### デプロイURL

- **Vercel**: `https://your-project.vercel.app`
- **Netlify**: `https://your-project.netlify.app`
- カスタムドメインも設定可能

## トラブルシューティング

### ビルドエラー

1. 環境変数が正しく設定されているか確認
2. ビルドログを確認してエラーメッセージを確認
3. ローカルで`npm run build`を実行してエラーを再現

### デプロイが失敗する

1. GitHub Secretsが正しく設定されているか確認
2. ビルドコマンドと出力ディレクトリが正しいか確認
3. ブランチ名が`main`または`master`か確認

### 環境変数が反映されない

1. 環境変数の名前が`VITE_`で始まっているか確認
2. デプロイ後にブラウザのキャッシュをクリア
3. 環境変数を変更した場合は再デプロイが必要

## カスタムドメインの設定

### Vercel

1. ダッシュボード → Settings → Domains
2. ドメインを追加
3. DNS設定を更新

### Netlify

1. ダッシュボード → Site settings → Domain management
2. カスタムドメインを追加
3. DNS設定を更新

## 継続的デプロイメント（CD）

以下のブランチ戦略を推奨します：

- `main` / `master`: 本番環境（自動デプロイ）
- `develop`: 開発環境（プレビューデプロイ）
- `feature/*`: 機能ブランチ（プレビューデプロイ）

## セキュリティのベストプラクティス

1. **環境変数は絶対にコミットしない**
   - `.env`ファイルは`.gitignore`に含まれている
2. **GitHub Secretsを使用**
   - 機密情報はGitHub Secretsに保存
3. **最小権限の原則**
   - AWS IAMユーザーには必要最小限の権限のみ付与
4. **定期的なローテーション**
   - アクセスキーとトークンは定期的に更新

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

