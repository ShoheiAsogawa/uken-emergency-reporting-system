import { S3Client } from '@aws-sdk/client-s3'
import { optionalEnv } from '../utils/env.js'

const region = optionalEnv('S3_BUCKET_REGION') || optionalEnv('AWS_REGION') || 'ap-northeast-1'

export const s3 = new S3Client({ region })

