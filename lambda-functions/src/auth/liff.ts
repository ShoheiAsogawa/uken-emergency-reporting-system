import { createRemoteJWKSet, jwtVerify } from 'jose'
import { requiredEnv } from '../utils/env.js'

const LINE_JWKS = createRemoteJWKSet(new URL('https://api.line.me/oauth2/v2.1/certs'))

export interface LiffPrincipal {
  line_user_id: string
  issued_at: number
  expires_at: number
}

/**
 * LIFFのIDトークン（JWT）を検証してsub（LINEユーザーID）を返す
 *
 * - iss: https://access.line.me
 * - aud: LINE_CHANNEL_ID
 */
export async function verifyLiffIdToken(idToken: string): Promise<LiffPrincipal> {
  const channelId = requiredEnv('LINE_CHANNEL_ID')
  const { payload } = await jwtVerify(idToken, LINE_JWKS, {
    issuer: 'https://access.line.me',
    audience: channelId,
  })

  const sub = payload.sub
  if (!sub) throw new Error('Invalid LIFF token: missing sub')

  const iat = typeof payload.iat === 'number' ? payload.iat : 0
  const exp = typeof payload.exp === 'number' ? payload.exp : 0

  return {
    line_user_id: String(sub),
    issued_at: iat,
    expires_at: exp,
  }
}

