# SupabaseとAWSセットアップガイド

このドキュメントでは、店舗視察レポートアプリをSupabaseとAWSでセットアップする詳細な手順を説明します。

## 目次

1. [Supabaseのセットアップ](#1-supabaseのセットアップ)
2. [AWS S3のセットアップ](#2-aws-s3のセットアップ)
3. [AWS Lambdaのセットアップ（Gemini API用）](#3-aws-lambdaのセットアップgemini-api用)
4. [環境変数の設定](#4-環境変数の設定)
5. [動作確認](#5-動作確認)

---

## 1. Supabaseのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」または「Sign in」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスでサインアップ
4. 「New Project」をクリック
5. 以下の情報を入力：
   - **Organization**: 既存の組織を選択、または新規作成
   - **Name**: `scout-visits-app`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（必ず保存してください）
   - **Region**: `Northeast Asia (Tokyo)` を選択（ap-northeast-1）
   - **Pricing Plan**: Free tier で開始可能
6. 「Create new project」をクリック
7. プロジェクトの作成完了まで2-3分待機

### 1.2 データベースマイグレーションの実行

1. Supabaseダッシュボードでプロジェクトを開く
2. 左側メニューの「SQL Editor」をクリック
3. 「New query」をクリック
4. 以下のSQLファイルの内容をコピー＆ペースト：
   - `supabase/migrations/003_create_scout_visits_table.sql`
5. 「Run」ボタンをクリック（または `Ctrl+Enter` / `Cmd+Enter`）
6. 「Success. No rows returned」と表示されれば成功

### 1.3 APIキーの取得

1. 左側メニューの「Settings」（⚙️アイコン）をクリック
2. 「API」セクションをクリック
3. 以下の情報をコピーして保存：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.4 Row Level Security (RLS) の確認

マイグレーションファイルでRLSが有効になっていることを確認：

1. 左側メニューの「Table Editor」をクリック
2. `scout_visits` テーブルを選択
3. 「Policies」タブをクリック
4. 以下のポリシーが存在することを確認：
   - `Users can view their own visits` (SELECT)
   - `Users can insert their own visits` (INSERT)
   - `Users can update their own visits` (UPDATE)
   - `Users can delete their own visits` (DELETE)

---

## 2. AWS S3のセットアップ

### 2.1 S3バケットの作成

1. [AWS Management Console](https://console.aws.amazon.com/)にログイン
2. 「S3」を検索して開く
3. 「Create bucket」をクリック
4. 以下の設定を入力：
   - **Bucket name**: `scout-visits-images-{your-unique-id}`（グローバルで一意の名前）
   - **AWS Region**: `Asia Pacific (Tokyo) ap-northeast-1`
   - **Object Ownership**: `ACLs enabled` を選択
   - **Block Public Access settings**: 
     - ✅ 「Block all public access」のチェックを**外す**
     - 警告を確認して「I acknowledge...」にチェック
   - **Bucket Versioning**: `Disable`（必要に応じて有効化）
   - **Default encryption**: `Enable` を推奨
5. 「Create bucket」をクリック

### 2.2 バケットポリシーの設定

1. 作成したバケットをクリック
2. 「Permissions」タブをクリック
3. 「Bucket policy」セクションの「Edit」をクリック
4. 以下のポリシーを貼り付け（`your-bucket-name`を実際のバケット名に置き換え）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

5. 「Save changes」をクリック

### 2.3 CORS設定（オプション）

1. バケットの「Permissions」タブで「Cross-origin resource sharing (CORS)」セクションを開く
2. 「Edit」をクリック
3. 以下の設定を貼り付け：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

4. 「Save changes」をクリック

### 2.4 IAMユーザーの作成

1. AWSコンソールで「IAM」を検索して開く
2. 左側メニューの「Users」をクリック
3. 「Create user」をクリック
4. ユーザー名を入力：`scout-visits-s3-user`
5. 「Next」をクリック
6. 「Attach policies directly」を選択
7. 「Create policy」をクリック（新しいタブが開く）
8. 「JSON」タブを選択
9. 以下のポリシーを貼り付け（`your-bucket-name`を実際のバケット名に置き換え）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

10. 「Next」をクリック
11. ポリシー名を入力：`scout-visits-s3-policy`
12. 「Create policy」をクリック
13. IAMユーザー作成画面に戻る
14. 検索ボックスで `scout-visits-s3-policy` を検索して選択
15. 「Next」をクリック
16. 「Create user」をクリック

### 2.5 アクセスキーの作成

1. 作成したユーザーをクリック
2. 「Security credentials」タブをクリック
3. 「Create access key」をクリック
4. 「Application running outside AWS」を選択
5. 「Next」をクリック
6. 「Create access key」をクリック
7. **重要**: 以下の情報をコピーして安全に保存：
   - **Access key ID**
   - **Secret access key**（この画面を閉じると二度と表示されません）

---

## 3. AWS Lambdaのセットアップ（Gemini API用）

### 3.1 Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. プロジェクトを選択（または新規作成）
5. APIキーをコピーして保存

### 3.2 Lambda関数の作成

1. AWSコンソールで「Lambda」を検索して開く
2. 「Create function」をクリック
3. 以下の設定を入力：
   - **Function name**: `scout-visits-gemini-api`
   - **Runtime**: `Node.js 20.x`
   - **Architecture**: `x86_64`
4. 「Create function」をクリック

### 3.3 Lambda関数のコード実装

1. Lambda関数のコードエディタで、以下のコードを貼り付け：

```javascript
const https = require('https');

exports.handler = async (event) => {
  // CORS対応
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエストの処理
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // リクエストボディのパース
    const body = JSON.parse(event.body || '{}');
    const prompt = body.prompt;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Gemini APIの呼び出し
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const requestData = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const response = await new Promise((resolve, reject) => {
      const req = https.request(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        });
      });

      req.on('error', reject);
      req.write(requestData);
      req.end();
    });

    if (response.statusCode !== 200) {
      throw new Error(`Gemini API error: ${response.statusCode}`);
    }

    const result = response.data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

2. 「Deploy」をクリック

### 3.4 環境変数の設定

1. Lambda関数の「Configuration」タブをクリック
2. 「Environment variables」をクリック
3. 「Edit」をクリック
4. 「Add environment variable」をクリック
5. 以下の環境変数を追加：
   - **Key**: `GEMINI_API_KEY`
   - **Value**: 先ほど取得したGemini APIキー
6. 「Save」をクリック

### 3.5 Lambda関数のURL設定

1. Lambda関数の「Configuration」タブをクリック
2. 「Function URL」をクリック
3. 「Create function URL」をクリック
4. 以下の設定を入力：
   - **Auth type**: `NONE`（または`AWS_IAM`でより安全に）
   - **CORS**: 有効化を推奨
5. 「Save」をクリック
6. **Function URL**をコピーして保存（例: `https://xxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/`）

---

## 4. 環境変数の設定

### 4.1 .envファイルの作成

プロジェクトルートに `.env` ファイルを作成：

```bash
# Supabase設定
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AWS S3設定
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
VITE_AWS_S3_BUCKET_NAME=scout-visits-images-your-unique-id

# Gemini API設定（Lambda関数URL）
VITE_GEMINI_API_ENDPOINT=https://xxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/
```

### 4.2 .gitignoreの確認

`.env`ファイルが`.gitignore`に含まれていることを確認：

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

---

## 5. 動作確認

### 5.1 依存関係のインストール

```bash
npm install
```

### 5.2 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` が自動的に開きます。

### 5.3 動作確認チェックリスト

- [ ] アプリが正常に起動する
- [ ] ダッシュボードが表示される
- [ ] 新規店舗登録フォームが表示される
- [ ] 都道府県選択が動作する
- [ ] レジ台数選択が動作する
- [ ] 強豪競合業者選択が動作する
- [ ] 画像アップロードが動作する（S3に保存される）
- [ ] 店舗データがSupabaseに保存される
- [ ] 検索・フィルタリングが動作する

### 5.4 トラブルシューティング

#### Supabase接続エラー

- `.env`ファイルの環境変数が正しいか確認
- Supabaseプロジェクトがアクティブか確認
- ブラウザのコンソールでエラーメッセージを確認

#### S3アップロードエラー

- AWS認証情報が正しいか確認
- バケット名とリージョンが正しいか確認
- IAMポリシーで適切な権限が付与されているか確認
- バケットのパブリックアクセス設定を確認

#### Lambda関数エラー

- Lambda関数のログを確認（CloudWatch Logs）
- 環境変数`GEMINI_API_KEY`が正しく設定されているか確認
- Function URLが正しく設定されているか確認

---

## 次のステップ

1. **本番環境へのデプロイ**
   - Vercel、Netlify、またはAWS Amplifyを使用
   - 環境変数をデプロイ先の設定で追加

2. **セキュリティの強化**
   - Lambda関数の認証を`AWS_IAM`に変更
   - RLSポリシーの見直し
   - CORS設定の最適化

3. **パフォーマンスの最適化**
   - 画像の最適化（リサイズ、圧縮）
   - CloudFrontの設定（S3のCDN）

---

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
