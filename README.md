# 宇検村 通報・防災システム

宇検村の住民がスマートフォンから通報（道路破損・災害情報・動物事故等）を行い、役場職員が管理・対応するシステムです。

## システム概要

- **住民向け**: 宇検村公式LINE内LIFFアプリ
- **職員向け**: 管理Web（Cognito認証 + MFA）
- **目的**: 通報収集・庁内対応管理・避難所情報提供（監査・運用前提）

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

## クイックスタート

詳細は[SETUP_UKEN.md](./SETUP_UKEN.md)を参照してください。

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
│   └── s3.ts             # S3操作
└── types/
    └── index.ts          # 型定義
```

## ドキュメント

- [SETUP_UKEN.md](./SETUP_UKEN.md) - セットアップガイド
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - 実装状況
- [infrastructure/README.md](./infrastructure/README.md) - インフラ構築ガイド
- [lambda-functions/README.md](./lambda-functions/README.md) - Lambda関数実装ガイド

## 開発状況

現在の実装状況は[PROJECT_STATUS.md](./PROJECT_STATUS.md)を参照してください。

### 完了項目 ✅
- フロントエンド実装（住民向け・職員向け）
- 型定義とAPIクライアント
- ドキュメント

### 未実装項目 ⏳
- バックエンドAPI（Lambda）
- DynamoDBテーブル
- インフラ構築
- セキュリティ対策

## ライセンス

MIT

## 作者

宇検村役場

## 関連リンク

- [要件定義書](./README_UKEN.md#要件定義書)
