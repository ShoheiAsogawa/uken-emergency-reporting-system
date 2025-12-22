// AWS Amplify v6のインポート（パッケージがインストールされていない場合はコメントアウト）
// import { Amplify } from 'aws-amplify';
// import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const REGION = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';

// Amplify設定（パッケージがインストールされたら有効化）
// if (USER_POOL_ID && CLIENT_ID) {
//   Amplify.configure({
//     Auth: {
//       Cognito: {
//         userPoolId: USER_POOL_ID,
//         userPoolClientId: CLIENT_ID,
//         region: REGION,
//       },
//     },
//   });
// }

/**
 * ログイン
 * TODO: AWS Amplifyパッケージをインストール後に実装
 */
export async function login(email: string, password: string) {
  // 暫定実装：API経由でログイン
  try {
    const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('ログインに失敗しました');
    }
    
    const data = await response.json();
    // トークンをローカルストレージに保存（暫定）
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    
    return true;
  } catch (error) {
    console.error('ログインエラー:', error);
    throw error;
  }
}

/**
 * MFA認証
 */
export async function confirmMFA(_code: string) {
  // TODO: 実装
  return true;
}

/**
 * ログアウト
 */
export async function logout() {
  try {
    localStorage.removeItem('admin_token');
    // TODO: API経由でログアウト
  } catch (error) {
    console.error('ログアウトエラー:', error);
    throw error;
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentStaff() {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    
    // TODO: API経由でユーザー情報を取得
    return { username: '職員' };
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return null;
  }
}

/**
 * 認証トークンを取得（API認証用）
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const token = localStorage.getItem('admin_token');
    return token;
  } catch (error) {
    console.error('トークン取得エラー:', error);
    return null;
  }
}

/**
 * ログイン状態を確認
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    return !!token;
  } catch {
    return false;
  }
}

