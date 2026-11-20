// 第3部 第1章 第1幕「星ふるえの夜」の 新しい しくみ「光の輪」（A: 世界と 物語）の 計算だけ（サーバー・画面・テストの とく 道具が 同じ 物を 使う）
// ※ ネタバレ注意（docs/plan-part3.md の 9-2）
// ・見える はんい … 自分の まわり LIGHT_ME マス（星の子の ほのかな 光）。その 外は まっ暗
// ・光る こけ … ふむと 光って、まわり LIGHT_MOSS マスが 見える
//   光の みなもと（大きな 水しょう）から、光って いる こけが となりどうしに つながって いる 間は ずっと 光る
//   つながって いない こけは、ふんだ 人が MOSS_STEPS 歩 あるくと 消える
// ・とびらの 水しょう … となりの こけが みなもとに つながると 光る。その 階の 水しょうが 全部 光ると とびらが 開く
// ・見えない 穴 … こけ・みなもと・水しょうの 光が とどくと 見える（自分の ほのかな 光では 見えない）
// ほかの ファイルを ほとんど 読まない（maps・world・client・test の どこからでも 読める）

export const LIGHT_ME = 2.5;
export const LIGHT_MOSS = 3;
export const LIGHT_SOURCE = 3;
export const LIGHT_CRYSTAL = 2;
export const MOSS_STEPS = 24;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 階の 光の 物の ならび（maps/c9a-cave.js が map.c9a に 入れる）
// { n, w, h, sources: [k], moss: [k], crystals: [k], holes: [k], torches: [k] }（k … y * w + x）
export function lightInfo(n, rows, chars) {
  const w = rows[0].length, h = rows.length;
  const out = { n, w, h, sources: [], moss: [], crystals: [], holes: [], torches: [] };
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const k = y * w + x;
    if (ch === chars.source) out.sources.push(k);
    else if (ch === chars.moss) out.moss.push(k);
    else if (ch === chars.crystal) out.crystals.push(k);
    else if (ch === chars.hole) out.holes.push(k);
    else if (chars.torch && chars.torch.includes(ch)) out.torches.push(k);
  }));
  out.mossSet = new Set(out.moss);
  out.sourceSet = new Set(out.sources);
  return out;
}

// 光の ようす（パーティーで 1つ。セーブしない）: lit … こけの k → { left（のこりの 歩数。つながると Infinity）, by（ふんだ 人） }
export const newLight = () => ({ lit: new Map(), ver: 0 });

// みなもとに つながって いる こけ
export function connectedOf(info, lit) {
  const out = new Set();
  const q = [];
  const near = (k) => D4.map(([dx, dy]) => {
    const x = (k % info.w) + dx, y = Math.floor(k / info.w) + dy;
    return x < 0 || y < 0 || x >= info.w || y >= info.h ? -1 : y * info.w + x;
  });
  for (const s of info.sources) for (const n of near(s)) if (lit.has(n) && !out.has(n)) { out.add(n); q.push(n); }
  while (q.length) {
    const k = q.shift();
    for (const n of near(k)) if (lit.has(n) && !out.has(n)) { out.add(n); q.push(n); }
  }
  return out;
}

// 光って いる とびらの 水しょう（ならびの じゅんに true / false）
export function crystalsLit(info, lit) {
  const conn = connectedOf(info, lit);
  return info.crystals.map((c) => D4.some(([dx, dy]) => {
    const x = (c % info.w) + dx, y = Math.floor(c / info.w) + dy;
    const k = y * info.w + x;
    return x >= 0 && y >= 0 && x < info.w && y < info.h && (conn.has(k) || info.sourceSet.has(k));
  }));
}
export const doorOpen = (info, lit) => info.crystals.length > 0 && crystalsLit(info, lit).every(Boolean);

// 1歩（by が (x, y) に 入った）。かわったら true
//  1. by が ふんだ つながって いない こけの のこりを 1 へらす（0 で 消える）
//  2. こけを ふんだら 光る（のこり MOSS_STEPS）
//  3. みなもとに つながった こけは ずっと 光る
export function stepLight(info, st, x, y, by) {
  let changed = false;
  for (const [k, e] of st.lit) {
    if (e.by !== by || e.left === Infinity) continue;
    e.left -= 1;
    if (e.left <= 0) { st.lit.delete(k); changed = true; }
  }
  const k = y * info.w + x;
  if (info.mossSet.has(k)) {
    const e = st.lit.get(k);
    if (!e) { st.lit.set(k, { left: MOSS_STEPS, by }); changed = true; }
    else if (e.left !== Infinity) { e.left = MOSS_STEPS; e.by = by; }
  }
  for (const c of connectedOf(info, st.lit)) {
    const e = st.lit.get(c);
    if (e.left !== Infinity) { e.left = Infinity; changed = true; }
  }
  if (changed) st.ver = (st.ver || 0) + 1;
  return changed;
}

// 光の まん中と はんい（[x, y, r, しゅるい]）。みなもと・光って いる こけ・光った 水しょう・たいまつ
//  opened … その 階の とびらが もう 開いて いる（水しょうは ずっと 光る）
export function lightCenters(info, lit, opened = false) {
  const out = [];
  const xy = (k) => [k % info.w, Math.floor(k / info.w)];
  for (const k of info.sources) out.push([...xy(k), LIGHT_SOURCE, 'source']);
  for (const k of info.torches) out.push([...xy(k), LIGHT_CRYSTAL, 'torch']);
  for (const [k, e] of lit) out.push([...xy(k), LIGHT_MOSS, e.left === Infinity ? 'link' : 'moss']);
  const on = opened ? info.crystals.map(() => true) : crystalsLit(info, lit);
  info.crystals.forEach((k, i) => { if (on[i]) out.push([...xy(k), LIGHT_CRYSTAL, 'crystal']); });
  return out;
}

// 光の とどく マス（こけ・みなもと・水しょう・たいまつの 光。自分の ほのかな 光は 入れない）
export function litCells(info, lit, opened = false) {
  const out = new Set();
  for (const [cx, cy, r] of lightCenters(info, lit, opened)) {
    const R = Math.ceil(r);
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      if (x < 0 || y < 0 || x >= info.w || y >= info.h) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) out.add(y * info.w + x);
    }
  }
  return out;
}

// 送る 形（[k, つながって いるか 1/0] の ならび）と もどす 形
export const packLit = (lit) => [...lit].map(([k, e]) => [k, e.left === Infinity ? 1 : 0]);
export function unpackLit(list) {
  const lit = new Map();
  for (const [k, on] of list || []) lit.set(k, { left: on ? Infinity : MOSS_STEPS, by: null });
  return lit;
}
