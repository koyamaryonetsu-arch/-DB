// お仕事いらい板の たのまれごと（第39回 C。docs/plan-side.md の 2）の 人・しらべる 所・小さな へや
// 第41回で ふえた 6つは maps/work-quests.js（attachFamilyQuests の さいごに attachWorkQuests を よぶ）
//
// ・第1部クリア（c5_clear）の あと、それぞれの 町に たのみたい 人が 立つ
// ・ここで 今の 町の マップに たてもの・人・小さな へやを 足す（attachFamilyQuests。maps/index.js から よぶ）
// ・だいほんは data/sidequests-family.js、人と 物の 絵は client/render/family-art.js
//
//  1. 劇場の空調をなおせ（王都サファラの 南西に 劇場。ロビー・客席・機械室・屋上は べつの 小さな マップ）
//  2. さびれたおみやげ屋の立て直し（温泉の里ユノハの 南に おみやげ屋。中は べつの マップ）
//  3. カナトコの料理大会（鉱山の町カナトコの 広場・町の 北の 雪原の きのこ・南の 道の モグラ）
//  4. ルミナの町の、消えた教会のかね（ルミナの町の 教会の まわり・北西の すみの 大きな 木）
//  5. 鉱山トロッコの線路（鉱山の町カナトコの 北の 古い 鉱山 → だれも 知らない 小べや）
import { T, TILE_INFO } from '../tiles.js?v=e71638c3a938';
import { npc } from './npc.js?v=e71638c3a938';
import { grid, room, stamp } from './fq-kit.js?v=e71638c3a938';
// 第41回: ふえた 6つの たのまれごとの 人と へや（maps/work-quests.js）
import { attachWorkQuests } from './work-quests.js?v=e71638c3a938';
import { PLACES } from './overworld.js?v=e71638c3a938';
import { NORTH_PLACES } from './north.js?v=e71638c3a938';
import { SOUTH_PLACES } from './south.js?v=e71638c3a938';
import { openSpot } from './labyrinth.js?v=e71638c3a938';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const FQ_OPEN = 'c5_clear'; // 第1部クリアで たのみたい 人が 立つ
export const FQ = {
  // 1. 劇場の空調
  acStart: 'fq_ac_start', // 支配人の たのみを 受けた
  acVent: 'fq_ac_vent', // 客席の ふき出し口を 調べた（風が 弱い）
  acFilter: 'fq_ac_filter', // 機械室の 空調機の フィルターを そうじした
  acDust: 'fq_ac_dust', // 屋上の 室外機の すなぼこりの 魔物を たおした
  acUnit: 'fq_ac_unit', // 室外機の ファンを 直した
  acShow: 'fq_ac_show', // ためしの 上演（満席）
  acAir: 'fq_ac_air', // かん気（ダンパーを 正しく 開けた）
  acTemp: 'fq_ac_temp', // 省エネの 温度に した
  acDone: 'fq_ac_done', // 支配人に 報告した（ごほうび）
  // 2. おみやげ屋
  shopStart: 'fq_shop_start', shopPlan: 'fq_shop_plan', shopDone: 'fq_shop_done',
  // 3. 料理大会
  cookStart: 'fq_cook_start', cookMole: 'fq_cook_mole', cookDone: 'fq_cook_done',
  // 4. 消えた教会のかね
  bellStart: 'fq_bell_start', bellSolved: 'fq_bell_solved', bellGot: 'fq_bell_got', bellDone: 'fq_bell_done',
  // 5. 鉱山トロッコの線路
  railStart: 'fq_rail_start', railRide: 'fq_rail_ride', railDone: 'fq_rail_done',
};
// かん気の ダンパー（4つ。開けると フラグ）と 客席の ゾーン（空気の よごれ）
export const DAMPERS = [
  { n: 1, flag: 'fq_dmp1', zone: '前の席' },
  { n: 2, flag: 'fq_dmp2', zone: 'まん中の席' },
  { n: 3, flag: 'fq_dmp3', zone: 'うしろの席' },
  { n: 4, flag: 'fq_dmp4', zone: 'ぶたい' },
];
// 満席の 時に 空気が よごれる ゾーン（正かいの ダンパー）
export const DIRTY_ZONES = [2, 3];
// おみやげ屋の 声（町の 人に 聞いた）
export const SHOP_VOICES = ['fq_shop_h1', 'fq_shop_h2', 'fq_shop_h3', 'fq_shop_h4'];
// 料理大会の うわさ（町の 人に 聞いた）
export const COOK_RUMORS = ['fq_cook_r1', 'fq_cook_r2', 'fq_cook_r3'];
// 消えた教会のかねの 手がかり（足あと・羽・どろ）と 話（4人）
export const BELL_CLUES = ['fq_bell_c1', 'fq_bell_c2', 'fq_bell_c3'];
export const BELL_TALKS = ['fq_bell_t1', 'fq_bell_t2', 'fq_bell_t3', 'fq_bell_t4'];
// 線路の こわれた 所（3か所）
export const RAIL_FIX = ['fq_rail_fix1', 'fq_rail_fix2', 'fq_rail_fix3'];

// ───────────── 1. 劇場（王都サファラの 南西の すみ）─────────────
const SAF = SOUTH_PLACES.safara;
// 劇場の たてもの（外がわ。日干しれんがの かべ・赤い やね）。入り口は 下の まん中
export const THEATER = { x: SAF.x + 1, y: SAF.y + 34, w: 10, h: 4 };
export const THEATER_DOOR = [{ x: THEATER.x + 4, y: THEATER.y + 3 }, { x: THEATER.x + 5, y: THEATER.y + 3 }];

// ロビー（入り口・客席への とびら・機械室への 下り階だん・屋上への 上り階だん・切ぷの カウンター・ポスター）
export const LOBBY_ROWS = [
  '##################',
  '#l++++##DD##++++l#',
  '#++++++rrrr++++++#',
  '#<+++++rrrr+++++>#',
  '#++++++rrrr++++++#',
  '#CCC+++rrrr++!+++#',
  '#++++++rrrr++++++#',
  '#o+++++rrrr+++++O#',
  '#*+++++rrrr+++++*#',
  '########DD########',
];
// 客席（上が ぶたい。前・まん中・うしろの 席。左右の かべに ふき出し口・右の かべに 空気の よごれメーター）
export const HALL_ROWS = [
  '####################',
  '#l+rrrrrrrrrrrrrr+l#',
  '#++rrrrrrrrrrrrrr++#',
  '#++rrrrrrrrrrrrrr++#',
  '#++++++++++++++++++#',
  '#+cccccc++++cccccc+#',
  '#+cccccc++++cccccc+#',
  '#++++++++++++++++++#',
  '#+cccccc++++cccccc+#',
  '#+cccccc++++cccccc+#',
  '#++++++++++++++++++#',
  '#+cccccc++++cccccc+#',
  '#+cccccc++++cccccc+#',
  '#++++++++++++++++++#',
  '#########DD#########',
];
// 機械室（空調機・4つの ダンパー・中央かんしばん）
export const MACHINE_ROWS = [
  '################',
  '#x+++++++++++++#',
  '#++++++++++++++#',
  '#++++++++++++++#',
  '#++++++++++++++#',
  '#++++++++++++++#',
  '#x+++++++++++++#',
  '#<+++++++++++xO#',
  '################',
];
// 屋上（室外機・すなの 山・まわりは てすり）
export const ROOF_ROWS = [
  'FFFFFFFFFFFFFFFF',
  'F++++++++++++++F',
  'F++++++++++++++F',
  'F++++++++++++++F',
  'F++++++++++++++F',
  'F+ss++++++++ss+F',
  'F+s++++++++++s+F',
  'F>+++++++++++++F',
  'FFFFFFFFFFFFFFFF',
];
export const TH_POS = {
  lobbyIn: { x: 9, y: 8.2 }, // 外から 入った 所
  lobbyHall: { x: 9, y: 2.6 }, // 客席から もどった 所
  lobbyDown: { x: 15.5, y: 3.5 }, // 機械室から 上がった 所
  lobbyUp: { x: 2.5, y: 3.5 }, // 屋上から おりた 所
  hallIn: { x: 10, y: 13.2 },
  machineIn: { x: 2.5, y: 7.5 },
  roofIn: { x: 2.5, y: 7.5 },
  manager: [5, 4], clerk: [2, 4], poster: [13, 5],
  ventA: [0, 6], ventB: [19, 9], meter: [19, 12],
  ahu: [5, 3], panel: [11, 7], dampers: [[8, 1], [10, 1], [12, 1], [14, 1]],
  unit: [8, 3],
};

// ───────────── 2. おみやげ屋（温泉の里ユノハの 南）─────────────
const YUN = NORTH_PLACES.yunoha;
export const SOUVENIR = { x: YUN.x + 15, y: YUN.y + 15, w: 6, h: 4 };
export const SOUVENIR_DOOR = { x: SOUVENIR.x + 2, y: SOUVENIR.y + 3 };
export const SHOP_ROWS = [
  '############',
  '#SSoSS+SSoS#',
  '#++++++++++#',
  '#+CCC++++x+#',
  '#++++++++++#',
  '#O++++++++O#',
  '#####DD#####',
];

// ───────────── 5. 古い 鉱山（鉱山の町カナトコの 北の かべ）─────────────
const KAN = NORTH_PLACES.kanatoko;
export const OLD_MINE_DOOR = { x: KAN.x + 12, y: KAN.y };
// 線路: 西の トロッコ（3,11）→ 東へ → x=20 で 北へ → 東の はしの 止め（24,4）。こわれた 所は 3か所
export const RAIL_SPOTS = [{ x: 9, y: 11 }, { x: 15, y: 11 }, { x: 20, y: 7 }];
export const RAIL_PATH = [[3.5, 11.5], [20.5, 11.5], [20.5, 4.5], [23.5, 4.5]];
export const MINE_ROOM_ARRIVE = { x: 3.5, y: 4.5 };
export const MINE_ROOM_CART = [2, 4];

function oldMineRows() {
  const s = grid(26, 14, 'G');
  s.rect(1, 10, 21, 3, 'g'); // 東西の 通路（線路の 両がわを 歩ける）
  s.rect(19, 3, 3, 8, 'g'); // 北への 通路
  s.rect(19, 2, 6, 4, 'g'); // 東の はし
  s.rect(3, 11, 18, 1, '1'); // 線路（東へ）
  s.rect(20, 4, 1, 8, '1'); // 線路（北へ）
  s.rect(20, 4, 4, 1, '1'); // 線路（東の はしへ）
  s.put(24, 4, '3'); // 線路の 止め（その 先は かべ… だれも 知らない 小べや）
  s.put(4, 13, '<'); // 町へ もどる
  s.rect(4, 12, 1, 1, 'g');
  for (const x of [2, 7, 12, 17]) s.put(x, 9, 'i');
  for (const [x, y] of [[1, 12], [13, 12], [22, 3]]) s.put(x, y, 'x');
  s.put(6, 9, '[').put(14, 9, '[').put(18, 5, '[');
  return s.rows();
}
function mineRoomRows() {
  const s = grid(12, 9, 'G');
  s.rect(1, 1, 10, 7, 'g');
  s.rect(1, 4, 4, 1, '1').put(1, 4, '3');
  for (const [x, y] of [[9, 1], [10, 2], [1, 7], [10, 7]]) s.put(x, y, 'y');
  s.put(5, 1, 'i').put(8, 7, 'O');
  return s.rows();
}

const SHOWN = { all: [FQ_OPEN] };
const opened = (...more) => ({ all: [FQ_OPEN, ...more] });

function theaterMaps() {
  const out = {};
  const exitTo = { map: 'south', x: THEATER_DOOR[0].x + 1, y: THEATER_DOOR[0].y + 1.6, dir: 'down' };
  const P = TH_POS;
  // お客さん（ためしの 上演から ずっと 満席）
  const seats = [];
  const seatSpots = [[2, 5], [4, 5], [6, 6], [13, 5], [15, 6], [17, 5], [3, 8], [5, 9], [12, 8], [14, 9], [16, 8], [2, 11], [6, 12], [13, 12], [17, 11], [4, 12]];
  const looks = ['woman', 'boy', 'oldman', 'girl', 'merchant', 'farmer'];
  seatSpots.forEach(([x, y], i) => seats.push(npc(`fq_th_guest${i + 1}`, 'お客さん', [x, y], looks[i % looks.length], 'fq_th_guest', { dir: 'up', show: opened(FQ.acShow) })));
  out.fq_th_lobby = room('fq_th_lobby', 'サファラ劇場　ロビー', LOBBY_ROWS, {
    bgm: 'safara', roof: 'red',
    npcs: [
      npc('fq_th_manager', '劇場の支配人', P.manager, 'fq_manager', 'fq_th_manager', { dir: 'down' }),
      npc('fq_th_clerk', '切ぷ売りのお姉さん', P.clerk, 'woman', 'fq_th_clerk', { dir: 'down' }),
      npc('fq_th_lobbyguest', '帰りかけのお客さん', [14, 7], 'oldman', 'fq_th_lobbyguest', { show: { not: [FQ.acShow] }, wander: 1 }),
      npc('fq_th_fan', '劇場が大すきな女の子', [3, 7], 'girl', 'fq_th_fan', { wander: 1 }),
    ],
    signs: [{ x: P.poster[0], y: P.poster[1], text: '〜 省エネのポスター 〜\n冷ぼうは、ひやしすぎないで26度くらいに。\n設定を1度上げるだけで、電気を1わりくらいへらせます。\n（サファラ劇場）' }],
    warps: [
      { x: 8, y: 9, to: exitTo }, { x: 9, y: 9, to: exitTo },
      { x: 8, y: 1, to: { map: 'fq_th_hall', x: P.hallIn.x, y: P.hallIn.y, dir: 'up' } },
      { x: 9, y: 1, to: { map: 'fq_th_hall', x: P.hallIn.x, y: P.hallIn.y, dir: 'up' } },
      { x: 16, y: 3, to: { map: 'fq_th_machine', x: P.machineIn.x, y: P.machineIn.y, dir: 'right' } },
      { x: 1, y: 3, to: { map: 'fq_th_roof', x: P.roofIn.x, y: P.roofIn.y, dir: 'right' } },
    ],
  });
  out.fq_th_hall = room('fq_th_hall', 'サファラ劇場　客席', HALL_ROWS, {
    bgm: 'safara', roof: 'red',
    npcs: [
      npc('fq_th_vent_a', 'ふき出し口', P.ventA, 'mon:fq_vent', 'fq_th_vent', { dir: 'right' }),
      npc('fq_th_vent_b', 'ふき出し口', P.ventB, 'mon:fq_vent', 'fq_th_vent', { dir: 'left' }),
      npc('fq_th_meter', '空気のよごれメーター', P.meter, 'mon:fq_meter', 'fq_th_meter', { dir: 'left' }),
      npc('fq_th_hot1', '暑そうなお客さん', [4, 6], 'merchant', 'fq_th_hot', { show: { not: [FQ.acShow] }, dir: 'up' }),
      npc('fq_th_hot2', '暑そうなお客さん', [15, 9], 'woman', 'fq_th_hot', { show: { not: [FQ.acShow] }, dir: 'up' }),
      // ぶたいの 役者（上演の 時）
      npc('fq_th_actor1', '役者さん', [8, 2], 'fq_actor', 'fq_th_actor', { show: opened(FQ.acShow) }),
      npc('fq_th_actor2', '役者さん', [11, 2], 'fq_actress', 'fq_th_actor', { show: opened(FQ.acShow) }),
      ...seats,
    ],
    warps: [9, 10].map((x) => ({ x, y: 14, to: { map: 'fq_th_lobby', x: P.lobbyHall.x, y: P.lobbyHall.y, dir: 'down' } })),
  });
  const dampers = [];
  DAMPERS.forEach((d, i) => {
    const [x, y] = P.dampers[i];
    const name = `ダンパー${d.n}（${d.zone}）`;
    dampers.push(npc(`fq_th_dmp${d.n}`, name, [x, y], 'mon:fq_damper', `fq_th_damper${d.n}`, { dir: 'down', show: { not: [d.flag] } }));
    dampers.push(npc(`fq_th_dmp${d.n}o`, name, [x, y], 'mon:fq_damper_open', `fq_th_damper${d.n}`, { dir: 'down', show: { all: [d.flag] } }));
  });
  out.fq_th_machine = room('fq_th_machine', 'サファラ劇場　機械室', MACHINE_ROWS, {
    bgm: 'mine', roof: 'slate',
    npcs: [
      npc('fq_th_ahu', '空調機', P.ahu, 'mon:fq_ahu', 'fq_th_ahu', { big: true }),
      npc('fq_th_panel', '中央かんしばん', P.panel, 'mon:fq_panel', 'fq_th_panel'),
      ...dampers,
    ],
    signs: [],
    warps: [{ x: 1, y: 7, to: { map: 'fq_th_lobby', x: P.lobbyDown.x, y: P.lobbyDown.y, dir: 'left' } }],
  });
  out.fq_th_roof = room('fq_th_roof', 'サファラ劇場　屋上', ROOF_ROWS, {
    bgm: 'safara', indoor: false,
    npcs: [
      npc('fq_th_unit', '室外機', P.unit, 'mon:fq_unit', 'fq_th_unit', { big: true, show: { not: [FQ.acUnit] } }),
      npc('fq_th_unit_on', '室外機', P.unit, 'mon:fq_unit_on', 'fq_th_unit', { big: true, show: { all: [FQ.acUnit] } }),
    ],
    warps: [{ x: 1, y: 7, to: { map: 'fq_th_lobby', x: P.lobbyUp.x, y: P.lobbyUp.y, dir: 'right' } }],
  });
  return out;
}

function shopMap() {
  const exitTo = { map: 'north', x: SOUVENIR_DOOR.x + 0.5, y: SOUVENIR_DOOR.y + 1.6, dir: 'down' };
  const guests = [[3, 4], [7, 2], [9, 4], [5, 5], [8, 5]].map(([x, y], i) => npc(`fq_shop_guest${i + 1}`, 'お客さん', [x, y], ['woman', 'boy', 'oldman', 'girl', 'merchant'][i], 'fq_shop_guest', { show: { all: [FQ.shopDone] }, wander: 1 }));
  return {
    fq_shop: room('fq_shop', 'ユノハのおみやげ屋', SHOP_ROWS, {
      bgm: 'snowtown', roof: 'snowred',
      npcs: [npc('fq_shop_owner', 'おみやげ屋のユキエ', [2, 2], 'fq_shopkeeper', 'fq_shop_owner', { dir: 'down' }), ...guests],
      warps: [5, 6].map((x) => ({ x, y: 6, to: exitTo })),
    }),
  };
}

function mineMaps() {
  const exitTo = { map: 'north', x: OLD_MINE_DOOR.x + 0.5, y: OLD_MINE_DOOR.y + 1.6, dir: 'down' };
  const broken = RAIL_SPOTS.map((p, i) => npc(`fq_rail_broken${i + 1}`, 'こわれた線路', [p.x, p.y], 'mon:fq_rail_broken', `fq_rail_broken${i + 1}`, { show: { not: [RAIL_FIX[i]] }, solid: false }));
  return {
    fq_old_mine: room('fq_old_mine', 'カナトコの古い鉱山', oldMineRows(), {
      bgm: 'mine', dark: true, indoor: false,
      npcs: [npc('fq_rail_cart', 'トロッコ', [3, 11], 'minecart', 'fq_rail_cart'), ...broken],
      warps: [{ x: 4, y: 13, to: exitTo }],
    }),
    fq_mine_room: room('fq_mine_room', 'だれも知らない小べや', mineRoomRows(), {
      bgm: 'mine', dark: true, indoor: false,
      npcs: [
        npc('fq_rail_cart_back', 'トロッコ', MINE_ROOM_CART, 'minecart', 'fq_rail_cart_back'),
        npc('fq_rail_note', '古い手紙', [8, 3], 'mon:fq_note', 'fq_rail_note', { solid: false }),
      ],
      chests: [
        { id: 'fq_mr_a', x: 9, y: 5, item: 'seed_str', n: 2 },
        { id: 'fq_mr_b', x: 6, y: 6, item: 'seed_agi', n: 2 },
        { id: 'fq_mr_c', x: 10, y: 4, gold: 3000 },
      ],
    }),
  };
}

// ───────────── 今の 町に たす 人（town … どの 町の 中の いちか）─────────────
const TW = PLACES.town;
// [id, 名前, 絵, だいほん, マップ, 町の 中の x, y, opts]
const TOWN_NPCS = [
  // 1. サファラ: 劇場の 前の よびこみ・ならんでいる お客さん（直した あと）
  ['fq_th_crier', '劇場のよびこみ', 'merchant', 'fq_th_crier', 'south', SAF, 9, 38, { show: SHOWN, fixed: true }],
  ['fq_th_line1', '劇場にならぶ人', 'woman', 'fq_th_line', 'south', SAF, 1, 38, { show: opened(FQ.acDone), fixed: true }],
  ['fq_th_line2', '劇場にならぶ人', 'boy', 'fq_th_line', 'south', SAF, 2, 38, { show: opened(FQ.acDone), fixed: true }],
  // 2. ユノハ: 町の 人の 声（4人）
  ['fq_shop_v1', '旅人のケン', 'merchant', 'fq_shop_voice1', 'north', YUN, 13, 19, { show: SHOWN, wander: 1 }],
  ['fq_shop_v2', '湯あがりのおばさん', 'woman', 'fq_shop_voice2', 'north', YUN, 10, 11, { show: SHOWN }],
  ['fq_shop_v3', 'ユノハの男の子', 'boy', 'fq_shop_voice3', 'north', YUN, 18, 9, { show: SHOWN, wander: 1 }],
  ['fq_shop_v4', '行商のおじさん', 'oldman', 'fq_shop_voice4', 'north', YUN, 21, 19, { show: SHOWN }],
  // 3. カナトコ: 大会の 係・しんさいん・ミルク売り・うわさの 町の 人・雪の 下の きのこ・岩しおを かかえた モグラ
  ['fq_cook_host', '料理大会の係', 'fq_cook_host', 'fq_cook_host', 'north', KAN, 17, 14, { show: SHOWN }],
  ['fq_cook_judge', 'しんさいんのガンテおばば', 'fq_judge', 'fq_cook_judge', 'north', KAN, 21, 14, { show: SHOWN }],
  ['fq_cook_milk', '牧場のおばさん', 'woman', 'fq_cook_milk', 'north', KAN, 12, 17, { show: SHOWN }],
  ['fq_cook_rumor1', '鉱山の見習い', 'boy', 'fq_cook_rumor1', 'north', KAN, 9, 11, { show: SHOWN, wander: 1 }],
  ['fq_cook_rumor2', '宿屋のおかみ', 'woman', 'fq_cook_rumor2', 'north', KAN, 5, 23, { show: SHOWN }],
  ['fq_cook_rumor3', 'ガンテおばばのまご', 'girl', 'fq_cook_rumor3', 'north', KAN, 26, 23, { show: SHOWN, wander: 1 }],
  ['fq_cook_mush', '雪の下のきのこ', 'mon:fq_mushroom', 'fq_cook_mush', 'north', KAN, 3, -1, { show: opened(FQ.cookStart), solid: false, fixed: true }],
  ['fq_cook_mole', 'ほりほりモグラ', 'mon:mole_miner', 'fq_cook_mole', 'north', KAN, 12, 32, { show: { all: [FQ_OPEN, FQ.cookStart], not: [FQ.cookMole] }, fixed: true }],
  // 4. ルミナ: 教会の シスター・かねの 台・羽・どろ・話を 聞く 4人・北西の 木の カラス
  // ルミナの町の 広場（ふん水の 東）: お仕事いらい板（たのまれごとの はり紙。第41回で 11まい）
  ['fq_board', 'お仕事いらい板', 'mon:fq_board', 'fq_board', 'overworld', TW, 26, 17, { fixed: true }],
  ['fq_bell_sister', '教会のシスター', 'priestess', 'fq_bell_sister', 'overworld', TW, 12, 34, { show: SHOWN }],
  ['fq_bell_stand', 'かねの台', 'mon:fq_bell_stand', 'fq_bell_stand', 'overworld', TW, 12, 29, { show: { all: [FQ_OPEN], not: [FQ.bellDone] }, fixed: true }],
  ['fq_bell_stand2', 'かねの台', 'mon:fq_bell_stand_bell', 'fq_bell_stand', 'overworld', TW, 12, 29, { show: opened(FQ.bellDone), fixed: true }],
  ['fq_bell_feather', '黒い羽', 'mon:fq_feather', 'fq_bell_feather', 'overworld', TW, 12, 32, { show: opened(FQ.bellStart), solid: false }],
  ['fq_bell_mud', '赤いどろ', 'mon:fq_mud', 'fq_bell_mud', 'overworld', TW, 14, 28, { show: opened(FQ.bellStart), solid: false }],
  ['fq_bell_w1', 'パン屋のおじさん', 'merchant', 'fq_bell_talk1', 'overworld', TW, 20, 11, { show: opened(FQ.bellStart) }],
  ['fq_bell_w2', '町の男の子', 'boy', 'fq_bell_talk2', 'overworld', TW, 34, 18, { show: opened(FQ.bellStart) }],
  ['fq_bell_w3', '畑のおばあさん', 'elder', 'fq_bell_talk3', 'overworld', TW, 6, 10, { show: opened(FQ.bellStart) }],
  ['fq_bell_w4', '夜の門番', 'guard', 'fq_bell_talk4', 'overworld', TW, 24, 34, { show: opened(FQ.bellStart) }],
  ['fq_bell_crow', 'カラスのクロ', 'mon:fq_crow', 'fq_bell_crow', 'overworld', TW, 2, 1, { show: { all: [FQ_OPEN, FQ.bellSolved], not: [FQ.bellGot] }, fixed: true }],
  // 5. カナトコ: 古い 鉱山の 前の 年よりの 鉱夫
  ['fq_rail_miner', '年よりの鉱夫ゲン', 'fq_old_miner', 'fq_rail_miner', 'north', KAN, 14, 2, { show: SHOWN }],
];

// maps/index.js の buildMaps から（ほかの マップが そろった あと・finishMap の 前）
export function attachFamilyQuests(maps) {
  Object.assign(maps, theaterMaps(), shopMap(), mineMaps());
  // 1. 劇場（王都サファラの 南西の すみ）: 日干しれんがの たてもの・赤い やね・かんばん
  const south = maps.south;
  stamp(south, THEATER.x, THEATER.y, THEATER.w, THEATER.h, T.ADOBE, 'red', THEATER_DOOR);
  south.tiles[(THEATER.y + 3) * south.w + THEATER.x + 2] = T.SIGN;
  south.signs.push({ x: THEATER.x + 2, y: THEATER.y + 3, text: '〜 サファラ劇場 〜\n歌とおどりの、楽しいおしばい。\n毎日、夕方から上演中！' });
  for (const d of THEATER_DOOR) south.warps.push({ x: d.x, y: d.y, to: { map: 'fq_th_lobby', x: TH_POS.lobbyIn.x, y: TH_POS.lobbyIn.y, dir: 'up' } });
  // 2. おみやげ屋（ユノハの 南）: 木の たてもの・雪の やね
  const north = maps.north;
  stamp(north, SOUVENIR.x, SOUVENIR.y, SOUVENIR.w, SOUVENIR.h, T.WALL_WOOD, 'snowred', [SOUVENIR_DOOR]);
  north.tiles[(SOUVENIR.y + 3) * north.w + SOUVENIR.x + 4] = T.SIGN;
  north.signs.push({ x: SOUVENIR.x + 4, y: SOUVENIR.y + 3, text: '〜 おみやげ　ゆきえ 〜\n（字がかすれて、ほとんど読めない…）' });
  north.warps.push({ x: SOUVENIR_DOOR.x, y: SOUVENIR_DOOR.y, to: { map: 'fq_shop', x: 6, y: 5.2, dir: 'up' } });
  // 5. 古い 鉱山の 入り口（カナトコの 北の かべ。第1部クリアで 板が 外れて 入れる）
  north.tiles[OLD_MINE_DOOR.y * north.w + OLD_MINE_DOOR.x] = T.MINE_BEAM;
  north.gates.push({ x: OLD_MINE_DOOR.x, y: OLD_MINE_DOOR.y, closed: T.MINE_BEAM, open: T.CAVE_ENTRANCE, flag: FQ.railStart });
  delete north.gateAt;
  north.warps.push({ x: OLD_MINE_DOOR.x, y: OLD_MINE_DOOR.y, to: { map: 'fq_old_mine', x: 4.5, y: 12.4, dir: 'up' } });
  // 町の 人・物
  for (const [id, name, sprite, script, mid, base, dx, dy, o] of TOWN_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    // fixed … その いちに 置く（町の 外・ならぶ 人）。ほかは ちかくの あいた ゆかを さがす
    const [x, y] = fixed ? [base.x + dx, base.y + dy] : openSpot(m, base.x + dx, base.y + dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  // 6〜11（第41回）
  attachWorkQuests(maps);
  return maps;
}

// 外の いち（クエストの 画面・テスト）
export function familySpot(maps, id) {
  for (const m of Object.values(maps)) {
    const n = m.npcs?.find((x) => x.id === id);
    if (n) return { map: m.id, x: Math.floor(n.x), y: Math.floor(n.y) };
  }
  return null;
}

// その マスに 立てるか（町の 中の あいた ゆか。テスト）
export function walkable(m, x, y) {
  return !(TILE_INFO[m.tiles[y * m.w + x]]?.solid ?? true);
}
