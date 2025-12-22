import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS S3設定
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || ''

/**
 * 画像をS3にアップロード
 * @param file アップロードするファイル
 * @param userId ユーザーID
 * @param folder フォルダ名（デフォルト: 'reports'）
 */
export async function uploadImageToS3(file: File, userId: string, folder: string = 'reports'): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3バケット名が設定されていません')
  }

  const timestamp = Date.now()
  const fileName = `${userId}/${folder}/${timestamp}-${file.name}`
  
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read', // またはバケットポリシーで設定
    })

    await s3Client.send(command)
    
    // パブリックURLを返す（CloudFrontやカスタムドメインを使用する場合は変更）
    return `https://${BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${fileName}`
  } catch (error) {
    console.error('S3アップロードエラー:', error)
    throw error
  }
}

/**
 * 署名付きURLを取得（プライベートバケットの場合）
 */
export async function getSignedImageUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3バケット名が設定されていません')
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('署名付きURL取得エラー:', error)
    throw error
  }
}

