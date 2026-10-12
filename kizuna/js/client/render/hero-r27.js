// 第27回の 新しい 職業「暴れんぼう将軍」の みため（服・かみがた・もちもの・家もん）
// hero-outfit.js（服・からだ）・hero-r26.js（羽織の つけたし・もちもの）・chars.js（古い 小さな え）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（家もんは まるい 金の しるしに した）。
//
//   R27_OUTFIT … 布の服の ときの 服（はかまに こんの 羽織・こしの 刀）
//   R27_BODY   … かみがた（ちょんまげ）・もちもの（せんす）・家もん
//   R27_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   drawR27(cv, P, O, layer) … 羽織の 家もん（まえ 2つ・せなか 1つ）
//   drawProp27(cv, P, A, O) … たての ない 手の せんす（かいたら true）
import { mat, ramp, TH } from './hero-raster.js?v=37d7bca100b3';

const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const gold = () => mat({ r: GOLD, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
let memo = null;
const M = () => (memo = memo || {
  gold: gold(),
  ink: cl('#1c2450'),
  paper: mat({ r: ['#a89a78', '#e2d8bc', '#f8f2e2', '#ffffff'], th: TH.cloth }),
  rib: mat({ r: ['#2a1608', '#5a3218', '#8a5228', '#b87a40'], th: TH.matte }),
  red: cl('#d02a30', { light: 1.1 }),
});

// ───────────── 服（布の服 の とき） ─────────────
// hakama: はかま（hero-outfit.js の 'hakama'）。haori・sheath は hero-r26.js の 羽織と こしの 刀
export const R27_OUTFIT = {
  // 白い 着物・はいいろの はかま・こんの 羽織（金の 家もん）・黒い さやの 刀
  abarenbo_shogun: { kind: 'hakama', main: '#ece8f2', hakama: '#4a4a62', haori: { c: '#24357e' }, sheath: '#141018', crest27: true },
};
// からだの とくちょう（よろいを きても のこる）
export const R27_BODY = {
  abarenbo_shogun: { hair: 'topknot', prop: 'sensu', iris: '#2a2a3a' },
};
// 古い 小さな え（chars.js。32×42）
export const R27_OLD_LOOK = {
  abarenbo_shogun: { outfit: 'hakama', cloth: '#24357e', hakama: '#4a4a62' },
};

// ───────────── 家もん（まるい 金の わの 中に 3つの 葉） ─────────────
function crest(cv, x, y, r) {
  const m = M();
  cv.part({ ol: 'soft' });
  cv.ell(x, y, r, r, m.gold, { bulge: 0.7 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id, cast: false });
  cv.ell(x, y, r * 0.66, r * 0.66, m.ink, { bulge: 0.2 });
  // 3つの 葉（金）
  cv.part({ ol: 'none', clip: id, cast: false });
  for (const a of [-90, 30, 150]) {
    const t = (a * Math.PI) / 180;
    cv.ell(x + Math.cos(t) * r * 0.32, y + Math.sin(t) * r * 0.32, r * 0.24, r * 0.24, m.gold, { bulge: 0.5 });
  }
}

// layer は hero.js の じゅんばん（drawR26 の あとで よぶ）
export function drawR27(cv, P, O, layer) {
  if (!O.spec?.crest27 || !O.haori || layer !== 'over') return;
  if (P.side) {
    crest(cv, P.X(-1.6), 23.6 + (P.bob || 0), 0.95);
    return;
  }
  if (P.back) {
    crest(cv, 16, 23.8, 1.6);
    return;
  }
  for (const s of [-1, 1]) crest(cv, 16 + s * 3.5, 22.4, 0.85);
}

// ───────────── もちもの: ひらいた せんす（白い 紙に 赤い 日の丸・金の ふち） ─────────────
export function drawProp27(cv, P, A, O) {
  if (O.body?.prop !== 'sensu') return false;
  const m = M();
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  // かなめ（手の ところ）から 上に おうぎ形に ひらく
  const cx = hx + d * 0.2, cy = hy - 0.2;
  const R = 3.4, a0 = -150, a1 = -30;
  const arc = [];
  for (let i = 0; i <= 10; i++) {
    const t = ((a0 + ((a1 - a0) * i) / 10) * Math.PI) / 180;
    arc.push([cx + Math.cos(t) * R * (d > 0 ? 1 : 1), cy + Math.sin(t) * R]);
  }
  cv.part({ ol: 'line' });
  cv.poly([[cx, cy], ...arc], m.paper, { cx: 0.5, cy: 0.2 });
  const id = cv.cur;
  // 赤い 日の丸
  cv.part({ ol: 'none', clip: id, cast: false });
  cv.ell(cx, cy - R * 0.62, 0.75, 0.75, m.red, { bulge: 0.3 });
  // ほね（すじ）
  for (let i = 1; i < 6; i++) {
    const t = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    cv.crease([[cx + Math.cos(t) * 0.8, cy + Math.sin(t) * 0.8], [cx + Math.cos(t) * R * 0.95, cy + Math.sin(t) * R * 0.95]], 0.12, -0.35, { parts: [id] });
  }
  // 金の ふち
  cv.part({ ol: 'none', clip: id, cast: false });
  cv.stroke(arc, 0.32, m.gold, { n: [0, -0.2] });
  // かなめ
  cv.part({ ol: 'line' });
  cv.ell(cx, cy, 0.42, 0.42, m.rib, { bulge: 0.8 });
  return true;
}
