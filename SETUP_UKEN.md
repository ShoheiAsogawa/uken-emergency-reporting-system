# 宇検村 通報・防災システム セットアップガイド

## 前提条件

- Node.js 18以上
- AWS CLI が設定済み
- AWSアカウント（東京リージョン）

## 1. 依存関係のインストール

```bash
npm install
```

## 2. 環境変数の設定

`.env`ファイルを作成：

```env
# LIFF設定
VITE_LIFF_ID=your-liff-id

# API設定
VITE_API_ENDPOINT=https://your-api-gateway-url

# Cognito設定
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx

# AWSリージョン（Cognito/地図など）
VITE_AWS_REGION=ap-northeast-1

# 地図設定
VITE_MAP_CENTER_LAT=28.293
VITE_MAP_CENTER_LNG=129.255
```

## 3. LIFFアプリの設定

1. [LINE Developers Console](https://developers.line.biz/)にアクセス
2. プロバイダーとチャネルを作成
3. LIFFアプリを追加
4. LIFF IDを取得して`.env`に設定

## 4. AWSリソースの構築

詳細は`infrastructure/README.md`を参照。

### 簡易セットアップ（Terraform推奨）

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## 5. Lambda関数のデプロイ

```bash
cd lambda-functions
# 各関数をデプロイ
./deploy.sh
```

## 6. 開発サーバーの起動

```bash
npm run dev
```

- 住民向け: http://localhost:3000/
- 職員向け: http://localhost:3000/admin

## 7. 本番環境へのデプロイ

### フロントエンド

```bash
npm run build
aws s3 sync dist/ s3://uken-reports-frontend/
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

### バックエンド

Lambda関数を更新：

```bash
cd lambda-functions
./deploy.sh
```

## トラブルシューティング

### LIFF認証エラー

- LIFF IDが正しいか確認
- LINE公式アカウントにLIFFアプリが追加されているか確認
- HTTPSでアクセスしているか確認（LIFFはHTTPS必須）

### Cognito認証エラー

- User Pool IDとClient IDが正しいか確認
- MFAが有効になっているか確認
- ユーザーが作成されているか確認

### S3アップロードエラー

- API（`/uploads/presign`）が署名付きURLを発行できているか確認
- Lambda実行ロールにS3への最小権限が付与されているか確認
- 画像バケットがプライベートで、署名付きURL経由でアクセスできる設定か確認

### API接続エラー

- API GatewayのエンドポイントURLが正しいか確認
- CORS設定を確認
- Lambda関数のログ（CloudWatch Logs）を確認

## セキュリティチェックリスト

- [ ] S3バケットがプライベート設定
- [ ] KMS暗号化が有効
- [ ] WAFルールが設定済み
- [ ] レート制限が実装済み
- [ ] 監査ログが記録されている
- [ ] 環境変数が`.gitignore`に含まれている
- [ ] Secrets Managerに秘密情報を保存

## 次のステップ

1. **監視設定**
   - CloudWatchアラートの設定
   - ダッシュボードの作成

2. **バックアップ**
   - DynamoDB PITRの有効化
   - S3バージョニングの有効化

3. **パフォーマンス最適化**
   - CloudFrontキャッシュ設定
   - Lambda同時実行数の調整

4. **運用ドキュメント**
   - 障害対応手順
   - バックアップ・リストア手順

