import { getPresignedGetUrl } from './api'

/**
 * 署名付きURLを取得（職員向け閲覧）
 *
 * セキュリティ上、ブラウザにAWSアクセスキーは置かず、
 * API（Lambda）から署名付きURLを発行する方式に統一する。
 */
export async function getSignedImageUrl(key: string): Promise<string> {
  const { url } = await getPresignedGetUrl(key)
  return url
}

