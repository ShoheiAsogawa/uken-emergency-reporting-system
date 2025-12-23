import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { getHeader } from '../utils/http.js'
import { verifyLiffIdToken, type LiffPrincipal } from './liff.js'
import { verifyCognitoJwt, type StaffPrincipal, type StaffRole } from './cognito.js'

function bearerToken(event: APIGatewayProxyEventV2): string | null {
  const raw = getHeader(event.headers || {}, 'authorization')
  if (!raw) return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

export async function requireLiff(event: APIGatewayProxyEventV2): Promise<LiffPrincipal> {
  const token = bearerToken(event)
  if (!token) throw new Error('Unauthorized')
  return verifyLiffIdToken(token)
}

export async function requireStaff(event: APIGatewayProxyEventV2): Promise<StaffPrincipal> {
  const token = bearerToken(event)
  if (!token) throw new Error('Unauthorized')
  return verifyCognitoJwt(token)
}

export function requireRole(principal: StaffPrincipal, role: StaffRole) {
  const order: StaffRole[] = ['viewer', 'operator', 'admin']
  const idx = order.indexOf(principal.role)
  const need = order.indexOf(role)
  if (idx < need) {
    throw new Error('Forbidden')
  }
}

