// ひらめき（1人で 新しい 技を 思いつく）
//
// ・技を 使うたびに、その 技の「使った 回数」が ふえる（ふつうの 攻撃は '@atk'）
// ・HIRAMEKI の from に ある 回数を ぜんぶ こえると、その 技を 使った しゅんかんに ひらめく ことが ある
//   （ひらめいた 技が そのまま 出る。サガ風）。こえた 回数が 多いほど ひらめきやすい
// ・ひらめける のは、その 技を 使える 職業の とき だけ
//   - 掛け合わせ技（kind: 'combo'）… もとの 職業を 合わせ持つ 上級職から（stats.js の comboAllowed）
//   - 職業の ひらめき技（job つき）… その 職業か、その 職業から 進んだ 職業
// ・一度 ひらめいた 技は ずっと 使える（char.hirameki に のこる）
// ・第20〜22回の 職業の ひらめき技は hirameki-jobs.js（下で いっしょに する）
import { HIRA_JOB_ABILITIES, HIRAMEKI_JOBS } from './hirameki-jobs.js';

// ひらめきで 覚える 新しい 技（基本職ごとに 2つ）
export const HIRA_ABILITIES = {
  // ───────────── 戦士 ─────────────
  hk_daichi_ikari: {
    name: '大地のいかり', kana: 'だいちのいかり', kind: 'skill', job: 'warrior', mp: 6, target: 'group', weapon: 'blade', hirameki: true,
    effect: { type: 'phys', mult: 1.2, ignoreDef: 0.25 },
    desc: '大地斬をきわめた先の一撃。地面ごと、同じ種類の敵をまとめて打ち上げる。',
    cast: '{a}は剣を大地にたたきつけた！', anim: 'rock_smash',
  },
  hk_midaregiri: {
    name: 'みだれ斬り', kana: 'みだれぎり', kind: 'skill', job: 'warrior', mp: 5, target: 'enemies', weapon: 'blade', hirameki: true,
    effect: { type: 'phys', mult: 0.75, hits: 4, random: true },
    desc: '目にもとまらぬ速さで、4回、敵にランダムに斬りかかる。',
    cast: '{a}のみだれ斬り！', anim: 'slash_multi',
  },
  // ───────────── 武闘家 ─────────────
  hk_sandan: {
    name: '三段づき', kana: 'さんだんづき', kind: 'skill', job: 'monk', mp: 4, target: 'enemy', weapon: 'fist', hirameki: true,
    effect: { type: 'phys', mult: 0.7, hits: 3, critBonus: 0.1 },
    desc: 'せいけんづきを3回続けて打ちこむ。会心が出やすい。',
    cast: '{a}の三段づき！', anim: 'punch_multi',
  },
  hk_senpuukyaku: {
    name: '旋風きゃく', kana: 'せんぷうきゃく', kind: 'skill', job: 'monk', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'phys', element: 'wind', mult: 1.1 },
    desc: '風をまとった回しげり。敵全体を風の力でけりとばす。',
    cast: '{a}は風をまとってまわった！', anim: 'wind2',
  },
  // ───────────── 僧侶 ─────────────
  hk_iyashi_kaze: {
    name: 'いやしの風', kana: 'いやしのかぜ', kind: 'spell', job: 'priest', mp: 7, target: 'allies', field: true, hirameki: true,
    effect: { type: 'heal', base: [26, 36], thr: 20 },
    desc: 'やさしい風に回復の力を乗せて、仲間全員のHPを回復する。',
    cast: '{a}のまわりを、いやしの風がふきぬけた！', anim: 'heal_dance',
  },
  hk_holy_light: {
    name: '聖なる光', kana: 'せいなるひかり', kind: 'spell', job: 'priest', mp: 6, target: 'group', hirameki: true,
    effect: { type: 'magic', element: 'light', base: [20, 28], thr: 20 },
    desc: '神の光で、同じ種類の敵をつつみこむ。光に弱い敵によく効く。',
    cast: '{a}の手から、聖なる光があふれ出した！', anim: 'holy',
  },
  // ───────────── 魔法使い ─────────────
  hk_triple_mera: {
    name: 'トリプルメラ', kana: 'とりぷるめら', kind: 'spell', job: 'mage', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'magic', element: 'fire', base: [11, 15], thr: 16 },
    desc: '3つのメラをいっぺんに放つ。敵全体に火の玉が飛んでいく。',
    cast: '{a}は3つのメラをいっぺんに放った！', anim: 'fire1',
  },
  hk_koori_ya: {
    name: '氷の矢', kana: 'こおりのや', kind: 'spell', job: 'mage', mp: 5, target: 'enemy', hirameki: true,
    effect: { type: 'magic', element: 'ice', base: [30, 40], thr: 20, status: { status: 'paralyze', chance: 0.15, turns: [1, 2], quiet: true } },
    desc: 'するどい氷の矢で1体をつらぬく。こおりついて動けなくなることがある。',
    cast: '{a}は氷の矢を放った！', anim: 'ice_arrow',
  },
  // ───────────── 旅芸人 ─────────────
  hk_happy_step: {
    name: 'ハッピーステップ', kana: 'はっぴーすてっぷ', kind: 'skill', job: 'performer', mp: 6, target: 'allies', hirameki: true,
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.15, dur: 25 },
    desc: '楽しいステップで、仲間全員の攻撃力と素早さが上がる。',
    cast: '{a}はハッピーステップをふんだ！', anim: 'dance',
  },
  hk_knife_rain: {
    name: 'ナイフの雨', kana: 'ないふのあめ', kind: 'skill', job: 'performer', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.5, hits: 5, random: true },
    desc: 'ナイフを空高く投げ上げて、雨のようにふらせる。5回、敵にランダムで当たる。',
    cast: '{a}はナイフを空高く投げ上げた！', anim: 'shuriken',
  },
  // ───────────── 遊び人 ─────────────
  hk_daibakushou: {
    name: '大ばくしょう', kana: 'だいばくしょう', kind: 'skill', job: 'jester', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'atbSet', value: 0, msg: '{t}は笑いが止まらない！' },
    desc: 'とっておきのギャグで、敵全体を大わらいさせる。敵全体の行動がおくれる。',
    cast: '{a}の、とっておきのギャグ！', anim: 'laugh',
  },
  hk_darts_master: {
    name: 'ダーツの名人', kana: 'だーつのめいじん', kind: 'skill', job: 'jester', mp: 7, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.75, hits: 5, random: true, critBonus: 0.25 },
    desc: 'ねらいすましたダーツを5本。会心がとても出やすい。',
    cast: '{a}はダーツをかまえた…ビシッ！', anim: 'shuriken',
  },
  // ───────────── 会社員 ─────────────
  hk_meishi_shuriken: {
    name: 'めいし手裏剣', kana: 'めいししゅりけん', kind: 'skill', job: 'salaryman', mp: 4, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.85 },
    desc: 'めいしを手裏剣のように投げる。敵全体に当たる。',
    cast: '{a}はめいしを投げつけた！', anim: 'cards',
  },
  hk_team_coffee: {
    name: 'みんなでコーヒー', kana: 'みんなでこーひー', kind: 'skill', job: 'salaryman', mp: 0, target: 'allies', hirameki: true,
    effect: { type: 'mpHeal', base: [4, 9] },
    desc: 'みんなでほっと一息。仲間全員のMPが少し回復する。',
    cast: '{a}はみんなにコーヒーを配った！', anim: 'heal1',
  },
  // ───────────── アイドル ─────────────
  hk_love_beam: {
    name: 'ラブリービーム', kana: 'らぶりーびーむ', kind: 'spell', job: 'idol', mp: 6, target: 'enemy', hirameki: true,
    effect: { type: 'magic', element: 'light', base: [26, 36], thr: 18, status: { status: 'confuse', chance: 0.3, turns: [1, 2], quiet: true } },
    desc: 'ハートのビームで1体をうちぬく。メロメロになって混乱することがある。',
    cast: '{a}のラブリービーム！', anim: 'hearts',
  },
  hk_fan_cheer: {
    name: 'ファンの大声えん', kana: 'ふぁんのだいせいえん', kind: 'skill', job: 'idol', mp: 7, target: 'allies', field: true, hirameki: true,
    effect: { type: 'heal', base: [22, 30], thr: 18 },
    desc: 'ファンの声えんがとどいた！仲間全員のHPを回復する。',
    cast: 'どこからか、ファンの大声えんが聞こえてきた！', anim: 'heal_dance',
  },
  // ───────────── 鉄道員 ─────────────
  hk_yoshi: {
    name: '安全確認ヨシ！', kana: 'あんぜんかくにんよし', kind: 'skill', job: 'railman', mp: 4, target: 'allies', hirameki: true,
    effect: { type: 'buff', stats: ['def', 'eva'], mult: 1.2, add: 0.1, dur: 30 },
    desc: 'みんなで安全を確認！仲間全員の身の守りと、身のかわしやすさが上がる。',
    cast: '「前よし！後ろよし！安全確認ヨシ！」', anim: 'buff',
  },
  hk_tokkyu: {
    name: '特急列車', kana: 'とっきゅうれっしゃ', kind: 'skill', job: 'railman', mp: 7, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 2.0, ignoreDef: 0.2, atbAfter: 70 },
    desc: '特急列車のような、ものすごい体当たり。打ったあと、すぐに次の順番が来る。',
    cast: '{a}は特急列車のように走り出した！', anim: 'train',
  },
  // ───────────── プロ野球選手 ─────────────
  hk_nagashi: {
    name: '流し打ち', kana: 'ながしうち', kind: 'skill', job: 'ballplayer', mp: 4, target: 'group', hirameki: true,
    effect: { type: 'phys', mult: 1.25 },
    desc: '球に逆らわずに打ち返す、うまい一打。同じ種類の敵をまとめて打つ。',
    cast: '{a}の流し打ち！', anim: 'bat_swing',
  },
  hk_makyuu: {
    name: '魔球', kana: 'まきゅう', kind: 'skill', job: 'ballplayer', mp: 6, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 2.2, acc: 1.1, critBonus: 0.15 },
    desc: 'だれにも打てない、ゆれながら飛ぶ球。とても大きなダメージ。',
    cast: '{a}は魔球を投げた！', anim: 'ball',
  },
  // ───────────── 小学生 ─────────────
  hk_randoseru_rocket: {
    name: 'ランドセルロケット', kana: 'らんどせるろけっと', kind: 'skill', job: 'schoolkid', mp: 5, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 2.0, atbAfter: 50 },
    desc: 'ランドセルをせおって、ロケットのように飛んでいく。敵1体に大きなダメージ。打ったあと、早めに次の順番が来る。',
    cast: '{a}はランドセルロケットで飛んでいった！', anim: 'tackle',
  },
  hk_radio_taiso: {
    name: 'ラジオ体操', kana: 'らじおたいそう', kind: 'skill', job: 'schoolkid', mp: 5, target: 'allies', hirameki: true,
    effect: { type: 'buff', stats: ['def', 'agi'], mult: 1.2, dur: 30 },
    desc: 'みんなでラジオ体操！仲間全員の守備力と素早さが上がる。',
    cast: '「いち、に、さん、し！」{a}たちはラジオ体操をした！', anim: 'buff',
  },
  // ───────────── 地方公務員 ─────────────
  hk_yukigassen: {
    name: '雪合戦', kana: 'ゆきがっせん', kind: 'skill', job: 'civil_local', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.6, hits: 5, random: true, element: 'ice' },
    desc: '集めた雪で、雪合戦！5回、敵にランダムで氷のダメージ。',
    cast: '{a}は雪玉を次から次へと投げた！', anim: 'ice1',
  },
  hk_kairanban: {
    name: '回覧板', kana: 'かいらんばん', kind: 'skill', job: 'civil_local', mp: 4, target: 'allies', hirameki: true,
    effect: { type: 'cure', statuses: ['poison', 'sleep', 'confuse', 'paralyze'] },
    desc: '大事なお知らせを回覧板で回す。仲間全員の毒・ねむり・混乱・マヒを治す。',
    cast: '{a}は回覧板を回した！「みなさん、気をつけて！」', anim: 'heal1',
  },
  // 第20〜22回の 職業の ひらめき技（hirameki-jobs.js）
  ...HIRA_JOB_ABILITIES,
};

// ひらめきの じょうけん（技 → 使った 回数）。'@atk' は ふつうの 攻撃
export const HIRAMEKI = {
  // 基本職の ひらめき技
  hk_daichi_ikari: { from: { daichi: 20, chikaratame: 6 } },
  hk_midaregiri: { from: { '@atk': 60, kaiha: 10 } },
  hk_sandan: { from: { seiken: 20 } },
  hk_senpuukyaku: { from: { mawashigeri: 12, kamaitachi: 10 } },
  hk_iyashi_kaze: { from: { hoimi: 25, bagi: 10 } },
  hk_holy_light: { from: { bagi: 15, sukara: 8 } },
  hk_triple_mera: { from: { mera: 30 } },
  hk_koori_ya: { from: { hyado: 20, rukani: 5 } },
  hk_happy_step: { from: { hustle: 20, piorimu: 8 } },
  hk_knife_rain: { from: { juggling: 15, '@atk': 30 } },
  hk_daibakushou: { from: { js_gag: 15 } },
  hk_darts_master: { from: { js_darts: 15, js_lucky: 8 } },
  hk_meishi_shuriken: { from: { sm_meishi: 20 } },
  hk_team_coffee: { from: { sm_coffee: 12, sm_horenso: 8 } },
  hk_love_beam: { from: { id_kiss: 20, id_wink: 10 } },
  hk_fan_cheer: { from: { id_penlight: 12, id_fansa: 15 } },
  hk_yoshi: { from: { rw_yubisashi: 20 } },
  hk_tokkyu: { from: { rw_teikoku: 15, rw_shuppatsu: 8 } },
  hk_nagashi: { from: { bb_hit: 20 } },
  hk_makyuu: { from: { bb_fastball: 20, '@atk': 30 } },
  hk_randoseru_rocket: { from: { es_randoseru: 20 } },
  hk_radio_taiso: { from: { es_aisatsu: 10, es_kakekko: 8 } },
  hk_yukigassen: { from: { lc_josetsu: 15 } },
  hk_kairanban: { from: { lc_madoguchi: 15, lc_bousai: 6 } },
  // 掛け合わせ技（ちがう 職業の 技を 何回も 使うと ひらめく。使えるのは 上級職から）
  mahouken: { from: { daichi: 15, mera: 15 } },
  senka: { from: { seiken: 15, hoimi: 15 } },
  kaen_senpu: { from: { gira: 12, bagi: 12 } },
  nioudachi: { from: { kabau: 8, sukara: 10 } },
  iyashi_mai: { from: { hustle: 12, hoimi: 15 } },
  hayatezuki: { from: { piorimu: 8, seiken: 15 } },
  madoromi: { from: { rariho: 10, hustle: 10 } },
  medoro: { from: { mera: 25, hyado: 25 } },
  star_strash: { from: { daichi: 20, kaiha: 15, kuuretsu: 12 } },
  // 第20〜22回の 職業の ひらめき技（hirameki-jobs.js）
  ...HIRAMEKI_JOBS,
};

// 回数の 名前（'@atk' など、技 では ない もの）
export const USE_NAMES = { '@atk': 'ふつうの攻撃' };

// ひらめきやすさ: 回数を ちょうど こえた とき 20%、1.5倍で 60%（それ以上は 60%）
export function hiraChance(ratio) {
  if (!(ratio >= 1)) return 0;
  return Math.min(0.6, 0.2 + (ratio - 1) * 0.8);
}

// いちばん たりない 回数の わりあい（1 いじょうで ひらめける）
export function hiraRatio(use, from) {
  let r = Infinity;
  for (const [k, n] of Object.entries(from)) r = Math.min(r, (use?.[k] || 0) / n);
  return r === Infinity ? 0 : r;
}
