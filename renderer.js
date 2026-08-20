const HanedaApiProvider = require('./providers/HanedaApiProvider');

// Initialize the data provider
const provider = new HanedaApiProvider();

// DOM Elements
const flightListEl = document.getElementById('flight-list');
const template = document.getElementById('flight-row-template');
const airportSelectEl = document.getElementById('airport-select');
const filterSelectEl = document.getElementById('filter-select');
const modeSelectEl = document.getElementById('mode-select');
const closeButtonEl = document.getElementById('close-button');
const headerEnEl = document.getElementById('header-en');
const headerJaEl = document.getElementById('header-ja');
const headerPlanePathEl = document.getElementById('header-plane-path');
const thTimeJaEl = document.getElementById('th-time-ja');
const thEstimatedJaEl = document.getElementById('th-estimated-ja');
const thEndpointEnEl = document.getElementById('th-endpoint-en');
const thEndpointJaEl = document.getElementById('th-endpoint-ja');
const thFlightJaEl = document.getElementById('th-flight-ja');
const thTerminalJaEl = document.getElementById('th-terminal-ja');
const thGateJaEl = document.getElementById('th-gate-ja');
const settingsIconEl = document.getElementById('settings-button');
const settingsPanelEl = document.getElementById('settings-panel');
const settingsTitleEl = document.getElementById('settings-title');

// Take-off / landing glyphs from Material Design (flight_takeoff / flight_land)
const PLANE_PATHS = {
  departures: 'M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10.5 8.46 4.44l-1.93.51 3.87 6.7-5.66 1.52-2.25-1.75-1.45.39 1.82 3.16.77 1.33 1.6-.43 5.31-1.42 4.35-1.16L21 11.49c.81-.23 1.28-1.05 1.07-1.85z',
  arrivals: 'M2.5 19h19v2h-19zm7.18-5.73l4.35 1.16 5.31 1.42c.8.21 1.62-.26 1.84-1.06.21-.8-.26-1.62-1.06-1.84l-5.31-1.42-2.76-9.02L10.12 2v8.28L5.15 8.95l-.93-2.32-1.45-.39v5.17l1.6.43 5.31 1.43z'
};

// The board keeps its English line and swaps the local one, so only the local
// half of every label lives here.
const uiText = {
  ja: {
    name: '日本語',
    board: { departures: '出発', arrivals: '到着' },
    thTime: { departures: '出発時刻', arrivals: '到着時刻' },
    thEstimated: '変更時刻',
    thEndpoint: { departures: '行先', arrivals: '出発地' },
    thFlight: '便名',
    thTerminal: 'ターミナル',
    thGate: 'ゲート',
    filter: { all: 'すべて', domestic: '国内線', international: '国際線' },
    groups: { japan: '日本', main: '台湾 — 本島', islands: '台湾 — 離島' },
    settings: '表示言語',
    close: '閉じる (Esc)',
    loading: '読み込み中...',
    noFlights: '便がありません',
    noMatch: '該当する便がありません',
    error: 'フライト情報を取得できませんでした。',
    airports: {
      HND: '羽田 (HND)', NRT: '成田 (NRT)',
      TPE: '桃園 (TPE)', TSA: '台北松山 (TSA)', RMQ: '台中 (RMQ)', CYI: '嘉義 (CYI)',
      TNN: '台南 (TNN)', KHH: '高雄 (KHH)', HUN: '花蓮 (HUN)', TTT: '台東 (TTT)',
      MZG: '澎湖・馬公 (MZG)', WOT: '望安 (WOT)', CMJ: '七美 (CMJ)', KNH: '金門 (KNH)',
      LZN: '馬祖南竿 (LZN)', MFK: '馬祖北竿 (MFK)', GNI: '緑島 (GNI)', KYD: '蘭嶼 (KYD)'
    }
  },
  zh: {
    name: '繁體中文',
    board: { departures: '出發', arrivals: '抵達' },
    thTime: { departures: '表定時間', arrivals: '表定時間' },
    thEstimated: '預計時間',
    thEndpoint: { departures: '目的地', arrivals: '出發地' },
    thFlight: '班機編號',
    thTerminal: '航廈',
    thGate: '登機門',
    filter: { all: '全部', domestic: '國內線', international: '國際線' },
    groups: { japan: '日本', main: '臺灣 — 本島', islands: '臺灣 — 離島' },
    settings: '顯示語言',
    close: '關閉 (Esc)',
    loading: '載入中...',
    noFlights: '目前沒有航班',
    noMatch: '沒有符合的航班',
    error: '無法取得航班資訊。',
    airports: {
      HND: '羽田 (HND)', NRT: '成田 (NRT)',
      TPE: '桃園 (TPE)', TSA: '臺北松山 (TSA)', RMQ: '臺中 (RMQ)', CYI: '嘉義 (CYI)',
      TNN: '臺南 (TNN)', KHH: '高雄 (KHH)', HUN: '花蓮 (HUN)', TTT: '臺東 (TTT)',
      MZG: '澎湖馬公 (MZG)', WOT: '望安 (WOT)', CMJ: '七美 (CMJ)', KNH: '金門 (KNH)',
      LZN: '馬祖南竿 (LZN)', MFK: '馬祖北竿 (MFK)', GNI: '綠島 (GNI)', KYD: '蘭嶼 (KYD)'
    }
  }
};

// The English half never changes, so it is keyed by board only.
const boardEn = {
  departures: { board: 'Departures', endpoint: 'Destination' },
  arrivals: { board: 'Arrivals', endpoint: 'Origin' }
};

const LANG_STORAGE_KEY = 'flightboard.lang';
let currentLang = (localStorage.getItem(LANG_STORAGE_KEY) === 'zh') ? 'zh' : 'ja';

function t() {
  return uiText[currentLang];
}

/**
 * Repoint every label at the current board and language
 */
function applyLabels() {
  const mode = modeSelectEl.value;
  const L = t();
  const en = boardEn[mode] || boardEn.departures;

  headerEnEl.textContent = en.board;
  headerJaEl.textContent = L.board[mode];
  headerPlanePathEl.setAttribute('d', PLANE_PATHS[mode] || PLANE_PATHS.departures);

  thTimeJaEl.textContent = L.thTime[mode];
  thEstimatedJaEl.textContent = L.thEstimated;
  thEndpointEnEl.textContent = en.endpoint;
  thEndpointJaEl.textContent = L.thEndpoint[mode];
  thFlightJaEl.textContent = L.thFlight;
  thTerminalJaEl.textContent = L.thTerminal;
  thGateJaEl.textContent = L.thGate;

  // Mode select: its own options are the board names
  modeSelectEl.options[0].textContent = L.board.departures;
  modeSelectEl.options[1].textContent = L.board.arrivals;

  filterSelectEl.options[0].textContent = L.filter.all;
  filterSelectEl.options[1].textContent = L.filter.domestic;
  filterSelectEl.options[2].textContent = L.filter.international;

  // Airport select: values stay put, so the current selection survives
  for (const opt of airportSelectEl.options) {
    if (L.airports[opt.value]) opt.textContent = L.airports[opt.value];
  }
  const groupKeys = ['japan', 'main', 'islands'];
  airportSelectEl.querySelectorAll('optgroup').forEach((g, i) => {
    if (groupKeys[i]) g.label = L.groups[groupKeys[i]];
  });

  closeButtonEl.querySelector('title').textContent = L.close;
  settingsTitleEl.textContent = L.settings;
}

// Airport Country Mapping (to determine domestic vs international)
const airportCountries = {
  "HND": "JP",
  "NRT": "JP",
  "KHH": "TW",
  "TPE": "TW",
  "TSA": "TW",
  "RMQ": "TW",
  "TNN": "TW",
  "CYI": "TW",
  "HUN": "TW",
  "TTT": "TW",
  "MZG": "TW",
  "WOT": "TW",
  "CMJ": "TW",
  "KNH": "TW",
  "LZN": "TW",
  "MFK": "TW",
  "GNI": "TW",
  "KYD": "TW"
};

// City translation dictionary
// City name dictionary. Keys are the English city names FR24 returns;
// `ja` is Japanese and `zh` is Taiwanese Mandarin (traditional, Taiwan usage).
const cityNames = {
  // Japan (Domestic)
  "Sapporo": { ja: "札幌", zh: "札幌" },
  "Asahikawa": { ja: "旭川", zh: "旭川" },
  "Hakodate": { ja: "函館", zh: "函館" },
  "Aomori": { ja: "青森", zh: "青森" },
  "Akita": { ja: "秋田", zh: "秋田" },
  "Sendai": { ja: "仙台", zh: "仙台" },
  "Tokyo": { ja: "東京", zh: "東京" },
  "Nagoya": { ja: "名古屋", zh: "名古屋" },
  "Osaka": { ja: "大阪", zh: "大阪" },
  "Kobe": { ja: "神戸", zh: "神戶" },
  "Fukuoka": { ja: "福岡", zh: "福岡" },
  "Kitakyushu": { ja: "北九州", zh: "北九州" },
  "Nagasaki": { ja: "長崎", zh: "長崎" },
  "Kumamoto": { ja: "熊本", zh: "熊本" },
  "Oita": { ja: "大分", zh: "大分" },
  "Miyazaki": { ja: "宮崎", zh: "宮崎" },
  "Kagoshima": { ja: "鹿児島", zh: "鹿兒島" },
  "Okinawa": { ja: "那覇", zh: "那霸" },
  "Naha": { ja: "那覇", zh: "那霸" },
  "Ishigaki": { ja: "石垣", zh: "石垣" },
  "Miyako": { ja: "宮古", zh: "宮古" },
  "Takamatsu": { ja: "高松", zh: "高松" },
  "Matsuyama": { ja: "松山", zh: "松山" },
  "Kochi": { ja: "高知", zh: "高知" },
  "Hiroshima": { ja: "広島", zh: "廣島" },
  "Okayama": { ja: "岡山", zh: "岡山" },
  "Yamaguchi": { ja: "山口", zh: "山口" },
  "Ube": { ja: "宇部", zh: "宇部" },
  "Iwakuni": { ja: "岩国", zh: "岩國" },
  "Izumo": { ja: "出雲", zh: "出雲" },
  "Matsue": { ja: "松江", zh: "松江" },
  "Tottori": { ja: "鳥取", zh: "鳥取" },
  "Yonago": { ja: "米子", zh: "米子" },
  "Yamagata": { ja: "山形", zh: "山形" },
  "Tokushima": { ja: "徳島", zh: "德島" },
  "Komatsu": { ja: "小松", zh: "小松" },
  "Toyama": { ja: "富山", zh: "富山" },
  "Niigata": { ja: "新潟", zh: "新潟" },
  "Shizuoka": { ja: "静岡", zh: "靜岡" },
  "Ibaraki": { ja: "茨城", zh: "茨城" },
  "Fukushima": { ja: "福島", zh: "福島" },
  "Shonai": { ja: "庄内", zh: "庄內" },
  "Odate-Noshiro": { ja: "大館能代", zh: "大館能代" },
  "Kitaakita": { ja: "北秋田(大館能代)", zh: "北秋田(大館能代)" },
  "Masuda": { ja: "益田(萩・石見)", zh: "益田(萩・石見)" },
  "Kushiro": { ja: "釧路", zh: "釧路" },
  "Obihiro": { ja: "帯広", zh: "帶廣" },
  "Memanbetsu": { ja: "女満別", zh: "女滿別" },
  "Nakashibetsu": { ja: "中標津", zh: "中標津" },
  "Wakkanai": { ja: "稚内", zh: "稚內" },
  "Monbetsu": { ja: "紋別", zh: "紋別" },
  "Hachijojima": { ja: "八丈島", zh: "八丈島" },
  "Amami": { ja: "奄美", zh: "奄美" },
  "Amami Oshima": { ja: "奄美大島", zh: "奄美大島" },
  "Tokunoshima": { ja: "徳之島", zh: "德之島" },
  "Kumejima": { ja: "久米島", zh: "久米島" },
  "Shimojishima": { ja: "下地島", zh: "下地島" },
  "Yonaguni": { ja: "与那国", zh: "與那國" },

  // Asia
  "Beijing": { ja: "北京", zh: "北京" },
  "Shanghai": { ja: "上海", zh: "上海" },
  "Hong Kong": { ja: "香港", zh: "香港" },
  "Taipei": { ja: "台北", zh: "臺北" },
  "Seoul": { ja: "ソウル", zh: "首爾" },
  "Busan": { ja: "釜山", zh: "釜山" },
  "Jeju": { ja: "済州", zh: "濟州" },
  "Manila": { ja: "マニラ", zh: "馬尼拉" },
  "Cebu": { ja: "セブ", zh: "宿霧" },
  "Singapore": { ja: "シンガポール", zh: "新加坡" },
  "Bangkok": { ja: "バンコク", zh: "曼谷" },
  "Ho Chi Minh City": { ja: "ホーチミン", zh: "胡志明市" },
  "Hanoi": { ja: "ハノイ", zh: "河內" },
  "Da Nang": { ja: "ダナン", zh: "峴港" },
  "Kuala Lumpur": { ja: "クアラルンプール", zh: "吉隆坡" },
  "Jakarta": { ja: "ジャカルタ", zh: "雅加達" },
  "Denpasar": { ja: "バリ島 (デンパサール)", zh: "峇里島 (登巴薩)" },
  "New Delhi": { ja: "ニューデリー", zh: "新德里" },
  "Mumbai": { ja: "ムンバイ", zh: "孟買" },
  "Colombo": { ja: "コロンボ", zh: "可倫坡" },
  "Guangzhou": { ja: "広州", zh: "廣州" },
  "Dalian": { ja: "大連", zh: "大連" },
  "Qingdao": { ja: "青島", zh: "青島" },
  "Macau": { ja: "マカオ", zh: "澳門" },
  "Kaohsiung": { ja: "高雄", zh: "高雄" },

  // Taiwan (domestic / offshore islands)
  "Taichung": { ja: "台中", zh: "臺中" },
  "Tainan": { ja: "台南", zh: "臺南" },
  "Chiayi": { ja: "嘉義", zh: "嘉義" },
  "Hualien": { ja: "花蓮", zh: "花蓮" },
  "Taitung": { ja: "台東", zh: "臺東" },
  "Penghu": { ja: "澎湖", zh: "澎湖" },
  "Magong": { ja: "馬公(澎湖)", zh: "馬公(澎湖)" },
  "Kinmen": { ja: "金門", zh: "金門" },
  "Matsu": { ja: "馬祖", zh: "馬祖" },
  "Nangan": { ja: "南竿(馬祖)", zh: "南竿(馬祖)" },
  "Beigan": { ja: "北竿(馬祖)", zh: "北竿(馬祖)" },
  "Green Island": { ja: "緑島", zh: "綠島" },
  "Ludao": { ja: "緑島", zh: "綠島" },
  "Orchid Island": { ja: "蘭嶼", zh: "蘭嶼" },
  "Lanyu": { ja: "蘭嶼", zh: "蘭嶼" },

  // Additional Asia routes (Kaohsiung and other hubs)
  "Chiang Mai": { ja: "チェンマイ", zh: "清邁" },
  "Phuket": { ja: "プーケット", zh: "普吉島" },
  "Phnom Penh": { ja: "プノンペン", zh: "金邊" },
  "Siem Reap": { ja: "シェムリアップ", zh: "暹粒" },
  "Vientiane": { ja: "ビエンチャン", zh: "永珍" },
  "Yangon": { ja: "ヤンゴン", zh: "仰光" },
  "Kota Kinabalu": { ja: "コタキナバル", zh: "亞庇" },
  "Penang": { ja: "ペナン", zh: "檳城" },
  "Surabaya": { ja: "スラバヤ", zh: "泗水" },
  "Palau": { ja: "パラオ", zh: "帛琉" },
  "Koror": { ja: "コロール(パラオ)", zh: "科羅(帛琉)" },
  "Hangzhou": { ja: "杭州", zh: "杭州" },
  "Nanjing": { ja: "南京", zh: "南京" },
  "Ningbo": { ja: "寧波", zh: "寧波" },
  "Wuhan": { ja: "武漢", zh: "武漢" },
  "Chongqing": { ja: "重慶", zh: "重慶" },
  "Chengdu": { ja: "成都", zh: "成都" },
  "Zhengzhou": { ja: "鄭州", zh: "鄭州" },
  "Changsha": { ja: "長沙", zh: "長沙" },
  "Nanchang": { ja: "南昌", zh: "南昌" },
  "Hefei": { ja: "合肥", zh: "合肥" },
  "Wenzhou": { ja: "温州", zh: "溫州" },
  "Quanzhou": { ja: "泉州", zh: "泉州" },
  "Jinjiang": { ja: "晋江", zh: "晉江" },
  "Shenyang": { ja: "瀋陽", zh: "瀋陽" },
  "Harbin": { ja: "ハルビン", zh: "哈爾濱" },
  "Xian": { ja: "西安", zh: "西安" },
  "Kunming": { ja: "昆明", zh: "昆明" },
  "Sanya": { ja: "三亜", zh: "三亞" },
  "Guiyang": { ja: "貴陽", zh: "貴陽" },
  "Yantai": { ja: "煙台", zh: "煙台" },
  "Wuxi": { ja: "無錫", zh: "無錫" },
  "Changzhou": { ja: "常州", zh: "常州" },
  "Nantong": { ja: "南通", zh: "南通" },
  "Yancheng": { ja: "塩城", zh: "鹽城" },
  "Taiyuan": { ja: "太原", zh: "太原" },
  "Lanzhou": { ja: "蘭州", zh: "蘭州" },
  "Urumqi": { ja: "ウルムチ", zh: "烏魯木齊" },
  "Hat Yai": { ja: "ハジャイ", zh: "合艾" },
  "Krabi": { ja: "クラビ", zh: "喀比" },
  "Phu Quoc": { ja: "フーコック", zh: "富國島" },
  "Nha Trang": { ja: "ニャチャン", zh: "芽莊" },
  "Kalibo": { ja: "カリボ", zh: "卡利博" },
  "Male": { ja: "マレ", zh: "馬列" },
  "Dhaka": { ja: "ダッカ", zh: "達卡" },
  "Kathmandu": { ja: "カトマンズ", zh: "加德滿都" },
  "Riyadh": { ja: "リヤド", zh: "利雅德" },
  "Saga": { ja: "佐賀", zh: "佐賀" },
  "Changchun": { ja: "長春", zh: "長春" },
  "Bengaluru": { ja: "ベンガルール", zh: "班加羅爾" },
  "Brunei": { ja: "ブルネイ", zh: "汶萊" },
  "Caticlan": { ja: "カティクラン(ボラカイ)", zh: "卡蒂克蘭(長灘島)" },
  "Airai": { ja: "アイライ(パラオ)", zh: "艾萊(帛琉)" },
  
  // North America
  "New York": { ja: "ニューヨーク", zh: "紐約" },
  "Los Angeles": { ja: "ロサンゼルス", zh: "洛杉磯" },
  "San Francisco": { ja: "サンフランシスコ", zh: "舊金山" },
  "Chicago": { ja: "シカゴ", zh: "芝加哥" },
  "Seattle": { ja: "シアトル", zh: "西雅圖" },
  "Washington": { ja: "ワシントンD.C.", zh: "華盛頓" },
  "Washington, D.C.": { ja: "ワシントンD.C.", zh: "華盛頓" },
  "Honolulu": { ja: "ホノルル", zh: "檀香山" },
  "Vancouver": { ja: "バンクーバー", zh: "溫哥華" },
  "Toronto": { ja: "トロント", zh: "多倫多" },
  "Montreal": { ja: "モントリオール", zh: "蒙特婁" },
  "Dallas-Fort Worth": { ja: "ダラス", zh: "達拉斯" },
  "Dallas": { ja: "ダラス", zh: "達拉斯" },
  "Houston": { ja: "ヒューストン", zh: "休士頓" },
  "Atlanta": { ja: "アトランタ", zh: "亞特蘭大" },
  "Detroit": { ja: "デトロイト", zh: "底特律" },
  "Boston": { ja: "ボストン", zh: "波士頓" },
  "Miami": { ja: "マイアミ", zh: "邁阿密" },
  "Las Vegas": { ja: "ラスベガス", zh: "拉斯維加斯" },
  "Orlando": { ja: "オーランド", zh: "奧蘭多" },
  "Denver": { ja: "デンバー", zh: "丹佛" },
  "Indianapolis": { ja: "インディアナポリス", zh: "印第安納波利斯" },
  "Anchorage": { ja: "アンカレジ", zh: "安克拉治" },
  "Monterrey": { ja: "モンテレイ", zh: "蒙特雷" },
  "Mexico City": { ja: "メキシコシティ", zh: "墨西哥城" },
  "Cancun": { ja: "カンクン", zh: "坎昆" },
  "Minneapolis": { ja: "ミネアポリス", zh: "明尼亞波利斯" },
  "Cincinnati": { ja: "シンシナティ", zh: "辛辛那提" },
  "Oakland": { ja: "オークランド(米カリフォルニア)", zh: "奧克蘭(美加州)" },
  "Newark": { ja: "ニューアーク", zh: "紐華克" },
  "San Diego": { ja: "サンディエゴ", zh: "聖地牙哥(美加州)" },
  "Phoenix": { ja: "フェニックス", zh: "鳳凰城" },
  "Calgary": { ja: "カルガリー", zh: "卡加利" },
  "Ontario": { ja: "オンタリオ(米カリフォルニア)", zh: "安大略(美加州)" },
  
  // Central & South America
  "Panama City": { ja: "パナマシティ", zh: "巴拿馬市" },
  "San Salvador": { ja: "サンサルバドル", zh: "聖薩爾瓦多" },
  "Guatemala City": { ja: "グアテマラシティ", zh: "瓜地馬拉市" },
  "Bogota": { ja: "ボゴタ", zh: "波哥大" },
  "Medellin": { ja: "メデジン", zh: "麥德林" },
  "Quito": { ja: "キト", zh: "基多" },
  "Guayaquil": { ja: "グアヤキル", zh: "瓜亞基爾" },
  "Lima": { ja: "リマ", zh: "利馬" },
  "Sao Paulo": { ja: "サンパウロ", zh: "聖保羅" },
  "Rio de Janeiro": { ja: "リオデジャネイロ", zh: "里約熱內盧" },
  "Buenos Aires": { ja: "ブエノスアイレス", zh: "布宜諾斯艾利斯" },
  "Santiago": { ja: "サンティアゴ", zh: "聖地牙哥(智利)" },
  
  // Europe
  "London": { ja: "ロンドン", zh: "倫敦" },
  "Paris": { ja: "パリ", zh: "巴黎" },
  "Frankfurt": { ja: "フランクフルト", zh: "法蘭克福" },
  "Munich": { ja: "ミュンヘン", zh: "慕尼黑" },
  "Berlin": { ja: "ベルリン", zh: "柏林" },
  "Amsterdam": { ja: "アムステルダム", zh: "阿姆斯特丹" },
  "Zurich": { ja: "チューリッヒ", zh: "蘇黎世" },
  "Geneva": { ja: "ジュネーブ", zh: "日內瓦" },
  "Rome": { ja: "ローマ", zh: "羅馬" },
  "Milan": { ja: "ミラノ", zh: "米蘭" },
  "Madrid": { ja: "マドリード", zh: "馬德里" },
  "Barcelona": { ja: "バルセロナ", zh: "巴塞隆納" },
  "Helsinki": { ja: "ヘルシンキ", zh: "赫爾辛基" },
  "Vienna": { ja: "ウィーン", zh: "維也納" },
  "Copenhagen": { ja: "コペンハーゲン", zh: "哥本哈根" },
  "Stockholm": { ja: "ストックホルム", zh: "斯德哥爾摩" },
  "Oslo": { ja: "オスロ", zh: "奧斯陸" },
  "Istanbul": { ja: "イスタンブール", zh: "伊斯坦堡" },
  "Athens": { ja: "アテネ", zh: "雅典" },
  "Lisbon": { ja: "リスボン", zh: "里斯本" },
  "Leipzig": { ja: "ライプツィヒ", zh: "萊比錫" },
  "Prague": { ja: "プラハ", zh: "布拉格" },
  "Budapest": { ja: "ブダペスト", zh: "布達佩斯" },
  "Warsaw": { ja: "ワルシャワ", zh: "華沙" },
  
  // Oceania
  "Sydney": { ja: "シドニー", zh: "雪梨" },
  "Melbourne": { ja: "メルボルン", zh: "墨爾本" },
  "Brisbane": { ja: "ブリスベン", zh: "布里斯本" },
  "Perth": { ja: "パース", zh: "伯斯" },
  "Auckland": { ja: "オークランド(NZ)", zh: "奧克蘭(紐)" },
  "Cairns": { ja: "ケアンズ", zh: "凱恩斯" },
  "Gold Coast": { ja: "ゴールドコースト", zh: "黃金海岸" },
  "Noumea": { ja: "ヌメア", zh: "努美阿" },
  "Adelaide": { ja: "アデレード", zh: "阿得雷德" },
  "Christchurch": { ja: "クライストチャーチ", zh: "基督城" },
  "Nadi": { ja: "ナンディ", zh: "楠迪" },
  "Saipan": { ja: "サイパン", zh: "塞班島" },
  
  // Middle East & Africa
  "Dubai": { ja: "ドバイ", zh: "杜拜" },
  "Doha": { ja: "ドーハ", zh: "杜哈" },
  "Abu Dhabi": { ja: "アブダビ", zh: "阿布達比" },
  "Tel Aviv": { ja: "テルアビブ", zh: "特拉維夫" },
  "Cairo": { ja: "カイロ", zh: "開羅" },
  "Johannesburg": { ja: "ヨハネスブルグ", zh: "約翰尼斯堡" },
  "Cape Town": { ja: "ケープタウン", zh: "開普敦" },
  "Nairobi": { ja: "ナイロビ", zh: "奈洛比" },

  // Auto-added missing translations
  "Nanki Shirahama": { ja: "南紀白浜", zh: "南紀白濱" },
  "Nankoku": { ja: "南国(高知)", zh: "南國(高知)" },
  "Sakata": { ja: "酒田(庄内)", zh: "酒田(庄內)" },
  "Misawa": { ja: "三沢", zh: "三澤" },
  "Abidjan": { ja: "アビジャン", zh: "阿必尚" },
  "Angeles City": { ja: "アンヘレス(クラーク)", zh: "安吉利斯(克拉克)" },
  "Belgrade": { ja: "ベオグラード", zh: "貝爾格勒" },
  "Bern": { ja: "ベルン", zh: "伯恩" },
  "Bilbao": { ja: "ビルバオ", zh: "畢爾包" },
  "Birmingham": { ja: "バーミンガム", zh: "伯明罕" },
  "Bologna": { ja: "ボローニャ", zh: "波隆那" },
  "Bordeaux": { ja: "ボルドー", zh: "波爾多" },
  "Brindisi": { ja: "ブリンディジ", zh: "布林迪西" },
  "Brussels": { ja: "ブリュッセル", zh: "布魯塞爾" },
  "Buffalo": { ja: "バッファロー", zh: "水牛城" },
  "Cagliari": { ja: "カリアリ", zh: "卡利亞里" },
  "Cheongju": { ja: "清州", zh: "清州" },
  "Cleveland": { ja: "クリーブランド", zh: "克里夫蘭" },
  "Daegu": { ja: "大邱", zh: "大邱" },
  "Delhi": { ja: "デリー", zh: "德里" },
  "Dresden": { ja: "ドレスデン", zh: "德勒斯登" },
  "Dublin": { ja: "ダブリン", zh: "都柏林" },
  "Dusseldorf": { ja: "デュッセルドルフ", zh: "杜塞道夫" },
  "Florence": { ja: "フィレンツェ", zh: "佛羅倫斯" },
  "Funchal": { ja: "フンシャル", zh: "豐沙爾" },
  "Fuzhou": { ja: "福州", zh: "福州" },
  "Georgetown": { ja: "ジョージタウン", zh: "喬治市" },
  "Gothenburg": { ja: "ヨーテボリ", zh: "哥德堡" },
  "Gran Canaria": { ja: "グラン・カナリア", zh: "大加那利" },
  "Graz": { ja: "グラーツ", zh: "格拉茨" },
  "Guam": { ja: "グアム", zh: "關島" },
  "Hamburg": { ja: "ハンブルク", zh: "漢堡" },
  "Heraklion": { ja: "イラクリオン", zh: "伊拉克利翁" },
  "Hurghada": { ja: "フルガダ", zh: "赫爾格達" },
  "Ibiza": { ja: "イビサ", zh: "伊比薩" },
  "Ithaca": { ja: "イサカ", zh: "伊薩卡" },
  "Jacksonville": { ja: "ジャクソンビル", zh: "傑克遜維爾" },
  "Kefalonia": { ja: "ケファロニア", zh: "凱法利尼亞" },
  "Kilimanjaro": { ja: "キリマンジャロ", zh: "吉力馬札羅" },
  "Kingston": { ja: "キングストン", zh: "京斯敦" },
  "Kos": { ja: "コス", zh: "科斯" },
  "Lamezia Terme": { ja: "ラメツィア・テルメ", zh: "拉梅齊亞泰爾梅" },
  "Ljubljana": { ja: "リュブリャナ", zh: "盧比安納" },
  "Louisville": { ja: "ルイビル", zh: "路易維爾" },
  "Luxembourg": { ja: "ルクセンブルク", zh: "盧森堡" },
  "Malaga": { ja: "マラガ", zh: "馬拉加" },
  "Manchester": { ja: "マンチェスター", zh: "曼徹斯特" },
  "Memphis": { ja: "メンフィス", zh: "曼菲斯" },
  "Naples": { ja: "ナポリ", zh: "拿坡里" },
  "Nice": { ja: "ニース", zh: "尼斯" },
  "Ohrid": { ja: "オフリド", zh: "奧赫里德" },
  "Palermo": { ja: "パレルモ", zh: "巴勒摩" },
  "Palma de Mallorca": { ja: "パルマ・デ・マヨルカ", zh: "帕爾馬(馬約卡)" },
  "Pisa": { ja: "ピサ", zh: "比薩" },
  "Pittsburgh": { ja: "ピッツバーグ", zh: "匹茲堡" },
  "Portland": { ja: "ポートランド", zh: "波特蘭" },
  "Porto": { ja: "ポルト", zh: "波多" },
  "Pristina": { ja: "プリシュティナ", zh: "普里斯提納" },
  "Providence": { ja: "プロビデンス", zh: "普洛威頓斯" },
  "Raleigh-Durham": { ja: "ローリー・ダーラム", zh: "羅利-達勒姆" },
  "Reykjavik": { ja: "レイキャビク", zh: "雷克雅維克" },
  "Rhodes": { ja: "ロードス", zh: "羅得斯" },
  "Rochester": { ja: "ロチェスター", zh: "羅徹斯特" },
  "San Juan": { ja: "サンフアン", zh: "聖胡安" },
  "Santiago de los Caballeros": { ja: "サンティアゴ・デ・ロス・カバリェロス", zh: "聖地牙哥-德洛斯卡巴耶羅斯" },
  "Santo Domingo": { ja: "サントドミンゴ", zh: "聖多明哥" },
  "Shannon": { ja: "シャノン", zh: "夏儂" },
  "Shenzhen": { ja: "深圳", zh: "深圳" },
  "Sofia": { ja: "ソフィア", zh: "索菲亞" },
  "Split": { ja: "スプリト", zh: "斯普利特" },
  "Stuttgart": { ja: "シュトゥットガルト", zh: "斯圖加特" },
  "Syracuse": { ja: "シラキュース", zh: "雪城" },
  "Tashkent": { ja: "タシュケント", zh: "塔什干" },
  "Tenerife": { ja: "テネリフェ", zh: "特內里費" },
  "Thessaloniki": { ja: "テッサロニキ", zh: "塞薩洛尼基" },
  "Tianjin": { ja: "天津", zh: "天津" },
  "Tirana": { ja: "ティラナ", zh: "地拉那" },
  "Tromso": { ja: "トロムソ", zh: "特羅姆瑟" },
  "Ulaanbaatar": { ja: "ウランバートル", zh: "烏蘭巴托" },
  "Valencia": { ja: "バレンシア", zh: "瓦倫西亞" },
  "Venice": { ja: "ベネチア", zh: "威尼斯" },
  "Windsor Locks": { ja: "ウィンザーロックス", zh: "溫莎洛克斯" },
  "Xiamen": { ja: "アモイ", zh: "廈門" },
};

/**
 * Format a Date as HH:mm in the *airport's* local time.
 *
 * A departure board shows the time at the airport, which is not this machine's
 * timezone -- Taipei runs an hour behind Tokyo. Shifting the UTC instant by the
 * airport's offset and then reading it back in UTC gives that local clock
 * without depending on where the widget happens to be running.
 *
 * @param {Date} date
 * @param {number} utcOffset seconds east of UTC at the airport
 */
function formatTime(date, utcOffset) {
  if (!date) return '';
  const offset = Number.isFinite(utcOffset) ? utcOffset : 0;
  const shifted = new Date(date.getTime() + offset * 1000);
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Render flights to the DOM
 */
function renderFlights(flights) {
  flightListEl.innerHTML = '';
  
  if (!flights || flights.length === 0) {
    showMessage('No flights available\n' + t().noFlights);
    return;
  }
  
  const currentAirportCode = airportSelectEl.value;
  const currentCountry = airportCountries[currentAirportCode];
  const filterMode = filterSelectEl.value; // 'all', 'domestic', 'international'
  
  // Apply filter
  const filteredFlights = flights.filter(flight => {
    if (filterMode === 'all') return true;
    
    // If we don't have country info, show it in both to be safe
    if (!flight.destinationCountry || !currentCountry) return true;
    
    const isDomestic = (flight.destinationCountry === currentCountry);
    if (filterMode === 'domestic') return isDomestic;
    if (filterMode === 'international') return !isDomestic;
    
    return true;
  });

  if (filteredFlights.length === 0) {
    showMessage('No matching flights\n' + t().noMatch);
    return;
  }

  filteredFlights.forEach(flight => {
    // Clone template
    const clone = template.content.cloneNode(true);
    const rowEl = clone.querySelector('.flight-row');

    // Add yellow dot indicator class if changed
    if (flight.estimatedTime) {
      rowEl.classList.add('has-changed');
    }

    // Schedule Time
    clone.querySelector('.schedule-time').textContent = formatTime(flight.scheduleTime, flight.utcOffset);
    
    // Estimated Time
    const estTimeEl = clone.querySelector('.estimated-time');
    if (flight.estimatedTime) {
      estTimeEl.textContent = formatTime(flight.estimatedTime, flight.utcOffset);
    }

    // Destination (Translate and add IATA code)
    const enCity = flight.destination;
    const localCity = (cityNames[enCity] && cityNames[enCity][currentLang]) || enCity;
    const iataCode = flight.destinationSub;
    
    clone.querySelector('.dest-main').textContent = `${localCity} (${iataCode})`;
    clone.querySelector('.dest-sub').textContent = enCity !== localCity ? enCity : '';

    // Main Airline & Flight
    const mainFlightEl = clone.querySelector('.main-flight');
    const mainLogoEl = mainFlightEl.querySelector('.airline-logo');
    if (flight.airline.code) {
      mainLogoEl.src = `https://images.kiwi.com/airlines/64/${flight.airline.code}.png`;
      // Error fallback if logo is missing
      mainLogoEl.onerror = () => { mainLogoEl.style.display = 'none'; };
    } else {
      mainLogoEl.style.display = 'none';
    }

    mainFlightEl.querySelector('.flight-number').textContent = flight.flightNumber || '';

    // Codeshare Airline & Flight (if any)
    if (flight.codeshareAirline) {
      const codeshareFlightEl = clone.querySelector('.codeshare-flight');
      codeshareFlightEl.style.display = 'flex';
      
      const codeshareLogoEl = codeshareFlightEl.querySelector('.airline-logo');
      if (flight.codeshareAirline.code) {
        codeshareLogoEl.src = `https://images.kiwi.com/airlines/64/${flight.codeshareAirline.code}.png`;
        codeshareLogoEl.onerror = () => { codeshareLogoEl.style.display = 'none'; };
      } else {
        codeshareLogoEl.style.display = 'none';
      }

      codeshareFlightEl.querySelector('.flight-number').textContent = flight.codeshareNumber || '';
    }

    // Terminal
    clone.querySelector('.terminal-text').textContent = flight.terminal;

    // Gate
    clone.querySelector('.gate-text').textContent = flight.gate;

    // Append to list
    flightListEl.appendChild(clone);
  });
}

/**
 * Main update loop
 */
function showMessage(text, isError) {
  flightListEl.innerHTML = '';
  const el = document.createElement('div');
  el.className = isError ? 'board-message error' : 'board-message';
  el.textContent = text;
  flightListEl.appendChild(el);
}

async function updateBoard() {
  try {
    const flights = await provider.fetchFlights();
    renderFlights(flights);
  } catch (error) {
    console.error('Failed to fetch flight data:', error);
    showMessage(
      t().error + '\n' + (error && error.message ? error.message : error),
      true
    );
  }
}

// Event Listeners
airportSelectEl.addEventListener('change', async (e) => {
  const newAirport = e.target.value;
  provider.setAirport(newAirport);
  
  // Show loading state
  showMessage('Loading flights...\n' + t().loading);

  await provider.init();
  updateBoard();
});

modeSelectEl.addEventListener('change', async (e) => {
  const newMode = e.target.value;
  provider.setMode(newMode);
  applyLabels();

  showMessage('Loading flights...\n' + t().loading);

  await provider.init();
  updateBoard();
});

filterSelectEl.addEventListener('change', () => {
  // Re-render immediately without fetching
  renderFlights(provider.flights);
});

// Settings panel (the gear); currently just the display language
function toggleSettings(open) {
  settingsPanelEl.hidden = !(open !== undefined ? open : settingsPanelEl.hidden);
}

settingsIconEl.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSettings();
});

// Clicks inside the panel must not reach the close-on-outside-click handler
settingsPanelEl.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => toggleSettings(false));

settingsPanelEl.querySelectorAll('input[name="lang"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    currentLang = radio.value;
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
    applyLabels();
    // City names are baked into the rows, so redraw from what we already have
    renderFlights(provider.flights);
  });
});

// Close the widget (frameless window has no title bar)
function closeWidget() {
  window.close();
}

closeButtonEl.addEventListener('click', closeWidget);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeWidget();
});

// Initialization
async function init() {
  // Sync the initial value of the selects with the provider
  provider.setAirport(airportSelectEl.value);
  provider.setMode(modeSelectEl.value);
  const activeRadio = settingsPanelEl.querySelector(`input[name="lang"][value="${currentLang}"]`);
  if (activeRadio) activeRadio.checked = true;
  applyLabels();
  showMessage('Loading flights...\n' + t().loading);
  await provider.init();
  updateBoard();
  
  // Update board every 10 minutes to prevent API rate limiting
  setInterval(updateBoard, 600000);
}

init();
