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
  const CATEGORIES = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'その他'];
  // 色判定を除外するカテゴリ
  const NO_COLOR_CATEGORIES = new Set(['更新案件', 'その他']);
  const DEFAULT_MARGIN_RATE = 20;
  // 経営集計のデフォルトチームと配分ルール
  const DEFAULT_TEAM = ['小山', '細萱', '大和', '山口', '金子', '若山', '伊藤', '藤村', '山本'];
  const EXCLUDED_FROM_BASE = '山本'; // 一律5%対象外
  const SMALL_CASE_THRESHOLD = 3000000;
  const BASE_RATE = 5; // %
  const PRIVILEGED_DOMAIN = 'ryonetsu.com';
  // 自己サインアップを許可するドメイン（DB側トリガーでも同一の制限を強制）
  const ALLOWED_SIGNUP_DOMAINS = ['ryonetsu.com', 'tohocinemas.co.jp'];

  // 役割別ラベル: 受注者(ryonetsu) ↔ 発注者(TOHO)
  const ROLE_STATUS = {
    ryo:  { '見積り提出済': '見積り提出済', '請求済': '請求済',          '入金済': '入金済' },
    toho: { '見積り提出済': '見積り受領済', '請求済': '請求書受領済',    '入金済': '支払済' }
  };
  const STATUS_FILTER_OPTIONS_RYO  = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済'];
  const STATUS_FILTER_OPTIONS_TOHO = ['', '受付','見積り中','見積り提出済','作業中','完了','請求済','入金済']; // values unchanged; labels swap

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

  const EDITABLE_FIELDS = {
    company:        { type: 'select',   dynamicOptions: 'company', privilegedOnly: true },
    theater:        { type: 'datalist', listId: 'theaterList' },
    receivedDate:   { type: 'date' },
    tcPerson:       { type: 'datalist', listId: 'tcPersonList' },
    rPerson:        { type: 'datalist', listId: 'rPersonList' },
    category:       { type: 'select',   options: [''].concat(CATEGORIES) },
    content:        { type: 'popup' },
    surveyDate:     { type: 'date' },
    certNumber:     { type: 'text',     tohoOnly: true },
    estimateName:   { type: 'text' },
    estimateAmount: { type: 'number' },
    quoteDate:      { type: 'date' },
    workStartDate:  { type: 'date' },
    workEndDate:    { type: 'date' },
    invoiceDate:    { type: 'date' },
    paymentDate:    { type: 'date' },
    memo:           { type: 'popup', privilegedOnly: true }
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
  // status_override 列がDBに存在するか（fetch時に検出）。未追加環境でも保存が壊れないようにするため
  let statusOverrideSupported = false;
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
    row.status = statusOf(c); // DB側レポート用に実効ステータス（手動上書き反映）も保存
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
    if (/Sign-?up restricted/i.test(msg) || /allowed signup domains/i.test(msg)) return '登録可能なメールアドレスは @ryonetsu.com または @tohocinemas.co.jp のみです。';
    if (/Database error saving new user/i.test(msg)) return 'サインアップが拒否されました。許可されたドメイン（@ryonetsu.com / @tohocinemas.co.jp）のメールアドレスをご使用ください。';
    return msg;
  }

  let sb = null;          // Supabaseクライアント
  let rtChannel = null;   // リアルタイム購読

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
      const { data, error } = await sb.from('cases').select('*');
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
        const def = DEFAULT_COMPANIES.find((d) => d.name === r.name);
        return {
          name: r.name,
          abbr: r.abbr,
          // DB に列が無い場合は undefined。デフォルトで補完
          officialName: r.official_name != null ? r.official_name : (def ? def.officialName : ''),
          hqAddress:    r.hq_address    != null ? r.hq_address    : (def ? def.hqAddress    : '')
        };
      });
    },
    async addCompanyRemote(rec) {
      if (this.mode === 'local') { saveCompanies(companies); return; }
      const { error } = await sb.from('companies').insert({ name: rec.name, abbr: rec.abbr, sort_order: 100, official_name: rec.officialName || '', hq_address: rec.hqAddress || '' });
      if (error) throw error;
    },
    async updateCompanyInfo(name, patch) {
      if (this.mode === 'local') { saveCompanies(companies); return; }
      const row = {};
      if (patch.officialName != null) row.official_name = patch.officialName;
      if (patch.hqAddress    != null) row.hq_address    = patch.hqAddress;
      if (!Object.keys(row).length) return;
      const { error } = await sb.from('companies').update(row).eq('name', name);
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
      return data.map((r) => ({ name: r.name, company: r.company, address: r.address || '' }));
    },
    async upsertTheater(t) {
      if (this.mode === 'local') { saveTheaterMaster(theaterMaster); return; }
      const { error } = await sb.from('theaters').upsert({ name: t.name, company: t.company, address: t.address || '' });
      if (error) throw error;
    },
    async deleteTheater(name) {
      if (this.mode === 'local') { saveTheaterMaster(theaterMaster); return; }
      const { error } = await sb.from('theaters').delete().eq('name', name);
      if (error) throw error;
    },
    subscribe(onChange) {
      if (this.mode !== 'supabase') return;
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
      const { data, error } = await sb.auth.signUp({ email: e, password: password });
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
  let currentUser = null;
  let sortState = { field: null, direction: 'asc' };
  // 全ステータス表示中に、請求済・入金済の案件を表示するか（既定: 非表示）
  let showBilled = false;
  let contentEditCaseId = null;
  let aggMode = false;          // A集計表示モードか
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
            hqAddress:    c.hqAddress    != null ? c.hqAddress    : (def ? def.hqAddress    : '')
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
  // 案件の劇場名と完全一致する master 行を返す（無ければ undefined）
  function findTheaterInMaster(name) {
    if (!name) return undefined;
    return theaterMaster.find((t) => t.name === name);
  }
  function visibleTheaterMaster() {
    if (isPrivileged(currentUser)) return theaterMaster;
    return theaterMaster.filter((t) => t.company === 'TOHOシネマズ');
  }
  // CSSクラスに安全な文字列化（スペース・記号を_に）
  function safeClass(s) {
    return String(s || '').replace(/[^A-Za-z0-9_぀-ゟ゠-ヿ一-鿿]/g, '_');
  }
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
  // 現在のユーザーが見られる案件のみ（ローカル版ではTOHO案件のみ／Supabase版ではRLSで既に絞られている）
  function visibleCases() {
    if (isPrivileged(currentUser)) return cases;
    return cases.filter((c) => c.company === 'TOHOシネマズ');
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
    // 担当者しぼり込み用（R担当者＋客先担当者の両方を候補に）
    fillDatalist('personFilterList', [...new Set([...rPersons, ...tcPersons])].sort());
  }
  // 会社セレクト（モーダル/フィルタ）を会社マスタから再構築
  function populateCompanySelects() {
    const sel = $('company');
    const prevSel = sel.value;
    sel.innerHTML = companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (prevSel && companyNames().indexOf(prevSel) !== -1) sel.value = prevSel;

    const filter = $('companyFilter');
    const prevFilter = filter.value;
    filter.innerHTML = '<option value="">全会社</option>' +
      companyNames().map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}（${escapeHtml(companyAbbr(n))}）</option>`).join('');
    if (prevFilter && (prevFilter === '' || companyNames().indexOf(prevFilter) !== -1)) filter.value = prevFilter;
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
    if (c.paymentDate)  return '入金済';
    if (c.invoiceDate)  return '請求済';
    if (c.workEndDate)  return '完了';
    if (c.workStartDate && c.workStartDate <= today) return '作業中';
    if (c.quoteDate && c.quoteDate <= today)         return '見積り提出済';
    if (c.surveyDate && c.surveyDate <= today)       return '見積り中';
    return '受付';
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

  function rowColorClass(c) {
    if (NO_COLOR_CATEGORIES.has(c.category)) return '';
    if (statusOf(c) === '保留') return '';
    if (c.quoteDate) return '';
    const today = todayStr();
    if (c.surveyDate) {
      const dRed = daysBetween(c.surveyDate, today);
      if (dRed !== null && dRed >= 3) return 'row-red';
      const dYellow = daysBetween(c.receivedDate, c.surveyDate);
      if (dYellow !== null && dYellow >= 3) return 'row-yellow';
      return '';
    }
    if (c.receivedDate) {
      const d = daysBetween(c.receivedDate, today);
      if (d !== null && d >= 3) return 'row-yellow';
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
    '受付': 1, '見積り中': 2, '見積り提出済': 3, '作業中': 4,
    '完了': 5, '請求済': 6, '入金済': 7, '取り下げ': 8, '失注': 9, '保留': 99
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

  // ---------- filter ----------
  function getFilteredCases() {
    const q = $('searchBox').value.trim().toLowerCase();
    const sf = $('statusFilter').value;
    const pf = $('personFilter').value.trim().toLowerCase();
    const cf = isPrivileged(currentUser) ? $('companyFilter').value : 'TOHOシネマズ';
    const filtered = cases.filter((c) => {
      if (cf && c.company !== cf) return false;
      // 担当者しぼり込み（R担当者・客先担当者のどちらかに一致）
      if (pf) {
        const persons = ((c.rPerson || '') + ' ' + (c.tcPerson || '')).toLowerCase();
        if (!persons.includes(pf)) return false;
      }
      if (sf && statusOf(c) !== sf) return false;
      // 全ステータス表示中（特定ステータス未選択）の既定の絞り込み
      if (!sf) {
        const st = statusOf(c);
        // 請求済・入金済は既定で隠す（トグルで表示可）
        if (!showBilled && (st === '請求済' || st === '入金済')) return false;
        // 取り下げ・失注は、受付年度が過ぎて新年度になったら標準表示で隠す
        if (st === '取り下げ' || st === '失注') {
          const fy = fiscalYearOf(c.receivedDate);
          if (fy != null && fy < currentFiscalYear()) return false;
        }
      }
      if (!q) return true;
      const hayArr = [c.company, c.theater, c.tcPerson, c.rPerson, c.category, c.content,
        c.certNumber, c.estimateName, String(c.estimateAmount || ''),
        c.receivedDate, c.surveyDate, c.quoteDate, c.workStartDate, c.workEndDate, c.invoiceDate, c.paymentDate,
        statusOf(c), statusDisplayLabel(statusOf(c))];
      // memo は ryonetsu ユーザーのみ検索対象（情報漏洩防止）
      if (isPrivileged(currentUser)) hayArr.push(c.memo);
      const hay = hayArr.map((x) => (x || '').toString().toLowerCase()).join(' ');
      return hay.includes(q);
    });
    return sortCases(filtered);
  }

  function editableTd(c, field, displayHtml, extraClass) {
    const cfg = EDITABLE_FIELDS[field];
    const canEdit = !(cfg.privilegedOnly && !isPrivileged(currentUser))
                  && !(cfg.tohoOnly && c.company !== 'TOHOシネマズ');
    const cls = (canEdit ? 'editable' : '') + (c[field] ? '' : ' empty') + (extraClass ? ' ' + extraClass : '');
    return `<td class="${cls}" data-field="${field}" data-case-id="${escapeHtml(c.id)}">${displayHtml}</td>`;
  }

  function render() {
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
      const statusCode = statusOf(c);
      const statusLabel = statusDisplayLabel(statusCode);
      const manualStatus = isStatusManual(c);
      const companyHtml = c.company ? `<span class="company-tag company-${safeClass(c.company)}" title="${escapeHtml(c.company)}">${escapeHtml(companyAbbr(c.company))}</span>` : '';
      // 手動上書き中は badge に manual クラス → 文字色を白に
      const statusHtml = `<span class="status-badge status-${escapeHtml(statusCode)}${manualStatus ? ' manual' : ''}">${escapeHtml(statusLabel)}</span>`;
      // ステータスの手動変更は受注者(菱熱/ryonetsu)のみ。TOHO側はバッジ表示のみ
      const statusCell = isPrivileged(currentUser)
        ? `<td class="col-status status-cell" data-case-id="${escapeHtml(c.id)}">`
          + `<span class="status-pick" data-action="status-edit" data-id="${escapeHtml(c.id)}" title="クリックでステータスを変更（先頭の「自動」で自動判定に戻ります）">${statusHtml}</span>`
          + `</td>`
        : `<td class="col-status status-cell">${statusHtml}</td>`;
      const isTohoCo = c.company === 'TOHOシネマズ';
      const certHtml = isTohoCo
        ? editableTd(c, 'certNumber', escapeHtml(c.certNumber))
        : `<td class="toho-empty">—</td>`;

      tr.innerHTML = `
        ${statusCell}
        ${editableTd(c, 'company', companyHtml, 'col-company')}
        ${editableTd(c, 'theater', escapeHtml(c.theater))}
        ${editableTd(c, 'receivedDate', fmtDateShort(c.receivedDate))}
        ${editableTd(c, 'tcPerson', escapeHtml(c.tcPerson))}
        ${editableTd(c, 'rPerson', escapeHtml(c.rPerson))}
        ${editableTd(c, 'category', escapeHtml(c.category))}
        ${editableTd(c, 'content', escapeHtml(c.content), 'content-cell')}
        ${editableTd(c, 'surveyDate', fmtDateShort(c.surveyDate))}
        ${certHtml}
        ${editableTd(c, 'estimateName', escapeHtml(c.estimateName))}
        ${editableTd(c, 'estimateAmount', fmtAmount(c.estimateAmount))}
        ${editableTd(c, 'quoteDate', fmtDateShort(c.quoteDate))}
        ${editableTd(c, 'workStartDate', fmtDateShort(c.workStartDate))}
        ${editableTd(c, 'workEndDate', fmtDateShort(c.workEndDate))}
        ${editableTd(c, 'invoiceDate', fmtDateShort(c.invoiceDate))}
        ${editableTd(c, 'paymentDate', fmtDateShort(c.paymentDate))}
        ${editableTd(c, 'memo', escapeHtml(c.memo), 'col-memo')}
        <td class="row-actions">
          <button data-action="edit" data-id="${escapeHtml(c.id)}">編集</button>
          <button data-action="delete" data-id="${escapeHtml(c.id)}" class="danger">削除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    $('emptyMsg').classList.toggle('hidden', filtered.length > 0);
    const totalVisible = isPrivileged(currentUser) ? cases.length : cases.filter((c) => c.company === 'TOHOシネマズ').length;
    $('caseCount').textContent = `${filtered.length} 件 / 全 ${totalVisible} 件`;
    updateSortIndicators();
  }

  // ---------- inline edit ----------
  function startInlineEdit(td, c, field) {
    if (td.querySelector('.inline-edit')) return;
    const cfg = EDITABLE_FIELDS[field];
    if (!cfg) return;
    if (cfg.privilegedOnly && !isPrivileged(currentUser)) return;
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
    const commit = () => {
      if (done || reEditing) return;
      let newVal = el.value;
      if (typeof newVal === 'string') newVal = newVal.trim();

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

      if (String(newVal) !== String(oldVal)) {
        c[field] = newVal;
        c.updatedAt = new Date().toISOString();
        let histChanged = false;
        if (field === 'theater') { addToHistory('theaters', newVal); histChanged = true; }
        if (field === 'tcPerson') { addToHistory('tcPersons', newVal); histChanged = true; }
        if (field === 'rPerson') { addToHistory('rPersons', newVal); histChanged = true; }
        if (histChanged) saveHistory();
        persistCase(c);
      }
      render();
    };
    const cancel = () => { if (done) return; done = true; render(); };

    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && cfg.type !== 'textarea') { e.preventDefault(); el.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
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
  function openModal(caseObj, mode) {
    const form = $('caseForm');
    form.reset();
    document.querySelectorAll('.smart-date').forEach(el => el.classList.remove('invalid'));
    $('caseId').value = '';
    const realMode = mode || 'full';
    const isSimple = realMode === 'simple';
    document.querySelectorAll('[data-mode="full"]').forEach((el) => el.classList.toggle('hidden', isSimple));

    if (isPrivileged(currentUser)) {
      $('company').disabled = false;
    } else {
      $('company').value = 'TOHOシネマズ';
      $('company').disabled = true;
    }

    if (caseObj) {
      $('modalTitle').textContent = '案件編集';
      $('caseId').value = caseObj.id;
      $('company').value = caseObj.company || 'TOHOシネマズ';
      $('theater').value = caseObj.theater || '';
      setDateField('receivedDate', caseObj.receivedDate);
      $('tcPerson').value = caseObj.tcPerson || '';
      $('rPerson').value = caseObj.rPerson || '';
      $('category').value = caseObj.category || '';
      $('content').value = caseObj.content || '';
      setDateField('surveyDate', caseObj.surveyDate);
      $('certNumber').value = caseObj.certNumber || '';
      $('estimateName').value = caseObj.estimateName || '';
      $('estimateAmount').value = caseObj.estimateAmount || '';
      setDateField('quoteDate', caseObj.quoteDate);
      setDateField('workStartDate', caseObj.workStartDate);
      setDateField('workEndDate', caseObj.workEndDate);
      setDateField('invoiceDate', caseObj.invoiceDate);
      setDateField('paymentDate', caseObj.paymentDate);
      $('memo').value = caseObj.memo || '';
    } else {
      $('modalTitle').textContent = isSimple ? '簡易登録' : '新規案件登録';
      $('company').value = 'TOHOシネマズ';
      setDateField('receivedDate', todayStr());
    }
    updateTohoVisibility();
    renderDatalists();
    populateCompanySelects();
    if (caseObj) $('company').value = caseObj.company || companyNames()[0];
    else if (!isPrivileged(currentUser)) $('company').value = 'TOHOシネマズ';
    $('modal').classList.remove('hidden');
    setTimeout(() => $('company').focus(), 50);
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  // ---------- ポップアップ編集（内容 / メモ 共用） ----------
  let popupEditField = 'content';
  const POPUP_FIELD_TITLES = { content: '内容を編集', memo: 'メモを編集' };
  function openContentModal(c, field) {
    field = field || 'content';
    contentEditCaseId = c.id;
    popupEditField = field;
    const titleEl = $('contentModal').querySelector('.modal-header h2');
    if (titleEl) titleEl.textContent = POPUP_FIELD_TITLES[field] || '編集';
    $('contentEditor').value = c[field] || '';
    $('contentEditor').placeholder = field === 'memo' ? '社内メモ／「保留」と書くとステータス自動切替' : '案件の詳細を記入';
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
    if (includesMemo) headers.push('メモ');
    const rows = [headers].concat(filtered.map((c) => {
      const row = [c.company, c.theater, c.receivedDate, c.tcPerson, c.rPerson, c.category, c.content,
        c.surveyDate, c.company === 'TOHOシネマズ' ? c.certNumber : '',
        c.estimateName, c.estimateAmount,
        c.quoteDate, c.workStartDate, c.workEndDate,
        c.invoiceDate, c.paymentDate, statusDisplayLabel(statusOf(c))];
      if (includesMemo) row.push(c.memo);
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
        li.innerHTML = `${escapeHtml(c.theater)} ／ ${escapeHtml(c.estimateName)} <span class="case-amount">${fmtAmount(c.estimateAmount)}</span>`;
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
      <th>劇場名</th>
      <th>見積り名</th>
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
      <th class="agg-sec-label" colspan="2">合計（見込み+実績+予想）　${grandTotal.count}件</th>
      <th>${fmtAmount(grandTotal.amount)}</th>
      <th>粗利A→</th>
      <th>${fmtAmount(grandTotal.profit)}</th>
      ${team.map((m, i) => `<th class="agg-member-col${i===0?' agg-member-first':''}">${fmtAmount(grandTotal.members[m])}</th>`).join('')}
    </tr>`;

    const summaryRows = sections.map((s) => {
      const t = sectionTotals[s];
      const def = SECTION_DEF[s];
      return `<tr class="agg-summary-row ${def.cls}">
        <th class="agg-sec-label" colspan="2">${def.label}　${t.count}件</th>
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
      tbody.innerHTML = `<tr><td colspan="${5 + team.length}" class="agg-empty">対象案件がありません。</td></tr>`;
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
          <td class="agg-case-name"><span class="agg-section-badge ${sec.badge}">${sec.label}</span>${escapeHtml(c.theater)}</td>
          <td>${escapeHtml(c.estimateName || '-')}</td>
          <td class="agg-amount">${fmtAmount(amt)}</td>
          <td class="agg-sum ${okClass}">${sum.toFixed(1)}% ${okText}</td>
          <td><input type="number" data-field="marginRate" min="0" max="100" step="0.1" value="${rate}" class="agg-input agg-rate"></td>
          ${team.map((m, i) => `<td class="agg-member-col${i===0?' agg-member-first':''}"><input type="number" data-member="${escapeHtml(m)}" min="0" max="100" step="1" value="${alloc[m] || 0}" class="agg-input"></td>`).join('')}
        </tr>`;
      }).join('');
    }
    $('caseCount').textContent = `A集計: ${targets.length} 件`;
  }

  function enterAggMode() {
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

  function refresh() { if (aggMode) renderAggTable(); else render(); }

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
    renderAggTable();
  }
  function removeTeamMember(name) {
    if (!confirm(`担当者「${name}」を削除しますか？\n（各案件の配分データは保持され、再追加すれば復元されます）`)) return;
    saveTeam(loadTeam().filter((m) => m !== name));
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
    try { await store.updateCompanyInfo(name, { officialName: c.officialName, hqAddress: c.hqAddress }); }
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
    applyUserScope();
    render();
  }
  function applyUserScope() {
    $('userEmail').textContent = currentUser.email;
    const privileged = isPrivileged(currentUser);
    document.body.classList.toggle('user-privileged', privileged);
    document.body.classList.toggle('user-toho', !privileged);
    $('appTitle').textContent = privileged ? 'シネマ案件管理' : 'TOHOシネマズ 案件管理';
    $('companyFilter').classList.toggle('hidden', !privileged);
    // status filter のラベル差し替え（受発注で呼称が変わる項目のみ）
    $('statusFilter').querySelectorAll('option').forEach(opt => {
      const map = privileged ? ROLE_STATUS.ryo : ROLE_STATUS.toho;
      if (map[opt.value]) opt.textContent = map[opt.value];
    });
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
    // 開いているモーダル/A集計モードを全部クリーンに閉じてからログアウト
    if (aggMode) exitAggMode();
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
  $('cancelBtn').addEventListener('click', closeModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
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
  $('tmBody').addEventListener('change', handleTheaterMasterInput);
  $('tmBody').addEventListener('click', handleTheaterMasterClick);
  $('tmHqOfficialName').addEventListener('change', handleHqOfficialNameChange);
  $('tmHqAddress').addEventListener('change', handleHqAddressChange);

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
  $('aggExitBtn').addEventListener('click', exitAggMode);
  $('aggExportBtn').addEventListener('click', exportAggregation);
  $('aggFY').addEventListener('change', renderAggTable);
  $('aggAddMemberBtn').addEventListener('click', addTeamMember);
  $('aggRedistributeBtn').addEventListener('click', redistributeSmallCases);
  // A集計の入力（配分%・粗利率）変更
  $('casesBody').addEventListener('change', (e) => { if (aggMode) handleAggInput(e); });
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
    const parsedDates = {};
    for (const f in dateLabels) {
      const v = readDateField(f, dateLabels[f]);
      if (v === undefined) return; // バリデーション失敗
      parsedDates[f] = v;
    }
    const id = $('caseId').value || genId();
    const company = isPrivileged(currentUser) ? $('company').value : 'TOHOシネマズ';
    const amountRaw = $('estimateAmount').value;
    const data = {
      id: id, company: company,
      theater: $('theater').value.trim(),
      receivedDate: parsedDates.receivedDate,
      tcPerson: $('tcPerson').value.trim(),
      rPerson: $('rPerson').value.trim(),
      category: $('category').value,
      content: $('content').value.trim(),
      surveyDate: parsedDates.surveyDate,
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
      updatedAt: new Date().toISOString()
    };
    addToHistory('theaters', data.theater);
    addToHistory('tcPersons', data.tcPerson);
    addToHistory('rPersons', data.rPerson);
    saveHistory();
    const existing = cases.findIndex((c) => c.id === id);
    if (existing >= 0) cases[existing] = data; else cases.push(data);
    persistCase(data);
    closeModal();
    render();
  });

  $('casesBody').addEventListener('click', (e) => {
    const actEl = e.target.closest('[data-action]');
    if (actEl) {
      const action = actEl.dataset.action;
      const id = actEl.dataset.id;
      const c = cases.find((x) => x.id === id);
      if (!c) return;
      if (action === 'edit') openModal(c, 'full');
      else if (action === 'delete') {
        if (confirm(`案件「${c.theater || '(劇場未入力)'}」を削除しますか？`)) {
          cases = cases.filter((x) => x.id !== id);
          removeCaseRemote(id); render();
        }
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
    startInlineEdit(td, c, td.dataset.field);
  });

  // ソートは thead に委譲（A集計モードでthead差替えしても生き続ける）
  $('casesTable').querySelector('thead').addEventListener('click', (e) => {
    if (aggMode) return; // A集計モードではソート無効
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
  $('personFilter').addEventListener('input', refresh);
  $('statusFilter').addEventListener('change', refresh);

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
  $('companyFilter').addEventListener('change', refresh);
  $('exportBtn').addEventListener('click', exportFiltered);

  // 請求済・入金済の表示ON/OFFトグル（全ステータス表示中に効く）
  function updateBilledToggleLabel() {
    const btn = $('toggleBilledBtn');
    if (!btn) return;
    btn.textContent = showBilled ? '請求済・入金済：表示中' : '請求済・入金済：非表示';
    btn.classList.toggle('active', showBilled);
  }
  $('toggleBilledBtn').addEventListener('click', () => {
    showBilled = !showBilled;
    updateBilledToggleLabel();
    refresh();
  });
  updateBilledToggleLabel();

  // 通常モードのthead HTMLを保存（A集計から戻す用）
  NORMAL_THEAD_HTML = $('casesTable').querySelector('thead').innerHTML;

  // リアルタイム: 他ユーザーの変更を画面へ反映（Supabaseモードのみ）
  function isEditingNow() {
    return !!document.querySelector('.inline-edit')
      || !$('modal').classList.contains('hidden')
      || !$('invoiceModal').classList.contains('hidden')
      || !$('contentModal').classList.contains('hidden');
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
