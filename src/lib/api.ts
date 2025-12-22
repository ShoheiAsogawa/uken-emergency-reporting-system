import type {
  Report,
  CreateReportRequest,
  ReportFilter,
  ReportSort,
  Shelter,
} from '../types';
import { getIdToken } from './liff';
import { getAuthToken } from './cognito';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '';

/**
 * APIリクエスト（住民用：LIFFトークン）
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useLiffToken = false
): Promise<T> {
  const url = `${API_ENDPOINT}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 認証トークンを追加
  if (useLiffToken) {
    const token = getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 住民向けAPI ====================

/**
 * 通報を作成
 */
export async function createReport(data: CreateReportRequest): Promise<Report> {
  return apiRequest<Report>('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

/**
 * 避難所一覧を取得
 */
export async function getShelters(): Promise<Shelter[]> {
  return apiRequest<Shelter[]>('/shelters', {
    method: 'GET',
  }, true);
}

/**
 * 署名付きURLを取得（画像アップロード用）
 */
export async function getPresignedUrl(key: string): Promise<{ url: string; key: string }> {
  return apiRequest<{ url: string; key: string }>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ key }),
  }, true);
}

// ==================== 職員向けAPI ====================

/**
 * 通報一覧を取得
 */
export async function getReports(
  filter?: ReportFilter,
  sort?: ReportSort
): Promise<Report[]> {
  const params = new URLSearchParams();
  
  if (filter) {
    if (filter.start_date) params.append('start_date', filter.start_date);
    if (filter.end_date) params.append('end_date', filter.end_date);
    if (filter.status) params.append('status', filter.status.join(','));
    if (filter.category) params.append('category', filter.category.join(','));
    if (filter.keyword) params.append('keyword', filter.keyword);
  }
  
  if (sort) {
    params.append('sort_field', sort.field);
    params.append('sort_order', sort.order);
  }

  const query = params.toString();
  return apiRequest<Report[]>(`/reports${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * 通報詳細を取得
 */
export async function getReport(reportId: string): Promise<Report> {
  return apiRequest<Report>(`/reports/${reportId}`, {
    method: 'GET',
  });
}

/**
 * 通報ステータスを更新
 */
export async function updateReportStatus(
  reportId: string,
  status: Report['status']
): Promise<Report> {
  return apiRequest<Report>(`/reports/${reportId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * 通報メモを更新
 */
export async function updateReportMemo(
  reportId: string,
  memo: string
): Promise<Report> {
  return apiRequest<Report>(`/reports/${reportId}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ memo }),
  });
}

/**
 * 通報履歴を取得
 */
export async function getReportHistory(reportId: string) {
  return apiRequest(`/reports/${reportId}/history`, {
    method: 'GET',
  });
}

/**
 * CSV出力
 */
export async function exportReportsCSV(filter?: ReportFilter): Promise<Blob> {
  const params = new URLSearchParams();
  
  if (filter) {
    if (filter.start_date) params.append('start_date', filter.start_date);
    if (filter.end_date) params.append('end_date', filter.end_date);
    if (filter.status) params.append('status', filter.status.join(','));
    if (filter.category) params.append('category', filter.category.join(','));
  }

  const query = params.toString();
  const url = `${API_ENDPOINT}/reports/export.csv${query ? `?${query}` : ''}`;
  const token = await getAuthToken();
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.blob();
}

/**
 * 避難所一覧を取得（職員用）
 */
export async function getSheltersAdmin(): Promise<Shelter[]> {
  return apiRequest<Shelter[]>('/shelters', {
    method: 'GET',
  });
}

/**
 * 避難所を作成/更新
 */
export async function saveShelter(shelter: Partial<Shelter>): Promise<Shelter> {
  if (shelter.shelter_id) {
    return apiRequest<Shelter>(`/shelters/${shelter.shelter_id}`, {
      method: 'PATCH',
      body: JSON.stringify(shelter),
    });
  } else {
    return apiRequest<Shelter>('/shelters', {
      method: 'POST',
      body: JSON.stringify(shelter),
    });
  }
}

