import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { docClient } from './dynamo.js'
import { optionalEnv } from '../utils/env.js'

export type AuditAction =
  | 'REPORT_CREATE'
  | 'STATUS_CHANGE'
  | 'MEMO_UPDATE'
  | 'VIEW_CONTACT'
  | 'EXPORT'
  | 'SHELTER_SAVE'
  | 'UPLOAD_PRESIGN_PUT'
  | 'UPLOAD_PRESIGN_GET'

export interface AuditLog {
  log_id: string
  timestamp: string
  actor_type: 'citizen' | 'staff'
  actor_id: string
  action: AuditAction
  report_id?: string
  details?: Record<string, unknown>
}

const TABLE = optionalEnv('DYNAMODB_TABLE_AUDIT') || 'AuditLogs'

export async function logAudit(entry: Omit<AuditLog, 'log_id' | 'timestamp'>) {
  const item: AuditLog = {
    log_id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry,
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    })
  )
}

