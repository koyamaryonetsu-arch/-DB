// 第2章の マップ（風の海・海鳴りの洞窟・嵐の塔）
import { T, parseRows } from '../tiles.js';
import { npc } from './npc.js';
import { buildSea, makeSeaZone, seaAreaName, seaSparkles, SEA_POS, PORT, ISLES, ISLETS } from './sea.js';
import { SEA_CAVE_ROWS, TOWER_1F_ROWS, TOWER_2F_ROWS, TOWER_3F_ROWS } from './ch2-rows.js';

const P = (x, y) => [PORT.x + x, PORT.y + y];

// 帰り道の羽で 行ける 海の ばしょ（overworld の PLACES と おなじ あつかい）
export const SEA_PLACES = {
  port: { name: PORT.name, map: 'sea', x: PORT.x + 16, y: PORT.y + 11, rect: [PORT.x, PORT.y, PORT.w, PORT.h] },
};

// カモメ港の 人
const PORT_NPCS = [
  npc('harbor_master', '港長ガモン', P(16, 14), 'harbor_master', 'harbor_master'),
  npc('port_captain', '船長マリナ', P(12, 19), 'captain', 'captain_port', { show: { all: ['c2_ship'] } }),
  npc('port_inn', '宿屋のおかみ', P(24, 4), 'woman', 'port_inn'),
  npc('port_arms', '武器と防具の店', P(4, 13), 'merchant', 'port_arms'),
  npc('port_items', '道具屋', P(4, 3), 'girl', 'port_items'),
  npc('port_priest', '神父さま', P(24, 14), 'priest', 'port_church'),
  npc('old_sailor', '年よりの船乗り', P(22, 10), 'old_sailor', 'old_sailor', { wander: 1 }),
  npc('fisher', '漁師', P(4, 19), 'fisher', 'fisher'),
  npc('sailor', '船乗り', P(27, 18), 'sailor', 'sailor', { wander: 1 }),
  npc('port_kid', '港の子ども', P(9, 10), 'boy', 'port_kid', { wander: 2 }),
  npc('mina', 'ミナ', P(18, 7), 'mina', 'mina', { wander: 1 }),
  // 風の祭壇に もどった 守り星
  npc('wind_star', '風の守り星', [PORT.x + 15.5, PORT.y + 2], 'windstone', 'wind_altar', { solid: false, show: { all: ['c2_clear'] } }),
];

const L = SEA_POS.lighthouse, D = SEA_POS.towerDoor, C = SEA_POS.caveDoor;

const SEA_NPCS = [
  ...PORT_NPCS,
  npc('lighthouse_off', '灯台', [L.x, L.y], 'lighthouse_dark', 'lighthouse', { big: true, show: { not: ['c2_light'] } }),
  npc('lighthouse_on', '灯台', [L.x, L.y], 'lighthouse_lit', 'lighthouse', { big: true, show: { all: ['c2_light'] } }),
  npc('lh_keeper', '灯台守のじいさん', [SEA_POS.keeper.x, SEA_POS.keeper.y], 'lh_keeper', 'lighthouse_keeper'),
  npc('storm_tower', '嵐の塔', [D.x, D.y - 1], 'storm_tower', 'storm_tower', { big: true, solid: false }),
];

const SEA_CHESTS = [
  { id: 'sea_islet1', x: ISLETS[0][0], y: ISLETS[0][1], item: 'bottle_letter' },
  { id: 'sea_islet2', x: ISLETS[1][0], y: ISLETS[1][1], item: 'seed_agi' },
  { id: 'sea_islet3', x: ISLETS[2][0], y: ISLETS[2][1], item: 'seed_mag' },
  { id: 'sea_islet4', x: ISLETS[3][0], y: ISLETS[3][1], item: 'seed_hp' },
  { id: 'sea_light', x: 69, y: 11, item: 'magic_water' },
  { id: 'sea_caveisle', x: 13, y: 64, gold: 300 },
  { id: 'sea_storm', x: 70, y: 56, item: 'seed_str' },
];

const SEA_SIGNS = [
  { x: 13, y: 3, text: '↑ ホシフル村のさんばし\n（ミドリナ地方へ帰る）' },
  { x: C.x + 2, y: C.y + 1, text: '海鳴りの洞窟\n（ザザーンと、波の音がひびく）' },
  { x: D.x + 2, y: D.y + 1, text: '嵐の塔' },
];

export function buildCh2Maps() {
  const maps = {};

  // ───────────── 風の海 ─────────────
  const sea = buildSea();
  for (const s of SEA_SIGNS) sea.tiles[s.y * sea.w + s.x] = T.SIGN;
  const inPort = (x, y) => x >= PORT.x && y >= PORT.y && x < PORT.x + PORT.w && y < PORT.y + PORT.h;
  maps.sea = {
    id: 'sea', name: '風の海', kind: 'field', bgm: 'sea', dark: false,
    sailable: true, // 水の 上を 船で すすめる
    altarScript: 'wind_altar',
    w: sea.w, h: sea.h, tiles: sea.tiles, gates: sea.gates,
    npcs: SEA_NPCS, chests: SEA_CHESTS, signs: SEA_SIGNS,
    warps: [
      { x: C.x, y: C.y, to: { map: 'sea_cave', x: 20.5, y: 27.5, dir: 'up' } },
      { x: D.x, y: D.y, to: { map: 'tower_1f', x: 11, y: 19.6, dir: 'up' } },
    ],
    triggers: [
      { id: 'sea_home', x: SEA_POS.homePier.x, y: 2, w: 2, h: 1, script: 'sea_go_home' },
      { id: 'port_arrive', x: PORT.x, y: PORT.y, w: PORT.w, h: PORT.h, script: 'port_arrive', show: { not: ['c2_port_seen'] } },
    ],
    sparkles: seaSparkles(sea.tiles),
    roofs: [[2, 2, 8, 6, 'teal'], [22, 2, 8, 6, 'orange'], [2, 12, 9, 6, 'red'], [12, 12, 8, 5, 'blue'], [21, 12, 9, 6, 'white']]
      .map(([x, y, w, h, color]) => ({ x: PORT.x + x, y: PORT.y + y, w, h, color })),
    zoneAt: makeSeaZone(sea.tiles),
    areaName: seaAreaName,
    bgmAt: (x, y) => (inPort(x, y) ? 'town' : 'sea'),
    // 地図に 出す なまえ
    labels: [
      { name: PORT.name, x: PORT.x, y: PORT.y, w: PORT.w, h: PORT.h },
      ...Object.values(ISLES).filter((i) => i.name !== '風の島').map((i) => ({ name: i.name, x: i.x - i.rx, y: i.y - i.ry, w: i.rx * 2, h: i.ry * 2 })),
    ],
    spawnCounts: { sea: 14, isle: 8, storm: 7 },
  };

  // ───────────── 海鳴りの洞窟 ─────────────
  const sc = parseRows(SEA_CAVE_ROWS);
  maps.sea_cave = {
    id: 'sea_cave', name: '海鳴りの洞窟', kind: 'dungeon', bgm: 'cave', dark: true,
    w: sc.w, h: sc.h, tiles: sc.tiles, gates: [],
    npcs: [
      npc('squid_boss', '大王イカ', [19.5, 2], 'squid_boss', 'squid_event', { big: true, show: { not: ['c2_kraken'] } }),
      npc('sc_spring', 'いやしの泉', [29, 7], 'spring', 'spring', { solid: true }),
    ],
    chests: [
      { id: 'sc_a', x: 5, y: 9, item: 'magic_water' },
      { id: 'sc_b', x: 35, y: 17, item: 'shell_shield' },
      { id: 'sc_c', x: 18, y: 11, item: 'seed_def' },
      { id: 'sc_boss', x: 24, y: 4, item: 'seed_str', show: { all: ['c2_kraken'] } },
    ],
    signs: [],
    warps: [
      { x: 20, y: 29, to: { map: 'sea', x: C.x + 0.5, y: C.y + 1.6, dir: 'down' } },
    ],
    triggers: [
      { id: 'seacave_enter', x: 18, y: 23, w: 5, h: 6, script: 'seacave_enter', show: { not: ['c2_cave_seen'] } },
      { id: 'squid_room', x: 14, y: 3, w: 12, h: 4, script: 'squid_event', show: { not: ['c2_kraken'] } },
    ],
    sparkles: [],
    roofs: [],
    zoneAt: (x, y) => (y <= 7 && x >= 13 && x <= 26 ? 'safe:boss' : 'seacave'),
    areaName: () => '海鳴りの洞窟',
    spawnCounts: { seacave: 9 },
  };

  // ───────────── 嵐の塔 ─────────────
  const tower = (id, name, rows, extra) => {
    const t = parseRows(rows);
    maps[id] = {
      id, name, kind: 'dungeon', bgm: 'tower', dark: false,
      w: t.w, h: t.h, tiles: t.tiles, gates: [],
      npcs: [], chests: [], signs: [], warps: [], triggers: [], sparkles: [], roofs: [],
      zoneAt: () => 'tower',
      areaName: () => name,
      spawnCounts: { tower: 7 },
      ...extra,
    };
  };
  tower('tower_1f', '嵐の塔　1階', TOWER_1F_ROWS, {
    chests: [
      { id: 'tw1_a', x: 3, y: 3, item: 'revive_flower' },
      { id: 'tw1_b', x: 17, y: 15, item: 'magic_water' },
    ],
    warps: [
      { x: 10, y: 21, to: { map: 'sea', x: D.x + 0.5, y: D.y + 1.6, dir: 'down' } },
      { x: 11, y: 21, to: { map: 'sea', x: D.x + 0.5, y: D.y + 1.6, dir: 'down' } },
      { x: 19, y: 2, to: { map: 'tower_2f', x: 19.5, y: 3.6, dir: 'down' } },
    ],
    triggers: [
      { id: 'tower_enter', x: 9, y: 17, w: 4, h: 4, script: 'tower_enter', show: { not: ['c2_tower'] } },
    ],
  });
  tower('tower_2f', '嵐の塔　2階', TOWER_2F_ROWS, {
    chests: [
      { id: 'tw2_a', x: 3, y: 18, item: 'thunder_sword' },
      { id: 'tw2_b', x: 18, y: 18, item: 'moonherb', n: 2 },
      { id: 'tw2_c', x: 7, y: 3, item: 'seed_mag' },
    ],
    warps: [
      { x: 19, y: 2, to: { map: 'tower_1f', x: 19.5, y: 3.6, dir: 'down' } },
      { x: 2, y: 2, to: { map: 'tower_3f', x: 19.5, y: 14.5, dir: 'up' } },
    ],
  });
  tower('tower_3f', '嵐の塔　屋上', TOWER_3F_ROWS, {
    npcs: [
      npc('storm_general_npc', '嵐の将軍ストルム', [10.5, 5], 'storm_general', 'storm_event', { big: true, show: { not: ['c2_boss'] } }),
    ],
    chests: [
      { id: 'tw3_a', x: 2, y: 15, item: 'storm_whip' },
      { id: 'tw3_b', x: 20, y: 3, item: 'wind_ring' },
    ],
    warps: [
      { x: 19, y: 15, to: { map: 'tower_2f', x: 2.5, y: 3.6, dir: 'down' } },
    ],
    triggers: [
      { id: 'storm_top', x: 1, y: 9, w: 20, h: 2, script: 'storm_event', show: { not: ['c2_boss'] } },
    ],
    zoneAt: () => 'safe:top',
    spawnCounts: {},
  });
  return maps;
}
