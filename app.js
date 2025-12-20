// Default configuration
const defaultConfig = {
  dashboard_title: 'FX収支ダッシュボード',
  monthly_target: '100000',
  streak_threshold: '3',
  primary_color: '#2E7CF6',
  success_color: '#2FBF71',
  danger_color: '#F05454',
  font_family: 'Noto Sans JP',
  font_size: 14
};

// Local SDK fallbacks (if host SDKs are unavailable)
(function ensureLocalSDKs(){
  if (!window.elementSdk) {
    const CONFIG_KEY = 'fxdash_config';
    let current = null; try { current = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null'); } catch {}
    window.elementSdk = {
      config: current || { ...defaultConfig },
      async init(element) { await element.render(this.config); return { isOk: true }; },
      async setConfig(newCfg) { this.config = { ...(this.config||defaultConfig), ...(newCfg||{}) }; localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config)); return { isOk: true }; }
    };
  }
  if (!window.dataSdk) {
    const DATA_KEY = 'fxdash_trades';
    let handler = null;
    function load(){ try { return JSON.parse(localStorage.getItem(DATA_KEY) || '[]'); } catch { return []; } }
    function save(arr){ localStorage.setItem(DATA_KEY, JSON.stringify(arr)); }
    window.dataSdk = {
      async init(h){
        handler = h; const d = load();
        if (!d || d.length === 0){
          const now = new Date();
          const seed = [
            { id: 's1', trade_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 15).toISOString(), currency_pair: 'USDJPY', side: 'buy', quantity: 0.2, entry_price: 150.10, exit_price: 150.35, fees: 0, pnl_jpy: 0, strategy_tag: 'scalping', session: 'tokyo', broker: 'XM', notes: '', screenshot_url: '', created_at: new Date().toISOString() },
            { id: 's2', trade_date: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1, 16, 40).toISOString(), currency_pair: 'EURJPY', side: 'sell', quantity: 0.1, entry_price: 162.80, exit_price: 162.60, fees: 10, pnl_jpy: 0, strategy_tag: 'swing', session: 'london', broker: 'OANDA', notes: '', screenshot_url: '', created_at: new Date().toISOString() },
          ];
          seed.forEach(t => { t.pnl_jpy = computePnL(t.entry_price, t.exit_price, t.quantity, t.side, t.fees, t.currency_pair); });
          save(seed);
        }
        handler && handler.onDataChanged(load());
        return { isOk: true };
      },
      async create(item){ const d = load(); d.unshift(item); save(d); handler && handler.onDataChanged(d); return { isOk: true }; }
    };
  }
})();

// Global state
let trades = [];
let charts = {};
let currentMonth = new Date();
let sortState = { key: 'date', asc: false };
let filterTodayOnly = false;

// Utilities
function getPipValue(pair){ if (!pair) return 100; return pair.endsWith('JPY') ? 100 : 10000; }
function computePnL(entryPrice, exitPrice, quantity, side, fees, pair){ const factor = getPipValue(pair); let pnl = 0; if (side === 'buy') pnl = (exitPrice - entryPrice) * quantity * factor; else pnl = (entryPrice - exitPrice) * quantity * factor; pnl -= (fees || 0); return pnl; }
function sameYMD(a, b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function sameYM(a, b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }

// Element mapping
const element = {
  defaultConfig,
  async render(config){
    const title = document.getElementById('dashboard-title'); if (title) title.textContent = config.dashboard_title || defaultConfig.dashboard_title;
    const targetEl = document.getElementById('monthly-target'); if (targetEl) targetEl.textContent = `${parseInt(config.monthly_target || defaultConfig.monthly_target).toLocaleString()}円`;
    const primary = config.primary_color || defaultConfig.primary_color; const success = config.success_color || defaultConfig.success_color; const danger = config.danger_color || defaultConfig.danger_color;
    document.body.style.fontFamily = `${config.font_family || defaultConfig.font_family}, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif`;
    document.body.style.fontSize = `${config.font_size || defaultConfig.font_size}px`;
    document.querySelectorAll('.btn:not(.btn-secondary):not(.btn-danger)').forEach(btn => btn.style.backgroundColor = primary);
    document.querySelectorAll('.positive').forEach(el => el.style.color = success);
    document.querySelectorAll('.negative').forEach(el => el.style.color = danger);
    const progressFill = document.getElementById('progress-fill'); if (progressFill) progressFill.style.backgroundColor = success;
  },
  mapToCapabilities(config){
    return {
      recolorables:[
        { get:()=>config.primary_color||defaultConfig.primary_color, set:(v)=>{ config.primary_color=v; window.elementSdk.setConfig({ primary_color:v }); } },
        { get:()=>config.success_color||defaultConfig.success_color, set:(v)=>{ config.success_color=v; window.elementSdk.setConfig({ success_color:v }); } },
        { get:()=>config.danger_color||defaultConfig.danger_color, set:(v)=>{ config.danger_color=v; window.elementSdk.setConfig({ danger_color:v }); } }
      ],
      borderables:[],
      fontEditable:{ get:()=>config.font_family||defaultConfig.font_family, set:(v)=>{ config.font_family=v; window.elementSdk.setConfig({ font_family:v }); } },
      fontSizeable:{ get:()=>config.font_size||defaultConfig.font_size, set:(v)=>{ config.font_size=v; window.elementSdk.setConfig({ font_size:v }); } }
    };
  },
  mapToEditPanelValues:(config)=> new Map([
    ['dashboard_title', config.dashboard_title || defaultConfig.dashboard_title],
    ['monthly_target', config.monthly_target || defaultConfig.monthly_target],
    ['streak_threshold', config.streak_threshold || defaultConfig.streak_threshold]
  ])
};

// Data handler
const dataHandler = { onDataChanged(data){ trades = Array.isArray(data) ? data : []; updateUI(); } };

// Init
async function init(){
  try {
    if (window.elementSdk) await window.elementSdk.init(element);
    if (window.dataSdk) await window.dataSdk.init(dataHandler);
    initializeCalendar();
    initializeCharts();
    setupEventListeners();
    updateUI();
  } catch(e){ console.error('Initialization error:', e); }
}

// Events
function setupEventListeners(){
  document.getElementById('add-trade-btn')?.addEventListener('click', () => openTradeModal());
  document.getElementById('empty-add-trade')?.addEventListener('click', () => openTradeModal());
  document.getElementById('close-modal')?.addEventListener('click', closeTradeModal);
  document.getElementById('cancel-btn')?.addEventListener('click', closeTradeModal);
  document.getElementById('trade-form')?.addEventListener('submit', handleTradeSubmit);
  ['entry-price','exit-price','quantity','side','fees','currency-pair'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', calculatePnL); });
  document.getElementById('search-input')?.addEventListener('input', filterTrades);
  ['currency-filter','strategy-filter','session-filter','result-filter'].forEach(id => { document.getElementById(id)?.addEventListener('change', filterTrades); });
  document.querySelectorAll('#trades-table th[data-col]')?.forEach(th => { th.addEventListener('click', () => sortTable(th.getAttribute('data-col'))); });
  document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n'){ e.preventDefault(); openTradeModal(); }
      if (e.key === 'f'){ e.preventDefault(); document.getElementById('search-input')?.focus(); }
      if (e.key.toLowerCase() === 'd'){ e.preventDefault(); filterTodayOnly = true; filterTrades(); }
    }
    if (e.key === 'Escape') closeTradeModal();
  });
}

// Modal
function openTradeModal(prefillDate){
  const modal = document.getElementById('trade-modal'); if (!modal) return; modal.classList.add('active'); modal.setAttribute('aria-hidden','false');
  const dateInput = document.getElementById('trade-date'); const dt = prefillDate ? new Date(prefillDate) : new Date();
  if (dateInput) dateInput.value = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
  document.getElementById('currency-pair')?.focus();
}
function closeTradeModal(){ const modal = document.getElementById('trade-modal'); if (!modal) return; modal.classList.remove('active'); modal.setAttribute('aria-hidden','true'); document.getElementById('trade-form')?.reset(); const d = document.getElementById('pnl-display'); if (d) d.value = ''; }

// PnL calc
function calculatePnL(){
  const entryPrice = parseFloat(document.getElementById('entry-price')?.value || 0);
  const exitPrice = parseFloat(document.getElementById('exit-price')?.value || 0);
  const quantity = parseFloat(document.getElementById('quantity')?.value || 0);
  const side = document.getElementById('side')?.value;
  const fees = parseFloat(document.getElementById('fees')?.value || 0);
  const pair = document.getElementById('currency-pair')?.value;
  if (entryPrice && exitPrice && quantity && side && pair){
    const v = computePnL(entryPrice, exitPrice, quantity, side, fees, pair);
    const pnlDisplay = document.getElementById('pnl-display'); if (pnlDisplay) pnlDisplay.value = `${(v>=0?'+':'')}${v.toLocaleString()}円`;
  }
}

// Form submit
async function handleTradeSubmit(e){
  e.preventDefault(); if (trades.length >= 999){ alert('最大999件の取引まで保存できます。古い取引を削除してから追加してください。'); return; }
  const submitBtn = document.getElementById('submit-btn'); const spinner = document.getElementById('submit-spinner');
  submitBtn && (submitBtn.disabled = true); spinner && (spinner.style.display = 'inline-block');
  try {
    const entryPrice = parseFloat(document.getElementById('entry-price')?.value || 0);
    const exitPrice = parseFloat(document.getElementById('exit-price')?.value || 0);
    const quantity = parseFloat(document.getElementById('quantity')?.value || 0);
    const side = document.getElementById('side')?.value || '';
    const pair = document.getElementById('currency-pair')?.value || '';
    const fees = parseFloat(document.getElementById('fees')?.value || 0);
    const tradeData = {
      id: Date.now().toString(),
      trade_date: document.getElementById('trade-date')?.value || '',
      currency_pair: pair,
      side,
      quantity,
      entry_price: entryPrice,
      exit_price: exitPrice,
      pnl_jpy: computePnL(entryPrice, exitPrice, quantity, side, fees, pair),
      fees,
      strategy_tag: document.getElementById('strategy-tag')?.value || '',
      session: document.getElementById('session')?.value || '',
      broker: document.getElementById('broker')?.value || '',
      notes: document.getElementById('notes')?.value || '',
      screenshot_url: document.getElementById('screenshot-url')?.value || '',
      created_at: new Date().toISOString()
    };
    if (window.dataSdk){ const result = await window.dataSdk.create(tradeData); if (result?.isOk) closeTradeModal(); else alert('取引の保存に失敗しました。もう一度お試しください。'); }
  } catch(err){ console.error('Error saving trade:', err); alert('取引の保存中にエラーが発生しました。'); }
  finally { submitBtn && (submitBtn.disabled = false); spinner && (spinner.style.display = 'none'); }
}

// Calendar
function initializeCalendar(){ generateCalendar(); }
function generateCalendar(){
  const grid = document.getElementById('calendar-grid'); const monthEl = document.getElementById('calendar-month'); if (!grid || !monthEl) return;
  monthEl.textContent = `${currentMonth.getFullYear()}年${currentMonth.getMonth()+1}月`;
  grid.innerHTML = '';
  const dayHeaders = ['日','月','火','水','木','金','土']; dayHeaders.forEach(d => { const h = document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; grid.appendChild(h); });
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1); const startDate = new Date(firstDay); startDate.setDate(startDate.getDate() - firstDay.getDay());
  for (let i=0;i<42;i++){
    const date = new Date(startDate); date.setDate(startDate.getDate()+i);
    const dayEl = document.createElement('div'); dayEl.className='calendar-day'; dayEl.addEventListener('click', () => { const d = new Date(date); d.setHours(9,0,0,0); openTradeModal(d); });
    const num = document.createElement('div'); num.className='calendar-day-number'; num.textContent = String(date.getDate()); if (date.getMonth() !== currentMonth.getMonth()) num.style.opacity = '0.3';
    dayEl.appendChild(num); grid.appendChild(dayEl);
  }
}
function changeMonth(n){ currentMonth.setMonth(currentMonth.getMonth()+n); generateCalendar(); }

// Charts (sample data)
function initializeCharts(){ initializeEquityChart(); initializeCurrencyChart(); initializeSessionChart(); initializeStrategyChart(); initializeRRChart(); }
function initializeEquityChart(){ const ctx = document.getElementById('equity-chart'); if (!ctx) return; const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']; const equityData = [0,15000,12000,28000,35000,42000,38000,55000,62000,58000,75000,85200]; const monthlyData = [0,15000,-3000,16000,7000,7000,-4000,17000,7000,-4000,17000,10200]; charts.equity = new Chart(ctx, { type:'line', data:{ labels:months, datasets:[ { label:'累積損益', data:equityData, borderColor:'#2E7CF6', backgroundColor:'rgba(46,124,246,0.1)', fill:true, tension:0.4, yAxisID:'y' }, { label:'月次損益', data:monthlyData, type:'bar', backgroundColor: monthlyData.map(v=>v>=0?'#2FBF71':'#F05454'), yAxisID:'y1' } ] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#FFFFFF' } } }, scales:{ x:{ ticks:{ color:'#888888' }, grid:{ color:'#2A2A2A' } }, y:{ type:'linear', position:'left', ticks:{ color:'#888888', callback:v=>v.toLocaleString()+'円' }, grid:{ color:'#2A2A2A' } }, y1:{ type:'linear', position:'right', ticks:{ color:'#888888', callback:v=>v.toLocaleString()+'円' }, grid:{ drawOnChartArea:false } } } }); }
function initializeCurrencyChart(){ const ctx=document.getElementById('currency-chart'); if(!ctx) return; charts.currency=new Chart(ctx,{ type:'bar', data:{ labels:['USD/JPY','EUR/JPY','GBP/JPY','AUD/JPY','EUR/USD'], datasets:[{ label:'損益(JPY)', data:[45200,28500,-12300,15800,7900], backgroundColor:[45200,28500,-12300,15800,7900].map(v=>v>=0?'#2FBF71':'#F05454') }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#888888', callback:v=>v.toLocaleString()+'円' }, grid:{ color:'#2A2A2A' } }, y:{ ticks:{ color:'#888888' }, grid:{ color:'#2A2A2A' } } } }); }
function initializeSessionChart(){ const ctx=document.getElementById('session-chart'); if(!ctx) return; charts.session=new Chart(ctx,{ type:'doughnut', data:{ labels:['東京','ロンドン','ニューヨーク','重複'], datasets:[{ data:[35200,28500,15800,5700], backgroundColor:['#2E7CF6','#2FBF71','#F05454','#FFA500'] }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#FFFFFF' } } } }); }
function initializeStrategyChart(){ const ctx=document.getElementById('strategy-chart'); if(!ctx) return; charts.strategy=new Chart(ctx,{ type:'scatter', data:{ datasets:[ {label:'スキャルピング', data:[{x:72,y:1250}], backgroundColor:'#2E7CF6'}, {label:'スイング', data:[{x:65,y:2100}], backgroundColor:'#2FBF71'}, {label:'ブレイクアウト', data:[{x:58,y:1800}], backgroundColor:'#F05454'} ] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#FFFFFF' } } }, scales:{ x:{ title:{ display:true, text:'勝率(%)', color:'#FFFFFF' }, ticks:{ color:'#888888' }, grid:{ color:'#2A2A2A' } }, y:{ title:{ display:true, text:'期待値(円)', color:'#FFFFFF' }, ticks:{ color:'#888888', callback:v=>v.toLocaleString()+'円' }, grid:{ color:'#2A2A2A' } } } }); }
function initializeRRChart(){ const ctx=document.getElementById('rr-chart'); if(!ctx) return; charts.rr=new Chart(ctx,{ type:'bar', data:{ labels:['0-0.5','0.5-1','1-1.5','1.5-2','2-2.5','2.5-3','3+'], datasets:[{ label:'取引数', data:[5,12,18,25,15,8,3], backgroundColor:'#2E7CF6' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ title:{ display:true, text:'リスクリワード比', color:'#FFFFFF' }, ticks:{ color:'#888888' }, grid:{ color:'#2A2A2A' } }, y:{ title:{ display:true, text:'取引数', color:'#FFFFFF' }, ticks:{ color:'#888888' }, grid:{ color:'#2A2A2A' } } } }); }

// Rendering trades
function renderTradesRows(list){
  const tbody = document.getElementById('trades-tbody'); const emptyState = document.getElementById('trades-empty'); if (!tbody || !emptyState) return; tbody.innerHTML = '';
  if (!list || list.length === 0){ emptyState.style.display = 'block'; return; } else { emptyState.style.display = 'none'; }
  for (const t of list){
    const tr = document.createElement('tr'); tr.addEventListener('click', () => showTradeDetails(t.id));
    const cells = [ new Date(t.trade_date).toLocaleString('ja-JP'), t.currency_pair || '-', t.side === 'buy' ? '買い' : (t.side === 'sell' ? '売り' : '-'), (t.quantity ?? '').toString(), (t.entry_price ?? '').toString(), (t.exit_price ?? '').toString(), `${((t.pnl_jpy||0)>=0?'+':'')}${(t.pnl_jpy||0).toLocaleString()}円`, calculateRR(t).toFixed(2), t.strategy_tag || '-', t.session || '-', t.broker || '-' ];
    cells.forEach((val, idx) => { const td = document.createElement('td'); if (idx===6) td.className = (t.pnl_jpy||0) >= 0 ? 'positive' : 'negative'; td.textContent = val; tr.appendChild(td); });
    tbody.appendChild(tr);
  }
}

// Filter/sort
function getFilteredTrades(){
  const text = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const currency = document.getElementById('currency-filter')?.value || '';
  const strategy = document.getElementById('strategy-filter')?.value || '';
  const session = document.getElementById('session-filter')?.value || '';
  const result = document.getElementById('result-filter')?.value || '';
  const today = new Date();
  return trades.filter(t => {
    if (filterTodayOnly && !sameYMD(new Date(t.trade_date), today)) return false;
    if (currency && t.currency_pair !== currency) return false;
    if (strategy && t.strategy_tag !== strategy) return false;
    if (session && t.session !== session) return false;
    if (result === 'win' && !((t.pnl_jpy||0) > 0)) return false;
    if (result === 'loss' && !((t.pnl_jpy||0) < 0)) return false;
    if (text){ const hay = `${t.currency_pair||''} ${t.strategy_tag||''} ${t.session||''} ${t.broker||''}`.toLowerCase(); if (!hay.includes(text)) return false; }
    return true;
  });
}
function sortTrades(list){
  const sorted = [...list]; const { key, asc } = sortState; const dir = asc ? 1 : -1;
  sorted.sort((a,b)=>{
    switch(key){
      case 'date': return (new Date(a.trade_date) - new Date(b.trade_date)) * dir;
      case 'pair': return (a.currency_pair||'').localeCompare(b.currency_pair||'') * dir;
      case 'side': return (a.side||'').localeCompare(b.side||'') * dir;
      case 'quantity': return ((a.quantity||0)-(b.quantity||0)) * dir;
      case 'entry': return ((a.entry_price||0)-(b.entry_price||0)) * dir;
      case 'exit': return ((a.exit_price||0)-(b.exit_price||0)) * dir;
      case 'pnl': return ((a.pnl_jpy||0)-(b.pnl_jpy||0)) * dir;
      case 'rr': return (calculateRR(a)-calculateRR(b)) * dir;
      case 'strategy': return (a.strategy_tag||'').localeCompare(b.strategy_tag||'') * dir;
      case 'session': return (a.session||'').localeCompare(b.session||'') * dir;
      case 'broker': return (a.broker||'').localeCompare(b.broker||'') * dir;
      default: return 0;
    }
  });
  return sorted;
}
function filterTrades(){ const list = getFilteredTrades(); renderTradesRows(sortTrades(list)); filterTodayOnly = false; }
function sortTable(column){ const map = { date:'date', pair:'pair', side:'side', quantity:'quantity', entry:'entry', exit:'exit', pnl:'pnl', rr:'rr', strategy:'strategy', session:'session', broker:'broker' }; const key = map[column] || 'date'; if (sortState.key === key) sortState.asc = !sortState.asc; else { sortState.key = key; sortState.asc = key==='date' ? false : true; } filterTrades(); }

// KPIs and goals
function updateUI(){ updateKPIs(); filterTrades(); updateGoalsSection(); }
function updateKPIs(){
  const now = new Date();
  const todayPnl = trades.filter(t => sameYMD(new Date(t.trade_date), now)).reduce((s,t)=>s+(t.pnl_jpy||0),0);
  const monthPnl = trades.filter(t => sameYM(new Date(t.trade_date), now)).reduce((s,t)=>s+(t.pnl_jpy||0),0);
  const winTrades = trades.filter(t => (t.pnl_jpy||0) > 0);
  const winRate = trades.length ? (winTrades.length / trades.length * 100) : 0;
  const totalPnl = trades.reduce((s,t)=>s+(t.pnl_jpy||0),0);
  const expectancy = trades.length ? totalPnl / trades.length : 0;
  const todayEl = document.getElementById('today-pnl'); if (todayEl){ todayEl.textContent = `${todayPnl>=0?'+':''}${todayPnl.toLocaleString()}円`; todayEl.className = `kpi-value ${todayPnl>=0?'positive':'negative'}`; }
  const monthEl = document.getElementById('month-pnl'); if (monthEl){ monthEl.textContent = `${monthPnl>=0?'+':''}${monthPnl.toLocaleString()}円`; monthEl.className = `kpi-value ${monthPnl>=0?'positive':'negative'}`; }
  const winEl = document.getElementById('win-rate'); if (winEl) winEl.textContent = `${winRate.toFixed(1)}%`;
  const expEl = document.getElementById('expectancy'); if (expEl){ expEl.textContent = `${expectancy>=0?'+':''}${expectancy.toLocaleString()}円`; expEl.className = `kpi-value ${expectancy>=0?'positive':'negative'}`; }
}
function calculateRR(trade){ const entry = trade.entry_price || 0; const exit = trade.exit_price || 0; const qty = trade.quantity || 0; const pnl = trade.pnl_jpy || 0; if (!entry || !exit || !qty) return 0; const risk = Math.abs(entry - exit) * qty * getPipValue(trade.currency_pair); return risk>0 ? Math.abs(pnl)/risk : 0; }
function updateGoalsSection(){
  const cfg = window.elementSdk?.config || defaultConfig; const monthlyTarget = parseInt(cfg.monthly_target || defaultConfig.monthly_target); const streakThreshold = parseInt(cfg.streak_threshold || defaultConfig.streak_threshold);
  const now = new Date(); const monthTrades = trades.filter(t => sameYM(new Date(t.trade_date), now)); const monthPnl = monthTrades.reduce((s,t)=>s+(t.pnl_jpy||0),0);
  const progress = monthlyTarget>0 ? (monthPnl/monthlyTarget*100) : 0;
  const fill = document.getElementById('progress-fill'); if (fill) fill.style.width = `${Math.min(progress,100).toFixed(1)}%`;
  const cur = document.getElementById('progress-current'); if (cur) cur.textContent = `現在: ${monthPnl.toLocaleString()}円`;
  const pct = document.getElementById('progress-percent'); if (pct) pct.textContent = `${Math.min(progress,100).toFixed(1)}%`;
  const sorted = [...trades].sort((a,b)=> new Date(b.trade_date)-new Date(a.trade_date));
  let currentStreak=0; let streakType=null; let maxLossStreak=0; let tmp=0;
  for (const t of sorted){ const isWin = (t.pnl_jpy||0) > 0; if (streakType===null){ streakType=isWin?'win':'loss'; currentStreak=1; } else if ((streakType==='win' && isWin) || (streakType==='loss' && !isWin)){ currentStreak++; } else break; }
  for (const t of sorted){ if ((t.pnl_jpy||0)<0){ tmp++; maxLossStreak=Math.max(maxLossStreak,tmp);} else { tmp=0; } }
  const ws = document.getElementById('win-streak'); if (ws) ws.textContent = streakType==='win'? `${currentStreak}回` : '0回';
  const mls = document.getElementById('max-loss-streak'); if (mls) mls.textContent = `${maxLossStreak}回`;
  const alertBanner = document.getElementById('streak-alert'); if (alertBanner){ if (streakType==='loss' && currentStreak>=streakThreshold) alertBanner.classList.remove('hidden'); else alertBanner.classList.add('hidden'); }
}

// Details (placeholder)
function showTradeDetails(id){ console.log('Show details for trade:', id); }

document.addEventListener('DOMContentLoaded', init);

