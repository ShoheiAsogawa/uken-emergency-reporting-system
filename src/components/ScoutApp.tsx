import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Search, Plus, Edit, Trash2, 
  MapPin, Calendar, Building2, Users, TrendingUp,
  Filter, X, Save, Image as ImageIcon, Loader2,
  AlertTriangle, CheckCircle, Clock, XCircle,
  Camera, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  ScoutVisit, PhotoObject, 
  getScoutVisits, saveScoutVisit, deleteScoutVisit,
  parsePhotoUrl, serializePhotoUrl,
  PREFECTURES, REGISTER_COUNTS, STRONG_COMPETITORS
} from '../lib/scout';
import { getCurrentUserId } from '../lib/auth';
import { uploadImageToS3 } from '../lib/s3';
import { callGemini } from '../lib/gemini';

type View = 'dashboard' | 'search' | 'add' | 'edit';

export default function ScoutApp() {
  const [visits, setVisits] = useState<ScoutVisit[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<ScoutVisit | null>(null);
  
  // 検索・フィルタ用の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState<string>('');
  const [filterRank, setFilterRank] = useState<string>('');
  const [filterJudgment, setFilterJudgment] = useState<string>('');

  // 初期化
  useEffect(() => {
    async function init() {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
        const data = await getScoutVisits(id);
        setVisits(data);
      } catch (err) {
        console.error('初期化エラー:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // データ再読み込み
  const reloadData = async () => {
    if (!userId) return;
    try {
      const data = await getScoutVisits(userId);
      setVisits(data);
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      setError('データの読み込みに失敗しました');
    }
  };

  // 新規登録開始
  const handleAddNew = () => {
    setEditingVisit(null);
    setView('add');
  };

  // 編集開始
  const handleEdit = (visit: ScoutVisit) => {
    setEditingVisit(visit);
    setView('edit');
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この店舗視察レポートを削除しますか？')) return;
    try {
      await deleteScoutVisit(id);
      await reloadData();
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました');
    }
  };

  // フィルタリングされたデータ
  const filteredVisits = visits.filter(visit => {
    if (searchQuery && !visit.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !visit.staff_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPrefecture && visit.prefecture !== filterPrefecture) return false;
    if (filterRank && visit.rank !== filterRank) return false;
    if (filterJudgment && visit.judgment !== filterJudgment) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] text-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white p-6">
        <div className="bg-rose-900/50 border border-rose-700 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-rose-400" size={24} />
            <h3 className="text-rose-300 font-bold">エラー</h3>
          </div>
          <p className="text-rose-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded text-white transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* ヘッダー */}
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              店舗視察レポート
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'dashboard' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                ダッシュボード
              </button>
              <button
                onClick={() => setView('search')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'search' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                検索
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新規登録
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
          <DashboardView visits={visits} />
        )}
        {view === 'search' && (
          <SearchView 
            visits={filteredVisits}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterPrefecture={filterPrefecture}
            setFilterPrefecture={setFilterPrefecture}
            filterRank={filterRank}
            setFilterRank={setFilterRank}
            filterJudgment={filterJudgment}
            setFilterJudgment={setFilterJudgment}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {(view === 'add' || view === 'edit') && (
          <VisitForm 
            visit={editingVisit}
            userId={userId!}
            onSave={async () => {
              await reloadData();
              setView('dashboard');
            }}
            onCancel={() => setView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

// ダッシュボードビュー
function DashboardView({ visits }: { visits: ScoutVisit[] }) {
  const stats = {
    total: visits.length,
    byRank: {
      S: visits.filter(v => v.rank === 'S').length,
      A: visits.filter(v => v.rank === 'A').length,
      B: visits.filter(v => v.rank === 'B').length,
      C: visits.filter(v => v.rank === 'C').length,
    },
    byJudgment: {
      pending: visits.filter(v => v.judgment === 'pending').length,
      negotiating: visits.filter(v => v.judgment === 'negotiating').length,
      approved: visits.filter(v => v.judgment === 'approved').length,
      rejected: visits.filter(v => v.judgment === 'rejected').length,
    },
    byPrefecture: visits.reduce((acc, v) => {
      const pref = v.prefecture || '未設定';
      acc[pref] = (acc[pref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const topPrefectures = Object.entries(stats.byPrefecture)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">総店舗数</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <Building2 className="w-12 h-12 text-cyan-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Sランク</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.byRank.S}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">交渉中</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{stats.byJudgment.negotiating}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">承認済み</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{stats.byJudgment.approved}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* ランク別分布 */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">ランク別分布</h2>
        <div className="grid grid-cols-4 gap-4">
          {(['S', 'A', 'B', 'C'] as const).map(rank => (
            <div key={rank} className="text-center">
              <div className="text-4xl font-bold mb-2">
                {rank === 'S' && <span className="text-yellow-400">{stats.byRank.S}</span>}
                {rank === 'A' && <span className="text-green-400">{stats.byRank.A}</span>}
                {rank === 'B' && <span className="text-blue-400">{stats.byRank.B}</span>}
                {rank === 'C' && <span className="text-slate-400">{stats.byRank.C}</span>}
              </div>
              <p className="text-slate-400">ランク{rank}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 都道府県別トップ5 */}
      {topPrefectures.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">都道府県別トップ5</h2>
          <div className="space-y-3">
            {topPrefectures.map(([pref, count]) => (
              <div key={pref} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-white">{pref}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-cyan-400 font-bold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近の登録 */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">最近の登録</h2>
        {visits.length === 0 ? (
          <p className="text-slate-400 text-center py-8">まだ登録がありません</p>
        ) : (
          <div className="space-y-3">
            {visits.slice(0, 5).map(visit => (
              <div key={visit.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    visit.rank === 'S' ? 'bg-yellow-400/20 text-yellow-400' :
                    visit.rank === 'A' ? 'bg-green-400/20 text-green-400' :
                    visit.rank === 'B' ? 'bg-blue-400/20 text-blue-400' :
                    'bg-slate-400/20 text-slate-400'
                  }`}>
                    {visit.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{visit.facility_name}</p>
                    <p className="text-sm text-slate-400">{visit.prefecture || '未設定'} • {visit.date}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  visit.judgment === 'approved' ? 'bg-green-400/20 text-green-400' :
                  visit.judgment === 'negotiating' ? 'bg-blue-400/20 text-blue-400' :
                  visit.judgment === 'rejected' ? 'bg-rose-400/20 text-rose-400' :
                  'bg-slate-400/20 text-slate-400'
                }`}>
                  {visit.judgment === 'approved' ? '承認済み' :
                   visit.judgment === 'negotiating' ? '交渉中' :
                   visit.judgment === 'rejected' ? '却下' :
                   '保留'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 検索ビュー
function SearchView({
  visits,
  searchQuery,
  setSearchQuery,
  filterPrefecture,
  setFilterPrefecture,
  filterRank,
  setFilterRank,
  filterJudgment,
  setFilterJudgment,
  onEdit,
  onDelete,
}: {
  visits: ScoutVisit[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterPrefecture: string;
  setFilterPrefecture: (p: string) => void;
  filterRank: string;
  setFilterRank: (r: string) => void;
  filterJudgment: string;
  setFilterJudgment: (j: string) => void;
  onEdit: (visit: ScoutVisit) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 検索・フィルタ */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">検索</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="店舗名・担当者名で検索"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">都道府県</label>
            <select
              value={filterPrefecture}
              onChange={(e) => setFilterPrefecture(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">すべて</option>
              {PREFECTURES.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ランク</label>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">すべて</option>
              <option value="S">S</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">判定</label>
            <select
              value={filterJudgment}
              onChange={(e) => setFilterJudgment(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">すべて</option>
              <option value="pending">保留</option>
              <option value="negotiating">交渉中</option>
              <option value="approved">承認済み</option>
              <option value="rejected">却下</option>
            </select>
          </div>
        </div>
      </div>

      {/* 結果一覧 */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">検索結果: {visits.length}件</h2>
        </div>
        {visits.length === 0 ? (
          <p className="text-slate-400 text-center py-8">該当する店舗がありません</p>
        ) : (
          <div className="space-y-4">
            {visits.map(visit => (
              <div key={visit.id} className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        visit.rank === 'S' ? 'bg-yellow-400/20 text-yellow-400' :
                        visit.rank === 'A' ? 'bg-green-400/20 text-green-400' :
                        visit.rank === 'B' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-slate-400/20 text-slate-400'
                      }`}>
                        {visit.rank}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{visit.facility_name}</h3>
                        <p className="text-sm text-slate-400">{visit.staff_name} • {visit.date}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {visit.prefecture && (
                        <div>
                          <span className="text-slate-400">都道府県:</span>
                          <span className="text-white ml-2">{visit.prefecture}</span>
                        </div>
                      )}
                      {visit.register_count !== undefined && (
                        <div>
                          <span className="text-slate-400">レジ台数:</span>
                          <span className="text-white ml-2">{visit.register_count}台</span>
                        </div>
                      )}
                      {visit.strong_competitor && (
                        <div>
                          <span className="text-slate-400">強豪競合:</span>
                          <span className="text-white ml-2">{visit.strong_competitor}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">判定:</span>
                        <span className={`ml-2 ${
                          visit.judgment === 'approved' ? 'text-green-400' :
                          visit.judgment === 'negotiating' ? 'text-blue-400' :
                          visit.judgment === 'rejected' ? 'text-rose-400' :
                          'text-slate-400'
                        }`}>
                          {visit.judgment === 'approved' ? '承認済み' :
                           visit.judgment === 'negotiating' ? '交渉中' :
                           visit.judgment === 'rejected' ? '却下' :
                           '保留'}
                        </span>
                      </div>
                    </div>
                    {visit.overall_review && (
                      <p className="mt-4 text-slate-300 text-sm line-clamp-2">{visit.overall_review}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onEdit(visit)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(visit.id)}
                      className="p-2 bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 店舗登録・編集フォーム
function VisitForm({
  visit,
  userId,
  onSave,
  onCancel,
}: {
  visit: ScoutVisit | null;
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ScoutVisit>>({
    date: visit?.date || new Date().toISOString().split('T')[0],
    facility_name: visit?.facility_name || '',
    staff_name: visit?.staff_name || '',
    rank: visit?.rank || 'C',
    judgment: visit?.judgment || 'pending',
    environment: visit?.environment,
    imitation_table: visit?.imitation_table,
    space_size: visit?.space_size || '',
    traffic_count: visit?.traffic_count || '',
    demographics: visit?.demographics || '',
    flow_line: visit?.flow_line || '',
    seasonality: visit?.seasonality || '',
    staff_count: visit?.staff_count || '',
    competitors: visit?.competitors || '',
    conditions: visit?.conditions || '',
    prefecture: visit?.prefecture || '',
    register_count: visit?.register_count,
    strong_competitor: visit?.strong_competitor || '',
    overall_review: visit?.overall_review || '',
  });
  const [photos, setPhotos] = useState<PhotoObject[]>(visit ? parsePhotoUrl(visit.photo_url) : []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof ScoutVisit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos: PhotoObject[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageToS3(file, userId, 'scout_visits');
        newPhotos.push({ id: null, url });
      }
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (err) {
      console.error('画像アップロードエラー:', err);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const visitData: Partial<ScoutVisit> = {
        ...formData,
        user_id: userId,
        photo_url: photos.length > 0 ? serializePhotoUrl(photos) : undefined,
      };
      if (visit?.id) {
        visitData.id = visit.id;
      }
      await saveScoutVisit(visitData);
      onSave();
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">
          {visit ? '店舗情報を編集' : '新規店舗登録'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">日付 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">都道府県 *</label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => handleInputChange('prefecture', e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">店舗名 *</label>
                <input
                  type="text"
                  value={formData.facility_name}
                  onChange={(e) => handleInputChange('facility_name', e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">担当者名 *</label>
                <input
                  type="text"
                  value={formData.staff_name}
                  onChange={(e) => handleInputChange('staff_name', e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ランク *</label>
                <select
                  value={formData.rank}
                  onChange={(e) => handleInputChange('rank', e.target.value as 'S' | 'A' | 'B' | 'C')}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">判定 *</label>
                <select
                  value={formData.judgment}
                  onChange={(e) => handleInputChange('judgment', e.target.value as ScoutVisit['judgment'])}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="pending">保留</option>
                  <option value="negotiating">交渉中</option>
                  <option value="approved">承認済み</option>
                  <option value="rejected">却下</option>
                </select>
              </div>
            </div>
          </div>

          {/* 新機能: レジ台数、強豪競合 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">設備情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">レジ設置台数</label>
                <select
                  value={formData.register_count ?? ''}
                  onChange={(e) => handleInputChange('register_count', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">選択してください</option>
                  {REGISTER_COUNTS.map(count => (
                    <option key={count} value={count}>{count}台</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">強豪競合業者</label>
                <select
                  value={formData.strong_competitor || ''}
                  onChange={(e) => handleInputChange('strong_competitor', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">選択してください</option>
                  {STRONG_COMPETITORS.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 環境・設備 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">環境・設備</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">環境</label>
                <select
                  value={formData.environment || ''}
                  onChange={(e) => handleInputChange('environment', e.target.value as ScoutVisit['environment'])}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">選択してください</option>
                  <option value="屋内">屋内</option>
                  <option value="半屋内">半屋内</option>
                  <option value="屋外">屋外</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">模擬テーブル設置</label>
                <select
                  value={formData.imitation_table || ''}
                  onChange={(e) => handleInputChange('imitation_table', e.target.value as ScoutVisit['imitation_table'])}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">選択してください</option>
                  <option value="設置可">設置可</option>
                  <option value="条件付">条件付</option>
                  <option value="不可">不可</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">スペースサイズ</label>
                <input
                  type="text"
                  value={formData.space_size}
                  onChange={(e) => handleInputChange('space_size', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 客層・マーケティング */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">客層・マーケティング</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">通行量</label>
                <input
                  type="text"
                  value={formData.traffic_count}
                  onChange={(e) => handleInputChange('traffic_count', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">客層</label>
                <input
                  type="text"
                  value={formData.demographics}
                  onChange={(e) => handleInputChange('demographics', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">動線</label>
                <input
                  type="text"
                  value={formData.flow_line}
                  onChange={(e) => handleInputChange('flow_line', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">季節性</label>
                <input
                  type="text"
                  value={formData.seasonality}
                  onChange={(e) => handleInputChange('seasonality', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 運営・条件 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">運営・条件</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">スタッフ数</label>
                <input
                  type="text"
                  value={formData.staff_count}
                  onChange={(e) => handleInputChange('staff_count', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">競合</label>
                <input
                  type="text"
                  value={formData.competitors}
                  onChange={(e) => handleInputChange('competitors', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">条件</label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) => handleInputChange('conditions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 総合レビュー */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">総合レビュー</label>
            <textarea
              value={formData.overall_review}
              onChange={(e) => handleInputChange('overall_review', e.target.value)}
              rows={5}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">画像</label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {uploading ? 'アップロード中...' : '画像を選択'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`画像 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
