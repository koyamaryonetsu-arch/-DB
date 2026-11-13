// 第8章 第4幕「時のはざま」の 階の とき方を さがす（テストと 階を 作る ときに 使う。ゲームでは 使わない）
// じょうたい … 時代（'past' / 'now'）・場所・フラグ（鏡・しかけ）・ともっている 青い 火（のこりの 歩数）
// うごき … 歩く（氷は すべる）・時の砂の 浅せ（わたると 時代が 入れかわる）・時の砂時計（向こうの 時代で 立てる 時。ためしの 部屋では 使えない）・
//   鏡を 回す（となり。どちらの 時代でも）・しかけを 動かす（となり。千年前だけ）・青い 火を ともす（となり。どちらの 時代でも）
import { MAPS, isBlocked, condOk, canStand, effectiveTile } from '../public/js/shared/maps/index.js';
import { TILE_INFO, T } from '../public/js/shared/tiles.js';
import { floorPos } from '../public/js/shared/maps/c8r-floor.js';
import { FIRE_STEPS } from '../public/js/shared/maps/c8r-floor.js';
import { MIR8R, DEV8R, FIRE8R } from '../public/js/shared/maps/c8r-flags.js';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// rows … その 階の 文字・fk … 階の 名前・ids … [千年前の マップ, 今の マップ]
// start … { x, y, era }・goal(x, y, s) … ゴールの マス（入る 前に 見る）
export function solveFloor({ rows, fk, ids, start, goal, flags0 = [], glass = true, fords = true, mirrors = true, devices = true, fires = true, fireSteps = FIRE_STEPS, maxStates = 400000 }) {
  const P = floorPos(rows);
  const past = MAPS[ids[0]], now = MAPS[ids[1]];
  const s0 = { era: start.era || 'past', x: start.x, y: start.y, flags: [...flags0].sort(), fire: '' };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.flags.join('|')}:${s.fire}`;
  const seen = new Map([[key(s0), s0]]);
  const parent = new Map([[key(s0), null]]);
  const q = [s0];
  const goals = [];
  const edges = new Map();
  const fireOf = (s) => (s.fire ? Object.fromEntries(s.fire.split(',').map((e) => e.split('=')).map(([k, v]) => [k, Number(v)])) : {});
  const fireStr = (o) => Object.entries(o).filter(([, v]) => v > 0).sort().map(([k, v]) => `${k}=${v}`).join(',');
  const hasOf = (s) => {
    const fo = fireOf(s);
    return (f) => s.flags.includes(f) || (f.startsWith(`c8r_${fk}_f`) && fo[f.slice(`c8r_${fk}_f`.length)] > 0);
  };
  const mapOf = (era) => (era === 'past' ? past : now);
  const solid = (map, x, y, has) => isBlocked(map, x, y, has) || (map.chestAt.has(y * map.w + x)) || map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.floor(m.x) === x && Math.floor(m.y) === y);
  const isIce = (map, x, y, has) => !!TILE_INFO[effectiveTile(map, x, y, has)]?.slide;
  const inTrial = (map, x, y) => !!map.timeSpot?.(x, y);
  let truncated = false;
  while (q.length) {
    if (seen.size > maxStates) { truncated = true; break; }
    const s = q.shift();
    const map = mapOf(s.era);
    const has = hasOf(s);
    const out = [];
    let act = null;
    const push = (ns) => {
      const k = key(ns);
      out.push(k);
      if (!seen.has(k)) { seen.set(k, ns); parent.set(k, [key(s), act]); q.push(ns); }
    };
    // 歩く（1歩で 火の のこりが 1 へる。0 に なったら 消える。消えて 立てない 所に いたら その うごきは なし）
    const step = (ns) => {
      const fo = fireOf(ns);
      for (const k of Object.keys(fo)) fo[k] -= 1;
      ns.fire = fireStr(fo);
      const m2 = mapOf(ns.era);
      if (isBlocked(m2, ns.x, ns.y, hasOf(ns))) return;
      push(ns);
    };
    for (const [dx, dy] of D4) {
      let x = s.x + dx, y = s.y + dy;
      if (solid(map, x, y, has)) continue;
      if (goal(x, y, s)) { goals.push({ ...s, gx: x, gy: y, last: [dx, dy] }); continue; }
      act = { t: 'move', d: [dx, dy] };
      if (map.warpAt.get(y * map.w + x)) continue;
      // 氷: すべる（つぎが ふさがって いるか 氷で ない マスで 止まる）
      while (isIce(map, x, y, has) && !solid(map, x + dx, y + dy, has) && !map.warpAt.get((y + dy) * map.w + x + dx)) { x += dx; y += dy; }
      const ns = { ...s, x, y };
      // 時の砂の 浅せ: 時代が 入れかわる
      if (fords && P.fords.some((c) => c.x === x && c.y === y)) ns.era = s.era === 'past' ? 'now' : 'past';
      step(ns);
    }
    // 時の砂時計
    act = { t: 'glass' };
    if (glass && !inTrial(map, s.x, s.y)) {
      const other = mapOf(s.era === 'past' ? 'now' : 'past');
      if (canStand(other, s.x + 0.5, s.y + 0.5, has) && !other.warpAt.has(s.y * other.w + s.x)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    const near = (p) => Math.abs(p.x - s.x) + Math.abs(p.y - s.y) === 1;
    const toggle = (f) => ({ ...s, flags: (s.flags.includes(f) ? s.flags.filter((v) => v !== f) : [...s.flags, f]).sort() });
    if (mirrors) P.mirrors.forEach((c, k) => { act = { t: 'mirror', k, x: c.x, y: c.y }; if (near(c)) push(toggle(MIR8R(fk, k))); });
    if (devices && s.era === 'past') P.devices.forEach((c, k) => { act = { t: 'dev', k, x: c.x, y: c.y }; if (near(c)) push(toggle(DEV8R(fk, k))); });
    P.fires.forEach((c, k) => {
      if (!fires || !near(c)) return;
      act = { t: 'fire', k, x: c.x, y: c.y };
      const fo = fireOf(s);
      fo[k] = fireSteps;
      push({ ...s, fire: fireStr(fo) });
    });
    edges.set(key(s), out);
  }
  // どこに いても はじめの 所へ もどれるか（とじこめられない）
  const startKeys = new Set([...edges.keys()].filter((k) => { const [, xy] = k.split(':'); const [x, y] = xy.split(',').map(Number); return Math.abs(x - start.x) + Math.abs(y - start.y) <= 1; }));
  const back = new Set(startKeys);
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, o] of edges) if (!back.has(k) && o.some((v) => back.has(v))) { back.add(k); changed = true; }
  }
  const stuck = [...edges.keys()].filter((k) => !back.has(k));
  // はじめの ゴールまでの うごき（ブラウザで たしかめる 時に 使う）
  let plan = null;
  if (goals.length) {
    plan = [{ t: 'move', d: goals[0].last }];
    for (let k = key(goals[0]); parent.get(k); k = parent.get(k)[0]) plan.unshift(parent.get(k)[1]);
  }
  return { goals, seen, stuck, truncated, P, plan };
}

// ためしの 部屋の 入口（X）か 上り 階段（U）
export const goalOf = (P) => (x, y) => (P.up && P.up.x === x && P.up.y === y) || P.door.some((c) => c.x === x && c.y === y);
export { T };
