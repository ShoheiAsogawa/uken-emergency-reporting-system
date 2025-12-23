import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { json, noContent, csv as csvResp, parseJsonBody } from '../utils/http.js'
import { requireLiff, requireRole, requireStaff } from '../auth/index.js'
import { checkRateLimit } from '../db/rateLimit.js'
import {
  addMemo,
  createReport,
  getContact,
  getHistory,
  getReport,
  listReports,
  reportsToCsv,
  updateStatus,
} from './reports.js'
import { listShelters, saveShelter } from './shelters.js'
import { presignGet, presignPut } from './uploads.js'
import { logAudit } from '../db/audit.js'

type Route = {
  method: string
  path: RegExp
  handler: (event: APIGatewayProxyEventV2, match: RegExpMatchArray) => Promise<APIGatewayProxyResultV2>
}

function method(event: APIGatewayProxyEventV2) {
  return (event.requestContext.http.method || '').toUpperCase()
}

function rawPath(event: APIGatewayProxyEventV2) {
  return event.rawPath || '/'
}

function badRequest(message: string) {
  return json(400, { message })
}

function mapError(err: unknown): APIGatewayProxyResultV2 {
  const msg = err instanceof Error ? err.message : String(err)

  if (msg === 'Unauthorized') return json(401, { message: 'Unauthorized' })
  if (msg === 'Forbidden') return json(403, { message: 'Forbidden' })
  if (msg === 'NotFound') return json(404, { message: 'Not found' })
  if (msg.startsWith('Invalid') || msg.startsWith('Missing') || msg.includes('too long')) return json(400, { message: msg })

  console.error(err)
  return json(500, { message: 'Internal server error' })
}

const routes: Route[] = [
  {
    method: 'GET',
    path: /^\/health$/,
    handler: async () => json(200, { ok: true }),
  },

  // ===== Citizen (LIFF) =====
  {
    method: 'POST',
    path: /^\/uploads\/presign$/,
    handler: async (event) => {
      const principal = await requireLiff(event)
      const ok = await checkRateLimit(principal.line_user_id)
      if (!ok) return json(429, { message: 'Rate limit exceeded' })

      const body = parseJsonBody<{ key?: string; content_type?: string }>(event.body)
      if (!body.key) return badRequest('Missing key')
      const res = await presignPut(principal.line_user_id, body.key, body.content_type)
      return json(200, res)
    },
  },
  {
    method: 'POST',
    path: /^\/reports$/,
    handler: async (event) => {
      const principal = await requireLiff(event)
      const ok = await checkRateLimit(principal.line_user_id)
      if (!ok) return json(429, { message: 'Rate limit exceeded' })

      const body = parseJsonBody<any>(event.body)
      const report = await createReport(principal.line_user_id, body)
      return json(201, report)
    },
  },
  {
    method: 'GET',
    path: /^\/shelters$/,
    handler: async (event) => {
      // 住民側からはLIFF必須。職員側の取得も許可したい場合はCognitoも受ける。
      try {
        await requireLiff(event)
      } catch {
        // fallback: staff auth
        await requireStaff(event)
      }
      const shelters = await listShelters()
      return json(200, shelters)
    },
  },

  // ===== Staff (Cognito) =====
  {
    method: 'GET',
    path: /^\/reports$/,
    handler: async (event) => {
      const staff = await requireStaff(event)
      const items = await listReports(event.queryStringParameters || {})
      if (staff.role === 'viewer') {
        const masked = items.map((r) => ({
          ...r,
          contact_phone: r.contact_phone ? '****' + r.contact_phone.slice(-4) : undefined,
        }))
        return json(200, masked as any)
      }
      return json(200, items as any)
    },
  },
  {
    method: 'GET',
    path: /^\/reports\/export\.csv$/,
    handler: async (event) => {
      const staff = await requireStaff(event)
      const items = await listReports(event.queryStringParameters || {})

      await logAudit({
        actor_type: 'staff',
        actor_id: staff.staff_id,
        action: 'EXPORT',
        details: { count: items.length },
      })

      const includeContact = staff.role !== 'viewer'
      const csv = reportsToCsv(items, includeContact)
      const filename = `reports_${new Date().toISOString().slice(0, 10)}.csv`
      return csvResp(200, csv, filename)
    },
  },
  {
    method: 'GET',
    path: /^\/reports\/([^/]+)$/,
    handler: async (event, match) => {
      const staff = await requireStaff(event)
      const reportId = match[1]
      const report = await getReport(reportId, staff)
      return json(200, report as any)
    },
  },
  {
    method: 'GET',
    path: /^\/reports\/([^/]+)\/history$/,
    handler: async (event, match) => {
      await requireStaff(event)
      const reportId = match[1]
      const history = await getHistory(reportId)
      return json(200, history as any)
    },
  },
  {
    method: 'GET',
    path: /^\/reports\/([^/]+)\/contact$/,
    handler: async (event, match) => {
      const staff = await requireStaff(event)
      requireRole(staff, 'operator')
      const reportId = match[1]
      const contact = await getContact(reportId, staff)
      return json(200, contact as any)
    },
  },
  {
    method: 'PATCH',
    path: /^\/reports\/([^/]+)\/status$/,
    handler: async (event, match) => {
      const staff = await requireStaff(event)
      requireRole(staff, 'operator')
      const reportId = match[1]
      const body = parseJsonBody<{ status?: string }>(event.body)
      if (!body.status) return badRequest('Missing status')
      await updateStatus(reportId, body.status, staff)
      return json(200, { ok: true })
    },
  },
  {
    method: 'PATCH',
    path: /^\/reports\/([^/]+)\/memo$/,
    handler: async (event, match) => {
      const staff = await requireStaff(event)
      requireRole(staff, 'operator')
      const reportId = match[1]
      const body = parseJsonBody<{ memo?: string }>(event.body)
      if (!body.memo) return badRequest('Missing memo')
      await addMemo(reportId, body.memo, staff)
      return json(200, { ok: true })
    },
  },
  {
    method: 'POST',
    path: /^\/uploads\/presign-get$/,
    handler: async (event) => {
      const staff = await requireStaff(event)
      const body = parseJsonBody<{ key?: string }>(event.body)
      if (!body.key) return badRequest('Missing key')
      const res = await presignGet(staff, body.key)
      return json(200, res)
    },
  },
  {
    method: 'POST',
    path: /^\/shelters$/,
    handler: async (event) => {
      const staff = await requireStaff(event)
      requireRole(staff, 'admin')
      const body = parseJsonBody<any>(event.body)
      const shelter = await saveShelter(body, staff)
      return json(200, shelter as any)
    },
  },
  {
    method: 'PATCH',
    path: /^\/shelters\/([^/]+)$/,
    handler: async (event, match) => {
      const staff = await requireStaff(event)
      requireRole(staff, 'admin')
      const body = parseJsonBody<any>(event.body)
      const shelter = await saveShelter({ ...body, shelter_id: match[1] }, staff)
      return json(200, shelter as any)
    },
  },
]

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (method(event) === 'OPTIONS') return noContent()

  const m = method(event)
  const p = rawPath(event)

  const route = routes.find((r) => r.method === m && r.path.test(p))
  if (!route) return json(404, { message: 'Not found' })

  try {
    const match = p.match(route.path)
    if (!match) return json(404, { message: 'Not found' })
    return await route.handler(event, match)
  } catch (err) {
    return mapError(err)
  }
}

