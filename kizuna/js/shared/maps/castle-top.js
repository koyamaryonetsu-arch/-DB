// 第5章 Step 9（A9）「影の城の てっぺん ― 星のない広間」の マップ（maps/index.js の attachCastleTop で まぜる）
// ※ ネタバレ注意: 第6幕の さいごの 場所（docs/plan-ch5.md の 17）
// ・castle_top … 影の城 12階（A8 の castle_12f）の 上りかいだんから 来る、空の 下の まるい 広間。空には 星が 1つも ない
//   南: 入口の 小べや（下りかいだん・星の いずみ〈回復と 記録〉）/ まん中: 大広間（柱）/ 北: 星のない 祭だん（ノクトが 待つ）
//   広間の まわりは 思い出の とぎれた ところと おなじ くらい もや（MEM_VOID。2.5D では ずっと 下）
// ・ソリトゥスを たおすと（c5_solitus）、ゆかに 星が もどり（SKY_FLOOR）、祭だんに 光が ともる（SHARD_ALTAR）
// ・12階との つなぎ（A8 と の 約束）: 12階の 上りかいだん → CASTLE_TOP_ARRIVE（この ファイルが export）。
//   てっぺんの 下りかいだん → 12階の「castle_top へ 行く ワープ」の となり（12階の ワープを さがして きめる。名前の 約束が いらない）。
//   12階が まだ ない とき（A9 の 作業中）は クモイ地方の 影の城の 前の 小島へ
// だいほんは data/story-castle-top.js
import { T, parseRows } from '../tiles.js?v=dd582b3d4c53';
import { npc } from './npc.js?v=dd582b3d4c53';
import { FEST_DECO } from './tower.js?v=dd582b3d4c53';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS の c5_seal3 の うしろ。plan-ch5.md の 17 の 名前の 約束）
export const TOP = { top: 'c5_top', nocto2: 'c5_nocto2', solitus: 'c5_solitus', clear: 'c5_clear' };
// 物語の すすみぐあいでは ない フラグ（エンディングの とちゅう。切れた ときに その 場所から 見なおす）
export const END_A = 'c5_end_a'; // エンディング: 影の城の てっぺん → クモイ地方の 空（大地の 守り星が 島々を ささえた）まで 見た
export const END_B = 'c5_end_b'; // エンディング: ハネノの 町（ノクトと ばあちゃん・ピピの 羽）まで 見た
export const FONT_FLAG = 'c5_ct_font'; // てっぺんの 星の いずみを 1回 使った（ことばが かわる だけ）

// ───────────── マップの ID・場所 ─────────────
export const CASTLE_TOP_ID = 'castle_top';
export const CASTLE_TOP_NAME = '影の城　星のない広間';
const W = 25, H = 21;
const CX = 12;
// 広間（だ円）: まん中 (12, 7.2)・よこ 10.6・たて 6.7
const inHall = (x, y) => ((x - CX) / 10.6) ** 2 + ((y - 7.2) / 6.7) ** 2 <= 1;
export const TOP_POS = {
  altar: { x: CX, y: 2 }, // 星のない 祭だん
  nocto: { x: CX, y: 4 }, // ノクト（祭だんの 前。下を 向いている）
  font: { x: 8, y: 16 }, // 入口の 小べやの 星の いずみ
  down: { x: CX, y: 18 }, // 下りかいだん（12階へ）
  pillars: [[6, 4], [18, 4], [3, 8], [21, 8], [7, 11], [17, 11]].map(([x, y]) => ({ x, y })),
  // 大広間に 入る ところ（トリガー。ここを こえると ノクトが 話しかけてくる）
  trigger: { x: 1, y: 9, w: 23, h: 1 },
  // 入口の 小べや（はじめて 来た ときの ことば）
  entry: { x: 7, y: 15, w: 11, h: 3 },
};
// 12階の 上りかいだんから 来て 着く ところ（A8 が 12階の かいだんの ワープの 行き先に 使う）
export const CASTLE_TOP_ARRIVE = { map: CASTLE_TOP_ID, x: CX + 0.5, y: 17.5, dir: 'up' };
// 12階が まだ ない とき の 下りかいだんの 行き先（クモイ地方の「影の城の前の小島」。maps/kumoi.js の k5_shade の 宝箱の そば）
const FALLBACK_DOWN = { map: 'kumoi', x: 44.5, y: 39.5, dir: 'down' };

// ───────────── レイアウト（文字 → タイル）─────────────
// v … くらい もや（歩けない）/ . … 星のない ゆか / O … 柱 / T … 祭だん / # … かべ / > … 下りかいだん / F … 星の いずみ
export const TOP_LEGEND = {
  v: T.MEM_VOID, '.': T.STARLESS_FLOOR, O: T.PILLAR, T: T.STARLESS_ALTAR, '#': T.CAVE_WALL, '>': T.STAIRS_DOWN, F: T.STAR_FONT,
};
function buildRows() {
  const g = Array.from({ length: H }, () => Array(W).fill('v'));
  for (let y = 0; y <= 13; y++) for (let x = 0; x < W; x++) if (inHall(x, y)) g[y][x] = '.';
  for (const p of TOP_POS.pillars) g[p.y][p.x] = 'O';
  g[TOP_POS.altar.y][TOP_POS.altar.x] = 'T';
  // 大広間 → 入口の 小べや（みじかい ろうか）
  for (let x = 6; x <= 18; x++) g[14][x] = x >= 10 && x <= 14 ? '.' : '#';
  for (let y = 15; y <= 17; y++) for (let x = 6; x <= 18; x++) g[y][x] = x === 6 || x === 18 ? '#' : '.';
  for (let x = 6; x <= 18; x++) { g[18][x] = '#'; g[19][x] = '#'; }
  g[TOP_POS.down.y][TOP_POS.down.x] = '>';
  g[TOP_POS.font.y][TOP_POS.font.x] = 'F';
  return g.map((r) => r.join(''));
}
export const TOP_ROWS = buildRows();
// ゆかの マス（ソリトゥスの あと 星が もどる）
const FLOOR_CELLS = [];
TOP_ROWS.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') FLOOR_CELLS.push({ x, y }); }));

// ───────────── 人（NPC）─────────────
// ノクト（本気の 戦いの 前。祭だんの 前に 立っている。たおすと いなくなる）
export const TOP_NPCS = [
  npc('nocto_top', 'ノクト', [TOP_POS.nocto.x, TOP_POS.nocto.y], 'nocto', 'c5_ct_nocto', { dir: 'down', show: { all: [TOP.top], not: [TOP.nocto2] } }),
];

// 12階の「castle_top へ 行く ワープ」の となりの 歩ける マス（なければ null）
function from12(maps) {
  const m = maps.castle_12f;
  if (!m) return null;
  const w = (m.warps || []).find((q) => q?.to?.map === CASTLE_TOP_ID);
  if (!w) return null;
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    const t = m.tiles[y * m.w + x];
    return t === T.VOID || t === T.CAVE_WALL || t === T.MEM_VOID || t === T.STAIRS_UP || t === T.STAIRS_DOWN || t === T.PILLAR;
  };
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
    if (!solid(w.x + dx, w.y + dy)) return { map: m.id, x: w.x + dx + 0.5, y: w.y + dy + 0.5, dir: 'down' };
  }
  return { map: m.id, x: w.x + 0.5, y: w.y + 1.5, dir: 'down' };
}

function castleTopMap(down) {
  const t = parseRows(TOP_ROWS, TOP_LEGEND);
  const P = TOP_POS;
  const m = {
    id: CASTLE_TOP_ID, name: CASTLE_TOP_NAME, kind: 'dungeon', bgm: 'memory', dark: false, theme: 'ctop',
    sky3d: { bg: '#05040a', fog: 0x05040a },
    bg2d: '#05040a',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [...TOP_NPCS], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => CASTLE_TOP_NAME,
    castleTop: true,
    // 魔物は 出ない（さいごの 広間）
    zoneAt: () => 'safe:top',
    spawnCounts: {},
    // ノクトの 思い出の オルゴール（memory）。ソリトゥスの あとは エンディングの 曲
    bgmAt: (x, y, night, has) => (has?.(TOP.solitus) ? 'ending5' : 'memory'),
  };
  // かいだん（12階へ）
  m.warps.push({ x: P.down.x, y: P.down.y, to: down });
  // 星の いずみ（回復と 記録）・祭だん
  m.actions.push({ ...P.font, script: 'c5_ct_font' });
  m.actions.push({ ...P.altar, script: 'c5_ct_altar' });
  // ソリトゥスを たおすと ゆかに 星が もどる・祭だんに 光が ともる
  for (const c of FLOOR_CELLS) m.gates.push({ x: c.x, y: c.y, closed: T.STARLESS_FLOOR, open: T.SKY_FLOOR, flag: TOP.solitus });
  m.gates.push({ x: P.altar.x, y: P.altar.y, closed: T.STARLESS_ALTAR, open: T.SHARD_ALTAR, flag: TOP.solitus });
  // はじめて 来た ときの ことば（c5_top）・大広間に 入ると ノクト
  m.triggers.push({ id: 'c5_ct_arrive', ...P.entry, script: 'c5_ct_arrive', show: { not: [TOP.top] } });
  m.triggers.push({ id: 'c5_ct_nocto', ...P.trigger, script: 'c5_ct_nocto', show: { all: [TOP.top], not: [TOP.nocto2] } });
  return m;
}

// ───────────── ほかの マップに たす もの（第5章クリアの あと）─────────────
// ・ハネノの 広場に 集まった 人たち（maps/earth.js の HANONO_GATHER_NPCS）は クリアの あと それぞれの 国へ 帰る
// ・ピピは 見晴らし台で、羽を 広げて 空を 飛んでいる（pipi_home の かわりに pipi_sky）
// ・ホシフル村の 広場に、3回目の 星祭りの かざり（maps/tower.js の FEST_DECO と おなじ 場所）
const notAfter = (n, f) => { n.show = { ...(n.show || {}), not: [...(n.show?.not || []), f] }; };
function addAfterClear(maps) {
  // ・ソリトゥスを たおすと（c5_solitus）クモイ地方と ハネノの 夕ぐれ（maps/kumoi.js の KUMOI_DUSK）が 晴れ、曲も もとの kumoi に
  for (const id of ['kumoi', 'hanono']) {
    const m = maps[id];
    if (m?.dusk) m.dusk = { ...m.dusk, until: TOP.solitus };
  }
  if (maps.kumoi?.bgmAt) {
    const base = maps.kumoi.bgmAt;
    maps.kumoi.bgmAt = (x, y, night, has) => (has?.(TOP.solitus) ? 'kumoi' : base(x, y, night, has));
  }
  const hn = maps.hanono;
  if (hn) {
    for (const n of hn.npcs) if (/^g_/.test(n.id) || n.id === 'pipi_home') notAfter(n, TOP.clear);
    hn.npcs.push(npc('pipi_sky', 'ピピ', [40, 8], 'pipi_fly', 'c5_pipi', { dir: 'down', show: { all: [TOP.clear] } }));
  }
  const ow = maps.overworld;
  if (ow) for (const [id, sprite, x, y] of FEST_DECO) ow.npcs.push(npc(`${id}_end`, '星祭りのかざり', [x, y], sprite, 'c5_fest_deco', { show: { all: [TOP.clear] } }));
}

// 第5章 Step 9 の マップの ID（セーブに のこるので かえない）
export const CASTLE_TOP_MAPS = [CASTLE_TOP_ID];

// maps/index.js の buildMaps から（A8 の 影の城 castle_1f〜castle_12f の あと・finishMap の 前）
export function attachCastleTop(maps) {
  maps[CASTLE_TOP_ID] = castleTopMap(from12(maps) || FALLBACK_DOWN);
  addAfterClear(maps);
}
