# GitHubリポジトリのセットアップスクリプト (PowerShell)

Write-Host "🚀 GitHubリポジトリのセットアップを開始します..." -ForegroundColor Cyan

# Gitリポジトリが初期化されているか確認
if (-not (Test-Path ".git")) {
    Write-Host "📦 Gitリポジトリを初期化します..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# .env.exampleが存在するか確認
if (-not (Test-Path ".env.example")) {
    Write-Host "⚠️  .env.exampleファイルが見つかりません" -ForegroundColor Red
    exit 1
}

# .envファイルが存在しない場合は作成
if (-not (Test-Path ".env")) {
    Write-Host "📝 .envファイルを作成します..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .envファイルを作成しました。環境変数を設定してください。" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .envファイルは既に存在します" -ForegroundColor Gray
}

# 依存関係のインストール
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 依存関係をインストールします..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "ℹ️  node_modulesは既に存在します" -ForegroundColor Gray
}

# Gitの初期コミット（まだコミットがない場合）
$gitLog = git log --oneline 2>$null
if (-not $gitLog) {
    Write-Host "📝 初期コミットを作成します..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit: NEON TRADE App with Supabase and AWS S3"
    Write-Host "✅ 初期コミットを作成しました" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ セットアップが完了しました！" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "1. .envファイルに環境変数を設定してください"
Write-Host "2. GitHubリポジトリを作成してください"
Write-Host "3. リモートリポジトリを追加してください:"
Write-Host "   git remote add origin https://github.com/ShoheiAsogawa/neon-trade-app.git"
Write-Host "4. コードをプッシュしてください:"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "詳細は DEPLOY.md を参照してください" -ForegroundColor Gray

