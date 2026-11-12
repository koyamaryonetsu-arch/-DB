// 第78回 3-10: 家族ミッション・家族の記録（サーバーで 数える。docs/plan-r78-mission.md）
//
// ・数えるのは 人間の キャラが 2人 いじょう いっしょの 時だけ（同じ パーティーで 同じ 戦い・同じ マップ）。
//   クライアントの 申告は 信じない（戦いの 終わり・宝箱・階だんで サーバーが 足す）
// ・ひとりモード（world.offline）では 何も 数えない・何も 書かない（画面は「家族サーバーでいっしょに遊ぶと進みます」）
// ・しまう 場所: 家族サーバーの 世界の 側（world.data.missions。キャラの 引っこしコードには 入れない）
//     week … 今週 { no, list:[{k,need}], prog, at, by:{キャラid:{name,n,b,k}}, got:{キャラid:[0/1…]}, kinds, floors, full, fullCred }
//     prev … 先週（次の 週の 間だけ ごほうびを 受けとれる）
//     total … 家族の 記録 { kills, wins, battles, full, done, weeks, boss:{魔物:数} }
//     fullBy … キャラごとの 3つとも 達成した 週の 合計 / hist … さいきんの 週（12こまで）
// ・キャラに 持たせるのは しょうごう・スタンプ だけ（c.famm。data/missions.js）
import {
  MISSIONS, WEEK_PICK, weekNo, weekStart, daysLeft, missionText, openKinds, pickWeek, weekReward,
  MILESTONES, milestoneOf, nextMilestone, earnedOf, wornTitle, DAY_MS,
} from '../data/missions.js?v=eb1c3a4395d7';
import { MONSTERS } from '../data/monsters.js?v=eb1c3a4395d7';
import { ITEMS } from '../data/items.js?v=eb1c3a4395d7';
import { MAPS } from '../maps/index.js?v=eb1c3a4395d7';
import { addItem } from '../stats.js?v=eb1c3a4395d7';
import { partyOf } from './party.js?v=eb1c3a4395d7';

const HIST_MAX = 12;
const FLOOR_MAX = 300;
const ACTIVE_MS = 28 * DAY_MS;
const num = (v) => (Number.isFinite(v) ? v : 0);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ───────────── 状態 ─────────────
function cleanWeek(w) {
  if (!w || typeof w !== 'object' || !Number.isInteger(w.no) || !Array.isArray(w.list)) return null;
  const list = w.list.filter((m) => m && MISSIONS[m.k]).slice(0, WEEK_PICK).map((m) => ({ k: m.k, need: Math.max(1, Math.floor(num(m.need)) || MISSIONS[m.k].need) }));
  if (!list.length) return null;
  const arr = (v) => list.map((_, i) => Math.max(0, num(Array.isArray(v) ? v[i] : 0)));
  const by = {};
  for (const [id, e] of Object.entries(obj(w.by))) {
    if (!e || typeof e !== 'object') continue;
    by[id] = { name: String(e.name || '').slice(0, 20), n: arr(e.n), b: num(e.b), k: num(e.k) };
  }
  const got = {};
  for (const [id, g] of Object.entries(obj(w.got))) got[id] = arr(g).map((x) => (x ? 1 : 0));
  return {
    no: w.no, list, prog: arr(w.prog).map((x, i) => Math.min(x, list[i].need)), at: arr(w.at), by, got,
    kinds: Array.isArray(w.kinds) ? w.kinds.filter((x) => typeof x === 'string').slice(0, 400) : [],
    floors: Array.isArray(w.floors) ? w.floors.filter((x) => typeof x === 'string').slice(0, FLOOR_MAX) : [],
    full: num(w.full), fullCred: obj(w.fullCred),
  };
}

// 世界の 状態（なければ 作る。こわれて いれば なおす）
export function missionState(world) {
  const d = world.data;
  let st = d.missions;
  if (!st || typeof st !== 'object' || st._ok !== world) {
    const src = obj(st);
    const t = obj(src.total);
    const boss = {};
    for (const [sp, n] of Object.entries(obj(t.boss))) if (MONSTERS[sp] && num(n) > 0) boss[sp] = num(n);
    st = {
      week: cleanWeek(src.week),
      prev: cleanWeek(src.prev),
      total: { kills: num(t.kills), wins: num(t.wins), battles: num(t.battles), full: num(t.full), done: num(t.done), weeks: num(t.weeks), boss },
      fullBy: Object.fromEntries(Object.entries(obj(src.fullBy)).filter(([, n]) => num(n) > 0).map(([id, n]) => [id, num(n)])),
      hist: Array.isArray(src.hist) ? src.hist.filter((h) => h && Number.isInteger(h.no)).slice(-HIST_MAX).map((h) => ({ no: h.no, d: num(h.d), n: num(h.n) || WEEK_PICK })) : [],
    };
    // 同じ 世界で 2回 なおさない しるし（セーブには 書かない）
    Object.defineProperty(st, '_ok', { value: world, enumerable: false });
    d.missions = st;
  }
  return st;
}

// 今 遊んで いる 家族（さいきん 4週の 間に 遊んだ キャラ・今 いる キャラ）。いちばん 進んで いない 人でも できる 物を えらぶ ため
function activePool(world, no) {
  const chars = Object.values(world.data.characters || {}).filter((c) => c && !c.species);
  const since = weekStart(no) - ACTIVE_MS;
  const inWorld = new Set([...world.sessions.values()].filter((s) => s.inWorld && s.charId).map((s) => s.charId));
  const pool = chars.filter((c) => inWorld.has(c.id) || num(c.lastPlayed) >= since);
  return pool.length ? pool : chars;
}

function newWeek(no, kinds) {
  return { no, list: kinds.map((k) => ({ k, need: MISSIONS[k].need })), prog: kinds.map(() => 0), at: kinds.map(() => 0), by: {}, got: {}, kinds: [], floors: [], full: 0, fullCred: {} };
}

// 週が かわって いれば 入れかえる（月曜 0:00・日本時間）。今週を かえす
export function ensureWeek(world) {
  const st = missionState(world);
  const cur = weekNo(world.now());
  if (st.week && st.week.no === cur) return st.week;
  const old = st.week;
  if (old && old.no < cur) {
    const d = old.at.filter((x) => x > 0).length;
    if (Object.keys(old.by).length) st.total.weeks++;
    st.hist.push({ no: old.no, d, n: old.list.length });
    if (st.hist.length > HIST_MAX) st.hist.splice(0, st.hist.length - HIST_MAX);
    // 先週は 小さく して のこす（魔物の しゅるい・階の 一覧は いらない）
    st.prev = { ...old, kinds: [], floors: [] };
  }
  // 同じ 物が 2週 続かない ように: 先週（なければ 週の 番号から きまる 先週の 3つ）を さける
  const kinds = openKinds(activePool(world, cur));
  const prevKinds = st.prev && st.prev.no === cur - 1 ? st.prev.list.map((m) => m.k) : pickWeek(cur - 1, kinds);
  st.week = newWeek(cur, pickWeek(cur, kinds, prevKinds));
  world.markDirty?.();
  return st.week;
}

// ───────────── 数える ─────────────
const familyChar = (world, c) => !!c && !c.species && typeof c.id === 'string' && world.data.characters?.[c.id] === c;

// いっしょの 人（家族の キャラ。同じ キャラは 1回）
function uniqueChars(world, list) {
  const out = [];
  for (const c of list) if (familyChar(world, c) && !out.includes(c)) out.push(c);
  return out;
}

// その 人の パーティーで、同じ マップに いる 人間の キャラ（自分も 入れる）
export function togetherOnMap(world, s, map = s?.map) {
  const p = partyOf(world, s);
  if (!p || (p.members || []).length < 2) return [];
  const list = [];
  for (const sid of p.members) {
    const m = world.sessions.get(sid);
    if (!m || !m.inWorld || m.away || m.map !== map) continue;
    list.push(m.char);
  }
  return uniqueChars(world, list);
}

// いっしょに 遊んだ しるし（ごほうびを 受けとれる 人）
function touch(world, w, chars) {
  for (const c of chars) {
    if (!w.by[c.id]) {
      w.by[c.id] = { name: String(c.name || '').slice(0, 20), n: w.list.map(() => 0), b: 0, k: 0 };
      // もう 3つとも 達成した 週に あとから 来た 人も 数える
      if (w.full) creditFull(world, w, c);
    } else w.by[c.id].name = String(c.name || '').slice(0, 20);
  }
}

// kind の ミッションを amount だけ 進める（chars … いっしょに した 家族の キャラ。2人 いじょう）
export function missionBump(world, chars, kind, amount = 1) {
  if (world.offline || !(amount > 0)) return false;
  const list = uniqueChars(world, chars || []);
  if (list.length < 2) return false;
  const w = ensureWeek(world);
  touch(world, w, list);
  let moved = false;
  w.list.forEach((m, i) => {
    if (m.k !== kind || w.at[i]) return;
    const add = Math.min(amount, m.need - w.prog[i]);
    if (add <= 0) return;
    w.prog[i] += add;
    for (const c of list) w.by[c.id].n[i] += add;
    moved = true;
    if (w.prog[i] >= m.need) done(world, w, i);
  });
  if (moved) world.markDirty?.();
  return moved;
}

// 遊んでいる 人みんなに 知らせる（トースト・チャット・家族のけいじ板）
function announce(world, text, chat, key) {
  world.broadcast?.({ t: 'toast', text, sfx: 'bond', afterBattle: true });
  world.broadcast?.({ t: 'chat', from: '家族ミッション', sid: null, text: chat });
  world.boardPost?.({ kind: 'mission', by: '家族', charId: 'family', key, title: chat, detail: 'メニューの「家族ミッション」で、ごほうびを受けとれる。' });
}

function done(world, w, i) {
  w.at[i] = world.now();
  const st = missionState(world);
  st.total.done++;
  const text = missionText(w.list[i].k, w.list[i].need);
  announce(world, `★家族ミッション達成！\n「${text}」\nメニューの「家族ミッション」で、ごほうびを受けとろう`, `「${text}」を達成！`, `m${w.no}_${i}`);
  if (!w.full && w.at.every((x) => x > 0)) {
    w.full = world.now();
    st.total.full++;
    announce(world, '★★★今週の家族ミッションを3つとも達成！\nみんな、おつかれさま！', '今週のミッションを3つとも達成！', `m${w.no}_all`);
    for (const id of Object.keys(w.by)) {
      const c = world.data.characters?.[id];
      if (c) creditFull(world, w, c);
    }
  }
}

// 3つとも 達成した 週を 1つ 足す（キャラごと。しょうごう・スタンプ）
function creditFull(world, w, c) {
  if (w.fullCred[c.id]) return;
  w.fullCred[c.id] = 1;
  const st = missionState(world);
  const n = (st.fullBy[c.id] || 0) + 1;
  st.fullBy[c.id] = n;
  const m = milestoneOf(n);
  if (!m) return;
  const t = Array.isArray(c.famm?.t) ? c.famm.t : [];
  if (t.includes(n)) return;
  // あたらしい しょうごうは すぐ つける（メニューで かえられる）
  c.famm = { t: [...t, n].sort((a, b) => a - b), w: n };
  world.markDirty?.();
  for (const s of world.sessions.values()) {
    if (s.char !== c || !s.inWorld) continue;
    world.send?.(s, { t: 'toast', text: `★${c.name}は、しょうごう「${m.title}」と\nスタンプ「${m.stamp}」を手に入れた！\n（3つとも達成した週：${n}週）`, sfx: 'bond', afterBattle: true });
    world.sendSelf?.(s);
  }
}

// ───── 戦いの 終わり（world/battles.js の finishBattle の はじめ。HP・技の 回数を 書きかえる 前）─────
export function missionBattle(world, ctx, sessions) {
  try {
    countBattle(world, ctx, sessions);
  } catch (e) {
    console.error('mission error', e);
  }
}
function countBattle(world, ctx, sessions) {
  if (world.offline) return;
  const chars = uniqueChars(world, (sessions || []).map((m) => m?.char));
  if (chars.length < 2) return;
  const b = ctx.battle;
  const res = b.result || {};
  const w = ensureWeek(world);
  touch(world, w, chars);
  const st = missionState(world);
  for (const c of chars) w.by[c.id].b++;
  st.total.battles++;
  // 呪文や 技を 使った 回数（この 戦いの ぶん。ふつうの 攻撃は 入れない）
  let uses = 0;
  const sum = (u) => Object.entries(obj(u)).reduce((s, [k, v]) => s + (k.startsWith('@') ? 0 : num(v)), 0);
  for (const a of b.allies || []) {
    const who = ctx.actorMap?.[a.id];
    if (who?.type !== 'human' || !a.use) continue;
    uses += Math.max(0, sum(a.use) - sum(who.char?.skillUse));
  }
  missionBump(world, chars, 'skill', uses);
  missionBump(world, chars, 'dual', num(ctx.mDual));
  if (res.outcome !== 'win') return;
  const killed = Array.isArray(res.killed) ? res.killed : [];
  st.total.wins++;
  st.total.kills += killed.length;
  for (const c of chars) w.by[c.id].k += killed.length;
  missionBump(world, chars, 'win', 1);
  missionBump(world, chars, 'kill', killed.length);
  if (w.list.some((m) => m.k === 'kinds')) {
    const fresh = [...new Set(killed)].filter((sp) => !w.kinds.includes(sp));
    w.kinds.push(...fresh);
    missionBump(world, chars, 'kinds', fresh.length);
  }
  const humans = (b.allies || []).filter((a) => ctx.actorMap?.[a.id]?.type === 'human');
  if (humans.length && humans.every((a) => a.alive)) missionBump(world, chars, 'safe', 1);
  if (killed.length >= 4) missionBump(world, chars, 'big', 1);
  if (ctx.opts?.preemptive === 'ally') missionBump(world, chars, 'first', 1);
  if (b.boss) {
    missionBump(world, chars, 'boss', 1);
    const bosses = (b.enemies || []).filter((e) => e.boss && killed.includes(e.species)).map((e) => e.species);
    for (const sp of new Set(bosses.length ? bosses : killed)) if (MONSTERS[sp]) st.total.boss[sp] = (st.total.boss[sp] || 0) + 1;
  }
  if (String(ctx.opts?.fixed || '').startsWith('tmboss_')) missionBump(world, chars, 'tmap', 1);
  world.markDirty?.();
}

// 戦いの あと 魔物が 仲間に なりたがった（world/battles.js）
export function missionFriend(world, sessions) {
  guard(() => missionBump(world, (sessions || []).map((m) => m?.char), 'friend', 1));
}
// 数える ところで エラーが 出ても、戦い・宝箱・階だんは そのまま つづける
function guard(fn) {
  try {
    return fn();
  } catch (e) {
    console.error('mission error', e);
    return null;
  }
}

// 宝箱を 開けた（ダンジョンの 宝箱・フィールドの 宝箱。world.js）
export function missionChest(world, s) {
  if (world.offline) return;
  guard(() => missionBump(world, togetherOnMap(world, s), 'chest', 1));
}

// 階だん・出入り口で ダンジョンの 階へ 来た（world.js の onEnterTile。ついて来る 人を 動かした あと）
//   同じ 週に 同じ 階は 1回だけ（行ったり 来たりでは ふえない）
export function missionFloor(world, s, mapId) {
  if (!world.offline) guard(() => countFloor(world, s, mapId));
}
function countFloor(world, s, mapId) {
  if (MAPS[mapId]?.kind !== 'dungeon') return;
  const chars = togetherOnMap(world, s, mapId);
  if (chars.length < 2) return;
  const w = ensureWeek(world);
  if (!w.list.some((m) => m.k === 'floor')) {
    touch(world, w, chars);
    return;
  }
  if (w.floors.includes(mapId)) return;
  if (w.floors.length < FLOOR_MAX) w.floors.push(mapId);
  missionBump(world, chars, 'floor', 1);
}

// ───────────── 見る・受けとる ─────────────
function weekRows(w, c) {
  const mine = w.by[c.id];
  const got = w.got[c.id] || [];
  return w.list.map((m, i) => {
    const r = weekReward(i, c.level);
    return {
      k: m.k, text: missionText(m.k, m.need), now: w.prog[i], need: m.need, done: w.at[i] > 0, mine: mine ? mine.n[i] : 0,
      got: !!got[i], reward: { gold: r.gold, items: r.items.map((x) => ({ id: x.id, name: ITEMS[x.id]?.name || x.id, n: x.n })) },
    };
  });
}
const claimable = (w, c) => (w && w.by[c.id] ? w.list.filter((_, i) => w.at[i] > 0 && !(w.got[c.id] || [])[i]).length : 0);

// 画面に おくる 中み（c … 見て いる キャラ）
export function missionView(world, c) {
  if (world.offline) return { offline: true };
  const w = ensureWeek(world);
  const st = missionState(world);
  const now = world.now();
  const prevOk = !!st.prev && st.prev.no === w.no - 1;
  const people = Object.entries(w.by).map(([id, e]) => ({ name: e.name, sum: e.n.reduce((s, x) => s + x, 0), b: e.b, k: e.k, me: id === c.id }))
    .sort((a, b) => b.b - a.b || b.sum - a.sum);
  // いっしょに たおした ボス: 見て いる キャラが もう たおした ボスだけ 名前を 出す
  const bosses = Object.entries(st.total.boss).filter(([sp]) => num(c.kills?.[sp]) > 0)
    .map(([sp, n]) => ({ name: MONSTERS[sp].name, n })).sort((a, b) => b.n - a.n);
  const full = st.fullBy[c.id] || 0;
  const nx = nextMilestone(full);
  return {
    offline: false,
    week: { no: w.no, days: daysLeft(now), list: weekRows(w, c), full: !!w.full, joined: !!w.by[c.id], claim: claimable(w, c) },
    prev: st.prev ? { no: st.prev.no, list: weekRows(st.prev, c), full: !!st.prev.full, joined: !!st.prev.by[c.id], claim: prevOk ? claimable(st.prev, c) : 0, open: prevOk } : null,
    people,
    record: { kills: st.total.kills, wins: st.total.wins, battles: st.total.battles, full: st.total.full, done: st.total.done, weeks: st.total.weeks + (Object.keys(w.by).length ? 1 : 0), bosses, hist: st.hist.slice() },
    me: {
      full, wear: c.famm?.w || 0, title: wornTitle(c),
      titles: earnedOf(c).map((m) => ({ n: m.n, title: m.title, stamp: m.stamp })),
      next: nx ? { n: nx.n, title: nx.title, stamp: nx.stamp, left: nx.n - full } : null,
    },
  };
}

// 受けとる（which … 'cur' 今週 / 'prev' 先週。先週の 分は 次の 週の 間だけ）。{ ok, text }
export function missionClaim(world, c, which = 'cur') {
  if (world.offline) return { ok: false, text: '家族サーバーでいっしょに遊ぶと進みます' };
  const w0 = ensureWeek(world);
  const st = missionState(world);
  const w = which === 'prev' ? (st.prev && st.prev.no === w0.no - 1 ? st.prev : null) : w0;
  if (!w) return { ok: false, text: '先週のごほうびは、もう受けとれない' };
  if (!w.by[c.id]) return { ok: false, text: 'その週に、家族といっしょに遊ぶと受けとれる' };
  const got = w.got[c.id] || w.list.map(() => 0);
  const lines = [];
  let gold = 0;
  w.list.forEach((m, i) => {
    if (!(w.at[i] > 0) || got[i]) return;
    got[i] = 1;
    const r = weekReward(i, c.level);
    gold += r.gold;
    for (const it of r.items) {
      addItem(c, it.id, it.n);
      lines.push(`${ITEMS[it.id]?.name || it.id}×${it.n}`);
    }
  });
  if (!lines.length) return { ok: false, text: '受けとれるごほうびは、ありません' };
  w.got[c.id] = got;
  c.gold = Math.min(9999999, num(c.gold) + gold);
  world.markDirty?.();
  return { ok: true, text: `${c.name}は、ごほうびを受けとった！\n${gold}ゴールド・${lines.join('・')}` };
}

// しょうごうを つける（n … もらった しょうごうの 週。0 で はずす）
export function missionWear(c, n) {
  const list = earnedOf(c);
  if (!list.length) return { ok: false, text: 'しょうごうは、まだありません' };
  const m = list.find((x) => x.n === n);
  if (n && !m) return { ok: false, text: 'そのしょうごうは、まだありません' };
  c.famm = n ? { t: c.famm.t, w: n } : { t: c.famm.t };
  return { ok: true, text: m ? `しょうごう「${m.title}」をつけた` : 'しょうごうをはずした' };
}

// クライアントからの { t: 'mission', action }（world.js の handle）。返事は いつも { t: 'mission', ... }
export function missionMessage(world, s, msg) {
  const c = s.char;
  if (!c) return;
  if (world.offline) return world.send(s, { t: 'mission', offline: true });
  let r = null;
  switch (msg?.action) {
    case 'claim': r = missionClaim(world, c, msg.which === 'prev' ? 'prev' : 'cur'); break;
    case 'wear': r = missionWear(c, Number(msg.n) || 0); world.markDirty(); break;
    default:
  }
  if (r?.ok) world.sendSelf(s);
  world.send(s, { t: 'mission', ...missionView(world, c), ...(r ? { ok: r.ok, text: r.text } : {}) });
}

// チャットの 名前の 横に 出す しょうごう（つけて いる 時だけ）
export const chatName = (c) => {
  const t = wornTitle(c);
  return t ? `${c.name}〈${t}〉` : c.name;
};

export { MILESTONES };
