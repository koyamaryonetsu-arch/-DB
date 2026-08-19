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
    { name: 'シネマサンシャイン', abbr: 'SS',     officialName: '佐々木興業株式会社',           hqAddress: '東京都豊島区東池袋1-30-3 大正堂ビル' }
  ];
  const CATEGORIES = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'タスク', 'その他'];
  // 色判定を除外するカテゴリ
  const NO_COLOR_CATEGORIES = new Set(['更新案件', 'その他']);
  // 完了以降のステータス（黄/赤の遅延色を解除して通常表示に戻す）
  const NO_COLOR_STATUSES = new Set(['対応済み', '完了', '請求済', '入金済']);
  const DEFAULT_MARGIN_RATE = 20;
  // 経営集計のデフォルトチームと配分ルール
  const DEFAULT_TEAM = ['小山', '細萱', '大和', '山口', '金子', '若山', '伊藤', '藤村', '山本'];
  const EXCLUDED_FROM_BASE = '山本'; // 一律5%対象外
  const SMALL_CASE_THRESHOLD = 3000000;
  const BASE_RATE = 5; // %
  const PRIVILEGED_DOMAIN = 'ryonetsu.com';
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
    toho: { '見積り提出済': '見積り受領済', '請求済': '請求書受領済',    '入金済': '支払済', '失注': '他社依頼' }
  };
  // 客先ごとの「客先担当者」表示名（TC担当者 の置換）
  const CUSTOMER_TC_LABEL = { 'TOHOシネマズ': 'TC担当者', '109シネマズ': '109担当者', 'ユナイテッドシネマ': 'UC担当者' };
  // 客先ごとの「顧客メモ」表示名（客先アカウントでは ○○メモ に。菱熱では「顧客メモ」）
  const CUSTOMER_MEMO_LABEL = { 'TOHOシネマズ': 'TOHOメモ', '109シネマズ': '109メモ', 'ユナイテッドシネマ': 'UCメモ' };
  // 客先に渡してよい cases のカラム（社内情報 memo/advice_note/allocations/margin_rate/tasks/created_by/updated_by は除外）
  const CUSTOMER_CASE_COLUMNS = [
    'id', 'company', 'theater', 'received_date', 'tc_person', 'r_person', 'category', 'content',
    'survey_date', 'cert_number', 'estimate_name', 'estimate_amount', 'quote_date',
    'work_start_date', 'work_end_date', 'invoice_date', 'payment_date', 'status', 'status_override',
    'schedule_adjusting', 'payment_confirmed', 'survey_time', 'work_start_time', 'work_end_time',
    'customer_memo', 'last_update_source', 'created_at', 'updated_at'
  ].join(',');
  const STATUS_FILTER_OPTIONS_RYO  = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済'];
  const STATUS_FILTER_OPTIONS_TOHO = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済']; // values unchanged; labels swap
  // ステータス絞り込みの並び順（列フィルタで status を出す時の順序）
  const STATUS_FILTER_ORDER = ['受付','見積り中','見積り提出済','日程調整中','作業中','対応済み','客先対応中','請求済','入金済','保留','取り下げ','完了','失注'];
  // ログイン時に既定で非表示にするステータス（ステータス列のチェックボックスから外れた状態にする）。
  // 「全件表示」ボタンで一時的に全部見せられる。
  const DEFAULT_HIDDEN_STATUSES = ['完了', '入金済', '取り下げ', '失注'];
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
    '109シネマズ グランベリーパーク': '南町田',
    // --- ユナイテッドシネマ ---
    'ユナイテッドシネマ アクアシティお台場': 'お台場',
    // --- 佐々木興業（シネマサンシャイン）---
    'シネマサンシャインエミフルMASAKI': '松前'
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
  function shortTheaterName(name) {
    if (!name) return '';
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

  const EDITABLE_FIELDS = {
    company:        { type: 'select',   dynamicOptions: 'company', privilegedOnly: true },
    theater:        { type: 'datalist', listId: 'theaterList' },
    receivedDate:   { type: 'date' },
    tcPerson:       { type: 'datalist', listId: 'tcPersonList' },
    rPerson:        { type: 'datalist', listId: 'rPersonList' },
    category:       { type: 'select',   options: [''].concat(CATEGORIES) },
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
  function scheduleAdjustAvailable() { return store.mode === 'local' || scheduleAdjustSupported; }
  // cases.payment_confirmed 列がDBに存在するか（入金 予定/確認・同上）
  let paymentConfirmedSupported = false;
  function paymentConfirmedAvailable() { return store.mode === 'local' || paymentConfirmedSupported; }
  // cases.survey_time / work_start_time 列がDBに存在するか（カレンダー用時刻）
  let timeFieldsSupported = false;
  let workEndTimeSupported = false;
  // cases.advice_note 列（Lv4: 人が確定した正しい対応メモ＝学習データ）
  let adviceNoteSupported = false;
  // theaters.equipment/chronic_issues/partner 列（Lv3: 劇場カルテ）
  let theaterKarteSupported = false;
  let theaterInfoSupported = false;      // theaters に manager 等の劇場情報列があるか
  let theaterContactsSupported = false;  // theater_contacts テーブルがあるか
  let theaterPendingSupported = false;   // theater_info_pending テーブルがあるか
  let theaterPending = [];               // 劇場情報 自動更新の要確認キュー
  const DATE_FIELDS = new Set(['receivedDate', 'surveyDate', 'quoteDate', 'workStartDate', 'workEndDate', 'invoiceDate', 'paymentDate']);

  // app(camelCase) → DB行(snake_case)。空文字の日付/金額は null に
  function caseToRow(c) {
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
    if (paymentConfirmedSupported) row.payment_confirmed = (c.paymentConfirmed !== false);
    if (timeFieldsSupported) {
      row.survey_time = c.surveyTime ? c.surveyTime : null;
      row.work_start_time = c.workStartTime ? c.workStartTime : null;
    }
    if (workEndTimeSupported) row.work_end_time = c.workEndTime ? c.workEndTime : null;
    if (adviceNoteSupported) row.advice_note = c.adviceNote ? c.adviceNote : null;
    // 顧客メモ（列がある時のみ送信）。客先が記入する項目
    if (customerMemoSupported) row.customer_memo = c.customerMemo ? c.customerMemo : null;
    // 支払い状況（菱熱のみの購買情報・列がある時のみ送信）
    if (purchasesSupported) row.purchases = Array.isArray(c.purchases) ? c.purchases : [];
    // 操作元（通知文言用）: 菱熱=ryo / 客先=customer。要約時も消えないよう毎回保存（列がある時のみ）
    if (lastUpdateSourceSupported) row.last_update_source = isPrivileged(currentUser) ? 'ryo' : 'customer';
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
      if (this.mode === 'local') return loadCases();
      // 客先には社内情報カラム（社内用メモ/AI学習メモ/粗利配分/タスク）をデータごと渡さない
      const cols = isPrivileged(currentUser) ? '*' : CUSTOMER_CASE_COLUMNS;
      const { data, error } = await sb.from('cases').select(cols);
      if (error) throw error;
      return (data || []).map(rowToCase);
    },
    async upsertCase(c) {
      if (this.mode === 'local') { saveCases(); return; }
      const { error } = await sb.from('cases').upsert(caseToRow(c));
      if (error) throw error;
    },
    async upsertCases(arr) {
      if (this.mode === 'local') { saveCases(); return; }
      if (!arr.length) return;
      const { error } = await sb.from('cases').upsert(arr.map(caseToRow));
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
      return data.map((r) => ({
        name: r.name, company: r.company, address: r.address || '',
        equipment: r.equipment || '', chronicIssues: r.chronic_issues || '', partner: r.partner || '',
        manager: r.manager || '', theaterPhone: r.theater_phone || '',
        maintenance: r.maintenance || '', gem2: r.gem2 || '', infoNote: r.info_note || ''
      }));
    },
    async upsertTheater(t) {
      if (this.mode === 'local') { saveTheaterMaster(theaterMaster); return; }
      const payload = { name: t.name, company: t.company, address: t.address || '' };
      if (theaterKarteSupported) {
        payload.equipment = t.equipment || '';
        payload.chronic_issues = t.chronicIssues || '';
        payload.partner = t.partner || '';
      }
      if (theaterInfoSupported) {
        payload.manager = t.manager || '';
        payload.theater_phone = t.theaterPhone || '';
        payload.maintenance = t.maintenance || '';
        payload.gem2 = t.gem2 || '';
        payload.info_note = t.infoNote || '';
      }
      const { error } = await sb.from('theaters').upsert(payload);
      if (error) throw error;
    },
    // ---- 各劇場情報: パートナー連絡先（theater_contacts） ----
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
          if (col === 'manager' && cur.manager && cur.manager !== item.value) {
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
  function persistCase(c) { return Promise.resolve(store.upsertCase(c)).catch(onPersistError); }
  function persistCases(arr) { return Promise.resolve(store.upsertCases(arr)).catch(onPersistError); }
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
  // ログイン時に「完了・取り下げ」をチェックから外した状態で開始する
  function seedDefaultStatusFilter() { columnFilters['status'] = defaultStatusVisibleSet(); }
  // いま完了・取り下げも表示されているか（フィルタ無し or その2つがチェック済み）
  function statusAllShown() {
    const set = columnFilters['status'];
    return !set || DEFAULT_HIDDEN_STATUSES.every((s) => set.has(s));
  }
  function updateShowAllBtn() {
    const btn = $('showAllBtn'); if (!btn) return;
    const on = statusAllShown();
    btn.textContent = on ? '全件表示：ON' : '全件表示：OFF';
    btn.classList.toggle('active', on);
  }
  // 「全件表示」ボタン: 完了・取り下げも含めて全部表示 ↔ 既定（完了・取り下げ非表示）を切替
  function toggleShowAllStatuses() {
    if (statusAllShown()) columnFilters['status'] = defaultStatusVisibleSet(); // 既定に戻す
    else delete columnFilters['status'];                                       // 全部表示
    refresh();
  }
  // R担当者ボタンによる絞り込み（空=全員）。複数選択時はいずれかが担当の案件（OR）
  let rPersonFilter = new Set();
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
  function saveCases() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); }
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
  // 案件の劇場名と完全一致する master 行を返す（無ければ undefined）
  function findTheaterInMaster(name) {
    if (!name) return undefined;
    return theaterMaster.find((t) => t.name === name);
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
    return cases.filter((c) => c.company === co && c.category !== 'タスク');
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
    fillDatalist('theaterList', [...theaters].sort());
    fillDatalist('tcPersonList', [...tcPersons].sort());
    fillDatalist('rPersonList', [...rPersons].sort());
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
  function loadTeam() {
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
  function isPrivileged(user) { return !!(user && user.domain === PRIVILEGED_DOMAIN); }
  // 客先ユーザーが閲覧できる会社名（受注者=ryonetsuはnull＝全社）。未知の客先ドメインは既定でTOHO。
  function customerCompany(user) {
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
    return map[code] || code;
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

  function rowColorClass(c) {
    const st = statusOf(c);
    if (st === '保留') return '';
    if (st === '日程調整中') return ''; // 日程調整中は注意喚起色なし
    // 完了・対応済み・請求済・入金済 は色なし
    if (NO_COLOR_STATUSES.has(st)) return '';
    // 客先対応中・見積り提出済 → 文字全体を青（種別を問わず全ての種別で適用）
    if (st === '見積り提出済' || st === '客先対応中') return 'row-blue';
    // 以降の遅延色（黄・赤・黄緑）は 種別＝修理 のときだけ適用
    if (c.category !== '修理') return '';
    const today = todayStr();
    // 調査日が未記入 → 黄（受付から3営業日以上＝土日祝を除く）。調査日を記入すると解除
    if (!c.surveyDate) {
      if (c.receivedDate) {
        if (businessDaysBetween(c.receivedDate, today) >= 3) return 'row-yellow';
      }
      return '';
    }
    // 見積り中（調査済・見積り未提出）→ 調査日から3営業日未満は黄緑、3営業日以上は赤
    if (st === '見積り中') {
      if (businessDaysBetween(c.surveyDate, today) >= 3) return 'row-red';
      return 'row-yellowgreen';
    }
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
    '受付': 1, '見積り中': 2, '見積り提出済': 3, '日程調整中': 3.2, '客先対応中': 3.5, '作業中': 4,
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
    if (cls === 'row-red') return 0;
    if (cls === 'row-yellow') return 1;
    return 2;
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
    const v = c[field];
    return v != null ? String(v) : '';
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
    return th ? th.textContent.trim() : field;
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
    // 候補値（ロール別の可視案件から）を収集
    const counts = new Map();
    visibleCases().forEach((c) => {
      const v = columnValue(c, field);
      counts.set(v, (counts.get(v) || 0) + 1);
    });
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
  function getFilteredCases() {
    const q = $('searchBox').value.trim().toLowerCase();
    const sf = $('statusFilter').value;
    // 客先は自社のみ（会社プルダウンは廃止。受注者は列フィルタで会社を絞る）
    const cf = isPrivileged(currentUser) ? '' : customerCompany(currentUser);
    const colFilterFields = Object.keys(columnFilters);
    const isCustomer = !isPrivileged(currentUser);
    const filtered = cases.filter((c) => {
      if (cf && c.company !== cf) return false;
      // 客先には 種別=タスク の案件を見せない
      if (isCustomer && c.category === 'タスク') return false;
      // 客先には 取り下げ の案件を見せない（社内で取り下げた案件）
      if (isCustomer && statusOf(c) === '取り下げ') return false;
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
      // 「完了・取り下げ」の既定非表示は、ログイン時に seed する columnFilters['status'] で行う
      // （＝チェックボックスの状態＝表示、が常に一致する）。上の列フィルタのループで反映済み。
      if (!q) return true;
      const hayArr = [c.company, c.theater, shortTheaterName(c.theater), c.tcPerson, c.rPerson, c.category, c.content,
        c.certNumber, c.estimateName, String(c.estimateAmount || ''),
        c.receivedDate, c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate,
        c.customerMemo, statusOf(c), statusDisplayLabel(statusOf(c))];
      // memo は ryonetsu ユーザーのみ検索対象（情報漏洩防止）
      if (isPrivileged(currentUser)) hayArr.push(c.memo);
      const hay = hayArr.map((x) => (x || '').toString().toLowerCase()).join(' ');
      return hay.includes(q);
    });
    return sortCases(filtered);
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
    surveyDate: '調査日', certNumber: '認証番号', estimateName: '見積り名',
    estimateAmount: '見積り金額', quoteDate: '見積り提出日', workStartDate: '作業開始日',
    workEndDate: '作業完了日', invoiceDate: '請求書発行日', paymentDate: '入金日', memo: '社内メモ',
    customerMemo: '顧客メモ'
  };
  function isMobile() { return window.matchMedia ? window.matchMedia('(max-width: 600px)').matches : (window.innerWidth <= 600); }
  function editableTd(c, field, displayHtml, extraClass) {
    const cfg = EDITABLE_FIELDS[field];
    const canEdit = !(cfg.privilegedOnly && !isPrivileged(currentUser))
                  && !(cfg.readonlyForCustomer && !isPrivileged(currentUser))
                  && !(cfg.tohoOnly && c.company !== 'TOHOシネマズ');
    const cls = (canEdit ? 'editable' : '') + (c[field] ? '' : ' empty') + (extraClass ? ' ' + extraClass : '');
    const title = field === 'estimateName' ? ' title="ダブルクリックで見積書を読み取り（AI-OCR）"' : '';
    return `<td class="${cls}" data-field="${field}" data-colkey="${field}" data-case-id="${escapeHtml(c.id)}" data-label="${escapeHtml(FIELD_LABELS[field] || '')}"${title}>${displayHtml}</td>`;
  }

  // ステータスのセル（バッジ＋手動選択。受注者のみ編集可）— 通常/タスク両モードで共有
  function buildStatusCell(c) {
    const statusCode = statusOf(c);
    const manualStatus = isStatusManual(c);
    const statusHtml = `<span class="status-badge status-${escapeHtml(statusCode)}${manualStatus ? ' manual' : ''}">${escapeHtml(statusDisplayLabel(statusCode))}</span>`;
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
    return `<span class="company-tag company-${safeClass(c.company)}"${cStyle} title="${escapeHtml(c.company)}">${escapeHtml(companyAbbr(c.company))}</span>`;
  }
  function render() {
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
        : `<td class="toho-empty" data-colkey="certNumber" data-label="認証番号">—</td>`;

      tr.innerHTML = `
        <td class="col-edit" data-colkey="edit" data-label="編集"><button type="button" class="row-edit-btn" data-action="edit" data-id="${escapeHtml(c.id)}" title="編集">✎ 編集</button></td>
        ${statusCell}
        ${editableTd(c, 'company', companyHtml, 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(shortTheaterName(c.theater)))}
        ${editableTd(c, 'receivedDate', fmtDateShort(c.receivedDate))}
        ${editableTd(c, 'tcPerson', escapeHtml(stripHonorific(c.tcPerson)))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'category', escapeHtml(c.category))}
        ${editableTd(c, 'content', dupBadgeHtml(c) + escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'surveyDate', escapeHtml(fmtDateTime(c.surveyDate, c.surveyTime)))}
        ${certHtml}
        ${editableTd(c, 'estimateName', escapeHtml(c.estimateName))}
        ${editableTd(c, 'estimateAmount', fmtAmount(c.estimateAmount))}
        <td class="col-tax" data-colkey="tax" data-label="見積り金額(税込)">${fmtAmount(taxIncludedAmount(c.estimateAmount))}</td>
        ${editableTd(c, 'quoteDate', fmtDateShort(c.quoteDate))}
        ${editableTd(c, 'workStartDate', escapeHtml(fmtDateTime(c.workStartDate, c.workStartTime)))}
        ${editableTd(c, 'workEndDate', escapeHtml(fmtDateTime(c.workEndDate, c.workEndTime)))}
        ${editableTd(c, 'invoiceDate', fmtDateShort(c.invoiceDate))}
        ${payCell}
        ${editableTd(c, 'customerMemo', escapeHtml(c.customerMemo), 'col-customer-memo')}
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
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
    syncHScrollWidth();   // 上部横スクロールバーの幅を合わせる
  }

  // ===== 列の並べ替え（個人設定・ドラッグ） =====
  const DEFAULT_COLUMN_KEYS = ['edit', 'status', 'company', 'theater', 'receivedDate', 'tcPerson', 'rPerson', 'category', 'content', 'surveyDate', 'certNumber', 'estimateName', 'estimateAmount', 'tax', 'quoteDate', 'workStartDate', 'workEndDate', 'invoiceDate', 'paymentDate', 'customerMemo', 'memo'];
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
    const out = saved.filter((k) => keys.indexOf(k) !== -1);
    keys.forEach((k) => { if (out.indexOf(k) === -1) out.push(k); }); // 新設列は末尾に補完
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
  function setupColumnDrag() {
    if (aggMode) return;
    const head = activeTheadRow(); if (!head) return;
    head.querySelectorAll('th[data-colkey]').forEach((th) => { th.draggable = true; });
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
  let hScrollSyncing = false;
  function syncHScrollWidth() {
    const inner = $('hScrollTopInner'); const tbl = $('casesTable');
    if (inner && tbl) inner.style.width = tbl.scrollWidth + 'px';
  }
  function bindHScroll() {
    const wrap = document.querySelector('.table-wrap'); const top = $('hScrollTop');
    if (!wrap || !top) return;
    top.addEventListener('scroll', () => { if (hScrollSyncing) return; hScrollSyncing = true; wrap.scrollLeft = top.scrollLeft; hScrollSyncing = false; });
    wrap.addEventListener('scroll', () => { if (hScrollSyncing) return; hScrollSyncing = true; top.scrollLeft = wrap.scrollLeft; hScrollSyncing = false; });
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
    if (cfg.readonlyForCustomer && !isPrivileged(currentUser)) return; // 内容は客先は閲覧のみ
    if (cfg.tohoOnly && c.company !== 'TOHOシネマズ') return;
    if (cfg.type === 'popup') { openContentModal(c, field); return; }

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
        el = document.createElement('input'); el.type = 'number'; el.min = '0'; el.step = '1'; break;
      case 'select': {
        el = document.createElement('select');
        const opts = cfg.dynamicOptions === 'company' ? companyNames() : cfg.options;
        opts.forEach((opt) => { const o = document.createElement('option'); o.value = opt; o.textContent = opt === '' ? '(未選択)' : opt; el.appendChild(o); });
        break;
      }
      case 'datalist': el = document.createElement('input'); el.type = 'text'; el.setAttribute('list', cfg.listId); break;
      case 'textarea': el = document.createElement('textarea'); el.rows = 2; break;
      default:         el = document.createElement('input'); el.type = 'text';
    }
    el.className = 'inline-edit' + (cfg.type === 'date' ? ' smart-date' : '');
    // 日付セルは編集中は YYYY/MM/DD で表示
    el.value = cfg.type === 'date' ? fmtDateFull(oldVal) : oldVal;
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
          alert('日付として認識できません: ' + newVal + '\n例: 5/28 / 0528 / 2026/5/28');
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
      if (cfg.type === 'number') newVal = (newVal === '' ? '' : Number(newVal));
      if (field === 'tcPerson') newVal = stripHonorific(newVal); // 客先担当者の「さん／様」は保存時に除去

      if (String(newVal) !== String(oldVal)) {
        c[field] = newVal;
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
  function updateTohoVisibility() {
    const isToho = $('company').value === 'TOHOシネマズ';
    document.querySelectorAll('.toho-only-field').forEach((el) => el.classList.toggle('hidden', !isToho));
  }
  function setDateField(id, iso) { $(id).value = fmtDateFull(iso); }
  function readDateField(id, label) {
    const raw = $(id).value.trim();
    if (raw === '') return '';
    const parsed = parseSmartDate(raw);
    if (parsed === null) {
      alert(`${label}の日付が認識できません: ${raw}\n例: 5/28 / 0528 / 2026/5/28`);
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
      $('theater').value = caseObj.theater || '';
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
      if ($('adviceNote')) $('adviceNote').value = caseObj.adviceNote || '';
    } else {
      $('modalTitle').textContent = isSimple ? '簡易登録' : '新規案件登録';
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
    // 内容・メモは全文が見えるよう、開いた直後に高さを中身に合わせて拡張
    requestAnimationFrame(() => { autoGrowTextarea($('content')); autoGrowTextarea($('memo')); if ($('customerMemo')) autoGrowTextarea($('customerMemo')); });
    setTimeout(() => $('company').focus(), 50);
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  // 数値を3桁カンマ区切りの文字列にする（数字以外は除去。空なら空文字）
  function formatThousands(value) {
    const digits = String(value == null ? '' : value).replace(/[^\d]/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  // textarea を中身の高さに合わせて自動拡張（全文表示）
  function autoGrowTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + 2) + 'px';
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
  const POPUP_FIELD_TITLES = { content: '内容を編集', memo: '社内メモを編集' };
  // 顧客メモの表示名（客先=○○メモ / 菱熱=顧客メモ）
  function customerMemoLabel() {
    return isPrivileged(currentUser) ? '顧客メモ' : (CUSTOMER_MEMO_LABEL[customerCompany(currentUser)] || '顧客メモ');
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
    $('contentEditor').placeholder = field === 'memo' ? '社内メモ／「保留」と書くとステータス自動切替'
      : (field === 'customerMemo' ? customerMemoLabel() + 'を記入' : '案件の詳細を記入');
    $('contentModal').classList.remove('hidden');
    setTimeout(() => $('contentEditor').focus(), 50);
  }
  function closeContentModal() { $('contentModal').classList.add('hidden'); contentEditCaseId = null; }
  function saveContentFromModal() {
    if (!contentEditCaseId) return;
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
    const headers = ['会社', '劇場名', '受付日', isToho ? 'TC担当者' : '客先担当者', 'R担当者', '種別', '内容',
      '調査日', '認証番号', '見積り名', '見積り金額',
      isToho ? '見積り受領日' : '見積り提出日',
      '作業開始日', '作業完了日',
      isToho ? '請求書受領日' : '請求書発行日',
      isToho ? '支払日' : '入金日',
      'ステータス'];
    if (includesMemo) headers.push('顧客メモ', '社内メモ');
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
    $('invoiceIssueDate').value = fmtDateFull(lastDayOfMonth(month));
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
  const TASK_COLS = [
    { field: 'status',   label: 'ステータス' },
    { field: 'company',  label: '会社' },
    { field: 'theater',  label: '劇場名' },
    { field: 'tcPerson', label: '客先担当者' },
    { field: 'rPerson',  label: 'R担当者' },
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
    $('taskBtn').textContent = '✕ タスク管理を閉じる';
    $('taskDoneToggleBtn').classList.remove('hidden');
    renderTaskTable();
  }
  function exitTaskMode() {
    taskMode = false;
    $('casesTable').classList.remove('task-mode');
    $('taskBtn').textContent = '📋 タスク管理';
    $('taskDoneToggleBtn').classList.add('hidden');
    $('casesTable').querySelector('thead').innerHTML = NORMAL_THEAD_HTML;
    render();
  }
  function toggleTaskMode() { if (taskMode) exitTaskMode(); else enterTaskMode(); }

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
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('calendarView').classList.remove('hidden');
    renderCalendar();
  }
  function exitCalMode() {
    calMode = false;
    $('calBtn').textContent = '📅 カレンダー';
    $('calendarView').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  function toggleCalMode() { if (calMode) exitCalMode(); else enterCalMode(); }

  // ===== 工程表（ガントチャート）モード =====
  let koteiMode = false;
  function enterKoteiMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    exitAuxModes();
    koteiMode = true;
    $('koteiBtn').textContent = '✕ 工程表を閉じる';
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('viewKotei').classList.remove('hidden');
    if (window.KOTEI && window.KOTEI.open) window.KOTEI.open();
  }
  function exitKoteiMode() {
    koteiMode = false;
    $('koteiBtn').textContent = '📋 工程表';
    $('viewKotei').classList.add('hidden');
    document.querySelector('.table-wrap').classList.remove('hidden');
    document.querySelector('.legend').classList.remove('hidden');
  }
  function toggleKoteiMode() { if (koteiMode) exitKoteiMode(); else enterKoteiMode(); }

  // ===== 支払い状況（購買）モード（菱熱のみ） =====
  let purchaseMode = false;
  function enterPurchaseMode() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
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
      applyColumnOrder(); setupColumnDrag();
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
        <td data-colkey="theater" title="${escapeHtml(c.theater || '')}">${escapeHtml(shortTheaterName(c.theater))}</td>
        <td data-colkey="content" class="content-cell">${escapeHtml(c.content)}</td>
        <td data-colkey="estimateName">${escapeHtml(c.estimateName)}</td>
        <td data-colkey="estimateAmount" class="pv-amount-col">${fmtAmount(c.estimateAmount)}</td>
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
  // カレンダーの予定: 調査=点、作業=開始〜終了の帯
  function collectCalItems() {
    const items = [];
    calVisibleCases().forEach((c) => {
      const theater = shortTheaterName(c.theater) || '(劇場未入力)';
      const co = companyAbbr(c.company) || '';
      if (c.surveyDate && String(c.surveyDate).length >= 10) {
        items.push({ id: c.id, kind: 'survey', start: c.surveyDate, end: c.surveyDate, time: c.surveyTime || '', co: co, theater: theater, full: c.content || '' });
      }
      const ws = (c.workStartDate && String(c.workStartDate).length >= 10) ? c.workStartDate : '';
      const we = (c.workEndDate && String(c.workEndDate).length >= 10) ? c.workEndDate : '';
      if (ws || we) {
        let s = ws || we, e = we || ws;
        if (s > e) { const t = s; s = e; e = t; }
        items.push({ id: c.id, kind: 'work', start: s, end: e, time: c.workStartTime || '', co: co, theater: theater, full: c.content || '' });
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
    const DAYNUM_H = 22, LANE_H = 21;
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
      const weekH = DAYNUM_H + Math.max(1, lanes.length) * LANE_H + 4;
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
        const body = it.full || '';
        const txt = `${it.time ? '<b>' + escapeHtml(it.time) + '</b> ' : ''}${escapeHtml(prefix)}　${lbl}${body ? '：' + escapeHtml(body) : ''}`;
        const titleTxt = `${prefix}　${lbl}${it.time ? ' ' + it.time : ''}${body ? '：' + body : ''}`;
        barsHtml += `<div class="cal-ev-bar ${cls}${ev.contL ? ' cont-l' : ''}${ev.contR ? ' cont-r' : ''}" data-case-id="${escapeHtml(it.id)}" style="left:${left}%;width:${width}%;top:${top}px" title="${escapeHtml(titleTxt)}">${txt}</div>`;
      });
      html += `<div class="cal-week" style="height:${weekH}px"><div class="cal-week-grid">${daysHtml}</div><div class="cal-week-bars">${barsHtml}</div></div>`;
      cur.setDate(cur.getDate() + 7);
    }
    $('calGrid').innerHTML = html;
  }

  function renderTaskTable() {
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
      const shown = caseTasks(c).filter((t) => showDoneTasks || !t.done);
      const taskListHtml = shown.length
        ? '<ul class="cell-task-list">' + shown.map((t) => {
            const idx = caseTasks(c).indexOf(t);
            return `<li class="${t.done ? 'task-done' : ''}"><label><input type="checkbox" data-taskcell="${idx}"${t.done ? ' checked' : ''}> <span class="${taskPrioClass(t)}">${escapeHtml(t.text)}</span></label></li>`;
          }).join('') + '</ul>'
        : '<span class="task-empty">（なし）</span>';
      // 各項目は通常画面と同じく編集可（劇場名は短縮表示で標準と同条件）
      tr.innerHTML = `
        ${buildStatusCell(c)}
        ${editableTd(c, 'company', buildCompanyTag(c), 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(shortTheaterName(c.theater)))}
        ${editableTd(c, 'tcPerson', escapeHtml(stripHonorific(c.tcPerson)))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'content', dupBadgeHtml(c) + escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
        <td class="task-col" data-colkey="tasks">
          <button type="button" class="task-open-btn" data-taskopen="${escapeHtml(c.id)}" title="タスク編集">✎</button>
          ${taskListHtml}
        </td>`;
      tbody.appendChild(tr);
    });
    $('caseCount').textContent = `${rows.length} 件`;
    updateShowAllBtn();
    applyColumnOrder();   // 個人設定の列並びを反映
    setupColumnDrag();    // 見出しをドラッグで並べ替え可能に
  }

  // タスク編集ポップアップ
  let taskModalCase = null;
  function openTaskModal(c) {
    if (!tasksAvailable()) {
      alert('タスク機能を使うには、データベースの更新（cases.tasks 列の追加）が必要です。');
      return;
    }
    taskModalCase = c;
    $('taskModalTitle').textContent = 'タスク：' + (c.theater || '(劇場未入力)');
    renderTaskModalList();
    $('taskNewInput').value = '';
    $('taskModal').classList.remove('hidden');
    setTimeout(() => $('taskNewInput').focus(), 0);
  }
  // タスクの優先度（未設定は「低」＝黒）→ 文字色クラス
  function taskPrio(t) { return (t && (t.priority === 'high' || t.priority === 'mid')) ? t.priority : 'low'; }
  function taskPrioClass(t) { return 'task-prio-' + taskPrio(t); }
  function renderTaskModalList() {
    const c = taskModalCase; if (!c) return;
    const tasks = caseTasks(c);
    // 未完了を上に、完了を下に（元のindexは保持）
    const order = tasks.map((t, i) => i).sort((a, b) => (tasks[a].done - tasks[b].done));
    const ul = $('taskList');
    ul.innerHTML = order.map((i) => {
      const t = tasks[i];
      const p = taskPrio(t);
      const sel = ['high', 'mid', 'low'].map((v) =>
        `<option value="${v}"${v === p ? ' selected' : ''}>${v === 'high' ? '高' : v === 'mid' ? '中' : '低'}</option>`).join('');
      return `<li class="task-item ${t.done ? 'done' : ''}">
        <select class="task-prio-select" data-taskprio="${i}" title="優先度">${sel}</select>
        <label><input type="checkbox" data-taskmodal="${i}" ${t.done ? 'checked' : ''}> <span class="${taskPrioClass(t)}">${escapeHtml(t.text)}</span></label>
        <button type="button" class="task-del" data-taskdel="${i}" aria-label="削除">×</button>
      </li>`;
    }).join('');
  }
  function persistTaskCase() {
    const c = taskModalCase; if (!c) return;
    c.updatedAt = new Date().toISOString();
    if (store.mode === 'local') saveCases();
    persistCase(c);
  }
  function addTaskFromInput() {
    const c = taskModalCase; if (!c) return;
    const v = $('taskNewInput').value.trim();
    if (!v) return;
    const prio = ($('taskNewPriority') && $('taskNewPriority').value) || 'low';
    caseTasks(c).push({ text: v, done: false, priority: prio });
    $('taskNewInput').value = '';
    persistTaskCase();
    renderTaskModalList();
    if (taskMode) renderTaskTable();
    $('taskNewInput').focus();
  }

  function refresh() { if (calMode) renderCalendar(); else if (aggMode) renderAggTable(); else if (taskMode) renderTaskTable(); else if (purchaseMode) renderPurchaseView(); else render(); }

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
  function populateTiTheaterSelect() {
    const company = $('tiCompanySelect').value;
    const sel = $('tiTheaterSelect');
    const prev = sel.value;
    const names = theaterMaster.filter((t) => t.company === company).map((t) => t.name).filter(Boolean);
    const fromContacts = theaterContacts.filter((c) => c.company === company).map((c) => c.theater).filter(Boolean);
    const list = Array.from(new Set([tiCommonName(company)].concat(names, fromContacts)));
    sel.innerHTML = list.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
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
  function tmWidthKey(tableId) { return userFilterKey('tmColW_' + tableId); }
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
        <tr data-theater-name="${escapeHtml(t.name)}">
          <td class="tib-name">${escapeHtml(t.name)}</td>
          <td><textarea class="tm-input tib-manager" rows="2">${escapeHtml(t.manager || '')}</textarea></td>
          <td><textarea class="tm-input tib-phone" rows="2">${escapeHtml(t.theaterPhone || '')}</textarea></td>
          <td><select class="tm-input tib-maintenance">${marks(t.maintenance)}</select></td>
          <td><select class="tm-input tib-gem2">${marks(t.gem2)}</select></td>
          <td><textarea class="tm-input tib-equipment" rows="2">${escapeHtml(t.equipment || '')}</textarea></td>
          <td><textarea class="tm-input tib-chronic" rows="2">${escapeHtml(t.chronicIssues || '')}</textarea></td>
          <td><textarea class="tm-input tib-note" rows="2">${escapeHtml(t.infoNote || '')}</textarea></td>
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
      renderTiBulkTable();
      return;
    }
    const company = $('tiCompanySelect').value;
    const theater = $('tiTheaterSelect').value;
    const entry = theaterMaster.find((t) => t.name === theater);
    // 劇場情報ボックス: マスターに存在する劇場のみ編集可（（共通）や未登録名は非表示）
    $('tiInfoBox').classList.toggle('hidden', !entry);
    if (entry) {
      $('tiManager').value = entry.manager || '';
      $('tiPhone').value = entry.theaterPhone || '';
      $('tiMaintenance').value = entry.maintenance || '';
      $('tiGem2').value = entry.gem2 || '';
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
          <td><button type="button" class="ti-delete-btn">削除</button></td>
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
    theaterInfoMode = true;
    populateTiCompanySelect();
    try { theaterContacts = await store.fetchTheaterContacts(); } catch (e) { theaterContacts = []; }
    populateTiTheaterSelect();
    renderTheaterInfo();
    document.querySelector('.table-wrap').classList.add('hidden');
    document.querySelector('.legend').classList.add('hidden');
    $('theaterInfoModal').classList.remove('hidden');
  }
  function closeTheaterInfoModal() {
    theaterInfoMode = false;
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
            ${it.evidence ? `<div class="tp-evidence">出典: ${escapeHtml(it.evidence)}</div>` : ''}</td>
          <td class="tp-conf">${it.confidence != null ? Math.round(Number(it.confidence) * 100) + '%' : ''}</td>
        </tr>`).join('');
      return `<tr class="tp-theater-row"><td colspan="3">🎬 ${escapeHtml(th)}</td></tr>` + rows;
    }).join('');
  }
  let theaterPendingMode = false;
  async function openTheaterPendingModal() {
    if (aggMode) exitAggMode();
    if (taskMode) exitTaskMode();
    if (calMode) exitCalMode();
    if (koteiMode) exitKoteiMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
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
  async function approveAllPending() {
    if (!theaterPending.length) return;
    if (!confirm(`未確認の${theaterPending.length}件すべてを承認して本登録しますか？`)) return;
    const items = theaterPending.slice();
    for (const it of items) { await approvePending(it, true); }
    renderPendingList();
    alert('承認が完了しました。');
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
    entry.equipment = $('tiEquipment').value;
    entry.chronicIssues = $('tiChronic').value;
    entry.infoNote = $('tiNote').value;
    if (store.mode === 'local') saveTheaterMaster(theaterMaster);
    persistTheater(entry);
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
  function handleTheaterInfoTableClick(e) {
    if (!e.target.classList.contains('ti-delete-btn')) return;
    const tr = e.target.closest('tr');
    if (!tr || !tr.dataset.contactId) return;
    const c = tiFindContact(tr.dataset.contactId);
    if (!c) return;
    const label = [c.category, c.vendor, c.person].filter(Boolean).join(' / ') || '(未入力)';
    if (!confirm(`連絡先「${label}」を削除しますか？`)) return;
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
    $('appShell').classList.add('hidden');
    $('loginScreen').classList.remove('hidden');
    // ログインペインに戻す（前回サインアップ画面のままだったケースの保険）
    if ($('loginPane')) $('loginPane').classList.remove('hidden');
    if ($('signupPane')) $('signupPane').classList.add('hidden');
    setTimeout(() => $('loginEmail').focus(), 50);
  }
  function showApp() {
    $('loginScreen').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    // A集計モードのまま再ログイン等した場合は通常表示へ戻す
    if (aggMode) exitAggMode();
    if (purchaseMode) exitPurchaseMode();
    if (theaterInfoMode) closeTheaterInfoModal();
    if (theaterPendingMode) closeTheaterPendingModal();
    applyUserScope();
    render();
    maybeOpenCaseFromUrl();
    refreshPendingBadge(); // 劇場情報 自動更新の未確認件数バッジ（菱熱のみ）
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
  function userFilterKey(base) { return base + '_' + ((currentUser && currentUser.email) || 'anon'); }
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
    bar.innerHTML = html;
  }
  function applyUserScope() {
    $('userEmail').textContent = currentUser.email;
    loadSavedFilters(); // アカウント別に最後の絞り込みを復元
    seedDefaultStatusFilter(); // ログイン時は「完了・取り下げ」を非表示（チェック外し）で開始
    renderCompanyBar();
    const privileged = isPrivileged(currentUser);
    document.body.classList.toggle('user-privileged', privileged);
    document.body.classList.toggle('user-toho', !privileged);
    $('appTitle').textContent = privileged ? 'シネマ案件管理' : (customerCompany(currentUser) + ' 案件管理');
    renderRPersonBar();
    // status filter のラベル差し替え（受発注で呼称が変わる項目のみ）
    $('statusFilter').querySelectorAll('option').forEach(opt => {
      const map = privileged ? ROLE_STATUS.ryo : ROLE_STATUS.toho;
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
    // 顧客メモの表示名（菱熱=顧客メモ / 客先=○○メモ）をヘッダ・フォームに反映
    document.querySelectorAll('.customer-memo-label').forEach((el) => { el.textContent = customerMemoLabel(); });
    // 客先の「TC担当者」表示名を会社別に（TOHO=TC担当者 / 東急レク=109担当者 / UC=UC担当者）
    if (!privileged) {
      const tcLabel = CUSTOMER_TC_LABEL[customerCompany(currentUser)] || 'TC担当者';
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

  $('logoutBtn').addEventListener('click', async () => {
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
  $('newCaseBtn').addEventListener('click', () => openModal(null, 'full'));
  $('quickCaseBtn').addEventListener('click', () => openModal(null, 'simple'));
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
    if (other) openModal(other, 'full');
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
  $('modalDeleteBtn').addEventListener('click', () => {
    const c = cases.find((x) => x.id === $('caseId').value); if (!c) return;
    if (!confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) return;
    cases = cases.filter((x) => x.id !== c.id); removeCaseRemote(c.id); closeModal(); render(); if (calMode) renderCalendar();
  });
  $('company').addEventListener('change', updateTohoVisibility);
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
  $('tiTheaterSelect').addEventListener('change', renderTheaterInfo);
  $('tiAddContactBtn').addEventListener('click', addTheaterContactRow);
  $('tiBody').addEventListener('change', handleTheaterInfoTableInput);
  $('tiBody').addEventListener('click', handleTheaterInfoTableClick);
  $('tiBulkBtn').addEventListener('click', toggleTiBulkMode);
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
  ['tiManager', 'tiPhone', 'tiMaintenance', 'tiGem2', 'tiEquipment', 'tiChronic', 'tiNote'].forEach((id) => {
    $(id).addEventListener('change', handleTheaterInfoFieldChange);
  });

  // 劇場情報更新確認 モーダル
  $('theaterPendingBtn').addEventListener('click', () => { if (theaterPendingMode) closeTheaterPendingModal(); else openTheaterPendingModal(); });
  $('closeTheaterPendingModal').addEventListener('click', closeTheaterPendingModal);
  $('tpCloseBtn').addEventListener('click', closeTheaterPendingModal);
  $('tpBody').addEventListener('click', handlePendingClick);
  $('tpApproveAllBtn').addEventListener('click', approveAllPending);

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
  // 並び替えボタン（受付日順・調査日順・客先順・ステータス順）
  function toggleSortField(field) {
    if (sortState.field === field) sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    else { sortState.field = field; sortState.direction = 'asc'; }
    render();
  }
  function updateMobileSortButtons() {
    const map = { receivedDate: ['sortReceivedBtn', '受付日順'], surveyDate: ['sortSurveyBtn', '調査日順'], company: ['sortCompanyBtn', '客先順'], status: ['sortStatusBtn', 'ステータス順'] };
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
  $('calGrid').addEventListener('click', (e) => {
    const ev = e.target.closest('.cal-ev-bar'); if (!ev) return;
    const c = cases.find((x) => x.id === ev.dataset.caseId);
    if (c) openModal(c, 'calendar');
  });
  $('taskDoneToggleBtn').addEventListener('click', () => {
    showDoneTasks = !showDoneTasks;
    const btn = $('taskDoneToggleBtn');
    btn.textContent = showDoneTasks ? '完了タスク：表示' : '完了タスク：非表示';
    btn.classList.toggle('active', showDoneTasks);
    if (taskMode) renderTaskTable();
  });
  // タスクポップアップ
  function closeTaskModal() { $('taskModal').classList.add('hidden'); taskModalCase = null; if (taskMode) renderTaskTable(); }
  $('taskAddBtn').addEventListener('click', addTaskFromInput);
  $('taskNewInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTaskFromInput(); } });
  $('closeTaskModal').addEventListener('click', closeTaskModal);
  $('taskDoneBtn').addEventListener('click', closeTaskModal);
  $('taskList').addEventListener('change', (e) => {
    if (!taskModalCase) return;
    const pr = e.target.closest('[data-taskprio]');
    if (pr) {
      const t = caseTasks(taskModalCase)[Number(pr.dataset.taskprio)];
      if (t) { t.priority = pr.value; persistTaskCase(); renderTaskModalList(); if (taskMode) renderTaskTable(); }
      return;
    }
    const cb = e.target.closest('[data-taskmodal]');
    if (!cb) return;
    const t = caseTasks(taskModalCase)[Number(cb.dataset.taskmodal)];
    if (t) { t.done = cb.checked; persistTaskCase(); renderTaskModalList(); }
  });
  $('taskList').addEventListener('click', (e) => {
    const d = e.target.closest('[data-taskdel]');
    if (!d || !taskModalCase) return;
    caseTasks(taskModalCase).splice(Number(d.dataset.taskdel), 1);
    persistTaskCase(); renderTaskModalList();
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
    // 最後に開いたものを優先的に閉じる
    if (!$('contentModal').classList.contains('hidden')) { closeContentModal(); return; }
    if (!$('theaterInfoModal').classList.contains('hidden')) { closeTheaterInfoModal(); return; }
    if (!$('theaterMasterModal').classList.contains('hidden')) { closeTheaterMasterModal(); return; }
    if (!$('invoiceModal').classList.contains('hidden')) { closeInvoiceModal(); return; }
    if (!$('modal').classList.contains('hidden')) { closeModal(); return; }
  });

  // フォーム保存時に日付を一括パース＆バリデーション
  $('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
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
      receivedDate: parsedDates.receivedDate,
      tcPerson: stripHonorific($('tcPerson').value.trim()),
      rPerson: $('rPerson').value.trim(),
      category: $('category').value,
      content: $('content').value.trim(),
      surveyDate: parsedDates.surveyDate,
      surveyTime: $('surveyTime').value || '',
      workStartTime: $('workStartTime').value || '',
      workEndTime: $('workEndTime').value || '',
      // 認証番号は保存値として保持（表示・編集はTOHOのときだけ）。会社を切替えても消えないようにする
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
    if (existing >= 0) cases[existing] = saved; else cases.push(saved);
    persistCase(saved);
    closeModal();
    render();
    if (calMode) renderCalendar(); // カレンダー表示中なら即反映
  });

  $('casesBody').addEventListener('click', (e) => {
    // タスク管理モード: 「タスク編集」ボタン
    const to = e.target.closest('[data-taskopen]');
    if (to) { const c = cases.find((x) => x.id === to.dataset.taskopen); if (c) openTaskModal(c); return; }
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
      if (action === 'edit') openModal(c, 'full');
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
    const td = e.target.closest('td.editable');
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
    startInlineEdit(td, c, td.dataset.field);
  });

  // ダブルクリックで編集モーダルを開く（A集計モードは除く）
  // 案件編集ポップアップは各行の左端「✎ 編集」ボタンから開く（ダブルクリックでの起動は廃止）。
  // 見積り名セルのダブルクリック＝見積書AI-OCR は従来どおり別ハンドラで有効。

  // ソートは thead に委譲（A集計モードでthead差替えしても生き続ける）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (e.target.closest('.col-resizer')) return; // 列幅ドラッグは並び替え・絞り込み対象外
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
    const btn = $('toggleBigBtn');
    if (!btn) return;
    btn.textContent = showBigOnly ? '大口のみ：ON' : '大口のみ：OFF';
    btn.classList.toggle('active', showBigOnly);
  }
  $('toggleBigBtn').addEventListener('click', () => {
    showBigOnly = !showBigOnly;
    updateBigToggleLabel();
    refresh();
  });
  updateBigToggleLabel();

  // 全件表示（完了・取り下げも表示）トグル
  if ($('showAllBtn')) $('showAllBtn').addEventListener('click', toggleShowAllStatuses);

  // 税込み/税抜き表示トグル（標準=税抜き。税込みにすると「見積り金額（税込み）」列を表示）
  let showTax = false;
  $('taxToggleBtn').addEventListener('click', () => {
    showTax = !showTax;
    document.body.classList.toggle('show-tax', showTax);
    const b = $('taxToggleBtn');
    b.textContent = showTax ? '税込み表示中' : '税抜き表示';
    b.classList.toggle('active', showTax);
  });

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
        const mapped = rowToCase(payload.new);
        const i = cases.findIndex((c) => c.id === mapped.id);
        if (i >= 0) cases[i] = mapped; else cases.push(mapped);
      }
      // 編集中は再描画を抑制（次の操作時に反映される）
      if (!isEditingNow()) refresh();
    } catch (e) { console.error('realtime適用エラー', e); }
  }

  // ---------- 起動 ----------
  async function init() {
    store.init();
    // 工程表(kotei.js)が同じSupabaseクライアント・モード・担当者/会社マスタを共有できるよう橋渡し
    window.CINEMA_DB = {
      client: () => sb,
      mode: () => store.mode,
      teams: () => { try { return loadTeam(); } catch (e) { return []; } },
      companies: () => { try { return companies.map((c) => ({ name: c.name, abbr: c.abbr, officialName: c.officialName || '' })); } catch (e) { return []; } }
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
