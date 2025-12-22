import { useState, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import type { Report, ReportFilter, ReportSort } from '../../types';
import { getReports } from '../../lib/api';
import { logout, getCurrentStaff } from '../../lib/cognito';
import ReportList from './ReportList';
import ReportMap from './ReportMap';
import ReportDetail from './ReportDetail';

const DEFAULT_FILTER: ReportFilter = {};
const DEFAULT_SORT: ReportSort = { field: 'created_at', order: 'desc' };

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<ReportSort>(DEFAULT_SORT);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>('');

  useEffect(() => {
    loadStaffInfo();
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [filter, sort]);

  const loadStaffInfo = async () => {
    try {
      const staff = await getCurrentStaff();
      if (staff) {
        setStaffName(staff.username || '');
      }
    } catch (err) {
      console.error('職員情報取得エラー:', err);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports(filter, sort);
      setReports(data);
    } catch (err) {
      console.error('通報取得エラー:', err);
      setError('通報データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (err) {
      console.error('ログアウトエラー:', err);
    }
  };

  // 権限チェック（簡易実装、実際はAPIから取得）
  const canViewContact = true; // Operator/Adminのみ

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            宇検村 通報・防災システム（管理）
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{staffName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3">
          {error}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左：リスト */}
        <div className="w-1/3 border-r border-gray-200">
          <ReportList
            reports={reports}
            filter={filter}
            sort={sort}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onReportClick={setSelectedReport}
          />
        </div>

        {/* 右：地図 */}
        <div className="flex-1 relative">
          <ReportMap
            reports={reports}
            selectedReport={selectedReport || undefined}
            onReportClick={setSelectedReport}
          />
        </div>
      </div>

      {/* 詳細パネル */}
      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={loadReports}
          canViewContact={canViewContact}
        />
      )}
    </div>
  );
}

