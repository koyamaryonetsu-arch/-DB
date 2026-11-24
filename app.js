(function () {
  'use strict';

  const STORAGE_KEY = 'tohoCasesV1';
  const HISTORY_KEY = 'tohoHistoryV1';
  const AUTH_KEY = 'tohoAuthV1';
  const TEAM_KEY = 'tohoTeamV1';
  const COMPANY_KEY = 'tohoCompaniesV1';
  const THEATER_MASTER_KEY = 'tohoTheaterMasterV1';

  // 会社（顧客）と劇場名表示用の略称。name=正式名 / abbr=略称
  // 各社の officialName / hqAddress は「請求書・完了届の宛先と住所」に使われる。
  // 値はベストエフォート（公開情報に基づく初期値）。客先マスター画面から編集できる。
  const DEFAULT_COMPANIES = [
    { name: 'TOHOシネマズ',       abbr: 'TOHO',   officialName: 'TOHOシネマズ株式会社',         hqAddress: '東京都千代田区有楽町1-2-2 東宝日比谷ビル' },
    { name: '109シネマズ',        abbr: '109',    officialName: '株式会社東急レクリエーション', hqAddress: '東京都渋谷区道玄坂2-29-5 渋谷プライム' },
    { name: 'ユナイテッドシネマ', abbr: 'UC',     officialName: 'ユナイテッド・シネマ株式会社', hqAddress: '東京都港区台場1-7-1 アクアシティお台場5F' },
    { name: '佐々木興業',         abbr: 'CS',     officialName: '佐々木興業株式会社',           hqAddress: '東京都豊島区東池袋1-30-3 大正堂ビル' },
    { name: 'コロナワールド',     abbr: 'コロナ', officialName: '株式会社コロナワールド',       hqAddress: '愛知県小牧市東田中1227' },
    { name: 'MOVIX',              abbr: 'MV',     officialName: '株式会社松竹マルチプレックスシアターズ', hqAddress: '東京都中央区築地4-1-1 松竹本社' },
    { name: 'イオンシネマズ',     abbr: 'イオン', officialName: 'イオンエンターテイメント株式会社',       hqAddress: '千葉県千葉市美浜区中瀬1-5-1 幕張テクノガーデンB棟' },
    { name: 'シネマサンシャイン', abbr: 'SS',     officialName: '佐々木興業株式会社',           hqAddress: '東京都豊島区東池袋1-30-3 大正堂ビル' },
    // 109シネマズの劇場以外（ほかの事業部）の仕事（小山さん 2026-11-15）
    { name: '東急レクリエーション', abbr: '東レク', officialName: '株式会社東急レクリエーション', hqAddress: '東京都渋谷区道玄坂2-29-5 渋谷プライム' },
    // 小さい取引先をまとめて入れる用。案件が増えたら個別の会社として登録し直す
    { name: 'その他',             abbr: 'その他', officialName: '',                             hqAddress: '' }
  ];
  const CATEGORIES = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'タスク', 'その他'];
  // 色判定を除外するカテゴリ
  const NO_COLOR_CATEGORIES = new Set(['更新案件', 'その他']);
  // 完了以降のステータス（黄/赤の遅延色を解除して通常表示に戻す）
  const NO_COLOR_STATUSES = new Set(['対応済み', '完了', '請求済', '入金済', '他社対応']);
  const DEFAULT_MARGIN_RATE = 20;
  // 経営集計のデフォルトチームと配分ルール
  const DEFAULT_TEAM = ['小山', '細萱', '大和', '山口', '金子', '若山', '伊藤', '藤村', '山本'];
  const EXCLUDED_FROM_BASE = '山本'; // 一律5%対象外
  const SMALL_CASE_THRESHOLD = 3000000;
  const BASE_RATE = 5; // %
  const PRIVILEGED_DOMAIN = 'ryonetsu.com';
  // 打合せモード（このタブの中だけ）。くわしくは meetingActive() のところ
  const MEETING_KEY = 'meetingModeV1';
  let meetingHiddenLocal = [];   // テストモードの打合せモードで、画面に渡していない案件（保存の時に戻す）
  let meetingCompany = (() => { try { return sessionStorage.getItem(MEETING_KEY) || ''; } catch (e) { return ''; } })();

  // 客先ドメイン → その客先が見られる会社。ここに足すだけで新しい客先を追加できる。
  const CUSTOMER_DOMAIN_COMPANY = {
    'tohocinemas.co.jp': 'TOHOシネマズ',
    'tokyu-rec.co.jp': '109シネマズ',        // 東急レクリエーション（109シネマズ運営）
    'unitedcinemas.co.jp': 'ユナイテッドシネマ'
  };
  // 自己サインアップを許可するドメイン（DB側トリガーでも同一の制限を強制）
  const ALLOWED_SIGNUP_DOMAINS = ['ryonetsu.com'].concat(Object.keys(CUSTOMER_DOMAIN_COMPANY));

  // 役割別ラベル: 受注者(ryonetsu) ↔ 発注者(客先: TOHO/109/UC 共通)
  const ROLE_STATUS = {
    ryo:  { '見積り提出済': '見積り提出済', '請求済': '請求済',          '入金済': '入金済' },
    toho: { '見積り提出済': '見積り受領済', '請求済': '請求書受領済',    '入金済': '支払済', '失注': '他社依頼', '客先対応中': '協議中' }
  };
  // 客先ごとの「客先担当者」表示名（TC担当者 の置換）
  // 客先ログインでは略称を使わず、会社名をそのまま使う（TC→TOHOシネマズ 等の表記ゆれ防止）
  function customerLabel(suffix) { return (customerCompany(currentUser) || '客先') + suffix; }
  // 顧客メモの表示名は customerMemoLabel()（客先＝会社名＋メモ／菱熱＝顧客メモ）
  // 客先に渡してよい cases のカラム（社内情報 memo/advice_note/allocations/margin_rate/tasks/created_by/updated_by は除外）
  const CUSTOMER_CASE_COLUMNS = [
    'id', 'company', 'theater', 'received_date', 'tc_person', 'r_person', 'category', 'content',
    'survey_date', 'cert_number', 'estimate_name', 'estimate_amount', 'quote_date',
    'work_start_date', 'work_end_date', 'invoice_date', 'payment_date', 'status', 'status_override',
    'schedule_adjusting', 'payment_confirmed', 'survey_time', 'work_start_time', 'work_end_time',
    'customer_memo', 'last_update_source', 'created_at', 'updated_at', 'title',   // title=案件名（客先にも見せる）
    'survey_adjusting',   // 調査日調整中（客先にも「調整中」と出す）
    'origin', 'initial_report_at', 'due_exempt',   // 行の色（黄＝初動報告前・赤＝見積り遅れ。期日免除なら赤にしない）を客先の画面でも同じにする。免除の理由は渡さない
    'urgent', 'other_vendor', 'other_amount', 'other_rate'   // 🚩 緊急・他社案件（保守会社名・金額・利率）は TOHO にも見せる（2026-11-19）
  ].join(',');
  const STATUS_FILTER_OPTIONS_RYO  = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済'];
  const STATUS_FILTER_OPTIONS_TOHO = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済']; // values unchanged; labels swap
  // ステータス絞り込みの並び順（列フィルタで status を出す時の順序）
  const STATUS_FILTER_ORDER = ['受付','調査日調整中','見積り中','見積り提出済','日程調整中','作業中','対応済み','客先対応中','他社対応','請求済','入金済','保留','取り下げ','完了','失注'];
  // ログイン時に既定で非表示にするステータス（ステータス列のチェックボックスから外れた状態にする）。
  // 「全件表示」ボタンで一時的に全部見せられる。
  // トップ画で最初は隠す状態（「表示する状態 ▾」で1つずつ表示/非表示を切り替えられる）
  const DEFAULT_HIDDEN_STATUSES = ['完了', '対応済み', '請求済', '入金済', '取り下げ', '失注', '保留'];
  // 「終わった案件」＝タスクの件数・止まりの提案から外す状態（表示の切替とは別。対応済み・保留にもまだやるタスクがある）
  const CLOSED_FOR_TASKS = ['完了', '入金済', '取り下げ', '失注'];
  // 終了した案件（二重登録の判定では比較対象から外す）
  const TERMINAL_LIKE_STATUSES = new Set(['完了', '入金済', '取り下げ', '失注']);

  // 客先マスタ: 劇場の正式名称・親会社・住所
  // ※ 住所はベストエフォート（Claude学習データ）。運用前にマスター画面で要確認・修正。
  const DEFAULT_THEATER_MASTER = [
    // ===== TOHOシネマズ =====
    { name: 'TOHOシネマズ 日本橋',           company: 'TOHOシネマズ', address: '東京都中央区日本橋2-7-1 東京日本橋タワー' },
    { name: 'TOHOシネマズ 日比谷',           company: 'TOHOシネマズ', address: '東京都千代田区有楽町1-1-2 東京ミッドタウン日比谷' },
    { name: 'TOHOシネマズ シャンテ',         company: 'TOHOシネマズ', address: '東京都千代田区有楽町1-2-2' },
    { name: 'TOHOシネマズ 新宿',             company: 'TOHOシネマズ', address: '東京都新宿区歌舞伎町1-19-1' },
    { name: 'TOHOシネマズ 六本木ヒルズ',     company: 'TOHOシネマズ', address: '東京都港区六本木6-10-2 六本木ヒルズ ウエストウォーク' },
    { name: 'TOHOシネマズ 渋谷',             company: 'TOHOシネマズ', address: '東京都渋谷区道玄坂2-6-17 渋東シネタワー' },
    { name: 'TOHOシネマズ 上野',             company: 'TOHOシネマズ', address: '東京都台東区上野3-24-6 PARCO_ya上野' },
    { name: 'TOHOシネマズ 池袋',             company: 'TOHOシネマズ', address: '東京都豊島区東池袋1-30-3' },
    { name: 'TOHOシネマズ 西新井',           company: 'TOHOシネマズ', address: '東京都足立区西新井栄町1-20-1 アリオ西新井' },
    { name: 'TOHOシネマズ 錦糸町楽天地',     company: 'TOHOシネマズ', address: '東京都墨田区江東橋4-27-14 楽天地ビル' },
    { name: 'TOHOシネマズ 立川立飛',         company: 'TOHOシネマズ', address: '東京都立川市泉町500-3 ららぽーと立川立飛' },
    { name: 'TOHOシネマズ 府中',             company: 'TOHOシネマズ', address: '東京都府中市宮町1-41-2 くるるビル' },
    { name: 'TOHOシネマズ 南大沢',           company: 'TOHOシネマズ', address: '東京都八王子市南大沢2-25' },
    { name: 'TOHOシネマズ 八王子',           company: 'TOHOシネマズ', address: '東京都八王子市旭町1-10' },
    { name: 'TOHOシネマズ 海老名',           company: 'TOHOシネマズ', address: '神奈川県海老名市中央1-4-1 ビナウォーク' },
    { name: 'TOHOシネマズ ららぽーと横浜',   company: 'TOHOシネマズ', address: '神奈川県横浜市都筑区池辺町4035-1 ららぽーと横浜' },
    { name: 'TOHOシネマズ 川崎',             company: 'TOHOシネマズ', address: '神奈川県川崎市川崎区小川町4-1' },
    { name: 'TOHOシネマズ 上大岡',           company: 'TOHOシネマズ', address: '神奈川県横浜市港南区上大岡西1-6-1 ゆめおおおか' },
    { name: 'TOHOシネマズ 横浜みなとみらい', company: 'TOHOシネマズ', address: '神奈川県横浜市西区みなとみらい2-3-5' },
    { name: 'TOHOシネマズ ららぽーと船橋',   company: 'TOHOシネマズ', address: '千葉県船橋市浜町2-1-1 ららぽーとTOKYO-BAY' },
    { name: 'TOHOシネマズ 市川コルトンプラザ', company: 'TOHOシネマズ', address: '千葉県市川市鬼高1-1-1' },
    { name: 'TOHOシネマズ 流山おおたかの森', company: 'TOHOシネマズ', address: '千葉県流山市西初石6-185-2 流山おおたかの森S・C' },
    { name: 'TOHOシネマズ 柏',               company: 'TOHOシネマズ', address: '千葉県柏市柏2-7-1 柏髙島屋ステーションモール' },
    { name: 'TOHOシネマズ 浦和美園',         company: 'TOHOシネマズ', address: '埼玉県さいたま市緑区美園4-2-3 イオンモール浦和美園' },
    { name: 'TOHOシネマズ 上尾',             company: 'TOHOシネマズ', address: '埼玉県上尾市谷津2-1-1 アリオ上尾' },
    { name: 'TOHOシネマズ 川越マイン',       company: 'TOHOシネマズ', address: '埼玉県川越市新富町1-19-3 マイン' },
    { name: 'TOHOシネマズ ららぽーと富士見', company: 'TOHOシネマズ', address: '埼玉県富士見市山室1-1313 ららぽーと富士見' },
    { name: 'TOHOシネマズ 仙台',             company: 'TOHOシネマズ', address: '宮城県仙台市青葉区中央2-3-6 仙台フォーラス' },
    { name: 'TOHOシネマズ 名取',             company: 'TOHOシネマズ', address: '宮城県名取市杜せきのした5-3-1 イオンモール名取' },
    { name: 'TOHOシネマズ 宇都宮',           company: 'TOHOシネマズ', address: '栃木県宇都宮市馬場通り2-3-12 うつのみや表参道スクエア' },
    { name: 'TOHOシネマズ 宇都宮インターパーク', company: 'TOHOシネマズ', address: '栃木県宇都宮市インターパーク6-1-1 FKDインターパーク' },
    { name: 'TOHOシネマズ 高崎',             company: 'TOHOシネマズ', address: '群馬県高崎市栄町1-1 高崎オーパ' },
    { name: 'TOHOシネマズ 太田',             company: 'TOHOシネマズ', address: '群馬県太田市石原町81 イオンモール太田' },
    { name: 'TOHOシネマズ 日立',             company: 'TOHOシネマズ', address: '茨城県日立市鹿島町1-1-1' },
    { name: 'TOHOシネマズ 水戸内原',         company: 'TOHOシネマズ', address: '茨城県水戸市内原2-1 イオンモール水戸内原' },
    { name: 'TOHOシネマズ ひたちなか',       company: 'TOHOシネマズ', address: '茨城県ひたちなか市山ノ上町8-1' },
    { name: 'TOHOシネマズ 札幌',             company: 'TOHOシネマズ', address: '北海道札幌市中央区南2条西1丁目3 サッポロファクトリー' },
    { name: 'TOHOシネマズ すすきの',         company: 'TOHOシネマズ', address: '北海道札幌市中央区南3条西4' },
    { name: 'TOHOシネマズ 名古屋ベイシティ', company: 'TOHOシネマズ', address: '愛知県名古屋市港区港明2-3-2 名古屋ベイシティ' },
    { name: 'TOHOシネマズ 名古屋',           company: 'TOHOシネマズ', address: '愛知県名古屋市中村区平池町4-60-12 グローバルゲート' },
    { name: 'TOHOシネマズ 鈴鹿',             company: 'TOHOシネマズ', address: '三重県鈴鹿市庄野羽山4-1-2 イオンモール鈴鹿' },
    { name: 'TOHOシネマズ 岡崎',             company: 'TOHOシネマズ', address: '愛知県岡崎市戸崎町外山38-5 イオンモール岡崎' },
    { name: 'TOHOシネマズ 赤池',             company: 'TOHOシネマズ', address: '愛知県日進市赤池1-1812 プライムツリー赤池' },
    { name: 'TOHOシネマズ 二条',             company: 'TOHOシネマズ', address: '京都府京都市中京区西ノ京栂尾町107 BiVi二条' },
    { name: 'TOHOシネマズ なんば',           company: 'TOHOシネマズ', address: '大阪府大阪市中央区難波3-8-9' },
    { name: 'TOHOシネマズ 梅田',             company: 'TOHOシネマズ', address: '大阪府大阪市北区角田町7-10 HEP NAVIO' },
    { name: 'TOHOシネマズ 西宮OS',           company: 'TOHOシネマズ', address: '兵庫県西宮市高松町14-2 阪急西宮ガーデンズ' },
    { name: 'TOHOシネマズ くずはモール',     company: 'TOHOシネマズ', address: '大阪府枚方市楠葉花園町15-1 くずはモール' },
    { name: 'TOHOシネマズ 伊丹',             company: 'TOHOシネマズ', address: '兵庫県伊丹市藤ノ木1-1-1 イオンモール伊丹' },
    { name: 'TOHOシネマズ ららぽーと甲子園', company: 'TOHOシネマズ', address: '兵庫県西宮市甲子園八番町1-100 ららぽーと甲子園' },
    { name: 'TOHOシネマズ 緑井',             company: 'TOHOシネマズ', address: '広島県広島市安佐南区緑井5-26-22 フジグラン緑井' },
    { name: 'TOHOシネマズ 広島',             company: 'TOHOシネマズ', address: '広島県広島市南区皆実町2-8-17 ゆめタウン広島' },
    { name: 'TOHOシネマズ 高松',             company: 'TOHOシネマズ', address: '香川県高松市常磐町1-3-1 瓦町FLAG' },
    { name: 'TOHOシネマズ 福岡キャナルシティ', company: 'TOHOシネマズ', address: '福岡県福岡市博多区住吉1-2-1 キャナルシティ博多' },
    { name: 'TOHOシネマズ ららぽーと福岡',   company: 'TOHOシネマズ', address: '福岡県福岡市博多区那珂6-23-1 ららぽーと福岡' },
    { name: 'TOHOシネマズ 天神',             company: 'TOHOシネマズ', address: '福岡県福岡市中央区天神2-11-3 ソラリアステージ' },
    { name: 'TOHOシネマズ 熊本サクラマチ',   company: 'TOHOシネマズ', address: '熊本県熊本市中央区桜町3-10 サクラマチクマモト' },
    { name: 'TOHOシネマズ 鹿児島',           company: 'TOHOシネマズ', address: '鹿児島県鹿児島市与次郎1-9-9' },
    { name: 'TOHOシネマズ 沖縄ライカム',     company: 'TOHOシネマズ', address: '沖縄県中頭郡北中城村ライカム1番地 イオンモール沖縄ライカム' },
    { name: 'TOHOシネマズ ファボーレ富山',   company: 'TOHOシネマズ', address: '富山県富山市婦中町下轡田165-1 ファボーレ' },

    // ===== 109シネマズ =====
    { name: '109シネマズ 川崎',              company: '109シネマズ', address: '神奈川県川崎市川崎区小川町4-1 ラ チッタデッラ' },
    { name: '109シネマズ 二子玉川',          company: '109シネマズ', address: '東京都世田谷区玉川1-14-1 二子玉川ライズS.C.' },
    { name: '109シネマズ 木場',              company: '109シネマズ', address: '東京都江東区木場1-5-30 イトーヨーカドー木場' },
    { name: '109シネマズ 名古屋',            company: '109シネマズ', address: '愛知県名古屋市東区東桜1-1-1 アーバンネット名古屋ビル' },
    { name: '109シネマズ 大阪エキスポシティ', company: '109シネマズ', address: '大阪府吹田市千里万博公園2-1 ららぽーとEXPOCITY' },
    { name: '109シネマズ HAT神戸',           company: '109シネマズ', address: '兵庫県神戸市中央区脇浜海岸通2-2-2' },
    { name: '109シネマズ 港北',              company: '109シネマズ', address: '神奈川県横浜市都筑区中川中央1-31-1 ノースポート・モール' },
    { name: '109シネマズ 湘南',              company: '109シネマズ', address: '神奈川県藤沢市辻堂神台1-3-1 テラスモール湘南' },
    { name: '109シネマズ 富谷',              company: '109シネマズ', address: '宮城県富谷市大清水1-33-1 イオンモール富谷' },
    { name: '109シネマズ 高崎',              company: '109シネマズ', address: '群馬県高崎市棟高町1400 イオンモール高崎' },
    { name: '109シネマズ 佐野',              company: '109シネマズ', address: '栃木県佐野市富岡町2-2 イオンモール佐野新都市' },
    { name: '109シネマズ 菖蒲',              company: '109シネマズ', address: '埼玉県久喜市菖蒲町菖蒲6005-1 モラージュ菖蒲' },
    { name: '109シネマズ 四日市',            company: '109シネマズ', address: '三重県四日市市安島1-3-31 近鉄四日市駅前' },
    { name: '109シネマズ グランベリーパーク', company: '109シネマズ', address: '東京都町田市鶴間3-3-1 グランベリーパーク' },
    { name: '109シネマズ 広島',              company: '109シネマズ', address: '広島県広島市西区扇2-1-45 LECT' },
    { name: '109シネマズ 福山',              company: '109シネマズ', address: '広島県福山市入船町3-1-60 リム・ふくやま' },

    // ===== ユナイテッドシネマ =====
    { name: 'ユナイテッドシネマ豊洲',        company: 'ユナイテッドシネマ', address: '東京都江東区豊洲2-4-9 アーバンドック ららぽーと豊洲' },
    { name: 'ユナイテッドシネマ アクアシティお台場', company: 'ユナイテッドシネマ', address: '東京都港区台場1-7-1 アクアシティお台場' },
    { name: 'ユナイテッドシネマ浦和',        company: 'ユナイテッドシネマ', address: '埼玉県さいたま市浦和区高砂1-12-1 浦和パルコ' },
    { name: 'ユナイテッドシネマ岸和田',      company: 'ユナイテッドシネマ', address: '大阪府岸和田市港緑町1-1 岸和田カンカンベイサイドモール' },
    { name: 'ユナイテッドシネマ橿原',        company: 'ユナイテッドシネマ', address: '奈良県橿原市曲川町7-20-1 イオンモール橿原' },
    { name: 'ユナイテッドシネマ春日部',      company: 'ユナイテッドシネマ', address: '埼玉県春日部市下柳420-1 イオンモール春日部' },
    { name: 'ユナイテッドシネマ岡崎',        company: 'ユナイテッドシネマ', address: '愛知県岡崎市戸崎町外山38-5 イオンモール岡崎' },
    { name: 'ユナイテッドシネマ稲毛',        company: 'ユナイテッドシネマ', address: '千葉県千葉市稲毛区長沼原町731-17 ワンズモール' },
    { name: 'ユナイテッドシネマ熊本',        company: 'ユナイテッドシネマ', address: '熊本県熊本市東区上南部2-2-2 ゆめタウン光の森' },
    { name: 'ユナイテッドシネマ南砂',        company: 'ユナイテッドシネマ', address: '東京都江東区新砂3-4-31 SUNAMO' },
    { name: 'ユナイテッドシネマ前橋',        company: 'ユナイテッドシネマ', address: '群馬県前橋市文京町2-1-1 けやきウォーク前橋' },
    { name: 'ユナイテッドシネマ水戸',        company: 'ユナイテッドシネマ', address: '茨城県水戸市東原3-1-1 水戸内原ロード' },
    { name: 'ユナイテッドシネマ札幌',        company: 'ユナイテッドシネマ', address: '北海道札幌市中央区南3条西4 ノルベサ' },
    { name: 'ユナイテッドシネマ長崎',        company: 'ユナイテッドシネマ', address: '長崎県長崎市みなとメディカルセンター近隣' },

    // ===== 佐々木興業（シネマサンシャイン運営） =====
    // ※ cinemasunshine.co.jp 掲載の劇場は要追加。下記は学習データ基準のベストエフォート
    { name: 'シネマサンシャイン平和島',          company: '佐々木興業', address: '東京都大田区平和島1-1-1 BIGFUN平和島' },
    { name: 'シネマサンシャイン池袋',            company: '佐々木興業', address: '東京都豊島区東池袋1-30-3 大正堂ビル' },
    { name: 'シネマサンシャイン土浦',            company: '佐々木興業', address: '茨城県土浦市上高津367 イオンモール土浦' },
    { name: 'シネマサンシャインかほく',          company: '佐々木興業', address: '石川県かほく市内日角タ27 イオンモールかほく' },
    { name: 'シネマサンシャイン大和郡山',        company: '佐々木興業', address: '奈良県大和郡山市下三橋町741 イオンモール大和郡山' },
    { name: 'シネマサンシャイン姶良',            company: '佐々木興業', address: '鹿児島県姶良市東餅田533 イオンタウン姶良' },
    { name: 'シネマサンシャイン衣山',            company: '佐々木興業', address: '愛媛県松山市衣山4-1-2' },
    { name: 'シネマサンシャインエミフルMASAKI',  company: '佐々木興業', address: '愛媛県伊予郡松前町筒井850 エミフルMASAKI' },
    { name: 'シネマサンシャイン下関',            company: '佐々木興業', address: '山口県下関市伊倉新町3-1-45 ゆめシティ下関' },
    { name: 'シネマサンシャイン北島',            company: '佐々木興業', address: '徳島県板野郡北島町鯛浜西ノ須174 フジグラン北島' },
    { name: 'シネマサンシャイン延岡',            company: '佐々木興業', address: '宮崎県延岡市旭町2-1-26 イオンタウン延岡' },

    // ===== コロナワールド =====
    { name: '中川コロナシネマワールド',      company: 'コロナワールド', address: '愛知県名古屋市中川区下之一色町野立20' },
    { name: '春日井コロナシネマワールド',    company: 'コロナワールド', address: '愛知県春日井市町田町6-15-1 コロナワールド' },
    { name: '安城コロナシネマワールド',      company: 'コロナワールド', address: '愛知県安城市三河安城町1-22-3' },
    { name: '半田コロナシネマワールド',      company: 'コロナワールド', address: '愛知県半田市更生町3-127-2' },
    { name: '福山コロナシネマワールド',      company: 'コロナワールド', address: '広島県福山市東深津町4-25-15' },
    { name: '小田原コロナシネマワールド',    company: 'コロナワールド', address: '神奈川県小田原市前川219-4' },
    { name: '青森コロナシネマワールド',      company: 'コロナワールド', address: '青森県青森市浪館前田4-13-7' },
    { name: '大垣コロナシネマワールド',      company: 'コロナワールド', address: '岐阜県大垣市三塚町丹瀬463-1' }
  ];
  // 旧コードとの互換のため、劇場名リストも生成
  const DEFAULT_THEATERS = DEFAULT_THEATER_MASTER.map((t) => t.name);

  // ===== 劇場名の「表示用」短縮（地名だけにする） =====
  // データ自体は元の正式名のまま保持し、画面表示のときだけ会社名・施設の固有名詞を外す。
  // 会社ブランドの接頭辞は自動除去。施設名（六本木ヒルズ等）は地名へ個別マッピング。
  const THEATER_BRANDS = ['TOHOシネマズ', '109シネマズ', 'ユナイテッドシネマ', 'シネマサンシャイン', 'イオンシネマズ', 'イオンシネマ', 'MOVIX'];
  const THEATER_SHORT_OVERRIDE = {
    // --- TOHOシネマズ（施設名→地名）---
    'TOHOシネマズ 六本木ヒルズ': '六本木',
    'TOHOシネマズ 錦糸町楽天地': '錦糸町',
    'TOHOシネマズ 立川立飛': '立川',
    'TOHOシネマズ ららぽーと横浜': '横浜',
    'TOHOシネマズ 横浜みなとみらい': 'みなとみらい',
    'TOHOシネマズ ららぽーと船橋': '船橋',
    'TOHOシネマズ 市川コルトンプラザ': '市川',
    'TOHOシネマズ 流山おおたかの森': '流山',
    'TOHOシネマズ 川越マイン': '川越',
    'TOHOシネマズ ららぽーと富士見': '富士見',
    'TOHOシネマズ 宇都宮インターパーク': 'インターパーク',
    'TOHOシネマズ 水戸内原': '内原',
    'TOHOシネマズ 名古屋ベイシティ': 'ベイシティ',
    'TOHOシネマズ 西宮OS': '西宮',
    'TOHOシネマズ くずはモール': 'くずは',
    'TOHOシネマズ ららぽーと甲子園': '甲子園',
    'TOHOシネマズ 福岡キャナルシティ': 'キャナルシティ',
    'TOHOシネマズ ららぽーと福岡': '福岡',
    'TOHOシネマズ 熊本サクラマチ': '熊本',
    'TOHOシネマズ 沖縄ライカム': 'ライカム',
    'TOHOシネマズ ファボーレ富山': '富山',
    // --- 109シネマズ ---
    '109シネマズ 大阪エキスポシティ': 'エキスポシティ',
    '109シネマズ HAT神戸': '神戸',
    '109シネマズ グランベリーパーク': 'GP',
    // --- ユナイテッドシネマ ---
    'ユナイテッドシネマ アクアシティお台場': 'お台場',
    // --- 佐々木興業（シネマサンシャイン）---
    'シネマサンシャインエミフルMASAKI': '松前',
    'グランドシネマサンシャイン 池袋': 'GCS池袋',
    'TOHOシネマズ 錦糸町楽天地': '錦糸町楽天地',
    'TOHOシネマズ 錦糸町オリナス': '錦糸町オリナス',
    // --- コロナワールド（安城は2つ: 三河安城・ららぽーと安城）---
    '安城コロナシネマワールド': '三河安城',
    'シネマワールド ららぽーと安城': 'ららぽーと安城',
    'コロナシネマワールド 小牧': '小牧',
    // --- その他 ---
    'ディノスシネマズ苫小牧': '苫小牧',
    'ポレポレシネマズいわき小名浜': 'いわき小名浜',
    'ミッドランドシネマ名古屋空港': '名古屋空港',
    '福山エーガル8シネマズ': 'エーガル8'
  };
  // 施設名（商業施設）の接頭辞。劇場名が「施設名＋地名」のとき地名だけにする
  // 例: ららぽーと横浜→横浜 ／ サンストリート浜北→浜北
  const FACILITY_PREFIXES = [
    'ららぽーと', 'サンストリート', 'イオンモール', 'アリオ', 'プライムツリー', 'テラスモール',
    'ダイバーシティ東京', 'ダイバーシティ', 'モラージュ', 'ゆめタウン', 'フォレオ', 'パワーモール',
    'リバーウォーク', 'ピオニウォーク', 'マーケットスクエア', 'ウニクス', 'フェアモール'
  ];
  // 施設名接頭辞を外して地名だけにする（該当しなければそのまま）
  function stripFacilityPrefix(s) {
    s = String(s || '').trim();
    for (const f of FACILITY_PREFIXES) {
      if (s.startsWith(f) && s.length > f.length) return s.slice(f.length).trim();
    }
    return s;
  }
  // 劇場の一覧の「表示名」（theaters.short_name）。一覧が変わったら作り直す
  let tmShortCache = { src: null, map: null };
  function masterShortMap() {
    if (tmShortCache.src !== theaterMaster) {
      const map = new Map();
      (theaterMaster || []).forEach((t) => { if (t && t.name && t.shortName) map.set(t.name, t.shortName); });
      tmShortCache = { src: theaterMaster, map };
    }
    return tmShortCache.map;
  }
  function shortTheaterName(name) {
    if (!name) return '';
    const fromMaster = masterShortMap().get(name);
    if (fromMaster) return fromMaster;
    if (THEATER_SHORT_OVERRIDE[name]) return THEATER_SHORT_OVERRIDE[name];
    // コロナワールド系: 「○○コロナシネマワールド／○○コロナワールド」→ ○○
    const m = name.match(/^(.+?)コロナ(?:シネマワールド|ワールド)/);
    if (m) return m[1].trim();
    // 会社ブランドの接頭辞を除去（長い順に判定）
    let rest = name;
    for (const brand of THEATER_BRANDS) {
      if (name.startsWith(brand)) { rest = name.slice(brand.length).trim() || name; break; }
    }
    // ブランド除去後（またはブランド無しの生名）に施設名接頭辞が付いていれば地名だけに
    return stripFacilityPrefix(rest) || rest;
  }

  // ===== 打った・取り込んだ劇場名を、劇場の一覧の正式名（theaters.name）にそろえる =====
  // 短い名前（例「横浜」）・別の呼び方（aliases）・空白の違いで書いても、案件の会社の劇場に結びつける。
  // そろえ方（GAS の canonTheater_ ・ /api/theater-ai と同じ決まり＋表示名）:
  //   名前のゆれ → 別の呼び方 → 同じ会社の表示名 → 同じ会社で場所の名前が同じ → 片方に含まれ、合う劇場が1つだけ。合わなければそのまま
  const TM_BRANDS = [
    [/TOHO\s*(シネマズ|CINEMAS)?|東宝/i, ['TOHOシネマズ']],
    [/109\s*(シネマズ|CINEMAS)?/i, ['109シネマズ']],
    [/ユナイテッド[・･\s]*シネマ|UNITED\s*CINEMAS|シネプレックス|^CPX|^UC/i, ['ユナイテッドシネマ']],
    [/グランドシネマサンシャイン|シネマサンシャイン|CINEMA\s*SUNSHINE|^GCS|^CS/i, ['佐々木興業', 'シネマサンシャイン']],
    [/コロナ(シネマ)?ワールド|コロナシネマ/i, ['コロナワールド']],
    [/MOVIX|ムービックス/i, ['MOVIX']],
    [/イオンシネマ/i, ['イオンシネマズ']]
  ];
  const tmKey = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s　・･\-－ー（）()]/g, '');
  const tmPlace = (s) => {
    let t = String(s || '').normalize('NFKC');
    TM_BRANDS.forEach(([re]) => { t = t.replace(new RegExp(re.source, 'gi'), ''); });
    return tmKey(t.replace(/(シネマズ|シネマ|劇場|映画館)/g, ''));
  };
  function canonTheaterName(name, company) {
    const raw = String(name || '').trim();
    if (!raw) return raw;
    const list = (theaterMaster || []).filter((t) => t && t.name);
    if (list.some((t) => t.name === raw)) return raw;
    const k = tmKey(raw);
    const only = (arr) => { const u = Array.from(new Set(arr)); return u.length === 1 ? u[0] : ''; };
    let hit = only(list.filter((t) => tmKey(t.name) === k).map((t) => t.name)) ||
              only(list.filter((t) => (t.aliases || []).some((a) => tmKey(a) === k)).map((t) => t.name));
    if (hit) return hit;
    const b = TM_BRANDS.find(([re]) => re.test(raw.normalize('NFKC')));
    const cos = b ? b[1] : (company ? [company] : null);
    if (!cos) return raw;
    const same = list.filter((t) => cos.indexOf(t.company) !== -1);
    hit = only(same.filter((t) => tmKey(t.shortName || shortTheaterName(t.name)) === k).map((t) => t.name));
    if (hit) return hit;
    const pl = tmPlace(raw); if (pl.length < 2) return raw;
    const eq = same.filter((t) => tmPlace(t.name) === pl);
    if (eq.length === 1) return eq[0].name;
    if (eq.length > 1) return raw;
    const part = same.filter((t) => { const q = tmPlace(t.name); return q.length >= 2 && (q.indexOf(pl) !== -1 || pl.indexOf(q) !== -1); });
    return part.length === 1 ? part[0].name : raw;
  }
  // 入力欄に出す名前: 短い名前で書いても同じ劇場に戻る時だけ短い名前にする（複数の劇場などは、そのまま）
  function theaterForInput(name, company) {
    const s = shortTheaterName(name);
    return s && s !== name && canonTheaterName(s, company) === name ? s : (name || '');
  }

  const EDITABLE_FIELDS = {
    company:        { type: 'select',   dynamicOptions: 'company', privilegedOnly: true },
    theater:        { type: 'datalist', listId: 'theaterList' },
    receivedDate:   { type: 'date' },
    tcPerson:       { type: 'datalist', listId: 'tcPersonList' },
    rPerson:        { type: 'datalist', listId: 'rPersonList' },
    category:       { type: 'select',   options: [''].concat(CATEGORIES) },
    title:          { type: 'text',     readonlyForCustomer: true },
    content:        { type: 'popup',    readonlyForCustomer: true },
    surveyDate:     { type: 'date' },
    certNumber:     { type: 'text',     tohoOnly: true },
    estimateName:   { type: 'text' },
    estimateAmount: { type: 'number' },
    quoteDate:      { type: 'date' },
    workStartDate:  { type: 'date' },
    workEndDate:    { type: 'date' },
    invoiceDate:    { type: 'date' },
    paymentDate:    { type: 'date' },
    memo:           { type: 'popup', privilegedOnly: true },
    // 社内アドバイス: Plaud・LINE の記録が入る（AI の要約はしない・LINE 通知もしない・客先に見えない）
    adviceNote:     { type: 'popup', privilegedOnly: true },
    // 他社案件（既存の保守会社が対応）: 菱熱が入れる。TOHO には見えるだけ
    otherVendor:    { type: 'text',   privilegedOnly: true },
    otherAmount:    { type: 'number', privilegedOnly: true },
    otherRate:      { type: 'number', privilegedOnly: true },
    // 顧客メモ: 客先が記入。菱熱も閲覧・編集可（内容への要約対象外＝そのまま表示）
    customerMemo:   { type: 'popup' }
  };

  // ============================================================
  //  データストア抽象化: local(localStorage) ↔ supabase を切替
  //   - config.js で SUPABASE_CONFIG が定義され、?local=1 が無ければ Supabase モード
  // ============================================================
  const FIELD_MAP = {
    company: 'company', theater: 'theater', receivedDate: 'received_date',
    tcPerson: 'tc_person', rPerson: 'r_person', category: 'category', content: 'content',
    surveyDate: 'survey_date', certNumber: 'cert_number', estimateName: 'estimate_name',
    estimateAmount: 'estimate_amount', quoteDate: 'quote_date', workStartDate: 'work_start_date',
    workEndDate: 'work_end_date', invoiceDate: 'invoice_date', paymentDate: 'payment_date',
    marginRate: 'margin_rate', allocations: 'allocations', memo: 'memo'
  };
  // cases.customer_memo 列（顧客メモ: 客先記入・要約対象外）がDBに存在するか
  let customerMemoSupported = false;
  // cases.title 列（案件名）がDBに存在するか
  let titleSupported = false;
  // cases.purchases 列（支払い状況: 菱熱のみ・購買発行月/業者名/金額の配列）がDBに存在するか
  let purchasesSupported = false;
  // cases.last_update_source 列（通知の操作元 ryo/customer/auto）がDBに存在するか
  let lastUpdateSourceSupported = false;
  // cases.dup_suspect_id 列（二重登録の疑い: 重複相手の案件id）がDBに存在するか
  let dupSuspectSupported = false;
  // status_override 列がDBに存在するか（fetch時に検出）。未追加環境でも保存が壊れないようにするため
  let statusOverrideSupported = false;
  // companies.color 列がDBに存在するか（同上）
  let companyColorSupported = false;
  // cases.tasks 列がDBに存在するか（同上）
  let tasksSupported = false;
  // cases.schedule_adjusting 列がDBに存在するか（日程調整中フラグ・同上）
  let scheduleAdjustSupported = false;
  let initialReportSupported = false;   // 初動報告・期日免除・調査日調整中の列（SETUP_INITIAL_REPORT.sql）
  function scheduleAdjustAvailable() { return store.mode === 'local' || scheduleAdjustSupported; }
  // cases.payment_confirmed 列がDBに存在するか（入金 予定/確認・同上）
  let paymentConfirmedSupported = false;
  function paymentConfirmedAvailable() { return store.mode === 'local' || paymentConfirmedSupported; }
  // cases.survey_time / work_start_time 列がDBに存在するか（カレンダー用時刻）
  let timeFieldsSupported = false;
  let workEndTimeSupported = false;
  // cases.advice_note 列（Lv4: 人が確定した正しい対応メモ＝学習データ）
  let adviceNoteSupported = false;
  // cases.urgent / other_vendor / other_amount / other_rate（SETUP_TOHO_V2.sql）があるか
  let tohoV2Supported = false;
  // theaters.equipment/chronic_issues/partner 列（Lv3: 劇場カルテ）
  let theaterKarteSupported = false;
  let theaterInfoSupported = false;      // theaters に manager 等の劇場情報列があるか
  let theaterCloseSupported = false;     // theaters に closed（閉館）・gem2_co2・gem2_th の列があるか
  let theaterShortSupported = false;     // theaters に short_name（表示名）の列があるか
  let theaterContactsSupported = false;  // theater_contacts テーブルがあるか
  let theaterPendingSupported = false;   // theater_info_pending テーブルがあるか
  let intakePendingSupported = false;    // case_intake_pending テーブルがあるか
  let equipSupported = false;            // equipment_items / equipment_loans テーブルがあるか
  let equipItems = [];                   // 機器マスタ（風速計 など）
  let equipLoans = [];                   // 貸出記録
  let personalTasksSupported = false;    // personal_tasks テーブルがあるか
  let personalTasks = {};                // { 担当者名: [ {text,done,priority,due}, ... ] }
  let taskSuggestionsSupported = false;  // task_suggestions テーブルがあるか
  let taskSuggestionRows = [];           // 表から読んだ提案（メール・LINEの提案中＋押した結果）
  let intakePending = [];                // 案件の登録確認（新規か更新か）待ちリスト
  let theaterPending = [];               // 劇場情報 自動更新の要確認キュー
  const DATE_FIELDS = new Set(['receivedDate', 'surveyDate', 'quoteDate', 'workStartDate', 'workEndDate', 'invoiceDate', 'paymentDate']);

  // app(camelCase) → DB行(snake_case)。空文字の日付/金額は null に
  function caseToRow(c, sourceOverride) {
    const row = { id: c.id };
    Object.keys(FIELD_MAP).forEach((k) => {
      let v = c[k];
      if (DATE_FIELDS.has(k)) v = (v === '' || v == null) ? null : v;
      else if (k === 'estimateAmount') v = (v === '' || v == null) ? null : Number(v);
      else if (k === 'allocations') v = (v && typeof v === 'object') ? v : {};
      else if (v === undefined) v = null;
      row[FIELD_MAP[k]] = v;
    });
    // status_override 列はDB未追加環境でも壊れないよう、対応が確認できた時のみ送信
    if (statusOverrideSupported) row.status_override = c.statusOverride ? c.statusOverride : null;
    if (tasksSupported) row.tasks = Array.isArray(c.tasks) ? c.tasks : [];
    if (scheduleAdjustSupported) row.schedule_adjusting = !!c.scheduleAdjusting;
    if (initialReportSupported && isPrivileged(currentUser)) {
      // origin は DB が登録の時に決める（ここでは送らない）
      row.initial_report_at = c.initialReportAt || null;
      row.initial_report_kubun = c.initialReportKubun || '';
      row.initial_report_by = c.initialReportBy || '';
      row.survey_adjusting = !!c.surveyAdjusting && !c.surveyDate;
      row.due_exempt = !!c.dueExempt;
      row.due_exempt_reason = c.dueExemptReason || '';
    }
    if (paymentConfirmedSupported) row.payment_confirmed = (c.paymentConfirmed !== false);
    if (timeFieldsSupported) {
      row.survey_time = c.surveyTime ? c.surveyTime : null;
      row.work_start_time = c.workStartTime ? c.workStartTime : null;
    }
    if (workEndTimeSupported) row.work_end_time = c.workEndTime ? c.workEndTime : null;
    if (adviceNoteSupported) row.advice_note = c.adviceNote ? c.adviceNote : null;
    if (tohoV2Supported && isPrivileged(currentUser)) {
      row.urgent = !!c.urgent;
      row.other_vendor = c.otherVendor || '';
      row.other_amount = (c.otherAmount === '' || c.otherAmount == null || isNaN(Number(c.otherAmount))) ? null : Number(c.otherAmount);
      row.other_rate = (c.otherRate === '' || c.otherRate == null || isNaN(Number(c.otherRate))) ? null : Number(c.otherRate);
    }
    // 顧客メモ（列がある時のみ送信）。客先が記入する項目
    if (customerMemoSupported) row.customer_memo = c.customerMemo ? c.customerMemo : null;
    if (titleSupported) row.title = c.title || '';
    // 支払い状況（菱熱のみの購買情報・列がある時のみ送信）
    if (purchasesSupported) row.purchases = Array.isArray(c.purchases) ? c.purchases : [];
    // 操作元（通知文言用）: 菱熱=ryo / 客先=customer。要約時も消えないよう毎回保存（列がある時のみ）
    if (lastUpdateSourceSupported) {
      // sourceOverride='auto' は「登録確認」画面からのメール内容の反映（LINEは自動登録/自動更新と表示）
      row.last_update_source = sourceOverride || (realPrivileged(currentUser) ? 'ryo' : 'customer');
    }
    // 二重登録の疑い（菱熱のみが判定・解除する）
    if (dupSuspectSupported) row.dup_suspect_id = c.dupSuspectId ? c.dupSuspectId : null;
    row.status = statusOf(c); // DB側レポート用に実効ステータス（手動上書き反映）も保存
    // 客先の保存では社内情報カラムを送らない＝既存のDB値を保持（上書き・消去しない）
    // 内容(content)はAI要約の結果で客先は閲覧のみ。送らない＝客先が上書き・消去できない
    if (!isPrivileged(currentUser)) {
      delete row.memo; delete row.allocations; delete row.margin_rate;
      delete row.advice_note; delete row.tasks; delete row.content;
      delete row.purchases; // 支払い状況（購買）は菱熱のみ
    }
    return row;
  }
  // DB行 → app。null は空文字（日付/テキスト）/既定値（粗利率）に
  function rowToCase(r) {
    const c = { id: r.id };
    Object.keys(FIELD_MAP).forEach((k) => {
      let v = r[FIELD_MAP[k]];
      if (k === 'allocations') v = (v && typeof v === 'object') ? v : {};
      else if (k === 'marginRate') v = (v == null ? DEFAULT_MARGIN_RATE : v);
      else if (k === 'estimateAmount') v = (v == null ? '' : v);
      else if (v == null) v = '';
      c[k] = v;
    });
    // status_override は列が存在する時のみ取り込む（存在検出も兼ねる）
    if (Object.prototype.hasOwnProperty.call(r, 'status_override')) {
      statusOverrideSupported = true;
      c.statusOverride = r.status_override != null ? r.status_override : '';
    } else {
      c.statusOverride = '';
    }
    // tasks（チェックリスト）も列がある時のみ
    if (Object.prototype.hasOwnProperty.call(r, 'tasks')) {
      tasksSupported = true;
      c.tasks = Array.isArray(r.tasks) ? r.tasks : [];
    } else {
      c.tasks = [];
    }
    // 初動報告・期日免除・調査日調整中（SETUP_INITIAL_REPORT.sql）
    if (Object.prototype.hasOwnProperty.call(r, 'initial_report_at')) {
      initialReportSupported = true;
      c.origin = r.origin || '';
      c.initialReportAt = r.initial_report_at || '';
      c.initialReportKubun = r.initial_report_kubun || '';
      c.initialReportBy = r.initial_report_by || '';
      c.surveyAdjusting = !!r.survey_adjusting;
      c.dueExempt = !!r.due_exempt;
      c.dueExemptReason = r.due_exempt_reason || '';
    } else {
      c.origin = ''; c.initialReportAt = ''; c.initialReportKubun = ''; c.initialReportBy = '';
      c.surveyAdjusting = !!r.survey_adjusting; c.dueExempt = false; c.dueExemptReason = '';
    }
    // 🚩 緊急・他社案件（SETUP_TOHO_V2.sql）
    if (Object.prototype.hasOwnProperty.call(r, 'urgent')) {
      tohoV2Supported = true;
      c.urgent = !!r.urgent; c.otherVendor = r.other_vendor || '';
      c.otherAmount = r.other_amount == null ? '' : Number(r.other_amount); c.otherRate = r.other_rate == null ? '' : Number(r.other_rate);
    } else { c.urgent = false; c.otherVendor = ''; c.otherAmount = ''; c.otherRate = ''; }
    // 日程調整中フラグ
    if (Object.prototype.hasOwnProperty.call(r, 'schedule_adjusting')) {
      scheduleAdjustSupported = true;
      c.scheduleAdjusting = !!r.schedule_adjusting;
    } else {
      c.scheduleAdjusting = false;
    }
    // Lv4: 対応メモ(advice_note) 列がある時のみ取り込む
    if (Object.prototype.hasOwnProperty.call(r, 'advice_note')) {
      adviceNoteSupported = true;
      c.adviceNote = r.advice_note != null ? r.advice_note : '';
    } else {
      c.adviceNote = '';
    }
    // 入金 予定/確認（列が無い・未設定なら確認扱い＝従来動作を維持）
    if (Object.prototype.hasOwnProperty.call(r, 'payment_confirmed')) {
      paymentConfirmedSupported = true;
      c.paymentConfirmed = (r.payment_confirmed !== false);
    } else {
      c.paymentConfirmed = true;
    }
    // 調査日・作業開始日の時刻（カレンダー用）
    if (Object.prototype.hasOwnProperty.call(r, 'survey_time')) {
      timeFieldsSupported = true;
      c.surveyTime = r.survey_time != null ? r.survey_time : '';
      c.workStartTime = r.work_start_time != null ? r.work_start_time : '';
    } else {
      c.surveyTime = '';
      c.workStartTime = '';
    }
    if (Object.prototype.hasOwnProperty.call(r, 'work_end_time')) {
      workEndTimeSupported = true;
      c.workEndTime = r.work_end_time != null ? r.work_end_time : '';
    } else {
      c.workEndTime = '';
    }
    // 顧客メモ(customer_memo) 列がある時のみ取り込む
    if (Object.prototype.hasOwnProperty.call(r, 'customer_memo')) {
      customerMemoSupported = true;
      c.customerMemo = r.customer_memo != null ? r.customer_memo : '';
    } else {
      c.customerMemo = '';
    }
    // 支払い状況(purchases) 列がある時のみ取り込む
    if (Object.prototype.hasOwnProperty.call(r, 'purchases')) {
      purchasesSupported = true;
      c.purchases = Array.isArray(r.purchases) ? r.purchases : [];
    } else {
      c.purchases = [];
    }
    // 案件名（title）: 内容から「どこでどうなった」だけの短い名前（TOHO の要望 2026-11-16）
    if (Object.prototype.hasOwnProperty.call(r, 'title')) { titleSupported = true; c.title = r.title || ''; } else c.title = c.title || '';
    // 操作元(last_update_source) 列の有無だけ検出（アプリ表示には使わない・保存時のガード用）
    // 二重登録の疑い(dup_suspect_id) 列がある時のみ取り込む
    if (Object.prototype.hasOwnProperty.call(r, 'dup_suspect_id')) {
      dupSuspectSupported = true;
      c.dupSuspectId = r.dup_suspect_id != null ? r.dup_suspect_id : '';
    } else {
      c.dupSuspectId = '';
    }
    if (Object.prototype.hasOwnProperty.call(r, 'last_update_source')) {
      lastUpdateSourceSupported = true;
    }
    c.fieldSources = (r.field_sources && typeof r.field_sources === 'object') ? r.field_sources : {};   // 欄ごとの最後の入れ手（菱熱の画面の印）
    MAIL_BASE.set(String(c.id), { content: c.content || '', workStartDate: c.workStartDate || '' });   // 通知メールを聞く時の「前に保存した値」
    return c;
  }

  function genId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
      try { return crypto.randomUUID(); } catch (e) {}
    }
    const b = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }

  function translateAuthError(msg) {
    if (/Invalid login credentials/i.test(msg)) return 'メールアドレスまたはパスワードが正しくありません。';
    if (/Email not confirmed/i.test(msg)) return 'メールアドレスが未確認です。確認メール内のリンクをクリックしてください。';
    if (/User already registered/i.test(msg) || /already.*registered/i.test(msg)) return 'このメールアドレスは既に登録されています。ログイン画面からどうぞ。';
    if (/Password should be at least/i.test(msg)) return 'パスワードは6文字以上にしてください。';
    if (/rate limit/i.test(msg) || /Email rate limit exceeded/i.test(msg)) return '試行回数が多すぎます。しばらく待って再度お試しください。';
    if (/signups not allowed/i.test(msg) || /Signups not allowed/i.test(msg)) return 'Supabase側で新規作成が無効になっています。管理者にご相談ください。';
    if (/Sign-?up restricted/i.test(msg) || /allowed signup domains/i.test(msg)) return '登録できるのは @ryonetsu.com / @tohocinemas.co.jp / @tokyu-rec.co.jp / @unitedcinemas.co.jp のメールアドレスのみです。';
    if (/Database error saving new user/i.test(msg)) return 'サインアップが拒否されました。許可ドメイン（@ryonetsu.com / @tohocinemas.co.jp / @tokyu-rec.co.jp / @unitedcinemas.co.jp）のメールアドレスをご使用ください。';
    return msg;
  }

  let sb = null;          // Supabaseクライアント
  let rtChannel = null;   // リアルタイム購読

  // Supabase/PostgREST が「存在しない列」を指したときのエラー判定
  // （新カラムの移行SQL未実行な本番環境でも壊れないようにするため）
  function isMissingColumnError(error) {
    if (!error) return false;
    // PostgREST: PGRST204（スキーマキャッシュに列が無い）/ Postgres: 42703（undefined_column）
    if (error.code === 'PGRST204' || error.code === '42703') return true;
    const msg = ((error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '')).toLowerCase();
    return msg.includes('official_name') || msg.includes('hq_address') ||
           (msg.includes('column') && msg.includes('does not exist')) ||
           (msg.includes('could not find') && msg.includes('column'));
  }

  const store = {
    mode: 'local',
    init() {
      const forceLocal = /[?&]local=1/.test(location.search) || localStorage.getItem('forceLocalMode') === '1';
      const cfg = window.SUPABASE_CONFIG;
      if (!forceLocal && cfg && cfg.url && cfg.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          sb = window.supabase.createClient(cfg.url, cfg.anonKey);
          this.mode = 'supabase';
        } catch (e) { console.error('Supabase init失敗、localモードにfallback', e); this.mode = 'local'; }
      }
    },
    async getSession() {
      if (this.mode === 'local') return loadAuth();
      const { data } = await sb.auth.getSession();
      const u = data.session && data.session.user;
      return u ? { email: u.email, domain: (u.email.split('@')[1] || '') } : null;
    },
    async signIn(email, password) {
      if (this.mode === 'local') return attemptLogin(email, password);
      const e = (email || '').trim().toLowerCase();
      const { data, error } = await sb.auth.signInWithPassword({ email: e, password: password });
      if (error) return { ok: false, msg: translateAuthError(error.message) };
      const u = data.user;
      return { ok: true, user: { email: u.email, domain: (u.email.split('@')[1] || '') } };
    },
    async signOut() {
      if (this.mode === 'local') { clearAuth(); return; }
      try { await sb.auth.signOut(); } catch (e) {}
    },
    async fetchCases() {
      if (this.mode === 'local') {
        // テストモード: 打合せモードでは選んだ会社だけを画面に渡し、ほかは保存の時に戻す（消さない）
        const all = loadCases();
        if (!meetingActive(currentUser)) { meetingHiddenLocal = []; return all; }
        meetingHiddenLocal = all.filter((c) => c.company !== meetingCompany);
        return all.filter((c) => c.company === meetingCompany);
      }
      // 客先には社内情報カラム（社内用メモ/AI学習メモ/粗利配分/タスク）をデータごと渡さない
      const cols = isPrivileged(currentUser) ? '*' : CUSTOMER_CASE_COLUMNS;
      const { data, error } = await sb.from('cases').select(cols);
      if (error) throw error;
      return meetingScrub((data || []).map(rowToCase));
    },
    async upsertCase(c, sourceOverride) {
      if (this.mode === 'local') { saveCases(); return; }
      // 客先（TOHO などのアカウント・打合せモード）は「自社のメモ」だけ直せる（TOHO の要望 2026-11-16）
      if (!isPrivileged(currentUser)) return this.saveCustomerMemo(c);
      const { error } = await sb.from('cases').upsert(caseToRow(c, sourceOverride));
      if (error) throw error;
    },
    // ---- 客先アカウント（メールアドレス ⇔ 劇場）customer_accounts ----
    async fetchMyAccount() {
      if (this.mode !== 'supabase' || !currentUser) return null;
      const { data, error } = await sb.from('customer_accounts').select('*').eq('email', String(currentUser.email || '').toLowerCase()).limit(1);
      if (error) return null;
      return (data && data[0]) || null;
    },
    async fetchAccounts() {
      if (this.mode !== 'supabase') return [];
      const { data, error } = await sb.from('customer_accounts').select('*').order('company').order('theater').order('email');
      if (error) throw error;
      return data || [];
    },
    async saveAccounts(rows) {
      if (this.mode !== 'supabase' || !rows.length) return;
      const by = (currentUser && currentUser.email) || '';
      const { error } = await sb.from('customer_accounts').upsert(rows.map((r) => {
        const o = { email: String(r.email).toLowerCase().trim(), company: r.company || '', theater: r.theater || '', note: r.note || '', updated_by: by, updated_at: new Date().toISOString() };
        if (r.person !== undefined) o.person = r.person || '';   // 担当者名（SETUP_CASE_MAIL.sql の列）
        return o;
      }));
      if (error) throw error;
    },
    // ---- R担当者のマスター（staff）----
    async fetchStaff() {
      if (this.mode !== 'supabase') return null;
      let { data, error } = await sb.from('staff').select('name,email,phone,active,sort_order,quals').order('sort_order').order('name');
      if (error && /quals/.test(error.message || '')) ({ data, error } = await sb.from('staff').select('name,email,phone,active,sort_order').order('sort_order').order('name'));   // 資格の列がまだ（SETUP_SAFETY_V2.sql）
      if (error && /phone/.test(error.message || '')) ({ data, error } = await sb.from('staff').select('name,email,active,sort_order').order('sort_order').order('name'));
      if (error) return null;   // 表が無い（SETUP_STAFF.sql 未実行）→ 今までどおりブラウザの覚え
      return data || [];
    },
    async saveStaff(rows) {
      const { error } = await sb.from('staff').upsert(rows.map((r) => Object.assign({ name: r.name, email: r.email || '', active: r.active !== false, sort_order: Number(r.sort_order) || 0, updated_at: new Date().toISOString() }, r.phone !== undefined ? { phone: r.phone || '' } : {}, r.quals !== undefined ? { quals: r.quals || {} } : {})), { onConflict: 'name' });
      if (error) throw error;
    },
    // ---- 通知メールの設定（app_settings の case_mail）----
    async fetchCaseMailSettings() {
      if (this.mode !== 'supabase') return null;
      const { data, error } = await sb.from('app_settings').select('value').eq('key', 'case_mail').limit(1);
      if (error) return null;
      return (data && data[0] && data[0].value) || { mode: 'test', test_theaters: [] };
    },
    async saveCaseMailSettings(v) {
      const { error } = await sb.from('app_settings').upsert({ key: 'case_mail', value: v, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async deleteAccount(email) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('customer_accounts').delete().eq('email', email);
      if (error) throw error;
    },
    async saveCustomerMemo(c) {
      if (!customerMemoSupported || !c || !c.id) return;
      const patch = { customer_memo: c.customerMemo ? c.customerMemo : null };
      if (lastUpdateSourceSupported) patch.last_update_source = realPrivileged(currentUser) ? 'ryo' : 'customer';
      const { error } = await sb.from('cases').update(patch).eq('id', c.id);
      if (error) throw error;
    },
    async upsertCases(arr) {
      if (this.mode === 'local') { saveCases(); return; }
      if (!arr.length) return;
      if (!isPrivileged(currentUser)) { for (const c of arr) await this.saveCustomerMemo(c); return; }
      const { error } = await sb.from('cases').upsert(arr.map((c) => caseToRow(c)));
      if (error) throw error;
    },
    async deleteCase(id) {
      if (this.mode === 'local') { saveCases(); return; }
      const { error } = await sb.from('cases').delete().eq('id', id);
      if (error) throw error;
    },
    async fetchCompanies() {
      if (this.mode === 'local') return loadCompanies();
      const { data, error } = await sb.from('companies').select('*').order('sort_order', { ascending: true });
      if (error || !data || !data.length) return loadCompanies();
      return data.map((r) => {
        if (Object.prototype.hasOwnProperty.call(r, 'color')) companyColorSupported = true;
        const def = DEFAULT_COMPANIES.find((d) => d.name === r.name);
        return {
          name: r.name,
          abbr: r.abbr,
          // DB に列が無い場合は undefined。デフォルトで補完
          officialName: r.official_name != null ? r.official_name : (def ? def.officialName : ''),
          hqAddress:    r.hq_address    != null ? r.hq_address    : (def ? def.hqAddress    : ''),
          color:        r.color != null ? r.color : ''
        };
      });
    },
    async addCompanyRemote(rec) {
      if (this.mode === 'local') { saveCompanies(companies); return; }
      // official_name / hq_address はDBに列が無い環境でも壊れないようフォールバックする
      const full = { name: rec.name, abbr: rec.abbr, sort_order: 100, official_name: rec.officialName || '', hq_address: rec.hqAddress || '' };
      let { error } = await sb.from('companies').insert(full);
      if (error && isMissingColumnError(error)) {
        // 旧スキーマ（official_name/hq_address 列が無い）→ 基本列のみで再試行
        const res = await sb.from('companies').insert({ name: rec.name, abbr: rec.abbr, sort_order: 100 });
        error = res.error;
      }
      if (error) throw error;
    },
    async updateCompanyInfo(name, patch) {
      if (this.mode === 'local') { saveCompanies(companies); return; }
      const row = {};
      if (patch.officialName != null) row.official_name = patch.officialName;
      if (patch.hqAddress    != null) row.hq_address    = patch.hqAddress;
      if (patch.color != null && companyColorSupported) row.color = patch.color;
      if (!Object.keys(row).length) return;
      const { error } = await sb.from('companies').update(row).eq('name', name);
      // 列が無い旧スキーマでは本社情報の保存はスキップ（ローカルには反映済み）
      if (error && isMissingColumnError(error)) {
        console.warn('companies に official_name/hq_address 列が無いため本社情報の保存をスキップ。Supabaseの移行SQLを実行してください。');
        return;
      }
      if (error) throw error;
    },
    async deleteCompanyRemote(name) {
      if (this.mode === 'local') { saveCompanies(companies); return; }
      const { error } = await sb.from('companies').delete().eq('name', name);
      if (error) throw error;
    },
    async fetchTheaterMaster() {
      if (this.mode === 'local') return loadTheaterMaster();
      const { data, error } = await sb.from('theaters').select('*');
      if (error || !data) return loadTheaterMaster();
      if (data.length === 0) {
        // 初回: デフォルトを Supabase に投入してから返す
        try {
          await sb.from('theaters').insert(DEFAULT_THEATER_MASTER.map((t) => ({ name: t.name, company: t.company, address: t.address })));
        } catch (e) { console.warn('theater master 初期投入失敗', e); }
        return DEFAULT_THEATER_MASTER.map((t) => ({ name: t.name, company: t.company, address: t.address }));
      }
      if (data[0] && Object.prototype.hasOwnProperty.call(data[0], 'equipment')) theaterKarteSupported = true;
      if (data[0] && Object.prototype.hasOwnProperty.call(data[0], 'manager')) theaterInfoSupported = true;
      // GeM2 のセンサー・閉館（SETUP_THEATER_CLOSE.sql）。まだ実行していない DB では、前の「隠した劇場」を閉館として扱う
      theaterCloseSupported = !!(data[0] && Object.prototype.hasOwnProperty.call(data[0], 'closed'));
      theaterShortSupported = !!(data[0] && Object.prototype.hasOwnProperty.call(data[0], 'short_name'));
      return data.map((r) => ({
        name: r.name, company: r.company, address: r.address || '',
        equipment: r.equipment || '', chronicIssues: r.chronic_issues || '', partner: r.partner || '',
        manager: r.manager || '', theaterPhone: r.theater_phone || '',
        maintenance: r.maintenance || '', gem2: r.gem2 || '', infoNote: r.info_note || '', homepage: r.homepage || '',
        gem2Co2: r.gem2_co2 || '', gem2Th: r.gem2_th || '',
        shortName: r.short_name || '', aliases: Array.isArray(r.aliases) ? r.aliases : [],
        closed: r.closed != null ? !!r.closed : !!r.hidden, closedOn: r.closed_on || '', closedNote: r.closed_note != null ? (r.closed_note || '') : (r.hidden ? String(r.hidden_reason || '') : '')
      }));
    },
    async upsertTheater(t) {
      if (this.mode === 'local') { saveTheaterMaster(theaterMaster); return; }
      const payload = { name: t.name, company: t.company, address: t.address || '' };
      // 劇場カルテ（theater_notes）がある時は、設備・持病・備考の長い文章は送らない（DBが1件ずつの表から作り直す）
      const karteOn = !!(window.KARTE && await window.KARTE.ready());
      if (theaterKarteSupported) {
        if (!karteOn) {
          payload.equipment = t.equipment || '';
          payload.chronic_issues = t.chronicIssues || '';
        }
        payload.partner = t.partner || '';
      }
      if (theaterInfoSupported) {
        payload.manager = t.manager || '';
        payload.theater_phone = t.theaterPhone || '';
        payload.maintenance = t.maintenance || '';
        payload.gem2 = t.gem2 || '';
        if (!karteOn) payload.info_note = t.infoNote || '';
      }
      if (theaterCloseSupported) {
        payload.gem2_co2 = t.gem2Co2 || '';
        payload.gem2_th = t.gem2Th || '';
        payload.closed = !!t.closed;
        payload.closed_on = t.closedOn || '';
        payload.closed_note = t.closedNote || '';
      }
      if (theaterShortSupported) payload.short_name = t.shortName || '';
      const { error } = await sb.from('theaters').upsert(payload);
      if (error) throw error;
    },
    // ---- 各劇場情報: パートナー連絡先（theater_contacts） ----
    // ---- 設備管理台帳（機器マスタ equipment_items / 貸出記録 equipment_loans） ----
    async fetchEquipItems() {
      if (this.mode !== 'supabase') { equipSupported = false; return []; }
      const { data, error } = await sb.from('equipment_items').select('*')
        .order('sort_order', { ascending: true }).order('name', { ascending: true });
      if (error) { equipSupported = false; return []; }
      equipSupported = true;
      return (data || []).map((r) => ({
        id: r.id, name: r.name || '', note: r.note || '',
        sortOrder: r.sort_order || 100, active: r.active !== false
      }));
    },
    async insertEquipItem(name) {
      if (this.mode !== 'supabase') return null;
      const { data, error } = await sb.from('equipment_items')
        .insert({ name: name, sort_order: 100 }).select().single();
      if (error) throw error;
      return data;
    },
    async updateEquipItem(id, patch) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('equipment_items').update(patch).eq('id', id);
      if (error) throw error;
    },
    async deleteEquipItem(id) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('equipment_items').delete().eq('id', id);
      if (error) throw error;
    },
    async fetchEquipLoans() {
      if (this.mode !== 'supabase') return [];
      const { data, error } = await sb.from('equipment_loans').select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map((r) => ({
        id: r.id, itemId: r.item_id || '', equipmentName: r.equipment_name || '',
        borrower: r.borrower || '', lentOn: r.lent_on || '', dueOn: r.due_on || '',
        returnedOn: r.returned_on || '', note: r.note || ''
      }));
    },
    async insertEquipLoan(l) {
      if (this.mode !== 'supabase') return null;
      const { data, error } = await sb.from('equipment_loans').insert({
        item_id: l.itemId || null, equipment_name: l.equipmentName || '',
        borrower: l.borrower || '', lent_on: l.lentOn || null, due_on: l.dueOn || null,
        returned_on: l.returnedOn || null, note: l.note || ''
      }).select().single();
      if (error) throw error;
      return data;
    },
    async updateEquipLoan(id, l) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('equipment_loans').update({
        item_id: l.itemId || null, equipment_name: l.equipmentName || '',
        borrower: l.borrower || '', lent_on: l.lentOn || null, due_on: l.dueOn || null,
        returned_on: l.returnedOn || null, note: l.note || '',
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    async deleteEquipLoan(id) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('equipment_loans').delete().eq('id', id);
      if (error) throw error;
    },
    // ---- 個人タスク（personal_tasks: 担当者1人=1行、タスクはJSON配列） ----
    async fetchPersonalTasks() {
      if (this.mode === 'local') { personalTasksSupported = true; return loadPersonalTasksLocal(); }
      const { data, error } = await sb.from('personal_tasks').select('person,tasks');
      if (error) { personalTasksSupported = false; return {}; }
      personalTasksSupported = true;
      const map = {};
      (data || []).forEach((r) => { if (r && r.person) map[r.person] = Array.isArray(r.tasks) ? r.tasks : []; });
      return map;
    },
    async savePersonalTasks(person, tasks) {
      if (this.mode === 'local') {
        const map = loadPersonalTasksLocal();
        map[person] = tasks;
        savePersonalTasksLocal(map);
        return;
      }
      const { error } = await sb.from('personal_tasks')
        .upsert({ person: person, tasks: tasks, updated_at: new Date().toISOString() }, { onConflict: 'person' });
      if (error) throw error;
    },
    // ---- 個人タスクの提案（task_suggestions） ----
    // 提案中のもの（メール・LINE）と、押した結果（登録・破棄。止まりの提案を二度出さないため）を読む
    async fetchTaskSuggestions() {
      if (this.mode === 'local') { taskSuggestionsSupported = true; return loadTaskSuggestionsLocal(); }
      const { data, error } = await sb.from('task_suggestions')
        .select('id,person,text,due,priority,source,reason,case_id,source_url,dedupe_key,status,created_at')
        .order('created_at', { ascending: true }).limit(2000);
      if (error) { taskSuggestionsSupported = false; return []; }
      taskSuggestionsSupported = true;
      return data || [];
    },
    // 「登録」「破棄」を記録する。同じ dedupe_key の行があれば状態を上書き（無ければ作る＝止まりの提案）
    async decideTaskSuggestion(s, status) {
      const row = {
        person: s.person, text: s.text, due: s.due || null, priority: s.priority || 'mid',
        source: s.source, reason: s.reason || '', case_id: s.case_id || null, source_url: s.source_url || '',
        dedupe_key: s.dedupe_key, status: status, decided_at: new Date().toISOString()
      };
      if (this.mode === 'local') {
        const list = loadTaskSuggestionsLocal().filter((x) => x.dedupe_key !== s.dedupe_key);
        list.push(row); saveTaskSuggestionsLocal(list); return;
      }
      const { error } = await sb.from('task_suggestions').upsert(row, { onConflict: 'dedupe_key' });
      if (error) throw error;
    },
    async fetchTheaterContacts() {
      if (this.mode === 'local') return loadTheaterContactsLocal();
      const { data, error } = await sb.from('theater_contacts').select('*').order('sort_order', { ascending: true });
      if (error) { theaterContactsSupported = false; return []; }
      theaterContactsSupported = true;
      return (data || []).map((r) => ({
        id: r.id, company: r.company || '', theater: r.theater || '',
        category: r.category || '', maker: r.maker || '', vendor: r.vendor || '',
        person: r.person || '', phone: r.phone || '', email: r.email || '',
        note: r.note || '', sortOrder: r.sort_order || 0
      }));
    },
    async insertTheaterContact(c) {
      if (this.mode === 'local') { saveTheaterContactsLocal(theaterContacts); return c; }
      const { data, error } = await sb.from('theater_contacts').insert({
        company: c.company, theater: c.theater, category: c.category || '', maker: c.maker || '',
        vendor: c.vendor || '', person: c.person || '', phone: c.phone || '', email: c.email || '',
        note: c.note || '', sort_order: c.sortOrder || 0
      }).select().single();
      if (error) throw error;
      c.id = data.id;
      return c;
    },
    async updateTheaterContact(c) {
      if (this.mode === 'local') { saveTheaterContactsLocal(theaterContacts); return; }
      const { error } = await sb.from('theater_contacts').update({
        category: c.category || '', maker: c.maker || '', vendor: c.vendor || '',
        person: c.person || '', phone: c.phone || '', email: c.email || '',
        note: c.note || '', updated_at: new Date().toISOString()
      }).eq('id', c.id);
      if (error) throw error;
    },
    async deleteTheaterContact(id) {
      if (this.mode === 'local') { saveTheaterContactsLocal(theaterContacts); return; }
      const { error } = await sb.from('theater_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    // ---- 案件の登録確認キュー（case_intake_pending: 新規か更新か迷ったメール） ----
    async fetchIntakePending() {
      if (this.mode !== 'supabase') { intakePendingSupported = false; return []; }
      const { data, error } = await sb.from('case_intake_pending')
        .select('*').eq('status', 'pending').order('created_at', { ascending: true });
      if (error) { intakePendingSupported = false; return []; }
      intakePendingSupported = true;
      return data || [];
    },
    // 登録確認を別の人に回す（assignee が空なら自動に戻す）。SETUP_INTAKE_ASSIGN.sql が要る（2026-11-24）
    async assignIntakePending(id, name, by) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('case_intake_pending')
        .update({ assignee: name || '', assigned_by: by || '', assigned_at: new Date().toISOString() }).eq('id', id);
      if (error) { if (/assignee|assigned_/.test(error.message || '')) throw new Error('データベースの準備がまだです（SETUP_INTAKE_ASSIGN.sql を Supabase で1回実行してください）'); throw error; }
    },
    // 確認済みにする（registered / updated / discarded）
    async decideIntakePending(id, status, caseId) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('case_intake_pending')
        .update({ status: status, decided_at: new Date().toISOString(), decided_case_id: caseId || null })
        .eq('id', id);
      if (error) throw error;
    },
    // ---- 劇場情報 自動更新: 要確認キュー（theater_info_pending） ----
    async fetchPendingTheaterInfo() {
      if (this.mode !== 'supabase') { theaterPendingSupported = false; return []; }
      const { data, error } = await sb.from('theater_info_pending')
        .select('*').eq('status', 'pending').order('created_at', { ascending: true });
      if (error) { theaterPendingSupported = false; return []; }
      theaterPendingSupported = true;
      return data || [];
    },
    // 承認: 本テーブルへ反映（field=追記 / contact=無ければ挿入）してから status を approved に
    async approvePendingTheaterInfo(item) {
      if (this.mode !== 'supabase') return;
      if (item.kind === 'contact') {
        // 既に同じ劇場・業者・担当者が居なければ挿入
        const { data: dup } = await sb.from('theater_contacts').select('id')
          .eq('theater', item.theater).eq('vendor', item.vendor || '').eq('person', item.person || '').limit(1);
        if (!dup || !dup.length) {
          const note = [item.note, item.evidence].filter(Boolean).join(' / ');
          const { error } = await sb.from('theater_contacts').insert({
            company: item.company || '', theater: item.theater, category: item.category || '',
            maker: item.maker || '', vendor: item.vendor || '', person: item.person || '',
            phone: item.phone || '', email: item.email || '', note: note, sort_order: 9000
          });
          if (error) throw error;
        }
      } else if (['equipment', 'chronic_issues', 'info_note'].indexOf(item.field) !== -1 && window.KARTE && await window.KARTE.ready()) {
        // 劇場カルテ: 1件として入れる（同じ文がもうあれば入れない）
        const n = await window.KARTE.noteFromPending(item);
        const { error: e3 } = await sb.from('theater_info_pending')
          .update({ status: 'approved', decided_at: new Date().toISOString(), applied_note_id: n ? n.id : null }).eq('id', item.id);
        if (e3) throw e3;
        return;
      } else {
        // field: 該当劇場の列に追記（既存は保持・重複語は入れない）。manager/theater_phone は置換
        const col = item.field;
        const allowed = ['equipment', 'chronic_issues', 'info_note', 'manager', 'theater_phone'];
        if (allowed.indexOf(col) === -1) throw new Error('未対応の項目: ' + col);
        // 劇場行が無ければ作る
        await sb.from('theaters').upsert({ name: item.theater, company: item.company || '' }, { onConflict: 'name' });
        const { data: rows } = await sb.from('theaters').select(col + ',manager,info_note').eq('name', item.theater).limit(1);
        const cur = (rows && rows[0]) ? rows[0] : {};
        const patch = {};
        if (col === 'manager' || col === 'theater_phone') {
          patch[col] = item.value;
          if (col === 'manager' && cur.manager && cur.manager !== item.value && window.KARTE && await window.KARTE.ready()) {
            // 劇場カルテ: 前の支配人は備考の1件に残す
            await window.KARTE.noteRaw({ company: item.company || '', theater: item.theater, kind: 'note', body: '前の支配人: ' + cur.manager + '（' + item.value + ' に交代）', source_date: item.source_date || '', evidence: item.evidence || '', pending_id: item.id });
          } else if (col === 'manager' && cur.manager && cur.manager !== item.value) {
            const oldNote = '旧: ' + cur.manager;
            patch.info_note = cur.info_note && cur.info_note.indexOf(oldNote) === -1
              ? cur.info_note + ' / ' + oldNote : (cur.info_note || oldNote);
          }
        } else {
          const existing = String(cur[col] || '');
          const key = String(item.value || '').slice(0, 40);
          if (existing && key && existing.indexOf(key) !== -1) {
            // 既に含まれている → 追記しない
          } else {
            patch[col] = existing ? (existing + ' / ' + item.value) : item.value;
          }
        }
        if (Object.keys(patch).length) {
          const { error } = await sb.from('theaters').update(patch).eq('name', item.theater);
          if (error) throw error;
        }
      }
      const { error: e2 } = await sb.from('theater_info_pending')
        .update({ status: 'approved', decided_at: new Date().toISOString() }).eq('id', item.id);
      if (e2) throw e2;
    },
    async rejectPendingTheaterInfo(id) {
      if (this.mode !== 'supabase') return;
      const { error } = await sb.from('theater_info_pending')
        .update({ status: 'rejected', decided_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    async deleteTheater(name) {
      if (this.mode === 'local') { saveTheaterMaster(theaterMaster); return; }
      const { error } = await sb.from('theaters').delete().eq('name', name);
      if (error) throw error;
    },
    subscribe(onChange) {
      if (this.mode !== 'supabase') return;
      // 客先にはリアルタイム購読をしない（realtimeは社内情報カラムを含む行を配信するため）
      if (!isPrivileged(currentUser)) return;
      try {
        rtChannel = sb.channel('cases-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, onChange)
          .subscribe();
      } catch (e) { console.error('リアルタイム購読失敗', e); }
    },
    unsubscribe() {
      if (rtChannel && sb) { try { sb.removeChannel(rtChannel); } catch (e) {} rtChannel = null; }
    },
    async signUp(email, password) {
      if (this.mode === 'local') return { ok: false, msg: 'ローカルモードでは新規作成できません。' };
      const e = (email || '').trim().toLowerCase();
      // 確認メールのリンクをこのアプリに戻す（メール確認ON時に有効）
      const { data, error } = await sb.auth.signUp({
        email: e, password: password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) return { ok: false, msg: translateAuthError(error.message) };
      const u = data.user;
      const hasSession = !!(data.session);
      return {
        ok: true,
        user: u ? { email: u.email, domain: (u.email.split('@')[1] || '') } : null,
        autoLoggedIn: hasSession,
        message: hasSession ? null : 'メール確認が必要です。届いた確認メールのリンクをクリックしてください。'
      };
    }
  };

  // 永続化ラッパ（失敗時はユーザーに通知）
  function onPersistError(err) {
    console.error('保存エラー', err);
    if (store.mode === 'supabase') {
      alert('サーバーへの保存に失敗しました。通信状況を確認してください。\n（画面を再読み込みすると最新状態に戻ります）\n\n' + (err && err.message ? err.message : ''));
    }
  }
  // 案件が変わったことを、工事予定表など別の画面に知らせる
  function notifyCasesChanged() { try { window.dispatchEvent(new Event('cinema-cases-changed')); } catch (e) {} }
  // 案件を保存する前に、劇場名を劇場の一覧の正式名にそろえる（短い名前・別の呼び方で書いても同じ劇場になる）
  function fixCaseTheater(c) {
    if (c && c.theater) { const t = canonTheaterName(c.theater, c.company); if (t && t !== c.theater) c.theater = t; }
    return c;
  }
  function persistCase(c, sourceOverride) {
    fixCaseTheater(c); notifyCasesChanged();
    // 菱熱が手で「内容」「作業開始日」を直した・新しく登録した時は、通知メールの予定を積まずに保存し、送るか聞く（2026-11-24）
    const ask = !sourceOverride ? mailAskKinds(c) : null;
    const p = Promise.resolve(store.upsertCase(c, ask ? 'ryo_quiet' : sourceOverride)).catch(onPersistError);
    if (!ask) MAIL_BASE.set(String(c.id), { content: c.content || '', workStartDate: c.workStartDate || '' });
    else p.then(() => mailAskAfterSave(c, ask));
    return p;
  }
  // ===== 通知メールを送るか聞く（2026-11-24 小山さん: 1つずつ直すたびに通知が行くのを防ぐ） =====
  //  ・菱熱が手で「内容」「作業開始日」を直した時・新しく登録した時だけ聞く（AI・メール取り込みは今まで通り送らない）
  //  ・「通知する」で通知の予定（case_mail_events）を積む（5分後にまとめて送る）。「通知しない」は積まない
  //  ・「ほかの項目も直す」は編集パネルを開き、次に保存した時（またはパネルを閉じた時）にもう一度聞く
  const MAIL_BASE = new Map();      // 案件 id → 前に保存した（客先が知っている）内容・作業開始日
  const MAIL_PENDING = new Map();   // 案件 id → { old, isNew, kinds: Set, asking }
  function mailAskOn() {
    return store.mode === 'supabase' && caseMailSupported && realPrivileged(currentUser) && !meetingActive(currentUser)
      && String(caseMailSettings.mode || 'test') !== 'off';
  }
  function mailAskKinds(c) {
    if (!mailAskOn()) return null;
    const id = String(c.id), base = MAIL_BASE.get(id), pend = MAIL_PENDING.get(id);
    const kinds = new Set(pend ? pend.kinds : []);
    if (!base) { if (c.content || c.workStartDate) kinds.add(c.content ? 'content' : 'work_start'); if (c.workStartDate) kinds.add('work_start'); }
    else {
      if ((c.content || '') && (c.content || '') !== base.content) kinds.add('content');
      if ((c.workStartDate || '') && (c.workStartDate || '') !== base.workStartDate) kinds.add('work_start');
    }
    if (!kinds.size) return null;
    const next = pend || { old: base ? base.content : '', isNew: !base, kinds: new Set(), asking: false };
    kinds.forEach((k) => next.kinds.add(k));
    MAIL_PENDING.set(id, next);
    MAIL_BASE.set(id, { content: c.content || '', workStartDate: c.workStartDate || '' });
    return next;
  }
  function mailAskDialog(msg, allowEdit) {
    return new Promise((resolve) => {
      const ov = document.createElement('div'); ov.className = 'kt-ask-ov mail-ask-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = `<div class="kt-ask"><div class="kt-ask-msg">${escapeHtml(msg)}</div><div class="kt-ask-btns mail-ask-btns">
        <button type="button" data-mail="skip">通知しない</button>
        ${allowEdit ? '<button type="button" data-mail="edit">ほかの項目も直す（あとで聞く）</button>' : ''}
        <button type="button" class="kt-ask-yes primary" data-mail="send">📨 通知する</button></div></div>`;
      document.body.appendChild(ov);
      ov.addEventListener('click', (e) => { const b = e.target.closest('[data-mail]'); if (b) { ov.remove(); resolve(b.dataset.mail); } });
      const y = ov.querySelector('[data-mail="send"]'); if (y) y.focus();
    });
  }
  async function mailAskAfterSave(c, pend, fromClose) {
    if (!pend || pend.asking) return;
    pend.asking = true;
    // 「作業申請書を作りますか？」などの画面が出ている間は待って、閉じてから聞く（2つの画面を重ねない）
    await new Promise((r) => setTimeout(r, 900));   // 保存の後に出る画面（作業申請書を作りますか？など）が先に出るのを待つ
    for (let i = 0; i < 1800 && document.querySelector('#waDecide, #waDlg, #dgSafety, #dgBudget, .kt-ask-ov:not(.mail-ask-ov)'); i++) await new Promise((r) => setTimeout(r, 500));
    if (!MAIL_PENDING.has(String(c.id))) { pend.asking = false; return; }
    const what = [pend.isNew ? '新しい案件の登録' : (pend.kinds.has('content') ? '「内容」' : ''), pend.kinds.has('work_start') ? '「作業開始日」' : ''].filter(Boolean).join('と');
    const test = String(caseMailSettings.mode || 'test') !== 'live';
    const panelOpen = !$('modal').classList.contains('hidden') && cmCaseId === String(c.id);
    const msg = `${shortTheaterName(c.theater) || c.theater || ''}　${c.title || ''}\n${what}を保存しました。客先に通知メールを送りますか？\n` +
      `（「通知する」と5分後にまとめて送ります。${test ? 'いまはテスト中なので、テストの宛先にだけ届きます。' : ''}）`;
    const ans = await mailAskDialog(msg, !fromClose);
    pend.asking = false;
    if (ans === 'edit') {
      if (!panelOpen) openModal(c, 'full');
      showToastLite('直し終わって保存すると、もう一度「通知しますか？」と聞きます');
      return;
    }
    MAIL_PENDING.delete(String(c.id));
    if (ans !== 'send') { showToastLite('通知メールは送りません'); return; }
    const rows = [];
    if (pend.kinds.has('content') || pend.isNew) rows.push({ case_id: String(c.id), kind: 'content', detail: pend.isNew ? 'new' : '', old_content: pend.isNew ? '' : (pend.old || '') });
    if (pend.kinds.has('work_start') && c.workStartDate) rows.push({ case_id: String(c.id), kind: 'work_start', detail: '' });
    let { error } = await sb.from('case_mail_events').insert(rows);
    if (error && /old_content/.test(error.message || '')) ({ error } = await sb.from('case_mail_events').insert(rows.map((r) => { const x = Object.assign({}, r); delete x.old_content; return x; })));
    if (error) { window.KARTE.say('通知の予定を積めませんでした: ' + error.message); return; }
    showToastLite(test ? '通知メールを送ります（5分後・テストの宛先だけ）' : '通知メールを送ります（5分後にまとめて）');
  }
  function persistCases(arr) { (arr || []).forEach(fixCaseTheater); notifyCasesChanged(); return Promise.resolve(store.upsertCases(arr)).catch(onPersistError); }
  function removeCaseRemote(id) { return Promise.resolve(store.deleteCase(id)).catch(onPersistError); }

  let cases = [];               // 初期化は init() で（local or Supabase）
  let history = loadHistory();
  let companies = DEFAULT_COMPANIES.map((c) => ({ name: c.name, abbr: c.abbr, officialName: c.officialName || '', hqAddress: c.hqAddress || '' }));
  let theaterMaster = DEFAULT_THEATER_MASTER.slice();
  let theaterContacts = [];     // 各劇場情報: パートナー連絡先（init時に取得）
  let currentUser = null;
  let sortState = { field: null, direction: 'asc' };
  // ログイン時は「完了・取り下げ」をステータス絞り込みのチェックから外した状態で開始（seedDefaultStatusFilter）。
  // チェックボックスの状態＝表示、が一致する。「全件表示」ボタンで完了・取り下げも含めて全件表示できる。
  // 大口案件（見積り金額300万円以上）のみ表示するか
  let showBigOnly = false;
  const BIG_CASE_THRESHOLD = 3000000;
  // 各列の絞り込み: field -> 選択値の Set（未設定/全選択 = フィルタ無し）
  const columnFilters = {};
  // ステータス絞り込みの既定（完了・取り下げを外した状態）を作る
  function defaultStatusVisibleSet() {
    return new Set(STATUS_FILTER_ORDER.filter((s) => DEFAULT_HIDDEN_STATUSES.indexOf(s) === -1));
  }
  // ログイン時: 前回「表示する状態」で選んだものを復元（初めては7つとも非表示）
  const STATUS_SHOW_KEY = 'statusShowV1';
  function seedDefaultStatusFilter() {
    let shown = [];
    try { const a = JSON.parse(localStorage.getItem(userFilterKey(STATUS_SHOW_KEY)) || '[]'); if (Array.isArray(a)) shown = a; } catch (e) {}
    const visible = defaultStatusVisibleSet();
    shown.forEach((st) => { if (DEFAULT_HIDDEN_STATUSES.indexOf(st) !== -1) visible.add(st); });
    if (STATUS_FILTER_ORDER.every((st) => visible.has(st))) delete columnFilters['status'];
    else columnFilters['status'] = visible;
  }
  // その状態がいま一覧に出ているか（絞り込みなし＝全部出ている）
  function statusShown(st) { const set = columnFilters['status']; return !set || set.has(st); }
  // いま7つとも表示されているか
  function statusAllShown() { return DEFAULT_HIDDEN_STATUSES.every(statusShown); }
  function saveStatusShow() {
    try { localStorage.setItem(userFilterKey(STATUS_SHOW_KEY), JSON.stringify(DEFAULT_HIDDEN_STATUSES.filter(statusShown))); } catch (e) {}
  }
  // 「表示する状態」で1つの状態の表示/非表示を切り替える
  function toggleStatusShown(st) {
    let set = columnFilters['status'];
    if (!set) set = new Set(STATUS_FILTER_ORDER);
    if (set.has(st)) set.delete(st); else set.add(st);
    if (STATUS_FILTER_ORDER.every((x) => set.has(x))) delete columnFilters['status'];
    else columnFilters['status'] = set;
    saveStatusShow(); refresh();
  }
  function setAllStatusShown(show) {
    if (show) delete columnFilters['status'];
    else columnFilters['status'] = defaultStatusVisibleSet();
    saveStatusShow(); refresh();
  }
  // ⑥ ON/OFF はスイッチで表す（青＝ON）。文字はそのまま、状態は aria-checked で持つ
  function setSwitch(btn, on) {
    if (!btn) return;
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.classList.toggle('active', !!on);
  }
  // 「表示する状態 ▾」のボタンと中身を今の状態に合わせる（名前は今までの関数名のまま。描き直しのたびに呼ばれる）
  function updateShowAllBtn() {
    const btn = $('statusVisBtn'); if (!btn) return;
    const hidden = DEFAULT_HIDDEN_STATUSES.filter((st) => !statusShown(st)).length;
    btn.innerHTML = `表示する状態 <span class="sv-count">${hidden ? `非表示 ${hidden}` : 'すべて表示'}</span> ▾`;
    btn.classList.toggle('all-shown', !hidden);
    const box = $('statusVisList'); if (!box) return;
    box.innerHTML = DEFAULT_HIDDEN_STATUSES.map((st) =>
      `<button type="button" class="sw-btn sv-item" role="switch" aria-checked="${statusShown(st)}" data-sv="${escapeHtml(st)}"><span class="sw-t"></span>${escapeHtml(statusDisplayLabel(st))}</button>`).join('');
  }
  // R担当者ボタンによる絞り込み（空=全員）。複数選択時はいずれかが担当の案件（OR）
  let rPersonFilter = new Set();
  // 客先アカウント（劇場のアドレス）: 自分の劇場・その劇場だけを出すか
  let myAccount = null;
  let modalOrigTheater = '';
  let modalOrigRPerson = '';   // 開いた時のR担当者（異動・退職の人の名前は、変えなければそのまま保存できる）
  // R担当者は、上の担当者ボタンの人（在籍）だけ。候補にない名前は保存しない
  function rPersonError(v, orig) {
    if (!v || v === orig || loadTeam().indexOf(v) !== -1) return '';
    return `R担当者「${v}」は担当者の一覧にいません。上の担当者ボタンの人から選んでください。\n（担当者を足す時は ☰ その他 →「🗂 マスター編集」）`;
  }   // 開いた時の劇場名（前からある案件は、劇場を変えた時だけ「一覧にない劇場」を確かめる）
  let myTheaterOnly = true;
  // 客先(会社)ボタンによる絞り込み（空=全社・OR）
  const companyFilter = new Set();
  // 列幅のユーザー調整（field -> px）。localStorage に保存
  const COLW_KEY = 'colWidthsV1';
  let colWidths = {};
  try { const s = JSON.parse(localStorage.getItem(COLW_KEY)); if (s && typeof s === 'object') colWidths = s; } catch (e) {}
  let colWidthStyleEl = null;
  let contentEditCaseId = null;
  let aggMode = false;          // A集計表示モードか
  let taskMode = false;         // タスク管理表示モードか
  let showDoneTasks = false;    // タスク管理: 完了タスクも一覧に表示するか
  let NORMAL_THEAD_HTML = '';   // 通常モードのthead復元用

  const $ = (id) => document.getElementById(id);

  // ---------- storage ----------
  function loadCases() {
    let arr = [];
    let needResave = false;
    try {
      arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      if (!Array.isArray(arr)) { arr = []; needResave = true; }
    } catch (e) { arr = []; needResave = true; console.warn('案件データのJSONが破損していたため空で復旧'); }
    if (needResave) try { localStorage.setItem(STORAGE_KEY, '[]'); } catch (e) {}
    arr.forEach((c) => {
      if (!c.company) c.company = 'TOHOシネマズ';
      if (c.invoiceDate === undefined) c.invoiceDate = '';
      if (c.paymentDate === undefined) c.paymentDate = '';
      if (c.estimateName === undefined) c.estimateName = '';
      if (c.estimateAmount === undefined) c.estimateAmount = '';
      if (c.memo === undefined) c.memo = '';
      if (c.certNumber === undefined) c.certNumber = '';
      if (c.marginRate === undefined || c.marginRate === null || c.marginRate === '') c.marginRate = DEFAULT_MARGIN_RATE;
      if (!c.allocations || typeof c.allocations !== 'object') c.allocations = {};
    });
    return arr;
  }
  function saveCases() { localStorage.setItem(STORAGE_KEY, JSON.stringify(meetingActive(currentUser) ? meetingHiddenLocal.concat(cases) : cases)); }
  function loadHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
      return {
        theaters: stored.theaters && stored.theaters.length ? stored.theaters : DEFAULT_THEATERS.slice(),
        tcPersons: stored.tcPersons || [],
        rPersons: stored.rPersons || []
      };
    } catch (e) {
      return { theaters: DEFAULT_THEATERS.slice(), tcPersons: [], rPersons: [] };
    }
  }
  function saveHistory() { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

  // ---------- 会社（顧客）マスタ ----------
  function loadCompanies() {
    try {
      const stored = JSON.parse(localStorage.getItem(COMPANY_KEY));
      if (Array.isArray(stored) && stored.length > 0) {
        // 旧データ救済: 不足フィールドはデフォルト/空で補完
        let migrated = false;
        const arr = stored.map((c) => {
          const def = DEFAULT_COMPANIES.find((d) => d.name === c.name);
          const obj = {
            name: c.name,
            abbr: c.abbr || c.name,
            officialName: c.officialName != null ? c.officialName : (def ? def.officialName : ''),
            hqAddress:    c.hqAddress    != null ? c.hqAddress    : (def ? def.hqAddress    : ''),
            color:        c.color || ''
          };
          if (c.officialName == null || c.hqAddress == null) migrated = true;
          return obj;
        });
        if (migrated) try { localStorage.setItem(COMPANY_KEY, JSON.stringify(arr)); } catch (e) {}
        return arr;
      }
    } catch (e) {}
    const defaults = DEFAULT_COMPANIES.map((c) => ({ name: c.name, abbr: c.abbr, officialName: c.officialName || '', hqAddress: c.hqAddress || '' }));
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(defaults)); } catch (e) {}
    return defaults;
  }
  function saveCompanies(list) { localStorage.setItem(COMPANY_KEY, JSON.stringify(list)); }
  function companyNames() { return companies.map((c) => c.name); }
  function companyAbbr(name) {
    const found = companies.find((c) => c.name === name);
    return found ? found.abbr : (name || '');
  }
  function companyOfficialName(name) {
    const found = companies.find((c) => c.name === name);
    return found && found.officialName ? found.officialName : '';
  }
  function companyHqAddress(name) {
    const found = companies.find((c) => c.name === name);
    return found && found.hqAddress ? found.hqAddress : '';
  }

  // ---------- 客先（劇場）マスタ ----------
  function loadTheaterMaster() {
    try {
      const stored = JSON.parse(localStorage.getItem(THEATER_MASTER_KEY));
      if (Array.isArray(stored) && stored.length > 0) {
        let migrated = false;
        const arr = stored.map((t) => {
          const obj = { name: t.name || '', company: t.company || '', address: t.address || '' };
          // 旧データ移行: シネマサンシャイン → 佐々木興業（運営会社の正式名へ）
          if (obj.company === 'シネマサンシャイン') {
            obj.company = '佐々木興業';
            migrated = true;
          }
          return obj;
        });
        if (migrated) localStorage.setItem(THEATER_MASTER_KEY, JSON.stringify(arr));
        return arr;
      }
    } catch (e) {}
    const defaults = DEFAULT_THEATER_MASTER.map((t) => ({ name: t.name, company: t.company, address: t.address }));
    try { localStorage.setItem(THEATER_MASTER_KEY, JSON.stringify(defaults)); } catch (e) {}
    return defaults;
  }
  function saveTheaterMaster(list) { localStorage.setItem(THEATER_MASTER_KEY, JSON.stringify(list)); }
  // ---------- 各劇場情報: パートナー連絡先（ローカルモード用） ----------
  const THEATER_CONTACTS_KEY = 'cinema_theater_contacts';
  function loadTheaterContactsLocal() {
    try {
      const stored = JSON.parse(localStorage.getItem(THEATER_CONTACTS_KEY));
      if (Array.isArray(stored)) return stored;
    } catch (e) {}
    return [];
  }
  function saveTheaterContactsLocal(list) {
    try { localStorage.setItem(THEATER_CONTACTS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  // ---------- 個人タスク（担当者ごと・案件に紐づかないタスク／ローカルモード用） ----------
  const PERSONAL_TASKS_KEY = 'cinema_personal_tasks';
  function loadPersonalTasksLocal() {
    try {
      const stored = JSON.parse(localStorage.getItem(PERSONAL_TASKS_KEY));
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) return stored;
    } catch (e) {}
    return {};
  }
  function savePersonalTasksLocal(map) {
    try { localStorage.setItem(PERSONAL_TASKS_KEY, JSON.stringify(map)); } catch (e) {}
  }
  // ---------- 個人タスクの提案（ローカルモード用） ----------
  const TASK_SUGG_KEY = 'cinema_task_suggestions';
  function loadTaskSuggestionsLocal() {
    try { const a = JSON.parse(localStorage.getItem(TASK_SUGG_KEY)); if (Array.isArray(a)) return a; } catch (e) {}
    return [];
  }
  function saveTaskSuggestionsLocal(list) {
    try { localStorage.setItem(TASK_SUGG_KEY, JSON.stringify(list)); } catch (e) {}
  }
  // 案件の劇場名と完全一致する master 行を返す（無ければ undefined）
  function findTheaterInMaster(name) {
    if (!name) return undefined;
    return theaterMaster.find((t) => t.name === name);
  }
  // 会社の劇場の候補（閉館していない劇場・短い名前・50音順）
  function theaterChoices(company) {
    const list = visibleTheaterMaster().filter((t) => t.name && !t.closed && (!company || t.company === company));
    return Array.from(new Set(list.map((t) => shortTheaterName(t.name) || t.name))).sort((a, b) => a.localeCompare(b, 'ja'));
  }
  // その会社の劇場の一覧に、この名前（短い名前・別の呼び方でも）の劇場があるか → 正式名（無ければ ''）
  function masterTheaterOf(name, company) {
    const t = canonTheaterName(String(name || '').trim(), company);
    const hit = theaterMaster.find((x) => x.name === t && x.company === company);
    return hit ? hit.name : '';
  }
  // 新しい劇場の正式名: その会社のほかの劇場と同じ頭の言葉＋打った名前（例: TOHO で「豊洲」→「TOHOシネマズ 豊洲」）
  function newTheaterName(typed, company) {
    typed = String(typed || '').trim();
    const heads = {};
    theaterMaster.filter((t) => t.company === company && t.name).forEach((t) => {
      const m = t.name.match(/^(\S+)[\s　]+\S/); if (m) heads[m[1]] = (heads[m[1]] || 0) + 1;
    });
    const head = Object.keys(heads).sort((a, b) => heads[b] - heads[a])[0] || company;
    if (!head || typed.indexOf(head) === 0) return typed;
    return head + ' ' + typed;
  }
  function visibleTheaterMaster() {
    if (isPrivileged(currentUser)) return theaterMaster;
    const co = customerCompany(currentUser);
    return theaterMaster.filter((t) => t.company === co);
  }
  // CSSクラスに安全な文字列化（スペース・記号を_に）
  function safeClass(s) {
    return String(s || '').replace(/[^A-Za-z0-9_぀-ゟ゠-ヿ一-鿿]/g, '_');
  }
  // 会社の一覧表示色（ユーザー設定。未設定はCSSの既定色クラスにフォールバック）
  function companyColor(name) {
    const c = companies.find((x) => x.name === name);
    return c && c.color ? c.color : '';
  }
  function contrastText(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
    if (!m) return '#1e293b';
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#1e293b' : '#fff';
  }
  function companyColorAvailable() { return store.mode === 'local' || companyColorSupported; }
  function addToHistory(key, value) {
    if (!value) return;
    const v = String(value).trim();
    if (!v) return;
    const list = history[key];
    const idx = list.indexOf(v);
    if (idx >= 0) list.splice(idx, 1);
    list.unshift(v);
    if (list.length > 200) list.length = 200;
  }
  function fillDatalist(id, items) {
    const dl = $(id); dl.innerHTML = '';
    items.forEach((v) => { const o = document.createElement('option'); o.value = v; dl.appendChild(o); });
  }
  // 現在のユーザーが見られる案件のみ（客先は自社のみ／Supabase版ではRLSで既に絞られている）
  function visibleCases() {
    if (isPrivileged(currentUser)) return cases;
    const co = customerCompany(currentUser);
    // 客先には自社案件のみ、かつ 種別=タスク の案件は見せない
    let list = cases.filter((c) => c.company === co && c.category !== 'タスク' && !hiddenTestCase(c));
    // 劇場のアドレスで入った人は、その劇場の案件だけ（上の「全部の劇場」を押すと会社の全部）
    if (myAccount && myAccount.theater && myTheaterOnly) list = list.filter((c) => c.theater === myAccount.theater);
    return list;
  }
  function renderDatalists() {
    // 履歴を 客先マスタ + 案件由来 で動的生成（ロール別に自動分離）
    const theaters = new Set();
    // 客先マスタから（ロールでフィルタ済）
    visibleTheaterMaster().forEach((t) => { if (t.name) theaters.add(t.name); });
    // 案件からも追加（マスタ未登録の劇場でも候補に出る）
    const tcPersons = new Set();
    const rPersons = new Set();
    visibleCases().forEach((c) => {
      if (c.theater) theaters.add(c.theater);
      if (c.tcPerson) tcPersons.add(c.tcPerson);
      if (c.rPerson) rPersons.add(c.rPerson);
    });
    // 劇場名の候補: 編集パネルで選んでいる会社の劇場だけ（閉館は出さない）。短い名前で出す（保存の時に正式名にそろえる）
    const formCo = (isPrivileged(currentUser) && $('company')) ? $('company').value : customerCompany(currentUser);
    fillDatalist('theaterList', theaterChoices(formCo));
    // 客先担当者の候補: 選んでいる会社の、過去の案件の担当者と客先アカウントの担当者名
    const tcs = new Set();
    visibleCases().forEach((c) => { if (c.tcPerson && (!formCo || c.company === formCo)) tcs.add(c.tcPerson); });
    (accountsCache || []).forEach((a) => { if (a.person && (!formCo || a.company === formCo)) tcs.add(String(a.person).split(/[\s　]/)[0]); });
    fillDatalist('tcPersonList', [...tcs].sort((a, b) => a.localeCompare(b, 'ja')));
    // R担当者の候補: 上の担当者ボタンの人（在籍）だけ
    fillDatalist('rPersonList', loadTeam());
  }
  // 会社セレクト（モーダル/フィルタ）を会社マスタから再構築
  function populateCompanySelects() {
    const sel = $('company');
    const prevSel = sel.value;
    sel.innerHTML = companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (prevSel && companyNames().indexOf(prevSel) !== -1) sel.value = prevSel;
    renderCompanyBar();
  }
  async function addCompany() {
    const name = prompt('追加する顧客（会社）の正式名称を入力してください');
    if (!name || !name.trim()) return;
    const nm = name.trim();
    if (companyNames().indexOf(nm) !== -1) { alert('既に登録されています: ' + nm); return; }
    const abbrInput = prompt('一覧表示用の略称（短縮名）を入力してください', nm.slice(0, 4));
    const abbr = (abbrInput && abbrInput.trim()) ? abbrInput.trim() : nm;
    try {
      await store.addCompanyRemote({ name: nm, abbr: abbr, officialName: '', hqAddress: '' });
    } catch (err) {
      onPersistError(err);
      return;
    }
    companies.push({ name: nm, abbr: abbr, officialName: '', hqAddress: '' });
    if (store.mode === 'local') saveCompanies(companies);
    populateCompanySelects();
    $('company').value = nm;
  }

  // ---------- auth ----------
  // ---------- team ----------
  let staffList = null;   // R担当者のマスター（staff）。null＝表が無い（今までどおりブラウザの覚え）
  function loadTeam() {
    // マスターに在籍の人がいる時だけマスターを使う（表が空・読めない時は今までどおり）
    if (staffList && staffList.some((x) => x.active !== false)) return staffList.filter((x) => x.active !== false).map((x) => x.name);
    try {
      const t = JSON.parse(localStorage.getItem(TEAM_KEY));
      return Array.isArray(t) && t.length > 0 ? t : DEFAULT_TEAM.slice();
    } catch (e) { return DEFAULT_TEAM.slice(); }
  }
  function saveTeam(team) { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); }

  function defaultAllocations(c, team) {
    const amount = Number(c.estimateAmount) || 0;
    const result = {};
    team.forEach((m) => { result[m] = 0; });
    if (amount > 0 && amount < SMALL_CASE_THRESHOLD) {
      const eligible = team.filter((m) => m !== EXCLUDED_FROM_BASE);
      eligible.forEach((m) => { result[m] = BASE_RATE; });
      const base = eligible.length * BASE_RATE;
      // チームが大きい(>20人)場合は5%ずつで既に100%超 → 残差0以下にしない
      const residual = Math.max(0, 100 - base);
      // R担当者 名前が team に含まれていれば残差を加算
      if (c.rPerson && team.indexOf(c.rPerson) !== -1) {
        result[c.rPerson] = (result[c.rPerson] || 0) + residual;
      }
      // team外なら残差は未配分 → sumが100未満になりNG表示
    }
    return result;
  }
  // 表示用: チームメンバー分を返す。未知メンバーのデータは破壊せず保持される(stored側)
  function getAllocations(c, team) {
    const stored = c.allocations || {};
    const hasAny = Object.keys(stored).some((k) => Number(stored[k]) > 0);
    if (hasAny) {
      const result = {};
      team.forEach((m) => { result[m] = Number(stored[m]) || 0; });
      return result;
    }
    return defaultAllocations(c, team);
  }
  function sumAllocations(alloc) {
    return Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  function loadAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; } }
  function saveAuth(user) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
  function clearAuth() { localStorage.removeItem(AUTH_KEY); }
  // 打合せモード: 菱熱の人が、客先と一緒に画面を見る時に、選んだ会社の「客先の見せ方」にする。
  // ほかの会社の案件・劇場は読み込まない（画面のどこにも出ない）。このタブの中だけ（sessionStorage）。
  function realPrivileged(user) { return !!(user && user.domain === PRIVILEGED_DOMAIN); }
  function meetingActive(user) { return !!(meetingCompany && realPrivileged(user) && currentUser && user.email === currentUser.email); }
  function isPrivileged(user) { if (meetingActive(user)) return false; return realPrivileged(user); }
  // 打合せモードでは、選んだ会社の案件だけを残し、社内情報は消しておく（念のため。保存では送らない）
  function meetingScrub(list) {
    if (!meetingActive(currentUser)) return list;
    return list.filter((c) => c.company === meetingCompany).map((c) => Object.assign(c, { memo: '', adviceNote: '', allocations: {}, tasks: [], purchases: [] }));
  }
  // 客先ユーザーが閲覧できる会社名（受注者=ryonetsuはnull＝全社）。未知の客先ドメインは既定でTOHO。
  function customerCompany(user) {
    if (meetingActive(user)) return meetingCompany;
    if (!user || isPrivileged(user)) return null;
    return CUSTOMER_DOMAIN_COMPANY[user.domain] || 'TOHOシネマズ';
  }
  // 表示・保存で使う「その人の会社」。受注者は指定値（既定TOHO）、客先は自分の会社に固定。
  function scopedCompany(fallback) {
    return isPrivileged(currentUser) ? fallback : (customerCompany(currentUser) || 'TOHOシネマズ');
  }
  function attemptLogin(email, password) {
    const e = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, msg: 'メールアドレスの形式が正しくありません。' };
    const local = e.split('@')[0];
    const domain = e.split('@')[1];
    if (!local) return { ok: false, msg: 'メールアドレスが不正です。' };
    if ((password || '').toLowerCase() !== local.toLowerCase()) return { ok: false, msg: 'パスワードが正しくありません。' };
    return { ok: true, user: { email: e, domain: domain, loginAt: new Date().toISOString() } };
  }

  // ---------- date helpers ----------
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function daysBetween(a, b) {
    if (!a || !b) return null;
    const x = new Date(a + 'T00:00:00'), y = new Date(b + 'T00:00:00');
    if (isNaN(x) || isNaN(y)) return null;
    return Math.floor((y - x) / 86400000);
  }
  function lastDayOfMonth(yearMonth) {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m, 0);
    return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // MM/DD 形式で表示（テーブル用）
  function fmtDateShort(s) {
    if (!s) return '';
    const p = s.split('-');
    if (p.length === 3) return `${p[1]}/${p[2]}`;
    return s;
  }
  // 日付＋時刻（時刻があれば付ける）
  function fmtDateTime(date, time) {
    const d = fmtDateShort(date);
    if (!d) return '';
    return time ? d + ' ' + time : d;
  }
  // YYYY/MM/DD 形式（編集中表示・モーダル用）
  function fmtDateFull(s) {
    if (!s) return '';
    return s.replace(/-/g, '/');
  }
  // 各種入力を YYYY-MM-DD に正規化
  // 例: 528 / 0528 / 5/28 / 5-28 / 20260528 / 2026/5/28 / 2026-5-28
  function parseSmartDate(input) {
    if (window.DATEIN) return window.DATEIN.parse(input);   // dateinput.js（全角→半角・「2026/1/9（金）」・年なしは今日以降で一番近い日）
    if (input == null) return '';
    const s = String(input).trim().replace(/\s/g, '');
    if (!s) return '';
    const cy = new Date().getFullYear();
    let m;
    // YYYY/MM/DD / YYYY-MM-DD / YYYY.MM.DD
    m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) return validISO(+m[1], +m[2], +m[3]);
    // YYYYMMDD (8桁)
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return validISO(+m[1], +m[2], +m[3]);
    // MM/DD / M/D / MM-DD
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    // MMDD (4桁)
    m = s.match(/^(\d{2})(\d{2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    // MDD (3桁) → M-DD
    m = s.match(/^(\d{1})(\d{2})$/);
    if (m) return validISO(cy, +m[1], +m[2]);
    return null;
  }
  function validISO(y, mo, d) {
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // ---------- status auto-derive ----------
  // 文字列に「保留」が含まれるか。ただし明示的な否定/解除文言は除外
  // 例: 保留 / 保留中 / 要保留対応 → 保留扱い
  //     保留しない / 保留解除 / 保留中止 / 保留終了 / 保留不要 → 通常扱い
  function hasHoldKeyword(text) {
    if (!text) return false;
    if (!/保留/.test(text)) return false;
    if (/保留(?:しない|しません|解除|中止|終了|不要|なし|無し)/.test(text)) return false;
    return true;
  }
  // 後方互換のため旧名は残す（誰かが直接呼んでもOK）
  const memoHasHold = hasHoldKeyword;
  function deriveStatus(c) {
    // メモまたは内容に「保留」と記入されていたら最優先で 保留
    if (hasHoldKeyword(c.memo) || hasHoldKeyword(c.content)) return '保留';
    const today = todayStr();
    if (c.paymentDate && c.paymentConfirmed !== false) return '入金済'; // 確認済のみ入金済（予定は請求済のまま）
    if (c.invoiceDate)  return '請求済';
    // 見積り0円（無償対応）で作業開始日・終了日が入っていれば「完了」
    if (isZeroAmount(c) && c.workStartDate && c.workEndDate) return '完了';
    if (c.workEndDate)  return '対応済み';
    if (c.workStartDate && c.workStartDate <= today) return '作業中';
    if (c.scheduleAdjusting) return '日程調整中'; // 作業開始日に0（自動）
    if (c.quoteDate && c.quoteDate <= today)         return '見積り提出済';
    if (c.surveyDate && c.surveyDate <= today)       return '見積り中';
    if (c.surveyAdjusting && !c.surveyDate)          return '調査日調整中';   // 初動報告で C工事（調査日を調整中）
    return '受付';
  }
  // 見積り金額が明示的に0円か（空欄は除外）
  function isZeroAmount(c) {
    return c.estimateAmount !== '' && c.estimateAmount != null && Number(c.estimateAmount) === 0;
  }
  // 請求日(ISO)の翌月末（YYYY-MM-DD）を返す
  function endOfNextMonth(iso) {
    if (!iso) return '';
    const [y, m] = String(iso).split('-').map(Number);
    if (!y || !m) return '';
    const year = m === 12 ? y + 1 : y;
    const month = m === 12 ? 1 : m + 1; // 1-12
    const lastDay = new Date(year, month, 0).getDate(); // 1-indexed month の末日
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
  function statusDisplayLabel(code) {
    const map = isPrivileged(currentUser) ? ROLE_STATUS.ryo : ROLE_STATUS.toho;
    const label = map[code] || code;
    // 客先ログインでは「客先対応中」等の“客先”を会社名にする（表記ゆれ防止）
    if (!isPrivileged(currentUser)) return label.replace(/客先/g, customerCompany(currentUser) || '客先');
    return label;
  }
  // 実効ステータス: 手動上書き(statusOverride)があればそれを、無ければ自動判定(deriveStatus)を返す
  function statusOf(c) {
    return c.statusOverride ? c.statusOverride : deriveStatus(c);
  }
  function isStatusManual(c) { return !!c.statusOverride; }
  // 手動上書きが使えるか（ローカルモード or DBに status_override 列がある時）
  function statusOverrideAvailable() { return store.mode === 'local' || statusOverrideSupported; }

  // 日本の祝日（振替休日・国民の休日を含む。2025〜2028）。黄/赤の遅延判定で土日と共に除外
  const JP_HOLIDAYS = new Set([
    '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24','2025-03-20','2025-04-29',
    '2025-05-03','2025-05-04','2025-05-05','2025-05-06','2025-07-21','2025-08-11','2025-09-15',
    '2025-09-23','2025-10-13','2025-11-03','2025-11-23','2025-11-24',
    '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20','2026-04-29','2026-05-03',
    '2026-05-04','2026-05-05','2026-05-06','2026-07-20','2026-08-11','2026-09-21','2026-09-22',
    '2026-09-23','2026-10-12','2026-11-03','2026-11-23',
    '2027-01-01','2027-01-11','2027-02-11','2027-02-23','2027-03-21','2027-03-22','2027-04-29',
    '2027-05-03','2027-05-04','2027-05-05','2027-07-19','2027-08-11','2027-09-20','2027-09-23',
    '2027-10-11','2027-11-03','2027-11-23',
    '2028-01-01','2028-01-10','2028-02-11','2028-02-23','2028-03-20','2028-04-29','2028-05-03',
    '2028-05-04','2028-05-05','2028-07-17','2028-08-11','2028-09-18','2028-09-22','2028-10-09',
    '2028-11-03','2028-11-23'
  ]);
  function parseLocalDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function isBusinessDay(dt) {
    const dow = dt.getDay();
    if (dow === 0 || dow === 6) return false; // 土日
    return !JP_HOLIDAYS.has(isoOf(dt));        // 祝日
  }
  // a の翌日〜b の間の営業日数（土日祝を除く）
  function businessDaysBetween(aIso, bIso) {
    const a = parseLocalDate(aIso), b = parseLocalDate(bIso);
    if (!a || !b || b <= a) return 0;
    let count = 0;
    const cur = new Date(a);
    cur.setDate(cur.getDate() + 1);
    while (cur <= b) {
      if (isBusinessDay(cur)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }
  // ===== 二重登録の疑い =====
  // 疑いあり＝dup_suspect_id に相手の案件idが入っている（菱熱のみ表示・解除できる）
  function isDupSuspect(c) { return !!(c && c.dupSuspectId) && isPrivileged(currentUser); }
  function dupBadgeHtml(c) {
    if (!isDupSuspect(c)) return '';
    const other = cases.find((x) => String(x.id) === String(c.dupSuspectId));
    const label = other ? `${shortTheaterName(other.theater)}／${(other.estimateName || other.content || '').slice(0, 20)}` : '既存案件';
    return `<span class="dup-badge" data-action="dup-open" data-id="${escapeHtml(c.id)}" title="似た案件があります（${escapeHtml(label)}）。クリックで比較・解除">⚠️二重の可能性</span> `;
  }
  // 文章の似ぐあい（0〜1）。GAS側(textSimilarity_)と同じ考え方＝共通バイグラムの割合
  function normalizeForSim(s) {
    return String(s || '')
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .toLowerCase().replace(/[\s　、。．，./\-ー―（）()\[\]「」【】：:；;]/g, '');
  }
  function textSimilarity(a, b) {
    const x = normalizeForSim(a), y = normalizeForSim(b);
    if (x.length < 2 || y.length < 2) return 0;
    const setX = new Set(), setY = new Set();
    for (let i = 0; i < x.length - 1; i++) setX.add(x.substr(i, 2));
    for (let i = 0; i < y.length - 1; i++) setY.add(y.substr(i, 2));
    if (!setX.size || !setY.size) return 0;
    let hit = 0;
    setX.forEach((g) => { if (setY.has(g)) hit++; });
    return hit / Math.min(setX.size, setY.size);
  }
  const DUP_SIM_THRESHOLD = 0.35;   // これ以上似ていたら二重の可能性あり
  const DUP_LOOKBACK_DAYS = 90;     // 受付日がこの日数以内の案件だけ比較
  // 新規登録しようとしている案件と二重の可能性がある既存案件を探す（無ければ null）
  function findDupSuspect(data) {
    if (!isPrivileged(currentUser)) return null;
    const theaterCore = normalizeForSim(shortTheaterName(data.theater));
    if (!theaterCore) return null;
    const baseAt = data.receivedDate ? new Date(data.receivedDate).getTime() : Date.now();
    const limitMs = DUP_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    const newText = [data.estimateName || '', data.content || ''].join(' ');
    let best = null, bestScore = 0;
    cases.forEach((x) => {
      if (String(x.id) === String(data.id)) return;                      // 自分自身は除く
      if (x.company !== data.company) return;                            // 会社が違えば別
      if (normalizeForSim(shortTheaterName(x.theater)) !== theaterCore) return; // 劇場が違えば別
      if (TERMINAL_LIKE_STATUSES.has(statusOf(x))) return;               // 終了案件は対象外
      if (x.receivedDate) {
        const d = new Date(x.receivedDate).getTime();
        if (!isNaN(d) && Math.abs(baseAt - d) > limitMs) return;         // 期間外は対象外
      }
      let score = textSimilarity(newText, [x.estimateName || '', x.content || ''].join(' '));
      if (data.category && x.category && data.category === x.category) score += 0.10;
      if (score > bestScore) { bestScore = score; best = x; }
    });
    return (best && bestScore >= DUP_SIM_THRESHOLD) ? best : null;
  }
  // 編集ポップアップ上部の「二重登録の可能性」バナー
  let dupBannerCase = null;
  function renderDupBanner(caseObj) {
    const box = $('dupBanner'); if (!box) return;
    dupBannerCase = (caseObj && isDupSuspect(caseObj)) ? caseObj : null;
    box.classList.toggle('hidden', !dupBannerCase);
    if (!dupBannerCase) return;
    const other = cases.find((x) => String(x.id) === String(dupBannerCase.dupSuspectId));
    $('dupBannerInfo').textContent = other
      ? `似ている案件: ${other.theater || '(劇場未入力)'}／受付 ${other.receivedDate || '-'}／${(other.estimateName || other.content || '').slice(0, 40)}`
      : '（似ていた案件は見つかりませんでした。既に削除された可能性があります）';
    $('dupOpenBtn').classList.toggle('hidden', !other);
  }
  // 二重の疑いを解除（人が確認して「二重ではない」と判断した時）
  function clearDupSuspect(c) {
    c.dupSuspectId = '';
    c.updatedAt = new Date().toISOString();
    persistCase(c);
    refresh();
  }

  // ===== 遅れの色（2026-11-17 小山さんと決めた） =====
  //  黄＝初動対応・区分判定の報告がまだ（自動登録の TOHO 案件）
  //  オレンジ＝初動報告の翌日から平日3日を過ぎても調査日が決まっていない（報告の要らない案件は受付日から数える）
  //  赤＝現調の翌日から平日3日を過ぎても見積りが出ていない（期日免除の案件は赤にしない）
  //  青＝見積り提出済（発注待ち）。黄緑は廃止
  //  遅れの色（黄・オレンジ・赤）は 修理・メンテナンス・点検 だけ。行全体を薄く塗る
  const DELAY_CATEGORIES = new Set(['修理', 'メンテナンス', '点検']);
  const DUE_DAYS = 3;   // 平日3日（土日祝は数えない）
  // 手で選んだステータスは、日付が新しく入ったら自動に戻す（取り下げ・失注は戻さない。DB のしくみ cases_auto_status と同じ決まり）
  const AUTO_STATUS_DATES = ['surveyDate', 'quoteDate', 'workStartDate', 'workEndDate', 'invoiceDate', 'paymentDate'];
  // 手で調査日・作業開始日を入れた・変えた時: 保存のあと「作業申請書を作りますか？」（作る／申請不要／あとで）。菱熱だけ
  function waAfterDates(c, prev) {
    if (!realPrivileged(currentUser) || store.mode !== 'supabase' || !caseMailSupported) return;
    if (c.company !== WA_COMPANY) return;   // 今は TOHO だけ
    const changed = WA_PURPOSES.filter((P) => c[P.field] && c[P.field] !== ((prev || {})[P.field] || '')).map((P) => ({ purpose: P.key, from: (prev || {})[P.field] || '' }));
    if (!changed.length) return;
    const id = c.id;
    setTimeout(() => { if (window.WORKAPP) window.WORKAPP.decide(id, changed.map((x) => x.purpose), { why: 'manual', from: changed }); }, 600);
  }
  function autoClearOverride(c, prev) {
    if (!c || !c.statusOverride || c.statusOverride === '取り下げ' || c.statusOverride === '失注') return;
    if (prev && prev.statusOverride !== c.statusOverride) return;   // 同じ保存でステータスも選び直した
    if (AUTO_STATUS_DATES.some((f) => c[f] && c[f] !== (prev ? prev[f] : ''))) c.statusOverride = '';
    if (c.surveyDate) c.surveyAdjusting = false;
  }
  // ===== 初動対応・区分判定の報告（自動登録の TOHO 案件・2026-11-17） =====
  const IR_KUBUN = {
    A: 'A工事のため、デベロッパー様へご報告をお願いいたします。',
    B: 'B工事のため、進め方を本社様と協議いたします。',
    C: '調査日程を調整しております。確定出来次第、ヘルプデスクからのメールで追ってご連絡いたします。',
    '他社': '既存の保守会社様にて対応いただく案件と判断いたしました。'
  };
  const irKubunLabel = (k) => k === '他社' ? '他社案件' : k + '工事';
  function irSubject(c) { return `【菱熱工業】${shortTheaterName(c.theater) || c.theater} ${c.title || c.category || 'ご依頼の件'} 初動対応・区分判定のご報告`; }
  function irBody(c, k) {
    const lines = [`${c.company} ご担当者様`, '', 'いつもお世話になっております。菱熱工業です。', '下記のご依頼について、初動対応・区分判定をご報告いたします。', '',
      `■ 劇場: ${c.theater || ''}`];
    if (c.title) lines.push(`■ 案件名: ${c.title}`);
    lines.push(`■ 内容: ${String(c.content || '').replace(/\s*\n\s*/g, ' ')}`, '', `■ 区分: ${irKubunLabel(k)}`, `→ ${IR_KUBUN[k]}`, '',
      'ご不明な点は、このメールにそのままご返信ください。', '菱熱工業株式会社');
    return lines.join('\n');
  }
  function pendingInitialReports() { return cases.filter((c) => needsInitialReport(c)).sort((a, b) => String(a.receivedDate).localeCompare(String(b.receivedDate))); }
  let irOpen = false;
  function checkInitialReportGate() {
    if (irOpen || !initialReportSupported || !realPrivileged(currentUser) || !isPrivileged(currentUser)) return;
    if (!(companyFilter.size === 1 && companyFilter.has('TOHOシネマズ'))) return;   // 上で TOHO に絞った時だけ
    const list = pendingInitialReports();
    if (list.length) openInitialReport(list[0], { forced: true, left: list.length });
  }
  async function openInitialReport(c, opt) {
    const K = window.KARTE; opt = opt || {};
    if (irOpen) return; irOpen = true;
    document.querySelectorAll('#irDlg').forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay ir-overlay'; ov.id = 'irDlg';
    let k = '', edited = false;
    let to = ''; try { to = caseMailSupported ? await caseMailRecipientsText(c) : ''; } catch (e) { to = ''; }
    ov.innerHTML = `<div class="kt-dialog kt-dialog-mid ir-dlg"><div class="kt-dlg-head">📣 初動対応・区分判定の報告${opt.forced ? `<span class="ir-left">TOHO の報告がまだ ${opt.left} 件</span>` : '<button type="button" class="close-btn" data-irx>×</button>'}</div>
      <div class="kt-dlg-body">
        ${opt.forced ? '<p class="ir-must">TOHO の自動登録の案件は、初動報告をしないと一覧で見られません（契約）。区分を選んで送ってください。</p>' : ''}
        <table class="ms-table"><tr><th>劇場</th><td>${escapeHtml(c.theater || '')}</td></tr>
          <tr><th>受付日</th><td>${escapeHtml(c.receivedDate || '')}</td></tr>
          <tr><th>案件名</th><td>${escapeHtml(c.title || '')}</td></tr>
          <tr><th>内容</th><td class="ir-content">${escapeHtml(c.content || '')}</td></tr></table>
        <div class="ir-kubun">区分: ${['A', 'B', 'C', '他社'].map((x) => `<label><input type="radio" name="irK" value="${x}"> ${x === '他社' ? '他社案件（既存の保守会社が対応）' : x + '工事'}</label>`).join('')}</div>
        <p class="ms-note ir-to">${escapeHtml(to)}</p>
        <textarea id="irBody" rows="12" class="ir-body" placeholder="区分を選ぶと、送る文が出ます（直せます）"></textarea>
      </div><div class="kt-dlg-foot">
        ${opt.forced ? '<button type="button" data-irother>ほかの会社を見る</button>' : '<button type="button" data-irx>やめる</button>'}
        <button type="button" class="danger" data-irdrop>案件ではない（取り下げにする）</button>
        <button type="button" class="primary" data-irsend disabled>送って報告済みにする</button></div></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); irOpen = false; };
    ov.querySelector('#irBody').addEventListener('input', () => { edited = true; });
    ov.addEventListener('change', (e) => {
      if (e.target.name !== 'irK') return;
      k = e.target.value;
      if (!edited || !ov.querySelector('#irBody').value.trim()) { ov.querySelector('#irBody').value = irBody(c, k); edited = false; }
      ov.querySelector('[data-irsend]').disabled = false;
    });
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-irx]')) { close(); return; }
      if (e.target.closest('[data-irother]')) {
        close(); companyFilter.clear(); saveUserFilter('coFV1', companyFilter); renderCompanyBar(); refresh();
        showToastLite('全社にしました（TOHO の報告がまだの案件は、中身を隠しています）'); return;
      }
      if (e.target.closest('[data-irdrop]')) {
        if (!(await K.ask('この案件を「取り下げ」にします（初動報告のメールは送りません）。よろしいですか？', { ok: '取り下げにする', danger: true }))) return;
        c.statusOverride = '取り下げ'; c.updatedAt = new Date().toISOString();
        await persistCase(c); close(); render(); return;
      }
      if (e.target.closest('[data-irsend]')) {
        const body = ov.querySelector('#irBody').value.trim();
        if (!k || !body) { K.say('区分を選んで、送る文を確かめてください'); return; }
        const btn = ov.querySelector('[data-irsend]'); btn.disabled = true; btn.textContent = '送っています…';
        try {
          if (caseMailSupported && store.mode === 'supabase') {
            const { error } = await sb.from('case_mail_events').insert({ case_id: String(c.id), kind: 'initial_report', detail: JSON.stringify({ subject: irSubject(c), body, kubun: k }) });
            if (error) throw error;
          }
          c.initialReportAt = new Date().toISOString(); c.initialReportKubun = k; c.initialReportBy = currentUserName();
          if (k === 'C') c.surveyAdjusting = !c.surveyDate;
          else if (k === '他社') c.statusOverride = '他社対応';   // 既存の保守会社が対応。保守会社名・金額は編集画面の「🏢 他社案件」で
          else if (!c.statusOverride) c.statusOverride = '客先対応中';   // A・B: 劇場側の答え待ち（TOHO には「協議中」）
          c.updatedAt = new Date().toISOString();
          await persistCase(c);
          close(); render();
          showToastLite('初動報告を送りました（' + irKubunLabel(k) + '）' + (caseMailSettings.mode === 'live' ? '' : '｜🧪 テスト中: 客先には届きません'));
        } catch (err) { btn.disabled = false; btn.textContent = '送って報告済みにする'; K.say('送れませんでした: ' + (err.message || err)); }
      }
    });
  }
  // 編集画面のステータス（菱熱）: 「自動（今は ○○）」か、手で選ぶ。スマホでもここで変えられる
  function renderStatusRow(c) {
    const row = $('statusRow'); if (!row) return;
    const show = !!(c && isPrivileged(currentUser) && statusOverrideAvailable());
    row.classList.toggle('hidden', !show);
    if (!show) return;
    const sel = $('statusOverrideSel');
    sel.innerHTML = `<option value="">自動（今は「${escapeHtml(statusDisplayLabel(deriveStatus(c)))}」）</option>` +
      Object.keys(STATUS_SORT_ORDER).map((code) => `<option value="${escapeHtml(code)}"${c.statusOverride === code ? ' selected' : ''}>${escapeHtml(statusDisplayLabel(code))}</option>`).join('');
  }
  // 編集画面の「🏢 他社案件」（菱熱・TOHO の案件だけ）。支払額はその場で計算
  function renderOtherRow() {
    const row = $('otherRow'); if (!row) return;
    const show = !!(tohoV2Supported && isPrivileged(currentUser) && $('company').value === 'TOHOシネマズ');
    row.classList.toggle('hidden', !show);
    if (!show) return;
    const dl = $('otherVendorList');
    if (dl) dl.innerHTML = [...new Set(cases.map((x) => (x.otherVendor || '').trim()).filter(Boolean))].sort().map((v) => `<option value="${escapeHtml(v)}">`).join('');
    renderOtherFee();
  }
  function renderOtherFee() {
    const el = $('otherFee'); if (!el) return;
    const tmp = { otherVendor: $('otherVendor').value.trim(), otherAmount: $('otherAmount').value.replace(/[^\d]/g, '') === '' ? '' : Number($('otherAmount').value.replace(/[^\d]/g, '')),
      otherRate: $('otherRate').value.trim() === '' ? '' : Number($('otherRate').value.trim()) };
    const r = otherRateOf(tmp);
    $('otherRate').placeholder = r.auto && r.rate != null ? `利率 %（空なら自動: ${r.rate}%）` : '利率 %（空なら自動）';
    el.textContent = tmp.otherVendor && r.rate != null && tmp.otherAmount !== '' ? `菱熱への支払額 ${fmtAmount(otherFeeOf(tmp))}（${r.rate}%${r.auto ? '・自動' : ''}）` : '';
  }
  function renderIrRow(c) {
    const row = $('irRow'); if (!row) return;
    const show = !!(c && initialReportSupported && isPrivileged(currentUser) && c.company === 'TOHOシネマズ');
    row.classList.toggle('hidden', !show);
    if (!show) return;
    const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()}`; };
    $('irState').textContent = c.initialReportAt ? `✅ 報告済み（${irKubunLabel(c.initialReportKubun)}・${fmt(c.initialReportAt)}・${c.initialReportBy || ''}）`
      : (needsInitialReport(c) ? '⚠ まだ（自動登録の TOHO 案件なので必須）' : '（自動登録の案件ではないので必須ではありません）');
    $('irOpenBtn').classList.toggle('hidden', !!c.initialReportAt);
    $('irOpenBtn').onclick = () => { closeModal(); openInitialReport(c); };
  }
  function needsInitialReport(c) {
    return !!(initialReportSupported && c && c.company === 'TOHOシネマズ' && c.origin === 'auto' && !c.initialReportAt &&
      !TERMINAL_LIKE_STATUSES.has(statusOf(c)));
  }
  function rowColorClass(c) {
    const st = statusOf(c);
    if (st === '見積り提出済') return isPrivileged(currentUser) ? 'row-blue' : '';   // 客先の画面は赤・黄・オレンジだけ（2026-11-18 小山さん）
    if (st === '保留' || st === '日程調整中' || st === '客先対応中' || NO_COLOR_STATUSES.has(st) || TERMINAL_LIKE_STATUSES.has(st)) return '';
    if (!DELAY_CATEGORIES.has(c.category)) return '';
    // 「繰越」の案件（保守の契約など）は遅れの色を付けない（2026-11-17 小山さん）
    if (/繰越/.test([c.theater, c.title, c.content, c.estimateName].join(' '))) return '';
    const today = todayStr();
    if (needsInitialReport(c)) return 'row-yellow';
    if (!c.surveyDate) {
      // オレンジは「受付」「調査日調整中」の案件だけ。見積り中など先に進んだ案件で調査日が空なら、色は付けず「調査日が空」と出す
      if (st !== '受付' && st !== '調査日調整中') return '';
      const base = (c.initialReportAt ? String(c.initialReportAt).slice(0, 10) : '') || c.receivedDate;
      if (base && businessDaysBetween(base, today) > DUE_DAYS) return 'row-orange';
      return '';
    }
    if (st === '見積り中' && !c.dueExempt && businessDaysBetween(c.surveyDate, today) > DUE_DAYS) return 'row-red';
    return '';
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtAmount(n) {
    if (n === '' || n == null) return '';
    const num = Number(n);
    if (isNaN(num)) return escapeHtml(n);
    return '¥' + num.toLocaleString('ja-JP');
  }
  // 税込み金額（消費税10%）。空/非数値は空
  function taxIncludedAmount(amt) {
    if (amt === '' || amt == null) return '';
    const n = Number(amt);
    if (isNaN(n)) return '';
    return Math.round(n * 1.1);
  }
  function fmtPercent(n) {
    if (n === '' || n == null) return '';
    const num = Number(n);
    if (isNaN(num)) return escapeHtml(n);
    // 整数なら整数表示、小数なら1桁
    return (num % 1 === 0 ? num : num.toFixed(1)) + '%';
  }

  // ---------- sort ----------
  // ステータスの工程順（小さいほど早い段階）。保留は最後尾扱い
  const STATUS_SORT_ORDER = {
    '受付': 1, '調査日調整中': 1.5, '見積り中': 2, '見積り提出済': 3, '日程調整中': 3.2, '客先対応中': 3.5, '他社対応': 3.6, '作業中': 4,
    '対応済み': 5, '完了': 6, '請求済': 7, '入金済': 8, '取り下げ': 9, '失注': 10, '保留': 99
  };
  function getSortValue(c, field) {
    if (field === 'status') {
      const s = statusOf(c);
      // 数値で返すことで工程順ソート（昇順=受付→入金済→保留 の順）
      return STATUS_SORT_ORDER[s] != null ? STATUS_SORT_ORDER[s] : 0;
    }
    if (field === 'estimateAmount') {
      const n = Number(c.estimateAmount);
      return isNaN(n) ? -Infinity : n;
    }
    return c[field] != null ? c[field] : '';
  }
  // 標準（未ソート時）の並び順グループ: 赤=0 → 黄=1 → それ以外(黒)=2
  function defaultSortRank(c) {
    const cls = rowColorClass(c);
    if (cls === 'row-yellow') return 0;   // 初動報告まだ（契約で一番急ぐ）
    if (cls === 'row-red') return 1;
    if (cls === 'row-orange') return 2;
    return 3;
  }
  function sortCases(arr) {
    if (!sortState.field) {
      // ログイン時の標準並び順:
      // 1) 赤文字（調査→今日が3日以上）… 調査日が経過している順（調査日が古い順）
      // 2) 黄文字（受付→調査が3日以上）… 受付日が古い順
      // 3) 黒文字（その他）… 受付日が古い順
      const asc = (av, bv) => {
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        return av.localeCompare(bv);
      };
      return arr.sort((a, b) => {
        const ra = defaultSortRank(a), rb = defaultSortRank(b);
        if (ra !== rb) return ra - rb;
        if (ra === 0) {
          // 赤グループは調査日が古い（＝経過が長い）ほど上
          const s = asc(a.surveyDate || '', b.surveyDate || '');
          if (s !== 0) return s;
        }
        // 黄・黒、および赤の同調査日は受付日が古い順
        return asc(a.receivedDate || '', b.receivedDate || '');
      });
    }
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      const av = getSortValue(a, sortState.field), bv = getSortValue(b, sortState.field);
      const aE = (av === '' || av == null), bE = (bv === '' || bv == null);
      if (aE && bE) return 0;
      if (aE) return 1;
      if (bE) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'ja') * dir;
    });
  }
  function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (sortState.field === th.dataset.sort) {
        th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  // ---------- 列ごとの絞り込み（ヘッダーのタブ） ----------
  // 絞り込み・グルーピングに使う生の値
  function columnValue(c, field) {
    if (field === 'status') return statusOf(c);
    if (field === 'workapp') return workappLabel(c);
    if (field === 'tcPerson' || field === 'rPerson') return stripHonorific(c[field] || '') || '';   // 「青木さん」と「青木」を同じに数える
    const v = c[field];
    return v != null ? String(v) : '';
  }
  // 上の会社ボタンを切り替えた時: 列の絞り込みの値のうち、その会社の案件に無い値を外す（全部外れた列は絞り込みをやめる）
  function pruneColumnFiltersForCompany() {
    const inCo = visibleCases().filter((c) => !companyFilter.size || companyFilter.has(c.company));
    const removed = [];
    Object.keys(columnFilters).forEach((f) => {
      if (f === 'status') return;   // 表示する状態は残す
      const set = columnFilters[f]; if (!set) return;
      const present = new Set(inCo.map((c) => columnValue(c, f)));
      const keep = new Set([...set].filter((v) => present.has(v)));
      if (keep.size === set.size) return;
      if (keep.size) columnFilters[f] = keep; else delete columnFilters[f];
      removed.push(columnLabel(f));
    });
    if (removed.length) {
      document.querySelectorAll('.th-filter[data-filter]').forEach((el) => el.classList.toggle('filtered', !!columnFilters[el.dataset.filter]));
      showToastLite('会社を切り替えたので、' + removed.map((x) => '「' + x + '」').join('') + 'の絞り込みを外しました（その会社に無い値）');
    }
  }
  // 表示用ラベル
  function formatColVal(field, v) {
    if (v === '' || v == null) return '（空白）';
    if (field === 'status') return statusDisplayLabel(v);
    if (field === 'estimateAmount') return fmtAmount(v);
    if (DATE_FIELDS.has(field)) return fmtDateShort(v);
    if (field === 'theater') return shortTheaterName(v);
    return v;
  }
  function columnLabel(field) {
    const th = document.querySelector(`#theadRow th[data-sort="${field}"] .th-filter`);
    if (!th) return field;
    const cl = th.cloneNode(true); cl.querySelectorAll('.th-src').forEach((x) => x.remove());   // ⑥ の印は名前に入れない
    return cl.textContent.trim();
  }
  function closeColumnFilter() {
    const p = document.getElementById('colFilterPop');
    if (p) p.remove();
    document.removeEventListener('mousedown', onColFilterOutside, true);
  }
  function onColFilterOutside(e) {
    const p = document.getElementById('colFilterPop');
    if (p && !p.contains(e.target) && !e.target.closest('.th-filter')) closeColumnFilter();
  }
  function openColumnFilter(field, anchorEl) {
    closeColumnFilter();
    // 候補値: 今の絞り込み（上の会社・担当者ボタン・検索・ほかの列）で残る案件の値（Excel と同じ。この列の絞り込みは除く）
    const counts = new Map();
    getFilteredCases({ exceptField: field }).forEach((c) => {
      const v = columnValue(c, field);
      counts.set(v, (counts.get(v) || 0) + 1);
    });
    // 今チェックしている値は、ほかの絞り込みで0件でも並べる（外せるように）
    if (columnFilters[field]) columnFilters[field].forEach((v) => { if (!counts.has(v)) counts.set(v, 0); });
    let values = [...counts.keys()];
    if (field === 'status') {
      // ステータスは工程順（STATUS_FILTER_ORDER）で並べる。順序外は末尾に
      values.sort((a, b) => {
        const ia = STATUS_FILTER_ORDER.indexOf(a), ib = STATUS_FILTER_ORDER.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
    } else {
      values.sort((a, b) => {
        if (field === 'estimateAmount') return (Number(a) || 0) - (Number(b) || 0);
        if (a === '') return 1; if (b === '') return -1;
        return String(a).localeCompare(String(b), 'ja');
      });
    }
    const cur = columnFilters[field] || null; // null = 全選択
    const pop = document.createElement('div');
    pop.id = 'colFilterPop';
    pop.className = 'col-filter-pop';
    pop.innerHTML = `
      <div class="cfp-head">
        <span class="cfp-title">「${escapeHtml(columnLabel(field))}」で絞り込み</span>
        <button type="button" class="cfp-x" data-cfp="close" aria-label="閉じる">×</button>
      </div>
      <input type="search" class="cfp-search" placeholder="値を検索…">
      <div class="cfp-hint">値をクリック＝それだけで絞り込み（チェックは複数選択用）</div>
      <label class="cfp-all"><input type="checkbox" class="cfp-allcb" checked> （すべて選択／解除）</label>
      <div class="cfp-list"></div>
      <div class="cfp-foot">
        <button type="button" class="cfp-clear" data-cfp="clear">絞り込み解除</button>
        <button type="button" class="cfp-apply primary" data-cfp="apply">適用</button>
      </div>`;
    const list = pop.querySelector('.cfp-list');
    values.forEach((v) => {
      const checked = !cur || cur.has(v);
      const row = document.createElement('label');
      row.className = 'cfp-item';
      row.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''}> <span class="cfp-val">${escapeHtml(formatColVal(field, v))}</span> <span class="cfp-cnt">${counts.get(v)}</span>`;
      row.querySelector('input').value = v;
      list.appendChild(row);
    });
    document.body.appendChild(pop);
    // 位置（アンカー下・画面内にクランプ）
    const r = anchorEl.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = Math.min(r.left, window.innerWidth - pw - 8);
    let top = r.bottom + 4;
    if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 4);
    pop.style.left = Math.max(8, left) + 'px';
    pop.style.top = top + 'px';

    const allcb = pop.querySelector('.cfp-allcb');
    const itemCbs = () => [...list.querySelectorAll('input[type="checkbox"]')];
    const visibleItemCbs = () => itemCbs().filter((cb) => cb.closest('.cfp-item').style.display !== 'none');
    function syncAll() {
      const vis = visibleItemCbs();
      allcb.checked = vis.length > 0 && vis.every((cb) => cb.checked);
    }
    allcb.addEventListener('change', () => { visibleItemCbs().forEach((cb) => { cb.checked = allcb.checked; }); });
    list.addEventListener('change', syncAll);
    // 値のテキストをクリック＝その値だけで即絞り込み（1クリック）。チェックボックスは従来どおり複数選択
    list.addEventListener('click', (e) => {
      const val = e.target.closest('.cfp-val');
      if (!val) return;
      e.preventDefault(); e.stopPropagation();
      const v = val.closest('.cfp-item').querySelector('input').value;
      columnFilters[field] = new Set([v]);
      closeColumnFilter(); refresh();
    });
    pop.querySelector('.cfp-search').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      list.querySelectorAll('.cfp-item').forEach((it) => {
        it.style.display = it.querySelector('.cfp-val').textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      syncAll();
    });
    syncAll();
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cfp]');
      if (!b) return;
      const act = b.dataset.cfp;
      if (act === 'close') { closeColumnFilter(); return; }
      if (act === 'clear') { delete columnFilters[field]; closeColumnFilter(); refresh(); return; }
      if (act === 'apply') {
        const checked = itemCbs().filter((cb) => cb.checked).map((cb) => cb.value);
        if (checked.length === itemCbs().length) delete columnFilters[field];
        else columnFilters[field] = new Set(checked);
        closeColumnFilter(); refresh();
      }
    });
    setTimeout(() => document.addEventListener('mousedown', onColFilterOutside, true), 0);
  }
  function updateColumnFilterIndicators() {
    document.querySelectorAll('#theadRow .th-filter').forEach((el) => {
      el.classList.toggle('filtered', !!columnFilters[el.dataset.filter]);
    });
  }

  // ---------- filter ----------
  // opts.forChips = 状態ボタンの件数を数える用（状態・注意ボタンの絞り込みはかけず、並び替えもしない）
  function getFilteredCases(opts) {
    const forChips = !!(opts && opts.forChips);
    const exceptField = (opts && opts.exceptField) || '';   // この列の絞り込みだけは使わない（列の候補を作る時）
    // 検索: 担当者の敬称（さん・様）は付けても付けなくても同じに探す
    const q = String(stripHonorific($('searchBox').value.trim()) || '').toLowerCase();
    const sf = forChips ? '' : $('statusFilter').value;
    // 客先は自社のみ（会社プルダウンは廃止。受注者は列フィルタで会社を絞る）
    const cf = isPrivileged(currentUser) ? '' : customerCompany(currentUser);
    const colFilterFields = Object.keys(columnFilters);
    const isCustomer = !isPrivileged(currentUser);
    const filtered = cases.filter((c) => {
      if (cf && c.company !== cf) return false;
      // 客先には 種別=タスク の案件を見せない
      if (isCustomer && c.category === 'タスク') return false;
      // 客先には、テスト劇場（通知メールの試し）の案件を見せない
      if (isCustomer && hiddenTestCase(c)) return false;
      // 客先には 取り下げ の案件を見せない（社内で取り下げた案件）
      if (isCustomer && statusOf(c) === '取り下げ') return false;
      // 劇場のアドレスで入った客先は、その劇場の案件だけ（上の「全部の劇場」で会社の全部）
      if (isCustomer && myAccount && myAccount.theater && myTheaterOnly && c.theater !== myAccount.theater) return false;
      // 客先(会社)ボタンによる絞り込み（OR）
      if (companyFilter.size && !companyFilter.has(c.company)) return false;
      // 大口のみ（見積り金額300万円以上、または 種別=更新案件）
      if (showBigOnly) {
        const amt = Number(c.estimateAmount);
        const isBig = (!isNaN(amt) && amt >= BIG_CASE_THRESHOLD) || c.category === '更新案件';
        if (!isBig) return false;
      }
      // 各列のタブ絞り込み
      for (let i = 0; i < colFilterFields.length; i++) {
        const f = colFilterFields[i];
        // トップのステータス選択(sf)を使う時は、status列のチェック絞り込みは無視（sfを優先）
        if (f === 'status' && sf) continue;
        if (f === exceptField) continue;
        const set = columnFilters[f];
        if (set && set.size && !set.has(columnValue(c, f))) return false;
      }
      // R担当者ボタンによる絞り込み（全員=空）。選んだ担当者の「いずれか」が担当の案件（OR）
      if (rPersonFilter.size) {
        const rp = c.rPerson || '';
        let hit = false;
        for (const n of rPersonFilter) { if (rp.includes(n)) { hit = true; break; } }
        if (!hit) return false;
      }
      if (sf && statusOf(c) !== sf) return false;
      // ⑤ 注意ボタン（見積り遅れ／調査日未定）
      if (!forChips && attentionFilter && rowColorClass(c) !== attentionFilter) return false;
      // 「完了・取り下げ」の既定非表示は、ログイン時に seed する columnFilters['status'] で行う
      // （＝チェックボックスの状態＝表示、が常に一致する）。上の列フィルタのループで反映済み。
      if (!q) return true;
      const hayArr = [c.company, c.theater, shortTheaterName(c.theater), stripHonorific(c.tcPerson), c.rPerson, c.category, c.title, c.content,
        c.certNumber, c.estimateName, String(c.estimateAmount || ''),
        c.receivedDate, c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate,
        c.customerMemo, statusOf(c), statusDisplayLabel(statusOf(c))];
      // memo は ryonetsu ユーザーのみ検索対象（情報漏洩防止）
      if (isPrivileged(currentUser)) hayArr.push(c.memo, c.adviceNote);
      const hay = hayArr.map((x) => (x || '').toString().toLowerCase()).join(' ');
      return hay.includes(q);
    });
    return forChips ? filtered : sortCases(filtered);
  }

  // ===== ⑤ 状態ごとの件数ボタン（押すとその状態だけ・もう一度押すと戻る）＋注意ボタン =====
  // 注意ボタンでの絞り込み: '' = なし / 'row-red' = 見積り遅れ / 'row-yellow' = 初動報告まだ / 'row-orange' = 調査日未定（行の色と同じ意味）
  let attentionFilter = '';
  const CHIP_STATUS_ORDER = ['受付', '調査日調整中', '見積り中', '見積り提出済', '日程調整中', '客先対応中', '他社対応', '作業中', '対応済み', '請求済', '入金済', '完了', '保留', '取り下げ', '失注'];
  // 色の凡例（トップ・菱熱だけ）: 行の色と、ステータスの色。「たたむ」で小さくできる（ブラウザごとに覚える）
  const LEGEND_KEY = 'colorLegendOpenV1';
  function renderColorLegend() {
    const box = $('colorLegend'); if (!box) return;
    if (!isPrivileged(currentUser)) {
      // 客先: 赤・黄・オレンジの意味だけ（ほかの行の色は付けない）
      box.innerHTML = `<span class="cl-h">行の色</span>
        <span class="cl-item"><span class="swatch cl-red"></span>赤＝見積り遅れ（現地調査の翌日から平日3日を過ぎても、見積りが未提出）</span>
        <span class="cl-item"><span class="swatch cl-yellow"></span>黄＝初動対応・区分判定のご報告前</span>
        <span class="cl-item"><span class="swatch cl-orange"></span>オレンジ＝調査日が未定（受付から平日3日を過ぎている）</span>`;
      return;
    }
    let open = true; try { const v = localStorage.getItem(LEGEND_KEY); open = v == null ? !isMobile() : v !== '0'; } catch (e) {}   // スマホは最初たたむ
    if (!open) { box.innerHTML = '<button type="button" class="cl-toggle" data-cltoggle="1" title="行の色・ステータスの色の意味を出します">🎨 色の凡例 ▸</button>'; return; }
    const rows = [['cl-red', '見積り遅れ'], ['cl-yellow', '初動報告まだ'], ['cl-orange', '調査日未定'], ['cl-blue', '見積り提出済']];
    const sts = ['受付', '調査日調整中', '見積り中', '見積り提出済', '日程調整中', '客先対応中', '他社対応', '作業中', '対応済み', '請求済', '入金済', '完了', '保留', '取り下げ', '失注'];
    box.innerHTML = `<span class="cl-h">行の色</span>${rows.map(([c, t]) => `<span class="cl-item"><span class="swatch ${c}"></span>${t}</span>`).join('')}
      <span class="cl-item"><span class="cl-blink">内容</span>見積り中（赤く点滅）</span>
      <span class="cl-sep"></span><span class="cl-h">ステータス</span>${sts.map((st) => `<span class="status-badge status-${escapeHtml(st)}">${escapeHtml(statusDisplayLabel(st))}</span>`).join('')}
      <button type="button" class="cl-toggle" data-cltoggle="0" title="凡例をたたむ">たたむ ▴</button>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cltoggle]'); if (!b) return;
    try { localStorage.setItem(LEGEND_KEY, b.dataset.cltoggle); } catch (err) {}
    renderColorLegend();
  });
  function renderStatusChips() {
    renderColorLegend();
    const box = $('statusChips'); if (!box || !currentUser) return;
    const base = getFilteredCases({ forChips: true });
    const cnt = {};
    base.forEach((c) => { const st = statusOf(c); cnt[st] = (cnt[st] || 0) + 1; });
    const sf = $('statusFilter').value;
    if (sf && !cnt[sf]) cnt[sf] = 0; // 選択中の状態は0件でも残す（押して解除できるように）
    const order = CHIP_STATUS_ORDER.concat(Object.keys(cnt).filter((k) => CHIP_STATUS_ORDER.indexOf(k) === -1));
    let html = '';
    if (isPrivileged(currentUser)) {
      const nR = base.filter((c) => rowColorClass(c) === 'row-red').length;
      const nY = base.filter((c) => rowColorClass(c) === 'row-yellow').length;
      const nO = base.filter((c) => rowColorClass(c) === 'row-orange').length;
      html += `<button type="button" class="fb-chip warn-r${attentionFilter === 'row-red' ? ' on' : ''}" data-attn="row-red" title="現調の翌日から平日3日を過ぎても見積りが出ていない案件（赤）">見積り遅れ <i>${nR}</i></button>`;
      html += `<button type="button" class="fb-chip warn-y${attentionFilter === 'row-yellow' ? ' on' : ''}" data-attn="row-yellow" title="初動対応・区分判定の報告がまだの案件（黄）">初動報告まだ <i>${nY}</i></button>`;
      html += `<button type="button" class="fb-chip warn-o${attentionFilter === 'row-orange' ? ' on' : ''}" data-attn="row-orange" title="初動報告（または受付）の翌日から平日3日を過ぎても調査日が決まっていない案件（オレンジ）">調査日未定 <i>${nO}</i></button>`;
      html += '<span class="fb-chip-sep"></span>';
    }
    html += `<button type="button" class="fb-chip${!sf && !attentionFilter ? ' on' : ''}" data-chip-status="">すべて <i>${base.length}</i></button>`;
    order.forEach((st) => {
      if (cnt[st] === undefined) return;
      html += `<button type="button" class="fb-chip${sf === st ? ' on' : ''}" data-chip-status="${escapeHtml(st)}">${escapeHtml(statusDisplayLabel(st))} <i>${cnt[st]}</i></button>`;
    });
    box.innerHTML = html;
    box.classList.toggle('overflow', box.scrollWidth > box.clientWidth + 1);
  }

  // 客先担当者名から敬称（さん/様/ちゃん等）を末尾から除去（表示・保存共通）
  function stripHonorific(name) {
    if (name == null) return name;
    return String(name).replace(/\s*(さん|サン|ｻﾝ|様|さま|サマ|ちゃん|君|くん)\s*$/u, '').trim();
  }

  // スマホのカード表示用ラベル（PCでは使われない属性）
  const FIELD_LABELS = {
    status: 'ステータス', company: '会社', theater: '劇場名', receivedDate: '受付日',
    tcPerson: '客先担当者', rPerson: 'R担当者', category: '種別', content: '内容',
    surveyDate: '調査日', certNumber: '決裁番号', estimateName: '見積り名', title: '案件名',
    estimateAmount: '見積り金額', quoteDate: '見積り提出日', workStartDate: '作業開始日',
    workEndDate: '作業完了日', invoiceDate: '請求書発行日', paymentDate: '入金日', memo: '社内メモ',
    customerMemo: '顧客メモ'
  };
  // 表示用のラベル（スマホのカード表示など）。客先ログインでは「客先」「顧客」を会社名に置き換える
  function fieldLabel(field) {
    const base = FIELD_LABELS[field] || '';
    if (isPrivileged(currentUser) || !base) return base;
    const co = customerCompany(currentUser);
    if (!co) return base;
    if (field === 'customerMemo') return co + 'メモ';
    return base.replace(/客先/g, co);
  }
  // ===== 客先アカウント（劇場のアドレス） =====
  // ===== R担当者のマスター（2026-11-17）: 在籍の人だけ候補・異動・退職の人の案件は付け替える =====
  const DONE_STATUSES = ['完了', '請求済', '入金済', '取り下げ'];
  const isOpenCase = (c) => DONE_STATUSES.indexOf(statusOf(c)) === -1 && c.category !== 'タスク';
  function leftStaff() { return staffList ? staffList.filter((x) => x.active === false).map((x) => x.name) : []; }
  function openCasesOf(name) { return cases.filter((c) => c.rPerson === name && isOpenCase(c)); }
  let accountsCache = [];   // 客先アカウント（客先担当者の候補に使う・菱熱だけ）
  async function loadStaff() {
    if (!realPrivileged(currentUser)) return;
    try { staffList = await store.fetchStaff(); } catch (e) { staffList = null; }
    try { accountsCache = await store.fetchAccounts(); } catch (e) { accountsCache = []; }
    await loadWorkappStates();
    renderRPersonBar(); renderDatalists(); render();
    checkForcedIntake();   // 自分の分の登録確認があれば、決めるまで上に出す（2026-11-20）
    setTimeout(() => { try { if (window.WORKAPP && store.mode === 'supabase' && caseMailSupported) window.WORKAPP.checkQueue(); } catch (e) { console.warn(e); } }, 1500);
  }
  // 異動・退職の人で絞った時: 未完了の案件をまとめて付け替えるバー
  function renderReassignBar() {
    let bar = $('rpReassign');
    const left = leftStaff().filter((n) => rPersonFilter.has(n) && openCasesOf(n).length);
    if (!left.length || !isPrivileged(currentUser)) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'rpReassign'; bar.className = 'rp-reassign'; const rb = $('rPersonBar'); rb.parentNode.insertBefore(bar, rb.nextSibling); }
    const team = loadTeam();
    bar.innerHTML = left.map((n) => `<span class="rp-re-row">⚠ <b>${escapeHtml(n)}</b> さんは異動・退職です。未完了の案件 <b>${openCasesOf(n).length}</b> 件を
      <select data-reto="${escapeHtml(n)}"><option value="">担当者を選ぶ</option>${team.map((t) => `<option>${escapeHtml(t)}</option>`).join('')}</select>
      に <button type="button" data-reassign="${escapeHtml(n)}">付け替える</button></span>`).join('');
  }
  async function reassignCases(from, to) {
    const K = window.KARTE;
    const list = openCasesOf(from);
    if (!to) { K.say('付け替える担当者を選んでください'); return; }
    if (!(await K.ask(`${from} さんの未完了の案件 ${list.length} 件の R担当者を「${to}」に付け替えます。よろしいですか？`, { ok: '付け替える' }))) return;
    list.forEach((c) => { c.rPerson = to; c.updatedAt = new Date().toISOString(); });
    await persistCases(list);
    rPersonFilter.delete(from); rPersonFilter.add(to); saveUserFilter('rpfV1', rPersonFilter);
    renderRPersonBar(); refresh();
    showToastLite(`${list.length} 件を ${to} さんに付け替えました`);
  }
  // 🗂 マスター編集（2026-11-20: 上のタブで分ける。設定は全部ここから）
  const MASTER_TABS = [
    { k: 'staff', label: '👤 R担当者' }, { k: 'accounts', label: '📧 客先アカウント' }, { k: 'toho', label: '📋 TOHO の設定' },
    { k: 'mail', label: '📨 メール通知' }, { k: 'theaters', label: '🏢 会社・劇場' }, { k: 'partners', label: '🤝 協力会社' }
  ];
  let masterTab = (() => { try { return localStorage.getItem('masterTabV1') || 'staff'; } catch (e) { return 'staff'; } })();
  // TOHO の客先担当者の候補: 案件の「TOHOシネマズ担当者」と客先アカウントの担当者名（敬称を除く・同じ人は1つ）
  // 人の名前でない言葉（担当者の欄に書かれていることがある）は候補に出さない（2026-11-20）
  const NOT_PERSON_RE = /劇場|テスト|支配人|本社|本部|担当|店長|スタッフ|事務|未定|不明|なし|無し|全員|各位|御中|管理|センター|会社|株式|シネマ|TOHO|toho/;
  // 字の違い（髙／高・﨑／崎 など）は同じ人として数える
  const ITAIJI = { '髙': '高', '﨑': '崎', '邊': '辺', '邉': '辺', '濵': '浜', '德': '徳', '櫻': '桜', '澤': '沢', '嶋': '島', '廣': '広', '冨': '富', '齋': '斎', '齊': '斉' };
  const personBase = (s) => String(s || '').replace(/[髙﨑邊邉濵德櫻澤嶋廣冨齋齊]/g, (c) => ITAIJI[c] || c);
  function tohoPersonCands() {
    const m = new Map();
    const add = (name, email) => {
      const k = cmPersonKey(name); if (!k || k.length < 2 || /@/.test(k) || NOT_PERSON_RE.test(k)) return;
      const hit = [...m.keys()].find((x) => cmPersonMatch(personBase(x), personBase(k)));
      const key = hit || k;
      const cur = m.get(key) || { name: k, email: '', n: 0 };
      if (k.length > cur.name.length) cur.name = k;
      if (email && !cur.email) cur.email = String(email).toLowerCase();
      cur.n++;
      if (hit && hit !== cur.name) { m.delete(hit); m.set(cur.name, cur); } else m.set(key, cur);
    };
    (accountsCache || []).filter((a) => a.company === WA_COMPANY && a.person).forEach((a) => add(a.person, a.email));
    cases.filter((c) => c.company === WA_COMPANY && c.tcPerson).forEach((c) => String(c.tcPerson).split(/[、,，\/／・]/).forEach((p) => add(p, '')));
    return [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'ja'));
  }
  async function openMasterDialog(tab) {
    const K = window.KARTE;
    try { staffList = await store.fetchStaff(); } catch (e) { staffList = null; }
    if (!staffList) { K.say('担当者の表がありません。SETUP_STAFF.sql を実行してください。'); return; }
    try { accountsCache = await store.fetchAccounts(); } catch (e) {}
    document.querySelectorAll('#masterDlg').forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'masterDlg';
    if (tab && MASTER_TABS.some((t) => t.k === tab)) masterTab = tab;
    ov.innerHTML = `<div class="kt-dialog ms-dlg mst-full"><div class="kt-dlg-head">🗂 マスター編集<button type="button" class="close-btn" data-x>×</button></div>
      <div class="mst-tabs" role="tablist">${MASTER_TABS.map((t) => `<button type="button" role="tab" class="mst-tab" data-msttab="${t.k}">${t.label}</button>`).join('')}</div>
      <div class="kt-dlg-body mst-body"><div class="mst-pane"></div></div>
      <div class="kt-dlg-foot"><span class="ms-note mst-foot-note">変えた所はすぐ保存されます</span><button type="button" data-x>閉じる</button></div></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    // 1つのタブの中身（staff・toho は draw で描き直す。accounts・mail はそれぞれの画面をここに埋め込む）
    const draw = () => {
      const pane = ov.querySelector('.mst-pane');
      ov.querySelectorAll('[data-msttab]').forEach((b) => { const on = b.dataset.msttab === masterTab; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
      ov.querySelector('.mst-foot-note').textContent = masterTab === 'mail' ? '「保存」を押すと変わります（5分以内に GAS に伝わります）' : '変えた所はすぐ保存されます';
      if (masterTab === 'staff') {
        const qualsOn = staffList.some((x) => Object.prototype.hasOwnProperty.call(x, 'quals'));   // 資格の列（SETUP_SAFETY_V2.sql）
        const rows = staffList.slice().sort((a, b) => (a.active === false) - (b.active === false) || (a.sort_order - b.sort_order) || a.name.localeCompare(b.name, 'ja'));
        pane.innerHTML = `<h3 class="mst-h">👤 R担当者（菱熱の担当者）</h3>
          <p class="ms-note">携帯は、作業申請書を作る時に「当日責任者」（その案件のR担当者）の連絡先として使います。<br>在籍の人が、上の担当者ボタン・R担当者の候補・配分に出ます。メール・LINE の取り込みも、在籍の人を菱熱の担当者として見分けます。<br>
          異動・退職にすると、上のボタンが「○○（異動・退職）⚠ n件」に変わります。押すと、未完了の案件を別の担当者に付け替えられます（過去の案件の名前はそのまま）。<br>
          名前を変える時は、新しい名前で足して、前の名前を「異動・退職」にしてください。</p>
          <table class="ms-table mst-table"><thead><tr><th>名前（苗字）</th><th>メールアドレス</th><th>携帯</th>${qualsOn ? '<th title="安全書類で使う資格の印（労働安全衛生法）">資格（安全書類）</th>' : ''}<th>状態</th><th>未完了の案件</th><th>並び</th></tr></thead><tbody>
          ${rows.map((r) => `<tr class="${r.active === false ? 'mst-left' : ''}"><td><b>${escapeHtml(r.name)}</b></td>
            <td><input type="email" class="tm-input" data-semail="${escapeHtml(r.name)}" value="${escapeHtml(r.email || '')}" placeholder="例: koyama@ryonetsu.com"></td>
            <td><input type="tel" class="tm-input mst-phone" data-sphone="${escapeHtml(r.name)}" value="${escapeHtml(r.phone || '')}" placeholder="例: 090-1234-5678"></td>
            ${qualsOn ? `<td class="mst-quals"><label title="職長教育（職長・安全衛生責任者教育）を受けた"><input type="checkbox" data-squal="${escapeHtml(r.name)}" data-q="shokucho"${(r.quals || {}).shokucho ? ' checked' : ''}> 職長教育</label>
              <label title="元方安全衛生管理者の要件: 大学・高専の理科系卒＋建設工事の安全衛生の実務3年以上／高校の理科系卒＋5年以上／そのほか8年以上"><input type="checkbox" data-squal="${escapeHtml(r.name)}" data-q="motokata"${(r.quals || {}).motokata ? ' checked' : ''}> 元方の要件</label></td>` : ''}
            <td><select data-sactive="${escapeHtml(r.name)}"><option value="1"${r.active !== false ? ' selected' : ''}>在籍</option><option value="0"${r.active === false ? ' selected' : ''}>異動・退職</option></select></td>
            <td>${openCasesOf(r.name).length} 件</td>
            <td>${r.active === false ? '' : `<button type="button" class="mini-btn" data-sup="${escapeHtml(r.name)}" title="上へ">↑</button><button type="button" class="mini-btn" data-sdown="${escapeHtml(r.name)}" title="下へ">↓</button>`}</td></tr>`).join('')}
          </tbody></table>
          <div class="acct-add mst-add"><input type="text" id="mstName" class="tm-input" placeholder="足す人の名前（苗字）"><input type="email" id="mstEmail" class="tm-input" placeholder="メールアドレス"><button type="button" data-sadd>＋ 担当者を足す</button></div>`;
      } else if (masterTab === 'toho') {
        const ap = approverPref();
        const cands = tohoPersonCands();
        pane.innerHTML = `<h3 class="mst-h">📧 TOHO 本社の決裁者（見積り3万円以上の通知メール）</h3>
          <p class="ms-note">見積り金額が3万円以上（税抜）の TOHO の案件は、担当がだれでも、この人に通知メールが届きます。異動・退職の時はここで変えてください。<br>
          名前は、TOHO の案件の「TOHOシネマズ担当者」と客先アカウントの担当者名から選べます。メールアドレスを入れて「決裁者にする」を押すと、客先アカウント（会社 TOHOシネマズ・本社）にも登録します。</p>
          <div class="mst-approver-now">今の決裁者: ${ap ? `<b>${escapeHtml(ap.name || '（名前なし）')}</b>　${escapeHtml(ap.email)}` : '<b>まだいません</b>'}</div>
          <div class="acct-add mst-approver"><input type="text" id="mstApproverName" class="tm-input" list="mstApproverNames" placeholder="担当者名（例: 青木）" autocomplete="off">
            <datalist id="mstApproverNames">${cands.map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.email || '')}</option>`).join('')}</datalist>
            <input type="email" id="mstApproverEmail" class="tm-input" placeholder="メールアドレス" autocomplete="off">
            <button type="button" class="primary" data-mstapprover>決裁者にする</button>${ap ? `<button type="button" data-mstnp>🔔 ${escapeHtml(ap.name || '')} さんの通知設定を見る</button>` : ''}</div>
          ${cands.length ? `<div class="mst-cands">${cands.slice(0, 30).map((p) => `<button type="button" class="wa-chip" data-mstpick="${escapeHtml(p.name)}" title="${escapeHtml(p.email || 'メールアドレスはまだ分かりません')}">${escapeHtml(p.name)}${p.email ? ' ✉' : ''}</button>`).join('')}</div>` : ''}
          <h3 class="mst-h">🧾 請求書発行日・入金日の列を見せない客先の会社</h3>
          <p class="ms-note">印を付けた会社の客先の画面には、請求書発行日・入金日の列と欄を出しません（案件の進み具合だけを見てもらう）。菱熱の画面は、各自が上の「請求・入金」で切り替えます。</p>
          <div class="mst-acct">${companyNames().map((co) => `<label class="wa-chip"><input type="checkbox" data-mstacct="${escapeHtml(co)}"${hideAccounting.companies.indexOf(co) !== -1 ? ' checked' : ''}> ${escapeHtml(co)}</label>`).join('')}</div>
          <h3 class="mst-h">🏢 他社案件の利率（他社が請け負った金額・税抜で決まる）</h3>
          <p class="ms-note">他社案件の「利率」が空の時は、この段階で決まります。案件ごとに手で入れた利率があれば、そちらを使います。</p>
          <table class="ms-table mst-rates"><thead><tr><th>他社の金額（税抜）</th><th>利率</th></tr></thead><tbody>
            ${otherRates.map((t, i) => `<tr><td>${i === otherRates.length - 1 ? `${fmtAmount(otherRates[i - 1] ? otherRates[i - 1].under : 0)} 以上` : `<input type="text" class="tm-input mst-under" data-mstunder="${i}" value="${escapeHtml(formatThousands(t.under))}"> 円 未満`}</td>
              <td><input type="number" class="tm-input mst-rate" data-mstrate="${i}" min="0" max="100" step="0.1" value="${escapeHtml(t.rate)}"> %</td></tr>`).join('')}
          </tbody></table>`;
      } else if (masterTab === 'theaters') {
        pane.innerHTML = `<h3 class="mst-h">🏢 会社・🎬 劇場</h3>
          <p class="ms-note">会社・劇場の一覧は、客先マスターの画面で直します。新しい劇場は、案件の新規登録で一覧にない劇場を打った時にも登録できます。</p>
          <button type="button" class="primary" data-opentm>📚 客先マスター（会社・劇場）を開く</button>`;
      } else if (masterTab === 'partners') {
        pane.innerHTML = `<h3 class="mst-h">🤝 協力会社</h3>
          <p class="ms-note">作業申請書の「協力会社」「作業者」の候補です。劇場情報のパートナー連絡先から、AI が協力会社だけを選んで自動で足します。</p>
          <button type="button" class="primary" data-openpt>🤝 協力会社マスターを開く</button>`;
      } else if (masterTab === 'accounts') {
        pane.innerHTML = ''; openAccountsDialog(pane, (t) => { masterTab = t; draw(); });
      } else if (masterTab === 'mail') {
        pane.innerHTML = ''; openMailSettings(pane);
      }
    };
    // タブを変えると、中身の要素を作り直す（埋め込んだ画面の押した時の動きを残さない）
    const switchTab = (t) => {
      masterTab = t; try { localStorage.setItem('masterTabV1', t); } catch (e) {}
      const old = ov.querySelector('.mst-pane'); const fresh = document.createElement('div'); fresh.className = 'mst-pane'; old.replaceWith(fresh);
      draw();
    };
    switchTab(masterTab);
    const after = () => { renderRPersonBar(); renderDatalists(); renderReassignBar(); if (masterTab === 'staff') draw(); };
    const save = async (rows, msg) => {
      try { await store.saveStaff(rows); staffList = await store.fetchStaff(); after(); if (msg) showToastLite(msg); }
      catch (err) { K.say('保存できませんでした: ' + (err.message || err)); }
    };
    ov.addEventListener('input', (e) => {
      if (e.target.id !== 'mstApproverName') return;
      const p = tohoPersonCands().find((x) => cmPersonMatch(x.name, e.target.value));
      const em = ov.querySelector('#mstApproverEmail');
      if (p && p.email && em && !em.value) em.value = p.email;
    });
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]') || e.target === ov) { close(); return; }
      const tb = e.target.closest('[data-msttab]'); if (tb) { switchTab(tb.dataset.msttab); return; }
      if (e.target.closest('[data-opentm]')) { close(); openTheaterMasterModal(); return; }
      if (e.target.closest('[data-openpt]')) { close(); if (window.WORKAPP) window.WORKAPP.openPartners(); return; }
      if (e.target.closest('[data-mstnp]')) { const ap = approverPref(); if (ap) { close(); openNotifyPrefs(ap.email); } return; }
      const pk = e.target.closest('[data-mstpick]');
      if (pk) {
        const p = tohoPersonCands().find((x) => x.name === pk.dataset.mstpick);
        ov.querySelector('#mstApproverName').value = pk.dataset.mstpick;
        ov.querySelector('#mstApproverEmail').value = (p && p.email) || '';
        if (!(p && p.email)) ov.querySelector('#mstApproverEmail').focus();
        return;
      }
      if (e.target.closest('[data-mstapprover]')) {
        const name = cmPersonKey(ov.querySelector('#mstApproverName').value);
        const email = ov.querySelector('#mstApproverEmail').value.trim().toLowerCase();
        if (!name) { K.say('決裁者の名前を入れてください'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { K.say('決裁者のメールアドレスを入れてください'); return; }
        const acc = (accountsCache || []).find((a) => String(a.email).toLowerCase() === email);
        if (acc && acc.company && acc.company !== WA_COMPANY) { K.say(`${email} は「${acc.company}」の客先アカウントです。TOHO の人のアドレスを入れてください。`); return; }
        if (!(await K.ask(`見積り3万円以上の TOHO の案件の通知メールを、${name} さん（${email}）に送るようにします。\n客先アカウントにも「TOHOシネマズ・本社・${name}」で登録します。よろしいですか？`, { ok: '決裁者にする' }))) return;
        try {
          // 客先アカウント: 無ければ足す（本社）。あれば担当者名だけ入れる（劇場はそのまま）
          await store.saveAccounts([acc ? Object.assign({}, acc, { company: WA_COMPANY, person: name }) : { email, company: WA_COMPANY, theater: '', person: name, note: '本社の決裁者' }]);
          accountsCache = await store.fetchAccounts();
          const { error: e1 } = await sb.from('notify_prefs').update({ approver: false }).eq('approver', true); if (e1) throw e1;
          const ex = notifyPrefs.find((p) => String(p.email).toLowerCase() === email);
          const { error: e2 } = ex ? await sb.from('notify_prefs').update({ approver: true, name }).eq('email', ex.email)
            : await sb.from('notify_prefs').insert({ email, name, approver: true, enabled: true, muted_case_ids: [] });
          if (e2) throw e2;
          await loadTohoSettings(); draw(); showToastLite(`決裁者を ${name} さんにしました`);
        } catch (err) { K.say('保存できませんでした: ' + (err.message || err)); }
        return;
      }
      if (e.target.closest('[data-sadd]')) {
        const name = ov.querySelector('#mstName').value.trim().replace(/(さん|様)$/, '');
        const email = ov.querySelector('#mstEmail').value.trim().toLowerCase();
        if (!name) { K.say('名前（苗字）を入れてください'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { K.say('メールアドレスが正しくありません'); return; }
        const ex = staffList.find((x) => x.name === name);
        if (ex && ex.active !== false) { K.say(`「${name}」はもういます`); return; }
        const maxOrder = Math.max(0, ...staffList.map((x) => Number(x.sort_order) || 0));
        await save([ex ? Object.assign({}, ex, { active: true, email: email || ex.email }) : { name, email, active: true, sort_order: maxOrder + 1 }], `${name} さんを足しました`);
        return;
      }
      const mv = e.target.closest('[data-sup],[data-sdown]');
      if (mv) {
        const act = staffList.filter((x) => x.active !== false).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ja'));
        const name = mv.dataset.sup || mv.dataset.sdown; const i = act.findIndex((x) => x.name === name);
        const j = mv.dataset.sup ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= act.length) return;
        [act[i], act[j]] = [act[j], act[i]];
        await save(act.map((x, k) => Object.assign({}, x, { sort_order: k + 1 })));
      }
    });
    ov.addEventListener('change', async (e) => {
      const hac = e.target.closest('[data-mstacct]');
      if (hac) {
        const set = new Set(hideAccounting.companies); if (hac.checked) set.add(hac.dataset.mstacct); else set.delete(hac.dataset.mstacct);
        const v = { companies: [...set] };
        const { error } = await sb.from('app_settings').upsert({ key: 'hide_accounting', value: v, updated_at: new Date().toISOString() });
        if (error) { K.say('保存できませんでした: ' + error.message); return; }
        hideAccounting = v; showToastLite(`${hac.dataset.mstacct} の客先の画面で、請求書・入金の列を${hac.checked ? '隠します' : '出します'}`); return;
      }
      if (e.target.closest('[data-mstunder],[data-mstrate]')) {
        const tiers = otherRates.map((t, i) => {
          const u = ov.querySelector(`[data-mstunder="${i}"]`), r = ov.querySelector(`[data-mstrate="${i}"]`);
          return { under: u ? Number(String(u.value).replace(/[^\d]/g, '')) || null : null, rate: r ? Number(r.value) : t.rate };
        });
        for (let i = 1; i < tiers.length - 1; i++) if (!(tiers[i].under > tiers[i - 1].under)) { K.say('金額は上から順に大きくしてください'); draw(); return; }
        const { error } = await sb.from('app_settings').upsert({ key: 'other_vendor_rates', value: { tiers }, updated_at: new Date().toISOString() });
        if (error) { K.say('保存できませんでした: ' + error.message); return; }
        otherRates = tiers; draw(); render(); showToastLite('他社案件の利率を変えました'); return;
      }
      const em = e.target.closest('[data-semail]');
      if (em) {
        const r = staffList.find((x) => x.name === em.dataset.semail); const v = em.value.trim().toLowerCase();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { K.say('メールアドレスが正しくありません'); em.value = r.email || ''; return; }
        await save([Object.assign({}, r, { email: v })], 'メールアドレスを保存しました');
        return;
      }
      const sq = e.target.closest('[data-squal]');
      if (sq) {
        const r = staffList.find((x) => x.name === sq.dataset.squal); if (!r) return;
        const q = Object.assign({}, r.quals || {}, { [sq.dataset.q]: sq.checked });
        await save([Object.assign({}, r, { quals: q })], `${r.name} さんの資格の印を保存しました`);
        return;
      }
      const ph = e.target.closest('[data-sphone]');
      if (ph) {
        const r = staffList.find((x) => x.name === ph.dataset.sphone); const v = ph.value.trim();
        if (v && !/^[0-9０-９\-－()（）\s+]{8,}$/.test(v)) { K.say('携帯の番号が正しくありません'); ph.value = r.phone || ''; return; }
        await save([Object.assign({}, r, { phone: v.normalize('NFKC') })], '携帯を保存しました（作業申請書の当日責任者の連絡先）');
        return;
      }
      const ac = e.target.closest('[data-sactive]');
      if (ac) {
        const r = staffList.find((x) => x.name === ac.dataset.sactive); const active = ac.value === '1';
        const n = openCasesOf(r.name).length;
        if (!active && !(await K.ask(`${r.name} さんを「異動・退職」にします。` + (n ? `\n未完了の案件が ${n} 件あります。上の担当者ボタンの「${r.name}（異動・退職）」から、別の担当者に付け替えてください。` : ''), { ok: '異動・退職にする' }))) { ac.value = '1'; return; }
        if (!active) rPersonFilter.delete(r.name);
        await save([Object.assign({}, r, { active })], active ? `${r.name} さんを在籍に戻しました` : `${r.name} さんを異動・退職にしました`);
      }
    });
  }
  // ===== ⑥ 菱熱が手で入れる欄・AI が入れる欄の見える化（2026-11-17・菱熱の画面だけ） =====
  // ai＝AI が入れる（人も直せる）／mail＝メール・LINE から AI も入れる（普段は菱熱）／hand＝菱熱が手で入れる／cust＝客先が入れる
  const FIELD_SRC = {
    company:       { k: 'mail', v: true },
    theater:       { k: 'mail', v: true },
    receivedDate:  { k: 'mail', v: true },
    tcPerson:      { k: 'mail', v: true },
    rPerson:       { k: 'mail', v: true },
    category:      { k: 'mail', v: true },
    caseTitle:     { k: 'ai', v: true, why: '内容から付ける', col: 'title' },
    content:       { k: 'sum', v: true, why: '社内メモを AI が客先向けにまとめて入れる' },
    customerMemo:  { k: 'cust', v: true },
    surveyDate:    { k: 'mail', v: true },
    quoteDate:     { k: 'mail', v: true },
    workStartDate: { k: 'mail', v: true },
    workEndDate:   { k: 'mail', v: true },
    estimateName:  { k: 'ai', v: true, why: '添付の見積書から読み取る' },
    estimateAmount:{ k: 'ai', v: true, why: '添付の見積書から読み取る（税抜）' },
    certNumber:    { k: 'hand', v: true },
    invoiceDate:   { k: 'hand', v: true },
    paymentDate:   { k: 'hand', v: true },
    memo:          { k: 'mail', v: false, why: 'メールの中身を AI が足していく → AI が要約して「内容」へ' },
    adviceNote:    { k: 'mail', v: false, why: 'Plaud・LINE の中身を AI が足していく（要約しない・LINE 通知しない）' }
  };
  function fieldSrcNote(f) {
    const who = f.k === 'ai' ? '🤖 AI：' + f.why + '（直せる）'
      : f.k === 'sum' ? '📝 ' + f.why + '（直せる）'
      : f.k === 'mail' ? '📨 ' + (f.why || 'AI も入れる')
      : f.k === 'cust' ? '🤝 客先が入れる'
      : '✋ 手入力だけ';
    return who + '｜' + (f.v ? '👀 客先に見える' : '🔒 客先に見えない');
  }
  // その案件で、この欄を最後に入れたのはだれか（cases.field_sources・SETUP_FIELD_SOURCES.sql）
  const FS_LABEL = { hand: ['✋ 直した', '菱熱が手で入れた・直した'], ai: ['🤖 AI のまま', 'メール・LINE・AI が入れたまま（人はまだ直していない）'], cust: ['🤝 客先', '客先が入れた'] };
  const fsCol = (id) => FIELD_SRC[id].col || ({ caseTitle: 'title' })[id] || id.replace(/[A-Z]/g, (x) => '_' + x.toLowerCase());
  function markCaseFieldSources(c) {
    const fs = (c && c.fieldSources) || {};
    Object.keys(FIELD_SRC).forEach((id) => {
      const lab = document.querySelector(`#caseForm label[for="${id}"]`); if (!lab) return;
      let b = lab.querySelector('.fs-now');
      const v = FS_LABEL[fs[fsCol(id)]];
      if (!v) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); const sn = lab.querySelector(':scope > .src-note'); if (sn) lab.insertBefore(b, sn); else lab.appendChild(b); }
      b.className = 'fs-now fs-' + fs[fsCol(id)]; b.textContent = v[0]; b.title = 'この案件では: ' + v[1];
    });
  }
  function markFieldSources() {
    // 見出し: 客先にも見える欄／社内だけの欄（2026-11-20）と、色の説明
    document.querySelectorAll('#caseForm .form-sec').forEach((sec) => {
      const k = sec.dataset.sec; const h = sec.querySelector('.form-sec-h');
      if (!h || h.querySelector('.vis-tag, .lock-tag')) return;
      if (['basic', 'content', 'sched', 'money'].indexOf(k) !== -1) {
        sec.classList.add('form-sec-cust');
        const t = document.createElement('span'); t.className = 'vis-tag col-ryo'; t.textContent = '👀 客先にも見える'; h.appendChild(t);
      }
    });
    const form = $('caseForm');
    if (form && !form.querySelector('.fs-legend')) {
      const lg = document.createElement('div'); lg.className = 'fs-legend col-ryo';
      lg.innerHTML = '<span class="fs-lg fs-lg-ai">🤖 AI が入れる</span><span class="fs-lg fs-lg-sum">📝 AI が要約して入れる</span><span class="fs-lg fs-lg-mail">📨 メールからも入る</span><span class="fs-lg fs-lg-hand">✋ 手で入れる</span><span class="fs-lg fs-lg-cust">🤝 客先が入れる</span>' +
        '<span class="fs-lg-sep">｜</span><span class="fs-lg-box fs-lg-vis">白い枠＝客先にも見える</span><span class="fs-lg-box fs-lg-in">黄色い枠＝社内だけ</span>' +
        '<span class="fs-lg-sep">｜</span><span class="fs-now fs-hand">✋ 直した</span><span class="fs-now fs-ai">🤖 AI のまま</span><span class="fs-lg-note">＝この案件で最後に入れた人</span>';
      const first = form.querySelector('.form-sec'); if (first) first.parentNode.insertBefore(lg, first);
    }
    Object.keys(FIELD_SRC).forEach((id) => {
      const f = FIELD_SRC[id];
      const lab = document.querySelector(`#caseForm label[for="${id}"]`);
      if (lab && !lab.querySelector('.src-note')) {
        const sp = document.createElement('span'); sp.className = 'src-note src-' + f.k; sp.textContent = fieldSrcNote(f);
        sp.title = { ai: 'AI が自動で入れる欄です。人が直すこともできます。', mail: 'メール・LINE を取り込んだ時に AI も入れる欄です。普段は菱熱が入れます。', hand: '菱熱が手で入れる欄です。AI は入れません。', cust: '客先が入れる欄です。菱熱も直せます。' }[f.k] +
          (f.v ? '客先の画面にも出ます。' : '客先の画面には出ません（社内だけ）。');
        lab.appendChild(sp);
        const row = lab.closest('.form-row'); if (row) row.classList.add('src-row-' + f.k);
      }
      // 一覧の列の見出し: AI が入れる列に小さい印（説明は指を乗せると出る）
      if (f.k !== 'ai' && f.k !== 'mail') return;
      const th = document.querySelector(`#theadRow th[data-sort="${f.col || id}"] .th-filter`);
      if (th && !th.querySelector('.th-src')) {
        const ic = document.createElement('span'); ic.className = 'th-src th-src-' + f.k; ic.textContent = f.k === 'ai' ? '🤖' : '📨'; ic.title = fieldSrcNote(f);
        th.appendChild(ic);
      }
    });
    const st = document.querySelector('#theadRow th[data-sort="status"] .th-filter');
    if (st && !st.title) st.title = '⚙ 日付から自動で決まります（手で変えることもできます）｜👀 客先にも見えます';
  }
  // ===== 作業申請書の状態（一覧の「申請書」列・菱熱だけ） =====
  // 作業申請書は「調査」と「作業」で別々（case_files.meta.purpose。前からある行＝作業）。
  // 1つの用途の状態: none（まだ）/ draft（作成中）/ final（送付済）/ skip（申請不要で通知）/ manual（提出済み・通知しない）/ stale（作った後に日付が変わった）
  let workappRows = new Map();   // 案件 id → [{ id, status, purpose, for_date, created_at }]（古い順）
  const WA_PURPOSES = [{ key: 'survey', label: '調査', field: 'surveyDate' }, { key: 'work', label: '作業', field: 'workStartDate' }];
  const WA_COMPANY = 'TOHOシネマズ';   // 作業申請書の自動作成（作りますか？の画面・📝 作る）は、今は TOHO だけ
  async function loadWorkappStates() {
    if (!caseMailSupported || !realPrivileged(currentUser) || store.mode !== 'supabase') return;
    try {
      const { data, error } = await sb.from('case_files').select('id,case_id,status,meta,created_at').eq('kind', 'workapp').is('deleted_at', null).order('created_at', { ascending: true });
      if (error) return;
      const m = new Map();
      (data || []).forEach((r) => { const k = String(r.case_id); const meta = r.meta || {};
        if (!m.has(k)) m.set(k, []);
        m.get(k).push({ id: r.id, status: r.status, purpose: meta.purpose === 'survey' ? 'survey' : 'work', for_date: meta.for_date || '', created_at: r.created_at }); });
      workappRows = m;
    } catch (e) {}
  }
  function waState(c, purpose) {
    const P = WA_PURPOSES.find((x) => x.key === purpose); const date = c[P.field] || '';
    const rows = (workappRows.get(String(c.id)) || []).filter((r) => r.purpose === purpose);
    const rec = rows[rows.length - 1] || null;
    if (!rec) return { date, rec: null, state: 'none' };
    if (rec.status !== 'draft' && rec.for_date && date && rec.for_date !== date) return { date, rec, state: 'stale' };
    return { date, rec, state: ['draft', 'final', 'skip', 'manual'].includes(rec.status) ? rec.status : 'final' };
  }
  const WA_STATE_LABEL = { none: 'まだ', draft: '作成中', final: '送付済', skip: '申請不要', manual: '提出済', stale: '日付が変わった' };
  function workappLabel(c) {
    return WA_PURPOSES.filter((P) => c[P.field]).map((P) => P.label + ':' + WA_STATE_LABEL[waState(c, P.key).state]).join(' ');
  }
  // 調査日・作業開始日が今日から7日以内なのに、まだ決めていない（作成中・未作成・日付が変わった）
  function workappDue(c, purpose) {
    const w = waState(c, purpose); if (!w.date || !['none', 'draft', 'stale'].includes(w.state)) return false;
    const d = (new Date(w.date + 'T00:00:00') - new Date(todayStr() + 'T00:00:00')) / 86400000;
    return d >= 0 && d <= 7;
  }
  function workappTd(c) {
    const md = (d) => { const m = String(d || '').match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${+m[1]}/${+m[2]}` : ''; };
    const can = store.mode === 'supabase';
    // 作業申請書の自動作成は、今は TOHO シネマズの案件だけ（ほかの会社は追々。2026-11-19）
    const parts = (c.company === WA_COMPANY ? WA_PURPOSES : []).filter((P) => c[P.field]).map((P) => {
      const w = waState(c, P.key), due = workappDue(c, P.key);
      const lab = `<span class="wa-pp">${P.label} ${md(w.date)}</span>`;
      const btn = (cls, text, title) => can ? `<button type="button" class="wa-make ${cls}" data-wadecide="${escapeHtml(c.id)}" data-purpose="${P.key}" title="${title}">${text}</button>` : `<span class="wa-b ${cls}">${text}</span>`;
      const body = w.state === 'final' ? btn('wa-final', '✅ 送付済', '送った作業申請書。押すと作り直せます')
        : w.state === 'skip' ? btn('wa-skip', '申請不要', '申請不要で客先に通知しました。押すと作れます')
        : w.state === 'manual' ? btn('wa-final', '✅ 提出済', '別に提出済み（メールは送っていません）')
        : w.state === 'draft' ? btn('wa-draft', '📝 作成中', '作りかけの作業申請書。押すと続きから直せます')
        : w.state === 'stale' ? btn('wa-stale', '⚠ 日付変更', '作業申請書を作った後に日付が変わりました。押すと作り直せます')
        : w.date < todayStr() ? btn('wa-past', '—', '過ぎた日付です（作業申請書は決めていません）。押すと作る・申請不要・別に提出済みを選べます')
        : btn('', '📝 作る', '作業申請書を作る（AI が劇場の書式に書き込みます）／申請不要');
      return `<div class="wa-line${due ? ' wa-due' : ''}"${due ? ` title="${P.label}まで7日以内です。作業申請書を決めてください"` : ''}>${lab}${body}${due ? '<span class="wa-warn">⚠</span>' : ''}</div>`;
    });
    // 日付が無いのに手で付けた申請書がある時は、その状態だけ出す
    if (!parts.length) { const rows = workappRows.get(String(c.id)) || []; const last = rows[rows.length - 1];
      if (last) parts.push(last.status === 'draft' ? '<span class="wa-b wa-draft">📝 作成中</span>' : last.status === 'skip' ? '<span class="wa-b wa-skip">申請不要</span>' : '<span class="wa-b wa-final">✅ 送付済</span>'); }
    return `<td class="col-ryo col-workapp" data-colkey="workapp" data-label="申請書">${parts.join('') || '<span class="wa-none">—</span>'}</td>`;
  }
  // ===== 通知メール（TOHO の要望④）: 客先のベル・テスト劇場 =====
  let caseMailSupported = false;          // case_watchers の表がある（SETUP_CASE_MAIL.sql 済み）
  let myWatches = new Set();              // ベルを ON にした案件の id
  let caseMailSettings = { mode: 'test', test_theaters: [], test_to: [], sender: '' };
  let caseMailStatus = null;              // GAS が残す今の状態（実際の送り主・別名が使えるか・最後に送った時刻）
  const normMailSettings = (v) => ({ mode: String((v && v.mode) || 'test'), test_theaters: Array.isArray(v && v.test_theaters) ? v.test_theaters.map(String) : [],
    test_to: Array.isArray(v && v.test_to) ? v.test_to.map(String) : [], sender: String((v && v.sender) || '') });
  function cmPersonKey(s) {
    s = String(s || ''); try { s = s.normalize('NFKC'); } catch (e) {}
    return s.replace(/[\s　]/g, '').replace(/(さん|様|さま|殿|氏)$/g, '');
  }
  // 案件の「TOHOシネマズ担当者」と、アカウントの担当者名が同じ人か（「青木」と「青木太郎」は同じ。GAS の CaseMail.gs と同じ決まり）
  function cmPersonMatch(casePerson, accPerson) {
    const b = cmPersonKey(accPerson); if (!b) return false;
    return String(casePerson || '').split(/[、,，\/／・]/).some((p) => {
      const a = cmPersonKey(p); if (!a) return false;
      if (a === b) return true;
      const sh = a.length < b.length ? a : b, lo = a.length < b.length ? b : a;
      return sh.length >= 2 && lo.indexOf(sh) === 0;
    });
  }
  function isTestTheater(name) { return !!name && (caseMailSettings.test_theaters || []).indexOf(name) !== -1; }
  // 客先には、テスト劇場の案件を見せない（そのテスト劇場のアドレスで入った時だけ見える）
  function hiddenTestCase(c) { return isTestTheater(c.theater) && !(myAccount && myAccount.theater === c.theater); }
  async function loadCaseMail() {
    caseMailSupported = false; myWatches = new Set();
    if (store.mode !== 'supabase' || !currentUser) return;
    try {
      const { data, error } = await sb.from('case_watchers').select('case_id').eq('email', String(currentUser.email || '').toLowerCase());
      if (error) return;
      caseMailSupported = true;
      (data || []).forEach((r) => myWatches.add(String(r.case_id)));
      const st = await sb.from('app_settings').select('value').eq('key', 'case_mail').limit(1);
      const v = st && st.data && st.data[0] && st.data[0].value;
      if (v && typeof v === 'object') caseMailSettings = normMailSettings(v);
      if (isPrivileged(currentUser)) {
        const ss = await sb.from('app_settings').select('value').eq('key', 'case_mail_status').limit(1);
        caseMailStatus = (ss && ss.data && ss.data[0] && ss.data[0].value) || null;
      }
    } catch (e) {}
    renderMailSetBtn();
  }
  // ===== 📨 メール通知設定（菱熱だけ）: 今の送り主・テスト中か =====
  const MAIL_MODE_LABEL = { test: '🧪 テスト中', live: '🟢 本番', off: '⏸ 停止中' };
  function renderMailSetBtn() {
    const b = $('mailSetBtn'); if (!b) return;
    const show = caseMailSupported && realPrivileged(currentUser) && isPrivileged(currentUser);
    b.classList.toggle('hidden', !show);
    const badge = $('mailSetBadge');
    if (badge) { badge.textContent = MAIL_MODE_LABEL[caseMailSettings.mode] || ''; badge.className = 'ms-badge ms-' + caseMailSettings.mode; }
    b.title = '客先への通知メールの設定｜' + (MAIL_MODE_LABEL[caseMailSettings.mode] || '') + '｜送るアドレス: ' + mailSenderText().addr;
  }
  // 今の送り主（GAS が残した実際のアドレス。まだ一度も動いていなければ、その説明）
  function mailSenderText() {
    const st = caseMailStatus || {};
    const want = String(caseMailSettings.sender || '').toLowerCase();
    const addr = st.sender_used || '（まだ確認できていません。GAS が動くと出ます）';
    let note = '';
    if (want && st.sender_used && want !== String(st.sender_used).toLowerCase()) note = `「${want}」は Gmail にまだ登録されていないので、${st.sender_used} から送っています`;
    else if (want && st.alias_ok) note = '希望の送り主のアドレスで送っています';
    return { addr, note };
  }
  // host を渡すと、マスター編集の「📨 メール通知」タブの中に出す（2026-11-20）。渡さない時はマスター編集をそのタブで開く
  async function openMailSettings(host) {
    const K = window.KARTE;
    if (!host) { openMasterDialog('mail'); return; }
    try { await loadCaseMail(); } catch (e) {}
    if (!caseMailSupported) { host.innerHTML = '<p class="empty-msg">通知メールの表がありません。SETUP_CASE_MAIL.sql を実行してください。</p>'; return; }
    const ov = host; ov.id = 'mailPane';
    const m = Object.assign({}, caseMailSettings);
    const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
    const draw = () => {
      const st = caseMailStatus || {};
      const snd = mailSenderText();
      const banner = m.mode === 'test'
        ? `<div class="ms-banner ms-test">🧪 <b>テスト中</b>です。客先にはメールを送りません。<br>全部の案件の通知を、<b>テストの宛先（${escapeHtml((m.test_to || []).join('、') || '未設定')}）</b>だけに送ります。メールの頭に「本番ならだれに届くか」を書きます。</div>`
        : m.mode === 'live' ? '<div class="ms-banner ms-live">🟢 <b>本番</b>です。劇場・担当者・ベルの人に、通知メールを送ります。</div>'
        : '<div class="ms-banner ms-off">⏸ <b>止めています</b>。通知メールは送りません。</div>';
      ov.innerHTML = `<h3 class="mst-h">📨 メール通知（客先・決裁者への通知メール）</h3>
          ${banner}
          <table class="ms-table">
            <tr><th>今の送るアドレス</th><td><b class="ms-addr">${escapeHtml(snd.addr)}</b>（差出人の名前「菱熱工業」）${snd.note ? `<div class="ms-note">${escapeHtml(snd.note)}</div>` : ''}${st.checked_at ? `<div class="ms-note">GAS が確かめた時刻: ${escapeHtml(fmt(st.checked_at))}</div>` : ''}</td></tr>
            <tr><th>最後に送ったメール</th><td>${st.last_sent_at ? `${escapeHtml(fmt(st.last_sent_at))}　${escapeHtml(st.last_to || '')}<div class="ms-note">${escapeHtml(st.last_subject || '')}</div>` : 'まだありません'}</td></tr>
            <tr><th>モード</th><td>${[['test', '🧪 テスト（全部の案件をテストの宛先だけへ）'], ['live', '🟢 本番（全部の案件・客先へ）'], ['off', '⏸ 止める']].map(([v, l]) => `<label class="ms-radio"><input type="radio" name="msMode" value="${v}"${m.mode === v ? ' checked' : ''}> ${l}</label>`).join('')}</td></tr>
            <tr><th>テストの宛先</th><td><input type="text" id="msTestTo" class="tm-input" value="${escapeHtml((m.test_to || []).join('、'))}" placeholder="テスト用のメールアドレス（複数は「、」で区切る）"><div class="ms-note">試しの間は、ここにだけ送ります。小山さんの Gmail（送る側）は入れないでください（返信がまた取り込まれるため）。</div></td></tr>
            <tr><th>テスト劇場</th><td><input type="text" id="msTestTheaters" class="tm-input" value="${escapeHtml((m.test_theaters || []).join('、'))}" placeholder="TOHOシネマズ テスト劇場"><div class="ms-note">テスト劇場の案件は、客先の画面に出しません（そのテスト劇場のアドレスで入った時だけ）。</div></td></tr>
            <tr><th>送り主にしたいアドレス</th><td><input type="text" id="msSender" class="tm-input" value="${escapeHtml(m.sender || '')}" placeholder="例: tc-hvac-desk@ryonetsu.com"><div class="ms-note">Gmail の「設定 → アカウント → 他のアドレスからメールを送信」に登録して確認が済むと、このアドレスで送ります。それまでは小山さんの Gmail から送ります。</div></td></tr>
          </table>
          <div class="ms-save-row"><span class="ms-note">切り替えは5分以内に GAS に伝わります</span><button type="button" class="primary" data-mssave>保存</button></div>`;
    };
    draw();
    ov.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-mssave]')) return;
      const split = (v) => String(v || '').split(/[、,，\s\n]+/).map((x) => x.trim()).filter(Boolean);
      const mode = (ov.querySelector('input[name="msMode"]:checked') || {}).value || 'test';
      const testTo = split(ov.querySelector('#msTestTo').value).map((x) => x.toLowerCase());
      const bad = testTo.filter((x) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
      if (bad.length) { K.say('テストの宛先が正しくありません: ' + bad.join('、')); return; }
      const sender = ov.querySelector('#msSender').value.trim().toLowerCase();
      if (sender && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) { K.say('送り主のアドレスが正しくありません'); return; }
      const tt = ov.querySelector('#msTestTheaters').value.split(/[、,，\n]/).map((x) => x.trim()).filter(Boolean).map((x) => theaterLoose(x, '') || x);
      if (mode === 'test' && !testTo.length && !(await K.ask('テストの宛先が空です。試しの間は、どこにも送りません。よろしいですか？', { ok: 'このまま保存' }))) return;
      if (mode === 'live' && m.mode !== 'live' && !(await K.ask('本番にすると、全部の案件で客先（劇場・担当者・決裁者）に通知メールが送られます。よろしいですか？', { ok: '本番にする', danger: true }))) return;
      try {
        const v = { mode, test_theaters: tt, test_to: testTo, sender };
        await store.saveCaseMailSettings(v);
        caseMailSettings = normMailSettings(v); Object.assign(m, caseMailSettings);
        renderMailSetBtn(); draw();
        showToastLite('通知メールの設定を保存しました（' + MAIL_MODE_LABEL[mode] + '）');
      } catch (err) { K.say('保存できませんでした: ' + (err.message || err)); }
    });
  }
  // その案件の通知が必ず届くか（劇場のアドレス・案件の担当者）
  function bellLocked(c) {
    return !!(myAccount && ((myAccount.theater && myAccount.theater === c.theater) || (myAccount.person && (!myAccount.company || myAccount.company === c.company) && cmPersonMatch(c.tcPerson, myAccount.person))));
  }
  // 🚩 緊急案件（メールの件名の【緊急】で自動。菱熱は押して付け外し・TOHO は見るだけ）
  function urgentHtml(c) {
    if (!tohoV2Supported) return '';
    if (isPrivileged(currentUser)) return `<button type="button" class="urgent-btn${c.urgent ? ' on' : ''}" data-urgent="${escapeHtml(c.id)}" title="${c.urgent ? '緊急案件（押すと外します）' : '押すと緊急案件にします'}" aria-pressed="${!!c.urgent}">🚩</button>`;
    return c.urgent ? '<span class="urgent-flag" title="緊急案件">🚩</span>' : '';
  }
  // 他社案件: 利率は手で入れた値、無ければ他社の金額の段階（マスター）で決まる。菱熱への支払額＝金額×利率
  let otherRates = [{ under: 30000, rate: 10 }, { under: 100000, rate: 7 }, { under: 1000000, rate: 5 }, { under: null, rate: 3 }];
  function otherRateOf(c) {
    if (c.otherRate !== '' && c.otherRate != null && !isNaN(Number(c.otherRate))) return { rate: Number(c.otherRate), auto: false };
    const amt = Number(c.otherAmount); if (c.otherAmount === '' || c.otherAmount == null || isNaN(amt)) return { rate: null, auto: true };
    const t = otherRates.find((x) => x.under == null || amt < Number(x.under));
    return { rate: t ? Number(t.rate) : null, auto: true };
  }
  function otherFeeOf(c) { const r = otherRateOf(c), amt = Number(c.otherAmount); return (r.rate == null || c.otherAmount === '' || isNaN(amt)) ? '' : Math.round(amt * r.rate / 100); }
  function otherTds(c) {
    const on = !!(c.otherVendor || '').trim(); const r = otherRateOf(c);
    return `${editableTd(c, 'otherVendor', escapeHtml(c.otherVendor || ''), 'col-other')}
      ${editableTd(c, 'otherAmount', on ? fmtAmount(c.otherAmount) : '', 'col-other')}
      ${editableTd(c, 'otherRate', on && r.rate != null ? `${r.rate}%${r.auto ? '<small class="auto-rate">（自動）</small>' : ''}` : '', 'col-other')}
      <td class="col-other other-fee-td" data-colkey="otherFee" data-label="菱熱への支払額">${on ? fmtAmount(otherFeeOf(c)) : ''}</td>`;
  }
  // TOHO を見ている時だけ他社案件の列を出す（TOHO の画面・菱熱で上の会社を TOHO にした時）
  function showOtherCols() {
    return isPrivileged(currentUser) ? (companyFilter.size === 1 && companyFilter.has('TOHOシネマズ')) : customerCompany(currentUser) === 'TOHOシネマズ';
  }
  function bellHtml(c) {
    if (!caseMailSupported || isPrivileged(currentUser)) return '';
    const locked = bellLocked(c);
    const on = locked || myWatches.has(String(c.id));
    const tip = locked ? (myAccount.theater === c.theater ? 'この劇場の案件なので、通知メールが必ず届きます' : '担当の案件なので、通知メールが必ず届きます')
      : (on ? '通知メールを受け取っています（押すと止めます）' : '押すと、この案件の通知メールを受け取ります');
    return `<button type="button" class="bell-btn ${on ? 'on' : 'off'}${locked ? ' locked' : ''}" data-bell="${escapeHtml(c.id)}" title="${tip}" aria-label="${tip}" aria-pressed="${on}">🔔</button>`;
  }
  async function toggleBell(id) {
    const c = cases.find((x) => String(x.id) === String(id)); if (!c) return;
    if (bellLocked(c)) { showToastLite('この案件の通知メールは必ず届きます（劇場・担当者のアドレス）'); return; }
    if (realPrivileged(currentUser)) { showToastLite('打合せモードでは、ベルは切り替えません（客先の人が自分で押します）'); return; }
    const email = String(currentUser.email || '').toLowerCase();
    const on = myWatches.has(String(c.id));
    try {
      const q = on ? sb.from('case_watchers').delete().eq('case_id', String(c.id)).eq('email', email)
        : sb.from('case_watchers').insert({ case_id: String(c.id), email });
      const { error } = await q; if (error) throw error;
      if (on) myWatches.delete(String(c.id)); else myWatches.add(String(c.id));
      showToastLite(on ? '通知メールを止めました' : 'この案件の通知メールを受け取ります');
      render();
    } catch (e) { showToastLite('切り替えられませんでした: ' + (e.message || e)); }
  }
  // TOHO 向けの設定（2026-11-19）: 他社案件の利率の段階・請求書/入金の列を隠す客先の会社・本社の決裁者の通知設定
  let hideAccounting = { companies: [] };
  let notifyPrefs = [];     // 菱熱: 全員分／客先: 自分の分だけ（RLS）
  async function loadTohoSettings() {
    if (store.mode !== 'supabase') return;
    try {
      const { data } = await sb.from('app_settings').select('key,value').in('key', ['other_vendor_rates', 'hide_accounting']);
      (data || []).forEach((r) => {
        if (r.key === 'other_vendor_rates' && r.value && Array.isArray(r.value.tiers) && r.value.tiers.length) otherRates = r.value.tiers;
        if (r.key === 'hide_accounting' && r.value) hideAccounting = { companies: Array.isArray(r.value.companies) ? r.value.companies : [] };
      });
    } catch (e) {}
    try { const { data, error } = await sb.from('notify_prefs').select('*'); notifyPrefs = error ? [] : (data || []); } catch (e) { notifyPrefs = []; }
    applyAcctCols(); renderNotifyPrefBtn();
  }
  function myNotifyPref() { const em = String((currentUser && currentUser.email) || '').toLowerCase(); return notifyPrefs.find((p) => String(p.email).toLowerCase() === em) || null; }
  function approverPref() { return notifyPrefs.find((p) => p.approver) || null; }
  // 請求書発行日・入金日の列: 客先は菱熱が会社ごとに決める／菱熱は各自（ブラウザごと）
  function acctHidden() {
    if (isPrivileged(currentUser)) { try { return localStorage.getItem('acctColsV1') === '0'; } catch (e) { return false; } }
    return hideAccounting.companies.indexOf(customerCompany(currentUser)) !== -1;
  }
  function applyAcctCols() {
    const hid = acctHidden();
    document.body.classList.toggle('hide-acct', hid);
    if ($('acctToggleBtn')) setSwitch($('acctToggleBtn'), !hid);
  }
  function renderNotifyPrefBtn() {
    const b = $('notifyPrefBtn'); if (!b) return;
    const me = myNotifyPref();
    b.classList.toggle('hidden', !(me && me.approver && !isPrivileged(currentUser)));
  }
  // 🔔 通知設定（本社の決裁者）: 見積り3万円以上（税抜）の TOHO の案件の通知メール。全体の ON/OFF と、案件ごと（選んで一括）
  function openNotifyPrefs(email) {
    const K = window.KARTE;
    const pref = notifyPrefs.find((p) => String(p.email).toLowerCase() === String(email).toLowerCase());
    if (!pref) { K.say('通知の設定が見つかりません'); return; }
    document.querySelectorAll('#npDlg').forEach((x) => x.remove());
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'npDlg';
    const muted = () => new Set((pref.muted_case_ids || []).map(String));
    const sel = new Set();
    const list = () => cases.filter((c) => c.company === 'TOHOシネマズ' && Number(c.estimateAmount) >= APPROVAL_NO_AMOUNT && !TERMINAL_LIKE_STATUSES.has(statusOf(c)))
      .sort((a, b) => String(b.receivedDate || '').localeCompare(String(a.receivedDate || '')));
    const save = async (patch, msg) => {
      const { error } = await sb.from('notify_prefs').update(patch).eq('email', pref.email);
      if (error) { K.say('保存できませんでした: ' + error.message); return; }
      Object.assign(pref, patch); draw(); if (msg) showToastLite(msg);
    };
    const draw = () => {
      const m = muted(), L = list();
      ov.innerHTML = `<div class="kt-dialog kt-dialog-wide np-dlg"><div class="kt-dlg-head">🔔 通知設定 — ${escapeHtml(pref.name || pref.email)} さん<button type="button" class="close-btn" data-x>×</button></div>
        <div class="kt-dlg-body">
          <p class="ms-note">見積り金額が3万円以上（税抜）の案件は、担当が劇場でも本社のほかの人でも、通知メールが ${escapeHtml(pref.name || '')} さん（${escapeHtml(pref.email)}）にも届きます。<br>
            案件の担当者（本社のほかの人など）には、その人のアドレスにも届きます。</p>
          <label class="np-all"><input type="checkbox" data-npall${pref.enabled !== false ? ' checked' : ''}> 3万円以上の案件の通知メールを受け取る（全体）</label>
          <div class="np-tools"><span class="ms-note">今の対象: ${L.length} 件（通知する ${L.filter((c) => !m.has(String(c.id))).length} 件）</span>
            <button type="button" data-npbulk="on"${sel.size ? '' : ' disabled'}>選んだ案件を通知する</button><button type="button" data-npbulk="off"${sel.size ? '' : ' disabled'}>選んだ案件を止める</button>
            <button type="button" data-npevery="on">全部 通知する</button><button type="button" data-npevery="off">全部 止める</button></div>
          <div class="np-wrap"><table class="ms-table np-table${pref.enabled === false ? ' np-off' : ''}"><thead><tr><th><input type="checkbox" data-npselall${L.length && L.every((c) => sel.has(String(c.id))) ? ' checked' : ''} title="全部選ぶ"></th><th>通知</th><th>劇場</th><th>案件名</th><th>見積り金額（税抜）</th><th>ステータス</th><th>受付日</th></tr></thead><tbody>
          ${L.map((c) => { const id = String(c.id), on = !m.has(id); return `<tr><td><input type="checkbox" data-npsel="${escapeHtml(id)}"${sel.has(id) ? ' checked' : ''}></td>
            <td><button type="button" class="np-sw ${on ? 'on' : 'off'}" data-nptoggle="${escapeHtml(id)}">${on ? '🔔 通知する' : '🔕 止めた'}</button></td>
            <td>${escapeHtml(shortTheaterName(c.theater))}</td><td>${escapeHtml(c.title || c.category || '')}</td><td>${fmtAmount(c.estimateAmount)}</td>
            <td>${escapeHtml(statusDisplayLabel(statusOf(c)))}</td><td>${escapeHtml(fmtDateShort(c.receivedDate))}</td></tr>`; }).join('') || '<tr><td colspan="7" class="sub">3万円以上の案件はありません</td></tr>'}
          </tbody></table></div>
        </div><div class="kt-dlg-foot"><span class="ms-note">変えた所はすぐ保存されます</span><button type="button" data-x>閉じる</button></div></div>`;
    };
    draw(); document.body.appendChild(ov);
    ov.addEventListener('change', async (e) => {
      if (e.target.matches('[data-npall]')) { await save({ enabled: e.target.checked }, e.target.checked ? '受け取るにしました' : '止めました（全体）'); return; }
      if (e.target.matches('[data-npselall]')) { const L = list(); if (e.target.checked) L.forEach((c) => sel.add(String(c.id))); else sel.clear(); draw(); return; }
      const s1 = e.target.closest('[data-npsel]'); if (s1) { if (s1.checked) sel.add(s1.dataset.npsel); else sel.delete(s1.dataset.npsel); draw(); }
    });
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]') || e.target === ov) { ov.remove(); return; }
      const m = muted();
      const t = e.target.closest('[data-nptoggle]');
      if (t) { const id = t.dataset.nptoggle; if (m.has(id)) m.delete(id); else m.add(id); await save({ muted_case_ids: [...m] }); return; }
      const b = e.target.closest('[data-npbulk]');
      if (b && sel.size) { sel.forEach((id) => { if (b.dataset.npbulk === 'on') m.delete(id); else m.add(id); }); const n = sel.size; sel.clear(); await save({ muted_case_ids: [...m] }, `${n} 件を${b.dataset.npbulk === 'on' ? '通知する' : '止める'}にしました`); return; }
      const ev = e.target.closest('[data-npevery]');
      if (ev) { const L = list().map((c) => String(c.id)); L.forEach((id) => { if (ev.dataset.npevery === 'on') m.delete(id); else m.add(id); }); await save({ muted_case_ids: [...m] }, ev.dataset.npevery === 'on' ? '全部 通知するにしました' : '全部 止めました'); }
    });
  }
  async function loadMyAccount() {
    myAccount = null;
    await loadCaseMail();
    await loadTohoSettings();
    if (realPrivileged(currentUser)) { renderCustTheaterBar(); return; }
    try { myAccount = await store.fetchMyAccount(); } catch (e) { myAccount = null; }
    try { const v = localStorage.getItem(userFilterKey('myTheaterOnlyV1')); myTheaterOnly = v !== '0'; } catch (e) { myTheaterOnly = true; }
    renderCustTheaterBar();
    render();
  }
  function renderCustTheaterBar() {
    const bar = $('custTheaterBar'); if (!bar) return;
    const on = !!(myAccount && myAccount.theater && !realPrivileged(currentUser));
    bar.classList.toggle('hidden', !on);
    if (!on) return;
    const nm = shortTheaterName(myAccount.theater) || myAccount.theater;
    bar.innerHTML = `<span class="hdr-lb">劇場</span><div class="rperson-bar">` +
      `<button type="button" class="rperson-btn${myTheaterOnly ? ' active' : ''}" data-mytheater="1">🎬 ${escapeHtml(nm)}の案件</button>` +
      `<button type="button" class="rperson-btn${myTheaterOnly ? '' : ' active'}" data-mytheater="0">🏢 全部の劇場</button></div>`;
  }
  function setMyTheaterOnly(v) {
    myTheaterOnly = !!v;
    try { localStorage.setItem(userFilterKey('myTheaterOnlyV1'), v ? '1' : '0'); } catch (e) {}
    renderCustTheaterBar(); render();
  }
  // 客先アカウントの一覧（菱熱だけ）: Excel/CSV を読み込んで、メールアドレスと劇場を結びつける
  // 劇場名をゆるく探す（会社が分からない時も。短い名前「テスト劇場」など）。1つに決まらなければ ''
  function theaterLoose(v, company) {
    const t = canonTheaterName(v, company);
    if (theaterMaster.some((x) => x.name === t && (!company || x.company === company))) return t;
    const k = tmKey(v); if (!k) return '';
    const hits = theaterMaster.filter((x) => x.name && !x.closed && (!company || x.company === company) &&
      (tmKey(x.shortName || shortTheaterName(x.name)) === k || tmKey(x.name).endsWith(k)));
    return hits.length === 1 ? hits[0].name : '';
  }
  function accountTheaterOf(cells, company) {
    for (const cell of cells) {
      const v = String(cell || '').trim(); if (!v || /@/.test(v)) continue;
      const hit = theaterLoose(v, company);
      if (hit) return hit;
    }
    return '';
  }
  // 劇場が分かれば、会社は劇場の会社（テスト用のアドレスなど、ドメインで会社が分からない時）
  function companyOfTheater(name) { const t = theaterMaster.find((x) => x.name === name); return (t && t.company) || ''; }
  function parseAccountSheet(text) {
    const out = [];
    let personCol = -1;   // 見出しに「担当」とある列＝担当者名（TOHO 本社の人など）
    String(text || '').split(/\r?\n/).forEach((line) => {
      const cells = line.split('\t').map((x) => x.replace(/^"|"$/g, '').trim());
      const email = (cells.find((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)) || '').toLowerCase();
      if (!email) {
        const i = cells.findIndex((x) => /担当|氏名|名前/.test(x));
        if (i !== -1) personCol = i;
        return;
      }
      const domain = email.split('@')[1];
      let company = CUSTOMER_DOMAIN_COMPANY[domain] || companyNames().find((n) => cells.indexOf(n) !== -1) || '';
      const person = personCol !== -1 ? String(cells[personCol] || '').trim() : '';
      const theater = accountTheaterOf(cells.filter((x, i) => i !== personCol), company);
      if (!company && theater) company = companyOfTheater(theater);
      const note = (theater || person) ? '' : cells.filter((x) => x && x !== email && x !== company).join(' ').slice(0, 80);
      out.push({ email, company, theater, person, note });
    });
    return out;
  }
  // マスター編集の「📧 客先アカウント」タブの中に出す（2026-11-20）。host が無い時はマスター編集をそのタブで開く
  async function openAccountsDialog(host, goTab) {
    const K = window.KARTE;
    if (!host) { openMasterDialog('accounts'); return; }
    let rows = [];
    try { rows = await store.fetchAccounts(); } catch (e) { host.innerHTML = '<p class="empty-msg">客先アカウントの表がありません。SETUP_TOHO_REQUESTS.sql を実行してください。（' + escapeHtml(e.message || e) + '）</p>'; return; }
    const ov = host; ov.id = 'acctPane'; ov.classList.add('acct-dlg');
    const names = theaterMaster.filter((t) => t.name && !t.closed).map((t) => t.name);
    let mail = null;
    try { mail = await store.fetchCaseMailSettings(); } catch (e) { mail = null; }
    const hasMail = !!mail;
    const mailBox = () => !hasMail ? '' : `<div class="acct-mail">📨 通知メール（劇場・担当者・決裁者へ）: <b>${escapeHtml(MAIL_MODE_LABEL[caseMailSettings.mode] || '')}</b>　<button type="button" data-openmailset>📨 メール通知のタブへ</button></div>`;
    // 会社ごとのボタン・探す欄（一覧だけ描き直す。探す欄の入力は消さない）
    let acctCo = '', acctQ = '';
    const shownRows = () => rows.filter((r) => (!acctCo || r.company === acctCo) &&
      (!acctQ || [r.email, r.company, r.theater, shortTheaterName(r.theater), r.person, r.note].join(' ').toLowerCase().indexOf(acctQ) !== -1));
    const bodyHtml = () => {
      const list = shownRows();
      const cos = companyNames();
      return list.length ? list.map((r) => `<tr class="${(r.theater || r.person) ? '' : 'acct-nomatch'}"><td><input type="email" class="tm-input acct-email" data-accem="${escapeHtml(r.email)}" value="${escapeHtml(r.email)}"></td>
        <td><select class="acct-co" data-accco="${escapeHtml(r.email)}"><option value="">（会社なし）</option>${cos.concat(r.company && cos.indexOf(r.company) === -1 ? [r.company] : []).map((co) => `<option${co === r.company ? ' selected' : ''}>${escapeHtml(co)}</option>`).join('')}</select></td>
        <td title="${escapeHtml(r.theater)}"><input type="text" class="tm-input acct-th" data-accth="${escapeHtml(r.email)}" list="acctTheaterList" value="${escapeHtml(r.theater ? shortTheaterName(r.theater) : '')}" placeholder="（本社・会社全体）"></td><td><input type="text" class="tm-input acct-person" data-person="${escapeHtml(r.email)}" value="${escapeHtml(r.person || '')}" placeholder="—"></td><td>${escapeHtml(r.note || '')}</td><td><button type="button" class="danger" data-del="${escapeHtml(r.email)}">🗑</button></td></tr>`).join('')
        : `<tr><td colspan="6" class="acct-empty">${rows.length ? '合うアドレスがありません。' : 'まだありません。Excel・CSV を読み込むか、上の欄から足してください。'}</td></tr>`;
    };
    const coBar = () => {
      const cos = Array.from(new Set(rows.map((r) => r.company || ''))).sort((a, b) => companyNames().indexOf(a) - companyNames().indexOf(b));
      return `<button type="button" class="rperson-btn${acctCo ? '' : ' active'}" data-acco="">全社 ${rows.length}</button>` +
        cos.map((c) => `<button type="button" class="rperson-btn${acctCo === c ? ' active' : ''}" data-acco="${escapeHtml(c)}">${escapeHtml(c ? companyAbbr(c) : '会社なし')} ${rows.filter((r) => (r.company || '') === c).length}</button>`).join('');
    };
    const drawBody = () => {
      const tb = ov.querySelector('.acct-table tbody'); if (tb) tb.innerHTML = bodyHtml();
      const cb = ov.querySelector('.acct-cobar'); if (cb) cb.innerHTML = coBar();
      const n = ov.querySelector('.acct-count'); if (n) n.textContent = `${shownRows().length} 件 ／ 全部 ${rows.length} 件`;
    };
    const draw = () => {
      ov.innerHTML = `<h3 class="mst-h">📧 客先アカウント（劇場・本社のメールアドレス）</h3>
          <p class="tm-hint">劇場のメールアドレスで入った人には、その劇場の案件だけが並びます（上の「全部の劇場」で会社の全部も見られます）。客先が直せるのは「自社のメモ」だけです。<br>Excel・CSV（メールアドレスと劇場名の列がある表）を読み込むと、まとめて入れます。同じアドレスは上書きします。見出しに「担当者」の列があれば担当者名も入れます。<br>担当者名は、案件の「TOHOシネマズ担当者」と同じ名前にします（その案件の通知メールが必ず届きます）。<br>メールアドレス・会社・劇場・担当者名は、表の中でそのまま直せます（劇場を空にすると「本社・会社全体」）。</p>
          ${mailBox()}
          <div class="acct-bar"><label class="kt-upload primary-like">⬆ Excel・CSV を読み込む<input type="file" id="acctFile" accept=".xlsx,.csv" hidden></label>
            <span class="acct-add"><input type="email" id="acctEmail" class="tm-input" placeholder="メールアドレス"><input type="text" id="acctTheater" class="tm-input" list="acctTheaterList" placeholder="劇場（短い名前でも可）"><input type="text" id="acctPerson" class="tm-input acct-person-in" placeholder="担当者名（本社の人など）"><datalist id="acctTheaterList">${names.map((n) => `<option value="${escapeHtml(n)}">`).join('')}</datalist><button type="button" data-add>＋ 足す</button></span></div>
          <div class="acct-find"><span class="rperson-bar acct-cobar">${coBar()}</span><input type="search" id="acctSearch" class="tm-input" placeholder="🔍 アドレス・劇場・担当者名で探す" value="${escapeHtml(acctQ)}"></div>
          <div class="acct-wrap"><table class="acct-table"><thead><tr><th>メールアドレス</th><th>会社</th><th>劇場</th><th>担当者名</th><th>メモ</th><th></th></tr></thead><tbody>
          ${bodyHtml()}
          </tbody></table></div>
          <div class="acct-count ms-note">${shownRows().length} 件 ／ 全部 ${rows.length} 件</div>`;
    };
    draw();
    const reload = async () => { rows = await store.fetchAccounts(); draw(); };
    ov.addEventListener('input', (e) => { if (e.target.id === 'acctSearch') { acctQ = e.target.value.trim().toLowerCase(); drawBody(); } });
    ov.addEventListener('click', async (e) => {
      const cb = e.target.closest('[data-acco]'); if (cb) { acctCo = cb.dataset.acco; drawBody(); return; }
      if (e.target.closest('[data-add]')) {
        const email = ov.querySelector('#acctEmail').value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (K) K.say('メールアドレスを入れてください'); return; }
        let company = CUSTOMER_DOMAIN_COMPANY[email.split('@')[1]] || '';
        const tIn = ov.querySelector('#acctTheater').value.trim();
        const theater = tIn ? (accountTheaterOf([tIn], company) || '') : '';
        if (tIn && !theater) { if (K) K.say(`「${tIn}」に合う劇場が見つかりません（会社: ${company || '不明'}）`); return; }
        if (!company && theater) company = companyOfTheater(theater);
        const pIn = ov.querySelector('#acctPerson');
        const row = { email, company, theater, note: '' };
        if (hasMail) row.person = pIn ? pIn.value.trim() : '';
        try { await store.saveAccounts([row]); await reload(); } catch (err) { if (K) K.say('保存できませんでした: ' + (err.message || err)); }
        return;
      }
      if (e.target.closest('[data-openmailset]')) { if (goTab) goTab('mail'); return; }
      const del = e.target.closest('[data-del]');
      if (del) {
        if (K && !(await K.ask(`${del.dataset.del} を消しますか？`, { ok: '消す', danger: true }))) return;
        try { await store.deleteAccount(del.dataset.del); await reload(); } catch (err) { if (K) K.say('消せませんでした: ' + (err.message || err)); }
      }
    });
    ov.addEventListener('change', async (e) => {
      // 会社・劇場・メールアドレスを表の中で直す
      const ce = e.target.closest('[data-accco],[data-accth],[data-accem]');
      if (ce) {
        const key = ce.dataset.accco || ce.dataset.accth || ce.dataset.accem;
        const r = rows.find((x) => x.email === key); if (!r) return;
        try {
          if (ce.dataset.accco !== undefined) {
            const company = ce.value;
            const theater = r.theater && company && companyOfTheater(r.theater) && companyOfTheater(r.theater) !== company ? '' : r.theater;
            await store.saveAccounts([Object.assign({}, r, { company, theater })]);
            showToastLite('会社を保存しました' + (theater !== r.theater ? '（劇場は会社が違うので空にしました）' : ''));
          } else if (ce.dataset.accth !== undefined) {
            const tIn = ce.value.trim();
            const theater = tIn ? (accountTheaterOf([tIn], r.company) || '') : '';
            if (tIn && !theater) { K.say(`「${tIn}」に合う劇場が見つかりません（会社: ${r.company || '不明'}）`); ce.value = r.theater ? shortTheaterName(r.theater) : ''; return; }
            await store.saveAccounts([Object.assign({}, r, { theater, company: r.company || (theater ? companyOfTheater(theater) : '') })]);
            showToastLite(theater ? `劇場を「${shortTheaterName(theater)}」にしました` : '劇場を空にしました（本社・会社全体）');
          } else {
            const email = ce.value.trim().toLowerCase();
            if (email === r.email) return;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { K.say('メールアドレスが正しくありません'); ce.value = r.email; return; }
            if (rows.some((x) => x.email === email)) { K.say(`${email} はもうあります`); ce.value = r.email; return; }
            // アドレスは表の鍵なので、新しいアドレスで足してから前のを消す
            await store.saveAccounts([Object.assign({}, r, { email })]);
            await store.deleteAccount(r.email);
            showToastLite('メールアドレスを直しました');
          }
          await reload(); accountsCache = rows;
        } catch (err) { K.say('保存できませんでした: ' + (err.message || err)); await reload(); }
        return;
      }
      const pe = e.target.closest('[data-person]');
      if (pe) {
        const r = rows.find((x) => x.email === pe.dataset.person); if (!r) return;
        try { await store.saveAccounts([Object.assign({}, r, { person: pe.value.trim() })]); r.person = pe.value.trim(); showToastLite('担当者名を保存しました'); }
        catch (err) { if (K) K.say('保存できませんでした: ' + (err.message || err)); }
        return;
      }
      if (e.target.id !== 'acctFile' || !e.target.files[0]) return;
      const f = e.target.files[0];
      try {
        const text = /\.csv$/i.test(f.name) ? await K.csvToText(f) : await K.xlsxToText(f);
        const list = parseAccountSheet(text);
        if (!list.length) { K.say('メールアドレスが見つかりませんでした。メールアドレスと劇場名の列がある表を選んでください。'); return; }
        if (!hasMail) list.forEach((r) => { delete r.person; });
        const miss = list.filter((r) => !r.theater && !r.person);
        const ok = await K.ask(`${list.length} 件のアドレスを読みました（劇場が分かった ${list.length - miss.length} 件・分からなかった ${miss.length} 件）。入れますか？` + (miss.length ? `\n劇場が分からなかったもの（会社全体として入れます。あとで直せます）: ${miss.slice(0, 8).map((r) => r.email).join('、')}${miss.length > 8 ? ' ほか' : ''}` : ''), { ok: '入れる' });
        if (!ok) return;
        await store.saveAccounts(list); await reload();
      } catch (err) { K.say('読み込めませんでした: ' + (err.message || err)); }
      e.target.value = '';
    });
  }
  // ===== 案件名（AI） =====
  async function caseTitleApi(body) {
    let token = '';
    try { const { data } = await sb.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch (e) {}
    const r = await fetch('/api/case-title', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('通信に失敗しました（' + r.status + '）'));
    return j;
  }
  // 保存した案件の案件名を付ける（空の時だけ）。付いたら画面にもすぐ出す
  async function autoTitleCases(ids) {
    if (store.mode !== 'supabase' || !isPrivileged(currentUser)) return;
    try {
      const j = await caseTitleApi({ ids });
      let changed = false;
      Object.keys(j.titles || {}).forEach((id) => { const c = cases.find((x) => String(x.id) === String(id)); if (c && !c.title) { c.title = j.titles[id]; changed = true; } });
      if (changed) render();
    } catch (e) { console.warn('案件名を付けられませんでした', e); }
  }
  // 案件名が空の案件に、まとめて付ける（☰ の「🏷 案件名をまとめて付ける」）
  async function fillAllTitles() {
    const K = window.KARTE;
    if (K && !(await K.ask('案件名が空の案件に、AI が内容から案件名を付けます（40件ずつ・数分かかることがあります）。始めますか？', { ok: '始める' }))) return;
    let total = 0, rest = null, rounds = 0;
    const msg = (t) => { const el = $('caseCount'); if (el) el.dataset.titleMsg = t; showToastLite(t); };
    try {
      do {
        const j = await caseTitleApi({ fill: true });
        total += j.done || 0; rest = j.remaining; rounds++;
        msg(`🏷 案件名を付けています… ${total} 件（残り ${rest == null ? '?' : rest} 件）`);
        if (!j.done) break;
      } while (rest > 0 && rounds < 60);
      cases = await store.fetchCases();
      render();
      if (K) K.say(`案件名を ${total} 件付けました。${rest ? `（残り ${rest} 件。もう一度押すと続きから付けます）` : ''}`);
    } catch (e) { if (K) K.say('案件名を付けられませんでした: ' + (e.message || e)); }
  }
  function showToastLite(t) {
    let el = document.getElementById('liteToast');
    if (!el) { el = document.createElement('div'); el.id = 'liteToast'; el.className = 'lite-toast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 4000);
  }
  // TOHO の決裁番号が要る案件（見積り金額・税抜が3万円以上）。種別の文字を黄色にする（決裁番号を入れても黄色のまま）
  const APPROVAL_NO_AMOUNT = 30000;   // 2026-11-19: 10万円 → 3万円（TOHO の決裁番号）
  function needsApprovalNo(c) {
    if (!c || c.company !== 'TOHOシネマズ') return false;
    const a = Number(String(c.estimateAmount == null ? '' : c.estimateAmount).replace(/[^\d.]/g, ''));
    return !isNaN(a) && a >= APPROVAL_NO_AMOUNT;
  }
  function isMobile() { return window.matchMedia ? window.matchMedia('(max-width: 600px)').matches : (window.innerWidth <= 600); }
  function editableTd(c, field, displayHtml, extraClass) {
    const cfg = EDITABLE_FIELDS[field];
    const canEdit = !(cfg.privilegedOnly && !isPrivileged(currentUser))
                  && !(cfg.readonlyForCustomer && !isPrivileged(currentUser))
                  && !(cfg.tohoOnly && c.company !== 'TOHOシネマズ')
                  && (isPrivileged(currentUser) || field === 'customerMemo');   // 客先は「自社のメモ」だけ直せる
    // 編集はできないが、ポップアップで全文を見られる項目（客先の「内容」など）
    const viewOnlyPopup = !canEdit && cfg.type === 'popup' && !cfg.privilegedOnly;
    const cls = (canEdit ? 'editable' : (viewOnlyPopup ? 'viewable' : ''))
      + (c[field] ? '' : ' empty') + (extraClass ? ' ' + extraClass : '');
    const title = field === 'estimateName' ? ' title="ダブルクリックで見積書を読み取り（AI-OCR）"' : '';
    return `<td class="${cls}" data-field="${field}" data-colkey="${field}" data-case-id="${escapeHtml(c.id)}" data-label="${escapeHtml(fieldLabel(field))}"${title}>${displayHtml}</td>`;
  }

  // ステータスのセル（バッジ＋手動選択。受注者のみ編集可）— 通常/タスク両モードで共有
  // ② 遅れている日数（見積り遅れ＝調査から○日／調査日未定＝受付から○日）。社内だけに出す
  function lateDaysHtml(c) {
    if (!isPrivileged(currentUser)) return '';
    const cls = rowColorClass(c);
    const today = todayStr();
    const st = statusOf(c);
    if (st === '見積り中' && c.dueExempt && DELAY_CATEGORIES.has(c.category)) return `<span class="late-days ex" title="見積りの期日免除${c.dueExemptReason ? '：' + escapeHtml(c.dueExemptReason) : ''}">期日免除</span>`;
    if (cls === 'row-red' && c.surveyDate) {
      const n = businessDaysBetween(c.surveyDate, today);
      return `<span class="late-days" title="現調の翌日から平日${n}日たっても見積りが出ていません（期日は平日${DUE_DAYS}日）">現調から${n}日</span>`;
    }
    if (cls === 'row-yellow') return '<span class="late-days y" title="初動対応・区分判定の報告がまだです">初動報告まだ</span>';
    if (!cls && !c.surveyDate && DELAY_CATEGORIES.has(c.category) && ['見積り中', '見積り提出済', '作業中', '日程調整中'].indexOf(st) !== -1 && !/繰越/.test([c.theater, c.title, c.content, c.estimateName].join(' ')))
      return '<span class="late-days ex" title="ステータスは先に進んでいますが、調査日が入っていません。調査日を入れると、見積りの期日（赤）も分かります">調査日が空</span>';
    if (cls === 'row-orange') {
      const base = c.initialReportAt ? String(c.initialReportAt).slice(0, 10) : c.receivedDate;
      const n = businessDaysBetween(base, today);
      return `<span class="late-days o" title="${c.initialReportAt ? '初動報告' : '受付'}の翌日から平日${n}日たっても調査日が決まっていません">${c.initialReportAt ? '報告' : '受付'}から${n}日</span>`;
    }
    return '';
  }
  function buildStatusCell(c) {
    const statusCode = statusOf(c);
    const manualStatus = isStatusManual(c);
    const statusHtml = `<span class="status-badge status-${escapeHtml(statusCode)}${manualStatus ? ' manual' : ''}">${escapeHtml(statusDisplayLabel(statusCode))}</span>` + lateDaysHtml(c);
    return isPrivileged(currentUser)
      ? `<td class="col-status status-cell" data-colkey="status" data-case-id="${escapeHtml(c.id)}" data-label="ステータス"><span class="status-pick" data-action="status-edit" data-id="${escapeHtml(c.id)}" title="クリックでステータスを変更（先頭の「自動」で自動判定に戻ります）">${statusHtml}</span></td>`
      : `<td class="col-status status-cell" data-colkey="status" data-label="ステータス">${statusHtml}</td>`;
  }
  // ===== 列幅のドラッグ調整（どの画面でも） =====
  function fieldOfTh(th) { return th.dataset.sort || th.dataset.col || ''; }
  function addResizers(thead) {
    if (!thead) return;
    thead.querySelectorAll('th').forEach((th) => {
      if (!fieldOfTh(th)) return;
      if (th.querySelector('.col-resizer')) return;
      const h = document.createElement('span');
      h.className = 'col-resizer';
      th.appendChild(h);
    });
  }
  function applyColWidths() {
    const tbl = $('casesTable');
    if (!tbl) return;
    // 劇場名の固定offset = ステータス列の幅
    if (colWidths.status) tbl.style.setProperty('--col-status-w', colWidths.status + 'px');
    let css = '';
    Object.keys(colWidths).forEach((field) => {
      const w = colWidths[field];
      if (!w) return;
      const decl = `width:${w}px;min-width:${w}px;max-width:${w}px;overflow:hidden;text-overflow:ellipsis;`;
      css += `#casesTable th[data-sort="${field}"],#casesTable th[data-col="${field}"],#casesTable th.col-${field},#casesTable td[data-field="${field}"],#casesTable td.col-${field}{${decl}}`;
      css += `#casesTable.task-mode th[data-col="${field}"],#casesTable.task-mode td[data-field="${field}"],#casesTable.task-mode td.col-${field}{${decl}}`;
    });
    if (!colWidthStyleEl) { colWidthStyleEl = document.createElement('style'); document.head.appendChild(colWidthStyleEl); }
    colWidthStyleEl.textContent = css;
  }
  function startColResize(th, field, e) {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const z = (typeof tableZoom === 'number' && tableZoom) ? tableZoom : 1;
    const startW = th.getBoundingClientRect().width / z;
    const move = (ev) => {
      const w = Math.max(40, Math.round(startW + (ev.clientX - startX) / z));
      colWidths[field] = w;
      applyColWidths();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem(COLW_KEY, JSON.stringify(colWidths)); } catch (err) {}
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // 会社タグ（略称＋ユーザー設定色）— 通常/タスク両モードで共有
  function buildCompanyTag(c) {
    if (!c.company) return '';
    const cCol = companyColor(c.company);
    const cStyle = cCol ? ` style="background:${escapeHtml(cCol)};color:${contrastText(cCol)}"` : '';
    // 客先ログインでは略称(TOHO等)を使わず会社名をそのまま表示する
    const shown = isPrivileged(currentUser) ? companyAbbr(c.company) : c.company;
    return `<span class="company-tag company-${safeClass(c.company)}"${cStyle} title="${escapeHtml(c.company)}">${escapeHtml(shown)}</span>`;
  }
  // 横スクロールで左に残す列（編集・ステータス・会社・劇場名。2026-11-24）。列を並べ替えた時も、左から順に詰めて固定する
  const STICKY_KEYS = ['edit', 'status', 'company', 'theater'];
  function syncStickyCols() {
    const tbl = $('casesTable'); if (!tbl) return;
    let left = 0;
    tbl.querySelectorAll('thead th').forEach((th) => {
      const k = th.dataset.colkey; if (STICKY_KEYS.indexOf(k) === -1) return;
      if (!th.getClientRects().length) return;   // 隠している列は詰める
      tbl.style.setProperty('--stk-' + k, left + 'px');
      left += th.getBoundingClientRect().width;
    });
  }
  window.addEventListener('resize', () => requestAnimationFrame(syncStickyCols));
  function render() {
    setTimeout(syncStickyCols, 0);
    if (!isPrivileged(currentUser) && showTax) { showTax = false; document.body.classList.remove('show-tax'); }   // 客先は税抜きだけ
    applyAcctCols();
    // 🚩（✎ の横）の分だけ、編集の列を広げる。ベルは廃止（2026-11-19）
    document.body.classList.toggle('case-bells', !!tohoV2Supported);
    document.body.classList.toggle('show-other', !!tohoV2Supported && showOtherCols());
    renderMailSetBtn();
    if (leftStaff().length) renderRPersonBar();   // 異動・退職の人の「⚠ n件」を最新に
    setTimeout(checkInitialReportGate, 0);   // TOHO に絞った時は、初動報告がまだの案件の報告画面を出す
    if (taskMode) { renderTaskTable(); return; }
    // 案件変更後に履歴候補（datalist）を最新化（ロール別に自動分離）
    renderDatalists();
    const filtered = getFilteredCases();
    const tbody = $('casesBody');
    tbody.innerHTML = '';
    const isToho = !isPrivileged(currentUser);
    filtered.forEach((c) => {
      const tr = document.createElement('tr');
      tr.dataset.caseId = c.id;
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;
      if (isPrivileged(currentUser) && needsInitialReport(c)) tr.classList.add('ir-lock');   // 初動報告まで中身を見せない
      if (editingCaseId && String(editingCaseId) === String(c.id)) tr.classList.add('row-editing');
      const companyHtml = buildCompanyTag(c);
      const statusCell = buildStatusCell(c);
      // 入金日セル: 予定/確認 切替ボタン＋日付
      const payConfirmed = c.paymentConfirmed !== false;
      const payBtn = c.paymentDate
        ? `<button type="button" class="pay-status-btn ${payConfirmed ? 'confirmed' : 'planned'}" data-action="toggle-pay" data-id="${escapeHtml(c.id)}" title="入金の予定/確認を切り替えます">${payConfirmed ? '確認' : '予定'}</button> `
        : '';
      const payCell = editableTd(c, 'paymentDate', payBtn + escapeHtml(fmtDateShort(c.paymentDate)));
      const isTohoCo = c.company === 'TOHOシネマズ';
      const certHtml = isTohoCo
        ? editableTd(c, 'certNumber', escapeHtml(c.certNumber))
        : `<td class="toho-empty" data-colkey="certNumber" data-label="決裁番号">—</td>`;

      tr.innerHTML = `
        <td class="col-edit" data-colkey="edit" data-label="${isPrivileged(currentUser) ? '編集' : '見る'}">${isPrivileged(currentUser)
          ? `<button type="button" class="row-edit-btn" data-action="edit" data-id="${escapeHtml(c.id)}" title="この案件のすべての項目を編集" aria-label="編集">✎<span class="edit-lbl"> 編集</span></button>`
          : `<button type="button" class="row-edit-btn row-view-btn" data-action="edit" data-id="${escapeHtml(c.id)}" title="この案件を見る（自社のメモは書き込めます）" aria-label="見る">👁<span class="edit-lbl"> 見る</span></button>`}${urgentHtml(c)}</td>
        ${statusCell}
        ${editableTd(c, 'company', companyHtml, 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(shortTheaterName(c.theater)))}
        ${editableTd(c, 'receivedDate', fmtDateShort(c.receivedDate))}
        ${editableTd(c, 'tcPerson', escapeHtml(stripHonorific(c.tcPerson)))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'category', needsApprovalNo(c) ? `<span class="cat-approval" title="見積り金額（税抜）が3万円以上：TOHO の決裁番号が必要です">${escapeHtml(c.category)}</span>` : escapeHtml(c.category))}
        ${editableTd(c, 'title', escapeHtml(c.title || ''), 'col-title' + (isPrivileged(currentUser) && statusOf(c) === '見積り中' ? ' quote-blink' : ''))}
        ${editableTd(c, 'content', dupBadgeHtml(c) + escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'customerMemo', escapeHtml(c.customerMemo), 'col-customer-memo')}
        ${editableTd(c, 'surveyDate', c.surveyDate ? escapeHtml(fmtDateTime(c.surveyDate, c.surveyTime)) : (c.surveyAdjusting ? '<span class="adj">調整中</span>' : ''))}
        ${certHtml}
        ${editableTd(c, 'estimateName', escapeHtml(c.estimateName))}
        ${editableTd(c, 'estimateAmount', fmtAmount(c.estimateAmount))}
        <td class="col-tax" data-colkey="tax" data-label="見積り金額(税込)">${fmtAmount(taxIncludedAmount(c.estimateAmount))}</td>
        ${otherTds(c)}
        ${editableTd(c, 'quoteDate', fmtDateShort(c.quoteDate))}
        ${editableTd(c, 'workStartDate', c.workStartDate ? escapeHtml(fmtDateTime(c.workStartDate, c.workStartTime)) : ((c.surveyAdjusting || c.scheduleAdjusting) ? '<span class="adj">調整中</span>' : ''))}
        ${workappTd(c)}
        ${editableTd(c, 'workEndDate', c.workEndDate ? escapeHtml(fmtDateTime(c.workEndDate, c.workEndTime)) : ((c.surveyAdjusting || c.scheduleAdjusting) ? '<span class="adj">調整中</span>' : ''))}
        ${editableTd(c, 'invoiceDate', fmtDateShort(c.invoiceDate))}
        ${payCell}
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
        ${editableTd(c, 'adviceNote', escapeHtml(c.adviceNote || ''), 'col-ryo col-advice')}
      `;
      tbody.appendChild(tr);
    });
    $('emptyMsg').classList.toggle('hidden', filtered.length > 0);
    // 全件数（分母分子なし）。選択中の客先・R担当者で件数が変わる
    let scope = visibleCases();
    if (companyFilter.size) scope = scope.filter((c) => companyFilter.has(c.company));
    if (rPersonFilter.size) {
      scope = scope.filter((c) => {
        const rp = c.rPerson || '';
        for (const n of rPersonFilter) { if (rp.includes(n)) return true; }
        return false;
      });
    }
    $('caseCount').textContent = `全 ${scope.length} 件`;
    updateMobileSortButtons();
    updateSortIndicators();
    updateColumnFilterIndicators();
    updateShowAllBtn();
    applyColumnOrder();   // 個人設定の列並びを反映
    setupColumnDrag();    // 見出しをドラッグで並べ替え可能に
    addColSortHandles();  // 見出しの「▲」で昇順/降順の並び替え
    syncHScrollWidth();   // 上部横スクロールバーの幅を合わせる
    renderStatusChips();  // 状態ごとの件数ボタン
    updateTaskBadge();    // 「タスク管理」ボタンの未完了件数
    renderMobileCards(filtered); // ⑨ スマホのカード
  }

  // ===== 列の並べ替え（個人設定・ドラッグ） =====
  // 標準の並び。顧客メモは「内容」のすぐ右に置く（既に個人で並べ替えている場合は
  // その設定が優先されるため、標準に戻すには「列並びリセット」を押す）
  const DEFAULT_COLUMN_KEYS = ['edit', 'status', 'company', 'theater', 'receivedDate', 'tcPerson', 'rPerson', 'category', 'title', 'content', 'customerMemo', 'surveyDate', 'certNumber', 'estimateName', 'estimateAmount', 'tax', 'otherVendor', 'otherAmount', 'otherRate', 'otherFee', 'quoteDate', 'workStartDate', 'workapp', 'workEndDate', 'invoiceDate', 'paymentDate', 'memo', 'adviceNote'];
  // 支払い状況モードの列（左＝案件情報／右＝支払い入力）
  const PURCHASE_COLS = [
    { field: 'company',        label: '会社' },
    { field: 'theater',        label: '劇場名' },
    { field: 'content',        label: '内容' },
    { field: 'estimateName',   label: '見積り名' },
    { field: 'estimateAmount', label: '見積り金額' },
    { field: 'purchases',      label: '支払い（年月／業者名／金額）' }
  ];
  // 並べ替えの対象モード（A集計は対象外・thead構成が別）
  function colOrderMode() { return taskMode ? 'task' : (purchaseMode ? 'purchase' : 'main'); }
  function columnKeysFor(mode) {
    if (mode === 'task') return TASK_COLS.map((c) => c.field);
    if (mode === 'purchase') return PURCHASE_COLS.map((c) => c.field);
    return DEFAULT_COLUMN_KEYS.slice();
  }
  function colOrderStorageKey(mode) {
    const base = mode === 'task' ? 'colOrderTaskV1' : (mode === 'purchase' ? 'colOrderPurchaseV1' : 'colOrderV1');
    return userFilterKey(base);
  }
  // アクティブなthead行（モードで thead を差し替えても追従）
  function activeTheadRow() { return $('casesTable').querySelector('thead tr') || $('theadRow'); }
  function loadColumnOrder() {
    try { const a = JSON.parse(localStorage.getItem(colOrderStorageKey(colOrderMode()))); if (Array.isArray(a) && a.length) return a; } catch (e) {}
    return null;
  }
  function saveColumnOrder(order) { try { localStorage.setItem(colOrderStorageKey(colOrderMode()), JSON.stringify(order)); } catch (e) {} }
  function currentColumnOrder() {
    const keys = columnKeysFor(colOrderMode());
    const saved = loadColumnOrder();
    if (!saved) return keys.slice();
    let out = saved.filter((k) => keys.indexOf(k) !== -1);
    // 新設列は、既定の並びで次に来る列の前に入れる（例: 案件名は内容の左）。次の列が無ければ末尾
    keys.forEach((k, i) => {
      if (out.indexOf(k) !== -1) return;
      const nextKey = keys.slice(i + 1).find((x) => out.indexOf(x) !== -1);
      if (nextKey) out.splice(out.indexOf(nextKey), 0, k); else out.push(k);
    });
    // ✎ 列は行の色の帯も兼ねるので、以前の並び設定で動かしていても常に左端へ
    if (keys[0] === 'edit') out = ['edit'].concat(out.filter((k) => k !== 'edit'));
    return out;
  }
  function reorderCellsByKey(rowEl, order) {
    const byKey = {};
    Array.prototype.forEach.call(rowEl.children, (td) => { const k = td.getAttribute('data-colkey'); if (k) byKey[k] = td; });
    order.forEach((k) => { if (byKey[k]) rowEl.appendChild(byKey[k]); });
  }
  function applyColumnOrder() {
    if (aggMode) return; // A集計は列構成が別（対象外）。main/task/purchase で有効
    const order = currentColumnOrder();
    const tbl = $('casesTable');
    tbl.classList.toggle('custom-col-order', !!loadColumnOrder()); // 並べ替え中は左固定を解除
    const head = activeTheadRow(); if (head) reorderCellsByKey(head, order);
    $('casesBody').querySelectorAll('tr').forEach((tr) => reorderCellsByKey(tr, order));
  }
  // 見出しの先頭に「▲」を付ける。押すとその列で並び替え（昇順→降順→解除）。
  // ▼=降順、▲(青)=昇順、▲(グレー)=並び替えなし。列の移動は見出しのドラッグで行う。
  function addColSortHandles() {
    if (aggMode) return;
    const head = activeTheadRow(); if (!head) return;
    head.querySelectorAll('th[data-colkey]').forEach((th) => {
      const field = th.dataset.sort;
      let btn = th.querySelector('.col-sort-btn');
      // 並び替えできない列（編集ボタン等）にはボタンを出さない
      if (!field || !th.classList.contains('sortable')) { if (btn) btn.remove(); return; }
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'col-sort-btn';
        // ボタン自体はドラッグ対象にしない（クリックが拾えなくなるため）
        btn.draggable = false;
        btn.addEventListener('mousedown', (ev) => ev.stopPropagation());
        th.insertBefore(btn, th.firstChild);
      }
      const active = sortState.field === field;
      const desc = active && sortState.direction === 'desc';
      btn.textContent = desc ? '▼' : '▲';
      btn.classList.toggle('active', active);
      btn.title = !active ? 'この項目で並び替え（昇順）'
        : (desc ? 'この項目の並び替えを解除' : 'この項目で並び替え（降順）');
    });
  }
  // その列で 昇順 → 降順 → 解除 と切り替える
  function toggleColumnSort(field) {
    if (!field) return;
    if (sortState.field === field) {
      if (sortState.direction === 'asc') sortState.direction = 'desc';
      else { sortState.field = null; sortState.direction = 'asc'; }
    } else {
      sortState.field = field;
      sortState.direction = 'asc';
    }
    render();
  }
  function setupColumnDrag() {
    if (aggMode) return;
    const head = activeTheadRow(); if (!head) return;
    head.querySelectorAll('th[data-colkey]').forEach((th) => { th.draggable = th.getAttribute('data-colkey') !== 'edit'; });
  }
  let dragColKey = null;
  function clearColDragMarks() {
    const head = activeTheadRow(); if (!head) return;
    head.querySelectorAll('.col-dragging, .col-drop-target').forEach((x) => x.classList.remove('col-dragging', 'col-drop-target'));
  }
  function bindColumnDrag() {
    const thead = $('casesTable').querySelector('thead');
    thead.addEventListener('dragstart', (e) => {
      if (aggMode) return;
      const th = e.target.closest('th[data-colkey]');
      if (!th || e.target.closest('.col-resizer')) { e.preventDefault(); return; }
      dragColKey = th.getAttribute('data-colkey');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragColKey); } catch (err) {}
      th.classList.add('col-dragging');
    });
    thead.addEventListener('dragover', (e) => {
      if (!dragColKey) return;
      e.preventDefault();
      const th = e.target.closest('th[data-colkey]');
      const head = activeTheadRow(); if (head) head.querySelectorAll('.col-drop-target').forEach((x) => x.classList.remove('col-drop-target'));
      if (th && th.getAttribute('data-colkey') !== dragColKey) th.classList.add('col-drop-target');
    });
    thead.addEventListener('drop', (e) => {
      if (!dragColKey) return;
      e.preventDefault();
      const th = e.target.closest('th[data-colkey]');
      const targetKey = th && th.getAttribute('data-colkey');
      if (targetKey && targetKey !== dragColKey) {
        const order = currentColumnOrder();
        order.splice(order.indexOf(dragColKey), 1);
        order.splice(order.indexOf(targetKey), 0, dragColKey); // ターゲットの前に挿入
        saveColumnOrder(order);
        applyColumnOrder();
      }
      dragColKey = null; clearColDragMarks();
    });
    thead.addEventListener('dragend', () => { dragColKey = null; clearColDragMarks(); });
  }
  // 列並びを既定に戻す（現在アクティブなモードの順序をリセット）
  function resetColumnOrder() {
    try { localStorage.removeItem(colOrderStorageKey(colOrderMode())); } catch (e) {}
    refresh();
  }

  // ===== 上部の横スクロールバー（本体と同期・位置は個人設定） =====
  function syncHScrollWidth() {
    const inner = $('hScrollTopInner'); const tbl = $('casesTable');
    if (inner && tbl) inner.style.width = tbl.scrollWidth + 'px';
  }
  function bindHScroll() {
    const wrap = document.querySelector('.table-wrap'); const top = $('hScrollTop');
    if (!wrap || !top) return;
    // 上の横バーと表の横の位置をそろえる。動かしている側（持ち主）だけが相手を動かす。
    // 相手側の「動いた」の知らせは後から届くので、それで持ち主を引き戻さない（引き戻し合いが、ちらつきの元）。
    // 表示倍率 125% などで位置が小数になっても、1px 未満の違いは直さない
    let hsOwner = null, hsTimer = null;
    const hsSync = (from, to) => {
      if (hsOwner && hsOwner !== from) return;
      hsOwner = from;
      if (Math.abs(to.scrollLeft - from.scrollLeft) >= 1) to.scrollLeft = from.scrollLeft;
      clearTimeout(hsTimer); hsTimer = setTimeout(() => { hsOwner = null; }, 150);
    };
    top.addEventListener('scroll', () => hsSync(top, wrap), { passive: true });
    wrap.addEventListener('scroll', () => hsSync(wrap, top), { passive: true });
    window.addEventListener('resize', syncHScrollWidth);
  }
  function applyHScrollPos() {
    const pos = (localStorage.getItem(userFilterKey('hscrollPosV1')) || 'top');
    document.body.classList.toggle('hscroll-bottom', pos === 'bottom');
    const btn = $('hscrollPosBtn'); if (btn) btn.textContent = pos === 'bottom' ? '横バー：下のみ' : '横バー：上に表示';
    syncHScrollWidth();
  }

  // ---------- inline edit ----------
  function startInlineEdit(td, c, field) {
    if (td.querySelector('.inline-edit')) return;
    const cfg = EDITABLE_FIELDS[field];
    if (!cfg) return;
    if (cfg.privilegedOnly && !isPrivileged(currentUser)) return;
    // ポップアップ項目は、編集できない場合でも「閲覧用」として開く（客先の「内容」も全文が読めるように）
    if (cfg.type === 'popup' && !(cfg.tohoOnly && c.company !== 'TOHOシネマズ')) { openContentModal(c, field); return; }
    if (!isPrivileged(currentUser) && field !== 'customerMemo') return;   // 客先は「自社のメモ」だけ
    if (cfg.tohoOnly && c.company !== 'TOHOシネマズ') return;
    if (cfg.readonlyForCustomer && !isPrivileged(currentUser)) return; // 内容は客先は閲覧のみ

    const oldVal = c[field] != null ? c[field] : '';
    let el;
    switch (cfg.type) {
      case 'date':
        el = document.createElement('input');
        el.type = 'text';
        el.inputMode = 'numeric';
        el.placeholder = 'YYYY/MM/DD ・ MM/DD ・ 528 もOK';
        break;
      case 'number':
        // type="number" ではカンマを表示できないため text にして、入力中にカンマを入れる
        el = document.createElement('input');
        el.type = 'text';
        el.inputMode = 'numeric';
        el.addEventListener('input', () => formatAmountFieldLive(el));
        break;
      case 'select': {
        el = document.createElement('select');
        const opts = cfg.dynamicOptions === 'company' ? companyNames() : cfg.options;
        opts.forEach((opt) => { const o = document.createElement('option'); o.value = opt; o.textContent = opt === '' ? '(未選択)' : opt; el.appendChild(o); });
        break;
      }
      case 'datalist':
        el = document.createElement('input'); el.type = 'text'; el.setAttribute('list', cfg.listId);
        if (field === 'theater') fillDatalist('theaterList', theaterChoices(c.company));   // その案件の会社の劇場だけ
        break;
      case 'textarea': el = document.createElement('textarea'); el.rows = 2; break;
      default:         el = document.createElement('input'); el.type = 'text';
    }
    el.className = 'inline-edit' + (cfg.type === 'date' ? ' smart-date' : '');
    // 日付セルは編集中は「2026/1/9（金）」で表示
    el.value = cfg.type === 'date' ? fmtDateIn(oldVal)
      : (cfg.type === 'number' ? formatThousands(oldVal) : oldVal);
    td.innerHTML = '';
    td.appendChild(el);
    el.focus();
    if (el.select) try { el.select(); } catch (e) {}

    let done = false;
    let reEditing = false; // 不正日付で再入力中（重複起動防止）
    let advance = false;   // Enterで右の項目へ移動
    const commit = () => {
      if (done || reEditing) return;
      let newVal = el.value;
      if (typeof newVal === 'string') newVal = newVal.trim();
      if (field === 'rPerson') {
        const rerr = rPersonError(newVal, c.rPerson || '');
        if (rerr) { done = true; window.KARTE.say(rerr); render(); return; }
      }

      // 作業開始日に「0」→ 日程調整中（自動ステータス）。作業開始日は空にしてフラグを立てる
      if (field === 'workStartDate' && newVal === '0') {
        done = true;
        if (!scheduleAdjustAvailable()) {
          alert('「日程調整中」を使うには、データベースの更新（schedule_adjusting 列の追加）が必要です。');
          render();
          return;
        }
        c.workStartDate = '';
        c.scheduleAdjusting = true;
        c.updatedAt = new Date().toISOString();
        persistCase(c);
        render();
        return;
      }

      if (cfg.type === 'date' && newVal !== '') {
        const parsed = parseSmartDate(newVal);
        if (parsed === null) {
          // 不正な日付は破棄せず、編集状態を維持して再入力させる（中断は Esc）
          reEditing = true;
          alert('日付として認識できません: ' + newVal + '\n例: 5/28 / 0528 / 2026/5/28（年を省くと今日以降の日。前の日は年まで）');
          setTimeout(() => {
            reEditing = false;
            el.focus();
            if (el.select) try { el.select(); } catch (e) {}
          }, 0);
          return;
        }
        newVal = parsed;
      }
      done = true;
      if (cfg.type === 'number') {
        const digits = String(newVal).replace(/[^\d]/g, ''); // カンマ等を除いて数値に
        newVal = (digits === '' ? '' : Number(digits));
      }
      if (field === 'tcPerson') newVal = stripHonorific(newVal); // 客先担当者の「さん／様」は保存時に除去

      if (String(newVal) !== String(oldVal)) {
        const before = Object.assign({}, c);
        c[field] = newVal;
        autoClearOverride(c, before);
        waAfterDates(c, before);
        // 作業開始日に実日付/空が入ったら、日程調整中フラグは解除（自動判定に戻す）
        if (field === 'workStartDate' && c.scheduleAdjusting) c.scheduleAdjusting = false;
        // 請求書発行日を入れたら、入金日(予定)を翌月末で自動入力（予定状態）
        if (field === 'invoiceDate' && newVal && !c.paymentDate && paymentConfirmedAvailable()) {
          c.paymentDate = endOfNextMonth(newVal);
          c.paymentConfirmed = false;
        }
        // 入金日を手入力したら「確認」扱いに
        if (field === 'paymentDate' && newVal) c.paymentConfirmed = true;
        c.updatedAt = new Date().toISOString();
        let histChanged = false;
        if (field === 'theater') { addToHistory('theaters', newVal); histChanged = true; }
        if (field === 'tcPerson') { addToHistory('tcPersons', newVal); histChanged = true; }
        if (field === 'rPerson') { addToHistory('rPersons', newVal); histChanged = true; }
        if (histChanged) saveHistory();
        persistCase(c);
      }
      render();
      if (advance) focusNextEditable(c.id, field);
    };
    const cancel = () => { if (done) return; done = true; render(); };

    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cfg.type !== 'textarea') { e.preventDefault(); advance = true; el.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
  }
  // Enter後、同じ行の次の編集可能セル（内容・メモのポップアップは飛ばす）を開く
  function focusNextEditable(caseId, field) {
    const tr = $('casesBody').querySelector(`tr[data-case-id="${caseId}"]`);
    if (!tr) return;
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    const cells = Array.prototype.slice.call(tr.querySelectorAll('td.editable[data-field]'));
    const idx = cells.findIndex((td) => td.dataset.field === field);
    for (let i = idx + 1; i < cells.length; i++) {
      const f = cells[i].dataset.field;
      const cfg = EDITABLE_FIELDS[f];
      if (cfg && cfg.type === 'popup') continue; // 内容・メモはスキップ
      startInlineEdit(cells[i], c, f);
      return;
    }
  }

  // ステータスを手動で選び直す（選んだ時点で手動上書きとして確定。自動判定より優先）
  function openStatusPicker(c) {
    const cell = $('casesBody').querySelector(`td.status-cell[data-case-id="${c.id}"]`);
    if (!cell || cell.querySelector('select')) return;
    const manual = isStatusManual(c);
    const cur = statusOf(c);
    const sel = document.createElement('select');
    sel.className = 'inline-edit status-select';
    // 先頭に「自動」（value=''）。選ぶと手動上書きを解除して自動判定へ戻す
    const autoOpt = document.createElement('option');
    autoOpt.value = '';
    autoOpt.textContent = '自動（自動判定に戻す）';
    if (!manual) autoOpt.selected = true;
    sel.appendChild(autoOpt);
    Object.keys(STATUS_SORT_ORDER).forEach((code) => {
      const o = document.createElement('option');
      o.value = code;
      o.textContent = statusDisplayLabel(code);
      if (manual && code === cur) o.selected = true;
      sel.appendChild(o);
    });
    cell.innerHTML = '';
    cell.appendChild(sel);
    sel.focus();
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = sel.value;
      if (v !== (c.statusOverride || '')) {
        c.statusOverride = v;
        c.updatedAt = new Date().toISOString();
        persistCase(c);
      }
      render();
    };
    sel.addEventListener('change', commit);
    sel.addEventListener('blur', commit);
    sel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { done = true; render(); } });
  }

  // ---------- modal (new / edit) ----------
  // 決裁番号（TOHOのみ）の表示。簡易登録・予定の編集で隠している行は、TOHOでも隠したままにする
  // （以前は会社がTOHOだと、隠すはずの簡易登録・予定の編集でも決裁番号が出ていた）
  let modalMode = 'full';
  function updateTohoVisibility() {
    const isToho = $('company').value === 'TOHOシネマズ';
    document.querySelectorAll('.toho-only-field').forEach((el) => {
      const hiddenByMode = (modalMode === 'simple' && el.dataset.mode === 'full')
        || (modalMode === 'calendar' && !el.hasAttribute('data-cal'));
      el.classList.toggle('hidden', !isToho || hiddenByMode);
    });
  }
  function setDateField(id, iso) { $(id).value = fmtDateIn(iso); }
  // 日付の欄に出す形（2026/1/9（金））
  function fmtDateIn(iso) { return iso ? (window.DATEIN ? window.DATEIN.fmt(iso) : fmtDateFull(iso)) : ''; }
  function readDateField(id, label) {
    const raw = $(id).value.trim();
    if (raw === '') return '';
    const parsed = parseSmartDate(raw);
    if (parsed === null) {
      alert(`${label}の日付が認識できません: ${raw}\n例: 5/28 / 0528 / 2026/5/28（年を省くと今日以降の日。前の日は年まで）`);
      $(id).focus();
      $(id).classList.add('invalid');
      return undefined;
    }
    $(id).classList.remove('invalid');
    return parsed;
  }
  // ===== 支払い状況（購買: 菱熱のみ・複数業者） =====
  function openModal(caseObj, mode) {
    const form = $('caseForm');
    form.reset();
    document.querySelectorAll('.smart-date').forEach(el => el.classList.remove('invalid'));
    $('caseId').value = '';
    const realMode = mode || 'full';
    modalMode = realMode;
    const isSimple = realMode === 'simple';
    const isCalEdit = realMode === 'calendar';
    // 直前のカレンダー編集等で隠れた行をリセット（全行を一旦表示に戻す）
    document.querySelectorAll('#caseForm .form-row').forEach((el) => el.classList.remove('hidden'));
    document.querySelectorAll('[data-mode="full"]').forEach((el) => el.classList.toggle('hidden', isSimple));
    // カレンダー編集: data-cal の行（調査/開始/終了 日時・内容・メモ）だけ表示
    if (isCalEdit) {
      document.querySelectorAll('#caseForm .form-row').forEach((el) => el.classList.toggle('hidden', !el.hasAttribute('data-cal')));
    }
    // 複製/削除（既存案件の編集時のみ・通常編集のみ。表示自体はモバイルのみCSSで制御）
    $('modalDuplicateBtn').classList.toggle('hidden', !caseObj || isCalEdit);
    $('modalDeleteBtn').classList.toggle('hidden', !caseObj || isCalEdit);
    $('modalPhotoBtn').classList.toggle('hidden', !caseObj || isCalEdit || !isPrivileged(currentUser));
    // 🦺 安全書類（どの案件でも）・💰 大口予算書（大口の案件だけ）（2026-11-20）
    if ($('modalSafetyBtn')) $('modalSafetyBtn').classList.toggle('hidden', !caseObj || isCalEdit || !realPrivileged(currentUser) || !window.DOCGEN);
    if ($('modalBudgetBtn')) $('modalBudgetBtn').classList.toggle('hidden', !caseObj || isCalEdit || !realPrivileged(currentUser) || !window.DOCGEN || !window.DOCGEN.isLarge(caseObj));
    renderCaseMailSec(caseObj && !isCalEdit ? caseObj : null);
    // 期日免除・初動報告の欄（菱熱・列がある時だけ）
    document.querySelectorAll('.due-exempt-row').forEach((el) => el.classList.toggle('hidden', !(initialReportSupported && isPrivileged(currentUser) && !isCalEdit)));
    renderIrRow(caseObj && !isCalEdit ? caseObj : null);
    renderStatusRow(caseObj && !isCalEdit ? caseObj : null);
    markCaseFieldSources(caseObj);
    setTimeout(() => { if (!isCalEdit) renderOtherRow(); else if ($('otherRow')) $('otherRow').classList.add('hidden'); }, 0);   // 会社の欄が入ってから決める

    if (isPrivileged(currentUser)) {
      $('company').disabled = false;
    } else {
      $('company').value = customerCompany(currentUser);
      $('company').disabled = true;
    }

    if (caseObj) {
      $('modalTitle').textContent = isCalEdit ? '予定の編集' : '案件編集';
      $('caseId').value = caseObj.id;
      $('company').value = caseObj.company || scopedCompany(companyNames()[0]);
      $('theater').value = theaterForInput(caseObj.theater || '', caseObj.company || '');
      modalOrigTheater = $('theater').value;
      if ($('dueExempt')) { $('dueExempt').checked = !!caseObj.dueExempt; $('dueExemptReason').value = caseObj.dueExemptReason || ''; }
      if ($('caseUrgent')) $('caseUrgent').checked = !!caseObj.urgent;
      if ($('otherVendor')) { $('otherVendor').value = caseObj.otherVendor || ''; $('otherAmount').value = formatThousands(caseObj.otherAmount); $('otherRate').value = caseObj.otherRate === '' || caseObj.otherRate == null ? '' : String(caseObj.otherRate); }
      if (!isCalEdit) renderOtherRow();
      modalOrigRPerson = caseObj.rPerson || '';
      setDateField('receivedDate', caseObj.receivedDate);
      $('tcPerson').value = caseObj.tcPerson || '';
      $('rPerson').value = caseObj.rPerson || '';
      $('category').value = caseObj.category || '';
      $('content').value = caseObj.content || '';
      setDateField('surveyDate', caseObj.surveyDate);
      $('surveyTime').value = caseObj.surveyTime || '';
      $('certNumber').value = caseObj.certNumber || '';
      $('estimateName').value = caseObj.estimateName || '';
      $('estimateAmount').value = formatThousands(caseObj.estimateAmount);
      setDateField('quoteDate', caseObj.quoteDate);
      setDateField('workStartDate', caseObj.workStartDate);
      $('workStartTime').value = caseObj.workStartTime || '';
      setDateField('workEndDate', caseObj.workEndDate);
      $('workEndTime').value = caseObj.workEndTime || '';
      setDateField('invoiceDate', caseObj.invoiceDate);
      setDateField('paymentDate', caseObj.paymentDate);
      $('memo').value = caseObj.memo || '';
      if ($('customerMemo')) $('customerMemo').value = caseObj.customerMemo || '';
      if ($('caseTitle')) $('caseTitle').value = caseObj.title || '';
      if ($('adviceNote')) $('adviceNote').value = caseObj.adviceNote || '';
    } else {
      $('modalTitle').textContent = isSimple ? '簡易登録' : '新規案件登録';
      modalOrigTheater = '';
      modalOrigRPerson = '';
      // 客先・担当者を1つだけ絞っている時は、それを初期選択（複数選択時は標準）
      $('company').value = (isPrivileged(currentUser) && companyFilter.size === 1) ? [...companyFilter][0] : scopedCompany('TOHOシネマズ');
      if (rPersonFilter.size === 1) $('rPerson').value = [...rPersonFilter][0];
      setDateField('receivedDate', todayStr());
    }
    renderDupBanner(caseObj);
    updateTohoVisibility();
    renderDatalists();
    populateCompanySelects();
    if (caseObj) $('company').value = caseObj.company || companyNames()[0];
    else if (!isPrivileged(currentUser)) $('company').value = customerCompany(currentUser);
    $('modal').classList.remove('hidden');
    // ⑦ 右から出るパネル: 見出しの下に状態・劇場名、一覧では編集中の行に色を付ける
    renderModalSub(caseObj, isCalEdit);
    markEditingRow(caseObj ? caseObj.id : null);
    document.body.classList.add('drawer-open');
    modalSnapshot = caseFormSnapshot();
    // 内容・メモは全文が見えるよう、開いた直後に高さを中身に合わせて拡張
    requestAnimationFrame(() => { autoGrowTextarea($('content')); autoGrowTextarea($('memo')); if ($('customerMemo')) autoGrowTextarea($('customerMemo')); });
    // 客先（TOHO などのアカウント）は「自社のメモ」だけ直せる。ほかの欄は見るだけ・削除と複製は出さない
    const cust = !isPrivileged(currentUser);
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.id === 'caseId' || el.type === 'hidden') return;
      if (cust && el.id !== 'customerMemo') { el.dataset.custLocked = '1'; el.disabled = true; }
      else if (el.dataset.custLocked) { delete el.dataset.custLocked; el.disabled = false; }
    });
    ['modalDeleteBtn', 'modalDuplicateBtn'].forEach((id) => { if ($(id)) $(id).classList.toggle('hidden', cust); });
    form.classList.toggle('cust-memo-only', cust);
    setTimeout(() => $('company').focus(), 50);
  }
  // ===== 案件の書類（見積書・作業申請書）と通知メールの記録（菱熱だけ・TOHO の要望④） =====
  let cmCaseId = null;
  const CM_KIND = { quote: '見積書', workapp: '作業申請書', safety: '🦺 安全書類', budget: '💰 大口予算書', other: '書類' };
  function cmDate(s) { const d = new Date(s); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
  // 通知メールの宛先（GAS の CaseMail.gs と同じ決まり）を、画面に出すために数える
  async function caseMailRecipientsText(c) {
    const { data: accs } = await sb.from('customer_accounts').select('email,company,theater,person');
    const out = [], seen = new Set();
    const add = (email, why) => { email = String(email || '').toLowerCase(); if (!email || /@ryonetsu(-ai)?\.com$/.test(email) || seen.has(email)) return; seen.add(email); out.push(`${email}（${why}）`); };
    (accs || []).forEach((a) => { if (a.theater && a.theater === c.theater) add(a.email, '劇場'); });
    (accs || []).forEach((a) => { if (a.person && (!a.company || a.company === c.company) && cmPersonMatch(c.tcPerson, a.person)) add(a.email, '担当者'); });
    // 見積り3万円以上（税抜）の TOHO の案件は、本社の決裁者にも（ベルは廃止 2026-11-19）
    const ap = approverPref();
    if (ap && c.company === 'TOHOシネマズ' && Number(c.estimateAmount) >= APPROVAL_NO_AMOUNT) {
      const muted = Array.isArray(ap.muted_case_ids) && ap.muted_case_ids.map(String).indexOf(String(c.id)) !== -1;
      if (ap.enabled !== false && !muted) add(ap.email, '本社の決裁者・3万円以上');
    }
    const mode = caseMailSettings.mode;
    const real = out.length ? out.join('、') : 'なし（劇場・担当者のアドレスが未登録）';
    if (mode === 'off') return '通知メールは止めています（本番の宛先: ' + real + '）';
    if (mode === 'test') {
      return '🧪 テスト中: テストの宛先（' + ((caseMailSettings.test_to || []).join('、') || '未設定') + '）だけに送ります。本番の宛先: ' + real;
    }
    return '通知メールの宛先: ' + real;
  }
  async function renderCaseMailSec(c) {
    const sec = $('caseMailSec'); if (!sec) return;
    const show = !!(c && c.id && caseMailSupported && isPrivileged(currentUser) && store.mode === 'supabase');
    sec.classList.toggle('hidden', !show);
    cmCaseId = show ? String(c.id) : null;
    if (!show) return;
    sec.querySelectorAll('[data-wamake]').forEach((b) => b.classList.toggle('hidden', c.company !== WA_COMPANY));
    const id = cmCaseId;
    $('cmFiles').innerHTML = '<span class="field-hint">読み込み中…</span>'; $('cmLog').innerHTML = ''; $('cmTo').textContent = '';
    try {
      const [fr, lr, to] = await Promise.all([
        sb.from('case_files').select('*').eq('case_id', id).is('deleted_at', null).order('created_at'),
        sb.from('case_mail_log').select('*').eq('case_id', id).order('created_at', { ascending: false }).limit(50),
        caseMailRecipientsText(c)
      ]);
      if (cmCaseId !== id) return;
      $('cmTo').textContent = to;
      const files0 = fr.data || [];
      // 安全書類・予算書は1回分（同じ時に作った書類）をまとめて、たためる箱に（2026-11-20）
      const groups = new Map(); const files = [];
      files0.forEach((f) => { const g = (f.kind === 'safety' || f.kind === 'budget') && f.meta && f.meta.group; if (!g) { files.push(f); return; } if (!groups.has(g)) { groups.set(g, []); files.push({ _group: g }); } groups.get(g).push(f); });
      $('cmFiles').innerHTML = files.length ? files.map((f) => f._group ? (() => { const gs = groups.get(f._group); const h = gs[0];
          return `<details class="cm-group"><summary><span class="cm-kind cm-${escapeHtml(h.kind)}">${CM_KIND[h.kind] || '書類'}</span> <b>${escapeHtml(h.meta.group_name || '')}</b> <span class="field-hint">${gs.length} 枚・${cmDate(h.created_at)} ${escapeHtml(h.created_by || '')}</span>
            <button type="button" data-cmzip="${escapeHtml(f._group)}">⬇ ZIP</button><span class="cm-final cm-inner">🔒 社内（客先には送りません）</span></summary>
            ${gs.map((g) => `<div class="cm-file cm-sub"><button type="button" class="link-btn" data-cmopen="${escapeHtml(g.id)}">${escapeHtml((g.meta.folder ? g.meta.folder + ' ／ ' : '') + g.name)}</button>${(g.meta.versions || []).length ? `<span class="field-hint">直した版 ${(g.meta.versions || []).length}</span>` : ''}<button type="button" class="danger" data-cmdel="${escapeHtml(g.id)}" title="外す">🗑</button></div>`).join('')}</details>`; })() : `<div class="cm-file"><span class="cm-kind cm-${escapeHtml(f.kind)}">${CM_KIND[f.kind] || '書類'}</span>
          <button type="button" class="link-btn" data-cmopen="${escapeHtml(f.id)}">${escapeHtml(f.name)}</button>
          <span class="field-hint">${cmDate(f.created_at)} ${escapeHtml(f.created_by || '')}</span>
          ${f.kind === 'safety' || f.kind === 'budget' ? '<span class="cm-final cm-inner">🔒 社内（客先には送りません）</span>' : f.status === 'draft' ? `<span class="cm-draft">作成中</span><button type="button" data-cmfinal="${escapeHtml(f.id)}">✅ 完成（客先に送る）</button>` : '<span class="cm-final">送る/送った</span>'}
          <button type="button" class="danger" data-cmdel="${escapeHtml(f.id)}" title="外す">🗑</button></div>`).join('')
        : '<span class="field-hint">付けた書類はありません</span>';
      const logs = lr.data || [];
      $('cmLog').innerHTML = logs.length ? '<div class="cm-log-h">メールの記録</div>' + logs.map((l) => `<details class="cm-log-row ${l.direction === 'in' ? 'in' : 'out'}"><summary>${l.direction === 'in' ? '↘ 返信' : '↗ 送った'}${l.test ? '（試し）' : ''} ${cmDate(l.created_at)} ${escapeHtml(l.direction === 'in' ? l.from_addr : l.to_addrs)} — ${escapeHtml(l.subject)}${l.attachments ? ' 📎' : ''}</summary><pre>${escapeHtml(l.body || '')}</pre></details>`).join('')
        : '';
    } catch (e) { $('cmFiles').innerHTML = `<span class="field-hint">読み込めませんでした: ${escapeHtml(e.message || String(e))}</span>`; }
  }
  async function cmUpload(kind, file, confirmed) {
    const K = window.KARTE; const id = cmCaseId; if (!id || !file) return;
    if (file.size > 20 * 1024 * 1024) { K.say('20MB より大きいファイルは付けられません'); return; }
    if (kind === 'quote' && !confirmed && !(await K.ask(`見積書「${file.name}」を付けて、客先に通知メールで送ります（5分後にまとめて送ります）。よろしいですか？\n${$('cmTo').textContent}`, { ok: '付けて送る' }))) return;
    const ext = (file.name.match(/\.([A-Za-z0-9]{1,8})$/) || [, 'bin'])[1].toLowerCase();
    const path = `${id}/${Date.now()}_${kind}.${ext}`;
    try {
      const up = await sb.storage.from('case-files').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (up.error) throw up.error;
      const { error } = await sb.from('case_files').insert({ case_id: id, kind, name: file.name, path, mime: file.type || '', size: file.size,
        status: kind === 'workapp' ? 'draft' : 'final', created_by: currentUserName() });
      if (error) throw error;
      showToastLite(kind === 'quote' ? '見積書を付けました（5分後に客先へ送ります）' : '作業申請書を付けました（「完成」を押すと客先へ送ります）');
    } catch (e) { K.say('付けられませんでした: ' + (e.message || e)); }
    const c = cases.find((x) => String(x.id) === id); if (c && cmCaseId === id) renderCaseMailSec(c);
    if (kind === 'workapp') { await loadWorkappStates(); render(); }
  }
  function currentUserName() { try { return (currentUser && (currentUser.user_metadata && currentUser.user_metadata.name)) || String((currentUser && currentUser.email) || '').split('@')[0]; } catch (e) { return ''; } }
  // 🆙 アップロード画面（ファイルを選ぶ・ドラッグして入れる → 宛先を見て → 付ける）
  function openUploadDialog(kind) {
    const K = window.KARTE; if (!cmCaseId) return;
    document.querySelectorAll('#cmUpDlg').forEach((x) => x.remove());
    const isQ = kind === 'quote';
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'cmUpDlg';
    ov.innerHTML = `<div class="kt-dialog kt-dialog-mid"><div class="kt-dlg-head">🆙 ${isQ ? '見積書' : '作業申請書'}をアップロード<button type="button" class="close-btn" data-x>×</button></div>
      <div class="kt-dlg-body">
        <p class="ms-note">${isQ ? '付けると、5分後に客先へ通知メール（この見積書を添付）を送ります。送る前なら 🗑 で外せば送りません。' : '付けると「作成中」になります。客先にはまだ送りません。「✅ 完成」を押すと送ります。'}</p>
        <p class="ms-note">${escapeHtml($('cmTo') ? $('cmTo').textContent : '')}</p>
        <label class="up-drop" id="cmDrop"><input type="file" id="cmUpFile" accept=".pdf,.xlsx,.xls,.docx,.doc,image/*" hidden>
          <span class="up-drop-t">ここにファイルをドラッグして入れる<br>または <b>押してファイルを選ぶ</b>（PDF・Excel・Word・写真／20MB まで）</span>
          <span class="up-drop-f" id="cmUpName"></span></label>
      </div><div class="kt-dlg-foot"><button type="button" data-x>やめる</button><button type="button" class="primary" data-upok disabled>${isQ ? '付けて送る' : '付ける'}</button></div></div>`;
    document.body.appendChild(ov);
    let file = null;
    const setFile = (f) => { file = f || null; ov.querySelector('#cmUpName').textContent = file ? '📄 ' + file.name + '（' + Math.max(1, Math.round(file.size / 1024)) + ' KB）' : ''; ov.querySelector('[data-upok]').disabled = !file; };
    const drop = ov.querySelector('#cmDrop');
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); setFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
    ov.querySelector('#cmUpFile').addEventListener('change', (e) => setFile(e.target.files && e.target.files[0]));
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]') || e.target === ov) { ov.remove(); return; }
      if (e.target.closest('[data-upok]') && file) { ov.remove(); await cmUpload(kind, file, true); }
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmup]'); if (!b) return;
    e.preventDefault(); openUploadDialog(b.dataset.cmup);
  });
  // 🚩 緊急の付け外し（菱熱）
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-urgent]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (!isPrivileged(currentUser)) return;
    const c = cases.find((x) => String(x.id) === b.dataset.urgent); if (!c) return;
    const to = !c.urgent;
    if (!(await window.KARTE.ask(to ? `「${shortTheaterName(c.theater)} ${c.title || c.category || ''}」を緊急案件（🚩）にしますか？` : `「${shortTheaterName(c.theater)} ${c.title || c.category || ''}」の 🚩 を外しますか？`, { ok: to ? '🚩 緊急にする' : '外す' }))) return;
    c.urgent = to; c.updatedAt = new Date().toISOString(); persistCase(c); render();
  }, true);
  // 📝 作業申請書（一覧の「申請書」列・編集パネル）。行を押した時の動き（編集を開く）より先に受け取る
  //   一覧: 調査・作業ごとのボタン → 作る／申請不要／あとで を選ぶ画面（作成中なら続きから）
  //   編集パネル: 日付の入った用途（調査・作業）を並べて選ぶ
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wadecide],[data-wamake]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (!window.WORKAPP) { window.KARTE.say('作業申請書の部品を読み込めませんでした。画面を読み込み直してください'); return; }
    const id = b.dataset.wadecide || b.dataset.wamake || cmCaseId; if (!id) return;
    const c = cases.find((x) => String(x.id) === String(id)); if (!c) return;
    const purpose = b.dataset.purpose || '';
    if (purpose && waState(c, purpose).state === 'draft') { window.WORKAPP.open(id, purpose); return; }
    window.WORKAPP.decide(id, purpose ? [purpose] : null, { why: 'button' });
  }, true);
  document.addEventListener('click', async (e) => {
    const sec = e.target.closest('#caseMailSec'); if (!sec) return;
    const K = window.KARTE; const c = cases.find((x) => String(x.id) === cmCaseId);
    const zp = e.target.closest('[data-cmzip]');
    if (zp) { e.preventDefault(); if (window.DOCGEN) window.DOCGEN.zipGroup(cmCaseId, zp.dataset.cmzip); return; }
    const op = e.target.closest('[data-cmopen]');
    if (op) {
      e.preventDefault();
      // 安全書類・予算書（Excel）はその場で開いて直せる
      if (window.DOCGEN) { const { data: fr1 } = await sb.from('case_files').select('kind,name,meta').eq('id', op.dataset.cmopen).limit(1); const f1 = fr1 && fr1[0];
        if (f1 && (f1.kind === 'safety' || f1.kind === 'budget') && /\.xlsx$/i.test(f1.name)) { window.DOCGEN.openDoc(op.dataset.cmopen); return; } }
      const { data } = await sb.from('case_files').select('path').eq('id', op.dataset.cmopen).limit(1);
      const path = data && data[0] && data[0].path; if (!path) return;
      const r = await sb.storage.from('case-files').createSignedUrl(path, 600);
      if (r.error) { K.say('開けませんでした: ' + r.error.message); return; }
      window.open(r.data.signedUrl, '_blank', 'noopener');
      return;
    }
    const fin = e.target.closest('[data-cmfinal]');
    if (fin) {
      e.preventDefault();
      if (!(await K.ask(`作業申請書を「完成」にして、客先に通知メールで送ります。よろしいですか？\n${$('cmTo').textContent}`, { ok: '完成にして送る' }))) return;
      const { error } = await sb.from('case_files').update({ status: 'final' }).eq('id', fin.dataset.cmfinal);
      if (error) K.say('できませんでした: ' + error.message); else showToastLite('完成にしました（5分後に客先へ送ります）');
      if (c) renderCaseMailSec(c);
      await loadWorkappStates(); render();
      return;
    }
    const del = e.target.closest('[data-cmdel]');
    if (del) {
      e.preventDefault();
      if (!(await K.ask('この書類を外しますか？（まだ送っていなければ送りません）', { ok: '外す', danger: true }))) return;
      const { error } = await sb.from('case_files').update({ deleted_at: new Date().toISOString() }).eq('id', del.dataset.cmdel);
      if (error) K.say('外せませんでした: ' + error.message);
      if (c) renderCaseMailSec(c);
      await loadWorkappStates(); render();
    }
  });
  function closeModal() {
    const pendId = cmCaseId;
    if (pendId && MAIL_PENDING.has(pendId)) {   // 「ほかの項目も直す」のあと、保存せずに閉じた時も聞く
      const pc = cases.find((x) => String(x.id) === pendId);
      setTimeout(() => { const pd = MAIL_PENDING.get(pendId); if (pc && pd) mailAskAfterSave(pc, pd, true); }, 0);
    }
    cmCaseId = null;
    $('modal').classList.add('hidden');
    document.body.classList.remove('drawer-open');
    markEditingRow(null);
  }
  // ===== ⑦ 編集パネル =====
  let editingCaseId = null;   // パネルで開いている案件（一覧の行に色を付ける）
  let modalSnapshot = '';     // 開いた時点の入力内容（保存せずに別の案件へ切り替える時の確認用）
  function markEditingRow(id) {
    editingCaseId = id;
    document.querySelectorAll('#casesBody tr.row-editing').forEach((tr) => tr.classList.remove('row-editing'));
    if (!id) return;
    const tr = document.querySelector(`#casesBody tr[data-case-id="${CSS.escape(String(id))}"]`);
    if (tr) tr.classList.add('row-editing');
  }
  function renderModalSub(caseObj, isCalEdit) {
    const el = $('modalSub'); if (!el) return;
    if (!caseObj) { el.innerHTML = ''; return; }
    const st = statusOf(caseObj);
    const parts = [
      `<span class="status-badge status-${escapeHtml(st)}">${escapeHtml(statusDisplayLabel(st))}</span>`,
      lateDaysHtml(caseObj),
      `<span>${escapeHtml(shortTheaterName(caseObj.theater) || '')}</span>`
    ];
    if (!isCalEdit && caseObj.receivedDate) parts.push(`<span>受付 ${escapeHtml(fmtDateShort(caseObj.receivedDate))}</span>`);
    if (!isCalEdit && caseObj.rPerson && isPrivileged(currentUser)) parts.push(`<span>R担当 ${escapeHtml(caseObj.rPerson)}</span>`);
    el.innerHTML = parts.filter(Boolean).join('');
  }
  function caseFormSnapshot() {
    return Array.prototype.map.call($('caseForm').querySelectorAll('input, select, textarea'),
      (el) => el.id + '=' + (el.type === 'checkbox' ? el.checked : el.value)).join('\u0001');
  }
  // パネルを開いたまま別の案件を開く時、保存していない変更があれば確認する
  function openModalGuarded(c, mode) {
    const open = !$('modal').classList.contains('hidden');
    if (open && String($('caseId').value) === String(c.id)) return; // 同じ案件なら何もしない
    if (open && caseFormSnapshot() !== modalSnapshot
        && !confirm('編集中の内容が保存されていません。\n保存せずに「' + (shortTheaterName(c.theater) || 'この案件') + '」を開きますか？')) return;
    openModal(c, mode);
  }

  // 数値を3桁カンマ区切りの文字列にする（数字以外は除去。空なら空文字）
  function formatThousands(value) {
    const digits = String(value == null ? '' : value).replace(/[^\d]/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  // textarea を中身の高さに合わせて自動拡張（全文表示）
  // 長い文の欄は、画面の半分の高さで止めて、欄の中でスクロール（スマホで画面全体が動かなくなるのを防ぐ・2026-11-20）
  function autoGrowTextarea(el) {
    if (!el) return;
    const max = Math.max(160, Math.round((window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.5));
    el.style.height = 'auto';
    const h = el.scrollHeight + 2;
    el.style.height = Math.min(h, max) + 'px';
    el.style.overflowY = h > max ? 'auto' : 'hidden';
  }
  // 金額入力欄を、入力途中でもカンマ区切りに整形（キャレット位置を維持）
  function formatAmountFieldLive(el) {
    if (!el) return;
    const before = el.value;
    const caret = el.selectionStart != null ? el.selectionStart : before.length;
    const digitsBeforeCaret = before.slice(0, caret).replace(/[^\d]/g, '').length;
    const formatted = formatThousands(before);
    el.value = formatted;
    let pos = 0, seen = 0;
    while (pos < formatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(formatted[pos])) seen++;
      pos++;
    }
    try { el.setSelectionRange(pos, pos); } catch (e) { /* noop */ }
  }

  // ---------- 見積りAI-OCR（画像/PDF → 見積り名/金額/提出日を自動入力） ----------
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { const s = String(r.result); const i = s.indexOf(','); resolve(i >= 0 ? s.slice(i + 1) : s); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  let ocrTargetCase = null;   // 見積りOCRの対象案件（トップ一覧の見積り名ダブルクリックで指定）
  let nameClickTimer = null;  // 見積り名セルの 単/ダブル クリック判別用
  function openQuoteOcrModalForCase(c) {
    ocrTargetCase = c || null;
    const st = $('quoteOcrStatus'); if (st) st.textContent = '';
    const sub = $('quoteOcrSubtitle');
    if (sub) sub.textContent = ocrTargetCase ? ((ocrTargetCase.theater || '') + '　' + (ocrTargetCase.estimateName || '（見積り名なし）')) : '';
    $('quoteOcrModal').classList.remove('hidden');
  }
  function closeQuoteOcrModal() { ocrTargetCase = null; $('quoteOcrModal').classList.add('hidden'); }

  // 指定ファイル（画像/PDF）をAI-OCRして、対象案件の 見積り名/金額/提出日 を更新（ファイルは保存しない）
  async function processQuoteFile(file) {
    const statusEl = $('quoteOcrStatus');
    if (!file) return;
    if (!/^image\//.test(file.type) && file.type !== 'application/pdf') {
      statusEl.textContent = '対応形式は画像(JPEG/PNG/WebP)またはPDFです';
      return;
    }
    statusEl.textContent = '読み取り中…';
    try {
      const base64 = await fileToBase64(file);
      let token = '';
      if (store.mode === 'supabase' && sb) {
        const { data } = await sb.auth.getSession();
        token = (data && data.session && data.session.access_token) || '';
      }
      const res = await fetch('/api/quote-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ fileBase64: base64, mediaType: file.type || 'application/octet-stream' })
      });
      if (!res.ok) throw new Error('読取API ' + res.status);
      const d = await res.json();
      const c = ocrTargetCase;
      if (c) {
        if (d.estimate_name) c.estimateName = d.estimate_name;
        if (d.estimate_amount !== '' && d.estimate_amount != null && !isNaN(Number(d.estimate_amount))) c.estimateAmount = Number(d.estimate_amount);
        if (d.quote_date) c.quoteDate = d.quote_date;
        c.updatedAt = new Date().toISOString();
        if (store.mode === 'local') saveCases();
        persistCase(c);
        refresh();
        statusEl.textContent = '読み取り完了。案件「' + (c.estimateName || '') + '」に反映しました。';
      } else {
        statusEl.textContent = '対象案件が特定できませんでした。';
      }
      setTimeout(closeQuoteOcrModal, 900);
    } catch (e) {
      statusEl.textContent = '読み取り失敗: ' + (e && e.message ? e.message : e);
    }
  }

  // ---------- ポップアップ編集（内容 / メモ 共用） ----------
  let popupEditField = 'content';
  const POPUP_FIELD_TITLES = { content: '内容を編集', memo: '社内メモを編集', adviceNote: '社内アドバイスを編集' };
  // ポップアップの上に「どこから入るか・書いた内容はどこへ行くか」（2026-11-19）
  function popupFlowHtml(field) {
    const ryo = isPrivileged(currentUser);
    const F = {
      content: ryo ? ['🤖 「社内メモ」に書いた・足された内容を、AI が客先向けにまとめてここに入れます（社内のこと・金額・協力会社の名前は除きます）。', '👀 客先に見えます。ここを直すと、そのまま客先の画面に出て、LINE で通知します。']
        : ['菱熱工業の担当者のメモをもとに、AI がまとめた内容です。', '（閲覧のみ）'],
      memo: ['✍ 手で書いた内容と、メールの自動取り込み（AI）が足した進み具合が入ります。', '🤖 新しく足した分を AI が要約して「内容」に入れます（「内容」は客先に見えます）。社内メモそのものは客先に見えません。'],
      adviceNote: ['🎙 Plaud（会議・電話の記録）と LINE のやり取りを、AI がここに足します。手でも書けます。', '🔒 AI の要約はしません（「内容」には入りません）。LINE 通知もしません。客先に見えません。この劇場の今後の AI 初期対応診断の参考になります。'],
      customerMemo: ryo ? ['🤝 客先が書いたメモです（菱熱も書けます）。', '📝 要約しません。そのまま客先にも見えます。客先が書くと LINE で通知します。']
        : ['ご自由にお書きください。', '📝 要約されず、そのまま菱熱工業に届きます。']
    }[field];
    return F ? `<div class="cf-in">${escapeHtml(F[0])}</div><div class="cf-out">${escapeHtml(F[1])}</div>` : '';
  }
  // 顧客メモの表示名（客先=○○メモ / 菱熱=顧客メモ）
  function customerMemoLabel() {
    return isPrivileged(currentUser) ? '顧客メモ' : customerLabel('メモ');
  }
  function popupFieldTitle(field) {
    if (field === 'customerMemo') return customerMemoLabel() + 'を編集';
    return POPUP_FIELD_TITLES[field] || '編集';
  }
  function openContentModal(c, field) {
    field = field || 'content';
    contentEditCaseId = c.id;
    popupEditField = field;
    const titleEl = $('contentModal').querySelector('.modal-header h2');
    if (titleEl) titleEl.textContent = popupFieldTitle(field);
    $('contentEditor').value = c[field] || '';
    if ($('contentFlow')) $('contentFlow').innerHTML = popupFlowHtml(field);
    $('contentEditor').placeholder = field === 'memo' ? '社内メモ／「保留」と書くとステータス自動切替'
      : field === 'adviceNote' ? '社内アドバイス（例: エアバランスはVD交換より潤滑剤調整を先に試す）'
      : (field === 'customerMemo' ? customerMemoLabel() + 'を記入' : '案件の詳細を記入');
    // 閲覧のみ（客先の「内容」）は編集不可にして保存ボタンを隠す
    const cfgPopup = EDITABLE_FIELDS[field] || {};
    const readOnly = !!(cfgPopup.readonlyForCustomer && !isPrivileged(currentUser));
    const ta = $('contentEditor');
    ta.readOnly = readOnly;
    ta.classList.toggle('readonly', readOnly);
    if (titleEl) titleEl.textContent = readOnly ? popupFieldTitle(field).replace('を編集', '') : popupFieldTitle(field);
    $('contentSaveBtn').classList.toggle('hidden', readOnly);
    const hintEl = $('contentModal').querySelector('.modal-hint');
    if (hintEl) hintEl.textContent = readOnly ? '（閲覧のみ）' : 'Ctrl+Enter / ⌘+Enter で保存';
    $('contentCancelBtn').textContent = readOnly ? '閉じる' : 'キャンセル';
    applyContentModalSize();
    $('contentModal').classList.remove('hidden');
    setTimeout(() => $('contentEditor').focus(), 50);
  }
  // 内容・アドバイスなどのポップアップの大きさ（2026-11-24）: 右下の角で好きな大きさに。大きさは人ごと（このブラウザ）に覚える
  const CM_SIZE_KEY = 'contentModalSizeV1';
  function applyContentModalSize() {
    const box = $('contentModal').querySelector('.modal-content'); let v = null;
    try { v = JSON.parse(localStorage.getItem(CM_SIZE_KEY) || 'null'); } catch (e) { v = null; }
    $('contentModal').classList.toggle('cm-max', !!(v && v.max));
    box.style.width = v && v.w ? Math.min(v.w, window.innerWidth - 16) + 'px' : '';
    box.style.height = v && v.h ? Math.min(v.h, window.innerHeight - 16) + 'px' : '';
    if ($('contentMaxBtn')) $('contentMaxBtn').textContent = v && v.max ? '⧉ 元の大きさ' : '⛶ 大きく';
  }
  function saveContentModalSize() {
    const box = $('contentModal').querySelector('.modal-content');
    const max = $('contentModal').classList.contains('cm-max');
    const v = { max };
    if (box.style.width) v.w = Math.round(box.getBoundingClientRect().width);
    if (box.style.height) v.h = Math.round(box.getBoundingClientRect().height);
    if (max) { let old = null; try { old = JSON.parse(localStorage.getItem(CM_SIZE_KEY) || 'null'); } catch (e) { old = null; } if (old) { v.w = old.w; v.h = old.h; } }
    try { localStorage.setItem(CM_SIZE_KEY, JSON.stringify(v)); } catch (e) { /* 覚えられない時はそのまま */ }
  }
  if ($('contentMaxBtn')) $('contentMaxBtn').addEventListener('click', () => {
    const on = !$('contentModal').classList.contains('cm-max');
    $('contentModal').classList.toggle('cm-max', on);
    $('contentMaxBtn').textContent = on ? '⧉ 元の大きさ' : '⛶ 大きく';
    saveContentModalSize();
  });
  function closeContentModal() { if (!$('contentModal').classList.contains('hidden')) saveContentModalSize(); $('contentModal').classList.add('hidden'); contentEditCaseId = null; }
  function saveContentFromModal() {
    if (!contentEditCaseId) return;
    const cfgSave = EDITABLE_FIELDS[popupEditField] || {};
    if (cfgSave.readonlyForCustomer && !isPrivileged(currentUser)) { closeContentModal(); return; }
    const c = cases.find((x) => x.id === contentEditCaseId);
    if (c) {
      const newVal = $('contentEditor').value.trim();
      if (newVal !== (c[popupEditField] || '')) {
        c[popupEditField] = newVal;
        c.updatedAt = new Date().toISOString();
        persistCase(c);
        render();
      }
    }
    closeContentModal();
  }

  // ---------- CSV export ----------
  function downloadCSV(filename, rows) {
    const csv = rows.map((row) =>
      row.map((v) => {
        const s = (v == null ? '' : String(v));
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',')
    ).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  }
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function exportFiltered() {
    const filtered = getFilteredCases();
    if (filtered.length === 0) { alert('現在の絞り込み条件に一致する案件がありません。'); return; }
    const includesMemo = isPrivileged(currentUser);
    const isToho = !includesMemo;
    const headers = ['会社', '劇場名', '受付日', fieldLabel('tcPerson'), 'R担当者', '種別', '内容',
      '調査日', '決裁番号', '見積り名', '見積り金額',
      isToho ? '見積り受領日' : '見積り提出日',
      '作業開始日', '作業完了日',
      isToho ? '請求書受領日' : '請求書発行日',
      isToho ? '支払日' : '入金日',
      'ステータス'];
    if (includesMemo) headers.push(customerMemoLabel(), '社内メモ');
    const rows = [headers].concat(filtered.map((c) => {
      const row = [c.company, c.theater, c.receivedDate, c.tcPerson, c.rPerson, c.category, c.content,
        c.surveyDate, c.company === 'TOHOシネマズ' ? c.certNumber : '',
        c.estimateName, c.estimateAmount,
        c.quoteDate, c.workStartDate, c.workEndDate,
        c.invoiceDate, c.paymentDate, statusDisplayLabel(statusOf(c))];
      if (includesMemo) row.push(c.customerMemo, c.memo);
      return row;
    }));
    downloadCSV(`cinema-cases-${todayStr()}.csv`, rows);
  }

  // ---------- invoice generation (JSZip preserves drawings/VML/seals) ----------
  function base64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function xmlEscape(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function setCellInline(xml, ref, value) {
    const escaped = xmlEscape(value);
    const re = new RegExp(`<c r="${ref}"([^/]*?)(/>|>[\\s\\S]*?</c>)`);
    // セルが見つからなければ黙って空欄を作らず、明確にエラーにする（テンプレ変更検知）
    if (!re.test(xml)) throw new Error(`テンプレートのセル ${ref} が見つかりません（書式が変わった可能性）`);
    return xml.replace(re, (_, attrs) => {
      const a = attrs.replace(/\s+t="[^"]*"/, '');
      return `<c r="${ref}"${a} t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`;
    });
  }
  function setCellNumber(xml, ref, num) {
    const safe = Number.isFinite(num) ? num : 0;
    const re = new RegExp(`<c r="${ref}"([^/]*?)(/>|>[\\s\\S]*?</c>)`);
    if (!re.test(xml)) throw new Error(`テンプレートのセル ${ref} が見つかりません（書式が変わった可能性）`);
    return xml.replace(re, (_, attrs) => {
      const a = attrs.replace(/\s+t="[^"]*"/, '');
      return `<c r="${ref}"${a}><v>${safe}</v></c>`;
    });
  }
  // 客先マスタから劇場の正式名称・住所・請求先会社を引く（無ければ案件側にフォールバック）
  // 例: 「シネマサンシャイン平和島」(ブランド名) → company='佐々木興業'(法人格)
  function resolveTheaterInfo(c) {
    const m = findTheaterInMaster(c.theater);
    return {
      name: m ? m.name : (c.theater || ''),
      address: m ? (m.address || '') : '',
      // マスタに登録があればその会社（=法人格）を請求先に。無ければ案件の会社にフォールバック
      company: m ? (m.company || c.company || '') : (c.company || '')
    };
  }
  // 会社名を「〇〇株式会社」形式に正規化（マスタの officialName を優先）
  // 例: 109シネマズ → 株式会社東急レクリエーション
  function formatCompanyName(name) {
    if (!name) return '';
    const official = companyOfficialName(name);
    if (official) return official;
    if (/株式会社|有限会社|合同会社/.test(name)) return name;
    return name + '株式会社';
  }
  async function buildInvoiceXlsx(c) {
    const zip = await JSZip.loadAsync(base64ToArrayBuffer(window.TEMPLATE_INVOICE_B64));
    let sheet = await zip.file('xl/worksheets/sheet2.xml').async('string');
    const t = resolveTheaterInfo(c);
    sheet = setCellInline(sheet, 'A21', fmtDateFull(c.workEndDate));
    // 現場名 = 劇場の正式名称(マスタ優先) + 見積り名
    sheet = setCellInline(sheet, 'D21', `${t.name} ${c.estimateName || ''}`.trim());
    sheet = setCellNumber(sheet, 'AK21', Number(c.estimateAmount) || 0);
    // 宛先会社名（マスタの会社名）
    sheet = setCellInline(sheet, 'B6', formatCompanyName(t.company));
    zip.file('xl/worksheets/sheet2.xml', sheet);
    let styles = await zip.file('xl/styles.xml').async('string');
    styles = styles.replace(/FFFF0000/g, 'FF000000');
    zip.file('xl/styles.xml', styles);
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }
  async function buildCompletionXlsx(c) {
    const zip = await JSZip.loadAsync(base64ToArrayBuffer(window.TEMPLATE_COMPLETION_B64));
    let sheet = await zip.file('xl/worksheets/sheet2.xml').async('string');
    const t = resolveTheaterInfo(c);
    sheet = setCellInline(sheet, 'H14', `${t.name} ${c.estimateName || ''}`.trim());
    // 工事場所 = マスタの住所（無ければ劇場名のみ）
    sheet = setCellInline(sheet, 'H17', t.address || t.name || '');
    sheet = setCellNumber(sheet, 'H20', Number(c.estimateAmount) || 0);
    sheet = setCellInline(sheet, 'H23', fmtDateFull(c.workStartDate));
    sheet = setCellInline(sheet, 'S23', fmtDateFull(c.workEndDate));
    sheet = setCellInline(sheet, 'H26', fmtDateFull(c.workStartDate));
    sheet = setCellInline(sheet, 'H29', fmtDateFull(c.workEndDate));
    // 完了届B7は宛先「会社名 御中」。マスタの会社名から正規化して上書き
    sheet = setCellInline(sheet, 'B7', `${formatCompanyName(t.company)}　御中`);
    zip.file('xl/worksheets/sheet2.xml', sheet);
    let styles = await zip.file('xl/styles.xml').async('string');
    styles = styles.replace(/FFFF0000/g, 'FF000000');
    zip.file('xl/styles.xml', styles);
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }
  function casesMatchingMonth(yearMonth) {
    if (!yearMonth) return [];
    return getFilteredCases().filter((c) => {
      if (!c.workEndDate) return false;
      if (!c.estimateName || c.estimateAmount === '' || c.estimateAmount == null) return false;
      return c.workEndDate.slice(0, 7) === yearMonth;
    });
  }
  function updateInvoicePreview() {
    const month = $('invoiceMonth').value;
    const list = $('invoicePreviewList');
    const empty = $('invoicePreviewEmpty');
    const count = $('invoicePreviewCount');
    list.innerHTML = '';
    const matches = casesMatchingMonth(month);
    count.textContent = `(${matches.length} 件)`;
    if (matches.length === 0) {
      empty.classList.remove('hidden');
      $('invoiceGenerateBtn').disabled = true;
    } else {
      empty.classList.add('hidden');
      $('invoiceGenerateBtn').disabled = false;
      matches.forEach((c) => {
        const li = document.createElement('li');
        li.innerHTML = `${escapeHtml(shortTheaterName(c.theater))} ／ ${escapeHtml(c.estimateName)} <span class="case-amount">${fmtAmount(c.estimateAmount)}</span>`;
        list.appendChild(li);
      });
    }
  }
  function openInvoiceModal() {
    const month = currentMonth();
    $('invoiceMonth').value = month;
    $('invoiceIssueDate').value = fmtDateIn(lastDayOfMonth(month));
    updateInvoicePreview();
    $('invoiceModal').classList.remove('hidden');
  }
  function closeInvoiceModal() { $('invoiceModal').classList.add('hidden'); }
  function safeFilename(s) { return String(s || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_'); }
  async function generateInvoices() {
    const month = $('invoiceMonth').value;
    const issueIso = parseSmartDate($('invoiceIssueDate').value);
    if (!month || !issueIso) { alert('発行月と発行日を指定してください。'); return; }
    const matches = casesMatchingMonth(month);
    if (matches.length === 0) { alert('対象の案件がありません。'); return; }
    if (typeof JSZip === 'undefined') { alert('JSZipライブラリの読み込みに失敗しました。'); return; }
    $('invoiceGenerateBtn').disabled = true;
    $('invoiceGenerateBtn').textContent = '生成中...';
    try {
      // 1) まずZIPを完全に生成（途中で失敗してもデータには触れない）
      const zip = new JSZip();
      for (const c of matches) {
        const invBlob = await buildInvoiceXlsx(c);
        const comBlob = await buildCompletionXlsx(c);
        const tag = `${safeFilename(c.theater)}_${safeFilename(c.estimateName)}`;
        zip.file(`請求書_${tag}.xlsx`, invBlob);
        zip.file(`完了届_${tag}.xlsx`, comBlob);
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      // 2) ここまで来たら成功確定。請求書発行日を全件まとめて更新→保存
      const nowIso = new Date().toISOString();
      matches.forEach((c) => { c.invoiceDate = issueIso; c.updatedAt = nowIso; });
      await persistCases(matches);
      // 3) ダウンロード
      triggerDownload(blob, `請求書セット_${month}.zip`);
      closeInvoiceModal();
      render();
      alert(`${matches.length} 件生成し、請求書発行日を ${fmtDateFull(issueIso)} に更新しました。`);
    } catch (err) {
      console.error(err);
      alert('生成中にエラー: ' + (err.message || err));
    } finally {
      $('invoiceGenerateBtn').disabled = false;
      $('invoiceGenerateBtn').textContent = '発行（ZIPダウンロード）';
    }
  }

  // ---------- A集計 (粗利配分・メインテーブル切替) ----------
  // 会計年度（菱熱: 10月〜翌9月）。受付日の年度開始年を返す
  function fiscalYearOf(dateStr) {
    if (!dateStr) return null;
    const [y, m] = dateStr.split('-').map(Number);
    if (!y || !m) return null;
    return m >= 10 ? y : y - 1;
  }
  function fiscalYearLabel(fy) {
    return `${fy}年度（${fy}/10〜${fy + 1}/9）`;
  }
  function currentFiscalYear() {
    const d = new Date();
    return (d.getMonth() + 1) >= 10 ? d.getFullYear() : d.getFullYear() - 1;
  }
  // 見込み / 実績 / 予想 の区分（完了日の有無のみで判定）
  function aggSection(c) {
    if (!c.workEndDate) return 'mikomi';            // 見込み: 作業完了日が未入力
    return c.workEndDate <= todayStr() ? 'jisseki'  // 実績: 完了日が本日以前
                                       : 'yosou';   // 予想: 完了日が本日以降
  }
  const SECTION_DEF = {
    mikomi:  { label: '見込み', cls: 'section-mikomi', badge: 'badge-mikomi' },
    jisseki: { label: '実績',   cls: 'section-jisseki', badge: 'badge-jisseki' },
    yosou:   { label: '予想',   cls: 'section-yosou', badge: 'badge-yosou' }
  };

  function caseProfit(c) {
    const amt = Number(c.estimateAmount) || 0;
    const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
    return amt * rate / 100;
  }

  // 選択年度＋既存フィルタ後、金額>0 の案件
  function aggTargetCases() {
    const fy = $('aggFY') && $('aggFY').value;
    return getFilteredCases().filter((c) => {
      if ((Number(c.estimateAmount) || 0) <= 0) return false;
      if (!fy || fy === 'all') return true;
      return String(fiscalYearOf(c.receivedDate)) === String(fy);
    });
  }

  // 年度プルダウンを（データに存在する年度＋今年度で）構築
  function populateFiscalYears() {
    const sel = $('aggFY');
    const prev = sel.value;
    const years = new Set();
    years.add(currentFiscalYear());
    cases.forEach((c) => { const fy = fiscalYearOf(c.receivedDate); if (fy != null) years.add(fy); });
    const sorted = Array.from(years).sort((a, b) => b - a);
    sel.innerHTML = '<option value="all">全年度</option>' +
      sorted.map((y) => `<option value="${y}">${fiscalYearLabel(y)}</option>`).join('');
    // デフォルトは今年度
    sel.value = (prev && [...sel.options].some(o => o.value === prev)) ? prev : String(currentFiscalYear());
  }

  function renderAggTable() {
    const table = $('casesTable');
    const thead = table.querySelector('thead');
    const team = loadTeam();
    const targets = aggTargetCases();

    // ===== ヘッダ行 =====
    const headerCells = `
      <th data-col="aggname" class="col-aggname agg-namecol">客先・劇場名・見積り名</th>
      <th>見積り金額</th>
      <th>配分集計</th>
      <th>粗利率</th>
      ${team.map((m, i) => `<th class="agg-member agg-member-col${i===0?' agg-member-first':''}" data-member="${escapeHtml(m)}">${escapeHtml(m)}<button class="agg-rm-member" data-member="${escapeHtml(m)}" title="削除">×</button></th>`).join('')}`;

    // ===== 区分別 集計行（見込み/実績/予想）+ 総合計 =====
    const sections = ['mikomi', 'jisseki', 'yosou'];
    const sectionTotals = {};
    sections.forEach((s) => {
      sectionTotals[s] = { count: 0, amount: 0, profit: 0, members: {} };
      team.forEach((m) => { sectionTotals[s].members[m] = 0; });
    });
    targets.forEach((c) => {
      const s = aggSection(c);
      const amt = Number(c.estimateAmount) || 0;
      const profit = caseProfit(c);
      const alloc = getAllocations(c, team);
      sectionTotals[s].count++;
      sectionTotals[s].amount += amt;
      sectionTotals[s].profit += profit;
      team.forEach((m) => { sectionTotals[s].members[m] += profit * (Number(alloc[m]) || 0) / 100; });
    });

    // 個人別の総合計（見込み + 実績 + 予想）を算出
    const grandTotal = { count: 0, amount: 0, profit: 0, members: {} };
    team.forEach((m) => { grandTotal.members[m] = 0; });
    sections.forEach((s) => {
      const t = sectionTotals[s];
      grandTotal.count += t.count;
      grandTotal.amount += t.amount;
      grandTotal.profit += t.profit;
      team.forEach((m) => { grandTotal.members[m] += t.members[m]; });
    });

    const grandTotalRow = `<tr class="agg-summary-row section-grand">
      <th class="agg-sec-label col-aggname">合計（見込み+実績+予想）　${grandTotal.count}件</th>
      <th>${fmtAmount(grandTotal.amount)}</th>
      <th>粗利A→</th>
      <th>${fmtAmount(grandTotal.profit)}</th>
      ${team.map((m, i) => `<th class="agg-member-col${i===0?' agg-member-first':''}">${fmtAmount(grandTotal.members[m])}</th>`).join('')}
    </tr>`;

    const summaryRows = sections.map((s) => {
      const t = sectionTotals[s];
      const def = SECTION_DEF[s];
      return `<tr class="agg-summary-row ${def.cls}">
        <th class="agg-sec-label col-aggname">${def.label}　${t.count}件</th>
        <th>${fmtAmount(t.amount)}</th>
        <th>粗利A→</th>
        <th>${fmtAmount(t.profit)}</th>
        ${team.map((m, i) => `<th class="agg-member-col${i===0?' agg-member-first':''}">${fmtAmount(t.members[m])}</th>`).join('')}
      </tr>`;
    }).join('');

    thead.innerHTML = `<tr id="aggHeaderRow">${headerCells}</tr>${grandTotalRow}${summaryRows}`;

    // ===== 案件行（区分順 → 受付日順） =====
    const order = { mikomi: 0, jisseki: 1, yosou: 2 };
    const sorted = targets.slice().sort((a, b) => {
      const sa = order[aggSection(a)], sb = order[aggSection(b)];
      if (sa !== sb) return sa - sb;
      return (b.receivedDate || '').localeCompare(a.receivedDate || '');
    });

    const tbody = $('casesBody');
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${4 + team.length}" class="agg-empty">対象案件がありません。</td></tr>`;
    } else {
      tbody.innerHTML = sorted.map((c) => {
        const amt = Number(c.estimateAmount) || 0;
        const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
        const alloc = getAllocations(c, team);
        const sum = sumAllocations(alloc);
        const okClass = Math.abs(sum - 100) < 0.01 ? 'ok' : 'ng';
        const okText = okClass === 'ok' ? '✓OK' : '✗NG';
        const sec = SECTION_DEF[aggSection(c)];
        return `<tr data-case-id="${escapeHtml(c.id)}">
          <td class="agg-case-name col-aggname"><span class="agg-section-badge ${sec.badge}">${sec.label}</span><span class="agg-co">${escapeHtml(companyAbbr(c.company))}</span><span class="agg-th">${escapeHtml(shortTheaterName(c.theater))}</span><span class="agg-est">${escapeHtml(c.estimateName || '-')}</span></td>
          <td class="agg-amount">${fmtAmount(amt)}</td>
          <td class="agg-sum ${okClass}">${sum.toFixed(1)}% ${okText}</td>
          <td><input type="number" data-field="marginRate" min="0" max="100" step="0.1" value="${rate}" class="agg-input agg-rate"></td>
          ${team.map((m, i) => `<td class="agg-member-col${i===0?' agg-member-first':''}"><input type="number" data-member="${escapeHtml(m)}" min="0" max="100" step="1" value="${alloc[m] || 0}" class="agg-input"></td>`).join('')}
        </tr>`;
      }).join('');
    }
    $('caseCount').textContent = `A集計: ${targets.length} 件`;
    addResizers(thead);
    applyColWidths();
  }

  // 支払い状況/各劇場情報/更新確認 の各モードを閉じる（他モードへ切替える時に呼ぶ）
  function exitAuxModes() {
    if (typeof purchaseMode !== 'undefined' && purchaseMode) exitPurchaseMode();
    if (typeof theaterInfoMode !== 'undefined' && theaterInfoMode) closeTheaterInfoModal();
    if (typeof theaterPendingMode !== 'undefined' && theaterPendingMode) closeTheaterPendingModal();
    if (typeof intakeMode !== 'undefined' && intakeMode) exitIntakeMode();
    if (typeof equipMode !== 'undefined' && equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
  }
  function enterAggMode() {
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    exitAuxModes();
    aggMode = true;
    document.body.classList.add('agg-active');
    $('casesTable').classList.add('agg-mode');
    $('aggBar').classList.remove('hidden');
    $('emptyMsg').classList.add('hidden');
    $('aggBtn').textContent = '✕ A集計を閉じる';
    populateFiscalYears();
    renderAggTable();
  }
  function exitAggMode() {
    aggMode = false;
    document.body.classList.remove('agg-active');
    $('casesTable').classList.remove('agg-mode');
    $('aggBar').classList.add('hidden');
    $('aggBtn').textContent = '📊 A集計';
    // thead を通常モードに復元
    $('casesTable').querySelector('thead').innerHTML = NORMAL_THEAD_HTML;
    render();
  }
  function toggleAggMode() { if (aggMode) exitAggMode(); else enterAggMode(); }

  // ========== タスク管理モード ==========
  function tasksAvailable() { return store.mode === 'local' || tasksSupported; }
  function caseTasks(c) { return Array.isArray(c.tasks) ? c.tasks : (c.tasks = []); }
  // 個人タスク（案件に紐づかない、担当者ごとのタスク）
  let showPersonalTasks = true;  // 個人タスクのパネルを出すか（既定=表示）。案件のタスク表とは同時に出る
  function personTasks(person) {
    if (!Array.isArray(personalTasks[person])) personalTasks[person] = [];
    return personalTasks[person];
  }
  // 個人タスクを表示する担当者。上の「R担当者」ボタンで選ばれている人だけを出す。
  // （「全員」＝誰も選んでいない時は並べない。名前をもう一度押せば消える＝トグル）
  function taskPersons() {
    if (!rPersonFilter.size) return [];
    const list = loadTeam().slice();
    Object.keys(personalTasks).forEach((p) => { if (p && list.indexOf(p) < 0) list.push(p); });
    const sel = list.filter((n) => rPersonFilter.has(n));
    rPersonFilter.forEach((n) => { if (sel.indexOf(n) < 0) sel.push(n); });
    return sel;
  }
  async function savePersonTasks(person) {
    updateTaskBadge();
    try { await store.savePersonalTasks(person, personTasks(person)); }
    catch (e) { alert('個人タスクの保存に失敗しました: ' + (e && e.message ? e.message : e)); }
  }

  // ---- タスクの期限（いつまで） ----
  function taskDue(t) { return (t && typeof t.due === 'string') ? t.due : ''; }
  // 期限の表示用チップ。過ぎている=赤 / 今日〜3日以内=オレンジ / それ以外=グレー
  function taskDueHtml(t) {
    const due = taskDue(t);
    if (!due) return '';
    let cls = 'task-due';
    if (!t.done) {
      const left = daysBetween(todayStr(), due);
      if (left !== null && left < 0) cls += ' task-due-over';
      else if (left !== null && left <= 3) cls += ' task-due-soon';
    }
    const left = daysBetween(todayStr(), due);
    const label = (!t.done && left !== null && left < 0) ? `〜${fmtDateShort(due)} 超過` : `〜${fmtDateShort(due)}`;
    return ` <span class="${cls}" title="期限 ${escapeHtml(fmtDateFull(due))}">${escapeHtml(label)}</span>`;
  }
  // 表示順: 手で並べた順（＝配列の順）をそのまま使い、完了したものだけ下にまとめる。
  // ※ドラッグで並べ替えられるようにしたため、期限での自動並べ替えはしない
  //   （期限順にしたい時はポップアップの「期限順に並べる」ボタン → sortTasksByDue）
  function taskDisplayOrder(tasks) {
    const undone = [], done = [];
    tasks.forEach((t, i) => { (t.done ? done : undone).push(i); });
    return undone.concat(done);
  }
  // 「期限順に並べる」ボタン用: 配列そのものを期限の近い順に並べ替える（未完了が先・期限なしは後ろ）
  function sortTasksByDue(tasks) {
    const sorted = tasks.map((t, i) => i).sort((a, b) => {
      const x = tasks[a], y = tasks[b];
      if (!!x.done !== !!y.done) return x.done ? 1 : -1;
      const dx = taskDue(x), dy = taskDue(y);
      if (dx !== dy) {
        if (!dx) return 1;
        if (!dy) return -1;
        return dx < dy ? -1 : 1;
      }
      return a - b;
    }).map((i) => tasks[i]);
    tasks.length = 0;
    sorted.forEach((t) => tasks.push(t));
  }
  // ドラッグでの並べ替え（from の位置のタスクを to の位置へ移す）
  function moveTaskInList(tasks, from, to) {
    if (from === to) return false;
    if (from < 0 || to < 0 || from >= tasks.length || to >= tasks.length) return false;
    const [t] = tasks.splice(from, 1);
    tasks.splice(to, 0, t);
    return true;
  }
  // 一覧セルの中のタスク行（案件・個人で共通）
  function taskCellHtml(tasks, attr) {
    const order = taskDisplayOrder(tasks).filter((i) => showDoneTasks || !tasks[i].done);
    if (!order.length) return '<span class="task-empty">（なし）</span>';
    // チェックボックス=完了 / 文字クリック=その場で書き直し / 文字をつかんで動かす=並べ替え
    return '<ul class="cell-task-list">' + order.map((i) => {
      const t = tasks[i];
      return `<li class="task-row${t.done ? ' task-done' : ''}" draggable="true" data-tidx="${i}">` +
        `<input type="checkbox" ${attr}="${i}"${t.done ? ' checked' : ''} title="チェックすると完了になります">` +
        `<span class="task-text ${taskPrioClass(t)}" data-tedit="${i}" title="クリックで書き直し／つかんで上下に動かすと並べ替え">${escapeHtml(t.text)}</span>` +
        `${taskDueHtml(t)}</li>`;
    }).join('') + '</ul>';
  }
  // クリック/ドラッグされたタスク行から「どのタスク配列か・どう保存するか」を割り出す。
  // 案件のタスク表・個人タスクのパネル・編集ポップアップの3か所で同じ操作をさせるための共通化。
  function taskCtxFromEl(el) {
    if (!el || !el.closest) return null;
    if (el.closest('#taskList')) {
      const tasks = activeTaskList();
      if (!tasks) return null;
      return {
        tasks: tasks,
        persist: () => persistTaskModal(),
        rerender: () => { renderTaskModalList(); if (taskMode) renderTaskTable(); }
      };
    }
    const ptr = el.closest('#personTaskBody tr[data-person]');
    if (ptr) {
      const p = ptr.dataset.person;
      return { tasks: personTasks(p), persist: () => savePersonTasks(p), rerender: () => renderPersonTaskPanel() };
    }
    const ctr = el.closest('#casesBody tr[data-case-id]');
    if (ctr) {
      const c = cases.find((x) => x.id === ctr.dataset.caseId);
      if (!c) return null;
      return {
        tasks: caseTasks(c),
        persist: () => {
          c.updatedAt = new Date().toISOString();
          if (store.mode === 'local') saveCases();
          persistCase(c);
        },
        rerender: () => renderTaskTable()
      };
    }
    return null;
  }
  // タスクの文字をクリック → その場で書き直し（画面は変わらない）。Enterまたは他所クリックで確定、Escで取り消し
  function editTaskText(span) {
    if (!span || span.dataset.editing === '1') return;
    const ctx = taskCtxFromEl(span);
    if (!ctx) return;
    const idx = Number(span.dataset.tedit);
    const t = ctx.tasks[idx];
    if (!t) return;
    span.dataset.editing = '1';
    const li = span.closest('li');
    if (li) li.setAttribute('draggable', 'false');   // 書き直し中はドラッグさせない
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-edit';
    input.value = t.text || '';
    span.replaceWith(input);
    input.focus();
    const len = input.value.length;
    try { input.setSelectionRange(len, len); } catch (e) {}
    let closed = false;
    const finish = (save) => {
      if (closed) return;
      closed = true;
      const v = input.value.trim();
      if (save && v && v !== t.text) { t.text = v; ctx.persist(); }
      ctx.rerender();   // 取り消し時も描き直して元の文字に戻す（空欄での確定は無視）
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      e.stopPropagation();
    });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', (e) => e.stopPropagation());
  }
  // 文字をつかんで動かすと並べ替え（3か所とも同じ動き）
  let taskDragIdx = null, taskDragRoot = null;
  function clearTaskDropMarks() {
    document.querySelectorAll('.task-drop-target').forEach((el) => el.classList.remove('task-drop-target'));
    document.querySelectorAll('.task-dragging').forEach((el) => el.classList.remove('task-dragging'));
  }
  document.addEventListener('dragstart', (e) => {
    const li = e.target.closest && e.target.closest('li[data-tidx]');
    if (!li || li.getAttribute('draggable') === 'false') return;
    taskDragIdx = Number(li.dataset.tidx);
    taskDragRoot = li.parentElement;
    li.classList.add('task-dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(taskDragIdx)); } catch (err) {}
    }
  });
  document.addEventListener('dragover', (e) => {
    if (taskDragIdx === null) return;
    const li = e.target.closest && e.target.closest('li[data-tidx]');
    if (!li || li.parentElement !== taskDragRoot) return;   // 別の行・別の人のタスクへは移せない
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (!li.classList.contains('task-dragging')) li.classList.add('task-drop-target');
  });
  document.addEventListener('dragleave', (e) => {
    const li = e.target.closest && e.target.closest('li[data-tidx]');
    if (li) li.classList.remove('task-drop-target');
  });
  document.addEventListener('drop', (e) => {
    if (taskDragIdx === null) return;
    const li = e.target.closest && e.target.closest('li[data-tidx]');
    const from = taskDragIdx;
    taskDragIdx = null;
    clearTaskDropMarks();
    if (!li || li.parentElement !== taskDragRoot) return;
    e.preventDefault();
    const ctx = taskCtxFromEl(li);
    if (ctx && moveTaskInList(ctx.tasks, from, Number(li.dataset.tidx))) { ctx.persist(); ctx.rerender(); }
  });
  document.addEventListener('dragend', () => { taskDragIdx = null; clearTaskDropMarks(); });

  const TASK_COLS = [
    { field: 'status',   label: 'ステータス' },
    { field: 'company',  label: '会社' },
    { field: 'theater',  label: '劇場名' },
    { field: 'tcPerson', label: '客先担当者' },
    { field: 'rPerson',  label: 'R担当者' },
    { field: 'title',    label: '案件名' },
    { field: 'content',  label: '内容' },
    { field: 'memo',     label: '社内用メモ' },
    { field: 'tasks',    label: 'タスク' }
  ];
  function enterTaskMode() {
    if (aggMode) exitAggMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    exitAuxModes();
    taskMode = true;
    $('casesTable').classList.add('task-mode');
    $('emptyMsg').classList.add('hidden');
    $('taskBtnLabel').innerHTML = '<span class="tb-ic">✕</span><span class="tb-tx"> タスク管理を閉じる</span><span class="tb-sh"> 閉じる</span>';
    $('taskDoneToggleBtn').classList.remove('hidden');
    $('personalTaskBtn').classList.remove('hidden');
    updatePersonalTaskBtn();
    renderTaskTable();
    // 個人タスクと「これタスクでは？」の提案は最新をDBから読み直す（読めたら再描画）
    store.fetchPersonalTasks().then((map) => {
      personalTasks = map || {};
      if (taskMode) renderPersonTaskPanel();
    }).catch(() => {});
    store.fetchTaskSuggestions().then((rows) => {
      taskSuggestionRows = rows || [];
      if (taskMode) renderPersonTaskPanel();
    }).catch(() => {});
  }
  function exitTaskMode() {
    taskMode = false;
    $('casesTable').classList.remove('task-mode');
    $('taskBtnLabel').innerHTML = '<span class="tb-ic">📋</span><span class="tb-tx"> タスク管理</span>';
    $('taskDoneToggleBtn').classList.add('hidden');
    $('personalTaskBtn').classList.add('hidden');
    $('personTaskPanel').classList.add('hidden');
    $('casesTable').querySelector('thead').innerHTML = NORMAL_THEAD_HTML;
    render();
  }
  function toggleTaskMode() { if (taskMode) exitTaskMode(); else enterTaskMode(); }
  function updatePersonalTaskBtn() {
    setSwitch($('personalTaskBtn'), showPersonalTasks);
  }
  function togglePersonalTasks() {
    showPersonalTasks = !showPersonalTasks;
    updatePersonalTaskBtn();
    renderPersonTaskPanel();
  }

  // ========== カレンダー ==========
  let calMode = false;
  let calYear = null, calMonth = null; // calMonth: 0-11
  const calCompanyFilter = new Set();
  const calPersonFilter = new Set();
  const CAL_EVENT_TYPES = [
    { field: 'surveyDate', timeField: 'surveyTime', type: 'survey', label: '調査' },
    { field: 'workStartDate', timeField: 'workStartTime', type: 'start', label: '開始' },
    { field: 'workEndDate', timeField: null, type: 'end', label: '完了' }
  ];
  function enterCalMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (koteiMode) exitKoteiMode();
    exitAuxModes();
    calMode = true;
    if (calYear == null) { const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); }
    $('calBtn').textContent = '✕ カレンダーを閉じる';
    document.body.classList.add('cal-full');   // 開いたら全画面（右上の「✕ 閉じる」で戻る）
    renderCalFilterNote();
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('calendarView').classList.remove('hidden');
    renderCalendar();
  }
  function exitCalMode() {
    calMode = false;
    document.body.classList.remove('cal-full'); hideCalTip();
    $('calBtn').textContent = '📅 カレンダー';
    $('calendarView').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  function toggleCalMode() { if (calMode) exitCalMode(); else enterCalMode(); }
  // 全画面では上のボタンが見えないので、今の絞り込み（会社・担当者）を書いておく
  function renderCalFilterNote() {
    const el = $('calFilterNote'); if (!el) return;
    const parts = [];
    if (companyFilter.size) parts.push([...companyFilter].map((c) => companyAbbr(c) || c).join('・'));
    if (rPersonFilter.size) parts.push([...rPersonFilter].join('・'));
    el.textContent = parts.length ? '絞り込み: ' + parts.join('／') + '（閉じて上のボタンで変えられます）' : '全部の案件';
  }
  // 帯に指を乗せると、案件名と内容の全文を小さく出す
  function showCalTip(bar, x, y) {
    const c = cases.find((k) => String(k.id) === String(bar.dataset.caseId)); if (!c) return;
    let tip = $('calTip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'calTip'; tip.className = 'cal-tip'; document.body.appendChild(tip); }
    const kind = bar.dataset.kind === 'survey' ? '調査' : '作業';
    const when = bar.dataset.kind === 'survey' ? `${fmtDateShort(c.surveyDate)}${c.surveyTime ? ' ' + c.surveyTime : ''}`
      : `${fmtDateShort(c.workStartDate || c.workEndDate)}${c.workStartTime ? ' ' + c.workStartTime : ''}${c.workEndDate && c.workEndDate !== c.workStartDate ? '〜' + fmtDateShort(c.workEndDate) : ''}`;
    tip.innerHTML = `<div class="cal-tip-h">${escapeHtml(kind)}　${escapeHtml(when)}　${escapeHtml(shortTheaterName(c.theater) || c.theater || '')}</div>
      <div class="cal-tip-t">${escapeHtml(calCaseName(c))}</div>${c.content ? `<div class="cal-tip-b">${escapeHtml(c.content)}</div>` : ''}<div class="cal-tip-f">押すと日時などを直せます</div>`;
    tip.style.display = 'block';
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14)) + 'px';
    tip.style.top = (y + 16 + h > window.innerHeight ? Math.max(8, y - h - 12) : y + 16) + 'px';
  }
  function hideCalTip() { const t = $('calTip'); if (t) t.style.display = 'none'; }

  // ===== 書類棚（工程表・工事写真台帳）モード — 中身は shelf.js / kotei.js =====
  let koteiMode = false;
  function enterKoteiMode(opts) {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    exitAuxModes();
    koteiMode = true;
    $('koteiBtn').textContent = '✕ 書類棚を閉じる';
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    document.body.classList.add('shelf-active');
    if (window.SHELF) window.SHELF.open(opts);
  }
  // 他の画面へ切り替えた時にも呼ばれる（保存していない変更は端末に残り、次に開いた時に復元できる）
  function exitKoteiMode() {
    koteiMode = false;
    $('koteiBtn').textContent = '📁 書類棚（工程表・写真台帳）';
    if (window.SHELF) window.SHELF.close();
    document.body.classList.remove('shelf-active');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  // 「✕ 書類棚を閉じる」を押した時は、保存していない変更があれば「保存しますか？」と聞いてから閉じる
  function toggleKoteiMode() {
    if (!koteiMode) { enterKoteiMode(); return; }
    if (window.SHELF) window.SHELF.requestClose(exitKoteiMode); else exitKoteiMode();
  }

  // ===== 支払い状況（購買）モード（菱熱のみ） =====
  let purchaseMode = false;
  function enterPurchaseMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (intakeMode) exitIntakeMode();
    if (equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
    purchaseMode = true;
    $('casesTable').classList.add('purchase-mode');
    $('emptyMsg').classList.add('hidden');
    $('purchaseBtn').textContent = '✕ 支払い状況を閉じる';
    renderPurchaseView();
  }
  function exitPurchaseMode() {
    purchaseMode = false;
    $('casesTable').classList.remove('purchase-mode');
    $('purchaseBtn').textContent = '💰 支払い状況';
    $('casesTable').querySelector('thead').innerHTML = NORMAL_THEAD_HTML;
    render();
  }
  function togglePurchaseMode() { if (purchaseMode) exitPurchaseMode(); else enterPurchaseMode(); }

  // 1業者ぶんの購買行HTML（テーブル内セルに描画）
  function purchaseRowHtml(item) {
    item = item || {};
    const amt = (item.amount != null && item.amount !== '') ? formatThousands(item.amount) : '';
    return '<div class="pv-row">' +
      '<input type="month" class="pur-month" aria-label="購買発行月" value="' + escapeHtml(item.month || '') + '">' +
      '<input type="text" class="pur-vendor" placeholder="業者名" aria-label="業者名" value="' + escapeHtml(item.vendor || '') + '">' +
      '<input type="text" class="pur-amount" inputmode="numeric" placeholder="例：300,000" aria-label="金額" value="' + escapeHtml(amt) + '">' +
      '<button type="button" class="pur-del" title="この行を削除">×</button>' +
    '</div>';
  }
  function buildPurchaseRow(item) {
    const tmp = document.createElement('div');
    tmp.innerHTML = purchaseRowHtml(item);
    return tmp.firstChild;
  }
  // 案件行(tr)の入力欄から購買配列を集計（月・業者・金額すべて空の行は除外）
  function collectPurchasesFrom(caseEl) {
    const out = [];
    caseEl.querySelectorAll('.pv-row').forEach((row) => {
      const month = row.querySelector('.pur-month').value || '';
      const vendor = row.querySelector('.pur-vendor').value.trim();
      const amountRaw = row.querySelector('.pur-amount').value.replace(/[^\d]/g, '');
      if (!month && !vendor && !amountRaw) return;
      out.push({ month: month, vendor: vendor, amount: amountRaw === '' ? '' : Number(amountRaw) });
    });
    return out;
  }
  // 案件行(tr[data-case-id])の内容を c.purchases に反映して保存
  function savePurchasesForCard(caseEl) {
    const id = caseEl.dataset.caseId;
    const c = cases.find((x) => x.id === id);
    if (!c) return;
    c.purchases = collectPurchasesFrom(caseEl);
    c.updatedAt = new Date().toISOString();
    persistCase(c);
  }
  // 支払い状況モード: タスク管理と同じく #casesTable の thead を差し替えて描画
  function renderPurchaseView() {
    renderDatalists();
    const thead = $('casesTable').querySelector('thead');
    thead.innerHTML = '<tr>' + PURCHASE_COLS.map((c) =>
      `<th class="pv-th-${c.field}${c.field === 'purchases' ? ' pv-col' : ''}" data-col="${c.field}" data-colkey="${c.field}">${c.label}</th>`).join('') + '</tr>';
    addResizers(thead);
    const tbody = $('casesBody');
    tbody.innerHTML = '';
    // 購買は菱熱専用データ。客先には出さない
    if (!isPrivileged(currentUser)) {
      $('caseCount').textContent = '0 件';
      $('emptyMsg').classList.remove('hidden');
      applyColumnOrder(); setupColumnDrag(); addColSortHandles();
      return;
    }
    const rows = getFilteredCases();
    rows.forEach((c) => {
      const tr = document.createElement('tr');
      tr.dataset.caseId = c.id;
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;
      const purchases = Array.isArray(c.purchases) ? c.purchases : [];
      const rowsHtml = (purchases.length ? purchases : [{}]).map((it) => purchaseRowHtml(it)).join('');
      tr.innerHTML = `
        <td data-colkey="company" class="col-company">${buildCompanyTag(c)}</td>
        <td data-colkey="theater" title="${escapeHtml(c.theater || '')}">${escapeHtml(shortTheaterName(c.theater))}<div class="pv-mtitle">${escapeHtml(calCaseName(c))}</div></td>
        <td data-colkey="content" class="content-cell">${escapeHtml(c.content)}</td>
        <td data-colkey="estimateName" data-label="見積り名">${escapeHtml(c.estimateName)}</td>
        <td data-colkey="estimateAmount" class="pv-amount-col" data-label="見積り">${fmtAmount(c.estimateAmount)}</td>
        <td data-colkey="purchases" class="pv-cell">
          <div class="pv-rows">${rowsHtml}</div>
          <button type="button" class="pv-add">＋業者を追加</button>
        </td>`;
      tbody.appendChild(tr);
    });
    $('caseCount').textContent = `${rows.length} 件`;
    $('emptyMsg').classList.toggle('hidden', rows.length > 0);
    updateShowAllBtn();
    applyColumnOrder();
    setupColumnDrag();
    addColSortHandles();
  }
  function calVisibleCases() {
    return visibleCases().filter((c) => {
      if (companyFilter.size && !companyFilter.has(c.company)) return false;
      if (rPersonFilter.size) {
        const rp = c.rPerson || '';
        let hit = false; for (const n of rPersonFilter) { if (rp.includes(n)) { hit = true; break; } }
        if (!hit) return false;
      }
      return true;
    });
  }
  function isoOf(dt) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  function dayDiff(isoA, isoB) {
    return Math.round((new Date(isoB) - new Date(isoA)) / 86400000);
  }
  // カレンダーの帯に出す名前: 案件名（空なら内容の1行目を短く）（2026-11-20）
  function calCaseName(c) {
    const t = String(c.title || '').trim(); if (t) return t;
    const first = String(c.content || '').split('\n').map((x) => x.replace(/^[・\-\s]+/, '').trim()).find(Boolean);
    return first ? first.slice(0, 24) : (c.category || '');
  }
  // カレンダーの予定: 調査=点、作業=開始〜終了の帯
  function collectCalItems() {
    const items = [];
    calVisibleCases().forEach((c) => {
      const theater = shortTheaterName(c.theater) || '(劇場未入力)';
      const co = companyAbbr(c.company) || '';
      if (c.surveyDate && String(c.surveyDate).length >= 10) {
        items.push({ id: c.id, kind: 'survey', start: c.surveyDate, end: c.surveyDate, time: c.surveyTime || '', co: co, theater: theater, name: calCaseName(c), full: c.content || '' });
      }
      const ws = (c.workStartDate && String(c.workStartDate).length >= 10) ? c.workStartDate : '';
      const we = (c.workEndDate && String(c.workEndDate).length >= 10) ? c.workEndDate : '';
      if (ws || we) {
        let s = ws || we, e = we || ws;
        if (s > e) { const t = s; s = e; e = t; }
        items.push({ id: c.id, kind: 'work', start: s, end: e, time: c.workStartTime || '', co: co, theater: theater, name: calCaseName(c), full: c.content || '' });
      }
    });
    return items;
  }
  function renderCalendar() {
    $('calTitle').textContent = `${calYear}年${calMonth + 1}月`;
    const items = collectCalItems();
    const todayIso = todayStr();
    const first = new Date(calYear, calMonth, 1);
    const startDate = new Date(first); startDate.setDate(1 - first.getDay()); // 週初め(日曜)へ
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const endDate = new Date(lastDay); endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // 週末(土)へ
    const DAYNUM_H = 24, LANE_H = 38;   // 帯は2行まで（全画面・文字を大きく）
    // 全画面では、週の高さを画面いっぱいに分ける（予定が多い週はその分のびる）
    const nWeeks = Math.round((endDate - startDate) / 86400000 / 7) + 1;
    const fillH = document.body.classList.contains('cal-full') ? Math.floor(Math.max(0, window.innerHeight - 130) / nWeeks) : 0;
    let html = '';
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const days = [];
      for (let i = 0; i < 7; i++) { const d = new Date(cur); d.setDate(cur.getDate() + i); days.push(d); }
      const wStart = isoOf(days[0]), wEnd = isoOf(days[6]);
      const evs = items.filter((it) => it.start <= wEnd && it.end >= wStart).map((it) => ({
        it: it,
        sc: Math.max(0, dayDiff(wStart, it.start)),
        ec: Math.min(6, dayDiff(wStart, it.end)),
        contL: it.start < wStart,
        contR: it.end > wEnd
      })).sort((a, b) => a.sc - b.sc || (a.it.time || '99:99').localeCompare(b.it.time || '99:99') || (a.it.start < b.it.start ? -1 : 1));
      const lanes = [];
      evs.forEach((ev) => {
        let lane = lanes.findIndex((lastEc) => lastEc < ev.sc);
        if (lane === -1) { lane = lanes.length; lanes.push(ev.ec); } else { lanes[lane] = ev.ec; }
        ev.lane = lane;
      });
      const weekH = Math.max(fillH, DAYNUM_H + Math.max(1, lanes.length) * LANE_H + 4);
      let daysHtml = '';
      days.forEach((d, i) => {
        const iso = isoOf(d);
        const other = d.getMonth() !== calMonth;
        daysHtml += `<div class="cal-d dow-${i}${other ? ' cal-other' : ''}${iso === todayIso ? ' cal-today' : ''}"><span class="cal-dn">${d.getDate()}</span></div>`;
      });
      let barsHtml = '';
      evs.forEach((ev) => {
        const it = ev.it;
        const left = ev.sc / 7 * 100;
        const width = (ev.ec - ev.sc + 1) / 7 * 100;
        const top = DAYNUM_H + ev.lane * LANE_H;
        const cls = it.kind === 'survey' ? 'ev-survey' : 'ev-work';
        const lbl = it.kind === 'survey' ? '調査' : '作業';
        const prefix = `${it.co || ''}${it.theater || ''}`; // 例: TOHO川崎
        // 帯: 時刻・劇場・案件名（調査/作業は色と小さな印）。指を乗せると内容の全文（calTip）
        const txt = `<span class="cal-kind">${lbl}</span>${it.time ? '<b>' + escapeHtml(it.time) + '</b> ' : ''}${escapeHtml(prefix)} <span class="cal-name">${escapeHtml(it.name || '')}</span>`;
        barsHtml += `<div class="cal-ev-bar ${cls}${ev.contL ? ' cont-l' : ''}${ev.contR ? ' cont-r' : ''}" data-case-id="${escapeHtml(it.id)}" data-kind="${it.kind}" style="left:${left}%;width:${width}%;top:${top}px">${txt}</div>`;
      });
      html += `<div class="cal-week" style="height:${weekH}px"><div class="cal-week-grid">${daysHtml}</div><div class="cal-week-bars">${barsHtml}</div></div>`;
      cur.setDate(cur.getDate() + 7);
    }
    $('calGrid').innerHTML = html;
  }

  // ⑧ 「📋 タスク管理」ボタンの件数＝未完了のタスク（案件のタスク＋個人タスク）。
  // 上の「担当者」ボタンで人を選んでいる時は、その人の分だけ（2人以上なら合計）:
  //   ・案件のタスク … R担当にその人が入っている案件のタスク（案件一覧の担当者の絞り込みと同じ決まり）
  //   ・個人タスク … その人の個人タスク
  // 「全員」（誰も選んでいない）時は全部。
  // 期限切れが1件でもあると赤、無ければ黄。完了・入金済・取り下げ・失注の案件のタスクは数えない
  function taskCountsFor(persons) {
    const today = todayStr();
    const sel = persons && persons.size ? Array.from(persons) : null;
    let open = 0, over = 0;
    const count = (t) => {
      if (!t || t.done) return;
      open++;
      const due = taskDue(t);
      if (due && due < today) over++;
    };
    visibleCases().forEach((c) => {
      if (CLOSED_FOR_TASKS.indexOf(statusOf(c)) !== -1) return;
      if (sel) { const rp = c.rPerson || ''; if (!sel.some((n) => rp.includes(n))) return; }
      (Array.isArray(c.tasks) ? c.tasks : []).forEach(count);
    });
    Object.keys(personalTasks).forEach((p) => {
      if (sel && sel.indexOf(p) === -1) return;
      (Array.isArray(personalTasks[p]) ? personalTasks[p] : []).forEach(count);
    });
    return { open, over };
  }
  function updateTaskBadge() {
    const badge = $('taskBadge'); if (!badge || !currentUser) return;
    if (!isPrivileged(currentUser)) { badge.classList.add('hidden'); return; }
    const { open, over } = taskCountsFor(rPersonFilter);
    const who = rPersonFilter.size ? Array.from(rPersonFilter).join('・') + ' の分' : '全員の分';
    // 数字だけだと何の数か分からないため、「未完了」「期限切れ」と文字を添える
    badge.innerHTML = open ? `<span class="bl">未完了</span>${open}` : '';
    badge.classList.toggle('hidden', !open);
    badge.classList.add('ok');
    badge.classList.toggle('has-over', !!over);   // スマホでは「期限切れ」の札を出さず、この札を赤くする
    const ob = $('taskOverBadge');
    if (ob) { ob.innerHTML = over ? `<span class="bl">期限切れ</span>${over}` : ''; ob.classList.toggle('hidden', !over); }
    $('taskBtn').title = open ? `未完了のタスク ${open} 件${over ? `（うち期限切れ ${over} 件）` : ''}（${who}：R担当の案件のタスク＋個人タスク）` : '';
  }

  // ===== 個人タスクの提案「💡 これタスクでは？」 =====
  // ① 案件の止まり … 案件データからその場で計算（一覧の左端の色と同じ判定）。押した結果だけ表に残す
  // ② メール・LINE … GAS が AI で拾って表(task_suggestions)に入れたもの（status='pending'）
  // 一度「登録」「破棄」したもの（dedupe_key）は二度と出さない
  const STALL_REPLY_DAYS = 14;   // 見積り提出後、返事が無いまま何日で提案するか
  const STALL_INVOICE_DAYS = 7;  // 作業完了後、請求書が出ないまま何日で提案するか
  // 案件のR担当者から、チームの誰か（苗字）を取り出す（R担当が空・チーム外なら提案しない）
  function caseOwner(c) {
    const rp = String(c.rPerson || '');
    return loadTeam().find((n) => rp.includes(n)) || '';
  }
  function caseLabel(c) {
    const th = shortTheaterName(c.theater) || c.theater || '（劇場名なし）';
    const what = String(c.estimateName || c.content || '').replace(/\s+/g, ' ').trim().slice(0, 14);
    return what ? `${th}（${what}）` : th;
  }
  function stallSuggestions() {
    if (!isPrivileged(currentUser)) return [];
    const today = todayStr();
    const out = [];
    visibleCases().forEach((c) => {
      const person = caseOwner(c); if (!person) return;
      const st = statusOf(c);
      if (['取り下げ', '失注', '保留', '入金済', '請求済'].indexOf(st) !== -1) return;
      const cls = rowColorClass(c);
      const add = (rule, text, reason, priority) => out.push({
        person, text: `${caseLabel(c)}：${text}`, reason, priority, due: '',
        source: 'stall', case_id: String(c.id), source_url: '', dedupe_key: `stall:${rule}:${c.id}`
      });
      if (cls === 'row-red' && c.surveyDate) {
        add('quote', '見積りを提出する', `調査から${daysBetween(c.surveyDate, today)}日 見積り未提出`, 'high');
      } else if (cls === 'row-yellow') {
        add('report', '初動対応・区分判定を報告する', '初動報告まだ', 'high');
      } else if (cls === 'row-orange') {
        add('survey', '調査日を決める', `${c.initialReportAt ? '初動報告' : '受付'}から 調査日未定`, 'mid');
      }
      if ((st === '見積り提出済' || st === '客先対応中') && c.quoteDate && !c.workStartDate) {
        const n = daysBetween(c.quoteDate, today);
        if (n !== null && n >= STALL_REPLY_DAYS) add('reply', '見積りの返事を確認する', `見積り提出から${n}日 動きなし`, 'mid');
      }
      if (st === '対応済み' && c.workEndDate && !c.invoiceDate) {
        const n = daysBetween(c.workEndDate, today);
        if (n !== null && n >= STALL_INVOICE_DAYS) add('invoice', '請求書を発行する', `作業完了から${n}日 請求書未発行`, 'high');
      }
    });
    return out;
  }
  // 連絡するだけのタスクか（メールする・電話する・返信する・連絡する・伝える…）。見積り・書類など作る物があれば残す
  // ※ GAS（Code.gs の isContactOnlyTask_）と同じ決まり。今たまっている提案も、これに当たるものは出さない（2026-11-20）
  function isContactOnlyTask(text) {
    const t = String(text || '').replace(/^[^：:]{1,20}[：:]/, '').replace(/\s/g, '');
    if (/見積|書類|資料|図面|申請書|報告書|計画書|写真|請求書|発注|手配|注文/.test(t)) return false;
    return /(メール|電話|TEL|ＴＥＬ|連絡|返信|返事|伝える|伝達|リマインド|折り返|一報|お礼|フォロー)/.test(t) &&
      /(する|しておく|を送る|を入れる|をかける|をする|伝える|入れる|送る|かける|返す|確認する)$/.test(t);
  }
  // 表示する提案（担当者ごと）。止まり＋メール/LINE の提案中から、押したものを除く
  function currentSuggestions() {
    if (store.mode === 'supabase' && !taskSuggestionsSupported) return [];
    const decided = new Set(taskSuggestionRows.filter((r) => r.status !== 'pending').map((r) => r.dedupe_key));
    const fromTable = taskSuggestionRows.filter((r) => r.status === 'pending' && r.source !== 'stall' && !isContactOnlyTask(r.text));
    return stallSuggestions().concat(fromTable).filter((x) => x.person && !decided.has(x.dedupe_key));
  }
  const SUGG_SOURCE_LABEL = { stall: '止まり', mail: 'メール', line: 'LINE', plaud: 'Plaud' };
  const SUGG_OPEN_TIP = { stall: 'この案件を開く', mail: '元のメールを開く', line: '元のLINEのやり取りを開く', plaud: '元の会議・電話の記録を開く' };
  function suggestionsHtml(list) {
    if (!list.length) return '';
    return `<div class="sugg"><div class="sugg-h">💡 これタスクでは？</div><ul class="sugg-list">${list.map((x) => {
      const k = escapeHtml(x.dedupe_key);
      const openable = (x.source === 'stall' && x.case_id) || x.source_url;
      const due = x.due ? `<span class="task-due">〜${escapeHtml(fmtDateShort(x.due))}</span>` : '';
      return `<li class="sugg-item" data-sugg="${k}">
        <span class="sugg-btns"><button type="button" class="sugg-accept" data-sugg-accept="${k}" title="個人タスクに登録する">＋ 登録</button><button type="button" class="sugg-done" data-sugg-done="${k}" title="もう済んでいる。個人タスクに「完了」で入れる">✔ 完了済み</button><button type="button" class="sugg-dismiss" data-sugg-dismiss="${k}" title="タスクにしない">破棄</button></span>
        <span class="sugg-src sugg-src-${escapeHtml(x.source)}">${escapeHtml(SUGG_SOURCE_LABEL[x.source] || x.source)}</span>
        <span class="sugg-body"><span class="sugg-text${openable ? ' sugg-link' : ''}" ${openable ? `data-sugg-open="${k}" title="${SUGG_OPEN_TIP[x.source] || '元の記録を開く'}"` : ''}>${escapeHtml(x.text)}</span>${due}
          ${x.reason ? `<span class="sugg-why">${escapeHtml(x.reason)}</span>` : ''}</span>
      </li>`;
    }).join('')}</ul></div>`;
  }
  function findSuggestion(key) { return currentSuggestions().find((x) => x.dedupe_key === key); }
  // accept: true＝登録 / 'done'＝完了済みとして登録 / false＝破棄
  async function decideSuggestion(key, accept) {
    const sug = findSuggestion(key); if (!sug) return;
    if (accept) {
      personTasks(sug.person).push({ text: sug.text, done: accept === 'done', priority: sug.priority || 'mid', due: sug.due || '' });
      savePersonTasks(sug.person);
    }
    const status = accept ? 'accepted' : 'dismissed';
    // 先に画面から消す（押した直後に消える）。記録に失敗したら知らせる
    taskSuggestionRows = taskSuggestionRows.filter((r) => r.dedupe_key !== key).concat([Object.assign({}, sug, { status })]);
    renderPersonTaskPanel();
    try { await store.decideTaskSuggestion(sug, status); }
    catch (e) { alert('提案の記録に失敗しました（次に開いたとき、もう一度出ることがあります）: ' + (e && e.message ? e.message : e)); }
  }
  function openSuggestionSource(key) {
    const sug = findSuggestion(key); if (!sug) return;
    if (sug.source === 'stall' && sug.case_id) {
      const c = cases.find((x) => String(x.id) === String(sug.case_id));
      if (c) openModal(c, 'full');
    } else if (sug.source_url) {
      window.open(sug.source_url, '_blank', 'noopener');
    }
  }

  // 担当者ごとの個人タスク。案件のタスク表の「上」に別枠で出す（同時表示・ボタンで表示/非表示）
  function renderPersonTaskPanel() {
    updateTaskBadge();
    const panel = $('personTaskPanel');
    if (!taskMode || !showPersonalTasks) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    const tbody = $('personTaskBody');
    tbody.innerHTML = '';
    if (store.mode === 'supabase' && !personalTasksSupported) {
      tbody.innerHTML = '<tr><td colspan="2" class="task-empty">個人タスクを使うには、データベースの更新（personal_tasks テーブルの追加）が必要です。</td></tr>';
      $('ptpCount').textContent = '';
      return;
    }
    const persons = taskPersons();
    const sugg = currentSuggestions();
    if (!persons.length) {
      const nAll = sugg.length;
      tbody.innerHTML = '<tr><td colspan="2" class="task-hint">上の担当者ボタンから名前を押すと、その人の個人タスクが出ます。もう一度押すと消えます。' +
        (nAll ? `<br>💡 タスクの提案が ${nAll} 件あります（名前を押すと出ます）。` : '') + '</td></tr>';
      $('ptpCount').textContent = '';
      return;
    }
    persons.forEach((p) => {
      const tr = document.createElement('tr');
      tr.dataset.person = p;
      const mine = sugg.filter((x) => x.person === p);
      tr.innerHTML = `
        <td class="ptp-person"><span class="ptp-name">${escapeHtml(p)}</span><button type="button" class="task-open-btn" data-persontaskopen="${escapeHtml(p)}" title="${escapeHtml(p)}さんのタスクを追加・編集">＋ 追加</button></td>
        <td class="task-col ptp-tasks">
          ${taskCellHtml(personTasks(p), 'data-persontaskcell')}
          ${suggestionsHtml(mine)}
        </td>`;
      tbody.appendChild(tr);
    });
    const total = persons.reduce((n, p) => n + personTasks(p).filter((t) => !t.done).length, 0);
    const nSugg = sugg.filter((x) => persons.indexOf(x.person) !== -1).length;
    $('ptpCount').textContent = `未完了 ${total} 件` + (nSugg ? `・💡提案 ${nSugg} 件` : '');
  }

  function renderTaskTable() {
    renderPersonTaskPanel();
    renderDatalists();
    const thead = $('casesTable').querySelector('thead');
    thead.innerHTML = '<tr>' + TASK_COLS.map((c) =>
      `<th class="task-th-${c.field}${c.field === 'tasks' ? ' task-col' : ''}" data-col="${c.field}" data-colkey="${c.field}">${c.label}</th>`).join('') + '</tr>';
    addResizers(thead);
    const tbody = $('casesBody');
    tbody.innerHTML = '';
    const rows = getFilteredCases();
    rows.forEach((c) => {
      const tr = document.createElement('tr');
      tr.dataset.caseId = c.id;
      const cls = rowColorClass(c);
      if (cls) tr.className = cls;
      const taskListHtml = taskCellHtml(caseTasks(c), 'data-taskcell');
      // 各項目は通常画面と同じく編集可（劇場名は短縮表示で標準と同条件）
      tr.innerHTML = `
        ${buildStatusCell(c)}
        ${editableTd(c, 'company', buildCompanyTag(c), 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(shortTheaterName(c.theater)))}
        ${editableTd(c, 'tcPerson', escapeHtml(stripHonorific(c.tcPerson)))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'title', escapeHtml(c.title || ''), 'col-title' + (isPrivileged(currentUser) && statusOf(c) === '見積り中' ? ' quote-blink' : ''))}
        ${editableTd(c, 'content', dupBadgeHtml(c) + escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
        <td class="task-col" data-colkey="tasks">
          <button type="button" class="task-open-btn" data-taskopen="${escapeHtml(c.id)}" title="タスクを追加・編集">＋ 追加</button>
          ${taskListHtml}
        </td>`;
      tbody.appendChild(tr);
    });
    $('caseCount').textContent = `${rows.length} 件`;
    updateShowAllBtn();
    applyColumnOrder();   // 個人設定の列並びを反映
    setupColumnDrag();    // 見出しをドラッグで並べ替え可能に
    addColSortHandles();  // 見出しの「▲」で昇順/降順の並び替え
    renderStatusChips();  // 状態ごとの件数ボタン
    renderMobileCards(rows); // ⑨ スマホのカード（タスク管理版）
  }

  // ===== ⑨ スマホ: 一覧をカードで出す =====
  // 表示は「劇場名・状態・内容・次の予定・担当者」だけ。タップで編集（タスク管理中はタスクの編集）
  function nextPlanHtml(c) {
    const today = todayStr();
    const md = (iso) => escapeHtml(fmtDateShort(iso));
    if (c.workStartDate && (c.workEndDate || c.workStartDate) >= today) {
      return `作業 <b>${md(c.workStartDate)}${c.workEndDate && c.workEndDate !== c.workStartDate ? '〜' + md(c.workEndDate) : ''}</b>`;
    }
    if (c.surveyDate && c.surveyDate >= today) return `調査 <b>${md(c.surveyDate)}</b>`;
    if (c.quoteDate) return `見積り提出 <b>${md(c.quoteDate)}</b>`;
    if (c.surveyDate) return `調査済 <b>${md(c.surveyDate)}</b>`;
    return c.receivedDate ? `受付 <b>${md(c.receivedDate)}</b>` : '';
  }
  function renderMobileCards(list) {
    const box = $('mobileCards'); if (!box) return;
    if (!isMobile()) { if (box.firstChild) box.innerHTML = ''; return; } // PCでは作らない
    const priv = isPrivileged(currentUser);
    box.innerHTML = list.map((c) => {
      const st = statusOf(c);
      const cls = rowColorClass(c);
      const coTag = priv ? buildCompanyTag(c) : '';
      const dup = isDupSuspect(c) ? '<span class="m-dup">⚠️二重の可能性</span>' : '';
      let body;
      if (taskMode) {
        const open = caseTasks(c).map((t, i) => i).filter((i) => !caseTasks(c)[i].done || showDoneTasks);
        body = open.length
          ? '<ul class="m-tasks">' + open.map((i) => { const t = caseTasks(c)[i]; return `<li class="${t.done ? 'task-done' : ''}"><span class="${taskPrioClass(t)}">${escapeHtml(t.text)}</span>${taskDueHtml(t)}</li>`; }).join('') + '</ul>'
          : '<div class="m-none">タスクなし（タップで追加）</div>';
      } else {
        const amt = c.estimateAmount ? `<span>${fmtAmount(c.estimateAmount)}</span>` : '';
        const nTask = priv ? (Array.isArray(c.tasks) ? c.tasks.filter((t) => !t.done).length : 0) : 0;
        // 案件名が出るので、内容はカードに書かない（小さくして、たくさん並べる。2026-11-19）
        const nm = c.title || String(c.content || '').replace(/\s+/g, ' ').slice(0, 40);
        body = `${nm ? `<div class="m-title${c.title ? '' : ' m-title-ct'}">${escapeHtml(nm)}</div>` : ''}
          <div class="m-l3"><span>${nextPlanHtml(c)}</span>${amt}${nTask ? `<span>タスク <b>${nTask}</b></span>` : ''}</div>`;
      }
      return `<div class="m-card ${cls}" role="button" tabindex="0" data-mcase="${escapeHtml(c.id)}">
        <span class="m-l1">${c.urgent ? '<span class="urgent-flag" title="緊急案件">🚩</span>' : ''}${coTag}<span class="m-th">${escapeHtml(shortTheaterName(c.theater) || '（劇場名なし）')}</span><span class="status-badge status-${escapeHtml(st)}">${escapeHtml(statusDisplayLabel(st))}</span><span class="m-rp">${escapeHtml(c.rPerson || '')}</span></span>
        ${taskMode ? '' : ''}${body.replace('<div class="m-l3">', `<div class="m-l3">${needsApprovalNo(c) ? `<span class="cat-approval" title="見積り金額（税抜）が3万円以上：決裁番号が必要">${escapeHtml(c.category || '要決裁番号')}</span>` : ''}${lateDaysHtml(c)}${dup}`)}
      </div>`;
    }).join('');
  }

  // タスク編集ポップアップ
  let taskModalCase = null;
  let taskModalPerson = null;   // 個人タスクを開いている時の担当者名
  // 今ポップアップで編集中のタスク配列（案件 or 個人）
  function activeTaskList() {
    if (taskModalPerson) return personTasks(taskModalPerson);
    if (taskModalCase) return caseTasks(taskModalCase);
    return null;
  }
  function openTaskModal(c) {
    if (!tasksAvailable()) {
      alert('タスク機能を使うには、データベースの更新（cases.tasks 列の追加）が必要です。');
      return;
    }
    taskModalPerson = null;
    taskModalCase = c;
    $('taskModalTitle').textContent = 'タスク：' + (c.theater || '(劇場未入力)');
    openTaskModalCommon();
  }
  function openPersonTaskModal(person) {
    if (store.mode === 'supabase' && !personalTasksSupported) {
      alert('個人タスクを使うには、データベースの更新（personal_tasks テーブルの追加）が必要です。');
      return;
    }
    taskModalCase = null;
    taskModalPerson = person;
    $('taskModalTitle').textContent = '個人タスク：' + person;
    openTaskModalCommon();
  }
  function openTaskModalCommon() {
    renderTaskModalList();
    $('taskNewInput').value = '';
    $('taskNewDue').value = '';
    $('taskModal').classList.remove('hidden');
    setTimeout(() => $('taskNewInput').focus(), 0);
  }
  // タスクの優先度（未設定は「低」＝黒）→ 文字色クラス
  function taskPrio(t) { return (t && (t.priority === 'high' || t.priority === 'mid')) ? t.priority : 'low'; }
  function taskPrioClass(t) { return 'task-prio-' + taskPrio(t); }
  function renderTaskModalList() {
    const tasks = activeTaskList(); if (!tasks) return;
    // 未完了を上に、期限が近い順（元のindexは保持）
    const order = taskDisplayOrder(tasks);
    const ul = $('taskList');
    ul.innerHTML = order.map((i) => {
      const t = tasks[i];
      const p = taskPrio(t);
      const sel = ['high', 'mid', 'low'].map((v) =>
        `<option value="${v}"${v === p ? ' selected' : ''}>${v === 'high' ? '高' : v === 'mid' ? '中' : '低'}</option>`).join('');
      // 期限の色（過ぎている＝赤／3日以内＝オレンジ）は日付の欄そのものに付ける
      const due = taskDue(t);
      const left = (due && !t.done) ? daysBetween(todayStr(), due) : null;
      const dueCls = left === null ? '' : (left < 0 ? ' due-over' : (left <= 3 ? ' due-soon' : ''));
      const dueTitle = left !== null && left < 0 ? '期限を過ぎています' : '期限（いつまで）';
      return `<li class="task-item ${t.done ? 'done' : ''}" draggable="true" data-tidx="${i}">
        <select class="task-prio-select ti-prio" data-taskprio="${i}" title="優先度" aria-label="優先度">${sel}</select>
        <input type="checkbox" class="ti-check" data-taskmodal="${i}" ${t.done ? 'checked' : ''} title="チェックすると完了になります" aria-label="完了">
        <span class="task-text ti-text ${taskPrioClass(t)}" data-tedit="${i}" title="クリックで書き直し／つかんで上下に動かすと並べ替え">${escapeHtml(t.text)}</span>
        <input type="date" class="task-due-input ti-due${dueCls}" data-taskdue="${i}" value="${escapeHtml(due)}" title="${dueTitle}" aria-label="期限">
        <button type="button" class="task-del ti-del" data-taskdel="${i}" aria-label="削除" title="このタスクを削除">×</button>
      </li>`;
    }).join('');
  }
  // ポップアップの内容を保存（案件のタスク or 個人タスク）
  function persistTaskModal() {
    if (taskModalPerson) { savePersonTasks(taskModalPerson); return; }
    persistTaskCase();
  }
  function persistTaskCase() {
    const c = taskModalCase; if (!c) return;
    c.updatedAt = new Date().toISOString();
    if (store.mode === 'local') saveCases();
    persistCase(c);
  }
  function addTaskFromInput() {
    const tasks = activeTaskList(); if (!tasks) return;
    const v = $('taskNewInput').value.trim();
    if (!v) return;
    const prio = ($('taskNewPriority') && $('taskNewPriority').value) || 'low';
    const due = ($('taskNewDue') && $('taskNewDue').value) || '';
    tasks.push({ text: v, done: false, priority: prio, due: due });
    $('taskNewInput').value = '';
    $('taskNewDue').value = '';
    persistTaskModal();
    renderTaskModalList();
    if (taskMode) renderTaskTable();
    $('taskNewInput').focus();
  }

  function refresh() {
    if (calMode) renderCalendar(); else if (aggMode) renderAggTable(); else if (taskMode) renderTaskTable(); else if (purchaseMode) renderPurchaseView(); else render();
    if (calMode || aggMode || purchaseMode) renderStatusChips(); // render()/renderTaskTable() は内部で更新済み
  }

  // 配分 / 粗利率 の手動編集
  function handleAggInput(e) {
    const inp = e.target;
    if (!inp.classList || !inp.classList.contains('agg-input')) return;
    const tr = inp.closest('tr');
    if (!tr) return;
    const c = cases.find((x) => x.id === tr.dataset.caseId);
    if (!c) return;
    const team = loadTeam();
    // 既存の配分データを破壊しないように、デフォルトをマージで初期化
    if (!c.allocations || typeof c.allocations !== 'object') c.allocations = {};
    const hasAny = Object.keys(c.allocations).some((k) => Number(c.allocations[k]) > 0);
    if (!hasAny) {
      const def = defaultAllocations(c, team);
      Object.keys(def).forEach((k) => { if (!(k in c.allocations)) c.allocations[k] = def[k]; });
    }
    if (inp.dataset.field === 'marginRate') {
      const v = Number(inp.value);
      c.marginRate = isNaN(v) ? DEFAULT_MARGIN_RATE : v;
    } else if (inp.dataset.member) {
      const v = Number(inp.value);
      c.allocations[inp.dataset.member] = isNaN(v) ? 0 : v;
    }
    c.updatedAt = new Date().toISOString();
    persistCase(c);
    renderAggTable();
  }
  function addTeamMember() {
    if (staffList) { openMasterDialog('staff'); return; }   // マスターがある時は「🗂 マスター編集」で足す
    const name = prompt('追加する担当者名を入力してください');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const team = loadTeam();
    if (team.indexOf(trimmed) !== -1) { alert('既に登録されています: ' + trimmed); return; }
    team.push(trimmed);
    saveTeam(team);
    renderRPersonBar();   // タイトル横の担当者ボタンも連動
    renderAggTable();
  }
  function removeTeamMember(name) {
    if (staffList) { openMasterDialog('staff'); return; }
    if (!confirm(`担当者「${name}」を削除しますか？\n（各案件の配分データは保持され、再追加すれば復元されます）`)) return;
    saveTeam(loadTeam().filter((m) => m !== name));
    rPersonFilter.delete(name); // 絞り込み中だった場合は外す
    renderRPersonBar();
    renderAggTable();
  }
  function redistributeSmallCases() {
    if (!confirm('300万円未満の案件すべての配分を初期ルールで再計算します。\n（チームメンバーの配分のみ上書き、削除済みメンバーのデータは保持）')) return;
    const team = loadTeam();
    const changed = [];
    cases.forEach((c) => {
      const amt = Number(c.estimateAmount) || 0;
      if (amt > 0 && amt < SMALL_CASE_THRESHOLD) {
        // 削除済みメンバーの保管値を残しつつ、現チームの配分のみ初期化
        const def = defaultAllocations(c, team);
        c.allocations = Object.assign({}, c.allocations || {}, def);
        c.updatedAt = new Date().toISOString();
        changed.push(c);
      }
    });
    persistCases(changed);
    renderAggTable();
  }
  function exportAggregation() {
    const team = loadTeam();
    const targets = aggTargetCases();
    if (targets.length === 0) { alert('対象案件がありません。'); return; }
    const rows = [['区分', '劇場名', '見積り名', '見積り金額', '配分計(%)', '判定', '粗利率(%)', '粗利A'].concat(team)];
    const sections = ['mikomi', 'jisseki', 'yosou'];
    const order = { mikomi: 0, jisseki: 1, yosou: 2 };
    const sectionTotals = {};
    sections.forEach((s) => { sectionTotals[s] = { count: 0, amount: 0, profit: 0, members: {} }; team.forEach((m) => sectionTotals[s].members[m] = 0); });
    targets.slice().sort((a, b) => order[aggSection(a)] - order[aggSection(b)]).forEach((c) => {
      const s = aggSection(c);
      const amt = Number(c.estimateAmount) || 0;
      const rate = (c.marginRate === '' || c.marginRate == null || isNaN(Number(c.marginRate))) ? DEFAULT_MARGIN_RATE : Number(c.marginRate);
      const profit = caseProfit(c);
      const alloc = getAllocations(c, team);
      const sum = sumAllocations(alloc);
      sectionTotals[s].count++; sectionTotals[s].amount += amt; sectionTotals[s].profit += profit;
      team.forEach((m) => sectionTotals[s].members[m] += profit * (Number(alloc[m]) || 0) / 100);
      rows.push([SECTION_DEF[s].label, c.theater, c.estimateName || '-', amt, sum.toFixed(1),
        Math.abs(sum - 100) < 0.01 ? 'OK' : 'NG', rate, Math.round(profit)]
        .concat(team.map((m) => Number(alloc[m]) || 0)));
    });
    // 区分別 集計行
    sections.forEach((s) => {
      const t = sectionTotals[s];
      rows.push([`【${SECTION_DEF[s].label} 集計】`, t.count + '件', '', t.amount, '', '', '', Math.round(t.profit)]
        .concat(team.map((m) => Math.round(t.members[m]))));
    });
    // 個人別 総合計（見込み+実績+予想）
    const grandCount = sections.reduce((s, k) => s + sectionTotals[k].count, 0);
    const grandAmount = sections.reduce((s, k) => s + sectionTotals[k].amount, 0);
    const grandProfit = sections.reduce((s, k) => s + sectionTotals[k].profit, 0);
    const grandMembers = team.map((m) => sections.reduce((s, k) => s + sectionTotals[k].members[m], 0));
    rows.push(['【合計（見込み+実績+予想）】', grandCount + '件', '', grandAmount, '', '', '', Math.round(grandProfit)]
      .concat(grandMembers.map((v) => Math.round(v))));
    downloadCSV(`A集計_${todayStr()}.csv`, rows);
  }

  // ---------- 各劇場情報（支配人・保守契約・パートナー連絡先）モーダル ----------
  function tiCommonName(company) { return company + '（共通）'; }
  function populateTiCompanySelect() {
    const sel = $('tiCompanySelect');
    const prev = sel.value;
    sel.innerHTML = companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}（${escapeHtml(companyAbbr(n))}）</option>`).join('');
    if (prev && companyNames().indexOf(prev) !== -1) sel.value = prev;
    else if (companyNames().length > 0) sel.value = companyNames()[0];
  }
  const tiShowHidden = () => !!($('tiShowHidden') && $('tiShowHidden').checked);
  // 劇場カルテに出す劇場（閉館した劇場は、「閉館した劇場も出す」の時だけ）
  const tiVisibleTheaters = () => theaterMaster.filter((t) => t.name && (!t.closed || tiShowHidden()));
  function populateTiTheaterSearch() {
    const dl = $('tiTheaterAll'); if (!dl) return;
    dl.innerHTML = tiVisibleTheaters().map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.company)}・${escapeHtml(shortTheaterName(t.name))}${t.closed ? '（閉館）' : ''}</option>`).join('');
  }
  // 打った文字から劇場を探して開く（ぴったり → 1つだけ含む の順）
  function tiJumpToTheater(q, final) {
    const n = (s) => String(s || '').replace(/[\s　]/g, '').toLowerCase();
    const key = n(q); if (!key) return false;
    const list = tiVisibleTheaters();
    let hit = list.find((t) => n(t.name) === key);
    tiSearchPick(null);
    if (!hit && final) {
      const part = list.filter((t) => n(t.name).includes(key) || n(shortTheaterName(t.name)).includes(key) || (t.aliases || []).some((a) => n(a).includes(key)));
      if (part.length > 1) { tiSearchPick(part); return true; }   // 「川崎」→ TOHO と 109 の両方 … どちらか選んでもらう
      if (part.length) hit = part[0];
    }
    if (!hit) return false;
    if (tiBulkMode) toggleTiBulkMode();
    $('tiCompanySelect').value = hit.company;
    populateTiTheaterSelect();
    $('tiTheaterSelect').value = hit.name;
    renderTheaterInfo();
    return true;
  }
  // 劇場名で探して候補が2つ以上ある時、入力の下に候補を出す（押すと開く）
  function tiSearchPick(list) {
    const box = $('tiSearchPick'); if (!box) return;
    if (!list || !list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.innerHTML = '<small>どの劇場ですか？</small>' + list.slice(0, 30).map((t) => `<button type="button" data-name="${escapeHtml(t.name)}">${escapeHtml(t.name)}</button>`).join('');
    box.classList.remove('hidden');
  }
  function populateTiTheaterSelect() {
    const company = $('tiCompanySelect').value;
    const sel = $('tiTheaterSelect');
    const prev = sel.value;
    populateTiTheaterSearch();
    const names = tiVisibleTheaters().filter((t) => t.company === company).map((t) => t.name).filter(Boolean);
    // 今開いている劇場は、閉館にした直後でも一覧に残す（開いたまま閉館の情報を直せるように）
    const cur = theaterMaster.find((t) => t.name === prev && t.company === company);
    if (cur && cur.closed && names.indexOf(prev) === -1) names.push(prev);
    // 連絡先にだけある名前も出す。ただし閉館した劇場は「閉館した劇場も出す」の時だけ（今開いている劇場は残す）
    const fromContacts = theaterContacts.filter((c) => c.company === company).map((c) => c.theater).filter(Boolean)
      .filter((n) => { const t = theaterMaster.find((x) => x.name === n); return !(t && t.closed) || tiShowHidden() || n === prev; });
    const list = Array.from(new Set([tiCommonName(company)].concat(names, fromContacts)));
    sel.innerHTML = list.map((n) => { const t = theaterMaster.find((x) => x.name === n); return `<option value="${escapeHtml(n)}" title="${escapeHtml(n)}">${escapeHtml(t ? (shortTheaterName(n) || n) : n)}${t && t.closed ? '（閉館）' : ''}</option>`; }).join('');
    if (prev && list.indexOf(prev) !== -1) sel.value = prev;
    else if (list.length > 0) sel.value = list[0];
  }
  function tiCurrentContacts() {
    const theater = $('tiTheaterSelect').value;
    return theaterContacts
      .filter((c) => c.theater === theater)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  let tiBulkMode = false; // 全体編集（縦=劇場×横=登録項目のグリッド）モード
  // ===== 劇場情報テーブルの列幅ドラッグ（個人設定・localStorage保存） =====
  // 見出しの右端をドラッグすると列幅が変わる。幅はテーブルごと・列ごとにアカウント別で保存。
  // 列を足した表は版を上げて、前に覚えた列幅（列の番号で覚えている）を使わない
  const TM_W_VER = { tiBulkTable: 'v2' };
  function tmWidthKey(tableId) { return userFilterKey('tmColW_' + tableId + (TM_W_VER[tableId] ? '_' + TM_W_VER[tableId] : '')); }
  function loadTmWidths(tableId) {
    try { const o = JSON.parse(localStorage.getItem(tmWidthKey(tableId))); return (o && typeof o === 'object') ? o : {}; }
    catch (e) { return {}; }
  }
  function saveTmWidths(tableId, obj) {
    try { localStorage.setItem(tmWidthKey(tableId), JSON.stringify(obj)); } catch (e) {}
  }
  function applyTmWidths(table) {
    const w = loadTmWidths(table.id);
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, i) => { if (w[i]) th.style.width = w[i] + 'px'; });
  }
  // 列幅リセット（既定の幅に戻す）
  function resetTmWidths(table) {
    try { localStorage.removeItem(tmWidthKey(table.id)); } catch (e) {}
    table.querySelectorAll('thead th').forEach((th) => { th.style.width = ''; });
  }
  function setupTmResizers(table) {
    if (!table || !table.id) return;
    applyTmWidths(table);
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, idx) => {
      if (th.querySelector('.tm-col-resizer')) return;
      const grip = document.createElement('span');
      grip.className = 'tm-col-resizer';
      grip.title = 'ドラッグで列幅を変更';
      th.appendChild(grip);
      grip.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = th.getBoundingClientRect().width;
        document.body.classList.add('tm-resizing');
        const onMove = (ev) => {
          const px = Math.max(60, Math.round(startW + (ev.clientX - startX)));
          th.style.width = px + 'px';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.classList.remove('tm-resizing');
          const w = loadTmWidths(table.id);
          w[idx] = Math.round(th.getBoundingClientRect().width);
          saveTmWidths(table.id, w);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }
  // セルの中身に合わせて高さを広げる（全文が見えるように。手動ドラッグでも変えられる）
  function autoGrowTmCells(root) {
    (root || document).querySelectorAll('textarea.tm-input').forEach((el) => {
      // 画面に出ていない時は高さを測れない（scrollHeight=0）ので触らない。
      // 表示された直後に呼び直す（openTheaterInfoModal 参照）。
      if (el.offsetParent === null) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight + 2, 220) + 'px';
    });
  }

  function renderTiBulkTable() {
    const company = $('tiCompanySelect').value;
    const rows = theaterMaster.filter((t) => t.company === company && t.name);
    const tbody = $('tiBulkBody');
    if (rows.length === 0) {
      tbody.innerHTML = '';
      $('tiBulkEmpty').classList.remove('hidden');
    } else {
      $('tiBulkEmpty').classList.add('hidden');
      const marks = (v) => ['', '○', '×'].map((m) =>
        `<option value="${m}" ${m === (v || '') ? 'selected' : ''}>${m}</option>`).join('');
      tbody.innerHTML = rows.map((t) => `
        <tr data-theater-name="${escapeHtml(t.name)}" class="${t.closed ? 'tib-row-closed' : ''}">
          <td class="tib-name">${escapeHtml(t.name)}</td>
          <td><textarea class="tm-input tib-manager" rows="1">${escapeHtml(t.manager || '')}</textarea></td>
          <td><textarea class="tm-input tib-phone" rows="1">${escapeHtml(t.theaterPhone || '')}</textarea></td>
          <td><select class="tm-input tib-maintenance">${marks(t.maintenance)}</select></td>
          <td><select class="tm-input tib-gem2">${marks(t.gem2)}</select></td>
          <td><select class="tm-input tib-gem2co2">${marks(t.gem2Co2)}</select></td>
          <td><select class="tm-input tib-gem2th">${marks(t.gem2Th)}</select></td>
          <td class="tib-close"><label><input type="checkbox" class="tib-closed" ${t.closed ? 'checked' : ''}> 閉館</label><input type="text" class="tm-input tib-closed-on" value="${escapeHtml(t.closedOn || '')}" placeholder="閉館日"></td>
          <td class="tib-legacy"><textarea class="tm-input tib-equipment" rows="2">${escapeHtml(t.equipment || '')}</textarea></td>
          <td class="tib-legacy"><textarea class="tm-input tib-chronic" rows="2">${escapeHtml(t.chronicIssues || '')}</textarea></td>
          <td class="tib-legacy"><textarea class="tm-input tib-note" rows="2">${escapeHtml(t.infoNote || '')}</textarea></td>
        </tr>
      `).join('');
    }
  }
  function handleTiBulkInput(e) {
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.theaterName) return;
    const entry = theaterMaster.find((t) => t.name === tr.dataset.theaterName);
    if (!entry) return;
    if (e.target.classList.contains('tib-manager')) entry.manager = e.target.value.trim();
    else if (e.target.classList.contains('tib-phone')) entry.theaterPhone = e.target.value.trim();
    else if (e.target.classList.contains('tib-maintenance')) entry.maintenance = e.target.value;
    else if (e.target.classList.contains('tib-gem2')) entry.gem2 = e.target.value;
    else if (e.target.classList.contains('tib-gem2co2')) entry.gem2Co2 = e.target.value;
    else if (e.target.classList.contains('tib-gem2th')) entry.gem2Th = e.target.value;
    else if (e.target.classList.contains('tib-closed')) { entry.closed = e.target.checked; tr.classList.toggle('tib-row-closed', entry.closed); }
    else if (e.target.classList.contains('tib-closed-on')) entry.closedOn = e.target.value.trim();
    else if (e.target.classList.contains('tib-equipment')) entry.equipment = e.target.value;
    else if (e.target.classList.contains('tib-chronic')) entry.chronicIssues = e.target.value;
    else if (e.target.classList.contains('tib-note')) entry.infoNote = e.target.value;
    else return;
    if (store.mode === 'local') saveTheaterMaster(theaterMaster);
    persistTheater(entry);
  }
  function toggleTiBulkMode() {
    tiBulkMode = !tiBulkMode;
    $('tiBulkBtn').textContent = tiBulkMode ? '👤 個別表示に戻る' : '📑 全体編集';
    renderTheaterInfo();
  }
  function renderTheaterInfo() {
    // 表示モード切替: 個別（劇場情報＋連絡先表） / 全体編集（劇場×項目のグリッド）
    $('tiTheaterLabel').classList.toggle('hidden', tiBulkMode);
    $('tiAddContactBtn').classList.toggle('hidden', tiBulkMode);
    $('tiSingleWrap').classList.toggle('hidden', tiBulkMode);
    $('tiBulkWrap').classList.toggle('hidden', !tiBulkMode);
    if (tiBulkMode) {
      $('tiInfoBox').classList.add('hidden');
      $('tiSetupWarn').classList.toggle('hidden', !(store.mode === 'supabase' && !theaterContactsSupported));
      if (window.KARTE) window.KARTE.hide();
      $('tiBulkTable').classList.toggle('karte-on', !!(window.KARTE && window.KARTE.available()));
      renderTiBulkTable();
      return;
    }
    const company = $('tiCompanySelect').value;
    const theater = $('tiTheaterSelect').value;
    const entry = theaterMaster.find((t) => t.name === theater);
    // 劇場情報ボックス: マスターに存在する劇場のみ編集可（（共通）や未登録名は非表示）
    $('tiInfoBox').classList.toggle('hidden', !entry);
    const hb = $('tiHiddenBanner');
    if (hb) {
      hb.classList.toggle('hidden', !(entry && entry.closed));
      if (entry && entry.closed) hb.textContent = `🏚 この劇場は閉館しています${entry.closedOn ? '（' + entry.closedOn + '）' : ''}${entry.closedNote ? '：' + entry.closedNote : ''}。劇場の一覧には出ません（下の「閉館」のチェックを外すと戻ります）。`;
    }
    // 劇場カルテ（持病・注意 / 機器表 / 不具合の履歴 / 備考 / 設備メモ / 連絡先 のタブ）。
    // 会社の（共通）にも出す＝複数劇場の話・どこか分からない話の置き場（カルテで1件ずつ正しい劇場へ移せる）
    const karteOn = !!(window.KARTE && (entry || theater === tiCommonName(company)));
    document.querySelectorAll('#tiInfoBox .karte-legacy').forEach((el) => el.classList.toggle('karte-on', !!(window.KARTE && window.KARTE.available())));
    $('tiSingleWrap').classList.remove('kt-off');
    if (karteOn) window.KARTE.show({ company: company, theater: theater, box: $('karteBox'), contactsEl: $('tiSingleWrap') });
    else if (window.KARTE) window.KARTE.hide();
    if (entry) {
      $('tiManager').value = entry.manager || '';
      $('tiPhone').value = entry.theaterPhone || '';
      $('tiMaintenance').value = entry.maintenance || '';
      $('tiGem2').value = entry.gem2 || '';
      $('tiGem2Co2').value = entry.gem2Co2 || '';
      if ($('tiShortName')) { $('tiShortName').value = entry.shortName || ''; $('tiShortName').placeholder = shortTheaterName(entry.name); }
      $('tiGem2Th').value = entry.gem2Th || '';
      $('tiClosed').checked = !!entry.closed;
      $('tiClosedOn').value = entry.closedOn || '';
      $('tiClosedNote').value = entry.closedNote || '';
      $('tiInfoBox').classList.toggle('ti-is-closed', !!entry.closed);
      $('tiEquipment').value = entry.equipment || '';
      $('tiChronic').value = entry.chronicIssues || '';
      $('tiNote').value = entry.infoNote || '';
      requestAnimationFrame(() => autoGrowTmCells($('tiInfoBox')));
    }
    $('tiSetupWarn').classList.toggle('hidden', !(store.mode === 'supabase' && !theaterContactsSupported));
    const rows = tiCurrentContacts();
    const tbody = $('tiBody');
    if (rows.length === 0) {
      tbody.innerHTML = '';
      $('tiEmpty').classList.remove('hidden');
    } else {
      $('tiEmpty').classList.add('hidden');
      tbody.innerHTML = rows.map((c) => `
        <tr data-contact-id="${escapeHtml(String(c.id))}">
          <td><textarea class="tm-input ti-category" rows="2" placeholder="例: スクリーン系統空調機">${escapeHtml(c.category || '')}</textarea></td>
          <td><textarea class="tm-input ti-maker" rows="2" placeholder="例: ダイキン">${escapeHtml(c.maker || '')}</textarea></td>
          <td><textarea class="tm-input ti-vendor" rows="2" placeholder="例: テクノ空調">${escapeHtml(c.vendor || '')}</textarea></td>
          <td><textarea class="tm-input ti-person" rows="2" placeholder="例: 井上">${escapeHtml(c.person || '')}</textarea></td>
          <td><textarea class="tm-input ti-phone" rows="2" placeholder="例: 080-1237-4363">${escapeHtml(c.phone || '')}</textarea></td>
          <td><textarea class="tm-input ti-email" rows="2" placeholder="例: inoue@japantoa.co.jp">${escapeHtml(c.email || '')}</textarea></td>
          <td><textarea class="tm-input ti-note" rows="2" placeholder="メモ">${escapeHtml(c.note || '')}</textarea></td>
          <td class="ti-ops"><button type="button" class="ti-move-btn" title="別の劇場へ移す">↪ 移す</button><button type="button" class="ti-delete-btn">削除</button></td>
        </tr>
      `).join('');
    }
    // 列幅ドラッグを有効化し、セルの高さを中身に合わせて広げる（全文が見えるように）
    const tbl = tiBulkMode ? $('tiBulkTable') : $('tiTable');
    if (tbl) setupTmResizers(tbl);
    autoGrowTmCells(tbl || document);
  }
  let theaterInfoMode = false;
  async function openTheaterInfoModal() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (intakeMode) exitIntakeMode();
    if (equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
    theaterInfoMode = true;
    populateTiCompanySelect();
    try { theaterContacts = await store.fetchTheaterContacts(); } catch (e) { theaterContacts = []; }
    populateTiTheaterSelect();
    renderTheaterInfo();
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('theaterInfoModal').classList.remove('hidden');
    // 表示されてから測らないと高さが取れないため、描画後にもう一度合わせる
    // （開いた直後だけ2行目が切れていた不具合の修正）
    requestAnimationFrame(() => autoGrowTmCells($('theaterInfoModal')));
  }
  function closeTheaterInfoModal() {
    theaterInfoMode = false;
    if (window.KARTE) window.KARTE.hide();
    $('theaterInfoModal').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }

  // ---------- 劇場情報 自動更新: 要確認キュー（承認/却下） ----------
  const FIELD_LABEL = { equipment: '設備', chronic_issues: '持病/注意', info_note: '備考', manager: '支配人', theater_phone: '劇場連絡先' };
  function pendingItemText(it) {
    if (it.kind === 'contact') {
      const parts = [it.category, it.maker, it.vendor, it.person, it.phone, it.email].filter(Boolean).join(' / ');
      return '【連絡先】' + parts + (it.note ? '（' + it.note + '）' : '');
    }
    return '【' + (FIELD_LABEL[it.field] || it.field) + '】' + (it.value || '');
  }
  async function refreshPendingBadge() {
    if (!isPrivileged(currentUser)) { $('theaterPendingBtn').classList.add('hidden'); return; }
    try { theaterPending = await store.fetchPendingTheaterInfo(); } catch (e) { theaterPending = []; }
    const btn = $('theaterPendingBtn');
    btn.classList.remove('hidden');
    const n = theaterPending.length;
    $('tpBadge').textContent = n ? String(n) : '';
    $('tpBadge').classList.toggle('hidden', !n);
    btn.classList.toggle('has-pending', !!n);
  }
  function renderPendingList() {
    const box = $('tpBody');
    if (!theaterPending.length) {
      box.innerHTML = '';
      $('tpEmpty').classList.remove('hidden');
      $('tpApproveAllBtn').classList.add('hidden');
      return;
    }
    $('tpEmpty').classList.add('hidden');
    $('tpApproveAllBtn').classList.remove('hidden');
    // 劇場ごとにまとめる
    const byTheater = {};
    theaterPending.forEach((it) => { (byTheater[it.theater] = byTheater[it.theater] || []).push(it); });
    box.innerHTML = Object.keys(byTheater).map((th) => {
      const rows = byTheater[th].map((it) => `
        <tr data-pending-id="${escapeHtml(String(it.id))}">
          <td class="tp-actions">
            <button type="button" class="tp-approve primary">承認</button>
            <button type="button" class="tp-reject danger">却下</button>
          </td>
          <td>${escapeHtml(pendingItemText(it))}
            ${it.evidence ? `<div class="tp-evidence">出典: ${escapeHtml(it.evidence)}</div>` : ''}
            ${it.ai_checked_at ? `<div class="tp-ai">🤖 AI: ${({ unsure: '迷う', checking: '判定中' })[it.ai_verdict] || escapeHtml(it.ai_verdict || '')}${it.ai_reason && it.ai_verdict !== 'checking' ? '｜' + escapeHtml(it.ai_reason) : ''}</div>` : ''}</td>
          <td class="tp-conf">${it.confidence != null ? Math.round(Number(it.confidence) * 100) + '%' : ''}</td>
        </tr>`).join('');
      return `<tr class="tp-theater-row"><td colspan="3">🎬 ${escapeHtml(th)}</td></tr>` + rows;
    }).join('');
  }
  // ================= 設備管理台帳（機器の貸出・返却） =================
  let equipMode = false;
  let eqShowReturned = false;
  // 状態: 返却済 / 延滞（返却予定日を過ぎて未返却） / 貸出中
  function eqStatusOf(l) {
    if (l.returnedOn) return { key: 'returned', label: '返却済' };
    if (l.dueOn && l.dueOn < todayStr()) return { key: 'overdue', label: '延滞' };
    return { key: 'lending', label: '貸出中' };
  }
  function eqItemOptions(selectedId, selectedName) {
    const opts = ['<option value="">（選択）</option>'];
    const list = equipItems.filter((it) => it.active || String(it.id) === String(selectedId));
    let matched = false;
    list.forEach((it) => {
      const sel = (String(it.id) === String(selectedId)) || (!selectedId && it.name === selectedName);
      if (sel) matched = true;
      opts.push(`<option value="${escapeHtml(String(it.id))}"${sel ? ' selected' : ''}>${escapeHtml(it.name)}</option>`);
    });
    // マスタから消された機器の記録も名前だけは残す
    if (!matched && selectedName) {
      opts.push(`<option value="" selected>${escapeHtml(selectedName)}（一覧にない機器）</option>`);
    }
    return opts.join('');
  }
  function renderEquipItems() {
    const box = $('eqItemList'); if (!box) return;
    if (!equipItems.length) { box.innerHTML = '<span class="eq-none">機器が登録されていません。</span>'; return; }
    box.innerHTML = equipItems.map((it) => `
      <span class="eq-item-chip${it.active ? '' : ' inactive'}" data-eqitem="${escapeHtml(String(it.id))}">
        <input type="text" class="eq-item-name" value="${escapeHtml(it.name)}" title="名前を直すと保存されます">
        <button type="button" class="eq-item-del" title="削除">×</button>
      </span>`).join('');
  }
  function renderEquipTable() {
    const tbody = $('eqBody'); if (!tbody) return;
    const rows = equipLoans.filter((l) => eqShowReturned || !l.returnedOn);
    tbody.innerHTML = rows.map((l) => {
      const st = eqStatusOf(l);
      return `
      <tr data-eqloan="${escapeHtml(String(l.id))}" class="eq-row-${st.key}">
        <td><select class="tm-input eq-f" data-f="itemId">${eqItemOptions(l.itemId, l.equipmentName)}</select></td>
        <td><input type="text" class="tm-input eq-f" data-f="borrower" value="${escapeHtml(l.borrower)}" placeholder="例: 山口"></td>
        <td><input type="date" class="tm-input eq-f" data-f="lentOn" value="${escapeHtml(l.lentOn)}"></td>
        <td><input type="date" class="tm-input eq-f" data-f="dueOn" value="${escapeHtml(l.dueOn)}"></td>
        <td><input type="date" class="tm-input eq-f" data-f="returnedOn" value="${escapeHtml(l.returnedOn)}"></td>
        <td><span class="eq-badge eq-${st.key}">${st.label}</span></td>
        <td><input type="text" class="tm-input eq-f" data-f="note" value="${escapeHtml(l.note)}" placeholder="持出先など"></td>
        <td class="eq-actions">
          ${l.returnedOn ? '' : '<button type="button" class="eq-return-btn" title="今日の日付で返却にします">返却</button>'}
          <button type="button" class="eq-del-btn danger" title="この記録を削除">削除</button>
        </td>
      </tr>`;
    }).join('');
    $('eqEmpty').classList.toggle('hidden', rows.length > 0);
  }
  function eqFind(id) { return equipLoans.find((x) => String(x.id) === String(id)); }
  async function eqSaveLoan(l) {
    try { await store.updateEquipLoan(l.id, l); }
    catch (e) { alert('保存に失敗しました: ' + (e && e.message ? e.message : e)); }
  }
  async function enterEquipMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (intakeMode) exitIntakeMode();
    equipMode = true;
    try { equipItems = await store.fetchEquipItems(); } catch (e) { equipItems = []; }
    try { equipLoans = await store.fetchEquipLoans(); } catch (e) { equipLoans = []; }
    $('eqSetupWarn').classList.toggle('hidden', !(store.mode === 'supabase' && !equipSupported));
    $('eqShowReturned').checked = eqShowReturned;
    renderEquipItems();
    renderEquipTable();
    $('equipBtn').textContent = '✕ 設備管理台帳を閉じる';
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('equipView').classList.remove('hidden');
  }
  function exitEquipMode() {
    equipMode = false;
    $('equipView').classList.add('hidden');
    $('equipBtn').textContent = '🧰 設備管理台帳';
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  function toggleEquipMode() { if (equipMode) exitEquipMode(); else enterEquipMode(); }

  // ================= 工事予定表（plan.js・菱熱のみ） =================
  let planMode = false;
  function enterPlanMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (intakeMode) exitIntakeMode();
    if (equipMode) exitEquipMode();
    planMode = true;
    document.body.classList.add('plan-active');
    $('planBtn').textContent = '✕ 工事予定表を閉じる';
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    if (window.PLAN) window.PLAN.open();
  }
  function exitPlanMode() {
    planMode = false;
    if (window.PLAN) window.PLAN.close();
    document.body.classList.remove('plan-active');
    $('planBtn').textContent = '🗓 工事予定表';
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  function togglePlanMode() { if (planMode) exitPlanMode(); else enterPlanMode(); }

  // ================= 案件の登録確認（新規か更新か） =================
  // 同じ劇場で近い日程に似た案件があると、メール取込は登録せず case_intake_pending に溜める。
  // ここでボタンを押すと「自動登録」または「既存案件へ自動更新」を実行する。
  let intakeMode = false;
  async function refreshIntakeBadge() {
    const btn = $('intakeBtn'); if (!btn) return;
    if (!isPrivileged(currentUser)) { btn.classList.add('hidden'); return; }
    try { intakePending = await store.fetchIntakePending(); } catch (e) { intakePending = []; }
    btn.classList.remove('hidden');
    const n = intakePending.length;
    $('ikBadge').textContent = n ? String(n) : '';
    $('ikBadge').classList.toggle('hidden', !n);
    btn.classList.toggle('has-pending', !!n);
  }
  function intakeCandHtml(it) {
    const cands = Array.isArray(it.candidates) ? it.candidates : [];
    if (!cands.length) return '<p class="ik-nocand">似ている既存案件は見つかりませんでした（新規の可能性が高いです）。</p>';
    return '<div class="ik-cands"><div class="ik-cands-title">似ている既存案件（更新するならこの中から選ぶ）</div>' +
      cands.map((c) => {
        const name = c.estimate_name || String(c.content || '').slice(0, 40) || '(内容なし)';
        return `<div class="ik-cand">
          <div class="ik-cand-info">
            <span class="ik-cand-date">${escapeHtml(c.received_date || '日付不明')}</span>
            <span class="ik-cand-cat">${escapeHtml(c.category || '種別不明')}</span>
            <span class="ik-cand-status">${escapeHtml(c.status || '')}</span>
            <span class="ik-cand-name">${escapeHtml(name)}</span>
          </div>
          <div class="ik-cand-actions">
            <button type="button" class="mini-btn" data-ik="open" data-case="${escapeHtml(String(c.id))}">案件を見る</button>
            <button type="button" class="mini-btn primary" data-ik="update" data-id="${escapeHtml(String(it.id))}" data-case="${escapeHtml(String(c.id))}">この案件に更新</button>
          </div>
        </div>`;
      }).join('') + '</div>';
  }
  // 登録確認: 候補以外の案件も探す（言葉・会社・劇場・受付日の期間）・案件のR担当者を選び直す（2026-11-24）
  const ikUi = {};
  function ikState(it) {
    const k = String(it.id);
    if (!ikUi[k]) ikUi[k] = { open: false, q: '', company: it.company || '', theater: shortTheaterName(canonTheaterName(it.theater || '', it.company || '')) || '', from: '', to: '', r: '' };
    return ikUi[k];
  }
  function ikSearchHits(it) {
    const st = ikState(it); const q = st.q.trim().toLowerCase(); const th = st.theater.trim();
    return cases.filter((c) => (!st.company || c.company === st.company)
      && (!th || String(c.theater || '').indexOf(th) !== -1 || String(shortTheaterName(c.theater) || '').indexOf(th) !== -1)
      && (!st.from || String(c.receivedDate || '') >= st.from) && (!st.to || String(c.receivedDate || '') <= st.to)
      && (!q || [c.theater, c.title, c.content, c.estimateName, c.memo, c.rPerson].some((v) => String(v || '').toLowerCase().indexOf(q) !== -1)))
      .sort((a, b) => String(b.receivedDate || '').localeCompare(String(a.receivedDate || '')));
  }
  function ikResultsHtml(it) {
    const hits = ikSearchHits(it); const id = escapeHtml(String(it.id));
    if (!hits.length) return '<p class="ik-nocand">条件に合う案件がありません。条件をゆるめてください（会社・劇場を空にすると全部から探します）。</p>';
    return `<div class="ik-cands-title">${hits.length} 件${hits.length > 30 ? '（新しい 30 件を出しています。言葉や期間で絞ってください）' : ''}</div>` + hits.slice(0, 30).map((c) => `<div class="ik-cand">
        <div class="ik-cand-info">
          <span class="ik-cand-date">${escapeHtml(c.receivedDate || '日付不明')}</span>
          <span class="ik-cand-status">${escapeHtml(statusOf(c) || '')}</span>
          <span class="ik-cand-cat">${escapeHtml(shortTheaterName(c.theater) || c.theater || '')}</span>
          <span class="ik-cand-name">${escapeHtml(c.title || c.estimateName || String(c.content || '').slice(0, 40) || '(内容なし)')}</span>
          <span class="ik-cand-cat">R: ${escapeHtml(c.rPerson || '—')}</span>
        </div>
        <div class="ik-cand-actions">
          <button type="button" class="mini-btn" data-ik="open" data-case="${escapeHtml(String(c.id))}">案件を見る</button>
          <button type="button" class="mini-btn primary" data-ik="update" data-id="${id}" data-case="${escapeHtml(String(c.id))}">この案件に更新</button>
        </div></div>`).join('');
  }
  function ikSearchHtml(it) {
    const st = ikState(it); const id = escapeHtml(String(it.id));
    if (!st.open) return `<button type="button" class="mini-btn ik-search-btn" data-ik="search" data-id="${id}">🔎 ほかの案件を探す（候補に無い時）</button>`;
    return `<div class="ik-search" data-iksearch="${id}">
      <div class="ik-search-h">🔎 ほかの案件を探す <button type="button" class="link-btn" data-ik="search" data-id="${id}">閉じる</button></div>
      <div class="ik-search-f">
        <input type="search" class="tm-input" data-iksf="q" data-id="${id}" value="${escapeHtml(st.q)}" placeholder="言葉（案件名・内容・見積り名・劇場名・社内メモ）">
        <select data-iksf="company" data-id="${id}"><option value="">会社: すべて</option>${companies.map((co) => `<option value="${escapeHtml(co.name)}"${st.company === co.name ? ' selected' : ''}>${escapeHtml(co.name)}</option>`).join('')}</select>
        <input type="text" class="tm-input ik-sf-th" data-iksf="theater" data-id="${id}" value="${escapeHtml(st.theater)}" placeholder="劇場（空ならすべて）">
        <label class="ik-sf-d">受付日 <input type="date" data-iksf="from" data-id="${id}" value="${escapeHtml(st.from)}"> 〜 <input type="date" data-iksf="to" data-id="${id}" value="${escapeHtml(st.to)}"></label>
      </div>
      <div class="ik-search-res" data-ikres="${id}">${ikResultsHtml(it)}</div></div>`;
  }
  function handleIntakeInput(e) {
    const f = e.target.closest('[data-iksf]');
    if (f) {
      const it = ikFind(f.dataset.id); if (!it) return;
      // 欄から出た時の change でも描き直すと、押そうとした「この案件に更新」が消えて押せないので、変わった時だけ描き直す
      if (ikState(it)[f.dataset.iksf] === f.value) return;
      ikState(it)[f.dataset.iksf] = f.value;
      document.querySelectorAll(`[data-ikres="${CSS.escape(String(it.id))}"]`).forEach((box) => { box.innerHTML = ikResultsHtml(it); });
      return;
    }
    if (e.type !== 'change') return;
    const r = e.target.closest('[data-ikr]');
    if (r) { const it = ikFind(r.dataset.ikr); if (it) ikState(it).r = r.value; return; }
    const a = e.target.closest('[data-ikassign]');
    if (a && a.value) intakeAssign(a.dataset.ikassign, a.value === '__auto' ? '' : a.value, a);
  }
  async function intakeAssign(id, name, sel) {
    const it = ikFind(id); if (!it) return;
    const K = window.KARTE;
    const msg = name ? `この登録確認を「${name}」さんに回します。${name} さんがログインした時に出ます。よろしいですか？` : 'この登録確認を、自動で決める人（似ている案件のR担当者など）に戻します。よろしいですか？';
    if (!(await K.ask(msg, { ok: name ? '回す' : '戻す', cancel: 'やめる' }))) { sel.value = ''; return; }
    try {
      await store.assignIntakePending(it.id, name, myStaffName() || currentUserName());
      it.assignee = name; it.assigned_by = myStaffName() || currentUserName();
      showToastLite(name ? `${name} さんに回しました` : '自動で決める人に戻しました');
      renderIntakeList();
    } catch (err) { sel.value = ''; K.say('回せませんでした: ' + (err && err.message ? err.message : err)); }
  }
  // 登録確認を決める人（2026-11-20）: 似ている案件のR担当者 → 無ければその劇場で一番新しい案件のR担当者 → だれもいなければ小山
  function intakeOwners(it) {
    if (it.assignee) return { names: [it.assignee], why: it.assigned_by ? it.assigned_by + ' さんが回しました' : '回されました', assigned: true };
    const team = loadTeam();
    const pick = (rp) => team.filter((n) => String(rp || '').includes(n));
    const out = new Set();
    (Array.isArray(it.candidates) ? it.candidates : []).forEach((cd) => {
      const c = cases.find((x) => String(x.id) === String(cd.id));
      pick(c ? c.rPerson : (cd.r_person || '')).forEach((n) => out.add(n));
    });
    if (out.size) return { names: [...out], why: '似ている案件のR担当者' };
    const th = canonTheaterName(it.theater || '', it.company || '');
    const latest = th ? cases.filter((c) => c.theater === th && pick(c.rPerson).length)
      .sort((a, b) => String(b.receivedDate || '').localeCompare(String(a.receivedDate || '')))[0] : null;
    if (latest) return { names: pick(latest.rPerson), why: 'この劇場の一番新しい案件のR担当者' };
    return { names: ['小山'], why: '担当が分からないため' };
  }
  // ログインした人（菱熱の担当者マスターのメールアドレスで見分ける）の苗字
  function myStaffName() {
    const em = String((currentUser && currentUser.email) || '').toLowerCase();
    const me = em && (staffList || []).find((x) => x.active !== false && String(x.email || '').toLowerCase() === em);
    return me ? me.name : '';
  }
  // ログイン・再読み込みの時、自分の分の登録確認があれば、決めるまで一覧の上に出す（× なし。案件を見るのはできる）
  let ikForceOn = false;
  async function checkForcedIntake() {
    if (!realPrivileged(currentUser) || !isPrivileged(currentUser) || store.mode !== 'supabase') return;
    const me = myStaffName(); if (!me) return;
    try { intakePending = await store.fetchIntakePending(); } catch (e) { return; }
    if (!intakePending.some((it) => intakeOwners(it).names.indexOf(me) !== -1)) return;
    ikForceOn = true; renderForcedIntake();
  }
  function renderForcedIntake() {
    let ov = $('ikForce');
    const me = myStaffName();
    const mine = ikForceOn && me ? intakePending.filter((it) => intakeOwners(it).names.indexOf(me) !== -1) : [];
    if (!mine.length) {
      if (ov) { ov.remove(); if (ikForceOn) showToastLite('登録確認が終わりました'); }
      ikForceOn = false; return;
    }
    if (!ov) { ov = document.createElement('div'); ov.id = 'ikForce'; ov.className = 'ik-force'; ov.addEventListener('click', handleIntakeClick); ov.addEventListener('input', handleIntakeInput); ov.addEventListener('change', handleIntakeInput); document.body.appendChild(ov); }
    ov.innerHTML = `<div class="ik-force-panel" role="dialog" aria-modal="true" aria-labelledby="ikForceTitle">
      <div class="ik-force-head"><h2 id="ikForceTitle">🆕 登録確認（${escapeHtml(me)} さんの分 ${mine.length} 件）</h2>
        <p>メール・LINE から来た案件で、新規か更新か AI が迷ったものです。<b>全部「新規」「更新」「破棄」のどれかに決めると、一覧に進めます。</b>「案件を見る」で、似ている案件を開いて確かめられます。</p></div>
      <div class="ik-force-list">${mine.map((it) => intakeItemHtml(it)).join('')}</div></div>`;
  }
  function renderIntakeList() {
    const box = $('ikList'); if (!box) return;
    if (!intakePending.length) {
      box.innerHTML = '';
      $('ikEmpty').classList.remove('hidden');
      renderForcedIntake();
      return;
    }
    $('ikEmpty').classList.add('hidden');
    box.innerHTML = intakePending.map((it) => intakeItemHtml(it)).join('');
    renderForcedIntake();
  }
  function intakeItemHtml(it) {
    const ow = intakeOwners(it);
    return `
      <div class="ik-item" data-id="${escapeHtml(String(it.id))}">
        <div class="ik-head">
          <span class="ik-theater" title="${escapeHtml(it.theater || '')}">🎬 ${escapeHtml(shortTheaterName(canonTheaterName(it.theater || '', it.company || '')) || '(劇場未設定)')}</span>
          <span class="ik-company">${escapeHtml(it.company || '')}</span>
          <span class="ik-date">受付 ${escapeHtml(it.received_date || '-')}</span>
          <span class="ik-cat">${escapeHtml(it.category || '')}</span>
        </div>
        <div class="ik-title">${escapeHtml(it.title || '(件名なし)')}${it.thread_url ? ` <a class="ik-src" href="${escapeHtml(it.thread_url)}" target="_blank" rel="noopener">${/^【LINE】/.test(it.title || '') ? '元のLINEを開く' : /^【Plaud】/.test(it.title || '') ? '元の会議・電話の記録を開く' : '元のメールを開く'}</a>` : ''}</div>
        <div class="ik-content">${escapeHtml(String(it.content || '').slice(0, 500))}</div>
        <div class="ik-owner">👤 確認する人: <b>${escapeHtml(ow.names.join('・'))}</b>（${escapeHtml(ow.why)}）
          <select class="ik-assign" data-ikassign="${escapeHtml(String(it.id))}" title="この登録確認を別の人に回します（その人がログインした時に出ます）">
            <option value="">↪ 別の人に回す…</option>
            ${loadTeam().filter((n) => !(ow.assigned && ow.names.indexOf(n) !== -1)).map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')}
            ${ow.assigned ? '<option value="__auto">（自動で決める人に戻す）</option>' : ''}
          </select></div>
        <div class="ik-rline">🧑‍🔧 案件のR担当者:
          <select data-ikr="${escapeHtml(String(it.id))}" title="新規で登録する時・更新する時に、案件のR担当者をこの人にします">
            <option value="">変えない（新規なら ${escapeHtml(it.r_person || '空欄')}）</option>
            ${loadTeam().map((n) => `<option value="${escapeHtml(n)}"${ikState(it).r === n ? ' selected' : ''}>${escapeHtml(n)}</option>`).join('')}
          </select></div>
        ${it.reason ? `<div class="ik-reason">迷った理由: ${escapeHtml(it.reason)}</div>` : ''}
        ${intakeCandHtml(it)}
        ${ikSearchHtml(it)}
        <div class="ik-actions">
          <button type="button" class="primary" data-ik="new" data-id="${escapeHtml(String(it.id))}">＋ 新規として登録</button>
          <button type="button" class="danger" data-ik="discard" data-id="${escapeHtml(String(it.id))}">破棄（登録しない）</button>
        </div>
      </div>`;
  }
  async function enterIntakeMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
    intakeMode = true;
    try { intakePending = await store.fetchIntakePending(); } catch (e) { intakePending = []; }
    $('ikSetupWarn').classList.toggle('hidden', !(store.mode === 'supabase' && !intakePendingSupported));
    renderIntakeList();
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('intakeView').classList.remove('hidden');
  }
  function exitIntakeMode() {
    intakeMode = false;
    $('intakeView').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
    refreshIntakeBadge();
  }
  function toggleIntakeMode() { if (intakeMode) exitIntakeMode(); else enterIntakeMode(); }
  function ikFind(id) { return intakePending.find((x) => String(x.id) === String(id)); }
  // 「新規として登録」: 確認待ちの内容で案件を作る（メール由来なのでLINEは「自動登録」）
  async function intakeRegisterNew(it) {
    const today = todayStr();
    const c = {
      id: genId(),
      company: it.company || '', theater: it.theater || '',
      title: it.title || '',
      receivedDate: it.received_date || today,
      tcPerson: it.tc_person || '', rPerson: ikState(it).r || it.r_person || '',
      category: it.category || '',
      content: '',
      memo: '【AI自動登録 ' + today + '】（登録確認で「新規」を選択）\n' + String(it.content || ''),
      surveyDate: it.survey_date || '', quoteDate: it.quote_date || '',
      workStartDate: it.work_start_date || '', workEndDate: it.work_end_date || '',
      estimateName: '', estimateAmount: '', certNumber: '',
      invoiceDate: '', paymentDate: '',
      marginRate: DEFAULT_MARGIN_RATE, allocations: {}, tasks: [],
      customerMemo: '', adviceNote: '', purchases: [],
      updatedAt: new Date().toISOString()
    };
    // LINE・Plaud の話（進み具合）は社内アドバイスへ（AI の要約はしない・LINE 通知もしない。2026-11-19）
    if (/^【(LINE|Plaud)】/.test(it.title || '') && String(it.progress_note || '').trim()) {
      c.adviceNote = '【' + (/^【Plaud】/.test(it.title) ? 'Plaud' : 'LINE') + '自動登録 ' + today + '】\n' + String(it.progress_note).trim();
    }
    cases.push(c);
    await persistCase(c, 'auto');   // 社内メモ→内容のAI要約はサーバ側(webhook)が行う
    await store.decideIntakePending(it.id, 'registered', c.id);
    intakePending = intakePending.filter((x) => String(x.id) !== String(it.id));
    renderIntakeList(); refreshIntakeBadge(); render();
  }
  // 「この案件に更新」: 選んだ既存案件の社内メモへ追記し、空の日程だけ埋める
  async function intakeApplyUpdate(it, caseId) {
    const c = cases.find((x) => String(x.id) === String(caseId));
    if (!c) { window.KARTE.say('対象の案件が見つかりませんでした。画面を再読み込みしてください。'); return; }
    const today = todayStr();
    const note = String(it.progress_note || it.content || '').trim();
    const conv = /^【(LINE|Plaud)】/.test(it.title || '');
    const block = '【' + (conv ? (/^【Plaud】/.test(it.title) ? 'Plaud' : 'LINE') + '自動更新' : 'AI自動更新') + ' ' + today + '】（登録確認で「更新」を選択）\n' + note;
    // LINE・Plaud の話は社内アドバイスへ（要約しない・LINE 通知しない）。メールは今までどおり社内メモへ
    if (conv) c.adviceNote = c.adviceNote ? (c.adviceNote + '\n\n' + block) : block;
    else c.memo = c.memo ? (c.memo + '\n\n' + block) : block;
    // 空いている日程だけ、メールから拾った日付で埋める（既存の手入力は上書きしない）
    if (it.survey_date && !c.surveyDate) c.surveyDate = it.survey_date;
    if (it.quote_date && !c.quoteDate) c.quoteDate = it.quote_date;
    if (it.work_start_date && !c.workStartDate) c.workStartDate = it.work_start_date;
    if (it.work_end_date && !c.workEndDate) c.workEndDate = it.work_end_date;
    if (ikState(it).r) c.rPerson = ikState(it).r;   // 登録確認で選び直したR担当者（2026-11-24）
    c.updatedAt = new Date().toISOString();
    await persistCase(c, 'auto');
    await store.decideIntakePending(it.id, 'updated', c.id);
    intakePending = intakePending.filter((x) => String(x.id) !== String(it.id));
    renderIntakeList(); refreshIntakeBadge(); render();
  }

  let theaterPendingMode = false;
  async function openTheaterPendingModal() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (intakeMode) exitIntakeMode();
    if (equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
    theaterPendingMode = true;
    try { theaterPending = await store.fetchPendingTheaterInfo(); } catch (e) { theaterPending = []; }
    $('tpSetupWarn').classList.toggle('hidden', !(store.mode === 'supabase' && !theaterPendingSupported));
    renderPendingList();
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('theaterPendingModal').classList.remove('hidden');
  }
  function closeTheaterPendingModal() {
    theaterPendingMode = false;
    $('theaterPendingModal').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
    refreshPendingBadge();
  }
  function tpFind(id) { return theaterPending.find((x) => String(x.id) === String(id)); }
  async function approvePending(it, silent) {
    try {
      await store.approvePendingTheaterInfo(it);
      theaterPending = theaterPending.filter((x) => String(x.id) !== String(it.id));
      if (!silent) { renderPendingList(); }
    } catch (e) { onPersistError(e); }
  }
  async function handlePendingClick(e) {
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.pendingId) return;
    const it = tpFind(tr.dataset.pendingId);
    if (!it) return;
    if (e.target.classList.contains('tp-approve')) {
      await approvePending(it, false);
    } else if (e.target.classList.contains('tp-reject')) {
      try {
        await store.rejectPendingTheaterInfo(it.id);
        theaterPending = theaterPending.filter((x) => String(x.id) !== String(it.id));
        renderPendingList();
      } catch (err) { onPersistError(err); }
    }
  }
  // 🤖 AIでまとめて判定（/api/theater-ai task=review をくり返し呼ぶ。1回で3劇場ずつ＝サーバーの5分の上限に余裕を持たせる）
  let tpAiRunning = false;
  async function runPendingAiReview() {
    if (tpAiRunning) return;
    if (store.mode !== 'supabase') { alert('AIの判定は本番（Supabase）でだけ使えます。'); return; }
    const todo = theaterPending.filter((x) => !x.ai_checked_at).length;
    if (!todo) { alert('AIがまだ見ていない候補はありません（残っているのは AI が迷ったものです）。'); return; }
    tpAiRunning = true;
    const btn = $('tpAiBtn'), msg = $('tpAiMsg');
    btn.disabled = true;
    const sum = { add: 0, dup: 0, wrong: 0, unsure: 0, error: 0 };
    let token = '';
    try { const { data } = await sb.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch (e) {}
    let last = -1, rounds = 0;
    try {
      while (rounds++ < 60) {
        msg.textContent = `AI（Opus）が判定しています…（3劇場ずつ・1回1〜2分。この画面は開いたままにしてください。残り ${last < 0 ? todo : last} 件／ここまで入れた ${sum.add} 件）`;
        const r = await fetch('/api/theater-ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ task: 'review', maxGroups: 3 }) });
        let j = null; try { j = await r.json(); } catch (e) { j = null; }
        if (!r.ok || !j || !j.ok) throw new Error((j && (j.error + (j.detail ? '（' + j.detail + '）' : ''))) || ('通信に失敗しました（' + r.status + '）'));
        Object.keys(sum).forEach((k) => { sum[k] += (j.tally && j.tally[k]) || 0; });
        if (!j.remaining || j.checked === 0 || j.remaining === last) break;
        last = j.remaining;
      }
      msg.textContent = `✅ 判定しました: 劇場カルテに入れた ${sum.add} 件／重複で除いた ${sum.dup} 件／間違いで除いた ${sum.wrong} 件／迷うので残した ${sum.unsure} 件` + (sum.error ? `／うまく反映できなかった ${sum.error} 件` : '');
    } catch (e) {
      msg.textContent = '⚠ 途中で止まりました: ' + (e.message || e) + `（ここまで: 入れた ${sum.add}／除いた ${sum.dup + sum.wrong}／残した ${sum.unsure}）`;
    } finally {
      tpAiRunning = false; btn.disabled = false;
      try { theaterPending = await store.fetchPendingTheaterInfo(); } catch (e) {}
      renderPendingList();
      refreshPendingBadge();
    }
  }
  async function approveAllPending() {
    if (!theaterPending.length) return;
    const okAll = window.KARTE ? await window.KARTE.ask(`未確認の${theaterPending.length}件すべてを承認して劇場カルテに入れますか？`, { ok: 'すべて承認' }) : confirm(`未確認の${theaterPending.length}件すべてを承認して本登録しますか？`);
    if (!okAll) return;
    const items = theaterPending.slice();
    for (const it of items) { await approvePending(it, true); }
    renderPendingList();
    if (window.KARTE) window.KARTE.say('承認が完了しました。'); else alert('承認が完了しました。');
  }

  // 劇場情報（支配人・連絡先など）の編集 → theaters に保存
  function handleTheaterInfoFieldChange() {
    const theater = $('tiTheaterSelect').value;
    const entry = theaterMaster.find((t) => t.name === theater);
    if (!entry) return;
    entry.manager = $('tiManager').value.trim();
    entry.theaterPhone = $('tiPhone').value.trim();
    entry.maintenance = $('tiMaintenance').value;
    entry.gem2 = $('tiGem2').value;
    entry.gem2Co2 = $('tiGem2Co2').value;
    if ($('tiShortName')) { const sn = $('tiShortName').value.trim(); if (sn !== (entry.shortName || '')) { entry.shortName = sn; tmShortCache.src = null; populateTiTheaterSelect(); } }
    entry.gem2Th = $('tiGem2Th').value;
    const wasClosed = !!entry.closed;
    entry.closed = $('tiClosed').checked;
    entry.closedOn = $('tiClosedOn').value.trim();
    entry.closedNote = $('tiClosedNote').value.trim();
    entry.equipment = $('tiEquipment').value;
    entry.chronicIssues = $('tiChronic').value;
    entry.infoNote = $('tiNote').value;
    if (store.mode === 'local') saveTheaterMaster(theaterMaster);
    persistTheater(entry);
    if (wasClosed !== entry.closed) { populateTiTheaterSelect(); renderTheaterInfo(); }
    else {
      const hb = $('tiHiddenBanner');
      if (hb && entry.closed) hb.textContent = `🏚 この劇場は閉館しています${entry.closedOn ? '（' + entry.closedOn + '）' : ''}${entry.closedNote ? '：' + entry.closedNote : ''}。劇場の一覧には出ません（下の「閉館」のチェックを外すと戻ります）。`;
    }
  }
  function tiFindContact(id) {
    return theaterContacts.find((c) => String(c.id) === String(id));
  }
  function handleTheaterInfoTableInput(e) {
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.contactId) return;
    const c = tiFindContact(tr.dataset.contactId);
    if (!c) return;
    if (e.target.classList.contains('ti-category')) c.category = e.target.value;
    else if (e.target.classList.contains('ti-maker')) c.maker = e.target.value;
    else if (e.target.classList.contains('ti-vendor')) c.vendor = e.target.value;
    else if (e.target.classList.contains('ti-person')) c.person = e.target.value;
    else if (e.target.classList.contains('ti-phone')) c.phone = e.target.value;
    else if (e.target.classList.contains('ti-email')) c.email = e.target.value;
    else if (e.target.classList.contains('ti-note')) c.note = e.target.value;
    else return;
    Promise.resolve(store.updateTheaterContact(c)).catch(onPersistError);
  }
  async function handleTheaterInfoTableClick(e) {
    if (e.target.classList.contains('ti-move-btn') && window.KARTE) {
      const tr0 = e.target.closest('tr');
      const c0 = tr0 && tiFindContact(tr0.dataset.contactId);
      if (!c0) return;
      try {
        const to = await window.KARTE.moveContact(c0);
        if (to) { c0.theater = to.theater; c0.company = to.company; if (store.mode === 'local') saveTheaterContactsLocal(theaterContacts); renderTheaterInfo(); }
      } catch (err) { onPersistError(err); }
      return;
    }
    if (!e.target.classList.contains('ti-delete-btn')) return;
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.contactId) return;
    const c = tiFindContact(tr.dataset.contactId);
    if (!c) return;
    const label = [c.category, c.vendor, c.person].filter(Boolean).join(' / ') || '(未入力)';
    const okDel = window.KARTE ? await window.KARTE.ask(`連絡先「${label}」を削除しますか？`, { ok: '🗑 削除', danger: true }) : confirm(`連絡先「${label}」を削除しますか？`);
    if (!okDel) return;
    theaterContacts = theaterContacts.filter((x) => String(x.id) !== String(c.id));
    Promise.resolve(store.deleteTheaterContact(c.id)).catch(onPersistError);
    renderTheaterInfo();
  }
  async function addTheaterContactRow() {
    const company = $('tiCompanySelect').value;
    const theater = $('tiTheaterSelect').value;
    if (!company || !theater) { alert('先に会社と劇場を選択してください'); return; }
    if (store.mode === 'supabase' && !theaterContactsSupported) {
      alert('データベース未設定です。SETUP_THEATER_INFO.md のSQLをSupabaseで実行してください。');
      return;
    }
    const maxOrder = tiCurrentContacts().reduce((m, c) => Math.max(m, c.sortOrder || 0), 0);
    const rec = { id: 'local-' + Date.now(), company: company, theater: theater, category: '', maker: '', vendor: '', person: '', phone: '', email: '', note: '', sortOrder: maxOrder + 10 };
    theaterContacts.push(rec);
    try { await store.insertTheaterContact(rec); } catch (e) { onPersistError(e); }
    renderTheaterInfo();
    setTimeout(() => {
      const rows = $('tiBody').querySelectorAll('tr');
      if (rows.length > 0) {
        const firstInput = rows[rows.length - 1].querySelector('.ti-category');
        if (firstInput) firstInput.focus();
      }
    }, 50);
  }

  // ---------- 客先マスター（劇場・住所）モーダル ----------
  function populateTheaterMasterCompanySelect() {
    const sel = $('tmCompanySelect');
    const prev = sel.value;
    sel.innerHTML = companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}（${escapeHtml(companyAbbr(n))}）</option>`).join('');
    if (prev && companyNames().indexOf(prev) !== -1) sel.value = prev;
    else if (companyNames().length > 0) sel.value = companyNames()[0];
  }
  function renderTheaterMasterTable() {
    const company = $('tmCompanySelect').value;
    const rows = theaterMaster.map((t, idx) => ({ t, idx })).filter((x) => x.t.company === company);
    const tbody = $('tmBody');
    if (rows.length === 0) {
      tbody.innerHTML = '';
      $('tmEmpty').classList.remove('hidden');
    } else {
      $('tmEmpty').classList.add('hidden');
      tbody.innerHTML = rows.map(({ t, idx }) => `
        <tr data-master-idx="${idx}">
          <td><input type="text" class="tm-input tm-name" value="${escapeHtml(t.name)}" placeholder="例: TOHOシネマズ 新宿"></td>
          <td><input type="text" class="tm-input tm-address" value="${escapeHtml(t.address || '')}" placeholder="例: 東京都新宿区歌舞伎町1-19-1"></td>
          <td><button type="button" class="tm-delete-btn">削除</button></td>
        </tr>
      `).join('');
    }
  }
  function renderHqInfo() {
    const company = $('tmCompanySelect').value;
    const c = companies.find((x) => x.name === company);
    const ro = !isPrivileged(currentUser); // TOHO は閲覧のみ
    $('tmHqOfficialName').value = c ? (c.officialName || '') : '';
    $('tmHqAddress').value      = c ? (c.hqAddress || '')    : '';
    $('tmHqOfficialName').readOnly = ro;
    $('tmHqAddress').readOnly      = ro;
    $('tmHqColor').value = (c && c.color) ? c.color : '#e2e8f0';
    $('tmHqColor').disabled = ro;
    $('tmHqColorClear').disabled = ro;
  }
  function setCompanyColor(colorVal) {
    if (!isPrivileged(currentUser)) return;
    const name = $('tmCompanySelect').value;
    const c = companies.find((x) => x.name === name);
    if (!c) return;
    if (!companyColorAvailable()) {
      alert('会社の色を保存するには、データベースの更新（companies.color 列の追加）が必要です。');
      renderHqInfo();
      return;
    }
    c.color = colorVal || '';
    if (store.mode === 'local') saveCompanies(companies);
    persistCompanyInfo(name);
    renderHqInfo();
    render();
  }
  function openTheaterMasterModal() {
    populateTheaterMasterCompanySelect();
    renderHqInfo();
    renderTheaterMasterTable();
    $('theaterMasterModal').classList.remove('hidden');
  }
  function closeTheaterMasterModal() {
    $('theaterMasterModal').classList.add('hidden');
    renderDatalists(); // 編集結果を即サジェストへ反映
  }
  async function persistCompanyInfo(name) {
    const c = companies.find((x) => x.name === name);
    if (!c) return;
    if (store.mode === 'local') { saveCompanies(companies); return; }
    try { await store.updateCompanyInfo(name, { officialName: c.officialName, hqAddress: c.hqAddress, color: c.color != null ? c.color : '' }); }
    catch (e) { onPersistError(e); }
  }
  function handleHqOfficialNameChange() {
    const name = $('tmCompanySelect').value;
    const c = companies.find((x) => x.name === name);
    if (!c) return;
    c.officialName = $('tmHqOfficialName').value.trim();
    persistCompanyInfo(name);
  }
  function handleHqAddressChange() {
    const name = $('tmCompanySelect').value;
    const c = companies.find((x) => x.name === name);
    if (!c) return;
    c.hqAddress = $('tmHqAddress').value.trim();
    persistCompanyInfo(name);
  }
  async function persistTheater(t) {
    try { await store.upsertTheater(t); }
    catch (e) { onPersistError(e); }
  }
  async function removeTheater(name) {
    try { await store.deleteTheater(name); }
    catch (e) { onPersistError(e); }
  }
  function handleTheaterMasterInput(e) {
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.masterIdx) return;
    const idx = parseInt(tr.dataset.masterIdx, 10);
    const entry = theaterMaster[idx];
    if (!entry) return;
    const oldName = entry.name;
    if (e.target.classList.contains('tm-name')) {
      entry.name = e.target.value.trim();
      // 名前がリネームされた場合: 旧キーを削除 → 新エントリ保存
      if (oldName && oldName !== entry.name) {
        removeTheater(oldName);
      }
    } else if (e.target.classList.contains('tm-address')) {
      entry.address = e.target.value.trim();
    }
    saveTheaterMaster(theaterMaster);
    persistTheater(entry);
  }
  function handleTheaterMasterClick(e) {
    if (!e.target.classList.contains('tm-delete-btn')) return;
    const tr = e.target.closest('tr');
    if (!tr) return;
    const idx = parseInt(tr.dataset.masterIdx, 10);
    const entry = theaterMaster[idx];
    if (!entry) return;
    if (!confirm(`劇場「${entry.name || '(無名)'}」をマスターから削除しますか？\n（既存案件への影響はありません）`)) return;
    if (entry.name) removeTheater(entry.name);
    theaterMaster.splice(idx, 1);
    saveTheaterMaster(theaterMaster);
    renderTheaterMasterTable();
  }
  function addTheaterRow() {
    const company = $('tmCompanySelect').value;
    if (!company) { alert('先に会社を選択してください'); return; }
    theaterMaster.push({ name: '', company: company, address: '' });
    saveTheaterMaster(theaterMaster);
    renderTheaterMasterTable();
    // 追加した行の名前入力にフォーカス
    setTimeout(() => {
      const rows = $('tmBody').querySelectorAll('tr');
      if (rows.length > 0) {
        const lastInput = rows[rows.length - 1].querySelector('.tm-name');
        if (lastInput) lastInput.focus();
      }
    }, 50);
  }
  async function deleteCompanyFromMaster() {
    const name = $('tmCompanySelect').value;
    if (!name) { alert('削除する会社を選択してください'); return; }
    if (companyNames().length <= 1) { alert('会社が1社のため削除できません（最低1社必要です）。'); return; }
    // この会社を参照している案件数を数えて警告
    const usedBy = cases.filter((c) => c.company === name).length;
    const theaterCnt = theaterMaster.filter((t) => t.company === name).length;
    let msg = `会社「${name}」を客先マスターから削除します。\n`;
    msg += `・この会社の登録劇場 ${theaterCnt} 件も一緒に削除されます。\n`;
    if (usedBy > 0) {
      msg += `\n⚠ この会社を使っている案件が ${usedBy} 件あります。\n`;
      msg += `案件自体は消えませんが、その会社名はマスターから無くなり、\n`;
      msg += `一覧の色分けや請求書の宛先が正しく出なくなる場合があります。\n`;
    }
    msg += `\n本当に削除しますか？`;
    if (!confirm(msg)) return;

    try {
      await store.deleteCompanyRemote(name);
    } catch (err) {
      onPersistError(err);
      return;
    }
    // この会社の劇場をマスターから削除（DB側も）
    const ownTheaters = theaterMaster.filter((t) => t.company === name && t.name);
    for (const t of ownTheaters) { removeTheater(t.name); }
    theaterMaster = theaterMaster.filter((t) => t.company !== name);
    saveTheaterMaster(theaterMaster);
    // 会社マスタから削除
    companies = companies.filter((c) => c.name !== name);
    if (store.mode === 'local') saveCompanies(companies);
    // UI再構築
    populateCompanySelects();
    populateTheaterMasterCompanySelect();
    renderHqInfo();
    renderTheaterMasterTable();
    renderDatalists();
    refresh();
  }

  // ---------- screens ----------
  function showLogin() {
    document.body.classList.remove('booting');
    $('appShell').classList.add('hidden');
    $('loginScreen').classList.remove('hidden');
    // ログインペインに戻す（前回サインアップ画面のままだったケースの保険）
    if ($('loginPane')) $('loginPane').classList.remove('hidden');
    if ($('signupPane')) $('signupPane').classList.add('hidden');
    setTimeout(() => $('loginEmail').focus(), 50);
  }
  function showApp() {
    document.body.classList.remove('booting');
    $('loginScreen').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    // A集計モードのまま再ログイン等した場合は通常表示へ戻す
    if (aggMode) exitAggMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (intakeMode) exitIntakeMode();
    if (equipMode) exitEquipMode();
    if (typeof planMode !== 'undefined' && planMode) exitPlanMode();
    applyUserScope();
    render();
    requestAnimationFrame(fitTableHeight); // 表の高さを画面の残りに合わせる
    loadMyAccount();
    loadStaff();
    // 「タスク管理」ボタンの件数に個人タスクも入れるため、ログイン時に読み込んでおく
    if (isPrivileged(currentUser)) {
      store.fetchPersonalTasks().then((map) => { personalTasks = map || {}; updateTaskBadge(); }).catch(() => {});
    }
    maybeOpenCaseFromUrl();
    refreshPendingBadge(); // 劇場情報 自動更新の未確認件数バッジ（菱熱のみ）
    refreshIntakeBadge();  // 登録確認（新規か更新か）の件数バッジ（菱熱のみ）
    maybeOpenIntakeFromUrl();
  }
  // LINE通知の「?intake=1」付きURLで開いた時、登録確認の画面を直接開く
  function maybeOpenIntakeFromUrl() {
    try {
      const params = new URLSearchParams(location.search);
      if (!params.get('intake')) return;
      if (isPrivileged(currentUser)) enterIntakeMode();
      params.delete('intake');
      const qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { /* noop */ }
  }
  // LINE通知などの「?case=<id>」付きURLで開いた時、その案件の編集画面を直接開く
  function maybeOpenCaseFromUrl() {
    try {
      const params = new URLSearchParams(location.search);
      const id = params.get('case');
      if (!id) return;
      const c = cases.find((x) => String(x.id) === String(id));
      if (c) openModal(c, 'full');
      // 再描画・再読込で二重に開かないよう、URLから case パラメータだけ除去（他のパラメータは保持）
      params.delete('case');
      const qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { /* noop */ }
  }
  // タイトル横の R担当者 ボタン（全員＋各担当者）。クリックでその担当者の案件に絞る（AND）
  // 絞り込みの保持（アカウント別）
  function userFilterKey(base) { return base + '_' + ((currentUser && currentUser.email) || 'anon') + (meetingActive(currentUser) ? '#meeting:' + meetingCompany : ''); }
  function saveUserFilter(base, set) { try { localStorage.setItem(userFilterKey(base), JSON.stringify([...set])); } catch (e) {} }
  function loadSavedFilters() {
    try { const a = JSON.parse(localStorage.getItem(userFilterKey('rpfV1')) || '[]'); rPersonFilter = new Set(Array.isArray(a) ? a : []); } catch (e) {}
    const fill = (base, set) => {
      try { const a = JSON.parse(localStorage.getItem(userFilterKey(base)) || '[]'); set.clear(); (Array.isArray(a) ? a : []).forEach((x) => set.add(x)); } catch (e) {}
    };
    fill('coFV1', companyFilter);
    fill('calCoV1', calCompanyFilter);
    fill('calRpV1', calPersonFilter);
  }
  function renderCompanyBar() {
    const bar = $('companyBar');
    if (!bar) return;
    let html = `<button type="button" class="rperson-btn co-btn${companyFilter.size === 0 ? ' active' : ''}" data-co="">全社</button>`;
    html += companyNames().map((n) =>
      `<button type="button" class="rperson-btn co-btn${companyFilter.has(n) ? ' active' : ''}" data-co="${escapeHtml(n)}">${escapeHtml(companyAbbr(n))}</button>`
    ).join('');
    bar.innerHTML = html;
  }
  function renderRPersonBar() {
    const bar = $('rPersonBar');
    if (!bar) return;
    const team = loadTeam();
    const allActive = rPersonFilter.size === 0;
    let html = `<button type="button" class="rperson-btn${allActive ? ' active' : ''}" data-rperson="">全員</button>`;
    html += team.map((n) =>
      `<button type="button" class="rperson-btn${rPersonFilter.has(n) ? ' active' : ''}" data-rperson="${escapeHtml(n)}">${escapeHtml(n)}</button>`
    ).join('');
    // 異動・退職の人で、未完了の案件が残っている人（付け替えると消える）
    if (isPrivileged(currentUser)) leftStaff().forEach((n) => {
      const k = openCasesOf(n).length; if (!k) return;
      html += `<button type="button" class="rperson-btn rp-left${rPersonFilter.has(n) ? ' active' : ''}" data-rperson="${escapeHtml(n)}" title="異動・退職。未完了の案件を別の担当者に付け替えてください">${escapeHtml(n)}（異動・退職）⚠ ${k}件</button>`;
    });
    bar.innerHTML = html;
    renderReassignBar();
  }
  // 客先ログインでは社内用のボタンが消えるため、中身が無くなった「☰ その他」の区切り・ボタン自体を隠す
  // （閉じた小窓の中は offsetParent が取れないので、各ボタン自身の display で判定する）
  function hideEmptyToolbarGroups() {
    const shown = (el) => getComputedStyle(el).display !== 'none';
    let any = false;
    document.querySelectorAll('#moreMenu .pop-group').forEach((g) => {
      if (g.classList.contains('m-only') && !isMobile()) { g.classList.add('hidden'); return; }
      const has = [...g.querySelectorAll('.pop-item:not(.m-hidden)')].some(shown);
      g.classList.toggle('hidden', !has);
      if (has) any = true;
    });
    $('moreWrap').classList.toggle('hidden', !any);
  }
  function applyUserScope() {
    $('userEmail').textContent = currentUser.email;
    // 打合せモード（菱熱の人だけが使える）
    const meeting = meetingActive(currentUser);
    document.body.classList.toggle('meeting-mode', meeting);
    $('meetingBtn').classList.toggle('hidden', !realPrivileged(currentUser) || meeting);
    $('meetingEndBtn').classList.toggle('hidden', !meeting);
    $('meetingInfo').classList.toggle('hidden', !meeting);
    $('meetingInfo').textContent = meeting ? '🤝 打合せモード中：' + meetingCompany + ' の画面' : '';
    const av = document.querySelector('#userMenuBtn .hdr-av'); if (av) av.textContent = meeting ? '🤝' : '👤';
    $('userMenuBtn').title = currentUser.email + '（表示倍率・列の並び・ログアウト）';
    loadSavedFilters(); // アカウント別に最後の絞り込みを復元
    seedDefaultStatusFilter(); // ログイン時は「完了・取り下げ」を非表示（チェック外し）で開始
    renderCompanyBar();
    const privileged = isPrivileged(currentUser);
    document.body.classList.toggle('user-privileged', privileged);
    document.body.classList.toggle('user-toho', !privileged);
    const appTitleText = privileged ? 'シネマ案件管理' : (customerCompany(currentUser) + ' 案件管理');
    $('appTitle').textContent = appTitleText;
    document.title = appTitleText;   // ブラウザのタブ名も合わせる
    renderRPersonBar();
    // status filter のラベル差し替え（受発注で呼称が変わる項目のみ）
    $('statusFilter').querySelectorAll('option').forEach(opt => {
      if (opt.value) opt.textContent = statusDisplayLabel(opt.value);
    });
    // 顧客メモの表示名（菱熱=顧客メモ / 客先=○○メモ）をヘッダ・フォームに反映
    document.querySelectorAll('.customer-memo-label').forEach((el) => { el.textContent = customerMemoLabel(); });
    // 客先の「TC担当者」表示名を会社別に（TOHO=TC担当者 / 東急レク=109担当者 / UC=UC担当者）
    if (!privileged) {
      const tcLabel = customerLabel('担当者');
      document.querySelectorAll('.tc-label').forEach((el) => { el.textContent = tcLabel; });
      // 内容(content)は客先は閲覧のみ（AI要約の結果）。フォームでも編集不可に
      const contentTa = $('content'); if (contentTa) { contentTa.readOnly = true; }
      // 客先には 登録/編集フォームの入力例（プレースホルダ）を出さない
      document.querySelectorAll('#caseForm input, #caseForm textarea').forEach((el) => { el.placeholder = ''; });
      // 客先には 担当者の入力履歴（サジェスト）を出さない
      ['tcPerson', 'rPerson'].forEach((id) => { const el = $(id); if (el) el.removeAttribute('list'); });
    } else {
      const contentTa = $('content'); if (contentTa) { contentTa.readOnly = false; }
    }
    applyHScrollPos(); // 横スクロールバー位置の個人設定を反映
    requestAnimationFrame(hideEmptyToolbarGroups); // 空になったグループ枠を隠す
  }

  // ---------- handlers ----------
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('loginError');
    const submitBtn = $('loginForm').querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const res = await store.signIn($('loginEmail').value, $('loginPassword').value);
      if (!res.ok) { errEl.textContent = res.msg; errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');
      currentUser = res.user;
      if (store.mode === 'local') saveAuth(currentUser); // Supabaseはセッションを自前で永続化
      $('loginPassword').value = '';
      try { cases = await store.fetchCases(); } catch (err) { cases = []; onPersistError(err); }
      companies = await store.fetchCompanies();
      try { theaterMaster = await store.fetchTheaterMaster(); } catch (e) {}
      populateCompanySelects();
      store.subscribe(onRemoteChange);
      showApp();
    } catch (err) {
      errEl.textContent = 'ログイン処理でエラーが発生しました: ' + (err && err.message ? err.message : err);
      errEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---------- 新規アカウント作成（許可ドメイン限定） ----------
  function showLoginPane() {
    $('loginPane').classList.remove('hidden');
    $('signupPane').classList.add('hidden');
    $('signupError').classList.add('hidden');
    $('signupSuccess').classList.add('hidden');
  }
  function showSignupPane() {
    $('loginPane').classList.add('hidden');
    $('signupPane').classList.remove('hidden');
    $('loginError').classList.add('hidden');
    setTimeout(() => { try { $('signupEmail').focus(); } catch (e) {} }, 50);
  }
  $('toSignupLink').addEventListener('click', (e) => { e.preventDefault(); showSignupPane(); });
  $('toLoginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginPane(); });

  $('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('signupError'); const okEl = $('signupSuccess');
    errEl.classList.add('hidden'); okEl.classList.add('hidden');
    const email = $('signupEmail').value.trim().toLowerCase();
    const pw = $('signupPassword').value;
    const pw2 = $('signupPassword2').value;

    // バリデーション
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'メールアドレスの形式が正しくありません。';
      errEl.classList.remove('hidden'); return;
    }
    const domain = email.split('@')[1] || '';
    if (ALLOWED_SIGNUP_DOMAINS.indexOf(domain) === -1) {
      errEl.textContent = '登録可能なメールアドレスは @' + ALLOWED_SIGNUP_DOMAINS.join(' / @') + ' のみです。';
      errEl.classList.remove('hidden'); return;
    }
    if (pw.length < 6) {
      errEl.textContent = 'パスワードは6文字以上にしてください。';
      errEl.classList.remove('hidden'); return;
    }
    if (pw !== pw2) {
      errEl.textContent = 'パスワード（確認）が一致しません。';
      errEl.classList.remove('hidden'); return;
    }
    if (store.mode !== 'supabase') {
      errEl.textContent = 'この環境では新規作成できません（ローカルモード）。';
      errEl.classList.remove('hidden'); return;
    }

    const submitBtn = $('signupForm').querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const res = await store.signUp(email, pw);
      if (!res.ok) {
        errEl.textContent = res.msg;
        errEl.classList.remove('hidden');
        return;
      }
      if (res.autoLoggedIn) {
        // メール確認OFF設定 → そのままログインへ
        currentUser = res.user;
        try { cases = await store.fetchCases(); } catch (err) { cases = []; onPersistError(err); }
        companies = await store.fetchCompanies();
        try { theaterMaster = await store.fetchTheaterMaster(); } catch (e) {}
        populateCompanySelects();
        store.subscribe(onRemoteChange);
        showApp();
      } else {
        // メール確認ON設定 → メールリンクを案内
        okEl.textContent = res.message || '登録しました。メール確認後にログインしてください。';
        okEl.classList.remove('hidden');
        $('signupPassword').value = ''; $('signupPassword2').value = '';
      }
    } catch (err) {
      errEl.textContent = '登録処理でエラー: ' + (err && err.message ? err.message : err);
      errEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---------- 打合せモード ----------
  function meetingSwitch(company) {
    const go = () => { try { if (company) sessionStorage.setItem(MEETING_KEY, company); else sessionStorage.removeItem(MEETING_KEY); } catch (e) {} location.reload(); };
    // 書類棚で保存していない変更があれば、先に聞く
    if (koteiMode && window.SHELF && window.SHELF.isDirty()) window.SHELF.requestClose(go); else go();
  }
  function openMeetingModal() {
    const list = companyNames();
    $('meetingList').innerHTML = list.map((n) => {
      const cnt = cases.filter((c) => c.company === n && c.category !== 'タスク').length;
      return `<button type="button" class="meeting-co" data-meeting-co="${escapeHtml(n)}"><b>${escapeHtml(n)}</b><span>${cnt} 件</span></button>`;
    }).join('') || '<p class="modal-hint">会社がありません。</p>';
    $('meetingModal').classList.remove('hidden');
  }
  const closeMeetingModal = () => $('meetingModal').classList.add('hidden');
  $('meetingBtn').addEventListener('click', () => { $('userMenu').classList.add('hidden'); $('userMenuBtn').setAttribute('aria-expanded', 'false'); openMeetingModal(); });
  $('meetingList').addEventListener('click', (e) => { const b = e.target.closest('[data-meeting-co]'); if (b) { closeMeetingModal(); meetingSwitch(b.dataset.meetingCo); } });
  $('closeMeetingModal').addEventListener('click', closeMeetingModal);
  $('meetingCancelBtn').addEventListener('click', closeMeetingModal);
  $('meetingModal').addEventListener('click', (e) => { if (e.target === $('meetingModal')) closeMeetingModal(); });
  $('meetingEndBtn').addEventListener('click', () => {
    if (!confirm('打合せモードを終わります。ほかの会社の案件も表示されるようになります。\n（お客様に画面が見えていないか確かめてください）\n\n終わりますか？')) return;
    meetingSwitch('');
  });

  $('logoutBtn').addEventListener('click', async () => {
    try { sessionStorage.removeItem(MEETING_KEY); } catch (e) {}
    meetingCompany = '';
    // 開いているモーダル/各モードを全部クリーンに閉じてからログアウト
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    if (!$('modal').classList.contains('hidden')) closeModal();
    if (!$('invoiceModal').classList.contains('hidden')) closeInvoiceModal();
    if (!$('contentModal').classList.contains('hidden')) closeContentModal();
    if (!$('theaterMasterModal').classList.contains('hidden')) closeTheaterMasterModal();
    store.unsubscribe();
    await store.signOut();
    currentUser = null;
    cases = [];
    showLogin();
  });
  $('newCaseBtn').addEventListener('click', () => { if (isPrivileged(currentUser)) openModal(null, 'full'); });
  if ($('custAccountsBtn')) $('custAccountsBtn').addEventListener('click', () => openAccountsDialog());
  if ($('fillTitlesBtn')) $('fillTitlesBtn').addEventListener('click', () => fillAllTitles());
  if ($('custTheaterBar')) $('custTheaterBar').addEventListener('click', (e) => { const b = e.target.closest('[data-mytheater]'); if (b) setMyTheaterOnly(b.dataset.mytheater === '1'); });
  if ($('caseTitleAiBtn')) $('caseTitleAiBtn').addEventListener('click', async () => {
    const txt = $('content').value.trim();
    if (!txt) { if (window.KARTE) window.KARTE.say('先に「内容」を書いてください'); return; }
    const b = $('caseTitleAiBtn'); b.disabled = true; const t0 = b.textContent; b.textContent = '🤖 作っています…';
    try { const j = await caseTitleApi({ text: txt, category: $('category').value }); if (j.title) $('caseTitle').value = j.title; }
    catch (e) { if (window.KARTE) window.KARTE.say('案件名を作れませんでした: ' + (e.message || e)); }
    finally { b.disabled = false; b.textContent = t0; }
  });
  $('quickCaseBtn').addEventListener('click', () => { if (isPrivileged(currentUser)) openModal(null, 'simple'); });
  $('closeModal').addEventListener('click', closeModal);
  // 内容・メモ: 入力に合わせて全文が見えるよう自動拡張
  ['content', 'memo', 'adviceNote'].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener('input', () => autoGrowTextarea(el));
  });
  // 見積り金額: 入力途中でもカンマ区切りで表示
  { const amtEl = $('estimateAmount'); if (amtEl) amtEl.addEventListener('input', () => formatAmountFieldLive(amtEl)); }
  // 見積りAI-OCR ポップアップ（トップ一覧の見積り名セルのダブルクリックで開く。D&D/クリックでアップロード）
  if ($('closeQuoteOcrModal')) $('closeQuoteOcrModal').addEventListener('click', closeQuoteOcrModal);
  if ($('quoteOcrCancelBtn')) $('quoteOcrCancelBtn').addEventListener('click', closeQuoteOcrModal);
  if ($('quoteOcrModal')) $('quoteOcrModal').addEventListener('click', (e) => { if (e.target === $('quoteOcrModal')) closeQuoteOcrModal(); });
  {
    const drop = $('quoteOcrDrop');
    const fileInput = $('quoteOcrFile');
    if (drop && fileInput) {
      drop.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => { const f = fileInput.files && fileInput.files[0]; fileInput.value = ''; if (f) processQuoteFile(f); });
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('dragover'); }));
      ['dragleave', 'dragend', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('dragover'); }));
      drop.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) processQuoteFile(f); });
    }
  }
  $('cancelBtn').addEventListener('click', closeModal);
  // 二重登録バナー: 元の案件を開く / 疑いを解除する
  if ($('dupOpenBtn')) $('dupOpenBtn').addEventListener('click', () => {
    if (!dupBannerCase) return;
    const other = cases.find((x) => String(x.id) === String(dupBannerCase.dupSuspectId));
    if (other) openModalGuarded(other, 'full');
  });
  if ($('dupClearBtn')) $('dupClearBtn').addEventListener('click', () => {
    if (!dupBannerCase) return;
    const c = dupBannerCase;
    clearDupSuspect(c);
    renderDupBanner(c);
  });
  // 編集中の誤操作で入力が消えないよう、案件編集ポップアップは背景クリックでは閉じない（✕/キャンセルのみ）
  // 編集ポップアップからの複製・削除（主にスマホ用）
  $('modalDuplicateBtn').addEventListener('click', () => {
    const c = cases.find((x) => x.id === $('caseId').value); if (!c) return;
    const dup = Object.assign({}, c, { id: genId(), tasks: [], purchases: [], allocations: Object.assign({}, c.allocations || {}), updatedAt: new Date().toISOString() });
    cases.push(dup); persistCase(dup); closeModal(); render(); if (calMode) renderCalendar();
  });
  // この案件の工事写真台帳を作る（劇場名・工事名が入った状態で「新しく作る」を開く）
  $('modalPhotoBtn').addEventListener('click', () => {
    const c = cases.find((x) => x.id === $('caseId').value); if (!c) return;
    if (caseFormSnapshot() !== modalSnapshot && !confirm('編集中の内容が保存されていません。\n保存せずに写真台帳を作りますか？')) return;
    closeModal();
    const opts = { newFromCase: { id: c.id, company: c.company, theater: c.theater, title: c.title || '', estimateName: c.estimateName || '', content: c.content || '' }, type: 'photo' };
    if (koteiMode && window.SHELF) window.SHELF.requestClose(() => { exitKoteiMode(); enterKoteiMode(opts); });
    else enterKoteiMode(opts);
  });
  // 🦺 安全書類・💰 大口予算書を作る（編集パネルの上に画面を出す。保存していない変更は先に保存してもらう）
  ['modalSafetyBtn', 'modalBudgetBtn'].forEach((bid) => { if ($(bid)) $(bid).addEventListener('click', async () => {
    const c = cases.find((x) => x.id === $('caseId').value); if (!c || !window.DOCGEN) return;
    if (caseFormSnapshot() !== modalSnapshot && !(await window.KARTE.ask('編集中の内容がまだ保存されていません。保存した内容で作ります。続けますか？', { ok: '続ける' }))) return;
    if (bid === 'modalSafetyBtn') window.DOCGEN.openSafety(c.id); else window.DOCGEN.openBudget(c.id);
  }); });
  $('modalDeleteBtn').addEventListener('click', () => {
    const c = cases.find((x) => x.id === $('caseId').value); if (!c) return;
    if (!confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) return;
    cases = cases.filter((x) => x.id !== c.id); removeCaseRemote(c.id); closeModal(); render(); if (calMode) renderCalendar();
  });
  $('company').addEventListener('change', updateTohoVisibility);
  $('company').addEventListener('change', () => renderOtherRow());
  ['otherVendor', 'otherAmount', 'otherRate'].forEach((id) => { const el = $(id); if (el) el.addEventListener('input', () => { if (id === 'otherAmount') formatAmountFieldLive(el); renderOtherFee(); }); });
  // 会社を変えたら: 劇場の候補をその会社の劇場にする。入っている劇場がその会社の劇場でなければ、選び直してもらう
  $('company').addEventListener('change', () => {
    if (!isPrivileged(currentUser)) return;
    const co = $('company').value;
    renderDatalists();
    const th = $('theater').value.trim();
    if (th && !masterTheaterOf(th, co)) {
      $('theater').value = '';
      showToastLite('会社を変えたので、劇場を選び直してください');
      $('theater').focus();
    }
  });
  $('addCompanyBtn').addEventListener('click', addCompany);

  $('invoiceBtn').addEventListener('click', openInvoiceModal);
  $('closeInvoiceModal').addEventListener('click', closeInvoiceModal);
  $('invoiceCancelBtn').addEventListener('click', closeInvoiceModal);
  $('invoiceModal').addEventListener('click', (e) => { if (e.target === $('invoiceModal')) closeInvoiceModal(); });
  $('invoiceMonth').addEventListener('change', () => {
    $('invoiceIssueDate').value = fmtDateFull(lastDayOfMonth($('invoiceMonth').value));
    updateInvoicePreview();
  });
  $('invoiceGenerateBtn').addEventListener('click', generateInvoices);

  // 客先マスター モーダル
  $('theaterMasterBtn').addEventListener('click', openTheaterMasterModal);
  $('closeTheaterMasterModal').addEventListener('click', closeTheaterMasterModal);
  $('tmCloseBtn').addEventListener('click', closeTheaterMasterModal);
  $('theaterMasterModal').addEventListener('click', (e) => { if (e.target === $('theaterMasterModal')) closeTheaterMasterModal(); });
  $('tmCompanySelect').addEventListener('change', () => { renderHqInfo(); renderTheaterMasterTable(); });
  $('tmAddTheaterBtn').addEventListener('click', addTheaterRow);
  $('tmDeleteCompanyBtn').addEventListener('click', deleteCompanyFromMaster);
  $('tmBody').addEventListener('change', handleTheaterMasterInput);
  $('tmBody').addEventListener('click', handleTheaterMasterClick);
  $('tmHqOfficialName').addEventListener('change', handleHqOfficialNameChange);
  $('tmHqAddress').addEventListener('change', handleHqAddressChange);
  $('tmHqColor').addEventListener('change', (e) => setCompanyColor(e.target.value));
  $('tmHqColorClear').addEventListener('click', () => setCompanyColor(''));

  // 各劇場情報 モーダル
  $('theaterInfoBtn').addEventListener('click', () => { if (theaterInfoMode) closeTheaterInfoModal(); else openTheaterInfoModal(); });
  $('closeTheaterInfoModal').addEventListener('click', closeTheaterInfoModal);
  $('tiCloseBtn').addEventListener('click', closeTheaterInfoModal);
  $('tiCompanySelect').addEventListener('change', () => { populateTiTheaterSelect(); renderTheaterInfo(); });
  $('tiTheaterSelect').addEventListener('change', () => {
    // 閉館にした劇場から別の劇場へ移った時は、一覧を作り直してその劇場を消す（「閉館した劇場も出す」の時は残す）
    const sel = $('tiTheaterSelect');
    const stale = Array.from(sel.options).some((o) => { const t = theaterMaster.find((x) => x.name === o.value); return t && t.closed && !tiShowHidden() && o.value !== sel.value; });
    if (stale) populateTiTheaterSelect();
    renderTheaterInfo();
  });
  $('tiAddContactBtn').addEventListener('click', addTheaterContactRow);
  $('tiBody').addEventListener('change', handleTheaterInfoTableInput);
  $('tiBody').addEventListener('click', handleTheaterInfoTableClick);
  $('tiBulkBtn').addEventListener('click', toggleTiBulkMode);
  if ($('tiTheaterSearch')) {
    // 候補から選んだ時（名前がぴったり合った時）だけ開く。途中まで打った時は Enter で探す
    $('tiTheaterSearch').addEventListener('input', (e) => { tiJumpToTheater(e.target.value, false); });
    $('tiTheaterSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!tiJumpToTheater(e.target.value, true) && window.KARTE) window.KARTE.say('「' + e.target.value + '」に合う劇場が見つかりません。'); } });
  }
  if ($('tiSearchPick')) {
    $('tiSearchPick').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-name]'); if (!b) return;
      e.preventDefault();
      $('tiTheaterSearch').value = b.dataset.name;
      tiJumpToTheater(b.dataset.name, true);
    });
    $('tiTheaterSearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') tiSearchPick(null); });
  }
  if ($('tiShowHidden')) $('tiShowHidden').addEventListener('change', () => { populateTiTheaterSelect(); renderTheaterInfo(); });
  if ($('tiExportBtn')) $('tiExportBtn').addEventListener('click', () => { if (window.KARTE) window.KARTE.openExport($('tiCompanySelect').value); });
  $('tiBulkBody').addEventListener('change', handleTiBulkInput);
  // 劇場情報の入力: 打ちながら高さを中身に合わせる（全文が見えるように）
  ['tiBody', 'tiBulkBody', 'tiInfoBox'].forEach((id) => {
    const el = $(id); if (!el) return;
    el.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight + 2, 220) + 'px';
      }
    });
  });
  // 列幅を既定に戻す
  if ($('tiColResetBtn')) $('tiColResetBtn').addEventListener('click', () => {
    ['tiTable', 'tiBulkTable'].forEach((id) => { const t = $(id); if (t) resetTmWidths(t); });
    renderTheaterInfo();
  });
  ['tiShortName', 'tiManager', 'tiPhone', 'tiMaintenance', 'tiGem2', 'tiGem2Co2', 'tiGem2Th', 'tiClosed', 'tiClosedOn', 'tiClosedNote', 'tiEquipment', 'tiChronic', 'tiNote'].forEach((id) => {
    $(id).addEventListener('change', handleTheaterInfoFieldChange);
  });

  // 劇場情報更新確認 モーダル
  $('theaterPendingBtn').addEventListener('click', () => { if (theaterPendingMode) closeTheaterPendingModal(); else openTheaterPendingModal(); });
  // 設備管理台帳
  if ($('equipBtn')) $('equipBtn').addEventListener('click', toggleEquipMode);
  if ($('planBtn')) $('planBtn').addEventListener('click', togglePlanMode);
  if ($('closeEquipView')) $('closeEquipView').addEventListener('click', exitEquipMode);
  if ($('eqCloseBtn')) $('eqCloseBtn').addEventListener('click', exitEquipMode);
  if ($('eqItemsBtn')) $('eqItemsBtn').addEventListener('click', () => {
    $('eqItemsBox').classList.toggle('hidden');
  });
  if ($('eqShowReturned')) $('eqShowReturned').addEventListener('change', (e) => {
    eqShowReturned = e.target.checked;
    renderEquipTable();
  });
  // 貸出を追加
  if ($('eqAddLoanBtn')) $('eqAddLoanBtn').addEventListener('click', async () => {
    const first = equipItems.find((it) => it.active);
    const l = {
      itemId: first ? first.id : '', equipmentName: first ? first.name : '',
      borrower: '', lentOn: todayStr(), dueOn: '', returnedOn: '', note: ''
    };
    try {
      const row = await store.insertEquipLoan(l);
      if (row) { l.id = row.id; equipLoans.unshift(l); renderEquipTable(); }
    } catch (e) { alert('追加に失敗しました: ' + (e && e.message ? e.message : e)); }
  });
  // 機器を追加
  if ($('eqAddItemBtn')) $('eqAddItemBtn').addEventListener('click', async () => {
    const name = $('eqNewItemName').value.trim();
    if (!name) return;
    try {
      const row = await store.insertEquipItem(name);
      if (row) {
        equipItems.push({ id: row.id, name: name, note: '', sortOrder: 100, active: true });
        $('eqNewItemName').value = '';
        renderEquipItems(); renderEquipTable();
      }
    } catch (e) { alert('機器の追加に失敗しました（同じ名前が既にあるかもしれません）: ' + (e && e.message ? e.message : e)); }
  });
  // 機器名の編集・削除
  if ($('eqItemList')) {
    $('eqItemList').addEventListener('change', async (e) => {
      const chip = e.target.closest('[data-eqitem]'); if (!chip) return;
      if (!e.target.classList.contains('eq-item-name')) return;
      const id = chip.dataset.eqitem;
      const it = equipItems.find((x) => String(x.id) === String(id)); if (!it) return;
      const name = e.target.value.trim();
      if (!name) { e.target.value = it.name; return; }
      try { await store.updateEquipItem(id, { name: name }); it.name = name; renderEquipTable(); }
      catch (err) { alert('機器名の変更に失敗しました: ' + (err && err.message ? err.message : err)); e.target.value = it.name; }
    });
    $('eqItemList').addEventListener('click', async (e) => {
      const del = e.target.closest('.eq-item-del'); if (!del) return;
      const chip = del.closest('[data-eqitem]'); const id = chip.dataset.eqitem;
      const it = equipItems.find((x) => String(x.id) === String(id)); if (!it) return;
      if (!confirm(`機器「${it.name}」を一覧から削除しますか？\n（過去の貸出記録は残ります）`)) return;
      try {
        await store.deleteEquipItem(id);
        equipItems = equipItems.filter((x) => String(x.id) !== String(id));
        renderEquipItems(); renderEquipTable();
      } catch (err) { alert('削除に失敗しました: ' + (err && err.message ? err.message : err)); }
    });
  }
  // 貸出記録の編集・返却・削除
  if ($('eqBody')) {
    $('eqBody').addEventListener('change', async (e) => {
      const tr = e.target.closest('[data-eqloan]'); if (!tr) return;
      const l = eqFind(tr.dataset.eqloan); if (!l) return;
      const f = e.target.dataset.f; if (!f) return;
      if (f === 'itemId') {
        l.itemId = e.target.value;
        const it = equipItems.find((x) => String(x.id) === String(l.itemId));
        l.equipmentName = it ? it.name : '';
      } else {
        l[f] = e.target.value;
      }
      await eqSaveLoan(l);
      renderEquipTable();   // 状態バッジ（貸出中/延滞/返却済）を更新
    });
    $('eqBody').addEventListener('click', async (e) => {
      const tr = e.target.closest('[data-eqloan]'); if (!tr) return;
      const l = eqFind(tr.dataset.eqloan); if (!l) return;
      if (e.target.closest('.eq-return-btn')) {
        l.returnedOn = todayStr();
        await eqSaveLoan(l);
        renderEquipTable();
        return;
      }
      if (e.target.closest('.eq-del-btn')) {
        if (!confirm('この貸出記録を削除しますか？')) return;
        try {
          await store.deleteEquipLoan(l.id);
          equipLoans = equipLoans.filter((x) => String(x.id) !== String(l.id));
          renderEquipTable();
        } catch (err) { alert('削除に失敗しました: ' + (err && err.message ? err.message : err)); }
      }
    });
  }
  // 登録確認（新規か更新か）
  if ($('intakeBtn')) $('intakeBtn').addEventListener('click', toggleIntakeMode);
  if ($('closeIntakeView')) $('closeIntakeView').addEventListener('click', exitIntakeMode);
  if ($('ikCloseBtn')) $('ikCloseBtn').addEventListener('click', exitIntakeMode);
  if ($('intakeView')) { $('intakeView').addEventListener('click', handleIntakeClick); $('intakeView').addEventListener('input', handleIntakeInput); $('intakeView').addEventListener('change', handleIntakeInput); }
  async function handleIntakeClick(e) {
    const btn = e.target.closest('[data-ik]'); if (!btn) return;
    const act = btn.dataset.ik; const K = window.KARTE;
    if (act === 'open') {
      const c = cases.find((x) => String(x.id) === String(btn.dataset.case));
      if (c) openModal(c, 'full'); else K.say('その案件は見つかりませんでした（削除された可能性があります）。');
      return;
    }
    const it = ikFind(btn.dataset.id); if (!it) return;
    if (act === 'search') { ikState(it).open = !ikState(it).open; renderIntakeList(); return; }
    const rp = ikState(it).r;
    btn.disabled = true;
    try {
      if (act === 'new') {
        if (await K.ask('この内容で「新規案件」として登録します。' + (rp ? `\nR担当者は「${rp}」にします。` : '') + 'よろしいですか？', { ok: '新規で登録', cancel: 'やめる' })) await intakeRegisterNew(it);
      } else if (act === 'update') {
        const tc = cases.find((x) => String(x.id) === String(btn.dataset.case));
        const nm = tc ? `「${shortTheaterName(tc.theater) || tc.theater}　${tc.title || tc.estimateName || ''}」` : '選んだ既存案件';
        if (await K.ask(`${nm}に「更新」として反映します。` + (rp ? `\nR担当者は「${rp}」にします。` : '') + 'よろしいですか？', { ok: '更新する', cancel: 'やめる' })) await intakeApplyUpdate(it, btn.dataset.case);
      } else if (act === 'discard') {
        if (await K.ask('この確認待ちを破棄します（案件は登録されません）。よろしいですか？', { ok: '破棄する', cancel: 'やめる' })) {
          await store.decideIntakePending(it.id, 'discarded', null);
          intakePending = intakePending.filter((x) => String(x.id) !== String(it.id));
          renderIntakeList(); refreshIntakeBadge();
        }
      }
    } catch (err) {
      K.say('処理に失敗しました: ' + (err && err.message ? err.message : err));
    } finally { btn.disabled = false; }
  }
  $('closeTheaterPendingModal').addEventListener('click', closeTheaterPendingModal);
  $('tpCloseBtn').addEventListener('click', closeTheaterPendingModal);
  $('tpBody').addEventListener('click', handlePendingClick);
  $('tpApproveAllBtn').addEventListener('click', approveAllPending);
  if ($('tpAiBtn')) $('tpAiBtn').addEventListener('click', runPendingAiReview);

  $('closeContentModal').addEventListener('click', closeContentModal);
  $('contentCancelBtn').addEventListener('click', closeContentModal);
  $('contentSaveBtn').addEventListener('click', saveContentFromModal);
  $('contentModal').addEventListener('click', (e) => { if (e.target === $('contentModal')) closeContentModal(); });
  // Ctrl+Enter / Cmd+Enter で保存（IME変換中の Enter は確定なので拾わない）
  $('contentEditor').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) {
      e.preventDefault();
      saveContentFromModal();
    }
  });

  $('aggBtn').addEventListener('click', toggleAggMode);
  $('taskBtn').addEventListener('click', toggleTaskMode);
  $('personalTaskBtn').addEventListener('click', togglePersonalTasks);
  // 個人タスクのパネル: ✎で編集ポップアップ、チェックで完了
  $('personTaskBody').addEventListener('click', (e) => {
    const sa = e.target.closest('[data-sugg-accept]');
    if (sa) { decideSuggestion(sa.dataset.suggAccept, true); return; }
    const sdn = e.target.closest('[data-sugg-done]');
    if (sdn) { decideSuggestion(sdn.dataset.suggDone, 'done'); return; }
    const sd = e.target.closest('[data-sugg-dismiss]');
    if (sd) { decideSuggestion(sd.dataset.suggDismiss, false); return; }
    const so = e.target.closest('[data-sugg-open]');
    if (so) { openSuggestionSource(so.dataset.suggOpen); return; }
    const te = e.target.closest('[data-tedit]');
    if (te) { editTaskText(te); return; }
    const po = e.target.closest('[data-persontaskopen]');
    if (po) { openPersonTaskModal(po.dataset.persontaskopen); return; }
    // 「（なし）」を押しても追加画面を開く
    const em = e.target.closest('td.task-col .task-empty');
    const tr = em && em.closest('tr[data-person]');
    if (tr) openPersonTaskModal(tr.dataset.person);
  });
  $('personTaskBody').addEventListener('change', (e) => {
    const cb = e.target.closest('[data-persontaskcell]');
    if (!cb) return;
    const tr = cb.closest('tr');
    const person = tr && tr.dataset.person;
    const t = person && personTasks(person)[Number(cb.dataset.persontaskcell)];
    if (t) { t.done = cb.checked; savePersonTasks(person); renderPersonTaskPanel(); }
  });
  // 並び替えボタン（受付日順・調査日順・客先順・ステータス順）
  function toggleSortField(field) {
    if (sortState.field === field) sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    else { sortState.field = field; sortState.direction = 'asc'; }
    render();
  }
  function updateMobileSortButtons() {
    // 客先ログインでは「客先」表記を使わない（自社のみのため「会社順」）
    const companyLabel = isPrivileged(currentUser) ? '客先順' : '会社順';
    const map = { receivedDate: ['sortReceivedBtn', '受付日順'], surveyDate: ['sortSurveyBtn', '調査日順'], company: ['sortCompanyBtn', companyLabel], status: ['sortStatusBtn', 'ステータス順'] };
    Object.keys(map).forEach((field) => {
      const b = $(map[field][0]); if (!b) return;
      const active = sortState.field === field;
      b.classList.toggle('sort-active', active);
      b.textContent = map[field][1] + (active ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : '');
    });
  }
  $('sortReceivedBtn').addEventListener('click', () => toggleSortField('receivedDate'));
  $('sortSurveyBtn').addEventListener('click', () => toggleSortField('surveyDate'));
  $('sortCompanyBtn').addEventListener('click', () => toggleSortField('company'));
  $('sortStatusBtn').addEventListener('click', () => toggleSortField('status'));
  // カレンダー
  $('calBtn').addEventListener('click', toggleCalMode);
  $('koteiBtn').addEventListener('click', toggleKoteiMode);
  $('mailSetBtn').addEventListener('click', () => openMailSettings());
  $('masterBtn').addEventListener('click', () => openMasterDialog());
  $('guideBtn').addEventListener('click', () => { if (window.GUIDE) window.GUIDE.open(); });
  // 編集パネルの「？」: この画面の取説（登録・ステータス・見積書・作業申請書）
  $('modalHelpBtn').addEventListener('click', () => { if (window.GUIDE) window.GUIDE.open({ only: ['flow', 'report', 'docs'] }); });
  $('purchaseBtn').addEventListener('click', togglePurchaseMode);
  // 支払い状況モード: 行の追加/削除・入力の自動保存（#casesBody にイベント委譲・purchaseMode時のみ）
  $('casesBody').addEventListener('click', (e) => {
    if (!purchaseMode) return;
    const addBtn = e.target.closest('.pv-add');
    if (addBtn) {
      const tr = addBtn.closest('tr[data-case-id]');
      tr.querySelector('.pv-rows').appendChild(buildPurchaseRow({}));
      return;
    }
    const delBtn = e.target.closest('.pur-del');
    if (delBtn) {
      const tr = delBtn.closest('tr[data-case-id]');
      delBtn.closest('.pv-row').remove();
      savePurchasesForCard(tr);
      return;
    }
  });
  $('casesBody').addEventListener('change', (e) => {
    if (!purchaseMode) return;
    const tr = e.target.closest('tr[data-case-id]');
    if (!tr) return;
    if (e.target.classList.contains('pur-amount')) {
      e.target.value = e.target.value ? formatThousands(e.target.value) : '';
    }
    if (e.target.matches('.pur-month, .pur-vendor, .pur-amount')) savePurchasesForCard(tr);
  });
  $('calPrev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
  $('calNext').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });
  $('calToday').addEventListener('click', () => { const n = new Date(); calYear = n.getFullYear(); calMonth = n.getMonth(); renderCalendar(); });
  // カレンダーの予定をクリック → 簡易編集（調査/開始/終了 日時・内容・メモのみ）
  $('calGrid').addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const bar = e.target.closest('.cal-ev-bar'); if (bar) showCalTip(bar, e.clientX, e.clientY); else hideCalTip();
  });
  $('calGrid').addEventListener('pointerleave', hideCalTip);
  if ($('calCloseBtn')) $('calCloseBtn').addEventListener('click', () => exitCalMode());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && calMode && !document.querySelector('#modal:not(.hidden), .kt-overlay')) exitCalMode(); });
  $('calGrid').addEventListener('click', (e) => {
    hideCalTip();
    const ev = e.target.closest('.cal-ev-bar'); if (!ev) return;
    const c = cases.find((x) => x.id === ev.dataset.caseId);
    if (c) openModal(c, 'calendar');
  });
  $('taskDoneToggleBtn').addEventListener('click', () => {
    showDoneTasks = !showDoneTasks;
    setSwitch($('taskDoneToggleBtn'), showDoneTasks);
    if (taskMode) renderTaskTable();
  });
  // タスクポップアップ
  function closeTaskModal() {
    $('taskModal').classList.add('hidden');
    taskModalCase = null; taskModalPerson = null;
    if (taskMode) renderTaskTable();
  }
  $('taskAddBtn').addEventListener('click', addTaskFromInput);
  $('taskNewInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTaskFromInput(); } });
  $('taskNewDue').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTaskFromInput(); } });
  $('closeTaskModal').addEventListener('click', closeTaskModal);
  $('taskDoneBtn').addEventListener('click', closeTaskModal);
  $('taskList').addEventListener('change', (e) => {
    const tasks = activeTaskList(); if (!tasks) return;
    const pr = e.target.closest('[data-taskprio]');
    if (pr) {
      const t = tasks[Number(pr.dataset.taskprio)];
      if (t) { t.priority = pr.value; persistTaskModal(); renderTaskModalList(); if (taskMode) renderTaskTable(); }
      return;
    }
    const du = e.target.closest('[data-taskdue]');
    if (du) {
      const t = tasks[Number(du.dataset.taskdue)];
      if (t) { t.due = du.value || ''; persistTaskModal(); renderTaskModalList(); if (taskMode) renderTaskTable(); }
      return;
    }
    const cb = e.target.closest('[data-taskmodal]');
    if (!cb) return;
    const t = tasks[Number(cb.dataset.taskmodal)];
    if (t) { t.done = cb.checked; persistTaskModal(); renderTaskModalList(); }
  });
  $('taskList').addEventListener('click', (e) => {
    const te = e.target.closest('[data-tedit]');
    if (te) { editTaskText(te); return; }
    const d = e.target.closest('[data-taskdel]');
    if (!d) return;
    const tasks = activeTaskList(); if (!tasks) return;
    tasks.splice(Number(d.dataset.taskdel), 1);
    persistTaskModal(); renderTaskModalList();
  });
  $('taskSortDueBtn').addEventListener('click', () => {
    const tasks = activeTaskList(); if (!tasks || tasks.length < 2) return;
    sortTasksByDue(tasks);
    persistTaskModal();
    renderTaskModalList();
    if (taskMode) renderTaskTable();
  });
  $('aggExitBtn').addEventListener('click', exitAggMode);
  $('aggExportBtn').addEventListener('click', exportAggregation);
  $('aggFY').addEventListener('change', renderAggTable);
  $('aggAddMemberBtn').addEventListener('click', addTeamMember);
  $('aggRedistributeBtn').addEventListener('click', redistributeSmallCases);
  // A集計の入力（配分%・粗利率）変更
  $('casesBody').addEventListener('change', (e) => {
    if (aggMode) { handleAggInput(e); return; }
    // タスク管理モード: 一覧のチェックを押したら完了にして一覧から消す（ポップアップには残る）
    const cb = e.target.closest('[data-taskcell]');
    if (cb && taskMode) {
      const tr = cb.closest('tr');
      const c = cases.find((x) => x.id === tr.dataset.caseId);
      if (c) {
        const t = caseTasks(c)[Number(cb.dataset.taskcell)];
        if (t) { t.done = cb.checked; c.updatedAt = new Date().toISOString(); if (store.mode === 'local') saveCases(); persistCase(c); renderTaskTable(); }
      }
    }
  });
  // A集計ヘッダの担当者削除（thead に委譲）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (!aggMode) return;
    const rm = e.target.closest('.agg-rm-member');
    if (rm) { e.stopPropagation(); removeTeamMember(rm.dataset.member); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // 上に別の画面（安全書類・作業申請書・劇場カルテ・確認など）が開いている時は、後ろの画面を閉じない
    if (Array.prototype.some.call(document.querySelectorAll('.kt-overlay, .kt-ask-ov'), (x) => !x.classList.contains('hidden') && x.getClientRects().length)) return;
    // 最後に開いたものを優先的に閉じる
    if (!$('contentModal').classList.contains('hidden')) { closeContentModal(); return; }
    if (!$('theaterInfoModal').classList.contains('hidden')) { closeTheaterInfoModal(); return; }
    if (!$('theaterMasterModal').classList.contains('hidden')) { closeTheaterMasterModal(); return; }
    if (!$('invoiceModal').classList.contains('hidden')) { closeInvoiceModal(); return; }
    if (!$('modal').classList.contains('hidden')) { closeModal(); return; }
  });

  // フォーム保存時に日付を一括パース＆バリデーション
  // 一覧にない劇場（新店）: 確かめてから、劇場の一覧にも登録する
  let newTheaterOk = '';
  async function confirmNewTheater(typed, company) {
    const K = window.KARTE;
    const name = newTheaterName(typed, company);
    const ok = K ? await K.ask(`「${typed}」は ${company} の劇場の一覧にありません。\n新しい劇場「${name}」として、劇場の一覧にも登録しますか？\n（打ちまちがいなら「やめる」を押して直してください）`, { ok: '新しい劇場として登録' }) : confirm('新しい劇場として登録しますか？');
    if (!ok) { $('theater').focus(); return false; }
    const t = { name, company, address: '', shortName: name === typed ? '' : typed };
    try {
      if (!theaterMaster.some((x) => x.name === name)) { theaterMaster.push(t); await store.upsertTheater(t); }
    } catch (err) { theaterMaster = theaterMaster.filter((x) => x !== t); onPersistError(err); return false; }
    $('theater').value = typed;
    newTheaterOk = name;
    showToastLite('劇場「' + name + '」を劇場の一覧に登録しました');
    return true;
  }
  $('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (isPrivileged(currentUser) && store.mode === 'supabase') {
      const typed = $('theater').value.trim(), co = $('company').value;
      if (typed && co && typed !== modalOrigTheater && !masterTheaterOf(typed, co) && newTheaterOk !== newTheaterName(typed, co)) {
        confirmNewTheater(typed, co).then((ok) => { if (ok) $('caseForm').requestSubmit(); });
        return;
      }
    }
    newTheaterOk = '';
    if (isPrivileged(currentUser)) {
      const rerr = rPersonError($('rPerson').value.trim(), modalOrigRPerson);
      if (rerr) { window.KARTE.say(rerr); $('rPerson').focus(); return; }
    }
    if (!isPrivileged(currentUser)) {
      // 客先は新しい案件を作れない。開いた案件の「自社のメモ」だけ保存する
      const c0 = cases.find((x) => String(x.id) === String($('caseId').value));
      if (!c0) { closeModal(); return; }
      c0.customerMemo = $('customerMemo') ? $('customerMemo').value.trim() : c0.customerMemo;
      persistCase(c0); render(); closeModal();
      return;
    }
    const isToho = !isPrivileged(currentUser);
    const dateLabels = {
      receivedDate: '受付日',
      surveyDate: '調査日',
      quoteDate: isToho ? '見積り受領日' : '見積り提出日',
      workStartDate: '作業開始日',
      workEndDate: '作業完了日',
      invoiceDate: isToho ? '請求書受領日' : '請求書発行日',
      paymentDate: isToho ? '支払日' : '入金日'
    };
    // 作業開始日に「0」→ 日程調整中（自動フラグ）。作業開始日は空扱い
    const scheduleAdjusting = $('workStartDate').value.trim() === '0';
    const parsedDates = {};
    for (const f in dateLabels) {
      if (f === 'workStartDate' && scheduleAdjusting) { parsedDates.workStartDate = ''; continue; }
      const v = readDateField(f, dateLabels[f]);
      if (v === undefined) return; // バリデーション失敗
      parsedDates[f] = v;
    }
    const id = $('caseId').value || genId();
    const company = isPrivileged(currentUser) ? $('company').value : customerCompany(currentUser);
    const amountRaw = $('estimateAmount').value.replace(/[^\d]/g, '');
    const data = {
      id: id, company: company,
      theater: $('theater').value.trim(),
      title: $('caseTitle') ? $('caseTitle').value.trim() : '',
      receivedDate: parsedDates.receivedDate,
      tcPerson: stripHonorific($('tcPerson').value.trim()),
      rPerson: $('rPerson').value.trim(),
      category: $('category').value,
      content: $('content').value.trim(),
      surveyDate: parsedDates.surveyDate,
      surveyTime: $('surveyTime').value || '',
      workStartTime: $('workStartTime').value || '',
      workEndTime: $('workEndTime').value || '',
      // 決裁番号は保存値として保持（表示・編集はTOHOのときだけ）。会社を切替えても消えないようにする
      certNumber: $('certNumber').value.trim(),
      estimateName: $('estimateName').value.trim(),
      estimateAmount: amountRaw === '' ? '' : Number(amountRaw),
      quoteDate: parsedDates.quoteDate,
      workStartDate: parsedDates.workStartDate,
      workEndDate: parsedDates.workEndDate,
      invoiceDate: parsedDates.invoiceDate,
      paymentDate: parsedDates.paymentDate,
      memo: $('memo').value.trim(),
      customerMemo: $('customerMemo') ? $('customerMemo').value.trim() : '',
      adviceNote: $('adviceNote') ? $('adviceNote').value.trim() : '',
      dueExempt: !!($('dueExempt') && $('dueExempt').checked),
      urgent: !!($('caseUrgent') && $('caseUrgent').checked),
      ...(($('statusRow') && !$('statusRow').classList.contains('hidden')) ? { statusOverride: $('statusOverrideSel').value } : {}),
      otherVendor: $('otherVendor') ? $('otherVendor').value.trim() : '',
      otherAmount: $('otherAmount') && $('otherAmount').value.replace(/[^\d]/g, '') !== '' ? Number($('otherAmount').value.replace(/[^\d]/g, '')) : '',
      otherRate: $('otherRate') && $('otherRate').value.trim() !== '' && !isNaN(Number($('otherRate').value.trim())) ? Number($('otherRate').value.trim()) : '',
      dueExemptReason: $('dueExemptReason') ? $('dueExemptReason').value.trim() : '',
      updatedAt: new Date().toISOString()
    };
    addToHistory('theaters', data.theater);
    addToHistory('tcPersons', data.tcPerson);
    addToHistory('rPersons', data.rPerson);
    saveHistory();
    const existing = cases.findIndex((c) => c.id === id);
    const prev = existing >= 0 ? cases[existing] : null;
    // 新規登録のとき: 同じ劇場に似た進行中案件があれば、二重登録の可能性を知らせて確認する
    if (!prev) {
      const dup = findDupSuspect(data);
      if (dup) {
        const info = `${dup.theater || '(劇場未入力)'}／受付 ${dup.receivedDate || '-'}／${(dup.estimateName || dup.content || '').slice(0, 40)}`;
        const go = confirm(
          '⚠️ 二重登録の可能性があります。\n\n同じ劇場に似た案件が既にあります:\n' + info +
          '\n\n「OK」＝それでもこのまま登録する（一覧に「二重の可能性」と表示されます）\n「キャンセル」＝登録をやめて確認する'
        );
        if (!go) return;          // 登録を中止（入力内容はそのまま残る）
        data.dupSuspectId = dup.id; // 登録するが印を付けて後から確認できるようにする
      }
    }
    // 日程調整中フラグ（自動ステータス）: 作業開始日が0ならON、それ以外はOFF
    data.scheduleAdjusting = scheduleAdjusting;
    // 入金日: 請求発行日があり入金日が空なら翌月末を自動入力（予定）。手入力=確認、変更なし=維持
    if (data.invoiceDate && !data.paymentDate && paymentConfirmedAvailable()) {
      data.paymentDate = endOfNextMonth(data.invoiceDate);
      data.paymentConfirmed = false;
    } else if (data.paymentDate && prev && prev.paymentDate === data.paymentDate) {
      data.paymentConfirmed = (prev.paymentConfirmed !== false);
    } else {
      data.paymentConfirmed = true;
    }
    // 既存の statusOverride / tasks / 配分 などフォーム外の項目は保持（マージ）
    const saved = Object.assign({}, prev || {}, data);
    autoClearOverride(saved, prev);
    waAfterDates(saved, prev);
    if (existing >= 0) cases[existing] = saved; else cases.push(saved);
    const p = persistCase(saved);
    // 案件名が空なら、保存のあとに AI が内容から付ける（「どこでどうなった」だけ）
    if (!saved.title && saved.content && titleSupported) Promise.resolve(p).then(() => autoTitleCases([saved.id]));
    closeModal();
    render();
    if (calMode) renderCalendar(); // カレンダー表示中なら即反映
  });

  $('casesBody').addEventListener('click', (e) => {
    // 客先のベル（通知メールの ON/OFF）
    const bell = e.target.closest('[data-bell]');
    if (bell) { e.stopPropagation(); toggleBell(bell.dataset.bell); return; }
    // タスク管理モード: タスクの文字クリック → その場で書き直し
    const te = e.target.closest('[data-tedit]');
    if (te) { e.stopPropagation(); editTaskText(te); return; }
    // タスク管理モード: 「タスク編集」ボタン
    const to = e.target.closest('[data-taskopen]');
    if (to) { const c = cases.find((x) => x.id === to.dataset.taskopen); if (c) openTaskModal(c); return; }
    // タスク管理モード: 「（なし）」を押しても追加画面を開く
    const em = taskMode && e.target.closest('td.task-col .task-empty');
    if (em) { const tr = em.closest('tr[data-case-id]'); const c = tr && cases.find((x) => x.id === tr.dataset.caseId); if (c) openTaskModal(c); return; }
    // ⑦ 編集パネルを開いている間は、一覧側では編集しない（✎ で別の案件へ切り替えるだけ）。
    // 同じ案件を一覧とパネルの両方で直すと、パネルの保存で一覧側の変更が上書きされてしまうため
    if (!$('modal').classList.contains('hidden')) {
      const ed = e.target.closest('[data-action="edit"]');
      if (ed) { const c = cases.find((x) => x.id === ed.dataset.id); if (c) openModalGuarded(c, 'full'); }
      return;
    }
    // スマホ（狭い画面）の通常表示: 項目タップで編集ポップアップを開く（インライン編集はしない）
    if (isMobile() && !aggMode && !taskMode) {
      const tr = e.target.closest('tr[data-case-id]');
      if (tr) { const c = cases.find((x) => x.id === tr.dataset.caseId); if (c) openModal(c, 'full'); }
      return;
    }
    const actEl = e.target.closest('[data-action]');
    if (actEl) {
      const action = actEl.dataset.action;
      const id = actEl.dataset.id;
      const c = cases.find((x) => x.id === id);
      if (!c) return;
      if (action === 'edit') { if (isPrivileged(currentUser) && needsInitialReport(c)) openInitialReport(c); else openModalGuarded(c, 'full'); }
      // 二重の可能性バッジ: 相手の案件を見るか、疑いを解除するか
      else if (action === 'dup-open') {
        e.stopPropagation();
        const other = cases.find((x) => String(x.id) === String(c.dupSuspectId));
        const info = other
          ? `${other.theater || '(劇場未入力)'}／受付 ${other.receivedDate || '-'}／${(other.estimateName || other.content || '').slice(0, 40)}`
          : '(相手の案件が見つかりません。既に削除された可能性があります)';
        const ok = confirm(
          'この案件は二重登録の可能性があります。\n\n【似ている既存案件】\n' + info +
          '\n\n「OK」＝その既存案件を開いて見比べる\n「キャンセル」＝二重ではないので印を消す'
        );
        if (ok) { if (other) openModal(other, 'full'); }
        else clearDupSuspect(c);
        return;
      }
      else if (action === 'delete') {
        if (confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) {
          cases = cases.filter((x) => x.id !== id);
          removeCaseRemote(id); render();
        }
      }
      else if (action === 'duplicate') {
        const dup = Object.assign({}, c, {
          id: genId(),
          tasks: [],
          allocations: Object.assign({}, c.allocations || {}),
          updatedAt: new Date().toISOString()
        });
        cases.push(dup);
        persistCase(dup);
        render();
      }
      else if (action === 'toggle-pay') {
        c.paymentConfirmed = !c.paymentConfirmed;
        c.updatedAt = new Date().toISOString();
        if (store.mode === 'local') saveCases();
        persistCase(c);
        render();
      }
      else if (action === 'status-edit') {
        if (!isPrivileged(currentUser)) return;
        if (!statusOverrideAvailable()) {
          alert('ステータスの手動設定を使うには、データベースの更新（status_override 列の追加）が必要です。\n準備ができてから、もう一度お試しください。');
          return;
        }
        openStatusPicker(c);
      }
      return;
    }
    const td = e.target.closest('td.editable, td.viewable');
    if (!td) return;
    const c = cases.find((x) => x.id === td.dataset.caseId);
    if (!c) return;
    if (td.dataset.field === 'estimateName') {
      // 見積り名: 単クリック=インライン編集 / 同じセルの素早い再クリック(ダブル)=見積書AI-OCR
      if (nameClickTimer && nameClickTimer.id === c.id) {
        clearTimeout(nameClickTimer.t); nameClickTimer = null; openQuoteOcrModalForCase(c); return;
      }
      if (nameClickTimer) clearTimeout(nameClickTimer.t);
      nameClickTimer = { id: c.id, t: setTimeout(() => { nameClickTimer = null; startInlineEdit(td, c, 'estimateName'); }, 260) };
      return;
    }
    if (nameClickTimer) { clearTimeout(nameClickTimer.t); nameClickTimer = null; }
    if (isPrivileged(currentUser) && needsInitialReport(c)) { openInitialReport(c); return; }
    startInlineEdit(td, c, td.dataset.field);
  });

  // ダブルクリックで編集モーダルを開く（A集計モードは除く）
  // 案件編集ポップアップは各行の左端「✎ 編集」ボタンから開く（ダブルクリックでの起動は廃止）。
  // 見積り名セルのダブルクリック＝見積書AI-OCR は従来どおり別ハンドラで有効。

  // ソートは thead に委譲（A集計モードでthead差替えしても生き続ける）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (e.target.closest('.col-resizer')) return; // 列幅ドラッグは並び替え・絞り込み対象外
    // 見出し先頭の「▲」→ その列で並び替え（昇順→降順→解除）
    const sortBtn = e.target.closest('.col-sort-btn');
    if (sortBtn) {
      e.preventDefault(); e.stopPropagation();
      const th = sortBtn.closest('th[data-colkey]');
      if (th) toggleColumnSort(th.dataset.sort);
      return;
    }
    if (aggMode || taskMode) return; // A集計/タスク管理モードではソート無効
    // 見出しの文字（.th-filter）クリック → 絞り込みタブ
    const fEl = e.target.closest('.th-filter');
    if (fEl) { openColumnFilter(fEl.dataset.filter, fEl); return; }
    // それ以外（文字の横）→ 並び替え
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const field = th.dataset.sort;
    if (sortState.field === field) {
      if (sortState.direction === 'asc') sortState.direction = 'desc';
      else { sortState.field = null; sortState.direction = 'asc'; }
    } else {
      sortState.field = field;
      sortState.direction = 'asc';
    }
    render();
  });

  $('searchBox').addEventListener('input', refresh);
  $('statusFilter').addEventListener('change', refresh);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#rpReassign [data-reassign]'); if (!b) return;
    const sel = document.querySelector(`#rpReassign select[data-reto="${CSS.escape(b.dataset.reassign)}"]`);
    reassignCases(b.dataset.reassign, sel ? sel.value : '');
  });
  $('rPersonBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rperson]');
    if (!b) return;
    const name = b.dataset.rperson;
    if (name === '') rPersonFilter.clear();          // 全員
    else if (rPersonFilter.has(name)) rPersonFilter.delete(name); // 解除（トグル）
    else rPersonFilter.add(name);                     // 追加（OR）
    saveUserFilter('rpfV1', rPersonFilter);
    renderRPersonBar();
    refresh();
  });
  $('companyBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-co]');
    if (!b) return;
    const v = b.dataset.co;
    if (v === '') companyFilter.clear();
    else if (companyFilter.has(v)) companyFilter.delete(v);
    else companyFilter.add(v);
    saveUserFilter('coFV1', companyFilter);
    pruneColumnFiltersForCompany();
    renderCompanyBar();
    refresh();
  });

  // ===== 表の表示倍率（PC/スマホ共通・localStorage記憶。ブラウザのズームとは別） =====
  const ZOOM_KEY = 'tableZoomV1';
  const ZOOM_MIN = 0.5, ZOOM_MAX = 1.5, ZOOM_STEP = 0.1;
  let tableZoom = 1;
  function applyTableZoom() {
    const t = $('casesTable');
    if (t) t.style.zoom = String(tableZoom);
    const lbl = $('zoomLevel');
    if (lbl) lbl.textContent = Math.round(tableZoom * 100) + '%';
    try { localStorage.setItem(ZOOM_KEY, String(tableZoom)); } catch (e) {}
    if (typeof syncHScrollWidth === 'function') syncHScrollWidth(); // 倍率変更で表幅が変わるので上部バーを合わせる
  }
  function setZoom(z) {
    tableZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 10) / 10));
    applyTableZoom();
  }
  (function initZoom() {
    const v = parseFloat(localStorage.getItem(ZOOM_KEY));
    if (!isNaN(v) && v >= ZOOM_MIN && v <= ZOOM_MAX) tableZoom = v;
    applyTableZoom();
  })();
  $('zoomOutBtn').addEventListener('click', () => setZoom(tableZoom - ZOOM_STEP));
  $('zoomInBtn').addEventListener('click', () => setZoom(tableZoom + ZOOM_STEP));
  $('zoomResetBtn').addEventListener('click', () => setZoom(1));
  $('exportBtn').addEventListener('click', exportFiltered);

  // 大口のみ（300万円以上）トグル
  function updateBigToggleLabel() {
    setSwitch($('toggleBigBtn'), showBigOnly);
  }
  $('toggleBigBtn').addEventListener('click', () => {
    showBigOnly = !showBigOnly;
    updateBigToggleLabel();
    refresh();
  });
  updateBigToggleLabel();

  // 全件表示（完了・取り下げも表示）トグル
  // 「表示する状態 ▾」の中: 1つずつ切り替え／全部表示／7つとも隠す（中を押しても閉じない＝続けて切り替えられる）
  $('statusVisList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sv]'); if (!b) return;
    e.stopPropagation(); toggleStatusShown(b.dataset.sv);
  });
  $('statusVisAll').addEventListener('click', (e) => { e.stopPropagation(); setAllStatusShown(true); });
  $('statusVisNone').addEventListener('click', (e) => { e.stopPropagation(); setAllStatusShown(false); });

  // 税込み/税抜き表示トグル（標準=税抜き。税込みにすると「見積り金額（税込み）」列を表示）
  let showTax = false;
  $('acctToggleBtn').addEventListener('click', () => {
    const show = acctHidden();   // 今隠れている → 出す
    try { localStorage.setItem('acctColsV1', show ? '1' : '0'); } catch (e) {}
    applyAcctCols();
  });
  $('notifyPrefBtn').addEventListener('click', () => { const me = myNotifyPref(); if (me) openNotifyPrefs(me.email); });
  $('taxToggleBtn').addEventListener('click', () => {
    showTax = !showTax;
    document.body.classList.toggle('show-tax', showTax);
    setSwitch($('taxToggleBtn'), showTax);
  });

  // ===== ① 押すと開く小窓（☰ その他／自分のメニュー／色の意味） =====
  const POPOVERS = [['moreMenuBtn', 'moreMenu'], ['userMenuBtn', 'userMenu'], ['legendBtn', 'legendPop'], ['statusVisBtn', 'statusVisPop']];
  function closePopovers(exceptId) {
    POPOVERS.forEach(([b, p]) => {
      if (p === exceptId) return;
      const pop = $(p), btn = $(b);
      if (pop) pop.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }
  POPOVERS.forEach(([b, p]) => {
    const btn = $(b), pop = $(p);
    if (!btn || !pop) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = pop.classList.contains('hidden');
      closePopovers(p);
      pop.classList.toggle('hidden', !willOpen);
      if (willOpen) keepPopInView(pop);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    // 中の機能を押したら閉じる（表示倍率の －／＋ は続けて押せるよう閉じない）
    pop.addEventListener('click', (e) => {
      const item = e.target.closest('button');
      if (item && !item.closest('.zoom-control') && !item.closest('#statusVisPop')) closePopovers();
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hdr-pop-wrap, .fb-pop-wrap')) closePopovers();
  });
  // 狭い画面で上部が折り返すと、小窓が画面の外にはみ出すことがある → はみ出した分だけ内側へずらす
  function keepPopInView(pop) {
    pop.style.setProperty('--pop-dx', '0px');
    const r = pop.getBoundingClientRect();
    const margin = 8;
    let dx = 0;
    if (r.left < margin) dx = margin - r.left;
    else if (r.right > window.innerWidth - margin) dx = (window.innerWidth - margin) - r.right;
    pop.style.setProperty('--pop-dx', Math.round(dx) + 'px');
  }
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = POPOVERS.some(([, p]) => $(p) && !$(p).classList.contains('hidden'));
    if (open) { closePopovers(); e.stopPropagation(); }
  }, true);

  // ☰ の中の機能（A集計・工程表など）を開いている間は、上に「✕ ○○を閉じる」を出す。
  // 各機能はボタンの文字を「✕ …を閉じる」に変えるので、それを見て同じボタンを押す
  function syncModeCloseBtn() {
    const btn = $('modeCloseBtn'); if (!btn) return;
    const phone = isMobile();
    const active = Array.prototype.find.call($('moreMenu').querySelectorAll('.pop-item'),
      (el) => (phone || !el.classList.contains('m-proxy')) && (el.textContent || '').trim().indexOf('✕') === 0);
    btn.classList.toggle('hidden', !active);
    btn.textContent = active ? active.textContent.trim() : '';
    btn.dataset.target = active ? (active.dataset.proxy || active.id) : '';
  }
  $('modeCloseBtn').addEventListener('click', () => {
    const t = $($('modeCloseBtn').dataset.target || '');
    if (t) t.click();
  });
  new MutationObserver(syncModeCloseBtn).observe($('moreMenu'), { subtree: true, childList: true, characterData: true });

  // ⑨ スマホ: 上に並べきれないボタン（簡易登録・カレンダー・登録確認・劇場情報更新確認）を ☰ の中に写す。
  // 文字・件数・表示/非表示は元のボタンに合わせ、押すと元のボタンを押したのと同じ動きにする
  function syncMenuProxies() {
    let pending = 0;
    document.querySelectorAll('#moreMenu .m-proxy').forEach((px) => {
      const orig = $(px.dataset.proxy); if (!orig) return;
      const cl = orig.cloneNode(true);
      cl.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      if (px.innerHTML !== cl.innerHTML) px.innerHTML = cl.innerHTML;
      px.classList.toggle('m-hidden', orig.classList.contains('hidden'));
      const badge = orig.querySelector('.tp-badge:not(.hidden)');
      if (badge && !orig.classList.contains('hidden')) pending += Number(badge.textContent) || 0;
    });
    const mb = $('moreBadge');
    if (mb) {
      mb.innerHTML = pending ? `<span class="bl">確認</span>${pending}` : '';
      mb.classList.toggle('hidden', !pending);
      $('moreMenuBtn').title = pending ? `登録確認・劇場情報更新確認の確認待ち ${pending} 件（☰ の中）` : '';
    }
  }
  ['quickCaseBtn', 'calBtn', 'intakeBtn', 'theaterPendingBtn'].forEach((id) => {
    if ($(id)) new MutationObserver(syncMenuProxies).observe($(id), { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
  });
  syncMenuProxies();
  $('moreMenu').addEventListener('click', (e) => {
    const px = e.target.closest('.m-proxy'); if (!px) return;
    const orig = $(px.dataset.proxy); if (orig) orig.click();
  });
  // ⑨ スマホ: 右下の「＋ 新規登録」
  $('fabNewBtn').addEventListener('click', () => $('newCaseBtn').click());
  // ⑨ スマホ: カードをタップ → 編集（タスク管理中はそのタスクの編集）
  function openFromCard(card) {
    const c = cases.find((x) => String(x.id) === String(card.dataset.mcase)); if (!c) return;
    if (isPrivileged(currentUser) && needsInitialReport(c)) { openInitialReport(c); return; }
    if (taskMode) openTaskModal(c); else openModal(c, 'full');
  }
  $('mobileCards').addEventListener('click', (e) => {
    const bell = e.target.closest('[data-bell]');
    if (bell) { e.stopPropagation(); toggleBell(bell.dataset.bell); return; }
    const card = e.target.closest('.m-card'); if (card) openFromCard(card);
  });
  $('mobileCards').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.m-card'); if (!card) return;
    e.preventDefault(); openFromCard(card);
  });
  // PC ⇔ スマホの幅をまたいだら（画面の回転など）、カード・☰の中身・閉じるボタンを合わせ直す
  if (window.matchMedia) {
    const mq = window.matchMedia('(max-width: 600px)');
    const onChange = () => { if (currentUser) { refresh(); hideEmptyToolbarGroups(); syncModeCloseBtn(); } };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  // ⑤ 状態ごとの件数ボタン・注意ボタン
  $('statusChips').addEventListener('click', (e) => {
    const attn = e.target.closest('[data-attn]');
    if (attn) {
      attentionFilter = (attentionFilter === attn.dataset.attn) ? '' : attn.dataset.attn;
      $('statusFilter').value = '';
      refresh();
      return;
    }
    const chip = e.target.closest('[data-chip-status]');
    if (!chip) return;
    const v = chip.dataset.chipStatus;
    attentionFilter = '';
    $('statusFilter').value = ($('statusFilter').value === v) ? '' : v;
    refresh();
  });

  // ① 表の高さを「画面の残り」にぴったり合わせる。
  // 上の部分より表が長いとページ全体がスクロールし、列の見出しが上の部分の裏に隠れていたため
  function fitTableHeight() {
    const wrap = document.querySelector('main > .table-wrap');
    if (!wrap || wrap.offsetParent === null) return;
    const top = Math.round(wrap.getBoundingClientRect().top + window.scrollY);
    document.documentElement.style.setProperty('--table-top', top + 'px');
  }
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => fitTableHeight());
    ['appHeader', 'filterBar', 'personTaskPanel', 'hScrollTop', 'aggBar'].forEach((id) => { if ($(id)) ro.observe($(id)); });
  }
  window.addEventListener('resize', fitTableHeight);
  window.addEventListener('resize', () => { if (calMode) renderCalendar(); });   // 全画面のカレンダーは画面の高さに合わせる

  // 列幅ドラッグ: 通常モードのthead にハンドルを付与してから保存（復元してもハンドルが残る）
  addResizers($('casesTable').querySelector('thead'));
  applyColWidths();
  // ハンドルのドラッグは table へ委譲（thead差替えでも生き続ける）
  $('casesTable').addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.col-resizer');
    if (!h) return;
    const th = h.closest('th');
    const field = fieldOfTh(th);
    if (field) startColResize(th, field, e);
  });

  // ⑥ だれが入れる欄か（菱熱の画面だけに出す）。AI が入れる欄だけ色を付ける
  markFieldSources();
  // 通常モードのthead HTMLを保存（A集計から戻す用）
  NORMAL_THEAD_HTML = $('casesTable').querySelector('thead').innerHTML;

  // 列の並べ替え（ドラッグ）と上部横スクロールバーの同期を有効化
  bindColumnDrag();
  bindHScroll();
  if ($('hscrollPosBtn')) $('hscrollPosBtn').addEventListener('click', () => {
    const cur = localStorage.getItem(userFilterKey('hscrollPosV1')) || 'top';
    try { localStorage.setItem(userFilterKey('hscrollPosV1'), cur === 'bottom' ? 'top' : 'bottom'); } catch (e) {}
    applyHScrollPos();
  });
  if ($('colOrderResetBtn')) $('colOrderResetBtn').addEventListener('click', resetColumnOrder);

  // リアルタイム: 他ユーザーの変更を画面へ反映（Supabaseモードのみ）
  function isEditingNow() {
    return !!document.querySelector('.inline-edit')
      || !$('modal').classList.contains('hidden')
      || !$('invoiceModal').classList.contains('hidden')
      || !$('contentModal').classList.contains('hidden')
      // 支払い状況モードの入力欄にフォーカス中は再描画を抑制（入力・カーソルを守る）
      || !!(purchaseMode && document.activeElement && document.activeElement.closest && document.activeElement.closest('#casesTable .pv-cell'));
  }
  function onRemoteChange(payload) {
    try {
      if (payload.eventType === 'DELETE') {
        const oid = payload.old && payload.old.id;
        if (oid) cases = cases.filter((c) => c.id !== oid);
      } else if (payload.new) {
        // 打合せモードでは、選んだ会社以外の更新は取り込まない
        if (meetingActive(currentUser) && payload.new.company !== meetingCompany) { cases = cases.filter((c) => c.id !== payload.new.id); return; }
        const mapped = meetingScrub([rowToCase(payload.new)])[0] || rowToCase(payload.new);
        const i = cases.findIndex((c) => c.id === mapped.id);
        if (i >= 0) cases[i] = mapped; else cases.push(mapped);
      }
      notifyCasesChanged();
      // 編集中は再描画を抑制（次の操作時に反映される）
      if (!isEditingNow()) refresh();
    } catch (e) { console.error('realtime適用エラー', e); }
  }

  // ---------- 起動 ----------
  async function init() {
    // 万一、起動の途中で止まっても真っ白のままにしない（ログイン画面を出す）
    setTimeout(() => { if (document.body.classList.contains('booting')) document.body.classList.remove('booting'); }, 15000);
    store.init();
    // 工程表(kotei.js)が同じSupabaseクライアント・モード・担当者/会社マスタを共有できるよう橋渡し
    window.CINEMA_DB = {
      client: () => sb,
      // 劇場名をゆるく探す（短い名前・別の呼び方。1つに決まらなければ ''）・会社の略称
      findTheater: (v, co) => { try { return theaterLoose(v, co); } catch (e) { return ''; } },
      companyAbbr: (n) => { try { return companyAbbr(n); } catch (e) { return n; } },
      mode: () => store.mode,
      teams: () => { try { return loadTeam(); } catch (e) { return []; } },
      companies: () => { try { return companies.map((c) => ({ name: c.name, abbr: c.abbr, officialName: c.officialName || '' })); } catch (e) { return []; } },
      // 書類棚(shelf.js)用: 劇場マスタ・案件（見えている分）・ログイン中の人
      theaters: () => { try { return theaterMaster.map((t) => ({ name: t.name, company: t.company, address: t.address || '', manager: t.manager || '', theaterPhone: t.theaterPhone || '', maintenance: t.maintenance || '', gem2: t.gem2 || '', gem2Co2: t.gem2Co2 || '', gem2Th: t.gem2Th || '', homepage: t.homepage || '', closed: !!t.closed, closedOn: t.closedOn || '', closedNote: t.closedNote || '' })); } catch (e) { return []; } },
      cases: () => { try { return visibleCases().map((c) => ({ id: c.id, company: c.company, theater: c.theater, title: c.title || '', estimateName: c.estimateName || '', content: c.content || '', receivedDate: c.receivedDate || '', category: c.category || '', status: deriveStatus(c), surveyDate: c.surveyDate || '', workEndDate: c.workEndDate || '', tcPerson: c.tcPerson || '', rPerson: c.rPerson || '' })); } catch (e) { return []; } },
      // 工事予定表(plan.js)用: 案件の一覧（見えている分）と、案件を直す（予定表で直した項目を案件にも入れる）
      casesFull: () => { try { return visibleCases().map((c) => ({ id: c.id, company: c.company, theater: c.theater, estimateName: c.estimateName || '', content: c.content || '', estimateAmount: c.estimateAmount, marginRate: c.marginRate, rPerson: c.rPerson || '', workStartDate: c.workStartDate || '', workEndDate: c.workEndDate || '', receivedDate: c.receivedDate || '', status: deriveStatus(c) })); } catch (e) { return []; } },
      updateCase: (id, patch, opts) => {
        const c = cases.find((x) => String(x.id) === String(id));
        if (!c || !isPrivileged(currentUser)) return false;
        const ok = ['estimateName', 'estimateAmount', 'marginRate', 'rPerson', 'surveyDate', 'workStartDate', 'workEndDate'];
        Object.keys(patch || {}).forEach((k) => { if (ok.indexOf(k) !== -1) c[k] = patch[k] == null ? '' : patch[k]; });
        // 編集パネルでこの案件を開いている時は、パネルの日付の欄も合わせる（あとで保存しても消えないように）
        if (cmCaseId === String(id) && !$('modal').classList.contains('hidden')) {
          const clean = caseFormSnapshot() === modalSnapshot;
          ['surveyDate', 'workStartDate', 'workEndDate'].forEach((k) => { if (k in (patch || {}) && $(k)) setDateField(k, c[k]); });
          if (clean) modalSnapshot = caseFormSnapshot();
        }
        if (store.mode === 'local') saveCases();
        persistCase(c, opts && opts.quiet ? 'ryo_quiet' : undefined);   // 作業申請書から入れた日付は、申請書の通知で知らせるので聞かない
        if (!planMode) refresh();
        return true;
      },
      // 劇場カルテ(karte.js)用: 不具合の履歴の行から案件を開く
      openCase: (id) => { try { const c = cases.find((x) => String(x.id) === String(id)); if (c) openModalGuarded(c, 'full'); } catch (e) { console.warn(e); } },
      shortTheater: (name) => shortTheaterName(name),
      userEmail: () => (currentUser && currentUser.email) || '',
      // 作業申請書の自動作成(workapp.js)用: 案件の中身・担当者マスター・書類を変えた後の描き直し・通知メールの宛先の文
      caseInfo: (id) => { const c = cases.find((x) => String(x.id) === String(id)); return c ? { id: c.id, company: c.company || '', theater: c.theater || '', title: c.title || '', content: c.content || '', category: c.category || '', estimateName: c.estimateName || '', surveyDate: c.surveyDate || '', workStartDate: c.workStartDate || '', workEndDate: c.workEndDate || '', rPerson: c.rPerson || '', tcPerson: c.tcPerson || '', estimateAmount: c.estimateAmount,
        theaterShort: shortTheaterName(c.theater) || c.theater || '', theaterAddress: ((theaterMaster.find((t) => t.name === c.theater) || {}).address) || '' } : null; },
      staff: () => (staffList || []).map((x) => ({ name: x.name, phone: x.phone || '', email: x.email || '', active: x.active !== false, quals: x.quals || {}, qualsOn: Object.prototype.hasOwnProperty.call(x, 'quals') })),
      userName: () => currentUserName(),
      toast: (t) => showToastLite(t),
      mailTo: async (id) => { const c = cases.find((x) => String(x.id) === String(id)); try { return c ? await caseMailRecipientsText(c) : ''; } catch (e) { return ''; } },
      afterWorkapp: async (id) => { await loadWorkappStates(); render(); const c = cases.find((x) => String(x.id) === String(id)); if (c && cmCaseId === String(id)) renderCaseMailSec(c); },
      // 調査・作業ごとの作業申請書の状態（none/draft/final/skip/manual/stale）と、決めていない予定を探す用の案件一覧
      waState: (id, purpose) => { const c = cases.find((x) => String(x.id) === String(id)); return c ? waState(c, purpose) : null; },
      waCases: () => cases.filter((c) => c.company === WA_COMPANY && isOpenCase(c) && (c.surveyDate || c.workStartDate)).map((c) => ({ id: c.id, theater: c.theater || '', company: c.company || '', rPerson: c.rPerson || '', title: c.title || '', surveyDate: c.surveyDate || '', workStartDate: c.workStartDate || '' }))
    };
    // モードに応じたログイン画面ヒント
    const hintEl = $('loginHint');
    if (hintEl) {
      hintEl.textContent = store.mode === 'local'
        ? '※ テストモード: パスワードはメールアドレスの@より前の部分（小文字）で入れます'
        : '※ ログインに使うメール・パスワードは管理者にご確認ください';
    }
    renderDatalists();
    try { companies = await store.fetchCompanies(); } catch (e) { /* 既定値のまま */ }
    try { theaterMaster = await store.fetchTheaterMaster(); } catch (e) { /* 既定値のまま */ }
    populateCompanySelects();
    let sess = null;
    try { sess = await store.getSession(); } catch (e) { sess = null; }
    if (sess) {
      currentUser = sess;
      try { cases = await store.fetchCases(); } catch (e) { cases = []; onPersistError(e); }
      store.subscribe(onRemoteChange);
      showApp();
    } else {
      showLogin();
    }
  }
  init();
})();
