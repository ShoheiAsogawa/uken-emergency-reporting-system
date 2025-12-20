-- 店舗視察レポート用テーブル
CREATE TABLE IF NOT EXISTS scout_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  facility_name TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C')),
  judgment TEXT NOT NULL CHECK (judgment IN ('pending', 'negotiating', 'approved', 'rejected')),
  
  -- 環境・設備
  environment TEXT CHECK (environment IN ('屋内', '半屋内', '屋外')),
  imitation_table TEXT CHECK (imitation_table IN ('設置可', '条件付', '不可')),
  space_size TEXT,
  
  -- 客層・マーケティング
  traffic_count TEXT,
  demographics TEXT,
  flow_line TEXT,
  seasonality TEXT,
  
  -- 運営・条件
  staff_count TEXT,
  competitors TEXT,
  conditions TEXT,
  
  -- 追加フィールド（新機能）
  prefecture TEXT, -- 都道府県
  register_count INTEGER CHECK (register_count >= 0 AND register_count <= 5), -- レジ設置台数 (0-5)
  strong_competitor TEXT, -- 強豪競合業者
  
  -- 総合レビュー
  overall_review TEXT,
  
  -- 画像（JSON配列として保存）
  photo_url TEXT, -- JSON配列: [{"id": "file-id", "url": "https://..."}]
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_scout_visits_user_id ON scout_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_visits_date ON scout_visits(date);
CREATE INDEX IF NOT EXISTS idx_scout_visits_rank ON scout_visits(rank);
CREATE INDEX IF NOT EXISTS idx_scout_visits_judgment ON scout_visits(judgment);
CREATE INDEX IF NOT EXISTS idx_scout_visits_prefecture ON scout_visits(prefecture);

-- RLS (Row Level Security) ポリシー
ALTER TABLE scout_visits ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧・編集可能
CREATE POLICY "Users can view their own visits"
  ON scout_visits FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own visits"
  ON scout_visits FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own visits"
  ON scout_visits FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own visits"
  ON scout_visits FOR DELETE
  USING (auth.uid()::text = user_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_scout_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scout_visits_updated_at
  BEFORE UPDATE ON scout_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_scout_visits_updated_at();
