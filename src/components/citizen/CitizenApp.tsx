import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { initLiff, isLiffLoggedIn, loginLiff } from '../../lib/liff';
import EmergencyButton from './EmergencyButton';
import ReportForm from './ReportForm';
import ShelterMap from './ShelterMap';

type Tab = 'report' | 'shelter';

export default function CitizenApp() {
  const [initialized, setInitialized] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('report');

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      await initLiff();
      
      if (!isLiffLoggedIn()) {
        loginLiff();
        return;
      }

      setLoggedIn(true);
    } catch (err) {
      console.error('LIFF初期化エラー:', err);
      setError('アプリの初期化に失敗しました');
    } finally {
      setInitialized(true);
    }
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">ログイン中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmergencyButton />

      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            宇検村 通報・防災システム
          </h1>
          
          {/* タブ */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              通報フォーム
            </button>
            <button
              onClick={() => setActiveTab('shelter')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'shelter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              避難所マップ
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'report' && <ReportForm />}
        {activeTab === 'shelter' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">避難所マップ</h2>
            <ShelterMap />
          </div>
        )}
      </main>
    </div>
  );
}

