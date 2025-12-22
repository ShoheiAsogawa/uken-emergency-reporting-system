# 宇検村 通報・防災システム

## システム概要

宇検村の住民がスマートフォンから通報（道路破損・災害情報・動物事故等）を行い、役場職員が管理・対応するシステムです。

## 技術スタック

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **住民向け**: LIFF（LINE Frontend Framework）
- **職員向け**: 管理Web（Cognito認証 + MFA）
- **Backend**: API Gateway + Lambda（Node.js）
- **Database**: DynamoDB
- **Storage**: S3（画像保存、KMS暗号化）
- **CDN**: CloudFront
- **Security**: WAF、KMS、Secrets Manager
- **Monitoring**: CloudWatch Logs、CloudTrail

## プロジェクト構造

```
src/
├── components/
│   ├── citizen/          # 住民向けLIFFアプリ
│   │   ├── ReportForm.tsx
│   │   ├── ShelterMap.tsx
│   │   └── EmergencyButton.tsx
│   └── admin/             # 職員向け管理Web
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── ReportList.tsx
│       ├── ReportMap.tsx
│       └── ReportDetail.tsx
├── lib/
│   ├── liff.ts           # LIFF認証
│   ├── cognito.ts        # Cognito認証
│   ├── api.ts            # API呼び出し
│   ├── dynamodb.ts       # DynamoDB操作
│   └── s3.ts             # S3操作
└── types/
    └── index.ts          # 型定義
```

## 機能

### 住民向け（LIFF）

1. **通報フォーム**
   - 位置情報取得（現在地/ピンドラッグ）
   - カテゴリ選択（道路破損/災害情報/動物事故）
   - 写真添付（最大3枚、各5MB）
   - 詳細情報・連絡先入力

2. **避難所マップ**
   - 避難所ピン表示
   - 施設名表示

3. **緊急通報ボタン**
   - 電話発信（0997-67-2211）

### 職員向け（管理Web）

1. **ダッシュボード**
   - リスト表示（フィルタ・ソート・検索）
   - 地図表示（カテゴリ別色分け）
   - 詳細パネル（写真、詳細、メモ、ステータス）

2. **ステータス管理**
   - 未対応/対応中/完了/誤報/重複
   - 履歴記録

3. **CSV出力**
   - フィルタ条件反映

## セキュリティ

- LIFF認証必須（住民）
- Cognito認証 + MFA必須（職員）
- レート制限（WAF + サーバ側）
- 画像検証（形式・容量・枚数）
- 監査ログ（全操作記録）
- 連絡先保護（権限制御・マスク表示）

## 開発環境セットアップ

詳細は`SETUP_UKEN.md`を参照してください。

```bash
# 依存関係のインストール
npm install

# 環境変数を設定（.envファイルを作成）
# 詳細はSETUP_UKEN.mdを参照

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

**注意**: 以下のパッケージがまだインストールされていない場合、エラーが発生する可能性があります：
- `@line/liff` - LIFF SDK
- `aws-amplify` - Cognito認証（またはAPI経由で実装）
- `leaflet`, `react-leaflet`, `@types/leaflet` - 地図表示

必要に応じてインストールしてください：
```bash
npm install @line/liff aws-amplify leaflet react-leaflet @types/leaflet
```

## 環境変数

`.env`ファイルを作成：

```env
# LIFF設定
VITE_LIFF_ID=your-liff-id

# API設定
VITE_API_ENDPOINT=https://your-api-gateway-url

# Cognito設定
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id

# S3設定
VITE_S3_BUCKET_NAME=your-bucket-name
VITE_AWS_REGION=ap-northeast-1

# 地図設定
VITE_MAP_CENTER_LAT=28.293
VITE_MAP_CENTER_LNG=129.255
```

## デプロイ

### フロントエンド（S3 + CloudFront）

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name/
```

### バックエンド（Lambda + API Gateway）

`infrastructure/`ディレクトリを参照

## ライセンス

MIT

