import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。.envファイルを確認してください。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベース型定義
export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          side: 'LONG' | 'SHORT'
          entry_price: number | null
          exit_price: number | null
          quantity: number | null
          pnl: number
          date: string
          time: string
          logic: string
          timeframe: string
          strategy: string
          mood: string
          image_url: string | null
          status: 'WIN' | 'LOSS' | 'BE'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          side: 'LONG' | 'SHORT'
          entry_price?: number | null
          exit_price?: number | null
          quantity?: number | null
          pnl: number
          date: string
          time: string
          logic: string
          timeframe: string
          strategy: string
          mood: string
          image_url?: string | null
          status: 'WIN' | 'LOSS' | 'BE'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          side?: 'LONG' | 'SHORT'
          entry_price?: number | null
          exit_price?: number | null
          quantity?: number | null
          pnl?: number
          date?: string
          time?: string
          logic?: string
          timeframe?: string
          strategy?: string
          mood?: string
          image_url?: string | null
          status?: 'WIN' | 'LOSS' | 'BE'
          created_at?: string
          updated_at?: string
        }
      }
      scout_visits: {
        Row: {
          id: string
          user_id: string
          date: string
          facility_name: string
          staff_name: string
          rank: 'S' | 'A' | 'B' | 'C'
          judgment: 'pending' | 'negotiating' | 'approved' | 'rejected'
          environment: '屋内' | '半屋内' | '屋外' | null
          imitation_table: '設置可' | '条件付' | '不可' | null
          space_size: string | null
          traffic_count: string | null
          demographics: string | null
          flow_line: string | null
          seasonality: string | null
          staff_count: string | null
          competitors: string | null
          conditions: string | null
          prefecture: string | null
          register_count: number | null
          strong_competitor: string | null
          overall_review: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          facility_name: string
          staff_name: string
          rank: 'S' | 'A' | 'B' | 'C'
          judgment: 'pending' | 'negotiating' | 'approved' | 'rejected'
          environment?: '屋内' | '半屋内' | '屋外' | null
          imitation_table?: '設置可' | '条件付' | '不可' | null
          space_size?: string | null
          traffic_count?: string | null
          demographics?: string | null
          flow_line?: string | null
          seasonality?: string | null
          staff_count?: string | null
          competitors?: string | null
          conditions?: string | null
          prefecture?: string | null
          register_count?: number | null
          strong_competitor?: string | null
          overall_review?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          facility_name?: string
          staff_name?: string
          rank?: 'S' | 'A' | 'B' | 'C'
          judgment?: 'pending' | 'negotiating' | 'approved' | 'rejected'
          environment?: '屋内' | '半屋内' | '屋外' | null
          imitation_table?: '設置可' | '条件付' | '不可' | null
          space_size?: string | null
          traffic_count?: string | null
          demographics?: string | null
          flow_line?: string | null
          seasonality?: string | null
          staff_count?: string | null
          competitors?: string | null
          conditions?: string | null
          prefecture?: string | null
          register_count?: number | null
          strong_competitor?: string | null
          overall_review?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

