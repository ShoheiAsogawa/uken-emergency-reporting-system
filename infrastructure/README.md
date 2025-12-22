# インフラ構築ガイド

## 概要

宇検村通報・防災システムのAWSインフラ構築手順です。

## 必要なAWSリソース

1. **DynamoDB**
   - Reports テーブル
   - ReportHistory テーブル
   - Shelters テーブル

2. **S3**
   - 画像保存用バケット（KMS暗号化）
   - フロントエンド配信用バケット

3. **CloudFront**
   - S3配信のCDN

4. **Lambda**
   - API エンドポイント（Node.js）

5. **API Gateway**
   - REST API

6. **Cognito**
   - 職員認証（MFA有効）

7. **WAF**
   - レート制限、Bot対策

8. **CloudWatch**
   - ログ、アラート

9. **KMS**
   - 暗号化キー管理

10. **Secrets Manager / SSM Parameter Store**
    - 秘密情報管理

## 構築手順

### 1. DynamoDBテーブルの作成

```bash
# Reports テーブル
aws dynamodb create-table \
  --table-name Reports \
  --attribute-definitions \
    AttributeName=report_id,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=category,AttributeType=S \
  --key-schema \
    AttributeName=report_id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=StatusCreatedAtIndex,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=CategoryCreatedAtIndex,KeySchema=[{AttributeName=category,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1

# ReportHistory テーブル
aws dynamodb create-table \
  --table-name ReportHistory \
  --attribute-definitions \
    AttributeName=report_id,AttributeType=S \
    AttributeName=changed_at,AttributeType=S \
  --key-schema \
    AttributeName=report_id,KeyType=HASH \
    AttributeName=changed_at,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1

# Shelters テーブル
aws dynamodb create-table \
  --table-name Shelters \
  --attribute-definitions \
    AttributeName=shelter_id,AttributeType=S \
  --key-schema \
    AttributeName=shelter_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

### 2. S3バケットの作成

```bash
# 画像保存用バケット
aws s3 mb s3://uken-reports-images --region ap-northeast-1

# フロントエンド配信用バケット
aws s3 mb s3://uken-reports-frontend --region ap-northeast-1

# バケットポリシー設定（画像バケットはプライベート、署名付きURLでアクセス）
# フロントエンドバケットはCloudFront経由で配信
```

### 3. KMSキーの作成

```bash
aws kms create-key \
  --description "Uken Reports System Encryption Key" \
  --region ap-northeast-1

# キーIDを保存して、S3バケットの暗号化に使用
```

### 4. Cognito User Poolの作成

```bash
# Cognito User Pool作成（AWS Console推奨）
# - MFA必須設定
# - パスワードポリシー設定
# - ユーザー属性：email, name
```

### 5. Lambda関数の作成

各エンドポイント用のLambda関数を作成：

- `auth-liff` - LIFF認証
- `auth-cognito` - Cognito認証
- `reports-create` - 通報作成
- `reports-list` - 通報一覧
- `reports-get` - 通報詳細
- `reports-update-status` - ステータス更新
- `reports-update-memo` - メモ更新
- `reports-history` - 履歴取得
- `reports-export` - CSV出力
- `shelters-list` - 避難所一覧
- `shelters-save` - 避難所保存
- `uploads-presign` - 署名付きURL発行

### 6. API Gatewayの設定

REST APIを作成し、各Lambda関数を統合。

### 7. WAFの設定

- レート制限ルール
- Bot対策ルール
- IP制限ルール（必要に応じ）

### 8. CloudWatchアラート

- Lambda エラー率
- API Gateway 5xx エラー
- WAF ブロック数急増

## 環境変数

Lambda関数に設定する環境変数：

```
DYNAMODB_TABLE_REPORTS=Reports
DYNAMODB_TABLE_HISTORY=ReportHistory
DYNAMODB_TABLE_SHELTERS=Shelters
S3_BUCKET_IMAGES=uken-reports-images
S3_BUCKET_REGION=ap-northeast-1
KMS_KEY_ID=arn:aws:kms:ap-northeast-1:...
COGNITO_USER_POOL_ID=ap-northeast-1_...
COGNITO_CLIENT_ID=...
LINE_CHANNEL_ID=...
LINE_CHANNEL_SECRET=...
```

## セキュリティ設定

1. **IAMロール**
   - Lambda実行ロールに最小権限を付与
   - DynamoDB、S3、KMSへのアクセス権限

2. **VPC設定**
   - 必要に応じてVPC内に配置

3. **暗号化**
   - S3: KMS暗号化
   - DynamoDB: 保存時暗号化
   - 通信: HTTPS必須

## デプロイ

### Lambda関数のデプロイ

```bash
# 各Lambda関数をzip化してデプロイ
cd lambda-functions
zip -r function.zip .
aws lambda update-function-code \
  --function-name reports-create \
  --zip-file fileb://function.zip
```

### フロントエンドのデプロイ

```bash
npm run build
aws s3 sync dist/ s3://uken-reports-frontend/
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## 監視

- CloudWatch Logs: Lambda実行ログ
- CloudTrail: API呼び出しログ
- CloudWatch Metrics: エラー率、レイテンシー

