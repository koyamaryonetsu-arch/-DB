// 第79回 幻の職業 12この みため（docs/plan-r79-phantom-looks.md）
// 「きわめた 2つの 職業が 合わさった、いちばん 上の すがた」。もとの 2つの 衣装の とくちょうを どちらも 入れ、
// 伝説の 衣装より 1だん ごうか（かざり・マント・光る 色・かんむりや オーラの 小さな しるし）。
// 今 ある 服の 形・ぼうし・もちもの・オーラを 組み合わせ、足りない 部品だけ ここで 足す。
//
//  海賊王           … ニカの 白い 服に 海賊の 赤い おびと 青い 半ズボン・金の かたかざりの 赤い 船長の コート・麦わらぼうしに 金の かんむり・白い くもと 金の きらきら
//  伝説の超勇者     … ロトの 青と 金の よろいに 道着の オレンジ・赤い マント（うらは 金）・さか立つ 金の かみ・金の サークレット・金の オーラと 雷
//  日の火影         … 火影の オレンジと 黒の 服に 市松もようの 羽織・白い マント（すそに ほのお）・日輪の 耳かざり・赤い ひたいあて・火の粉の オーラ
//  天才しせつ管理者AI … 光る 線の 白い 作業服に 水色の エプロン・すける ホログラムの マント・ARバイザー・回路の オーラ・ホログラム
//  名探てい王       … 青い 探ていの 服に 茶色の コートと ケープ・ぼうしの 上に 金の かんむり・大きな 金の 虫めがね
//  銀河の女王       … 夜空色の 足もとまでの ドレス・星の ちらばる マント・ティアラ・銀河色の おだんごの かみ・星の つえ・星の 光
//  銀河の王（男の子） … 銀と 夜空色の よろい・星の マント・金の かんむり・光る 星の バラ
//  大魔導王         … 金の ふちの 深い みどりの ローブ・赤と 金の マフラー・赤い うらの 黒い マント・王の つえ・みどりの 魔力の オーラ
//  天下むそうの剣聖 … 赤い 着物に 白い はかま・将軍の こんの 陣羽織と 家もん・白い マント・こしに 二本の 刀・銀の 剣気
//  宇宙一のおかん   … 白い かっぽう着と むらさきの カーディガン・夜空の マント（うらは ピンク）・むらさきの サンバイザー・おたま・宇宙の きらきら
//  はかいと創造の神 … はかい神の 服に 創る 緑の たれと ズボン・金の かたかざりの むらさきの マント（うらは 緑）・左右で 色の ちがう オーラ（むらさきと 緑）・両手に 光（左 むらさき・右 緑）
//  夢のスタジアム鉄道 … 野球の ユニフォームに 京急の 赤・金の メダル・白い 手ぶくろ・赤い マント（うらは 金）・赤い 運転士の ぼうし・電車
//  天候の神         … 白い 神さまの ころもに 金の ふち・空色の マント（うらは 白）・頭の うしろに 日輪・太陽の つえ・雲と 雷の オーラ
//
//   R79_JOBS     … 職業の id（shared/data/jobs.js の PHANTOM_ORDER と おなじ）
//   R79_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R79_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R79_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる。'combo79' は 2つの ぼうしを かさねる）
//   R79_HAIR     … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R79_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R79_MASC     … 男の子の すがた（銀河の王。hero-r33.js の masc33 が この 表も 見る）
//   AURA79       … オーラの せってい（hero-aura.js の AURA に まぜる。cols2: みぎ半分の 色）
//   outfit79(O, S)          … 服の つけたし（outfit26 の つけたしから。マントの うら・金の かたかざり・二本目の 刀・星）
//   drawR79(cv, P, O, layer) … 二本目の 刀・星の もよう・頭の うしろの 日輪（drawR26 から）
//   drawProp79(cv, P, A, O)  … 王の つえ・大きな 虫めがね（drawProp26 から。かいたら true）
//   handMark79(cv, A, P, O)  … 両手の 光（hero.js の 手の あと）
import { mat, ramp, TH, mixC } from './hero-raster.js?v=298589449c4c';

export const R79_JOBS = ['pirate_king', 'super_hero', 'sun_hokage', 'facility_ai', 'detective_king', 'galaxy_queen',
  'grand_magus', 'sword_saint', 'cosmic_okan', 'chaos_creator', 'dream_stadium', 'weather_god'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const SILVER = ['#3a4256', '#78839e', '#b6bed2', '#e4e8f2', '#ffffff'];
const gemM = (c) => mat({ r: [mixC(c, '#000000', 0.45), mixC(c, '#000000', 0.15), c, mixC(c, '#ffffff', 0.55), '#ffffff'], th: TH.gem, spec: 0.9, sc: '#ffffff' });
// すける ぬの（ホログラムの マント）
const sheer = (c) => mat({ r: ramp(c, 4, { light: 1.12 }), th: TH.cloth, spec: 0.94, sc: '#ffffff' });

const NIGHT = '#1a1650';

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r79: この ファイルの つけたしを つかう  capeIn: マントの うら  pad79: まえに ひらいた マントと かたかざりの 色（'gold' | 'silver'）
// dual79: 二本目の 刀の さやの 色  stars79: マント（と ドレス）に 星  holo79: すける ホログラムの マント  sun79: 頭の うしろの 日輪
export const R79_OUTFIT = {
  pirate_king: { kind: 'rubber', main: '#f6f6fb', sash: '#c83a3a', shorts: '#2a6a98', cuff: '#f6f6fb', loose: true, cape: '#b8141e', capeIn: '#e8b830', capeLen: 38.4, r79: true, pad79: 'gold' },
  super_hero: { kind: 'plate', metal: 'royal', under: '#f27a1c', trim: 'gold', cape: '#d0202a', capeIn: '#f2c430', capeLen: 38.2, big: true, bird: true, rank: 7, gemc: '#ffd84a', r79: true },
  sun_hokage: { kind: 'jump26', main: '#f07a1c', black: '#1e1e28', cape: '#f8f4ea', capeLen: 38.4, capeFlame: true, haori: { c: '#2a9a5a', pat: 'check' }, sheath: '#8a1a14' },
  facility_ai: { kind: 'work', main: '#eef6fc', piping: '#28eaff', glowLine: true, mark: 'chip', pants: '#1a2440', drug: '#1ab0b8', cape: '#8af0ff', capeLen: 37.6, r79: true, holo79: true },
  detective_king: { kind: 'suit', main: '#2a54b8', bow: '#d8202c', lapel: '#1e3c8a', pants: '#4c4e5c', coat: '#b07a3e', glasses: true, r33: true, cape: '#8a5a2e', capeIn: '#e8b830', capeLen: 31.6, drape: true },
  galaxy_queen: { kind: 'dress', main: '#3a2c9a', trim: '#e8dcff', r40: true, gown40: true, cape: NIGHT, capeIn: '#7a5ae0', capeLen: 39.6, r79: true, stars79: true, pad79: 'silver' },
  grand_magus: { kind: 'robe', main: '#1a3a2e', trim: '#e8b42e', trimMetal: 'gold', gem: '#5ae890', stars: true, cape: '#141018', capeIn: '#9a1c24', capeLen: 39.4, r33: true, scarf33: ['#9a1c24', '#e8b42e'] },
  sword_saint: { kind: 'hakama', main: '#c42a3a', hakama: '#ece8e0', haori: { c: '#24357e' }, crest27: true, sheath: '#2a1a1a', r79: true, dual79: '#141018', r29: true, cape: '#f2f0ea', capeIn: '#24357e', capeLen: 37.2, mantle29: true },
  cosmic_okan: { kind: 'okan', main: '#6a3ab0', apron: '#fbf8f4', pants: '#2a2244', cape: NIGHT, capeIn: '#e8307e', capeLen: 37.6, r79: true, stars79: true, pad79: 'gold', fem: { skirt: '#2a2244', pants: '#3a2a48' } },
  chaos_creator: { kind: 'hakai', main: '#261a42', pants: '#1e3a2e', flap: '#24a05a', cape: '#4a1a7a', capeIn: '#24a05a', capeLen: 38.2, r79: true, pad79: 'gold' },
  dream_stadium: { kind: 'baseball', main: '#fbf8ee', trim: '#d8202c', r41a: true, medal41a: '#d8202c', glove41a: '#f6f6fa', cape: '#c8141e', capeIn: '#e8b830', capeLen: 36.6, r79: true, pad79: 'gold' },
  weather_god: { kind: 'robe', main: '#f4f8ff', trim: '#ffd23a', trimMetal: 'gold', gem: '#7ad8ff', stars: true, cape: '#3a8ae8', capeIn: '#e8f4ff', capeLen: 39.4, r79: true, sun79: true },
};

// からだの とくちょう（よろいを きても のこる）。aura は hero-aura.js に ある もの か AURA79
// prop: 'staff79'（王の つえ。orb79: 玉の 色） 'glass79'（大きな 金の 虫めがね）  hand79: [左手, 右手] の 光の 色
export const R79_BODY = {
  pirate_king: { hair: 'nika', hcol: 'nikawhite', iris: '#3e3460', grin: true, scar: true, aura: 'pk79' },
  super_hero: { hair: 'ssj2', hcol: 'ssgold', iris: '#169a8a', aura: 'gold', spark: true },
  sun_hokage: { hcol: 'akagami', iris: '#d8501a', hanafuda: true, aura: 'sun79', spark: 'ember' },
  facility_ai: { aura: 'circuit', holo: true, iris: '#28d8ff', prop: 'medbox' },
  detective_king: { iris: '#2a58c4', prop: 'glass79', aura: 'hof' },
  galaxy_queen: { hair: 'moon33', hcol: 'r79galaxy', iris: '#9a6af0', crescent40: true, wings40: true, r40: true, prop: 'scepter40', aura: 'spirit41b' },
  grand_magus: { iris: '#2a9a5a', prop: 'staff79', orb79: '#5ae890', aura: 'magus79' },
  sword_saint: { hair: 'rurouni', hcol: 'rurouni', iris: '#8a5ab8', cross: true, aura: 'saint79' },
  cosmic_okan: { hair: 'perm', hcol: 'obapurple', iris: '#6a3a50', earring: true, prop: 'ladle66b', aura: 'okan79' },
  chaos_creator: { iris: '#d8a020', aura: 'chaos79', spark: 'ember', hand79: ['#c070ff', '#5aff9a'] },
  dream_stadium: { prop: 'train41a', r41a: true, aura: 'hof' },
  weather_god: { iris: '#4a8ae8', spark: true, prop: 'staff79', orb79: '#ffd23a', aura: 'weather79' },
};

// 布の服の ときの ぼうし。combo79: parts を じゅんに かさねる（dy: 上へ ずらす マス）
export const R79_HAT = {
  pirate_king: { kind: 'combo79', parts: [{ kind: 'straw', c: '#ecc86c', band: '#d42c28' }, { kind: 'crown43j', gemc: '#e8303a', gem2: '#3a9ae8', dy: -1.6 }], hides: 'top' },
  super_hero: { kind: 'circlet', mk: 'gold', gemc: '#e8303a' },
  sun_hokage: { kind: 'hitai26', c: '#8a1a14' },
  facility_ai: { kind: 'arhelmet', c: '#f8fcff', line: '#5af0ff', mark: 'chip', hides: 'top' },
  detective_king: { kind: 'combo79', parts: [{ kind: 'fedora26', c: '#8a5a2e', band: '#d8202c' }, { kind: 'crown43j', gemc: '#3a6ae8', gem2: '#e8203a', dy: -0.4 }], hides: 'top' },
  galaxy_queen: { kind: 'tiara', mk: 'gold', gemc: '#b07aff' },
  grand_magus: { kind: 'wizard', c: '#1a3a2e', band: 'gold', orb: '#7af0b0', hides: 'top' },
  cosmic_okan: { kind: 'visor', c: '#7a4ae0', big: true },
  chaos_creator: { kind: 'catcrown' },
  dream_stadium: { kind: 'conductor', c: '#c8141e', band: '#e8b830', hides: 'top' },
  weather_god: { kind: 'circlet', mk: 'gold', gemc: '#7ad8ff' },
};

// かみの いろ（銀河の女王: 銀に うすい むらさきと ピンク）
export const R79_HAIR = {
  r79galaxy: ['#4a3a84', '#8a78c8', '#c8b8f0', '#f0e8ff', '#ffffff'],
};

// 古い 小さな え（chars.js。32×42）
export const R79_OLD_LOOK = {
  pirate_king: { outfit: 'vest', cloth: '#f6f6fb', cape: '#b8141e', hat: 'straw', hatColor: '#ecc86c' },
  super_hero: { outfit: 'armor', cloth: '#2c62d6', cape: '#d0202a', hat: 'crown', hatColor: '#f2c14e' },
  sun_hokage: { outfit: 'traveler', cloth: '#f07a1c', cape: '#f8f4ea', hat: 'headband', hatColor: '#8a1a14' },
  facility_ai: { outfit: 'uniform', cloth: '#eef6fc', cape: '#8af0ff', hat: 'miner', hatColor: '#f8fcff' },
  detective_king: { outfit: 'suit', cloth: '#2a54b8', tie: '#d8202c', glasses: true, cape: '#8a5a2e', hat: 'crown', hatColor: '#f2c14e' },
  galaxy_queen: { outfit: 'dress', cloth: '#3a2c9a', cape: NIGHT, hat: 'tiara', hatColor: '#f2c14e' },
  grand_magus: { outfit: 'robe', robeMain: '#1a3a2e', robeTrim: '#e8b42e', hat: 'wizard', hatColor: '#1a3a2e', cape: '#141018' },
  sword_saint: { outfit: 'hakama', cloth: '#c42a3a', hakama: '#ece8e0', cape: '#f2f0ea' },
  cosmic_okan: { outfit: 'apron', cloth: '#6a3ab0', cape: NIGHT, hat: 'bbcap', hatColor: '#7a4ae0' },
  chaos_creator: { outfit: 'gi', cloth: '#1e1a32', giTrim: '#24a05a', cape: '#3a1a6a', hat: 'crown' },
  dream_stadium: { outfit: 'baseball', cloth: '#fbf8ee', trim: '#d8202c', cape: '#c8141e', hat: 'conductor', hatColor: '#c8141e' },
  weather_god: { outfit: 'robe', robeMain: '#f4f8ff', robeTrim: '#ffd23a', cape: '#3a8ae8', hat: 'crown', hatColor: '#f2c14e' },
};

// ───────────── 男の子の すがた（銀河の王） ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう（hero-r33.js の masc33）
export const R79_MASC = {
  galaxy_queen: {
    outfit: { kind: 'plate', metal: 'silver', under: '#2a1e6a', trim: 'gold', cape: NIGHT, capeIn: '#7a5ae0', capeLen: 39.2, big: true, rank: 7, gemc: '#b07aff', r79: true, stars79: true },
    body: { hcol: 'r79galaxy', iris: '#9a6af0', crescent40: true, r40: true, prop: 'rose33', rose33: '#b07aff', roseGlow33: true, r33: true, aura: 'spirit41b' },
    hat: { kind: 'crown43j', gemc: '#b07aff', gem2: '#3a9ae8' },
    old: { outfit: 'armor', cloth: '#b6bed2', cape: NIGHT, hat: 'crown', hatColor: '#f2c14e', rose: 'glow' },
  },
};

// ───────────── オーラ（hero-aura.js の AURA に まぜる） ─────────────
export const AURA79 = {
  // 海賊王: ニカの 白い くもに 金の きらきら
  pk79: { glow: 0.6, puff: 1.9, gap: 2.4, twinkle: true, cols: [['#ffffff', 230], ['#fbf8f0', 200], ['#f0e6c8', 160], ['#e2cf98', 115]] },
  // 日の火影: 赤と オレンジの 日の ほのお（火の粉は spark: 'ember'）
  sun79: { glow: 0.55, len: 3.4, wid: 1.2, up: 1.15, gap: 2.1, cols: [['#fff4c0', 210], ['#ffb840', 180], ['#ff6a1a', 148], ['#d02a14', 112]] },
  // 大魔導王: みどりの 魔力と きらきら
  magus79: { glow: 0.55, len: 3.2, wid: 1.15, up: 1.05, gap: 2.2, twinkle: true, cols: [['#eaffef', 205], ['#9af0b8', 176], ['#4ac880', 144], ['#1a8a50', 108]] },
  // 天下むそうの剣聖: 銀と あおじろい するどい 剣気（みじかい）
  saint79: { glow: 0.5, len: 2.8, wid: 0.95, up: 1.2, gap: 2.0, cols: [['#ffffff', 215], ['#dce8ff', 184], ['#a8c0f0', 150], ['#6a88c8', 112]] },
  // 宇宙一のおかん: むらさきの 宇宙の ひかりと 金の きらきら
  okan79: { glow: 0.45, len: 2.4, wid: 1.0, up: 1.2, gap: 2.5, twinkle: true, cols: [['#f4e0ff', 170], ['#d4a0ff', 142], ['#9a5ae8', 112], ['#5a2ab0', 84]] },
  // はかいと創造の神: ひだり半分は はかいの むらさき、みぎ半分は 創る 緑
  chaos79: { glow: 0.6, len: 3.7, wid: 1.3, up: 1.1, gap: 2.0, cols: [['#f0c8ff', 215], ['#c070ff', 186], ['#8a2ad8', 152], ['#4a1290', 116]], cols2: [['#d8ffe6', 215], ['#6ef0a0', 186], ['#24b860', 152], ['#0e6a34', 116]] },
  // 天候の神: 空いろの 雲（雷は spark）
  weather79: { glow: 0.55, puff: 1.7, gap: 2.5, cols: [['#ffffff', 220], ['#eef6ff', 190], ['#c4dcf4', 150], ['#90b4e0', 110]] },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit79(O, S) {
  if (!S.r79) return;
  if (O.cape && S.capeIn) O.cape.inner = cl(S.capeIn, { light: 1.05 });
  if (O.cape && S.holo79) {
    // すきとおった 水色の ホログラムの マント（うらも 明るい）
    O.cape = { ...O.cape, m: sheer(S.cape), inner: sheer(mixC(S.cape, '#ffffff', 0.4)) };
  }
  const R = (O.r79 = {});
  // まえに ひらいた マントと かたかざり（hero-r29.js の drawR29 を つかう）
  if (S.pad79 && O.cape) {
    const pad = mt(S.pad79 === 'silver' ? SILVER : GOLD);
    O.mantle29 = { m: O.cape.m, inner: O.cape.inner, pad };
  }
  if (S.dual79) R.dual = { m: mat({ r: ramp(S.dual79, 4, { light: 1.2 }), th: TH.cloth, spec: 0.95 }), grip: cl('#2a2a36'), tsuba: mt(SILVER) };
  if (S.stars79) R.stars = true;
  if (S.sun79) R.sun = { ring: mt(GOLD), core: cl('#fff2a0', { light: 1.1 }) };
}

// ───────────── かく（drawR26 から。layer は hero.js の じゅんばん） ─────────────
export function drawR79(cv, P, O, layer) {
  const R = O.r79;
  if (!R) return;
  const view = P.side ? 'side' : P.back ? 'back' : 'front';
  if (R.sun && ((view === 'front' && layer === 'behind') || (view === 'side' && layer === 'side'))) sunDisc(cv, P, R.sun);
  if (R.dual && layer === 'over') dualSheath(cv, P, R.dual);
  if (R.stars && O.cape && ((view === 'back' && layer === 'backTop') || (view === 'side' && layer === 'side'))) capeStars(cv, P, O.cape.len || 36);
  if (R.stars && O.skirt && layer === 'over' && view === 'front') skirtStars(cv, O.skirt);
}

// 頭の うしろの 日輪（金の わと 光の すじ）
function sunDisc(cv, P, S) {
  const cx = P.side ? P.X(-1.6) : 16, cy = P.head.y - 1.0;
  cv.part({ ol: 'line', cast: false });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    cv.cap(cx + Math.cos(a) * 10.0, cy + Math.sin(a) * 10.0, 0.6, cx + Math.cos(a) * 12.2, cy + Math.sin(a) * 12.2, 0.2, S.ring);
  }
  cv.part({ ol: 'line', cast: false });
  cv.ell(cx, cy, 10.4, 10.4, S.ring, { bulge: 0.5 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id, cast: false });
  cv.ell(cx, cy, 9.4, 9.4, S.core, { bulge: 0.3 });
}

// 二本目の 刀（一本目より すこし 上・長い 刀の うしろ）
function dualSheath(cv, P, S) {
  if (P.side) {
    const X = P.X, b = P.bob;
    cv.part({ ol: 'line' });
    cv.cap(X(0.2), 27.6 + b, 0.45, X(-6.2), 29.8 + b, 0.42, S.m);
    cv.part({ ol: 'line' });
    cv.ell(X(0.6), 27.4 + b, 0.32, 0.85, S.tsuba, { bulge: 0.8 });
    cv.part({ ol: 'line' });
    cv.cap(X(0.9), 27.3 + b, 0.38, X(2.9), 26.2 + b, 0.36, S.grip, { tex: (ix, iy) => ((ix + iy) % 3 === 0 ? 1.2 : 0) });
    return;
  }
  const s = P.back ? -1 : 1;
  cv.part({ ol: 'line' });
  cv.cap(16 + s * 4.6, 28.0, 0.45, 16 + s * 8.6, 30.6, 0.42, S.m);
  if (P.back) return;
  cv.part({ ol: 'line' });
  cv.ell(16 + s * 4.3, 27.8, 0.75, 0.45, S.tsuba, { bulge: 0.8 });
  cv.part({ ol: 'line' });
  cv.cap(16 + s * 4.1, 27.5, 0.38, 16 + s * 2.8, 26.0, 0.36, S.grip, { tex: (ix, iy) => ((ix + iy) % 3 === 0 ? 1.2 : 0) });
}

// 星（白と 金の 小さな ＋）
const STAR_C = ['#ffffff', '#ffe27a', '#d8c8ff'];
function star(cv, x, y, n) {
  const X = cv.X(x), Y = cv.Y(y);
  const c = STAR_C[n % STAR_C.length];
  cv.px(X, Y, c);
  if (cv.k >= 4 && n % 2 === 0) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) cv.px(X + dx, Y + dy, c);
}
// マントの 星（うしろ・よこ）
function capeStars(cv, P, len) {
  cv.part({ ol: 'none', cast: false });
  const pts = P.side
    ? [[-2.6, 24.4], [-4.2, 28.6], [-3.0, 32.4], [-5.2, len - 2.6]]
    : [[-3.6, 24.0], [2.8, 23.4], [0.4, 27.2], [-5.0, 30.2], [4.6, 29.6], [-1.8, 32.8], [2.6, len - 2.4], [-4.4, len - 2.0]];
  pts.forEach(([u, v], i) => star(cv, P.side ? P.X(u) : 16 + u, v + (P.bob && P.side ? P.bob : 0), i));
}
// ドレスの すその 星（まえ）
function skirtStars(cv, S) {
  if ((S.y1 || 0) < 36) return;
  cv.part({ ol: 'none', cast: false });
  [[-3.4, 32.0], [2.2, 33.4], [-1.0, 36.0], [4.6, 37.2], [-5.4, 37.4]].forEach(([u, v], i) => star(cv, 16 + u, v, i));
}

// ───────────── もちもの（drawProp26 から） ─────────────
export function drawProp79(cv, P, A, O) {
  const kind = O.body?.prop;
  if (kind !== 'staff79' && kind !== 'glass79') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  const g = mt(GOLD);
  if (kind === 'staff79') {
    // 王の つえ（金の 長い え・上に 光る 玉・玉を かこむ 2本の つめ）
    const orb = O.body.orb79 || '#5ae890';
    cv.part({ ol: 'line' });
    cv.cap(hx - d * 0.4, hy + 5.0, 0.4, hx + d * 1.0, hy - 6.4, 0.42, g);
    const tx = hx + d * 1.15, ty = hy - 8.0;
    for (const s of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.stroke([[tx + s * 0.4, ty + 1.8], [tx + s * 1.7, ty + 0.4], [tx + s * 1.2, ty - 1.4]], 0.3, g, { n: [0, 0] });
    }
    cv.part({ ol: 'line' });
    cv.ell(tx, ty, 1.35, 1.35, gemM(orb), { bulge: 0.95 });
    return true;
  }
  // 大きな 金の 虫めがね（手から 上へ。レンズは 水色に 光る）
  const x1 = hx + d * 1.6, y1 = hy - 3.4;
  cv.part({ ol: 'line' });
  cv.cap(hx - d * 0.2, hy + 1.2, 0.42, x1, y1, 0.42, cl('#5a3218'));
  const cx = x1 + d * 1.2, cy = y1 - 2.0;
  cv.part({ ol: 'line' });
  cv.ell(cx, cy, 2.5, 2.5, g, { bulge: 0.8 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.ell(cx, cy, 1.85, 1.85, gemM('#a8e4ff'), { bulge: 0.6 });
  return true;
}

// ───────────── 両手の 光（hero.js の 手の あと） ─────────────
export function handMark79(cv, A, P, O) {
  const C = O.body?.hand79;
  if (!C) return;
  if (P.side && !A.near) return;
  const col = C[A.right ? 1 : 0];
  cv.part({ ol: 'none', cast: false });
  const x = cv.X(A.hand[0]), y = cv.Y(A.hand[1]);
  const r = cv.k >= 4 ? 2 : 1;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.abs(dx) + Math.abs(dy) <= r) cv.px(x + dx, y + dy, Math.abs(dx) + Math.abs(dy) === r ? col : '#ffffff');
}
