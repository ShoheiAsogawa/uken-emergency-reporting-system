// 通報カテゴリ
export type ReportCategory = 'road_damage' | 'disaster' | 'animal_accident';

// 通報ステータス
export type ReportStatus = 'pending' | 'in_progress' | 'completed' | 'false_report' | 'duplicate';

// 職員ロール
export type StaffRole = 'viewer' | 'operator' | 'admin';

// 通報データ
export interface Report {
  report_id: string;
  created_at: string;
  category: ReportCategory;
  status: ReportStatus;
  lat: number;
  lng: number;
  description?: string;
  contact_phone?: string; // 要保護データ
  photo_keys: string[];
  reporter_id: string; // LIFF由来の識別子
  abuse_flags?: string[];
  dedupe_hint?: string;
}

// 通報履歴
export interface ReportHistory {
  report_id: string;
  changed_at: string;
  changed_by: string; // 職員ID
  action: 'STATUS_CHANGE' | 'MEMO_UPDATE' | 'VIEW_CONTACT' | 'EXPORT';
  from_value?: string;
  to_value?: string;
  memo?: string;
}

// 避難所データ
export interface Shelter {
  shelter_id: string;
  name: string;
  lat: number;
  lng: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

// 通報作成リクエスト
export interface CreateReportRequest {
  category: ReportCategory;
  lat: number;
  lng: number;
  description?: string;
  contact_phone?: string;
  photo_keys?: string[];
}

// 通報更新リクエスト
export interface UpdateReportRequest {
  status?: ReportStatus;
  memo?: string;
}

// フィルタ条件
export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  status?: ReportStatus[];
  category?: ReportCategory[];
  keyword?: string;
}

// ソート条件
export interface ReportSort {
  field: 'created_at' | 'status' | 'category';
  order: 'asc' | 'desc';
}

// 職員情報
export interface Staff {
  staff_id: string;
  email: string;
  role: StaffRole;
  name?: string;
}

