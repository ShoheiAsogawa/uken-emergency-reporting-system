import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from './dynamo.js'
import { envInt, optionalEnv } from '../utils/env.js'

const TABLE = optionalEnv('DYNAMODB_TABLE_RATE_LIMITS') || 'RateLimits'
const WINDOW_SECONDS = envInt('RATE_LIMIT_WINDOW_SECONDS', 5 * 60)
const LIMIT = envInt('RATE_LIMIT_LIMIT', 10)

export async function checkRateLimit(actorId: string): Promise<boolean> {
  const nowMs = Date.now()
  const window = WINDOW_SECONDS * 1000
  const windowKey = Math.floor(nowMs / window)
  const key = `rate_limit:${actorId}:${windowKey}`

  const ttl = Math.floor(nowMs / 1000) + WINDOW_SECONDS

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { key },
        UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :inc, ttl = :ttl',
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
        ExpressionAttributeNames: { '#count': 'count' },
        ExpressionAttributeValues: {
          ':zero': 0,
          ':inc': 1,
          ':limit': LIMIT,
          ':ttl': ttl,
        },
      })
    )
    return true
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') return false
    throw err
  }
}

