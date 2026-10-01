// 職業データ
//
// tier: 0=基本職 1=上級職 2=超級職
// req:  なるための じょうけん（この 職業を ぜんぶ レベル10＝マスターに する）
// reqAlt: べつの 道（例: 賢者は 遊び人を マスター するだけでも なれる）。[[職業, …], …]
// mods: キャラクターの基本ステータスにかける倍率
// family: 系統（同じ系統どうしは転職ペナルティが軽い）
// learn: [職業レベル, 技ID]（職業レベルは 1〜10）
// perLv: その職業のレベル1つにつき、どの職業でも有効な「ずっと残るボーナス」
// passive: その職業で いる あいだの とくべつな ちから
//
// 職業レベルは「たたかいに かった かず」で あがる（けいけんちとは べつ）。
// じぶんより レベルが とても ひくい てき だけ との たたかいは しゅぎょうに ならない。

export const JOB_MAX_LEVEL = 10;
// てきの レベルが「じぶんの レベル − この かず」より ひくいと しゅぎょうに ならない（ゆるめ）
export const JOB_TRAIN_GAP = 12;

const W_ALL = ['sword', 'axe', 'dagger', 'spear', 'claw', 'staff', 'fan', 'whip'];

export const JOBS = {
  // ───────────── 基本職 ─────────────
  warrior: {
    id: 'warrior', name: '戦士', kana: 'せんし', short: '戦士', tier: 0, family: 'phys', color: '#d4574e',
    desc: 'たくましい体で仲間を守る。剣の技「大地斬」「海波斬」が得意。',
    mods: { hp: 1.25, mp: 0.4, str: 1.25, def: 1.3, agi: 0.85, mag: 0.5, heal: 0.5 },
    weapons: ['sword', 'axe', 'dagger'], shield: true, armor: ['cloth', 'heavy', 'gi'], helm: true,
    perLv: { hp: 2 },
    learn: [
      [1, 'daichi'], [2, 'kabau'], [3, 'chikaratame'], [4, 'kaiha'], [5, 'kabutowari'],
      [6, 'kuuretsu'], [7, 'majingiri'], [8, 'tsurugimai'], [10, 'tamashii'],
    ],
  },
  monk: {
    id: 'monk', name: '武闘家', kana: 'ぶとうか', short: '武闘', tier: 0, family: 'phys', color: '#e0913a',
    desc: 'とても素早く、行動の順番が早く回ってくる。こぶしの技で会心をねらう。',
    mods: { hp: 1.05, mp: 0.5, str: 1.12, def: 0.9, agi: 1.45, mag: 0.5, heal: 0.7 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { agi: 1 },
    learn: [
      [1, 'seiken'], [2, 'mikawashi'], [3, 'bakuretsu'], [4, 'kamaitachi'], [5, 'kiaitame'],
      [6, 'mouko'], [7, 'mawashigeri'], [9, 'issen'], [10, 'hyakuretsu'],
    ],
  },
  priest: {
    id: 'priest', name: '僧侶', kana: 'そうりょ', short: '僧侶', tier: 0, family: 'magic', color: '#5aa0d8',
    desc: '回復の呪文「ホイミ」で仲間を助ける。パーティーの命づな。',
    mods: { hp: 0.95, mp: 1.2, str: 0.85, def: 1.0, agi: 0.95, mag: 0.8, heal: 1.45 },
    weapons: ['staff', 'spear'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 1, mp: 0.6 },
    learn: [
      [1, 'hoimi'], [2, 'sukara'], [2, 'kiarii'], [3, 'bagi'], [4, 'mahoton'],
      [5, 'behoimi'], [6, 'zao'], [7, 'sukuruto'], [8, 'kiariku'], [9, 'bagima'], [10, 'behomara'],
    ],
  },
  mage: {
    id: 'mage', name: '魔法使い', kana: 'まほうつかい', short: '魔法', tier: 0, family: 'magic', color: '#9a6ad0',
    desc: '攻撃呪文「メラ」「ヒャド」で敵をやっつける。行った町へ飛べる「ルーラ」も覚える。体は弱いので守ってもらおう。',
    mods: { hp: 0.8, mp: 1.4, str: 0.7, def: 0.8, agi: 1.0, mag: 1.45, heal: 0.8 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 0.6 },
    learn: [
      [1, 'mera'], [2, 'hyado'], [2, 'gira'], [2, 'rura'], [3, 'rukani'], [4, 'rariho'],
      [5, 'io'], [6, 'merami'], [7, 'hyadaruko'], [8, 'begirama'], [9, 'iora'], [10, 'merazoma'],
    ],
  },
  performer: {
    id: 'performer', name: '旅芸人', kana: 'たびげいにん', short: '旅芸', tier: 0, family: 'tech', color: '#4fb880',
    desc: 'おどりや歌で仲間を盛り上げる。器用なので、他の職業の技もうまく使える。',
    mods: { hp: 1.0, mp: 1.0, str: 0.95, def: 0.95, agi: 1.15, mag: 1.0, heal: 1.0 },
    weapons: ['dagger', 'fan', 'whip'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mp: 0.6, agi: 0.4 },
    versatile: true, // 旅芸人は転職ペナルティが軽い
    learn: [
      [1, 'hustle'], [2, 'piorimu'], [3, 'manusa'], [4, 'medapani'], [5, 'baikiruto'],
      [6, 'juggling'], [7, 'ouen'], [8, 'tatakai_uta'], [10, 'zameha_dance'],
    ],
  },
  jester: {
    id: 'jester', name: '遊び人', kana: 'あそびにん', short: '遊び', tier: 0, family: 'tech', color: '#b04ad0',
    desc: 'いつも遊んでばかり。何が起こるか分からない技を使い、時々勝手に遊び出す。マスターすると、なんと賢者になれるらしい…',
    mods: { hp: 0.95, mp: 0.9, str: 0.85, def: 0.85, agi: 1.3, mag: 0.95, heal: 0.9 },
    weapons: ['fan', 'whip', 'dagger', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { agi: 0.5, mp: 0.4 },
    passive: { goof: 0.08 },
    learn: [
      [1, 'js_asobu'], [2, 'js_gag'], [3, 'js_lucky'], [4, 'js_neru'], [5, 'js_kuchibue'],
      [6, 'js_bakuten'], [7, 'js_kusuguri'], [8, 'js_darts'], [10, 'js_miracle'],
    ],
  },
  salaryman: {
    id: 'salaryman', name: '会社員', kana: 'かいしゃいん', short: '会社', tier: 0, family: 'tech', color: '#4a5a7a',
    desc: '毎日がんばる会社員。めいしをわたして報連相でチームを支え、定時ダッシュで戦いからもにげられる。戦いで手に入るお金が少しふえる。',
    mods: { hp: 1.05, mp: 0.9, str: 1.0, def: 1.05, agi: 1.0, mag: 0.9, heal: 1.0 },
    weapons: ['dagger', 'staff', 'fan', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, def: 0.3 },
    passive: { gold: 1.1 },
    learn: [
      [1, 'sm_meishi'], [2, 'sm_horenso'], [3, 'sm_zangyo'], [4, 'sm_coffee'], [5, 'sm_teiji'],
      [6, 'sm_present'], [7, 'sm_nomikai'], [8, 'sm_eigyo'], [10, 'sm_bonus'],
    ],
  },
  idol: {
    id: 'idol', name: 'アイドル', kana: 'あいどる', short: 'アイ', tier: 0, family: 'magic', color: '#ff7ab8',
    desc: 'みんなの人気者。歌とダンスで仲間を元気にし、投げキッスで敵をメロメロにする。マスターするとスーパースターになれる。',
    mods: { hp: 0.95, mp: 1.15, str: 0.8, def: 0.9, agi: 1.25, mag: 1.05, heal: 1.25 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 0.5, agi: 0.5 },
    learn: [
      [1, 'id_kiss'], [2, 'id_fansa'], [3, 'id_wink'], [4, 'id_hightouch'], [5, 'id_center'],
      [6, 'id_penlight'], [7, 'id_encore'], [8, 'id_kami'], [10, 'id_senkyo'],
    ],
  },
  railman: {
    id: 'railman', name: '鉄道員', kana: 'てつどういん', short: '鉄道', tier: 0, family: 'phys', color: '#2a4a8a',
    desc: '時間を守る鉄道員。指さし確認と非常ブレーキで、戦いの流れをととのえる。体がじょうぶ。',
    mods: { hp: 1.2, mp: 0.8, str: 1.1, def: 1.2, agi: 1.0, mag: 0.7, heal: 0.9 },
    weapons: ['fan', 'staff', 'spear', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 1, def: 0.5 },
    learn: [
      [1, 'rw_yubisashi'], [2, 'rw_shuppatsu'], [3, 'rw_announce'], [4, 'rw_manin'], [5, 'rw_brake'],
      [6, 'rw_teikoku'], [7, 'rw_kaisou'], [8, 'rw_shinkansen'], [10, 'rw_shuuden'],
    ],
  },
  ballplayer: {
    id: 'ballplayer', name: 'プロ野球選手', kana: 'ぷろやきゅうせんしゅ', short: '野球', tier: 0, family: 'phys', color: '#d85a3a',
    desc: 'プロの野球選手。バットでかっとばし、ごう速球を投げる。たくさん練習するとメジャーリーガーになれる。',
    mods: { hp: 1.15, mp: 0.6, str: 1.2, def: 1.0, agi: 1.15, mag: 0.6, heal: 0.8 },
    weapons: ['bat', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { str: 0.5, agi: 0.5 },
    learn: [
      [1, 'bb_hit'], [2, 'bb_bunt'], [3, 'bb_fastball'], [4, 'bb_tourui'], [5, 'bb_ouenka'],
      [6, 'bb_headslide'], [7, 'bb_homerun'], [8, 'bb_keien'], [10, 'bb_sayonara'],
    ],
  },

  // ───────────── 上級職（基本職 2つを マスターすると なれる。部長・メジャーリーガーは 1つ） ─────────────
  battlemaster: {
    id: 'battlemaster', name: 'バトルマスター', kana: 'ばとるますたー', short: 'バト', tier: 1, req: ['warrior', 'monk'], family: 'phys', color: '#e0503a',
    desc: '戦いの達人。力も素早さも高く、「もろば斬り」や「むそうぎり」で敵をなぎ倒す。',
    mods: { hp: 1.3, mp: 0.5, str: 1.4, def: 1.15, agi: 1.2, mag: 0.5, heal: 0.6 },
    weapons: ['sword', 'axe', 'spear', 'claw', 'none'], shield: true, armor: ['cloth', 'heavy', 'gi'], helm: true,
    perLv: { str: 1, hp: 1 },
    learn: [[1, 'bm_moroba'], [3, 'bm_musou'], [5, 'bm_otakebi'], [7, 'bm_tension'], [10, 'bm_hakai']],
  },
  paladin: {
    id: 'paladin', name: 'パラディン', kana: 'ぱらでぃん', short: 'パラ', tier: 1, req: ['warrior', 'priest'], family: 'phys', color: '#6a8ad8',
    desc: '聖なる騎士。固い守りで仲間を守り、いやしの光で回復もできる。',
    mods: { hp: 1.4, mp: 0.85, str: 1.1, def: 1.5, agi: 0.8, mag: 0.6, heal: 1.2 },
    weapons: ['sword', 'spear', 'staff'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { def: 1, hp: 1 },
    learn: [[1, 'pl_daibougyo'], [3, 'pl_hikari'], [5, 'pl_grandcross'], [7, 'pl_aegis'], [10, 'pl_judgment']],
  },
  magic_knight: {
    id: 'magic_knight', name: '魔法戦士', kana: 'まほうせんし', short: '魔戦', tier: 1, req: ['warrior', 'mage'], family: 'phys', color: '#b05ad0',
    desc: '剣と呪文を合わせて戦う。炎・氷・いかずちの剣と「魔法剣」が使える。',
    mods: { hp: 1.15, mp: 1.05, str: 1.2, def: 1.1, agi: 1.05, mag: 1.2, heal: 0.7 },
    weapons: ['sword', 'dagger', 'staff'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { str: 0.5, mag: 0.5, mp: 0.4 },
    learn: [[1, 'mk_kaengiri'], [2, 'mk_hyouketsu'], [4, 'mk_inazuma'], [6, 'mk_forcebreak'], [8, 'mk_raiden'], [10, 'mk_burst']],
  },
  pirate: {
    id: 'pirate', name: '海賊', kana: 'かいぞく', short: '海賊', tier: 1, req: ['warrior', 'performer'], family: 'phys', color: '#2a8aa8',
    desc: '海のあらくれ者。「海賊斬り」や「うずしお」で暴れ回り、うたげの歌で仲間を盛り上げる。お宝探しが得意で、戦いで手に入るお金がふえる。',
    mods: { hp: 1.3, mp: 0.7, str: 1.3, def: 1.15, agi: 1.1, mag: 0.8, heal: 0.8 },
    weapons: ['sword', 'axe', 'dagger', 'whip'], shield: true, armor: ['cloth', 'heavy', 'gi'], helm: true,
    perLv: { hp: 1, str: 0.5 },
    passive: { gold: 1.2 },
    learn: [[1, 'pr_kaizokugiri'], [2, 'pr_dokuro'], [3, 'pr_uzushio'], [5, 'pr_ikari'], [7, 'pr_utage'], [8, 'pr_takara'], [10, 'pr_cannon']],
  },
  holyfist: {
    id: 'holyfist', name: '聖拳士', kana: 'せいけんし', short: '聖拳', tier: 1, req: ['monk', 'priest'], family: 'phys', color: '#f2c14e',
    desc: '聖なる光をこぶしに宿す武術家。めいそうで自分のキズも治せる。',
    mods: { hp: 1.15, mp: 0.9, str: 1.2, def: 1.0, agi: 1.35, mag: 0.6, heal: 1.2 },
    weapons: ['claw', 'staff', 'spear', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: false,
    perLv: { agi: 0.5, heal: 0.5 },
    learn: [[1, 'hf_seikou'], [3, 'hf_meisou'], [5, 'hf_mikiri'], [7, 'hf_tenshou'], [10, 'hf_hyakka']],
  },
  ninja: {
    id: 'ninja', name: '忍者', kana: 'にんじゃ', short: '忍者', tier: 1, req: ['monk', 'mage'], family: 'tech', color: '#3a3a6a',
    desc: '影のように素早い。手裏剣と忍法（かとん・風神）で敵をほんろうする。',
    mods: { hp: 0.95, mp: 0.9, str: 1.1, def: 0.85, agi: 1.7, mag: 1.1, heal: 0.6 },
    weapons: ['dagger', 'claw', 'sword', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { agi: 1 },
    learn: [[1, 'nj_shuriken'], [3, 'nj_katon'], [5, 'nj_bunshin'], [7, 'nj_kagenui'], [10, 'nj_fuujin']],
  },
  tamer: {
    id: 'tamer', name: '魔物使い', kana: 'まものつかい', short: '魔物', tier: 1, req: ['monk', 'performer'], family: 'tech', color: '#8a6a3a',
    desc: '魔物と心を通わせる。ムチで戦い、この職業の人がいると魔物が仲間になりやすい。',
    mods: { hp: 1.2, mp: 0.7, str: 1.2, def: 1.05, agi: 1.2, mag: 0.7, heal: 0.9 },
    weapons: ['whip', 'claw', 'axe', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: false,
    perLv: { hp: 1, agi: 0.3 },
    passive: { befriend: 1.5 },
    learn: [[1, 'tm_shippu'], [3, 'tm_beast'], [5, 'tm_kemono'], [7, 'tm_kizuna'], [10, 'tm_majuu']],
  },
  sage: {
    id: 'sage', name: '賢者', kana: 'けんじゃ', short: '賢者', tier: 1, req: ['priest', 'mage'], reqAlt: [['jester']], family: 'magic', color: '#3fa35a',
    desc: '回復と攻撃、両方の呪文を極めた者。ベホマやマヒャド、移動の呪文ルーラを覚える。',
    mods: { hp: 0.95, mp: 1.5, str: 0.75, def: 0.95, agi: 1.05, mag: 1.4, heal: 1.4 },
    weapons: ['staff', 'spear', 'dagger'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mp: 1, mag: 0.5, heal: 0.5 },
    learn: [[1, 'sg_behoma'], [1, 'rura'], [3, 'sg_bagikurosu'], [5, 'sg_zaoral'], [7, 'sg_mahyado'], [10, 'sg_inori']],
  },
  superstar: {
    id: 'superstar', name: 'スーパースター', kana: 'すーぱーすたー', short: 'スタ', tier: 1, req: ['priest', 'performer'], reqAlt: [['idol']], family: 'tech', color: '#e46fa8',
    desc: 'みんなのあこがれ。おどりで回復し、スポットライトで敵の目を引きつける。',
    mods: { hp: 1.0, mp: 1.2, str: 0.9, def: 1.0, agi: 1.3, mag: 1.1, heal: 1.3 },
    weapons: ['fan', 'whip', 'dagger'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mp: 0.5, heal: 0.5 },
    versatile: true,
    learn: [[1, 'ss_stardance'], [3, 'ss_spotlight'], [5, 'ss_charm'], [7, 'ss_happy'], [10, 'ss_encore']],
  },
  fortune: {
    id: 'fortune', name: '占い師', kana: 'うらないし', short: '占い', tier: 1, req: ['mage', 'performer'], family: 'magic', color: '#7a4ab8',
    desc: 'タロットカードで運命を動かす。太陽のカードで回復、月のカードでねむらせる。',
    mods: { hp: 0.95, mp: 1.35, str: 0.8, def: 0.95, agi: 1.1, mag: 1.35, heal: 1.1 },
    weapons: ['staff', 'fan', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.5 },
    learn: [[1, 'ft_sun'], [3, 'ft_moon'], [5, 'ft_star'], [7, 'ft_tower'], [10, 'ft_fate']],
  },
  samurai: {
    id: 'samurai', name: 'サムライ', kana: 'さむらい', short: 'サム', tier: 1, req: ['warrior', 'monk'], family: 'phys', color: '#7a2a2a',
    desc: '刀の道をきわめる武士。居合斬りで会心をねらい、みね打ちで敵をたおさずに止められる。ぜに投げはお金を使う大技。',
    mods: { hp: 1.25, mp: 0.6, str: 1.45, def: 1.1, agi: 1.25, mag: 0.5, heal: 0.6 },
    weapons: ['sword', 'spear', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, agi: 0.5 },
    learn: [[1, 'sa_iai'], [3, 'sa_mineuchi'], [5, 'sa_tsubame'], [7, 'sa_zeni'], [10, 'sa_ittou']],
  },
  bucho: {
    id: 'bucho', name: '部長', kana: 'ぶちょう', short: '部長', tier: 1, req: ['salaryman'], family: 'tech', color: '#6a5a3a',
    desc: '部下をまとめる管理職。会議で敵をねむらせ、決さいで味方をふるい立たせる。戦いで手に入るお金がもっとふえる。',
    mods: { hp: 1.2, mp: 1.0, str: 1.1, def: 1.2, agi: 0.95, mag: 1.0, heal: 1.1 },
    weapons: ['dagger', 'staff', 'fan', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, def: 0.5 },
    passive: { gold: 1.2 },
    learn: [[1, 'bc_kaigi'], [3, 'bc_kessai'], [5, 'bc_homeru'], [7, 'bc_idou'], [10, 'bc_modoshi']],
  },
  major_leaguer: {
    id: 'major_leaguer', name: 'メジャーリーガー', kana: 'めじゃーりーがー', short: 'メジ', tier: 1, req: ['ballplayer'], family: 'phys', color: '#2a5ab8',
    desc: '海の向こうの大リーグで活やくする選手。160キロの球とグランドスラムで敵をおどろかせる。',
    mods: { hp: 1.3, mp: 0.7, str: 1.4, def: 1.1, agi: 1.3, mag: 0.7, heal: 0.9 },
    weapons: ['bat', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, agi: 0.5 },
    learn: [[1, 'ml_160'], [3, 'ml_sweeper'], [5, 'ml_challenge'], [7, 'ml_grandslam'], [10, 'ml_worldseries']],
  },

  // ───────────── 超級職（上級職を マスターすると なれる） ─────────────
  dragon_knight: {
    id: 'dragon_knight', name: '竜の騎士', kana: 'りゅうのきし', short: '竜騎', tier: 2, req: ['battlemaster', 'magic_knight'], family: 'phys', color: '#2aa06a',
    desc: '伝説の竜の力を受けついだ戦士。竜闘気をまとい、ギガブレイクとドルオーラを放つ。',
    mods: { hp: 1.45, mp: 0.9, str: 1.5, def: 1.35, agi: 1.25, mag: 1.15, heal: 0.8 },
    weapons: ['sword', 'spear', 'axe', 'claw', 'none'], shield: true, armor: ['cloth', 'heavy', 'gi', 'robe'], helm: true,
    perLv: { str: 1, def: 0.5, hp: 1 },
    learn: [[1, 'dk_aura'], [3, 'dk_gigabreak'], [5, 'dk_crest'], [7, 'dk_ikari'], [10, 'dk_doruora']],
  },
  archmage: {
    id: 'archmage', name: '大魔道士', kana: 'だいまどうし', short: '大魔', tier: 2, req: ['sage', 'magic_knight'], family: 'magic', color: '#5ac880',
    desc: 'あらゆる呪文を極めた魔道士。消滅呪文「メドローア」を使えるただ一つの職業。',
    mods: { hp: 0.95, mp: 1.7, str: 0.75, def: 0.95, agi: 1.1, mag: 1.75, heal: 1.1 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 1 },
    learn: [[1, 'am_begiragon'], [3, 'am_manaheal'], [5, 'am_ionazun'], [7, 'am_meragaia'], [10, 'am_medroa']],
  },
  high_priest: {
    id: 'high_priest', name: '大神官', kana: 'だいしんかん', short: '大神', tier: 2, req: ['sage', 'paladin'], family: 'magic', color: '#f4e08a',
    desc: '神に選ばれた、いやし手の頂点。ザオリクとベホマズンでパーティーを守りぬく。',
    mods: { hp: 1.1, mp: 1.6, str: 0.8, def: 1.15, agi: 1.0, mag: 1.0, heal: 1.75 },
    weapons: ['staff', 'spear'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 1, mp: 1 },
    learn: [[1, 'hp_seinaru'], [3, 'hp_zaoriku'], [5, 'hp_bagimuta'], [7, 'hp_behomazun'], [10, 'hp_tenshi']],
  },
  god_hand: {
    id: 'god_hand', name: 'ゴッドハンド', kana: 'ごっどはんど', short: 'ゴッ', tier: 2, req: ['battlemaster', 'holyfist'], family: 'phys', color: '#ffb030',
    desc: '神のこぶしを持つ武人の頂点。「神速の拳」と「むそうけん」で敵を打ち砕く。',
    mods: { hp: 1.35, mp: 0.7, str: 1.6, def: 1.2, agi: 1.5, mag: 0.5, heal: 0.9 },
    weapons: ['claw', 'sword', 'axe', 'spear', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'gh_shinsoku'], [3, 'gh_tenchi'], [5, 'gh_musou'], [7, 'gh_ikazuchi'], [10, 'gh_godfist']],
  },
  summoner: {
    id: 'summoner', name: '天地雷鳴士', kana: 'てんちらいめいし', short: '天地', tier: 2, req: ['fortune', 'sage'], family: 'magic', color: '#6ab8e8',
    desc: '天地のせいれい「げんま」を呼び出して戦う。最後にはジゴスパークを覚える。',
    mods: { hp: 1.0, mp: 1.6, str: 0.8, def: 1.0, agi: 1.1, mag: 1.6, heal: 1.3 },
    weapons: ['staff', 'fan', 'whip'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, heal: 0.5 },
    learn: [[1, 'sm_ifrit'], [3, 'sm_undine'], [5, 'sm_raijin'], [7, 'sm_kyojin'], [10, 'sm_jigo']],
  },
  magic_swordsman: {
    id: 'magic_swordsman', name: '魔剣士', kana: 'まけんし', short: '魔剣', tier: 2, req: ['magic_knight', 'ninja'], family: 'phys', color: '#6a2a8a',
    desc: '闇の力を剣に宿す剣士。ソウルイーターで敵の命を吸い取る。',
    mods: { hp: 1.25, mp: 1.1, str: 1.45, def: 1.15, agi: 1.25, mag: 1.3, heal: 0.6 },
    weapons: ['sword', 'dagger', 'axe'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { str: 1, mag: 0.5 },
    learn: [[1, 'ms_dark'], [3, 'ms_soul'], [5, 'ms_jubaku'], [7, 'ms_ankoku'], [10, 'ms_hades']],
  },
  guardian: {
    id: 'guardian', name: 'ガーディアン', kana: 'がーでぃあん', short: 'ガー', tier: 2, req: ['paladin', 'pirate'], family: 'phys', color: '#8a9ab8',
    desc: '仲間のたてとなる守りの頂点。「不動のようさい」でみんなを守る。',
    mods: { hp: 1.6, mp: 0.8, str: 1.15, def: 1.75, agi: 0.8, mag: 0.6, heal: 1.1 },
    weapons: ['spear', 'sword', 'axe'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { def: 1, hp: 2 },
    learn: [[1, 'gd_wall'], [3, 'gd_bash'], [5, 'gd_protect'], [7, 'gd_iyashi'], [10, 'gd_fortress']],
  },
  hero: {
    id: 'hero', name: '勇者', kana: 'ゆうしゃ', short: '勇者', tier: 2, req: ['battlemaster', 'sage', 'paladin'], family: 'phys', color: '#3f7fd0',
    desc: 'きずなの紋章に認められた本当の勇者。ギガスラッシュとギガデインで闇をはらう。',
    mods: { hp: 1.4, mp: 1.2, str: 1.35, def: 1.3, agi: 1.2, mag: 1.3, heal: 1.3 },
    weapons: ['sword', 'spear', 'axe', 'staff'], shield: true, armor: ['cloth', 'heavy', 'robe', 'gi'], helm: true,
    perLv: { hp: 1, str: 0.5, mag: 0.5, heal: 0.5 },
    versatile: true,
    learn: [[1, 'hr_gigaslash'], [3, 'hr_kizuna'], [5, 'hr_inori'], [7, 'hr_gigadein'], [10, 'hr_kizunaken']],
  },
  monster_master: {
    id: 'monster_master', name: 'モンスターマスター', kana: 'もんすたーますたー', short: 'モン', tier: 2, req: ['tamer', 'sage'], family: 'tech', color: '#c8903a',
    desc: '魔物と心を一つにする達人。魔物がとても仲間になりやすく、仲間の魔物も強くなる。',
    mods: { hp: 1.25, mp: 1.1, str: 1.2, def: 1.1, agi: 1.25, mag: 1.0, heal: 1.2 },
    weapons: ['whip', 'claw', 'axe', 'staff', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: false,
    perLv: { hp: 1, heal: 0.5 },
    passive: { befriend: 2, monsterBoost: 1.12 },
    learn: [[1, 'mm_whip'], [3, 'mm_iyashi'], [5, 'mm_howl'], [7, 'mm_kizuna'], [10, 'mm_king']],
  },
  star_diva: {
    id: 'star_diva', name: '星の歌姫', kana: 'ほしのうたひめ', short: '歌姫', tier: 2, req: ['superstar', 'fortune'], family: 'magic', color: '#f7a1c4',
    desc: '守り星の歌を歌う歌姫。星の歌でいやし、流星群を降らせる。',
    mods: { hp: 1.05, mp: 1.5, str: 0.8, def: 1.0, agi: 1.35, mag: 1.4, heal: 1.5 },
    weapons: ['fan', 'staff', 'whip'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mp: 1, heal: 0.5 },
    versatile: true,
    learn: [[1, 'sd_song'], [3, 'sd_comet'], [5, 'sd_lullaby'], [7, 'sd_blessing'], [10, 'sd_meteor']],
  },
  sword_master: {
    id: 'sword_master', name: 'ソードマスター', kana: 'そーどますたー', short: '剣聖', tier: 2, req: ['samurai', 'paladin', 'magic_knight'], family: 'phys', color: '#c8d0f0',
    desc: 'あらゆる剣技をきわめた剣聖。聖なる剣・よろいをくだく剣・闇の剣を自在にあやつる、剣の頂点。',
    mods: { hp: 1.45, mp: 1.1, str: 1.65, def: 1.35, agi: 1.3, mag: 1.2, heal: 1.0 },
    weapons: ['sword', 'dagger'], shield: true, armor: ['cloth', 'heavy', 'gi'], helm: true,
    perLv: { str: 1, def: 0.5, hp: 1 },
    learn: [[1, 'swm_seiken'], [3, 'swm_haken'], [5, 'swm_ankoku'], [7, 'swm_raijin'], [10, 'swm_zenken']],
  },
  shogun: {
    id: 'shogun', name: '将軍', kana: 'しょうぐん', short: '将軍', tier: 2, req: ['samurai', 'ninja'], family: 'phys', color: '#c8a040',
    desc: 'サムライと忍びをしたがえる天下人。大号令で仲間をひきい、天下一の太刀をふるう。',
    mods: { hp: 1.5, mp: 0.9, str: 1.55, def: 1.35, agi: 1.35, mag: 0.8, heal: 0.9 },
    weapons: ['sword', 'spear', 'dagger', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, hp: 1 },
    learn: [[1, 'sg_gorei'], [3, 'sg_kagemusha'], [5, 'sg_oniwaban'], [7, 'sg_gunbai'], [10, 'sg_tenka']],
  },
  shacho: {
    id: 'shacho', name: '社長', kana: 'しゃちょう', short: '社長', tier: 2, req: ['bucho'], family: 'tech', color: '#3a3a4a',
    desc: '会社のトップ。ツルの一声で仲間がすぐに動き、大型買収で敵をお金に変える。戦いで手に入るお金がたくさんふえる。',
    mods: { hp: 1.35, mp: 1.3, str: 1.25, def: 1.3, agi: 1.1, mag: 1.2, heal: 1.25 },
    weapons: ['dagger', 'staff', 'fan', 'sword', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, mp: 0.5, def: 0.5 },
    passive: { gold: 1.5 },
    learn: [[1, 'sh_tsuru'], [3, 'sh_meirei'], [5, 'sh_kabunushi'], [7, 'sh_baishu'], [10, 'sh_topdown']],
  },
  nitoryu: {
    id: 'nitoryu', name: '二刀流スター', kana: 'にとうりゅうすたー', short: '二刀', tier: 2, req: ['major_leaguer'], family: 'phys', color: '#c83a3a',
    desc: '投げても打っても世界一。「二刀流」で続けて動き、「リアル二刀流」で敵全体をなぎはらう、野球の頂点。',
    mods: { hp: 1.45, mp: 1.1, str: 1.55, def: 1.2, agi: 1.45, mag: 1.2, heal: 1.0 },
    weapons: ['bat', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'nt_nitoryu'], [3, 'nt_5050'], [5, 'nt_nemuri'], [7, 'nt_mvp'], [10, 'nt_real']],
  },
};

// はじめに えらべる 職業（基本職）
export const JOB_ORDER = ['warrior', 'monk', 'priest', 'mage', 'performer', 'jester', 'salaryman', 'idol', 'railman', 'ballplayer'];
export const ADVANCED_ORDER = ['battlemaster', 'paladin', 'magic_knight', 'pirate', 'holyfist', 'ninja', 'tamer', 'sage', 'superstar', 'fortune',
  'samurai', 'bucho', 'major_leaguer'];
export const SUPER_ORDER = ['dragon_knight', 'archmage', 'high_priest', 'god_hand', 'summoner', 'magic_swordsman', 'guardian', 'hero', 'monster_master', 'star_diva',
  'sword_master', 'shogun', 'shacho', 'nitoryu'];
export const ALL_JOBS = [...JOB_ORDER, ...ADVANCED_ORDER, ...SUPER_ORDER];
export const TIER_NAMES = ['基本職', '上級職', '超級職'];

// 職業レベルに ひつような たたかいの かず（るいけい。上級・超級は すこし おおい）
const BATTLES = [0, 3, 7, 13, 21, 31, 43, 58, 76, 98];
const TIER_MULT = [1, 1.4, 1.8];
// 職業レベルの 上がりにくさ（0.8 … はじめの 版の 0.8倍 たたかえば よい）。上がった レベルは そのまま
export const JOB_RATE = 0.8;
export function jobBattlesForLevel(lv, tier = 0) {
  if (lv <= 1) return 0;
  return Math.round(BATTLES[Math.min(JOB_MAX_LEVEL, lv) - 1] * (TIER_MULT[tier] || 1) * JOB_RATE);
}

// なる ための じょうけんの くみあわせ（req と reqAlt。どれか 1つを ぜんぶ マスターすれば なれる）
export function jobReqSets(id) {
  const j = JOBS[id];
  if (!j?.req) return [];
  return [j.req, ...(j.reqAlt || [])];
}

// その 職業の もとに なった 基本職（上級職なら 2つ、超級職なら もっと）
const baseCache = new Map();
export function jobBases(id) {
  if (baseCache.has(id)) return baseCache.get(id);
  const j = JOBS[id];
  let out = [];
  if (j) {
    if (!j.req) out = [id];
    else for (const set of jobReqSets(id)) for (const r of set) for (const b of jobBases(r)) if (!out.includes(b)) out.push(b);
  }
  out.sort((a, b) => JOB_ORDER.indexOf(a) - JOB_ORDER.indexOf(b));
  baseCache.set(id, out);
  return out;
}

// その 職業と、そこに いたるまでの 職業 ぜんぶ
const ancCache = new Map();
export function jobAncestry(id) {
  if (ancCache.has(id)) return ancCache.get(id);
  const out = new Set([id]);
  for (const set of jobReqSets(id)) for (const r of set) for (const a of jobAncestry(r)) out.add(a);
  ancCache.set(id, out);
  return out;
}

// なる ための じょうけんの せつめい（例: 「戦士Lv10＋武闘家Lv10」「僧侶Lv10＋魔法使いLv10 または 遊び人Lv10」）
// name: 職業の なまえの 出し方（まだ ひみつの 職業を「？？？？」に する ときなど）
export function jobReqText(id, name = (r) => JOBS[r].name) {
  return jobReqSets(id).map((set) => set.map((r) => `${name(r)}Lv${JOB_MAX_LEVEL}`).join('＋')).join(' または ');
}
