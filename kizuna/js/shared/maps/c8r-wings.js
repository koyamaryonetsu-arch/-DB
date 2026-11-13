// 第8章 第4幕「時のはざま」（A: 世界と物語）の つばさ 4つ（各 2階）と 最後の 回廊（3階）。maps/c8r.js が まぜる
// ※ ネタバレ注意（docs/plan-ch8.md の 9）
// ・つばさ c8r_<つばさ>_1・_2（千年前のすがた）／ c8r_<つばさ>_1_now・_2_now（今のすがた）。おなじ 形・おなじ 座標（timePair）
//   1階の E … 時の広間へ / U … 2階へ（2階の D の 真上に 着く）。2階の 上が「心の ためし」の 部屋（X が 入口・R が クリアで 開く 広間への 近道）
// ・最後の 回廊 c8r_last_1〜3（_now も）。1階の D … 時の広間の 大とびらの おく / 3階の U … さいごの 場所 c8r_core
// ・魔物: つばさ t8r_wing・回廊 t8r_last（B）。ためしの 部屋・階段・しかけの まわりは 出ない
import { T } from '../tiles.js?v=1ce6e2458180';
import { buildFloor, floorPos } from './c8r-floor.js?v=1ce6e2458180';
import {
  MOON1, MOON1_LINKS, MOON2, MOON2_LINKS, FIRE1, FIRE2, FIRE2_CHASE, FIRE2_CATCH, IRON1, IRON1_KINDS, IRON2, IRON2_KINDS, ICE1, ICE2,
  LAST1, LAST1_LINKS, LAST2, LAST2_KINDS, LAST3, C8R_W, C8R_H,
} from './c8r-rows.js?v=1ce6e2458180';
import { WINGS, WING_NAME, WING_MARK, HALL_ID, CORE_ID, CHASE8R, wingMapId, lastMapId, floorKey } from './c8r-flags.js?v=1ce6e2458180';
// 宝箱の 中み（B の data/items-c8r.js。c8rChest(マップ名, k) → { item, n }）
import { c8rChest } from '../data/items-c8r.js?v=1ce6e2458180';
import { TRIAL_SEEN8R } from './c8r-flags.js?v=1ce6e2458180';

// うかぶ かけら（今まで 行った 場所の かけら。今 ある タイルを 使い回す）
export const FRAG8R = {
  moon: [T.C8A_DUNE, T.PALM, T.C8A_MOONGATE, T.SANDSTONE], // 月の王宮・砂の 国
  fire: [T.ROCK, T.C8B_SHELLBOX, T.CLOUD_SEA, T.C8B_FLAMEWALL], // よみの 海の 底
  iron: [T.C8C_WRECK, T.C8C_PROP_OFF, T.C8C_CRUSH, T.TREE], // くろがねの ようさい・ミドリナの 森
  ice: [T.ICE_BLOCK, T.SNOW_PINE, T.ICE_WALL, T.C7I_THORN], // 氷の 竜の 城
  last: [T.STAR_WINDOW, T.C8A_DUNE, T.C8C_WRECK, T.ICE_BLOCK, T.TOWER_MURAL, T.PALM], // ぜんぶ
};

// 時の広間の つばさの 入口の となり（広間へ もどると ここに 着く。maps/c8r-hall.js と おなじ）
export const HALL_LAND = { moon: { x: 4, y: 3 }, fire: { x: 25, y: 3 }, iron: { x: 4, y: 17 }, ice: { x: 25, y: 17 }, last: { x: 15, y: 3 } };
const hallAt = (w) => ({ map: HALL_ID, x: HALL_LAND[w].x + 0.5, y: HALL_LAND[w].y + 0.5, dir: 'down' });

// 着く 所（A）・上の 階段の となり（U の 下か 横）
const arriveOf = (rows) => { const A = floorPos(rows).arrive; return { x: A.x + 0.5, y: A.y + 0.5, dir: 'up' }; };
export function belowUp(rows) {
  const U = floorPos(rows).up;
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
    const ch = rows[U.y + dy]?.[U.x + dx];
    if (ch === '.') return { x: U.x + dx + 0.5, y: U.y + dy + 0.5, dir: 'down' };
  }
  throw new Error('上り階段のとなりにゆかがない');
}

// 宝箱の 中み（B の C8R_TREASURE。階は moon_1〜last_3）
const chestOf = (mapId) => (k) => c8rChest(mapId, k);
// 守りぬく・一騎うち: 台の 手前の 列に 入ると ためしが 始まる（負けた 時の「もう一度いどむ」の 行き先にも なる）
function altarTrigger(w) {
  return (m, now, P) => {
    const r = trialRectOf[w];
    m.triggers.push({ id: `c8r_trial_${w}`, x: r.x, y: P.altar.y + 1, w: r.w, h: 1, script: `c8r_trial_${w}`, show: { all: [TRIAL_SEEN8R(w)], not: [WING_MARK[w]] } });
  };
}
const trialRectOf = {};

// ためしの 部屋（X の 上の 部屋。X の 行より 上で、X を かこむ かべの 中）
function trialRect(rows) {
  const X = floorPos(rows).door[0];
  if (!X) return null;
  let top = X.y - 1;
  while (top > 0 && rows[top - 1][X.x] !== '#') top--;
  let x0 = X.x, x1 = X.x;
  while (x0 > 0 && rows[X.y - 1][x0 - 1] !== '#') x0--;
  while (x1 < C8R_W - 1 && rows[X.y - 1][x1 + 1] !== '#') x1++;
  return { x: x0, y: top, w: x1 - x0 + 1, h: X.y - top + 1 };
}

// ───── 階の きまり ─────
export const WING_ROWS = { moon: [MOON1, MOON2], fire: [FIRE1, FIRE2], iron: [IRON1, IRON2], ice: [ICE1, ICE2] };
export const WING_LINKS = { moon1: MOON1_LINKS, moon2: MOON2_LINKS, last1: LAST1_LINKS };
export const WING_KINDS = { iron1: IRON1_KINDS, iron2: IRON2_KINDS, last2: LAST2_KINDS };
export const LAST_ROWS = [LAST1, LAST2, LAST3];
export const wingName = (w, n, now) => `${WING_NAME[w]}　${n}階${now ? '（今）' : '（千年前）'}`;
export const lastName = (n, now) => `最後のかいろう　${n}階${now ? '（今）' : '（千年前）'}`;

// 追いかけっこ: 青い 火に 近づくと にげる（2マス いない）・つかまえられる 所では となりに 来ると つかまえる
function chaseTriggers(m, now, P) {
  FIRE2_CHASE.forEach((i, j) => {
    const c = P.spots[i];
    const next = j + 1 < FIRE2_CHASE.length ? CHASE8R(j + 1) : WING_MARK.fire;
    const show = { all: [CHASE8R(j)], not: [next] };
    if (FIRE2_CATCH.includes(j)) m.triggers.push({ id: `c8r_catch_${j}`, x: c.x - 1, y: c.y - 1, w: 3, h: 3, script: `c8r_catch_${j}`, show });
    else m.triggers.push({ id: `c8r_hop_${j}`, x: c.x - 2, y: c.y - 2, w: 5, h: 5, script: `c8r_hop_${j}`, show });
  });
}

function wingSpec(w, n) {
  const rows = WING_ROWS[w][n - 1];
  if (n === 2) trialRectOf[w] = trialRect(rows);
  const fk = floorKey(w, n);
  return {
    fk, wing: w, n, rows,
    mapId: (now) => wingMapId(w, n, now),
    name: (now) => wingName(w, n, now),
    bgm: 'c8r_wing',
    links: WING_LINKS[fk], devKinds: WING_KINDS[fk], frag: FRAG8R[w],
    chase: w === 'fire' && n === 2 ? FIRE2_CHASE : null,
    extra: w === 'fire' && n === 2 ? chaseTriggers : (n === 2 && (w === 'moon' || w === 'ice')) ? altarTrigger(w) : null,
    table: 't8r_wing', spawns: n === 1 ? 3 : 2,
    trial: n === 2 ? trialRect(rows) : null,
    chest: chestOf(wingMapId(w, n)),
    upTo: n === 1 ? (now) => ({ map: wingMapId(w, 2, now), ...arriveOf(WING_ROWS[w][1]) }) : null,
    downTo: n === 2 ? (now) => ({ map: wingMapId(w, 1, now), ...belowUp(WING_ROWS[w][0]) }) : null,
    exitTo: n === 1 ? () => hallAt(w) : null,
    riftTo: n === 2 ? () => hallAt(w) : null,
  };
}
function lastSpec(n) {
  const rows = LAST_ROWS[n - 1];
  const fk = floorKey('last', n);
  return {
    fk, wing: null, n, rows,
    mapId: (now) => lastMapId(n, now),
    name: (now) => lastName(n, now),
    bgm: 'c8r_last',
    links: WING_LINKS[fk], devKinds: WING_KINDS[fk], frag: FRAG8R.last,
    table: 't8r_last', spawns: n === 1 ? 2 : 3,
    chest: chestOf(lastMapId(n)),
    upTo: n < 3 ? (now) => ({ map: lastMapId(n + 1, now), ...arriveOf(LAST_ROWS[n]) }) : () => ({ map: CORE_ID, ...CORE_ARRIVE }),
    downTo: n === 1 ? () => hallAt('last') : (now) => ({ map: lastMapId(n - 1, now), ...belowUp(LAST_ROWS[n - 2]) }),
  };
}
// さいごの 場所に 着く 所（maps/c8r-hall.js の CORE_ROWS の A）
export const CORE_ARRIVE = { x: 10.5, y: 12.5, dir: 'up' };

export const WING_SPECS = Object.fromEntries(WINGS.flatMap((w) => [1, 2].map((n) => [floorKey(w, n), wingSpec(w, n)])));
export const LAST_SPECS = Object.fromEntries([1, 2, 3].map((n) => [floorKey('last', n), lastSpec(n)]));
export const FLOOR_SPECS = { ...WING_SPECS, ...LAST_SPECS };

export const C8R_WING_MAPS = WINGS.flatMap((w) => [1, 2].flatMap((n) => [wingMapId(w, n), wingMapId(w, n, true)]));
export const C8R_LAST_MAPS = [1, 2, 3].flatMap((n) => [lastMapId(n), lastMapId(n, true)]);

export function buildC8rFloors() {
  const maps = {};
  for (const spec of Object.values(FLOOR_SPECS)) {
    if (spec.rows.length !== C8R_H || spec.rows.some((r) => r.length !== C8R_W)) throw new Error(`${spec.fk}の大きさ`);
    for (const now of [false, true]) {
      const m = buildFloor(spec, now);
      maps[m.id] = m;
    }
  }
  return maps;
}
export { CORE_ID };
