import { useState } from 'react';
import { MapPin, Calendar, Filter, Search, Download } from 'lucide-react';
import type { Report, ReportCategory, ReportStatus, ReportFilter, ReportSort } from '../../types';
import { exportReportsCSV } from '../../lib/api';

const CATEGORY_LABELS: Record<ReportCategory, { label: string; emoji: string; color: string }> = {
  road_damage: { label: '道路破損', emoji: '🚧', color: 'bg-orange-100 text-orange-800' },
  disaster: { label: '災害情報', emoji: '🌊', color: 'bg-blue-100 text-blue-800' },
  animal_accident: { label: '動物事故', emoji: '🦌', color: 'bg-red-100 text-red-800' },
};

const STATUS_LABELS: Record<ReportStatus, { label: string; color: string }> = {
  pending: { label: '未対応', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: '対応中', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '完了', color: 'bg-green-100 text-green-800' },
  false_report: { label: '誤報', color: 'bg-red-100 text-red-800' },
  duplicate: { label: '重複', color: 'bg-purple-100 text-purple-800' },
};

interface ReportListProps {
  reports: Report[];
  filter: ReportFilter;
  sort: ReportSort;
  onFilterChange: (filter: ReportFilter) => void;
  onSortChange: (sort: ReportSort) => void;
  onReportClick: (report: Report) => void;
}

export default function ReportList({
  reports,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onReportClick,
}: ReportListProps) {
  const [keyword, setKeyword] = useState(filter.keyword || '');

  const handleKeywordSearch = () => {
    onFilterChange({ ...filter, keyword });
  };

  const handleExport = async () => {
    try {
      const blob = await exportReportsCSV(filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV出力エラー:', err);
      alert('CSV出力に失敗しました');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* フィルタ・検索 */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* 検索 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
              placeholder="詳細文で検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleKeywordSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            検索
          </button>
        </div>

        {/* フィルタ */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filter.status?.[0] || ''}
            onChange={(e) => {
              const status = e.target.value as ReportStatus | '';
              onFilterChange({
                ...filter,
                status: status ? [status] : undefined,
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべてのステータス</option>
            {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filter.category?.[0] || ''}
            onChange={(e) => {
              const category = e.target.value as ReportCategory | '';
              onFilterChange({
                ...filter,
                category: category ? [category] : undefined,
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべてのカテゴリ</option>
            {Object.entries(CATEGORY_LABELS).map(([value, { label, emoji }]) => (
              <option key={value} value={value}>
                {emoji} {label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filter.start_date || ''}
            onChange={(e) => onFilterChange({ ...filter, start_date: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="開始日"
          />

          <input
            type="date"
            value={filter.end_date || ''}
            onChange={(e) => onFilterChange({ ...filter, end_date: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="終了日"
          />

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV出力
          </button>
        </div>

        {/* ソート */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sort.field}
            onChange={(e) => onSortChange({ ...sort, field: e.target.value as ReportSort['field'] })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">日付</option>
            <option value="status">ステータス</option>
            <option value="category">カテゴリ</option>
          </select>
          <select
            value={sort.order}
            onChange={(e) => onSortChange({ ...sort, order: e.target.value as ReportSort['order'] })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            通報がありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => {
              const categoryInfo = CATEGORY_LABELS[report.category];
              const statusInfo = STATUS_LABELS[report.status];

              return (
                <div
                  key={report.report_id}
                  onClick={() => onReportClick(report)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{categoryInfo.emoji}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {report.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.created_at).toLocaleString('ja-JP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                        </div>
                        {report.photo_keys.length > 0 && (
                          <span className="text-blue-600">
                            📷 {report.photo_keys.length}枚
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

