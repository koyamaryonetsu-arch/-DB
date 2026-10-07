// 職業データ
//
// tier: 0=基本職 1=上級職 2=超級職
// req:  なるための じょうけん（この 職業を ぜんぶ レベル10＝マスターに する）
// reqAlt: べつの 道（例: 賢者は 遊び人を マスター するだけでも なれる）。[[職業, …], …]
// mods: キャラクターの基本ステータスにかける倍率
// family: 系統（同じ系統どうしは転職ペナルティが軽い）
// learn: [職業レベル, 技ID]（職業レベルは 1〜10）
// perLv: その職業のレベル1つにつき、どの職業でも有効な「ずっと残るボーナス」
// passive: その職業で いる あいだの とくべつな ちから（train: 勝った たたかいが 何回ぶんの 修行に なるか）
// body: その 体の 人だけ なれる（0=男性 1=女性。look.body が ない 人は 男性 あつかい）
//
// 職業レベルは「たたかいに かった かず」で あがる（けいけんちとは べつ）。
// 1回の こうどうで おわって しまう（ワンパンチの）たたかいは、しゅぎょうが はんぶんしか すすまない。

export const JOB_MAX_LEVEL = 10;
// ワンパンチで おわった（なかまの 1回めの こうどうで かった）たたかいの しゅぎょうの わりあい。ほかの たたかいは まるごと 1回ぶん
export const JOB_EASY_RATE = 0.5;

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
      [5, 'behoimi'], [6, 'zao'], [6, 'sr_seikou'], [7, 'sukuruto'], [8, 'kiariku'], [9, 'bagima'], [10, 'behomara'],
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
    weapons: ['dagger', 'fan', 'whip', 'boomerang'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mp: 0.6, agi: 0.4 },
    versatile: true, // 旅芸人は転職ペナルティが軽い
    learn: [
      [1, 'hustle'], [1, 'pf_hifuki'], [2, 'piorimu'], [3, 'manusa'], [4, 'medapani'], [5, 'baikiruto'],
      [6, 'juggling'], [7, 'ouen'], [8, 'tatakai_uta'], [9, 'pf_tamanori'], [10, 'zameha_dance'],
    ],
  },
  jester: {
    id: 'jester', name: '遊び人', kana: 'あそびにん', short: '遊び', tier: 0, family: 'tech', color: '#b04ad0',
    desc: 'いつも遊んでばかり。何が起こるか分からない技を使い、時々勝手に遊び出す。マスターすると、なんと賢者になれるらしい…',
    mods: { hp: 0.95, mp: 0.9, str: 0.85, def: 0.85, agi: 1.3, mag: 0.95, heal: 0.9 },
    weapons: ['fan', 'whip', 'dagger', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { agi: 0.5, mp: 0.4 },
    passive: { goof: 0.08 },
    learn: [
      [1, 'js_asobu'], [2, 'js_gag'], [3, 'js_lucky'], [4, 'js_neru'], [5, 'js_kuchibue'],
      [6, 'js_bakuten'], [7, 'js_kusuguri'], [8, 'js_darts'], [9, 'js_pie'], [10, 'js_miracle'],
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
      [1, 'sm_meishi'], [2, 'sm_horenso'], [2, 'sm_kaban'], [3, 'sm_zangyo'], [4, 'sm_coffee'], [5, 'sm_teiji'],
      [6, 'sm_present'], [7, 'sm_nomikai'], [8, 'sm_eigyo'], [9, 'sm_nouki'], [10, 'sm_bonus'],
    ],
  },
  idol: {
    id: 'idol', name: 'アイドル', kana: 'あいどる', short: 'アイ', tier: 0, family: 'magic', color: '#ff7ab8',
    desc: 'みんなの人気者。歌とダンスで仲間を元気にし、投げキッスで敵をメロメロにする。マスターするとスーパースターになれる。',
    mods: { hp: 0.95, mp: 1.15, str: 0.8, def: 0.9, agi: 1.25, mag: 1.05, heal: 1.25 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 0.5, agi: 0.5 },
    learn: [
      [1, 'id_kiss'], [2, 'id_fansa'], [2, 'id_beam'], [3, 'id_wink'], [4, 'id_hightouch'], [5, 'id_center'],
      [6, 'id_penlight'], [6, 'id_shower'], [7, 'id_encore'], [8, 'id_kami'], [9, 'id_dome'], [10, 'id_senkyo'],
    ],
  },
  railman: {
    id: 'railman', name: '鉄道員', kana: 'てつどういん', short: '鉄道', tier: 0, family: 'phys', color: '#2a4a8a',
    desc: '時間を守る鉄道員。指さし確認と非常ブレーキで、戦いの流れをととのえる。体がじょうぶ。きわめると運転士になれる。',
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
    learn: [[1, 'pl_daibougyo'], [2, 'pl_seiken'], [3, 'pl_hikari'], [5, 'pl_grandcross'], [7, 'pl_aegis'], [10, 'pl_judgment']],
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
    weapons: ['dagger', 'claw', 'sword', 'boomerang', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
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
    learn: [[1, 'tm_shippu'], [3, 'tm_beast'], [4, 'tm_ranbu'], [5, 'tm_kemono'], [7, 'tm_kizuna'], [10, 'tm_majuu']],
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
    weapons: ['fan', 'whip', 'dagger', 'boomerang'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mp: 0.5, heal: 0.5 },
    versatile: true,
    learn: [[1, 'ss_stardance'], [2, 'ss_stardust'], [3, 'ss_spotlight'], [5, 'ss_charm'], [7, 'ss_happy'], [8, 'ss_nova'], [10, 'ss_encore']],
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
    learn: [[1, 'bc_kaigi'], [2, 'bc_golf'], [3, 'bc_kessai'], [5, 'bc_homeru'], [7, 'bc_idou'], [8, 'bc_shucchou'], [10, 'bc_modoshi']],
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
    learn: [[1, 'hp_seinaru'], [2, 'hp_holy'], [3, 'hp_zaoriku'], [5, 'hp_bagimuta'], [7, 'hp_behomazun'], [8, 'hp_sabaki'], [10, 'hp_tenshi']],
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
    learn: [[1, 'gd_wall'], [2, 'gd_youzai'], [3, 'gd_bash'], [5, 'gd_protect'], [7, 'gd_iyashi'], [8, 'gd_daichi'], [10, 'gd_fortress']],
  },
  hero: {
    id: 'hero', name: '勇者', kana: 'ゆうしゃ', short: '勇者', tier: 2, req: ['battlemaster', 'sage', 'paladin'], family: 'phys', color: '#3f7fd0',
    desc: 'きずなの紋章に認められた本当の勇者。ギガスラッシュとギガデインで闇をはらう。',
    mods: { hp: 1.4, mp: 1.2, str: 1.35, def: 1.3, agi: 1.2, mag: 1.3, heal: 1.3 },
    weapons: ['sword', 'spear', 'axe', 'staff', 'boomerang'], shield: true, armor: ['cloth', 'heavy', 'robe', 'gi'], helm: true,
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
    learn: [[1, 'mm_whip'], [3, 'mm_iyashi'], [5, 'mm_howl'], [7, 'mm_kizuna'], [8, 'mm_daikoushin'], [10, 'mm_king']],
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
    learn: [[1, 'sg_gorei'], [2, 'sg_ikkiuchi'], [3, 'sg_kagemusha'], [5, 'sg_oniwaban'], [7, 'sg_gunbai'], [10, 'sg_tenka']],
  },
  shacho: {
    id: 'shacho', name: '社長', kana: 'しゃちょう', short: '社長', tier: 2, req: ['bucho'], family: 'tech', color: '#3a3a4a',
    desc: '会社のトップ。ツルの一声で仲間がすぐに動き、大型買収で敵をお金に変える。戦いで手に入るお金がたくさんふえる。',
    mods: { hp: 1.35, mp: 1.3, str: 1.25, def: 1.3, agi: 1.1, mag: 1.2, heal: 1.25 },
    weapons: ['dagger', 'staff', 'fan', 'sword', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, mp: 0.5, def: 0.5 },
    passive: { gold: 1.5 },
    learn: [[1, 'sh_tsuru'], [2, 'sh_jet'], [3, 'sh_meirei'], [5, 'sh_kabunushi'], [7, 'sh_baishu'], [8, 'sh_oneman'], [10, 'sh_topdown']],
  },
  nitoryu: {
    id: 'nitoryu', name: '二刀流スター', kana: 'にとうりゅうすたー', short: '二刀', tier: 2, req: ['major_leaguer'], family: 'phys', color: '#c83a3a',
    desc: '投げても打っても世界一。「二刀流」で続けて動き、「リアル二刀流」で敵全体をなぎはらう、野球の頂点。',
    mods: { hp: 1.45, mp: 1.1, str: 1.55, def: 1.2, agi: 1.45, mag: 1.2, heal: 1.0 },
    weapons: ['bat', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'nt_nitoryu'], [3, 'nt_5050'], [5, 'nt_nemuri'], [7, 'nt_mvp'], [10, 'nt_real']],
  },

  // ───────────── 学校の 職業（小学生 → 中学生 → 高校生）。のびざかりで 職業レベルが 上がりやすい ─────────────
  schoolkid: {
    id: 'schoolkid', name: '小学生', kana: 'しょうがくせい', short: '小学', tier: 0, family: 'tech', color: '#f2c84e',
    desc: '元気いっぱいの小学生。すばしっこくて運がよく、のびざかりなので職業レベルが上がりやすい。ランドセルアタックやリコーダー、じゃんけんで戦う。',
    mods: { hp: 0.9, mp: 0.9, str: 0.9, def: 0.85, agi: 1.35, mag: 0.95, heal: 1.0 },
    weapons: ['sword', 'staff', 'boomerang', 'none'], shield: true, armor: ['cloth', 'gi'], helm: false,
    perLv: { hp: 1, agi: 0.4, str: 0.3 },
    passive: { train: 1.25 },
    learn: [
      [1, 'es_randoseru'], [2, 'es_aisatsu'], [3, 'es_recorder'], [4, 'es_kyushoku'], [5, 'es_kakekko'],
      [6, 'es_janken'], [7, 'es_odama'], [8, 'es_dodge'], [10, 'es_yume'],
    ],
  },
  middleschooler: {
    id: 'middleschooler', name: '中学生', kana: 'ちゅうがくせい', short: '中学', tier: 1, req: ['schoolkid'], family: 'tech', color: '#3a4a7a',
    desc: '部活にテストに大いそがしの中学生。特訓で強くなり、合唱コンクールで仲間をいやす。職業レベルが上がりやすい。',
    mods: { hp: 1.1, mp: 1.0, str: 1.15, def: 1.0, agi: 1.3, mag: 1.0, heal: 1.0 },
    weapons: ['sword', 'staff', 'bat', 'boomerang', 'none'], shield: true, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { str: 0.5, agi: 0.5 },
    passive: { train: 1.25 },
    learn: [[1, 'jh_bukatsu'], [2, 'jh_smash'], [3, 'jh_test'], [5, 'jh_hankou'], [7, 'jh_gassho'], [10, 'jh_zenkoku']],
  },
  highschooler: {
    id: 'highschooler', name: '高校生', kana: 'こうこうせい', short: '高校', tier: 2, req: ['middleschooler'], family: 'tech', color: '#4a7ad0',
    desc: '青春まっただ中の高校生。青春アタックで敵を打ちくだき、文化祭で仲間をもり上げる。何でもこなせる、学校の職業の頂点。',
    mods: { hp: 1.3, mp: 1.2, str: 1.35, def: 1.15, agi: 1.45, mag: 1.2, heal: 1.2 },
    weapons: ['sword', 'staff', 'bat', 'boomerang', 'none'], shield: true, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { hp: 1, str: 0.5, agi: 0.5, mag: 0.5 },
    passive: { train: 1.25 },
    learn: [[1, 'hs_seishun'], [3, 'hs_bunkasai'], [5, 'hs_shuugaku'], [7, 'hs_yuujou'], [10, 'hs_mirai']],
  },

  // ───────────── 公務員の 職業（地方公務員 → 国家公務員 → キャリア組）。町と 国を 守る ささえ役 ─────────────
  civil_local: {
    id: 'civil_local', name: '地方公務員', kana: 'ちほうこうむいん', short: '地方', tier: 0, family: 'tech', color: '#5a8a6a',
    desc: '町のために働く公務員。防災訓練で仲間を守り、窓口対応や通行止めで敵の動きを止める。体がじょうぶ。',
    mods: { hp: 1.15, mp: 1.0, str: 0.95, def: 1.2, agi: 0.9, mag: 0.85, heal: 1.05 },
    weapons: ['dagger', 'staff', 'spear', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { def: 0.5, heal: 0.5 },
    learn: [
      [1, 'lc_madoguchi'], [2, 'lc_bousai'], [3, 'lc_josetsu'], [4, 'lc_jumin'], [5, 'lc_tsuukou'],
      [6, 'lc_yurukyara'], [7, 'lc_takidashi'], [8, 'lc_shorui'], [9, 'lc_kouhou'], [10, 'lc_machiokoshi'],
    ],
  },
  civil_national: {
    id: 'civil_national', name: '国家公務員', kana: 'こっかこうむいん', short: '国家', tier: 1, req: ['civil_local'], family: 'tech', color: '#2a5a4a',
    desc: '国のために働く公務員。法律の力で敵の呪文をふうじ、予算会議で仲間のMPを回復する。ハンコの連打も得意。',
    mods: { hp: 1.2, mp: 1.1, str: 1.0, def: 1.3, agi: 0.95, mag: 1.05, heal: 1.15 },
    weapons: ['dagger', 'staff', 'spear', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { def: 1, mp: 0.5 },
    learn: [[1, 'nc_houritsu'], [2, 'nc_roppou'], [3, 'nc_yosan'], [5, 'nc_kisha'], [7, 'nc_hanko'], [10, 'nc_project']],
  },
  career: {
    id: 'career', name: 'キャリア組', kana: 'きゃりあぐみ', short: 'キャ', tier: 2, req: ['civil_national'], family: 'tech', color: '#1e2a3a',
    desc: '国を動かすエリート公務員。政策決定で仲間を強くし、危機管理でみんなを守る。最後は大改革で敵をふきとばす。',
    mods: { hp: 1.35, mp: 1.35, str: 1.15, def: 1.4, agi: 1.05, mag: 1.25, heal: 1.3 },
    weapons: ['dagger', 'staff', 'spear', 'sword', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { def: 1, mp: 0.5, heal: 0.5 },
    learn: [[1, 'cr_seisaku'], [2, 'cr_ronpa'], [3, 'cr_nemawashi'], [5, 'cr_kiki'], [7, 'cr_houkaisei'], [8, 'cr_hakusho'], [10, 'cr_daikaikaku']],
  },

  // ───────────── 町の みかた（地方公務員と 戦士・僧侶を マスターすると なれる） ─────────────
  police: {
    id: 'police', name: '警察官', kana: 'けいさつかん', short: '警察', tier: 1, req: ['civil_local', 'warrior'], family: 'phys', color: '#2a3a7a',
    desc: '町の平和を守るおまわりさん。「たいほだ！」で敵を動けなくし、職務質問で持ち物をあずかる。正義の一撃は強力。',
    mods: { hp: 1.3, mp: 0.7, str: 1.3, def: 1.3, agi: 1.1, mag: 0.55, heal: 0.75 },
    weapons: ['sword', 'staff', 'spear', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { def: 1, str: 0.5 },
    learn: [[1, 'po_taiho'], [2, 'po_keibou'], [3, 'po_shokumu'], [5, 'po_koutsuu'], [7, 'po_patocar'], [10, 'po_seigi']],
  },
  firefighter: {
    id: 'firefighter', name: '消防士', kana: 'しょうぼうし', short: '消防', tier: 1, req: ['civil_local', 'priest'], family: 'phys', color: '#c83a2a',
    desc: '火事と事故から町を守る。放水で炎の敵をけし、救急手当や救助で仲間を助ける。体がとてもじょうぶ。',
    mods: { hp: 1.4, mp: 0.85, str: 1.2, def: 1.25, agi: 0.95, mag: 0.6, heal: 1.2 },
    weapons: ['axe', 'spear', 'staff', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 1, heal: 0.5 },
    learn: [[1, 'ff_housui'], [3, 'ff_teate'], [5, 'ff_kyujo'], [7, 'ff_hinoyoujin'], [8, 'ff_hashigo'], [10, 'ff_issei']],
  },

  // ───────────── スーパースターの 先（体で なれる 職業が ちがう） ─────────────
  fruit_idol: {
    id: 'fruit_idol', name: 'フルーツジッパー', kana: 'ふるーつじっぱー', short: 'フル', tier: 2, req: ['superstar'], body: 1, family: 'magic', color: '#ff6aa8',
    desc: '女性だけがなれる、フルーツみたいにカラフルでかわいいアイドル。ミックスジュースでみんなをいやし、フルーツバスケットで敵を大さわぎさせる。',
    mods: { hp: 1.05, mp: 1.45, str: 0.85, def: 1.0, agi: 1.45, mag: 1.35, heal: 1.45 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 0.5, agi: 0.5, mp: 0.5 },
    versatile: true,
    learn: [[1, 'fz_juice'], [2, 'fz_cherry'], [3, 'fz_banana'], [5, 'fz_basket'], [7, 'fz_tropical'], [8, 'fz_pine'], [10, 'fz_meteor']],
  },
  storm_idol: {
    id: 'storm_idol', name: 'アラシ', kana: 'あらし', short: 'アラ', tier: 2, req: ['superstar'], body: 0, family: 'magic', color: '#3a8ad8',
    desc: '男性だけがなれる、嵐のようにかっこいいアイドル。旋風ステップで敵をきりさき、5人のハーモニーでみんなをいやす。',
    mods: { hp: 1.15, mp: 1.4, str: 1.1, def: 1.05, agi: 1.45, mag: 1.35, heal: 1.2 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, agi: 0.5, mp: 0.5 },
    versatile: true,
    learn: [[1, 'ar_senpu'], [2, 'ar_spin'], [3, 'ar_manazashi'], [5, 'ar_harmony'], [7, 'ar_stage'], [8, 'ar_inazuma'], [10, 'ar_live']],
  },

  // ───────────── 鉄道の 職業（鉄道員 → 運転士 → 京急の運転士） ─────────────
  train_driver: {
    id: 'train_driver', name: '運転士', kana: 'うんてんし', short: '運転', tier: 1, req: ['railman'], family: 'phys', color: '#3a5a9a',
    desc: '白い手ぶくろで電車を動かす運転士。警笛で敵をおどろかせ、連結した車両で体当たりする。安全運転で仲間も守る。',
    mods: { hp: 1.3, mp: 0.9, str: 1.25, def: 1.3, agi: 1.1, mag: 0.75, heal: 0.95 },
    weapons: ['fan', 'staff', 'spear', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 1, def: 0.5, str: 0.5 },
    learn: [[1, 'dv_kiteki'], [3, 'dv_anzen'], [5, 'dv_tsuuka'], [7, 'dv_renketsu'], [10, 'dv_saikou']],
  },
  keikyu_driver: {
    id: 'keikyu_driver', name: '京急の運転士', kana: 'けいきゅうのうんてんし', short: '京急', tier: 2, req: ['train_driver'], family: 'phys', color: '#d8202c',
    desc: '赤い電車を120キロで走らせる、京急の運転士。歌う電車の音で仲間をはげまし、がんじょうな先頭車でみんなを守る。鉄道の職業の頂点。',
    mods: { hp: 1.45, mp: 1.05, str: 1.45, def: 1.4, agi: 1.4, mag: 0.9, heal: 1.05 },
    weapons: ['fan', 'staff', 'spear', 'sword', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 1, str: 0.5, agi: 0.5, def: 0.5 },
    learn: [[1, 'kq_doremi'], [3, 'kq_120'], [5, 'kq_sentou'], [7, 'kq_daiya'], [8, 'kq_renketsu'], [10, 'kq_kaitoku']],
  },

  // ───────────── 料理の 職業（料理人 → パティシエ → 三ツ星シェフ）。攻撃も 回復も できる ─────────────
  cook: {
    id: 'cook', name: '料理人', kana: 'りょうりにん', short: '料理', tier: 0, family: 'tech', color: '#d8cfb8',
    desc: '料理のうでで仲間を元気にする。包丁さばきで切りつけ、強火で焼き、あったかいスープでじわじわ回復させる。',
    mods: { hp: 1.1, mp: 0.95, str: 1.05, def: 1.0, agi: 1.0, mag: 0.95, heal: 1.2 },
    weapons: ['dagger', 'axe', 'staff'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, heal: 0.5 },
    learn: [
      [1, 'ck_houchou'], [2, 'ck_soup'], [3, 'ck_tsuyobi'], [4, 'ck_spice'], [5, 'ck_stamina'],
      [6, 'ck_mijin'], [7, 'ck_tsumami'], [8, 'ck_flambe'], [10, 'ck_fullcourse'],
    ],
  },
  patissier: {
    id: 'patissier', name: 'パティシエ', kana: 'ぱてぃしえ', short: 'パテ', tier: 1, req: ['cook'], family: 'tech', color: '#f4a6c0',
    desc: 'あまいおかしの職人。ケーキで仲間をいやし、クリームやアメで敵をこまらせる。',
    mods: { hp: 1.05, mp: 1.2, str: 0.95, def: 1.0, agi: 1.2, mag: 1.15, heal: 1.35 },
    weapons: ['fan', 'dagger', 'staff'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 0.5, mp: 0.5 },
    learn: [[1, 'pa_cream'], [2, 'pa_candy'], [3, 'pa_cake'], [4, 'pa_fondue'], [5, 'pa_macaron'], [7, 'pa_sugar'], [8, 'pa_kaori'], [10, 'pa_wedding']],
  },
  star_chef: {
    id: 'star_chef', name: '三ツ星シェフ', kana: 'みつぼししぇふ', short: 'シェ', tier: 2, req: ['patissier'], family: 'tech', color: '#f2d06a',
    desc: '世界一の料理人。鉄人の包丁さばきと炎のフライパンで敵をたおし、三ツ星のフルコースで仲間を元気にする。料理の職業の頂点。',
    mods: { hp: 1.3, mp: 1.3, str: 1.3, def: 1.15, agi: 1.25, mag: 1.3, heal: 1.45 },
    weapons: ['dagger', 'axe', 'fan', 'staff'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, str: 0.5, heal: 0.5 },
    learn: [[1, 'sc_tetsujin'], [2, 'sc_ajimi'], [3, 'sc_honoo'], [5, 'sc_osusume'], [7, 'sc_fullcourse'], [10, 'sc_kyuukyoku']],
  },

  // ───────────── 仕事の 職業（アルバイト → 正社員 → たたき上げ社長）。戦いで 手に入る お金が ふえる ─────────────
  parttimer: {
    id: 'parttimer', name: 'アルバイト', kana: 'あるばいと', short: 'バイ', tier: 0, family: 'tech', color: '#3aa86a',
    desc: 'いろいろなお店で働くアルバイト。ダンボール運びやレジうちで敵と戦い、シフトの交代で仲間を助ける。戦いで手に入るお金が少しふえる。',
    mods: { hp: 1.05, mp: 0.85, str: 1.05, def: 1.0, agi: 1.15, mag: 0.85, heal: 0.95 },
    weapons: ['dagger', 'staff', 'none'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { hp: 1, agi: 0.5 },
    passive: { gold: 1.1 },
    learn: [
      [1, 'ab_danboru'], [2, 'ab_irasshai'], [3, 'ab_reji'], [4, 'ab_makanai'], [5, 'ab_shift'],
      [6, 'ab_shinadashi'], [7, 'ab_yakin'], [8, 'ab_tenchou'], [9, 'ab_kaikin'], [10, 'ab_nenmatsu'],
    ],
  },
  seishain: {
    id: 'seishain', name: '正社員', kana: 'せいしゃいん', short: '社員', tier: 1, req: ['parttimer'], family: 'tech', color: '#6a7a8a',
    desc: 'アルバイトから正社員になった、たよれる仕事人。有給休かでしっかり回復し、朝礼でチームをまとめる。戦いで手に入るお金がふえる。',
    mods: { hp: 1.25, mp: 1.0, str: 1.2, def: 1.2, agi: 1.1, mag: 0.95, heal: 1.05 },
    weapons: ['dagger', 'staff', 'sword', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, str: 0.5, def: 0.5 },
    passive: { gold: 1.2 },
    learn: [[1, 'se_shainsho'], [2, 'se_chourei'], [3, 'se_yukyu'], [5, 'se_project'], [7, 'se_fukuri'], [8, 'se_ookuchi'], [10, 'se_shusse']],
  },
  tatakiage: {
    id: 'tatakiage', name: 'たたき上げ社長', kana: 'たたきあげしゃちょう', short: 'たた', tier: 2, req: ['seishain'], family: 'tech', color: '#3a6a3a',
    desc: 'アルバイトから会社を作るまでのぼりつめた社長。現場できたえた体で先頭に立ち、どんなピンチでもふんばる。戦いで手に入るお金がとてもふえる。',
    mods: { hp: 1.45, mp: 1.15, str: 1.45, def: 1.35, agi: 1.2, mag: 1.05, heal: 1.15 },
    weapons: ['dagger', 'staff', 'sword', 'axe', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy', 'gi'], helm: true,
    perLv: { hp: 1, str: 1 },
    passive: { gold: 1.4 },
    learn: [[1, 'tk_genba'], [3, 'tk_konjou'], [5, 'tk_zensha'], [7, 'tk_satsutaba'], [8, 'tk_ryokou'], [10, 'tk_tatakiage']],
  },

  // ───────────── お笑いの 職業（旅芸人・遊び人 → お笑い芸人 → M-1王者）。笑いで 敵の 動きを 止める ─────────────
  comedian: {
    id: 'comedian', name: 'お笑い芸人', kana: 'おわらいげいにん', short: '芸人', tier: 1, req: ['performer'], reqAlt: [['jester']], family: 'tech', color: '#f2b83a',
    desc: 'みんなを笑わせるプロの芸人。ボケとツッコミで敵のペースをくずし、笑いで仲間を元気にする。旅芸人か遊び人をきわめるとなれる。',
    mods: { hp: 1.1, mp: 1.1, str: 1.0, def: 1.0, agi: 1.3, mag: 1.15, heal: 1.1 },
    weapons: ['fan', 'staff', 'whip', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { agi: 0.5, mp: 0.5 },
    versatile: true,
    learn: [[1, 'cm_tsukkomi'], [2, 'cm_boke'], [3, 'cm_gag'], [5, 'cm_conte'], [7, 'cm_warai'], [8, 'cm_monomane'], [10, 'cm_bakushou']],
  },
  m1_champion: {
    id: 'm1_champion', name: 'M-1王者', kana: 'えむわんおうじゃ', short: 'M1', tier: 2, req: ['comedian'], family: 'tech', color: '#e0b030',
    desc: '日本一のまんざい師。マシンガントークで敵をまくし立て、伝説のツッコミでどんな強がりもくずす。笑いの頂点。',
    mods: { hp: 1.25, mp: 1.3, str: 1.2, def: 1.15, agi: 1.45, mag: 1.35, heal: 1.25 },
    weapons: ['fan', 'staff', 'whip', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { agi: 0.5, mag: 0.5, mp: 0.5 },
    versatile: true,
    learn: [[1, 'm1_machinegun'], [3, 'm1_densetsu'], [5, 'm1_neta'], [7, 'm1_kansei'], [10, 'm1_yuushou']],
  },

  // ───────────── 大賢者（賢者を きわめた 者） ─────────────
  daikenja: {
    id: 'daikenja', name: '大賢者', kana: 'だいけんじゃ', short: '大賢', tier: 2, req: ['sage'], family: 'magic', color: '#4a4ab8',
    desc: '回復と攻撃の呪文をすべてきわめた、賢者の頂点。のこりのMPを全て解き放つ呪文「マダンテ」を使える、ただ一つの職業。',
    mods: { hp: 1.0, mp: 1.75, str: 0.75, def: 1.0, agi: 1.15, mag: 1.7, heal: 1.7 },
    weapons: ['staff', 'spear', 'dagger'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mp: 1, mag: 0.5, heal: 0.5 },
    learn: [[1, 'dz_mahyadedos'], [2, 'dz_ishi'], [3, 'dz_zaoriku'], [5, 'dz_iogurande'], [7, 'dz_behomazun'], [8, 'dz_satori'], [10, 'dz_madante']],
  },

  // ───────────── 伝説の 職業（勇者と、ほかの 超級職 2つを マスターすると なれる） ─────────────
  // reqSuper: req の ほかに、マスターしている 超級職の かず
  loto_hero: {
    id: 'loto_hero', name: 'ロトの勇者', kana: 'ろとのゆうしゃ', short: 'ロト', tier: 3, req: ['hero'], reqSuper: 2, family: 'phys', color: '#2a5ad8',
    desc: '伝説の勇者ロトの名をつぐ者。勇者と、ほかの2つの超級職をきわめた者だけがなれる。ミナデインやロトの剣技で、どんな闇も切りひらく。',
    mods: { hp: 1.55, mp: 1.35, str: 1.55, def: 1.45, agi: 1.35, mag: 1.45, heal: 1.45 },
    weapons: ['sword', 'spear', 'axe', 'staff', 'boomerang'], shield: true, armor: ['cloth', 'heavy', 'robe', 'gi'], helm: true,
    perLv: { hp: 2, str: 1, mag: 0.5, heal: 0.5 },
    versatile: true,
    learn: [[1, 'lt_ken'], [3, 'lt_shirushi'], [5, 'lt_inori'], [7, 'lt_gigacross'], [9, 'lt_kizuna'], [10, 'lt_minadein']],
  },

  // ───────────── 2026年10月（第21回）の 新しい 職業（技は abilities-jobs4.js） ─────────────
  // ニート → 中二病 → ダ天使
  neet: {
    id: 'neet', name: 'ニート', kana: 'にーと', short: 'ニート', tier: 0, family: 'tech', color: '#7a8aa0',
    desc: '家でゴロゴロしているのが大すき。まくら投げやネットの知識で戦う。何もしていないようで、職業レベルがとても上がりやすい。',
    mods: { hp: 0.95, mp: 1.0, str: 0.9, def: 0.9, agi: 0.9, mag: 1.0, heal: 0.95 },
    weapons: ['fan', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, mp: 0.5 },
    passive: { train: 1.5 },
    learn: [
      [1, 'ne_makura'], [2, 'ne_gorogoro'], [3, 'ne_potechi'], [4, 'ne_yofukashi'], [5, 'ne_honki'],
      [6, 'ne_guguru'], [7, 'ne_nidone'], [8, 'ne_jersey'], [10, 'ne_ippatsu'],
    ],
  },
  chuuni: {
    id: 'chuuni', name: '中二病', kana: 'ちゅうにびょう', short: '中二', tier: 1, req: ['neet'], family: 'magic', color: '#3a1a3a',
    desc: '自分には特別な力があると信じている。ふう印されし右手やしっ黒の炎（本人いわく）で戦う。思いこみの力で、本当に魔力が強い。',
    mods: { hp: 0.95, mp: 1.25, str: 1.05, def: 0.85, agi: 1.15, mag: 1.35, heal: 0.8 },
    weapons: ['sword', 'staff', 'fan'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.5 },
    learn: [[1, 'cu_migite'], [2, 'cu_jakigan'], [4, 'cu_kokuen'], [5, 'cu_note'], [6, 'cu_kurorekishi'], [8, 'cu_wagana'], [10, 'cu_judgment']],
  },
  datenshi: {
    id: 'datenshi', name: 'ダ天使', kana: 'だてんし', short: 'ダ天', tier: 2, req: ['chuuni'], family: 'magic', color: '#2a1a40',
    desc: '天から落ちた（と自分で言っている）天使。黒い羽根と闇の光で敵をうち、天使のほほえみで仲間をいやす。',
    mods: { hp: 1.05, mp: 1.4, str: 1.0, def: 1.0, agi: 1.3, mag: 1.6, heal: 1.25 },
    weapons: ['staff', 'sword', 'fan'], shield: false, armor: ['robe', 'cloth'], helm: false,
    perLv: { mag: 1, mp: 0.5 },
    learn: [[1, 'dt_hane'], [3, 'dt_hohoemi'], [5, 'dt_keiyaku'], [7, 'dt_ochita'], [8, 'dt_tsubasa'], [10, 'dt_darkangel']],
  },

  // サイヤ人 → スーパーサイヤ人 → スーパーサイヤ人2 → スーパーサイヤ人3（伝説の職業）
  saiyan: {
    id: 'saiyan', name: 'サイヤ人', kana: 'さいやじん', short: 'サイヤ', tier: 0, family: 'phys', color: '#2a3a8a',
    desc: '戦いが大すきな戦闘民族。気だんやかめはめ波で戦う。きたえるほど強くなり、いつか金色にかがやくという。',
    mods: { hp: 1.15, mp: 0.6, str: 1.25, def: 1.0, agi: 1.2, mag: 0.6, heal: 0.6 },
    weapons: ['claw', 'none'], shield: false, armor: ['gi', 'cloth'], helm: false,
    perLv: { str: 0.5, hp: 1 },
    learn: [
      [1, 'sy_kidan'], [2, 'sy_kiai'], [3, 'sy_renzoku'], [4, 'sy_taiyou'], [5, 'sy_kamehameha'],
      [6, 'sy_bukuu'], [7, 'sy_ozaru'], [8, 'sy_rush'], [10, 'sy_bigbang'],
    ],
  },
  super_saiyan: {
    id: 'super_saiyan', name: 'スーパーサイヤ人', kana: 'すーぱーさいやじん', short: 'SS', tier: 1, req: ['saiyan'], family: 'phys', color: '#e8c020',
    desc: 'サイヤ人がいかりで目ざめた、金色のすがた。かみがさか立ち、力も速さもはね上がる。',
    mods: { hp: 1.3, mp: 0.7, str: 1.45, def: 1.15, agi: 1.35, mag: 0.7, heal: 0.6 },
    weapons: ['claw', 'none'], shield: false, armor: ['gi', 'cloth'], helm: false,
    perLv: { str: 1, agi: 0.5 },
    learn: [[1, 'sz_kame'], [2, 'sz_aura'], [4, 'sz_kikouha'], [5, 'sz_zanzou'], [6, 'sz_ikari'], [8, 'sz_final'], [10, 'sz_renzoku']],
  },
  ss2: {
    id: 'ss2', name: 'スーパーサイヤ人2', kana: 'すーぱーさいやじんつー', short: 'SS2', tier: 2, req: ['super_saiyan'], family: 'phys', color: '#f0d040',
    desc: 'スーパーサイヤ人をこえたすがた。体のまわりを青いいなずまが走る。雷の力をまとった技で戦う。',
    mods: { hp: 1.4, mp: 0.8, str: 1.6, def: 1.25, agi: 1.5, mag: 0.75, heal: 0.65 },
    weapons: ['claw', 'none'], shield: false, armor: ['gi', 'cloth'], helm: false,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 's2_spark'], [3, 's2_kame'], [5, 's2_aura'], [7, 's2_rush'], [8, 's2_kiaihou'], [10, 's2_final']],
  },
  ss3: {
    id: 'ss3', name: 'スーパーサイヤ人3', kana: 'すーぱーさいやじんすりー', short: 'SS3', tier: 3, req: ['ss2'], reqSuper: 1, family: 'phys', color: '#f8e060',
    desc: '長い金色のかみの、最後のすがた。スーパーサイヤ人2と、ほかの超級職を1つきわめた者だけがなれる。元気玉や竜拳で、どんな敵も打ちたおす。',
    mods: { hp: 1.6, mp: 1.0, str: 1.85, def: 1.4, agi: 1.7, mag: 0.95, heal: 0.8 },
    weapons: ['claw', 'none'], shield: false, armor: ['gi', 'cloth'], helm: false,
    perLv: { str: 1.5, agi: 1, hp: 1 },
    learn: [[1, 's3_ryuuken'], [3, 's3_kame'], [5, 's3_aura'], [7, 's3_shunkan'], [8, 's3_rengeki'], [10, 's3_genki']],
  },

  // 会社員 → 設備屋 → ryonetsu
  setsubiya: {
    id: 'setsubiya', name: '設備屋', kana: 'せつびや', short: '設備', tier: 1, req: ['salaryman'], family: 'tech', color: '#5a7a9a',
    desc: '空調や配管を直すプロ。スパナで戦い、点検や配管修理で仲間を直す。エアコン全開で敵をこおらせることもできる。戦いで手に入るお金がふえる。',
    mods: { hp: 1.2, mp: 1.0, str: 1.2, def: 1.25, agi: 0.95, mag: 0.95, heal: 1.1 },
    weapons: ['axe', 'dagger', 'staff'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { def: 0.5, hp: 1 },
    passive: { gold: 1.2 },
    learn: [[1, 'sb_spanner'], [2, 'sb_tenken'], [4, 'sb_haikan'], [5, 'sb_aircon'], [6, 'sb_shiunten'], [8, 'sb_duct'], [10, 'sb_kouji']],
  },
  ryonetsu: {
    id: 'ryonetsu', name: 'ryonetsu', kana: 'りょうねつ', short: 'ryo', tier: 2, req: ['setsubiya'], family: 'tech', color: '#1a3a7a',
    desc: '空調と省エネのプロフェッショナル集団。古い空調を新しくし、かん気を改善し、建物のすべてを最適に動かす。守りも回復も攻撃もこなし、戦いで手に入るお金がとてもふえる。',
    mods: { hp: 1.3, mp: 1.3, str: 1.3, def: 1.35, agi: 1.15, mag: 1.3, heal: 1.3 },
    weapons: ['axe', 'dagger', 'staff'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { def: 0.5, hp: 1, mag: 0.5 },
    passive: { gold: 1.3 },
    versatile: true,
    learn: [[1, 'rn_koushin'], [3, 'rn_chiller'], [4, 'rn_kanki'], [5, 'rn_shoene'], [7, 'rn_netsugen'], [8, 'rn_yochou'], [10, 'rn_saiteki']],
  },

  // 海賊 → ゴム人間 → ニカ（伝説の職業）
  rubber: {
    id: 'rubber', name: 'ゴム人間', kana: 'ごむにんげん', short: 'ゴム', tier: 2, req: ['pirate'], family: 'phys', color: '#d83a2a',
    desc: '体がゴムのようにのびる海賊。のびるうででパンチをくり出し、ギア2で速く、ギア3で大きくなる。ゴムなので雷が効かない。',
    mods: { hp: 1.5, mp: 0.8, str: 1.55, def: 1.3, agi: 1.35, mag: 0.6, heal: 0.7 },
    weapons: ['none', 'claw'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { hp: 1.5, str: 1 },
    passive: { resist: { bolt: 0 } },
    learn: [[1, 'go_pistol'], [3, 'go_gatling'], [4, 'go_fusen'], [5, 'go_gear2'], [7, 'go_bazooka'], [10, 'go_gear3']],
  },
  nika: {
    id: 'nika', name: 'ニカ', kana: 'にか', short: 'ニカ', tier: 3, req: ['rubber'], reqSuper: 1, family: 'phys', color: '#f8f0e0',
    desc: '太陽の神ニカの力が目ざめた、ゴム人間の最後のすがた。ゴム人間と、ほかの超級職を1つきわめた者だけがなれる。何でも自由自在、雷もつかんで投げる。',
    mods: { hp: 1.65, mp: 1.1, str: 1.7, def: 1.4, agi: 1.6, mag: 1.0, heal: 1.1 },
    weapons: ['none', 'claw'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { hp: 1.5, str: 1, agi: 0.5 },
    passive: { resist: { bolt: 0 } },
    learn: [[1, 'nk_gear5'], [3, 'nk_drum'], [5, 'nk_kaminari'], [7, 'nk_taiyou'], [8, 'nk_warai'], [10, 'nk_kaihou']],
  },

  // ユーチューバー → 人気配信者
  youtuber: {
    id: 'youtuber', name: 'ユーチューバー', kana: 'ゆーちゅーばー', short: 'ユーチ', tier: 0, family: 'tech', color: '#e83a3a',
    desc: '動画で人気者をめざす。自どり棒で戦い、生配信のおうえんや、つりサムネ、炎上（！）で戦いをもり上げる。戦いで手に入るお金が少しふえる。',
    mods: { hp: 0.95, mp: 1.1, str: 0.95, def: 0.9, agi: 1.1, mag: 1.05, heal: 1.0 },
    weapons: ['staff', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mp: 0.5, agi: 0.3 },
    passive: { gold: 1.1 },
    learn: [
      [1, 'yt_jidori'], [2, 'yt_live'], [3, 'yt_samune'], [4, 'yt_kirinuki'], [5, 'yt_superchat'],
      [6, 'yt_enjou'], [7, 'yt_kikaku'], [8, 'yt_touroku'], [10, 'yt_hyakuman'],
    ],
  },
  streamer: {
    id: 'streamer', name: '人気配信者', kana: 'にんきはいしんしゃ', short: '配信', tier: 1, req: ['youtuber'], family: 'tech', color: '#c040c0',
    desc: '登録者100万人の人気配信者。コラボ配信で仲間を強くし、投げせんの雨や大炎上で敵をたおす。戦いで手に入るお金がふえる。',
    mods: { hp: 1.05, mp: 1.3, str: 1.0, def: 1.0, agi: 1.2, mag: 1.25, heal: 1.1 },
    weapons: ['staff', 'fan', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mp: 0.5, mag: 0.5 },
    passive: { gold: 1.2 },
    learn: [[1, 'st_collab'], [2, 'st_dokkiri'], [4, 'st_daienjou'], [5, 'st_kinen'], [6, 'st_kamikai'], [8, 'st_nagesen'], [10, 'st_doujisetsuzoku']],
  },

  // ゲーマー → プロゲーマー
  gamer: {
    id: 'gamer', name: 'ゲーマー', kana: 'げーまー', short: 'ゲーム', tier: 0, family: 'tech', color: '#3ac080',
    desc: 'ゲームが大すき。ボタン連打やバグ技で戦い、ハメ技で敵を動けなくする。素早さと反射神経は、だれにも負けない。',
    mods: { hp: 0.9, mp: 1.05, str: 1.0, def: 0.85, agi: 1.25, mag: 1.0, heal: 0.9 },
    weapons: ['boomerang', 'dagger', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { agi: 0.5, mp: 0.3 },
    learn: [
      [1, 'ga_renda'], [2, 'ga_save'], [3, 'ga_bug'], [4, 'ga_kakin'], [5, 'ga_controller'],
      [6, 'ga_tetsuya'], [7, 'ga_hame'], [8, 'ga_combo'], [10, 'ga_lastboss'],
    ],
  },
  pro_gamer: {
    id: 'pro_gamer', name: 'プロゲーマー', kana: 'ぷろげーまー', short: 'プロ', tier: 1, req: ['gamer'], family: 'tech', color: '#202830',
    desc: '世界大会で戦うプロのゲーマー。1フレームの見切りで攻撃をよけ、神プレイで大ダメージをあたえる。',
    mods: { hp: 1.0, mp: 1.1, str: 1.15, def: 0.95, agi: 1.5, mag: 1.05, heal: 0.95 },
    weapons: ['boomerang', 'dagger', 'axe', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { agi: 1, str: 0.5 },
    learn: [[1, 'pg_frame'], [2, 'pg_keyboard'], [4, 'pg_nyuuryoku'], [5, 'pg_meta'], [6, 'pg_kamiplay'], [8, 'pg_team'], [10, 'pg_yuushou']],
  },

  // 魔王（伝説の職業。勇者と ダ天使、光と やみの 両方を きわめた 者）
  maou: {
    id: 'maou', name: '魔王', kana: 'まおう', short: '魔王', tier: 3, req: ['hero', 'datenshi'], family: 'magic', color: '#4a1a5a',
    desc: '世界をやみにつつむ、すべての魔物の王。勇者とダ天使をきわめた者だけがなれる。暗黒の炎と破滅の光で、すべてをほろぼす。',
    mods: { hp: 1.6, mp: 1.4, str: 1.5, def: 1.45, agi: 1.25, mag: 1.65, heal: 1.0 },
    weapons: ['sword', 'staff', 'axe', 'claw'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { hp: 2, mag: 1, str: 0.5 },
    learn: [[1, 'mo_kokuen'], [3, 'mo_hadou'], [5, 'mo_tsume'], [7, 'mo_iatsu'], [8, 'mo_koromo'], [10, 'mo_hametsu']],
  },

  // ───────────── 2026年10月（第22回）の 新しい 職業（技は abilities-jobs5.js） ─────────────
  // おかん → 最強のおかん
  okan: {
    id: 'okan', name: 'おかん', kana: 'おかん', short: 'おかん', tier: 0, family: 'tech', color: '#e87aa0',
    desc: 'みんなのおかん。おたまやスリッパで戦い、ごはんで仲間を元気にする。「早くねなさい！」で敵もねむらせる。',
    mods: { hp: 1.05, mp: 1.0, str: 1.0, def: 1.0, agi: 0.95, mag: 0.9, heal: 1.15 },
    weapons: ['staff', 'axe', 'fan', 'none'], shield: true, armor: ['cloth', 'robe'], helm: true,
    perLv: { hp: 1, heal: 0.5 },
    learn: [
      [1, 'ok_otama'], [2, 'ok_gohan'], [3, 'ok_nenasai'], [4, 'ok_negiri'], [5, 'ok_slipper'],
      [6, 'ok_bentou'], [7, 'ok_katazuke'], [8, 'ok_ame'], [10, 'ok_ikari'],
    ],
  },
  saikyo_okan: {
    id: 'saikyo_okan', name: '最強のおかん', kana: 'さいきょうのおかん', short: '最強', tier: 1, req: ['okan'], family: 'tech', color: '#c8a020',
    desc: 'だれも勝てない、最強のおかん。おかんの雷とスリッパで敵をたおし、おかわり自由のごはんとおかんの愛で、仲間を守りぬく。',
    mods: { hp: 1.2, mp: 1.05, str: 1.1, def: 1.1, agi: 1.0, mag: 1.0, heal: 1.35 },
    weapons: ['staff', 'axe', 'fan', 'none'], shield: true, armor: ['cloth', 'robe'], helm: true,
    perLv: { hp: 1, heal: 1 },
    learn: [[1, 'so_kaminari'], [2, 'so_okawari'], [4, 'so_osouji'], [5, 'so_slipper'], [6, 'so_ai'], [8, 'so_kaji'], [10, 'so_binta']],
  },

  // 会社員 → 社ちく → ブラックきぎょうの星（HPが 少ないほど 強い）
  shachiku: {
    id: 'shachiku', name: '社ちく', kana: 'しゃちく', short: '社ちく', tier: 1, req: ['salaryman'], family: 'tech', color: '#5a5a6a',
    desc: '会社のために、毎日おそくまで働く。つかれればつかれるほど力が出て、HPが少ないほど攻撃が強くなる。サービス残業で、すぐにもう一度行動できる。',
    mods: { hp: 1.3, mp: 0.85, str: 1.2, def: 1.15, agi: 1.0, mag: 0.8, heal: 0.9 },
    weapons: ['dagger', 'staff', 'fan', 'axe', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1.5, str: 0.5 },
    passive: { grit: 0.5 },
    learn: [[1, 'sk_tsukin'], [2, 'sk_zangyou'], [4, 'sk_eiyou'], [5, 'sk_kaigi'], [6, 'sk_iji'], [8, 'sk_pekopeko'], [10, 'sk_shuuden']],
  },
  black_star: {
    id: 'black_star', name: 'ブラックきぎょうの星', kana: 'ぶらっくきぎょうのほし', short: 'ブラ星', tier: 2, req: ['shachiku'], family: 'tech', color: '#3a1a1a',
    desc: '休みの日も会社にとまりこむ、社ちくの中の社ちく。HPが少ないほど、攻撃がとても強くなる。ネクタイのはちまきがトレードマーク。',
    mods: { hp: 1.5, mp: 0.95, str: 1.45, def: 1.3, agi: 1.15, mag: 0.85, heal: 1.0 },
    weapons: ['dagger', 'staff', 'fan', 'axe', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: false,
    perLv: { hp: 2, str: 1 },
    passive: { grit: 0.8 },
    learn: [[1, 'bk_kyujitsu'], [3, 'bk_tomari'], [5, 'bk_norma'], [7, 'bk_24h'], [8, 'bk_ichigan'], [10, 'bk_star']],
  },

  // 天才しせつ管理者（伝説の職業。ryonetsu と、ほかの 超級職を 1つ きわめた 者）
  facility_genius: {
    id: 'facility_genius', name: '天才しせつ管理者', kana: 'てんさいしせつかんりしゃ', short: '天才', tier: 3, req: ['ryonetsu'], reqSuper: 1, family: 'tech', color: '#20a8c8',
    desc: '建物のすべてを見守る、天才のしせつ管理者。ryonetsuと、ほかの超級職を1つきわめた者だけがなれる。敵の大技の予兆を見ぬいて、仲間みんなが受けるダメージを小さくする。戦いで手に入るお金もとてもふえる。',
    mods: { hp: 1.45, mp: 1.45, str: 1.25, def: 1.4, agi: 1.2, mag: 1.45, heal: 1.5 },
    weapons: ['axe', 'dagger', 'staff'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { hp: 1.5, mag: 1, heal: 1 },
    passive: { foresee: 0.6, gold: 1.3 },
    versatile: true,
    learn: [[1, 'fg_mieruka'], [3, 'fg_yochou'], [5, 'fg_kuuchou'], [7, 'fg_demand'], [8, 'fg_hirameki'], [10, 'fg_saiteki']],
  },

  // はかい神（伝説の職業。魔王と ゴッドハンドを きわめた 者）
  hakaishin: {
    id: 'hakaishin', name: 'はかい神', kana: 'はかいしん', short: 'はかい', tier: 3, req: ['maou', 'god_hand'], family: 'phys', color: '#6a2a8a',
    desc: 'すべてをはかいする神。魔王とゴッドハンドをきわめた者だけがなれる。「はかい」で敵を消し去り、はかい玉で何もかもふきとばす。気まぐれで、よく昼ねをする。',
    mods: { hp: 1.7, mp: 1.25, str: 1.95, def: 1.45, agi: 1.55, mag: 1.45, heal: 0.85 },
    weapons: ['none', 'claw', 'axe'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { hp: 2, str: 1.5, agi: 0.5 },
    learn: [[1, 'hk_hakai'], [3, 'hk_kimagure'], [5, 'hk_hirune'], [7, 'hk_kami'], [8, 'hk_ikari'], [10, 'hk_hakaidama']],
  },
};

// はじめに えらべる 職業（基本職）
export const JOB_ORDER = ['warrior', 'monk', 'priest', 'mage', 'performer', 'jester', 'salaryman', 'idol', 'railman', 'ballplayer',
  'schoolkid', 'civil_local', 'cook', 'parttimer', 'neet', 'saiyan', 'youtuber', 'gamer', 'okan'];
export const ADVANCED_ORDER = ['battlemaster', 'paladin', 'magic_knight', 'pirate', 'holyfist', 'ninja', 'tamer', 'sage', 'superstar', 'fortune',
  'samurai', 'bucho', 'major_leaguer', 'middleschooler', 'civil_national', 'police', 'firefighter', 'train_driver',
  'patissier', 'seishain', 'comedian', 'chuuni', 'super_saiyan', 'setsubiya', 'streamer', 'pro_gamer', 'saikyo_okan', 'shachiku'];
export const SUPER_ORDER = ['dragon_knight', 'archmage', 'high_priest', 'god_hand', 'summoner', 'magic_swordsman', 'guardian', 'hero', 'monster_master', 'star_diva',
  'sword_master', 'shogun', 'shacho', 'nitoryu', 'highschooler', 'career', 'fruit_idol', 'storm_idol', 'keikyu_driver',
  'star_chef', 'tatakiage', 'm1_champion', 'daikenja', 'datenshi', 'ss2', 'ryonetsu', 'rubber', 'black_star'];
// 伝説の 職業（超級職の 先）
export const LEGEND_ORDER = ['loto_hero', 'ss3', 'nika', 'maou', 'facility_genius', 'hakaishin'];
export const ALL_JOBS = [...JOB_ORDER, ...ADVANCED_ORDER, ...SUPER_ORDER, ...LEGEND_ORDER];
export const TIER_NAMES = ['基本職', '上級職', '超級職', '伝説の職業'];
// 神殿で ならべる じゅん（ランクごと）
export const TIER_ORDERS = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];

// 職業レベルに ひつような たたかいの かず（るいけい。上級・超級は すこし おおい）
const BATTLES = [0, 3, 7, 13, 21, 31, 43, 58, 76, 98];
const TIER_MULT = [1, 1.4, 1.8, 2.2];
// 職業レベルの 上がりにくさ（1.4 … はじめの 版の 1.4倍 たたかう ひつようが ある）。上がった レベルは そのまま
export const JOB_RATE = 1.4;
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
  const sup = JOBS[id]?.reqSuper ? `＋ほかの超級職${JOBS[id].reqSuper}つLv${JOB_MAX_LEVEL}` : '';
  return jobReqSets(id).map((set) => set.map((r) => `${name(r)}Lv${JOB_MAX_LEVEL}`).join('＋') + sup).join(' または ');
}

// ロトの勇者の じょうけんの のこり: req の ほかに マスターしている 超級職の かず（jobs … char.jobs）
export function superMasteredCount(jobs, id) {
  const req = new Set(JOBS[id]?.req || []);
  return SUPER_ORDER.filter((j) => !req.has(j) && (jobs?.[j]?.lv || 0) >= JOB_MAX_LEVEL).length;
}

// 体で なれるか（フルーツジッパーは 女性だけ、アラシは 男性だけ）
// look.body が ない・ふつうで ない 人は 男性 あつかい（えも 男性で かく。looks.js の lookIds と おなじ）
export const BODY_NAMES = ['男性', '女性'];
export function jobBodyOk(id, look) {
  const need = JOBS[id]?.body;
  if (need === undefined) return true;
  return (look?.body === 1 ? 1 : 0) === need;
}

// 神殿の うわさ（まだ ひみつの 超級職。もとの 職業を はじめた 人に だけ、名前を ださずに 聞こえる）
export const JOB_HINTS = {
  dragon_knight: '剣と呪文、両方をきわめた戦士には、伝説の竜の力が目ざめるらしい…',
  archmage: '呪文と魔法の剣をきわめた者だけが、消滅の呪文を使えるらしい…',
  high_priest: '回復の呪文と聖なる守りをきわめた者は、神に選ばれるらしい…',
  god_hand: '戦いの達人が聖なるこぶしもきわめると、神のこぶしを手にするらしい…',
  summoner: 'タロットと呪文をきわめた者は、天地のせいれいを呼べるらしい…',
  magic_swordsman: '魔法の剣と忍びのわざをきわめると、闇の剣が使えるらしい…',
  guardian: '聖なる騎士と海の男、2つの道をきわめると、守りの頂点に立てるらしい…',
  hero: '3つの上級職をきわめた者だけが、本当の勇者になれるらしい…',
  monster_master: '魔物と心を通わせ、呪文もきわめた者は、魔物の王になれるらしい…',
  star_diva: 'スターのかがやきと占いの力を合わせると、星の歌が歌えるらしい…',
  sword_master: 'たくさんの剣の道をきわめた者は、剣聖とよばれるらしい…',
  shogun: 'サムライと忍びをしたがえる者は、天下人になれるらしい…',
  shacho: '部長をきわめると、ついに会社のトップになれるらしい…',
  nitoryu: '海の向こうで大活やくした選手は、投げても打っても世界一になれるらしい…',
  highschooler: '中学生をきわめると、青春いっぱいの高校に進めるらしい…',
  career: '国家公務員をきわめたエリートは、国を動かす仕事につけるらしい…',
  fruit_idol: 'スーパースターをきわめた女性は、フルーツのようにカラフルなアイドルになれるらしい…',
  storm_idol: 'スーパースターをきわめた男性は、嵐のようにかっこいいアイドルになれるらしい…',
  keikyu_driver: '運転士をきわめると、赤い電車を120キロで走らせる運転士になれるらしい…',
  star_chef: 'パティシエをきわめた料理人は、世界一のシェフとよばれるらしい…',
  tatakiage: '正社員をきわめた人は、自分の会社を作れるらしい…',
  m1_champion: 'お笑い芸人をきわめた人は、日本一のまんざい師になれるらしい…',
  daikenja: '賢者をきわめた者は、さらにその先の、大いなる賢者になれるらしい…',
  loto_hero: '勇者と、ほかの2つの超級職をきわめた者は、伝説の勇者の名をつげるらしい…',
  datenshi: '中二病をきわめると、天から落ちた天使になれるらしい…',
  ss2: 'スーパーサイヤ人をきわめると、いなずまをまとった、さらに上のすがたになれるらしい…',
  ryonetsu: '設備屋をきわめると、空調と省エネのプロフェッショナル集団の一員になれるらしい…',
  rubber: '海賊をきわめた者が、ふしぎな実を食べると、体がゴムのようにのびるらしい…',
  ss3: 'スーパーサイヤ人2と、ほかの超級職を1つきわめた者は、長い金色のかみのすがたになれるらしい…',
  nika: 'ゴム人間と、ほかの超級職を1つきわめた者には、太陽の神の力が目ざめるらしい…',
  maou: '勇者とダ天使、光とやみの両方をきわめた者は、すべての魔物の王になるらしい…',
  black_star: '社ちくをきわめた者は、休みの日も会社にいる、伝説の社員になれるらしい…',
  facility_genius: 'ryonetsuと、ほかの超級職を1つきわめた者は、建物のすべてを見守る天才になれるらしい…',
  hakaishin: '魔王とゴッドハンドをきわめた者は、すべてをはかいする神になれるらしい…',
};
