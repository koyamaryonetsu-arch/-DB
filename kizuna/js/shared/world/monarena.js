// 第67回 B: モンスター闘技場（サーバーの 窓口・ランク戦の 3連戦・家族の 登録チームとの 対戦）。docs/plan-r67-monster-arena.md
//
// 窓口: world/services.js の serviceAction から（msg.kind 'monarena'）。A班の 画面が よぶ
//   'status' → { ok, ranks, team, reg, monsters, family }（名前の 約束は plan の とおり。ほかの 項目は おまけ）
//   'setTeam' { team } … 前回の チームとして おぼえる / 'register' { team } … 登録チーム（写しも のこす。もちぬしが 遊んで いなくても 戦える）
//   'rank' { rank, team } … ランク戦（3連戦）/ 'family' { charId, team, even } … 家族の 登録チームと 戦う（even … みんな MON_EVEN_LV に そろえる）
//   'rank'・'family' は へんじ（ok）の あとで 戦いを はじめる。だいほんの 画面（'ui' の 段）の 中から よんだ ときは、
//   その 画面を とじた（ack が とどいた）あとに 3連戦の だいほんを はさみ、おわったら もとの だいほんの つづきへ。だいほんの 外なら すぐ はじめる
//   （A班の 画面は 受付の だいほんが おわってから 送る。おわりかけ〈まって いない〉の 時は おわるのを 少し まつ）
//
// 戦い: 人は 戦わない（shared/battle-monarena.js の MonArenaBattle）。魔物は 写し（monFighterChar）で 戦う
//   ・ランク戦 … 戦いの 前に HP・MPは 満タン（写し）。3連戦の 間は 回復しない。勝つと 1戦ごとに 魔物たちが 少し 経験値（MON_EXP_RATE）
//   ・家族の 対戦 … 両方 満タン。経験値・お金は なし（記録だけ）
//   ・負けても お金は へらない・ゲームオーバーに ならない（もとの 仲間の HP は へらない）
//   ・おわりは battles.js の battleTick が ctx.finish（finishMon）を よぶ
import { MonArenaBattle, monFighterChar, monAllyInit, monSnapshot, snapChar, monStatRow, monRankFight, MON_EVEN_LV } from '../battle-monarena.js?v=1b1cbe3b3c9e';
import { normBattleSettings } from '../battle.js?v=1b1cbe3b3c9e';
import {
  MONARENA_RANKS, MONARENA_TEAM_MAX, MONARENA_OPEN_FLAG, MON_EXP_RATE, monRankInfo, monRankLabel, monRankOpen, monRankCleared, monChampOf, monChampName,
  monArenaRecord, setMonArena, noteMonClear, noteFamResult, monFirstMedalId, monFamMedalId, nextMonRepeatMedal,
} from '../data/monarena.js?v=1b1cbe3b3c9e';
import { scaledRewardBonus } from '../data/treasure.js?v=1b1cbe3b3c9e';
import { MONSTERS } from '../data/monsters.js?v=1b1cbe3b3c9e';
import { ITEMS } from '../data/items.js?v=1b1cbe3b3c9e';
import { addItem, itemCount, removeItem } from '../stats.js?v=1b1cbe3b3c9e';
import { rewardExp, scaleExp, difficultyOf } from '../data/difficulty.js?v=1b1cbe3b3c9e';
import { ensureCompanions, ensureStorage, growCompanion, noteSeen } from './party.js?v=1b1cbe3b3c9e';
import { growthSummary } from './growth.js?v=1b1cbe3b3c9e';
import { mineOf, RESULT_MAX_MS } from './battles.js?v=1b1cbe3b3c9e';
import { runSteps } from './scripts.js?v=1b1cbe3b3c9e';

const say = (who, text) => ['say', who, text];
export const MONARENA_CALLER = '闘技場の司会';
export const MONARENA_CLERK = '闘技場の受付';
const fmt = (n) => Number(n).toLocaleString('ja-JP');
let monSeq = 1;

// ───────────── 魔物の 一覧・チーム ─────────────
// 自分の 魔物（仲間の 魔物 ＋ あずかり中）。where: 'party'（いっしょ）・'wagon'（馬車）・'tavern'（酒場で 待つ）・'storage'（あずかり所）
export function monEntries(c) {
  ensureStorage(ensureCompanions(c));
  const party = new Set(c.partyKeys || []);
  const wagon = new Set(Array.isArray(c.wagonKeys) ? c.wagonKeys : []);
  const out = [];
  for (const e of c.companions) {
    if (e.kind !== 'monster' || !e.char?.species || !MONSTERS[e.char.species]) continue;
    out.push({ e, where: party.has(e.key) ? 'party' : wagon.has(e.key) ? 'wagon' : 'tavern' });
  }
  for (const e of c.storage) if (e.char?.species && MONSTERS[e.char.species]) out.push({ e, where: 'storage' });
  return out;
}

// えらんだ key を たしかめる（1〜4ひき・自分の 魔物・同じ 魔物は 1回）
export function pickTeam(c, keys) {
  if (!Array.isArray(keys) || !keys.length) return { ok: false, reason: '戦う魔物を選んでね' };
  if (keys.length > MONARENA_TEAM_MAX) return { ok: false, reason: `戦えるのは${MONARENA_TEAM_MAX}ひきまでだよ` };
  const list = keys.map((k) => String(k ?? ''));
  if (new Set(list).size !== list.length) return { ok: false, reason: '同じ魔物は2回選べないよ' };
  const mine = new Map(monEntries(c).map((x) => [x.e.key, x]));
  const entries = [];
  for (const k of list) {
    const x = mine.get(k);
    if (!x) return { ok: false, reason: 'その魔物は選べないよ' };
    entries.push(x.e);
  }
  return { ok: true, entries, keys: list };
}

// 登録チームの 写しを 今の すがたに（いなく なった 魔物は 前の 写しの まま のこす。reg の key も のこす）
export function refreshRegSnap(c) {
  const a = monArenaRecord(c);
  if (!a.reg.length && !a.regSnap.length) return false;
  const mine = new Map(monEntries(c).map((x) => [x.e.key, x.e]));
  const keys = a.reg.length ? a.reg : a.regSnap.map((x) => x.key);
  const snap = keys.map((k) => (mine.has(k) ? monSnapshot(mine.get(k)) : a.regSnap.find((x) => x.key === k) || null)).filter(Boolean);
  setMonArena(c, { regSnap: snap });
  return true;
}

// ───────────── 窓口の じょうほう ─────────────
export function monArenaStatus(world, s) {
  const c = s.char;
  const flag = (f) => !!c.flags?.[f];
  refreshRegSnap(c);
  const rec = monArenaRecord(c);
  const ranks = MONARENA_RANKS.map((R, i) => {
    const o = monRankOpen(R.rank, flag, c);
    const lock = o.ok ? '' : o.why === 'prev' ? `${monRankLabel(MONARENA_RANKS[i - 1].rank)}を勝ちぬくと、出られる` : R.lock || '（物語を進めると、開く）';
    return {
      rank: R.rank, name: R.title, open: o.ok, cleared: monRankCleared(c, R.rank), lv: R.lv, hint: R.hint,
      // おまけ: 王者の 魔物・伝説の部・出られない わけ・勝ちぬいた 回数
      champ: monChampName(R), champSp: monChampOf(R), legend: !!R.legend, lock, why: o.ok ? null : o.why, n: rec.r[R.rank]?.n || 0,
    };
  });
  const entries = monEntries(c);
  const has = new Set(entries.map((x) => x.e.key));
  const monsters = entries.map(({ e, where }) => ({
    key: e.key, name: e.char.name, species: e.char.species, level: e.char.level || 1, ...monStatRow(e.char), where,
    color: e.char.color || undefined, plus: e.char.plus || 0, tactics: e.char.tactics || 'balanced',
  }));
  const me = s.charId || c.id;
  const family = [];
  for (const [id, ch] of Object.entries(world.data.characters || {})) {
    if (!ch || id === me || ch.species) continue;
    const r = monArenaRecord(ch);
    if (!r.regSnap.length) continue;
    family.push({
      charId: id, name: ch.name, reg: r.regSnap.map((x) => ({ species: x.species, name: x.name, level: x.level, color: x.color || undefined })),
      rec: rec.fam[id] ? { w: rec.fam[id].w, l: rec.fam[id].l } : { w: 0, l: 0 }, at: r.regAt || 0,
    });
  }
  return {
    open: flag(MONARENA_OPEN_FLAG), ranks,
    team: rec.team.filter((k) => has.has(k)), reg: rec.reg.filter((k) => has.has(k)),
    monsters, family, evenLv: MON_EVEN_LV, teamMax: MONARENA_TEAM_MAX,
  };
}

// ───────────── 窓口（world/services.js から）─────────────
export function monArenaAction(world, s, msg, reply) {
  const c = s.char;
  const st = () => monArenaStatus(world, s);
  const no = (text) => reply(false, text, st());
  switch (msg.action) {
    case 'status': return reply(true, '', st());
    case 'setTeam': {
      const t = pickTeam(c, msg.team);
      if (!t.ok) return no(t.reason);
      setMonArena(c, { team: t.keys });
      return reply(true, 'チームを覚えたよ', st());
    }
    case 'register': {
      const t = pickTeam(c, msg.team);
      if (!t.ok) return no(t.reason);
      setMonArena(c, { reg: t.keys, regSnap: t.entries.map(monSnapshot).filter(Boolean), regAt: world.now() });
      return reply(true, '登録チームにしたよ！\n家族がいつでも、このチームと戦えるようになった', st());
    }
    case 'rank': {
      if (!c.flags?.[MONARENA_OPEN_FLAG]) return no('まだ魔物が仲間になっていないみたい');
      const R = monRankInfo(String(msg.rank || ''));
      if (!R) return no('そのランクはないよ');
      const o = monRankOpen(R.rank, (f) => !!c.flags?.[f], c);
      if (!o.ok) return no(o.why === 'prev' ? 'まず、1つ前のランクを勝ちぬこう' : 'そのランクは、まだ開いていない');
      const t = pickTeam(c, msg.team);
      if (!t.ok) return no(t.reason);
      if (!canStart(world, s)) return no('今は戦えないよ');
      setMonArena(c, { team: t.keys });
      reply(true, `${monRankLabel(R.rank)}にちょうせん！`, st());
      startMonRun(world, s, (run) => rankRun(run, s, R, t.keys));
      return;
    }
    case 'family': {
      const id = String(msg.charId || '');
      const opp = world.data.characters?.[id];
      if (!opp || opp.species || id === (s.charId || c.id)) return no('その家族とは戦えないよ');
      if (!monArenaRecord(opp).regSnap.length) return no(`${opp.name}は、まだチームを登録していないよ`);
      const t = pickTeam(c, msg.team);
      if (!t.ok) return no(t.reason);
      if (!canStart(world, s)) return no('今は戦えないよ');
      setMonArena(c, { team: t.keys });
      reply(true, `${opp.name}のチームと対戦！`, st());
      startMonRun(world, s, (run) => familyRun(run, s, id, t.keys, !!msg.even));
      return;
    }
    default: return no('できません');
  }
}

function canStart(world, s) {
  if (!s.inWorld || s.busy === 'battle' || s.monArenaGo) return false;
  if (s.busy === 'script') {
    const run = s.runId && world.runs.get(s.runId);
    return !!run && run.init === s;
  }
  return !s.busy;
}

// 3連戦などの だいほんを はじめる（上の せつめい）
export function startMonRun(world, s, fn) {
  const go = async (run) => {
    try {
      await fn(run);
    } catch (e) {
      if (!run.aborted) console.error('monarena error', e);
    } finally {
      s.monArenaGo = false;
    }
  };
  s.monArenaGo = true;
  const run = s.runId && world.runs.get(s.runId);
  if (run && run.init === s && run.waiting) {
    const w = run.waiting;
    const orig = w.resolve;
    w.resolve = (msg) => {
      if (msg?.aborted) {
        s.monArenaGo = false;
        return orig(msg);
      }
      go(run).then(() => orig(msg));
    };
    return true;
  }
  if (s.busy === 'script' && run && run.init === s) {
    // 受付の だいほんが おわる ところ（画面を とじた へんじの すぐ あと）: おわるのを 少し まつ
    (async () => {
      for (let i = 0; i < 60 && s.busy && world.sessions.get(s.id) === s; i++) await new Promise((ok) => setTimeout(ok, 50));
      if (s.busy || world.sessions.get(s.id) !== s) {
        s.monArenaGo = false;
        return;
      }
      runSteps(world, s, [['call', go]]);
    })();
    return true;
  }
  if (s.busy) {
    s.monArenaGo = false;
    return false;
  }
  runSteps(world, s, [['call', go]]);
  return true;
}

async function flushOk(run) {
  const r = await run.flush();
  if (r.aborted) {
    run.abort();
    return false;
  }
  return true;
}

// ───────────── ランク戦 ─────────────
export async function rankRun(run, s, R, keys) {
  const w = run.world;
  const c = s.char;
  const t = pickTeam(c, keys);
  if (!t.ok) {
    run.batch.push(say(MONARENA_CLERK, t.reason));
    await flushOk(run);
    return 'none';
  }
  // 戦いの 前に 闘技場が HP・MPを 満タンに（写し。3連戦の 間は 回復しない）
  const fighters = t.entries.map((e) => ({ key: e.key, real: e.char, ch: monFighterChar(e.char) }));
  run.batch.push(
    say(MONARENA_CALLER, `さあ、${monRankLabel(R.rank)}「${R.title}」のちょうせん者、\n${c.name}の魔物たちの入場だ！`),
    say(null, '（受付の人が、魔物たちのHPとMPを満タンにしてくれた）'),
    ['sfx', 'encounter'],
  );
  for (let i = 0; i < 3; i++) {
    if (i < 2) run.batch.push(say(MONARENA_CALLER, i === 0 ? '第1戦、始め！' : '第2戦！休むひまはないぞ！'));
    else {
      run.batch.push(say(MONARENA_CALLER, `いよいよ第3戦！\n${monRankLabel(R.rank)}の王者、${monChampName(R)}の登場だ！`));
      run.batch.push(['showMon', monChampOf(R)]);
    }
    if (!(await flushOk(run))) return 'abort';
    const res = await startMonBattle(w, s, { kind: 'rank', rank: R, fight: i, fighters });
    if (i === 2) run.batch.push(['showMon', null]);
    if (res !== 'win') {
      run.batch.push(...(res === 'lose'
        ? [
          say(MONARENA_CLERK, `おつかれさん！\n${monRankLabel(R.rank)}は、第${i + 1}戦で力つきてしまったな。`),
          say(null, '受付の人が、魔物たちの手当てをしてくれた。\n（お金はへっていない）'),
          say(MONARENA_CLERK, `${R.hint}\nまたちょうせんしな！`),
        ]
        : [say(MONARENA_CLERK, '戦いが止まったようだ…。\nまたちょうせんしな！')]));
      await flushOk(run);
      refreshRegSnap(c);
      return res;
    }
    if (i < 2) run.batch.push(say(null, `第${i + 1}戦に勝った！\n（HPとMPは、回復しないまま…次の戦いへ！）`));
  }
  run.batch.push(['sfx', 'win'], say(MONARENA_CALLER, `勝者、${c.name}の魔物たち！\n${monRankLabel(R.rank)}、勝ちぬきだ！！`));
  run.batch.push(...monClearRewards(w, s, R));
  run.batch.push(say(MONARENA_CLERK, monClearText(R.rank)));
  refreshRegSnap(c);
  w.sendSelf(s);
  w.markDirty();
  await flushOk(run);
  return 'win';
}

// 勝ちぬいた ときの 受付の ことば（第68回 C: EX を 足した・第74回 C: EX2）
function monClearText(rank) {
  if (rank === 'EX2') return '千年の月の王者まで、たおしてしまうとは…！\nあんたの魔物たちの名前は、千年先まで語りつがれるぞ！';
  if (rank === 'EX') return '星のかなたの王者にまで勝つとは…！\nあんたの魔物たちは、もう伝説をこえているぞ！';
  if (rank === 'SSS') return 'なんと、王者の中の王者に勝つとは…！\nあんたの魔物たちこそ、本物の伝説だ！';
  return 'おめでとう！\n魔物たちも、ほこらしそうにしているぞ！';
}

// ごほうび（はじめて … first の 品と 小さなメダル / 2回目から … ゴールド（と ランク C から 小さなメダル 1まい））
export function monClearRewards(world, s, R) {
  const c = s.char;
  const now = world.now();
  const out = [];
  c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
  if (noteMonClear(c, R.rank, now)) {
    const got = [];
    for (const [id, n] of R.first.items) {
      if (!ITEMS[id] || !(n > 0)) continue;
      addItem(c, id, n);
      got.push(n > 1 ? `${ITEMS[id].name}を${n}個` : ITEMS[id].name);
    }
    if (got.length) out.push(['sfx', 'item'], say(null, `${c.name}は${got.join('と')}を手に入れた！`));
    for (let i = 1; i <= R.first.medals; i++) if (!c.medalSpots[monFirstMedalId(R.rank, i)]) c.medalSpots[monFirstMedalId(R.rank, i)] = now;
    if (R.first.medals > 0) out.push(['sfx', 'key'], say(null, `${c.name}は小さなメダルを${R.first.medals}枚手に入れた！`));
  } else {
    c.gold = Math.min(9999999, (c.gold || 0) + R.repeatGold);
    if (R.repeatMedal) c.medalSpots[nextMonRepeatMedal(c)] = now;
    out.push(['sfx', 'item'], say(null, `${c.name}は${fmt(R.repeatGold)}ゴールド${R.repeatMedal ? 'と、小さなメダルを1枚' : 'を'}手に入れた！`));
  }
  world.markDirty();
  return out;
}

// ───────────── 家族の 登録チームと 戦う ─────────────
export async function familyRun(run, s, oppId, keys, even) {
  const w = run.world;
  const c = s.char;
  const opp = w.data.characters?.[oppId];
  const snaps = opp ? monArenaRecord(opp).regSnap : [];
  const t = pickTeam(c, keys);
  if (!opp || !snaps.length || !t.ok) {
    run.batch.push(say(MONARENA_CLERK, t.ok ? 'その家族のチームは、今はいないみたいだ' : t.reason));
    await flushOk(run);
    return 'none';
  }
  const lv = even ? MON_EVEN_LV : null;
  const fighters = t.entries.map((e) => ({ key: e.key, real: e.char, ch: monFighterChar(e.char, { level: lv }) }));
  const foes = snaps.map((x) => ({ char: snapChar(x, oppId, { level: lv }), owner: oppId })).filter((x) => x.char);
  run.batch.push(
    say(MONARENA_CALLER, `さあ、家族の対戦だ！\n${c.name}の魔物たちと、${opp.name}の登録チームの勝負！`),
    ...(even ? [say(MONARENA_CALLER, `この試合は、みんなレベル${MON_EVEN_LV}にそろえて戦うぞ！`)] : []),
    ['sfx', 'encounter'],
  );
  if (!(await flushOk(run))) return 'abort';
  const res = await startMonBattle(w, s, { kind: 'family', fighters, foes, oppId, oppName: opp.name, even: !!even });
  if (res === 'win' || res === 'lose') {
    const first = noteFamResult(c, oppId, res === 'win');
    const r = monArenaRecord(c).fam[oppId] || { w: 0, l: 0 };
    if (res === 'win') run.batch.push(['sfx', 'win'], say(MONARENA_CALLER, `勝者、${c.name}の魔物たち！\n${opp.name}のチームに勝った！`));
    else run.batch.push(say(MONARENA_CALLER, `勝者、${opp.name}のチーム！\nいい勝負だったぞ！`));
    if (first) {
      c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
      if (!c.medalSpots[monFamMedalId(oppId)]) {
        c.medalSpots[monFamMedalId(oppId)] = w.now();
        run.batch.push(['sfx', 'key'], say(null, `初めて${opp.name}のチームに勝った！\n${c.name}は小さなメダルを1枚手に入れた！`));
      }
    }
    run.batch.push(say(null, `（${opp.name}のチームとの記録：${r.w}勝${r.l}敗）`));
  } else run.batch.push(say(MONARENA_CLERK, '戦いが止まったようだ…。\nまた来な！'));
  w.sendSelf(s);
  w.markDirty();
  await flushOk(run);
  return res;
}

// ───────────── 戦い ─────────────
// spec: { kind: 'rank'|'family', fighters: [{ key, real, ch }], rank, fight（ランク戦）/ foes, oppId, oppName, even（家族）}
export function makeMonBattle(world, s, spec) {
  const c = s.char;
  const settings = c.battleSettings || {};
  const allies = spec.fighters.map((f) => monAllyInit(f.ch, { controller: s.id, auto: !!settings.auto, owner: c.id }));
  const R = spec.kind === 'rank' ? spec.rank : null;
  const rf = R ? monRankFight(R, spec.fight) : { enemies: [], enemyMod: null, champ: null };
  const { enemies, champ } = rf;
  const b = new MonArenaBattle({
    id: 'ma' + (monSeq++),
    rng: world.rng,
    allies,
    enemies,
    foes: spec.foes || [],
    ...normBattleSettings(settings),
    wait: !!settings.wait,
    canFlee: false,
    bg: 'arena',
    bgm: champ || spec.kind === 'family' ? 'boss' : 'battle',
    // ランク戦の 相手: ランクの レベルに そろえる（宝の洞窟と おなじ のび）。王者は 少し 上の レベルと 強さの 倍率（battle-monarena.js の monRankFight）
    enemyMod: rf.enemyMod,
    // 設定の「敵の強さ」は ランク戦だけ（家族の 魔物は そのまま）
    enemyRate: spec.kind === 'rank' ? difficultyOf(c).enemy : 1,
    hooks: {
      // 道具は ランク戦だけ（めいれいさせろの 魔物が、自分の ふくろから 使う）。家族の 対戦は 道具なし
      hasItem: (actor, id) => spec.kind === 'rank' && actor.controller === s.id && itemCount(c, id) > 0,
      consumeItem: (actor, id) => {
        if (spec.kind !== 'rank' || actor.controller !== s.id) return false;
        const ok = removeItem(c, id, 1);
        if (ok) world.sendSelf(s);
        return ok;
      },
      spendGold: () => 0,
      gainGold: () => 0,
      steal: () => null,
    },
  });
  const actorMap = {};
  b.allies.forEach((a, i) => {
    const f = spec.fighters[i];
    actorMap[a.id] = { type: 'support', key: f.key, owner: c.id, kind: 'monster', char: f.ch, manual: f.ch.tactics === 'manual', real: f.real };
  });
  if (enemies.length) noteSeen(c, [...new Set(enemies)]);
  const ctx = {
    id: b.id, battle: b, sids: [s.id], partyId: s.partyId, map: s.map, actorMap, spec, sess: s,
    // solo … ほかの 人は とちゅうから 入れない・馬車の 入れかえも なし（battles.js の joinBattle・wagon.js）
    opts: { fixed: 'monarena', solo: true, monarena: spec.kind, loseOk: true, boss: !!champ, canFlee: false },
    finish: finishMon,
  };
  return ctx;
}

export function startMonBattle(world, s, spec) {
  return new Promise((resolve) => {
    const ctx = makeMonBattle(world, s, spec);
    ctx.resolve = resolve;
    world.battles.set(ctx.id, ctx);
    s.busy = 'battle';
    s.battleId = ctx.id;
    s.moving = false;
    world.send(s, { t: 'battleStart', snap: ctx.battle.snapshot(), mine: mineOf(ctx, s.id), boss: !!ctx.opts.boss, story: true });
    world.broadcastPositions = true;
  });
}

// 戦いの おわり（battles.js の battleTick・abortBattle が ctx.finish を よぶ）
export function finishMon(world, ctx) {
  world.battles.delete(ctx.id);
  const b = ctx.battle;
  const s = ctx.sess;
  const c = s.char;
  const spec = ctx.spec;
  const outcome = b.result?.outcome || 'flee';
  // HP・MP・作戦を 写しに もどす（次の 戦いへ。もとの 仲間の HP は かえない）
  for (const a of b.allies) {
    const who = ctx.actorMap[a.id];
    if (!who?.char) continue;
    who.char.hp = a.alive ? a.hp : 0;
    who.char.mp = a.mp;
    who.char.status = a.status.poison && a.alive ? { poison: true } : {};
    if (who.real && who.char.tactics) who.real.tactics = who.char.tactics;
  }
  const lines = [];
  let levelUp = false;
  if (outcome === 'win' && spec.kind === 'rank') {
    let exp = 0;
    for (const sp of b.result.killed || []) exp += MONSTERS[sp]?.exp || 0;
    exp += scaledRewardBonus(b).exp;
    const gx = scaleExp(c, Math.round(rewardExp(exp) * MON_EXP_RATE));
    lines.push('魔物たちをやっつけた！');
    if (gx > 0) lines.push(`魔物たちは${gx}ポイントずつ経験値をかくとく！`);
    const rows = [], notes = [];
    for (const f of spec.fighters) {
      const { ups } = growCompanion(f.real, gx, 0);
      const g = growthSummary(f.real.name, ups, [], f.real);
      rows.push(...g.lines);
      notes.push(...g.notes);
      // レベルが 上がったら 強さを 計算しなおす（HP・MPは 今の まま）
      if (ups.length) {
        const { hp, mp, status } = f.ch;
        f.ch = monFighterChar(f.real, { heal: false });
        Object.assign(f.ch, { hp, mp, status });
      }
    }
    lines.push(...rows, ...notes);
    levelUp = rows.length > 0;
  } else if (outcome === 'win') lines.push(`${spec.oppName || '相手'}のチームに勝った！`);
  else if (outcome === 'lose') lines.push(`${c.name}の魔物たちは力つきた…`, '（闘技場では、お金はへらない）');
  if (world.sessions.get(s.id) === s) {
    const run = s.runId && world.runs.get(s.runId);
    s.busy = run ? 'script' : null;
    s.battleId = null;
    s.evoCheck = true;
    s.reading = lines.length > 0;
    s.invuln = s.reading ? RESULT_MAX_MS : 3000;
    world.send(s, { t: 'battleEnd', id: ctx.id, outcome, lines, levelUp, story: true });
    world.sendSelf(s);
  }
  world.markDirty();
  if (ctx.resolve) ctx.resolve(outcome);
}
