import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Edit, Save, Loader2 } from 'lucide-react';
import type { Report, ReportStatus, ReportHistory } from '../../types';
import { getReportContact, getReportHistory, updateReportStatus, updateReportMemo } from '../../lib/api';
import { getSignedImageUrl } from '../../lib/s3';
import { maskPhone } from '../../lib/format';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'completed', label: '完了' },
  { value: 'false_report', label: '誤報' },
  { value: 'duplicate', label: '重複' },
];

interface ReportDetailProps {
  report: Report;
  onClose: () => void;
  onUpdate: () => void;
  canViewContact: boolean;
}

export default function ReportDetail({
  report,
  onClose,
  onUpdate,
  canViewContact,
}: ReportDetailProps) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [memo, setMemo] = useState('');
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [showContact, setShowContact] = useState(false);
  const [contactPhone, setContactPhone] = useState<string | null>(report.contact_phone || null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
    loadPhotos();
    setContactPhone(report.contact_phone || null);
    setShowContact(false);
  }, [report.report_id]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await getReportHistory(report.report_id);
      setHistory(data);
    } catch (err) {
      console.error('履歴取得エラー:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const urls = await Promise.all(
        report.photo_keys.map((key) => getSignedImageUrl(key))
      );
      setPhotoUrls(urls);
    } catch (err) {
      console.error('写真取得エラー:', err);
    }
  };

  const handleToggleContact = async () => {
    const next = !showContact;
    setShowContact(next);
    if (!next) return;
    if (!canViewContact) return;
    if (!report.contact_phone) return;
    if (contactPhone && !contactPhone.startsWith('****')) return;

    try {
      setIsLoadingContact(true);
      const res = await getReportContact(report.report_id);
      setContactPhone(res.contact_phone);
    } catch (err) {
      console.error('連絡先取得エラー:', err);
      alert('連絡先の取得に失敗しました');
      setShowContact(false);
    } finally {
      setIsLoadingContact(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (status === report.status) return;

    try {
      setIsSaving(true);
      await updateReportStatus(report.report_id, status);
      await onUpdate();
      await loadHistory();
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemoUpdate = async () => {
    try {
      setIsSaving(true);
      await updateReportMemo(report.report_id, memo);
      await onUpdate();
      await loadHistory();
      setMemo('');
    } catch (err) {
      console.error('メモ更新エラー:', err);
      alert('メモの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">通報詳細</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div>
            <h3 className="font-semibold mb-2">基本情報</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">カテゴリ:</span>
                <span className="ml-2">
                  {report.category === 'road_damage' && '🚧 道路破損'}
                  {report.category === 'disaster' && '🌊 災害情報'}
                  {report.category === 'animal_accident' && '🦌 動物事故'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">作成日時:</span>
                <span className="ml-2">
                  {new Date(report.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">位置:</span>
                <span className="ml-2">
                  {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          {/* 写真 */}
          {photoUrls.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">写真</h3>
              <div className="grid grid-cols-3 gap-4">
                {photoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`写真 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 詳細情報 */}
          {report.description && (
            <div>
              <h3 className="font-semibold mb-2">詳細情報</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {report.description}
              </p>
            </div>
          )}

          {/* 連絡先 */}
          {report.contact_phone && (
            <div>
              <h3 className="font-semibold mb-2">連絡先</h3>
              {canViewContact ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isLoadingContact
                        ? '取得中...'
                        : showContact
                          ? (contactPhone || '')
                          : maskPhone(contactPhone || report.contact_phone)}
                    </span>
                    <button
                      onClick={handleToggleContact}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showContact ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {showContact && '※ 連絡先表示はログに記録されます'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  連絡先を表示する権限がありません
                </p>
              )}
            </div>
          )}

          {/* ステータス更新 */}
          <div>
            <h3 className="font-semibold mb-2">ステータス</h3>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isSaving || status === report.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                更新
              </button>
            </div>
          </div>

          {/* メモ */}
          <div>
            <h3 className="font-semibold mb-2">対応メモ</h3>
            <div className="space-y-2">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="対応メモを入力..."
              />
              <button
                onClick={handleMemoUpdate}
                disabled={isSaving || !memo.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                メモを追加
              </button>
            </div>
          </div>

          {/* 履歴 */}
          <div>
            <h3 className="font-semibold mb-2">変更履歴</h3>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500">履歴がありません</p>
            ) : (
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div key={index} className="text-sm border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.action}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(item.changed_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      {item.changed_by} | {item.from_value && `${item.from_value} → `}
                      {item.to_value}
                    </div>
                    {item.memo && (
                      <div className="text-gray-700 text-xs mt-1">{item.memo}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

