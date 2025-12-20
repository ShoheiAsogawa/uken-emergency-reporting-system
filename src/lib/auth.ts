import { supabase } from './supabase'

/**
 * 現在のユーザーIDを取得
 * 認証が設定されていない場合は、ローカルストレージから取得またはデフォルト値を返す
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return user.id
    }
    
    // 認証が設定されていない場合、ローカルストレージから取得
    let userId = localStorage.getItem('neon_trade_user_id')
    
    if (!userId) {
      // 新しいユーザーIDを生成
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('neon_trade_user_id', userId)
    }
    
    return userId
  } catch (error) {
    console.error('ユーザーID取得エラー:', error)
    // フォールバック: ローカルストレージから取得
    let userId = localStorage.getItem('neon_trade_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('neon_trade_user_id', userId)
    }
    return userId
  }
}

/**
 * サインアップ（メール/パスワード）
 */
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('サインアップエラー:', error)
    throw error
  }
}

/**
 * サインイン（メール/パスワード）
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('サインインエラー:', error)
    throw error
  }
}

/**
 * サインアウト
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem('neon_trade_user_id')
  } catch (error) {
    console.error('サインアウトエラー:', error)
    throw error
  }
}

/**
 * 現在のセッションを取得
 */
export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return null
  }
}

