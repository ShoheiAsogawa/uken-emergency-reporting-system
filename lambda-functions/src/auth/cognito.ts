import { createRemoteJWKSet, jwtVerify } from 'jose'
import { requiredEnv, optionalEnv } from '../utils/env.js'

export type StaffRole = 'viewer' | 'operator' | 'admin'

export interface StaffPrincipal {
  staff_id: string
  email?: string
  username?: string
  role: StaffRole
}

function getIssuer(region: string, userPoolId: string) {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
}

function deriveRoleFromClaims(payload: Record<string, unknown>): StaffRole {
  const explicit = payload['custom:role']
  if (explicit === 'admin' || explicit === 'operator' || explicit === 'viewer') return explicit

  const groups = payload['cognito:groups']
  if (Array.isArray(groups)) {
    const set = new Set(groups.map(String))
    if (set.has('admin')) return 'admin'
    if (set.has('operator')) return 'operator'
    if (set.has('viewer')) return 'viewer'
  } else if (typeof groups === 'string') {
    const list = groups.split(',').map((s) => s.trim())
    const set = new Set(list)
    if (set.has('admin')) return 'admin'
    if (set.has('operator')) return 'operator'
    if (set.has('viewer')) return 'viewer'
  }

  return 'viewer'
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

export async function verifyCognitoJwt(token: string): Promise<StaffPrincipal> {
  const userPoolId = requiredEnv('COGNITO_USER_POOL_ID')
  const region = optionalEnv('COGNITO_REGION') || optionalEnv('AWS_REGION') || 'ap-northeast-1'
  const issuer = getIssuer(region, userPoolId)

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  }

  const { payload } = await jwtVerify(token, jwks, { issuer })

  const tokenUse = payload.token_use
  if (tokenUse !== 'id' && tokenUse !== 'access') {
    throw new Error('Invalid cognito token: token_use is not id/access')
  }

  const sub = payload.sub
  if (!sub) throw new Error('Invalid cognito token: missing sub')

  const email = typeof payload.email === 'string' ? payload.email : undefined
  const username =
    typeof payload['cognito:username'] === 'string' ? (payload['cognito:username'] as string) : undefined

  return {
    staff_id: String(sub),
    email,
    username,
    role: deriveRoleFromClaims(payload as Record<string, unknown>),
  }
}

