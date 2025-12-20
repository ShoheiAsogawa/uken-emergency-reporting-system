-- トレードテーブルの作成
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    entry_price NUMERIC,
    exit_price NUMERIC,
    quantity NUMERIC,
    pnl NUMERIC NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    logic TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    strategy TEXT NOT NULL,
    mood TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('WIN', 'LOSS', 'BE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, date DESC);

-- RLS (Row Level Security) の有効化
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成（認証済みユーザーは自分のデータのみアクセス可能）
CREATE POLICY "Users can view their own trades"
    ON public.trades FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own trades"
    ON public.trades FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own trades"
    ON public.trades FOR UPDATE
    USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own trades"
    ON public.trades FOR DELETE
    USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

