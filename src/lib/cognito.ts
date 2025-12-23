import { Amplify } from 'aws-amplify'
import { confirmSignIn, fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth'
import type { Staff, StaffRole } from '../types'

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || ''
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ''

let configured = false
function ensureConfigured() {
  if (configured) return
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error('Cognito設定（VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID）が不足しています')
  }
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: USER_POOL_ID,
        userPoolClientId: CLIENT_ID,
      },
    },
  })
  configured = true
}

export type LoginResult =
  | { done: true }
  | { done: false; nextStep: string; requiresMfa: boolean }

/**
 * ログイン（必要ならMFAへ遷移）
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  ensureConfigured()
  const res = await signIn({ username: email, password })
  const step = res.nextStep?.signInStep || 'DONE'
  if (step === 'DONE') return { done: true }
  const requiresMfa =
    step === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' ||
    step === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' ||
    step === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'
  return { done: false, nextStep: step, requiresMfa }
}

/**
 * MFA（確認コード）を送信
 */
export async function confirmMFA(code: string): Promise<LoginResult> {
  ensureConfigured()
  const res = await confirmSignIn({ challengeResponse: code })
  const step = res.nextStep?.signInStep || 'DONE'
  if (step === 'DONE') return { done: true }
  const requiresMfa =
    step === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' ||
    step === 'CONFIRM_SIGN_IN_WITH_SMS_CODE' ||
    step === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'
  return { done: false, nextStep: step, requiresMfa }
}

export async function logout() {
  ensureConfigured()
  await signOut()
}

function roleFromClaims(claims: Record<string, unknown>): StaffRole {
  const explicit = claims['custom:role']
  if (explicit === 'admin' || explicit === 'operator' || explicit === 'viewer') return explicit

  const groups = claims['cognito:groups']
  const list = Array.isArray(groups) ? groups.map(String) : typeof groups === 'string' ? groups.split(',').map((s) => s.trim()) : []
  if (list.includes('admin')) return 'admin'
  if (list.includes('operator')) return 'operator'
  return 'viewer'
}

/**
 * 現在の職員情報（Cognitoセッション由来）
 */
export async function getCurrentStaff(): Promise<(Partial<Staff> & { username?: string; role?: StaffRole }) | null> {
  ensureConfigured()
  try {
    const user = await getCurrentUser()
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken
    const claims = (idToken?.payload || {}) as Record<string, unknown>
    return {
      staff_id: user.userId,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      name: typeof claims.name === 'string' ? claims.name : undefined,
      role: roleFromClaims(claims),
      username: user.username,
    }
  } catch {
    return null
  }
}

/**
 * API認証用トークン（Cognito JWT）
 * - バックエンド側で検証しやすいので基本はIDトークンを返す
 */
export async function getAuthToken(): Promise<string | null> {
  ensureConfigured()
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString() || null
  } catch {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  ensureConfigured()
  try {
    await getCurrentUser()
    return true
  } catch {
    return false
  }
}

