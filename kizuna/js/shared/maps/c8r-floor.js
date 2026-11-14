// 第8章 第4幕「時のはざま」（A: 世界と物語）の 階を 作る しくみ（つばさ 4つ × 2階・最後の 回廊 3階。どれも 千年前と 今の 2つの すがた）
// ※ ネタバレ注意（docs/plan-ch8.md の 9）
// ・文字の いみ（maps/c8r-rows.js）。どの 階も おなじ 文字の きまり（つばさごとに 使う 文字が ちがう）
//   どちらの 時代も: # かべ / . ゆか / ~ 時のはざまの 空（通れない）/ w 時の砂の 川（通れない）/ = 時の砂の 浅せ（わたると 時代が 入れかわる）/
//     U 上り 階段 / D 下り 階段 / A 着く 所 / E つばさの 入口（時の広間へ）/ $ 宝箱 / F 休み所の いずみ / M かけらの かべ画 / p 柱 / t たいまつ /
//     k うかぶ かけら（今まで 行った 場所の かけら。つばさごとの タイル）/ R 時の さけめ（ためしを クリアすると 開く 広間への 近道）/
//     T ためしの 台 / X ためしの 部屋の 入口（ここから 先は 時の砂時計が 使えない）
//   時代で ちがう: P 千年前だけ ゆか / N 今だけ ゆか
//   月（鏡。第1幕の おさらい ＋ ひねり）: m 月の 鏡（どちらの 時代でも 回せる）/ a〜d 光の 橋（階ごとの 表 links … [鏡, 回した 時か, 時代]。その 時代だけ）
//   青火（見えない 道。第2幕）: f 青い 火の 台（どちらの 時代でも ともせる。歩くと 消える）/ g よみの道（火の 光の 中で 見える）
//   くろがね（しかけと 残がい。第3幕）: L しかけ（千年前だけ 動かせる）/ 1〜6 今の かたむいた 板（1・3・5 … 動かす 前・2・4・6 … 動かした あと。千年前は 空）
//   氷（すべる 氷。第7章）: I 氷 / i 千年前 氷・今 水 / j 千年前 水・今 氷 / r 千年前 氷の かたまり・今 水たまり / o 水たまり（すべって 来ると 止まる）
//   追いかけっこ（青火のつばさ 2階）: q にげる 青い 火の 来る 所 / v 青い 火が 通ると 見える 道
//   星読みの なぞ（くろがねのつばさ 2階）: l 星の レバー / S 千年前だけの 星の ヒント / Z 今だけの 星の ヒント / * どちらの 時代にも ある 星の ヒント
import { T } from '../tiles.js?v=298589449c4c';
import { parseRows16 } from './past.js?v=298589449c4c';
import {
  HALL_ID, CORE_ID, MIR8R, FIRE8R, DEV8R, CHASE8R, STAR8R, FLOOR_SEEN8R, TRIAL_SEEN8R, WING_MARK, wingMapId, lastMapId, WING_FLOORS, LAST_FLOORS, floorKey,
} from './c8r-flags.js?v=298589449c4c';

// 青い 火の 光の とどく はんい（きょりの 2じょう）。追いかけっこの 道も おなじ
export const LIGHT_R2 = 5;
// 青い 火が 消えるまでの 歩数（world/c8r-steps.js）
export const FIRE_STEPS = 18;

const LINK_LETTERS = ['a', 'b', 'c', 'd'];
const DEV_DIGITS = ['1', '2', '3', '4', '5', '6'];
const BOTH = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '~': T.C8R_VOID, w: T.C8R_SANDFLOW, '=': T.C8R_FORD, U: T.STAIRS_UP, D: T.STAIRS_DOWN, A: T.CAVE_FLOOR, X: T.CAVE_FLOOR,
  E: T.C8R_WINGDOOR, $: T.CAVE_FLOOR, F: T.STAR_FONT, M: T.RUIN_MURAL, p: T.PILLAR, t: T.TORCH, R: T.C8R_VOID, T: T.ALTAR, '*': T.STAR_CHART,
  m: T.C8A_MIRROR_A, f: T.C8B_BRAZIER, g: T.C8R_VOID, L: T.CAVE_FLOOR, I: T.ICE, o: T.C7I_PUDDLE, q: T.CAVE_FLOOR, v: T.C8R_VOID, l: T.LEVER,
};
const PAST_ONLY = {
  P: T.CAVE_FLOOR, N: T.C8R_VOID, i: T.ICE, j: T.CAVE_WATER, r: T.ICE_BLOCK, S: T.STAR_CHART, Z: T.CAVE_FLOOR,
  ...Object.fromEntries(DEV_DIGITS.map((d) => [d, T.C8R_VOID])),
};
const NOW_ONLY = {
  P: T.C8R_VOID, N: T.CAVE_FLOOR, i: T.CAVE_WATER, j: T.ICE, r: T.C7I_PUDDLE, S: T.CAVE_FLOOR, Z: T.STAR_CHART,
  ...Object.fromEntries(DEV_DIGITS.map((d) => [d, Number(d) % 2 ? T.C8C_TILT : T.C8C_CRUSH])),
};
export const c8rLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });

// くろがねの しかけの すがた（[動かして いない, 動かした]）
export const DEVICE_TILES8R = {
  prop: [T.C8C_PROP_ON, T.C8C_PROP_OFF], cannon: [T.C8C_CANNON_L, T.C8C_CANNON_R], shutter: [T.C8C_SHUTTER_OPEN, T.C8C_SHUTTER_SHUT],
};
// 星の レバーの すがた（[引く 前, 引いた あと]。左から 赤・金・青・黄）
export const LEVER_TILES8R = [[T.LEVER_R, T.LEVER_R_ON], [T.LEVER, T.LEVER_ON], [T.LEVER_B, T.LEVER_B_ON], [T.LEVER_Y, T.LEVER_Y_ON]];

export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y, ch }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// レイアウトから 場所を きめる
export function floorPos(rows) {
  return {
    up: one(rows, 'U'), down: one(rows, 'D'), arrive: one(rows, 'A'), exit: one(rows, 'E'), rift: one(rows, 'R'), font: one(rows, 'F'), altar: one(rows, 'T'),
    door: cellsOf(rows, ['X']), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']), fords: cellsOf(rows, ['=']),
    mirrors: cellsOf(rows, ['m']), lights: cellsOf(rows, LINK_LETTERS), fires: cellsOf(rows, ['f']), ways: cellsOf(rows, ['g']),
    devices: cellsOf(rows, ['L']), links: cellsOf(rows, DEV_DIGITS), spots: cellsOf(rows, ['q']), chaseWays: cellsOf(rows, ['v']),
    levers: cellsOf(rows, ['l']), stars: cellsOf(rows, ['*', 'S', 'Z']),
  };
}

// その マスを てらす 青い 火の 台（k の ならび）
export const firesOn = (P, x, y) => P.fires.map((f, k) => ((x - f.x) ** 2 + (y - f.y) ** 2 <= LIGHT_R2 ? k : -1)).filter((k) => k >= 0);
// 今の かたむいた 板（1〜6）の しかけの ばんごう（1・2 … 0 / 3・4 … 1 / 5・6 … 2）と、歩ける ときの しかけの ようす
export const linkDev8r = (ch) => Math.floor((Number(ch) - 1) / 2);
export const linkWalk8r = (ch, moved) => (Number(ch) % 2 === 1) !== moved;

// 時代の 名前（地図・目標の 文の 場所）
export const eraName = (now) => (now ? '今' : '千年前');

// 1つの 階（時代ごと）を 作る
// spec … { fk, mapId, pairId, name, theme, bgm, rows, links, devKinds, chase, frag, upTo, downTo, exitTo, riftTo, wing, table, spawns, trial（ためしの 部屋 { x, y, w, h }）, extra（fn） }
export function buildFloor(spec, now) {
  const { rows, fk } = spec;
  const P = floorPos(rows);
  const t = parseRows16(rows, { ...c8rLegend(now), ...(spec.legend || {}) });
  const m = {
    id: spec.mapId(now), name: spec.name(now), kind: 'dungeon', bgm: spec.bgm, dark: false,
    theme: now ? 'c8r_now' : 'c8r_past', past: !now,
    sky3d: now ? { bg: '#2a2a5a', fog: 0x6a6aa8 } : { bg: '#5a3a6a', fog: 0xc8a8b8 },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => spec.name(now),
    c8rFloor: fk,
    timePair: spec.mapId(!now),
    spawnCounts: spec.spawns ? { [spec.table]: now ? Math.max(1, spec.spawns - 1) : spec.spawns } : {},
  };
  // うかぶ かけら（今まで 行った 場所の かけら。つばさごとの タイルを 場所で まぜる）
  for (const c of cellsOf(rows, ['k'])) m.tiles[c.y * m.w + c.x] = spec.frag[(c.x * 7 + c.y * 3) % spec.frag.length];
  // ためしの 部屋の 中は 時の砂時計が 使えない
  if (spec.trial) {
    const r = spec.trial;
    m.timeSpot = (x, y) => (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h ? 'boss' : null);
  }
  // 階段・入口
  const walkTo = (to) => ({ map: to.map, x: to.x, y: to.y, dir: to.dir || 'down' });
  if (P.up && spec.upTo) { const to = spec.upTo(now); m.warps.push({ x: P.up.x, y: P.up.y, to: walkTo(to) }); m.links.push({ x: P.up.x, y: P.up.y, to: to.map }); }
  if (P.down && spec.downTo) { const to = spec.downTo(now); m.warps.push({ x: P.down.x, y: P.down.y, to: walkTo(to) }); m.links.push({ x: P.down.x, y: P.down.y, to: to.map }); }
  if (P.exit && spec.exitTo) { const to = spec.exitTo(now); m.warps.push({ x: P.exit.x, y: P.exit.y, to: walkTo(to) }); m.links.push({ x: P.exit.x, y: P.exit.y, to: to.map }); }
  // 時の さけめ（ためしを クリアすると 開く 広間への 近道）
  if (P.rift && spec.riftTo) {
    const to = spec.riftTo(now);
    m.gates.push({ x: P.rift.x, y: P.rift.y, closed: T.C8R_VOID, open: T.C8R_RIFT, flag: WING_MARK[spec.wing] });
    m.warps.push({ x: P.rift.x, y: P.rift.y, to: walkTo(to) });
    m.links.push({ x: P.rift.x, y: P.rift.y, to: to.map });
  }
  // 時の砂の 浅せ（わたると その 階の 時代が 入れかわる。world/c8r-steps.js）
  for (const c of P.fords) m.triggers.push({ id: `c8r_ford_${c.x}_${c.y}`, x: c.x, y: c.y, w: 1, h: 1, script: 'c8r_ford' });
  // 月の 鏡（どちらの 時代でも 回せる）と 光の 橋（その 時代だけ。links の 表）
  P.mirrors.forEach((c, k) => {
    m.gates.push({ x: c.x, y: c.y, closed: T.C8A_MIRROR_A, open: T.C8A_MIRROR_B, flag: MIR8R(fk, k) });
    m.actions.push({ x: c.x, y: c.y, script: `c8r_mirror_${fk}_${k}` });
  });
  for (const c of P.lights) {
    const [k, on, era] = spec.links[c.ch];
    if ((era === 'now') !== now) { m.tiles[c.y * m.w + c.x] = T.C8R_VOID; continue; }
    const f = MIR8R(fk, k);
    m.gates.push(on ? { x: c.x, y: c.y, closed: T.C8A_DARKBRIDGE, open: T.C8A_LIGHT, levels: [[f, T.C8A_LIGHT]] } : { x: c.x, y: c.y, closed: T.C8A_LIGHT, open: T.C8A_DARKBRIDGE, levels: [[f, T.C8A_DARKBRIDGE]] });
  }
  // 青い 火の 台と よみの道
  P.fires.forEach((c, k) => {
    m.gates.push({ x: c.x, y: c.y, closed: T.C8B_BRAZIER, open: T.C8B_BRAZIER_ON, flag: FIRE8R(fk, k) });
    m.actions.push({ x: c.x, y: c.y, script: `c8r_fire_${fk}_${k}` });
  });
  for (const c of P.ways) m.gates.push({ x: c.x, y: c.y, closed: T.C8R_VOID, open: T.C8B_SPIRITWAY, levels: firesOn(P, c.x, c.y).map((k) => [FIRE8R(fk, k), T.C8B_SPIRITWAY]) });
  // くろがねの しかけ（千年前だけ 動かせる）と 今の かたむいた 板
  P.devices.forEach((c, k) => {
    const [off, on] = DEVICE_TILES8R[spec.devKinds?.[k] || 'prop'];
    m.tiles[c.y * m.w + c.x] = off;
    m.gates.push({ x: c.x, y: c.y, closed: off, open: on, flag: DEV8R(fk, k) });
    m.actions.push({ x: c.x, y: c.y, script: now ? 'c8r_dev_now' : `c8r_dev_${fk}_${k}` });
  });
  if (now) {
    for (const c of P.links) {
      const f = DEV8R(fk, linkDev8r(c.ch));
      const tile = (moved) => (linkWalk8r(c.ch, moved) ? T.C8C_TILT : T.C8C_CRUSH);
      m.gates.push({ x: c.x, y: c.y, closed: tile(false), open: tile(true), levels: [[f, tile(true)]] });
    }
  }
  // 追いかけっこ: にげる 青い 火（q）と 火が 通ると 見える 道（v）
  if (spec.chase) {
    const S = spec.chase.map((i) => P.spots[i]);
    S.forEach((c, j) => {
      const next = CHASE8R(j + 1), here = CHASE8R(j);
      m.gates.push({ x: c.x, y: c.y, closed: T.CAVE_FLOOR, open: T.C8R_WISP, levels: j + 1 < S.length ? [[next, T.CAVE_FLOOR], [here, T.C8R_WISP]] : [[WING_MARK.fire, T.CAVE_FLOOR], [here, T.C8R_WISP]] });
      m.actions.push({ x: c.x, y: c.y, script: `c8r_wisp_${j}`, show: { all: [here], not: j + 1 < S.length ? [next] : [WING_MARK.fire] } });
    });
    for (const c of P.chaseWays) {
      const near = S.map((s, j) => ((c.x - s.x) ** 2 + (c.y - s.y) ** 2 <= LIGHT_R2 ? j : -1)).filter((j) => j >= 0);
      m.gates.push({ x: c.x, y: c.y, closed: T.C8R_VOID, open: T.C8B_SPIRITWAY, levels: [[WING_MARK.fire, T.C8B_SPIRITWAY], ...near.map((j) => [CHASE8R(j), T.C8B_SPIRITWAY])] });
    }
  }
  // 星読みの なぞ: 星の レバー（左から）・星の ヒント
  P.levers.forEach((c, k) => {
    const [off, on] = LEVER_TILES8R[k];
    m.tiles[c.y * m.w + c.x] = off;
    m.gates.push({ x: c.x, y: c.y, closed: off, open: on, levels: [[WING_MARK.iron, on], [STAR8R(k), on]] });
    m.actions.push({ x: c.x, y: c.y, script: `c8r_lever_${k}` });
  });
  P.stars.forEach((c, k) => {
    if ((c.ch === 'S' && now) || (c.ch === 'Z' && !now)) return;
    m.actions.push({ x: c.x, y: c.y, script: `c8r_star_${fk}_${k}` });
  });
  // ためしの 台・入口
  if (P.altar) m.actions.push({ x: P.altar.x, y: P.altar.y, script: `c8r_trial_${spec.wing}` });
  if (P.door.length && spec.wing) {
    const xs = P.door.map((c) => c.x), ys = P.door.map((c) => c.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    m.triggers.push({ id: `c8r_trial_in_${spec.wing}`, x: x0, y: y0, w: Math.max(...xs) - x0 + 1, h: Math.max(...ys) - y0 + 1, script: `c8r_trial_in_${spec.wing}`, show: { not: [TRIAL_SEEN8R(spec.wing), WING_MARK[spec.wing]] } });
  }
  // 休み所の いずみ・かけらの かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c8r_font' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c8r_mural_${fk}` });
  // 宝箱（どちらの 時代にも おなじ id。片方で 開けると もう 片方も 開いている）
  P.chests.forEach((c, k) => {
    const it = spec.chest?.(k);
    m.chests.push({ id: `c8r_${fk}c${k}`, x: c.x, y: c.y, ...(it || { item: 'star_shard', n: 3 }) });
  });
  // その 階に 来た ときの ことば（1回だけ。着いた 所）
  const a = P.arrive;
  if (a) m.triggers.push({ id: `c8r_f_${fk}`, x: a.x - 2, y: a.y - 1, w: 5, h: 3, script: `c8r_f_${fk}`, show: { not: [FLOOR_SEEN8R(fk)] } });
  // 魔物の 出ない ところ（階段・入口・しかけ・浅せ・ためしの 部屋の まわり）
  m.zoneAt = zoneOf(spec, P, rows);
  spec.extra?.(m, now, P);
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}

const QUIET = new Set(['=', 'm', 'a', 'b', 'c', 'd', 'f', 'g', 'L', ...DEV_DIGITS, 'I', 'i', 'j', 'r', 'o', 'q', 'v', 'l', 'S', 'Z', '*', 'T', 'R', 'E', 'F']);
function zoneOf(spec, P, rows) {
  const safe = [];
  for (const p of [P.up, P.down, P.arrive, P.exit, P.rift, P.font]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  if (spec.trial) safe.push([spec.trial.x - 1, spec.trial.y - 1, spec.trial.x + spec.trial.w, spec.trial.y + spec.trial.h]);
  const near = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (QUIET.has(rows[y + dy]?.[x + dx])) return true;
    return false;
  };
  return (x, y) => {
    if (!spec.table) return 'safe:rest';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    if (near(x, y)) return 'safe:device';
    return spec.table;
  };
}

export { wingMapId, lastMapId, WING_FLOORS, LAST_FLOORS, floorKey, HALL_ID, CORE_ID };
