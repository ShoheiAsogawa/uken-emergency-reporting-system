import { supabase } from './supabase';

// 都道府県リスト（北海道から沖縄まで）
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// レジ設置台数オプション
export const REGISTER_COUNTS = [0, 1, 2, 3, 4, 5];

// 強豪競合業者リスト
export const STRONG_COMPETITORS = [
  'なし',
  'ブックオフ',
  'ハードオフ',
  'オフハウス',
  '2nd STREET',
  'トレジャーファクトリー',
  'その他'
];

// 店舗視察レポートの型定義
export interface ScoutVisit {
  id: string;
  user_id: string;
  date: string;
  facility_name: string;
  staff_name: string;
  rank: 'S' | 'A' | 'B' | 'C';
  judgment: 'pending' | 'negotiating' | 'approved' | 'rejected';
  environment?: '屋内' | '半屋内' | '屋外';
  imitation_table?: '設置可' | '条件付' | '不可';
  space_size?: string;
  traffic_count?: string;
  demographics?: string;
  flow_line?: string;
  seasonality?: string;
  staff_count?: string;
  competitors?: string;
  conditions?: string;
  prefecture?: string;
  register_count?: number;
  strong_competitor?: string;
  overall_review?: string;
  photo_url?: string; // JSON配列
  created_at?: string;
  updated_at?: string;
}

// 画像オブジェクトの型
export interface PhotoObject {
  id: string | null;
  url: string;
}

// 全データ取得
export async function getScoutVisits(userId: string): Promise<ScoutVisit[]> {
  const { data, error } = await supabase
    .from('scout_visits')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching scout visits:', error);
    throw error;
  }

  return data || [];
}

// データ保存
export async function saveScoutVisit(visit: Partial<ScoutVisit>): Promise<ScoutVisit> {
  const { data, error } = await supabase
    .from('scout_visits')
    .upsert(visit, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving scout visit:', error);
    throw error;
  }

  return data;
}

// データ削除
export async function deleteScoutVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from('scout_visits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting scout visit:', error);
    throw error;
  }
}

// 画像URLのパース
export function parsePhotoUrl(photoUrl: string | null | undefined): PhotoObject[] {
  if (!photoUrl) return [];
  
  try {
    const parsed = JSON.parse(photoUrl);
    if (Array.isArray(parsed)) {
      return parsed.map(p => 
        typeof p === 'string' ? { id: null, url: p } : p
      );
    }
    return [{ id: null, url: photoUrl }];
  } catch (e) {
    return [{ id: null, url: photoUrl }];
  }
}

// 画像URLのシリアライズ
export function serializePhotoUrl(photos: PhotoObject[]): string {
  return JSON.stringify(photos);
}
