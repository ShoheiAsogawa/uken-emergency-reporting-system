#!/bin/bash

# GitHubリポジトリのセットアップスクリプト

set -e

echo "🚀 GitHubリポジトリのセットアップを開始します..."

# Gitリポジトリが初期化されているか確認
if [ ! -d ".git" ]; then
    echo "📦 Gitリポジトリを初期化します..."
    git init
    git branch -M main
fi

# .env.exampleが存在するか確認
if [ ! -f ".env.example" ]; then
    echo "⚠️  .env.exampleファイルが見つかりません"
    exit 1
fi

# .envファイルが存在しない場合は作成
if [ ! -f ".env" ]; then
    echo "📝 .envファイルを作成します..."
    cp .env.example .env
    echo "✅ .envファイルを作成しました。環境変数を設定してください。"
else
    echo "ℹ️  .envファイルは既に存在します"
fi

# 依存関係のインストール
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールします..."
    npm install
else
    echo "ℹ️  node_modulesは既に存在します"
fi

# Gitの初期コミット（まだコミットがない場合）
if [ -z "$(git log --oneline 2>/dev/null)" ]; then
    echo "📝 初期コミットを作成します..."
    git add .
    git commit -m "Initial commit: NEON TRADE App with Supabase and AWS S3"
    echo "✅ 初期コミットを作成しました"
fi

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. .envファイルに環境変数を設定してください"
echo "2. GitHubリポジトリを作成してください"
echo "3. リモートリポジトリを追加してください:"
echo "   git remote add origin https://github.com/ShoheiAsogawa/neon-trade-app.git"
echo "4. コードをプッシュしてください:"
echo "   git push -u origin main"
echo ""
echo "詳細は DEPLOY.md を参照してください"

