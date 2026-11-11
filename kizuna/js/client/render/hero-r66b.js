// 第66回 B班の 新しい 伝説の 職業 4つの みため（服・からだ・ぼうし・もちもの）
// hero-outfit.js（服・からだ）・hero-r26.js（服の つけたし・むねの かざり・もちもの）・hero-gear.js（ぼうし）・chars.js（古い 小さな え）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない）。
//
//  ニューカワイイ … パステルの ピンク・ラベンダー・ミントの 3だんの フリルの ドレス・大きな ピンクの リボン・
//                   むねに ハートの ブローチ・手に ハートの マイク・きらきら
//  SMAP           … 白い ステージ衣装（銀の ふち・青い スカーフ）・銀の マイクの ヘッドセット・手に 銀の マイク
//  大御所         … 白い 着物・こげ茶の はかま・こい むらさきの 羽織・手に せんす（hero-r27.js の もちもの）
//  五つ星シェフ   … 金の ボタンの 白い コックの 上着・青い スカーフ・長い エプロン・エプロンに 金の 星 5つ・
//                   金の 星の 高い コック帽・手に 銀の おたま
//
//   R66B_JOBS     … 職業の id（データの 人との やくそく。docs/plan-r66-legend.md）
//   R66B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66B_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   outfit66b(O, S)            … 服の つけたし（outfit26 の つけたしから よぶ。ドレスの 色・むねの かざり）
//   drawR66b(cv, P, O, layer)  … むねの かざり（drawR26 から よぶ。ハートの ブローチ・金の 星 5つ）
//   drawProp66b(cv, P, A, O)   … たての ない 手の もちもの（drawProp26 から よぶ。マイク・おたま。かいたら true）
import { mat, ramp, TH } from './hero-raster.js?v=d89f0f9d101a';

export const R66B_JOBS = ['new_kawaii', 'smap', 'oogosho', 'five_star_chef'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const SILVER = ['#3a4256', '#78839e', '#b6bed2', '#e4e8f2', '#ffffff'];
const PINKM = ['#7a1a4a', '#c83a7e', '#ff6aa8', '#ffb0d4', '#fff0f8'];

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r66b: この ファイルの つけたしを つかう  tiers66b: ドレスの 3だんの フリルの 色  heart66b: むねの ハートの ブローチ  stars66b: むねの 金の 星の 数
export const R66B_OUTFIT = {
  new_kawaii: { kind: 'dress', main: '#ffb8e0', trim: '#ffffff', r66b: true, tiers66b: ['#ffa8d8', '#d8b8ff', '#a8f0d8'], heart66b: true },
  smap: { kind: 'stage', main: '#f2f4fa' },
  oogosho: { kind: 'hakama', main: '#f2ece0', hakama: '#5a4232', haori: { c: '#3a2648' } },
  five_star_chef: { kind: 'chef', main: '#fbfbff', gold: true, neck: '#2a5ad8', long: true, pants: '#24222c', r66b: true, stars66b: 5 },
};

// からだの とくちょう（よろいを きても のこる）
// prop: もちもの（drawProp66b。'mic66b' … マイク〈micC の 色〉  'ladle66b' … 銀の おたま。'sensu' は hero-r27.js の せんす）
export const R66B_BODY = {
  new_kawaii: { prop: 'mic66b', micC: 'pink' },
  smap: { prop: 'mic66b', micC: 'silver' },
  oogosho: { prop: 'sensu', iris: '#3a2a22' },
  five_star_chef: { prop: 'ladle66b' },
};
// ぼうし（ニューカワイイ: 大きな ピンクの リボン・SMAP: 銀の ヘッドセット・五つ星シェフ: 金の 星の 高い コック帽）
export const R66B_HAT = {
  new_kawaii: { kind: 'ribbon', c: '#ff5aa8' },
  smap: { kind: 'headset', c: '#c8ccd8' },
  five_star_chef: { kind: 'toque', h: 2, stars: 3, c: '#fffaf0', hides: 'top' },
};
// 古い 小さな え（chars.js。32×42）
export const R66B_OLD_LOOK = {
  new_kawaii: { outfit: 'dress', cloth: '#ffb8e0', hat: 'feather' },
  smap: { outfit: 'suit', cloth: '#f2f4fa', tie: '#2a6ae0' },
  oogosho: { outfit: 'hakama', cloth: '#3a2648', hakama: '#5a4232' },
  five_star_chef: { outfit: 'apron', cloth: '#fbfbff', hat: 'chef' },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit66b(O, S) {
  if (!S.r66b) return;
  if (S.tiers66b && O.skirt) {
    // パステルの 3だんの フリル（フルーツジッパーより 長く、ふんわり）
    const [a, b, c] = S.tiers66b;
    O.skirt = { ...O.skirt, m: cl(a), y1: 35.8, flare: 3.8, kind: 'tiers', tiers: [cl(a), cl(b), cl(c)] };
    O.sleeve = { ...O.sleeve, puff: 1.45, cuff: cl(b) };
  }
  const R = {};
  if (S.heart66b) R.heart = mt(PINKM);
  if (S.stars66b) R.stars = S.stars66b;
  O.r66b = R;
}

// ───────────── むねの かざり（drawR26 から） ─────────────
export function drawR66b(cv, P, O, layer) {
  const R = O.r66b;
  if (!R || layer !== 'over' || P.back || P.side) return;
  if (R.heart) heartBrooch(cv, R.heart);
  if (R.stars) chestStars(cv, R.stars);
}
// むねの まん中の ハートの ブローチ
function heartBrooch(cv, m) {
  cv.part({ ol: 'line' });
  cv.poly([[16, 26.4], [14.7, 25.1], [14.8, 24.1], [15.5, 23.8], [16, 24.3], [16.5, 23.8], [17.2, 24.1], [17.3, 25.1]], m, { n: 'bevel', bw: 0.3 });
  if (cv.k >= 4) {
    cv.part({ ol: 'none', cast: false });
    cv.px(cv.X(15.3), cv.Y(24.4), '#ffffff');
  }
}
// エプロンの 上に ならぶ 金の 星（五つ星）
function chestStars(cv, n) {
  if (cv.k < 4) {
    cv.part({ ol: 'none', cast: false });
    for (let i = 0; i < n; i++) cv.px(cv.X(13.2 + i * 1.4), cv.Y(29.8), '#f6d26c');
    return;
  }
  cv.part({ ol: 'none', cast: false });
  for (let i = 0; i < n; i++) {
    const X = cv.X(13.2 + i * 1.4), Y = cv.Y(29.8);
    cv.stamp(X - 1, Y - 1, ['.G.', 'GWG', '.G.'], { G: '#d69a2e', W: '#fff6cc' });
  }
}

// ───────────── もちもの（drawProp26 から） ─────────────
export function drawProp66b(cv, P, A, O) {
  const kind = O.body?.prop;
  if (kind !== 'mic66b' && kind !== 'ladle66b') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  if (kind === 'mic66b') {
    // マイク（くろい え・あたまは 銀 か ピンク。ピンクは ハートの かざり）
    const pink = O.body.micC === 'pink';
    cv.part({ ol: 'line' });
    cv.stroke([[hx, hy + 0.8], [hx + d * 0.3, hy - 1.8]], 0.42, mt(['#0e0c14', '#1e1a26', '#34303e', '#6a6680', '#b0acc8']), { n: [0, 0] });
    cv.part({ ol: 'line' });
    cv.ell(hx + d * 0.4, hy - 2.8, 1.25, 1.25, mt(pink ? PINKM : SILVER), { bulge: 0.9 });
    if (cv.k >= 4) {
      cv.part({ ol: 'none', cast: false });
      const X = cv.X(hx + d * 0.4), Y = cv.Y(hy - 2.8);
      if (pink) cv.stamp(X - 1, Y - 1, ['W.W', 'WWW', '.W.'], { W: '#fff0f8' });
      else cv.px(X - 1, Y - 1, '#ffffff');
    }
    return true;
  }
  // 銀の おたま（長い え・まるい すくう ところ）
  const m = mt(SILVER);
  cv.part({ ol: 'line' });
  cv.stroke([[hx, hy + 0.8], [hx + d * 0.2, hy - 2.2], [hx + d * 0.6, hy - 3.6]], 0.26, m, { n: [0, 0] });
  cv.part({ ol: 'line' });
  cv.ell(hx + d * 1.3, hy - 3.8, 1.1, 0.8, m, { bulge: 0.85 });
  return true;
}
