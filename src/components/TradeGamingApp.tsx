import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, Plus, Image as ImageIcon, 
  Calendar, DollarSign, Activity, Save, X, Filter,
  Search, Crosshair, History, LayoutDashboard,
  Target, Smile, BarChart2, PieChart as PieIcon, AlertTriangle, Globe, CalendarDays, Loader2,
  Sparkles, Trophy, Zap, Flame, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchTrades, createTrade } from '../lib/trades';
import { uploadImageToS3 } from '../lib/s3';
import { getCurrentUserId } from '../lib/auth';

// --- Types ---

export interface Trade {
  id: string;
  symbol: string; 
  side: 'LONG' | 'SHORT';
  pnl: number;
  date: string;
  time: string; // HH:mm format
  logic: string;
  strategy: string;
  mood: string;
  imageUrl?: string;
  status: 'WIN' | 'LOSS' | 'BE';
}

// --- Constants & Options (Japanese Main) ---

const SYMBOL_OPTIONS = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'USD/JPY', 'EUR/USD', 'GBP/USD', 'AUD/USD', 'Other'];

const STRATEGY_DEF = [
  { val: 'Trend Follow', jp: '順張り', en: 'TREND FOLLOW' },
  { val: 'Reversal', jp: '逆張り', en: 'REVERSAL' },
  { val: 'Breakout', jp: 'ブレイクアウト', en: 'BREAKOUT' },
  { val: 'Range', jp: 'レンジ', en: 'RANGE' },
  { val: 'Scalping', jp: 'スキャルピング', en: 'SCALPING' },
  { val: 'Fundamental', jp: 'ファンダメンタルズ', en: 'FUNDAMENTAL' },
];

const MOOD_DEF = [
  { val: 'Calm', jp: '冷静', en: 'CALM' },
  { val: 'Confident', jp: '自信あり', en: 'CONFIDENT' },
  { val: 'Neutral', jp: '普通', en: 'NEUTRAL' },
  { val: 'Anxious', jp: '不安', en: 'ANXIOUS' },
  { val: 'FOMO', jp: '飛び乗り (FOMO)', en: 'FOMO' },
  { val: 'Revenge', jp: 'リベンジ', en: 'REVENGE' },
];

// Color Palette for Charts
const COLORS = ['#0891b2', '#22d3ee', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
const WIN_COLOR = '#10b981';
const LOSS_COLOR = '#f43f5e';
// High visibility color for Axis and Legends
const TEXT_COLOR = '#e2e8f0';

// --- Mock Data Generator (Dynamic Dates) ---

const generateMockTrades = (): Trade[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // Previous month for comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return [
    { id: '1', symbol: 'BTC/USD', side: 'LONG', pnl: 750, date: `${year}-${pad(month)}-01`, time: '10:30', logic: 'サポートライン反発、RSIダイバージェンス確認。', status: 'WIN', strategy: '逆張り', mood: '冷静', imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=1000' },
    { id: '2', symbol: 'ETH/USD', side: 'SHORT', pnl: -250, date: `${year}-${pad(month)}-03`, time: '16:15', logic: '高値更新失敗と見てエントリーしたが、踏み上げられた。損切り遅れ。', status: 'LOSS', strategy: 'ブレイクアウト', mood: '不安' },
    { id: '3', symbol: 'USD/JPY', side: 'LONG', pnl: 700, date: `${year}-${pad(month)}-05`, time: '09:00', logic: '日銀決定会合後の押し目買い。', status: 'WIN', strategy: '順張り', mood: '冷静' },
    { id: '4', symbol: 'XAU/USD', side: 'SHORT', pnl: 200, date: `${year}-${pad(month)}-08`, time: '22:00', logic: 'ダブルトップ形成。ネックライン割れでエントリー。', status: 'WIN', strategy: 'レンジ', mood: '普通' },
    { id: '5', symbol: 'NASDAQ', side: 'LONG', pnl: -100, date: `${year}-${pad(month)}-12`, time: '23:30', logic: '雇用統計発表での乱高下に巻き込まれる。', status: 'LOSS', strategy: 'スキャルピング', mood: '飛び乗り (FOMO)' },
    { id: '6', symbol: 'BTC/USD', side: 'SHORT', pnl: -150, date: `${prevYear}-${pad(prevMonth)}-15`, time: '14:00', logic: '抵抗帯での戻り売り失敗。', status: 'LOSS', strategy: '順張り', mood: '普通' },
    { id: '7', symbol: 'ETH/USD', side: 'LONG', pnl: 450, date: `${year}-${pad(month)}-15`, time: '17:30', logic: 'トレンド転換初動。', status: 'WIN', strategy: '順張り', mood: '自信あり' },
  ];
};

const MOCK_TRADES = generateMockTrades();

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] ${className}`}>
    {children}
  </div>
);

const NeonButton = ({ onClick, variant = 'primary', children, icon: Icon, className = "", type, disabled }: any) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-bold transition-all duration-300 tracking-wider transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(8,145,178,0.7)] border border-cyan-400/30",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)] hover:shadow-[0_0_25px_rgba(225,29,72,0.7)] border border-rose-400/30",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)] border border-emerald-400/30",
  };

  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className={`mr-2 ${disabled && Icon === Loader2 ? 'animate-spin' : ''}`} />}
      {children}
    </button>
  );
};

const DualText = ({ jp, en, className = "", size = "normal" }: { jp: string, en: string, className?: string, size?: "small" | "normal" | "large" }) => (
  <div className={`flex flex-col leading-none ${className}`}>
    <span className={`${size === 'large' ? 'text-lg' : size === 'small' ? 'text-xs' : 'text-sm'} font-bold tracking-wide text-white`}>{jp}</span>
    <span className={`${size === 'large' ? 'text-xs' : 'text-[9px]'} text-slate-300 uppercase tracking-widest font-bold mt-0.5`}>{en}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, jp, en }: { icon: any, jp: string, en: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
    <Icon size={18} className="text-cyan-500" />
    <DualText jp={jp} en={en} />
  </div>
);

// --- Main Application ---

export default function TradeGamingApp() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [view, setView] = useState<'dashboard' | 'journal' | 'add' | 'calendar'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dashboardPeriod, setDashboardPeriod] = useState<'ALL' | 'YEAR' | 'MONTH'>('ALL');
  const [isMobile, setIsMobile] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(150);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 初期化: ユーザーID取得とデータ読み込み
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ユーザーID取得
        const currentUserId = await getCurrentUserId();
        setUserId(currentUserId);
        
        // トレードデータ取得
        const tradesData = await fetchTrades(currentUserId);
        setTrades(tradesData);
        
        // 為替レート取得
        try {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const data = await res.json();
          if (data && data.rates && data.rates.JPY) {
            setExchangeRate(data.rates.JPY);
          }
        } catch (e) {
          console.error("Failed to fetch rate, using default.", e);
        }
      } catch (err: any) {
        console.error('初期化エラー:', err);
        setError(err.message || 'データの読み込みに失敗しました');
        // エラー時はモックデータを使用（開発用）
        if (import.meta.env.DEV) {
          setTrades(MOCK_TRADES);
        }
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Filter Logic ---
  const filteredDashboardTrades = useMemo(() => {
    const now = new Date();
    return trades.filter(t => {
      const tradeDate = new Date(t.date);
      if (dashboardPeriod === 'ALL') return true;
      if (dashboardPeriod === 'YEAR') return tradeDate.getFullYear() === now.getFullYear();
      if (dashboardPeriod === 'MONTH') return tradeDate.getFullYear() === now.getFullYear() && tradeDate.getMonth() === now.getMonth();
      return true;
    });
  }, [trades, dashboardPeriod]);

  // --- Advanced Stats Calculation ---
  const stats = useMemo(() => {
    const dataset = filteredDashboardTrades;
    const totalTrades = dataset.length;
    const wins = dataset.filter(t => t.pnl > 0).length;
    const losses = dataset.filter(t => t.pnl <= 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnL = dataset.reduce((acc, t) => acc + t.pnl, 0);
    const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const grossProfit = dataset.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(dataset.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;

    let currentStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    const sortedTrades = [...dataset].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedTrades.forEach(t => {
      if (t.pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        currentStreak = tempWinStreak;
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        currentStreak = -tempLossStreak;
      }
    });

    return { 
      totalTrades, wins, losses, winRate, totalPnL, averagePnL, profitFactor,
      grossProfit, grossLoss, avgWin, avgLoss, currentStreak
    };
  }, [filteredDashboardTrades]);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
    const sorted = [...filteredDashboardTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    let maxCumulative = 0;
    let maxDrawdown = 0;

    const equityCurve = sorted.map(t => {
      cumulative += t.pnl;
      if (cumulative > maxCumulative) maxCumulative = cumulative;
      const drawdown = maxCumulative - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      return {
        date: t.date,
        pnl: t.pnl,
        total: cumulative,
        drawdown: -drawdown
      };
    });

    return { equityCurve, maxDrawdown };
  }, [filteredDashboardTrades]);

  // --- Periodic Analysis Data ---
  const monthlyPnLData = useMemo(() => {
    const year = new Date().getFullYear();
    const months = Array.from({length: 12}, (_, i) => ({
      name: `${i+1}月`,
      pnl: 0
    }));
    
    trades.filter(t => new Date(t.date).getFullYear() === year).forEach(t => {
      const m = new Date(t.date).getMonth();
      months[m].pnl += t.pnl;
    });
    return months;
  }, [trades]);

  const dailyPnLData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({length: daysInMonth}, (_, i) => ({
      name: `${i+1}`, 
      dayStr: `${month + 1}/${i+1}`,
      pnl: 0
    }));

    trades.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).forEach(t => {
      const d = new Date(t.date).getDate();
      days[d-1].pnl += t.pnl;
    });
    return days;
  }, [trades]);

  // --- Categorical Analysis Helper ---
  const analyzeCategory = (key: keyof Trade, dataset = filteredDashboardTrades) => {
    const counts: Record<string, { pnl: number, count: number, wins: number }> = {};
    dataset.forEach(t => {
      const val = String(t[key]);
      if (!counts[val]) counts[val] = { pnl: 0, count: 0, wins: 0 };
      counts[val].pnl += t.pnl;
      counts[val].count += 1;
      if (t.pnl > 0) counts[val].wins += 1;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      pnl: data.pnl,
      count: data.count,
      winRate: (data.wins / data.count) * 100
    })).sort((a, b) => b.pnl - a.pnl);
  };

  const symbolData = useMemo(() => analyzeCategory('symbol'), [filteredDashboardTrades]);
  const strategyData = useMemo(() => analyzeCategory('strategy'), [filteredDashboardTrades]);
  
  const sessionData = useMemo(() => {
    const counts: Record<string, { pnl: number, count: number, wins: number }> = {
      'Asian': { pnl: 0, count: 0, wins: 0 },
      'London': { pnl: 0, count: 0, wins: 0 },
      'New York': { pnl: 0, count: 0, wins: 0 },
    };

    filteredDashboardTrades.forEach(t => {
      const hour = parseInt(t.time.split(':')[0], 10);
      let session = 'Asian';
      if (hour >= 8 && hour < 15) session = 'Asian';
      else if (hour >= 15 && hour < 21) session = 'London';
      else session = 'New York';

      counts[session].pnl += t.pnl;
      counts[session].count += 1;
      if (t.pnl > 0) counts[session].wins += 1;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      pnl: data.pnl,
      count: data.count,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0
    }));
  }, [filteredDashboardTrades]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(h => ({ hour: h, wins: 0, total: 0 }));

    filteredDashboardTrades.forEach(t => {
      const hour = parseInt(t.time.split(':')[0], 10);
      if (!isNaN(hour)) {
        data[hour].total += 1;
        if (t.pnl > 0) data[hour].wins += 1;
      }
    });

    return data.map(d => ({
      hour: `${d.hour}:00`,
      winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
      count: d.total
    }));
  }, [filteredDashboardTrades]);


  const formatMoney = (usd: number, large = false) => {
    const jpy = Math.floor(usd * exchangeRate);
    const colorClass = usd > 0 ? 'text-emerald-400' : usd < 0 ? 'text-rose-400' : 'text-slate-200';
    const shadowClass = usd > 0 ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : usd < 0 ? 'drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' : '';
    
    return (
      <div className={`flex flex-col ${large ? 'items-start' : 'items-end'}`}>
        <span className={`${large ? 'text-2xl md:text-3xl' : 'text-xl'} font-black ${colorClass} ${shadowClass}`}>
          {usd > 0 ? '+' : ''}{usd.toLocaleString()} <span className="text-xs text-slate-400">USD</span>
        </span>
        <span className="text-xs text-slate-400 font-mono">
          ≈ {jpy.toLocaleString()} JPY
        </span>
      </div>
    );
  };

  const AddTradeForm = () => {
    const [formData, setFormData] = useState({
      symbol: 'BTC/USD',
      customSymbol: '',
      side: 'LONG',
      pnl: '', 
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      logic: '',
      strategy: '順張り',
      mood: '冷静',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successPnl, setSuccessPnl] = useState<number>(0);

    const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!userId) {
        setSubmitError('ユーザーIDが取得できませんでした');
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      
      try {
        const finalSymbol = formData.symbol === 'Other' ? formData.customSymbol.toUpperCase() : formData.symbol;
        const pnlVal = parseFloat(formData.pnl);

        // 画像をS3にアップロード
        let imageUrl: string | undefined = undefined;
        if (imageFile) {
          try {
            imageUrl = await uploadImageToS3(imageFile, userId);
          } catch (err: any) {
            console.error('画像アップロードエラー:', err);
            // S3アップロードが失敗しても続行（オプショナル）
            if (import.meta.env.VITE_REQUIRE_IMAGE_UPLOAD === 'true') {
              throw new Error('画像のアップロードに失敗しました: ' + (err.message || 'Unknown error'));
            }
          }
        }

        // Supabaseに保存
        const newTrade = await createTrade(userId, {
          symbol: finalSymbol,
          side: formData.side as 'LONG' | 'SHORT',
          pnl: pnlVal,
          date: formData.date,
          time: formData.time,
          logic: formData.logic,
          strategy: formData.strategy,
          mood: formData.mood,
          imageUrl: imageUrl,
          status: pnlVal > 0 ? 'WIN' : pnlVal < 0 ? 'LOSS' : 'BE'
        });

        // ローカル状態を更新
        setTrades([newTrade, ...trades]);
        
        // 成功アニメーションを表示
        setSuccessPnl(pnlVal);
        setShowSuccess(true);
        
        // 2秒後にジャーナルに遷移
        setTimeout(() => {
          setView('journal');
          setShowSuccess(false);
        }, 2000);
        
        // フォームをリセット
        setFormData({
          symbol: 'BTC/USD',
          customSymbol: '',
          side: 'LONG',
          pnl: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          logic: '',
          strategy: '順張り',
          mood: '冷静',
        });
        setImagePreview(null);
        setImageFile(null);
      } catch (err: any) {
        console.error('トレード保存エラー:', err);
        setSubmitError(err.message || 'トレードの保存に失敗しました');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <Crosshair className="text-cyan-400 animate-pulse" />
             <DualText jp="新規トレード登録" en="NEW ENTRY" className="text-cyan-400" />
           </div>
           <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DualText jp="通貨ペア" en="SYMBOL" />
              <select name="symbol" value={formData.symbol} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500 appearance-none">
                {SYMBOL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {formData.symbol === 'Other' && (
                <input required name="customSymbol" value={formData.customSymbol} onChange={handleInputChange} placeholder="Ex: NVDA" className="w-full mt-2 bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500 placeholder:text-slate-600" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <DualText jp="日付" en="DATE" />
                <input type="date" required name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500" />
              </div>
              <div className="space-y-2">
                <DualText jp="時刻" en="TIME" />
                <input type="time" required name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <DualText jp="売買" en="SIDE" />
            <div className="flex gap-4">
              <button type="button" onClick={() => setFormData({...formData, side: 'LONG'})} className={`flex-1 py-3 rounded font-bold transition-all ${formData.side === 'LONG' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500'}`}>LONG</button>
              <button type="button" onClick={() => setFormData({...formData, side: 'SHORT'})} className={`flex-1 py-3 rounded font-bold transition-all ${formData.side === 'SHORT' ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-slate-800 text-slate-500'}`}>SHORT</button>
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 animate-pulse"></div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <DollarSign size={18} className="text-emerald-400 animate-bounce"/>
                 <DualText jp="確定損益" en="REALIZED PnL" className="text-emerald-400" />
              </div>
              <input 
                type="number" 
                step="any" 
                required 
                name="pnl" 
                value={formData.pnl} 
                onChange={(e) => {
                  handleInputChange(e);
                  // リアルタイムで色を変更
                  const val = parseFloat(e.target.value);
                  if (val > 0) {
                    e.target.className = e.target.className.replace(/border-\w+-\d+\/50/g, 'border-emerald-500/50');
                  } else if (val < 0) {
                    e.target.className = e.target.className.replace(/border-\w+-\d+\/50/g, 'border-rose-500/50');
                  }
                }}
                placeholder="例: 500 または -200" 
                className="w-full bg-slate-950 border-2 border-emerald-500/50 rounded-lg p-4 text-2xl font-black text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 placeholder:text-slate-600 transition-all duration-300" 
              />
              {formData.pnl && (
                <div className={`text-sm font-bold mt-1 ${parseFloat(formData.pnl) > 0 ? 'text-emerald-400' : parseFloat(formData.pnl) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {parseFloat(formData.pnl) > 0 ? '💰 利益確定！' : parseFloat(formData.pnl) < 0 ? '⚠️ 損失' : ''}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Target size={16} className="text-violet-500 animate-pulse"/>
                 <DualText jp="戦略" en="STRATEGY" />
               </div>
               <select name="strategy" value={formData.strategy} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all">
                 {STRATEGY_DEF.map(opt => <option key={opt.val} value={opt.jp}>{opt.jp} ({opt.en})</option>)}
               </select>
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Smile size={16} className="text-yellow-500 animate-pulse"/>
                 <DualText jp="メンタル" en="MOOD" />
               </div>
               <select name="mood" value={formData.mood} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all">
                 {MOOD_DEF.map(opt => <option key={opt.val} value={opt.jp}>{opt.jp} ({opt.en})</option>)}
               </select>
            </div>
          </div>

          <div className="space-y-2">
            <DualText jp="根拠・メモ" en="LOGIC & NOTES" />
            <textarea name="logic" value={formData.logic} onChange={handleInputChange} rows={3} placeholder="エントリーの根拠や反省点など" className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:border-cyan-500 resize-none placeholder:text-slate-600" />
          </div>

          <div className="space-y-2">
            <DualText jp="チャート画像 (証拠)" en="EVIDENCE" />
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center hover:border-cyan-500 transition-colors bg-slate-900/50 cursor-pointer relative overflow-hidden group">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-40 object-cover rounded shadow-lg" />
              ) : (
                <>
                  <ImageIcon className="text-slate-500 mb-2 group-hover:text-cyan-400" size={32} />
                  <span className="text-sm text-slate-400 group-hover:text-cyan-300">Click to upload chart</span>
                </>
              )}
            </div>
          </div>

          {submitError && (
            <div className="bg-rose-900/50 border border-rose-700 rounded-lg p-3 text-rose-300 text-sm animate-shake">
              {submitError}
            </div>
          )}
          
          <NeonButton 
            type="submit" 
            className="w-full py-4 text-lg relative overflow-hidden group" 
            icon={submitting ? Loader2 : Save}
            disabled={submitting}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/50 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
             <span className="flex flex-col leading-none items-center relative z-10">
               <span>{submitting ? '保存中...' : '保存'}</span>
               <span className="text-[10px] opacity-70 mt-1">{submitting ? 'SAVING...' : 'SAVE TRADE'}</span>
             </span>
          </NeonButton>
        </form>

        {/* 成功アニメーション */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative">
              {/* パーティクルエフェクト */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${
                      successPnl > 0 ? 'bg-emerald-400' : 'bg-rose-400'
                    } animate-ping`}
                    style={{
                      left: `${50 + Math.cos((i * 360) / 20) * 100}%`,
                      top: `${50 + Math.sin((i * 360) / 20) * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
              
              {/* メインコンテンツ */}
              <div className={`relative bg-gradient-to-br ${
                successPnl > 0 
                  ? 'from-emerald-900/90 to-emerald-800/90 border-emerald-500' 
                  : successPnl < 0
                  ? 'from-rose-900/90 to-rose-800/90 border-rose-500'
                  : 'from-slate-900/90 to-slate-800/90 border-slate-500'
              } border-2 rounded-2xl p-8 shadow-2xl transform scale-0 animate-in zoom-in duration-500`}>
                <div className="text-center">
                  {successPnl > 0 ? (
                    <>
                      <div className="mb-4 animate-bounce">
                        <Trophy className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                      </div>
                      <h2 className="text-4xl font-black text-emerald-400 mb-2 animate-pulse">
                        WIN! 🎉
                      </h2>
                      <p className="text-2xl font-bold text-white mb-4">
                        +{successPnl.toLocaleString()} USD
                      </p>
                      <div className="flex items-center justify-center gap-2 text-emerald-300">
                        <Sparkles className="animate-spin" size={20} />
                        <span className="text-sm">素晴らしいトレード！</span>
                        <Sparkles className="animate-spin" size={20} />
                      </div>
                    </>
                  ) : successPnl < 0 ? (
                    <>
                      <div className="mb-4">
                        <AlertTriangle className="w-20 h-20 text-rose-400 mx-auto animate-pulse" />
                      </div>
                      <h2 className="text-4xl font-black text-rose-400 mb-2">
                        LOSS
                      </h2>
                      <p className="text-2xl font-bold text-white mb-4">
                        {successPnl.toLocaleString()} USD
                      </p>
                      <p className="text-sm text-rose-300">
                        次は頑張ろう！
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <Zap className="w-20 h-20 text-slate-400 mx-auto" />
                      </div>
                      <h2 className="text-4xl font-black text-slate-400 mb-2">
                        BE
                      </h2>
                      <p className="text-sm text-slate-300">
                        損益なし
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Dashboard = () => {
    // モチベーション要素の計算
    const winStreak = stats.currentStreak > 0 ? stats.currentStreak : 0;
    const totalWins = stats.wins;
    const milestone = totalWins >= 10 && totalWins < 50 ? 10 : totalWins >= 50 && totalWins < 100 ? 50 : totalWins >= 100 ? 100 : 0;
    
    return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* モチベーションセクション */}
      {winStreak >= 3 && (
        <Card className="p-6 bg-gradient-to-r from-emerald-900/50 via-yellow-900/30 to-emerald-900/50 border-2 border-emerald-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Flame className="w-12 h-12 text-yellow-400 animate-bounce" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" />
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-400 mb-1 animate-pulse">
                  🔥 {winStreak}連勝中！
                </div>
                <div className="text-sm text-slate-300">
                  素晴らしいパフォーマンス！この調子で続けよう！
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400 animate-float" />
              <span className="text-2xl font-black text-yellow-400">{winStreak}</span>
            </div>
          </div>
        </Card>
      )}

      {milestone > 0 && (
        <Card className="p-4 bg-gradient-to-r from-cyan-900/50 to-violet-900/50 border-2 border-cyan-500/50">
          <div className="flex items-center gap-3">
            <Star className="w-10 h-10 text-yellow-400 animate-spin" />
            <div>
              <div className="text-lg font-black text-cyan-400">
                🎉 達成！{milestone}勝達成！
              </div>
              <div className="text-xs text-slate-300">
                次の目標: {milestone === 10 ? '50勝' : milestone === 50 ? '100勝' : '200勝'}を目指そう！
              </div>
            </div>
          </div>
        </Card>
      )}

      {stats.totalPnL > 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
              <span className="text-sm text-slate-300">累計利益</span>
            </div>
            <span className="text-xl font-black text-emerald-400 animate-glow">
              +{stats.totalPnL.toLocaleString()} USD
            </span>
          </div>
        </Card>
      )}
      
      {/* --- Filter Controls --- */}
      <div className="flex justify-end gap-2">
        {(['ALL', 'YEAR', 'MONTH'] as const).map((period) => (
          <button 
            key={period}
            onClick={() => setDashboardPeriod(period)}
            className={`px-4 py-1 rounded text-xs font-bold tracking-wider transition-all border ${
              dashboardPeriod === period 
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            {period === 'ALL' && '全期間'}
            {period === 'YEAR' && '年間'}
            {period === 'MONTH' && '月間'}
          </button>
        ))}
      </div>

      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Net Profit */}
        <Card className={`p-3 col-span-2 relative overflow-hidden group border-l-4 ${
          stats.totalPnL > 0 ? 'border-l-emerald-500' : 'border-l-cyan-500'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
          <DualText jp="純利益" en="NET PROFIT" className="text-slate-300 relative z-10" />
          <div className="mt-2 relative z-10">
             {formatMoney(stats.totalPnL, true)}
          </div>
          {stats.totalPnL > 1000 && (
            <div className="absolute top-2 right-2">
              <Trophy className="w-6 h-6 text-yellow-400 animate-float" />
            </div>
          )}
        </Card>

        {/* Win Rate */}
        <Card className="p-3 relative overflow-hidden border-l-4 border-l-cyan-500">
          <DualText jp="勝率" en="WIN RATE" className="text-slate-300" />
          <span className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] mt-1 block">
            {stats.winRate.toFixed(1)}%
          </span>
        </Card>

        {/* Profit Factor */}
        <Card className="p-3 relative overflow-hidden border-l-4 border-l-violet-500">
          <DualText jp="PF" en="PROFIT FACTOR" className="text-slate-300" />
          <span className="text-2xl font-black text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)] mt-1 block">
            {stats.profitFactor.toFixed(2)}
          </span>
        </Card>


        {/* Streak */}
        <Card className={`p-3 relative overflow-hidden border-l-4 ${
          stats.currentStreak >= 3 ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-900/20 to-transparent' : 
          stats.currentStreak >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'
        }`}>
          <DualText jp="現在の連勝/連敗" en="CURRENT STREAK" className="text-slate-300" />
          <div className="flex items-center gap-2 mt-1">
            {stats.currentStreak >= 3 && <Flame className="w-5 h-5 text-yellow-400 animate-pulse" />}
            <span className={`text-2xl font-black block ${
              stats.currentStreak >= 3 ? 'text-yellow-400 animate-pulse' :
              stats.currentStreak >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.currentStreak >= 0 ? `+${stats.currentStreak} WIN` : `${stats.currentStreak} LOSS`}
            </span>
          </div>
        </Card>
      </div>

      {/* 2. MAIN CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-96">
        <Card className="p-4 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <SectionHeader icon={TrendingUp} jp="資産推移" en="EQUITY CURVE" />
             <div className="text-right">
                <DualText jp="最大ドローダウン" en="MAX DRAWDOWN" size="small" className="text-slate-400" />
                <span className="text-rose-400 font-bold">-${chartData.maxDrawdown.toLocaleString()}</span>
             </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.equityCurve}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke={TEXT_COLOR} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={TEXT_COLOR} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorPnL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 flex flex-col">
          <SectionHeader icon={Target} jp="戦略別勝率バランス" en="STRATEGY RADAR" />
          <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={strategyData.map(d => ({ ...d, fullMark: 100 }))}>
                 <PolarGrid stroke="#334155" />
                 <PolarAngleAxis dataKey="name" tick={{ fill: TEXT_COLOR, fontSize: 10 }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                 <Radar name="Win Rate" dataKey="winRate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
               </RadarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 3. PERIODIC ANALYSIS (NEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly PnL (Jan-Dec) */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <CalendarDays size={18} className="text-cyan-500" />
            <DualText jp="月別損益 (年間)" en="MONTHLY PnL (JAN-DEC)" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={monthlyPnLData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" tick={{fill: TEXT_COLOR, fontSize: 10}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="pnl" name="PnL">
                     {monthlyPnLData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? WIN_COLOR : LOSS_COLOR} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily PnL (Current Month) */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
             <Calendar size={18} className="text-cyan-500" />
             <DualText jp="日別損益 (当月)" en="DAILY PnL (THIS MONTH)" />
          </div>
          <div className="h-56">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dailyPnLData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" tick={{fill: TEXT_COLOR, fontSize: 10}} interval={2} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.dayStr || label} />
                  <Bar dataKey="pnl" name="PnL">
                     {dailyPnLData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? WIN_COLOR : LOSS_COLOR} />
                     ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4. TIME & SESSION ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
             <SectionHeader icon={Globe} jp="リージョン別成績 (Asian/London/NY)" en="SESSION PERFORMANCE" />
             <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={sessionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" tick={{fill: TEXT_COLOR, fontSize: 12}} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
                      <Legend wrapperStyle={{fontSize: '10px', color: TEXT_COLOR }}/>
                      <Bar dataKey="winRate" name="Win Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          <Card className="p-4">
             <SectionHeader icon={Activity} jp="時間帯別勝率 (0:00 - 23:00)" en="HOURLY WIN RATE" />
             <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="hour" tick={{fill: TEXT_COLOR, fontSize: 10}} interval={3} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
                      <Area type="monotone" dataKey="winRate" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </Card>
      </div>

      {/* 5. SYMBOL ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <SectionHeader icon={PieIcon} jp="通貨ペア別比率" en="SYMBOL DISTRIBUTION" />
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={symbolData} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="count">
                   {symbolData.map((_entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
                 <Legend wrapperStyle={{ fontSize: '10px', color: TEXT_COLOR }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
           <SectionHeader icon={BarChart2} jp="通貨ペア別損益" en="SYMBOL PnL" />
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={symbolData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" tick={{fill: TEXT_COLOR, fontSize: 10}} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#e2e8f0' }} />
                    <Bar dataKey="pnl">
                       {symbolData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? WIN_COLOR : LOSS_COLOR} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>
    </div>
    );
  };

  const Journal = () => {
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSymbol, setFilterSymbol] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSide, setFilterSide] = useState('All');

    const filteredTrades = trades
      .filter(t => {
        // Text Search (Logic, Symbol, ID)
        const matchText = 
          t.logic.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.strategy.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Dropdown Filters
        const matchSymbol = filterSymbol === 'All' || t.symbol === filterSymbol;
        const matchStatus = filterStatus === 'All' || t.status === filterStatus;
        const matchSide = filterSide === 'All' || t.side === filterSide;

        return matchText && matchSymbol && matchStatus && matchSide;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get unique symbols for filter
    const availableSymbols = Array.from(new Set(trades.map(t => t.symbol)));

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        
        {/* Filters Header */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
           <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-cyan-500"/>
                <DualText jp="トレード履歴検索" en="SEARCH & FILTER" className="text-slate-200" />
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="根拠や通貨ペアで検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-cyan-500 placeholder:text-slate-600"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <select value={filterSymbol} onChange={(e) => setFilterSymbol(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-300 focus:border-cyan-500">
                <option value="All">全ての通貨ペア</option>
                {availableSymbols.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSide} onChange={(e) => setFilterSide(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-300 focus:border-cyan-500">
                <option value="All">全ての売買</option>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-300 focus:border-cyan-500">
                <option value="All">全ての勝敗</option>
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
              </select>
              <button onClick={() => {setSearchTerm(''); setFilterSymbol('All'); setFilterStatus('All'); setFilterSide('All')}} className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 border border-slate-800 rounded hover:bg-slate-800 transition-colors">
                <X size={12} /> 条件クリア
              </button>
           </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredTrades.length === 0 ? (
             <div className="text-center py-12 text-slate-500">
               <Search size={48} className="mx-auto mb-4 opacity-20" />
               <p>条件に一致するトレードが見つかりません。</p>
             </div>
          ) : (
             filteredTrades.map((trade) => (
              <Card key={trade.id} className="p-0 overflow-hidden hover:border-slate-500 transition-colors group">
                <div className="flex flex-col md:flex-row">
                  {/* Left Stripe Indicator */}
                  <div className={`h-2 md:h-auto md:w-2 ${trade.pnl > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-white tracking-wider">{trade.symbol}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${trade.side === 'LONG' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-rose-900/50 text-rose-400 border border-rose-800'}`}>
                            {trade.side}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-400 border border-slate-800 px-2 py-0.5 rounded bg-slate-900">{trade.strategy}</span>
                          <span className="text-xs text-slate-400 border border-slate-800 px-2 py-0.5 rounded bg-slate-900">{trade.mood}</span>
                          {trade.pnl > 0 && (
                            <span className="text-xs text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded bg-emerald-900/30 animate-pulse">
                              <Trophy size={12} className="inline mr-1" />
                              WIN
                            </span>
                          )}
                          {trade.pnl < 0 && (
                            <span className="text-xs text-rose-400 border border-rose-800 px-2 py-0.5 rounded bg-rose-900/30">
                              LOSS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {formatMoney(trade.pnl)}
                        <span className="text-xs text-slate-500 block">{trade.date} {trade.time}</span>
                      </div>
                    </div>

                    {/* Logic Section */}
                    <div className="bg-slate-950/50 rounded p-3 mt-3 border border-slate-800/50">
                      <p className="text-sm text-slate-300 italic">
                        <span className="text-cyan-500 font-bold not-italic mr-2 text-xs">LOGIC:</span>
                        {trade.logic}
                      </p>
                    </div>
                    
                    {/* Image Preview if exists */}
                    {trade.imageUrl && (
                      <div className="mt-3 relative group/image overflow-hidden rounded-lg border border-slate-800 h-32 md:h-48 w-full cursor-pointer">
                        <img src={trade.imageUrl} alt="Chart" className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110 opacity-70 group-hover/image:opacity-100" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/40">
                            <ImageIcon className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);

    // ローカル時間で日付文字列を生成する関数（YYYY-MM-DD形式）
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 日別損益データの集計
    const dailyPnL = useMemo(() => {
      const dailyData: Record<string, number> = {};
      trades.forEach(trade => {
        const dateKey = trade.date;
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = 0;
        }
        dailyData[dateKey] += trade.pnl;
      });
      return dailyData;
    }, [trades]);

    // カレンダーの日付を生成
    const calendarDays = useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // 月の最初の日と最後の日
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // 最初の日の曜日（0=日曜日）
      const startDayOfWeek = firstDay.getDay();
      
      // カレンダーに表示する日付の配列
      const days: Array<{ date: Date; isCurrentMonth: boolean; pnl: number | null; tradeCount: number }> = [];
      
      // 前月の日付を追加
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i);
        const dateKey = formatDateLocal(date);
        days.push({
          date,
          isCurrentMonth: false,
          pnl: dailyPnL[dateKey] ?? null,
          tradeCount: trades.filter(t => t.date === dateKey).length
        });
      }
      
      // 今月の日付を追加
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateLocal(date);
        days.push({
          date,
          isCurrentMonth: true,
          pnl: dailyPnL[dateKey] ?? null,
          tradeCount: trades.filter(t => t.date === dateKey).length
        });
      }
      
      // 次月の日付を追加（カレンダーを埋めるため）
      const remainingDays = 42 - days.length; // 6週間分
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        const dateKey = formatDateLocal(date);
        days.push({
          date,
          isCurrentMonth: false,
          pnl: dailyPnL[dateKey] ?? null,
          tradeCount: trades.filter(t => t.date === dateKey).length
        });
      }
      
      return days;
    }, [currentMonth, dailyPnL, trades]);

    const handleDayClick = (date: Date) => {
      const dateKey = formatDateLocal(date);
      const dayTrades = trades.filter(t => t.date === dateKey);
      setSelectedDayTrades(dayTrades);
      setSelectedDate(dateKey);
      
      // ユーザーが「今日に戻る」ボタンを押すまで、現在の月を維持
      // 前月/次月の日付をクリックしても、その月には自動移動しない
    };

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      setSelectedDate(null);
      setSelectedDayTrades([]);
    };

    const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      setSelectedDate(null);
      setSelectedDayTrades([]);
    };

    const goToToday = () => {
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setSelectedDate(null);
      setSelectedDayTrades([]);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* カレンダーヘッダー */}
        <Card className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={prevMonth}
                className="p-1.5 md:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              </button>
              <h2 className="text-lg md:text-2xl font-black text-white">
                {currentMonth.getFullYear()}年{monthNames[currentMonth.getMonth()]}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 md:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              </button>
            </div>
            <NeonButton onClick={goToToday} variant="ghost" className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
              <span className="hidden md:inline">今日に戻る</span>
              <span className="md:hidden">今日</span>
            </NeonButton>
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* 曜日ヘッダー */}
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`text-center font-bold text-xs md:text-sm py-1 md:py-2 ${
                  index === 0 ? 'text-rose-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}

            {/* 日付セル */}
            {calendarDays.map((day, index) => {
              const dateKey = formatDateLocal(day.date);
              const todayKey = formatDateLocal(new Date());
              const isToday = dateKey === todayKey;
              const isSelected = selectedDate === dateKey;
              const hasTrades = day.tradeCount > 0;
              
              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    relative p-1 md:p-2 rounded md:rounded-lg border md:border-2 transition-all duration-200 min-h-[3rem] md:min-h-0
                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'border-cyan-500 bg-cyan-900/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-800 bg-slate-900/50'}
                    ${isSelected ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105' : 'hover:border-slate-600 hover:bg-slate-800/50'}
                    ${hasTrades ? 'ring-1 md:ring-2 ring-offset-1 md:ring-offset-2 ring-offset-[#050b14]' : ''}
                    ${day.pnl !== null && day.pnl > 0 ? 'ring-emerald-500/50' : day.pnl !== null && day.pnl < 0 ? 'ring-rose-500/50' : 'ring-slate-600/50'}
                  `}
                >
                  {/* 日付番号 */}
                  <div className={`text-xs md:text-sm font-bold mb-0.5 md:mb-1 ${
                    isToday ? 'text-cyan-400' : day.isCurrentMonth ? 'text-white' : 'text-slate-600'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {/* 損益表示 */}
                  {day.pnl !== null && (
                    <div className={`text-[10px] md:text-xs font-black leading-tight ${
                      day.pnl > 0 
                        ? 'text-emerald-400' 
                        : day.pnl < 0 
                        ? 'text-rose-400' 
                        : 'text-slate-500'
                    }`}>
                      {day.pnl > 0 ? '+' : ''}{day.pnl.toLocaleString()}
                    </div>
                  )}

                  {/* トレード数バッジ */}
                  {hasTrades && (
                    <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                      <span className="text-[7px] md:text-[8px] font-black text-white">{day.tradeCount}</span>
                    </div>
                  )}

                  {/* 今日のマーカー */}
                  {isToday && (
                    <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-2 h-2 md:w-3 md:h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* 選択した日のトレード一覧 */}
        {selectedDate && (
          <Card className="p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 flex-shrink-0" />
                <h3 className="text-base md:text-xl font-black text-white truncate">
                  {(() => {
                    const [, month, day] = selectedDate.split('-').map(Number);
                    return `${month}月${day}日のトレード`;
                  })()}
                </h3>
                {dailyPnL[selectedDate] !== undefined && (
                  <span className={`text-lg font-black px-3 py-1 rounded ${
                    dailyPnL[selectedDate]! > 0
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                      : dailyPnL[selectedDate]! < 0
                      ? 'bg-rose-900/50 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {dailyPnL[selectedDate]! > 0 ? '+' : ''}{dailyPnL[selectedDate]!.toLocaleString()} USD
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDayTrades([]);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-rose-500 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {selectedDayTrades.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>この日のトレードはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-lg text-white">{trade.symbol}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            trade.side === 'LONG' 
                              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' 
                              : 'bg-rose-900/50 text-rose-400 border border-rose-800'
                          }`}>
                            {trade.side}
                          </span>
                          <span className="text-xs text-slate-400 border border-slate-800 px-2 py-0.5 rounded bg-slate-900">
                            {trade.strategy}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 italic mb-2">
                          <span className="text-cyan-500 font-bold not-italic mr-2">LOGIC:</span>
                          {trade.logic}
                        </p>
                        <div className="text-xs text-slate-500">{trade.time}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${
                          trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {formatMoney(trade.pnl)}
                        </div>
                        {trade.pnl > 0 && (
                          <Trophy className="w-4 h-4 text-yellow-400 mx-auto mt-1" />
                        )}
                      </div>
                    </div>
                    {trade.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-800 h-32">
                        <img src={trade.imageUrl} alt="Chart" className="w-full h-full object-cover opacity-70" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#050b14]/80 backdrop-blur-xl border-b border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Activity className="text-white" size={20} />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-white">
            NEON<span className="text-cyan-400">TRADE</span> <span className="text-xs font-normal text-slate-500 border border-slate-700 px-1 rounded ml-1">HUD v2.5</span>
          </h1>
        </div>
        
        {!isMobile && (
          <div className="flex gap-4">
             <button onClick={() => setView('dashboard')} className={`text-sm font-bold tracking-wider px-4 py-2 rounded hover:text-cyan-400 transition-colors ${view === 'dashboard' ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400'}`}>
                <DualText jp="分析" en="ANALYTICS" />
             </button>
             <button onClick={() => setView('journal')} className={`text-sm font-bold tracking-wider px-4 py-2 rounded hover:text-cyan-400 transition-colors ${view === 'journal' ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400'}`}>
                <DualText jp="履歴" en="HISTORY" />
             </button>
             <button onClick={() => setView('calendar')} className={`text-sm font-bold tracking-wider px-4 py-2 rounded hover:text-cyan-400 transition-colors ${view === 'calendar' ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400'}`}>
                <DualText jp="カレンダー" en="CALENDAR" />
             </button>
          </div>
        )}

        <NeonButton onClick={() => setView('add')} icon={Plus} className="hidden md:flex">
           <DualText jp="トレード登録" en="LOG TRADE" />
        </NeonButton>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-4 md:p-6 max-w-[1600px] mx-auto pb-24 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">データを読み込み中...</p>
            </div>
          </div>
        ) : error ? (
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
        ) : (
          <>
            {view === 'dashboard' && <Dashboard />}
            {view === 'journal' && <Journal />}
            {view === 'add' && <AddTradeForm />}
            {view === 'calendar' && <CalendarView />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050b14]/90 backdrop-blur-xl border-t border-slate-800 p-2 z-50">
        <div className="flex justify-around items-center">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 py-2 flex-1 ${view === 'dashboard' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[8px] font-bold">分析</span>
          </button>
          
          <button onClick={() => setView('calendar')} className={`flex flex-col items-center gap-1 py-2 flex-1 ${view === 'calendar' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Calendar size={20} />
            <span className="text-[8px] font-bold">カレンダー</span>
          </button>
          
          <button 
            onClick={() => setView('add')}
            className={`flex flex-col items-center gap-1 py-2 flex-1 ${view === 'add' ? 'text-cyan-400' : 'text-slate-500'}`}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Plus size={20} />
            </div>
            <span className="text-[8px] font-bold">新規</span>
          </button>

          <button onClick={() => setView('journal')} className={`flex flex-col items-center gap-1 py-2 flex-1 ${view === 'journal' ? 'text-cyan-400' : 'text-slate-500'}`}>
            <History size={20} />
            <span className="text-[8px] font-bold">履歴</span>
          </button>
        </div>
      </div>
    </div>
    );
  };

