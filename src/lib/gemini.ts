// Gemini API呼び出し用（AWS Lambda経由）

const GEMINI_API_ENDPOINT = import.meta.env.VITE_GEMINI_API_ENDPOINT || '';

export async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_ENDPOINT) {
    throw new Error('Gemini API endpoint is not configured');
  }

  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || data.text || 'エラー: レスポンス形式が不正です';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
