// 第5章 Step 3・4「クモイ地方」「しずみゆく島の古い神殿」の タイル（16×16 ドット）と 神殿の 色（テーマ）
// ・雲の 海（4コマで ゆっくり 流れる）・雲に とけかけた 島の ふち・風の道（北・東・南・西。白い すじと 矢じるしが 流れる）
// ・かたむいた 木・かたむいた 柱・古い 神殿の 石の かべ・入口（フィールド）
// ・かたむく ゆか（西／東が ひくい）・岩・かたむきの石（おす 前／あと）・重さの てんびんの 皿（上／下）・岩が のった 皿・てんびんの とびら・柱
// ・入りこんだ 雲（3コマ）・たて穴・縄ばしご・まるめた 縄ばしご・古い かべ画（4まいで 1まい）・守り星の かけらの 台・島の 根
// render/tiles.js が まぜる。2.5D は render/field3d.js（kumoiBlockSpec・KUMOI_FLOOR_H・KUMOI_LIQUIDS）と render/tex3d.js（KUMOI_PROPS）
// テーマ（sky_ruin … 1〜3階・sky_ruin_mid … 4〜5階・sky_ruin_deep … 6〜7階）は render/themes.js
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす（m & 1 … 下が かべで ない＝前の かお）
import { T } from '../../shared/tiles.js?v=f2f4be342cfa';
import { prand, shade } from './pixel.js?v=f2f4be342cfa';

// 雲（白・うすい 青）・空の 島の 草・古い 神殿の 石（白っぽい 砂色）・金
const CL = { w: '#f6f8ff', l: '#e4ecf8', m: '#ccd8ec', d: '#aab8d4', sh: '#8a9ac0' };
const GR = { g: '#6ab85a', d: '#549a48', l: '#8ad070', b: '#3e8436' };
const RS = { base: '#b8b098', light: '#d8d0b8', dark: '#8a826c', line: '#6e6856', deep: '#4e4a3e' };
const GOLD = { g: '#e8c050', gl: '#fff0a0', gd: '#a8842a' };
const WOOD = { w: '#9a6a3a', d: '#6a4422', l: '#c08a50' };

// 雲の もこもこ（ちがい v と コマ f で 少しずつ ずれる。タイルの はしで つながる）
function cloudBase(p, v, f, base = CL.l) {
  p.rect(0, 0, 16, 16, base);
  const off = (f % 4) * 4;
  const r = prand(v * 29 + 3);
  for (let i = 0; i < 5; i++) {
    const cx = (Math.floor(r() * 16) + off) % 16, cy = Math.floor(r() * 16), rr = 2 + Math.floor(r() * 3);
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
      if (dx * dx + dy * dy > rr * rr) continue;
      const x = (cx + dx + 16) % 16, y = (cy + dy + 16) % 16;
      p.set(x, y, dy < 0 ? CL.w : CL.l);
    }
    p.set((cx + 1) % 16, (cy + rr + 16) % 16, CL.m);
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), CL.m);
}
export const CLOUD_FRAMES = 4;
const paintCloudSea = (p, v, f) => cloudBase(p, v, f);

// 草（空の 島）
function grass(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, GR.g);
  const r = prand(v * 97 + 31 + seed);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 14) + 1;
    p.set(x, y, GR.b); p.set(x, y - 1, GR.l);
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), GR.d);
}
// 雲に とけかけた 島の ふち（草の 上に 雲が かかって、すきまから 下の 雲が 見える）
function paintCloudRim(p, v, f) {
  grass(p, v, 5);
  const r = prand(v * 41 + 7);
  for (let i = 0; i < 3; i++) {
    const cx = Math.floor(r() * 16), cy = Math.floor(r() * 16), rr = 2 + Math.floor(r() * 2);
    p.ellipse(cx, cy, rr + 0.5, rr, CL.l);
    p.ellipse(cx, cy - 0.5, rr - 0.5, rr - 1, CL.w);
  }
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#a8c8a0');
}

// 風の道（雲の 上を ながれる 風。白い すじと 矢じるしが 向きへ 流れる）
export const SKYWIND_FRAMES = 4;
function paintSkyWind(p, v, f, dir) {
  p.rect(0, 0, 16, 16, '#a8d4f4');
  const r = prand(v * 7 + 11);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#c8e6fa');
  const k = (f % SKYWIND_FRAMES) * 4;
  // 東へ 向きの え を かいて、向きに あわせて まわす
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const y = 3 + i * 5;
    const x0 = (k + i * 6) % 16;
    for (let j = 0; j < 6; j++) pts.push([(x0 + j) % 16, y, j > 3 ? '#ffffff' : '#e4f4ff']);
  }
  // 矢じるし（まん中）
  for (const [x, y] of [[9, 7], [10, 8], [9, 9], [8, 6], [8, 10]]) pts.push([x, y, '#5a9ad8']);
  for (let x = 4; x <= 9; x++) pts.push([x, 8, '#5a9ad8']);
  const rot = { E: ([x, y]) => [x, y], W: ([x, y]) => [15 - x, y], S: ([x, y]) => [15 - y, x], N: ([x, y]) => [y, 15 - x] }[dir];
  for (const q of pts) { const [x, y] = rot(q); p.set(x, y, q[2]); }
}

// かたむいた 木・かたむいた 柱（下は 草）
function paintTiltTree(p, v) {
  grass(p, v, 9);
  const lean = v & 1 ? 1 : -1;
  for (let y = 9; y < 15; y++) { const x = 7 + Math.round((14 - y) * 0.35 * lean); p.set(x, y, '#6d4a2b'); p.set(x + 1, y, '#5a3a20'); }
  const cx = 8 + 2 * lean;
  p.ellipse(cx, 6, 5.5, 4.5, '#2f8a3a'); p.ellipse(cx - 1, 5, 4, 3, '#4aad4c'); p.set(cx + 2, 8, '#1f6128'); p.set(cx - 3, 7, '#1f6128');
  p.hline(2, 13, 15, shade(GR.g, -0.15));
}
function paintTiltPillar(p, v) {
  grass(p, v, 13);
  const lean = v & 1 ? 1 : -1;
  for (let y = 1; y < 15; y++) {
    const x = 6 + Math.round((14 - y) * 0.25 * lean);
    p.hline(x, x + 3, y, RS.base); p.set(x, y, RS.light); p.set(x + 3, y, RS.dark);
  }
  p.hline(5 + (lean > 0 ? 3 : -3), 10 + (lean > 0 ? 3 : -3), 1, RS.light);
  p.set(7, 8, RS.line); p.set(8, 9, RS.line);
  p.hline(4, 11, 15, shade(GR.g, -0.2));
}
// 古い 神殿の 石の かべ（m & 1 … 前の かお）
function ruinStone(p, v, base = RS.base) {
  p.rect(0, 0, 16, 16, base);
  const r = prand(v * 53 + 17);
  for (let i = 0; i < 9; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? shade(base, -0.1) : shade(base, 0.1));
  p.hline(0, 15, 0, shade(base, -0.25));
  p.hline(0, 15, 8, shade(base, -0.2));
  p.vline(v & 1 ? 3 : 10, 1, 7, shade(base, -0.22));
  p.vline(v & 2 ? 6 : 13, 9, 15, shade(base, -0.22));
  p.hline(1, 15, 1, shade(base, 0.12));
}
function paintRuinWall(p, v, f, m = 0) {
  if (m & 1) {
    ruinStone(p, v);
    // ひびと こけ
    p.set(4, 3, RS.line); p.set(5, 4, RS.line); p.set(5, 5, RS.line);
    p.set(12, 11, '#7a9a5a'); p.set(13, 12, '#7a9a5a');
  } else {
    p.rect(0, 0, 16, 16, RS.light);
    const r = prand(v * 11 + 5);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RS.base);
    p.hline(0, 15, 15, RS.dark);
  }
}
// 入口（くらい 中。上に 石の まぐさ）
function paintRuinDoor(p, v) {
  ruinStone(p, v);
  p.rect(3, 3, 10, 13, '#2a2620');
  p.rect(4, 4, 8, 12, '#3a3428');
  p.hline(2, 13, 2, RS.light); p.hline(2, 13, 3, RS.dark);
  p.set(8, 9, '#5a5040');
}

// ───── 神殿の 中 ─────
// かたむいた ゆか（ひくい 方へ だんだん こく。ひくい 方を さす 矢の もよう）
function paintTiltFloor(p, v, east) {
  p.rect(0, 0, 16, 16, RS.base);
  for (let x = 0; x < 16; x++) {
    const t = east ? x / 15 : 1 - x / 15;
    const c = t > 0.66 ? shade(RS.base, -0.12) : t > 0.33 ? shade(RS.base, -0.05) : RS.base;
    p.vline(x, 0, 15, c);
  }
  p.hline(0, 15, 0, RS.dark);
  p.vline(v & 1 ? 0 : 8, 1, 15, shade(RS.base, -0.18));
  const ax = east ? [[10, 7], [11, 8], [10, 9]] : [[5, 7], [4, 8], [5, 9]];
  for (const [x, y] of ax) p.set(x, y, RS.line);
  p.hline(5, 10, 8, shade(RS.base, -0.2));
}
// 大きな 岩
function paintBoulder(p, v) {
  paintTiltFloor(p, v, false);
  p.ellipse(8, 13, 6, 2, shade(RS.base, -0.3));
  p.ellipse(8, 8, 6.5, 6, '#7a6e5a');
  p.ellipse(7, 7, 5, 4.5, '#968a72');
  p.ellipse(6, 5, 2.5, 2, '#b4a88e');
  p.set(10, 10, '#5a5040'); p.set(11, 9, '#5a5040'); p.set(4, 9, '#5a5040');
}
// かたむきの石（石の 台に 矢じるしの ついた 石。おすと 金色に 光る）
function paintTiltLever(p, v, on) {
  ruinStone(p, v, RS.dark);
  p.rect(3, 5, 10, 10, RS.deep);
  p.rect(4, 4, 8, 10, on ? '#c8a050' : '#9a8e72');
  p.hline(4, 11, 4, on ? GOLD.gl : RS.light);
  const c = on ? '#fff0a0' : '#5a5040';
  // 矢じるし（おす 前は 西、あとは 東）
  if (on) { p.hline(5, 10, 9, c); p.set(9, 8, c); p.set(9, 10, c); p.set(8, 7, c); p.set(8, 11, c); }
  else { p.hline(5, 10, 9, c); p.set(6, 8, c); p.set(6, 10, c); p.set(7, 7, c); p.set(7, 11, c); }
}
// てんびんの 皿（上がっている／下がった）
function panBase(p, v, down) {
  p.rect(0, 0, 16, 16, RS.base);
  p.hline(0, 15, 0, RS.dark);
  p.ellipse(8, 8.5, 7, 6, GOLD.gd);
  p.ellipse(8, 8, 6, 5, down ? '#ffe080' : '#c8a860');
  p.ellipse(8, 8, 4, 3, down ? '#fff0b0' : '#d8b870');
  // くさり（上の 柱へ）
  p.set(2, 2, '#8a8a9a'); p.set(13, 2, '#8a8a9a'); p.set(3, 3, '#8a8a9a'); p.set(12, 3, '#8a8a9a');
}
const paintPan = (p, v) => panBase(p, v, false);
function paintPanOn(p, v) {
  panBase(p, v, true);
  p.set(8, 7, '#ffffff'); p.set(6, 9, '#ffffff');
}
function paintPanRock(p, v) {
  panBase(p, v, true);
  p.ellipse(8, 7, 5, 4.5, '#7a6e5a');
  p.ellipse(7, 6, 3.5, 3, '#968a72');
  p.set(6, 4, '#b4a88e'); p.set(10, 9, '#5a5040');
}
// てんびんの とびら（石の とびらに くさり）
function paintScaleDoor(p, v, f, m = 0) {
  ruinStone(p, v, RS.dark);
  p.rect(2, 2, 12, 14, '#7a7262');
  p.rect(3, 3, 10, 13, '#8a8070');
  p.vline(8, 3, 15, '#5a5446');
  for (const y of [5, 8, 11]) { p.set(5, y, '#9a9aa8'); p.set(11, y, '#9a9aa8'); }
  // てんびんの しるし
  p.hline(5, 11, 6, GOLD.g); p.vline(8, 5, 9, GOLD.g); p.set(5, 7, GOLD.g); p.set(11, 7, GOLD.g);
  if (!(m & 1)) p.hline(0, 15, 15, RS.deep);
}
// てんびんの 柱と うで
function paintScaleBeam(p, v) {
  p.rect(0, 0, 16, 16, RS.base);
  p.hline(0, 15, 0, RS.dark);
  p.rect(6, 4, 4, 11, '#a88a40');
  p.vline(6, 4, 14, GOLD.gl);
  p.hline(0, 15, 3, GOLD.g); p.hline(0, 15, 4, GOLD.gd);
  p.ellipse(8, 3.5, 2, 2, GOLD.gl);
  p.rect(4, 14, 8, 2, RS.deep);
}
// 入りこんだ 雲（石の ゆかの 上を はう）
export const CLOUD_FLOOR_FRAMES = 3;
function paintCloudFloor(p, v, f) {
  p.rect(0, 0, 16, 16, '#9aa2b4');
  const r = prand(v * 19 + 23);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#8a92a4');
  const off = (f % CLOUD_FLOOR_FRAMES) * 5;
  const r2 = prand(v * 7 + 1);
  for (let i = 0; i < 4; i++) {
    const cx = (Math.floor(r2() * 16) + off) % 16, cy = Math.floor(r2() * 16), rr = 2 + Math.floor(r2() * 3);
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr - 1; dx <= rr + 1; dx++) {
      if ((dx * dx) / 1.4 + dy * dy > rr * rr) continue;
      p.set((cx + dx + 16) % 16, (cy + dy + 16) % 16, dy < 0 ? '#f0f4fc' : '#d8e0ec');
    }
  }
}
// たて穴（ふかい。ふちに 石）・縄ばしご（穴に かかった）・まるめた 縄ばしご
function paintShaft(p, v) {
  p.rect(0, 0, 16, 16, RS.base);
  p.ellipse(8, 8, 7, 6.5, RS.deep);
  p.ellipse(8, 8.5, 6, 5.5, '#14120e');
  p.ellipse(8, 9, 4, 3.5, '#0a0806');
  p.set(5, 5, '#3a3428');
}
function paintRopeLadder(p, v) {
  paintShaft(p, v);
  p.vline(5, 1, 15, WOOD.w); p.vline(10, 1, 15, WOOD.w);
  for (let y = 3; y < 16; y += 3) p.hline(5, 10, y, WOOD.l);
  p.set(5, 0, GOLD.g); p.set(10, 0, GOLD.g);
}
function paintRopeCoil(p, v) {
  p.rect(0, 0, 16, 16, RS.base);
  p.hline(0, 15, 0, RS.dark);
  p.ellipse(8, 9, 6.5, 5, WOOD.d);
  p.ellipse(8, 8.5, 5.5, 4, WOOD.w);
  p.ellipse(8, 8.5, 3.5, 2.5, WOOD.d);
  p.ellipse(8, 8.5, 2.5, 1.5, WOOD.l);
  p.set(13, 4, GOLD.g); p.set(14, 3, GOLD.g); p.set(12, 5, WOOD.l);
}
// 古い かべ画（4まいで 1まい: 大地の 守り星・島の 根・空の 島・ハネビト。m & 2/8 … となりも かべ画）
function paintRuinMural(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, RS.dark);
  p.rect(1, 2, 14, 12, '#e8dcbc');
  p.hline(1, 14, 2, '#f8f0d8');
  const k = v % 4;
  if (k === 0) {
    // 大地の 守り星（茶色の 光）
    p.ellipse(8, 8, 3.5, 3.5, '#c88a3a'); p.ellipse(8, 7.5, 2, 2, '#f8d890');
    for (const [x, y] of [[8, 3], [8, 13], [3, 8], [13, 8]]) p.set(x, y, '#c88a3a');
  } else if (k === 1) {
    // 島の 根
    for (const x of [4, 8, 12]) { p.vline(x, 4, 13, '#8a6a4a'); p.set(x - 1, 12, '#8a6a4a'); p.set(x + 1, 13, '#8a6a4a'); }
    p.hline(2, 13, 4, '#6ab85a');
  } else if (k === 2) {
    // 空の 島（雲の 上）
    p.ellipse(8, 7, 5, 2, '#6ab85a'); p.ellipse(8, 9, 3.5, 2, '#8a6a4a'); p.set(8, 11, '#8a6a4a');
    p.hline(2, 13, 12, '#ffffff'); p.hline(3, 6, 11, '#ffffff');
  } else {
    // ハネビト（羽の ある 人）
    for (const x of [5, 11]) {
      p.rect(x - 1, 8, 2, 4, '#4a8ac8'); p.rect(x - 1, 6, 2, 2, '#e8c8a0');
      p.set(x - 2, 7, '#ffffff'); p.set(x - 3, 6, '#ffffff'); p.set(x + 1, 7, '#ffffff'); p.set(x + 2, 6, '#ffffff');
    }
  }
  if (!(m & 8)) p.vline(0, 0, 15, RS.deep);
  if (!(m & 2)) p.vline(15, 0, 15, RS.deep);
  p.hline(0, 15, 15, RS.deep);
}
// 守り星の かけらの 台（光る 小さな かけら）
function paintShardAltar(p, v) {
  p.rect(0, 0, 16, 16, RS.base);
  p.hline(0, 15, 0, RS.dark);
  p.rect(2, 6, 12, 9, RS.dark);
  p.rect(3, 5, 10, 9, RS.light);
  p.hline(3, 12, 5, '#f0e8d0');
  p.ellipse(8, 4, 2.5, 3, '#f0d890');
  p.set(8, 3, '#ffffff'); p.set(7, 4, '#fff8d0');
}
// 島の 根（かべの 中を 太い 根が はう。食べられて ぼろぼろ）
function paintGaiaRoot(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#4a3a2a');
  const r = prand(v * 13 + 9);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a2c20');
  for (let y = 0; y < 16; y++) {
    const x = 5 + Math.round(Math.sin((y + v * 3) * 0.5) * 2);
    p.hline(x, x + 4, y, '#8a6a48'); p.set(x, y, '#a88a60'); p.set(x + 4, y, '#5a4430');
  }
  // かじられた あと
  p.rect(7, 6, 2, 3, '#2a2018'); p.set(6, 7, '#2a2018');
  if (m & 1) p.hline(0, 15, 15, '#2a2018');
}

export const KUMOI_PAINTERS = {
  [T.CLOUD_SEA]: paintCloudSea, [T.CLOUD_RIM]: paintCloudRim,
  [T.SKYWIND_N]: (p, v, f) => paintSkyWind(p, v, f, 'N'), [T.SKYWIND_E]: (p, v, f) => paintSkyWind(p, v, f, 'E'),
  [T.SKYWIND_S]: (p, v, f) => paintSkyWind(p, v, f, 'S'), [T.SKYWIND_W]: (p, v, f) => paintSkyWind(p, v, f, 'W'),
  [T.TILT_TREE]: paintTiltTree, [T.TILT_PILLAR]: paintTiltPillar, [T.RUIN_WALL]: paintRuinWall, [T.RUIN_DOOR]: paintRuinDoor,
  [T.TILT_FLOOR_W]: (p, v) => paintTiltFloor(p, v, false), [T.TILT_FLOOR_E]: (p, v) => paintTiltFloor(p, v, true), [T.BOULDER]: paintBoulder,
  [T.TILT_LEVER]: (p, v) => paintTiltLever(p, v, false), [T.TILT_LEVER_ON]: (p, v) => paintTiltLever(p, v, true),
  [T.SCALE_PAN]: paintPan, [T.SCALE_PAN_ON]: paintPanOn, [T.PAN_ROCK]: paintPanRock, [T.SCALE_DOOR]: paintScaleDoor, [T.SCALE_BEAM]: paintScaleBeam,
  [T.CLOUD_FLOOR]: paintCloudFloor, [T.RUIN_SHAFT]: paintShaft, [T.ROPE_LADDER]: paintRopeLadder, [T.ROPE_COIL]: paintRopeCoil,
  [T.RUIN_MURAL]: paintRuinMural, [T.SHARD_ALTAR]: paintShardAltar, [T.GAIA_ROOT]: paintGaiaRoot,
};
export const KUMOI_FRAMES = {
  [T.CLOUD_SEA]: CLOUD_FRAMES, [T.SKYWIND_N]: SKYWIND_FRAMES, [T.SKYWIND_E]: SKYWIND_FRAMES, [T.SKYWIND_S]: SKYWIND_FRAMES, [T.SKYWIND_W]: SKYWIND_FRAMES,
  [T.CLOUD_FLOOR]: CLOUD_FLOOR_FRAMES,
};
export const KUMOI_SPEED = { [T.CLOUD_SEA]: 900, [T.SKYWIND_N]: 110, [T.SKYWIND_E]: 110, [T.SKYWIND_S]: 110, [T.SKYWIND_W]: 110, [T.CLOUD_FLOOR]: 700 };
// 色を かえない タイル（render/themes.js。神殿の 色で かいてある）
export const KUMOI_TILES = Object.keys(KUMOI_PAINTERS).map(Number);
// まえの かおが ある かべ（render/tiles.js の WALLS）
export const KUMOI_WALLS = [T.RUIN_WALL, T.RUIN_MURAL, T.SCALE_DOOR, T.GAIA_ROOT];

// となりの ようす: かべ画の つづき（左右の となり。render/tiles.js の prepareMap から）。あてはまらない ときは -1
export function kumoiMask(t, at, x, y) {
  if (t === T.RUIN_MURAL) return (at(x + 1, y) === t ? 2 : 0) | (at(x - 1, y) === t ? 8 : 0);
  return -1;
}
// かべ画は 4まいで 1まいの 絵（左から じゅんに 守り星・根・島・ハネビト）
export function kumoiVariant(t, at, x, y, v) {
  if (t !== T.RUIN_MURAL) return v;
  let i = 0;
  while (at(x - i - 1, y) === T.RUIN_MURAL) i++;
  return i % 4;
}

// ───── 2.5D（render/field3d.js）─────
// 雲の 海は 島より ずっと 下（島が うかんで 見える）。4コマで ゆっくり 流れる
export const KUMOI_LIQUIDS = { [T.CLOUD_SEA]: { name: 'cloud_sea', y: -1.15, speed: 900, frames: CLOUD_FRAMES } };
// ゆかの 高さ: 風の道は 島より 少し ひくく、島の ふちは 少し しずみ、たて穴は ふかい
export const KUMOI_FLOOR_H = {
  [T.SKYWIND_N]: -0.14, [T.SKYWIND_E]: -0.14, [T.SKYWIND_S]: -0.14, [T.SKYWIND_W]: -0.14,
  [T.CLOUD_RIM]: -0.06, [T.RUIN_SHAFT]: -1.3, [T.SCALE_PAN_ON]: -0.1, [T.CLOUD_FLOOR]: -0.03, [T.RUIN_DOOR]: -0.04,
};
// 雲の 海の 外がわ（マップの そと。field3d.js の outside 'cloud'）
export const CLOUD_OUTSIDE = { tile: T.CLOUD_SEA, y: KUMOI_LIQUIDS[T.CLOUD_SEA].y - 0.03, light: 0.95 };
// かべに なる タイル（高さと え。field3d.js の blockSpec）
export function kumoiBlockSpec(id, v) {
  switch (id) {
    case T.RUIN_WALL: return { h: 1.6, top: ['t', T.RUIN_WALL, v, 0], side: ['t', T.RUIN_WALL, v, 1], south: ['t', T.RUIN_WALL, v, 1] };
    case T.RUIN_MURAL: case T.SCALE_DOOR:
      return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', id, v, 1] };
    case T.GAIA_ROOT: return { h: 1.6, top: ['x', 'cave_top', v], side: ['t', T.GAIA_ROOT, v, 1], south: ['t', T.GAIA_ROOT, v, 1] };
    default: return null;
  }
}
// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）
export const KUMOI_PROPS = {
  [T.TILT_TREE]: [20, 30, (p) => {
    for (let y = 16; y < 30; y++) { const x = 10 + Math.round((29 - y) * 0.3); p.set(x, y, '#6d4a2b'); p.set(x + 1, y, '#5a3a20'); }
    p.ellipse(15, 11, 6, 6, '#2f8a3a'); p.ellipse(14, 9, 4.5, 4, '#4aad4c'); p.set(18, 14, '#1f6128'); p.set(11, 13, '#1f6128');
  }],
  [T.TILT_PILLAR]: [16, 30, (p) => {
    for (let y = 1; y < 30; y++) { const x = 4 + Math.round((29 - y) * 0.15); p.hline(x, x + 5, y, RS.base); p.set(x, y, RS.light); p.set(x + 5, y, RS.dark); }
    p.hline(6, 13, 0, RS.light); p.set(8, 12, RS.line); p.set(9, 13, RS.line);
  }],
  [T.BOULDER]: [16, 13, (p) => {
    p.ellipse(8, 7, 7.5, 6, '#7a6e5a'); p.ellipse(7, 6, 5.5, 4.5, '#968a72'); p.ellipse(5.5, 4, 2.5, 2, '#b4a88e');
    p.set(11, 10, '#5a5040'); p.set(3, 8, '#5a5040');
  }],
  [T.TILT_LEVER]: [14, 16, (p) => { p.rect(1, 3, 12, 13, '#9a8e72'); p.hline(1, 12, 3, RS.light); p.hline(3, 10, 9, '#5a5040'); p.set(4, 8, '#5a5040'); p.set(4, 10, '#5a5040'); }],
  [T.TILT_LEVER_ON]: [14, 16, (p) => { p.rect(1, 3, 12, 13, '#c8a050'); p.hline(1, 12, 3, GOLD.gl); p.hline(3, 10, 9, '#fff0a0'); p.set(9, 8, '#fff0a0'); p.set(9, 10, '#fff0a0'); }],
  [T.SCALE_BEAM]: [32, 30, (p) => {
    p.rect(14, 6, 4, 24, '#a88a40'); p.vline(14, 6, 29, GOLD.gl);
    p.hline(0, 31, 5, GOLD.g); p.hline(0, 31, 6, GOLD.gd); p.ellipse(16, 5, 2.5, 2.5, GOLD.gl);
    p.vline(1, 7, 14, '#8a8a9a'); p.vline(30, 7, 14, '#8a8a9a');
  }],
  [T.PAN_ROCK]: [16, 14, (p) => {
    p.ellipse(8, 11, 7, 2.5, GOLD.g); p.ellipse(8, 6, 5.5, 5, '#7a6e5a'); p.ellipse(7, 5, 4, 3.5, '#968a72'); p.set(6, 3, '#b4a88e');
  }],
  [T.ROPE_COIL]: [14, 10, (p) => {
    p.ellipse(7, 6, 6.5, 4, WOOD.d); p.ellipse(7, 5.5, 5.5, 3.2, WOOD.w); p.ellipse(7, 5.5, 3, 1.8, WOOD.d); p.set(12, 1, GOLD.g); p.set(13, 0, GOLD.g);
  }],
  [T.SHARD_ALTAR]: [16, 22, (p) => {
    p.rect(2, 10, 12, 12, RS.dark); p.rect(3, 9, 10, 12, RS.light); p.hline(3, 12, 9, '#f0e8d0');
    p.ellipse(8, 4.5, 3, 4, '#f0d890'); p.set(8, 3, '#ffffff'); p.set(7, 4, '#fff8d0'); p.set(4, 2, '#fff0a0'); p.set(12, 1, '#fff0a0');
  }],
};

// ───── 神殿の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const KUMOI_THEMES = {
  // 1〜3階: 白っぽい 砂色の 古い 石・だいだいの たいまつ
  sky_ruin: {
    floor: G([0, '#5a5444'], [0.15, '#8e8670'], [0.3, '#b0a890'], [0.5, '#c8c0a6'], [0.75, '#e0d8c0'], [1, '#fffcf0']),
    wall: G([0, '#2a2620'], [0.15, '#4a443a'], [0.3, '#6e6858'], [0.5, '#948c78'], [1, '#f4ecd8']),
    water: G([0, '#0a1a3a'], [0.35, '#2a6aa8'], [0.7, '#8ac0f0'], [1, '#ffffff']),
    gem: G([0, '#3a2a0a'], [0.5, '#e8c070'], [1, '#fff8e0']),
    flame: null,
  },
  // 4〜5階: すこし くらい 石（雲の あおみ）
  sky_ruin_mid: {
    floor: G([0, '#2e2e36'], [0.15, '#5a5a64'], [0.3, '#80808a'], [0.5, '#a4a4ae'], [0.75, '#c8c8d0'], [1, '#f8f8ff']),
    wall: G([0, '#22222a'], [0.15, '#3c3c46'], [0.3, '#5a5a66'], [0.5, '#7e7e8a'], [1, '#e8e8f4']),
    water: G([0, '#0a1a3a'], [0.35, '#2a5aa8'], [0.7, '#7ab0f0'], [1, '#ffffff']),
    gem: G([0, '#2a2a4a'], [0.5, '#c8d0f0'], [1, '#ffffff']),
    flame: null,
  },
  // 6〜7階: 雲に のまれた あおい 灰色・青白い たいまつ
  sky_ruin_deep: {
    floor: G([0, '#262e3c'], [0.15, '#4a5468'], [0.3, '#6a7690'], [0.5, '#8e9ab4'], [0.75, '#b8c2d8'], [1, '#f4f8ff']),
    wall: G([0, '#1a1e2a'], [0.15, '#2e3446'], [0.3, '#4a5268'], [0.5, '#6a7490'], [1, '#d8e0f4']),
    water: G([0, '#0a1a3a'], [0.35, '#3a5aa8'], [0.7, '#9ab8f0'], [1, '#ffffff']),
    gem: G([0, '#2a2a4a'], [0.5, '#c8d8ff'], [1, '#ffffff']),
    flame: G([0, '#3a4aaa'], [0.5, '#a8c0ff'], [1, '#ffffff']),
  },
};
