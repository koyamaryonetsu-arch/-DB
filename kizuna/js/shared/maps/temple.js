// 第4章 Step 7「砂の底の神殿」の マップ（maps/ch4.js の buildCh4Maps で まぜる）
// ・temple_dome … 入口の「空気のドーム」。砂の 下の 大きな あわの 中。砂の海賊の 一族の ほこら（回復と 記録が 何度でも）・かべ画・
//   すなかぜ号（砂クジラが 船ごと 運んで くる。話しかけると 地上へ もどる）。北の 神殿の 入口の かいだんから 地下1階へ
// ・temple_b1 … 地下1階「水のかいろう」。赤・青・黄の 3つの レバー（上・中・下の 水門）で 水の 高さ（上・中・下）が かわる
// ・temple_b2 … 地下2階「鏡の間」。鏡の騎士（番人）・鏡の ゆか（月の鏡で 本物の 道だけ 光る）・大きな 鏡（鏡の うつし身）・いやしの泉
// ・temple_b3 … 地下3階「水のろう」。水の 柱に とじこめられた 水のみこミラ・ろうの 番人
// ・temple_hall … 最深部「水鏡の広間」。大きな 水鏡（遠い 空に うかぶ 島が うつる）と 水鏡の魔人モルガナ。魔物は 出ない
// どの 階も みちびきの糸・帰り道の羽が 使えない（noEscape。ピラミッドと おなじ。ルーラは 洞窟と おなじく 天井に ぶつかる）
import { T, parseRows } from '../tiles.js?v=a94c44ae0637';
import { npc } from './npc.js?v=a94c44ae0637';
import { DOME_ROWS, B1_ROWS, B2_ROWS, B3_ROWS, HALL_ROWS } from './temple-rows.js?v=a94c44ae0637';

// ───────────── フラグ ─────────────
// 物語の すすみぐあい（story-ch4-temple.js の TEMPLE_STEPS）: c4_temple（神殿に 入った）・c4_morgana・c4_star・c4_clear
export const TEMPLE_FLAG = 'c4_temple';
export const MORGANA_FLAG = 'c4_morgana';
export const STAR_FLAG = 'c4_star';
export const CLEAR4_FLAG = 'c4_clear';
// しかけの フラグ（物語の すすみぐあいでは ない）
// レバー（赤 = 上の 水門・青 = 中の 水門・黄 = 下の 水門）
export const TEMPLE_LEVERS = { red: 'c4_tl_red', blue: 'c4_tl_blue', yellow: 'c4_tl_yellow' };
// 水の 高さ（レバーから きまる。story-ch4-temple.js の waterLever が たてる）:
//   dn … 水が「中」か「下」（上の 水門が 開いている） / mid … 「中」 / lo … 「下」 / drain … 「下」で 下の 水門も 開いた（かいだんの たまりが ひく）
export const WATER_FLAGS = { dn: 'c4_tw_dn', mid: 'c4_tw_mid', lo: 'c4_tw_lo', drain: 'c4_tw_drain' };
// 鏡の間: 月の鏡で 本物の 道が 光った・鏡の騎士・鏡の うつし身・いやしの泉（入るたびに 1回）
export const MIRROR_FLAG = 'c4_t_mirror';
export const KNIGHTS_FLAG = 'c4_t_knights';
export const UTSUSHIMI_FLAG = 'c4_t_utsushimi';
export const SPRING_FLAG = 'c4_t_spring';
// 水のろう: ろうの 番人を たおした（ろうの 水が 下がり、ミラが 目を あける。下への 水の まくが 消える）
export const GUARDS_FLAG = 'c4_t_guards';

// 水の 高さ（'hi' 上・'mid' 中・'lo' 下）: 水は、上から下へ（赤が しまっていると、水は 下へ 流れない）
export function waterLevel(has) {
  if (!has(TEMPLE_LEVERS.red)) return 'hi';
  return has(TEMPLE_LEVERS.blue) ? 'lo' : 'mid';
}
// レバーの フラグから 水の フラグ（{ フラグ: true/false }）
export function waterFlagsFor(has) {
  const lv = waterLevel(has);
  return {
    [WATER_FLAGS.dn]: lv !== 'hi',
    [WATER_FLAGS.mid]: lv === 'mid',
    [WATER_FLAGS.lo]: lv === 'lo',
    [WATER_FLAGS.drain]: lv === 'lo' && has(TEMPLE_LEVERS.yellow),
  };
}

// ───────────── マップの ID（セーブに のこるので かえない）─────────────
export const TEMPLE_MAPS = ['temple_dome', 'temple_b1', 'temple_b2', 'temple_b3', 'temple_hall'];
export const NO_ESCAPE_HINT = '砂の底の神殿の中では、来た道を歩いて、空気のドームまでもどろう';

// ───────────── 場所 ─────────────
export const DOME_POS = { ship: { x: 13, y: 17 }, arrive: { x: 13.5, y: 15.5 }, shrine: { x: 4, y: 12 }, murals: [[8, 8], [9, 8], [18, 8], [19, 8]], down: { x: 13, y: 2 } };
export const B1_POS = {
  up: { x: 4, y: 1 }, down: { x: 16, y: 23 }, sign: { x: 3, y: 2 },
  levers: { red: { x: 2, y: 3 }, blue: { x: 6, y: 15 }, yellow: { x: 24, y: 20 } },
  // 宝箱: 水が「上」で とどく（うく 石の 板の 先）・「中」で とどく（とび石の 先の 水の羽衣）・「中」より 下（中の 底の わき）・「下」（ふかい 底の わき）
  raftChest: { x: 28, y: 8 }, robeChest: { x: 30, y: 14 }, midChest: { x: 5, y: 9 }, lowChest: { x: 8, y: 21 },
};
export const B2_POS = {
  up: { x: 14, y: 26 }, down: { x: 18, y: 1 }, sign: { x: 15, y: 22 },
  knights: [[14, 20], [15, 20]], start: { x: 5, y: 18 }, mirror: { x: 14, y: 5 }, spring: { x: 11, y: 3 },
};
export const B3_POS = { up: { x: 13, y: 1 }, down: { x: 13, y: 19 }, mira: { x: 13, y: 12 }, guards: [[11, 15], [15, 15]] };
export const HALL_POS = { up: { x: 13, y: 18 }, morgana: { x: 13, y: 9 }, star: { x: 13, y: 8 }, mirror: { x: 7, y: 3, w: 12, h: 5 } };

// ───────────── タイルの 文字 ─────────────
export const TEMPLE_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, p: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, o: T.POT, Y: T.STATUE, '!': T.SIGN,
  A: T.AIR_WALL, '0': T.DESERT, H: T.CLAN_SHRINE, G: T.MURAL,
  M: T.TW_HI, L: T.TW_HI, R: T.TW_RAFT, S: T.TW_HI, D: T.TW_HI, 1: T.LEVER_R, 2: T.LEVER_B, 3: T.LEVER_Y,
  f: T.MIRROR_FLOOR, m: T.MIRROR_FLOOR, B: T.BIG_MIRROR, W: T.WATER_PRISON, X: T.WATER_PRISON, V: T.WATER_MIRROR,
};

// 地下1階の 水の 高さで かわる マス（文字 → levels。上から 見て さいしょに たっている フラグの タイル。どれも なければ closed）
const W = WATER_FLAGS;
export const WATER_CELLS = {
  M: { closed: T.TW_HI, levels: [[W.dn, T.TW_BED]] }, // 中の 底: 上 → 水 / 中・下 → 歩ける
  L: { closed: T.TW_HI, levels: [[W.lo, T.TW_BED_LO], [W.mid, T.TW_MID]] }, // ふかい 底: 上・中 → 水 / 下 → 歩ける
  R: { closed: T.TW_RAFT, levels: [[W.lo, T.TW_SHAFT], [W.mid, T.TW_MID]] }, // うく 石の 板: 上 → わたれる / 中 → 水 / 下 → たて穴
  S: { closed: T.TW_HI, levels: [[W.lo, T.TW_COLUMN], [W.mid, T.TW_STEP]] }, // とび石: 中 → わたれる / 上 → 水の 下 / 下 → 高い 柱
  D: { closed: T.TW_HI, levels: [[W.drain, T.TW_BED_LO], [W.lo, T.TW_LO], [W.mid, T.TW_MID]] }, // 下の 水門の 前の たまり
};
// 文字 → その マスの すがた（水の 高さごと。テストと 地図の しるしで 使う）
export function cellAt(rows, x, y) {
  return rows[y]?.[x] ?? '#';
}

const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};
const toward = (p, map, dy, dir = 'down') => ({ map, x: p.x + 0.5, y: p.y + 0.5 + dy, dir });

function templeMap(id, name, rows, opts) {
  const t = parseRows(rows, TEMPLE_LEGEND);
  return {
    id, name, kind: 'dungeon', bgm: 'sand_temple', dark: true, theme: 'temple', noEscape: true, noEscapeHint: NO_ESCAPE_HINT,
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
}

// 文字の マスを ぜんぶ さがす
function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push([x, y, ch]); }));
  return out;
}
// よこに ならんだ マスを まとめる（トリガーの 数を へらす）
function runsOf(cells) {
  const rows = new Map();
  for (const [x, y] of cells) {
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(x);
  }
  const out = [];
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b);
    let s = xs[0], prev = xs[0];
    for (const x of xs.slice(1).concat([Infinity])) {
      if (x === prev + 1) { prev = x; continue; }
      out.push({ x: s, y, w: prev - s + 1, h: 1 });
      s = x; prev = x;
    }
  }
  return out;
}

// ───────────── 空気の ドーム ─────────────
function dome() {
  const P = DOME_POS;
  return templeMap('temple_dome', '空気のドーム', DOME_ROWS, {
    dark: false, // あわの 向こうの 砂ごしに、ぼんやり 明るい
    noEscapeHint: 'すなかぜ号に話しかければ、砂クジラが地上へ運んでくれるよ',
    npcs: [
      // 砂クジラが 運んで きた すなかぜ号（話しかけると 地上へ もどる）
      npc('temple_ship', 'すなかぜ号', [P.ship.x, P.ship.y], 'sand_ship', 'c4_temple_ship', { dir: 'down', solid: false }),
    ],
    chests: [{ id: 'td_pot', x: 22, y: 12, item: 'magic_water', n: 2 }],
    warps: [{ x: P.down.x, y: P.down.y, to: toward(B1_POS.up, 'temple_b1', 1) }],
    triggers: [{ id: 'c4_dome_enter', x: 8, y: 12, w: 12, h: 5, script: 'c4_dome_enter', show: { not: ['c4_dome_seen'] } }],
    actions: [
      { x: P.shrine.x, y: P.shrine.y, script: 'c4_dome_shrine' },
      ...P.murals.map(([x, y]) => ({ x, y, script: 'c4_dome_mural' })),
    ],
    // 地上へ（地図の しるしの 道しるべ。quest-targets.js の mapLinks）
    links: [{ x: P.ship.x, y: P.ship.y, to: 'sand_sea' }],
    zoneAt: () => 'safe:dome',
    bgmAt: (x, y) => (y <= 8 ? 'sand_temple' : 'sand_sea'),
  });
}

// ───────────── 地下1階「水のかいろう」─────────────
function b1() {
  const P = B1_POS;
  const m = templeMap('temple_b1', '砂の底の神殿　地下1階', B1_ROWS, {
    dark: false, // 国じゅうから 集められた 水が、青く 光っている
    chests: [
      { id: 'tb1_raft', x: P.raftChest.x, y: P.raftChest.y, item: 'seed_mag' },
      // ランク7の よろい「水の羽衣」（とび石の 先。水が「中」の ときだけ とどく）
      { id: 'tb1_robe', x: P.robeChest.x, y: P.robeChest.y, item: 'water_hagoromo' },
      { id: 'tb1_mid', x: P.midChest.x, y: P.midChest.y, item: 'magic_water', n: 2 },
      { id: 'tb1_low', x: P.lowChest.x, y: P.lowChest.y, gold: 4200 },
    ],
    signs: [{ ...P.sign, text: '石の文字ばんに、こう書いてある。\n「赤は上の水門、青は中の水門、黄は下の水門。\n水の高さで、道はかわる」' }],
    warps: [
      { x: P.up.x, y: P.up.y, to: toward(DOME_POS.down, 'temple_dome', 1) },
      { x: P.down.x, y: P.down.y, to: toward(B2_POS.up, 'temple_b2', -1, 'up') },
    ],
    triggers: [
      { id: 'c4_tb1_enter', x: 2, y: 2, w: 6, h: 2, script: 'c4_tb1_enter', show: { not: ['c4_tb1_seen'] } },
      // 神殿に 入りなおした（ドームから 下りてきた）: いやしの泉が また 使える
      { id: 'c4_tb1_spring', x: P.up.x, y: P.up.y + 1, w: 1, h: 1, script: 'c4_spring_reset', show: { all: [SPRING_FLAG] } },
    ],
    actions: [
      { ...P.levers.red, script: 'c4_tl_red' },
      { ...P.levers.blue, script: 'c4_tl_blue' },
      { ...P.levers.yellow, script: 'c4_tl_yellow' },
    ],
    // 入口・宝の 小島・とび石・かいだんの まわりは 魔物が 出ない。うろうろする 魔物は 水に ぬれない 通路に 出る
    zoneAt: zoneRect([[2, 1, 8, 3, 'safe:entry'], [26, 4, 29, 9, 'safe:raft'], [31, 4, 31, 12, 'safe:steps'], [28, 13, 31, 15, 'safe:isle'],
      [5, 9, 5, 9, 'safe:nook'], [8, 21, 9, 21, 'safe:nook'], [14, 21, 18, 23, 'safe:stairs']], 't_b1_wet'),
    spawnCounts: { t_b1_wet: 5 },
    // 水が「下」の 世界では 砂の 魔物（t_b1_dry）、それ いがいは 水の 魔物（t_b1_wet）。world/monsters.js
    tableFor: (zone, players, world) => {
      if (zone !== 't_b1_wet') return null;
      return players.some((p) => world.hasFlagFn(p)(WATER_FLAGS.lo)) ? 't_b1_dry' : null;
    },
  });
  // 水の 高さで かわる マス
  for (const [x, y, ch] of cellsOf(B1_ROWS, Object.keys(WATER_CELLS))) {
    const c = WATER_CELLS[ch];
    m.tiles[y * m.w + x] = c.closed;
    m.gates.push({ x, y, closed: c.closed, open: c.levels[0][1], flag: c.levels[0][0], levels: c.levels, water: ch });
  }
  // レバー（ひくと 光る）
  m.gates.push({ ...P.levers.red, closed: T.LEVER_R, open: T.LEVER_R_ON, flag: TEMPLE_LEVERS.red });
  m.gates.push({ ...P.levers.blue, closed: T.LEVER_B, open: T.LEVER_B_ON, flag: TEMPLE_LEVERS.blue });
  m.gates.push({ ...P.levers.yellow, closed: T.LEVER_Y, open: T.LEVER_Y_ON, flag: TEMPLE_LEVERS.yellow });
  m.tiles[P.sign.y * m.w + P.sign.x] = T.SIGN;
  return m;
}

// ───────────── 地下2階「鏡の間」─────────────
export const MIRROR_PATH = cellsOf(B2_ROWS, ['m']).map(([x, y]) => [x, y]);
export const MIRROR_FAKE = cellsOf(B2_ROWS, ['f']).map(([x, y]) => [x, y]);
function b2() {
  const P = B2_POS;
  const m = templeMap('temple_b2', '砂の底の神殿　地下2階', B2_ROWS, {
    dark: false, // かべも ゆかも 鏡の ように 光っている
    npcs: [
      // 鏡の間の 番人（鏡の騎士 2体。たおすと いなくなる）
      ...P.knights.map(([x, y], i) => npc(`mirror_guard${i}`, '鏡の騎士', [x, y], 'mirror_guard', 'c4_knights_event', { dir: 'down', show: { not: [KNIGHTS_FLAG] } })),
      // いやしの泉（入るたびに 1回）
      npc('temple_spring', 'いやしの泉', [P.spring.x, P.spring.y], 'spring', 'c4_t_spring', { solid: true }),
    ],
    chests: [
      { id: 'tb2_w', x: 3, y: 18, item: 'seed_def' },
      { id: 'tb2_e', x: 25, y: 7, item: 'revive_flower' },
      { id: 'tb2_spring', x: 20, y: 3, gold: 3600 },
    ],
    signs: [{ ...P.sign, text: '石の文字ばんに、こう書いてある。\n「鏡のゆかは、まことの道と、まやかしの道。\n月の光のみが、まことを照らす」' }],
    warps: [
      { x: P.up.x, y: P.up.y, to: toward(B1_POS.down, 'temple_b1', -1, 'up') },
      { x: P.down.x, y: P.down.y, to: toward(B3_POS.up, 'temple_b3', 1) },
    ],
    triggers: [
      { id: 'c4_tb2_enter', x: 11, y: 24, w: 8, h: 2, script: 'c4_tb2_enter', show: { not: ['c4_tb2_seen'] } },
      { id: 'c4_knights', x: 13, y: 21, w: 4, h: 1, script: 'c4_knights_event', show: { not: [KNIGHTS_FLAG] } },
      // にせの 鏡の ゆか（ふむと 鏡の 中へ すいこまれ、鏡の ゆかの 手前へ もどされる）
      ...runsOf(MIRROR_FAKE).map((r, i) => ({ id: `c4_mirror_trap${i}`, ...r, script: 'c4_mirror_trap' })),
    ],
    actions: [
      // 鏡の ゆかを 調べる（月の鏡が あれば 本物の 道が 光る）
      ...[...MIRROR_PATH, ...MIRROR_FAKE].map(([x, y]) => ({ x, y, script: 'c4_mirror_floor', show: { not: [MIRROR_FLAG] } })),
      // 大きな 鏡（鏡の うつし身）
      ...[13, 14, 15].map((x) => ({ x, y: P.mirror.y, script: 'c4_big_mirror' })),
    ],
    zoneAt: zoneRect([[11, 20, 18, 26, 'safe:entry'], [2, 8, 26, 17, 'safe:mirror'], [9, 1, 20, 5, 'safe:spring']], 't_b2'),
    spawnCounts: { t_b2: 5 },
  });
  for (const [x, y] of MIRROR_PATH) m.gates.push({ x, y, closed: T.MIRROR_FLOOR, open: T.MIRROR_LIT, flag: MIRROR_FLAG });
  for (const x of [13, 14, 15]) m.gates.push({ x, y: P.mirror.y, closed: T.BIG_MIRROR, open: T.MIRROR_BROKEN, flag: UTSUSHIMI_FLAG });
  m.tiles[P.sign.y * m.w + P.sign.x] = T.SIGN;
  return m;
}

// ───────────── 地下3階「水のろう」─────────────
function b3() {
  const P = B3_POS;
  const m = templeMap('temple_b3', '砂の底の神殿　地下3階', B3_ROWS, {
    npcs: [
      // 水の 柱に とじこめられた 水のみこミラ（番人を たおすと 水が 下がって 目を あける。モルガナを たおすと ろうから 出る）
      npc('mira_prison', '水のみこミラ', [P.mira.x, P.mira.y], 'mira_prison', 'c4_mira_prison', { dir: 'down', show: { not: [GUARDS_FLAG] } }),
      npc('mira_prison2', '水のみこミラ', [P.mira.x, P.mira.y], 'mira_prison_low', 'c4_mira_prison', { dir: 'down', show: { all: [GUARDS_FLAG], not: [MORGANA_FLAG] } }),
      // 水のろうの 番人（2体。たおすと いなくなる）
      ...P.guards.map(([x, y], i) => npc(`prison_guard${i}`, 'ろうの番人', [x, y], 'prison_guard', 'c4_prison_event', { dir: 'up', show: { not: [GUARDS_FLAG] } })),
    ],
    chests: [
      { id: 'tb3_w', x: 4, y: 6, item: 'seed_hp' },
      { id: 'tb3_e', x: 22, y: 6, item: 'magic_water', n: 2 },
    ],
    warps: [
      { x: P.up.x, y: P.up.y, to: toward(B2_POS.down, 'temple_b2', 1) },
      { x: P.down.x, y: P.down.y, to: toward(HALL_POS.up, 'temple_hall', -1, 'up') },
    ],
    triggers: [
      { id: 'c4_tb3_enter', x: 12, y: 2, w: 3, h: 2, script: 'c4_tb3_enter', show: { not: ['c4_tb3_seen'] } },
      // ろうの へやに 入ると サラ「母さん！」→ モルガナの 声 → ろうの 番人
      { id: 'c4_prison', x: 6, y: 8, w: 15, h: 2, script: 'c4_prison_event', show: { not: [GUARDS_FLAG] } },
    ],
    actions: [
      ...[12, 13, 14].map((x) => ({ x, y: 17, script: 'c4_prison_curtain', show: { not: [GUARDS_FLAG] } })),
      ...cellsOf(B3_ROWS, ['W']).map(([x, y]) => ({ x, y, script: 'c4_prison_empty' })),
    ],
    zoneAt: zoneRect([[12, 1, 14, 3, 'safe:entry'], [9, 9, 17, 19, 'safe:prison']], 't_b3'),
    spawnCounts: { t_b3: 5 },
  });
  for (const x of [12, 13, 14]) m.gates.push({ x, y: 17, closed: T.WATER_PRISON, open: T.CAVE_FLOOR, flag: GUARDS_FLAG });
  return m;
}

// ───────────── 最深部「水鏡の広間」─────────────
function hall() {
  const P = HALL_POS;
  return templeMap('temple_hall', '水鏡の広間', HALL_ROWS, {
    dark: false, // 大きな 水鏡が 青く 光っている
    // 水鏡の 絵（render/tiles-temple.js。広間 ぜんたいで 1まいの え）
    waterMirror: P.mirror,
    npcs: [
      // 水鏡の魔人モルガナ（水鏡の 前。近づくと ボス戦）
      npc('morgana_npc', '水鏡の魔人モルガナ', [P.morgana.x, P.morgana.y], 'morgana', 'c4_morgana_event', { dir: 'down', show: { not: [MORGANA_FLAG] } }),
      // 水の守り星（モルガナを たおすと 水鏡の 上に うかぶ。とちゅうで 終わった ときも ここから）
      npc('water_star_npc', '水の守り星', [P.star.x, P.star.y], 'water_star', 'c4_water_star', { dir: 'down', solid: false, show: { all: [MORGANA_FLAG], not: [STAR_FLAG] } }),
    ],
    warps: [{ x: P.up.x, y: P.up.y, to: toward(B3_POS.down, 'temple_b3', -1, 'up') }],
    triggers: [
      { id: 'c4_hall_enter', x: 2, y: 15, w: 22, h: 3, script: 'c4_hall_enter', show: { not: ['c4_hall_seen'] } },
      { id: 'c4_morgana', x: 2, y: 11, w: 22, h: 2, script: 'c4_morgana_event', show: { not: [MORGANA_FLAG] } },
    ],
    // 水鏡の ふち（ゆかの となり）を しらべる
    actions: cellsOf(HALL_ROWS, ['V']).filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => HALL_ROWS[y + dy]?.[x + dx] === '.'))
      .map(([x, y]) => ({ x, y, script: 'c4_water_mirror' })),
    zoneAt: () => 'safe:hall',
    bgmAt: () => 'sand_temple',
  });
}

export function buildTempleMaps() {
  return { temple_dome: dome(), temple_b1: b1(), temple_b2: b2(), temple_b3: b3(), temple_hall: hall() };
}
