# GitHubリポジトリ作成手順

## 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」ボタンをクリック → 「New repository」を選択
3. 以下の情報を入力：
   - **Repository name**: `uken-emergency-reporting-system`
   - **Description**: `宇検村 通報・防災システム - AWS + LIFF`
   - **Visibility**: Public または Private（お好みで）
   - **Initialize this repository with**: チェックを外す（既存のコードをプッシュするため）
4. 「Create repository」をクリック

## 2. ローカルリポジトリの設定

リポジトリ作成後、以下のコマンドを実行：

```bash
# 既存のリモートを確認（必要に応じて削除）
git remote remove origin

# 新しいリモートを追加（YOUR_USERNAMEをGitHubのユーザー名に置き換え）
git remote add origin https://github.com/YOUR_USERNAME/uken-emergency-reporting-system.git

# またはSSHを使用する場合
git remote add origin git@github.com:YOUR_USERNAME/uken-emergency-reporting-system.git

# 変更をコミット
git add .
git commit -m "feat: 宇検村通報・防災システムの初期実装

- 住民向けLIFFアプリ（通報フォーム、避難所マップ）
- 職員向け管理Web（ダッシュボード、フィルタ・ソート、CSV出力）
- APIクライアント実装
- 型定義とドキュメント"

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

## 3. リポジトリ設定（推奨）

GitHubリポジトリの「Settings」で以下を設定：

### Topics（タグ）
- `uken-village`
- `emergency-reporting`
- `disaster-management`
- `liff`
- `aws`
- `react`
- `typescript`

### Description
```
宇検村の住民がスマートフォンから通報（道路破損・災害情報・動物事故等）を行い、役場職員が管理・対応するシステム。

技術スタック: React, TypeScript, AWS (Lambda, DynamoDB, S3, CloudFront), LIFF, Cognito
```

### README
リポジトリのREADMEに`README_UKEN.md`の内容をコピー

## 4. セキュリティ設定

### Secrets（Settings > Secrets and variables > Actions）
本番環境の秘密情報はGitHub Secretsに保存：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`

### Branch protection（Settings > Branches）
- `main`ブランチの保護を有効化
- マージ前にプルリクエストの承認を必須化（推奨）

## 5. ライセンス

必要に応じてLICENSEファイルを追加：
- MIT License（推奨）
- Apache 2.0
- その他

