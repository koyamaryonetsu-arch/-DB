// 第67回 C: モンスター闘技場の「その場の 対戦」（リアルタイムの 家族対戦）。docs/plan-r67-monster-arena.md
//
// ながれ（窓口は svc kind:'monlive'。client/ui/monarena-live.js が よぶ）:
//   1. 'list' … 今 闘技場（マップ monarena）に いる 家族の 一覧（申しこめるか）
//   2. 'invite' { sid, even } … 申しこむ（even … レベルを そろえる）。相手に { t:'monLive', state:'ask' } が とどく（30びょうで 時間切れ）
//   3. 'answer' { id, ok } … 申しこまれた 人が うける／ことわる。うけると 2人とも 4ひきを 選ぶ（state:'pick'。3分まで）
//   4. 'team' { id, team } … 4ひきを 決めた（'unready' … 選びなおす）。2人とも 決めると state:'go' → 2人とも 受付の 画面を とじたら 戦いが はじまる
//   'cancel' { id } … やめる（どちらからでも。戦いの 前まで）/ 'state' { id } … 今の ようす
//   2人に { t:'monLive', id, role, state, opp, even, me/oppReady, left, text } を とどける（かわった 時と、2.5びょうごと。とぎれても 立てなおせる）
//
// 戦い: 申しこんだ 人（a）の 魔物が みかたの がわ、うけた 人（b）の 魔物が 敵の がわ（shared/battle-monarena.js の MonArenaBattle の foes）。
//   どちらも その 魔物の 作戦で 動く。「めいれいさせろ」の 魔物は もちぬしが コマンドを 選ぶ（オートにも できる）。道具なし・にげられない
//   b の 画面には 敵と みかたを 入れかえた ようす（snapFor・evsFor）を 送る → b の 魔物が 下（みかた）に 出て コマンドを 選べる
//   通信が とぎれた 人の 魔物は オートで 戦う。LIVE_AWAY_MS たっても もどらない・ぬけた 時は のこった 人の 勝ち（記録には のこさない）
//   おわり: 勝ち負けを 2人の c.monArena.live[相手の id] に のこす（はじめて 勝った 時だけ 小さなメダル 1まい）。経験値・お金は なし
import { MonArenaBattle, monFighterChar, monAllyInit, MON_EVEN_LV } from '../battle-monarena.js?v=eb1c3a4395d7';
import { normBattleSettings, pub } from '../battle.js?v=eb1c3a4395d7';
import { TACTICS } from '../ai.js?v=eb1c3a4395d7';
import { MONSTERS } from '../data/monsters.js?v=eb1c3a4395d7';
import { MONARENA_OPEN_FLAG, setMonArena, monArenaRecord, noteLiveResult, monLiveMedalId } from '../data/monarena.js?v=eb1c3a4395d7';
import { monEntries, pickTeam } from './monarena.js?v=eb1c3a4395d7';
import { battleTactics } from './tactics.js?v=eb1c3a4395d7';
import { RESULT_MAX_MS } from './battles.js?v=eb1c3a4395d7';

export const LIVE_MAP = 'monarena';
export const LIVE_ASK_MS = 30000;
export const LIVE_PICK_MS = 180000;
export const LIVE_GO_MS = 15000;
export const LIVE_AWAY_MS = 20000;
const PUSH_MS = 2500;
let seq = 1;

const evenText = (even) => (even ? 'レベルをそろえる' : 'そのままの強さ');
const store = (world) => world.monLive || (world.monLive = new Map());
export const liveMatchOf = (world, s) => (s?.monLive && store(world).get(s.monLive)) || null;
const sessOf = (world, sid) => {
  const s = world.sessions.get(sid);
  return s && s.inWorld && s.char ? s : null;
};
const roleOf = (m, s) => (m.a === s.id ? 'a' : m.b === s.id ? 'b' : null);
const other = (r) => (r === 'a' ? 'b' : 'a');

// 闘技場の 中に いて、その場の 対戦が できる 人か（away … 通信が とぎれている）
function inArena(world, s, { away = false } = {}) {
  return !!s && world.sessions.get(s.id) === s && s.inWorld && !!s.char && s.map === LIVE_MAP && (away || !s.away) && !s.flying;
}

// 申しこめない わけ（'' … 申しこめる）
function whyNot(world, s) {
  if (!inArena(world, s)) return '闘技場にいない';
  if (!s.char.flags?.[MONARENA_OPEN_FLAG]) return '魔物の仲間がいない';
  if (!monEntries(s.char).length) return '魔物の仲間がいない';
  if (s.monLive) return '対戦の話し中';
  if (s.busy === 'battle' || s.monArenaGo) return '戦っている';
  return '';
}

// ───────────── 2人への 知らせ ─────────────
function pushOne(world, m, r, extra = {}) {
  const s = sessOf(world, m[r]);
  if (!s) return;
  const o = other(r);
  const left = m.state === 'ask' ? LIVE_ASK_MS : m.state === 'pick' ? LIVE_PICK_MS : m.state === 'go' ? LIVE_GO_MS : 0;
  world.send(s, {
    t: 'monLive', id: m.id, role: r, state: m.state, opp: m.names[o], oppSid: m[o], even: m.even, evenLv: MON_EVEN_LV,
    meReady: !!m.team[r], oppReady: !!m.team[o], left: left ? Math.max(0, left - (world.now() - m.stAt)) : 0, ...extra,
  });
}
function pushBoth(world, m, extra = {}) {
  m.pushAt = world.now();
  pushOne(world, m, 'a', extra.a || {});
  pushOne(world, m, 'b', extra.b || {});
}

function setState(world, m, state) {
  m.state = state;
  m.stAt = world.now();
  pushBoth(world, m);
}

// 戦いの 前に おわる（textA・textB … それぞれの 画面の ことば）
function endMatch(world, m, textA, textB) {
  if (m.state === 'end') return;
  m.state = 'end';
  store(world).delete(m.id);
  for (const r of ['a', 'b']) {
    const s = world.sessions.get(m[r]);
    if (s && s.monLive === m.id) s.monLive = null;
  }
  pushBoth(world, m, { a: { text: textA || '' }, b: { text: textB || '' } });
}

function matchInfo(world, m, s) {
  const r = roleOf(m, s);
  if (!r) return null;
  const o = other(r);
  return { id: m.id, role: r, state: m.state, opp: m.names[o], oppSid: m[o], even: m.even, evenLv: MON_EVEN_LV, meReady: !!m.team[r], oppReady: !!m.team[o] };
}

// ───────────── 窓口（world/services.js の kind 'monlive'）─────────────
export function monLiveAction(world, s, msg) {
  const c = s.char;
  // quiet … へんじを 送らない（画面を とじた 時の とりやめ。ほかの 窓口の へんじと まざらない ように）
  const no = (text, extra = {}) => (msg.quiet ? undefined : world.send(s, { t: 'svcRes', ok: false, text, ...extra }));
  const ok = (text, extra = {}) => (msg.quiet ? undefined : world.send(s, { t: 'svcRes', ok: true, text, ...extra }));
  const m = liveMatchOf(world, s);
  const mine = m && (!msg.id || msg.id === m.id) ? m : null;
  switch (msg.op) {
    case 'list': {
      const people = [];
      for (const x of world.sessions.values()) {
        if (x === s || !x.inWorld || !x.char || x.map !== LIVE_MAP || x.charId === s.charId) continue;
        const why = whyNot(world, x);
        people.push({ sid: x.id, charId: x.charId, name: x.char.name, level: x.char.level || 1, mons: monEntries(x.char).length, can: !why, why, look: x.char.look, job: x.char.job });
      }
      people.sort((p, q) => Number(q.can) - Number(p.can) || String(p.name).localeCompare(String(q.name)));
      return ok('', { people, me: m ? matchInfo(world, m, s) : null, evenLv: MON_EVEN_LV, rec: monArenaRecord(c).live });
    }
    case 'state':
      return ok('', { me: m ? matchInfo(world, m, s) : null });
    case 'invite': {
      if (m) return no('今は、ほかの対戦の話をしているところだよ');
      const mw = whyNot(world, s);
      if (mw) return no(mw === '闘技場にいない' ? '闘技場の中で申しこんでね' : mw === '魔物の仲間がいない' ? 'まだ戦える魔物がいないみたい' : '今は申しこめないよ');
      const t = world.sessions.get(String(msg.sid || ''));
      if (!t || t === s || t.charId === s.charId) return no('その人には申しこめないよ');
      const why = whyNot(world, t);
      if (why) {
        const name = t.char?.name || '家族';
        return no(why === '闘技場にいない' ? `${name}は、今は闘技場にいないみたい` : why === '魔物の仲間がいない' ? `${name}には、まだ戦える魔物がいないみたい` : why === '戦っている' ? `${name}は、今戦っているところだよ` : `${name}は、今ほかの対戦の話をしているところだよ`);
      }
      const id = 'ml' + (seq++) + Math.floor(world.rng.next() * 1e6).toString(36);
      const nm = {
        id, a: s.id, b: t.id, aId: s.charId, bId: t.charId, names: { a: c.name, b: t.char.name }, even: !!msg.even,
        state: 'ask', at: world.now(), stAt: world.now(), pushAt: 0, team: { a: null, b: null },
      };
      store(world).set(id, nm);
      s.monLive = id;
      t.monLive = id;
      ok(`${t.char.name}に申しこんだよ`, { me: matchInfo(world, nm, s) });
      pushBoth(world, nm);
      return;
    }
    case 'cancel': {
      if (!mine) return ok('', { me: null });
      const r = roleOf(mine, s);
      if (mine.state === 'battle') return no('もう戦いが始まっているよ');
      const me = mine.names[r];
      const t = mine.state === 'ask' ? `${me}が、申しこみをやめたよ` : `${me}が、対戦をやめたよ`;
      endMatch(world, mine, r === 'a' ? '' : t, r === 'b' ? '' : t);
      return ok('対戦をやめたよ', { me: null });
    }
    case 'answer': {
      if (!mine || mine.state !== 'ask' || roleOf(mine, s) !== 'b') return no('その申しこみは、もう終わっているみたい', { me: null });
      if (!msg.ok) {
        endMatch(world, mine, `${mine.names.b}は、今は対戦できないみたい`, '');
        return ok('ことわったよ', { me: null });
      }
      if (!inArena(world, s)) return no('闘技場の中で受けてね');
      const a = sessOf(world, mine.a);
      if (!inArena(world, a)) {
        endMatch(world, mine, '', `${mine.names.a}は、もう闘技場にいないみたい`);
        return no(`${mine.names.a}は、もう闘技場にいないみたい`, { me: null });
      }
      setState(world, mine, 'pick');
      return ok('対戦を受けたよ！', { me: matchInfo(world, mine, s) });
    }
    case 'team': {
      if (!mine || (mine.state !== 'pick' && mine.state !== 'go')) return no('その対戦は、もう終わっているみたい', { me: null });
      if (mine.state === 'go') return ok('', { me: matchInfo(world, mine, s), go: true });
      const t = pickTeam(c, msg.team);
      if (!t.ok) return no(t.reason, { me: matchInfo(world, mine, s) });
      const r = roleOf(mine, s);
      mine.team[r] = t.keys;
      // 前回の チームとして おぼえる（ランク戦と おなじ）
      setMonArena(c, { team: t.keys });
      world.markDirty();
      if (mine.team.a && mine.team.b) {
        setState(world, mine, 'go');
        return ok('', { me: matchInfo(world, mine, s), go: true });
      }
      pushBoth(world, mine);
      return ok('', { me: matchInfo(world, mine, s) });
    }
    case 'unready': {
      if (!mine || mine.state !== 'pick') return ok('', { me: mine ? matchInfo(world, mine, s) : null });
      mine.team[roleOf(mine, s)] = null;
      pushBoth(world, mine);
      return ok('', { me: matchInfo(world, mine, s) });
    }
    default: return no('できません');
  }
}

// ───────────── まいフレーム（world.js の tick から）─────────────
export function tickMonLive(world) {
  const st = world.monLive;
  if (!st || !st.size) return;
  const now = world.now();
  for (const m of [...st.values()]) {
    if (m.state === 'battle' || m.state === 'end') continue;
    const sa = world.sessions.get(m.a), sb = world.sessions.get(m.b);
    const gone = (s) => !s || s.monLive !== m.id || !inArena(world, s, { away: true }) || (s.away && now - s.awayAt > LIVE_AWAY_MS) || s.busy === 'battle';
    const ga = gone(sa), gb = gone(sb);
    if (ga || gb) {
      const left = (r) => `${m.names[r]}は、闘技場をはなれたみたい…`;
      endMatch(world, m, gb ? left('b') : '', ga ? left('a') : '');
      continue;
    }
    const age = now - m.stAt;
    if (m.state === 'ask' && age > LIVE_ASK_MS) {
      endMatch(world, m, `${m.names.b}から、へんじがなかったみたい`, `${m.names.a}からの申しこみは、時間切れになったよ`);
      continue;
    }
    if (m.state === 'pick' && age > LIVE_PICK_MS) {
      const t = 'チームを選ぶ時間が、終わってしまった…';
      endMatch(world, m, t, t);
      continue;
    }
    if (m.state === 'go') {
      // 2人とも 受付の 画面（だいほん）が おわったら はじめる
      if (!sa.busy && !sb.busy && !sa.away && !sb.away && !sa.monArenaGo && !sb.monArenaGo) {
        startLive(world, m, sa, sb);
        continue;
      }
      if (age > LIVE_GO_MS) {
        const t = '戦いのじゅんびが、うまくいかなかった…';
        endMatch(world, m, t, t);
        continue;
      }
    }
    if (now - m.pushAt >= PUSH_MS) pushBoth(world, m);
  }
}

// ───────────── 戦い ─────────────
// 敵の がわ（b）を 人が うごかす 時の ウェイト: どちらかが コマンドを えらんでいる 間は 止まる
class MonLiveBattle extends MonArenaBattle {
  humans() {
    return this.combatants.filter((c) => !c.fled && c.controller && !c.auto);
  }
}

const FLIP = { ally: 'enemy', enemy: 'ally' };
// pub の うち みかたの がわだけに 入る 項目（battle.js の pub）
const ALLY_KEYS = ['slv', 'acc', 'accUsed', 'gearUses', 'abilities', 'weaponCat', 'pc', 'pow', 'favs', 'tactics', 'tacBy'];

// b の 画面の 名前: 自分の 魔物は そのままの 名前・a の 魔物に 同じ 名前が あれば A・B を つける
//   （戦いの 中の 名前は a から 見た もの。MonArenaBattle は 敵の がわ〈b〉に A・B を つける）
function liveNames(b) {
  const plain = new Map(b.enemies.map((e) => [e.id, e.livePlain || e.name]));
  const own = new Set(plain.values());
  const count = {};
  for (const a of b.allies) count[a.name] = (count[a.name] || 0) + 1;
  const seen = {};
  const map = {};
  for (const e of b.enemies) if (plain.get(e.id) !== e.name) map[e.name] = plain.get(e.id);
  for (const a of b.allies) {
    if (!own.has(a.name) && count[a.name] < 2) continue;
    const i = seen[a.name] = (seen[a.name] ?? -1) + 1;
    map[a.name] = a.name + 'ABCDEFGH'[i % 8];
  }
  const keys = Object.keys(map).sort((x, y) => y.length - x.length);
  const re = keys.length ? new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g') : null;
  return { map, re };
}
const renameText = (b, t) => (b.liveNames?.re && typeof t === 'string' ? t.replace(b.liveNames.re, (k) => b.liveNames.map[k] ?? k) : t);

// b の 画面の 1人（敵と みかたを 入れかえる）。p … その 時の pub（なければ 今の すがた）
function mirrorPub(b, p) {
  const c = b.get(p.id);
  const out = { ...p, side: FLIP[p.side] || p.side };
  if (b.liveNames?.map[out.name] !== undefined) out.name = b.liveNames.map[out.name];
  if (!c) return out;
  if (out.side === 'ally') {
    // b の 魔物: みかたの 項目（技・作戦 など）を 足す。ふつうの 魔物の 仲間と おなじく species は なし
    const full = pub({ ...c, side: 'ally' });
    for (const k of ALLY_KEYS) out[k] = full[k];
    delete out.species;
  } else {
    for (const k of ALLY_KEYS) delete out[k];
    out.species = c.mon || c.liveSp;
    out.size = MONSTERS[c.mon]?.size || MONSTERS[c.liveSp]?.size;
    out.boss = false;
  }
  return out;
}

// text … 名前を 入れかえる 文（lines・postLines など）の 中
function mirrorAny(b, x, text = false) {
  if (Array.isArray(x)) return x.map((v) => mirrorAny(b, v, text));
  if (typeof x === 'string') return text ? renameText(b, x) : x;
  if (!x || typeof x !== 'object') return x;
  if (typeof x.id === 'string' && FLIP[x.side] && 'maxHp' in x) return mirrorPub(b, x);
  const out = {};
  for (const [k, v] of Object.entries(x)) out[k] = mirrorAny(b, v, /lines$|^text$/i.test(k));
  if (FLIP[out.side]) out.side = FLIP[out.side];
  return out;
}

const FLIP_OUT = { win: 'lose', lose: 'win' };
export function mirrorEvents(b, evs) {
  return evs.map((ev) => {
    const out = mirrorAny(b, ev);
    if (ev.t === 'end' && FLIP_OUT[ev.outcome]) out.outcome = FLIP_OUT[ev.outcome];
    return out;
  });
}

export function mirrorSnapshot(b) {
  const snap = b.snapshot();
  snap.combatants = b.combatants.filter((c) => !c.fled).map((c) => mirrorPub(b, pub(c)));
  return snap;
}

function makeLive(world, m, sa, sb) {
  const ta = pickTeam(sa.char, m.team.a), tb = pickTeam(sb.char, m.team.b);
  if (!ta.ok || !tb.ok) return null;
  const lv = m.even ? MON_EVEN_LV : null;
  const setA = sa.char.battleSettings || {}, setB = sb.char.battleSettings || {};
  const na = normBattleSettings(setA), nb = normBattleSettings(setB);
  const fa = ta.entries.map((e) => ({ key: e.key, real: e.char, ch: monFighterChar(e.char, { level: lv }) }));
  const fb = tb.entries.map((e) => ({ key: e.key, real: e.char, ch: monFighterChar(e.char, { level: lv }) }));
  const b = new MonLiveBattle({
    id: 'ml' + (seq++),
    rng: world.rng,
    allies: fa.map((f) => monAllyInit(f.ch, { controller: sa.id, auto: !!setA.auto, owner: sa.charId })),
    foes: fb.map((f) => ({ char: f.ch, controller: f.ch.tactics === 'manual' ? sb.id : null, auto: !!setB.auto, owner: sb.charId })),
    enemies: [],
    // 速さは おそい ほうに・ウェイトは どちらかが ウェイトなら（小さい 子に あわせる）
    speed: Math.min(na.speed, nb.speed),
    textSpeed: Math.min(na.textSpeed, nb.textSpeed),
    wait: !!setA.wait || !!setB.wait,
    canFlee: false,
    bg: 'arena',
    bgm: 'boss',
    hooks: { hasItem: () => false, consumeItem: () => false, spendGold: () => 0, gainGold: () => 0, steal: () => null },
  });
  const actorMap = {};
  b.allies.forEach((a, i) => {
    a.liveSp = fa[i].ch.species;
    actorMap[a.id] = { type: 'support', key: fa[i].key, owner: sa.charId, kind: 'monster', char: fa[i].ch, manual: fa[i].ch.tactics === 'manual', real: fa[i].real, side: 'a' };
  });
  b.enemies.forEach((e, i) => {
    e.liveSp = fb[i].ch.species;
    e.livePlain = fb[i].ch.name;
    // 「めいれいさせろ」の しるし（b の 画面の 作戦の 名前）
    e.manualTac = fb[i].ch.tactics === 'manual';
    actorMap[e.id] = { type: 'support', key: fb[i].key, owner: sb.charId, kind: 'monster', char: fb[i].ch, manual: e.manualTac, real: fb[i].real, side: 'b' };
  });
  b.liveNames = liveNames(b);
  b.emit({ t: 'msg', lines: [`${m.names.a}と${m.names.b}の対戦、始め！`, ...(m.even ? [`みんなレベル${MON_EVEN_LV}にそろえて戦うぞ！`] : [])], dur: 1400 });
  const ctx = {
    id: b.id, battle: b, sids: [sa.id, sb.id], partyId: sa.partyId, map: sa.map, actorMap, live: m,
    opts: { fixed: 'monarena', solo: true, monarena: 'live', loseOk: true, boss: false, canFlee: false },
    finish: finishLive,
    // b の 画面は 敵と みかたを 入れかえる（battles.js の battleTick・mineOf、world.js の つなぎ直し）
    evsFor: (sid, evs) => (sid === m.b ? mirrorEvents(b, evs) : evs),
    snapFor: (sid) => (sid === m.b ? mirrorSnapshot(b) : b.snapshot()),
    mineFor: (sid) => b.combatants.filter((c) => !c.fled && c.controller === sid).map((c) => c.id),
    tactics: liveTactics,
    awayAuto: new Set(),
  };
  // まいフレーム: とぎれた 人の 魔物は オート・もどらない 人が いれば おわり
  const tick = b.tick.bind(b);
  b.tick = (dt) => {
    if (!b.over) liveWatch(world, ctx);
    return tick(dt);
  };
  return ctx;
}

function startLive(world, m, sa, sb) {
  const ctx = makeLive(world, m, sa, sb);
  if (!ctx) {
    const t = '選んだ魔物が、そろわなかった…';
    endMatch(world, m, t, t);
    return;
  }
  m.state = 'battle';
  m.battleId = ctx.id;
  world.battles.set(ctx.id, ctx);
  pushBoth(world, m);
  for (const s of [sa, sb]) {
    s.busy = 'battle';
    s.battleId = ctx.id;
    s.moving = false;
    world.send(s, { t: 'battleStart', snap: ctx.snapFor(s.id), mine: ctx.mineFor(s.id), boss: false, story: true, live: true });
  }
  world.broadcastPositions = true;
}

// 通信が とぎれた 人・ぬけた 人
function liveWatch(world, ctx) {
  const m = ctx.live;
  const b = ctx.battle;
  const now = world.now();
  const gone = {};
  for (const r of ['a', 'b']) {
    const s = world.sessions.get(m[r]);
    const out = !s || !s.inWorld || s.battleId !== ctx.id || (s.away && now - s.awayAt > LIVE_AWAY_MS);
    gone[r] = out;
    if (out || !s) continue;
    for (const c of b.combatants) {
      if (c.controller !== s.id || c.fled) continue;
      if (s.away && !c.auto) {
        b.setAuto(c.id, true);
        ctx.awayAuto.add(c.id);
      } else if (!s.away && ctx.awayAuto.has(c.id)) {
        ctx.awayAuto.delete(c.id);
        b.setAuto(c.id, !!s.char.battleSettings?.auto);
      }
    }
  }
  if (gone.a || gone.b) {
    const winner = gone.a && gone.b ? null : gone.a ? 'b' : 'a';
    ctx.forced = { winner };
    b.endBattle({ outcome: winner === 'a' ? 'win' : winner === 'b' ? 'lose' : 'flee' });
  }
}

// 戦いの 中で 作戦を かえる（battles.js の battleCommand から）。みかたの がわは ふつうと おなじ（world/tactics.js）
function liveTactics(world, s, ctx, msg) {
  const b = ctx.battle;
  const a = b.get(String(msg.actor || ''));
  if (!a || a.side === 'ally') return battleTactics(world, s, ctx, msg);
  const no = (text) => {
    world.send(s, { t: 'menuRes', ok: false, text });
    return { ok: false, reason: text };
  };
  const t = TACTICS[msg.tactics] ? String(msg.tactics) : null;
  const who = ctx.actorMap[a.id];
  if (!t || a.fled || !who || b.over) return no('作戦は変えられない');
  if (who.owner !== s.char.id) return no(`${a.name}の作戦は変えられない`);
  if (who.real) who.real.tactics = t;
  if (who.char) who.char.tactics = t;
  who.manual = t === 'manual';
  a.tactics = t === 'manual' ? 'balanced' : t;
  a.manualTac = t === 'manual';
  if (t === 'manual' && !a.controller) {
    a.controller = s.id;
    a.auto = !!s.char.battleSettings?.auto;
  } else if (t !== 'manual' && a.controller === s.id) {
    a.controller = null;
    b.setAuto(a.id, true);
  }
  b.emit({ t: 'tactics', id: a.id, tactics: t, controller: a.controller || null, auto: !!a.auto });
  world.send(s, { t: 'menuRes', ok: true, text: `${a.name}の作戦を「${TACTICS[t].name}」にした。` });
  world.sendSelf(s);
  world.markDirty();
  return { ok: true };
}

// 戦いの おわり（battles.js の battleTick・abortBattle が ctx.finish を よぶ）
export function finishLive(world, ctx) {
  world.battles.delete(ctx.id);
  const b = ctx.battle;
  const m = ctx.live;
  const outcome = b.result?.outcome || 'flee';
  const winner = ctx.forced ? ctx.forced.winner : outcome === 'win' ? 'a' : outcome === 'lose' ? 'b' : null;
  const chars = { a: world.data.characters[m.aId], b: world.data.characters[m.bId] };
  const lines = { a: [], b: [] };
  if (ctx.forced) {
    for (const r of ['a', 'b']) {
      if (winner !== r) continue;
      lines[r].push(`${m.names[other(r)]}の通信がとぎれてしまった…`, `この対戦は、${m.names[r]}の勝ち！`, '（この対戦は、記録にはのこらないよ）');
    }
  } else if (winner) {
    for (const r of ['a', 'b']) {
      const o = other(r);
      const c = chars[r];
      const win = winner === r;
      lines[r].push(win ? `${m.names[o]}の魔物たちに勝った！` : `${m.names[o]}の魔物たちに負けてしまった…`, win ? `勝者、${m.names[r]}の魔物たち！` : 'いい勝負だったね！');
      if (!c) continue;
      const first = noteLiveResult(c, m[o + 'Id'], win);
      if (first) {
        c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
        if (!c.medalSpots[monLiveMedalId(m[o + 'Id'])]) {
          c.medalSpots[monLiveMedalId(m[o + 'Id'])] = world.now();
          lines[r].push(`初めて${m.names[o]}にその場の対戦で勝った！`, `${m.names[r]}は小さなメダルを1枚手に入れた！`);
        }
      }
      const rec = monArenaRecord(c).live[m[o + 'Id']] || { w: 0, l: 0 };
      lines[r].push(`（${m.names[o]}とのその場の対戦：${rec.w}勝${rec.l}敗）`);
    }
  } else {
    lines.a.push('戦いが止まってしまった…');
    lines.b.push('戦いが止まってしまった…');
  }
  // 作戦（戦いの 中で かえた もの）は もとの 仲間に のこっている（liveTactics・tactics.js）
  m.state = 'end';
  store(world).delete(m.id);
  for (const r of ['a', 'b']) {
    const s = world.sessions.get(m[r]);
    if (!s) continue;
    if (s.monLive === m.id) s.monLive = null;
    if (s.battleId !== ctx.id) continue;
    const out = winner === r ? 'win' : winner ? 'lose' : 'flee';
    s.busy = null;
    s.battleId = null;
    s.reading = lines[r].length > 0;
    s.invuln = s.reading ? RESULT_MAX_MS : 3000;
    world.send(s, { t: 'battleEnd', id: ctx.id, outcome: out, lines: lines[r], levelUp: false, story: true, live: true });
    world.sendSelf(s);
  }
  world.markDirty();
}

