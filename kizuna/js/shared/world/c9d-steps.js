// 第3部 第1章 第4幕「星のはかば」（A: 世界と 物語）の しくみ「スピカと ふた手に」（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12-2）
// ・ようすは パーティーで 1つ（world.c9dLane。セーブしない）: スピカが 歌って いる 石（spica）・音さで 鳴らした 石の 鳴りおわる 時（forks）・ランプ（lamps）
//   パーティーの だれも 石の ある マップに いなく なると 消える。回線が 切れた 人が いる 時・リーダーが その 階を 出た 時は スピカは リーダーの 所に もどる
// ・ひびきの石を しらべる（台本 c9d_stone_<石の id>）: スピカに 歌って もらう・星の音さを 鳴らす（20秒）・スピカを よぶ
//   組の 石が ぜんぶ 鳴ると 橋が かかる（フラグ c9_echo1〜5 を 世界の もちぬし〈パーティーなら リーダー〉に。開いた まま）。スピカは きらめきと いっしょに もどる
// ・スピカと いっしょの 人が 石を 鳴らすと、向こうの 道の ランプが しばらく 光る
// ・スピカを よぶ … 石・HUD の ボタン（menu の c9dCall）。いつでも やめられる。スピカを ひとりに しても ばつは ない（時間の 切れも ない）
// ・暗い 所だけを 歩く 魔物（MONSTERS[種].darkOnly）は スピカ・光った ランプ・光る こけの 中に 入らない（map.symBlock）
// ・スピカと はなれて いる 人の 戦いには スピカの 助けが ない（spicaAway9d。world/battles.js の hooks.leaderFlag）
import { MAPS } from '../maps/index.js?v=47b761b2972a';
import { MONSTERS } from '../data/monsters.js?v=47b761b2972a';
import { SCRIPTS } from '../data/story.js?v=47b761b2972a';
import { C9D_LANE_MAPS, C9D_SONG_SKILL } from '../maps/c9d-flags.js?v=47b761b2972a';
import { C9A, SPICA_NAME, STAR_FORK } from '../maps/c9a-flags.js?v=47b761b2972a';
import { C9C_MAP } from '../maps/c9c-flags.js?v=47b761b2972a';
import {
  FORK_MS9D, LAMP_MS9D, stonesOf9d, stoneById9d, groupOf9d, ringingIds9d, groupRinging9d, spicaPos9d, withSpica9d, otherLane9d, laneBright9d,
} from '../maps/c9d-lane.js?v=47b761b2972a';
import { stoneScript9d } from '../maps/c9d.js?v=47b761b2972a';
import { partyOf } from './party.js?v=47b761b2972a';
import { c9aLitAt } from './c9a-steps.js?v=47b761b2972a';

const SP = SPICA_NAME;
const N = (...lines) => lines.map((l) => ['say', null, l]);
const S = (who, ...lines) => lines.map((l) => ['say', who, l]);

const states = (world) => world.c9dLane || (world.c9dLane = new Map());
const partyKey = (world, s) => partyOf(world, s)?.id ?? `s:${s.id}`;
const now = (world) => world.now?.() ?? Date.now();
const stoneMaps = () => [C9C_MAP.river, ...C9D_LANE_MAPS];
const hasStones = (mapId) => !!MAPS[mapId]?.c9dStones?.length;

// パーティーの リーダー（いなければ その 人）
export function leaderOf9d(world, s) {
  const p = partyOf(world, s);
  const l = p && world.sessions.get(p.leader);
  return l?.inWorld ? l : s;
}
// パーティーの ようす（make … なければ 作る）
export function laneState9d(world, s, make = true) {
  const k = partyKey(world, s);
  const L = states(world);
  let st = L.get(k);
  if (!st && make) {
    st = { party: k, spica: null, forks: {}, lamps: { L: 0, R: 0 }, ver: 0 };
    L.set(k, st);
  }
  return st || null;
}
// パーティーの 人たち（世界に いる）
function membersOf(world, s) {
  const p = partyOf(world, s);
  const ids = p ? p.members : [s.id];
  return ids.map((id) => world.sessions.get(id)).filter((m) => m?.inWorld);
}

// スピカが 石に のこって いるか（その 人の パーティー）
export const spicaLeft9d = (world, s) => !!laneState9d(world, s, false)?.spica;
// スピカの いる 所（その 人の マップで）
export function spicaAt9d(world, s) {
  const map = MAPS[s.map];
  const st = laneState9d(world, s, false);
  return spicaPos9d(map, st?.spica, leaderOf9d(world, s));
}
// その 人が スピカと はなれて いるか（ふたごの道で スピカの 明かりの 外）。戦いの 助けが ない
export function spicaAway9d(world, s) {
  if (!s || !MAPS[s.map]?.c9dLane) return false;
  return !withSpica9d(s, spicaAt9d(world, s));
}

// だれも いなく なった ようすを 消す・回線が 切れた 人が いる 時・リーダーが その 階に いない 時は スピカを もどす
export function pruneC9d(world) {
  const L = world.c9dLane;
  if (!L?.size) return;
  const t = now(world);
  const keep = new Set();
  for (const m of world.sessions.values()) if (m.inWorld && hasStones(m.map)) keep.add(partyKey(world, m));
  for (const [k, st] of [...L.entries()]) {
    if (!keep.has(k)) { L.delete(k); continue; }
    for (const [id, until] of Object.entries(st.forks)) if (until <= t) delete st.forks[id];
    if (!st.spica) continue;
    const ms = [...world.sessions.values()].filter((m) => m.inWorld && partyKey(world, m) === k);
    const p = ms[0] && partyOf(world, ms[0]);
    const leader = (p && world.sessions.get(p.leader)) || ms[0];
    if (!leader || leader.away || leader.map !== st.spica.map || ms.some((m) => m.away)) returnSpica(world, ms, st, 'lost');
  }
}

// スピカが もどる（きらめき。知らせは マップに いる 人に）
function returnSpica(world, people, st, why) {
  if (!st.spica) return false;
  const mapId = st.spica.map;
  st.spica = null;
  st.ver++;
  for (const m of people) {
    if (!m?.inWorld) continue;
    world.sendSelf(m);
    if (m.map === mapId && why !== 'quiet') world.send(m, { t: 'toast', text: why === 'lost' ? `キラキラ…\n${SP}が、リーダーのところに、もどった。` : `キラキラ…\n${SP}が、きらめきといっしょに、もどってきた！` });
  }
  return true;
}

// 組の 石が ぜんぶ 鳴って いれば 橋を かける（かえす 値: 開いた 時の 台本の つづき）
function checkOpen(world, s, map, stone, run) {
  const st = laneState9d(world, s);
  const ring = ringingIds9d(st, map.id, now(world));
  if (!groupRinging9d(map, stone.echo, ring)) return null;
  const owner = run?.owner || world.hostOf?.(s) || s;
  const f = stone.flag;
  if (owner.char.flags[f]) return null;
  owner.char.flags[f] = true;
  for (const g of groupOf9d(map, stone.echo)) delete st.forks[g.id];
  const back = !!st.spica;
  const people = membersOf(world, s);
  if (back) { st.spica = null; }
  st.ver++;
  world.markDirty();
  for (const m of people) if (m !== s && m.map === map.id) world.send(m, { t: 'toast', text: stone.echo === 1 ? 'ゴゴゴ…！\nひびきのとびらが、開いた！' : 'キイィン…ゴゴゴ…！\n光の橋が、かかった！' });
  const steps = [
    ['sfx', 'door'], ['shake'], ['flash'],
    ...N(stone.echo === 1 ? '2つの石が、いっしょに、ひびいた――\nゴゴゴ…！石のとびらが、ゆっくりと、開いていく…！' : '石が、いっしょに、ひびいた――\nキイィン…！深い谷に、光の橋が、かかった！'),
    ...(back ? [['sfx', 'sparkle'], ...N(`${SP}が、きらめきといっしょに、もどってきた！`)] : []),
    ['sync'],
  ];
  // 場面の つづき（とびら・こだまの 出口。story-c9d.js の C9D_OPEN_STEPS）
  const more = SCRIPTS[`c9d_open${stone.echo}`];
  if (more) steps.push(...(more({ flag: (x) => !!owner.char.flags[x] }) || []));
  return steps;
}

// ひびきの石の しらべる 台本（えらぶ 物は その 時の ようすで かわる）
export function stoneSteps9d(world, s, id, run = null) {
  const map = MAPS[s.map];
  const stone = stoneById9d(map, id);
  if (!stone) return [];
  const has = world.hasFlagFn(s);
  if (has(stone.flag)) return N(stone.echo === 1 ? 'ひびきの石だ。\n…とびらは、もう開いている。' : 'ひびきの石だ。\n…橋は、もう、かかっている。');
  const st = laneState9d(world, s);
  const t = now(world);
  const here = st.spica?.map === map.id && st.spica.id === id;
  const ringing = ringingIds9d(st, map.id, t);
  const sp = spicaPos9d(map, st.spica, leaderOf9d(world, s));
  const owner = run?.owner || world.hostOf?.(s) || s;
  // 星の音さ（第1幕で 手に 入れた 大事な物。フラグ c9_fork でも 見る）
  const fork = !!owner.char.flags?.[C9A.fork] || (owner.char.keyItems || []).includes(STAR_FORK) || (s.char.keyItems || []).includes(STAR_FORK);
  const head = here ? N(`${SP}が、石の前で、歌っている…。（石が、ひびきつづけている）`)
    : ringing.has(id) ? N('ひびきの石が、キイィン…と、鳴っている。') : N('ひびきの石だ。\n大きな、すきとおった石。たたくと、よく、ひびきそうだ…。');
  const call = (fn) => [['call', async (r) => { await r.runSteps(fn(r) || []); }]];
  const labels = [], branches = [];
  if (here) {
    labels.push(`${SP}をよぶ`, 'そのまま歌ってもらう');
    branches.push(call(() => callSteps(world, s)), []);
  } else {
    const canSing = !st.spica && spicaFollowsAll(world, s) && withSpica9d(s, sp);
    if (canSing) { labels.push(`${SP}に、ここで歌ってもらう`); branches.push(call((r) => singSteps(world, s, map, stone, r))); }
    if (fork) { labels.push('星の音さを鳴らす'); branches.push(call((r) => forkSteps(world, s, map, stone, r))); }
    if (st.spica) { labels.push(`${SP}をよぶ`); branches.push(call(() => callSteps(world, s))); }
    labels.push('やめる'); branches.push([]);
  }
  if (labels.length <= 1) return head;
  return [...head, ['choice', 'どうする？', labels, branches]];
}
// スピカが フィールドで ついて 来て いる（c9_child。世界の もちぬし）
const spicaFollowsAll = (world, s) => !!world.worldFlags(s)?.[C9A.child];

function lampsFor(world, s, st, stone, sp) {
  if (!withSpica9d(s, sp)) return;
  st.lamps[otherLane9d(stone.lane)] = now(world) + LAMP_MS9D;
}
function singSteps(world, s, map, stone, run) {
  const st = laneState9d(world, s);
  const sp = spicaPos9d(map, st.spica, leaderOf9d(world, s));
  st.spica = { map: map.id, id: stone.id };
  lampsFor(world, s, st, stone, sp);
  st.ver++;
  for (const m of membersOf(world, s)) world.sendSelf(m);
  const opened = checkOpen(world, s, map, stone, run);
  const steps = [
    ['sfx', 'sparkle'],
    ...N(`${SP}が、ひびきの石の前に立って、歌いはじめた…。\n♪――ラ、ラ、ラ…`),
    ...N('キイィン…\nひびきの石が、歌にこたえて、鳴りはじめた！'),
  ];
  if (opened) return [...steps, ...opened];
  return [
    ...steps,
    ...S(SP, '…わたし、ここで、歌ってる。\n…はやく、もどってきてね。'),
    ...N('（もう片方の石を、星の音さで鳴らそう。まわりは、まっ暗だ。\n光るこけと、ランプを、目じるしに）'),
  ];
}
function forkSteps(world, s, map, stone, run) {
  const st = laneState9d(world, s);
  const sp = spicaPos9d(map, st.spica, leaderOf9d(world, s));
  st.forks[stone.id] = now(world) + FORK_MS9D;
  lampsFor(world, s, st, stone, sp);
  st.ver++;
  for (const m of membersOf(world, s)) world.sendSelf(m);
  const opened = checkOpen(world, s, map, stone, run);
  const steps = [['sfx', 'spell'], ...N('星の音さを、鳴らした。\n――キイィン…！ひびきの石が、鳴りはじめた！（20びょう、鳴りつづける）')];
  if (opened) return [...steps, ...opened];
  const g = groupOf9d(map, stone.echo);
  return [...steps, ...N(g.length > 2 ? '（この組の石は、3つ。ぜんぶ、いっしょに鳴らそう）' : '（もう片方の石も、いっしょに鳴らそう）')];
}
function callSteps(world, s) {
  const st = laneState9d(world, s);
  if (!st.spica) return N(`${SP}は、もう、そばにいる。`);
  returnSpica(world, membersOf(world, s), st, 'quiet');
  return [['sfx', 'sparkle'], ...N(`${SP}をよんだ。\nキラキラ…${SP}が、きらめきといっしょに、もどってきた！`)];
}

// メニュー（HUD の「スピカをよぶ」。services.js の menuAction c9dCall）
export function c9dCallMenu(world, s, reply) {
  const st = laneState9d(world, s, false);
  if (!st?.spica) return reply(false, `${SP}は、そばにいる。`);
  returnSpica(world, membersOf(world, s), st, 'quiet');
  return reply(true, `${SP}をよんだ。\nキラキラ…${SP}が、きらめきといっしょに、もどってきた！`);
}

// snap に のせる パーティーの ようす（石の ある マップに いる 時だけ）。1びょうに 1回 かたづけ
export function c9dSnap(world, s) {
  const t = now(world);
  if (!(world.c9dPruneAt > t - 1000)) { world.c9dPruneAt = t; pruneC9d(world); }
  if (!hasStones(s.map)) return null;
  const st = laneState9d(world, s, false);
  const leader = leaderOf9d(world, s);
  const out = { lead: leader.id };
  if (!st) return out;
  if (st.spica && st.spica.map === s.map) out.at = st.spica.id;
  const ring = Object.entries(st.forks).filter(([, u]) => u > t).map(([id, u]) => [id, u - t]);
  if (ring.length) out.ring = ring;
  const lamps = [Math.max(0, st.lamps.L - t), Math.max(0, st.lamps.R - t)];
  if (lamps[0] || lamps[1]) out.lamps = lamps;
  return out;
}

// フィールドの 連れ（world.js の followerLooks）: スピカが 石に のこって いる 間は ついて 来ない
export const spicaWalks9d = (world, s) => !spicaLeft9d(world, s);

// ───── 魔物 ─────
// 暗い 所だけを 歩く 魔物（darkOnly）は スピカ・光った ランプ・光る こけの 中に 入らない
function brightAt(world, mapId, x, y) {
  const map = MAPS[mapId];
  const t = now(world);
  const seen = new Set();
  for (const m of world.sessions.values()) {
    if (!m.inWorld || m.map !== mapId) continue;
    const k = partyKey(world, m);
    if (seen.has(k)) continue;
    seen.add(k);
    const st = laneState9d(world, m, false);
    const sp = spicaPos9d(map, st?.spica, leaderOf9d(world, m));
    const o = { spica: sp, lamps: { L: (st?.lamps.L || 0) > t, R: (st?.lamps.R || 0) > t } };
    if (laneBright9d(map, o, x, y)) return true;
  }
  return c9aLitAt(world, mapId, x, y);
}
for (const id of C9D_LANE_MAPS) {
  const m = MAPS[id];
  if (!m) continue;
  m.symBlock = (world, sym, x, y) => !!MONSTERS[sym?.sp]?.darkOnly && brightAt(world, id, Math.floor(x), Math.floor(y));
}

// ───── ひびきの石の 台本（SCRIPTS に 入れる。ひとりずつ。物語の 場面は story-c9d.js）─────
for (const id of stoneMaps()) {
  for (const stone of stonesOf9d(MAPS[id])) {
    SCRIPTS[stoneScript9d(stone.id)] = () => [['call', async (run) => { await run.runSteps(stoneSteps9d(run.world, run.init, stone.id, run)); }]];
  }
}

// ───── 戦いの スピカの 助け（world/battles.js の hooks.leaderFlag）─────
// スピカと はなれて いる 人が いる 戦いでは、スピカの 助け（ほのかな光・てらす・星のうた）の フラグを 見せない
export const SPICA_HELP_FLAGS9D = [C9A.child, 'c9_act1', C9D_SONG_SKILL];
export const spicaHelpHidden9d = (world, sessions, id) => SPICA_HELP_FLAGS9D.includes(id) && (sessions || []).some((m) => spicaAway9d(world, m));

