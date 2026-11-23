// 第3部 第3章 第2幕「月の都と、名前のランプ」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18-3）
// ■ おもてと うら（月の都 c11b_front ⇔ c11b_back・名前の 塔 c11b_tower<n> ⇔ c11b_towerb<n>。map.c11b）
// ・月かげの 戸（T.C11B_DOOR）に 乗って A（しらべる）… 同じ 場所の もう 片方へ（その 人と「ついていく」の 仲間。家族は 分かれても よい）
// ・月の 光の ゆか（おもて）を ふむ … うらの 同じ 場所の とびらが 開く（しるし c11b_d<n>。リーダーの フラグ ＝ パーティーで 同じ。開いた まま）
// ・ランプ（おもて）を しらべる … ともる（同じ マップの ほかの 色の ランプは 消える）。うらの かげの 橋の 場所が かわる
//   橋が 消えて 立てなく なった 人は、近くの 立てる マスへ（hazards.js の unstickAll）
// ・家族が おもてと うらに 分かれて いても、ゆか・ランプは 同時に きく（もう 片方の 人に 知らせる）。ひとりでも 必ず とける
// ■ 助け（ホタル）: 同じ 区切りで C11B_HELP_STEPS 歩 歩いても すすまない（しるしが かわらない）と、次の 戸
//   （その 前に ゆか・ランプが あれば それ）を 光らせる（snap の c11b.h）。人ごと・セーブしない
// ■ 回線が 切れて もどった 時: 立てない 所（消えた 橋の 上 など）なら 近くの 立てる マス
// ■ 道さがし（solve11b）: 区切りの 入口から 出口まで（テスト・助け）。人は 1人と して さがす（戸・ゆか・ランプを 使う）
import { MAPS, isBlocked } from '../maps/index.js';
import { T } from '../tiles.js';
import { C11B_PAIRS, C11B_HELP_STEPS, C11B } from '../maps/c11b-flags.js';
import { C11B_SECTIONS } from '../maps/c11b-rows.js';
import { partyOf } from './party.js';
import { unstickAll, nearestFree } from './hazards.js';
import { runSteps } from './scripts.js';

const SIDE_NAME = ['おもて', 'うら'];
const tileOf = (s) => [Math.floor(s.x), Math.floor(s.y)];
const leaderOf = (world, s) => world.hostOf?.(s) || s;

// ───── くみ（おもてと うら）─────
export function pairOf11b(n) {
  const maps = C11B_PAIRS[n].map((id) => MAPS[id]);
  const F = maps[0].c11b;
  const floors = F.floors, lamps = F.lamps;
  const flags = [...new Set([...floors, ...lamps].map((q) => q.f))];
  return { maps, floors, lamps, flags };
}
// 区切り（その マップの その マスが どの 区切りか）
export function sectionAt11b(map, x, y) {
  const c = map?.c11b;
  if (!c) return null;
  return C11B_SECTIONS.find((S) => S.pair === c.pair && S.at(c.side, x, y)) || null;
}
// 助けを 出す 区切りか（町の 区切りは きまりを 聞いた あと。塔は いつでも）
const helpOn = (S, has) => (S.pair === 0 ? has(C11B.rule) : true);

// ───── 道さがし ─────
// 状態: side・x・y・mask（くみの しるしの ビット）。うごき: 歩く（光の ゆかを ふむと しるし）・戸・ランプ（となりで しらべる）
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function stepper(P, base) {
  const { maps, floors, lamps, flags } = P;
  const hasM = (mask) => (f) => { const i = flags.indexOf(f); return i >= 0 ? !!(mask & (1 << i)) : base(f); };
  const bit = (f) => 1 << flags.indexOf(f);
  const lampGroup = lamps.reduce((g, L) => g | bit(L.f), 0);
  const blocked = (side, x, y, mask) => {
    const m = maps[side];
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    if (isBlocked(m, x, y, hasM(mask))) return true;
    const k = y * m.w + x;
    if (m.chestAt?.has(k)) return true;
    return false;
  };
  const isWarp = (side, x, y) => !!maps[side].warpAt?.has(y * maps[side].w + x);
  // st … [side, x, y, mask] から 行ける 次の 状態 [[状態, うごき], …]
  return (st, goalKey) => {
    const [side, x, y, mask] = st;
    const out = [];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (blocked(side, nx, ny, mask)) continue;
      if (isWarp(side, nx, ny) && `${side},${nx},${ny}` !== goalKey) continue;
      let nm = mask;
      const F = side === 0 ? floors.find((q) => q.x === nx && q.y === ny) : null;
      if (F) nm |= bit(F.f);
      out.push([[side, nx, ny, nm], F && nm !== mask ? { kind: 'floor', x: nx, y: ny } : null]);
    }
    if (maps[side].tiles[y * maps[side].w + x] === T.C11B_DOOR && !blocked(1 - side, x, y, mask)) out.push([[1 - side, x, y, mask], { kind: 'door', x, y }]);
    if (side === 0) {
      for (const L of lamps) {
        if (Math.abs(L.x - x) + Math.abs(L.y - y) !== 1) continue;
        const nm = (mask & ~lampGroup) | bit(L.f);
        if (nm !== mask) out.push([[side, x, y, nm], { kind: 'lamp', x: L.x, y: L.y }]);
      }
    }
    return out;
  };
}
const keyOf = (st) => st.join(',');
// from … { side, x, y }・has … いまの しるし（リーダーの フラグ）→ 出口までの うごき（null … とどかない）
export function solve11b(S, from, has = () => false) {
  const P = pairOf11b(S.pair);
  const next = stepper(P, has);
  const mask0 = P.flags.reduce((m, f, i) => (has(f) ? m | (1 << i) : m), 0);
  const goalKey = `${S.goal.side},${S.goal.x},${S.goal.y}`;
  const s0 = [from.side, from.x, from.y, mask0];
  const prev = new Map([[keyOf(s0), null]]);
  const q = [s0];
  for (let h = 0; h < q.length; h++) {
    const st = q[h];
    if (`${st[0]},${st[1]},${st[2]}` === goalKey) {
      const path = [];
      for (let k = keyOf(st); prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k));
      return path;
    }
    for (const [n, act] of next(st, goalKey)) {
      const k = keyOf(n);
      if (prev.has(k)) continue;
      prev.set(k, { from: keyOf(st), st: n, act });
      q.push(n);
    }
  }
  return null;
}
// 入口から 行ける 状態（テスト: どの 状態からも 出口へ 行ける ＝ 行き止まりが ない）
export function reachable11b(S, has = () => false) {
  const P = pairOf11b(S.pair);
  const next = stepper(P, has);
  const goalKey = `${S.goal.side},${S.goal.x},${S.goal.y}`;
  const s0 = [S.start.side, S.start.x, S.start.y, 0];
  const seen = new Map([[keyOf(s0), s0]]);
  const q = [s0];
  for (let h = 0; h < q.length; h++) {
    if (`${q[h][0]},${q[h][1]},${q[h][2]}` === goalKey) continue;
    for (const [n] of next(q[h], goalKey)) {
      const k = keyOf(n);
      if (seen.has(k)) continue;
      seen.set(k, n);
      q.push(n);
    }
  }
  return { states: [...seen.values()], flags: P.flags };
}
// 助け: 次に する こと（いちばん はじめの 戸・ゆか・ランプ）
export function nextHint11b(S, from, has) {
  const path = solve11b(S, from, has);
  if (!path) return null;
  const act = path.find((p) => p.act)?.act;
  return act || null;
}

// ───── しるしを かえる（リーダーの フラグ）─────
function setMarks(world, s, on, off, text, otherText) {
  const owner = leaderOf(world, s);
  const c = owner.char;
  let changed = false;
  for (const f of on) if (!c.flags[f]) { c.flags[f] = true; changed = true; }
  for (const f of off) if (c.flags[f]) { delete c.flags[f]; changed = true; }
  if (!changed) return false;
  world.markDirty?.();
  // 消えた 橋の 上に いた 人は よける
  unstickAll(world, owner);
  const p = partyOf(world, owner);
  const people = p ? p.members.map((id) => world.sessions.get(id)).filter((m) => m?.inWorld) : [owner];
  if (!people.includes(s)) people.push(s);
  const pair = MAPS[s.map]?.c11b?.pair;
  for (const m of people) {
    world.sendSelf(m);
    if (m === s) world.send(m, { t: 'toast', sfx: 'spell', text });
    else if (MAPS[m.map]?.c11b?.pair === pair) world.send(m, { t: 'toast', sfx: 'spell', text: `${s.char.name}が、${otherText}` });
  }
  if (p && p.members.length > 1) world.sendParty(p);
  return true;
}

// ───── 月かげの 戸 ─────
function moveFollowers(world, s, fromMap, fx, fy, to, x, y) {
  const p = partyOf(world, s);
  if (!p || p.leader !== s.id) return;
  for (const sid of p.members) {
    const m = world.sessions.get(sid);
    if (!m || m === s || !m.follow || m.busy || m.away || !m.inWorld || m.map !== fromMap) continue;
    if (Math.hypot(m.x - fx, m.y - fy) > 12) continue;
    world.placeSession(m, to, x, y, m.dir, true);
  }
}
function useDoor(world, s) {
  const map = MAPS[s.map];
  const to = map.c11b.other;
  const [tx, ty] = tileOf(s);
  const x = tx + 0.5, y = ty + 0.5;
  const from = s.map, fx = s.x, fy = s.y;
  const side = MAPS[to].c11b.side;
  runSteps(world, s, [
    ['sfx', 'spell'],
    ['fade', 'out'],
    ['sync'],
    ['call', async () => {
      if (!world.sessions.has(s.id) || s.map !== from) return;
      world.placeSession(s, to, x, y, s.dir, true);
      moveFollowers(world, s, from, fx, fy, to, x, y);
      s.c11bHelp = null;
    }],
    ['fade', 'in'],
  ]);
  world.send(s, { t: 'toast', text: `月かげの戸を、くぐった。\n――${SIDE_NAME[side]}に、出た。` });
}

// ───── しらべる（world.js の onInteract から。true … ここで おしまい）─────
export function c11bInteract(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11b) return false;
  const [mx, my] = tileOf(s);
  // 戸の 上で A
  if (map.tiles[my * map.w + mx] === T.C11B_DOOR) {
    useDoor(world, s);
    return true;
  }
  // 戸の となりで 戸を しらべた
  if (map.tiles[ty * map.w + tx] === T.C11B_DOOR) {
    runSteps(world, s, [['say', null, '地面に、三日月のしるしがある。\n（上に乗って、しらべると、もう片方の町へ行ける）']]);
    return true;
  }
  // ランプ（おもて）
  const L = map.c11b.side === 0 ? map.c11b.lamps.find((q) => q.x === tx && q.y === ty) : null;
  if (L) {
    const has = world.hasFlagFn(s);
    if (has(L.f)) {
      world.send(s, { t: 'toast', text: 'ランプは、もう、ともっている。' });
      return true;
    }
    const off = [...new Set(map.c11b.lamps.map((q) => q.f))].filter((f) => f !== L.f);
    const color = L.c === 'b' ? '金' : '青';
    setMarks(world, s, [L.f], off, `${color}いランプが、ともった！\nうらの、かげが、ゆらりと動いた…。`, `おもてで、${color}いランプを、ともした！\nかげの橋が、動いた…。`);
    return true;
  }
  return false;
}

// ───── 歩いた（world.js の onEnterTile から）: 光の ゆか・助けの 歩数 ─────
export function stepC11b(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11b) { s.c11bHelp = null; return false; }
  const has = world.hasFlagFn(s);
  if (map.c11b.side === 0) {
    const F = map.c11b.floors.find((q) => q.x === tx && q.y === ty);
    if (F && !has(F.f)) setMarks(world, s, [F.f], [], '月の光のゆかが、光った！\nうらで、とびらの開く音がした…。', 'おもてで、光のゆかを、ふんだ！\nとびらが、開いた！');
  }
  // 助け
  const S = sectionAt11b(map, tx, ty);
  if (!S || !helpOn(S, has)) { s.c11bHelp = null; return false; }
  const P = pairOf11b(S.pair);
  const key = `${S.id}|${P.flags.map((f) => (has(f) ? 1 : 0)).join('')}`;
  if (!s.c11bHelp || s.c11bHelp.key !== key) s.c11bHelp = { key, n: 0, hint: null };
  const H = s.c11bHelp;
  H.n++;
  if (H.n >= C11B_HELP_STEPS) {
    const was = H.hint;
    H.hint = nextHint11b(S, { side: map.c11b.side, x: tx, y: ty }, has);
    if (H.hint && !was) world.send(s, { t: 'toast', text: 'ホタル「…こっち、こっち！」\n（小さな光が、次の場所を、てらしている）' });
  }
  return false;
}

// 回線が 切れて もどった（world.js の onPlay・resumeSession）: 立てない 所なら 近くの 立てる マス
export function c11bOnPlay(world, s) {
  const map = MAPS[s.map];
  if (!map?.c11b) return false;
  s.c11bHelp = null;
  const has = world.hasFlagFn(s);
  if (!isBlocked(map, Math.floor(s.x), Math.floor(s.y), has)) return false;
  const to = nearestFree(map, s.x, s.y, has);
  if (!to) return false;
  s.x = to.x + 0.5;
  s.y = to.y + 0.5;
  return true;
}

// snap に のせる（おもて・うらの マップに いる 時だけ。助けが ある 時）: { h: [x, y, 'door' | 'floor' | 'lamp'] }
export function c11bSnap(world, s) {
  const map = MAPS[s.map];
  if (!map?.c11b) return null;
  const H = s.c11bHelp?.hint;
  return H ? { h: [H.x, H.y, H.kind] } : null;
}
