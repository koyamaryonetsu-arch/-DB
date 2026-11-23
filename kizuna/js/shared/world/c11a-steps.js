// 第3部 第3章 第1幕「星の船と、星座の島」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17-3）
// ■ 星の船（星の海 c11_sea）: 海の マスは 船（map.sailable。人ごとに 動く ので 家族は べつべつの 島へ 行ける）。
//   星の 流れ（flow）で 運ぶのは 画面（client/field.js の flow）。はとばは ワープ。サーバーは 何も しない
// ■ ひとふで書きの 星座（星座の 島 c11a_isle1〜3・灯台島の レンズの 星座。map.c11aCons）
// ・星（T.C11A_STAR）の 上で 向きを 入れると（画面が その 向きの 線の マスを しらべる）、線の 上を 次の 星まで うかんで 進む
//   （その 人だけの 台本の ['ride']。とちゅうで 止まれない。着いたら サーバーが 星の 上に 置く）
// ・通った 線は パーティーと 星座ごとに おぼえる（world.c11aSt。セーブしない）。だれが 通った 線も 光る（家族 2人なら ふたふで）
// ・同じ 線は 1回だけ。ながれ星の 線は 矢じるしの 向きだけ。ふたご星は 着くと もう 片方へ
// ・全部の 線が 光ると 星座が できる（その 島に いる パーティーで 見る 台本 c11a_done_<星座>。フラグは リーダーの 物）
// ・行ける 線が なくなったら（星座に いる だれも 進めない）、線が 消えて はじめの 星へ（ばつは なし）。星を しらべて「やり直す」も できる
//   線を 引いた まま だれも いなく なっても（地面へ おりた）、線は 消える
// ・やり直した 回数: 3回 … スピカが 始める 星を 光らせる / 6回 … 次に 進む 線を 1本ずつ 光らせる（snap の c11a）
// ■ 回線が 切れて もどった 時: 星座の 上（星・線の 上）なら その 星座の 地面へ
import { MAPS, canStand, standSpot } from '../maps/index.js?v=f8927db0fd05';
import { C11A_HELP_START, C11A_HELP_LINE } from '../maps/c11a-flags.js?v=f8927db0fd05';
import { CON_DIRS, lineFrom11a, landOf11a, movesFrom11a, fullMask11a, solveFrom11a, solve11a, lineCells11a } from '../data/constellations-c11a.js?v=f8927db0fd05';
import { SCRIPTS } from '../data/story.js?v=f8927db0fd05';
import { ScriptRun, scriptCtx, runSteps } from './scripts.js?v=f8927db0fd05';

const SP = 'スピカ';
const RIDE_SPEED = 3.4; // うかんで 進む はやさ（マス/びょう）
const partyKey = (s) => s?.partyId || s?.id;
const store = (world) => world.c11aSt || (world.c11aSt = new Map());
const keyOf = (s, map, con) => `${partyKey(s)}|${map}|${con.id}`;
const stOf = (world, s, con, map = s.map) => {
  const k = keyOf(s, map, con);
  let st = store(world).get(k);
  if (!st) { st = { used: 0, retries: 0, entry: new Map() }; store(world).set(k, st); }
  return st;
};
const peek = (world, s, con, map = s.map) => store(world).get(keyOf(s, map, con)) || null;

// ───── 星座を さがす ─────
// 見えて いる 星座（灯台の レンズの 星座は c11a_lens の 間だけ）
export const conShown11a = (con, has) => (con.show ? has(con.show) && !has(con.id) : true);
export function consOf11a(map, has) {
  return (map?.c11aCons || []).filter((C) => conShown11a(C, has));
}
// (x, y) の 星（{ con, i }）
export function starAt11a(map, x, y, has) {
  for (const con of consOf11a(map, has)) {
    const i = con.stars.findIndex(([sx, sy]) => sx === x && sy === y);
    if (i >= 0) return { con, i };
  }
  return null;
}
// (x, y) が 星座の 中（星か 線か 空。星の 外わくの 中）
export function conBoxAt11a(map, x, y, has) {
  for (const con of consOf11a(map, has)) {
    const xs = con.stars.map((p) => p[0]), ys = con.stars.map((p) => p[1]);
    if (x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys)) return con;
  }
  return null;
}
const tileOf = (s) => [Math.floor(s.x), Math.floor(s.y)];
// 同じ マップに いる 同じ パーティーの 人
const mates = (world, s) => [...world.sessions.values()].filter((m) => m.inWorld && m.char && m.map === s.map && partyKey(m) === partyKey(s));
// 星座の 星の 上に 立って いる 人（うかんで いる 人は 入れない）
function standers(world, s, con) {
  const has = world.hasFlagFn(s);
  return mates(world, s).filter((m) => !m.c11aRide && starAt11a(MAPS[m.map], ...tileOf(m), has)?.con === con);
}
const riders = (world, s, con) => mates(world, s).filter((m) => m.c11aRide?.con === con.id);
const starOf = (world, m, con) => {
  const st = starAt11a(MAPS[m.map], ...tileOf(m), world.hasFlagFn(m));
  return st?.con === con ? st.i : -1;
};

// ───── 進む ─────
// 星 i から 向き dir へ。true … しらべた ことに した（ほかの しらべる を しない）
function go(world, s, con, i, dir) {
  const has = world.hasFlagFn(s);
  if (has(con.id)) {
    world.send(s, { t: 'toast', text: `星座「${con.name}」は、もう、できている。` });
    return true;
  }
  const L = lineFrom11a(con, i, dir);
  if (!L) return false;
  if (L.blocked) {
    world.send(s, { t: 'toast', sfx: 'buzz', text: 'ながれ星の線だ。\n矢じるしの向きにしか、進めない！' });
    return true;
  }
  const st = stOf(world, s, con);
  if (st.used & (1 << L.k)) {
    world.send(s, { t: 'toast', sfx: 'buzz', text: 'その線は、もう光っている。\n（同じ線は、1回だけ）' });
    return true;
  }
  st.used |= 1 << L.k;
  const to = con.stars[L.to];
  const pts = [...lineCells11a(con, L.k), to].map(([x, y]) => [x + 0.5, y + 0.5]);
  s.c11aRide = { con: con.id, map: s.map, to: L.to, at: world.now() };
  runSteps(world, s, [
    ['sfx', 'sparkle'],
    ['ride', pts, RIDE_SPEED],
    ['sync'],
    ['call', async () => { arrive(world, s, con); }],
  ]);
  return true;
}
// 着いた（ふたご星なら もう 片方へ）
function arrive(world, s, con) {
  const R = s.c11aRide;
  if (!R || R.con !== con.id) return;
  delete s.c11aRide;
  if (!world.sessions.has(s.id) || s.map !== R.map) return;
  const land = landOf11a(con, R.to);
  const [x, y] = con.stars[land];
  world.placeSession(s, s.map, x + 0.5, y + 0.5, s.dir, true);
  s.c11aLast = { map: s.map, con: con.id, i: land };
  if (land !== R.to) world.send(s, { t: 'toast', sfx: 'spell', text: 'ふたご星だ！\nもう片方の星から、出てきた！' });
  evaluate(world, s, con);
}
// 星座が できたか・だれも 進めないか・だれも いないか
function evaluate(world, s, con) {
  const has = world.hasFlagFn(s);
  if (has(con.id)) return;
  const st = peek(world, s, con);
  if (!st || !st.used) return;
  if (st.used === fullMask11a(con)) {
    if (!st.done) { st.done = true; (world.c11aDone || (world.c11aDone = [])).push({ sid: s.id, con, map: s.map }); }
    return;
  }
  if (riders(world, s, con).length) return;
  const on = standers(world, s, con);
  if (!on.length) return reset(world, s, con, 'left');
  if (on.every((m) => !movesFrom11a(con, starOf(world, m, con), st.used).length)) reset(world, s, con, 'stuck');
}
// 線を 消して はじめの 星へ（why … 'stuck' 行ける 線が ない / 'left' だれも いない / 'retry' やり直す）
export function reset11a(world, s, con, why) { return reset(world, s, con, why); }
function reset(world, s, con, why) {
  const st = stOf(world, s, con);
  st.used = 0;
  st.done = false;
  st.retries++;
  const text = why === 'stuck' ? '行ける線が、なくなった…。\n線が、すうっと消えて、はじめの星へ、もどった。'
    : why === 'retry' ? '線が、すうっと、消えた。\nはじめから、やり直そう。' : '線が、すうっと、消えた…。';
  const help = st.retries === C11A_HELP_START ? `\n${SP}「…光っている星から、はじめてみて」`
    : st.retries === C11A_HELP_LINE ? `\n${SP}「…次に行く線を、光らせるね」` : '';
  const on = standers(world, s, con);
  for (const m of on) {
    const back = st.entry.get(m.id) ?? con.entries[0];
    const [x, y] = con.stars[back];
    if (starOf(world, m, con) !== back) world.placeSession(m, m.map, x + 0.5, y + 0.5, m.dir, true);
    m.c11aLast = { map: m.map, con: con.id, i: back };
  }
  for (const m of new Set([s, ...on])) world.send(m, { t: 'toast', ...(why === 'stuck' ? { sfx: 'buzz' } : {}), text: text + help });
  world.markDirty?.();
}

// ───── しらべる（world.js の onInteract から。true … ここで おしまい）─────
export function c11aInteract(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11aCons || s.c11aRide) return false;
  const has = world.hasFlagFn(s);
  const [mx, my] = tileOf(s);
  const mine = starAt11a(map, mx, my, has);
  if (mine) {
    const dir = Object.keys(CON_DIRS).find((d) => CON_DIRS[d][0] === tx - mx && CON_DIRS[d][1] === ty - my);
    if (dir && lineFrom11a(mine.con, mine.i, dir)) return go(world, s, mine.con, mine.i, dir);
  }
  const target = starAt11a(map, tx, ty, has) || mine;
  if (!target) return false;
  starMenu(world, s, target.con);
  return true;
}
function starMenu(world, s, con) {
  const has = world.hasFlagFn(s);
  if (has(con.id)) return runSteps(world, s, [['say', null, `星座「${con.name}」の、星だ。\nやさしく、光っている。`]]);
  const st = peek(world, s, con);
  if (!st?.used) return runSteps(world, s, [['say', null, '星座の、星だ。\n星の上で、むきを入れると、線の上を、ふわりと進む。']]);
  runSteps(world, s, [
    ['choice', '光った線を、消して、やり直す？', ['やり直す', 'やめる'], [[['call', async () => { reset(world, s, con, 'retry'); }]], []]],
  ]);
}

// ───── 歩いた（world.js の onEnterTile から。星に 入った・星から 地面へ おりた）─────
export function stepC11a(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11aCons) return false;
  const has = world.hasFlagFn(s);
  const here = starAt11a(map, tx, ty, has);
  const last = s.c11aLast && s.c11aLast.map === s.map ? s.c11aLast : null;
  if (here) {
    // 地面から 星に 入った: その 人の はじめの 星（やり直しで もどる 所）
    if (!last || last.con !== here.con.id) stOf(world, s, here.con).entry.set(s.id, here.i);
    s.c11aLast = { map: s.map, con: here.con.id, i: here.i };
    return false;
  }
  s.c11aLast = null;
  if (last) {
    const con = map.c11aCons.find((C) => C.id === last.con);
    if (con) evaluate(world, s, con);
  }
  return false;
}

// ───── できた 星座の 台本（tick から。うかんで いる 台本が おわった あと）─────
function startDone(world, d) {
  const s = world.sessions.get(d.sid);
  if (!s || !s.inWorld || s.map !== d.map) return true;
  if (s.busy) return false;
  const owner = world.hostOf?.(s) || s;
  const fn = SCRIPTS[`c11a_done_${d.con.id}`];
  const steps = fn ? fn(scriptCtx(s, owner, world)) : [];
  if (!steps.length) return true;
  const parts = [s, ...mates(world, s).filter((m) => m !== s && !m.busy && !m.away)];
  new ScriptRun(world, s, parts, steps, { scriptId: `c11a_done_${d.con.id}`, owner }).start();
  return true;
}
// 台本の call から: 星座の 上に いる 人を 地面へ おろす（星座が できた 時）
export function landAll11a(world, s, conId) {
  const map = MAPS[s.map];
  const con = map?.c11aCons?.find((C) => C.id === conId);
  if (!con) return;
  for (const m of mates(world, s)) {
    const [mx, my] = tileOf(m);
    if (!con.stars.some(([x, y]) => x === mx && y === my)) continue;
    const p = canStand(map, con.land.x + 0.5, con.land.y + 0.5, world.hasFlagFn(m)) ? { x: con.land.x + 0.5, y: con.land.y + 0.5 } : standSpot(map, con.land.x + 0.5, con.land.y + 0.5, world.hasFlagFn(m));
    world.placeSession(m, m.map, p.x, p.y, 'down', true);
    m.c11aLast = null;
  }
  store(world).delete(keyOf(s, s.map, con));
}

// ───── まいフレーム ─────
export function tickC11a(world) {
  // できた 星座の 台本
  if (world.c11aDone?.length) world.c11aDone = world.c11aDone.filter((d) => !startDone(world, d));
  // うかんで いる まま 長く 着かない（回線が 切れた など）→ 着いた ことに する
  for (const s of world.sessions.values()) {
    const R = s.c11aRide;
    if (!R || s.busy) continue;
    const con = MAPS[s.map]?.c11aCons?.find((C) => C.id === R.con);
    if (con) arrive(world, s, con);
    else delete s.c11aRide;
  }
  // だれも いなく なった パーティーの 星座は わすれる
  if (!world.c11aSt?.size) return;
  const here = new Set();
  for (const s of world.sessions.values()) if (s.inWorld) here.add(`${partyKey(s)}|${s.map}`);
  for (const k of [...world.c11aSt.keys()]) {
    const [p, m] = k.split('|');
    if (!here.has(`${p}|${m}`)) world.c11aSt.delete(k);
  }
}

// 回線が 切れて もどった（world.js の onPlay・resumeSession。場所は もう 決まって いる）: 星座の 上なら 地面へ
export function c11aOnPlay(world, s) {
  const map = MAPS[s.map];
  if (!map?.c11aCons) return false;
  delete s.c11aRide;
  const con = conBoxAt11a(map, Math.floor(s.x), Math.floor(s.y), world.hasFlagFn(s));
  if (!con) return false;
  s.x = con.land.x + 0.5;
  s.y = con.land.y + 0.5;
  s.c11aLast = null;
  return true;
}

// snap に のせる（星座の ある マップに いる 時だけ）: { [星座]: { u: 光った 線（ビット）, r: やり直した 回数, hs: 光らせる 星, hl: 光らせる 線 } }
export function c11aSnap(world, s) {
  const map = MAPS[s.map];
  if (!map?.c11aCons) return null;
  const has = world.hasFlagFn(s);
  const out = {};
  for (const con of consOf11a(map, has)) {
    if (has(con.id)) { out[con.id] = { u: fullMask11a(con), d: 1 }; continue; }
    const st = peek(world, s, con);
    const o = { u: st?.used || 0, r: st?.retries || 0 };
    if (o.r >= C11A_HELP_START && !o.u) {
      const sol = solve11a(con, con.entries);
      if (sol) o.hs = sol.start;
    }
    if (o.r >= C11A_HELP_LINE && o.u) {
      const i = starOf(world, s, con);
      const path = i >= 0 ? solveFrom11a(con, i, o.u) : null;
      if (path?.length) o.hl = path[0].k;
    }
    out[con.id] = o;
  }
  return Object.keys(out).length ? out : null;
}
// その パーティーの 星座の 今（テスト・台本）
export const conState11a = (world, s, con) => peek(world, s, con);

// 台本から つかう（world.c11a。data/story-c11a.js）
export const C11A_API = { landAll: landAll11a, reset: reset11a, state: conState11a };
