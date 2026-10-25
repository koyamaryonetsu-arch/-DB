// 第41回 B の 新しい 職業 2つの みため（雪の女王・第5のせいれい。服・からだ・かみ・オーラ）
// hero-outfit.js（服・からだ）・hero-r26.js（服の つけたし）・hero.js（かみの いろ）・chars.js（古い 小さな え）・
// hero-r33.js（男の子の すがた masc33）・hero-aura.js（雪の けっしょう・4つの せいれいの 光の たま）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（顔や ロゴは かかない）。
//
//  雪の女王     … 水色の 足もとまでの ドレス（きらきらの 白い ふち）・すきとおった 長い マント・すける 長い そで・
//                 白っぽい 金の かみの かた三つ編み・あおい 目・まわりに 雪の けっしょう（オーラ snow41b）
//  雪の王（男の子の 雪の女王）… こい 水色の 王子の 服（金の ボタン）・すきとおった 長い マント・白っぽい 金の かみ・雪の けっしょう
//  第5のせいれい … 白い 足もとまでの ドレス（水色の ふち）・すきとおった 長い 白い マント・おろした 長い 白っぽい 金の かみ・
//                 白く 光る オーラと、まわりを 回る 4つの せいれいの 光（風の みどり・火の オレンジ・水の 青・大地の 土色。spirit41b）
//  男の子の 第5のせいれい … 白い 長い ローブ（水色の ふち・水色の 宝石）・白い マント・白っぽい 金の かみ・おなじ オーラ
//
//   R41B_JOBS     … 職業の id（データとの やくそく。docs/plan-r41-jobs-b.md）
//   R41B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R41B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R41B_HAIR     … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R41B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R41B_MASC     … 男の子の すがた（hero-r33.js の masc33 が この 表も 見る）
//   AURA41B       … オーラの ほのおの せってい（hero-aura.js の AURA に まぜる）
//   outfit41b(O, S)                 … 服の つけたし（outfit26 の つけたしから よぶ。足もとまでの ドレス・すける そで・マント）
//   aura41b(img, filled, bb, f, k, B) … 雪の けっしょう・4つの せいれいの 光（hero-aura.js の drawAura から よぶ）
import { mat, ramp, TH, mixC } from './hero-raster.js?v=855c00e900d9';

export const R41B_JOBS = ['snow_queen', 'fifth_spirit'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
// すける ぬの（マント・そで。白っぽく つやが ある）
const sheer = (c) => mat({ r: ramp(c, 4, { light: 1.12 }), th: TH.cloth, spec: 0.94, sc: '#ffffff' });

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r41b: この ファイルの つけたしを つかう  gown41b: 足もとまでの ドレス（いろ）  sleeve41b: すける 長い そでの いろ
export const R41B_OUTFIT = {
  snow_queen: { kind: 'dress', main: '#8fd0f2', trim: '#eefaff', cape: '#cdeeff', capeLen: 39.2, r41b: true, gown41b: '#8fd0f2', sleeve41b: '#c4ecff', tie41b: '#bfe8fa' },
  fifth_spirit: { kind: 'dress', main: '#f6fbff', trim: '#a8dcf6', cape: '#eef8ff', capeLen: 39.4, r41b: true, gown41b: '#f6fbff', sleeve41b: '#e4f4ff' },
};

// からだの とくちょう（よろいを きても のこる）。aura: hero-aura.js の AURA（AURA41B）と aura41b
export const R41B_BODY = {
  snow_queen: { hair: 'braid', hcol: 'r41bplat', iris: '#3a8ad8', aura: 'snow41b', r41b: true },
  fifth_spirit: { hair: 'long', hcol: 'r41bplat', iris: '#4aa0e8', aura: 'spirit41b', r41b: true },
};
// かみの いろ（白っぽい 金）
export const R41B_HAIR = {
  r41bplat: ['#7e7862', '#bcb69c', '#e4dec6', '#f8f4e6', '#ffffff'],
};
// 古い 小さな え（chars.js。32×42）
export const R41B_OLD_LOOK = {
  snow_queen: { outfit: 'dress', cloth: '#8fd0f2', cape: '#cdeeff' },
  fifth_spirit: { outfit: 'dress', cloth: '#f6fbff', cape: '#eef8ff' },
};

// ───────────── 男の子の すがた ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう（hero-r33.js の masc33。女の子は 上の まま）
//  雪の王: こい 水色の 王子の 服（金の ボタン）・すける 長い マント。第5のせいれい: 白い ローブ・水色の 宝石・白い マント
//  かみがたは その 人の まま（いろだけ 白っぽい 金）。ぼうしは なし
export const R41B_MASC = {
  snow_queen: {
    outfit: { kind: 'uniform', main: '#3a7cc0', cape: '#cdeeff', capeLen: 38.2, r41b: true },
    body: { hcol: 'r41bplat', iris: '#3a8ad8', aura: 'snow41b', r41b: true },
    hat: null,
    old: { outfit: 'uniform', cloth: '#3a7cc0', cape: '#cdeeff' },
  },
  fifth_spirit: {
    outfit: { kind: 'robe', main: '#f4faff', trim: '#8fd0f2', gem: '#5ab8f0', cape: '#eef8ff', capeLen: 39.0, r41b: true },
    body: { hcol: 'r41bplat', iris: '#4aa0e8', aura: 'spirit41b', r41b: true },
    hat: null,
    old: { outfit: 'robe', robeMain: '#f4faff', robeTrim: '#8fd0f2', cape: '#eef8ff' },
  },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit41b(O, S) {
  if (!S.r41b) return;
  // すきとおった マント（うらも 明るい）
  if (O.cape) O.cape = { ...O.cape, m: sheer(S.cape), inner: sheer(mixC(S.cape, '#ffffff', 0.35)) };
  if (S.gown41b) {
    // 足もとまでの ドレス（すそは 広がる）・むねの 小さな 白い かざり・すける 長い そで
    O.skirt = { ...O.skirt, m: cl(S.gown41b, { light: 1.05 }), y0: 28.4, y1: 39.6, flare: 3.6, kind: 'frill' };
    if (O.torso) O.torso = { ...O.torso, bow: cl(S.trim || '#ffffff') };
    O.sleeve = { upper: sheer(S.sleeve41b || S.gown41b), lower: sheer(S.sleeve41b || S.gown41b), cuff: null, puff: 1.0 };
    O.boots = { m: cl('#eef8ff'), h: 0.4, cuff: cl(S.trim || '#eefaff') };
  }
  if (S.tie41b) O.tie = S.tie41b;
}

// ───────────── オーラ（hero-aura.js） ─────────────
// snow41b: うすい 水色の みじかい ひかり（ほとんど きえて いる）・spirit41b: 白く 光る せいれいの ひかり
export const AURA41B = {
  snow41b: { glow: 0.4, len: 1.5, wid: 0.85, up: 1.0, gap: 3.0, flicker: 0.45, cols: [['#ffffff', 150], ['#dcf4ff', 118], ['#a8dcf6', 88], ['#6ab4e4', 60]] },
  spirit41b: { glow: 0.55, len: 3.0, wid: 1.15, up: 1.1, gap: 2.2, cols: [['#ffffff', 210], ['#eaf8ff', 180], ['#bce6ff', 146], ['#80bcf0', 110]] },
};

const hash = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
// 1ドット（からだ・えの はしには かかない）
function put(img, filled, x, y, col, a) {
  const { w, h, rgba } = img;
  x = Math.round(x); y = Math.round(y);
  if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
  const i = y * w + x;
  if (filled[i]) return;
  const c = parseInt(col.slice(1), 16);
  rgba[i * 4] = (c >> 16) & 255; rgba[i * 4 + 1] = (c >> 8) & 255; rgba[i * 4 + 2] = c & 255; rgba[i * 4 + 3] = a;
}
// 4つの せいれいの 光（風・火・水・大地）。えの ざひょう（32×42 の マス）。コマで 1つずつ 回る
const ORBS = [['#b8ffc8', '#3ac86a'], ['#ffe0a0', '#ff7a2a'], ['#d8f0ff', '#3a8ae8'], ['#f4dcb0', '#a8743a']];
const ORB_AT = [[4.2, 15.0], [27.8, 15.0], [27.6, 31.0], [4.4, 31.0]];

export function aura41b(img, filled, bb, f, k, B) {
  if (B?.aura === 'snow41b') {
    // 雪の けっしょう（白い 小さな ＊。からだの まわりに 4つ。コマで ばしょが かわる）
    const r = k >= 4 ? 2 : 1;
    for (let j = 0; j < 4; j++) {
      const x = bb.x0 - k + hash(j * 5.1 + f * 3.7, j + 0.4) * (bb.x1 - bb.x0 + 2 * k), y = bb.y0 + k + hash(j + 1.7, f * 2.3 + j) * (bb.y1 - bb.y0) * 0.8;
      put(img, filled, x, y, '#ffffff', 250);
      for (let d = 1; d <= r; d++) {
        const c = d === r ? '#9ad8f4' : '#e8f8ff', a = d === r ? 200 : 235;
        for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) put(img, filled, x + ox, y + oy, c, a);
        if (k >= 4 && d === 1) for (const [ox, oy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) put(img, filled, x + ox * 1.5, y + oy * 1.5, '#cfefff', 190);
      }
    }
  }
  if (B?.aura === 'spirit41b') {
    // 4つの せいれいの 光の たま（まんなかは 明るく、まわりは その いろ）
    const r = Math.max(1, Math.round(0.9 * k));
    for (let j = 0; j < 4; j++) {
      const [u, v] = ORB_AT[(j + (f || 0)) % 4];
      const [hi, col] = ORBS[j];
      const cx = u * k, cy = v * k;
      for (let dy = -r - 1; dy <= r + 1; dy++) {
        for (let dx = -r - 1; dx <= r + 1; dx++) {
          const d = Math.hypot(dx, dy);
          if (d <= r * 0.5) put(img, filled, cx + dx, cy + dy, '#ffffff', 250);
          else if (d <= r) put(img, filled, cx + dx, cy + dy, hi, 240);
          else if (d <= r + 1) put(img, filled, cx + dx, cy + dy, col, 150);
        }
      }
    }
  }
}
