// 職業の タグ（第35回。合体技は タグの 組み合わせで 決める。data/dual.js）
//
// ・どの 職業にも タグを 2〜4こ つける（職業の 説明・技・もとに なった お話から 自然な 物）
// ・合体技の 組は「タグ」（例: 剣×空）。作品を またいで 組める（例: 竜の騎士と ドラえもんで「大空のさんぽ」）
// ・タグは jobs.js の 職業に JOBS[id].tags として 入る（jobs.js の おわりで つける）
//
// ■ 職業を ふやす ときは
//   1) 下の JOB_TAGS に 2〜4こ（いちばん その 職業らしい タグを 先に）。TAGS の「意味」に 合う 物だけ
//   2) node tools/job-tags.mjs で、タグごとの 職業と、その 職業が 入れる 合体技の 数を 見る
//      （どの 職業も 合体技 3つ いじょう。少ない タグ（推理・れん金 など）だけの 職業は、もう1つ タグを）
//   3) 新しい タグは なるべく 作らない（作る ときは 合体技も いっしょに。test/dual-tags.test.js）

// タグの 一覧（ならびは メニュー・README の じゅん）。name … 画面に 出す 名前、desc … 意味（どんな 職業に つけるか）
export const TAGS = {
  sword: { name: '剣', desc: '剣や刀で戦う' },
  fist: { name: 'こぶし', desc: 'こぶし・けり・体当たりで戦う' },
  fire: { name: '炎', desc: '炎や火の技を使う' },
  ice: { name: '氷', desc: '氷・水・冷たい風の技を使う' },
  bolt: { name: '雷', desc: '雷やいなずまの技を使う' },
  wind: { name: '風', desc: '風・竜巻・つむじ風の技を使う' },
  light: { name: '光', desc: '聖なる光・月・星・太陽の力' },
  dark: { name: '闇', desc: '闇・黒い力・悪い組織' },
  sky: { name: '空', desc: '空をとぶ（ほうき・つばさ・タケコプター・グライダーなど）' },
  henshin: { name: '変身', desc: 'すがたを変える・変そうする' },
  shinobi: { name: '忍び', desc: '忍者・スパイ・かいとう。こっそり動く' },
  magic: { name: '魔法', desc: '呪文や魔法・ふしぎな力を使う' },
  heal: { name: 'いやし', desc: '仲間のHPを回復する' },
  guard: { name: '守り', desc: '仲間や町を守る' },
  school: { name: '学校', desc: '学校に通う・学校で教える' },
  cook: { name: '料理', desc: '料理やおかしを作る' },
  machine: { name: '機械', desc: '機械・ロボット・道具・ゲーム機を使う' },
  money: { name: 'お金', desc: 'お金・お店・商売・お宝' },
  stage: { name: '歌とおどり', desc: '歌・おどり・ステージで見せる' },
  laugh: { name: '笑い', desc: 'お笑い・遊び・ずっこけ' },
  master: { name: '師しょう', desc: 'みんなをひきいる・教える・その道をきわめた' },
  rival: { name: 'ライバル', desc: 'きそい合うライバルがいる' },
  work: { name: '大人の仕事', desc: '会社・お店・町や国の仕事・鉄道など、仕事をしている大人' },
  kid: { name: '子ども', desc: '子ども・学生・わかい人' },
  monster: { name: '魔物', desc: '魔物・ようかい・魔物と心を通わせる' },
  alchemy: { name: 'れん金', desc: 'れん成で物を作りかえる' },
  detective: { name: '推理', desc: 'なぞを解く・先を見ぬく' },
  home: { name: '家', desc: '家にいる人（家族・家のロボット）' },
  ride: { name: '乗り物', desc: '電車・車・船・馬などに乗る・動かす' },
  sport: { name: 'スポーツ', desc: '野球・部活・すもうなどのスポーツ' },
};
export const TAG_ORDER = Object.keys(TAGS);
export const tagName = (t) => TAGS[t]?.name || t;

// 職業ごとの タグ（jobs.js の じゅん。基本職・上級職・超級職・伝説の 職業）
export const JOB_TAGS = {
  // ───── 基本職 ─────
  warrior: ['sword', 'guard'], // 戦士
  monk: ['fist', 'wind'], // 武闘家（かまいたち）
  priest: ['heal', 'light', 'wind'], // 僧侶（ホイミ・聖なる光・バギ）
  mage: ['magic', 'fire', 'ice'], // 魔法使い
  performer: ['stage', 'laugh'], // 旅芸人
  jester: ['laugh', 'stage'], // 遊び人
  salaryman: ['work', 'money'], // 会社員
  idol: ['stage', 'light'], // アイドル（キラキラビーム）
  railman: ['ride', 'work'], // 鉄道員
  ballplayer: ['sport', 'rival', 'work'], // プロ野球選手
  schoolkid: ['school', 'kid'], // 小学生
  civil_local: ['work', 'guard'], // 地方公務員（防災訓練）
  cook: ['cook', 'fire', 'work'], // 料理人（強火・フランベ）
  parttimer: ['work', 'money'], // アルバイト
  neet: ['home', 'laugh'], // ニート
  saiyan: ['fist', 'henshin', 'sky'], // サイヤ人（大ザル変身・ぶ空術）
  youtuber: ['money', 'machine'], // ユーチューバー
  gamer: ['machine', 'kid'], // ゲーマー
  okan: ['home', 'cook'], // おかん
  spy: ['shinobi', 'henshin', 'work', 'machine'], // スパイ（変装）
  shonen_tantei: ['detective', 'kid', 'school'], // 少年探てい団
  neko_robot: ['machine', 'home'], // ネコ型ロボット
  kappa: ['monster', 'sport', 'ice'], // カッパ（すもう・水でっぽう）
  rurouni: ['sword', 'rival'], // るろうに剣士
  magician: ['stage', 'shinobi'], // 手品師
  alchemist: ['alchemy', 'magic'], // れん金術師
  // ───── 上級職 ─────
  battlemaster: ['sword', 'fist'], // バトルマスター
  paladin: ['sword', 'guard', 'heal'], // パラディン
  magic_knight: ['sword', 'magic', 'bolt'], // 魔法戦士（いなずま斬り・ライデイン）
  pirate: ['sword', 'money', 'ride'], // 海賊（お宝・船）
  holyfist: ['fist', 'light', 'heal'], // 聖拳士
  ninja: ['shinobi', 'fire', 'wind'], // 忍者（かとん・風神）
  tamer: ['monster', 'master'], // 魔物使い
  sage: ['magic', 'heal'], // 賢者
  superstar: ['stage', 'light', 'heal'], // スーパースター（スターダンス）
  fortune: ['magic', 'light', 'detective'], // 占い師（太陽・星のカード。運命を見ぬく）
  samurai: ['sword', 'money'], // サムライ（ぜに投げ）
  bucho: ['work', 'master'], // 部長
  major_leaguer: ['sport', 'rival', 'work'], // メジャーリーガー
  middleschooler: ['school', 'kid', 'sport'], // 中学生（部活）
  civil_national: ['work', 'money'], // 国家公務員（予算会議）
  police: ['guard', 'detective', 'ride', 'work'], // 警察官（パトカー）
  firefighter: ['ice', 'heal', 'ride', 'guard'], // 消防士（放水・救急手当・はしご車）
  train_driver: ['ride', 'work'], // 運転士
  patissier: ['cook', 'heal'], // パティシエ（ケーキでいやす）
  seishain: ['work', 'money'], // 正社員
  comedian: ['laugh', 'stage'], // お笑い芸人
  chuuni: ['dark', 'magic', 'kid'], // 中二病
  super_saiyan: ['fist', 'henshin', 'sky'], // スーパーサイヤ人
  setsubiya: ['machine', 'work', 'ice'], // 設備屋（エアコン全開）
  streamer: ['money', 'machine', 'stage'], // 人気配信者
  pro_gamer: ['machine', 'rival'], // プロゲーマー（世界大会）
  saikyo_okan: ['home', 'cook', 'bolt'], // 最強のおかん（おかんの雷）
  shachiku: ['work', 'ride'], // 社ちく（通勤ラッシュ）
  rakuten_cardman: ['money', 'stage', 'henshin'], // 楽天カードマン（赤い全身タイツのヒーロー）
  kisatsu: ['sword', 'ice'], // きさつ隊（水の呼吸）
  assassin: ['shinobi', 'dark'], // 殺し屋
  esper: ['magic', 'kid', 'sky'], // 超能力者（宙にうかせる・テレポート）
  oshiri_tantei: ['detective', 'laugh'], // おしり探てい
  meitantei: ['detective', 'kid', 'rival'], // 名探てい（かいとうキッド・黒の組織）
  creator: ['heal', 'money', 'work'], // クリエイター（薬局）
  mimi_robot: ['machine', 'home'], // 耳無しネコ型ロボット
  hanakappa: ['monster', 'heal'], // はなかっぱ（花のみつ）
  hitokiri: ['sword', 'dark', 'rival'], // 人斬りばっ刀さい
  kaito: ['shinobi', 'sky', 'rival'], // かいとう（ハンググライダー）
  wizard_student: ['magic', 'school', 'kid', 'sky'], // 魔法学校の生徒（ほうき）
  state_alchemist: ['alchemy', 'fire'], // 国家れん金術師（指ぱっちん）
  sailor_soldier: ['henshin', 'light', 'school'], // 美少女戦士（メイクアップ）
  // ───── 超級職 ─────
  dragon_knight: ['sword', 'sky', 'henshin'], // 竜の騎士（竜の紋章）
  archmage: ['magic', 'fire', 'ice'], // 大魔道士（メドローア）
  high_priest: ['heal', 'light'], // 大神官
  god_hand: ['fist', 'bolt', 'master'], // ゴッドハンド（いかずちの拳）
  summoner: ['magic', 'bolt', 'monster'], // 天地雷鳴士（げんま）
  magic_swordsman: ['sword', 'dark', 'magic'], // 魔剣士
  guardian: ['guard', 'heal'], // ガーディアン
  hero: ['sword', 'bolt', 'light', 'rival'], // 勇者（ギガデイン。魔王と ライバル）
  monster_master: ['monster', 'master'], // モンスターマスター
  star_diva: ['stage', 'light', 'heal'], // 星の歌姫
  sword_master: ['sword', 'master', 'bolt'], // ソードマスター（雷神一閃）
  shogun: ['sword', 'master'], // 将軍
  shacho: ['money', 'work', 'sky'], // 社長（プライベートジェット）
  nitoryu: ['sport', 'rival', 'work'], // 二刀流スター
  highschooler: ['school', 'kid'], // 高校生
  career: ['work', 'guard'], // キャリア組（危機管理）
  fruit_idol: ['stage', 'cook'], // フルーツジッパー（ミックスジュース）
  storm_idol: ['stage', 'wind', 'bolt'], // アラシ（旋風ステップ・雷鳴ライブ）
  keikyu_driver: ['ride', 'work', 'guard'], // 京急の運転士（がんじょうな先頭車）
  star_chef: ['cook', 'fire', 'master'], // 三ツ星シェフ
  tatakiage: ['money', 'work', 'master'], // たたき上げ社長
  m1_champion: ['laugh', 'stage', 'rival'], // M-1王者
  daikenja: ['magic', 'heal', 'master'], // 大賢者
  datenshi: ['dark', 'light', 'sky'], // ダ天使（黒いつばさ）
  ss2: ['fist', 'henshin', 'bolt'], // スーパーサイヤ人2（スパーク）
  ryonetsu: ['machine', 'work', 'ice'], // ryonetsu（空調）
  rubber: ['fist', 'henshin'], // ゴム人間（ギア2・ギア3）
  black_star: ['work', 'dark'], // ブラックきぎょうの星
  enbashira: ['sword', 'fire', 'master'], // 炎柱
  black_org: ['dark', 'shinobi', 'rival'], // 黒の組織
  doraemon: ['machine', 'home', 'sky'], // ドラえもん（タケコプター）
  kinniku_kappa: ['monster', 'fist'], // はなかっぱ（筋肉ニンニク）
  konoha: ['shinobi', 'rival', 'wind'], // 木の葉の忍び（らせん手裏剣）
  himura: ['sword', 'guard'], // ひ村ばっ刀さい（不殺のちかい）
  kaito_kid: ['shinobi', 'sky', 'rival', 'stage'], // かいとうキッド（月夜のグライダー）
  harry: ['magic', 'school', 'sky'], // ハリーポッター（ほうき）
  fullmetal: ['alchemy', 'fist', 'machine'], // はがねのれん金術師（機械のうで）
  sailor_moon: ['henshin', 'light', 'heal', 'school'], // セーラームーン
  // ───── 伝説の 職業 ─────
  loto_hero: ['sword', 'light', 'bolt'], // ロトの勇者
  ss3: ['fist', 'henshin', 'sky'], // スーパーサイヤ人3（しゅん間移動）
  nika: ['fist', 'henshin', 'laugh'], // ニカ（ニカの笑い声）
  maou: ['dark', 'magic', 'monster', 'rival'], // 魔王
  facility_genius: ['machine', 'work', 'master'], // 天才しせつ管理者
  hakaishin: ['fist', 'dark'], // はかい神
  hinokami: ['sword', 'fire', 'light'], // 日の呼吸の使い手
  hokage: ['shinobi', 'master', 'monster'], // 七代目火影（きつねの力）
  abarenbo_shogun: ['sword', 'master', 'ride'], // 暴れんぼう将軍（白馬）
  hiten: ['sword', 'master', 'wind'], // 飛天御剣流けい承者（飛天の大竜巻）
  homeroom_3b: ['school', 'master', 'work'], // 3年B組の担任
  // 第40回
  ryumajin: ['henshin', 'sword', 'bolt', 'magic'], // 竜魔人（いなずまの魔法剣）
  neo_queen: ['light', 'heal', 'guard', 'master'], // ネオ・クイーン・セレニティ（月の女王）
  // 第41回 B
  snow_queen: ['ice', 'magic', 'guard', 'henshin'], // 雪の女王（氷のかべ・氷のドレスに変身。歌とおどりは 13職業の 上限）
  fifth_spirit: ['ice', 'wind', 'fire', 'magic'], // 第5のせいれい（風・火・水・大地）
  // 第41回 A
  keikyu_president: ['ride', 'work', 'money', 'master'], // 京急の社長（赤い電車・会社のお金）
  hall_of_fame: ['sport', 'master', 'rival'], // 野球界の殿堂入り
  // 第43回（基本職・上級職・超級職。女の子は ももの姫・おてんば姫・ピーチ）
  plumber: ['fist', 'work', 'machine'], // 配管工（ジャンプふみつけ・スパナ）
  mustache: ['fist', 'fire', 'work'], // ひげおやじ（ファイアボール）
  mario: ['fist', 'fire', 'ride', 'master'], // マリオ（ヨッシーに乗る）
  // 第51回 W（基本職・上級職・超級職）
  kishou: ['bolt', 'ice', 'work'], // 気象予報士（かみなり注意報・にわか雨。天気を 当てる 仕事）
  otenki_caster: ['bolt', 'light', 'work'], // お天気キャスター（かみなりマーク・ぽかぽか日ざし。歌とおどりは 13職業の 上限）
  tenkou_tsukai: ['bolt', 'wind', 'ice', 'light'], // 天候をあやつる者（かみなり・台風・雨・太陽とにじ）
};

// そのタグの 職業（JOB_TAGS の じゅん）
export function jobsWithTag(...tags) {
  return Object.keys(JOB_TAGS).filter((j) => JOB_TAGS[j].some((t) => tags.includes(t)));
}
// 職業の タグ
export const jobTags = (job) => JOB_TAGS[job] || [];
export const hasTag = (job, tag) => jobTags(job).includes(tag);
