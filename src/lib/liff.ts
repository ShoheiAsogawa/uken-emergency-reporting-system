import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

/**
 * LIFF初期化
 */
export async function initLiff(): Promise<void> {
  if (!LIFF_ID) {
    throw new Error('LIFF_ID is not set');
  }

  try {
    await liff.init({ liffId: LIFF_ID });
  } catch (error) {
    console.error('LIFF初期化エラー:', error);
    throw error;
  }
}

/**
 * LIFFログイン状態を確認
 */
export function isLiffLoggedIn(): boolean {
  return liff.isLoggedIn();
}

/**
 * LIFFログイン
 */
export function loginLiff(): void {
  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

/**
 * LIFFログアウト
 */
export function logoutLiff(): void {
  liff.logout();
}

/**
 * LINEユーザーIDを取得
 */
export function getLineUserId(): string | null {
  const profile = liff.getDecodedIDToken();
  return profile?.sub || null;
}

/**
 * LINEプロフィール情報を取得
 */
export async function getLineProfile() {
  try {
    const profile = await liff.getProfile();
    return profile;
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    throw error;
  }
}

/**
 * IDトークンを取得（API認証用）
 */
export function getIdToken(): string | null {
  return liff.getIDToken() || null;
}

