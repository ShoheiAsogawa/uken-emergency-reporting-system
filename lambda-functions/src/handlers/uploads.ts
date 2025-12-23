import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { s3 } from '../db/s3.js'
import { envInt, requiredEnv } from '../utils/env.js'
import { logAudit } from '../db/audit.js'
import type { StaffPrincipal } from '../auth/cognito.js'

const BUCKET = requiredEnv('S3_BUCKET_IMAGES')
const EXPIRES_IN = envInt('PRESIGN_EXPIRES_IN_SECONDS', 3600)

function safeBasename(name: string) {
  // パス要素/危険文字を除去
  const base = name.split('/').pop() || name
  return base.replace(/[^\w.\-]/g, '_').slice(0, 120)
}

export async function presignPut(lineUserId: string, requestedKey: string, contentType?: string) {
  const base = safeBasename(requestedKey)
  const key = `reports/${lineUserId}/${uuidv4()}-${base}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  })

  const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN })

  await logAudit({
    actor_type: 'citizen',
    actor_id: lineUserId,
    action: 'UPLOAD_PRESIGN_PUT',
    details: { key },
  })

  return { url, key, expires_in: EXPIRES_IN }
}

export async function presignGet(staff: StaffPrincipal, key: string) {
  // 画像キーは reports/ 以下のみ許可（他バケットオブジェクトを見せない）
  if (!key.startsWith('reports/')) throw new Error('Invalid key')

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN })

  await logAudit({
    actor_type: 'staff',
    actor_id: staff.staff_id,
    action: 'UPLOAD_PRESIGN_GET',
    details: { key },
  })

  return { url, key, expires_in: EXPIRES_IN }
}

