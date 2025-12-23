# SAM（Serverless Application Model）デプロイ手順

このディレクトリは、宇検村 通報・防災システムの **API + DynamoDB + S3 + Cognito** を、SAMで最小構成デプロイするためのテンプレートです。

## 事前準備

- Node.js 18+
- AWS CLI（認証済み）
- AWS SAM CLI（`sam` コマンド）

## 1) Lambdaビルド

Lambdaは `lambda-functions/` でビルドして `dist/` を生成します。

```bash
cd lambda-functions
npm install
npm run build
```

## 2) SAMデプロイ

```bash
cd infrastructure/sam

sam deploy --guided \
  --stack-name uken-emergency-reporting \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides LineChannelId=<YOUR_LINE_CHANNEL_ID>
```

デプロイ後、CloudFormationのOutputsから以下を取得し、フロントの `.env` に設定します。

- `ApiEndpoint` → `VITE_API_ENDPOINT`
- `CognitoUserPoolId` → `VITE_COGNITO_USER_POOL_ID`
- `CognitoUserPoolClientId` → `VITE_COGNITO_CLIENT_ID`

## 3) Cognitoのロール付与（Viewer/Operator/Admin）

テンプレートは `admin/operator/viewer` のグループを作成します。  
職員ユーザー作成後、適切なグループへ所属させてください（例: `operator`）。

## 4) 動作確認（推奨）

- `/health` が `{"ok":true}` を返す
- 住民（LIFF）:
  - `/uploads/presign` → 署名URL（PUT）
  - `/reports` → 作成
- 職員（Cognito）:
  - `/reports` 一覧
  - `/reports/:id/status` 更新
  - `/reports/:id/contact`（operator/admin）で連絡先取得＋監査ログ

