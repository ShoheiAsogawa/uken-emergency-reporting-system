import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { optionalEnv } from './env.js'

const region = optionalEnv('AWS_REGION') || 'ap-northeast-1'
const sns = new SNSClient({ region })

export async function notifyNewReport(message: {
  report_id: string
  category: string
  created_at: string
  lat: number
  lng: number
}) {
  const topicArn = optionalEnv('SNS_TOPIC_ARN')
  if (!topicArn) return

  const subject = optionalEnv('SNS_SUBJECT') || '新規通報が作成されました'
  const body = JSON.stringify(message, null, 2)

  await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: body,
    })
  )
}

