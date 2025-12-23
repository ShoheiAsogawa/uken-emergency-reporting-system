import type { StaffPrincipal } from '../auth/cognito.js'
import { PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { docClient } from '../db/dynamo.js'
import { optionalEnv } from '../utils/env.js'
import { logAudit } from '../db/audit.js'
import { notifyNewReport } from '../utils/notify.js'

export type ReportCategory = 'road_damage' | 'disaster' | 'animal_accident'
export type ReportStatus = 'pending' | 'in_progress' | 'completed' | 'false_report' | 'duplicate'

export interface ReportItem {
  report_id: string
  created_at: string
  category: ReportCategory
  status: ReportStatus
  lat: number
  lng: number
  description?: string
  contact_phone?: string
  photo_keys: string[]
  reporter_id: string
}

export interface CreateReportRequest {
  category: ReportCategory
  lat: number
  lng: number
  description?: string
  contact_phone?: string
  photo_keys?: string[]
}

export interface ReportFilter {
  start_date?: string
  end_date?: string
  status?: string[]
  category?: string[]
  keyword?: string
}

export interface ReportSort {
  field?: 'created_at' | 'status' | 'category'
  order?: 'asc' | 'desc'
}

const TABLE_REPORTS = optionalEnv('DYNAMODB_TABLE_REPORTS') || 'Reports'
const TABLE_HISTORY = optionalEnv('DYNAMODB_TABLE_HISTORY') || 'ReportHistory'

export interface ReportHistoryItem {
  report_id: string
  changed_at: string
  changed_by: string
  action: 'STATUS_CHANGE' | 'MEMO_UPDATE' | 'VIEW_CONTACT' | 'EXPORT'
  from_value?: string
  to_value?: string
  memo?: string
}

function isCategory(x: string): x is ReportCategory {
  return x === 'road_damage' || x === 'disaster' || x === 'animal_accident'
}

function isStatus(x: string): x is ReportStatus {
  return x === 'pending' || x === 'in_progress' || x === 'completed' || x === 'false_report' || x === 'duplicate'
}

function maskContact(phone: string): string {
  if (phone.length <= 4) return phone
  return '****' + phone.slice(-4)
}

export async function createReport(lineUserId: string, data: CreateReportRequest) {
  if (!isCategory(data.category)) throw new Error('Invalid category')
  if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) throw new Error('Invalid lat/lng')
  if (data.description && data.description.length > 2000) throw new Error('Description too long')
  if (data.contact_phone && data.contact_phone.length > 50) throw new Error('Contact phone too long')

  const report: ReportItem = {
    report_id: uuidv4(),
    created_at: new Date().toISOString(),
    category: data.category,
    status: 'pending',
    lat: data.lat,
    lng: data.lng,
    description: data.description,
    contact_phone: data.contact_phone,
    photo_keys: data.photo_keys || [],
    reporter_id: lineUserId,
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_REPORTS,
      Item: report,
    })
  )

  await logAudit({
    actor_type: 'citizen',
    actor_id: lineUserId,
    action: 'REPORT_CREATE',
    report_id: report.report_id,
    details: { category: report.category },
  })

  await notifyNewReport({
    report_id: report.report_id,
    category: report.category,
    created_at: report.created_at,
    lat: report.lat,
    lng: report.lng,
  }).catch(() => {
    // 通知失敗は本処理を落とさない
  })

  return report
}

export async function getReport(reportId: string, staff: StaffPrincipal) {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE_REPORTS,
      Key: { report_id: reportId },
    })
  )

  const item = res.Item as ReportItem | undefined
  if (!item) throw new Error('NotFound')

  if (staff.role === 'viewer' && item.contact_phone) {
    return { ...item, contact_phone: maskContact(item.contact_phone) }
  }
  return item
}

export async function getContact(reportId: string, staff: StaffPrincipal) {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE_REPORTS,
      Key: { report_id: reportId },
      ProjectionExpression: 'report_id, contact_phone',
    })
  )
  const item = res.Item as { report_id: string; contact_phone?: string } | undefined
  if (!item) throw new Error('NotFound')
  if (!item.contact_phone) return { contact_phone: null }

  const history: ReportHistoryItem = {
    report_id: reportId,
    changed_at: new Date().toISOString(),
    changed_by: staff.staff_id,
    action: 'VIEW_CONTACT',
    to_value: 'viewed',
  }
  await docClient.send(
    new PutCommand({
      TableName: TABLE_HISTORY,
      Item: history,
    })
  )
  await logAudit({
    actor_type: 'staff',
    actor_id: staff.staff_id,
    action: 'VIEW_CONTACT',
    report_id: reportId,
  })

  return { contact_phone: item.contact_phone }
}

export async function updateStatus(reportId: string, status: string, staff: StaffPrincipal) {
  if (!isStatus(status)) throw new Error('Invalid status')

  // 現在値取得（履歴用）
  const current = await docClient.send(
    new GetCommand({
      TableName: TABLE_REPORTS,
      Key: { report_id: reportId },
      ProjectionExpression: 'report_id, #status',
      ExpressionAttributeNames: { '#status': 'status' },
    })
  )
  const currentStatus = (current.Item as any)?.status as string | undefined
  if (!current.Item) throw new Error('NotFound')

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_REPORTS,
      Key: { report_id: reportId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    })
  )

  const history: ReportHistoryItem = {
    report_id: reportId,
    changed_at: new Date().toISOString(),
    changed_by: staff.staff_id,
    action: 'STATUS_CHANGE',
    from_value: currentStatus,
    to_value: status,
  }
  await docClient.send(
    new PutCommand({
      TableName: TABLE_HISTORY,
      Item: history,
    })
  )
  await logAudit({
    actor_type: 'staff',
    actor_id: staff.staff_id,
    action: 'STATUS_CHANGE',
    report_id: reportId,
    details: { from: currentStatus, to: status },
  })
}

export async function addMemo(reportId: string, memo: string, staff: StaffPrincipal) {
  if (!memo || memo.trim().length === 0) throw new Error('Invalid memo')
  if (memo.length > 4000) throw new Error('Memo too long')

  // 存在確認
  const current = await docClient.send(
    new GetCommand({
      TableName: TABLE_REPORTS,
      Key: { report_id: reportId },
      ProjectionExpression: 'report_id',
    })
  )
  if (!current.Item) throw new Error('NotFound')

  const history: ReportHistoryItem = {
    report_id: reportId,
    changed_at: new Date().toISOString(),
    changed_by: staff.staff_id,
    action: 'MEMO_UPDATE',
    memo,
    to_value: 'memo',
  }
  await docClient.send(
    new PutCommand({
      TableName: TABLE_HISTORY,
      Item: history,
    })
  )
  await logAudit({
    actor_type: 'staff',
    actor_id: staff.staff_id,
    action: 'MEMO_UPDATE',
    report_id: reportId,
  })
}

export async function getHistory(reportId: string) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_HISTORY,
      KeyConditionExpression: 'report_id = :id',
      ExpressionAttributeValues: { ':id': reportId },
      ScanIndexForward: false,
    })
  )
  return (res.Items || []) as ReportHistoryItem[]
}

function parseFilter(query: Record<string, string | undefined>): { filter: ReportFilter; sort: ReportSort } {
  const filter: ReportFilter = {}
  const sort: ReportSort = {}

  if (query.start_date) filter.start_date = query.start_date
  if (query.end_date) filter.end_date = query.end_date
  if (query.keyword) filter.keyword = query.keyword

  if (query.status) filter.status = query.status.split(',').map((s) => s.trim()).filter(Boolean)
  if (query.category) filter.category = query.category.split(',').map((s) => s.trim()).filter(Boolean)

  if (query.sort_field === 'created_at' || query.sort_field === 'status' || query.sort_field === 'category') {
    sort.field = query.sort_field
  }
  if (query.sort_order === 'asc' || query.sort_order === 'desc') sort.order = query.sort_order

  return { filter, sort }
}

function inDateRange(createdAt: string, start?: string, end?: string) {
  if (start && createdAt < start) return false
  if (end && createdAt > end) return false
  return true
}

export async function listReports(rawQuery: Record<string, string | undefined>) {
  const { filter, sort } = parseFilter(rawQuery)
  const order = sort.order || 'desc'

  // まずはGSIを使えるケース（単一のstatus or categoryで期間のみ）に寄せる
  const statusSingle = filter.status?.length === 1 ? filter.status[0] : undefined
  const categorySingle = filter.category?.length === 1 ? filter.category[0] : undefined
  const canUseGsi = !filter.keyword && (!filter.status || filter.status.length === 1) && (!filter.category || filter.category.length === 1)

  let items: ReportItem[] = []

  if (canUseGsi && statusSingle && isStatus(statusSingle)) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_REPORTS,
        IndexName: 'StatusCreatedAtIndex',
        KeyConditionExpression: '#status = :s',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':s': statusSingle },
        ScanIndexForward: order === 'asc',
      })
    )
    items = (res.Items || []) as ReportItem[]
  } else if (canUseGsi && categorySingle && isCategory(categorySingle)) {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE_REPORTS,
        IndexName: 'CategoryCreatedAtIndex',
        KeyConditionExpression: '#category = :c',
        ExpressionAttributeNames: { '#category': 'category' },
        ExpressionAttributeValues: { ':c': categorySingle },
        ScanIndexForward: order === 'asc',
      })
    )
    items = (res.Items || []) as ReportItem[]
  } else {
    // scan（keyword/multi-filter対応）
    const expr: string[] = []
    const names: Record<string, string> = {}
    const values: Record<string, unknown> = {}

    if (filter.status?.length) {
      names['#status'] = 'status'
      values[':statuses'] = filter.status
      expr.push('contains(:statuses, #status)')
    }
    if (filter.category?.length) {
      names['#category'] = 'category'
      values[':categories'] = filter.category
      expr.push('contains(:categories, #category)')
    }
    if (filter.keyword) {
      names['#description'] = 'description'
      values[':kw'] = filter.keyword
      expr.push('contains(#description, :kw)')
    }

    const res = await docClient.send(
      new ScanCommand({
        TableName: TABLE_REPORTS,
        FilterExpression: expr.length ? expr.join(' AND ') : undefined,
        ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
        ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      })
    )
    items = (res.Items || []) as ReportItem[]
  }

  // 期間フィルタ（GSI queryでもここで絞る）
  if (filter.start_date || filter.end_date) {
    items = items.filter((it) => inDateRange(it.created_at, filter.start_date, filter.end_date))
  }

  // ソート（created_at以外）
  if (sort.field && sort.field !== 'created_at') {
    const dir = order === 'asc' ? 1 : -1
    items.sort((a, b) => {
      const av = (a as any)[sort.field]
      const bv = (b as any)[sort.field]
      if (av === bv) return 0
      return av > bv ? dir : -dir
    })
  } else {
    // created_atの順序を明示的に揃える（scanの場合など）
    const dir = order === 'asc' ? 1 : -1
    items.sort((a, b) => (a.created_at > b.created_at ? dir : a.created_at < b.created_at ? -dir : 0))
  }

  return items
}

export function reportsToCsv(rows: ReportItem[], includeContact: boolean) {
  const header = [
    'report_id',
    'created_at',
    'category',
    'status',
    'lat',
    'lng',
    'description',
    'contact_phone',
    'photo_keys',
    'reporter_id',
  ]

  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const lines = [header.join(',')]
  for (const r of rows) {
    const contact = includeContact ? r.contact_phone || '' : r.contact_phone ? maskContact(r.contact_phone) : ''
    lines.push(
      [
        r.report_id,
        r.created_at,
        r.category,
        r.status,
        r.lat,
        r.lng,
        r.description || '',
        contact,
        (r.photo_keys || []).join('|'),
        r.reporter_id,
      ]
        .map(escape)
        .join(',')
    )
  }
  return lines.join('\n')
}

