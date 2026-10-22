// 第5章 Step 6・7「大地の神殿」の たたかいの しかけ（battle.js・ai.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・ノクト（1回目。monsters-earth.js の nocto1）
//   かげぶんしん … 自分の 影（ノクトの分身）を clones 体まで よぶ（ゆらめいて、物理が 当たりにくい）。影が そろって 少し たつと、
//                  かならず 前ぶれ「ノクトと影たちが、同じかまえをとった…！」（earthAction）→ 次の 番に「ひとりぼっちの合体技」
//                  （みんなに 物理の 大技。身を 守ると 半分）。前ぶれの 間に 影を 1体でも たおすと、かまえが くずれて 出せない
//                  合体技の あと、影たちは ノクトの 足もとへ もどる（また かげぶんしんから）
//   地われ     … だれか 1人が 地われに 落ちる（status.rift）。動けない・回復を 受けられない。仲間が 新しい コマンド「手をのばす」
//                  （type: 'reach'）を 使うと すぐ もどる。ほうっておいても、その 人の 番が rift 回 来ると 自分で もどる
//                  （ソリトゥスの 第1段階「ひとりにする／よびかける」の 小さな 先出し。docs/plan-ch5.md の 15-3）
//   HPが 半分  … 戦いは 勝ちで 終わる（ノクトは 影の 中へ さがる。たおした ことに なり、経験値・お金・品も もらえる）。
//                  パーティーの だれかが 大事な物「ピピの手紙」（pipi_letter。A の 品）を 持っていると、ことばが かわる
// ・かおのない影（のみこむ）: 地われと おなじ しくみ（kind: 'swallow'）。のみこんだ 影が たおれると、中の 人は 出てくる
// ・天空のまもり兵（まもる）: こわれかけると 1回だけ、HPの 少ない 仲間の 前に 立って、次の 自分の 番まで その 仲間への 攻撃を かわりに 受ける
// ・大地のダンゴムシ（anger）: hits 回 たたかれる ごとに 1だん おこる（目が 赤く なり、攻撃力が 上がる）。ねむっている 間の 攻撃・
//   1回で 最大HPの big より 大きい ダメージは おこらない。かたい こうら（shell。物理の ダメージが へる。合体技は そのまま）
// ・根っこのこびと: 1回 動いた あとは よく にげる（rsFlee）
// ・オートの 仲間（ふつう）: だれかが 地われ・のみこまれて いたら、回復の あとで「手をのばす」（reachPlan。かんたんで あぶなくない ので）。
//   ほかは かわらない。シミュレーター（tools/sim-nocto1.mjs）の 知っている 人（b.knowsNocto1）は、影を 先に たおす・
//   前ぶれで 間に 合わない ときは 身を 守る（earthPlan）
import { MONSTERS } from './data/monsters.js?v=d770bf1f3326';
import { ABILITIES } from './data/abilities.js?v=d770bf1f3326';
import { NOCTO1, NOCTO_CLONE } from './data/monsters-earth.js?v=d770bf1f3326';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=d770bf1f3326';
import { BUFF_ACTS } from './buff-acts.js?v=d770bf1f3326';
import { canUse } from './ai.js?v=d770bf1f3326';
// 合体技の よやくの 組（ノクトの影と おなじ。battle-nocto.js）
import { bondTeams, breakTeam, crushBonds } from './battle-nocto.js?v=d770bf1f3326';

export { NOCTO1, NOCTO_CLONE };
export const REACH = 'reach';
export const CLONES = 'm_n1_clones';
export const RIFT_ID = 'm_n1_rift';
export const COMBO_READY = 'm_n1_combo_ready';
export const COMBO = 'm_n1_combo';
export const SWALLOW = 'm_fs_swallow';
export const PIPI_LETTER = 'pipi_letter';
// 合体技の かまえが くずれた ときの すき（守備力 BREAK_DEF ばい・ノクトが BREAK_ACTS 回 行動するまで。第38回 C で 時間から 回数に）
export const BREAK_DEF = 0.7;
export const BREAK_ACTS = BUFF_ACTS;

const n1Conf = (m) => MONSTERS[m?.species]?.nocto1 || null;
const noctoOf = (b) => b.enemies.find((e) => e.alive && n1Conf(e)) || null;
export const clonesOf = (b, m = null) => b.enemies.filter((e) => e.alive && e.species === NOCTO_CLONE && (!m || e.cloneOf === m.id));
// 地われ・のみこまれ で 動けない 人
export const trappedAllies = (b) => b.aliveAllies().filter((x) => x.status?.rift);
const freeAllies = (b) => b.aliveAllies().filter((x) => !x.status?.rift);
// alone … 第5章 Step 9 の ソリトゥスの「ひとりにする」（battle-final.js。もどすのは「よびかける」）
const TRAP_NAME = { rift: '地われ', swallow: 'のみこまれ', alone: 'ひとりぼっち' };
const reachable = (x) => x.status?.rift && x.status.rift.kind !== 'alone';

// ───────────── はじめ（battle.js の constructor）─────────────
// eva … ゆらめいて 物理が 当たりにくい 魔物（ノクトの分身）。はじめから いる 時も
export function setupEarth(b) {
  for (const e of b.enemies) applyEva(e);
}
function applyEva(m) {
  const e = MONSTERS[m.species]?.eva;
  if (e) m.buffs.eva = { add: e, left: Infinity }; // 空を とぶ 魔物の かいひは ずっと
}

// ───────────── 魔物の 番の はじめ（ai.js の decideMonster。noctoAction の あと）─────────────
// ノクト: 影が そろって、ノクトが 1回 動いた あとは かならず 合体技の 前ぶれ（つづけては しない）
export function earthAction(b, m) {
  const conf = n1Conf(m);
  if (!conf || m.telegraph) return null;
  m.n1Acts = (m.n1Acts || 0) + 1;
  const ready = clonesOf(b, m).length >= (conf.clones ?? 2);
  if (ready && m.n1CloneAt !== undefined && m.n1Acts > m.n1CloneAt + 1 && !m.recent.includes(COMBO_READY)) return forced(m, COMBO_READY);
  return null;
}
function forced(m, id) {
  m.used[id] = (m.used[id] || 0) + 1;
  m.recent.push(id);
  if (m.recent.length > 3) m.recent.shift();
  return { type: 'ability', id };
}

// 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）
//   n1Clones … 影が そろって いない / n1Rift … だれも 落ちて いない・動ける 仲間が 2人いじょう / fsSwallow … この 影が まだ だれも のみこんで いない /
//   sgGuard … ほかの 魔物が いる / rsFlee … もう 1回 動いた
export function earthCond(b, m, cond) {
  if (cond === 'n1Clones') return clonesOf(b, m).length < (n1Conf(m)?.clones ?? 2) && b.aliveEnemies().length < 7;
  if (cond === 'n1Rift') return !trappedAllies(b).length && freeAllies(b).length >= 2;
  if (cond === 'fsSwallow') return !b.allies.some((x) => x.alive && x.status?.rift?.by === m.id) && freeAllies(b).length >= 2;
  if (cond === 'sgGuard') return b.aliveEnemies().some((e) => e !== m);
  if (cond === 'rsFlee') return (m.recent?.length || 0) >= 1;
  return null;
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function earthEffect(b, c, a, eff, ev, targets = []) {
  switch (eff.type) {
    case 'sgGuard': sgGuard(b, c, ev); return true;
    case 'n1Rift': riftStart(b, c, a, eff, ev, targets); return true;
    case 'n1Clones': summonClones(b, c, ev); return true;
    case 'n1Combo': combo(b, c, ev); return true;
    default: return false;
  }
}

// 天空のまもり兵: HPの いちばん 少ない 仲間の 前に 立つ（次の 自分の 番まで）
function sgGuard(b, c, ev) {
  const f = b.aliveEnemies().filter((e) => e !== c).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  if (!f) {
    ev.lines.push('しかし、守る仲間がいなかった…。');
    return;
  }
  c.sgGuard = { target: f.id };
  ev.lines.push(`${c.name}は、${f.name}の前に立った！`, `（${f.name}への攻撃を、かわりに受けるつもりだ…！）`);
  ev.fx = { type: 'sgGuard', anim: 'sg_guard', actor: c.id, targets: [f.id], side: 'enemy' };
  ev.upd.push(c, f);
}

// 地われ・のみこむ: 1人を 動けなく する（はじめに 少し ダメージ。のみこむ は よけられると のみこめない）
function riftStart(b, c, a, eff, ev, targets) {
  const kind = eff.kind || 'rift';
  const free = freeAllies(b);
  let t = targets[0];
  // ノクトの 地われは、合体技の よやくの 組の 人を ねらう（手を ひきはなす。のみこむ は ふつう）
  const teams = kind === 'rift' ? bondTeams(b) : [];
  const team = teams.flatMap((tm) => tm.members).filter((x) => free.includes(x));
  if (team.length) t = b.rng.pick(team);
  if (!t || !t.alive || t.side === c.side || t.status?.rift) t = free.length ? b.rng.pick(free) : null;
  if (!t || free.length < 2) {
    ev.lines.push(kind === 'swallow' ? 'しかし、だれものみこめなかった！' : 'しかし、地われはすぐにとじた！');
    return;
  }
  ev.fx = { type: 'n1Rift', anim: a.anim, actor: c.id, targets: [t.id], side: 'enemy', kind };
  const n0 = (ev.results || []).length;
  if (eff.mult) b.physHit(c, t, { mult: eff.mult }, ev, 'phys');
  const r = (ev.results || []).slice(n0).find((x) => x.id === t.id);
  if (!t.alive || (kind === 'swallow' && r?.miss)) return;
  // 合体技の よやくの 組の 人が 落ちると、組の みんなの 手が ひきはなされる（よやくは こわれ、みんなの ゲージは 0 から。battle-nocto.js の breakTeam）
  const torn = teams.filter((tm) => tm.members.includes(t));
  trap(b, t, c, kind, ev);
  for (const tm of torn) {
    breakTeam(b, tm, ev);
    ev.lines.push(`${tm.members.map((x) => x.name).join('と')}の、つながろうとしていた手が、地われにひきはなされた！`);
  }
  if (torn.length) ev.n1Torn = torn.length;
}

// 動けなく する（ならんで いた 行動・合体技の よやく・さそいも とりやめ）
export function trap(b, t, by, kind, ev, turns = n1Conf(by)?.rift ?? 3) {
  t.status.rift = { turns, by: by.id, kind };
  for (const q of b.queue) if (q.id === t.id && q.cmd?.type === 'dual') b.releasePartners(q.cmd);
  b.queue = b.queue.filter((q) => q.id !== t.id);
  if (t.waitDual) b.endWait(t, null, false);
  for (const inv of [...b.invites.values()]) if (inv.from === t.id || inv.to === t.id || inv.partners?.includes(t.id)) b.endInvite(inv, '動けない');
  Object.assign(t, { ready: false, queued: false, defending: false, cover: null, atb: 0 });
  if (kind === 'swallow') ev.lines.push(`${t.name}は、${by.name}にのみこまれてしまった！`, '（動けない！回復もとどかない…！仲間が「手をのばす」と助け出せる）');
  else if (kind === 'alone') ev.lines.push(`${t.name}は、ひとりぼっちの闇にとじこめられてしまった！`, '（動けない！仲間の回復も補助もとどかない…！仲間が「よびかける」と、もどってこられる）');
  else ev.lines.push(`${t.name}は、地われに落ちてしまった！`, '（動けない！回復もとどかない…！仲間が「手をのばす」と助けられる）');
  ev.n1Trap = { who: t.id, kind };
  ev.warn = true;
  ev.upd.push(t);
}

// もどる（手をのばす・自分で・のみこんだ 影が たおれた）
function release(b, t, ev) {
  delete t.status.rift;
  if (ev) ev.upd.push(t);
}

// 落ちて いる 人の 番（battle.js の doIncapacitated）: rift 回めで 自分で もどる
export function riftTurn(b, c, ev) {
  const s = c.status.rift;
  ev.name = TRAP_NAME[s.kind] || '地われ';
  ev.fx = { type: 'n1RiftTurn', actor: c.id, kind: s.kind };
  s.turns--;
  const by = b.get(s.by);
  if (s.turns > 0) {
    ev.lines.push(s.kind === 'swallow' ? `${c.name}は、${by?.name || '影'}の中で、もがいている…！` : s.kind === 'alone' ? `${c.name}は、ひとりぼっちの闇の中で、仲間の声を探している…` : `${c.name}は、地われの中から、手をのばしている…！`);
    return;
  }
  release(b, c, ev);
  ev.lines.push(s.kind === 'swallow' ? `${c.name}は、自分の力で、外にぬけ出した！` : s.kind === 'alone' ? `${c.name}は、自分の力で、闇の中から歩き出した！` : `${c.name}は、自分の力で、地われからはい上がった！`);
  ev.n1Free = { who: c.id, by: null };
  ev.atbAfter = 60;
}

// ───────────── 新しい コマンド「手をのばす」（battle.js の validate・perform）─────────────
export function reachOk(b, c, cmd) {
  const t = b.get(cmd.target);
  if (t ? t.side !== 'ally' || !t.alive || !reachable(t) || t === c : !trappedAllies(b).some((x) => x !== c && reachable(x))) return { ok: false, reason: '手をのばす相手がいない' };
  return { ok: true };
}
export function reach(b, c, cmd, ev) {
  ev.name = '手をのばす';
  let t = b.get(cmd.target);
  if (!t || !t.alive || !reachable(t) || t === c) t = trappedAllies(b).find((x) => x !== c && reachable(x)) || null;
  if (!t) {
    ev.lines.push(`${c.name}は手をのばした。`, 'しかし、もうだれも落ちていない。');
    return;
  }
  const s = t.status.rift;
  const by = b.get(s.by);
  ev.lines.push(`${c.name}は、${t.name}に手をのばした！`);
  ev.lines.push(s.kind === 'swallow' ? `${t.name}は、その手につかまって、${by?.name || '影'}の中から助け出された！` : `${t.name}は、その手をつかんで、地われからはい上がった！`);
  release(b, t, ev);
  // 助けられた 人は 少し 早く 番が 来る
  t.atb = Math.max(t.atb || 0, 50);
  ev.fx = { type: 'n1Reach', anim: 'n1_reach', actor: c.id, targets: [t.id], side: 'ally', kind: s.kind };
  ev.n1Free = { who: t.id, by: c.id };
  ev.upd.push(t);
}

// オートの 仲間（ai.js の decideAlly。回復の あと）: だれかが 落ちて いたら 手を のばす
// （ソリトゥスに ひとりに された 人には「よびかける」。type: 'call'。battle-final.js）
export function reachPlan(b, c) {
  // b.n1NoReach … シミュレーターで「手を のばさない（よびかけない）」人と くらべる とき
  if (c.side !== 'ally' || c.status?.rift || b.n1NoReach) return null;
  const t = trappedAllies(b).filter((x) => x !== c).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  if (!t) return null;
  return { type: t.status.rift.kind === 'alone' ? 'call' : REACH, target: t.id };
}

// ───────────── かげぶんしん・ひとりぼっちの合体技 ─────────────
function summonClones(b, c, ev) {
  const need = (n1Conf(c)?.clones ?? 2) - clonesOf(b, c).length;
  const n = Math.min(need, 7 - b.aliveEnemies().length);
  if (n <= 0) {
    ev.lines.push('しかし、影はゆらめいただけだった。');
    return;
  }
  const added = b.addEnemies(Array(n).fill(NOCTO_CLONE));
  for (const m of added) {
    m.atb = b.rng.float(10, 40);
    m.cloneOf = c.id;
    applyEva(m);
  }
  c.n1CloneAt = c.n1Acts || 0;
  ev.joined = (ev.joined || []).concat(added.map(pub));
  ev.lines.push(`${MONSTERS[NOCTO_CLONE].name}が${n}体、あらわれた！`, '（影が2体そろうと、ひとりぼっちの合体技をねらってくる…！影をたおせば止められる）');
  ev.fx = { type: 'n1Clones', anim: 'n1_clones', actor: c.id, targets: added.map((m) => m.id), side: 'enemy' };
  ev.n1Clones = added.map((m) => m.id);
}

function combo(b, c, ev) {
  const conf = n1Conf(c)?.combo || {};
  const cl = clonesOf(b, c);
  if (cl.length < (n1Conf(c)?.clones ?? 2)) {
    ev.lines.push('しかし、影がそろわず、合体技は出せなかった！');
    ev.n1Break = true;
    return;
  }
  // 第5章 Step 9 の ノクト（本気）: 合体技の よやくも くだく（組の だれかが 身を 守れば 守れる。battle-nocto.js の crushBonds）
  if (conf.bond) crushBonds(b, ev, 'の合体技のよやくが、ひとりぼっちの合体技にくだかれた！');
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'n1_combo', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: conf.mult ?? 2.3, ignoreDef: conf.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  // stay … 影は のこる（影を たおすまで、また 前ぶれ → 合体技）。ない ときは ノクトの 足もとへ もどる
  if (n1Conf(c)?.stay) c.n1CloneAt = c.n1Acts || 0;
  else {
    for (const x of cl) vanish(b, x, ev);
    ev.lines.push('影たちは、ノクトの足もとへ、すうっともどっていった…');
  }
  ev.n1Combo = true;
  ev.warn = true;
}

// 消す（たおした ことには しない。経験値も ない）
function vanish(b, x, ev) {
  Object.assign(x, { alive: false, hp: 0, ready: false, queued: false, status: {}, buffs: {}, debuffs: {}, telegraph: null });
  b.queue = b.queue.filter((q) => q.id !== x.id);
  if (ev) {
    (ev.results = ev.results || []).push({ id: x.id, pop: true });
    ev.upd.push(x);
  }
}

// ───────────── 行動の はじめ（battle-ch5.js の towerTurnStart から）─────────────
// まもり兵の「まもる」は 次の 自分の 番で とける
export function earthTurnStart(b, c, ev) {
  if (!c.sgGuard) return;
  c.sgGuard = null;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle.js の damage。noctoDamage の あと）─────────────
// null … ここで おわり（まもり兵が かわりに 受けた）。数 … その ダメージで つづける
export function earthDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0 || t.side !== 'enemy') return dmg;
  if (c.side === 'ally') {
    // まもり兵が かばう
    // （かばった まもり兵への ダメージは、もう かばわない。まもり兵どうしで かばいあっても 1回だけ）
    const g = info.sgCover ? null : b.enemies.find((e) => e.alive && e !== t && e.sgGuard?.target === t.id);
    if (g) {
      ev.lines.push(`${g.name}が、${t.name}をかばった！`);
      ev.sgCover = { by: g.id, of: t.id };
      b.damage(c, g, dmg, ev, { ...info, sgCover: true });
      return null;
    }
    const m = MONSTERS[t.species];
    // かたい こうら（物理だけ。合体技は そのまま）
    if (m?.shell && info.element === 'phys' && !ev.dual) {
      dmg = Math.max(1, Math.round(dmg * m.shell));
      if (!ev.pbShell) {
        ev.pbShell = true;
        b.pbSaid = (b.pbSaid || 0) + 1;
        if (b.pbSaid <= 2) ev.lines.push('（かたいこうらで、ダメージがへった…！）');
      }
    }
    if (m?.anger) anger(b, t, dmg, ev, m.anger);
  }
  // ノクトは たおれない（HPが 半分で 戦いを やめる。earthStop）。stopAt: 0 … 終わらない（第5章 Step 9 の ノクト〈本気〉）
  if (n1Conf(t) && (n1Conf(t).stopAt ?? 0.5) > 0 && dmg >= t.hp) dmg = Math.max(0, t.hp - 1);
  return dmg;
}

// ダンゴムシが おこる（ねむっている・1回で 大きい ダメージ の ときは おこらない）
function anger(b, t, dmg, ev, conf) {
  if (t.status.sleep || dmg >= t.maxHp * (conf.big ?? 0.3) || dmg >= t.hp) return;
  t.angerHits = (t.angerHits || 0) + 1;
  const lv = Math.min(conf.atk.length, Math.floor(t.angerHits / (conf.hits || 3)));
  if (lv <= (t.anger || 0)) return;
  t.anger = lv;
  const k = conf.atk[lv - 1];
  t.buffs.atk = { mult: k, base: k, lv: 1, left: Infinity }; // おこった 攻撃力は ずっと
  ev.postLines = (ev.postLines || []).concat(lv >= conf.atk.length ? [`${t.name}の目が、まっかにもえている！`, `（${t.name}は、とてもおこっている…！攻撃力がもっと上がった！）`] : [`${t.name}の目が、赤くなった！`, `（${t.name}は、おこっている…！攻撃力が上がった！）`]);
  ev.pbAnger = { id: t.id, lv };
  ev.upd.push(t);
}

// ───────────── HPが 半分（battle.js の checkPhase の さいご）─────────────
// 大事な物「ピピの手紙」を 持っている 人（hooks.hasItem。シミュレーター・テストは b.pipiLetter）
function letterHolder(b) {
  if (b.pipiLetter !== undefined) return b.pipiLetter ? b.allies[0] || null : null;
  for (const a of b.allies) {
    try {
      if (b.hooks?.hasItem?.(a, PIPI_LETTER)) return a;
    } catch { /* */ }
  }
  return null;
}
export function earthStop(b, t, ev) {
  const conf = n1Conf(t);
  if (!conf || !(conf.stopAt ?? 0.5) || !t.alive || t.n1Stopped || t.hp / t.maxHp > (conf.stopAt ?? 0.5)) return;
  t.n1Stopped = true;
  const holder = letterHolder(b);
  const lines = holder
    ? [`${holder.name}のふくろの中で、ピピの手紙が、ふわりと光った…！`, 'ノクト「……それは……」', 'ノクト「…ピピの、字だ…」', 'ノクトは、紋章の手を、そっと下ろした…。']
    : ['ノクト「…今のは、ほんの小手調べだ」'];
  lines.push('ノクトは、戦いをやめて、影の中へ、すっと下がった…！');
  ev.postLines = (ev.postLines || []).concat(lines);
  ev.n1Stop = { id: t.id, letter: !!holder };
  // 戦いは 勝ち（たおした ことに なる。影は 消える・落ちて いた 人も もどる。earthKill）。のこりの HPは そのまま 見せる
  const hp = t.hp;
  b.kill(t, null, ev);
  t.hp = hp;
  ev.upd.push(t);
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
// のみこんだ 影・ノクトが たおれると 中の 人が もどる。ノクトが さがると 影も 消える。影が たおれると 合体技の かまえが くずれる
export function earthKill(b, t, ev) {
  if (t.side !== 'enemy') return;
  const out = [];
  for (const x of b.allies) {
    if (!x.alive || x.status?.rift?.by !== t.id) continue;
    const kind = x.status.rift.kind;
    release(b, x, ev);
    out.push(kind === 'swallow' ? `のみこまれていた${x.name}が、外に出てきた！` : kind === 'alone' ? `${x.name}は、闇の中からもどってきた！` : `${x.name}は、地われからはい上がった！`);
    if (ev) ev.n1Free = { who: x.id, by: null };
  }
  if (n1Conf(t)) {
    for (const x of clonesOf(b, t)) vanish(b, x, ev);
  } else if (t.species === NOCTO_CLONE) {
    const n = b.get(t.cloneOf);
    if (n?.alive && n.telegraph === COMBO) {
      // かまえが くずれて すきが できる（ゲージは 0 から・しばらく 守りが 下がる）
      n.telegraph = null;
      if (!n.queued) n.atb = 0;
      n.debuffs.def = { mult: BREAK_DEF, base: BREAK_DEF, lv: 1, left: BREAK_ACTS };
      out.push('影がひとり消えて、ノクトの合体技のかまえが、くずれた！', '（ノクトに、すきができた！ノクトの守備力が下がった！）');
      if (ev) {
        ev.n1Break = true;
        ev.upd.push(n);
      }
    }
  }
  if (out.length && ev) ev.postLines = (ev.postLines || []).concat(out);
}

// ───────────── 知っている 人の オート（battle-ch5.js の towerPlan から。b.knowsNocto1）─────────────
// ・合体技の 前ぶれ: いちばん HPの 少ない 影を ねらう（いちばん ダメージの 大きい 攻撃）。影を たおせそうに なく、
//   合体技より 先に もう 番が 来ない 人は 身を 守る
// ・だれかが 落ちて いる: 手を のばす（影を ねらう ほうが 先）
// （b.n1NoClone・b.n1NoGuard・b.n1NoReach … シミュレーターで 1つずつ はずして くらべる とき）
export function earthPlan(b, c) {
  if (c.side !== 'ally' || !b.knowsNocto1) return null;
  const n = noctoOf(b);
  if (!n) return null;
  const cl = clonesOf(b, n).sort((x, y) => x.hp - y.hp);
  const warned = n.telegraph === COMBO;
  const mine = 100 / atbRate(c);
  const last = warned && (100 - n.atb) / atbRate(n) <= mine;
  // 前ぶれの 間だけ 影を ねらう（ふだん 影を たおしても、また よばれる だけ。前ぶれの 間に たおすと、ノクトの 番が 1回 むだに なる）
  if (warned && cl.length && !b.n1NoClone) {
    const hit = bestHit(b, c, cl[0]);
    if (hit && (!last || hit.dmg >= cl[0].hp * 0.6 || b.n1NoGuard)) return hit.cmd;
  }
  if (warned && last && !b.n1NoGuard) return { type: 'defend' };
  if (!b.n1NoReach) {
    const r = reachPlan(b, c);
    if (r) return r;
  }
  return null;
}

// t に いちばん ダメージの 大きい 攻撃（ふつうの 攻撃・1体・グループ・全体の 技）{ cmd, dmg }
export function bestHit(b, c, t) {
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !canUse(b, c, id) || c.autoOff?.includes(id) || a.noAuto || !['enemy', 'group', 'enemies'].includes(a.target)) continue;
    const e = a.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a.effect || {};
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element || 'phys', true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    // 全体の 技は 少しだけ 上に（ほかの 影・ノクトにも 当たる）
    if (dmg * (a.target === 'enemies' ? 1.1 : 1) > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best;
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
// 味方: 地われ・のみこまれ（trap）/ 敵: おこっている だんかい（anger）・かばっている 仲間（sgGuard）・ノクトの 影（clone）
export function earthPub(c) {
  // trap: null … もどった とき、がめんの しるしも 消える（Object.assign で 上がき）
  if (c.side === 'ally') return { trap: c.status?.rift ? c.status.rift.kind : null };
  const o = {};
  if (c.anger) o.anger = c.anger;
  if (c.sgGuard) o.sgGuard = c.sgGuard.target;
  return o;
}
