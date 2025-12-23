import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { optionalEnv } from '../utils/env.js'

const region = optionalEnv('AWS_REGION') || optionalEnv('AWS_DEFAULT_REGION') || 'ap-northeast-1'

export const dynamo = new DynamoDBClient({ region })
export const docClient = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
})

