// 第3章「星の竜がねむる山」の マップ
// シロガネ地方（フィールド）・氷の洞窟・鉱山・炎の山・竜の試練の神殿・星竜山
// 町や 村の 形は north-rows.js、ダンジョンの 形は ch3-rows.js（1文字 = 1マス）
import { T, TILE_INFO, parseRows } from '../tiles.js?v=e388712b9c60';
import { makeRng } from '../rng.js?v=e388712b9c60';
import { npc } from './npc.js?v=e388712b9c60';
import { SEA_PLACES } from './ch2.js?v=e388712b9c60';
import {
  buildNorth, northZoneAt, northAreaName, northWeatherAt, northBgmAt, NORTH_PLACES, NORTH_POS, TEMPLE_AREA, LAKE3,
  DRAGON_GATE_Y, DRAGON_GATE_X, ROPE, LANDING_FIELD,
} from './north.js?v=e388712b9c60';
import {
  ICECAVE1_ROWS, ICECAVE2_ROWS, MINE1_ROWS, MINE2_ROWS, MINE3_ROWS, VOLCANO1_ROWS, VOLCANO2_ROWS, VOLCANO3_ROWS,
  TEMPLE_HALL_ROWS, TEMPLE_COURAGE_ROWS, TEMPLE_WISDOM_ROWS, TEMPLE_BOND_ROWS,
  PEAK1_ROWS, PEAK2_ROWS, PEAK3_ROWS, PEAK4_ROWS, PEAK5_ROWS, PEAK_TOP_ROWS,
} from './ch3-rows.js?v=e388712b9c60';

const VIL = NORTH_PLACES.dragon_village, KAN = NORTH_PLACES.kanatoko, YUN = NORTH_PLACES.yunoha;
const V = (x, y) => [VIL.x + x, VIL.y + y];
const K = (x, y) => [KAN.x + x, KAN.y + y];
const Y = (x, y) => [YUN.x + x, YUN.y + y];

// 第3章の マップの ID（セーブに のこるので かえない）
export const CH3_MAPS = ['north', 'ice_cave1', 'ice_cave2', 'mine1', 'mine2', 'mine3', 'volcano1', 'volcano2', 'volcano3',
  'dragon_temple', 'trial_courage', 'trial_wisdom', 'trial_bond', 'peak1', 'peak2', 'peak3', 'peak4', 'peak5', 'peak_top'];

// ルーラ・帰り道の羽で 行ける 第3章の 町と 村（村の 門の 外に おりる）
export const NORTH_TOWNS = {
  dragon_village: { name: VIL.name, map: 'north', x: VIL.x + 15, y: VIL.y + VIL.h, rect: [VIL.x, VIL.y, VIL.w, VIL.h] },
  kanatoko: { name: KAN.name, map: 'north', x: KAN.x - 2, y: KAN.y + 9, rect: [KAN.x, KAN.y, KAN.w, KAN.h] },
  yunoha: { name: YUN.name, map: 'north', x: YUN.x + 12, y: YUN.y - 2, rect: [YUN.x, YUN.y, YUN.w, YUN.h] },
};
Object.assign(SEA_PLACES, NORTH_TOWNS);

// ───────────── トロッコ（鉱山）─────────────
// だいほんの ['ride', 道すじ] と ['teleport', …]（story-ch3.js）。lever: 行き先を かえる レバーの フラグ
// path … トロッコが 通る 点（マスの まん中）/ to … おりる ところ
export const CART_RIDES = {
  m1_camp: {
    map: 'mine1', lever: 'c3_m1_lever',
    off: { path: [[19.5, 20.5], [19.5, 11.5], [9.5, 11.5], [9.5, 7.5]], to: [9.5, 6.5, 'up'] },
    on: { path: [[19.5, 20.5], [19.5, 11.5], [29.5, 11.5], [29.5, 7.5]], to: [29.5, 6.5, 'up'] },
  },
  m1_left: { map: 'mine1', off: { path: [[9.5, 7.5], [9.5, 11.5], [19.5, 11.5], [19.5, 20.5]], to: [19.5, 21.5, 'down'] } },
  m1_right: { map: 'mine1', off: { path: [[29.5, 7.5], [29.5, 11.5], [19.5, 11.5], [19.5, 20.5]], to: [19.5, 21.5, 'down'] } },
  m2_hub: {
    map: 'mine2', lever: 'c3_m2_lever',
    off: { path: [[21.5, 27.5], [21.5, 19.5], [10.5, 19.5]], to: [10.5, 20.5, 'down'] },
    on: { path: [[21.5, 27.5], [21.5, 19.5], [33.5, 19.5]], to: [33.5, 20.5, 'down'] },
  },
  m2_a: {
    map: 'mine2', lever: 'c3_m2_lever_a',
    off: { path: [[10.5, 19.5], [21.5, 19.5], [21.5, 27.5]], to: [21.5, 28.5, 'down'] },
    on: { path: [[10.5, 19.5], [10.5, 6.5], [13.5, 6.5]], to: [13.5, 5.5, 'up'] },
  },
  m2_b: { map: 'mine2', off: { path: [[33.5, 19.5], [21.5, 19.5], [21.5, 27.5]], to: [21.5, 28.5, 'down'] } },
  m2_c: { map: 'mine2', off: { path: [[13.5, 6.5], [10.5, 6.5], [10.5, 19.5]], to: [10.5, 20.5, 'down'] } },
};

// ───────────── しかけの フラグ ─────────────
// 炎の山: レバーで ようがんの 流れが かわる（入れかえ）
export const VOLCANO_LEVERS = { v1: 'c3_v1', v2a: 'c3_v2a', v2b: 'c3_v2b' };
// ちえの間: 4つの かがり火（日の 道すじの じゅん: 東 → 南 → 西 → 北）
export const WISDOM_ORDER = ['e', 's', 'w', 'n'];
export const WISDOM_FLAGS = { n: 'c3_wz_n', e: 'c3_wz_e', s: 'c3_wz_s', w: 'c3_wz_w' };
export const WISDOM_BRAZIERS = { n: [11, 4], e: [17, 9], s: [11, 14], w: [5, 9] };
// きずなの間の スイッチ（3つ ぜんぶに 人が のると ひらく）
export const BOND_PLATES = [[11, 5], [6, 13], [16, 13]];
// 3つの 試練（どの じゅんでも よい）
export const TRIAL_FLAGS = ['c3_courage', 'c3_wisdom', 'c3_bond'];

// 宝箱の 中みに つかう 物や 素材（つぼ・たるを 調べた とき）
export function ch3SearchMats(mapId) {
  if (mapId === 'north') return ['ice_crystal', 'iron_shard', 'beast_fang'];
  if (mapId.startsWith('ice_cave') || mapId.startsWith('peak')) return ['ice_crystal', 'magic_powder'];
  if (mapId.startsWith('mine')) return ['iron_shard', 'flame_stone', 'silver_shard'];
  if (mapId.startsWith('volcano')) return ['flame_stone', 'iron_shard'];
  return null;
}

// きらきら（シロガネ地方）の 中み
export const NORTH_SPARKLE_LOOT = {
  n_snow: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['ice_crystal', 2], ['seed_def', 0.4]],
  n_forest: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['ice_crystal', 1.5], ['seed_hp', 0.4]],
  n_lake: [['moonherb', 2], ['star_shard', 3], ['ice_crystal', 3], ['magic_water', 0.6]],
  n_mine: [['herb', 3], ['star_shard', 3], ['iron_shard', 2], ['silver_shard', 1], ['seed_str', 0.4]],
  n_peak: [['moonherb', 2], ['star_shard', 4], ['ice_crystal', 2], ['magic_water', 0.6], ['seed_mag', 0.4]],
  n_volcano: [['herb', 3], ['star_shard', 3], ['flame_stone', 3], ['seed_agi', 0.4]],
};

// ───────────── シロガネ地方 ─────────────
const P = NORTH_POS;
const NORTH_NPCS = [
  // 竜守りの村
  npc('c3_elder', '長老ハクゲン', V(6, 5), 'dragon_elder', 'c3_elder'),
  npc('yukina_home', 'ユキナ', V(8, 4), 'yukina', 'c3_yukina', { show: { not: ['c3_elder'] } }),
  npc('yukina_shrine', 'ユキナ', V(25, 5), 'yukina', 'c3_yukina', { show: { all: ['c3_mammoth'], not: ['c3_gate'] }, dir: 'up' }),
  npc('yukina_after', 'ユキナ', V(24, 6), 'yukina', 'c3_yukina', { show: { all: ['c3_clear'] } }),
  npc('c3_priest', 'ほこらの神官', V(22, 4), 'shrine_priest', 'c3_priest'),
  npc('fire_star', '炎の守り星', [V(25, 3)[0] + 0.5, V(25, 3)[1] - 0.2], 'firestone', 'c3_fire_altar', { solid: false, show: { all: ['c3_clear'] } }),
  npc('c3_v_inn', '宿屋のおかみ', V(3, 18), 'snow_f', 'c3_inn_village', { dir: 'down' }),
  npc('c3_v_shop', 'よろず屋のおじさん', V(24, 18), 'snow_m', 'c3_shop_village', { dir: 'down' }),
  npc('c3_v_hunter', 'かりゅうどのトウマ', V(13, 13), 'snow_hunter', 'c3_v_hunter', { wander: 2 }),
  npc('c3_v_girl', 'コユキ', V(11, 14), 'snow_girl', 'c3_fox_girl', { wander: 1 }),
  npc('c3_v_kid', 'ユタ', V(17, 14), 'snow_kid', 'c3_snow_kid', { wander: 1 }),
  npc('c3_v_woman', '村のおくさん', V(4, 13), 'snow_f', 'c3_v_woman'),
  npc('c3_v_oldman', '物知りのおじいさん', V(27, 13), 'snow_m', 'c3_v_oldman'),
  npc('c3_v_guard', '門番のゴウ', V(14, 1), 'snow_hunter', 'c3_v_guard'),
  npc('c3_v_mom', 'コユキのお母さん', V(19, 21), 'snow_f', 'c3_v_mom', { wander: 1 }),
  // 夜だけ: 広場で 星を 見る おばあさん（竜の 星座）
  npc('c3_n_stargazer', '星見のおばあさん', V(16, 12), 'snow_f', 'c3_n_stargazer', { show: { all: ['@night'] }, dir: 'up' }),
  // 雪だるま（雪だるまコンテスト）
  npc('snowman_small', '小さな雪だるま', V(18, 12), 'snowman', 'c3_snowman', { show: { not: ['q_snow_done'] } }),
  npc('snowman_big', '大きな雪だるま', V(18, 12), 'snowman', 'c3_snowman', { show: { all: ['q_snow_done'] }, big: true }),
  npc('snowman_rival1', '雪だるま', V(12, 11), 'snowman', 'c3_snowman_rival'),
  npc('snowman_rival2', '雪だるま', V(21, 15), 'snowman', 'c3_snowman_rival'),

  // 鉱山の町カナトコ
  npc('donga', '親方ドンガ', K(6, 4), 'miner_boss', 'c3_donga'),
  npc('pikke', 'ピッケ', K(13, 8), 'pikke', 'c3_pikke', { show: { not: ['c3_mine'] }, wander: 1 }),
  npc('pikke_home', 'ピッケ', K(3, 5), 'pikke', 'c3_pikke', { show: { all: ['c3_mine'] } }),
  npc('ganji', '鉱夫ガンジ', K(3, 4), 'miner', 'c3_ganji', { show: { all: ['c3_mine'] } }),
  npc('c3_k_weapon', '武器屋のおやじ', K(25, 4), 'miner2', 'c3_shop_weapon', { dir: 'down' }),
  npc('c3_k_item', '道具屋のおかみ', K(4, 12), 'mine_wife', 'c3_shop_item', { dir: 'down' }),
  npc('c3_k_armor', '防具屋のおにいさん', K(28, 13), 'miner', 'c3_shop_armor', { dir: 'down' }),
  npc('c3_k_inn', '宿屋のおかみ', K(2, 20), 'mine_wife', 'c3_inn_kanatoko', { dir: 'right' }),
  npc('c3_k_priest', '神父さま', K(17, 20), 'priest', 'church', { dir: 'down' }),
  npc('c3_k_banker', '預かり所のおじさん', K(23, 19), 'banker_m', 'bank_kanatoko', { dir: 'down' }),
  npc('tetsujii', 'かじ屋のテツジイ', K(29, 19), 'old_smith', 'c3_tetsujii', { dir: 'down' }),
  npc('c3_k_miner1', '鉱夫', K(9, 13), 'miner', 'c3_k_miner1', { wander: 2 }),
  npc('c3_k_miner2', '鉱夫', K(19, 7), 'miner2', 'c3_k_miner2'),
  npc('c3_k_wife', '鉱夫のおくさん', K(20, 17), 'mine_wife', 'c3_k_wife', { wander: 2 }),
  npc('town_cart', 'トロッコ', K(17, 6), 'minecart', 'c3_town_cart'),
  // 鉱山から もどった 鉱夫たち（鉱山の 親分を たおした あと）
  npc('c3_k_miner3', '鉱夫', K(14, 10), 'miner', 'c3_k_miner3', { show: { all: ['c3_mine'] }, wander: 2 }),
  // 夜だけ: 夜番の 鉱夫
  npc('c3_n_watch', '夜番の鉱夫', K(15, 13), 'miner2', 'c3_n_watch', { show: { all: ['@night'] }, wander: 1 }),

  // 温泉の里ユノハ
  npc('obaba', '湯守りのおばば', Y(5, 4), 'onsen_granny', 'c3_obaba'),
  npc('c3_y_inn', '温泉宿のおかみ', Y(17, 3), 'onsen_f', 'c3_inn_yunoha', { dir: 'down' }),
  npc('c3_y_shop', '道具屋', Y(21, 11), 'onsen_m', 'c3_shop_yunoha', { dir: 'down' }),
  npc('c3_y_armor', '防具屋', Y(4, 15), 'onsen_f', 'c3_shop_yunoha_armor', { dir: 'down' }),
  npc('c3_y_guard', '里の見張り', Y(24, 15), 'onsen_m', 'c3_rope_guard', { show: { not: ['c3_onsen'] }, dir: 'right' }),
  npc('c3_y_man', '湯治の旅人', Y(10, 13), 'onsen_m', 'c3_y_man', { wander: 2 }),
  npc('c3_y_girl', '里の女の子', Y(14, 18), 'snow_girl', 'c3_y_girl', { wander: 2, show: { not: ['@night'] } }),
  // 夜だけ: 星空を 見ながら 湯に つかりに きた 人
  npc('c3_n_bather', '夜の湯治客', Y(8, 12), 'onsen_m', 'c3_n_bather', { show: { all: ['@night'] }, dir: 'left' }),
  npc('c3_y_woman', '温泉のおねえさん', Y(16, 9), 'onsen_f', 'c3_y_woman'),
  npc('c3_y_monkey', '温泉のサル', Y(4, 11), 'monkey', 'c3_monkey', { solid: true }),

  // フィールド
  npc('c3_landing_guide', '旅のかりゅうど', [62, 93], 'snow_hunter', 'c3_landing_guide', { wander: 1 }),
  npc('c3_fisher', '氷つりのおじさん', [41, 56], 'snow_m', 'c3_fisher', { dir: 'left' }),
  npc('fox', 'ユキマル', [P.fox.x, P.fox.y], 'fox', 'c3_fox', { show: { all: ['q_fox_start'], not: ['q_fox_found'] }, wander: 1 }),
  npc('c3_hermit', 'ふしぎな老人', [P.spa.x + 4, P.spa.y - 4], 'snow_m', 'c3_hermit'),
  npc('c3_spa_monkey', 'ひみつの温泉のサル', [P.spa.x + 1, P.spa.y + 1], 'monkey', 'c3_monkey', { solid: true }),
  npc('star_iron', '光る石', [P.crater.x, P.crater.y], 'night_glint', 'c3_star_iron', { show: { not: ['q_star_iron'] }, solid: false }),
  // なだれの そばで まっている ブリザマンモス（おとなしく なった あと）
  npc('mammoth_calm', 'ブリザマンモス', [84, 50], 'mon:blizzard_mammoth', 'c3_mammoth_calm', { show: { all: ['c3_mammoth'] }, big: true }),
];

// 宝箱（フィールドの 宝箱は 開けると きえる）
const NORTH_CHESTS = [
  { id: 'n_lake', x: LAKE3.x, y: LAKE3.y, item: 'frost_ring' },
  { id: 'n_fox', x: P.fox.x - 2, y: P.fox.y + 1, item: 'seed_agi' },
  { id: 'n_spa', x: P.spa.x + 4, y: P.spa.y + 3, item: 'seed_hp' },
  { id: 'n_crater', x: P.crater.x - 2, y: P.crater.y - 1, item: 'magic_water', n: 2 },
  { id: 'n_temple', x: 37, y: 37, item: 'seed_mag' },
  { id: 'n_valley', x: 66, y: 16, item: 'seed_str' },
  { id: 'n_yuvalley', x: 96, y: 103, item: 'silver_shard', n: 2 },
  { id: 'n_ash', x: 122, y: 79, gold: 900 },
  { id: 'n_minestrip', x: 128, y: 35, item: 'revive_flower' },
  { id: 'n_westpath', x: 3, y: 34, item: 'moonherb', n: 3 },
];

// かんばん
const NORTH_SIGNS = [
  { x: 62, y: 91, text: 'ここはシロガネ地方の雪原。\n↑ 竜守りの村' },
  { x: 45, y: 59, text: '← 白銀の湖・氷の洞窟\n（湖の氷はつるつる。すべりに注意！）' },
  { x: 26, y: 47, text: '氷の洞窟\n（中は氷のゆか。一度すべり出すと止まれないぞ）' },
  { x: 62, y: 38, text: '↑ 竜の門（星竜山）\n← 竜の試練の神殿' },
  { x: 82, y: 56, text: '→ 鉱山の町カナトコ' },
  { x: 110, y: 62, text: '↓ 温泉の里ユノハ\n（トンネルをぬけた先）' },
  { x: 28, y: 85, text: 'しずか雪の森\n（雪の上に、小さな足あとがつづいている…）' },
  { x: 112, y: 33, text: 'カナトコ鉱山\n（関係者以外立ち入り禁止）' },
];

// お店の かんばん（入り口の よこの かべ）
const NB = (x, y, kind, name) => ({ x, y, kind, name });
const NORTH_BOARDS = [
  NB(...V(4, 22), 'inn', '宿屋'), NB(...V(27, 22), 'general', 'よろず屋'), NB(...V(24, 9), 'temple', '竜のほこら'),
  NB(...K(26, 7), 'weapon', '武器屋'), NB(...K(4, 16), 'item', '道具屋'), NB(...K(30, 16), 'armor', '防具屋'),
  NB(...K(5, 22), 'inn', '宿屋（大浴場）'), NB(...K(16, 22), 'church', '教会'), NB(...K(23, 22), 'bank', '預かり所'), NB(...K(30, 22), 'smith', 'かじ屋'),
  NB(...Y(19, 6), 'inn', '温泉宿'), NB(...Y(22, 14), 'item', '道具屋'), NB(...Y(5, 18), 'armor', '防具屋'),
];

// やね
const NORTH_ROOFS = [
  ...[[1, 2, 10, 7, 'snowblue'], [20, 2, 11, 8, 'snowred'], [1, 11, 7, 5, 'snow'], [24, 11, 7, 5, 'snow'], [1, 17, 9, 6, 'snowred'], [22, 17, 9, 6, 'snowgreen']]
    .map(([x, y, w, h, color]) => ({ x: VIL.x + x, y: VIL.y + y, w, h, color })),
  ...[[1, 2, 10, 6, 'rust'], [23, 2, 10, 6, 'slate'], [2, 11, 7, 6, 'rust'], [26, 11, 7, 6, 'slate'], [1, 18, 11, 5, 'rust'], [15, 18, 6, 5, 'white'],
    [22, 18, 6, 5, 'slate'], [27, 18, 6, 5, 'rust']]
    .map(([x, y, w, h, color]) => ({ x: KAN.x + x, y: KAN.y + y, w, h, color })),
  ...[[2, 2, 8, 5, 'brown'], [16, 2, 9, 5, 'red'], [19, 10, 6, 5, 'teal'], [2, 14, 6, 5, 'brown']]
    .map(([x, y, w, h, color]) => ({ x: YUN.x + x, y: YUN.y + y, w, h, color })),
  { x: TEMPLE_AREA.x + 1, y: TEMPLE_AREA.y + 1, w: 15, h: 8, color: 'slate' },
];

// 地図に 出す なまえ
const NORTH_LABELS = [
  ...Object.values(NORTH_PLACES).map((p) => ({ name: p.name, x: p.x, y: p.y, w: p.w, h: p.h })),
  { name: TEMPLE_AREA.name, x: TEMPLE_AREA.x, y: TEMPLE_AREA.y, w: TEMPLE_AREA.w, h: TEMPLE_AREA.h },
  { name: '白銀の湖', x: LAKE3.x - LAKE3.rx, y: LAKE3.y - LAKE3.ry, w: LAKE3.rx * 2, h: LAKE3.ry * 2 },
  { name: '星竜山', x: 50, y: 2, w: 28, h: 8 },
  { name: '炎の山', x: 114, y: 92, w: 16, h: 12 },
  { name: 'しずか雪の森', x: 8, y: 76, w: 32, h: 26 },
  { name: LANDING_FIELD.name, x: LANDING_FIELD.x, y: LANDING_FIELD.y + 2, w: LANDING_FIELD.w, h: LANDING_FIELD.h - 4 },
];

// きらきら（ひろえる 物）。雪原・森・湖の ほとり・鉱山への 道・火の山の ふもと
const SPARKLE_GROUND = new Set([T.SNOW, T.SNOW_PATH, T.DEEP_SNOW, T.ASH]);
function northSparkles(m) {
  const rng = makeRng(3303);
  const list = [];
  let tries = 0;
  while (list.length < 20 && tries++ < 8000) {
    const x = rng.int(4, m.w - 5), y = rng.int(4, m.h - 5);
    if (!SPARKLE_GROUND.has(m.tiles[y * m.w + x]) || m.gateAt?.has(y * m.w + x)) continue;
    const z = northZoneAt(x, y);
    if (z.startsWith('safe')) continue;
    if (list.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 12)) continue;
    list.push({ id: 'nsp' + list.length, x, y, zone: z });
  }
  return list;
}

function buildField() {
  const nb = buildNorth();
  for (const s of NORTH_SIGNS) nb.tiles[s.y * nb.w + s.x] = T.SIGN;
  // しかけの マス（しらべると だいほん）
  const actions = [];
  for (const g of nb.gates) {
    if (g.flag === 'c3_mammoth') actions.push({ x: g.x, y: g.y, script: 'c3_avalanche', show: { not: ['c3_mammoth'] } });
    else if (g.flag === 'c3_mine') actions.push({ x: g.x, y: g.y, script: 'c3_tunnel', show: { not: ['c3_mine'] } });
    else if (g.flag === 'c3_onsen') actions.push({ x: g.x, y: g.y, script: 'c3_rope', show: { not: ['c3_onsen'] } });
    else if (g.flag === 'c3_gate') actions.push({ x: g.x, y: g.y, script: 'c3_dragon_gate', show: { not: ['c3_gate'] } });
    else if (g.flag === 'c3_flare') actions.push({ x: g.x, y: g.y, script: 'c3_seal', show: { not: ['c3_flare'] } });
  }
  // 湯ぶねの ふち（となりに 立てる マス）だけ しらべられる
  const floorAt = (x, y) => x >= 0 && y >= 0 && x < nb.w && y < nb.h && !TILE_INFO[nb.tiles[y * nb.w + x]]?.solid;
  const spring = (x0, y0, x1, y1, script) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (nb.tiles[y * nb.w + x] !== T.HOT_SPRING) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => floorAt(x + dx, y + dy))) actions.push({ x, y, script });
      }
    }
  };
  // カナトコの 宿屋の 大浴場・ユノハの 外の 温泉・ひみつの温泉
  spring(...K(8, 19), ...K(10, 20), 'c3_kan_bath');
  spring(...Y(2, 10), ...Y(7, 12), 'c3_onsen_bath');
  spring(P.spa.x - 4, P.spa.y - 3, P.spa.x + 5, P.spa.y + 4, 'c3_secret_spa');
  // 村の 広場の 竜の像
  actions.push({ x: V(19, 12)[0], y: V(19, 12)[1], script: 'c3_dragon_statue' });
  // ほかの 像（ほこら・カナトコと ユノハの 広場）
  for (const [x, y, script] of [[...V(22, 7), 'c3_statue_shrine'], [...V(28, 7), 'c3_statue_shrine'],
    [...K(19, 12), 'c3_statue_kanatoko'], [...Y(13, 12), 'c3_statue_yunoha']]) {
    if (nb.tiles[y * nb.w + x] === T.STATUE) actions.push({ x, y, script });
  }
  const m = {
    id: 'north', name: 'シロガネ地方', kind: 'field', bgm: 'snow', dark: false,
    altarScript: 'c3_fire_altar',
    w: nb.w, h: nb.h, tiles: nb.tiles, gates: nb.gates,
    npcs: NORTH_NPCS, chests: NORTH_CHESTS, signs: NORTH_SIGNS, boards: NORTH_BOARDS, actions,
    warps: [
      { x: P.icecave.x, y: P.icecave.y, to: { map: 'ice_cave1', x: 6.5, y: 32.4, dir: 'up' } },
      { x: P.mine.x, y: P.mine.y, to: { map: 'mine1', x: 19.5, y: 29.4, dir: 'up' } },
      { x: P.volcano.x, y: P.volcano.y, to: { map: 'volcano1', x: 20.5, y: 29.4, dir: 'up' } },
      { x: P.temple.x, y: P.temple.y, to: { map: 'dragon_temple', x: 14.5, y: 20.4, dir: 'up' } },
      { x: P.peak.x, y: P.peak.y, to: { map: 'peak1', x: 17.5, y: 38.4, dir: 'up' } },
    ],
    triggers: [
      { id: 'c3_arrive', x: LANDING_FIELD.x, y: LANDING_FIELD.y, w: LANDING_FIELD.w, h: LANDING_FIELD.h, script: 'c3_arrive', show: { all: ['c3_start'], not: ['c3_arrive'] } },
      { id: 'c3_village', x: VIL.x, y: VIL.y, w: VIL.w, h: VIL.h, script: 'c3_village_arrive', show: { all: ['c3_start'], not: ['c3_village'] } },
      { id: 'c3_kanatoko', x: KAN.x, y: KAN.y, w: KAN.w, h: KAN.h, script: 'c3_kanatoko_arrive', show: { all: ['c3_mammoth'], not: ['c3_kanatoko'] } },
      { id: 'c3_yunoha', x: YUN.x, y: YUN.y, w: YUN.w, h: YUN.h, script: 'c3_yunoha_arrive', show: { all: ['c3_mine'], not: ['c3_yunoha'] } },
      // 子ギツネを つれて 村に もどる
      { id: 'c3_fox_home', x: VIL.x, y: VIL.y, w: VIL.w, h: VIL.h, script: 'c3_fox_home', show: { all: ['q_fox_found'], not: ['q_fox_done'] } },
    ],
    roofs: NORTH_ROOFS,
    zoneAt: northZoneAt, areaName: northAreaName, bgmAt: northBgmAt, weatherAt: northWeatherAt,
    labels: NORTH_LABELS,
    spawnCounts: { n_snow: 14, n_forest: 10, n_lake: 6, n_mine: 10, n_peak: 7, n_volcano: 8 },
    // フィールドの 宝箱が 出る ところ（ここから 歩いて 行ける ところだけ）
    fcStart: [64, 97],
  };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  m.sparkles = northSparkles(m);
  return m;
}

// ───────────── ダンジョン ─────────────
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};

function dungeon(id, name, rows, opts = {}) {
  const t = parseRows(rows);
  const m = {
    id, name, kind: 'dungeon', bgm: 'cave', dark: false,
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [],
    zoneAt: () => 'safe:none',
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  return m;
}

// マスの まとまりを しかけに する（closed → open。invert: フラグが たつと しまる）
// もとの マスは はじめ（フラグが ない とき）の すがたに しておく
function gates(m, x0, y0, x1, y1, closed, open, flag, invert = false) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      m.tiles[y * m.w + x] = invert ? open : closed;
      m.gates.push(invert ? { x, y, closed, open, flag, invert: true } : { x, y, closed, open, flag });
    }
  }
}
const lever = (x, y, flag, script) => ({ gate: { x, y, closed: T.LEVER, open: T.LEVER_ON, flag }, action: { x, y, script } });

function iceCave() {
  const ic1 = dungeon('ice_cave1', '氷の洞窟　1階', ICECAVE1_ROWS, {
    bgm: 'cave', theme: 'ice',
    chests: [
      { id: 'ic1_nook', x: 29, y: 5, item: 'ice_shield' },
      { id: 'ic1_a', x: 3, y: 32, item: 'magic_water' },
      { id: 'ic1_b', x: 31, y: 18, item: 'seed_def' },
      { id: 'ic1_mat', x: 15, y: 3, item: 'ice_crystal', n: 3 },
    ],
    signs: [{ x: 8, y: 20, text: '氷の洞窟の注意書き\n「氷の上では、何かにぶつかるまで止まれない。\n　岩の位置をよく見てから進むべし」' }],
    warps: [
      { x: 6, y: 33, to: { map: 'north', x: P.icecave.x + 0.5, y: P.icecave.y + 1.6, dir: 'down' } },
      { x: 17, y: 2, to: { map: 'ice_cave2', x: 5.5, y: 31.5, dir: 'right' } },
    ],
    triggers: [{ id: 'ic_enter', x: 3, y: 26, w: 6, h: 7, script: 'c3_icecave_enter', show: { not: ['c3_icecave'] } }],
    zoneAt: zoneRect([[11, 4, 23, 14, 'safe:puzzle'], [25, 5, 33, 14, 'safe:puzzle'], [9, 21, 13, 21, 'safe:puzzle'], [14, 1, 20, 3, 'safe:stairs']], 'n_ice'),
    spawnCounts: { n_ice: 6 },
  });
  const ic2 = dungeon('ice_cave2', '氷の洞窟　地下', ICECAVE2_ROWS, {
    bgm: 'cave', theme: 'ice',
    npcs: [
      npc('ic_spring', 'いやしの泉', [20, 25], 'spring', 'spring', { solid: true }),
      npc('mammoth', 'ブリザマンモス', [20.5, 4.5], 'mon:blizzard_mammoth', 'c3_mammoth_event', { big: true, show: { not: ['c3_mammoth'] } }),
    ],
    chests: [
      { id: 'ic2_mini', x: 6, y: 11, item: 'frost_blade' },
      { id: 'ic2_ice', x: 36, y: 15, item: 'eternal_ice' },
      { id: 'ic2_a', x: 30, y: 20, item: 'seed_agi' },
      { id: 'ic2_b', x: 26, y: 32, item: 'magic_water' },
      { id: 'ic2_boss', x: 25, y: 3, item: 'ice_crystal', n: 5, show: { all: ['c3_mammoth'] } },
    ],
    warps: [{ x: 4, y: 31, to: { map: 'ice_cave1', x: 17.5, y: 3.5, dir: 'down' } }],
    triggers: [{ id: 'mammoth_room', x: 13, y: 6, w: 15, h: 3, script: 'c3_mammoth_event', show: { not: ['c3_mammoth'] } }],
    // ボスの へやの 水晶（入り口へ もどれる）
    actions: [{ x: 14, y: 2, script: 'c3_return_crystal', show: { all: ['c3_mammoth'] } }, { x: 26, y: 2, script: 'c3_return_crystal', show: { all: ['c3_mammoth'] } }],
    zoneAt: zoneRect([[12, 1, 28, 9, 'safe:boss'], [13, 10, 27, 22, 'safe:puzzle'], [3, 11, 9, 18, 'safe:puzzle'], [13, 23, 27, 28, 'safe:spring']], 'n_ice'),
    spawnCounts: { n_ice: 7 },
  });
  return [ic1, ic2];
}

function mine() {
  const m1 = dungeon('mine1', 'カナトコ鉱山　1階', MINE1_ROWS, {
    bgm: 'mine', dark: true,
    npcs: [
      npc('m1_cart_camp', 'トロッコ', [19, 20], 'minecart', 'c3_cart_m1_camp'),
      npc('m1_cart_left', 'トロッコ', [9, 7], 'minecart', 'c3_cart_m1_left'),
      npc('m1_cart_right', 'トロッコ', [29, 7], 'minecart', 'c3_cart_m1_right'),
      npc('m1_miner1', 'にげてきた鉱夫', [12, 23], 'miner', 'c3_m1_miner1', { show: { not: ['c3_mine'] } }),
      npc('m1_miner2', 'にげてきた鉱夫', [27, 22], 'miner2', 'c3_m1_miner2', { show: { not: ['c3_mine'] } }),
    ],
    chests: [
      { id: 'm1_a', x: 4, y: 2, item: 'steel_helm' },
      { id: 'm1_b', x: 7, y: 7, item: 'iron_shard', n: 3 },
      { id: 'm1_c', x: 31, y: 2, item: 'magic_water' },
      { id: 'm1_d', x: 35, y: 21, gold: 400 },
    ],
    warps: [
      { x: 19, y: 30, to: { map: 'north', x: P.mine.x + 0.5, y: P.mine.y + 1.6, dir: 'down' } },
      { x: 35, y: 2, to: { map: 'mine2', x: 21.5, y: 32.4, dir: 'up' } },
    ],
    triggers: [{ id: 'mine_enter', x: 16, y: 24, w: 7, h: 5, script: 'c3_mine_enter', show: { all: ['c3_miners'], not: ['c3_mine_seen'] } }],
    zoneAt: zoneRect([[3, 19, 36, 29, 'safe:camp']], 'n_mine1'),
    spawnCounts: { n_mine1: 5 },
  });
  const l1 = lever(21, 20, 'c3_m1_lever', 'c3_m1_lever');
  m1.gates.push(l1.gate);
  m1.actions.push(l1.action);

  const m2 = dungeon('mine2', 'カナトコ鉱山　地下2階', MINE2_ROWS, {
    bgm: 'mine', dark: true,
    npcs: [
      npc('m2_cart_hub', 'トロッコ', [21, 27], 'minecart', 'c3_cart_m2_hub'),
      npc('m2_cart_a', 'トロッコ', [10, 19], 'minecart', 'c3_cart_m2_a'),
      npc('m2_cart_b', 'トロッコ', [33, 19], 'minecart', 'c3_cart_m2_b'),
      npc('m2_cart_c', 'トロッコ', [13, 6], 'minecart', 'c3_cart_m2_c'),
      npc('m2_captive1', 'つかまった鉱夫', [37, 16], 'miner', 'c3_m2_captive'),
      npc('m2_captive2', 'つかまった鉱夫', [38, 18], 'miner2', 'c3_m2_captive'),
    ],
    chests: [
      { id: 'm2_a', x: 4, y: 14, item: 'steel_shield' },
      { id: 'm2_b', x: 39, y: 21, item: 'silver_shard', n: 2 },
      { id: 'm2_c', x: 30, y: 2, item: 'hammer_axe' },
      { id: 'm2_d', x: 13, y: 2, item: 'flame_stone', n: 3 },
      { id: 'm2_e', x: 15, y: 31, item: 'moonherb', n: 2 },
    ],
    warps: [
      { x: 21, y: 33, to: { map: 'mine1', x: 35.5, y: 3.5, dir: 'down' } },
      { x: 21, y: 2, to: { map: 'mine3', x: 15.0, y: 19.5, dir: 'up' } },
    ],
    triggers: [{ id: 'm2_guards', x: 32, y: 13, w: 9, h: 10, script: 'c3_m2_guards', show: { not: ['c3_m2_free'] } }],
    zoneAt: zoneRect([[32, 13, 40, 22, 'safe:captive'], [19, 1, 23, 3, 'safe:stairs']], 'n_mine2'),
    spawnCounts: { n_mine2: 8 },
  });
  for (const lv of [lever(24, 28, 'c3_m2_lever', 'c3_m2_lever'), lever(7, 16, 'c3_m2_lever_a', 'c3_m2_lever_a')]) {
    m2.gates.push(lv.gate);
    m2.actions.push(lv.action);
  }

  const m3 = dungeon('mine3', 'カナトコ鉱山　さいおく', MINE3_ROWS, {
    bgm: 'mine', dark: true,
    npcs: [
      npc('magma_golem', 'マグマゴーレム', [14.5, 6], 'mon:magma_golem', 'c3_golem_event', { big: true, show: { not: ['c3_mine'] } }),
    ],
    chests: [
      { id: 'm3_a', x: 5, y: 4, item: 'flame_stone', n: 2 },
      { id: 'm3_b', x: 24, y: 4, item: 'seed_str' },
    ],
    warps: [
      { x: 14, y: 21, to: { map: 'mine2', x: 21.5, y: 3.5, dir: 'down' } },
      { x: 15, y: 21, to: { map: 'mine2', x: 21.5, y: 3.5, dir: 'down' } },
    ],
    triggers: [{ id: 'golem_room', x: 5, y: 10, w: 20, h: 3, script: 'c3_golem_event', show: { not: ['c3_mine'] } }],
    zoneAt: () => 'safe:boss',
  });
  return [m1, m2, m3];
}

function volcano() {
  const v1 = dungeon('volcano1', '炎の山　1階', VOLCANO1_ROWS, {
    bgm: 'volcano', theme: 'lava', weather: 'embers', sky3d: { bg: '#1a0604', fog: 0x2a0a04 },
    chests: [
      { id: 'v1_a', x: 3, y: 12, item: 'flame_shield' },
      { id: 'v1_b', x: 26, y: 7, item: 'flame_stone', n: 2 },
      { id: 'v1_c', x: 17, y: 3, item: 'magic_water' },
      { id: 'v1_d', x: 8, y: 15, gold: 700 },
    ],
    warps: [
      { x: 20, y: 30, to: { map: 'north', x: P.volcano.x - 0.5, y: P.volcano.y + 0.5, dir: 'left' } },
      { x: 20, y: 2, to: { map: 'volcano2', x: 21.5, y: 35.4, dir: 'up' } },
    ],
    triggers: [{ id: 'volcano_enter', x: 13, y: 23, w: 15, h: 6, script: 'c3_volcano_enter', show: { not: ['c3_volcano_seen'] } }],
    zoneAt: zoneRect([[16, 2, 24, 3, 'safe:stairs']], 'n_volc'),
    spawnCounts: { n_volc: 8 },
  });
  // レバーで ようがんの 川の 一部が ひえて 道に なる（西の わたりは かわりに ようがんが 流れる）
  gates(v1, 7, 18, 18, 18, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v1);
  gates(v1, 5, 17, 6, 17, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v1, true);
  const l1 = lever(24, 24, VOLCANO_LEVERS.v1, 'c3_v1_lever');
  v1.gates.push(l1.gate);
  v1.actions.push(l1.action);

  const v2 = dungeon('volcano2', '炎の山　2階', VOLCANO2_ROWS, {
    bgm: 'volcano', theme: 'lava', weather: 'embers', sky3d: { bg: '#1a0604', fog: 0x2a0a04 },
    chests: [
      { id: 'v2_ne', x: 36, y: 8, item: 'fire_robe' },
      { id: 'v2_w', x: 5, y: 22, item: 'seed_hp' },
      { id: 'v2_e', x: 26, y: 23, item: 'flame_stone', n: 2 },
      { id: 'v2_nw', x: 17, y: 9, item: 'revive_flower' },
      { id: 'v2_hall', x: 13, y: 33, item: 'magic_water' },
    ],
    warps: [
      { x: 21, y: 36, to: { map: 'volcano1', x: 20.5, y: 3.5, dir: 'down' } },
      { x: 12, y: 3, to: { map: 'volcano3', x: 14.5, y: 22.4, dir: 'up' } },
    ],
    zoneAt: zoneRect([[6, 3, 18, 4, 'safe:stairs']], 'n_volc'),
    spawnCounts: { n_volc: 10 },
  });
  // 下の 川: P1（西）は レバー1で ひえる、Q1（東）は レバー1で ようがんが 流れる。上の 川の P2・Q2 は レバー2
  gates(v2, 9, 25, 11, 27, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v2a);
  gates(v2, 32, 25, 34, 27, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v2a, true);
  gates(v2, 9, 12, 11, 14, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v2b);
  gates(v2, 32, 12, 34, 14, T.LAVA, T.OBSIDIAN, VOLCANO_LEVERS.v2b, true);
  for (const lv of [lever(26, 31, VOLCANO_LEVERS.v2a, 'c3_v2a_lever'), lever(36, 22, VOLCANO_LEVERS.v2b, 'c3_v2b_lever')]) {
    v2.gates.push(lv.gate);
    v2.actions.push(lv.action);
  }

  const v3 = dungeon('volcano3', '炎の山　火口', VOLCANO3_ROWS, {
    bgm: 'volcano', theme: 'lava', weather: 'embers', sky3d: { bg: '#2a0804', fog: 0x3a0c04 },
    npcs: [npc('flame_knight', '炎の騎士フレアード', [14.5, 8], 'mon:flame_knight', 'c3_flare_event', { big: true, show: { not: ['c3_flare'] } })],
    warps: [
      { x: 14, y: 23, to: { map: 'volcano2', x: 12.5, y: 4.5, dir: 'down' } },
      { x: 15, y: 23, to: { map: 'volcano2', x: 12.5, y: 4.5, dir: 'down' } },
    ],
    triggers: [{ id: 'flare_room', x: 5, y: 12, w: 20, h: 3, script: 'c3_flare_event', show: { not: ['c3_flare'] } }],
    zoneAt: () => 'safe:boss',
  });
  return [v1, v2, v3];
}

function temple() {
  const hall = dungeon('dragon_temple', '竜の試練の神殿', TEMPLE_HALL_ROWS, {
    bgm: 'temple', sky3d: { bg: '#141a33', fog: 0x101428 },
    npcs: [
      npc('temple_keeper', '神殿の守り人', [12, 15], 'shrine_priest', 'c3_temple_keeper'),
      npc('temple_spring', 'いやしの泉', [17, 15], 'spring', 'spring', { solid: true }),
    ],
    signs: [
      { x: 13, y: 1, text: '↑ 勇気の間\n「おそれを知る者こそ、まことの勇者なり」' },
      { x: 1, y: 10, text: '← ちえの間\n「日と星の道すじを知る者よ、来たれ」' },
      { x: 27, y: 10, text: '→ きずなの間\n「心を合わせし者たちよ、来たれ」' },
    ],
    warps: [
      { x: 14, y: 21, to: { map: 'north', x: P.temple.x + 0.5, y: P.temple.y + 1.6, dir: 'down' } },
      { x: 14, y: 0, to: { map: 'trial_courage', x: 10.5, y: 24.5, dir: 'up' } },
      { x: 0, y: 11, to: { map: 'trial_wisdom', x: 11.5, y: 19.4, dir: 'up' } },
      { x: 28, y: 11, to: { map: 'trial_bond', x: 11.5, y: 19.4, dir: 'up' } },
    ],
    triggers: [{ id: 'temple_enter', x: 12, y: 17, w: 5, h: 4, script: 'c3_temple_enter', show: { not: ['c3_temple'] } }],
    actions: [{ x: 11, y: 6, script: 'c3_temple_statue' }, { x: 17, y: 6, script: 'c3_temple_statue' }],
    zoneAt: zoneRect([[11, 12, 18, 20, 'safe:entry']], 'n_temple'),
    spawnCounts: { n_temple: 5 },
  });
  // 試練を のりこえると かがり火が ともる
  for (const [x, y, f] of [[12, 2, 'c3_courage'], [16, 2, 'c3_courage'], [2, 9, 'c3_wisdom'], [2, 13, 'c3_wisdom'], [26, 9, 'c3_bond'], [26, 13, 'c3_bond']]) {
    hall.gates.push({ x, y, closed: T.BRAZIER, open: T.BRAZIER_LIT, flag: f });
  }
  const courage = dungeon('trial_courage', '勇気の間', TEMPLE_COURAGE_ROWS, {
    bgm: 'temple', sky3d: { bg: '#141a33', fog: 0x101428 },
    npcs: [npc('trial_guardian', '竜の番人', [10.5, 4], 'mon:trial_guardian', 'c3_courage_event', { big: true, show: { not: ['c3_courage'] } })],
    chests: [{ id: 'tc_a', x: 4, y: 5, item: 'seed_str', show: { all: ['c3_courage'] } }, { id: 'tc_b', x: 16, y: 5, item: 'magic_water', n: 2, show: { all: ['c3_courage'] } }],
    warps: [{ x: 10, y: 26, to: { map: 'dragon_temple', x: 14.5, y: 1.6, dir: 'down' } }],
    triggers: [{ id: 'courage_room', x: 6, y: 9, w: 9, h: 3, script: 'c3_courage_event', show: { not: ['c3_courage'] } }],
    actions: [7, 13].flatMap((x) => [12, 15, 18, 21].map((y) => ({ x, y, script: 'c3_courage_statue' }))),
    zoneAt: () => 'safe:trial',
  });
  const wisdom = dungeon('trial_wisdom', 'ちえの間', TEMPLE_WISDOM_ROWS, {
    bgm: 'temple', sky3d: { bg: '#141a33', fog: 0x101428 },
    altarScript: 'c3_wz_altar',
    chests: [{ id: 'tw_a', x: 2, y: 4, item: 'seed_mag', show: { all: ['c3_wisdom'] } }, { id: 'tw_b', x: 20, y: 4, item: 'sage_hat', show: { all: ['c3_wisdom'] } }],
    signs: [{ x: 9, y: 18, text: '「日は東からのぼり、南の空を通って、西へしずむ。\n　夜には、北の空に動かぬ星がかがやく。\n　――日と星の道すじのとおりに、火をともせ」' }],
    warps: [{ x: 11, y: 20, to: { map: 'dragon_temple', x: 1.6, y: 11.5, dir: 'right' } }],
    actions: Object.entries(WISDOM_BRAZIERS).map(([d, [x, y]]) => ({ x, y, script: `c3_wz_${d}` })),
    zoneAt: () => 'safe:trial',
  });
  for (const [d, [x, y]] of Object.entries(WISDOM_BRAZIERS)) wisdom.gates.push({ x, y, closed: T.BRAZIER, open: T.BRAZIER_LIT, flag: WISDOM_FLAGS[d] });
  const bond = dungeon('trial_bond', 'きずなの間', TEMPLE_BOND_ROWS, {
    bgm: 'temple', sky3d: { bg: '#141a33', fog: 0x101428 },
    chests: [{ id: 'tb_a', x: 2, y: 4, item: 'seed_hp', show: { all: ['c3_bond'] } }, { id: 'tb_b', x: 20, y: 4, item: 'bond_charm', show: { all: ['c3_bond'] } }],
    warps: [{ x: 11, y: 20, to: { map: 'dragon_temple', x: 27.4, y: 11.5, dir: 'left' } }],
    triggers: BOND_PLATES.map(([x, y], i) => ({ id: `bond_plate${i}`, x, y, w: 1, h: 1, script: 'c3_bond_plate', show: { not: ['c3_bond'] } })),
    actions: [{ x: 11, y: 10, script: 'c3_bond_statue' }],
    zoneAt: () => 'safe:trial',
  });
  for (const [x, y] of BOND_PLATES) bond.gates.push({ x, y, closed: T.PLATE, open: T.PLATE_ON, flag: 'c3_bond' });
  return [hall, courage, wisdom, bond];
}

function peak() {
  const out = { bgm: 'temple', sky3d: { bg: '#c8d2e2', fog: 0xd8e0ec } };
  const p1 = dungeon('peak1', '星竜山　ふぶきの道', PEAK1_ROWS, {
    ...out, weather: 'blizzard',
    chests: [{ id: 'p1_a', x: 3, y: 21, item: 'snow_hood' }, { id: 'p1_b', x: 30, y: 11, item: 'magic_water' }],
    warps: [
      { x: 17, y: 39, to: { map: 'north', x: P.peak.x + 0.5, y: P.peak.y + 1.6, dir: 'down' } },
      { x: 17, y: 1, to: { map: 'peak2', x: 15.5, y: 26.4, dir: 'up' } },
    ],
    triggers: [{ id: 'peak_enter', x: 15, y: 34, w: 5, h: 5, script: 'c3_peak_enter', show: { not: ['c3_peak'] } }],
    zoneAt: zoneRect([[14, 34, 20, 38, 'safe:foot']], 'n_peak_out'),
    spawnCounts: { n_peak_out: 7 },
  });
  const p2 = dungeon('peak2', '星竜山　氷のほらあな', PEAK2_ROWS, {
    bgm: 'temple', theme: 'ice',
    chests: [{ id: 'p2_a', x: 26, y: 15, item: 'star_shard', n: 3 }, { id: 'p2_b', x: 11, y: 3, item: 'seed_def' }, { id: 'p2_c', x: 4, y: 25, item: 'ice_crystal', n: 3 }],
    warps: [
      { x: 15, y: 27, to: { map: 'peak1', x: 17.5, y: 2.6, dir: 'down' } },
      { x: 15, y: 1, to: { map: 'peak3', x: 17.5, y: 29.4, dir: 'up' } },
    ],
    zoneAt: zoneRect([[10, 11, 20, 21, 'safe:puzzle']], 'n_peak_in'),
    spawnCounts: { n_peak_in: 6 },
  });
  const p3 = dungeon('peak3', '星竜山　山小屋', PEAK3_ROWS, {
    ...out, weather: 'snow',
    npcs: [
      npc('hut_keeper', '山小屋の主人', [11, 10], 'hut_keeper', 'c3_hut_inn', { dir: 'down' }),
      npc('hut_peddler', '旅の商人', [20, 10], 'peddler', 'c3_hut_shop', { dir: 'down' }),
      npc('hut_climber', '山男のガンテ', [20, 13], 'snow_hunter', 'c3_hut_climber'),
    ],
    chests: [{ id: 'p3_a', x: 4, y: 26, item: 'moonherb', n: 3 }, { id: 'p3_b', x: 29, y: 26, gold: 1200 }],
    warps: [
      { x: 17, y: 30, to: { map: 'peak2', x: 15.5, y: 2.4, dir: 'down' } },
      { x: 26, y: 1, to: { map: 'peak4', x: 17.5, y: 29.4, dir: 'up' } },
    ],
    triggers: [{ id: 'hut_arrive', x: 15, y: 23, w: 5, h: 6, script: 'c3_hut_arrive', show: { not: ['c3_hut'] } }],
    roofs: [{ x: 9, y: 8, w: 16, h: 9, color: 'snowred' }],
    bgmAt: (x, y) => (x >= 9 && y >= 8 && x < 25 && y < 17 ? 'snowtown' : 'temple'),
    zoneAt: () => 'safe:hut',
  });
  const p4 = dungeon('peak4', '星竜山　すいしょうのほらあな', PEAK4_ROWS, {
    bgm: 'temple', theme: 'ice',
    chests: [{ id: 'p4_a', x: 3, y: 5, item: 'star_robe' }, { id: 'p4_b', x: 22, y: 12, item: 'magic_water', n: 2 }],
    warps: [
      { x: 17, y: 30, to: { map: 'peak3', x: 26.5, y: 2.4, dir: 'down' } },
      { x: 24, y: 1, to: { map: 'peak5', x: 14.5, y: 35.4, dir: 'up' } },
    ],
    zoneAt: () => 'n_peak_in',
    spawnCounts: { n_peak_in: 8 },
  });
  const p5 = dungeon('peak5', '星竜山　頂上への道', PEAK5_ROWS, {
    ...out, weather: 'blizzard',
    chests: [{ id: 'p5_a', x: 3, y: 17, item: 'seed_agi' }, { id: 'p5_b', x: 24, y: 8, item: 'revive_flower' }],
    warps: [
      { x: 14, y: 36, to: { map: 'peak4', x: 24.5, y: 2.4, dir: 'down' } },
      { x: 14, y: 1, to: { map: 'peak_top', x: 13.5, y: 20.4, dir: 'up' } },
    ],
    zoneAt: () => 'n_peak_out',
    spawnCounts: { n_peak_out: 8 },
  });
  const top = dungeon('peak_top', '星竜山　頂上', PEAK_TOP_ROWS, {
    ...out, bgm: 'temple', weather: 'snow',
    npcs: [
      npc('dragon_sleep', '星の竜', [13.5, 7], 'mon:star_dragon_sleep', 'c3_dragon_sleep', { big: true, show: { not: ['c3_dragon'] } }),
      npc('dragon_awake', '星の竜アステル', [13.5, 7], 'mon:star_dragon', 'c3_dragon_awake', { big: true, show: { all: ['c3_dragon'] } }),
      // イグニアは「そのとき――」の ほのおと いっしょに あらわれる（c3_ignia_here）
      npc('ignia', '炎の魔女イグニア', [13.5, 12], 'mon:flame_witch', 'c3_ignia_event', { big: true, show: { all: ['c3_ignia_here'], not: ['c3_ignia'] } }),
    ],
    warps: [{ x: 13, y: 22, to: { map: 'peak5', x: 14.5, y: 2.4, dir: 'down' } }],
    triggers: [{ id: 'summit', x: 9, y: 15, w: 9, h: 6, script: 'c3_ignia_event', show: { not: ['c3_ignia'] } }],
    zoneAt: () => 'safe:top',
  });
  for (const [x, y] of [[5, 4], [21, 4], [4, 15], [22, 15]]) top.gates.push({ x, y, closed: T.BRAZIER, open: T.BRAZIER_LIT, flag: 'c3_ignia' });
  return [p1, p2, p3, p4, p5, top];
}

export function buildCh3Maps() {
  const maps = { north: buildField() };
  for (const m of [...iceCave(), ...mine(), ...volcano(), ...temple(), ...peak()]) maps[m.id] = m;
  return maps;
}

export { NORTH_POS, DRAGON_GATE_Y, DRAGON_GATE_X, ROPE };
