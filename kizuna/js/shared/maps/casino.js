// カジノ（カモメ港）・メダル王の城・小さなメダルの かくし場所
//
// ・カジノ … カモメ港の 小さな たてもの（道具屋の となり）から 入る。中は べつの マップ
// ・メダル王の城 … カモメ港の 東の 海に うかぶ 小さな 島。船で 行ける（第2章）
// ・小さなメダル … 30枚。つぼ・たる・本だな・井戸など（調べる）、光っている 場所、洞窟・塔の 新しい 宝箱
//   ここに ある ものは attachCasino(maps) で 今の マップに たす（ほかの マップの ファイルは かえない）
import { T, parseRows } from '../tiles.js?v=a39a58253380';
import { npc } from './npc.js?v=a39a58253380';
import { PORT } from './sea.js?v=a39a58253380';
import { SEA_PLACES } from './ch2.js?v=a39a58253380';
import { PLACES } from './overworld.js?v=a39a58253380';

// ───────────── カジノの 中 ─────────────
// C=カウンター（コイン・景品・ポーカーの 台）  l=ランプ  *=花  r=じゅうたん  S=たな  o=つぼ  O=たる  D=出口
export const CASINO_ROWS = [
  '############################',
  '#l+++++++++l+rr+l+++++++++l#',
  '#rrrrrrrrrrrrrrrrrrrrrrrrrr#',
  '#+++++++++++*rr*+++++++++++#',
  '#*+++++++++++rr+++++++++++*#',
  '#++++++++++++rr++++++++++++#',
  '#+rrrrrrrr+++rr+++rrrrrrrr+#',
  '#+rrrrrrrr+++rr+++rrrrrrrr+#',
  '#+rrCCCCrr+++rr+++rrCCCCrr+#',
  '#+rrccccrr+++rr+++rrccccrr+#',
  '#S+++++++++++rr+++++++++++S#',
  '#+Crr++++++++rr++++++++rrC+#',
  '#+Crr++++++++rr++++++++rrC+#',
  '#+Crr++++++++rr++++++++rrC+#',
  '#S+++++++++++rr+++++++++++S#',
  '#++++++++++++rr++++++++++++#',
  '#o++++++++++*rr*++++++++++O#',
  '#############DD#############',
];

// ───────────── メダル王の城（王さまの へや）─────────────
export const CASTLE_ROWS = [
  '################',
  '#k+l++rrrr++l+k#',
  '#+++++rrrr+++++#',
  '#+++++rrrr+++++#',
  '#o++++rrrr++++S#',
  '#+++++rrrr+++++#',
  '#*++++rrrr++++*#',
  '#++++++rr++++++#',
  '#######DD#######',
];

// カモメ港の カジノの 入り口（道具屋の となりの 小さな たてもの）
const HUT = { x: PORT.x + 10, y: PORT.y + 5, w: 4, h: 3 };
export const CASINO_DOOR = { x: HUT.x + 2, y: HUT.y + 2 };

// メダル王の 島（カモメ港の 東の 海）。' '=そのまま（深い 海） ~=浅い 海 s=すな .=草 ,=花 #=城の かべ D=とびら :=道
export const MEDAL_ISLE = { x: 48, y: 24, name: 'メダル王の島' };
const ISLE_ROWS = [
  '   ~~~~~~   ',
  ' ~~~sss~~~~ ',
  '~~ss,,,sss~~',
  '~ss.#####.s~',
  '~s,.#####,s~',
  '~s,.##D##.s~',
  '~ss..,:,..s~',
  '~~ss.,:,.ss~',
  ' ~~sss:sss~~',
  '  ~~~sss~~~ ',
  '    ~~~~~   ',
];
const ISLE_LEGEND = { '~': T.WATER, s: T.SAND, '.': T.GRASS, ',': T.FLOWERS, '#': T.WALL_STONE, D: T.DOOR, ':': T.STONE_PATH };
const ISLE_W = ISLE_ROWS[0].length, ISLE_H = ISLE_ROWS.length;
export const CASTLE_DOOR = { x: MEDAL_ISLE.x + 6, y: MEDAL_ISLE.y + 5 };
const ISLE_RECT = [MEDAL_ISLE.x, MEDAL_ISLE.y, ISLE_W, ISLE_H];
const inIsle = (x, y) => x >= ISLE_RECT[0] && y >= ISLE_RECT[1] && x < ISLE_RECT[0] + ISLE_RECT[2] && y < ISLE_RECT[1] + ISLE_RECT[3];

// ───────────── 小さなメダルの かくし場所（30枚）─────────────
// how: search … その マスを 調べる（つぼ・たる・たな・本だな・箱・井戸・ふんすい・ベッド など）
//      shine … 地面が 光っている（しらべると 拾える）
//      chest … 新しい 宝箱（今までの 宝箱の 中身は かえない）。洞窟・塔の 中だけ
//              （フィールド＝ミドリナ地方・風の海 の 宝箱は、出たり 消えたり する ように なるので つかわない）
// show: 世界の フラグ（手伝っている ときは リーダーの 世界）。そろうまで 取れない
// id は ずっと かえない（セーブの c.medalSpots に のこる）
export const MEDAL_CHEST_MAPS = ['cave_b1', 'cave_b2', 'sea_cave', 'tower_1f', 'tower_2f', 'tower_3f', 'casino', 'medal_castle'];
const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];
const P = (x, y) => [PORT.x + x, PORT.y + y];
const spot = (id, map, [x, y], how, show = null) => ({ id, map, x, y, how, show });
const CH2 = { all: ['c2_ship'] };
export const MEDAL_SPOTS = [
  // ── ホシフル村（3）
  spot('v_home_pot', 'overworld', [20, 95], 'search'),
  spot('v_shop_shelf', 'overworld', [36, 93], 'search'),
  spot('v_well', 'overworld', [26, 106], 'search'),
  // ── ルミナの町（8）
  spot('t_mayor_books', 'overworld', TW(5, 3), 'search'),
  spot('t_bar_barrel', 'overworld', TW(36, 3), 'search'),
  spot('t_item_shelf', 'overworld', TW(38, 13), 'search'),
  spot('t_fountain', 'overworld', TW(24, 17), 'search'),
  spot('t_armor_barrel', 'overworld', TW(9, 25), 'search'),
  spot('t_well', 'overworld', TW(28, 30), 'search'),
  spot('t_carpenter_box', 'overworld', TW(39, 30), 'search'),
  spot('t_granny_pot', 'overworld', TW(19, 32), 'search'),
  // ── ミドリナ地方の 野原（2）
  spot('f_hill_shine', 'overworld', [52, 84], 'shine'),
  spot('f_east_shine', 'overworld', [156, 60], 'shine'),
  // ── なげきの洞窟（2）
  spot('cave1_corner', 'cave_b1', [3, 21], 'chest'),
  spot('cave2_corner', 'cave_b2', [36, 12], 'chest'),
  // ── カモメ港（6）
  spot('p_item_shelf', 'sea', P(5, 3), 'search', CH2),
  spot('p_inn_barrel', 'sea', P(28, 5), 'search', CH2),
  spot('p_arms_shelf', 'sea', P(7, 13), 'search', CH2),
  spot('p_harbor_books', 'sea', P(13, 13), 'search', CH2),
  spot('p_well', 'sea', P(12, 10), 'search', CH2),
  spot('p_dock_box', 'sea', P(10, 19), 'search', CH2),
  // ── カジノ・メダル王の城（3）
  spot('c_pot', 'casino', [1, 16], 'search', CH2),
  spot('c_barrel', 'casino', [26, 16], 'search', CH2),
  spot('k_pot', 'medal_castle', [1, 4], 'search', CH2),
  // ── 風の海の 島（3）
  spot('s_cave_isle', 'sea', [20, 64], 'shine', CH2),
  spot('s_light_isle', 'sea', [61, 13], 'shine', CH2),
  spot('s_storm_isle', 'sea', [80, 55], 'shine', { all: ['c2_light'] }),
  // ── 海鳴りの洞窟・嵐の塔（2）
  spot('sc_corner', 'sea_cave', [4, 17], 'chest', { all: ['c2_port'] }),
  spot('tw2_corner', 'tower_2f', [20, 1], 'chest', { all: ['c2_light'] }),
  // ── メダル王の 島（ためしに 調べてみる 人への ごほうび）
  spot('k_isle_flowers', 'sea', [MEDAL_ISLE.x + 2, MEDAL_ISLE.y + 4], 'shine', CH2),
];
export const MEDAL_SPOT_BY_ID = Object.fromEntries(MEDAL_SPOTS.map((s) => [s.id, s]));
// 光る 場所・宝箱の id（マップの sparkles / chests に 入れる id）
export const medalChestId = (id) => `md_${id}`;
export const medalSparkleId = (id) => `md_${id}`;

// ───────────── マップを つくる ─────────────
export function buildCasinoMaps() {
  const maps = {};
  const c = parseRows(CASINO_ROWS);
  const slot = (id, x, script) => npc(id, 'スロットマシン', [x, 1], 'slot', script);
  maps.casino = {
    id: 'casino', name: 'カモメ港のカジノ', kind: 'dungeon', bgm: 'casino', dark: false, indoor: true,
    w: c.w, h: c.h, tiles: c.tiles, gates: [],
    npcs: [
      // スロット（左は 1枚から、右は 10枚から）
      ...[2, 4, 6, 8, 10].map((x, i) => slot(`slot_a${i}`, x, 'casino_slot1')),
      ...[17, 19, 21, 23, 25].map((x, i) => slot(`slot_b${i}`, x, 'casino_slot10')),
      npc('c_dealer_a', 'ポーカーのディーラー', [5, 7], 'dealer', 'casino_poker'),
      npc('c_dealer_b', 'ポーカーのディーラー', [22, 7], 'dealer', 'casino_poker'),
      npc('c_coin_clerk', 'コイン係', [1, 12], 'casino_clerk', 'casino_coins', { dir: 'right' }),
      npc('c_prize_clerk', '景品係', [26, 12], 'casino_clerk', 'casino_prizes', { dir: 'left' }),
      npc('c_guide', 'カジノの案内係', [15, 15], 'dealer', 'casino_guide'),
      npc('c_gent', 'スロット好きのおじさん', [9, 3], 'merchant', 'casino_gent', { wander: 1 }),
      npc('c_lady', 'ポーカー通のおばあさん', [20, 10], 'elder', 'casino_lady', { wander: 1 }),
      npc('c_kid', 'カジノに来た男の子', [16, 5], 'boy', 'casino_kid', { wander: 2 }),
    ],
    chests: [], signs: [],
    warps: [
      { x: 13, y: 17, to: { map: 'sea', x: CASINO_DOOR.x + 0.5, y: CASINO_DOOR.y + 1.6, dir: 'down' } },
      { x: 14, y: 17, to: { map: 'sea', x: CASINO_DOOR.x + 0.5, y: CASINO_DOOR.y + 1.6, dir: 'down' } },
    ],
    triggers: [], sparkles: [],
    // 中に いる あいだ かべを ひくく（2.5D で 見やすく）
    roofs: [{ x: 0, y: 0, w: c.w, h: c.h, color: 'purple' }],
    zoneAt: () => 'safe:casino',
    areaName: () => 'カモメ港のカジノ',
    bgmAt: () => 'casino',
    spawnCounts: {},
  };
  const k = parseRows(CASTLE_ROWS);
  maps.medal_castle = {
    id: 'medal_castle', name: 'メダル王の城', kind: 'dungeon', bgm: 'town', dark: false, indoor: true,
    w: k.w, h: k.h, tiles: k.tiles, gates: [],
    npcs: [
      npc('medal_king', 'メダル王', [7.5, 2], 'medal_king', 'medal_king'),
      npc('medal_minister', 'メダル王の大臣', [4, 3], 'minister', 'medal_minister'),
      npc('medal_guard_a', '城の兵士', [5, 7], 'guard', 'medal_guard'),
      npc('medal_guard_b', '城の兵士', [10, 7], 'guard', 'medal_guard'),
    ],
    chests: [], signs: [],
    warps: [
      { x: 7, y: 8, to: { map: 'sea', x: CASTLE_DOOR.x + 0.5, y: CASTLE_DOOR.y + 1.6, dir: 'down' } },
      { x: 8, y: 8, to: { map: 'sea', x: CASTLE_DOOR.x + 0.5, y: CASTLE_DOOR.y + 1.6, dir: 'down' } },
    ],
    triggers: [], sparkles: [],
    roofs: [{ x: 0, y: 0, w: k.w, h: k.h, color: 'red' }],
    zoneAt: () => 'safe:castle',
    areaName: () => 'メダル王の城',
    bgmAt: () => 'town',
    spawnCounts: {},
  };
  return maps;
}

// 今の マップに たす（maps/index.js の buildMaps から よぶ。npcById などを つくる まえ）
export function attachCasino(maps) {
  Object.assign(maps, buildCasinoMaps());
  const sea = maps.sea;
  const setSea = (x, y, v) => { if (x >= 0 && y >= 0 && x < sea.w && y < sea.h) sea.tiles[y * sea.w + x] = v; };

  // カモメ港: カジノの 入り口（石の 小さな たてもの・むらさきの やね）
  for (let y = HUT.y; y < HUT.y + HUT.h; y++) for (let x = HUT.x; x < HUT.x + HUT.w; x++) setSea(x, y, T.WALL_STONE);
  setSea(CASINO_DOOR.x, CASINO_DOOR.y, T.DOOR);
  sea.roofs.push({ x: HUT.x, y: HUT.y, w: HUT.w, h: HUT.h, color: 'purple' });
  sea.boards.push({ x: CASINO_DOOR.x - 1, y: CASINO_DOOR.y, kind: 'casino', name: 'カジノ' });
  sea.warps.push({ x: CASINO_DOOR.x, y: CASINO_DOOR.y, to: { map: 'casino', x: 14, y: 16.2, dir: 'up' } });

  // メダル王の 島
  ISLE_ROWS.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const v = ISLE_LEGEND[row[i]];
      if (v !== undefined) setSea(MEDAL_ISLE.x + i, MEDAL_ISLE.y + j, v);
    }
  });
  sea.roofs.push({ x: MEDAL_ISLE.x + 4, y: MEDAL_ISLE.y + 3, w: 5, h: 3, color: 'red' });
  sea.boards.push({ x: CASTLE_DOOR.x + 1, y: CASTLE_DOOR.y, kind: 'medal', name: 'メダル王の城' });
  sea.warps.push({ x: CASTLE_DOOR.x, y: CASTLE_DOOR.y, to: { map: 'medal_castle', x: 8, y: 7.2, dir: 'up' } });
  sea.labels = [...(sea.labels || []), { name: MEDAL_ISLE.name, x: MEDAL_ISLE.x + 1, y: MEDAL_ISLE.y + 1, w: ISLE_W - 2, h: ISLE_H - 2 }];
  // 島の まわりは 魔物が 出ない
  const zone = sea.zoneAt;
  sea.zoneAt = (x, y) => (inIsle(x, y) ? 'safe:medal' : zone(x, y));
  const area = sea.areaName;
  sea.areaName = (x, y) => (inIsle(x, y) && sea.tiles[y * sea.w + x] !== T.WATER && sea.tiles[y * sea.w + x] !== T.DEEP ? MEDAL_ISLE.name : area(x, y));
  // 帰り道の羽で 行ける 場所（一度 行くと）
  SEA_PLACES.medal = { name: MEDAL_ISLE.name, map: 'sea', x: CASTLE_DOOR.x, y: CASTLE_DOOR.y + 2, rect: ISLE_RECT };

  // 小さなメダル: 光る 場所と 新しい 宝箱（宝箱は 洞窟・塔・たてものの 中だけ）
  for (const s of MEDAL_SPOTS) {
    const m = maps[s.map];
    if (!m) continue;
    if (s.how === 'shine') {
      m.sparkles = m.sparkles || [];
      m.sparkles.push({ id: medalSparkleId(s.id), x: s.x, y: s.y, zone: 'medal', medal: s.id });
    } else if (s.how === 'chest' && MEDAL_CHEST_MAPS.includes(s.map)) {
      m.chests.push({ id: medalChestId(s.id), x: s.x, y: s.y, item: 'small_medal', medal: s.id, ...(s.show ? { show: s.show } : {}) });
    }
  }

  // ルミナの町: 小さなメダルの ことを 教えてくれる 人
  maps.overworld.npcs.push(npc('medal_fan', 'メダル集めの少年', TW(15, 20), 'boy', 'medal_fan', { wander: 1 }));
  return maps;
}
