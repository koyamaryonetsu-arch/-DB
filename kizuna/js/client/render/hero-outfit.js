// ふく・よろい（そうびの よろいと しょくぎょうで きまる）
// outfitOf(みため, しょくぎょう, よろいの ID, おんな？) → かく ための せってい
// 知らない よろい（これからの もの）は、種類（armorType）・ランク・名前の ことば から きめる
import { mat, ramp, TH, mixC, HeroCanvas } from './hero-raster.js?v=bdeec0bffe23';
import { ITEMS } from '../../shared/data/items.js?v=bdeec0bffe23';
// 第26回の 新しい 職業（楽天カードマン・きさつ隊・ネコ型ロボット・カッパ・火影 など）の 服と からだ
import { R26_OUTFIT, R26_BODY, outfit26, body26, capeFlame, robotTail } from './hero-r26.js?v=bdeec0bffe23';

// ───────────── ざいしつ ─────────────
const METALS = {
  iron: ['#2c2f3e', '#565b6e', '#8a90a4', '#c3c8d8', '#f2f4fa'],
  steel: ['#202a44', '#43537a', '#7488b2', '#b2c2e2', '#eef4ff'],
  silver: ['#3a4256', '#78839e', '#b6bed2', '#e4e8f2', '#ffffff'],
  gold: ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'],
  bronze: ['#4a2416', '#8a4a28', '#c27c44', '#e8b072', '#fff0c8'],
  platinum: ['#4a4a60', '#8a8ca6', '#c6cade', '#eef0fa', '#ffffff'],
  dark: ['#120e1c', '#28223a', '#463e5e', '#6e6690', '#b8b0dc'],
  dragon: ['#10301e', '#22603c', '#3c945c', '#76c886', '#d8ffd8'],
  magic: ['#22123c', '#48287a', '#7a4ab8', '#b088e6', '#f0e2ff'],
  light: ['#6a5634', '#b6a066', '#ece0ae', '#fffae0', '#ffffff'],
  coral: ['#5a1a24', '#a83a48', '#e8707e', '#ffb0b4', '#fff0f0'],
  sea: ['#10304a', '#1e5a86', '#3a8ac0', '#7ac4e8', '#e0f8ff'],
  star: ['#10163a', '#1e2a66', '#33449a', '#5a70c8', '#b8c8ff'],
  // ロトの勇者の あおい よろい
  royal: ['#0c1850', '#1a3a9c', '#2c62d6', '#72a6f6', '#e2f0ff'],
};
// ざいしつは おなじ いろなら つくりなおさない
const memo = new Map();
const once = (key, make) => {
  let v = memo.get(key);
  if (v === undefined) { v = make(); memo.set(key, v); }
  return v;
};
export function metal(kind) {
  return once('m' + kind, () => mat({ r: METALS[kind] || METALS.iron, th: TH.metal, spec: 0.958, sc: '#ffffff' }));
}
export function metalRamp(kind) {
  return METALS[kind] || METALS.iron;
}
export function cloth(c, o = null) {
  if (!o) return once('c' + c, () => mat({ r: ramp(c, 4), th: TH.cloth }));
  return once('c' + c + JSON.stringify(o), () => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth }));
}
export function leather(c = '#8a5632') {
  return once('l' + c, () => mat({ r: ramp(c, 4, { cool: 0.6 }), th: TH.matte, spec: 0.982, sc: mixC(c, '#ffffff', 0.5) }));
}
export function gem(c) {
  return once('g' + c, () => mat({ r: ramp(c, 5, { light: 1.2 }), th: TH.gem, spec: 0.93, sc: '#ffffff' }));
}
export function glow(c) {
  return once('e' + c, () => mat({ r: [mixC(c, '#ffffff', 0.15), mixC(c, '#ffffff', 0.45), mixC(c, '#ffffff', 0.8)], th: [0.1, 0.62], emit: true }));
}
// こい いろの まま ひかる（ネオン・にじいろの キー）
export function neon(c) {
  return once('n' + c, () => mat({ r: [mixC(c, '#000000', 0.12), c, mixC(c, '#ffffff', 0.5)], th: [0.2, 0.72], emit: true }));
}
// 名前の ことば → ざいしつ（weaponfx.js と おなじ かんがえ）
const MAT_RULES = [
  [/伝説|レジェンド|勇者/, 'gold'], [/竜|ドラゴン/, 'dragon'], [/プラチナ/, 'platinum'], [/光|ひかり|聖|天/, 'light'],
  [/魔|まほう|闇|やみ|悪魔/, 'magic'], [/はがね|鋼/, 'steel'], [/銀/, 'silver'], [/金|黄金/, 'gold'],
  [/鉄|くさり/, 'iron'], [/銅|ブロンズ/, 'bronze'], [/サンゴ/, 'coral'], [/海|波|水/, 'sea'], [/星/, 'star'], [/黒|ダーク/, 'dark'],
];
const RANK_METAL = [null, 'bronze', 'bronze', 'iron', 'silver', 'steel', 'magic', 'platinum', 'light', 'dragon', 'gold'];
export function metalOfName(name, rank) {
  for (const [re, v] of MAT_RULES) if (re.test(name || '')) return v;
  return RANK_METAL[Math.max(1, Math.min(10, rank || 3))];
}

// 強化した 品（'iron_sword+2' など）は もとの 品の みため
export function baseItem(id) {
  if (!id) return null;
  let it = ITEMS[id];
  if (it?.base && ITEMS[it.base]) return { id: it.base, it: ITEMS[it.base], plus: it.plus || 0 };
  if (!it && typeof id === 'string') {
    const m = /^(.+?)\+(\d+)$/.exec(id);
    if (m && ITEMS[m[1]]) return { id: m[1], it: ITEMS[m[1]], plus: Number(m[2]) };
  }
  return it ? { id, it, plus: 0 } : null;
}

// ───────────── しょくぎょうの ふく（布の服 の とき） ─────────────
// kind: tunic travel leather chain plate robe gi suit sailor wind jester dress uniform baseball hakama yoroi vest under
//       kid gakuran work stage chef（コックの 上着と エプロン） store（しまの ベスト）
const JOB_OUTFIT = {
  warrior: { kind: 'tunic', pants: '#5a4636' },
  monk: { kind: 'gi' },
  priest: { kind: 'robe', main: '#f4f2fa', trim: 'cloth', holy: true },
  mage: { kind: 'robe', main: 'cloth', trim: '#f2c14e', stars: true },
  performer: { kind: 'jester' },
  battlemaster: { kind: 'gi', main: '#c83a3a', trim: '#2d2330' },
  paladin: { kind: 'plate', metal: 'silver', under: '#3f7fd0', trim: 'gold', holy: true },
  magic_knight: { kind: 'chain', main: '#8a5ac8', tabard: '#8a5ac8' },
  pirate: { kind: 'vest', main: '#2a8aa8', sash: '#c83a3a' },
  holyfist: { kind: 'gi', main: '#f4f2fa', trim: '#f2c14e' },
  ninja: { kind: 'gi', main: '#2d2d4a', trim: '#c83a3a', ninja: true },
  tamer: { kind: 'travel', main: '#8a6a3a', cloak: '#5a7a3a' },
  sage: { kind: 'robe', main: '#3fa35a', trim: '#f4f2fa', stars: true },
  superstar: { kind: 'jester', main: '#e46fa8' },
  fortune: { kind: 'robe', main: '#4a2a7a', trim: '#f2c14e', stars: true },
  dragon_knight: { kind: 'plate', metal: 'dragon', under: '#2aa06a', trim: 'gold', cape: '#1e5a3a', big: true },
  archmage: { kind: 'robe', main: '#2a4a3a', trim: '#5ac880', stars: true, cape: '#16261e' },
  high_priest: { kind: 'robe', main: '#fff8e0', trim: '#f2c14e', holy: true, cape: '#f2c14e' },
  god_hand: { kind: 'gi', main: '#f2c14e', trim: '#c83a3a', dragon: true },
  summoner: { kind: 'robe', main: '#2a5a8a', trim: '#9ad8ff', stars: true },
  magic_swordsman: { kind: 'chain', main: '#6a2a8a', tabard: '#3a1a4a', cape: '#3a1a4a' },
  guardian: { kind: 'plate', metal: 'steel', under: '#8a9ab8', trim: 'silver', big: true },
  hero: { kind: 'travel', main: '#3f7fd0', cloak: '#c83a3a', hero: true },
  monster_master: { kind: 'vest', main: '#c8903a', sash: '#3fa35a' },
  star_diva: { kind: 'dress', main: '#f7a1c4', trim: '#fff6b0' },
  jester: { kind: 'jester', main: '#9a4ad0' },
  salaryman: { kind: 'suit', main: '#34405e', tie: '#c83a3a' },
  idol: { kind: 'dress', main: '#ff7ab8', trim: '#ffffff' },
  railman: { kind: 'uniform', main: '#1f2f5a' },
  ballplayer: { kind: 'baseball', main: '#f4f4f4', trim: '#2a3a8a' },
  samurai: { kind: 'hakama', main: '#3a3a5a', hakama: '#5a4a3a' },
  bucho: { kind: 'suit', main: '#5a5a64', tie: '#2a6ad0', glasses: true },
  major_leaguer: { kind: 'baseball', main: '#d4d8e0', trim: '#1a2a5a' },
  sword_master: { kind: 'plate', metal: 'steel', under: '#3a4a9a', trim: 'silver', cape: '#2a3a7a' },
  shogun: { kind: 'yoroi', main: '#8a2a2a' },
  shacho: { kind: 'suit', main: '#22222c', tie: '#f2c14e', glasses: true },
  nitoryu: { kind: 'baseball', main: '#f4f4f4', trim: '#c83a3a' },
  // 学校・公務員・町の みかた・アイドル（fem: 女性の ときに かえる ところ）
  schoolkid: { kind: 'kid', pants: '#2a3a6a', fem: { skirt: '#2a3a6a' } },
  middleschooler: { kind: 'gakuran', main: '#262838', fem: { kind: 'sailor', school: true, main: '#f6f6fa' } },
  highschooler: { kind: 'suit', main: '#2a3a6a', tie: '#c83a3a', blazer: true, plaid: '#6a6a7e', fem: { ribbon: '#d8344a', plaid: '#4a5a8a' } },
  civil_local: { kind: 'work', main: '#7a98b8', armband: '#f2c84e', tag: true },
  civil_national: { kind: 'suit', main: '#2a3452', tie: '#2a6ad0', lanyard: '#2a6ad0' },
  career: { kind: 'suit', main: '#1e1e28', tie: '#b4a0d8', vest: '#5a5870', pin: true, glasses: true },
  police: { kind: 'uniform', main: '#1e2848', police: true },
  firefighter: { kind: 'work', main: '#22305a', band: '#f2e86a', fire: true },
  fruit_idol: { kind: 'dress', main: '#ff7ab8', trim: '#ffffff', pop: true },
  storm_idol: { kind: 'stage', main: '#283c8e' },
  // 鉄道の 職業（白い 手ぶくろ。京急は 赤い ネクタイ）
  train_driver: { kind: 'uniform', main: '#2c3a5c', tie: '#2a6ad0', gloves: '#f6f6fa' },
  keikyu_driver: { kind: 'uniform', main: '#1c2444', tie: '#d8202c', gloves: '#f6f6fa' },
  // 料理人・パティシエ・三ツ星シェフ（コックの 上着と エプロン。三ツ星は 金の ボタンと 赤い スカーフ）
  cook: { kind: 'chef', main: '#f6f6f2', pants: '#3a3a48', check: true, towel: '#3a7ad8' },
  patissier: { kind: 'chef', main: '#f8bcd0', trim: '#ffffff', btn: '#ffffff', neck: '#e8506a', frill: true, berry: true, pants: '#6a4a40', fem: { skirt: '#f8bcd0' } },
  star_chef: { kind: 'chef', main: '#fbfbff', gold: true, neck: '#d8202c', long: true, pants: '#24222c' },
  // アルバイト（しまの ベスト・名札。Tシャツは 自分で えらんだ 色）・正社員・たたき上げ社長（作業着に 金の ネクタイ）
  parttimer: { kind: 'store', main: '#f8f9fc', stripe: '#2a62c8', tee: 'cloth', pants: '#2c3858' },
  seishain: { kind: 'suit', main: '#aab0bc', tie: '#2a9a5a', lanyard: '#2a6ad0', pin: true },
  tatakiage: { kind: 'work', main: '#36593e', tie: '#e8b830', pin: true },
  // お笑い芸人（チェックの はでな 上着）・M-1王者（キラキラの 金の 上着・黒い えり・金の メダル）。どちらも 赤い 蝶ネクタイ
  comedian: { kind: 'suit', main: '#f8a826', bow: '#e0202c', check: true, lapel: '#d2561a', pants: '#2a2a3a' },
  m1_champion: { kind: 'suit', main: '#e8b52a', bow: '#e0202c', shine: true, lapel: '#1c1a26', medal: '#d8202c', pants: '#1c1a26' },
  // 大賢者（こい あいいろの ローブに 銀の ふち・白い ながい マント）・ロトの勇者（青と 金の よろい・ロトのしるし・赤い マント）
  daikenja: { kind: 'robe', main: '#272c74', trim: '#e4e8f4', trimMetal: 'silver', gem: '#8ad8ff', cape: '#f6f6fb', capeLen: 39.2 },
  loto_hero: { kind: 'plate', metal: 'royal', under: '#22328a', trim: 'gold', cape: '#d0202a', capeLen: 36.6, big: true, bird: true, rank: 6 },
  // ニート（こんの ジャージに しろい 2本線・はんぶん あいた チャックから はいいろの Tシャツ・サンダル）
  neet: { kind: 'jersey', main: '#2e3a6c', tee: '#a6a6b4', slipper: '#3a66c0' },
  // 中二病（黒い ロングコート: たかい えり・赤い うら地・ぎんの くさり。右うでに ほうたい）
  chuuni: { kind: 'coat', main: '#1f1b29', lining: '#c41e30' },
  // ダ天使（黒と むらさきの ゴシックな ローブ・銀の ふち・むらさきの 宝石。はねと こわれた 輪）
  datenshi: { kind: 'robe', main: '#251a38', trim: '#d4d6e8', trimMetal: 'silver', gem: '#c060ff', panel: '#47285e' },
  // サイヤ人（こんの ぴったりした 服・クリーム色の むねあて・きいろっぽい 茶色の かたあてと こしの いた・白い 手ぶくろと ブーツ）
  saiyan: { kind: 'saiyan' },
  // スーパーサイヤ人 1〜3（オレンジの 道着・こんの したぎ・リストバンド・おび。かみと オーラは JOB_BODY）
  super_saiyan: { kind: 'gi', main: '#f27a1c', under: '#2a46b0' },
  ss2: { kind: 'gi', main: '#f27a1c', under: '#2a46b0' },
  ss3: { kind: 'gi', main: '#f27a1c', under: '#2a46b0' },
  // 設備屋（はいいろっぽい 青の 作業服・ひかる おび・こしの 道具ぶくろ）・ryonetsu（こんの 作業服に 水色の ふち・むねに ひしがたの マーク）
  setsubiya: { kind: 'work', main: '#687e98', band: '#e6eef8', tools: true },
  ryonetsu: { kind: 'work', main: '#1c2a58', piping: '#7cc8f2', mark: 'diamond' },
  // ゴム人間（赤い ベストを はおって・青い ひざたけの 半ズボン・きいろの おび・サンダル）・ニカ（ぜんぶ しろ）
  rubber: { kind: 'rubber', main: '#d8302a', sash: '#f2c82e', shorts: '#2e58b8', cuff: '#7ea6e6' },
  nika: { kind: 'rubber', main: '#f6f6fb', sash: '#e6e0f6', shorts: '#f2f2f8', cuff: '#ffffff', loose: true },
  // ユーチューバー（赤い パーカーに しろい さいせいボタン）・人気配信者（黒い パーカーに ピンクと 水色の ひかる 線）
  youtuber: { kind: 'hoodie', main: '#de2a2e', logo: true, pants: '#2a3048' },
  streamer: { kind: 'hoodie', main: '#1d1c28', neon: ['#ff48d8', '#38e8ff'], pants: '#1d1c28' },
  // ゲーマー（ドットの ハートの Tシャツ・ひらいた チェックの シャツ・くびに ヘッドホン）・プロゲーマー（黒と 赤の チームの ユニフォーム）
  gamer: { kind: 'gamer', tee: '#34343e', shirt: '#2e7a58', pants: '#3c5c90' },
  pro_gamer: { kind: 'esports', main: '#17171f', trim: '#e0263a' },
  // 魔王（黒と むらさきの よろいに 金の ふち・つのの しるし・ながい 赤黒い マント）
  maou: { kind: 'plate', metal: 'dark', under: '#4a1a60', trim: 'gold', cape: '#7a1222', capeLen: 39.4, big: true, horn: true, rank: 6 },
  // おかん（キャメルの カーディガンに ピンクの 水玉の エプロン・家の スリッパ。女の人は こんの スカート）
  okan: { kind: 'okan', main: '#c8955a', apron: '#ec6a8c', pants: '#5c5a6e', fem: { skirt: '#3c4568', pants: '#4a3c42' } },
  // 最強のおかん（ヒョウがらの 服・金の ネックレス・くろい ズボン）
  saikyo_okan: { kind: 'leopard', necklace: true, pants: '#221e2a' },
  // 社ちく（しわの よった はいいろの スーツ・ゆるんだ ネクタイ・赤い ひもの 社員証）
  shachiku: { kind: 'suit', main: '#6c707c', tie: '#33406c', lanyard: '#d83a3a', loose: true, rumple: true },
  // ブラックきぎょうの星（そでを まくった 白い ワイシャツ・金の 星の バッジ・こんの ズボン）
  black_star: { kind: 'shirt', main: '#f6f7fa', pants: '#262a3e', badge: true },
  // 天才しせつ管理者（白い 作業服に 水色に ひかる 線・むねに AIの チップの しるし・こんの ズボン）
  facility_genius: { kind: 'work', main: '#eef2f6', piping: '#28ccff', glowLine: true, mark: 'chip', pants: '#22304c' },
  // はかい神（金の ふちの くろい エジプトの 服・はばの ひろい 金の えり・金の うでわ・だぼっと した ズボン）
  hakaishin: { kind: 'hakai', main: '#1e1a32', pants: '#2c2644', flap: '#9a1e34' },
};
Object.assign(JOB_OUTFIT, R26_OUTFIT);
// 職業の 服と おなじ よろい（きても 職業の ぼうしが のこる。最強のおかんの ヒョウがらの服）
const OWN_ARMOR = { saikyo_okan: 'leopard_shirt' };
export const ownArmor = (job, armorId) => !!armorId && OWN_ARMOR[job] === armorId;
// ランドセルの 色（男の子は 黒、女の子は 赤）
const PACK_COLORS = ['#26222e', '#d0303c'];

// 職業の からだの とくちょう（よろいを かえても のこる）
// hair・hcol: かみがたと かみの いろ（えらんだ かみの かわりに。目の いろも かみに あわせて iris で きめる）  noBrow: まゆ なし  grin: わらい顔
// aura: オーラ（gold / cloud / dark）  spark: いなずま  tail: しっぽ  wings: はね  eyepatch: 眼帯  scar: 目の したの きず
// aura（第22回）: okan（うすい 金）/ blackred（ゆらめく 赤黒い ほのお）/ circuit（水色の 回路の 線）/ hakai（むらさき）
// spark: 'ember'（オレンジの 火の粉）  earring: 大きな 金の わの イヤリング  tired: 目の したの くま  sweat: あせ
// fire: もえる 目  holo: うかぶ ホログラムの タブレット
const JOB_BODY = {
  saiyan: { tail: true },
  super_saiyan: { hair: 'ssj', hcol: 'ssgold', iris: '#169a8a', aura: 'gold' },
  ss2: { hair: 'ssj2', hcol: 'ssgold', iris: '#169a8a', aura: 'gold', spark: true },
  ss3: { hair: 'ssj3', hcol: 'ssgold', iris: '#169a8a', aura: 'gold', noBrow: true },
  rubber: { scar: true },
  nika: { hair: 'nika', hcol: 'nikawhite', iris: '#3e3460', aura: 'cloud', grin: true, scar: true },
  chuuni: { eyepatch: true },
  datenshi: { wings: true },
  maou: { aura: 'dark' },
  okan: { hair: 'perm' },
  saikyo_okan: { hair: 'perm', hcol: 'obapurple', iris: '#6a3a50', earring: true, aura: 'okan' },
  shachiku: { tired: true, sweat: true },
  black_star: { fire: true, iris: '#e04416', aura: 'blackred' },
  facility_genius: { aura: 'circuit', holo: true },
  hakaishin: { iris: '#d8a020', aura: 'hakai', spark: 'ember' },
};
Object.assign(JOB_BODY, R26_BODY);
export const jobBody = (job) => JOB_BODY[job] || null;

// よろいの みため（ID ごと）
const ARMOR_OUTFIT = {
  travel_clothes: { kind: 'travel', cloak: '#6a4a2e' },
  leather_armor: { kind: 'leather' },
  wind_clothes: { kind: 'wind', main: '#4ec2a6' },
  chain_mail: { kind: 'chain' },
  iron_armor: { kind: 'plate', metal: 'iron', rank: 3 },
  wizard_robe: { kind: 'robe', main: '#4a3a8a', trim: '#f2c14e', stars: true },
  holy_robe: { kind: 'robe', main: '#f4f2fa', trim: '#3f7fd0', holy: true },
  martial_gi: { kind: 'gi' },
  dragon_gi: { kind: 'gi', main: '#c83a3a', trim: '#f2c14e', dragon: true },
  star_mail: { kind: 'plate', metal: 'star', trim: 'gold', under: '#2a3a8a', stars: true, cape: '#1e2a6a', rank: 4 },
  suit: { kind: 'suit', main: '#34405e', tie: '#c83a3a' },
  silver_mail: { kind: 'plate', metal: 'silver', trim: 'gold', under: '#3f5fa8', gemc: '#4a9aff', rank: 4, big: true },
  sailor_clothes: { kind: 'sailor' },
  coral_robe: { kind: 'robe', main: '#e8607a', trim: '#fff0e0', coral: true },
  wave_gi: { kind: 'gi', main: '#2a6ab8', trim: '#e8f6ff', wave: true },
  // サイヤ人の 戦闘服
  battle_suit: { kind: 'saiyan' },
  // ヒョウがらの服
  leopard_shirt: { kind: 'leopard' },
};

// 知らない よろい: 名前と 種類から
function guessArmor(it) {
  const name = it.name || '';
  const rank = it.rank || 3;
  const metalK = metalOfName(name, rank);
  if (/ローブ|法衣|ころも/.test(name) || it.armorType === 'robe') {
    const col = { light: '#f4f2fa', magic: '#4a2a8a', dark: '#2a1a3a', dragon: '#2a7a4a', sea: '#2a6ab8', coral: '#e8607a', gold: '#f0e0b0', star: '#2a3a8a' }[metalK] || '#5a3a9a';
    return { kind: 'robe', main: col, trim: rank >= 5 ? '#f2c14e' : '#dcdcec', stars: /星|魔/.test(name), holy: /聖|光|天/.test(name), rank };
  }
  if (/道着|武道/.test(name) || it.armorType === 'gi') {
    return { kind: 'gi', main: metalK === 'dragon' ? '#c83a3a' : metalK === 'sea' ? '#2a6ab8' : '#e68a2e', trim: rank >= 4 ? '#f2c14e' : null, dragon: /竜/.test(name), rank };
  }
  if (/ドレス|ワンピース/.test(name)) return { kind: 'dress', main: '#e46fa8', trim: '#ffffff', rank };
  if (/スーツ/.test(name)) return { kind: 'suit', main: '#2a2a3a', tie: '#c83a3a', rank };
  if (/くさり|チェーン/.test(name)) return { kind: 'chain', rank };
  if (/皮|革|レザー/.test(name)) return { kind: 'leather', rank };
  if (it.armorType === 'heavy' || /よろい|アーマー|メイル|鎧/.test(name)) return { kind: 'plate', metal: metalK, trim: rank >= 4 ? (metalK === 'gold' ? 'silver' : 'gold') : null, rank, big: rank >= 5, cape: rank >= 6 ? '#3a2a6a' : null };
  // ふく
  return { kind: rank >= 3 ? 'travel' : 'tunic', rank };
}

// 職業の 服（女性で ちがう ところが あれば かさねる）
function jobOutfit(job, fem) {
  const S = JOB_OUTFIT[job] || JOB_OUTFIT.warrior;
  return fem && S.fem ? { ...S, ...S.fem } : S;
}

function armorSpec(armorId, job, fem = false) {
  // よろいを つけて いない ときも 職業の 服（はだぎ では なく）
  if (!armorId) return jobOutfit(job, fem);
  const b = baseItem(armorId);
  if (!b) return jobOutfit(job, fem);
  if (b.id === 'cloth') return jobOutfit(job, fem);
  // 職業の 服と おなじ よろい（最強のおかんの ヒョウがらの服）は 職業の 服（ネックレス つき）。きたえた ものは きらめく
  if (ownArmor(job, b.id)) return { ...jobOutfit(job, fem), star: !!b.it.star, plus: b.plus };
  const spec = ARMOR_OUTFIT[b.id] || guessArmor(b.it);
  return { rank: b.it.rank || 1, star: !!b.it.star, plus: b.plus, ...spec };
}

// ───────────── せってい を つくる ─────────────
export function outfitOf(Lk, job, armorId, fem) {
  const S = armorSpec(armorId, job, fem);
  const clothC = Lk.cloth;
  const res = (c) => (c === 'cloth' ? clothC : c);
  const main = res(S.main) || clothC;
  const O = { kind: S.kind, spec: S, fem, legW: 1, tie: '#e04a6a', clothC };
  const brown = leather('#7a4e2e'), darkLeather = leather('#4a3020');
  const shoes = leather('#5e3c24');
  O.boots = { m: shoes, h: 0 };
  O.pants = cloth(S.pants || '#4e4058');
  O.sleeve = { upper: cloth(main), lower: cloth(main), cuff: null };
  O.top = cloth(main);
  O.torso = { kind: S.kind, hem: 31.2, flare: 0.3 };
  O.belt = null;
  O.skirt = null;
  O.apron = null;
  O.pauldron = null;
  O.cape = S.cape ? { m: cloth(res(S.cape), { dark: 1.1 }), inner: cloth(mixC(res(S.cape), '#000000', 0.35)), len: S.capeLen || 34.5 } : null;
  O.glasses = !!S.glasses || ['bucho', 'shacho'].includes(job);
  O.trimC = S.trim ? res(S.trim) : null;
  const rank = S.rank || 1;
  switch (S.kind) {
    case 'under': {
      O.top = cloth('#e8e0d0');
      O.sleeve = { upper: cloth('#e8e0d0'), lower: Lk.skin };
      O.pants = cloth('#6a5a48');
      O.torso = { kind: 'under', hem: 29.4, flare: 0 };
      O.belt = { m: leather('#8a7a6a'), y: 28.6 };
      break;
    }
    case 'tunic': {
      O.torso = { kind: 'tunic', hem: 31.8, flare: 0.5, collar: cloth('#efe4cc') };
      O.sleeve = { upper: cloth(main), lower: cloth(main), cuff: cloth(mixC(main, '#ffffff', 0.25)) };
      O.belt = { m: brown, buckle: metal('gold'), y: 28.4 };
      O.boots = { m: brown, h: 0.5, cuff: leather('#9a6a3e') };
      if (fem) O.skirt = { m: cloth(main), y0: 30.4, y1: 33.4, flare: 1.4, trim: cloth(mixC(main, '#ffffff', 0.3)) };
      break;
    }
    case 'travel': {
      O.torso = { kind: 'tunic', hem: 31.8, flare: 0.5, collar: cloth('#efe4cc') };
      O.sleeve = { upper: cloth(main), lower: cloth(main), cuff: brown };
      O.belt = { m: brown, buckle: metal('gold'), y: 28.4, pouch: leather('#9a6a3e') };
      O.boots = { m: brown, h: 0.85, cuff: leather('#9a6a3e') };
      O.mantle = { m: cloth(res(S.cloak) || '#6a4a2e', { dark: 1.05 }), clasp: metal('gold') };
      O.cape = { m: cloth(res(S.cloak) || '#6a4a2e', { dark: 1.05 }), inner: cloth(mixC(res(S.cloak) || '#6a4a2e', '#000000', 0.3)), len: S.hero ? 35.5 : 33.6 };
      if (S.hero) O.torso.emblem = 'crest';
      if (fem) O.skirt = { m: cloth(main), y0: 30.4, y1: 33.4, flare: 1.4, trim: cloth(mixC(main, '#ffffff', 0.3)) };
      break;
    }
    case 'leather': {
      O.top = cloth(mixC(main, '#e8dcc0', 0.15));
      O.torso = { kind: 'leather', hem: 31.4, flare: 0.4, plate: leather('#8e5a30'), plateD: leather('#6a3e20') };
      O.sleeve = { upper: cloth(main), lower: cloth(main), cuff: leather('#7a4a28'), cuffW: 1.25 };
      O.pauldron = { m: leather('#8e5a30'), size: 0.75, kind: 'leather' };
      O.belt = { m: darkLeather, buckle: metal('silver'), y: 28.4 };
      O.boots = { m: leather('#6a4226'), h: 0.8, cuff: leather('#8e5a30') };
      O.pants = cloth('#5a4a3e');
      if (fem) O.skirt = { m: leather('#8e5a30'), y0: 29.0, y1: 32.8, flare: 1.2, kind: 'strips', over: true };
      break;
    }
    case 'chain': {
      const tab = S.tabard ? res(S.tabard) : null;
      O.top = metal('iron');
      O.torso = { kind: 'chain', hem: 32.8, flare: 1.0, tabard: tab ? cloth(tab) : null, collar: cloth(main) };
      O.sleeve = { upper: metal('iron'), lower: cloth(tab || main), cuff: leather('#6a4226'), mail: true };
      O.belt = { m: brown, buckle: metal('silver'), y: 28.4 };
      O.boots = { m: leather('#5a3a22'), h: 0.75 };
      O.pants = cloth('#4a4458');
      break;
    }
    case 'plate': {
      const mk = S.metal || 'iron';
      const under = res(S.under) || main;
      O.metalK = mk;
      O.top = cloth(under);
      O.plate = metal(mk);
      O.trim = S.trim ? metal(S.trim) : null;
      // bird: むねに 金の 鳥の しるし（ロトのしるし）
      O.torso = { kind: 'plate', hem: 31.6, flare: 0.6, rank, holy: S.holy, stars: S.stars, bird: S.bird, gemc: S.gemc || (rank >= 4 ? '#5ac8ff' : null) };
      // horn: むねに 金の つのと 赤い 宝石の しるし（魔王）
      if (S.horn) O.torso.horn = true;
      O.sleeve = { upper: cloth(under), lower: metal(mk), cuff: O.trim || null, cuffW: 1.15 };
      O.glove = metal(mk);
      O.pauldron = { m: metal(mk), trim: O.trim, size: S.big ? 1.25 : rank >= 4 ? 1.1 : 1.0, kind: 'plate', layers: rank >= 4 || S.big ? 2 : 1, spike: mk === 'dragon' || mk === 'dark' };
      O.belt = { m: leather('#4a3020'), buckle: O.trim || metal(mk), y: 28.3 };
      O.boots = { m: metal(mk), h: 0.98, knee: metal(mk), wide: 1.08, cuff: O.trim || null };
      O.pants = cloth(mixC(under, '#202030', 0.45));
      O.skirt = { m: metal(mk), y0: 28.9, y1: 32.6, flare: 1.4, kind: 'faulds', trim: O.trim, rows: rank >= 4 ? 3 : 2, over: true };
      break;
    }
    case 'robe': {
      // trimMetal: ふちを きんぞくの いろに（大賢者の 銀）  gem: むねの ひかる 宝石（いろ）
      const trim = res(S.trim) || '#f2c14e';
      O.top = cloth(main);
      O.trimM = S.trimMetal ? metal(S.trimMetal) : cloth(trim, { th: TH.cloth });
      O.torso = { kind: 'robe', hem: 29.0, flare: 0, holy: S.holy, stars: S.stars, coral: S.coral, gem: S.gem || null };
      O.sleeve = { upper: cloth(main), lower: cloth(main), cuff: O.trimM, wide: 1.45, puff: 1.05 };
      O.skirt = { m: cloth(main), y0: 28.6, y1: 39.6, flare: 2.4, trim: O.trimM, kind: 'robe', front: O.trimM };
      // panel: まえの おびの 色（ダ天使の むらさき。ふちは trim）
      if (S.panel) {
        O.torso.panel = cloth(S.panel);
        O.skirt.front = O.torso.panel;
      }
      O.belt = { m: S.holy || S.trimMetal ? O.trimM : cloth(mixC(trim, '#000000', 0.15)), buckle: gem(S.gem || (S.holy ? '#4a9aff' : S.coral ? '#ff8a9a' : '#c070ff')), y: 28.2, sash: true };
      O.boots = { m: leather('#5a3a4a'), h: 0 };
      O.pants = cloth(mixC(main, '#000000', 0.4));
      break;
    }
    case 'gi': {
      const trim = S.trim ? res(S.trim) : null;
      O.top = cloth(main);
      O.torso = { kind: 'gi', hem: 31.4, flare: 0.6, trim: trim ? cloth(trim) : null, dragon: S.dragon, wave: S.wave, ninja: S.ninja };
      O.sleeve = { upper: cloth(main), lower: S.ninja ? cloth(main) : Lk.skin, cuff: cloth(trim || '#f4f2f6'), cuffW: 1.1, short: !S.ninja };
      O.belt = { m: cloth(S.ninja ? '#c83a3a' : trim && !S.dragon ? trim : '#24202c'), y: 28.3, sash: true, obi: true };
      O.pants = cloth(S.ninja ? main : mixC(main, '#000000', 0.2));
      O.legW = 1.16;
      O.boots = { m: cloth(S.ninja ? '#24202c' : '#3a3040'), h: 0.32, wrap: cloth('#f0ece0') };
      if (S.under) {
        // スーパーサイヤ人の 道着: こんの したぎ（V の えりと 半そで）・こんの リストバンドと おび・こんの ブーツ・むねの まるい しるし
        const um = cloth(S.under);
        O.torso = { ...O.torso, trim: null, under: um, mark: cloth('#f8f6f0') };
        O.sleeve = { upper: um, lower: Lk.skin, cuff: um, cuffW: 1.26 };
        O.belt = { m: um, y: 28.3, sash: true, obi: true };
        O.pants = cloth(main);
        O.boots = { m: cloth('#26306c'), h: 0.62, cuff: cloth('#e2a634') };
      }
      break;
    }
    case 'saiyan': {
      // サイヤ人の 戦闘服: こんの ぴったりした 服・クリーム色の むねあて・きいろっぽい 茶色の かたあてと こしの いた・白い 手ぶくろと ブーツ
      const suit = cloth('#22306e', { light: 0.9 });
      const plate = mat({ r: ['#857c62', '#c4bea2', '#ece8d4', '#fbf9ef', '#ffffff'], th: TH.metal, spec: 0.955, sc: '#ffffff' });
      const brown = mat({ r: ['#5e4012', '#9e701c', '#d2a034', '#f0ce72', '#fff2c4'], th: TH.metal, spec: 0.96, sc: '#fffbe6' });
      const white = mat({ r: ['#8e8ca6', '#cac8da', '#f2f2f8', '#ffffff'], th: TH.cloth });
      O.top = suit;
      O.torso = { kind: 'saiyan', hem: 30.4, flare: 0.2, plate, brown };
      O.sleeve = { upper: suit, lower: suit, cuff: null };
      O.glove = white;
      O.pauldron = { m: brown, size: 1.02, kind: 'plate', layers: 1 };
      O.skirt = { m: brown, y0: 28.3, y1: 32.4, flare: 0.9, kind: 'flaps', over: true };
      O.pants = suit;
      O.legW = 1.04;
      O.boots = { m: white, h: 0.72, cuff: brown, toe: brown };
      O.belt = null;
      break;
    }
    case 'jersey': {
      // ジャージ: たての えり・はんぶん あいた チャックから Tシャツ・うでと あしに しろい 2本線・サンダル
      const jm = cloth(main);
      const line = cloth('#f4f4f8');
      O.top = jm;
      O.torso = { kind: 'jersey', hem: 31.0, flare: 0.5, tee: cloth(res(S.tee) || '#a6a6b4'), line, zip: metal('silver'), collar: cloth(mixC(main, '#000000', 0.12)) };
      O.sleeve = { upper: jm, lower: jm, cuff: cloth(mixC(main, '#000000', 0.25)), cuffW: 1.16, lines: line, lineN: 2 };
      O.pants = jm;
      O.pantsLines = { m: line, n: 2 };
      O.legW = 1.12;
      O.boots = { m: mat({ r: ['#5a5e72', '#9a9eb2', '#d4d6e2', '#f2f2f8'], th: TH.matte }), h: 0, band: cloth(S.slipper || '#3a66c0') };
      O.belt = null;
      break;
    }
    case 'coat': {
      // 中二病の 黒い ロングコート: たかい えり（うらは 赤）・まえの あわせに 赤い うら地・ぎんの くさり・右うでの ほうたい
      const cm = cloth(main, { light: 0.9 });
      const lin = cloth(res(S.lining) || '#c41e30');
      O.top = cm;
      O.torso = { kind: 'coat', hem: 30.0, flare: 0.3, lining: lin, chain: metal('silver'), collar: cm, shirt: cloth('#3a3446') };
      O.sleeve = { upper: cm, lower: cm, cuff: lin, cuffW: 1.14, bandage: mat({ r: ramp('#f2f0ea', 4), th: TH.cloth }) };
      O.skirt = { m: cm, y0: 28.4, y1: 37.4, flare: 1.7, kind: 'coat', lining: lin, over: true };
      O.pants = cloth('#2a2634');
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0.72, cuff: metal('silver') };
      O.belt = { m: leather('#2a2430'), buckle: metal('silver'), y: 28.2 };
      break;
    }
    case 'rubber': {
      // ゴム人間: まえを あけた 半そでの ベスト（はだの むね）・おびを むすぶ・ひざたけの 半ズボン（すその おりかえし）・サンダル
      // loose: ニカ（しろい だぼっと した 服）
      const vm = cloth(main);
      // 男の子は はだの むね、女の子は しろい タンクトップ
      O.top = fem ? cloth(S.loose ? '#fdfdff' : '#f4f2ec') : Lk.skin;
      O.torso = { kind: 'rubber', hem: 29.6, flare: 0.3, vest: vm, loose: !!S.loose, btn: cloth('#f2d23a') };
      O.sleeve = { upper: vm, lower: Lk.skin, cuff: null, puff: S.loose ? 1.2 : 1.08 };
      O.pants = cloth(S.shorts);
      O.shorts = 0.88;
      O.shortsCuff = cloth(S.cuff);
      O.legW = S.loose ? 1.24 : 1.12;
      O.boots = { m: leather('#7a4e2c'), h: 0, sandal: 'strap', strap: leather('#5a3420') };
      O.belt = { m: cloth(S.sash), y: 28.0, sash: true, obi: true };
      break;
    }
    case 'hoodie': {
      // パーカー: うしろの フード・まえの ポケット・ひも（logo: しろい さいせいボタン  neon: ひかる 2色の 線）
      const hm = cloth(main);
      const neonM = S.neon ? S.neon.map((c) => neon(c)) : null;
      O.top = hm;
      O.torso = { kind: 'hoodie', hem: 31.2, flare: 0.4, hood: cloth(mixC(main, '#000000', 0.1)), inner: cloth(mixC(main, '#000000', 0.5)), string: cloth('#f2f2f6'), logo: !!S.logo, neon: neonM, rib: cloth(mixC(main, '#000000', 0.22)) };
      O.sleeve = { upper: hm, lower: hm, cuff: O.torso.rib, cuffW: 1.16, lines: neonM ? neonM[1] : null, lineN: 1 };
      O.pants = cloth(S.pants || '#2a3048');
      if (neonM) O.pantsLines = { m: neonM[0], n: 1 };
      O.boots = { m: mat({ r: ['#8a8a9e', '#c4c4d2', '#ececf2', '#ffffff'], th: TH.matte }), h: 0, toe: neonM ? neonM[0] : cloth('#de2a2e') };
      O.belt = null;
      break;
    }
    case 'gamer': {
      // ゲーマー: ドットの ハートの Tシャツ・まえを あけた チェックの シャツ・ジーンズ・くびに かけた ヘッドホン
      const tee = cloth(S.tee);
      const sh = cloth(S.shirt);
      O.top = tee;
      O.torso = { kind: 'gamer', hem: 31.0, flare: 0.4, tee, shirt: sh, phones: mat({ r: ['#101018', '#22222e', '#3a3a4c', '#6a6a86'], th: TH.metal.slice(0, 3), spec: 0.95 }), cup: cloth('#e8384a') };
      O.sleeve = { upper: sh, lower: sh, cuff: cloth(mixC(S.shirt, '#000000', 0.25)), cuffW: 1.16, tex: tex.plaid };
      O.pants = cloth(S.pants);
      O.boots = { m: mat({ r: ['#6a1a24', '#b02a36', '#e04a52', '#ff8a8a'], th: TH.matte }), h: 0, toe: cloth('#f4f4f6') };
      O.belt = null;
      break;
    }
    case 'esports': {
      // プロゲーマー: チームの ユニフォーム（黒に 赤い わきの おびと ななめの 線・せなかに 番号）・ゆびの ない 手ぶくろ
      const jm = cloth(main, { light: 0.95 });
      const tr = cloth(S.trim);
      O.top = jm;
      O.torso = { kind: 'esports', hem: 31.0, flare: 0.3, trim: tr, white: cloth('#f4f4f8') };
      O.sleeve = { upper: jm, lower: jm, cuff: tr, cuffW: 1.1, lines: tr, lineN: 1 };
      O.glove = mat({ r: ['#0c0c12', '#1c1c26', '#34343e', '#5a5a6a'], th: TH.matte, spec: 0.96 });
      O.fingerless = true;
      O.pants = cloth('#1c1c24');
      O.pantsLines = { m: tr, n: 1 };
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0, toe: tr };
      O.belt = null;
      break;
    }
    case 'okan': {
      // おかん: ニットの カーディガン（ふちは こい いろ）・白い ブラウスの えり・むねあての ある 水玉の エプロン（すそは フリル・ポケットに ハート）
      // 家の スリッパ。女の人は こんの スカートと タイツ
      const cm = cloth(main, { light: 0.9 });
      const edge = cloth(mixC(main, '#3a1a10', 0.3), { light: 0.9 });
      O.top = cm;
      O.torso = { kind: 'okan', hem: 31.2, flare: 0.5, blouse: mat({ r: ramp('#f8f4ec', 4), th: TH.cloth }), edge };
      O.sleeve = { upper: cm, lower: cm, cuff: edge, cuffW: 1.2, tex: tex.knit };
      O.pants = cloth(S.pants || '#5c5a6e');
      O.boots = { m: mat({ r: ['#7a685e', '#b4a294', '#e2d4c6', '#f8efe4'], th: TH.matte }), h: 0, band: cloth('#d8607e') };
      O.belt = null;
      const ac = S.apron || '#ec6a8c';
      O.apron = { m: cloth(ac, { light: 0.9 }), y0: 28.0, y1: 34.4, flare: 0.8, frill: true, bib: 22.7, dots: '#fff8fa', pocket: cloth(mixC(ac, '#ffffff', 0.45)), heart: '#e8203e', tie: cloth(mixC(ac, '#000000', 0.18)) };
      if (fem && S.skirt) O.skirt = { m: cloth(S.skirt), y0: 28.6, y1: 35.8, flare: 1.3 };
      break;
    }
    case 'leopard': {
      // ヒョウがらの 服（金色に こげ茶の わの はんてん）・くろい ズボン・金の ひもの くつ。necklace: 金の くさりの ネックレス
      const lm = mat({ r: ['#3a1e0e', '#a6621e', '#dea23e', '#f6d27a'], th: TH.cloth });
      O.top = lm;
      O.torso = { kind: 'leopard', hem: 30.8, flare: 0.4, necklace: S.necklace ? metal('gold') : null };
      O.sleeve = { upper: lm, lower: lm, cuff: null, tex: tex.leopard };
      O.pants = cloth(S.pants || '#221e2a');
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0, band: metal('gold') };
      O.belt = null;
      break;
    }
    case 'shirt': {
      // ワイシャツ（ネクタイは あたまに まいている）: ひらいた えり・ボタン・むねポケット・まくった そで・金の 星の バッジ
      const sm = cloth(main, { light: 0.85 });
      O.top = sm;
      O.torso = { kind: 'shirt', hem: 30.0, flare: 0.2, badge: !!S.badge, btn: cloth('#c4c8d6'), collar: sm };
      O.sleeve = { upper: sm, lower: Lk.skin, cuff: null, roll: cloth(mixC(main, '#a8b0c8', 0.18), { light: 0.85 }) };
      O.pants = cloth(S.pants || '#262a3e', { light: 0.85 });
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0 };
      O.belt = { m: leather('#1c1a22'), buckle: metal('silver'), y: 28.4 };
      break;
    }
    case 'hakai': {
      // はかい神: そでの ない くろい 服（すそは 金の ふち）・はばの ひろい 金の えり（あおい おびと 赤い たま）・金の おびと 赤い たれ
      // だぼっと した ズボン（あしくびで しぼる）・金の うでわ・てくびと あしくびの 金の わ・つまさきが 金の くつ
      const dm = cloth(main, { light: 0.9 });
      const gold = metal('gold');
      O.top = dm;
      O.torso = { kind: 'hakai', hem: 29.8, flare: 0.2, trim: gold };
      O.usekh = { m: gold, band: cloth('#2a5ac8', { light: 1.15 }), bead: cloth('#d8343a') };
      O.sleeve = { upper: Lk.skin, lower: Lk.skin, cuff: gold, cuffW: 1.22, rings: gold };
      O.pants = cloth(S.pants || '#2c2644');
      O.legW = 1.34;
      O.ankleW = 0.92;
      O.anklet = gold;
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0, toe: gold };
      O.belt = { m: gold, y: 28.0, obi: true, flap: { m: cloth(S.flap || '#9a1e34'), trim: gold } };
      break;
    }
    case 'suit': {
      const sc = main;
      // shine: キラキラの 金の 上着（ラメ）  check: チェックの 上着
      const jm = S.shine ? mat({ r: ['#9a6418', '#d0961e', sc, '#fadc6a'], th: TH.cloth, spec: 0.955, sc: '#fffbe6' }) : cloth(sc, { light: 0.8 });
      O.top = jm;
      // ribbon: リボン（ネクタイの かわり） blazer: 学校の ブレザー  lanyard: 首から さげる 名札  vest: 3つぞろい  pin: えりの バッジ
      // bow: 蝶ネクタイ  lapel: えりの 色（くろい サテン）  medal: 首から さげた 金の メダル（リボンの 色）
      O.torso = {
        kind: 'suit', hem: 31.4, flare: 0.3, tie: cloth(res(S.tie) || '#c83a3a'), shirt: cloth('#f6f6fa'),
        ribbon: S.ribbon ? cloth(S.ribbon) : null, blazer: !!S.blazer, lanyard: S.lanyard ? cloth(S.lanyard) : null,
        vest: S.vest ? cloth(S.vest) : null, pin: !!S.pin,
        bowtie: S.bow ? cloth(S.bow) : null, tex: S.check ? 'plaid' : S.shine ? 'lame' : null, shine: !!S.shine,
        lapel: S.lapel ? mat({ r: ramp(S.lapel, 4, { light: 1.3 }), th: TH.cloth, spec: 0.95, sc: mixC(S.lapel, '#ffffff', 0.55) }) : null,
        medal: S.medal ? cloth(S.medal) : null,
        // loose: ゆるめた ネクタイと あけた えりもと  rumple: しわの よった 上着（社ちく）
        loose: !!S.loose, rumple: !!S.rumple,
      };
      O.sleeve = { upper: jm, lower: jm, cuff: cloth('#f6f6fa'), tex: S.check ? tex.plaid : S.shine ? tex.lame : null };
      O.pants = S.pants ? cloth(S.pants) : cloth(mixC(sc, '#000000', 0.1), { light: 0.8 });
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0 };
      O.belt = null;
      // 学校の ブレザー: チェックの ズボン・スカートと 紺の ハイソックス
      if (S.plaid && !fem) {
        O.pants = cloth(S.plaid);
        O.pantsTex = tex.plaid;
      }
      if (fem && S.plaid) {
        O.skirt = { m: cloth(S.plaid), y0: 28.6, y1: 33.4, flare: 1.5, kind: 'pleat', tex: tex.plaid };
        O.pants = Lk.skin;
        O.boots = { m: leather('#3a2418'), h: 0.62, shaft: cloth('#2a2e4a') };
      } else if (fem) O.skirt = { m: S.pants ? cloth(S.pants) : cloth(mixC(sc, '#000000', 0.1), { light: 0.8 }), y0: 28.8, y1: 34.2, flare: 0.6 };
      break;
    }
    case 'sailor': {
      // school: 中学校の セーラー服（白い 服・紺の えりに 白い 線・赤い スカーフ）
      O.top = mat({ r: ramp('#f4f6fa', 4), th: TH.cloth });
      O.torso = { kind: 'sailor', hem: S.school ? 29.6 : 31.0, flare: 0.3, stripe: S.school ? null : cloth('#2a4a9a'), collar: cloth('#24346e'), scarf: cloth('#d8343a'), line: S.school ? mat({ r: ramp('#f6f6fa', 4), th: TH.cloth }) : null };
      O.sleeve = { upper: O.top, lower: O.top, cuff: cloth('#24346e'), stripes: true };
      O.pants = cloth('#e8ecf4');
      O.boots = { m: leather('#4a3020'), h: 0.7 };
      O.belt = S.school ? null : { m: leather('#3a2a1a'), buckle: metal('gold'), y: 28.6 };
      if (fem) O.skirt = { m: cloth('#24346e'), y0: 28.8, y1: 33.6, flare: 1.6, kind: 'pleat' };
      if (S.school) {
        if (fem) O.pants = Lk.skin;
        O.boots = { m: leather('#3a2418'), h: 0.5, shaft: cloth('#f4f4f6') };
      }
      break;
    }
    case 'kid': {
      // 小学生: はんそでの シャツ（男の子は 半ズボン、女の子は スカートと リボン）・白い くつした。ランドセルは あとで
      const shirt = mat({ r: ramp('#f6f6f2', 4), th: TH.cloth });
      O.top = shirt;
      O.torso = { kind: 'kid', hem: fem ? 29.2 : 30.2, flare: 0.2, collar: shirt, bow: fem ? cloth('#e04a5a') : null, pocket: !fem };
      O.sleeve = { upper: shirt, lower: Lk.skin, cuff: null, puff: fem ? 1.15 : 1.05 };
      O.pants = cloth(res(S.pants) || '#2a3a6a');
      O.shorts = fem ? 0 : 0.42;
      O.boots = { m: leather('#4a3a5a'), h: 0.42, shaft: cloth('#f8f8f8') };
      if (fem) {
        O.skirt = { m: cloth(res(S.skirt) || '#2a3a6a'), y0: 28.2, y1: 33.0, flare: 1.6, kind: 'pleat' };
        O.pants = Lk.skin;
      }
      break;
    }
    case 'gakuran': {
      // 中学生（男の子）: 学ラン（つめえり・金の ボタン）
      const k = cloth(main, { light: 0.85 });
      O.top = k;
      O.torso = { kind: 'gakuran', hem: 31.6, flare: 0.3, gold: metal('gold'), collar: cloth(mixC(main, '#000000', 0.2), { light: 0.85 }), shirt: cloth('#f6f6fa') };
      O.sleeve = { upper: k, lower: k, cuff: null };
      O.pants = cloth(mixC(main, '#000000', 0.1), { light: 0.85 });
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0 };
      O.belt = null;
      break;
    }
    case 'work': {
      // 地方公務員の 防災服・消防士の 活動服（ひかる おび・うでしょう・名札）
      // tie: えりを ひらいて シャツと ネクタイ（たたき上げ社長の 金の ネクタイ）  pin: むねの 金の バッジ
      const jc = cloth(main);
      O.top = jc;
      O.torso = {
        kind: 'work', hem: 31.4, flare: 0.3, collar: cloth(mixC(main, '#000000', 0.18)), zip: metal('silver'),
        band: S.band ? mat({ r: ramp(S.band, 4, { light: 1.2 }), th: TH.cloth, spec: 0.94 }) : null, tag: !!S.tag, fire: !!S.fire,
        tie: S.tie ? mat({ r: ramp(S.tie, 4, { light: 1.15 }), th: TH.cloth, spec: 0.95, sc: '#fff6d8' }) : null, shirt: cloth('#f6f6fa'), pin: !!S.pin,
      };
      O.sleeve = { upper: jc, lower: jc, cuff: cloth(mixC(main, '#000000', 0.22)), cuffW: 1.08, band: O.torso.band, armband: S.armband ? cloth(S.armband) : null };
      O.pants = cloth(S.pants || (S.fire ? main : mixC(main, '#202838', 0.4)));
      O.boots = { m: mat({ r: ['#12101a', '#26222e', '#3e3a48', '#6a6680'], th: TH.matte, spec: 0.96 }), h: S.fire ? 0.62 : 0.25 };
      O.belt = S.fire ? null : { m: leather('#2a2a34'), buckle: metal('silver'), y: 28.6 };
      if (S.fire) O.pantsBand = O.torso.band;
      // piping: えり・あわせ・ポケット・そでぐちの 水色の ふち  mark: むね（と せなか）の ひしがたの マーク
      if (S.piping) {
        O.torso.piping = mat({ r: ramp(S.piping, 4, { light: 1.15 }), th: TH.cloth, spec: 0.97 });
        O.torso.mark = S.mark || null;
        O.sleeve.cuff = O.torso.piping;
      }
      // glowLine: ひかる 水色の 線（天才しせつ管理者）。そでと ズボンにも 1本ずつ・くつの つまさきは こん
      if (S.glowLine) {
        const ln = neon(S.piping);
        O.torso.piping = ln;
        O.sleeve = { ...O.sleeve, cuff: ln, lines: ln, lineN: 1 };
        O.pantsLines = { m: ln, n: 1 };
        O.boots = { ...O.boots, toe: cloth('#34466a') };
      }
      // tools: こしの 道具ぶくろ（スパナ・ドライバー・メジャー）と あしの ひかる おび
      if (S.tools) {
        O.belt = { m: leather('#6a4426'), buckle: metal('silver'), y: 28.5, tools: true };
        O.pantsBand = O.torso.band;
        O.boots = { ...O.boots, h: 0.5 };
      }
      break;
    }
    case 'stage': {
      // アラシ: キラキラの ステージ衣装（えんび服の すそ・銀の ふち・むねに いなずま）。スカーフは 服の 色
      const jc = mat({ r: ramp(main, 5, { light: 1.15 }), th: TH.hair, spec: 0.97, sc: '#e8f0ff' });
      O.top = jc;
      O.torso = { kind: 'stage', hem: 31.2, flare: 0.4, shirt: cloth('#f6f6fa'), scarf: cloth(clothC), trim: metal('silver'), bolt: metal('gold') };
      O.sleeve = { upper: jc, lower: jc, cuff: metal('silver'), cuffW: 1.12 };
      O.pants = cloth(mixC(main, '#000000', 0.15));
      O.boots = { m: mat({ r: ['#12101a', '#26222e', '#4a4658', '#9a96b0'], th: TH.metal, spec: 0.93 }), h: 0.55, cuff: metal('silver') };
      O.belt = { m: leather('#14121c'), buckle: metal('silver'), y: 28.5 };
      O.cape = { m: jc, inner: cloth(clothC, { dark: 1.1 }), len: 33.6, tails: true };
      // かたの 銀の かざり
      O.pauldron = { m: metal('silver'), trim: metal('gold'), size: 0.62, kind: 'plate', layers: 1 };
      O.pants = cloth(mixC(main, '#000000', 0.35));
      break;
    }
    case 'chef': {
      // コックの 上着（ダブルの うちあわせ・たての えり）と エプロン
      // gold: 金の ボタンと えりの ふち  neck: スカーフ  btn: ボタンの 色  check: チェックの ズボン
      // エプロン: long（すねまで） frill（すそが なみうつ） towel（こしの タオル） berry（イチゴの かざり）
      const jc = cloth(main, { light: 0.85 });
      O.top = jc;
      O.torso = {
        kind: 'chef', hem: 31.0, flare: 0.3, collar: jc, trim: S.gold ? metal('gold') : S.trim ? cloth(res(S.trim)) : null,
        neck: S.neck ? cloth(S.neck) : null, btn: S.gold ? metal('gold') : cloth(S.btn || mixC(main, '#7a7a92', 0.32)),
      };
      O.sleeve = { upper: jc, lower: jc, cuff: S.trim && !S.gold ? cloth(res(S.trim)) : cloth(mixC(main, '#9a9ab4', 0.1)), cuffW: 1.14 };
      O.pants = cloth(S.pants || '#3a3a48');
      if (S.check) O.pantsTex = tex.check;
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0 };
      O.belt = null;
      O.apron = {
        m: cloth(S.apron || '#f8f8f4', { light: 0.85 }), y0: 28.0, y1: S.long ? 37.4 : 34.0, flare: S.long ? 1.0 : 0.7,
        frill: !!S.frill, trim: S.gold ? metal('gold') : null, towel: S.towel ? cloth(S.towel) : null, berry: !!S.berry,
      };
      if (fem && S.skirt) {
        // スカートの うえに エプロン・しろい くつした
        O.skirt = { m: cloth(S.skirt), y0: 28.6, y1: 33.6, flare: 1.6, kind: 'pleat' };
        O.pants = Lk.skin;
        O.pantsTex = null;
        O.boots = { m: leather('#6a4030'), h: 0.55, shaft: cloth('#fbf8f6') };
      }
      break;
    }
    case 'store': {
      // アルバイト: Tシャツの うえに たての しまの ベスト（まんなかの チャック・名札）。くつは しろい スニーカー
      const tee = cloth(res(S.tee) || '#f6f6f2');
      O.top = cloth(main);
      O.torso = { kind: 'store', hem: 31.0, flare: 0.3, tee, stripe: cloth(S.stripe || '#2a62c8'), zip: metal('silver'), tagc: S.stripe || '#2a62c8' };
      O.sleeve = { upper: tee, lower: Lk.skin, cuff: null, puff: 1.06 };
      O.pants = cloth(S.pants || '#2c3858');
      O.boots = { m: mat({ r: ['#8a8a9e', '#c4c4d2', '#ececf2', '#ffffff'], th: TH.matte }), h: 0 };
      O.belt = null;
      break;
    }
    case 'wind': {
      O.top = cloth(main);
      O.torso = { kind: 'tunic', hem: 31.6, flare: 0.8, collar: cloth('#f4f8f6') };
      O.sleeve = { upper: cloth(main), lower: Lk.skin, cuff: cloth('#f4f8f6') };
      O.scarf = { m: cloth('#f4f8f6'), m2: cloth('#ccece0') };
      O.belt = { m: cloth('#2a8a7a'), y: 28.4, sash: true };
      O.boots = { m: leather('#a87a4a'), h: 0.6, cuff: cloth('#f4f8f6') };
      O.pants = cloth('#3a6a7a');
      if (fem) O.skirt = { m: cloth(main), y0: 30.2, y1: 33.6, flare: 1.8, trim: cloth('#f4f8f6') };
      break;
    }
    case 'jester': {
      const c2 = '#f2c14e';
      O.top = cloth(main);
      O.torso = { kind: 'jester', hem: 31.4, flare: 0.8, c2: cloth(c2), ruff: cloth('#f6f4f8') };
      O.sleeve = { upper: cloth(c2), lower: cloth(main), cuff: cloth('#f6f4f8'), puff: 1.2 };
      O.pants = cloth(mixC(main, '#000000', 0.25));
      O.boots = { m: cloth(c2), h: 0.3, curl: true };
      O.belt = { m: cloth('#2a2430'), buckle: metal('gold'), y: 28.6 };
      break;
    }
    case 'dress': {
      const trim = res(S.trim) || '#ffffff';
      O.top = cloth(main);
      O.torso = { kind: 'dress', hem: 29.6, flare: 0, trim: cloth(trim), bow: cloth(mixC(main, '#ff2a6a', 0.35)) };
      O.sleeve = { upper: cloth(trim), lower: Lk.skin, puff: 1.3 };
      O.skirt = { m: cloth(main), y0: 28.4, y1: 34.6, flare: 3.2, trim: cloth(trim), kind: 'frill' };
      O.boots = { m: cloth(mixC(main, '#ffffff', 0.5)), h: 0.55, cuff: cloth(trim) };
      O.pants = Lk.skin;
      if (S.pop) {
        // フルーツジッパー: ピンク・レモン・メロン色の 3だんの フリルに フルーツの かざり
        O.torso.bow = cloth('#ff3a5a');
        O.torso.pop = true;
        O.sleeve = { upper: cloth('#ffffff'), lower: Lk.skin, puff: 1.4, cuff: cloth('#ffe27a') };
        O.skirt = { m: cloth('#ffa8d4'), y0: 28.4, y1: 35.4, flare: 3.6, trim: cloth('#ffffff'), kind: 'tiers', tiers: [cloth('#ff9ccc'), cloth('#ffe27a'), cloth('#9ae6c0')] };
        O.boots = { m: cloth('#fff4fa'), h: 0.62, cuff: cloth('#ff8ac0') };
        O.sparkle = true;
      }
      break;
    }
    case 'uniform': {
      O.top = cloth(main, { light: 0.8 });
      O.torso = { kind: 'uniform', hem: 31.4, flare: 0.3, gold: metal('gold'), shirt: cloth('#f6f6fa') };
      O.sleeve = { upper: O.top, lower: O.top, cuff: metal('gold'), cuffW: 1.05 };
      O.pants = cloth(main, { light: 0.8 });
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0 };
      O.belt = { m: leather('#1a1820'), buckle: metal('gold'), y: 28.5 };
      if (S.police) {
        // 警察官: 水色の シャツと 紺の ネクタイ、銀の ボタン、金の バッジ、こしの ポーチ
        O.torso = { ...O.torso, police: true, gold: metal('silver'), shirt: cloth('#a8c8ee'), tie: cloth('#1a2240'), badge: metal('gold') };
        O.sleeve.cuff = cloth(mixC(main, '#000000', 0.25));
        O.belt = { m: leather('#16141c'), buckle: metal('silver'), y: 28.5, pouch: leather('#24222c') };
      }
      // 運転士: えりを ひらいて ネクタイ、白い 手ぶくろ
      if (S.tie && !S.police) O.torso = { ...O.torso, tie: cloth(S.tie) };
      if (S.gloves) O.glove = cloth(S.gloves);
      break;
    }
    case 'baseball': {
      const tr = res(S.trim) || '#2a3a8a';
      O.top = cloth(main);
      O.torso = { kind: 'baseball', hem: 30.0, flare: 0, trim: cloth(tr) };
      O.sleeve = { upper: cloth(main), lower: cloth(tr), cuff: cloth(tr) };
      O.pants = cloth(main);
      O.boots = { m: mat({ r: ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'], th: TH.matte, spec: 0.95 }), h: 0.42, sock: cloth(tr) };
      O.belt = { m: leather('#1e1e2a'), buckle: metal('silver'), y: 28.6 };
      break;
    }
    case 'hakama': {
      O.top = cloth(main);
      O.torso = { kind: 'hakama', hem: 30.0, flare: 0, collar: cloth('#f4f2f6') };
      O.sleeve = { upper: cloth(main), lower: cloth(main), wide: 1.3 };
      O.skirt = { m: cloth(S.hakama || '#5a4a3a'), y0: 28.4, y1: 39.0, flare: 2.6, kind: 'hakama', over: true };
      O.belt = { m: cloth('#f4f2f6'), y: 28.0 };
      O.boots = { m: cloth('#f4f2f6'), h: 0, sandal: true };
      break;
    }
    case 'yoroi': {
      const r = main;
      O.top = cloth(r);
      O.torso = { kind: 'yoroi', hem: 30.4, flare: 0.4, lace: cloth('#1e1a24'), gold: metal('gold') };
      O.sleeve = { upper: cloth('#2a2430'), lower: metal('dark'), cuff: null };
      O.glove = metal('dark');
      O.pauldron = { m: cloth(r), size: 1.25, kind: 'sode', lace: cloth('#1e1a24') };
      O.skirt = { m: cloth(r), y0: 29.0, y1: 34.0, flare: 1.6, kind: 'kusazuri', lace: cloth('#1e1a24'), over: true };
      O.boots = { m: metal('dark'), h: 0.9 };
      O.pants = cloth('#2a2430');
      break;
    }
    case 'vest': {
      O.top = cloth('#f4f2ec');
      O.torso = { kind: 'vest', hem: 31.2, flare: 0.4, vest: cloth(main) };
      O.sleeve = { upper: cloth('#f4f2ec'), lower: cloth('#f4f2ec'), cuff: cloth('#e0dcd0'), puff: 1.1 };
      O.belt = { m: cloth(res(S.sash) || '#c83a3a'), y: 28.3, sash: true };
      O.pants = cloth('#3a3448');
      O.legW = 1.08;
      O.boots = { m: leather('#3a2618'), h: 0.85, cuff: leather('#5a3a22') };
      break;
    }
    default:
      // 第26回の 新しい 服の しゅるい（hero-r26.js）
      if (!outfit26(O, S, Lk, fem, main, 'kind')) O.torso = { kind: 'tunic', hem: 31.4, flare: 0.4, collar: cloth('#efe4cc') };
  }
  // 羽織・こしの 刀・きゃはん・エプロン など（第26回の 職業の 服）
  outfit26(O, S, Lk, fem, main, 'more');
  // 小学生は いつも ランドセル（よろいを かえても せおっている）
  if (job === 'schoolkid') {
    const pc = PACK_COLORS[fem ? 1 : 0];
    O.pack = { m: leather(pc), edge: leather(mixC(pc, '#000000', 0.32)), clasp: metal('gold'), strap: leather(mixC(pc, '#000000', 0.12)) };
  }
  // 職業の からだの とくちょう（しっぽ・はね・かみ・オーラ・眼帯 など。よろいを かえても のこる）
  const JB = JOB_BODY[job];
  if (JB) {
    O.body = JB;
    if (JB.tail) O.tail = { m: mat({ r: ['#3e2414', '#6a4024', '#98633a', '#c08c5c'], th: TH.hair.slice(0, 3) }) };
    if (JB.wings) O.wings = { m: mat({ r: ['#08060e', '#16121e', '#2a2236', '#463a5c', '#7a6a9a'], th: TH.hair, spec: 0.965, sc: '#8a7ab0' }) };
    body26(O, JB);
  }
  // ★の 品・強化した 品は きらめく
  O.sparkle = !!S.star || (S.plus || 0) > 0;
  return O;
}

// ───────────── からだの かたち ─────────────
function torsoFrontPts(P, T) {
  const f = P.fem;
  const sh = f ? 4.7 : 5.2, cor = f ? 5.7 : 6.3, arm = f ? 5.0 : 5.6, waist = f ? 4.2 : 4.8, hip = f ? 5.2 : 5.3;
  const hem = T.hem, fl = T.flare || 0;
  const pts = [[16 - sh, 21.0], [16 + sh, 21.0], [16 + cor, 22.4], [16 + arm, 24.6], [16 + waist, 28.4]];
  if (hem > 28.8) pts.push([16 + hip + fl * 0.5, Math.min(hem, 30.4)], [16 + hip + fl, hem], [16 - hip - fl, hem], [16 - hip - fl * 0.5, Math.min(hem, 30.4)]);
  else pts.push([16 + waist, hem], [16 - waist, hem]);
  pts.push([16 - waist, 28.4], [16 - arm, 24.6], [16 - cor, 22.4]);
  return pts;
}
function torsoSidePts(P, T) {
  const X = P.X, b = P.bob;
  const hem = T.hem + (T.hem > 28.8 ? 0 : b), fl = T.flare || 0;
  const chest = P.fem ? 2.6 : 2.8;
  return [[X(1.5), 21.0 + b], [X(-2.3), 21.0 + b], [X(-3.2), 22.6 + b], [X(-3.0), 26.0 + b], [X(-2.8), 28.4 + b], [X(-3.3 - fl * 0.5), hem], [X(3.0 + fl * 0.5), hem], [X(2.6), 28.4 + b], [X(chest), 25.2 + b], [X(chest + 0.2), 23.4 + b], [X(2.4), 21.8 + b]];
}
function pelvis(cv, P, O) {
  cv.part({ ol: 'line' });
  // スカートの ときは こしも スカートの 色（はだの 色の すきまが 出ないように）
  const S = O.skirt && !O.skirt.over ? O.skirt : null;
  const m = S ? (S.tiers ? S.tiers[0] : S.m) : O.pants;
  if (P.side) {
    const X = P.X, b = P.bob;
    cv.poly([[X(-3.0), 28.2 + b], [X(2.7), 28.2 + b], [X(2.6), 31.6 + b], [X(-3.1), 31.6 + b]], m, { cx: 0.8 });
  } else {
    const w = P.fem ? 4.4 : 4.9, h = P.fem ? 5.3 : 5.2;
    cv.poly([[16 - w, 28.2], [16 + w, 28.2], [16 + h, 31.8], [16 - h, 31.8]], m, { cx: 0.8 });
  }
}

const tex = {
  // くさり（わの もよう）
  mail: (k) => (ix, iy) => {
    const s = k >= 4 ? 2 : 1;
    const r = Math.floor(iy / s) % 2, c = (Math.floor(ix / s) + r) % 2;
    return c ? 0.18 : -0.22;
  },
  stripes: (k, y0) => (ix, iy) => (Math.floor((iy / k - y0) / 1.1) % 2 ? -0.5 : 0),
  // チェック（学校の ブレザーの ズボン・スカート）
  plaid: (k) => (ix, iy) => {
    const s = k >= 4 ? 5 : 3;
    return (ix % s === 0 ? -0.34 : 0) + (iy % s === 0 ? -0.34 : 0) + ((ix + iy) % s === 2 && k >= 4 ? 0.12 : 0);
  },
  // スパンコール（キラキラの 衣装）
  sequin: (k) => (ix, iy) => (((ix * 7 + iy * 13) % (k >= 4 ? 29 : 13)) === 0 ? 0.9 : 0),
  // こまかい いちまつ（コックの ズボン）。小さい えでは くらい はいいろの ぬのに 見える
  check: (k) => (k >= 4 ? (ix, iy) => ((Math.floor(ix / 2) + Math.floor(iy / 2)) % 2 ? -0.5 : 0.25) : (ix, iy) => ((ix + iy) % 2 ? -0.18 : 0.06)),
  // ラメ（金の 上着。あかるい つぶと くらい つぶ）
  lame: (k) => (ix, iy) => {
    const h = (ix * 7 + iy * 13) % (k >= 4 ? 13 : 7);
    return h === 0 ? 0.9 : h === 4 ? -0.35 : 0;
  },
  // ニットの あみめ（たての すじ。小さい えでは うるさく なるので かかない）
  knit: (k) => (k >= 4 ? (ix) => (ix % 3 === 0 ? -0.2 : 0) : null),
  // ヒョウがら（X: こげ茶の わ、o: わの なかの 茶色。ずらして ならべ、かたちを すこし ずつ かえる）
  leopard: (k) => {
    const big = k >= 4;
    const s = big ? 9 : 5, R = big ? LEO8 : LEO4;
    return (ix, iy) => {
      const row = Math.floor(iy / s);
      const off = (row % 2) * Math.floor(s / 2) + ((row * 7) % 3);
      const col = Math.floor((ix + off) / s);
      const g = R[(((col * 5 + row * 3) % R.length) + R.length) % R.length];
      const ch = g[iy % s][(ix + off) % s];
      return ch === 'X' ? -3 : ch === 'o' ? -0.55 : 0;
    };
  },
};
// ヒョウがらの もよう（res 8 は 9×9、res 4 は 5×5 の ます）
const LEO8 = [
  ['.XX.X....', 'X.oo.X...', '..ooo.X..', 'X.oo..X..', '.X.XX....', '.........', '......XX.', '......X..', '.........'],
  ['.........', '..X.XX...', '.XooooX..', '.Xooo....', '..X..XX..', '...XX....', '.........', 'X........', 'XX.......'],
  ['....X....', '.XX..X...', 'X.ooo.X..', '..ooo.X..', 'X.....X..', '.XX.X....', '.........', '.......XX', '.........'],
];
const LEO4 = [
  ['.XX..', 'Xo.X.', '.X...', '....X', '.....'],
  ['X.X..', '.oX..', 'XX...', '...X.', '...XX'],
  ['.X...', 'XoX..', '..X..', '.....', '.X...'],
];

// ───────────── まえ ─────────────
// からだの もようの テクスチャ（くさり・スパンコール・チェック）
function bodyTex(T, k) {
  if (T.kind === 'chain') return tex.mail(k);
  if (T.kind === 'stage') return tex.sequin(k);
  if (T.kind === 'leopard') return tex.leopard(k);
  if (T.kind === 'okan') return tex.knit(k);
  if (T.tex) return tex[T.tex](k);
  return null;
}

export function drawTorsoFront(cv, P, O) {
  pelvis(cv, P, O);
  const T = O.torso;
  cv.part({ ol: 'line' });
  const k = cv.k;
  cv.poly(torsoFrontPts(P, T), O.top, { cx: 0.85, cy: 0.25, tex: bodyTex(T, k) });
  const base = cv.cur;
  const f = P.fem;
  switch (T.kind) {
    case 'under':
      cv.part({ ol: 'soft' });
      cv.poly([[14.6, 21.0], [17.4, 21.0], [16.8, 22.2], [15.2, 22.2]], O.skin, { cx: 0.4 });
      break;
    case 'tunic': {
      // V えり（したの シャツ）
      cv.part({ ol: 'line' });
      cv.poly([[14.2, 21.0], [17.8, 21.0], [16.0, 24.4]], T.collar, { n: [0, -0.1] });
      cv.part({ ol: 'soft' });
      cv.poly([[14.9, 21.0], [17.1, 21.0], [16.0, 22.6]], O.skin, { n: [0, 0.2] });
      // すその おび
      cv.crease([[16 - 5.4, 30.9], [16 + 5.4, 30.9]], 0.3, -0.35, { parts: [base] });
      cv.crease([[16, 25.2], [16, 28.0]], 0.22, -0.3, { parts: [base] });
      if (T.emblem === 'crest') emblem(cv, 16, 25.6, 'crest', O);
      break;
    }
    case 'leather': {
      cv.part({ ol: 'line' });
      const w = f ? 4.2 : 4.7;
      cv.poly([[16 - w, 21.8], [16 - 1.8, 21.6], [16, 22.6], [16 + 1.8, 21.6], [16 + w, 21.8], [16 + w + 0.4, 24.6], [16 + w - 0.2, 28.8], [16 - w + 0.2, 28.8], [16 - w - 0.4, 24.6]], T.plate, { cx: 0.8, cy: 0.3 });
      const id = cv.cur;
      cv.crease([[16 - w + 0.6, 24.8], [16 + w - 0.6, 24.8]], 0.28, -0.4, { parts: [id] });
      cv.crease([[16, 22.8], [16, 28.6]], 0.24, -0.35, { parts: [id] });
      // ぬいめ
      stitches(cv, [[16 - w + 0.7, 22.4], [16 - w + 0.5, 28.2]], id);
      stitches(cv, [[16 + w - 0.7, 22.4], [16 + w - 0.5, 28.2]], id);
      // かたの ベルト
      cv.part({ ol: 'soft' });
      for (const s of [-1, 1]) cv.cap(16 + s * 3.4, 21.0, 0.55, 16 + s * 3.0, 23.4, 0.5, T.plateD, { n: [0, -0.2] });
      break;
    }
    case 'chain': {
      if (T.tabard) {
        cv.part({ ol: 'line' });
        cv.poly([[16 - 3.0, 21.6], [16 + 3.0, 21.6], [16 + 3.4, 28.4], [16 + 3.0, 32.8], [16, 33.4], [16 - 3.0, 32.8], [16 - 3.4, 28.4]], T.tabard, { cx: 0.6 });
        emblem(cv, 16, 25.2, 'cross', O, true);
      }
      cv.part({ ol: 'line' });
      cv.poly([[13.8, 20.6], [18.2, 20.6], [18.6, 21.8], [16, 22.6], [13.4, 21.8]], T.collar, { cx: 0.5 });
      break;
    }
    case 'plate':
      plateFront(cv, P, O, T);
      break;
    case 'robe': {
      // まえの おび（trim。panel が あれば その 色に trim の ふち）・えり
      cv.part({ ol: 'soft' });
      cv.poly([[15.1, 21.0], [16.9, 21.0], [16.7, 28.8], [15.3, 28.8]], T.panel || O.trimM, { cx: 0.5 });
      if (T.panel) {
        const pid = cv.cur;
        cv.part({ ol: 'none', clip: pid });
        for (const s of [-1, 1]) cv.stroke([[16 + s * 0.85, 21.0], [16 + s * 0.65, 28.8]], 0.2, O.trimM, { n: [0, 0] });
      }
      cv.part({ ol: 'line' });
      cv.poly([[13.4, 20.6], [18.6, 20.6], [19.4, 21.8], [16, 23.6], [12.6, 21.8]], O.trimM, { cx: 0.6, n: 'row' });
      cv.part({ ol: 'soft' });
      cv.poly([[14.6, 20.6], [17.4, 20.6], [16, 22.2]], O.top, { n: [0, 0.3] });
      if (T.holy) emblem(cv, 16, 25.4, 'cross', O);
      else if (T.gem) emblem(cv, 16, 25.0, 'gem', O, false, T.gem, O.trimM);
      else if (T.stars) emblem(cv, 16, 25.2, 'star', O);
      else if (T.coral) emblem(cv, 16, 25.4, 'shell', O);
      break;
    }
    case 'gi': {
      if (T.under) {
        // スーパーサイヤ人の 道着: ふかい V から こんの したぎ・あわせの すじ・むねの まるい しるし
        cv.part({ ol: 'soft' });
        cv.poly([[13.8, 21.0], [18.2, 21.0], [16.3, 25.4]], T.under, { n: [0, 0.15] });
        cv.part({ ol: 'soft' });
        cv.poly([[14.9, 21.0], [17.1, 21.0], [16.5, 21.9], [15.5, 21.9]], O.skin, { n: [0, 0.2] });
        cv.crease([[13.7, 21.0], [16.3, 25.5], [18.8, 28.4]], 0.3, -0.5, { parts: [base] });
        cv.crease([[13.4, 21.4], [15.9, 25.6]], 0.2, 0.35, { parts: [base] });
        giMark(cv, 18.6, 23.7, 0.95, T.mark);
        break;
      }
      // うわぎの あわせ（ひだりが うえ）
      cv.part({ ol: 'soft' });
      cv.poly([[14.6, 21.0], [17.4, 21.0], [16.2, 24.2]], T.ninja ? O.top : O.skin, { n: [0, 0.2] });
      cv.part({ ol: 'line' });
      const ed = T.trim || mat({ r: ramp('#f4f2f6', 4), th: TH.cloth });
      cv.stroke([[13.4, 21.0], [16.2, 24.4], [18.6, 28.4]], 0.62, ed, { n: [0, -0.1] });
      cv.stroke([[18.6, 21.0], [16.6, 23.6]], 0.6, ed, { n: [0, -0.1] });
      if (T.dragon) emblem(cv, 13.4, 25.6, 'dragon', O);
      if (T.wave) emblem(cv, 13.4, 26.0, 'wave', O);
      if (T.ninja) { cv.part({ ol: 'line' }); cv.poly([[13.6, 20.4], [18.4, 20.4], [18.6, 21.8], [13.4, 21.8]], ed, { cx: 0.5 }); }
      break;
    }
    case 'suit': {
      if (T.bowtie) {
        // ステージの 上着（蝶ネクタイ）: ひろい V と ショールの えり・ボタン 1つ。金の 上着は キラキラ
        cv.crease([[16, 28.2], [16, 31.2]], 0.22, -0.45, { parts: [base] });
        cv.part({ ol: 'line' });
        cv.poly([[14.0, 21.0], [18.0, 21.0], [17.3, 25.0], [16, 27.3], [14.7, 25.0]], T.shirt, { n: [0, -0.1] });
        const lm = T.lapel || O.top, ltx = T.lapel ? null : bodyTex(T, k);
        const L = [[14.0, 21.0], [12.4, 21.4], [12.6, 23.0], [13.1, 24.8], [14.7, 27.9], [16.0, 27.5], [14.7, 25.0]];
        cv.part({ ol: 'line' });
        cv.poly(L, lm, { n: [-0.3, -0.15], tex: ltx });
        cv.poly(L.map(([x, y]) => [32 - x, y]), lm, { n: [0.3, -0.15], tex: ltx });
        buttons(cv, [[16.0, 28.6]], null, T.shine ? metal('gold') : cloth('#24202c'));
        if (T.shine) sparkleDots(cv, [[12.6, 25.6], [19.6, 28.4], [13.2, 30.0]]);
        if (T.medal) medal(cv, 16, 26.6, T.medal, [[14.8, 21.6], [17.2, 21.6]]);
        break;
      }
      cv.part({ ol: 'line' });
      cv.poly([[14.3, 21.0], [17.7, 21.0], [17.0, 25.6], [16, 26.6], [15.0, 25.6]], T.shirt, { n: [0, -0.1] });
      if (T.ribbon) {
        // リボン（2つの わと たれ）
        cv.part({ ol: 'line' });
        for (const s of [-1, 1]) cv.poly([[16 + s * 0.3, 23.4], [16 + s * 1.5, 26.0], [16 + s * 0.5, 25.8]], T.ribbon, { cx: 0.6 });
        for (const s of [-1, 1]) cv.poly([[16, 23.1], [16 + s * 2.5, 21.9], [16 + s * 2.7, 24.3]], T.ribbon, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.ell(16, 23.2, 0.85, 0.8, T.ribbon, { bulge: 0.6 });
      } else if (T.loose) {
        // ゆるめた ネクタイ（むすびめが さがって ななめ）と、ボタンを はずした えりもと
        cv.part({ ol: 'soft' });
        cv.poly([[15.0, 21.0], [17.0, 21.0], [16.0, 22.7]], O.skin, { n: [0, 0.2] });
        cv.part({ ol: 'soft' });
        cv.poly([[15.6, 23.1], [16.45, 22.95], [17.1, 25.9], [16.65, 26.8], [16.05, 26.1]], T.tie, { cx: 0.6 });
        cv.part({ ol: 'soft' });
        cv.ell(16.05, 22.95, 0.66, 0.52, T.tie, { bulge: 0.7 });
      } else {
        cv.part({ ol: 'soft' });
        cv.poly([[15.5, 21.4], [16.5, 21.4], [16.7, 25.4], [16, 26.4], [15.3, 25.4]], T.tie, { cx: 0.6 });
        // 学校の ネクタイは ななめの しま
        if (T.blazer) for (const y of [22.8, 24.0, 25.2]) cv.crease([[15.2, y], [16.8, y - 0.7]], 0.2, 0.55, { parts: [cv.cur] });
      }
      if (T.vest) {
        // 3つぞろいの ベスト（V の 中に 見える）
        cv.part({ ol: 'line' });
        cv.poly([[14.6, 23.0], [16, 24.8], [17.4, 23.0], [17.0, 26.0], [16, 27.0], [15.0, 26.0]], T.vest, { cx: 0.6 });
        buttons(cv, [[16.0, 25.8]], null, metal('silver'));
      }
      cv.part({ ol: 'line' });
      // えり（ラペル）
      cv.poly([[14.3, 21.0], [13.2, 21.4], [13.6, 23.0], [14.6, 23.4], [15.4, 26.4], [15.0, 25.6]], O.top, { n: [-0.3, -0.2] });
      cv.poly([[17.7, 21.0], [18.8, 21.4], [18.4, 23.0], [17.4, 23.4], [16.6, 26.4], [17.0, 25.6]], O.top, { n: [0.3, -0.2] });
      if (T.blazer) {
        // むねの 校章（ポケットの うえ）
        cv.crease([[17.6, 25.4], [19.6, 25.4]], 0.2, -0.45, { parts: [base] });
        emblem(cv, 18.6, 24.2, 'school', O);
        buttons(cv, [[16.0, 27.6], [16.0, 29.4]], null, metal('gold'));
      } else buttons(cv, [[16.0, 27.6], [16.0, 29.4]], '#1a1822');
      if (T.pin) { cv.part({ ol: 'soft' }); cv.ell(18.2, 22.4, 0.5, 0.5, metal('gold'), { bulge: 0.9 }); }
      if (T.rumple) suitWrinkles(cv, base, 'front');
      if (T.lanyard) {
        // 首から さげた 名札（IDカード）
        cv.part({ ol: 'none' });
        cv.stroke([[14.6, 21.0], [15.6, 25.2]], 0.24, T.lanyard, { n: [0, 0] });
        cv.stroke([[17.4, 21.0], [16.4, 25.2]], 0.24, T.lanyard, { n: [0, 0] });
        idCard(cv, 16, 25.2, T.lanyard);
      }
      break;
    }
    case 'okan': {
      // 白い ブラウスの V・カーディガンの まえの ふち（エプロンの むねあての すぐ よこに 見える）・こしの ポケット
      cv.part({ ol: 'line' });
      cv.poly([[14.3, 21.0], [17.7, 21.0], [16.0, 24.0]], T.blouse, { n: [0, -0.1] });
      for (const s of [-1, 1]) {
        cv.part({ ol: 'none', clip: base });
        cv.stroke([[16 + s * 1.7, 21.0], [16 + s * 3.1, 23.4], [16 + s * 3.75, 28.2], [16 + s * 4.0, 31.4]], 0.45, T.edge, { n: [0, 0] });
        cv.crease([[16 + s * 3.9, 29.4], [16 + s * 5.2, 29.4]], 0.18, -0.4, { parts: [base] });
      }
      buttons(cv, [[13.2, 24.6], [12.9, 27.0], [12.8, 29.4]], null, cloth('#f2e2c0'));
      break;
    }
    case 'leopard': {
      // まるい えりぐり（はだ）と 金の くさりの ネックレス（necklace）
      cv.part({ ol: 'soft' });
      cv.poly([[14.2, 21.0], [17.8, 21.0], [17.3, 22.3], [16, 22.9], [14.7, 22.3]], O.skin, { n: [0, 0.2] });
      cv.crease([[11.8, 30.2], [20.2, 30.2]], 0.26, -0.3, { parts: [base] });
      if (T.necklace) {
        chain(cv, [[14.0, 21.1], [16.0, 24.4], [18.0, 21.1]], T.necklace);
        cv.part({ ol: 'line' });
        cv.ell(16.0, 24.6, 0.62, 0.68, T.necklace, { bulge: 0.9 });
      }
      break;
    }
    case 'shirt': {
      // ひらいた えり（はだ）・ボタンの あわせ・ひだりむねの ポケットと 金の 星の バッジ・はたらきすぎの しわ
      cv.part({ ol: 'soft' });
      cv.poly([[14.7, 21.0], [17.3, 21.0], [16.0, 23.5]], O.skin, { n: [0, 0.2] });
      cv.crease([[16.25, 23.5], [16.25, T.hem - 0.3]], 0.2, -0.42, { parts: [base] });
      buttons(cv, [[16.75, 24.7], [16.75, 26.5], [16.75, 28.3]], null, T.btn);
      cv.crease([[17.7, 24.6], [19.9, 24.6]], 0.18, -0.42, { parts: [base] });
      cv.crease([[17.7, 24.6], [17.75, 26.6], [19.85, 26.6], [19.9, 24.6]], 0.15, -0.3, { parts: [base] });
      for (const s of [-1, 1]) cv.crease([[16 + s * 2.4, 27.2], [16 + s * 4.0, 29.2]], 0.18, -0.3, { parts: [base] });
      if (T.badge) emblem(cv, 18.8, 23.0, 'starbadge', O);
      break;
    }
    case 'hakai': {
      // すその 金の ふち・まんなかの すじ（えりと おびは あとで）
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.85, 16, 0.85, T.trim, { n: [0, 0.2] });
      cv.crease([[16, 25.4], [16, 28.0]], 0.22, -0.35, { parts: [base] });
      for (const s of [-1, 1]) cv.crease([[16 + s * 3.0, 26.0], [16 + s * 3.8, 28.0]], 0.18, -0.3, { parts: [base] });
      break;
    }
    case 'kid': {
      // まるい えりは 首の まえ（drawNeckwear）。名札と むねポケット・ボタン
      if (T.pocket) cv.crease([[13.0, 25.0], [14.8, 25.0]], 0.2, -0.45, { parts: [base] });
      if (!T.bow) buttons(cv, [[16.0, 23.6], [16.0, 25.2], [16.0, 26.8]], '#b8b8c4');
      nameTag(cv, 18.4, 24.0, '#3a7ad8');
      break;
    }
    case 'gakuran': {
      // 学ラン: まんなかの あわせと 金の ボタン（つめえりは drawNeckwear）
      cv.crease([[16, 22.0], [16, 31.4]], 0.24, -0.45, { parts: [base] });
      cv.crease([[17.6, 24.2], [19.6, 24.2]], 0.2, -0.4, { parts: [base] });
      buttons(cv, [[16.0, 22.9], [16.0, 24.5], [16.0, 26.1], [16.0, 27.7], [16.0, 29.3]], null, T.gold);
      break;
    }
    case 'work': {
      // 防災服: えり・チャック・むねポケット・名札・ひかる おび
      if (T.tie) {
        // えりを ひらいて、しろい シャツと ネクタイ（たたき上げ社長）
        cv.part({ ol: 'line' });
        cv.poly([[14.4, 21.0], [17.6, 21.0], [16.9, 24.8], [16, 25.8], [15.1, 24.8]], T.shirt, { n: [0, -0.1] });
        cv.part({ ol: 'soft' });
        cv.poly([[15.55, 21.4], [16.45, 21.4], [16.65, 24.8], [16, 25.7], [15.35, 24.8]], T.tie, { cx: 0.6 });
        cv.part({ ol: 'line' });
        for (const s of [-1, 1]) cv.poly([[16 + s * 1.7, 20.6], [16 + s * 3.4, 20.7], [16 + s * 4.0, 22.2], [16 + s * 1.3, 25.9], [16 + s * 1.6, 23.0]], T.collar, { n: [s * 0.3, -0.2] });
        if (T.pin) { cv.part({ ol: 'soft' }); cv.ell(18.6, 22.3, 0.5, 0.5, metal('gold'), { bulge: 0.9 }); }
      } else {
        cv.part({ ol: 'line' });
        cv.poly([[13.2, 20.6], [15.0, 20.8], [16, 22.8], [17.0, 20.8], [18.8, 20.6], [19.6, 22.0], [16.4, 23.6], [15.6, 23.6], [12.4, 22.0]], T.collar, { cx: 0.6 });
      }
      const colId = cv.cur;
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[16, T.tie ? 25.9 : 23.2], [16, 31.2]], 0.22, T.zip, { n: [0, 0] });
      for (const s of [-1, 1]) {
        cv.crease([[16 + s * 1.2, 24.0], [16 + s * 3.8, 24.0]], 0.2, -0.45, { parts: [base] });
        cv.crease([[16 + s * 1.2, 24.0], [16 + s * 1.2, 26.2], [16 + s * 3.8, 26.2], [16 + s * 3.8, 24.0]], 0.16, -0.35, { parts: [base] });
      }
      if (T.piping) {
        // 水色の ふち（えり・あわせの 2本・ポケットの ふた）と むねの ひしがた
        cv.part({ ol: 'none', clip: colId });
        cv.stroke([[12.5, 21.9], [15.7, 23.5]], 0.22, T.piping, { n: [0, 0] });
        cv.stroke([[16.3, 23.5], [19.5, 21.9]], 0.22, T.piping, { n: [0, 0] });
        cv.part({ ol: 'none', clip: base });
        for (const s of [-1, 1]) {
          cv.stroke([[16 + s * 0.55, 23.4], [16 + s * 0.55, 31.2]], 0.15, T.piping, { n: [0, 0] });
          cv.stroke([[16 + s * 1.25, 24.1], [16 + s * 3.75, 24.1]], 0.17, T.piping, { n: [0, 0] });
        }
        if (T.mark === 'diamond') emblem(cv, 18.5, 25.25, 'diamond', O, false, null, T.piping);
        else if (T.mark === 'chip') emblem(cv, 18.5, 25.15, 'chip', O, false, null, T.piping);
      }
      if (T.band) {
        for (const y of [27.0, 29.4]) { cv.part({ ol: 'none', clip: base }); cv.rect(9, y, 14, 0.85, T.band, { n: [0, -0.2] }); }
      }
      if (T.tag) nameTag(cv, 18.4, 23.4, '#3aa060');
      if (T.fire) emblem(cv, 13.6, 24.8, 'firebadge', O);
      break;
    }
    case 'stage': {
      // アラシ: 白い シャツと 服の 色の スカーフ、銀の ふちの えり、むねに 金の いなずま
      cv.part({ ol: 'line' });
      cv.poly([[14.2, 21.0], [17.8, 21.0], [17.0, 26.4], [16, 27.6], [15.0, 26.4]], T.shirt, { n: [0, -0.1] });
      cv.part({ ol: 'soft' });
      cv.poly([[15.1, 21.2], [16.9, 21.2], [17.3, 22.8], [16.6, 25.4], [16, 25.0], [15.4, 25.4], [14.7, 22.8]], T.scarf, { cx: 0.7 });
      cv.part({ ol: 'line' });
      const lp = [[14.2, 21.0], [12.8, 21.5], [13.2, 23.4], [14.4, 23.6], [15.4, 27.2], [15.0, 26.4]];
      const rp = lp.map(([x, y]) => [32 - x, y]);
      cv.poly(lp, O.top, { n: [-0.3, -0.2], tex: tex.sequin(k) });
      const lid = cv.cur;
      cv.part({ ol: 'line' });
      cv.poly(rp, O.top, { n: [0.3, -0.2], tex: tex.sequin(k) });
      const rid = cv.cur;
      cv.part({ ol: 'none', clip: [lid, rid] });
      cv.stroke([[14.4, 21.0], [15.2, 26.6]], 0.3, T.trim, { n: [0, 0] });
      cv.stroke([[17.6, 21.0], [16.8, 26.6]], 0.3, T.trim, { n: [0, 0] });
      emblem(cv, 18.9, 25.0, 'bolt', O, false, null, T.bolt);
      buttons(cv, [[16.0, 28.6]], null, T.trim);
      break;
    }
    case 'sailor': {
      const y0 = 22.8;
      if (T.stripe) for (let y = y0; y < 30.6; y += 1.6) { cv.part({ ol: 'none', clip: base }); cv.rect(10, y, 12, 0.6, T.stripe, { cx: 0.85 }); }
      cv.part({ ol: 'line' });
      cv.poly([[13.0, 20.8], [19.0, 20.8], [20.6, 22.8], [16, 25.6], [11.4, 22.8]], T.collar, { cx: 0.6 });
      if (T.line) {
        // えりの 白い 線
        const cid = cv.cur;
        cv.part({ ol: 'none', clip: cid });
        cv.stroke([[12.2, 22.6], [16, 24.9], [19.8, 22.6]], 0.2, T.line, { n: [0, 0] });
      }
      cv.part({ ol: 'soft' });
      cv.poly([[14.6, 20.8], [17.4, 20.8], [16, 23.0]], O.skin, { n: [0, 0.2] });
      cv.part({ ol: 'line' });
      cv.poly([[15.0, 24.6], [17.0, 24.6], [17.4, 26.6], [16, 27.4], [14.6, 26.6]], T.scarf, { cx: 0.6 });
      cv.ell(16, 24.8, 1.0, 0.75, T.scarf, { bulge: 0.6 });
      break;
    }
    case 'jester': {
      cv.part({ ol: 'none', clip: base });
      cv.poly([[16, 20.0], [23.0, 20.0], [23.0, 32.0], [16, 32.0]], T.c2, { cx: 0.5 });
      // ひしがた
      cv.part({ ol: 'soft' });
      for (const [x, y, c] of [[13.0, 25.0, T.c2], [19.0, 27.4, O.top]]) cv.poly([[x, y - 1.6], [x + 1.2, y], [x, y + 1.6], [x - 1.2, y]], c, { n: [0, 0] });
      cv.part({ ol: 'line' });
      for (let i = -3; i <= 3; i++) cv.ell(16 + i * 1.3, 21.0 + Math.abs(i) * 0.12, 1.0, 0.8, T.ruff, { bulge: 0.6 });
      break;
    }
    case 'dress': {
      cv.part({ ol: 'soft' });
      cv.poly([[14.0, 21.0], [18.0, 21.0], [17.4, 22.4], [14.6, 22.4]], O.skin, { cx: 0.4 });
      cv.part({ ol: 'line' });
      cv.poly([[13.2, 21.0], [18.8, 21.0], [18.6, 21.9], [13.4, 21.9]], T.trim, { cx: 0.5 });
      cv.part({ ol: 'line' });
      cv.ell(16, 23.8, 1.0, 0.85, T.bow, { bulge: 0.6 });
      for (const s of [-1, 1]) cv.poly([[16, 23.8], [16 + s * 2.4, 22.6], [16 + s * 2.6, 25.0]], T.bow, { cx: 0.6 });
      if (T.pop) {
        // むねの イチゴの ブローチと キラキラ
        fruitIcon(cv, 16, 23.9, 'berry', 0.75);
        sparkleDots(cv, [[13.0, 23.2], [19.2, 26.6], [12.8, 27.2]]);
      }
      break;
    }
    case 'uniform': {
      cv.part({ ol: 'line' });
      // 警察官は えりを ひらいて、水色の シャツと ネクタイが 見える
      if (T.police || T.tie) cv.poly([[14.2, 21.0], [17.8, 21.0], [17.0, 23.8], [16, 24.8], [15.0, 23.8]], T.shirt, { n: [0, -0.1] });
      else cv.poly([[14.8, 21.0], [17.2, 21.0], [16, 22.8]], T.shirt, { n: [0, -0.1] });
      if (T.tie) { cv.part({ ol: 'soft' }); cv.poly([[15.6, 21.4], [16.4, 21.4], [16.55, 23.6], [16, 24.5], [15.45, 23.6]], T.tie, { cx: 0.5 }); }
      cv.crease([[16, 22.8], [16, 30.8]], 0.25, -0.35, { parts: [base] });
      buttons(cv, [[17.0, 24.2], [17.0, 26.2], [17.0, 28.2]], null, T.gold);
      if (T.badge) emblem(cv, 13.7, 24.4, 'policebadge', O, false, null, T.badge);
      else for (const s of [-1, 1]) { cv.part({ ol: 'soft' }); cv.rect(16 + s * 3.4 - 0.6, 21.4, 1.2, 0.8, T.gold); }
      break;
    }
    case 'baseball': {
      cv.part({ ol: 'soft' });
      cv.poly([[14.8, 21.0], [17.2, 21.0], [16, 22.8]], O.skin, { n: [0, 0.2] });
      cv.part({ ol: 'none' });
      cv.stroke([[13.6, 21.0], [16, 23.2], [18.4, 21.0]], 0.35, T.trim, { n: [0, 0] });
      cv.stroke([[16, 23.2], [16, 28.4]], 0.3, T.trim, { n: [0, 0] });
      // むねの マーク
      cv.part({ ol: 'none', cast: false });
      cv.stroke([[18.0, 24.4], [19.4, 24.0], [18.2, 25.6], [19.6, 25.4]], 0.32, T.trim, { n: [0, 0] });
      break;
    }
    case 'hakama': {
      cv.part({ ol: 'soft' });
      cv.poly([[14.6, 21.0], [17.4, 21.0], [16.2, 24.0]], O.skin, { n: [0, 0.2] });
      cv.part({ ol: 'line' });
      cv.stroke([[13.6, 21.0], [16.2, 24.2], [18.2, 28.0]], 0.55, T.collar, { n: [0, -0.1] });
      cv.stroke([[18.4, 21.0], [16.6, 23.4]], 0.5, T.collar, { n: [0, -0.1] });
      break;
    }
    case 'yoroi': {
      // いたを ひもで つないだ どう
      for (const y of [23.2, 25.0, 26.8]) cv.crease([[11, y], [21, y]], 0.25, -0.65, { parts: [base] });
      cv.part({ ol: 'none', cast: false });
      for (const x of [13.4, 16.0, 18.6]) for (const y of [24.1, 25.9, 27.6]) cv.px(cv.X(x), cv.Y(y), '#e8c050');
      cv.part({ ol: 'line' });
      cv.poly([[13.6, 20.4], [18.4, 20.4], [19.0, 21.8], [13.0, 21.8]], T.lace, { cx: 0.5 });
      break;
    }
    case 'vest': {
      cv.part({ ol: 'line' });
      for (const s of [-1, 1]) cv.poly([[16 + s * 1.4, 21.0], [16 + s * (f ? 4.7 : 5.2), 21.0], [16 + s * (f ? 5.7 : 6.3), 22.4], [16 + s * (f ? 5.0 : 5.6), 24.6], [16 + s * (f ? 4.3 : 4.9), 28.4], [16 + s * (f ? 4.6 : 5.2), 31.0], [16 + s * 2.2, 31.0], [16 + s * 1.6, 26.0]], T.vest, { cx: 0.6 });
      cv.part({ ol: 'soft' });
      cv.poly([[15.2, 21.0], [16.8, 21.0], [16.0, 23.0]], O.skin, { n: [0, 0.2] });
      break;
    }
    case 'chef': {
      // ダブルの うちあわせ（えりから ななめに おりて、たてに すそまで）と 2れつの ボタン（たての えりは drawNeckwear）
      cv.crease([[17.8, 21.4], [14.6, 22.9], [14.2, 23.6], [14.1, 30.8]], 0.24, -0.5, { parts: [base] });
      cv.crease([[14.5, 23.9], [14.4, 30.6]], 0.16, 0.3, { parts: [base] });
      buttons(cv, [[15.0, 23.8], [17.4, 23.8], [15.0, 25.6], [17.4, 25.6], [15.0, 27.3], [17.4, 27.3]], null, T.btn);
      break;
    }
    case 'store': {
      // たての しま（ベストの うえ だけ）・V の えりから Tシャツ・まんなかの チャック・名札
      stripes(cv, base, T.stripe, 16, f ? 5.7 : 6.3, 0);
      cv.part({ ol: 'line' });
      cv.poly([[14.1, 21.0], [17.9, 21.0], [16, 24.6]], T.tee, { n: [0, -0.1] });
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[16, 24.6], [16, 30.8]], 0.2, T.zip, { n: [0, 0] });
      nameTag(cv, 18.7, 24.8, T.tagc);
      break;
    }
    case 'saiyan': {
      // クリーム色の むねあて（むねの もりあがりと まんなかの すじ）・くびの まわりは こんの 服
      const w = f ? 4.7 : 5.3;
      cv.part({ ol: 'line' });
      cv.poly([[16 - w + 0.7, 21.3], [16 - 1.9, 21.1], [16, 22.3], [16 + 1.9, 21.1], [16 + w - 0.7, 21.3], [16 + w + 0.5, 23.0], [16 + w + 0.2, 25.6], [16 + w - 0.5, 28.6], [16 - w + 0.5, 28.6], [16 - w - 0.2, 25.6], [16 - w - 0.5, 23.0]], T.plate, { n: 'bevel', bw: 1.0, bs: 0.7, tilt: [0, -0.04] });
      const id = cv.cur;
      cv.crease([[16, 22.6], [16, 28.3]], 0.26, -0.42, { parts: [id] });
      cv.crease([[16 - w + 1.1, 25.2], [16 - 2.6, 25.9], [16 - 0.5, 25.6]], 0.24, -0.38, { parts: [id] });
      cv.crease([[16 + 0.5, 25.6], [16 + 2.6, 25.9], [16 + w - 1.1, 25.2]], 0.24, -0.38, { parts: [id] });
      cv.crease([[16 - w + 0.9, 23.2], [16 - 1.6, 22.8]], 0.34, 0.34, { parts: [id] });
      // こしの ふちの ライン（きいろっぽい 茶色）
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[16 - w + 0.4, 28.2], [16 + w - 0.4, 28.2]], 0.42, T.brown, { n: [0, 0.2] });
      break;
    }
    case 'jersey': {
      // はんぶん あけた チャック（うえは Tシャツ）・チャックの つまみ・よこの ポケット・だらっと した しわ
      cv.part({ ol: 'line' });
      cv.poly([[14.2, 21.0], [17.8, 21.0], [16.7, 25.3], [15.3, 25.3]], T.tee, { n: [0, -0.1] });
      cv.crease([[15.0, 21.2], [16.0, 21.9], [17.0, 21.2]], 0.2, -0.4, { parts: [cv.cur] });
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[16, 25.2], [16, 31.0]], 0.2, T.zip, { n: [0, 0] });
      cv.part({ ol: 'soft' });
      cv.rect(15.75, 25.3, 0.5, 1.15, T.zip, { n: [0, -0.2] });
      for (const s of [-1, 1]) {
        cv.crease([[16 + s * 3.0, 28.0], [16 + s * 4.0, 30.4]], 0.18, -0.45, { parts: [base] });
        cv.crease([[16 + s * 1.2, 27.4], [16 + s * 2.6, 28.4]], 0.2, -0.3, { parts: [base] });
      }
      cv.crease([[12.2, 30.6], [19.8, 30.6]], 0.3, -0.35, { parts: [base] });
      break;
    }
    case 'coat': {
      // たかい えりの なか（くらい シャツ）・ダブルの まえあわせと ぎんの ボタン・むねの くさり
      cv.part({ ol: 'line' });
      cv.poly([[14.7, 21.0], [17.3, 21.0], [16.0, 22.9]], T.shirt, { n: [0, -0.1] });
      cv.crease([[17.4, 21.6], [17.3, 28.2]], 0.26, -0.5, { parts: [base] });
      cv.crease([[17.7, 21.6], [17.6, 28.2]], 0.16, 0.3, { parts: [base] });
      buttons(cv, [[14.9, 23.4], [18.4, 23.4], [14.9, 25.6], [18.4, 25.6]], null, T.chain);
      chain(cv, [[18.4, 25.6], [17.0, 27.0], [15.2, 27.3], [13.4, 26.4]], T.chain);
      break;
    }
    case 'rubber': {
      // はだの むね（男の子）・しろい タンクトップ（女の子）・まえを あけた ベスト
      if (!f) {
        cv.crease([[16, 23.6], [16, 27.4]], 0.2, -0.28, { parts: [base] });
        for (const s of [-1, 1]) cv.crease([[16 + s * 0.6, 25.0], [16 + s * 2.4, 25.2]], 0.22, -0.3, { parts: [base] });
      } else {
        cv.part({ ol: 'soft' });
        cv.poly([[14.2, 21.0], [17.8, 21.0], [17.2, 22.5], [14.8, 22.5]], O.skin, { cx: 0.4 });
      }
      const fl = T.loose ? 0.9 : 0;
      const sw = P.f === 0 ? 0.2 : -0.2;
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 2.0, 21.0], [16 + s * (f ? 4.7 : 5.2), 21.0], [16 + s * (f ? 5.8 : 6.4), 22.4], [16 + s * (f ? 5.1 : 5.7), 24.6], [16 + s * (f ? 4.5 : 5.0) + s * fl, 28.4], [16 + s * (f ? 4.9 : 5.4) + s * fl * 1.4 + sw, 30.0], [16 + s * (3.6 + fl * 0.6) + sw, 30.2], [16 + s * 3.0, 26.0]], T.vest, { cx: 0.6 });
        const id = cv.cur;
        cv.crease([[16 + s * 3.4, 22.6], [16 + s * 3.6, 29.4]], 0.18, -0.3, { parts: [id] });
        if (!T.loose && s < 0) buttons(cv, [[16 + s * 3.0, 23.6], [16 + s * 3.15, 25.6], [16 + s * 3.35, 27.6]], null, T.btn);
      }
      break;
    }
    case 'hoodie': {
      // すその リブ・まえの ポケット・ロゴ（しろい さいせいボタン）・ネオンの 線
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.95, 16, 1.0, T.rib, { n: [0, 0.25] });
      if (T.neon) {
        for (const [j, m] of T.neon.entries()) {
          cv.part({ ol: 'none', clip: base });
          cv.stroke([[10.6, 23.0 + j * 1.25], [16.0, 24.7 + j * 1.25], [21.4, 23.0 + j * 1.25]], 0.3, m, { n: [0, 0] });
        }
      }
      cv.part({ ol: 'line' });
      cv.poly([[13.2, 27.0], [18.8, 27.0], [19.6, 29.9], [12.4, 29.9]], O.top, { cx: 0.75, cy: 0.3 });
      const pid = cv.cur;
      for (const s of [-1, 1]) cv.crease([[16 + s * 2.9, 27.2], [16 + s * 3.5, 29.7]], 0.2, -0.45, { parts: [pid] });
      if (T.logo) playLogo(cv, 16, 24.0, 1);
      break;
    }
    case 'gamer': {
      // Tシャツの ドットの ハート・まえを あけた チェックの シャツ（えり つき）
      pixelHeart(cv, 16, 24.6);
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 2.3, 21.0], [16 + s * (f ? 4.7 : 5.2), 21.0], [16 + s * (f ? 5.7 : 6.3), 22.4], [16 + s * (f ? 5.0 : 5.6), 24.6], [16 + s * (f ? 4.3 : 4.9), 28.4], [16 + s * (f ? 5.0 : 5.5), 31.2], [16 + s * 3.0, 31.2], [16 + s * 2.6, 26.0]], T.shirt, { cx: 0.6, tex: tex.plaid(k) });
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 1.6, 20.7], [16 + s * 3.4, 20.8], [16 + s * 3.0, 23.0], [16 + s * 2.4, 22.6]], T.shirt, { n: [s * 0.3, -0.2] });
      }
      break;
    }
    case 'esports': {
      // わきの 赤い おび・むねの ななめの 2本線・むねの チームの しるし（赤い やじるし）
      for (const s of [-1, 1]) {
        cv.part({ ol: 'none', clip: base });
        cv.poly([[16 + s * 4.3, 22.0], [16 + s * 9, 22.0], [16 + s * 9, 32], [16 + s * 4.0, 32]], T.trim, { n: [s * 0.5, 0] });
      }
      for (const [j, m] of [T.trim, T.white].entries()) {
        cv.part({ ol: 'none', clip: base });
        cv.stroke([[10.0, 28.6 - j * 0.9], [22.0, 24.4 - j * 0.9]], j ? 0.2 : 0.42, m, { n: [0, 0] });
      }
      cv.part({ ol: 'line' });
      cv.poly([[17.4, 22.4], [19.6, 22.4], [19.2, 23.4], [18.5, 24.4], [17.8, 23.4]], T.trim, { n: 'bevel', bw: 0.3 });
      break;
    }
    default:
  }
  if (O.mantle) mantleFront(cv, P, O);
  if (O.scarf) scarfFront(cv, P, O);
}

// しわしわの スーツ（社ちく。view: 'front' / 'back' / 'side'。X: よこむきの ざひょう）
function suitWrinkles(cv, base, view, X = null, b = 0) {
  const L = view === 'side'
    ? [[[-1.6, 23.6], [-0.2, 25.0]], [[-2.4, 27.4], [-0.8, 28.6]], [[0.4, 29.4], [1.8, 30.4]]].map(([p, q]) => [[X(p[0]), p[1] + b], [X(q[0]), q[1] + b]])
    : view === 'back'
      ? [[[12.6, 23.4], [14.6, 24.8]], [[19.4, 23.6], [17.6, 25.0]], [[13.0, 28.4], [14.8, 29.4]], [[19.0, 28.2], [17.4, 29.4]]]
      : [[[12.4, 27.0], [14.0, 28.4]], [[18.6, 26.8], [19.8, 28.0]], [[12.8, 29.8], [14.4, 30.7]], [[17.8, 29.6], [19.4, 30.8]]];
  for (const [p, q] of L) cv.crease([p, q], 0.2, -0.42, { parts: [base] });
}

// スーパーサイヤ人の 道着の まるい しるし（しろい まる に くろい もじの かわり）
function giMark(cv, x, y, r, m) {
  cv.part({ ol: 'line' });
  cv.ell(x, y, r, r, m, { bulge: 0.6 });
  if (cv.k >= 4) {
    cv.part({ ol: 'none', cast: false });
    const X = cv.X(x), Y = cv.Y(y), q = Math.max(1, Math.round(r * cv.k * 0.45));
    const c = '#2a2430';
    for (let i = -q; i <= q; i++) cv.px(X + i, Y - 1, c);
    for (let j = -q; j <= q; j++) cv.px(X, Y + j, c);
    cv.px(X - q, Y + q - 1, c);
    cv.px(X + q, Y + q - 1, c);
  } else {
    cv.part({ ol: 'none', cast: false });
    cv.px(cv.X(x), cv.Y(y), '#2a2430');
  }
}

// ぎんの くさり（わの つぶを ならべる）
function chain(cv, pts, m) {
  const path = HeroCanvas.bez(pts[0], pts[1], pts[pts.length - 1], 10);
  void pts;
  for (let i = 0; i < path.length; i += 2) {
    cv.part({ ol: 'soft', cast: false });
    cv.ell(path[i][0], path[i][1], 0.36, 0.3, m, { bulge: 0.9 });
  }
}

// さいせいボタン（しろい かどの まるい しかくに 赤い さんかく。s: 大きさ）
function playLogo(cv, x, y, s, tri = '#de2a2e') {
  const w = 1.75 * s, h = 1.2 * s, c = 0.45 * s;
  cv.part({ ol: 'line' });
  cv.poly([[x - w + c, y - h], [x + w - c, y - h], [x + w, y - h + c], [x + w, y + h - c], [x + w - c, y + h], [x - w + c, y + h], [x - w, y + h - c], [x - w, y - h + c]], mat({ r: ramp('#fbfbfd', 4), th: TH.cloth }), { cx: 0.4, cy: 0.3 });
  cv.part({ ol: 'none' });
  cv.poly([[x - 0.55 * s, y - 0.7 * s], [x + 0.75 * s, y], [x - 0.55 * s, y + 0.7 * s]], cloth(tri), { n: [0, 0] });
}

// せなかの 番号（ドットの すうじ。col: もじ、edge: ふち）
const DIGIT = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '010', '010'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
};
function backNumber(cv, x, y, num, col, edge) {
  const z = cv.k >= 4 ? 2 : 1;
  const gw = 3 * z, gap = z;
  const total = num.length * gw + (num.length - 1) * gap;
  const X0 = cv.X(x) - Math.floor(total / 2), Y0 = cv.Y(y) - Math.floor((5 * z) / 2);
  cv.part({ ol: 'none', cast: false });
  for (const pass of [0, 1]) {
    [...num].forEach((d, n) => {
      const g = DIGIT[d] || DIGIT[0];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
        if (g[r][c] !== '1') continue;
        for (let a = 0; a < z; a++) for (let b = 0; b < z; b++) {
          const px = X0 + n * (gw + gap) + c * z + a, py = Y0 + r * z + b;
          if (pass) cv.px(px, py, col);
          else for (const [ox, oy] of [[1, 0], [0, 1], [1, 1]]) cv.px(px + ox, py + oy, edge);
        }
      }
    });
  }
}

// ドットの ハート（ゲームの ライフの しるし）
function pixelHeart(cv, x, y) {
  cv.part({ ol: 'none', cast: false });
  const rows = cv.k >= 4 ? ['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'] : ['RR.RR', 'RRRRR', '.RRR.', '..R..'];
  const pal = { R: '#e8384a', W: '#ffd0d8' };
  cv.stamp(cv.X(x) - Math.floor(rows[0].length / 2), cv.Y(y) - Math.floor(rows.length / 2), rows, pal);
}

function plateFront(cv, P, O, T) {
  const f = P.fem;
  const w = f ? 4.5 : 5.1;
  // むねあて
  cv.part({ ol: 'line' });
  const chest = [[16 - w, 21.8], [16 - 2.2, 21.3], [16 - 1.3, 22.5], [16 + 1.3, 22.5], [16 + 2.2, 21.3], [16 + w, 21.8], [16 + w + 0.5, 24.4], [16 + w - 0.3, 27.4], [16 + w - 1.2, 28.9], [16 - w + 1.2, 28.9], [16 - w + 0.3, 27.4], [16 - w - 0.5, 24.4]];
  cv.poly(chest, O.plate, { n: 'bevel', bw: 1.1, bs: 0.8, tilt: [0, -0.05] });
  const id = cv.cur;
  // まんなかの すじ（みがいた かんじ）
  cv.crease([[16 - 0.3, 22.8], [16 - 0.3, 28.6]], 0.32, 0.45, { parts: [id] });
  cv.crease([[16 + 0.45, 22.8], [16 + 0.45, 28.6]], 0.3, -0.55, { parts: [id] });
  // むねの まるみ（ひかりの おび）
  cv.crease([[16 - w + 1.0, 23.6], [16 - 1.2, 23.2]], 0.42, 0.32, { parts: [id] });
  cv.crease([[16 + 1.2, 26.4], [16 + w - 1.2, 26.8]], 0.4, -0.3, { parts: [id] });
  // ふち（trim）
  if (O.trim) {
    cv.part({ ol: 'none', clip: id });
    cv.stroke([[16 - w + 0.1, 22.0], [16 - 2.2, 21.5], [16 - 1.3, 22.7], [16 + 1.3, 22.7], [16 + 2.2, 21.5], [16 + w - 0.1, 22.0]], 0.42, O.trim, { n: [0, -0.3] });
    cv.stroke([[16 - w + 1.2, 28.7], [16 + w - 1.2, 28.7]], 0.4, O.trim, { n: [0, 0.2] });
  }
  // くび まもり
  cv.part({ ol: 'line' });
  cv.poly([[13.8, 20.4], [18.2, 20.4], [18.8, 21.6], [16, 22.4], [13.2, 21.6]], O.plate, { n: 'bevel', bw: 0.6, bs: 0.7 });
  if (T.holy) emblem(cv, 16, 25.2, 'cross', O);
  else if (T.horn) emblem(cv, 16, 25.4, 'horn', O);
  else if (T.bird) emblem(cv, 16, 25.1, 'bird', O);
  else if (T.stars) emblem(cv, 16, 25.0, 'starbig', O);
  else if (T.gemc) emblem(cv, 16, 24.6, 'gem', O, false, T.gemc);
  else if ((T.rank || 3) >= 3) rivets(cv, [[16 - w + 1.1, 22.8], [16 + w - 1.1, 22.8]], O);
  // 伝説の よろいは きらり と ひかる
  if (T.bird) sparkleDots(cv, [[16 + w - 1.6, 27.4]]);
}

function emblem(cv, x, y, kind, O, small = false, color = null, m = null) {
  const k = cv.k;
  if (kind === 'chip' || kind === 'chipbig') {
    // AIの チップ（こんの しかくに 水色の あしと、まんなかで ひかる まる）
    const z = kind === 'chipbig' ? 1.7 : 1;
    const r = 0.95 * z, pm = m || neon('#28ccff');
    cv.part({ ol: 'none' });
    for (const t of [-0.45, 0.45]) {
      cv.stroke([[x - r - 0.55 * z, y + t * z], [x + r + 0.55 * z, y + t * z]], 0.14 * z, pm, { n: [0, 0] });
      cv.stroke([[x + t * z, y - r - 0.55 * z], [x + t * z, y + r + 0.55 * z]], 0.14 * z, pm, { n: [0, 0] });
    }
    cv.part({ ol: 'line' });
    cv.poly([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]], cloth('#1c2a4a'), { n: 'bevel', bw: 0.25 * z });
    cv.part({ ol: 'none', cast: false });
    cv.ell(x, y, 0.42 * z, 0.42 * z, pm, { n: [0, 0] });
    return;
  }
  if (kind === 'starbadge') {
    // 金の 星の バッジ（したに 赤い リボンが 2本）
    cv.part({ ol: 'soft' });
    for (const s of [-1, 1]) cv.poly([[x + s * 0.12, y + 0.5], [x + s * 0.95, y + 2.3], [x + s * 0.32, y + 2.0], [x, y + 1.0]], cloth('#d8303a'), { n: [0, 0] });
    cv.part({ ol: 'line' });
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.52 : 1.25;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    cv.poly(pts, m || metal('gold'), { n: 'bevel', bw: 0.35 });
    return;
  }
  if (kind === 'diamond' || kind === 'diamondbig') {
    // ひしがたの マーク（◇: そとの ひしがた ＋ なかの くらい ひしがた。よこは からだの はばで ひろがるので ほそめ）
    const z = kind === 'diamondbig' ? 1.75 : 1;
    const rx = 0.92 * z, ry = 1.22 * z;
    cv.part({ ol: 'line' });
    cv.poly([[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]], m || metal('silver'), { n: 'bevel', bw: 0.3 * z });
    cv.part({ ol: 'none' });
    const q = kind === 'diamondbig' ? 0.5 : 0.42;
    cv.poly([[x, y - ry * q], [x + rx * q, y], [x, y + ry * q], [x - rx * q, y]], O.top || cloth('#1c2a58'), { n: [0, 0], bias: -0.25 });
    return;
  }
  if (kind === 'horn') {
    // 魔王の しるし（金の つのが 2本 はえた かざりと 赤い 宝石）
    cv.part({ ol: 'line' });
    cv.poly([[x - 1.1, y + 0.4], [x - 1.9, y - 0.8], [x - 2.5, y - 2.9], [x - 1.2, y - 1.7], [x - 0.5, y - 1.1], [x, y - 1.5], [x + 0.5, y - 1.1], [x + 1.2, y - 1.7], [x + 2.5, y - 2.9], [x + 1.9, y - 0.8], [x + 1.1, y + 0.4], [x, y + 1.9]], m || O.trim || metal('gold'), { n: 'bevel', bw: 0.4 });
    cv.part({ ol: 'none' });
    cv.ell(x, y - 0.1, 0.72, 0.78, gem('#e8203a'), { bulge: 0.9 });
    return;
  }
  if (kind === 'school') {
    // 校章（小さな たての 形）
    cv.part({ ol: 'line' });
    cv.poly([[x - 1.0, y - 1.0], [x + 1.0, y - 1.0], [x + 1.0, y + 0.3], [x, y + 1.2], [x - 1.0, y + 0.3]], metal('gold'), { n: 'bevel', bw: 0.35 });
    cv.part({ ol: 'none' });
    cv.ell(x, y - 0.1, 0.42, 0.42, cloth('#2a3a8a'), { bulge: 0.6 });
    return;
  }
  if (kind === 'bolt') {
    // いなずま
    cv.part({ ol: 'line' });
    cv.poly([[x + 0.3, y - 1.9], [x - 1.0, y + 0.2], [x - 0.1, y + 0.2], [x - 0.6, y + 1.9], [x + 1.0, y - 0.4], [x + 0.1, y - 0.4], [x + 0.9, y - 1.9]], m || metal('gold'), { n: 'bevel', bw: 0.3 });
    return;
  }
  if (kind === 'policebadge') {
    // 金の 星の バッジ
    cv.part({ ol: 'line' });
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.55 : 1.25;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    cv.poly(pts, m || metal('gold'), { n: 'bevel', bw: 0.3 });
    return;
  }
  if (kind === 'firebadge') {
    // 消防の ワッペン（オレンジの まるに ほのお）
    cv.part({ ol: 'line' });
    cv.ell(x, y, 1.1, 1.1, cloth('#f07a2a'), { bulge: 0.5 });
    cv.part({ ol: 'none' });
    cv.poly([[x, y - 0.8], [x + 0.5, y + 0.1], [x + 0.2, y + 0.6], [x - 0.2, y + 0.6], [x - 0.5, y + 0.1]], cloth('#fff0a0'), { n: [0, 0] });
    return;
  }
  if (kind === 'cross') {
    cv.part({ ol: 'line' });
    const c = O.trim || metal('gold');
    const s = small ? 0.8 : 1;
    cv.poly([[x - 0.45 * s, y - 2.0 * s], [x + 0.45 * s, y - 2.0 * s], [x + 0.45 * s, y - 0.7 * s], [x + 1.5 * s, y - 0.7 * s], [x + 1.5 * s, y + 0.2 * s], [x + 0.45 * s, y + 0.2 * s], [x + 0.45 * s, y + 2.2 * s], [x - 0.45 * s, y + 2.2 * s], [x - 0.45 * s, y + 0.2 * s], [x - 1.5 * s, y + 0.2 * s], [x - 1.5 * s, y - 0.7 * s], [x - 0.45 * s, y - 0.7 * s]], c, { n: 'bevel', bw: 0.4 });
  } else if (kind === 'star' || kind === 'starbig') {
    cv.part({ ol: kind === 'star' ? 'soft' : 'line' });
    const r = kind === 'starbig' ? 1.9 : 1.3;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    cv.poly(pts, metal('gold'), { n: 'sphere', cx: 0.6 });
  } else if (kind === 'gem') {
    cv.part({ ol: 'line' });
    cv.poly([[x - 1.6, y], [x, y - 1.3], [x + 1.6, y], [x, y + 1.5]], m || O.trim || metal('gold'), { n: 'bevel', bw: 0.5 });
    cv.part({ ol: 'none' });
    cv.ell(x, y + 0.05, 0.85, 0.85, gem(color || '#5ac8ff'), { bulge: 0.9 });
  } else if (kind === 'bird') {
    // ロトのしるし（つばさを ひろげた 金の 鳥。みぎ はんぶんを かがみに うつす）
    const R = [[0, -2.6], [0.5, -2.2], [0.45, -1.4], [1.3, -1.6], [2.2, -2.3], [3.0, -2.6], [2.4, -1.5], [2.8, -1.1], [2.0, -0.5], [2.2, -0.1], [0.75, 0.1], [0.6, 0.8], [1.4, 2.1], [0.45, 1.6], [0, 2.5]];
    const pts = [...R.map(([a, b]) => [x + a, y + b]), ...R.slice(1, -1).reverse().map(([a, b]) => [x - a, y + b])];
    cv.part({ ol: 'line' });
    cv.poly(pts, m || metal('gold'), { n: 'bevel', bw: 0.4 });
    const id = cv.cur;
    for (const s of [-1, 1]) cv.crease([[x + s * 0.55, y - 1.2], [x + s * 0.7, y + 0.5]], 0.16, -0.4, { parts: [id] });
  } else if (kind === 'crest') {
    cv.part({ ol: 'line' });
    cv.poly([[x - 1.4, y - 1.4], [x + 1.4, y - 1.4], [x + 1.3, y + 0.4], [x, y + 1.8], [x - 1.3, y + 0.4]], metal('gold'), { n: 'bevel', bw: 0.45 });
    cv.part({ ol: 'none' });
    cv.ell(x, y - 0.1, 0.55, 0.55, gem('#e04040'), { bulge: 0.9 });
  } else if (kind === 'dragon') {
    cv.part({ ol: 'none', cast: false });
    const c = metal('gold');
    cv.stroke([[x - 0.6, y - 2.0], [x + 0.8, y - 1.0], [x - 0.4, y + 0.2], [x + 0.9, y + 1.4], [x - 0.2, y + 2.4]], 0.34, c, { n: [0, -0.3] });
    cv.ell(x - 0.7, y - 2.1, 0.55, 0.45, c, { bulge: 0.6 });
  } else if (kind === 'wave') {
    cv.part({ ol: 'none', cast: false });
    const c = mat({ r: ramp('#eaf6ff', 4), th: TH.cloth });
    for (const dy of [-1.0, 0.8]) cv.stroke([[x - 1.6, y + dy], [x - 0.6, y + dy - 0.6], [x + 0.4, y + dy], [x + 1.4, y + dy - 0.6]], 0.3, c, { n: [0, 0] });
  } else if (kind === 'shell') {
    cv.part({ ol: 'line' });
    cv.poly([[x - 1.6, y - 0.4], [x, y - 1.6], [x + 1.6, y - 0.4], [x + 0.8, y + 1.2], [x - 0.8, y + 1.2]], mat({ r: ramp('#fff0e8', 4), th: TH.cloth }), { cx: 0.6 });
    const id = cv.cur;
    for (const dx of [-0.8, 0, 0.8]) cv.crease([[x, y + 1.1], [x + dx * 1.6, y - 1.2]], 0.2, -0.45, { parts: [id] });
  }
  void k;
}

// たての しま（clip: この パーツの うえ だけ。ひかりの むきは からだの まるみに あわせる）
// cx: からだの まんなか（ここは しまの あいだ）  half: からだの はばの はんぶん  b: よこむきの ゆれ
function stripes(cv, clip, m, cx, half, b = 0) {
  for (let i = -5; i <= 4; i++) {
    const x = cx + 0.7 + 2.0 * i;
    const nx = Math.max(-0.9, Math.min(0.9, ((x + 0.5 - cx) / half) * 0.85));
    cv.part({ ol: 'none', clip });
    cv.rect(x, 19.6 + b, 1.0, 13.0, m, { n: [nx, 0.06] });
  }
}

// 名札（白い ふだに 色の 線）
function nameTag(cv, x, y, c) {
  cv.part({ ol: 'line' });
  cv.poly([[x - 1.0, y - 0.55], [x + 1.0, y - 0.55], [x + 1.0, y + 0.55], [x - 1.0, y + 0.55]], mat({ r: ramp('#f8f8fa', 4), th: TH.cloth }), { cx: 0.3, cy: 0.2 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.rect(x - 1.2, y - 0.7, 2.4, 0.45, cloth(c), { n: [0, 0] });
  if (cv.k >= 4) {
    cv.part({ ol: 'none', cast: false, clip: id });
    cv.line(cv.X(x - 0.6), cv.Y(y + 0.15), cv.X(x + 0.6), cv.Y(y + 0.15), '#6a6a80');
  }
}

// 首から さげる IDカード（うえの 帯は ひもと おなじ 色）
function idCard(cv, x, y, strap) {
  cv.part({ ol: 'line' });
  cv.poly([[x - 1.1, y], [x + 1.1, y], [x + 1.1, y + 2.5], [x - 1.1, y + 2.5]], mat({ r: ramp('#f6f6fa', 4), th: TH.cloth }), { cx: 0.35, cy: 0.2 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.rect(x - 1.2, y - 0.1, 2.4, 0.75, strap, { n: [0, 0] });
  cv.part({ ol: 'none', cast: false, clip: id });
  cv.rect(x - 0.85, y + 1.0, 0.75, 0.9, cloth('#9aa4c0'), { n: [0, 0] });
  if (cv.k >= 4) cv.line(cv.X(x + 0.1), cv.Y(y + 1.3), cv.X(x + 0.8), cv.Y(y + 1.3), '#7a7a90');
}

// 首から さげる 金の メダル（ribbon: リボンの 色  tops: ひもの うえの はし）
function medal(cv, x, y, ribbon, tops) {
  cv.part({ ol: 'soft' });
  for (const [tx, ty] of tops) cv.stroke([[tx, ty], [x + (tx < x ? -0.3 : 0.3), y - 1.0]], 0.34, ribbon, { n: [0, 0] });
  cv.part({ ol: 'line' });
  cv.ell(x, y, 1.35, 1.35, metal('gold'), { bulge: 0.85 });
  const id = cv.cur;
  const ring = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; ring.push([x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9]); }
  cv.crease(ring, 0.14, -0.35, { parts: [id] });
  if (cv.k >= 4) { cv.part({ ol: 'none', cast: false }); cv.px(cv.X(x - 0.35), cv.Y(y - 0.4), '#fffbe0'); }
}

// フルーツの かざり（berry: イチゴ orange: オレンジ grape: ブドウ lemon: レモン）
export function fruitIcon(cv, x, y, kind, s = 1) {
  if (kind === 'berry') {
    cv.part({ ol: 'line' });
    cv.poly([[x - 0.75 * s, y - 0.45 * s], [x, y - 0.65 * s], [x + 0.75 * s, y - 0.45 * s], [x + 0.55 * s, y + 0.4 * s], [x, y + 0.95 * s], [x - 0.55 * s, y + 0.4 * s]], cloth('#f03a4a'), { n: 'sphere', cx: 0.7 });
    cv.part({ ol: 'soft' });
    cv.poly([[x - 0.7 * s, y - 0.6 * s], [x, y - 0.25 * s], [x + 0.7 * s, y - 0.6 * s], [x, y - 0.95 * s]], cloth('#3ab04a'), { n: [0, -0.3] });
    if (cv.k >= 4 && s >= 0.7) { cv.part({ ol: 'none', cast: false }); for (const [a, b] of [[-0.3, 0.05], [0.3, 0.05], [0, 0.45]]) cv.px(cv.X(x + a * s), cv.Y(y + b * s), '#ffe08a'); }
  } else if (kind === 'orange') {
    cv.part({ ol: 'line' });
    cv.ell(x, y, 0.8 * s, 0.8 * s, cloth('#ff9a2a'), { bulge: 0.8 });
    cv.part({ ol: 'none', cast: false });
    cv.ell(x, y, 0.45 * s, 0.45 * s, cloth('#ffd27a'), { n: [0, 0] });
  } else if (kind === 'grape') {
    for (const [a, b] of [[-0.45, -0.4], [0.45, -0.4], [0, 0.05], [-0.45, 0.45], [0.45, 0.45], [0, 0.85]]) {
      cv.part({ ol: 'soft' });
      cv.ell(x + a * s, y + b * s, 0.42 * s, 0.42 * s, cloth('#9a5ad8'), { bulge: 0.9 });
    }
  } else {
    cv.part({ ol: 'line' });
    cv.ell(x, y, 0.85 * s, 0.6 * s, cloth('#ffe23a'), { bulge: 0.8 });
  }
}

// キラキラ（＋の かたちの ひかり。ドットで）
function sparkleDots(cv, list) {
  cv.part({ ol: 'none', cast: false });
  for (const [x, y] of list) {
    const X = cv.X(x), Y = cv.Y(y), r = cv.k >= 4 ? 2 : 1;
    cv.px(X, Y, '#ffffff');
    for (let i = 1; i <= r; i++) { const c = i === r ? '#fff2a0' : '#ffffff'; cv.px(X + i, Y, c); cv.px(X - i, Y, c); cv.px(X, Y + i, c); cv.px(X, Y - i, c); }
  }
}

function stitches(cv, [[x0, y0], [x1, y1]], part) {
  const k = cv.k;
  if (k < 4) return;
  const n = Math.round(Math.hypot(x1 - x0, y1 - y0) * k / 3);
  cv.part({ ol: 'none', cast: false, clip: part });
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    cv.px(cv.X(x0 + (x1 - x0) * t), cv.Y(y0 + (y1 - y0) * t), '#d8b080');
  }
}
function buttons(cv, list, col, m = null) {
  for (const [x, y] of list) {
    cv.part({ ol: m ? 'soft' : 'none', cast: false });
    if (m) cv.ell(x, y, 0.45, 0.45, m, { bulge: 0.8 });
    else cv.px(cv.X(x), cv.Y(y), col);
  }
}
function rivets(cv, list, O) {
  for (const [x, y] of list) {
    cv.part({ ol: 'none' });
    cv.ell(x, y, 0.4, 0.4, O.trim || metal(O.metalK === 'gold' ? 'silver' : 'gold'), { bulge: 0.9 });
  }
}

function mantleFront(cv, P, O) {
  const f = P.fem;
  const w = f ? 6.0 : 6.6;
  cv.part({ ol: 'line' });
  for (const s of [-1, 1]) {
    cv.poly([[16 + s * 1.2, 20.6], [16 + s * (w - 1.6), 20.8], [16 + s * (w + 0.4), 22.6], [16 + s * (w + 0.5), 25.2], [16 + s * (w - 1.2), 24.6], [16 + s * 2.6, 24.0], [16 + s * 1.4, 22.4]], O.mantle.m, { cx: 0.7, cy: 0.4 });
  }
  cv.part({ ol: 'line' });
  cv.ell(16, 22.0, 0.95, 0.85, O.mantle.clasp, { bulge: 0.9 });
}
function scarfFront(cv, P, O) {
  const sw = P.f === 0 ? 1 : -1;
  cv.part({ ol: 'line' });
  cv.poly([[12.8, 20.4], [19.2, 20.4], [19.8, 21.6], [16, 23.0], [12.2, 21.6]], O.scarf.m, { cx: 0.6 });
  cv.part({ ol: 'soft' });
  cv.lock([18.0, 22.4], [20.6 + sw * 0.3, 24.4], [21.4 + sw * 0.6, 27.6], 1.0, 0.55, O.scarf.m2);
}

// ───────────── 首の まえ（neckShape の あとに かく。学ランの つめえり・小学生の えりと リボン） ─────────────
export function drawNeckwear(cv, P, O) {
  const T = O.torso;
  const X = P.X, b = P.bob || 0;
  if (T.bowtie) bowTie(cv, P, T.bowtie);
  if (T.kind === 'chef') {
    // コックの たての えり（gold: 金の ふち）と スカーフの むすびめ
    cv.part({ ol: 'line' });
    if (P.side) cv.poly([[X(-2.3), 19.9 + b], [X(1.9), 20.0 + b], [X(2.4), 21.9 + b], [X(-2.5), 21.8 + b]], T.collar, { cx: 0.6 });
    else if (P.back) cv.poly([[13.4, 19.9], [18.6, 19.9], [18.8, 21.7], [13.2, 21.7]], T.collar, { cx: 0.6 });
    else cv.poly([[13.4, 19.9], [18.6, 19.9], [18.9, 21.6], [16.0, 22.4], [13.1, 21.6]], T.collar, { cx: 0.6 });
    const id = cv.cur;
    if (T.trim) {
      cv.part({ ol: 'none', clip: id });
      if (P.side) cv.stroke([[X(-2.4), 21.5 + b], [X(2.3), 21.55 + b]], 0.28, T.trim, { n: [0, 0.2] });
      else if (P.back) cv.stroke([[13.3, 21.4], [18.7, 21.4]], 0.28, T.trim, { n: [0, 0.2] });
      else cv.stroke([[13.2, 21.3], [16.0, 22.05], [18.8, 21.3]], 0.28, T.trim, { n: [0, 0.2] });
    }
    if (T.neck && !P.back) {
      const sw = P.f === 0 ? 0.15 : -0.15;
      cv.part({ ol: 'line' });
      if (P.side) {
        cv.poly([[X(2.0), 22.5 + b], [X(3.0), 22.7 + b], [X(3.2 + sw), 24.5 + b], [X(2.4), 24.3 + b]], T.neck, { cx: 0.5 });
        cv.part({ ol: 'line' });
        cv.ell(X(2.6), 22.8 + b, 0.6, 0.55, T.neck, { bulge: 0.7 });
      } else {
        for (const s of [-1, 1]) cv.poly([[16 + s * 0.2, 22.9], [16 + s * 1.5 + sw, 24.6], [16 + s * 0.4 + sw, 24.8]], T.neck, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.ell(16, 22.8, 0.75, 0.62, T.neck, { bulge: 0.7 });
      }
    }
    return;
  }
  if (T.kind === 'gakuran') {
    cv.part({ ol: 'line' });
    if (P.side) cv.poly([[X(-2.3), 19.8 + b], [X(1.9), 19.9 + b], [X(2.3), 21.7 + b], [X(-2.5), 21.7 + b]], T.collar, { cx: 0.6 });
    else if (P.back) cv.poly([[13.4, 19.8], [18.6, 19.8], [18.8, 21.6], [13.2, 21.6]], T.collar, { cx: 0.6 });
    else cv.poly([[13.4, 19.8], [18.6, 19.8], [18.8, 21.5], [16.0, 22.1], [13.2, 21.5]], T.collar, { cx: 0.6 });
    const id = cv.cur;
    // うえに 白い カラーが すこし。えりに 金の 校章
    cv.part({ ol: 'none', cast: false, clip: id });
    if (P.side) cv.line(cv.X(X(-2.1)), cv.Y(19.95 + b), cv.X(X(1.7)), cv.Y(20.05 + b), '#f4f4f8');
    else cv.line(cv.X(13.6), cv.Y(19.95), cv.X(18.4), cv.Y(19.95), '#f4f4f8');
    if (!P.back) {
      cv.part({ ol: 'none', cast: false });
      for (const x of P.side ? [X(1.2)] : [14.2, 17.8]) cv.px(cv.X(x), cv.Y(20.9 + b), '#f2c84e');
    }
    return;
  }
  if (T.kind === 'jersey') {
    // ジャージの たての えり（まえは ひらいて おれる。うえの ふちに しろい 線）
    cv.part({ ol: 'line' });
    if (P.side) {
      cv.poly([[X(-2.5), 19.8 + b], [X(1.0), 20.0 + b], [X(2.3), 21.8 + b], [X(-2.7), 21.8 + b]], T.collar, { cx: 0.6 });
      cv.part({ ol: 'none' });
      cv.stroke([[X(-2.4), 20.0 + b], [X(0.9), 20.2 + b]], 0.17, T.line, { n: [0, 0] });
    } else if (P.back) {
      cv.poly([[13.2, 19.9], [18.8, 19.9], [19.0, 21.6], [13.0, 21.6]], T.collar, { cx: 0.6 });
      cv.part({ ol: 'none' });
      cv.stroke([[13.3, 20.1], [18.7, 20.1]], 0.17, T.line, { n: [0, 0] });
    } else {
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 1.5, 20.4], [16 + s * 3.4, 19.9], [16 + s * 3.9, 21.6], [16 + s * 1.9, 23.2]], T.collar, { n: [s * 0.3, -0.2] });
        cv.part({ ol: 'none' });
        cv.stroke([[16 + s * 1.6, 20.5], [16 + s * 3.4, 20.05]], 0.17, T.line, { n: [0, 0] });
      }
    }
    return;
  }
  if (T.kind === 'coat') {
    // たかく たった えり（そとは 黒、うちがわは 赤い うら地）
    if (P.side) {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.2), 21.7 + b], [X(-2.3), 21.9 + b], [X(-3.9), 18.0 + b], [X(-2.0), 17.8 + b], [X(0.4), 19.8 + b]], T.collar, { cx: 0.6 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[X(-1.9), 18.0 + b], [X(0.3), 19.9 + b], [X(1.0), 21.5 + b]], 0.38, T.lining, { n: [0, 0] });
    } else if (P.back) {
      cv.part({ ol: 'line' });
      cv.poly([[12.4, 21.9], [11.4, 18.0], [13.8, 18.5], [16.0, 18.8], [18.2, 18.5], [20.6, 18.0], [19.6, 21.9]], T.collar, { cx: 0.6 });
    } else {
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 1.5, 21.9], [16 + s * 5.2, 21.5], [16 + s * 7.3, 18.2], [16 + s * 5.6, 18.6], [16 + s * 3.2, 19.8], [16 + s * 2.2, 20.6]], T.lining, { n: [s * 0.45, -0.2] });
        const id = cv.cur;
        cv.part({ ol: 'none', clip: id });
        cv.stroke([[16 + s * 5.3, 21.6], [16 + s * 7.2, 18.3]], 0.6, T.collar, { n: [0, 0] });
      }
    }
    return;
  }
  if (T.kind === 'hoodie') {
    // フード（まえ: くびの まわりの ふち と ひも / うしろ: せなかに のる / よこ: くびの うしろの ふくらみ）
    if (P.side) {
      cv.part({ ol: 'line' });
      cv.poly([[X(0.8), 20.2 + b], [X(-2.0), 19.4 + b], [X(-4.0), 20.6 + b], [X(-4.3), 23.4 + b], [X(-2.9), 24.8 + b], [X(-1.2), 23.0 + b], [X(0.9), 22.0 + b]], T.hood, { cx: 0.6 });
      cv.crease([[X(-0.6), 20.2 + b], [X(-2.8), 21.6 + b], [X(-3.0), 24.0 + b]], 0.2, -0.4, { parts: [cv.cur] });
      cv.part({ ol: 'soft' });
      cv.stroke([[X(2.1), 22.0 + b], [X(2.4), 24.2 + b], [X(2.3), 25.4 + b]], 0.15, T.string, { n: [0, 0] });
    } else if (P.back) {
      cv.part({ ol: 'line' });
      cv.poly([[12.0, 20.6], [20.0, 20.6], [20.5, 22.0], [19.3, 24.7], [16.0, 26.2], [12.7, 24.7], [11.5, 22.0]], T.hood, { cx: 0.7, cy: 0.4 });
      const id = cv.cur;
      cv.crease([[16, 21.2], [16, 25.8]], 0.2, -0.45, { parts: [id] });
      cv.crease([[12.4, 21.2], [16.0, 22.0], [19.6, 21.2]], 0.24, -0.35, { parts: [id] });
      if (T.neon) { cv.part({ ol: 'none', clip: id }); cv.stroke([[11.8, 22.2], [12.9, 24.7], [16.0, 26.0], [19.1, 24.7], [20.2, 22.2]], 0.26, T.neon[0], { n: [0, 0] }); }
    } else {
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 1.6, 23.0], [16 + s * 1.9, 21.2], [16 + s * 2.4, 19.9], [16 + s * 4.0, 20.1], [16 + s * 4.6, 21.4], [16 + s * 3.4, 22.6]], T.hood, { n: [s * 0.35, -0.25] });
        if (T.neon) { cv.part({ ol: 'none', clip: cv.cur }); cv.stroke([[16 + s * 1.7, 22.8], [16 + s * 2.0, 21.2], [16 + s * 2.5, 20.0]], 0.24, T.neon[0], { n: [0, 0] }); }
        cv.part({ ol: 'soft' });
        cv.stroke([[16 + s * 1.15, 22.6], [16 + s * 1.25, 24.4], [16 + s * 1.15, 25.4]], 0.15, T.string, { n: [0, 0] });
        cv.part({ ol: 'soft' });
        cv.ell(16 + s * 1.15, 25.6, 0.27, 0.32, T.string, { bulge: 0.6 });
      }
    }
    return;
  }
  if (T.kind === 'gamer') {
    // くびに かけた ヘッドホン（くろに 赤い まんなか）
    if (P.back) {
      cv.part({ ol: 'line' });
      cv.stroke([[12.4, 21.6], [13.8, 20.6], [16, 20.2], [18.2, 20.6], [19.6, 21.6]], 0.42, T.phones, { n: [0, -0.3] });
    } else if (P.side) {
      cv.part({ ol: 'line' });
      cv.stroke([[X(1.4), 21.0 + b], [X(-0.6), 20.2 + b], [X(-2.6), 20.6 + b]], 0.36, T.phones, { n: [0, -0.3] });
      cv.part({ ol: 'line' });
      cv.ell(X(1.7), 21.7 + b, 1.0, 1.15, T.phones, { bulge: 0.8 });
      cv.part({ ol: 'none' });
      cv.ell(X(1.9), 21.7 + b, 0.45, 0.6, T.cup, { bulge: 0.6 });
    } else {
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.ell(16 + s * 2.5, 21.7, 1.15, 1.0, T.phones, { bulge: 0.8 });
        cv.part({ ol: 'none' });
        cv.ell(16 + s * 2.6, 21.75, 0.55, 0.45, T.cup, { bulge: 0.6 });
      }
    }
    return;
  }
  if (T.kind === 'esports' && !P.side) {
    // まるい えりの 赤い ふち
    cv.part({ ol: 'soft' });
    if (P.back) cv.stroke([[13.6, 20.9], [16, 21.3], [18.4, 20.9]], 0.32, T.trim, { n: [0, -0.2] });
    else cv.stroke([[13.8, 20.9], [15.0, 21.9], [16, 22.1], [17.0, 21.9], [18.2, 20.9]], 0.32, T.trim, { n: [0, -0.2] });
    return;
  }
  if (T.kind === 'okan') {
    // ブラウスの まるい しろい えり（まえは 2まいの まるい えり・うしろは おび）
    cv.part({ ol: 'line' });
    if (P.side) cv.poly([[X(-1.6), 20.5 + b], [X(1.6), 20.6 + b], [X(2.6), 21.6 + b], [X(1.4), 22.4 + b], [X(-1.8), 21.8 + b]], T.blouse, { cx: 0.6 });
    else if (P.back) cv.poly([[13.4, 20.5], [18.6, 20.5], [18.8, 21.6], [13.2, 21.6]], T.blouse, { cx: 0.6 });
    else for (const s of [-1, 1]) cv.poly([[16 + s * 0.15, 21.1], [16 + s * 1.2, 20.4], [16 + s * 2.6, 20.6], [16 + s * 2.8, 21.5], [16 + s * 1.7, 22.6], [16 + s * 0.5, 22.4]], T.blouse, { n: [s * 0.25, -0.25] });
    return;
  }
  if (T.kind === 'shirt') {
    // ワイシャツの えり（まえは ひらいて たつ。うしろは おび）
    cv.part({ ol: 'line' });
    if (P.side) cv.poly([[X(-2.2), 19.9 + b], [X(0.8), 20.0 + b], [X(2.5), 21.0 + b], [X(2.3), 23.0 + b], [X(1.2), 22.0 + b], [X(-2.4), 21.7 + b]], T.collar, { cx: 0.6 });
    else if (P.back) cv.poly([[13.3, 19.9], [18.7, 19.9], [18.9, 21.6], [13.1, 21.6]], T.collar, { cx: 0.6 });
    else for (const s of [-1, 1]) cv.poly([[16 + s * 0.9, 20.3], [16 + s * 2.4, 19.9], [16 + s * 3.3, 21.2], [16 + s * 2.1, 23.4], [16 + s * 0.7, 21.3]], T.collar, { n: [s * 0.35, -0.2] });
    return;
  }
  if (T.kind === 'kid') {
    cv.part({ ol: 'line' });
    if (P.side) {
      cv.poly([[X(-0.6), 20.7 + b], [X(2.4), 20.8 + b], [X(2.8), 21.9 + b], [X(0.6), 22.4 + b]], T.collar, { cx: 0.5 });
      if (T.bow) { cv.part({ ol: 'line' }); cv.ell(X(2.7), 22.3 + b, 0.6, 0.6, T.bow, { bulge: 0.6 }); }
    } else if (P.back) {
      cv.poly([[13.4, 20.6], [18.6, 20.6], [18.9, 21.7], [13.1, 21.7]], T.collar, { cx: 0.6 });
    } else {
      for (const s of [-1, 1]) cv.poly([[16 + s * 0.2, 22.3], [16 + s * 1.0, 20.7], [16 + s * 2.9, 20.7], [16 + s * 3.1, 21.8], [16 + s * 1.7, 23.0]], T.collar, { n: [s * 0.2, -0.3] });
      if (T.bow) {
        cv.part({ ol: 'line' });
        for (const s of [-1, 1]) cv.poly([[16, 22.5], [16 + s * 1.7, 21.7], [16 + s * 1.8, 23.4]], T.bow, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.ell(16, 22.55, 0.6, 0.55, T.bow, { bulge: 0.6 });
      }
    }
  }
}

// 蝶ネクタイ（あごの すぐ した。うしろむきでは 見えない）
function bowTie(cv, P, m) {
  if (P.back) return;
  cv.part({ ol: 'line' });
  if (P.side) {
    const X = P.X, b = P.bob || 0;
    cv.poly([[X(2.1), 22.7 + b], [X(3.1), 22.3 + b], [X(3.25), 24.1 + b], [X(2.2), 23.7 + b]], m, { cx: 0.5 });
    return;
  }
  const y = 22.9;
  for (const s of [-1, 1]) cv.poly([[16 + s * 0.3, y - 0.25], [16 + s * 2.0, y - 1.0], [16 + s * 2.2, y + 0.95], [16 + s * 0.3, y + 0.3]], m, { cx: 0.6 });
  cv.part({ ol: 'line' });
  cv.ell(16, y, 0.6, 0.6, m, { bulge: 0.7 });
}

// ───────────── エプロン（コック） ─────────────
// まえ: こしひもと ひざ（long: すね）までの ぬの / よこ: まえに たれる ぬの / うしろ: ひもの ちょうむすび
export function drawApron(cv, P, O) {
  const A = O.apron;
  const f = P.fem;
  const sw = P.f === 0 ? 1 : -1;
  if (A.bib) return bibApron(cv, P, A, sw);
  if (P.back) {
    const w = f ? 4.6 : 5.1;
    cv.part({ ol: 'line' });
    cv.poly([[16 - w, A.y0], [16 + w, A.y0], [16 + w + 0.1, A.y0 + 0.8], [16 - w - 0.1, A.y0 + 0.8]], A.m, { cx: 0.85, cy: 0.4 });
    cv.part({ ol: 'soft' });
    cv.lock([15.7, A.y0 + 0.7], [15.3 + sw * 0.2, A.y0 + 2.2], [14.9, A.y0 + 3.6], 0.5, 0.36, A.m);
    cv.lock([16.3, A.y0 + 0.7], [16.8 + sw * 0.2, A.y0 + 2.0], [17.3, A.y0 + 3.3], 0.5, 0.36, A.m);
    cv.part({ ol: 'line' });
    for (const s of [-1, 1]) cv.ell(16 + s * 1.15, A.y0 + 0.3, 1.15, 0.72, A.m, { bulge: 0.6 });
    cv.part({ ol: 'line' });
    cv.ell(16, A.y0 + 0.4, 0.6, 0.55, A.m, { bulge: 0.7 });
    return;
  }
  if (P.side) {
    const X = P.X, b = P.bob;
    const y0 = A.y0 + b, y1 = A.y1;
    const swing = P.f === 0 ? 0.5 : 0;
    cv.part({ ol: 'line' });
    const pts = [[X(-0.8), y0 + 0.4], [X(3.0), y0 + 0.4], [X(3.3 + A.flare * 0.4 + swing), y1], [X(-0.3 + swing * 0.5), y1]];
    cv.poly(A.frill ? frillEdge(pts, 4) : pts, A.m, { cx: 0.7, cy: 0.2 });
    const id = cv.cur;
    cv.crease([[X(1.4), y0 + 1.4], [X(1.8 + swing * 0.5), y1 - 0.4]], 0.22, -0.4, { parts: [id] });
    if (A.trim) { cv.part({ ol: 'none', clip: id }); cv.rect(8, y1 - 0.75, 16, 0.42, A.trim, { n: [0, 0.2] }); }
    cv.part({ ol: 'line' });
    cv.poly([[X(-3.1), y0], [X(3.0), y0], [X(3.0), y0 + 0.8], [X(-3.1), y0 + 0.8]], A.m, { cx: 0.8, cy: 0.4 });
    if (A.towel) towel(cv, X(-1.7), y0 + 0.5, A.towel, 0.75);
    return;
  }
  const w0 = f ? 4.5 : 5.0, w1 = w0 + A.flare;
  cv.part({ ol: 'line' });
  const pts = [[16 - w0, A.y0 + 0.5], [16 + w0, A.y0 + 0.5], [16 + w1, A.y1], [16 - w1, A.y1]];
  cv.poly(A.frill ? frillEdge(pts, 8) : pts, A.m, { cx: 0.75, cy: 0.2 });
  const id = cv.cur;
  for (const x of [-2.6, 2.6]) cv.crease([[16 + x * 0.8, A.y0 + 1.8], [16 + x + sw * 0.2, A.y1 - 0.4]], 0.22, -0.35, { parts: [id] });
  // ポケット
  cv.crease([[16 - 2.2, A.y0 + 2.3], [16 + 2.2, A.y0 + 2.3]], 0.18, -0.45, { parts: [id] });
  cv.crease([[16, A.y0 + 2.4], [16, A.y0 + 4.4]], 0.16, -0.35, { parts: [id] });
  if (A.trim) { cv.part({ ol: 'none', clip: id }); cv.rect(10, A.y1 - 0.8, 12, 0.42, A.trim, { n: [0, 0.2] }); }
  if (A.berry) fruitIcon(cv, 16 + 1.3, A.y0 + 3.4, 'berry', 0.85);
  // こしひも
  cv.part({ ol: 'line' });
  cv.poly([[16 - w0 - 0.25, A.y0], [16 + w0 + 0.25, A.y0], [16 + w0 + 0.3, A.y0 + 0.8], [16 - w0 - 0.3, A.y0 + 0.8]], A.m, { cx: 0.85, cy: 0.4 });
  if (A.towel) towel(cv, 16 + w0 - 0.4, A.y0 + 0.5, A.towel, 1);
}

// むねあての ある エプロン（おかん）。bib: むねあての うえの はし
// まえ: かたひも → むねあてと すそ（フリル）→ こしひも → ポケット（ハート）→ 水玉
// うしろ: ×に かかる かたひもと、こしの ちょうむすび / よこ: まえの むねあてと すそ・かたに かかる ひも
function bibApron(cv, P, A, sw) {
  const f = P.fem;
  const bt = A.bib;
  if (P.back) {
    for (const s of [-1, 1]) {
      cv.part({ ol: 'soft' });
      cv.stroke([[16 + s * 3.2, 20.9], [16 + s * 1.2, 24.4], [16 - s * 2.4, A.y0 + 0.2]], 0.4, A.m, { n: [0, -0.1] });
    }
    const w = f ? 4.6 : 5.1;
    cv.part({ ol: 'line' });
    cv.poly([[16 - w, A.y0], [16 + w, A.y0], [16 + w + 0.1, A.y0 + 0.8], [16 - w - 0.1, A.y0 + 0.8]], A.tie, { cx: 0.85, cy: 0.4 });
    cv.part({ ol: 'soft' });
    cv.lock([15.7, A.y0 + 0.7], [15.3 + sw * 0.2, A.y0 + 2.2], [14.9, A.y0 + 3.6], 0.5, 0.36, A.tie);
    cv.lock([16.3, A.y0 + 0.7], [16.8 + sw * 0.2, A.y0 + 2.0], [17.3, A.y0 + 3.3], 0.5, 0.36, A.tie);
    cv.part({ ol: 'line' });
    for (const s of [-1, 1]) cv.ell(16 + s * 1.15, A.y0 + 0.3, 1.15, 0.72, A.tie, { bulge: 0.6 });
    cv.part({ ol: 'line' });
    cv.ell(16, A.y0 + 0.4, 0.6, 0.55, A.tie, { bulge: 0.7 });
    return;
  }
  if (P.side) {
    const X = P.X, b = P.bob;
    const y0 = A.y0 + b, y1 = A.y1;
    const swing = P.f === 0 ? 0.5 : 0;
    cv.part({ ol: 'soft' });
    cv.stroke([[X(1.7), bt + b + 0.3], [X(0.9), 21.0 + b], [X(-1.2), 20.9 + b], [X(-2.6), 22.8 + b], [X(-3.0), y0]], 0.38, A.m, { n: [0, -0.1] });
    cv.part({ ol: 'line' });
    const pts = [[X(0.9), bt + b], [X(2.75), bt + 0.25 + b], [X(2.95), y0 + 0.5], [X(3.4 + A.flare * 0.4 + swing), y1], [X(-0.2 + swing * 0.5), y1], [X(-0.5), y0 + 0.5], [X(0.6), y0]];
    cv.poly(frillBottom(pts, 3, 4), A.m, { cx: 0.7, cy: 0.2 });
    const id = cv.cur;
    cv.crease([[X(1.5), y0 + 1.4], [X(1.9 + swing * 0.5), y1 - 0.4]], 0.22, -0.4, { parts: [id] });
    apronDots(cv, id, A.dots, [X(-1.0), bt], [X(4.0), y1 + 1]);
    cv.part({ ol: 'line' });
    cv.poly([[X(-3.1), y0], [X(3.05), y0], [X(3.05), y0 + 0.8], [X(-3.1), y0 + 0.8]], A.tie, { cx: 0.8, cy: 0.4 });
    return;
  }
  const bw = f ? 2.6 : 2.85, ww = f ? 3.15 : 3.4;
  const w0 = f ? 4.2 : 4.5, w1 = w0 + A.flare;
  // かたひも（むねあての かどから くびの よこへ）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'soft' });
    cv.stroke([[16 + s * (bw - 0.45), bt + 0.4], [16 + s * (bw - 0.1), 21.5], [16 + s * 2.55, 20.5]], 0.42, A.m, { n: [s * 0.2, -0.2] });
  }
  cv.part({ ol: 'line' });
  const pts = [[16 - bw, bt], [16 + bw, bt], [16 + bw + 0.2, 25.6], [16 + ww, A.y0 + 0.3], [16 + w0, A.y0 + 0.7], [16 + w1, A.y1], [16 - w1, A.y1], [16 - w0, A.y0 + 0.7], [16 - ww, A.y0 + 0.3], [16 - bw - 0.2, 25.6]];
  cv.poly(frillBottom(pts, 5, 8), A.m, { cx: 0.7, cy: 0.2 });
  const id = cv.cur;
  for (const x of [-2.6, 2.6]) cv.crease([[16 + x * 0.8, A.y0 + 1.8], [16 + x + sw * 0.2, A.y1 - 0.4]], 0.22, -0.35, { parts: [id] });
  cv.crease([[16 - bw + 0.4, bt + 0.5], [16 + bw - 0.4, bt + 0.5]], 0.16, 0.35, { parts: [id] });
  // こしひも
  cv.part({ ol: 'line' });
  const wb = f ? 4.5 : 5.0;
  cv.poly([[16 - wb, A.y0], [16 + wb, A.y0], [16 + wb + 0.1, A.y0 + 0.8], [16 - wb - 0.1, A.y0 + 0.8]], A.tie, { cx: 0.85, cy: 0.4 });
  // ポケット（あかるい ピンクに 赤い ハート）
  cv.part({ ol: 'soft' });
  cv.poly([[16 - 2.2, A.y0 + 1.9], [16 + 2.2, A.y0 + 1.9], [16 + 2.3, A.y0 + 4.2], [16 - 2.3, A.y0 + 4.2]], A.pocket, { cx: 0.5, cy: 0.3 });
  const pid = cv.cur;
  cv.crease([[16 - 2.1, A.y0 + 2.15], [16 + 2.1, A.y0 + 2.15]], 0.14, -0.4, { parts: [pid] });
  if (A.heart) heartIcon(cv, 16, A.y0 + 3.1, A.heart);
  apronDots(cv, id, A.dots, [16 - w1 - 1, bt], [16 + w1 + 1, A.y1 + 1]);
}

// すそを なみうたせる（pts の さいごの 2つの あいだに n: なみ の かず。i0: すその みぎの てん）
function frillBottom(pts, i0, n) {
  const c = pts[i0], d = pts[i0 + 1];
  const bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    bot.push([c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t + (i % 2 ? 0.5 : -0.1)]);
  }
  return [...pts.slice(0, i0), ...bot, ...pts.slice(i0 + 2)];
}

// エプロンの 水玉（ドットの ざひょうで ならべる。clip の パーツの うえ だけ）
function apronDots(cv, clip, col, [x0, y0], [x1, y1]) {
  if (!col) return;
  const big = cv.k >= 4;
  const sx = big ? 7 : 4, sy = big ? 6 : 3;
  const X0 = Math.min(cv.X(x0), cv.X(x1)), X1 = Math.max(cv.X(x0), cv.X(x1)), Y0 = cv.Y(y0), Y1 = cv.Y(y1);
  cv.part({ ol: 'none', cast: false, clip });
  for (let iy = Y0, r = 0; iy <= Y1; iy += sy, r++) {
    for (let ix = X0 - sx + ((r % 2) * sx) / 2; ix <= X1; ix += sx) {
      cv.px(ix, iy, col);
      if (big) { cv.px(ix + 1, iy, col); cv.px(ix, iy + 1, col); cv.px(ix + 1, iy + 1, col); }
    }
  }
}

// 小さな ハート（ポケットの かざり。小さい えでは 1つの つぶ）
function heartIcon(cv, x, y, col) {
  cv.part({ ol: 'none', cast: false });
  const rows = cv.k >= 4 ? ['RR.RR', 'RRRRR', '.RRR.', '..R..'] : ['R.R', '.R.'];
  cv.stamp(cv.X(x) - Math.floor(rows[0].length / 2), cv.Y(y) - Math.floor(rows.length / 2), rows, { R: col });
}

// すそが なみうつ エプロン（pts: ひだりうえ・みぎうえ・みぎした・ひだりした）
function frillEdge(pts, n) {
  const [a, b2, c, d] = pts;
  const bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    bot.push([c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t + (i % 2 ? 0.5 : -0.1)]);
  }
  return [a, b2, ...bot];
}

// こしに さげた タオル（しろに 2本の 色の 線）
function towel(cv, x, y, c, s) {
  cv.part({ ol: 'line' });
  const w = 1.1 * s;
  cv.poly([[x - w, y], [x + w, y], [x + w + 0.15, y + 3.4], [x - w + 0.1, y + 3.3]], mat({ r: ramp('#f6f6f2', 4), th: TH.cloth }), { cx: 0.6, cy: 0.2 });
  const id = cv.cur;
  for (const yy of [y + 2.3, y + 2.9]) { cv.part({ ol: 'none', clip: id }); cv.rect(x - 1.5, yy, 3.0, 0.32, c, { n: [0, 0] }); }
}

// ───────────── ランドセル（小学生） ─────────────
// where: 'behind'（まえむき: からだの うしろ。はしが 見える） / 'straps'（まえむき: かたの ベルト） / 'back'（うしろむき） / 'side'（よこむき）
export function drawPack(cv, P, O, where) {
  const K = O.pack;
  if (!K) return;
  if (where === 'behind') {
    // まえむき: かたの うえに ランドセルの あたまが 見える
    cv.part({ ol: 'line' });
    cv.poly([[16 - 6.0, 18.8], [16 + 6.0, 18.8], [16 + 6.9, 19.8], [16 + 6.9, 27.6], [16 - 6.9, 27.6], [16 - 6.9, 19.8]], K.m, { cx: 0.7, cy: 0.4 });
    cv.crease([[16 - 6.2, 19.5], [16 + 6.2, 19.5]], 0.26, 0.45, { parts: [cv.cur] });
    return;
  }
  if (where === 'sideStrap') {
    // よこむき: かたに かかる ベルト
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.stroke([[X(-2.6), 21.4 + b], [X(-0.6), 20.9 + b], [X(1.4), 21.6 + b], [X(2.3), 23.6 + b], [X(2.2), 26.2 + b]], 0.5, K.strap, { n: [0, -0.1] });
    return;
  }
  if (where === 'straps') {
    // かたの ベルト（わきの したまで）
    for (const s of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.poly([[16 + s * 2.5, 20.9], [16 + s * 3.9, 20.9], [16 + s * 4.5, 26.4], [16 + s * 3.4, 26.6]], K.strap, { cx: 0.5 });
      cv.part({ ol: 'none', cast: false });
      cv.ell(16 + s * 3.75, 24.6, 0.32, 0.32, K.clasp, { bulge: 0.9 });
    }
    return;
  }
  if (where === 'back') {
    // ほんたい・かぶせ（ふた）・金の 金具。うでが 見えるように せなかの はばに
    const w = 5.0;
    cv.part({ ol: 'line' });
    cv.poly([[16 - w + 0.3, 20.4], [16 + w - 0.3, 20.4], [16 + w, 21.4], [16 + w, 29.0], [16 + w - 0.5, 29.6], [16 - w + 0.5, 29.6], [16 - w, 29.0], [16 - w, 21.4]], K.m, { cx: 0.75, cy: 0.3 });
    const id = cv.cur;
    cv.crease([[16 - w + 0.3, 28.7], [16 + w - 0.3, 28.7]], 0.22, -0.5, { parts: [id] });
    cv.part({ ol: 'line' });
    cv.poly([[16 - w, 20.2], [16 + w, 20.2], [16 + w + 0.3, 21.2], [16 + w + 0.2, 25.8], [16 + w - 1.4, 27.4], [16 - w + 1.4, 27.4], [16 - w - 0.2, 25.8], [16 - w - 0.3, 21.2]], K.m, { cx: 0.8, cy: 0.35 });
    const flap = cv.cur;
    cv.crease([[16 - w + 0.2, 21.0], [16 + w - 0.2, 21.0]], 0.26, 0.45, { parts: [flap] });
    cv.crease([[16 - w + 0.4, 25.8], [16 - w + 1.6, 26.8], [16 + w - 1.6, 26.8], [16 + w - 0.4, 25.8]], 0.2, -0.35, { parts: [flap] });
    cv.part({ ol: 'line' });
    cv.poly([[16 - 0.8, 26.5], [16 + 0.8, 26.5], [16 + 0.8, 27.9], [16 - 0.8, 27.9]], K.clasp, { n: 'bevel', bw: 0.3 });
    return;
  }
  // よこむき: せなかの うしろの はこ（ふたが かぶさる）
  const X = P.X, b = P.bob || 0;
  cv.part({ ol: 'line' });
  cv.poly([[X(-2.4), 20.2 + b], [X(-5.6), 20.0 + b], [X(-6.6), 21.0 + b], [X(-6.8), 29.0 + b], [X(-6.2), 29.6 + b], [X(-2.8), 29.4 + b]], K.edge, { cx: 0.7, cy: 0.3 });
  const id = cv.cur;
  cv.crease([[X(-3.4), 28.6 + b], [X(-6.2), 28.8 + b]], 0.22, -0.4, { parts: [id] });
  cv.part({ ol: 'line' });
  cv.poly([[X(-2.6), 19.8 + b], [X(-5.6), 19.6 + b], [X(-7.0), 20.8 + b], [X(-7.2), 26.8 + b], [X(-6.6), 27.4 + b], [X(-5.6), 26.6 + b], [X(-5.4), 21.4 + b], [X(-2.8), 21.4 + b]], K.m, { cx: 0.7, cy: 0.3 });
  const flap = cv.cur;
  cv.crease([[X(-3.0), 20.4 + b], [X(-6.0), 20.4 + b]], 0.24, 0.4, { parts: [flap] });
  cv.part({ ol: 'line' });
  cv.poly([[X(-6.8), 25.8 + b], [X(-7.4), 25.8 + b], [X(-7.4), 27.0 + b], [X(-6.8), 27.0 + b]], K.clasp, { n: 'bevel', bw: 0.25 });
}

// ───────────── うしろ ─────────────
export function drawTorsoBack(cv, P, O) {
  pelvis(cv, P, O);
  const T = O.torso;
  cv.part({ ol: 'line' });
  const k = cv.k;
  cv.poly(torsoFrontPts(P, T), O.top, { cx: 0.85, cy: 0.25, tex: bodyTex(T, k) });
  const base = cv.cur;
  switch (T.kind) {
    case 'plate': {
      const w = P.fem ? 4.5 : 5.1;
      cv.part({ ol: 'line' });
      cv.poly([[16 - w, 21.6], [16 + w, 21.6], [16 + w + 0.4, 24.4], [16 + w - 0.4, 28.9], [16 - w + 0.4, 28.9], [16 - w - 0.4, 24.4]], O.plate, { n: 'bevel', bw: 1.1, bs: 0.8 });
      const id = cv.cur;
      cv.crease([[16, 22.0], [16, 28.6]], 0.3, -0.45, { parts: [id] });
      cv.crease([[16 - w + 1.0, 23.2], [16 - 1.0, 23.0]], 0.4, 0.3, { parts: [id] });
      break;
    }
    case 'leather': {
      cv.part({ ol: 'line' });
      const w = P.fem ? 4.2 : 4.7;
      cv.poly([[16 - w, 21.6], [16 + w, 21.6], [16 + w + 0.4, 24.6], [16 + w - 0.2, 28.8], [16 - w + 0.2, 28.8], [16 - w - 0.4, 24.6]], T.plate, { cx: 0.8, cy: 0.3 });
      cv.crease([[16, 22.0], [16, 28.6]], 0.24, -0.35, { parts: [cv.cur] });
      break;
    }
    case 'sailor': {
      if (T.stripe) for (let y = 22.8; y < 30.6; y += 1.6) { cv.part({ ol: 'none', clip: base }); cv.rect(10, y, 12, 0.6, T.stripe); }
      cv.part({ ol: 'line' });
      cv.poly([[12.0, 20.8], [20.0, 20.8], [20.4, 25.4], [11.6, 25.4]], T.collar, { cx: 0.6 });
      cv.part({ ol: 'none' });
      cv.rect(12.4, 24.4, 7.2, 0.4, mat({ r: ramp('#f4f6fa', 4), th: TH.cloth }));
      break;
    }
    case 'work': {
      // せなかの ひかる おび（消防士）・えり
      if (T.band) for (const y of [24.0, 27.0, 29.4]) { cv.part({ ol: 'none', clip: base }); cv.rect(9, y, 14, 0.85, T.band, { n: [0, -0.2] }); }
      cv.part({ ol: 'line' });
      cv.poly([[12.8, 20.6], [19.2, 20.6], [19.6, 22.0], [12.4, 22.0]], T.collar, { cx: 0.6 });
      cv.crease([[16, 22.4], [16, 28.0]], 0.22, -0.3, { parts: [base] });
      if (T.piping) {
        // えりの ふち・かたの きりかえ・せなかの 大きな ひしがた
        const cid = cv.cur;
        cv.part({ ol: 'none', clip: cid });
        cv.stroke([[12.5, 21.8], [19.5, 21.8]], 0.2, T.piping, { n: [0, 0] });
        cv.part({ ol: 'none', clip: base });
        cv.stroke([[10.0, 23.0], [22.0, 23.0]], 0.17, T.piping, { n: [0, 0] });
        if (T.mark === 'diamond') emblem(cv, 16, 26.0, 'diamondbig', O, false, null, T.piping);
        else if (T.mark === 'chip') emblem(cv, 16, 26.0, 'chipbig', O, false, null, T.piping);
      }
      break;
    }
    case 'suit':
      cv.crease([[16, 22.0], [16, 28.0]], 0.24, -0.25, { parts: [base] });
      if (T.rumple) suitWrinkles(cv, base, 'back');
      break;
    case 'shirt':
      // せなかの まんなかの すじと、かたの きりかえ（ヨーク）
      cv.crease([[16, 23.4], [16, 28.0]], 0.24, -0.25, { parts: [base] });
      cv.crease([[11.2, 23.0], [20.8, 23.0]], 0.18, -0.32, { parts: [base] });
      break;
    case 'hakai':
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.85, 16, 0.85, T.trim, { n: [0, 0.2] });
      cv.crease([[16, 22.0], [16, 28.0]], 0.24, -0.25, { parts: [base] });
      break;
    case 'baseball': {
      cv.part({ ol: 'none', cast: false });
      // せばんごう
      cv.stroke([[15.0, 23.4], [16.6, 23.4], [16.6, 25.0], [15.0, 25.0], [15.0, 26.6], [16.8, 26.6]], 0.36, T.trim, { n: [0, 0] });
      break;
    }
    case 'jester': {
      cv.part({ ol: 'none', clip: base });
      cv.poly([[9, 20.0], [16, 20.0], [16, 32.0], [9, 32.0]], T.c2, { cx: 0.5 });
      break;
    }
    case 'yoroi':
      for (const y of [23.2, 25.0, 26.8]) cv.crease([[11, y], [21, y]], 0.25, -0.65, { parts: [base] });
      break;
    case 'robe':
      cv.part({ ol: 'line' });
      cv.poly([[12.4, 20.6], [19.6, 20.6], [20.2, 22.0], [16, 23.4], [11.8, 22.0]], O.trimM, { cx: 0.6 });
      break;
    case 'gi':
      if (T.dragon) emblem(cv, 16, 25.4, 'dragon', O);
      if (T.wave) emblem(cv, 16, 25.4, 'wave', O);
      // スーパーサイヤ人: せなかの 大きな まるい しるし
      if (T.under) giMark(cv, 16, 24.9, 1.85, T.mark);
      break;
    case 'saiyan': {
      // せなかの いた（クリーム色）と こしの ふち
      const w = P.fem ? 4.7 : 5.3;
      cv.part({ ol: 'line' });
      cv.poly([[16 - w + 0.6, 21.3], [16 + w - 0.6, 21.3], [16 + w + 0.4, 23.0], [16 + w + 0.1, 25.6], [16 + w - 0.5, 28.6], [16 - w + 0.5, 28.6], [16 - w - 0.1, 25.6], [16 - w - 0.4, 23.0]], T.plate, { n: 'bevel', bw: 1.0, bs: 0.7 });
      const id = cv.cur;
      cv.crease([[16, 21.8], [16, 28.3]], 0.26, -0.42, { parts: [id] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[16 - w + 0.4, 28.2], [16 + w - 0.4, 28.2]], 0.42, T.brown, { n: [0, 0.2] });
      break;
    }
    case 'jersey':
      cv.crease([[16, 22.0], [16, 28.4]], 0.24, -0.25, { parts: [base] });
      cv.crease([[12.2, 30.6], [19.8, 30.6]], 0.3, -0.35, { parts: [base] });
      break;
    case 'coat':
      cv.crease([[16, 22.0], [16, 30.0]], 0.26, -0.45, { parts: [base] });
      break;
    case 'rubber': {
      // ベストの せなか（ぜんぶ おおう）
      cv.part({ ol: 'line' });
      cv.poly(torsoFrontPts(P, { ...T, hem: 30.0, flare: T.loose ? 1.4 : 0.4 }), T.vest, { cx: 0.85, cy: 0.25 });
      cv.crease([[16, 22.0], [16, 29.6]], 0.22, -0.3, { parts: [cv.cur] });
      break;
    }
    case 'hoodie':
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.95, 16, 1.0, T.rib, { n: [0, 0.25] });
      if (T.neon) {
        for (const [j, m] of T.neon.entries()) { cv.part({ ol: 'none', clip: base }); cv.stroke([[10.6, 27.4 + j * 1.25], [21.4, 27.4 + j * 1.25]], 0.3, m, { n: [0, 0] }); }
      }
      break;
    case 'gamer': {
      // チェックの シャツの せなか
      cv.part({ ol: 'line' });
      cv.poly(torsoFrontPts(P, { ...T, hem: 31.2 }), T.shirt, { cx: 0.85, cy: 0.25, tex: tex.plaid(k) });
      cv.crease([[16, 22.0], [16, 30.6]], 0.2, -0.3, { parts: [cv.cur] });
      break;
    }
    case 'esports': {
      // わきの 赤い おびと せなかの 大きな 番号
      for (const s of [-1, 1]) {
        cv.part({ ol: 'none', clip: base });
        cv.poly([[16 + s * 4.3, 22.0], [16 + s * 9, 22.0], [16 + s * 9, 32], [16 + s * 4.0, 32]], T.trim, { n: [s * 0.5, 0] });
      }
      backNumber(cv, 16, 25.4, '21', '#f4f4f8', '#e0263a');
      break;
    }
    case 'vest': {
      cv.part({ ol: 'line' });
      cv.poly(torsoFrontPts(P, { ...T, hem: 31.0 }), T.vest, { cx: 0.85, cy: 0.25 });
      break;
    }
    case 'dress':
      cv.part({ ol: 'line' });
      cv.ell(16, 28.6, 1.1, 0.9, T.bow, { bulge: 0.6 });
      for (const s of [-1, 1]) cv.poly([[16, 28.6], [16 + s * 2.8, 27.4], [16 + s * 3.0, 29.8]], T.bow, { cx: 0.6 });
      break;
    case 'store':
      // せなかも しま。うえに Tシャツの えり
      stripes(cv, base, T.stripe, 16, P.fem ? 5.7 : 6.3, 0);
      cv.part({ ol: 'line' });
      cv.poly([[13.4, 20.5], [18.6, 20.5], [18.8, 21.5], [13.2, 21.5]], T.tee, { cx: 0.6 });
      break;
    default:
      cv.crease([[16, 22.0], [16, 28.0]], 0.24, -0.25, { parts: [base] });
  }
  if (O.scarf) {
    const sw = P.f === 0 ? 1 : -1;
    cv.part({ ol: 'line' });
    cv.poly([[12.8, 20.4], [19.2, 20.4], [19.8, 21.6], [12.2, 21.6]], O.scarf.m, { cx: 0.6 });
    cv.part({ ol: 'soft' });
    cv.lock([16.6, 21.4], [17.6 + sw * 0.4, 24.8], [18.6 + sw * 0.8, 28.6], 1.1, 0.6, O.scarf.m2);
    cv.lock([15.6, 21.4], [15.0 + sw * 0.4, 24.4], [15.2 + sw * 0.8, 27.4], 1.0, 0.55, O.scarf.m);
  }
}

// ───────────── よこ ─────────────
export function drawTorsoSide(cv, P, O) {
  pelvis(cv, P, O);
  const T = O.torso;
  const X = P.X, b = P.bob;
  cv.part({ ol: 'line' });
  const k = cv.k;
  cv.poly(torsoSidePts(P, T), O.top, { cx: 0.85, cy: 0.25, tex: bodyTex(T, k) });
  const base = cv.cur;
  switch (T.kind) {
    case 'kid':
      if (T.pocket) cv.crease([[X(0.6), 25.0 + b], [X(2.2), 25.0 + b]], 0.2, -0.45, { parts: [base] });
      break;
    case 'gakuran':
      buttons(cv, [[X(2.55), 22.9 + b], [X(2.6), 24.5 + b], [X(2.6), 26.1 + b], [X(2.55), 27.7 + b], [X(2.4), 29.3 + b]], null, T.gold);
      break;
    case 'work': {
      cv.part({ ol: 'line' });
      if (T.tie) {
        // ひらいた えりから シャツと ネクタイ
        cv.poly([[X(1.2), 21.0 + b], [X(2.6), 21.2 + b], [X(2.8), 25.0 + b], [X(2.2), 25.4 + b]], T.shirt, { n: [0, 0] });
        cv.part({ ol: 'soft' });
        cv.poly([[X(2.2), 21.6 + b], [X(2.9), 21.8 + b], [X(3.0), 25.2 + b], [X(2.5), 25.6 + b]], T.tie, { cx: 0.5 });
        cv.part({ ol: 'line' });
        cv.poly([[X(-2.4), 20.6 + b], [X(1.2), 20.8 + b], [X(2.2), 22.0 + b], [X(1.7), 25.8 + b], [X(0.8), 22.6 + b], [X(-2.8), 22.2 + b]], T.collar, { cx: 0.6 });
      } else cv.poly([[X(-2.4), 20.6 + b], [X(1.4), 20.8 + b], [X(2.6), 22.2 + b], [X(1.2), 23.0 + b], [X(-2.8), 22.2 + b]], T.collar, { cx: 0.6 });
      const colId = cv.cur;
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[X(2.5), (T.tie ? 25.8 : 23.0) + b], [X(2.5), 31.0 + b]], 0.2, T.zip, { n: [0, 0] });
      if (T.band) for (const y of [27.0, 29.4]) { cv.part({ ol: 'none', clip: base }); cv.rect(8, y + b, 16, 0.85, T.band, { n: [0, -0.2] }); }
      if (T.tag) nameTag(cv, X(1.2), 23.6 + b, '#3aa060');
      if (T.piping) {
        cv.part({ ol: 'none', clip: colId });
        cv.stroke([[X(-2.7), 22.0 + b], [X(1.2), 22.8 + b], [X(2.5), 22.1 + b]], 0.2, T.piping, { n: [0, 0] });
        cv.part({ ol: 'none', clip: base });
        cv.stroke([[X(2.05), 23.0 + b], [X(2.05), 31.0 + b]], 0.15, T.piping, { n: [0, 0] });
        if (T.mark === 'diamond') emblem(cv, X(0.5), 25.0 + b, 'diamond', O, false, null, T.piping);
        else if (T.mark === 'chip') emblem(cv, X(0.5), 25.0 + b, 'chip', O, false, null, T.piping);
      }
      break;
    }
    case 'okan':
      // ブラウスの V（まえの むねあてが かくす ところは あとで エプロン）
      cv.part({ ol: 'line' });
      cv.poly([[X(1.0), 21.0 + b], [X(2.6), 21.2 + b], [X(2.5), 23.2 + b]], T.blouse, { n: [0, 0] });
      cv.crease([[X(-2.4), 29.2 + b], [X(-0.6), 29.2 + b]], 0.18, -0.4, { parts: [base] });
      break;
    case 'leopard':
      cv.part({ ol: 'soft' });
      cv.poly([[X(0.4), 21.0 + b], [X(2.5), 21.2 + b], [X(2.6), 22.6 + b], [X(1.4), 22.4 + b]], O.skin, { n: [0, 0.2] });
      if (T.necklace) {
        chain(cv, [[X(-0.6), 21.0 + b], [X(1.6), 23.6 + b], [X(2.7), 23.0 + b]], T.necklace);
        cv.part({ ol: 'line' });
        cv.ell(X(2.75), 23.7 + b, 0.5, 0.62, T.necklace, { bulge: 0.9 });
      }
      break;
    case 'shirt':
      cv.part({ ol: 'soft' });
      cv.poly([[X(1.0), 21.0 + b], [X(2.6), 21.2 + b], [X(2.6), 23.4 + b]], O.skin, { n: [0, 0.2] });
      buttons(cv, [[X(2.45), 24.6 + b], [X(2.4), 26.4 + b], [X(2.3), 28.2 + b]], null, T.btn);
      cv.crease([[X(-2.0), 27.4 + b], [X(-0.4), 28.8 + b]], 0.18, -0.3, { parts: [base] });
      if (T.badge) emblem(cv, X(1.3), 23.6 + b, 'starbadge', O);
      break;
    case 'hakai':
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.85, 16, 0.85, T.trim, { n: [0, 0.2] });
      break;
    case 'stage': {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.0), 21.0 + b], [X(2.6), 21.2 + b], [X(2.9), 26.6 + b], [X(2.2), 27.2 + b]], T.shirt, { n: [0, 0] });
      cv.part({ ol: 'soft' });
      cv.poly([[X(2.0), 21.4 + b], [X(3.0), 21.8 + b], [X(3.2), 24.6 + b], [X(2.5), 25.2 + b]], T.scarf, { cx: 0.5 });
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[X(1.0), 21.0 + b], [X(2.1), 27.2 + b]], 0.3, T.trim, { n: [0, 0] });
      break;
    }
    case 'plate': {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.6), 21.4 + b], [X(-2.4), 21.4 + b], [X(-3.0), 23.0 + b], [X(-2.8), 28.9 + b], [X(2.4), 28.9 + b], [X(3.0), 25.4 + b], [X(3.1), 23.4 + b], [X(2.6), 22.0 + b]], O.plate, { n: 'bevel', bw: 1.1, bs: 0.8 });
      const id = cv.cur;
      cv.crease([[X(2.2), 22.8 + b], [X(2.5), 25.6 + b], [X(1.8), 28.4 + b]], 0.34, 0.42, { parts: [id] });
      if (O.trim) { cv.part({ ol: 'none', clip: id }); cv.stroke([[X(-2.6), 28.7 + b], [X(2.2), 28.7 + b]], 0.4, O.trim, { n: [0, 0.2] }); }
      cv.part({ ol: 'line' });
      cv.poly([[X(1.6), 20.4 + b], [X(-1.8), 20.4 + b], [X(-2.2), 21.8 + b], [X(2.2), 21.8 + b]], O.plate, { n: 'bevel', bw: 0.5 });
      break;
    }
    case 'leather': {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.4), 21.8 + b], [X(-2.4), 21.8 + b], [X(-2.8), 28.8 + b], [X(2.2), 28.8 + b], [X(2.8), 25.2 + b], [X(2.7), 23.0 + b]], T.plate, { cx: 0.8, cy: 0.3 });
      cv.crease([[X(-2.4), 24.8 + b], [X(2.6), 24.8 + b]], 0.26, -0.4, { parts: [cv.cur] });
      break;
    }
    case 'tunic':
      cv.part({ ol: 'line' });
      cv.poly([[X(0.4), 21.0 + b], [X(2.5), 21.0 + b], [X(2.6), 22.6 + b]], T.collar, { n: [0, 0] });
      break;
    case 'robe':
      cv.part({ ol: 'soft' });
      cv.poly([[X(1.8), 21.0 + b], [X(2.9), 22.6 + b], [X(2.8), 28.8 + b], [X(2.0), 28.8 + b], [X(2.0), 22.6 + b]], T.panel || O.trimM, { cx: 0.5 });
      cv.part({ ol: 'line' });
      cv.poly([[X(-2.4), 20.6 + b], [X(1.8), 20.6 + b], [X(2.6), 21.8 + b], [X(-2.8), 22.2 + b]], O.trimM, { cx: 0.6 });
      break;
    case 'gi': {
      if (T.under) {
        cv.part({ ol: 'soft' });
        cv.poly([[X(0.3), 21.0 + b], [X(2.6), 21.2 + b], [X(2.6), 24.0 + b]], T.under, { n: [0, 0.1] });
        cv.crease([[X(0.4), 21.0 + b], [X(2.5), 24.2 + b], [X(2.1), 28.0 + b]], 0.28, -0.5, { parts: [base] });
        giMark(cv, X(0.9), 23.9 + b, 0.8, T.mark);
        break;
      }
      cv.part({ ol: 'line' });
      const ed = T.trim || mat({ r: ramp('#f4f2f6', 4), th: TH.cloth });
      cv.stroke([[X(0.6), 21.0 + b], [X(2.4), 23.6 + b], [X(2.0), 28.0 + b]], 0.55, ed, { n: [0, -0.1] });
      break;
    }
    case 'saiyan': {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.6), 21.4 + b], [X(-2.4), 21.4 + b], [X(-3.1), 23.0 + b], [X(-2.9), 28.6 + b], [X(2.5), 28.6 + b], [X(3.1), 25.4 + b], [X(3.2), 23.4 + b], [X(2.6), 22.0 + b]], T.plate, { n: 'bevel', bw: 1.0, bs: 0.7 });
      const id = cv.cur;
      cv.crease([[X(2.3), 22.8 + b], [X(2.6), 25.6 + b], [X(1.9), 28.2 + b]], 0.32, 0.4, { parts: [id] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[X(-3.0), 28.2 + b], [X(2.6), 28.2 + b]], 0.42, T.brown, { n: [0, 0.2] });
      break;
    }
    case 'jersey':
      cv.part({ ol: 'line' });
      cv.poly([[X(1.0), 21.0 + b], [X(2.6), 21.2 + b], [X(2.7), 25.2 + b], [X(2.1), 25.4 + b]], T.tee, { n: [0, 0] });
      cv.part({ ol: 'none', clip: base });
      cv.stroke([[X(2.5), 25.2 + b], [X(2.5), 31.0]], 0.2, T.zip, { n: [0, 0] });
      cv.crease([[X(-2.6), 30.6], [X(2.8), 30.6]], 0.28, -0.35, { parts: [base] });
      break;
    case 'coat':
      cv.crease([[X(2.4), 21.8 + b], [X(2.5), 28.2 + b]], 0.24, -0.45, { parts: [base] });
      buttons(cv, [[X(1.8), 23.4 + b], [X(1.9), 25.6 + b]], null, T.chain);
      chain(cv, [[X(1.9), 25.6 + b], [X(0.4), 27.0 + b], [X(-1.6), 26.4 + b]], T.chain);
      break;
    case 'rubber': {
      // ベスト（せなかがわ。まえは はだ か しろい タンクトップ）
      const lo = T.loose ? 0.7 : 0;
      cv.part({ ol: 'line' });
      cv.poly([[X(-2.3), 21.0 + b], [X(0.6), 21.0 + b], [X(1.2 + lo), 29.9 + b], [X(-3.4 - lo), 29.9 + b], [X(-3.3), 22.6 + b]], T.vest, { cx: 0.7 });
      break;
    }
    case 'hoodie':
      cv.part({ ol: 'none', clip: base });
      cv.rect(8, T.hem - 0.95, 16, 1.0, T.rib, { n: [0, 0.25] });
      cv.crease([[X(0.2), 27.2 + b], [X(2.6), 27.2 + b], [X(3.0), 29.6]], 0.2, -0.45, { parts: [base] });
      if (T.neon) for (const [j, m] of T.neon.entries()) { cv.part({ ol: 'none', clip: base }); cv.stroke([[X(-3.4), 23.4 + j * 1.25 + b], [X(3.4), 24.4 + j * 1.25 + b]], 0.3, m, { n: [0, 0] }); }
      break;
    case 'gamer':
      cv.part({ ol: 'line' });
      cv.poly([[X(-2.3), 21.0 + b], [X(1.0), 21.0 + b], [X(1.5), 31.2], [X(-3.4), 31.2], [X(-3.3), 22.6 + b]], T.shirt, { cx: 0.7, tex: tex.plaid(k) });
      break;
    case 'esports':
      cv.part({ ol: 'none', clip: base });
      cv.poly([[X(-1.0), 22.0 + b], [X(1.0), 22.0 + b], [X(1.2), 32], [X(-1.3), 32]], T.trim, { n: [0, 0] });
      break;
    case 'suit':
      cv.part({ ol: 'line' });
      cv.poly([[X(1.2), 21.0 + b], [X(2.6), 21.2 + b], [X(2.8), 25.0 + b], [X(2.2), 25.4 + b]], T.shirt, { n: [0, 0] });
      if (T.ribbon) {
        cv.part({ ol: 'line' });
        cv.poly([[X(2.4), 22.0 + b], [X(3.4), 21.2 + b], [X(3.5), 23.4 + b]], T.ribbon, { cx: 0.5 });
        cv.part({ ol: 'line' });
        cv.ell(X(2.7), 22.3 + b, 0.6, 0.6, T.ribbon, { bulge: 0.6 });
      } else if (T.loose) {
        // ゆるめた ネクタイ（むすびめが さがる）と あけた えりもと
        cv.part({ ol: 'soft' });
        cv.poly([[X(1.3), 21.0 + b], [X(2.6), 21.2 + b], [X(2.4), 22.6 + b]], O.skin, { n: [0, 0.2] });
        cv.part({ ol: 'soft' });
        cv.poly([[X(2.3), 22.9 + b], [X(2.95), 23.0 + b], [X(3.25), 26.2 + b], [X(2.75), 26.6 + b]], T.tie, { cx: 0.5 });
      } else if (!T.bowtie) {
        cv.part({ ol: 'soft' });
        cv.poly([[X(2.2), 21.6 + b], [X(2.9), 21.8 + b], [X(3.0), 25.4 + b], [X(2.5), 25.8 + b]], T.tie, { cx: 0.5 });
      }
      if (T.lapel) { cv.part({ ol: 'line' }); cv.poly([[X(0.3), 21.0 + b], [X(1.3), 21.0 + b], [X(2.3), 25.8 + b], [X(1.6), 26.0 + b]], T.lapel, { n: [0.2, -0.1] }); }
      if (T.blazer) emblem(cv, X(0.6), 24.4 + b, 'school', O);
      if (T.rumple) suitWrinkles(cv, base, 'side', X, b);
      if (T.lanyard) {
        cv.part({ ol: 'none' });
        cv.stroke([[X(0.4), 21.0 + b], [X(2.9), 25.0 + b]], 0.24, T.lanyard, { n: [0, 0] });
        idCard(cv, X(3.2), 25.0 + b, T.lanyard);
      }
      if (T.medal) medal(cv, X(2.6), 26.5 + b, T.medal, [[X(0.6), 21.4 + b]]);
      break;
    case 'chef':
      // うちあわせの へりと、てまえの ボタン
      cv.crease([[X(1.0), 21.6 + b], [X(2.4), 23.0 + b], [X(2.5), 30.8 + b]], 0.22, -0.45, { parts: [base] });
      buttons(cv, [[X(1.9), 23.8 + b], [X(2.0), 25.6 + b], [X(1.9), 27.3 + b]], null, T.btn);
      break;
    case 'store':
      stripes(cv, base, T.stripe, 16, 3.2, b);
      cv.part({ ol: 'line' });
      cv.poly([[X(1.0), 21.0 + b], [X(2.6), 21.2 + b], [X(2.7), 23.8 + b]], T.tee, { n: [0, 0] });
      nameTag(cv, X(1.0), 24.9 + b, T.tagc);
      break;
    case 'uniform':
      if (T.tie) {
        cv.part({ ol: 'line' });
        cv.poly([[X(1.6), 21.0 + b], [X(2.6), 21.2 + b], [X(2.7), 22.6 + b], [X(2.0), 22.8 + b]], T.shirt, { n: [0, 0] });
        cv.part({ ol: 'soft' });
        cv.poly([[X(2.3), 21.4 + b], [X(2.9), 21.6 + b], [X(3.0), 23.2 + b], [X(2.5), 23.4 + b]], T.tie, { cx: 0.5 });
      }
      if (T.badge) emblem(cv, X(1.2), 24.6 + b, 'policebadge', O, false, null, T.badge);
      break;
    case 'sailor':
      if (T.stripe) for (let y = 22.8; y < 30.6; y += 1.6) { cv.part({ ol: 'none', clip: base }); cv.rect(10, y + b, 12, 0.6, T.stripe); }
      cv.part({ ol: 'line' });
      cv.poly([[X(-3.4), 20.8 + b], [X(1.6), 20.8 + b], [X(2.4), 22.4 + b], [X(-3.2), 24.8 + b]], T.collar, { cx: 0.6 });
      cv.part({ ol: 'line' });
      cv.ell(X(2.6), 24.4 + b, 0.9, 0.8, T.scarf, { bulge: 0.6 });
      break;
    case 'jester':
      cv.part({ ol: 'line' });
      for (let i = -2; i <= 2; i++) cv.ell(X(i * 1.1), 21.0 + b, 0.95, 0.8, T.ruff, { bulge: 0.6 });
      break;
    case 'vest':
      cv.part({ ol: 'line' });
      cv.poly([[X(-2.3), 21.0 + b], [X(0.6), 21.0 + b], [X(1.2), 31.0 + b], [X(-3.0), 31.0 + b], [X(-3.2), 22.6 + b]], T.vest, { cx: 0.7 });
      break;
    case 'yoroi':
      for (const y of [23.2, 25.0, 26.8]) cv.crease([[X(-3.4), y + b], [X(3.4), y + b]], 0.25, -0.65, { parts: [base] });
      break;
    case 'dress':
      cv.part({ ol: 'line' });
      cv.ell(X(-3.0), 28.6 + b, 1.0, 0.9, T.bow, { bulge: 0.6 });
      break;
    default:
  }
  if (O.mantle) {
    cv.part({ ol: 'line' });
    cv.poly([[X(1.8), 20.6 + b], [X(-2.6), 20.6 + b], [X(-3.8), 23.6 + b], [X(-3.4), 25.4 + b], [X(1.4), 25.0 + b], [X(2.8), 23.2 + b]], O.mantle.m, { cx: 0.7, cy: 0.4 });
    cv.part({ ol: 'line' });
    cv.ell(X(2.3), 21.8 + b, 0.8, 0.75, O.mantle.clasp, { bulge: 0.9 });
  }
  if (O.scarf) {
    const sw = P.f === 0 ? 1 : -1;
    cv.part({ ol: 'line' });
    cv.poly([[X(1.8), 20.4 + b], [X(-2.4), 20.4 + b], [X(-2.8), 21.8 + b], [X(2.4), 21.8 + b]], O.scarf.m, { cx: 0.6 });
    cv.part({ ol: 'soft' });
    cv.lock([X(-2.4), 21.2 + b], [X(-5.4), 21.6 + b - sw * 0.4], [X(-8.6), 22.8 + b + sw * 0.6], 1.0, 0.5, O.scarf.m2);
  }
}

// ───────────── スカート・ローブの すそ・こしの いた ─────────────
export function drawSkirt(cv, P, O) {
  const S = O.skirt;
  const kind = S.kind || 'skirt';
  const f = P.fem;
  const sw = P.f === 0 ? 1 : -1;
  if (P.side) {
    const X = P.X, b = P.bob;
    const y0 = S.y0 + b, y1 = S.y1;
    const back = -3.2 - S.flare * 0.5, front = 2.8 + S.flare * 0.45;
    const swing = P.f === 0 ? 0.6 : 0;
    if (kind === 'flaps') {
      // サイヤ人の こしの いた（よこの 1まい）
      cv.part({ ol: 'line' });
      cv.poly([[X(-2.4), y0], [X(1.9), y0], [X(2.2 + swing * 0.3), y1 - 0.7], [X(1.6 + swing * 0.3), y1], [X(-2.0), y1], [X(-2.8 - swing * 0.2), y1 - 0.7]], S.m, { n: 'bevel', bw: 0.6, bs: 0.7 });
      const id = cv.cur;
      cv.crease([[X(-2.4), y0 + 1.6], [X(2.0), y0 + 1.6]], 0.2, -0.45, { parts: [id] });
      return;
    }
    if (kind === 'coat') {
      // ロングコートの すそ（まえが ひらいて 赤い うら地が 見える）
      cv.part({ ol: 'line' });
      cv.poly([[X(-3.0), y0], [X(2.7), y0], [X(front * 0.72 + swing), y1 - 0.3], [X(back - swing * 0.5), y1]], S.m, { cx: 0.8, cy: 0.2 });
      const id = cv.cur;
      cv.crease([[X(-0.4), y0 + 1.0], [X(-0.6 - swing * 0.3), y1 - 0.4]], 0.22, -0.42, { parts: [id] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[X(2.5), y0 + 0.6], [X(front * 0.72 + swing - 0.2), y1 - 0.4]], 0.45, S.lining, { n: [0, 0] });
      return;
    }
    cv.part({ ol: 'line' });
    const sideM = kind === 'tiers' ? S.tiers[S.tiers.length - 1] : S.m;
    cv.poly([[X(-3.0), y0], [X(2.7), y0], [X(front + swing), y1], [X(back - swing * 0.5), y1]], sideM, { cx: 0.8, cy: 0.2, tex: S.tex ? S.tex(cv.k) : null });
    const id = cv.cur;
    if (kind === 'tiers') {
      // 3だんの フリル（うえの だんを かさねる）と フルーツ
      const n = S.tiers.length;
      for (let i = n - 2; i >= 0; i--) {
        const tb = y0 + ((y1 - y0) * (i + 1)) / n;
        cv.part({ ol: 'soft', clip: id });
        cv.poly([[6, y0 - 1], [26, y0 - 1], [26, tb], [6, tb]], S.tiers[i], { cx: 0.8, cy: 0.2 });
      }
      for (let i = 1; i <= n; i++) {
        const tb = y0 + ((y1 - y0) * i) / n;
        cv.part({ ol: 'none', clip: id });
        cv.poly([[6, tb - 0.55], [26, tb - 0.55], [26, tb + 0.6], [6, tb + 0.6]], S.trim, { cx: 0.6 });
      }
      fruitIcon(cv, X(0.6 + S.flare * 0.2), y0 + (y1 - y0) * 0.8, 'berry', 0.6);
      return;
    }
    if (kind === 'faulds' || kind === 'kusazuri') {
      for (let y = y0 + 1.4; y < y1; y += 1.5) cv.crease([[X(-4), y], [X(4), y]], 0.22, -0.55, { parts: [id] });
    } else if (kind === 'hakama' || kind === 'pleat' || kind === 'robe') {
      cv.crease([[X(0), y0 + 1], [X(0.6), y1 - 0.3]], 0.22, -0.4, { parts: [id] });
    }
    if (S.trim && kind !== 'faulds') { cv.part({ ol: 'none', clip: id }); cv.rect(X(-6), y1 - 0.8, 12, 0.8, S.trim, { cx: 0.6 }); cv.rect(X(6) - 12, y1 - 0.8, 12, 0.8, S.trim, { cx: 0.6 }); }
    return;
  }
  const top = f ? 4.4 : 4.9, fl = S.flare;
  const y0 = S.y0, y1 = S.y1;
  const pts = [[16 - top, y0], [16 + top, y0], [16 + top + fl, y1], [16 - top - fl, y1]];
  if (kind === 'flaps') {
    // サイヤ人の こしの いた（左右に 1まいずつ。まんなかは あいている）
    for (const s of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.poly([[16 + s * 1.3, y0], [16 + s * top, y0], [16 + s * (top + fl), y1 - 0.8], [16 + s * (top + fl - 0.7), y1], [16 + s * 1.9, y1], [16 + s * 1.5, y1 - 0.8]], S.m, { n: 'bevel', bw: 0.6, bs: 0.7 });
      const id = cv.cur;
      cv.crease([[16 + s * 1.4, y0 + 1.6], [16 + s * (top + fl * 0.5), y0 + 1.6]], 0.2, -0.45, { parts: [id] });
    }
    return;
  }
  if (kind === 'coat') {
    // ロングコートの すそ（まえが ひらいて、うちがわの ふちに 赤い うら地。あるくと ゆれる）
    for (const s of [-1, 1]) {
      const swy = (P.f === 0 ? 0.35 : -0.35) * s;
      cv.part({ ol: 'line' });
      cv.poly([[16 + s * 0.3, y0], [16 + s * top, y0], [16 + s * (top + fl) + swy, y1], [16 + s * 2.0 + swy, y1 + 0.15], [16 + s * 0.8, y0 + 2.6]], S.m, { cx: 0.8, cy: 0.2 });
      const id = cv.cur;
      cv.crease([[16 + s * 2.8, y0 + 1.4], [16 + s * (3.4 + fl * 0.5) + swy, y1 - 0.4]], 0.22, -0.42, { parts: [id] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[16 + s * 0.75, y0 + 2.4], [16 + s * 2.05 + swy, y1 + 0.1]], 0.5, S.lining, { n: [0, 0] });
    }
    return;
  }
  if (kind === 'tiers') {
    // 3だんの フリル（いちばん したの だんから かく）。すそは 白い レースで なみうつ
    const n = S.tiers.length;
    for (let i = n - 1; i >= 0; i--) {
      const ta = i ? y0 + ((y1 - y0) * i) / n - 0.4 : y0;
      const tb = y0 + ((y1 - y0) * (i + 1)) / n;
      const w0 = top + fl * (i / n) * 0.85, w1 = top + fl * ((i + 1) / n);
      const bot = [];
      for (let j = 0; j <= 8; j++) bot.push([16 + w1 - (2 * w1 * j) / 8, tb + (j % 2 ? 0.45 : -0.1)]);
      cv.part({ ol: 'line' });
      cv.poly([[16 - w0, ta], [16 + w0, ta], ...bot], S.tiers[i], { cx: 0.85, cy: 0.2 });
      const id = cv.cur;
      cv.part({ ol: 'soft', clip: id });
      cv.poly([[16 - w1 - 1, tb - 0.75], [16 + w1 + 1, tb - 0.75], [16 + w1 + 1, tb + 1], [16 - w1 - 1, tb + 1]], S.trim, { cx: 0.7 });
      for (const x of [-0.5, 0.5]) cv.crease([[16 + x * w0, ta + 0.3], [16 + x * w1 * 1.1, tb - 0.6]], 0.2, -0.32, { parts: [id] });
    }
    const ym = y0 + (y1 - y0) * 0.8;
    fruitIcon(cv, 16 - 4.4, ym, 'berry', 0.8);
    fruitIcon(cv, 16 - 0.2, ym + 0.2, 'orange', 0.72);
    fruitIcon(cv, 16 + 4.2, ym - 0.2, 'grape', 0.6);
    fruitIcon(cv, 16 + 2.2, y0 + (y1 - y0) * 0.5, 'lemon', 0.62);
    fruitIcon(cv, 16 - 2.4, y0 + (y1 - y0) * 0.5, 'berry', 0.55);
    return;
  }
  if (kind === 'frill') {
    // ふりふり（すそが なみうつ）
    const n = 8, bot = [];
    for (let i = 0; i <= n; i++) {
      const x = 16 + top + fl - ((2 * (top + fl)) * i) / n;
      bot.push([x, y1 + (i % 2 ? 0.5 : -0.1)]);
    }
    cv.part({ ol: 'line' });
    cv.poly([[16 - top, y0], [16 + top, y0], ...bot], S.m, { cx: 0.85, cy: 0.2 });
    const id = cv.cur;
    if (S.trim) { cv.part({ ol: 'soft', clip: id }); cv.poly([[16 - top - fl - 1, y1 - 1.0], [16 + top + fl + 1, y1 - 1.0], [16 + top + fl + 1, y1 + 1], [16 - top - fl - 1, y1 + 1]], S.trim, { cx: 0.7 }); }
    for (const x of [-2.4, 0, 2.4]) cv.crease([[16 + x * 0.6, y0 + 0.6], [16 + x * 1.2, y1 - 0.4]], 0.24, -0.38, { parts: [id] });
    return;
  }
  cv.part({ ol: 'line' });
  cv.poly(pts, S.m, { cx: 0.85, cy: 0.2, tex: S.tex ? S.tex(cv.k) : null });
  const id = cv.cur;
  if (kind === 'faulds' || kind === 'kusazuri') {
    // こしの いた（よこに ならぶ）
    const rows = S.rows || 2;
    for (let r = 1; r < rows + 1; r++) {
      const y = y0 + ((y1 - y0) * r) / (rows + 0.6);
      cv.crease([[16 - top - fl, y], [16 + top + fl, y]], 0.24, -0.6, { parts: [id] });
      cv.crease([[16 - top - fl, y + 0.35], [16 + top + fl, y + 0.35]], 0.18, 0.3, { parts: [id] });
    }
    cv.crease([[16, y0 + 0.4], [16, y1 - 0.2]], 0.24, -0.55, { parts: [id] });
    if (kind === 'kusazuri') for (const x of [-2.6, 2.6]) cv.crease([[16 + x, y0 + 0.4], [16 + x * 1.2, y1 - 0.2]], 0.22, -0.55, { parts: [id] });
    if (S.trim) { cv.part({ ol: 'none', clip: id }); cv.stroke([[16 - top - fl + 0.2, y1 - 0.35], [16 + top + fl - 0.2, y1 - 0.35]], 0.38, S.trim, { n: [0, 0.2] }); }
  } else if (kind === 'robe' || kind === 'hakama' || kind === 'pleat') {
    // たての ひだ（あるくと ゆれる）
    const xs = kind === 'pleat' ? [-3, -1.5, 0, 1.5, 3] : [-2.6, 0, 2.6];
    for (const x of xs) cv.crease([[16 + x * 0.7, y0 + 1.0], [16 + x * 1.15 + sw * 0.25, y1 - 0.3]], 0.24, -0.42, { parts: [id] });
    if (kind === 'hakama') cv.crease([[16, y0 + 3], [16, y1]], 0.3, -0.6, { parts: [id] });
    if (S.front) { cv.part({ ol: 'soft', clip: id }); cv.poly([[15.2, y0], [16.8, y0], [17.2, y1], [14.8, y1]], S.front, { cx: 0.5 }); }
    if (S.front && S.trim && S.front !== S.trim) {
      // まえの おびの ふち（ダ天使: むらさきの おびに 銀の ふち）
      cv.part({ ol: 'none', clip: id });
      for (const s of [-1, 1]) cv.stroke([[16 + s * 0.85, y0], [16 + s * 1.25, y1]], 0.2, S.trim, { n: [0, 0] });
    }
    if (S.trim) { cv.part({ ol: 'soft', clip: id }); cv.poly([[10, y1 - 1.0], [22, y1 - 1.0], [22, y1 + 1], [10, y1 + 1]], S.trim, { cx: 0.7 }); }
  } else if (kind === 'strips') {
    for (const x of [-2.6, 0, 2.6]) cv.crease([[16 + x, y0 + 0.6], [16 + x * 1.2, y1]], 0.24, -0.6, { parts: [id] });
  } else if (S.trim) {
    cv.part({ ol: 'soft', clip: id });
    cv.poly([[10, y1 - 0.8], [22, y1 - 0.8], [22, y1 + 1], [10, y1 + 1]], S.trim, { cx: 0.7 });
  }
}

// ───────────── ベルト ─────────────
export function drawBelt(cv, P, O) {
  const B = O.belt;
  const f = P.fem;
  const y = B.y + (P.side ? P.bob : 0);
  const h = B.obi ? 1.5 : 1.15;
  cv.part({ ol: 'line' });
  if (P.side) {
    const X = P.X;
    cv.poly([[X(-3.1), y], [X(2.8), y], [X(2.8), y + h], [X(-3.1), y + h]], B.m, { cx: 0.8, cy: 0.5 });
    if (B.tools) toolPouch(cv, P, y, h);
    if (B.sash) { cv.part({ ol: 'soft' }); cv.lock([X(-2.8), y + h * 0.6], [X(-3.8), y + 2.4], [X(-3.6), y + 4.4], 0.6, 0.35, B.m); }
    if (B.buckle) { cv.part({ ol: 'soft' }); cv.ell(X(2.6), y + h / 2, 0.55, 0.62, B.buckle, { bulge: 0.8 }); }
    if (B.flap) beltFlap(cv, P, y, h, B.flap);
    return;
  }
  const w = (f ? 4.5 : 5.0) + (O.torso.kind === 'plate' ? 0.3 : 0);
  cv.poly([[16 - w, y], [16 + w, y], [16 + w + 0.15, y + h], [16 - w - 0.15, y + h]], B.m, { cx: 0.85, cy: 0.5 });
  if (B.tools) toolPouch(cv, P, y, h);
  if (B.flap) beltFlap(cv, P, y, h, B.flap);
  if (P.back) return;
  if (B.sash) {
    // むすびめと たれ
    cv.part({ ol: 'soft' });
    cv.ell(16 + 2.6, y + h / 2, 0.9, 0.75, B.m, { bulge: 0.7 });
    cv.part({ ol: 'soft' });
    cv.lock([16 + 2.4, y + h], [16 + 2.6, y + 2.4], [16 + 2.2, y + 3.8], 0.55, 0.32, B.m);
    cv.lock([16 + 3.0, y + h], [16 + 3.6, y + 2.2], [16 + 3.8, y + 3.4], 0.5, 0.3, B.m);
  }
  if (B.buckle) {
    cv.part({ ol: 'line' });
    if (B.sash) cv.ell(16, y + h / 2, 0.75, 0.7, B.buckle, { bulge: 0.9 });
    else cv.poly([[16 - 0.9, y - 0.1], [16 + 0.9, y - 0.1], [16 + 0.9, y + h + 0.1], [16 - 0.9, y + h + 0.1]], B.buckle, { n: 'bevel', bw: 0.35 });
  }
  if (B.pouch) {
    cv.part({ ol: 'line' });
    cv.poly([[16 + 2.6, y + h - 0.2], [16 + 4.4, y + h - 0.2], [16 + 4.2, y + h + 1.8], [16 + 2.8, y + h + 1.8]], B.pouch, { cx: 0.7, cy: 0.4 });
  }
}

// おびから たれる ぬの（はかい神の 赤い たれ。すそと まんなかに 金の ふち。うしろは みじかい）
function beltFlap(cv, P, y, h, F) {
  const sw = P.f === 0 ? 0.2 : -0.2;
  const len = P.back ? 4.2 : 6.4;
  cv.part({ ol: 'line' });
  if (P.side) {
    const X = P.X;
    cv.poly([[X(1.2), y + h - 0.2], [X(2.9), y + h - 0.2], [X(3.3 + sw), y + len], [X(1.4 + sw), y + len + 0.2]], F.m, { cx: 0.5, cy: 0.2 });
  } else cv.poly([[16 - 1.75, y + h - 0.2], [16 + 1.75, y + h - 0.2], [16 + 1.95 + sw, y + len], [16 - 1.55 + sw, y + len + 0.2]], F.m, { cx: 0.5, cy: 0.2 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.rect(8, y + len - 0.75, 16, 0.95, F.trim, { n: [0, 0.2] });
  if (!P.side) {
    cv.part({ ol: 'none', clip: id });
    cv.stroke([[16 + sw * 0.3, y + h], [16 + sw, y + len - 0.6]], 0.22, F.trim, { n: [0, 0] });
  }
}

// 設備屋の こしの 道具ぶくろ（スパナと ドライバーが 入った 革の ふくろ・きいろい メジャー）
// まえ: みぎに ふくろ・ひだりに メジャー / うしろ: はんたい / よこ: こしの よこに ふくろ
function toolPouch(cv, P, y, h) {
  const steel = metal('silver');
  const pouchM = leather('#8a5a30'), grip = cloth('#e8b020'), tape = cloth('#f2c81e');
  const pouch = (pt, sx) => {
    // ささった 道具（うしろ）→ ふくろ（まえ）
    cv.part({ ol: 'line' });
    cv.stroke([pt(1.0, h + 0.8), pt(0.9, -1.2)], 0.24, steel, { n: [0, 0] });
    cv.part({ ol: 'line' });
    cv.poly([pt(0.4, -1.3), pt(1.5, -1.3), pt(1.4, -2.2), pt(1.1, -1.7), pt(0.8, -1.7), pt(0.5, -2.2)], steel, { n: 'bevel', bw: 0.2 });
    cv.part({ ol: 'line' });
    cv.stroke([pt(2.0, h + 0.6), pt(2.05, -0.5)], 0.38, grip, { n: [0, 0] });
    cv.part({ ol: 'line' });
    cv.poly([pt(0, h - 0.2), pt(2.6 * sx, h - 0.2), pt(2.75 * sx, h + 2.6), pt(0.15, h + 2.8)], pouchM, { cx: 0.7, cy: 0.4 });
    cv.crease([pt(0.1, h + 0.6), pt(2.65 * sx, h + 0.6)], 0.2, -0.45, { parts: [cv.cur] });
  };
  if (P.side) {
    const X = P.X;
    pouch((u, v) => [X(-1.6 + u), y + v], 1);
    return;
  }
  const s = P.back ? -1 : 1;
  pouch((u, v) => [16 + s * (3.0 + u), y + v], 1);
  // メジャー
  cv.part({ ol: 'line' });
  const mx = 16 - s * 4.3, my = y + h + 0.7;
  cv.poly([[mx - 1.0, my - 0.9], [mx + 1.0, my - 0.9], [mx + 1.05, my + 1.0], [mx - 1.05, my + 1.0]], tape, { cx: 0.6, cy: 0.5 });
  cv.part({ ol: 'none' });
  cv.ell(mx, my + 0.05, 0.4, 0.4, cloth('#2a2a34'), { n: [0, 0] });
}

// ダ天使の 小さな 黒い はね（まえ: からだの うしろから かたの そとに 見える / うしろ: せなかに / よこ: せなかの うしろ）
export function drawWings(cv, P, O, where) {
  const m = O.wings.m;
  const sw = P.f === 0 ? 0 : 0.45;
  if (where === 'side' || where === 'far') {
    const X = P.X, b = P.bob;
    const far = where === 'far';
    wing(cv, (u, v) => [X(-1.6 - u * (far ? 0.86 : 1)), 22.2 + b + v - (far ? 0.9 : 0)], m, sw);
    return;
  }
  const base = where === 'back' ? 1.2 : 2.6;
  for (const s of [-1, 1]) wing(cv, (u, v) => [16 + s * (base + u * 1.06), 22.6 + v * 1.16], m, sw);
}
// はね 1まい（u: そとへ、v: したへ。T(u, v) → がめん）。うえへ のびて、さきから かざきり ばねが たれる
function wing(cv, T, m, sw) {
  const P = (list) => list.map(([u, v]) => T(u, v));
  const up = (v, k = 1) => v - sw * k;
  // かざきり ばね（そとの ものから）
  for (const [u0, v0, u1, v1, r] of [[6.8, -4.4, 8.4, -1.8, 0.82], [6.2, -3.4, 8.0, 1.0, 0.84], [5.4, -2.6, 6.8, 3.0, 0.8], [4.4, -2.0, 5.2, 3.8, 0.78], [3.2, -1.4, 3.6, 3.4, 0.72], [2.0, -0.8, 2.2, 2.4, 0.64]]) {
    cv.part({ ol: 'line' });
    cv.lock(T(u0, up(v0)), T((u0 + u1) / 2 + 0.5, up((v0 + v1) / 2, 0.5)), T(u1, up(v1, 0.3)), r, 0.2, m);
  }
  // うえの かざり ばね
  cv.part({ ol: 'line' });
  cv.poly(P([[0, 0.8], [0.4, up(-1.6, 0.4)], [1.8, up(-3.6, 0.7)], [3.8, up(-5.3)], [6.0, up(-6.6)], [8.6, up(-8.0)], [8.2, up(-5.2)], [7.0, up(-3.2, 0.7)], [5.6, -2.0], [3.8, -1.0], [2.0, 0.2], [1.0, 1.0]]), m, { cx: 0.6, cy: 0.5 });
  const id = cv.cur;
  cv.crease(P([[1.0, up(-1.4, 0.4)], [3.4, up(-3.6, 0.8)], [6.4, up(-4.8)]]), 0.2, 0.45, { parts: [id] });
  cv.crease(P([[1.8, 0.0], [3.8, up(-1.8, 0.5)], [6.6, up(-3.4, 0.8)]]), 0.18, -0.35, { parts: [id] });
}

// サイヤ人の 茶色い しっぽ（ふさふさ。あるくと すこし ゆれる）
export function drawTail(cv, P, O, where) {
  // ネコ型ロボットの みじかい しっぽ（さきに 赤い たま）
  if (O.tail.short) return robotTail(cv, P, O.tail, where);
  const m = O.tail.m;
  const sw = P.f === 0 ? 0 : 0.5;
  let ctrl;
  if (where === 'behind') ctrl = [[18.6, 29.8], [22.6, 31.8 + sw * 0.3], [25.0, 29.6], [24.6, 26.6 - sw * 0.3], [23.0, 25.6 - sw * 0.2]];
  else if (where === 'back') ctrl = [[16.0, 29.4], [16.6, 32.8], [19.6, 34.0 - sw * 0.3], [21.8, 31.8 - sw * 0.3], [21.0, 29.0 - sw * 0.2]];
  else {
    const X = P.X, b = P.bob;
    ctrl = [[X(-2.4), 29.4 + b], [X(-5.0), 31.6 + b], [X(-7.4 - sw * 0.3), 29.6 + b], [X(-7.2), 26.6 + b - sw * 0.3], [X(-5.8), 25.6 + b]];
  }
  const pts = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], d = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 4; k++) {
      const t = k / 4, t2 = t * t, t3 = t2 * t;
      const f = (q0, q1, q2, q3) => 0.5 * (2 * q1 + (-q0 + q2) * t + (2 * q0 - 5 * q1 + 4 * q2 - q3) * t2 + (-q0 + 3 * q1 - 3 * q2 + q3) * t3);
      pts.push([f(a[0], p1[0], p2[0], d[0]), f(a[1], p1[1], p2[1], d[1])]);
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  cv.part({ ol: 'line' });
  cv.stroke(pts, pts.map((_, i) => 0.95 - (i / (pts.length - 1)) * 0.3), m, { lw: 0.8 });
  const id = cv.cur;
  for (let i = 3; i < pts.length - 1; i += 3) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
    cv.crease([[x0 + (nx / l) * 0.6, y0 + (ny / l) * 0.6], [x1 - (nx / l) * 0.2, y1 - (ny / l) * 0.2]], 0.16, -0.4, { parts: [id] });
  }
}

// はかい神の 金の えり（はばの ひろい 金の えりに あおい おびと 赤い たま）。かたに のるので うでの あとで かく
export function drawCollar(cv, P, O) {
  const U = O.usekh;
  if (!U) return;
  if (P.side) {
    const X = P.X, b = P.bob;
    cv.part({ ol: 'line' });
    cv.poly([[X(-3.1), 20.8 + b], [X(-0.9), 20.2 + b], [X(1.4), 20.4 + b], [X(2.9), 21.5 + b], [X(3.3), 23.5 + b], [X(2.1), 24.2 + b], [X(1.0), 22.4 + b], [X(-1.0), 21.9 + b], [X(-2.8), 22.8 + b], [X(-3.5), 21.9 + b]], U.m, { n: 'bevel', bw: 0.35, bs: 0.6 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.stroke([[X(-3.1), 21.7 + b], [X(-0.9), 21.15 + b], [X(1.2), 21.4 + b], [X(2.5), 22.7 + b], [X(2.7), 23.6 + b]], 0.34, U.band, { n: [0, 0] });
    for (const [u, v] of [[-2.4, 22.3], [0.2, 21.8], [2.4, 23.6]]) { cv.part({ ol: 'none', cast: false }); cv.ell(X(u), v + b, 0.3, 0.3, U.bead, { n: [0, 0] }); }
    return;
  }
  // まえ・うしろ: くびの まわりの はんえん（うしろは あさい）
  const back = P.back;
  const rx = 6.6, ry = back ? 2.7 : 4.5, cy = 20.8;
  const pts = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI; pts.push([16 + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  for (let i = 16; i >= 0; i--) { const a = (i / 16) * Math.PI; pts.push([16 + Math.cos(a) * 2.5, cy - 0.2 + Math.sin(a) * (back ? 0.9 : 1.6)]); }
  cv.part({ ol: 'line' });
  cv.poly(pts, U.m, { n: 'bevel', bw: 0.4, bs: 0.6 });
  const id = cv.cur;
  const arcAt = (kx, ky) => { const o = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI; o.push([16 + Math.cos(a) * rx * kx, cy + Math.sin(a) * ry * ky]); } return o; };
  cv.part({ ol: 'none', clip: id });
  cv.stroke(arcAt(0.69, 0.64), back ? 0.48 : 0.62, U.band, { n: [0, 0] });
  const bid = cv.cur;
  // あおい おびの きれめ（たまを ならべた もよう）
  for (let i = 1; i < 16; i += 2) {
    const a = (i / 16) * Math.PI;
    cv.crease([[16 + Math.cos(a) * rx * 0.6, cy + Math.sin(a) * ry * 0.52], [16 + Math.cos(a) * rx * 0.78, cy + Math.sin(a) * ry * 0.76]], 0.12, -0.45, { parts: [bid] });
  }
  if (!back) {
    for (let i = 1; i < 16; i += 2) {
      const a = (i / 16) * Math.PI;
      cv.part({ ol: 'none', cast: false });
      cv.ell(16 + Math.cos(a) * (rx - 0.6), cy + Math.sin(a) * (ry - 0.5), 0.32, 0.32, U.bead, { n: [0, 0] });
    }
  }
}

// ───────────── かたあて ─────────────
export function drawPauldron(cv, P, A, O) {
  const Pd = O.pauldron;
  const s = P.side ? 1 : A.s;
  const z = Pd.size || 1;
  const [x, y] = A.sh;
  if (P.side && !A.near) return;
  if (Pd.kind === 'sode') {
    // 将軍の そで（しかくい いたを かさねる）
    cv.part({ ol: 'line' });
    const cx = P.side ? x : x + s * 0.8;
    const w = P.side ? 2.4 : 2.0;
    cv.poly([[cx - w, y - 1.6], [cx + w, y - 1.6], [cx + w + (P.side ? 0 : s * 0.6), y + 3.4], [cx - w + (P.side ? 0 : s * 0.6), y + 3.4]], Pd.m, { cx: 0.6 });
    const id = cv.cur;
    for (const yy of [y - 0.2, y + 1.3, y + 2.6]) cv.crease([[cx - w - 1, yy], [cx + w + 1, yy]], 0.24, -0.65, { parts: [id] });
    return;
  }
  cv.part({ ol: 'line' });
  const rx = (Pd.kind === 'leather' ? 2.0 : 2.5) * z, ry = (Pd.kind === 'leather' ? 1.5 : 2.0) * z;
  const cx = P.side ? x - 0.1 : x + s * 0.4, cy = y - 0.6;
  if (Pd.layers === 2) {
    cv.ell(cx + (P.side ? 0 : s * 0.3), cy + ry * 0.75, rx * 0.92, ry * 0.7, Pd.m, { bulge: 0.85 });
    if (Pd.trim) { cv.part({ ol: 'none', clip: cv.cur }); cv.ell(cx + (P.side ? 0 : s * 0.3), cy + ry * 1.25, rx * 1.0, ry * 0.4, Pd.trim, { bulge: 0.8 }); }
    cv.part({ ol: 'line' });
  }
  cv.ell(cx, cy, rx, ry, Pd.m, { bulge: 0.95 });
  const id = cv.cur;
  if (Pd.trim) {
    cv.part({ ol: 'none', clip: id });
    const pts = HeroCanvas.bez([cx - rx * 0.95, cy + ry * 0.25], [cx, cy + ry * 1.25], [cx + rx * 0.95, cy + ry * 0.25], 8);
    cv.stroke(pts, 0.4, Pd.trim, { n: [0, 0.3] });
  } else if (Pd.kind === 'plate') {
    cv.crease([[cx - rx * 0.8, cy + ry * 0.45], [cx, cy + ry * 0.8], [cx + rx * 0.8, cy + ry * 0.45]], 0.24, -0.5, { parts: [id] });
  }
  if (Pd.spike) {
    cv.part({ ol: 'line' });
    const sx = P.side ? cx : cx + s * rx * 0.3;
    cv.poly([[sx - 0.6, cy - ry * 0.6], [sx + (P.side ? -0.4 : s * 0.8), cy - ry - 1.6], [sx + 0.6, cy - ry * 0.6]], Pd.trim || Pd.m, { n: 'bevel', bw: 0.3 });
  }
}

// えんび服の すそ（アラシの ステージ衣装。こしから 2まい たれる。うらは 服の 色）
function drawTails(cv, P, C, where, sw, len) {
  const tx = tex.sequin(cv.k);
  if (where === 'behind') {
    for (const s of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.poly([[16 + s * 3.0, 28.2], [16 + s * 5.6, 28.4], [16 + s * 6.0 + sw * 0.2, len - 0.4], [16 + s * 3.6 + sw * 0.2, len]], C.m, { cx: 0.7, tex: tx });
    }
    return;
  }
  if (where === 'back') {
    for (const s of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.poly([[16 + s * 0.3, 27.8], [16 + s * 5.4, 27.6], [16 + s * 5.8 + sw * 0.3, len - 0.6], [16 + s * 3.4 + sw * 0.3, len], [16 + s * 0.9 + sw * 0.2, len - 1.6]], C.m, { cx: 0.8, cy: 0.2, tex: tx });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[16 + s * 0.5, 28.2], [16 + s * 1.0 + sw * 0.2, len - 1.8]], 0.4, C.inner, { n: [0, 0] });
    }
    return;
  }
  const X = P.X, b = P.bob;
  const flow = P.f === 0 ? 1.0 : 0.4;
  cv.part({ ol: 'line' });
  cv.poly([[X(-0.8), 27.8 + b], [X(-3.2), 27.6 + b], [X(-5.2 - flow), len - 1.2], [X(-3.6 - flow), len], [X(-1.6 - flow * 0.5), len - 1.4]], C.m, { cx: 0.8, tex: tx });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.stroke([[X(-1.0), 28.2 + b], [X(-1.8 - flow * 0.5), len - 1.6]], 0.4, C.inner, { n: [0, 0] });
}

// ───────────── マント ─────────────
export function drawCape(cv, P, O, where) {
  const C = O.cape;
  const sw = P.f === 0 ? 1 : -1;
  const len = C.len || 34;
  if (C.tails) return drawTails(cv, P, C, where, sw, len);
  if (where === 'behind') {
    // まえむき: からだの うしろに ひろがる（はしと すそ だけ 見える）
    cv.part({ ol: 'line' });
    cv.poly([[16 - 5.4, 21.0], [16 + 5.4, 21.0], [16 + 7.4, len - 3], [16 + 7.0 + sw * 0.3, len], [16 - 7.0 + sw * 0.3, len], [16 - 7.4, len - 3]], C.inner, { cx: 0.7 });
    capeFlame(cv, P, C, where, cv.cur, len, sw);
  } else if (where === 'back') {
    cv.part({ ol: 'line' });
    cv.poly([[16 - 5.6, 20.8], [16 + 5.6, 20.8], [16 + 7.0, len - 3], [16 + 6.6 + sw * 0.4, len], [16 + 2.0, len + 0.4], [16 - 2.0, len + 0.4], [16 - 6.6 + sw * 0.4, len], [16 - 7.0, len - 3]], C.m, { cx: 0.8, cy: 0.2 });
    const id = cv.cur;
    for (const x of [-3.4, 0, 3.4]) cv.crease([[16 + x * 0.6, 23.0], [16 + x + sw * 0.3, len - 0.4]], 0.28, -0.42, { parts: [id] });
    cv.crease([[16 - 5.2, 21.4], [16 + 5.2, 21.4]], 0.3, 0.3, { parts: [id] });
    capeFlame(cv, P, C, where, id, len, sw);
  } else {
    const X = P.X, b = P.bob;
    cv.part({ ol: 'line' });
    const flow = P.f === 0 ? 1.0 : 0.4;
    cv.poly([[X(1.0), 20.8 + b], [X(-2.8), 21.0 + b], [X(-5.4 - flow), len - 4], [X(-6.4 - flow * 1.4), len - 0.6], [X(-3.0 - flow), len], [X(-1.4), len - 2]], C.m, { cx: 0.8, cy: 0.2 });
    const id = cv.cur;
    cv.crease([[X(-2.6), 23.0 + b], [X(-4.4 - flow), len - 1]], 0.26, -0.45, { parts: [id] });
    capeFlame(cv, P, C, where, id, len, sw);
  }
}
