# Lambda関数実装ガイド

## 関数一覧

### 認証

#### `auth-liff`
LIFF IDトークンを検証し、LINEユーザーIDを返す。

**入力:**
```json
{
  "id_token": "LINE_ID_TOKEN"
}
```

**出力:**
```json
{
  "line_user_id": "U1234567890abcdef",
  "expires_in": 3600
}
```

#### `auth-cognito`
Cognito JWTトークンを検証し、職員情報を返す。

**入力:**
```json
{
  "token": "COGNITO_JWT_TOKEN"
}
```

**出力:**
```json
{
  "staff_id": "staff_123",
  "email": "staff@uken-village.jp",
  "role": "operator"
}
```

### 通報管理

#### `reports-create`
通報を作成。

**入力:**
```json
{
  "category": "road_damage",
  "lat": 28.293,
  "lng": 129.255,
  "description": "道路に穴が...",
  "contact_phone": "090-1234-5678",
  "photo_keys": ["reports/1234567890-photo.jpg"]
}
```

**出力:**
```json
{
  "report_id": "report_123",
  "created_at": "2024-01-01T00:00:00Z",
  ...
}
```

#### `reports-list`
通報一覧を取得（フィルタ・ソート対応）。

**クエリパラメータ:**
- `start_date`: 開始日
- `end_date`: 終了日
- `status`: ステータス（カンマ区切り）
- `category`: カテゴリ（カンマ区切り）
- `keyword`: キーワード検索
- `sort_field`: ソート項目
- `sort_order`: ソート順（asc/desc）

#### `reports-get`
通報詳細を取得。

#### `reports-update-status`
ステータスを更新し、履歴を記録。

**入力:**
```json
{
  "status": "in_progress"
}
```

#### `reports-update-memo`
メモを追加し、履歴を記録。

**入力:**
```json
{
  "memo": "対応中です"
}
```

#### `reports-history`
通報の変更履歴を取得。

#### `reports-export`
CSV形式で通報データを出力。

### 避難所管理

#### `shelters-list`
避難所一覧を取得。

#### `shelters-save`
避難所を作成/更新（Adminのみ）。

### 画像アップロード

#### `uploads-presign`
S3への署名付きURLを発行。

**入力:**
```json
{
  "key": "reports/1234567890-photo.jpg"
}
```

**出力:**
```json
{
  "url": "https://s3.amazonaws.com/...",
  "key": "reports/1234567890-photo.jpg",
  "expires_in": 3600
}
```

## 実装例

### reports-create の実装例

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // 認証チェック
  const lineUserId = await verifyLiffToken(event.headers.Authorization);
  if (!lineUserId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  // レート制限チェック
  const rateLimitOk = await checkRateLimit(lineUserId);
  if (!rateLimitOk) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded' }),
    };
  }

  // リクエストボディのパース
  const body = JSON.parse(event.body);
  
  // バリデーション
  if (!body.category || !body.lat || !body.lng) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  // 通報データの作成
  const report = {
    report_id: uuidv4(),
    created_at: new Date().toISOString(),
    category: body.category,
    status: 'pending',
    lat: body.lat,
    lng: body.lng,
    description: body.description,
    contact_phone: body.contact_phone, // 暗号化推奨
    photo_keys: body.photo_keys || [],
    reporter_id: lineUserId,
  };

  // DynamoDBに保存
  await docClient.send(new PutCommand({
    TableName: process.env.DYNAMODB_TABLE_REPORTS,
    Item: report,
  }));

  // 監査ログ
  await logAudit({
    action: 'REPORT_CREATE',
    user_id: lineUserId,
    report_id: report.report_id,
  });

  return {
    statusCode: 201,
    body: JSON.stringify(report),
  };
};
```

## セキュリティ実装

### レート制限

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

async function checkRateLimit(userId) {
  const now = Date.now();
  const window = 5 * 60 * 1000; // 5分
  const limit = 10; // 10件

  const key = `rate_limit:${userId}:${Math.floor(now / window)}`;
  
  const { Item } = await docClient.send(new GetCommand({
    TableName: 'RateLimits',
    Key: { key },
  }));

  const count = Item?.count || 0;
  
  if (count >= limit) {
    return false;
  }

  await docClient.send(new PutCommand({
    TableName: 'RateLimits',
    Item: {
      key,
      count: count + 1,
      ttl: Math.floor(now / 1000) + 300, // 5分後
    },
  }));

  return true;
}
```

### 監査ログ

```javascript
async function logAudit(data) {
  await docClient.send(new PutCommand({
    TableName: 'AuditLogs',
    Item: {
      log_id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...data,
    },
  }));
}
```

## エラーハンドリング

```javascript
try {
  // 処理
} catch (error) {
  console.error('Error:', error);
  
  // CloudWatch Logsに記録
  await logError(error, event);
  
  return {
    statusCode: 500,
    body: JSON.stringify({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }),
  };
}
```

