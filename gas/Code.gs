const SHEET_NAME = 'Trades';
const HEADERS = [
  'id','trade_date','currency_pair','side','quantity','entry_price','exit_price','pnl_jpy','fees','strategy_tag','session','broker','notes','screenshot_url','created_at'
];

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('FX収支ダッシュボード')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('FX Dashboard');
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  // Ensure headers exist
  const firstRow = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  if (firstRow.join('\t') !== HEADERS.join('\t')) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function getTrades() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return rows.map(r => {
    const obj = {};
    HEADERS.forEach((h, i) => obj[h] = r[i]);
    if (typeof obj.quantity === 'string') obj.quantity = parseFloat(obj.quantity) || 0;
    if (typeof obj.entry_price === 'string') obj.entry_price = parseFloat(obj.entry_price) || 0;
    if (typeof obj.exit_price === 'string') obj.exit_price = parseFloat(obj.exit_price) || 0;
    if (typeof obj.pnl_jpy === 'string') obj.pnl_jpy = parseFloat(obj.pnl_jpy) || 0;
    if (typeof obj.fees === 'string') obj.fees = parseFloat(obj.fees) || 0;
    return obj;
  });
}

function createTrade(trade) {
  const sheet = getSheet_();
  const row = HEADERS.map(h => trade && trade[h] !== undefined ? trade[h] : '');
  sheet.appendRow(row);
  return { isOk: true };
}

function updateTrade(id, patch) {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return { isOk: false, message: 'not found' };
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
  const index = ids.indexOf(String(id));
  if (index === -1) return { isOk: false, message: 'not found' };
  const rowNumber = index + 2;
  const current = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  const merged = {};
  HEADERS.forEach((h, i) => merged[h] = patch && patch[h] !== undefined ? patch[h] : current[i]);
  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([HEADERS.map(h => merged[h])]);
  return { isOk: true };
}

function deleteTrade(id) {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return { isOk: false, message: 'not found' };
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
  const index = ids.indexOf(String(id));
  if (index === -1) return { isOk: false, message: 'not found' };
  sheet.deleteRow(index + 2);
  return { isOk: true };
}

// Optional config via PropertiesService
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const json = props.getProperty('fxdash_config') || '';
  try { return json ? JSON.parse(json) : {}; } catch(e) { return {}; }
}

function setConfig(cfg) {
  const props = PropertiesService.getScriptProperties();
  const current = getConfig();
  const merged = Object.assign({}, current, cfg || {});
  props.setProperty('fxdash_config', JSON.stringify(merged));
  return { isOk: true };
}

