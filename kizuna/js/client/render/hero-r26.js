// 第26回の 新しい 職業 20この みため（服・ぼうし・もちもの・からだの とくちょう）
// hero-outfit.js（服）・hero-gear.js（ぼうし）・hero.js（くみたて）から よばれる。
// どの え も「その 職業と わかる、でも そのまま うつさない」ゲームの ドットえ。
//
//   R26_OUTFIT … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R26_BODY   … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R26_HAT    … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R26_BODY_HAT … からだの いちぶの ぼうし（ネコ型ロボットの フード・カッパの おさら・はなかっぱの 花・ニンニクの 花）。よろいでも のこる
//   outfit26(O, S, Lk, fem) … 新しい 服の しゅるい（tights26・mascot26・kappa26・vest26・jump26）と、羽織・刀の さや など
//   drawR26(cv, P, O, layer) … 羽織・こうら・おなかの ポケット・バッジ などを かく（layer は hero.js の かく じゅんばん）
//   face26(cv, H, B, view, phase) … ひげ・赤い はな・くちばし・サングラス・花札の みみかざり・おしりの われめ・
//                                    はなかっぱの かお・楽天カードマンの メガネと カード（phase 'over': ぼうしの あと）
//   drawHat26(cv, P, H, G, view) … 新しい ぼうし（かえりち: かいたら true）
//   drawProp26(cv, P, A, O) … たての ない 手に もつ もの（カード・スプーン・虫めがね・きゅうり など）
import { mat, ramp, TH, mixC, HeroCanvas } from './hero-raster.js?v=506f2153b43f';
// 第27回の 暴れんぼう将軍の 家もんと せんす（hero-r27.js）
import { drawR27, drawProp27 } from './hero-r27.js?v=506f2153b43f';
// 第29回の るろうに剣士の 道の マント・十字の きず（hero-r29.js）
import { outfit29, drawR29, face29 } from './hero-r29.js?v=506f2153b43f';

// ───────────── ざいしつ（mat は おなじ ものを つくりなおさない） ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const SILVER = ['#3a4256', '#78839e', '#b6bed2', '#e4e8f2', '#ffffff'];
const DARKM = ['#120e1c', '#28223a', '#463e5e', '#6e6690', '#b8b0dc'];
const BLACK = ['#0e0c14', '#1e1a26', '#34303e', '#6a6680'];
const shoes = () => mat({ r: BLACK, th: TH.matte, spec: 0.95 });
const white = () => mat({ r: ['#8e8ca6', '#cac8da', '#f2f2f8', '#ffffff'], th: TH.cloth });

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// haori: 羽織（pat: もよう  hem: すその ほのお）  sheath: こしの 刀の さや  kyahan: 白い きゃはん
export const R26_OUTFIT = {
  // 楽天カードマン（赤い ヒーローの 服・金の ベルト・赤い マント・むねに カードの しるし）
  rakuten_cardman: { kind: 'tights26', main: '#d8202c', cape: '#c01a26', capeLen: 35.4, belt: 'gold', emblem: 'card' },
  // きさつ隊（黒い 隊服・白い きゃはん・うろこもようの 羽織・こしの 刀）
  kisatsu: { kind: 'gakuran', main: '#1c1c28', haori: { c: '#e8a828', pat: 'uroko', p: '#fff4d0' }, sheath: '#1e1a26', kyahan: true },
  // 炎柱（黒い 隊服・すそが ほのおの 白い 羽織）
  enbashira: { kind: 'gakuran', main: '#1c1c28', haori: { c: '#f6f4ee', hem: 'flame' }, sheath: '#8a1a14', kyahan: true },
  // 日の呼吸の使い手（黒い 隊服・緑と 黒の いちまつもようの 羽織）
  hinokami: { kind: 'gakuran', main: '#1c1c28', haori: { c: '#2a9a5a', pat: 'check' }, sheath: '#1a1a20', kyahan: true },
  // スパイ（黒い スーツ・白い シャツ・黒い ネクタイ。サングラスは からだの ほう）
  spy: { kind: 'suit', main: '#22242e', tie: '#16161e', pants: '#1c1e26' },
  // 殺し屋（まっくろな スーツ・こい はいいろの シャツ・赤い ネクタイ・黒い 手ぶくろ）
  assassin: { kind: 'suit', main: '#121216', tie: '#c0101c', shirt: '#34343c', pants: '#121216', gloves: true },
  // 黒の組織（黒い ロングコート・黒い ぼうし）
  black_org: { kind: 'coat', main: '#17171d', lining: '#3a3a46', plain: true },
  // 超能力者（むらさきの たかい えりの 服・銀の ボタン）
  esper: { kind: 'gakuran', main: '#3e2676', silver: true, pants: '#2a1c4c' },
  // 少年探てい団（はんそでの シャツ・半ズボン・むねに 探てい団の バッジ）
  shonen_tantei: { kind: 'kid', pants: '#3a4a7a', badge: true, fem: { skirt: '#c83a4a' } },
  // おしり探てい（キャメルの 上着と ながい すそ・赤い 蝶ネクタイ）
  oshiri_tantei: { kind: 'suit', main: '#b07a3e', bow: '#d8202c', lapel: '#7a4a22', pants: '#5a3a24', coat: '#c8945a' },
  // 名探てい（青い 上着・赤い 蝶ネクタイ・はいいろの 半ズボン・めがね）
  meitantei: { kind: 'suit', main: '#2a54b8', bow: '#d8202c', lapel: '#1e3c8a', pants: '#5c5e6c', glasses: true, shorts: true },
  // クリエイター（ドラッグストアの 店員: しろい シャツ・緑の エプロンに 薬の 十字・名札）
  creator: { kind: 'work', main: '#f2f5f8', tag: true, pants: '#34405a', drug: '#24a05a' },
  // ネコ型ロボット・耳無しネコ型ロボット・ドラえもん（青い まるい 着ぐるみ・しろい おなかと ポケット・赤い くびわと すず）
  neko_robot: { kind: 'mascot26', main: '#2a8ae0' },
  mimi_robot: { kind: 'mascot26', main: '#3a9cec' },
  doraemon: { kind: 'mascot26', main: '#1e86e4', big: true },
  // カッパ: 緑の はだ・すじの ある きいろい おなか（服は きない）
  kappa: { kind: 'kappa26', belly: '#d8d48a' },
  // はなかっぱ・はなかっぱ（筋肉ニンニク）: 明るい 黄緑の はだ・すじの ない クリームいろの おなか
  hanakappa: { kind: 'kappa26', belly: '#fbf2b4', plain: true },
  kinniku_kappa: { kind: 'kappa26', belly: '#fbf2b4', plain: true, muscle: true },
  // 木の葉の忍び（こんの 服に 緑の ベスト・せなかに 赤い うずまき）
  konoha: { kind: 'vest26', main: '#262e46', vest: '#55703e' },
  // 七代目火影（オレンジと 黒の 服に、すそが 赤い ほのおの 白い マント）
  hokage: { kind: 'jump26', main: '#f07a1c', black: '#1e1e28', cape: '#f4f2ea', capeLen: 37.6, capeFlame: true },
};

// 古い 小さな え（chars.js の lookToOpts。32×42）での 服と ぼうし
export const R26_OLD_LOOK = {
  rakuten_cardman: { outfit: 'tunic', cloth: '#d8202c', cape: '#c01a26', hat: 'cowl', hatColor: '#d8202c', glasses: true },
  kisatsu: { outfit: 'robe', robeMain: '#e8a828', robeTrim: '#1c1c28' },
  enbashira: { outfit: 'robe', robeMain: '#f6f4ee', robeTrim: '#e8501c' },
  hinokami: { outfit: 'robe', robeMain: '#2a9a5a', robeTrim: '#1c1c24' },
  spy: { outfit: 'suit', cloth: '#22242e', tie: '#16161e', glasses: true },
  assassin: { outfit: 'suit', cloth: '#121216', tie: '#c0101c' },
  black_org: { outfit: 'robe', robeMain: '#17171d', robeTrim: '#3a3a46', hat: 'cap', hatColor: '#17171d' },
  esper: { outfit: 'robe', robeMain: '#3e2676', robeTrim: '#d8c8ff' },
  shonen_tantei: { outfit: 'tunic', cloth: '#f4f4f4', hat: 'bbcap', hatColor: '#3a4a7a' },
  oshiri_tantei: { outfit: 'suit', cloth: '#b07a3e', tie: '#d8202c' },
  meitantei: { outfit: 'suit', cloth: '#2a54b8', tie: '#d8202c', glasses: true },
  creator: { outfit: 'apron', cloth: '#24a05a' },
  neko_robot: { outfit: 'tunic', cloth: '#2a8ae0', hat: 'hood', hatColor: '#2a8ae0' },
  mimi_robot: { outfit: 'tunic', cloth: '#3a9cec', hat: 'hood', hatColor: '#3a9cec' },
  doraemon: { outfit: 'tunic', cloth: '#1e86e4', hat: 'hood', hatColor: '#1e86e4' },
  kappa: { outfit: 'tunic', cloth: '#3e9446' },
  hanakappa: { outfit: 'tunic', cloth: '#9ad65a', hat: 'bandana', hatColor: '#f2507a' },
  kinniku_kappa: { outfit: 'gi', cloth: '#9ad65a', giTrim: '#fbf2b4' },
  konoha: { outfit: 'vest', cloth: '#55703e', hat: 'headband', hatColor: '#26304e' },
  hokage: { outfit: 'traveler', cloth: '#f07a1c', cape: '#f4f2ea', hat: 'headband', hatColor: '#1c1c24' },
};

// よろいを かえても のこる からだの とくちょう（hero-outfit.js の JOB_BODY に まぜる）
// skin: はだの いろ（カッパの 緑）  hair: 'none'（かみ なし）  prop: もちもの  whisker・nose: ドラえもん  beak: くちばし
// sun: サングラス  hanafuda: 花札の みみかざり  cleft: おしりの われめ  blush: ほお  armW・bodySX: きんにく  shell: カッパの こうら
// robotTail: 青い しっぽ（さきに 赤い たま）  cardGlasses: 黒い メガネの まえに 赤い 楽天カード
// hana: はなかっぱの かお（大きな 黒い 目・ピンクの ほお・わらった 小さな くち）と ちびキャラの からだ（大きな あたま）
export const R26_BODY = {
  rakuten_cardman: { prop: 'card', cardGlasses: true },
  enbashira: { hcol: 'flame', iris: '#e0641c' },
  hinokami: { hcol: 'akagami', iris: '#a03a2a', hanafuda: true },
  spy: { sun: true },
  assassin: { scar: true, iris: '#5a5a6a' },
  esper: { iris: '#b050ff', aura: 'psy', prop: 'spoon' },
  shonen_tantei: { prop: 'light' },
  oshiri_tantei: { hair: 'none', cleft: true, blush: true, prop: 'glass' },
  creator: { prop: 'medbox' },
  neko_robot: { robotTail: true },
  doraemon: { whisker: true, nose: true, robotTail: true },
  kappa: { skin: 'kappa', hair: 'bob', hcol: 'kappagreen', iris: '#2a5a2a', beak: true, shell: true, prop: 'cucumber' },
  hanakappa: { skin: 'hana', hair: 'none', noBrow: true, hana: true, shell: 'small' },
  kinniku_kappa: { skin: 'hana', hair: 'none', noBrow: true, hana: true, shell: 'small', armW: 1.62, bodySX: 1.14, prop: 'garlic' },
  konoha: { prop: 'scroll' },
  hokage: { iris: '#2a58c4', aura: 'chakra' },
};
// 職業の かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
export const R26_HAIR = {
  // 炎柱: 金色で さきが 赤い
  flame: ['#8a1c10', '#d8461c', '#f6a82a', '#ffe060', '#fff6c0'],
  // 日の呼吸: 赤みの ある こげ茶
  akagami: ['#2a0c0c', '#4e1a16', '#7a2a1e', '#a8483a', '#d88a70'],
  // カッパ: こい 緑の おかっぱ
  kappagreen: ['#0e2614', '#1c4424', '#2e6a36', '#4c9a50', '#9ad88a'],
};
// はだの いろ（カッパ・はなかっぱ）
export const R26_SKIN = {
  kappa: ['#2a6a34', '#3e9446', '#62b864', '#9ad88e'],
  // はなかっぱ: カッパより 明るくて やさしい 黄緑
  hana: ['#5a9e34', '#86c64a', '#ace468', '#dcf6a4'],
};

// 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
export const R26_HAT = {
  rakuten_cardman: { kind: 'cowl', c: '#d8202c', hides: 'top' },
  black_org: { kind: 'fedora26', c: '#17171d', band: '#3a3a46', hides: 'top' },
  konoha: { kind: 'hitai26', c: '#26304e' },
  hokage: { kind: 'hitai26', c: '#1c1c24' },
};
// からだの いちぶの ぼうし（よろいを きても のこる。かぶとを かぶると かぶとが かわりに なる）
export const R26_BODY_HAT = {
  neko_robot: { kind: 'robohood26', c: '#2a8ae0', ears: true, hides: 'all' },
  mimi_robot: { kind: 'robohood26', c: '#3a9cec', plaster: true, hides: 'all' },
  doraemon: { kind: 'robohood26', c: '#1e86e4', hides: 'all' },
  kappa: { kind: 'sara26', hides: 'top' },
  hanakappa: { kind: 'flower26', hides: 'all' },
  kinniku_kappa: { kind: 'garlic26', hides: 'all' },
};

// ───────────── 羽織の もよう（ドットごとの あかるさ。-3: いちばん くらい いろ、+3: いちばん あかるい いろ） ─────────────
const PAT = {
  // いちまつ（緑と 黒の しかく）
  check: (k) => {
    const s = k >= 4 ? 7 : 4;
    return (ix, iy) => ((Math.floor(ix / s) + Math.floor(iy / s)) % 2 ? -3 : 0);
  },
  // うろこ（三角の もよう）
  uroko: (k) => {
    const s = k >= 4 ? 8 : 6, hh = k >= 4 ? 7 : 5;
    return (ix, iy) => {
      const row = Math.floor(iy / hh);
      const u = (ix + (row % 2) * (s / 2)) % s, v = iy % hh;
      // したが ひろい 三角（うえの さきは 1ドット）
      return Math.abs(u - (s - 1) / 2) <= (v * (s / 2)) / (hh - 1) - 0.01 ? 3 : 0;
    };
  },
};
// 羽織の ざいしつ（もようの くらい いろ・あかるい いろも ランプに いれる）
function haoriMat(H) {
  if (H.pat === 'check') return mat({ r: ['#101016', '#1c7a46', '#2a9a5a', '#62c88a'], th: [-0.6, 0.3, 0.86] });
  if (H.pat === 'uroko') return mat({ r: ['#8a5410', '#d89420', '#eeb032', '#fff4d0'], th: [-0.3, 0.3, 1.2] });
  return mat({ r: ramp(H.c, 4), th: TH.cloth });
}

// ───────────── 服を くみたてる（hero-outfit.js の outfitOf から よぶ） ─────────────
// 新しい 服の しゅるいは ここで O を きめて true。前から ある しゅるいの 服には つけたし（羽織・さや など）だけ
export function outfit26(O, S, Lk, fem, main, phase) {
  if (phase === 'kind') return kind26(O, S, Lk, fem, main);
  // つけたし（前から ある しゅるい の あとで）
  if (S.haori) {
    const hm = haoriMat(S.haori);
    O.haori = { m: hm, tex: S.haori.pat ? PAT[S.haori.pat] : null, flame: S.haori.hem === 'flame', edge: cl(S.haori.pat === 'check' ? '#1c1c24' : mixC(S.haori.c, '#000000', 0.15)) };
    O.sleeve = { upper: hm, lower: hm, cuff: null, wide: 1.36, puff: 1.08, tex: O.haori.tex, haori: true };
  }
  if (S.sheath) O.sheath = { m: mat({ r: ramp(S.sheath, 4, { light: 1.2 }), th: TH.cloth, spec: 0.95 }), grip: cl('#2a2a36'), wrap: cl('#e8e4d8'), tsuba: mt(GOLD) };
  if (S.kyahan) {
    // 白い きゃはん（すねに まいた ぬの）と わらじ
    O.boots = { m: mat({ r: ['#3a2a18', '#6a4e30', '#9a7a52', '#c8a87a'], th: TH.matte }), h: 0.85, shaft: cl('#f2f0ea') };
    O.belt = { m: cl('#f2f0ea'), y: 28.3 };
  }
  if (S.silver && O.torso) O.torso.gold = mt(SILVER);
  if (S.plain && O.torso) {
    // 黒の組織: くさりと うでの ほうたいは つけない（ボタンは くらい 金ぞく）
    O.torso.chain = mt(DARKM);
    O.torso.plainCoat = true;
    O.sleeve = { ...O.sleeve, bandage: null };
  }
  if (S.shirt && O.torso) O.torso.shirt = cl(S.shirt);
  if (S.gloves) {
    O.glove = mat({ r: BLACK, th: TH.matte, spec: 0.95 });
    O.sleeve = { ...O.sleeve, cuff: O.glove };
  }
  if (S.coat) O.skirt = { m: O.top, y0: 28.4, y1: 36.6, flare: 1.6, kind: 'coat', lining: cl(S.coat), over: true };
  if (S.shorts && !fem) {
    O.shorts = 0.46;
    O.boots = { m: mat({ r: ['#6a1a24', '#b02a36', '#e04a52', '#ff8a8a'], th: TH.matte }), h: 0.36, shaft: cl('#f6f6f8'), toe: cl('#f4f4f6') };
  }
  if (S.glasses) O.glasses = true;
  if (S.badge) O.badge26 = true;
  if (S.drug) {
    O.apron = { m: cl(S.drug, { light: 0.9 }), y0: 28.0, y1: 34.6, flare: 0.7, bib: 22.6, pocket: cl(mixC(S.drug, '#ffffff', 0.3)), tie: cl(mixC(S.drug, '#000000', 0.2)) };
    O.drug26 = true;
  }
  // 第29回: マントの うら・かたあて・かみの ひも（hero-r29.js）
  if (S.r29) outfit29(O, S);
  return false;
}

function kind26(O, S, Lk, fem, main) {
  switch (S.kind) {
    case 'tights26': {
      // ヒーローの ぴったりした 服（赤）・白い 手ぶくろ・金の ベルト・赤い ブーツ・マント
      const rm = cl(main, { light: 0.95 });
      O.top = rm;
      O.torso = { kind: 'tights26', hem: 30.4, flare: 0.2 };
      O.sleeve = { upper: rm, lower: rm, cuff: cl('#f6f6fa'), cuffW: 1.18 };
      O.glove = white();
      O.pants = rm;
      O.boots = { m: cl(mixC(main, '#000000', 0.15)), h: 0.8, cuff: mt(GOLD) };
      O.belt = { m: mt(GOLD), buckle: mt(GOLD), y: 28.3 };
      O.cape = { m: cl(S.cape, { dark: 1.1 }), inner: cl(mixC(S.cape, '#000000', 0.35)), len: S.capeLen || 35 };
      O.card26 = true;
      return true;
    }
    case 'mascot26': {
      // 青い まるい 着ぐるみ（しろい おなか・ポケット・赤い くびわと 金の すず・しろい まるい 手と 足）
      const bm = cl(main, { light: 1.1 });
      O.top = bm;
      O.torso = { kind: 'mascot26', hem: 30.6, flare: 0.9 };
      O.sleeve = { upper: bm, lower: bm, cuff: null, puff: 1.12 };
      O.glove = white();
      O.pants = bm;
      O.legW = 1.18;
      O.boots = { m: white(), h: 0 };
      O.belt = null;
      O.mascot = { belly: white(), collar: cl('#e02a2a', { light: 1.1 }), bell: mt(GOLD), big: !!S.big };
      return true;
    }
    case 'kappa26': {
      // カッパ: はだ（緑）の からだ・きいろい おなか。服は きない（てと あしも はだ）
      O.top = Lk.skin;
      O.torso = { kind: 'kappa26', hem: 29.8, flare: 0.3 };
      O.sleeve = { upper: Lk.skin, lower: Lk.skin, cuff: null };
      O.pants = Lk.skin;
      O.boots = { m: Lk.skin, h: 0 };
      O.belt = null;
      O.kappa = { belly: cl(S.belly, { light: 1.05 }), muscle: !!S.muscle, plain: !!S.plain };
      return true;
    }
    case 'vest26': {
      // 木の葉の忍び: こんの ながそで・緑の ベスト（ポケット・まるい えり）・こんの ズボンと くつ
      const nm = cl(main);
      O.top = nm;
      O.torso = { kind: 'vest26', hem: 30.6, flare: 0.3 };
      O.sleeve = { upper: nm, lower: nm, cuff: cl(mixC(main, '#000000', 0.2)), cuffW: 1.1 };
      O.pants = nm;
      O.legW = 1.06;
      O.boots = { m: cl('#1c2234'), h: 0.5, shaft: cl('#e8e6e0') };
      O.belt = null;
      O.vest26 = { m: cl(S.vest, { light: 0.95 }), d: cl(mixC(S.vest, '#000000', 0.22)), swirl: cl('#d8303a') };
      return true;
    }
    case 'jump26': {
      // 七代目火影: オレンジの 上下に 黒い かたと えり・白い マント（すそに 赤い ほのお）
      const om = cl(main, { light: 1.05 });
      const bk = cl(S.black);
      O.top = om;
      O.torso = { kind: 'jump26', hem: 30.6, flare: 0.3, black: bk, zip: mt(SILVER) };
      O.sleeve = { upper: bk, lower: om, cuff: bk, cuffW: 1.12 };
      O.pants = om;
      O.legW = 1.08;
      O.boots = { m: bk, h: 0.4 };
      O.belt = null;
      O.cape = { m: cl(S.cape, { light: 0.95 }), inner: cl(mixC(S.cape, '#8a8070', 0.25)), len: S.capeLen || 37, flame: !!S.capeFlame };
      return true;
    }
  }
  return false;
}

// ───────────── からだの とくちょう（outfitOf の さいごに よぶ） ─────────────
export function body26(O, JB) {
  if (JB.robotTail) O.tail = { m: cl('#2a8ae0', { light: 1.1 }), ball: cl('#e02a2a', { light: 1.15 }), short: true };
  if (JB.shell) O.shell = { m: mat({ r: ['#24301a', '#4a5a2a', '#768a40', '#a8b868'], th: TH.matte, spec: 0.97 }), rim: mat({ r: ['#4a4020', '#8a7a40', '#c8b870', '#ece0a8'], th: TH.matte }), small: JB.shell === 'small' };
  // はなかっぱ: ちびキャラ（からだを あしもとへ ちぢめ、あたまを 大きく して したへ。上の 花の ための すきまを あける）
  //   s: あたまの 大きさ（ふつうの 何ばい）  dy: あたまを したへ（マス）  sy: からだの たての ちぢみ  top: これより うえは ちぢめる
  if (JB.hana) O.chibi = { s: 1, dy: 5.85, sy: 0.72, top: 2.4 };
  if (JB.armW) O.armW = JB.armW;
  if (JB.bodySX) O.bodySX = JB.bodySX;
}

// ───────────── ほのおの すそ（羽織・マント） ─────────────
// x0〜x1: よこの はば  yb: すそ  h: ほのおの たかさ  clip: その パーツ だけ  sw: ゆれ
function flameHem(cv, x0, x1, yb, h, clip, sw = 0) {
  const outer = cl('#e8501c', { light: 1.15 }), inner = cl('#c41c1c');
  const n = 7;
  const tongue = (k, ht, dx) => {
    const pts = [[x0 - 0.5, yb + 0.6]];
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const peak = ht * (0.65 + 0.35 * ((i * 37) % 5) / 4);
      pts.push([x + dx, yb - (i % 2 ? peak : peak * 0.35) * k]);
    }
    pts.push([x1 + 0.5, yb + 0.6]);
    return pts;
  };
  cv.part({ ol: 'soft', clip });
  cv.poly(tongue(1, h, sw * 0.3), outer, { cx: 0.5, cy: 0.3 });
  cv.part({ ol: 'none', clip });
  cv.poly(tongue(0.55, h, sw * 0.2 + 0.4), inner, { cx: 0.5, cy: 0.3 });
}

// ───────────── かく（hero.js の じゅんばん） ─────────────
// layer: 'behind'（まえむきの からだの うしろ）/ 'over'（服の うえ。まえ・よこ）/ 'neck'（うでの あと）/ 'back'（うしろむきの せなか）/ 'backTop'（うでの あと）/ 'side'（よこむきの からだの うしろ）
export function drawR26(cv, P, O, layer) {
  draw26(cv, P, O, layer);
  // 第27回: 暴れんぼう将軍の 羽織の 家もん（羽織の うえに）
  if (O.spec?.crest27) drawR27(cv, P, O, layer);
  // 第29回: 飛天御剣流けい承者の マントの まえの はしと かたあて
  if (O.mantle29) drawR29(cv, P, O, layer);
}
function draw26(cv, P, O, layer) {
  const view = P.side ? 'side' : P.back ? 'back' : 'front';
  if (layer === 'behind') {
    if (O.shell && !O.shell.small && view === 'front') shellFront(cv, O.shell);
    return;
  }
  if (layer === 'side') {
    if (O.shell) shellSide(cv, P, O.shell);
    return;
  }
  if (layer === 'over') {
    if (view === 'back') {
      if (O.sheath) sheath(cv, P, O.sheath);
      if (O.haori) haoriBack(cv, P, O.haori);
      if (O.vest26) vestBack(cv, O.vest26);
      if (O.mascot) cv.crease([[16, 23.0], [16, 29.6]], 0.2, -0.3, {});
      return;
    }
    torsoBits(cv, P, O, view);
    if (O.haori) (view === 'side' ? haoriSide : haoriFront)(cv, P, O.haori);
    if (O.sheath) sheath(cv, P, O.sheath);
    return;
  }
  if (layer === 'neck') {
    if (O.mascot && view !== 'back') collarBell(cv, P, O.mascot);
    if (O.armW > 1.3 && view !== 'side') for (const A of P.arms) biceps(cv, A, O);
    return;
  }
  if (layer === 'backTop') {
    if (O.shell) shellBack(cv, O.shell);
    if (O.mascot) collarBack(cv, O.mascot);
  }
}

// きんにくの こぶ（にのうでと かた。まえ・うしろ）
function biceps(cv, A, O) {
  const L = (t) => [A.sh[0] + (A.el[0] - A.sh[0]) * t, A.sh[1] + (A.el[1] - A.sh[1]) * t];
  const s = A.s || 1;
  const [bx, by] = L(0.55);
  cv.part({ ol: 'soft' });
  cv.ell(bx + s * 0.7, by, 1.9, 1.7, O.skin, { bulge: 0.9 });
  cv.part({ ol: 'soft' });
  cv.ell(A.sh[0] + s * 0.5, A.sh[1] - 0.3, 2.2, 1.8, O.skin, { bulge: 0.9 });
  cv.crease([[A.sh[0] - s * 0.6, A.sh[1] + 1.4], [A.sh[0] + s * 1.8, A.sh[1] + 1.0]], 0.16, -0.5, { parts: [cv.cur] });
}

// からだの まえの しるし（カード・おなか・ベスト・バッジ・薬の 十字）
function torsoBits(cv, P, O, view) {
  const side = view === 'side';
  const X = side ? P.X : (d) => 16 + d;
  const b = side ? P.bob : 0;
  if (O.card26) {
    // むねの カードの しるし（しろい カードに 金の IC と 赤い おび）
    const cx = side ? X(1.2) : 16, w = side ? 1.1 : 2.4, cy = 24.4 + b;
    cv.part({ ol: 'line' });
    cv.poly([[cx - w, cy - 1.6], [cx + w, cy - 1.6], [cx + w, cy + 1.6], [cx - w, cy + 1.6]], white(), { n: 'bevel', bw: 0.3 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.rect(cx - w, cy + 0.3, w * 2, 0.7, cl('#d8202c'));
    cv.part({ ol: 'soft' });
    cv.rect(cx - w * 0.7, cy - 1.0, Math.max(0.6, w * 0.55), 0.9, mt(GOLD), { n: 'bevel', bw: 0.2 });
  }
  if (O.mascot) {
    // しろい おなかと 半月の ポケット
    const M = O.mascot;
    if (side) {
      cv.part({ ol: 'line' });
      cv.poly([[X(0.4), 22.6 + b], [X(2.4), 23.4 + b], [X(3.1), 26.0 + b], [X(2.6), 29.2 + b], [X(0.6), 30.0 + b]], M.belly, { cx: 0.5 });
      const id = cv.cur;
      cv.part({ ol: 'soft', clip: id });
      cv.poly([[X(1.4), 26.6 + b], [X(3.2), 26.6 + b], [X(3.0), 28.0 + b], [X(1.6), 28.2 + b]], M.belly, { n: [0.3, 0.2] });
    } else {
      cv.part({ ol: 'line' });
      cv.ell(16, 26.4, 4.0, 3.9, M.belly, { bulge: 0.7 });
      const id = cv.cur;
      // ポケット（したの 半分の まる）
      const pts = [];
      for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; pts.push([16 + Math.cos(a) * 2.6, 26.6 + Math.sin(a) * 1.9]); }
      cv.part({ ol: 'soft', clip: id });
      cv.poly(pts, M.belly, { n: [0, 0.35] });
      cv.crease([[13.4, 26.6], [18.6, 26.6]], 0.18, -0.6, { parts: [id, cv.cur] });
    }
  }
  if (O.kappa) {
    // きいろい おなか（よこの すじ）。きんにくは むねと はらの われめ
    const K = O.kappa;
    if (side) {
      cv.part({ ol: 'soft' });
      cv.poly([[X(0.6), 22.4 + b], [X(2.4), 23.2 + b], [X(2.9), 26.0 + b], [X(2.4), 29.0 + b], [X(0.8), 29.6 + b]], K.belly, { cx: 0.5 });
    } else {
      cv.part({ ol: 'soft' });
      cv.ell(16, 25.8, K.muscle ? 3.6 : 3.3, 3.9, K.belly, { bulge: 0.6 });
      const id = cv.cur;
      if (K.muscle) {
        cv.crease([[16, 22.4], [16, 29.4]], 0.2, -0.6, { parts: [id] });
        for (const s of [-1, 1]) cv.crease([[16 + s * 0.4, 24.2], [16 + s * 2.4, 24.6], [16 + s * 3.4, 23.6]], 0.2, -0.6, { parts: [id] });
        for (const y of [26.0, 27.6]) cv.crease([[14.2, y], [17.8, y]], 0.18, -0.5, { parts: [id] });
      } else if (!K.plain) for (const y of [24.0, 25.6, 27.2, 28.6]) cv.crease([[13.6, y], [18.4, y]], 0.16, -0.4, { parts: [id] });
    }
  }
  if (O.vest26) {
    const V = O.vest26;
    if (side) {
      cv.part({ ol: 'line' });
      cv.poly([[X(1.4), 21.0 + b], [X(-2.4), 21.2 + b], [X(-3.3), 22.6 + b], [X(-3.1), 29.8 + b], [X(3.0), 29.8 + b], [X(2.9), 23.4 + b]], V.m, { cx: 0.7 });
      const id = cv.cur;
      cv.crease([[X(1.0), 24.2 + b], [X(2.8), 24.2 + b]], 0.18, -0.5, { parts: [id] });
    } else {
      for (const s of [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.poly([[16 + s * 0.4, 21.6], [16 + s * 3.6, 20.8], [16 + s * 5.8, 22.4], [16 + s * 5.2, 24.6], [16 + s * 4.8, 28.4], [16 + s * 5.1, 30.4], [16 + s * 0.3, 30.4]], V.m, { cx: 0.6 });
        const id = cv.cur;
        // ポケット 2だん
        for (const y of [23.6, 26.4]) {
          cv.part({ ol: 'soft', clip: id });
          cv.rect(16 + s * 1.2 - (s < 0 ? 2.6 : 0), y, 2.6, 1.8, V.d, { n: [0, -0.2] });
        }
      }
      // まるい えり
      cv.part({ ol: 'line' });
      cv.poly([[12.6, 20.4], [19.4, 20.4], [19.8, 21.4], [16.6, 22.6], [15.4, 22.6], [12.2, 21.4]], V.m, { cx: 0.6, n: 'row' });
    }
  }
  if (O.torso?.kind === 'jump26') {
    // 火影の 服: かたから むねの 黒い ところと、まんなかの チャック
    const T = O.torso;
    if (side) {
      cv.part({ ol: 'soft' });
      cv.poly([[X(1.6), 20.8 + b], [X(-2.4), 21.0 + b], [X(-3.3), 22.4 + b], [X(-3.2), 23.8 + b], [X(2.8), 23.6 + b], [X(2.6), 21.6 + b]], T.black, { cx: 0.6 });
    } else {
      cv.part({ ol: 'soft' });
      cv.poly([[11.0, 22.0], [13.0, 20.8], [19.0, 20.8], [21.0, 22.0], [21.4, 24.0], [10.6, 24.0]], T.black, { cx: 0.7 });
      cv.part({ ol: 'line' });
      cv.poly([[13.4, 20.2], [18.6, 20.2], [18.9, 21.6], [13.1, 21.6]], T.black, { cx: 0.5 });
      cv.part({ ol: 'none' });
      cv.stroke([[16, 21.6], [16, 30.4]], 0.2, T.zip, { n: [0, 0] });
    }
  }
  if (O.badge26 && !side) {
    // 少年探てい団の バッジ（金の まるに 虫めがねの しるし）
    const x = 18.6, y = 23.8;
    cv.part({ ol: 'line' });
    cv.ell(x, y, 1.05, 1.05, mt(GOLD), { bulge: 0.9 });
    cv.part({ ol: 'none', cast: false });
    cv.ell(x - 0.15, y - 0.15, 0.42, 0.42, cl('#3a4a8a'), { n: [0, 0] });
    cv.stroke([[x + 0.2, y + 0.2], [x + 0.6, y + 0.6]], 0.14, cl('#3a4a8a'), { n: [0, 0] });
  } else if (O.badge26 && side && P.facing) {
    cv.part({ ol: 'line' });
    cv.ell(X(1.9), 23.8 + b, 0.6, 0.95, mt(GOLD), { bulge: 0.9 });
  }
  if (O.drug26 && !side) {
    // エプロンの 胸あてに 薬の 十字
    const x = 16, y = 24.4;
    cv.part({ ol: 'soft', cast: false });
    cv.rect(x - 0.35, y - 1.1, 0.7, 2.2, white(), { n: [0, 0] });
    cv.rect(x - 1.1, y - 0.35, 2.2, 0.7, white(), { n: [0, 0] });
  }
}

// ───────────── 羽織 ─────────────
function haoriFront(cv, P, H) {
  const f = P.fem;
  const sw = P.f === 0 ? 0.25 : -0.25;
  const ids = [];
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    const pts = [[16 + s * 1.5, 20.7], [16 + s * (f ? 4.9 : 5.4), 20.9], [16 + s * (f ? 6.0 : 6.6), 22.6], [16 + s * (f ? 5.6 : 6.2), 25.0], [16 + s * (f ? 5.8 : 6.4), 29.0], [16 + s * (f ? 6.6 : 7.1) + sw, 35.6], [16 + s * 2.7 + sw, 35.8], [16 + s * 2.3, 29.0], [16 + s * 2.1, 24.0]];
    cv.poly(pts, H.m, { cx: 0.6, cy: 0.15, tex: H.tex ? H.tex(cv.k) : null });
    const id = cv.cur;
    ids.push(id);
    cv.crease([[16 + s * 3.6, 23.0], [16 + s * 4.4 + sw, 35.2]], 0.24, -0.4, { parts: [id] });
    // えり（あわせの ふち）
    cv.part({ ol: 'soft', clip: id });
    cv.stroke([[16 + s * 1.5, 20.6], [16 + s * 2.2, 24.0], [16 + s * 2.4, 29.0], [16 + s * 2.8 + sw, 35.9]], 0.55, H.edge, { n: [0, 0] });
  }
  if (H.flame) for (const [i, s] of [[0, -1], [1, 1]]) flameHem(cv, s < 0 ? 16 - 7.4 + sw : 16 + 2.3, s < 0 ? 16 - 2.3 : 16 + 7.4 + sw, 35.8, 3.4, ids[i], sw);
}
function haoriBack(cv, P, H) {
  const sw = P.f === 0 ? 0.3 : -0.3;
  cv.part({ ol: 'line' });
  cv.poly([[16 - 5.5, 20.6], [16 + 5.5, 20.6], [16 + 6.6, 22.6], [16 + 6.2, 25.0], [16 + 6.4, 29.0], [16 + 7.1 + sw, 35.6], [16 - 7.1 + sw, 35.6], [16 - 6.4, 29.0], [16 - 6.2, 25.0], [16 - 6.6, 22.6]], H.m, { cx: 0.8, cy: 0.15, tex: H.tex ? H.tex(cv.k) : null });
  const id = cv.cur;
  for (const x of [-3.0, 0, 3.0]) cv.crease([[16 + x * 0.7, 23.4], [16 + x + sw * 0.5, 35.2]], 0.24, -0.38, { parts: [id] });
  cv.part({ ol: 'soft', clip: id });
  cv.poly([[16 - 4.0, 20.4], [16 + 4.0, 20.4], [16 + 3.6, 21.4], [16 - 3.6, 21.4]], H.edge, { n: [0, -0.2] });
  if (H.flame) flameHem(cv, 16 - 7.6 + sw, 16 + 7.6 + sw, 35.6, 3.6, id, sw);
}
function haoriSide(cv, P, H) {
  const X = P.X, b = P.bob;
  const flow = P.f === 0 ? 0.8 : 0.3;
  cv.part({ ol: 'line' });
  cv.poly([[X(0.6), 20.8 + b], [X(-2.4), 20.8 + b], [X(-3.6), 22.6 + b], [X(-3.6), 28.4 + b], [X(-4.4 - flow), 35.6], [X(1.6 - flow * 0.4), 35.8], [X(1.4), 28.4 + b], [X(1.2), 23.0 + b]], H.m, { cx: 0.7, cy: 0.15, tex: H.tex ? H.tex(cv.k) : null });
  const id = cv.cur;
  cv.crease([[X(-1.4), 23.0 + b], [X(-2.0 - flow), 35.2]], 0.24, -0.4, { parts: [id] });
  cv.part({ ol: 'soft', clip: id });
  cv.stroke([[X(0.6), 20.8 + b], [X(1.2), 23.2 + b], [X(1.4), 28.4 + b], [X(1.5 - flow * 0.4), 35.9]], 0.55, H.edge, { n: [0, 0] });
  if (H.flame) flameHem(cv, Math.min(X(-4.8 - flow), X(1.8)), Math.max(X(-4.8 - flow), X(1.8)), 35.8, 3.4, id, 0);
}

// こしの 刀（さやは うしろ・したへ。つかと つばが まえ）
function sheath(cv, P, S) {
  if (P.side) {
    const X = P.X, b = P.bob;
    cv.part({ ol: 'line' });
    cv.cap(X(0.6), 28.4 + b, 0.5, X(-6.6), 31.2 + b, 0.45, S.m);
    cv.part({ ol: 'line' });
    cv.ell(X(1.0), 28.2 + b, 0.35, 0.95, S.tsuba, { bulge: 0.8 });
    cv.part({ ol: 'line' });
    cv.cap(X(1.3), 28.1 + b, 0.42, X(3.6), 27.1 + b, 0.4, S.grip, { tex: (ix, iy) => ((ix + iy) % 3 === 0 ? 1.2 : 0) });
    return;
  }
  // まえ: 左こし（がめんの みぎ）。うしろ: がめんの ひだり
  const s = P.back ? -1 : 1;
  cv.part({ ol: 'line' });
  cv.cap(16 + s * 4.2, 28.8, 0.5, 16 + s * 8.4, 32.2, 0.45, S.m);
  if (P.back) return;
  cv.part({ ol: 'line' });
  cv.ell(16 + s * 3.9, 28.5, 0.85, 0.5, S.tsuba, { bulge: 0.8 });
  cv.part({ ol: 'line' });
  cv.cap(16 + s * 3.7, 28.2, 0.42, 16 + s * 2.2, 26.9, 0.4, S.grip, { tex: (ix, iy) => ((ix + iy) % 3 === 0 ? 1.2 : 0) });
}

// 木の葉の ベスト（せなか: 赤い うずまき）
function vestBack(cv, V) {
  cv.part({ ol: 'line' });
  cv.poly([[16 - 5.4, 20.8], [16 + 5.4, 20.8], [16 + 5.9, 22.4], [16 + 5.3, 24.6], [16 + 4.9, 28.4], [16 + 5.2, 30.4], [16 - 5.2, 30.4], [16 - 4.9, 28.4], [16 - 5.3, 24.6], [16 - 5.9, 22.4]], V.m, { cx: 0.8 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  const pts = [];
  for (let i = 0; i <= 26; i++) { const a = i * 0.42, r = 0.25 + i * 0.075; pts.push([16 + Math.cos(a) * r, 25.0 + Math.sin(a) * r]); }
  cv.ell(16, 25.0, 2.5, 2.5, V.swirl, { n: [0, 0] });
  cv.part({ ol: 'none', clip: id });
  cv.stroke(pts, 0.28, V.m, { n: [0, 0] });
}

// ───────────── カッパの こうら ─────────────
function shellFront(cv, S) {
  // まえむき: かたと わきから こうらの ふちが 見える
  cv.part({ ol: 'line' });
  cv.ell(16, 25.0, 7.4, 5.6, S.rim, { bulge: 0.7 });
}
function shellBack(cv, S) {
  // はなかっぱの こうらは 小さい（せなかの まんなかより した）
  const q = S.small ? 0.62 : 1, cy = S.small ? 26.4 : 25.2;
  const Q = (x, y) => [16 + (x - 16) * q, cy + (y - 25.2) * q];
  cv.part({ ol: 'line' });
  cv.ell(16, cy + 0.2 * q, 6.4 * q, 5.4 * q, S.rim, { bulge: 0.8 });
  cv.part({ ol: 'line' });
  cv.ell(16, cy, 5.5 * q, 4.6 * q, S.m, { bulge: 0.8 });
  const id = cv.cur;
  // こうらの もよう（まんなかの 6かく と まわり）
  const hexPts = (cx, cy, r) => { const o = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; o.push(Q(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9)); } o.push(o[0]); return o; };
  cv.crease(hexPts(16, 25.0, 1.8), 0.2, -0.7, { parts: [id] });
  for (const [x0, y0, x1, y1] of [[16, 23.4, 16, 20.8], [16, 26.6, 16, 29.6], [14.4, 24.2, 11.2, 22.8], [17.6, 24.2, 20.8, 22.8], [14.4, 25.8, 11.0, 27.6], [17.6, 25.8, 21.0, 27.6]]) cv.crease([Q(x0, y0), Q(x1, y1)], 0.2, -0.6, { parts: [id] });
}
function shellSide(cv, P, S) {
  const X = P.X, b = P.bob;
  const q = S.small ? 0.62 : 1, cy = (S.small ? 26.4 : 25.3) + b;
  cv.part({ ol: 'line' });
  cv.ell(X(-3.4 + (1 - q) * 1.4), cy + 0.1, 3.4 * q, 5.2 * q, S.rim, { bulge: 0.8 });
  cv.part({ ol: 'line' });
  cv.ell(X(-3.9 + (1 - q) * 1.4), cy, 2.6 * q, 4.5 * q, S.m, { bulge: 0.8 });
  const id = cv.cur;
  for (const y of [-2.1, 0.1, 2.3]) cv.crease([[X(-2.0), cy + y * q], [X(-6.0), cy + y * q]], 0.18, -0.6, { parts: [id] });
}

// ───────────── ロボットの くびわと すず ─────────────
function collarBell(cv, P, M) {
  if (P.side) {
    const X = P.X, b = P.bob;
    cv.part({ ol: 'line' });
    cv.poly([[X(-2.6), 20.6 + b], [X(2.2), 20.8 + b], [X(2.4), 21.8 + b], [X(-2.6), 21.6 + b]], M.collar, { cx: 0.5 });
    cv.part({ ol: 'line' });
    cv.ell(X(2.4), 22.6 + b, 0.95, 0.95, M.bell, { bulge: 0.95 });
    return;
  }
  cv.part({ ol: 'line' });
  cv.poly([[11.6, 20.4], [20.4, 20.4], [20.8, 21.6], [16, 22.2], [11.2, 21.6]], M.collar, { cx: 0.6, n: 'row' });
  const r = M.big ? 1.3 : 1.1;
  cv.part({ ol: 'line' });
  cv.ell(16, 22.6, r, r, M.bell, { bulge: 0.95 });
  const id = cv.cur;
  cv.crease([[16 - r, 22.4], [16 + r, 22.4]], 0.16, -0.7, { parts: [id] });
  cv.part({ ol: 'none', cast: false });
  cv.px(cv.X(16), cv.Y(23.2), '#3a2a10');
}
function collarBack(cv, M) {
  cv.part({ ol: 'line' });
  cv.poly([[11.6, 20.4], [20.4, 20.4], [20.6, 21.4], [11.4, 21.4]], M.collar, { cx: 0.6 });
}

// ロボットの みじかい しっぽ（さきに 赤い たま。hero-outfit.js の drawTail から）
export function robotTail(cv, P, T, where) {
  const sw = P.f === 0 ? 0 : 0.4;
  let pts;
  if (where === 'behind') pts = [[18.0, 29.8], [20.6, 30.6 + sw * 0.3], [22.6, 29.4 - sw * 0.3]];
  else if (where === 'back') pts = [[16.0, 29.6], [17.2, 31.6], [19.2, 31.4 - sw * 0.3]];
  else {
    const X = P.X, b = P.bob;
    pts = [[X(-2.6), 29.4 + b], [X(-5.0), 30.6 + b], [X(-6.8), 29.4 + b - sw * 0.3]];
  }
  cv.part({ ol: 'line' });
  cv.stroke(pts, [0.5, 0.42, 0.36], T.m, { lw: 0.8 });
  const e = pts[pts.length - 1];
  cv.part({ ol: 'line' });
  cv.ell(e[0], e[1], 1.05, 1.05, T.ball, { bulge: 0.95 });
}

// ───────────── マントの ほのお（hero-outfit.js の drawCape から） ─────────────
export function capeFlame(cv, P, C, where, id, len, sw) {
  if (!C.flame) return;
  if (where === 'behind') flameHem(cv, 16 - 7.4 + sw * 0.3, 16 + 7.4 + sw * 0.3, len, 3.6, id, sw);
  else if (where === 'back') flameHem(cv, 16 - 7.2 + sw * 0.4, 16 + 7.2 + sw * 0.4, len + 0.4, 4.0, id, sw);
  else {
    const X = P.X;
    const flow = P.f === 0 ? 1.0 : 0.4;
    const a = X(-6.8 - flow * 1.4), c = X(-1.0);
    flameHem(cv, Math.min(a, c), Math.max(a, c), len, 3.4, id, 0);
  }
}

// ───────────── かお ─────────────
// phase: 'face'（かみの まえ）/ 'top'（かみの あと）/ 'over'（ぼうしの あと。いちばん まえ）
export function face26(cv, H, B, view, phase) {
  // 第29回: ほおの 十字の きず
  if (B.cross) face29(cv, H, B, view, phase);
  if (phase === 'over') {
    if (B.cardGlasses) cardGlasses(cv, H, view);
    return;
  }
  const res = cv.res;
  if (phase === 'face') {
    if (B.hana) hanaFace(cv, H, view);
    if (B.nose && view !== 'back') {
      // 赤い まるい はな と ひげ
      const u = view === 'side' ? H.rx + 0.2 : 0;
      cv.part({ ol: 'line', cast: false });
      cv.ell(H.X(u), H.y + 3.4, 0.85, 0.8, cl('#e02a2a', { light: 1.2 }), { bulge: 0.95 });
    }
    if (B.whisker && view !== 'back') {
      const c = '#2a2236';
      cv.part({ ol: 'none', cast: false });
      const sides = view === 'side' ? [H.facing] : [-1, 1];
      for (const s of sides) {
        for (const dv of [-0.7, 0.3, 1.3]) {
          const x0 = cv.X(H.X(view === 'side' ? H.rx - 2.4 : s * 2.2)), y0 = cv.Y(H.y + 4.0 + dv * 0.5);
          const len = Math.round((view === 'side' ? 2.4 : 2.8) * cv.k);
          cv.line(x0, y0, x0 + s * len * (view === 'side' ? -1 : 1) * (view === 'side' ? -1 : 1), y0 + Math.round(dv * 0.6 * cv.k), c);
        }
      }
    }
    if (B.beak && view !== 'back') {
      // きいろい くちばし（くちの ところ）
      const u = view === 'side' ? H.rx - 0.2 : 0;
      cv.part({ ol: 'line', cast: false });
      if (view === 'side') cv.poly([[H.X(u - 1.4), H.y + 3.6], [H.X(u + 1.4), H.y + 4.0], [H.X(u - 1.2), H.y + 5.4]], cl('#f2c02a', { light: 1.1 }), { cx: 0.5 });
      else cv.ell(H.X(0), H.y + 4.5, 1.7, 0.95, cl('#f2c02a', { light: 1.1 }), { bulge: 0.8 });
      if (view !== 'side') cv.crease([[H.X(-1.4), H.y + 4.5], [H.X(1.4), H.y + 4.5]], 0.14, -0.6, { parts: [cv.cur] });
    }
    if (B.blush && view !== 'back') {
      cv.part({ ol: 'none', cast: false });
      const sides = view === 'side' ? [null] : [-1, 1];
      for (const s of sides) {
        const u = s === null ? H.rx - 3.3 : s * 4.4;
        cv.ell(H.X(u), H.y + 3.4, 1.1, 0.6, cl('#f08a90', { light: 1.1 }), { n: [0, 0] });
      }
    }
    if (B.sun && view !== 'back') sunglasses(cv, H, view);
    return;
  }
  // かみの あと
  if (B.cleft) {
    // おしりの われめ（あたまの うえの まんなか）
    if (view === 'front' || view === 'back') cv.crease([[H.X(0), H.y - 7.4], [H.X(0), H.y - 3.6]], 0.26, -0.75, {});
    else cv.crease([[H.X(-0.6), H.y - 7.2], [H.X(-0.2), H.y - 4.2]], 0.24, -0.6, {});
  }
  if (B.hanafuda && view !== 'back') {
    // 花札の みみかざり（しろい ながしかくに 赤い 日の まる）
    const one = (u) => {
      cv.part({ ol: 'line' });
      cv.poly([[H.X(u) - 0.55, H.y + 2.6], [H.X(u) + 0.55, H.y + 2.6], [H.X(u) + 0.55, H.y + 4.9], [H.X(u) - 0.55, H.y + 4.9]], white(), { n: 'bevel', bw: 0.2 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.ell(H.X(u), H.y + 3.5, 0.42, 0.42, cl('#d82a2a'), { n: [0, 0] });
      cv.part({ ol: 'none', clip: id });
      cv.rect(H.X(u) - 0.55, H.y + 4.3, 1.1, 0.6, cl('#2a2a30'), { n: [0, 0] });
    };
    if (view === 'side') one(-1.0);
    else for (const s of [-1, 1]) one(s * 7.6);
  }
  if (B.sun && view === 'back') {
    // サングラスの つる
    cv.part({ ol: 'none' });
    cv.stroke([[H.X(-7.6), H.y + 1.0], [H.X(-7.0), H.y + 1.4]], 0.2, mat({ r: BLACK, th: TH.matte }), { n: [0, 0] });
  }
}
// ───────────── はなかっぱの かお ─────────────
// ドットの だえん（x, y, rx, ry は あたまの マス。いろ そのまま）
function dotEll(cv, x, y, rx, ry, col) {
  const T = cv.T, k = cv.k;
  const X = cv.tx(x) * k, Y = cv.ty(y) * k, RX = rx * (T ? T.sx : 1) * k, RY = ry * (T ? T.sy : 1) * k;
  for (let iy = Math.floor(Y - RY); iy <= Math.ceil(Y + RY); iy++) {
    for (let ix = Math.floor(X - RX); ix <= Math.ceil(X + RX); ix++) {
      const u = (ix + 0.5 - X) / RX, v = (iy + 0.5 - Y) / RY;
      if (u * u + v * v <= 1) cv.px(ix, iy, col);
    }
  }
}
// 大きな 黒い 目（キラッと 白い ひかり 2つ）・ピンクの ほお・小さな くちばしの わらった くち
function hanaFace(cv, H, view) {
  const EYE = '#1d1826', SHINE = '#ffffff', LOW = '#3e3a5e', CHEEK = '#f7a0b4', BILL = '#f8c64a', SMILE = '#8a3e1c';
  const small = cv.res < 8;
  cv.part({ ol: 'none', cast: false });
  const eye = (u, rx) => {
    const v = 1.9, ry = 1.42;
    dotEll(cv, H.X(u), H.y + v, rx, ry, EYE);
    if (!small) dotEll(cv, H.X(u + rx * 0.1), H.y + v + ry * 0.55, rx * 0.55, ry * 0.3, LOW);
    // キラッ（うえの 大きな ひかりと、したの 小さな ひかり）
    dotEll(cv, H.X(u - rx * 0.32 * (view === 'side' ? -H.facing * H.facing : 1)), H.y + v - ry * 0.38, rx * 0.36, ry * 0.3, SHINE);
    if (!small) dotEll(cv, H.X(u + rx * 0.38), H.y + v + ry * 0.32, rx * 0.16, ry * 0.13, SHINE);
  };
  if (view === 'side') {
    eye(H.rx - 2.7, 0.78);
    dotEll(cv, H.X(H.rx - 4.6), H.y + 3.9, 0.95, 0.5, CHEEK);
    // まえに すこし 出た 小さな くちばし（わらった くち）
    cv.part({ ol: 'soft', cast: false });
    cv.poly([[H.X(H.rx - 1.6), H.y + 3.7], [H.X(H.rx + 0.9), H.y + 3.9], [H.X(H.rx + 0.9), H.y + 4.7], [H.X(H.rx - 1.4), H.y + 5.3]], cl(BILL, { light: 1.15 }), { n: [0, -0.2] });
    cv.part({ ol: 'none', cast: false });
    cv.stroke([[H.X(H.rx - 1.3), H.y + 4.0], [H.X(H.rx - 0.2), H.y + 4.6], [H.X(H.rx + 0.8), H.y + 4.3]], 0.13, cl(SMILE), { n: [0, 0] });
    return;
  }
  if (view === 'back') return;
  for (const s of [-1, 1]) eye(s * 3.1, 1.08);
  for (const s of [-1, 1]) dotEll(cv, H.X(s * 5.0), H.y + 3.9, 1.05, 0.55, CHEEK);
  // くちばし（小さく まるい）と わらった くち（U の かたち）
  cv.part({ ol: 'soft', cast: false });
  cv.ell(H.X(0), H.y + 4.6, 1.45, 0.8, cl(BILL, { light: 1.15 }), { n: [0, -0.3] });
  const id = cv.cur;
  cv.part({ ol: 'none', cast: false, clip: id });
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8 * 2 - 1; pts.push([H.X(t * 1.2), H.y + 4.35 + (1 - t * t) * 0.6]); }
  cv.stroke(pts, 0.14, cl(SMILE), { n: [0, 0] });
}

// ───────────── 楽天カードマンの メガネと カード ─────────────
// 黒い ふちの メガネ（つるは よこへ）の レンズの まえに、赤い 四角い カード（金の IC と しろい R）が くっついている
function cardGlasses(cv, H, view) {
  const fr = mat({ r: BLACK, th: TH.matte, spec: 0.95 });
  const card = cl('#e8102e', { light: 1.12 });
  const ink = '#ffffff';
  if (view === 'back') {
    // うしろ: よこに 見える メガネの つるだけ
    cv.part({ ol: 'line' });
    for (const s of [-1, 1]) cv.stroke([[H.X(s * 8.3), H.y + 0.9], [H.X(s * 7.0), H.y + 1.2]], 0.32, fr, { n: [0, 0] });
    return;
  }
  if (view === 'side') {
    const f = H.rx;
    // つる（カードの うしろから みみの ほうへ）
    cv.part({ ol: 'line' });
    cv.stroke([[H.X(f - 2.0), H.y + 1.0], [H.X(-0.6), H.y + 0.6], [H.X(-1.8), H.y + 1.0]], 0.3, fr, { n: [0, 0] });
    // レンズの ふち（カードの うしろ・うえと したに すこし）
    cv.part({ ol: 'line' });
    cv.poly([[H.X(f - 3.4), H.y + 0.1], [H.X(f + 0.2), H.y - 0.1], [H.X(f + 0.2), H.y + 3.0], [H.X(f - 3.4), H.y + 3.0]], fr, { n: 'bevel', bw: 0.25 });
    // ななめから 見た カード
    cv.part({ ol: 'line' });
    cv.poly([[H.X(f - 2.0), H.y - 0.9], [H.X(f + 0.9), H.y - 1.1], [H.X(f + 0.9), H.y + 3.7], [H.X(f - 2.0), H.y + 3.9]], card, { n: 'bevel', bw: 0.35 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.rect(Math.min(H.X(f - 1.5), H.X(f - 0.3)), H.y + 0.2, 1.2, 1.0, mt(GOLD), { n: 'bevel', bw: 0.2 });
    cv.part({ ol: 'none', clip: id, cast: false });
    cv.rect(Math.min(H.X(f - 1.8), H.X(f + 0.7)), H.y + 2.6, 2.5, 0.35, white(), { n: [0, 0] });
    return;
  }
  // まえ: つる → ふち → カード
  cv.part({ ol: 'line' });
  for (const s of [-1, 1]) cv.stroke([[H.X(s * 5.2), H.y + 0.9], [H.X(s * 7.0), H.y + 0.7]], 0.3, fr, { n: [0, 0] });
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly([[H.X(s * 0.9), H.y + 0.1], [H.X(s * 5.6), H.y + 0.0], [H.X(s * 5.4), H.y + 3.0], [H.X(s * 1.1), H.y + 3.0]], fr, { n: 'bevel', bw: 0.25 });
  }
  cv.part({ ol: 'line' });
  cv.poly([[H.X(-4.1), H.y - 1.0], [H.X(4.1), H.y - 1.0], [H.X(4.1), H.y + 3.9], [H.X(-4.1), H.y + 3.9]], card, { n: 'bevel', bw: 0.4 });
  const id = cv.cur;
  // 金の IC
  cv.part({ ol: 'none', clip: id });
  cv.rect(H.X(-3.3), H.y + 0.0, 1.5, 1.15, mt(GOLD), { n: 'bevel', bw: 0.2 });
  // しろい R の しるしと ロゴの せん
  cv.part({ ol: 'none', clip: id, cast: false });
  const rx = cv.X(H.X(1.4)), ry = cv.Y(H.y + 0.9);
  if (cv.res >= 8) cv.stamp(rx - 3, ry - 4, ['KKKK.', 'K...K', 'K...K', 'KKKK.', 'K.K..', 'K..K.', 'K...K'], { K: ink });
  else cv.stamp(rx - 1, ry - 2, ['KK.', 'K.K', 'KK.', 'K.K'], { K: ink });
  cv.rect(H.X(-3.3), H.y + 2.7, 6.6, 0.4, white(), { n: [0, 0] });
}

function sunglasses(cv, H, view) {
  const lens = mat({ r: ['#0a0a10', '#1a1a26', '#34344a'], th: [-0.1, 0.55] });
  const fr = mat({ r: BLACK, th: TH.matte });
  const y = H.y + 1.5;
  cv.part({ ol: 'line', cast: false });
  if (view === 'side') {
    cv.poly([[H.X(H.rx - 3.6), y - 0.9], [H.X(H.rx + 0.1), y - 1.0], [H.X(H.rx - 0.3), y + 1.0], [H.X(H.rx - 3.2), y + 0.9]], lens, { n: [0, 0] });
    cv.part({ ol: 'none' });
    cv.stroke([[H.X(H.rx - 3.4), y - 0.7], [H.X(-1.4), y - 0.4]], 0.24, fr, { n: [0, 0] });
    return;
  }
  for (const s of [-1, 1]) cv.poly([[H.X(s * 0.8), y - 1.0], [H.X(s * 5.0), y - 1.1], [H.X(s * 4.7), y + 0.9], [H.X(s * 1.1), y + 1.0]], lens, { n: [s * 0.2, 0] });
  cv.part({ ol: 'none' });
  cv.stroke([[H.X(-1.0), y - 0.7], [H.X(1.0), y - 0.7]], 0.22, fr, { n: [0, 0] });
  // レンズの ひかり
  cv.part({ ol: 'none', cast: false });
  for (const s of [-1, 1]) cv.px(cv.X(H.X(s * 3.9)), cv.Y(y - 0.5), '#8a9ac8');
}

// ───────────── ぼうし ─────────────
// ばんそうこう（ばつの かたち）
function plaster(cv, H, u, v) {
  const m = mat({ r: ['#a8784a', '#d8a878', '#f2d0a4', '#fff0dc'], th: TH.cloth });
  for (const a of [0.6, -0.6]) {
    cv.part({ ol: 'line' });
    cv.cap(H.X(u - Math.cos(a) * 1.8), H.y + v - Math.sin(a) * 1.8, 0.62, H.X(u + Math.cos(a) * 1.8), H.y + v + Math.sin(a) * 1.8, 0.62, m, { n: [0, -0.2] });
  }
}
const TS = (H, pts) => pts.map(([u, v]) => [H.X(u), H.y + v]);
const D = Math.PI / 180;
function arcP(cx, cy, rx, ry, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
function hpoly(cv, H, pts, m, o = {}) {
  cv.poly(TS(H, pts), m, { n: 'sphere', sph: [H.X(o.su ?? -1.2), H.y + (o.sv ?? -3.0), (H.rx + 1.4) * 1.15, (H.ry + 1.4) * 1.15], cx: 0.95 });
}

export function drawHat26(cv, P, H, G, view) {
  const side = view === 'side', back = view === 'back';
  switch (G.kind) {
    case 'fedora26': {
      // 黒い 中おれ ぼうし（ひろい つば・おびは はいいろ）
      const m = cl(G.c || '#17171d', { light: 1.2 });
      const band = cl(G.band || '#3a3a46');
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[9.6, -3.2], [9.8, -2.2], [-9.4, -2.2], [-9.0, -3.2]], m, { su: 0.4 });
      else hpoly(cv, H, [[-10.0, -3.0], [10.0, -3.0], [10.4, -1.9], [0, -1.6], [-10.4, -1.9]], m);
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[5.6, -3.0], [5.9, -8.2], [4.0, -10.0], [-2.0, -10.4], [-5.8, -9.4], [-6.6, -3.0]], m, { su: 0.4 });
      else hpoly(cv, H, [[-6.2, -3.0], [-6.6, -8.6], [-3.6, -10.6], [-1.0, -9.6], [1.0, -9.6], [3.6, -10.6], [6.6, -8.6], [6.2, -3.0]], m);
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      if (side) cv.poly(TS(H, [[6.2, -5.0], [6.2, -3.0], [-7.0, -3.0], [-7.0, -5.0]]), band, { cx: 0.6 });
      else cv.poly(TS(H, [[-7.0, -5.0], [7.0, -5.0], [7.0, -3.0], [-7.0, -3.0]]), band, { cx: 0.8 });
      if (!side && !back) cv.crease(TS(H, [[0, -9.8], [0, -6.0]]), 0.22, -0.5, { parts: [id] });
      return true;
    }
    case 'hitai26': {
      // ひたいあて（ぬのの おびに 金ぞくの いた。いたには 木の葉の うずまき）
      const m = cl(G.c || '#26304e');
      const plate = mt(SILVER);
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[7.0, -4.6], [6.8, -2.0], [-7.6, -1.6], [-7.6, -4.0]]), m, { cx: 0.6, cy: 0.5 });
      else cv.poly(TS(H, [[-8.0, -4.2], ...arcP(0, -2.8, 8.0, 1.5, 190, 350, 8), [8.0, -4.2], [8.1, -2.0], ...arcP(0, -0.6, 8.1, 1.5, 350, 190, 8), [-8.1, -2.0]]), m, { cx: 0.85, cy: 0.4 });
      if (back || side) {
        const sw = P.f === 0 ? 0.6 : -0.6;
        const bx = side ? -7.6 : 0;
        cv.part({ ol: 'soft' });
        cv.lock([H.X(bx), H.y - 3.0], [H.X(bx + (side ? -2.6 : -1.0)), H.y - 1.4 + sw], [H.X(bx + (side ? -4.2 : -2.2)), H.y + 1.6], 0.65, 0.4, m);
        cv.lock([H.X(bx), H.y - 2.8], [H.X(bx + (side ? -1.6 : 1.2)), H.y + 0.6 - sw], [H.X(bx + (side ? -2.6 : 2.2)), H.y + 3.0], 0.6, 0.35, m);
      }
      if (back) return true;
      cv.part({ ol: 'line' });
      const pu = side ? 4.6 : 0, pw = side ? 2.0 : 3.4;
      cv.poly(TS(H, [[pu - pw, -5.0], [pu + pw, -5.0], [pu + pw, -1.6], [pu - pw, -1.6]]), plate, { n: 'bevel', bw: 0.35 });
      const id = cv.cur;
      // 木の葉の しるし（うずまきと とがった さき）
      const c = cv.X(H.X(pu)), y = cv.Y(H.y - 3.3), k = cv.k;
      cv.part({ ol: 'none', cast: false, clip: id });
      const ink = '#2a3040';
      if (k >= 4) {
        cv.stamp(c - 3, y - 3, ['..KKK..', '.K...K.', 'K..K..K', 'K.K.K.K', 'K..KK.K', '.K....K', '..KKKKK'], { K: ink });
      } else cv.stamp(c - 2, y - 1, ['.KK.', 'K.KK', '.KK.'], { K: ink });
      return true;
    }
    case 'robohood26': {
      // ネコ型ロボットの 青い フード（かおの まわりは しろい ふち。ears: ネコの みみ）
      const m = cl(G.c || '#2a8ae0', { light: 1.1 });
      const rim = white();
      if (G.ears && !back) {
        for (const s of side ? [1] : [-1, 1]) {
          const u = side ? -1.0 : s * 5.2;
          cv.part({ ol: 'line' });
          cv.poly(TS(H, [[u - 2.4, -6.2], [u + (side ? 0.6 : s * 1.2), -11.6], [u + 2.4, -6.0]]), m, { cx: 0.6 });
          cv.part({ ol: 'soft' });
          cv.poly(TS(H, [[u - 1.2, -6.8], [u + (side ? 0.4 : s * 0.8), -10.0], [u + 1.2, -6.6]]), cl('#f6a2b8'), { n: [0, -0.2] });
        }
      } else if (G.ears && back) {
        for (const s of [-1, 1]) {
          cv.part({ ol: 'line' });
          cv.poly(TS(H, [[s * 5.2 - 2.4, -6.2], [s * 6.4, -11.6], [s * 5.2 + 2.4, -6.0]]), m, { cx: 0.6 });
        }
      }
      cv.part({ ol: 'line' });
      if (back) {
        cv.ell(H.x, H.y - 0.6, H.rx + 1.6, H.ry + 1.8, m, { bulge: 0.9 });
        if (G.plaster) for (const s of [-1, 1]) plaster(cv, H, s * 5.0, -6.2);
        return true;
      }
      if (side) {
        // よこ: あたまの うえと うしろを つつむ（かおの まえは あける）
        hpoly(cv, H, [...arcP(-0.8, -0.4, 8.6, 8.8, -48, -250, 20), [-2.0, 8.2], [1.6, 8.4], [3.6, 7.4], [2.2, 4.6], [1.8, 1.0], [2.8, -2.4], [5.6, -4.4]], m, { su: 0.4 });
        const id = cv.cur;
        cv.part({ ol: 'soft', clip: id });
        cv.stroke(TS(H, [[5.8, -4.6], [2.8, -2.6], [1.8, 1.0], [2.2, 4.6], [3.6, 7.4]]), 0.6, rim, { n: [0, 0] });
        if (G.plaster) plaster(cv, H, -2.6, -6.6);
        return true;
      }
      // まえ: あたまの うえと よこを つつむ。かおの まわりは あける
      hpoly(cv, H, [...arcP(0, -0.6, 8.8, 9.0, 150, 390, 22), [7.2, 6.4], [4.6, 7.8], [5.8, 3.6], [6.0, -0.4], [4.6, -3.2], [0, -4.4], [-4.6, -3.2], [-6.0, -0.4], [-5.8, 3.6], [-4.6, 7.8], [-7.2, 6.4]], m);
      const id = cv.cur;
      cv.part({ ol: 'soft', clip: id });
      cv.stroke(TS(H, [[-4.8, 7.6], [-6.0, 3.6], [-6.2, -0.4], [-4.8, -3.4], [0, -4.6], [4.8, -3.4], [6.2, -0.4], [6.0, 3.6], [4.8, 7.6]]), 0.6, rim, { n: [0, 0] });
      // 耳無し: みみの あった ところに ばんそうこう
      if (G.plaster) for (const s of [-1, 1]) plaster(cv, H, s * 5.0, -6.6);
      return true;
    }
    case 'sara26': {
      // カッパの おさら（あたまの うえの しろっぽい おさらと ふち）
      const m = mat({ r: ['#8a9a8a', '#c4d0c0', '#eef4e6', '#ffffff'], th: TH.gem, spec: 0.94, sc: '#ffffff' });
      cv.part({ ol: 'line' });
      if (side) cv.ell(H.X(-0.6), H.y - 7.6, 4.2, 1.3, m, { bulge: 0.7 });
      else if (back) cv.ell(H.x, H.y - 7.6, 4.8, 1.6, m, { bulge: 0.7 });
      else cv.ell(H.x, H.y - 7.8, 4.8, 1.8, m, { bulge: 0.7 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.ell(side ? H.X(-0.4) : H.x, H.y - 7.9, side ? 2.8 : 3.2, side ? 0.7 : 0.9, mat({ r: ['#6ab0d8', '#9ad0ec', '#d0ecff', '#ffffff'], th: TH.gem }), { n: [0, -0.3] });
      return true;
    }
    case 'flower26': case 'garlic26': {
      // はなかっぱの 頭の 花（あたまの てっぺんから 緑の 茎が 1本 のびて、さきに 大きな 花。葉っぱ 2まい）
      // garlic26: 筋肉ニンニクの とき（ニンニクの 花: うすむらさきの 小さな 花が まるく あつまる）
      const garlic = G.kind === 'garlic26';
      const stem = cl('#3e9a34', { light: 1.1 });
      const leaf = cl('#4caa3c', { light: 1.12 });
      const sw = P.f === 0 ? 0.25 : -0.25;
      const u0 = side ? -0.6 : 0;
      const fu = u0 + sw, fv = -11.5;
      // 茎
      cv.part({ ol: 'line' });
      cv.cap(H.X(u0), H.y - 6.4, 0.42, H.X(fu), fv + H.y + 1.2, 0.36, stem);
      // 葉っぱ（茎の なかほどから よこへ）
      for (const s of side ? [-1] : [-1, 1]) {
        cv.part({ ol: 'line' });
        cv.lock([H.X(u0 + sw * 0.5), H.y - 7.9], [H.X(u0 + s * 2.6), H.y - 9.3], [H.X(u0 + s * 5.0), H.y - 8.0], 1.05, 0.25, leaf);
        const id = cv.cur;
        cv.crease(TS(H, [[u0 + s * 0.7, -8.0], [u0 + s * 3.8, -8.3]]), 0.12, 0.4, { parts: [id] });
      }
      if (garlic) {
        // ニンニクの 花（まるい ぼんぼりに 小さな 花）
        const base = cl('#c99ae0', { light: 1.1 });
        const fl = cl('#ecc8f8', { light: 1.1 });
        const R = side ? 3.2 : 4.1;
        cv.part({ ol: 'line' });
        cv.ell(H.X(fu), H.y + fv, R, 3.0, base, { bulge: 0.9 });
        const id = cv.cur;
        const spots = back ? [[-1.4, -0.6], [1.2, -0.9], [0, 0.6], [-1.8, 0.8], [1.9, 0.5]] : [[-1.6, -0.7], [0.1, -1.2], [1.7, -0.6], [-0.8, 0.5], [1.0, 0.6], [-2.1, 0.9], [2.2, 1.0], [0, 1.5]];
        for (const [du, dv] of spots) {
          cv.part({ ol: 'soft', clip: id });
          cv.ell(H.X(fu + du * (R / 2.6)), H.y + fv + dv * 1.25, 0.72, 0.65, fl, { bulge: 0.8 });
        }
        return true;
      }
      // 大きな 花（ピンクの 花びら 5まい・きいろい 中心）。うしろからは 花びらの うらと 緑の がく
      const pet = cl(back ? '#e0466e' : '#f4507e', { light: 1.15 });
      const sq = side ? 0.72 : 1;
      const petals = [];
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
        petals.push([Math.cos(a) * 3.4 * sq, Math.sin(a) * 1.75]);
      }
      // うしろの 花びら（うえ）から じゅんに
      petals.sort((p, q) => p[1] - q[1]);
      for (const [du, dv] of petals) {
        cv.part({ ol: 'line' });
        cv.ell(H.X(fu + du), H.y + fv + dv, 2.4 * sq + 0.2, 1.75, pet, { bulge: 0.75 });
      }
      if (back) {
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[fu - 1.6, fv + 0.2], [fu, fv - 1.1], [fu + 1.6, fv + 0.2], [fu + 0.8, fv + 1.5], [fu - 0.8, fv + 1.5]]), leaf, { n: [0, -0.2] });
        return true;
      }
      cv.part({ ol: 'line' });
      cv.ell(H.X(fu + (side ? 0.6 : 0)), H.y + fv, 1.55 * sq + 0.2, 1.35, cl('#ffd23c', { light: 1.2 }), { bulge: 0.8 });
      const cid = cv.cur;
      cv.part({ ol: 'none', clip: cid, cast: false });
      for (const [du, dv] of [[-0.4, -0.3], [0.45, 0.1], [-0.1, 0.45]]) cv.px(cv.X(H.X(fu + (side ? 0.5 : 0) + du)), cv.Y(H.y + fv + dv), '#e89a1a');
      return true;
    }
  }
  return false;
}

// ───────────── もちもの（たての ない 手） ─────────────
// まえ: がめんの みぎの 手、うしろ: ひだりの 手、よこ: その 手（P.facing の ほうへ むける）
export function drawProp26(cv, P, A, O) {
  const kind = O.body?.prop;
  if (!kind || drawProp27(cv, P, A, O)) return;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  switch (kind) {
    case 'card': {
      // 赤い カード（金の IC）
      const cx = hx + d * 0.9, cy = hy - 1.5;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 1.5, cy - 1.0], [cx + 1.5, cy - 1.3], [cx + 1.6, cy + 0.9], [cx - 1.4, cy + 1.2]], cl('#e02a36', { light: 1.15 }), { n: 'bevel', bw: 0.25 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.rect(cx - 0.9, cy - 0.6, 0.9, 0.7, mt(GOLD), { n: [0, -0.2] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[cx - 1.4, cy + 0.6], [cx + 1.5, cy + 0.3]], 0.18, white(), { n: [0, 0] });
      return;
    }
    case 'spoon': {
      // まがった スプーン（銀）
      const m = mt(SILVER);
      cv.part({ ol: 'line' });
      cv.stroke([[hx, hy + 0.6], [hx + d * 0.4, hy - 1.6], [hx + d * 1.4, hy - 2.6]], 0.24, m, { n: [0, 0] });
      cv.part({ ol: 'line' });
      cv.ell(hx + d * 2.0, hy - 3.2, 0.75, 1.05, m, { bulge: 0.9, rot: d * 0.8 });
      return;
    }
    case 'glass': case 'light': {
      if (kind === 'light') {
        // かい中電とう（きいろい つつと ひかる さき）
        cv.part({ ol: 'line' });
        cv.cap(hx - d * 0.2, hy + 0.6, 0.55, hx + d * 0.8, hy - 1.8, 0.6, cl('#f2c42a', { light: 1.1 }));
        cv.part({ ol: 'line' });
        cv.ell(hx + d * 1.0, hy - 2.2, 0.75, 0.75, mat({ r: ['#fff2a0', '#fff8d0', '#ffffff'], th: [0.1, 0.6], emit: true }), { bulge: 0.6 });
        return;
      }
      // 虫めがね（こげ茶の え・金の わ・水色の レンズ）
      cv.part({ ol: 'line' });
      cv.cap(hx, hy + 0.5, 0.36, hx + d * 0.7, hy - 1.6, 0.36, mat({ r: ['#2a1608', '#5a3218', '#8a5228', '#b87a40'], th: TH.matte }));
      cv.part({ ol: 'line' });
      cv.ell(hx + d * 1.3, hy - 3.1, 1.55, 1.55, mt(GOLD), { bulge: 0.9 });
      cv.part({ ol: 'none' });
      cv.ell(hx + d * 1.3, hy - 3.1, 1.05, 1.05, mat({ r: ['#5a9ac8', '#9ad0f0', '#d8f2ff', '#ffffff'], th: TH.gem, spec: 0.9 }), { bulge: 0.7 });
      return;
    }
    case 'medbox': {
      // 薬の はこ（しろい はこに 緑の 十字）
      const cx = hx + d * 0.6, cy = hy - 1.2;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 1.4, cy - 1.2], [cx + 1.4, cy - 1.2], [cx + 1.4, cy + 1.1], [cx - 1.4, cy + 1.1]], white(), { n: 'bevel', bw: 0.3 });
      cv.part({ ol: 'none', cast: false });
      cv.rect(cx - 0.25, cy - 0.85, 0.5, 1.6, cl('#24a05a'), { n: [0, 0] });
      cv.rect(cx - 0.8, cy - 0.3, 1.6, 0.5, cl('#24a05a'), { n: [0, 0] });
      return;
    }
    case 'cucumber': {
      // きゅうり（緑の ながい つつに すじ）
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.4, hy + 1.0, 0.7, hx + d * 1.0, hy - 2.8, 0.62, cl('#2e8a2a', { light: 1.05 }));
      const id = cv.cur;
      cv.crease([[hx - d * 0.2, hy + 0.4], [hx + d * 0.8, hy - 2.2]], 0.14, 0.5, { parts: [id] });
      return;
    }
    case 'garlic': {
      // ニンニク（しろい たまに すじと とがった さき）
      const cx = hx + d * 0.7, cy = hy - 1.6;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 1.5, cy + 0.2], [cx - 1.2, cy - 0.9], [cx - 0.3, cy - 1.6], [cx, cy - 2.6], [cx + 0.3, cy - 1.6], [cx + 1.2, cy - 0.9], [cx + 1.5, cy + 0.2], [cx + 0.9, cy + 1.1], [cx - 0.9, cy + 1.1]], mat({ r: ['#8a7a86', '#d4c8d0', '#f6f0f2', '#ffffff'], th: TH.cloth }), { n: 'sphere', sph: [cx - 0.4, cy - 0.6, 1.8, 1.8], cx: 0.9 });
      const id = cv.cur;
      for (const du of [-0.7, 0, 0.7]) cv.crease([[cx + du * 0.3, cy - 1.5], [cx + du, cy + 0.9]], 0.12, -0.55, { parts: [id] });
      return;
    }
    case 'scroll': {
      // まきもの（きなりの かみに 赤い ひも）
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.3, hy - 2.6, 0.75, hx + d * 0.3, hy + 1.6, 0.75, mat({ r: ['#8a7048', '#c8ac78', '#efe0b8', '#fff8e4'], th: TH.cloth }));
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.cap(hx - d * 0.3, hy - 1.0, 0.8, hx - d * 0.2, hy - 0.4, 0.8, cl('#d8303a'), { cap: false });
      return;
    }
  }
}
