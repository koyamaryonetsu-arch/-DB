// 第5章 Step 5「ノクトの思い出の迷宮」の ボス ノクトの影の しかけ（battle.js・ai.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・職業の まね（monsters-hoshiyomi.js の nocto）: 戦いの はじめと、mimicEvery 回 動く ごとに、パーティーの だれか 1人
//   （人を 先に。前と ちがう 人）の すがたと 職業を まねる。第4章の 鏡のうつし身と おなじ 考え方で、まねた 人の 技
//   （回復・生き返り・かばう を のぞく）を 仲間の オートの AI で えらんで、mimicRate の わりあいで 使う（強さは 影の 強さ）
//   まねられた 人の 攻撃（ふつうの 攻撃・特技・呪文）は 見切られて、ダメージが half ばい（noctoDamage）。合体技は そのまま
//   （はじめは「かわされて 反撃」に したが、完全オートが ほとんど 勝てなく なったので 半分に した）
// ・合体技の よやくを こわす（きずなくだき）: 前ぶれ「みんなの きずなを じっと にらんでいる」→ 次の 番に きずなくだき（みんなに 物理）。
//   合体技を 見ると、影は かならず 次に この 前ぶれを する（noctoCheck → noctoAction）。前ぶれから 次の 番までは ふつうより 少し 早い。
//   合体技の よやく（よやくして まっている・ならんで 出る のを まっている）の 組は、組の だれかが 身を 守って いれば 守れる。
//   守れないと よやくが くだかれ（みんなの ゲージが 0 から）、影が その 力を すいとって 強く なる。身を 守ると ダメージも 半分
//   （ソリトゥスの 第2段階「きずなを 食べる」の 前ぶれ。docs/plan-ch5.md の 13）
// ・オートの 仲間（ふつう）は 何も かわらない。シミュレーター（tools/sim-nocto.mjs）の 知っている 人（b.knowsNocto）は、
//   前ぶれの あと 合体技の 組の 人・先に 番が 来る 人が 身を 守り、まねられた 人は 攻撃の かわりに 回復・強くする 技・防御
import { MONSTERS } from './data/monsters.js?v=5c89bfcd3c09';
import { ABILITIES } from './data/abilities.js?v=5c89bfcd3c09';
import { NOCTO } from './data/monsters-hoshiyomi.js?v=5c89bfcd3c09';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=5c89bfcd3c09';
import { mirrorSkillOk, mirrorDecide } from './battle-temple.js?v=5c89bfcd3c09';
import { canUse } from './ai.js?v=5c89bfcd3c09';

export { NOCTO };
export const MIMIC = 'm_ns_mimic';
export const BOND_WATCH = 'm_ns_bond_watch';
export const BOND_BREAK = 'm_ns_bond_break';
// まねても 使わない 技の こうか（回復の なかま・かばう）
const NO_MIMIC = new Set(['heal', 'revive', 'reviveAll', 'cure', 'mpHeal', 'regen', 'cover']);
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
const confOf = (m) => MONSTERS[m?.species]?.nocto || null;
const shadowOf = (b) => b.enemies.find((e) => e.alive && confOf(e)) || null;

// ───────────── はじめ（battle.js の constructor）─────────────
export function setupNocto(b) {
  const m = b.enemies.find((e) => confOf(e));
  if (!m) return;
  m.nsActs = 0;
  const lines = [];
  mimic(b, m, lines);
  if (lines.length) b.emit({ t: 'msg', lines, fx: { type: 'nsMimic', actor: m.id, targets: m.mimic ? [m.mimic.of] : [] }, dur: 1800 });
}

// まねる 人を えらぶ: 人（魔物の 仲間で ない）を 先に。今 まねて いる 人とは ちがう 人
function pickTarget(b, m) {
  const alive = b.aliveAllies().filter((x) => !x.fled);
  const now = m.mimic?.of;
  const people = alive.filter((x) => !x.mon);
  for (const pool of [people.filter((x) => x.id !== now), alive.filter((x) => x.id !== now), alive]) if (pool.length) return b.rng.pick(pool);
  return null;
}

// まねる（m.mimic・m.abilities を かえる）。lines … ことばを 足す 先
function mimic(b, m, lines) {
  const t = pickTarget(b, m);
  for (const x of b.allies) if (x.nsMimicked) x.nsMimicked = false;
  m.nsActs = 0;
  if (!t) {
    m.mimic = null;
    m.abilities = [];
    return null;
  }
  m.mimic = { of: t.id, name: t.name, job: t.job, look: t.look, eq: t.eq, mon: t.mon };
  m.abilities = (t.abilities || []).filter((id) => mirrorSkillOk(id) && !NO_MIMIC.has(prim(ABILITIES[id]).type) && !['ally', 'allies', 'deadAlly', 'deadAllies'].includes(ABILITIES[id]?.target));
  m.penChar = t.penChar;
  m.weaponCat = t.weaponCat;
  m.tactics = 'aggressive';
  m.autoOff = [];
  t.nsMimicked = true;
  lines.push(`${m.name}は、${t.name}のすがたと職業をまねた！`, `（${t.name}の攻撃は、見切られてしまいそうだ…！）`);
  return t;
}

// ───────────── 魔物の 番の はじめ（ai.js の decideMonster。templeAction の あと）─────────────
// まねる 番（mimicEvery 回 動いた）・まねた 人の 技を 使う（mimicRate）
export function noctoAction(b, m) {
  const conf = confOf(m);
  if (!conf || m.telegraph) return null;
  m.nsActs = (m.nsActs || 0) + 1;
  // 合体技を 見た: 次は きずなくだきの 前ぶれ（つづけては しない）
  if (m.nsDualSeen) {
    m.nsDualSeen = false;
    if (!m.recent.includes(BOND_WATCH) && !m.recent.includes(BOND_BREAK)) return forced(m, BOND_WATCH);
  }
  if (m.nsActs > (conf.mimicEvery ?? 4)) return forced(m, MIMIC);
  if (!m.mimic || !m.abilities?.length || !b.rng.chance(conf.mimicRate ?? 0.45)) return null;
  const cmd = mirrorDecide(b, m);
  return cmd.type === 'ability' ? { ...cmd, nsMimic: true } : null;
}

// かならず 使う 技（ふつうに えらんだ ときと おなじ ように「さいきん 使った」に 入れる）
function forced(m, id) {
  m.used[id] = (m.used[id] || 0) + 1;
  m.recent.push(id);
  if (m.recent.length > 3) m.recent.shift();
  return { type: 'ability', id };
}

// 合体技の よやくの 組（よやくして まっている〈waitDual〉・ならんで 出る のを まっている〈queue の dual〉）
export function bondTeams(b) {
  const teams = [];
  for (const c of b.allies) {
    if (!c.alive || !c.waitDual) continue;
    teams.push({ kind: 'wait', lead: c, members: [c, ...c.waitDual.partners.map((id) => b.get(id)).filter(Boolean)] });
  }
  for (const q of b.queue) {
    if (q.cmd?.type !== 'dual') continue;
    const c = b.get(q.id);
    if (!c?.alive || c.side !== 'ally') continue;
    const ids = q.cmd.partners?.length ? q.cmd.partners : [q.cmd.partner];
    teams.push({ kind: 'queue', lead: c, q, members: [c, ...ids.map((id) => b.get(id)).filter(Boolean)] });
  }
  return teams;
}

// 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）
//   nsBond … 合体技の よやくが ある
export function noctoCond(b, m, cond) {
  if (cond === 'nsBond') return bondTeams(b).length > 0;
  return null;
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function noctoEffect(b, c, a, eff, ev) {
  if (eff.type === 'nsMimic') {
    const t = mimic(b, c, ev.lines);
    if (!t) ev.lines.push('しかし、まねる相手がいなかった。');
    ev.fx = { type: 'nsMimic', anim: a.anim, actor: c.id, targets: t ? [t.id] : [], side: 'enemy' };
    ev.nsMimic = t ? { by: c.id, who: t.id } : null;
    ev.upd.push(c, ...b.allies);
    return true;
  }
  if (eff.type === 'nsBondBreak') {
    bondBreak(b, c, ev);
    return true;
  }
  return false;
}

// きずなくだき: 先に よやくの 組を しらべて（守れたか・くだかれたか）、そのあと みんなに ダメージ
function bondBreak(b, c, ev) {
  const conf = confOf(c)?.bond || {};
  const { broke } = crushBonds(b, ev);
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'ns_bond_break', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: conf.mult ?? 1.25, ignoreDef: conf.ignoreDef ?? 0.3 }, ev, 'phys');
  if (broke && c.alive) {
    ev.lines.push(`${c.name}は、くだいたきずなの力をすいとった！`);
    b.applyBuff(c, c, { stat: 'atk', mult: conf.buff ?? 1.2 }, ev);
  }
  ev.warn = true;
}

// 合体技の よやくの 組を しらべる: 組の だれかが 身を 守って いれば 守れる。守れないと くだく（ev.nsBond）。
// 第5章 Step 9 の ノクト（本気）の ひとりぼっちの合体技・ソリトゥスの きずなを食べる も 使う（battle-earth.js・battle-final.js）
// broken … くだかれた ときの ことば（組の 名前の あと）
export function crushBonds(b, ev, broken = 'の合体技のよやくが、くだかれた！') {
  const names = (ms) => ms.map((x) => x.name).join('と');
  let broke = 0;
  const guarded = [];
  for (const tm of bondTeams(b)) {
    const g = tm.members.find((x) => x.alive && x.defending);
    if (g) {
      guarded.push(g.id);
      ev.lines.push(`${g.name}が身を守り、${names(tm.members)}のきずなを守りぬいた！`);
      continue;
    }
    breakTeam(b, tm, ev);
    broke++;
    ev.lines.push(`${names(tm.members)}${broken}`);
  }
  ev.nsBond = { broke, guarded };
  return { broke, guarded };
}

// よやくを くだく: みんなの ゲージは 0 から（まっていた 仲間も）。第5章 Step 6・7 の 地われも 使う（battle-earth.js）
export function breakTeam(b, tm, ev) {
  const reset = (x) => {
    if (!x) return;
    x.ready = false;
    x.queued = false;
    x.dualHold = false;
    x.dualWith = null;
    x.atb = 0;
    ev.upd.push(x);
  };
  if (tm.kind === 'wait') {
    const w = tm.lead.waitDual;
    tm.lead.waitDual = null;
    for (const id of w?.partners || []) {
      const p = b.get(id);
      if (p && p.dualTarget === tm.lead.id) {
        p.dualTarget = null;
        if (p.dualHold) reset(p);
      }
    }
    reset(tm.lead);
    b.emit({ t: 'dualWaitEnd', id: tm.lead.id, partners: w?.partners || [], lines: [] });
  } else {
    b.queue = b.queue.filter((q) => q !== tm.q);
    b.releasePartners(tm.q.cmd);
    for (const x of tm.members) reset(x);
  }
}

// ───────────── 行動の はじめ（battle-ch5.js の foreseeCheck の はじめ）─────────────
// 合体技を 見た 影は、次に きずなくだきの 前ぶれ（noctoAction）。この 行動は ふつうに つづける（いつも false）
export function harmful(cmd) {
  if (!cmd || cmd.confused) return false;
  if (cmd.type === 'attack' || cmd.type === 'mahouken') return true;
  if (cmd.type !== 'ability') return false;
  const a = ABILITIES[cmd.id];
  return !!a && FOES.has(a.target);
}
export function noctoCheck(b, c, cmd) {
  if (c.side !== 'ally' || cmd.type !== 'dual') return false;
  const m = shadowOf(b);
  if (m) m.nsDualSeen = true;
  return false;
}

// ───────────── ダメージ（battle.js の damage。gaiaDamage の あと）─────────────
// まねられた 人から ノクトの影への ダメージは 見切られて half ばい（合体技は そのまま）。ことばは 1回の 行動で 1回・この 戦いで NOTE_MAX 回まで
export const NOTE_MAX = 3;
export function noctoDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0 || c.side !== 'ally' || t.side !== 'enemy' || ev.dual) return dmg;
  const conf = confOf(t);
  if (!conf || !c.nsMimicked || t.mimic?.of !== c.id) return dmg;
  if (!ev.nsSeen) {
    ev.nsSeen = { by: t.id, who: c.id };
    b.nsSaid = (b.nsSaid || 0) + 1;
    if (b.nsSaid <= NOTE_MAX) ev.lines.push(`（${t.name}は、${c.name}の動きを知っている…！）`);
  }
  return Math.max(1, Math.round(dmg * (conf.half ?? 0.5)));
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
export function noctoKill(b, t, ev) {
  if (t.side === 'ally' && t.nsMimicked) {
    // まねられて いた 人が たおれた: しるしだけ 消す（次の まねで 別の 人に）
    t.nsMimicked = false;
    return;
  }
  if (t.side !== 'enemy' || !confOf(t)) return;
  t.mimic = null;
  for (const x of b.allies) {
    if (!x.nsMimicked) continue;
    x.nsMimicked = false;
    if (ev) ev.upd.push(x);
  }
}

// ───────────── 知っている 人の オート（battle-ch5.js の towerPlan から。b.knowsNocto）─────────────
// ・きずなくだきの 前ぶれ: 合体技の 組で ゲージを ためて いる 人と、きずなくだきより 先に 番が 来る 人は 身を 守る
// ・まねられた 人: 攻撃の かわりに 回復・強くする 技・防御（ふつうの えらびかたで きめて、攻撃なら かえる）
// （b.nsNoGuard・b.nsNoMimic … シミュレーターで 1つずつ はずして くらべる とき）
export function noctoPlan(b, c, decide) {
  if (c.side !== 'ally' || !b.knowsNocto || b.nsInner) return null;
  const m = shadowOf(b);
  if (!m) return null;
  if (!b.nsNoGuard && m.telegraph === BOND_BREAK) {
    const inTeam = bondTeams(b).some((tm) => tm.members.includes(c));
    const mine = 100 / atbRate(c);
    if (inTeam || (100 - m.atb) / atbRate(m) <= mine) return { type: 'defend' };
  }
  if (b.nsNoMimic || m.mimic?.of !== c.id) return null;
  let cmd;
  b.nsInner = true;
  try {
    cmd = decide(b, c);
  } finally {
    b.nsInner = false;
  }
  return harmful(cmd) ? supportCmd(b, c) : cmd;
}

// まねられた 人の かわりの 行動: 回復（へっている 人）→ 強くする 技（まだ かかって いない）→ 防御
export function supportCmd(b, c) {
  const allies = b.aliveAllies();
  const hurt = allies.filter((x) => x.hp / x.maxHp < 0.7).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  const mine = (c.abilities || []).filter((id) => canUse(b, c, id) && !c.autoOff?.includes(id) && !ABILITIES[id]?.noAuto);
  if (hurt.length) {
    const heals = mine.filter((id) => prim(ABILITIES[id]).type === 'heal');
    const all = heals.find((id) => ABILITIES[id].target === 'allies');
    if (all && hurt.length >= 2) return { type: 'ability', id: all };
    const one = heals.filter((id) => ABILITIES[id].target === 'ally').sort((x, y) => (ABILITIES[y].effect.base?.[1] || 0) - (ABILITIES[x].effect.base?.[1] || 0))[0];
    if (one) return { type: 'ability', id: one, target: hurt[0].id };
  }
  for (const id of mine) {
    const a = ABILITIES[id];
    const e = prim(a);
    if (e.type !== 'buff' || !['allies', 'ally'].includes(a.target)) continue;
    const st = e.stats || [e.stat];
    const t = a.target === 'ally' ? allies.find((x) => !st.some((s) => x.buffs?.[s])) : allies[0];
    if (!t || st.every((s) => t.buffs?.[s])) continue;
    return { type: 'ability', id, target: t.id };
  }
  return { type: 'defend' };
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
// 敵: まねて いる 人の すがた（client/battle-nocto.js が 影の 色で かさねる）/ 味方: まねられて いる
export function noctoPub(c) {
  if (c.side === 'ally') return c.nsMimicked ? { nsMimicked: true } : {};
  if (!c.mimic) return {};
  const { name, job, look, eq, mon } = c.mimic;
  return { mimic: { name, job, look, eq, mon } };
}
