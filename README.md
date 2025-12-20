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
- AWSアカウント（S3バケット、Lambda）

### クイックスタート

1. **リポジトリのクローンと依存関係のインストール**

```bash
# リポジトリをクローン
git clone https://github.com/ShoheiAsogawa/scout-visits-app.git
cd scout-visits-app

# 依存関係をインストール
npm install
```

2. **環境変数の設定**

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集して、実際の値を設定
```

3. **詳細なセットアップ手順**

詳細なセットアップ手順は [SETUP.md](./SETUP.md) を参照してください。

主な手順：
- Supabaseプロジェクトの作成とマイグレーション実行
- AWS S3バケットの作成とIAM設定
- AWS Lambda関数の作成（Gemini API用）
- 環境変数の設定

### 開発サーバーの起動

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
