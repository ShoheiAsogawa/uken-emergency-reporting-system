import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { confirmMFA, login, type LoginResult } from '../../lib/cognito';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginResult = (res: LoginResult) => {
    if (res.done) {
      onLoginSuccess();
      return;
    }
    setNextStep(res.nextStep);
    setRequiresMfa(res.requiresMfa);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (requiresMfa) {
        const res = await confirmMFA(mfaCode);
        handleLoginResult(res);
      } else {
        const res = await login(email, password);
        handleLoginResult(res);
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          宇検村 通報・防災システム
        </h1>
        <h2 className="text-lg font-semibold text-center mb-8 text-gray-600">
          職員ログイン
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requiresMfa ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@uken-village.jp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                認証コード（MFA）
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123456"
              />
              {nextStep && (
                <p className="mt-2 text-xs text-gray-500">
                  次のステップ: {nextStep}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setRequiresMfa(false);
                  setMfaCode('');
                  setNextStep(null);
                  setError(null);
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                メール/パスワード入力に戻る
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {requiresMfa ? '確認中...' : 'ログイン中...'}
              </>
            ) : (
              requiresMfa ? '認証する' : 'ログイン'
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          MFAが有効な場合は、ログイン後に認証コードの入力が求められます。
        </p>
      </div>
    </div>
  );
}

