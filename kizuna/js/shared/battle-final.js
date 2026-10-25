// 第5章 Step 9（B9）「星のない広間」の 最後の 戦いの しかけ（battle.js・ai.js・battle-ch5.js から 短い よびだしで よぶ。ほかの 戦いは かわらない）
//
// ・ノクト（本気。nocto_2）: ノクトの影の まね・きずなくだき（battle-nocto.js）と、1回目の かげぶんしん・地われ（battle-earth.js）を
//   そのまま 使う（monsters-final.js の nocto・nocto1）。新しい まぜかた:
//     ひとりぼっちの合体技が 合体技の よやくも くだく（combo.bond。組の だれかが 身を 守れば 守れる）・HPが 半分で 終わらない（たおすと 勝ち）
//   HPが 半分（nocto2.heartAt）で ことばが かわる: リーダーの フラグ（hooks.leaderFlag）で 思い出の かけら 6つ（c5_ms1〜6）・
//   ピピの 手紙を わたした（c5_letter_given）を 見る（noctoHeart）。シミュレーター・テストは b.leaderFlags
// ・魔王ソリトゥス（solitus）: 3つの 段階（solitus.p2・p3 の HPの わりあいで。1回の 攻撃で 2つ とばない。finalDamage）
//   第1段階 … ひとりにする（status.rift の kind 'alone'。地われと おなじ しくみ: 動けない・回復が とどかない。こんどは 仲間の 補助も とどかない〈aloneBlock〉）
//               → 新しい コマンド「よびかける」（type: 'call'。手をのばすと おなじ 形。オートの 仲間も 回復の あとで 使う〈battle-earth.js の reachPlan〉）
//               ひとりの 人への ソリトゥスの ダメージは alone.hurt ばい
//   第2段階 … 背景が ひとりぼっちの闇（solitus_void）に かわる。eat.every 回 動く ごとと、合体技を 見た あとに 前ぶれ →「きずなを食べる」
//               （みんなに 物理。合体技の よやくを くだく〈組の だれかが 身を 守れば 守れる。battle-nocto.js の crushBonds〉・
//                身を 守らない 人の 強くなる 力を 食べて、その ぶん ソリトゥスの HPが もどる）。闇の口（1人に 大きい・強くなる 力を 食べる）
//   第3段階 … ノクトが ゲストで 加わる（noctoGuestChar）。ひとりの 人は みんな もどる。ノクトの 紋章が 光って、
//               この 戦いだけ「家族の きずな技」（type: 'bond'。職業を 問わず だれでも 出せる。出せる 人 みんなの 名前が 出る）。
//               ゲージ（bond.start から。仲間が 1回 動く ごとに bond.perAct）が 100 で 使える（使うと 0 から）。
//               ダメージは 出す 人 みんなの 力の 合計（光。1回で ソリトゥスの さいだいHPの bond.cap まで）・みんなの HPを 回復・ソリトゥスの 強くなる 力を 消す
//               ソリトゥスは night.every 回 動く ごとに 前ぶれ →「終わらない夜」（みんなに 闇の 大技。身を 守ると 半分）
// ・オートの 仲間（ふつう）: 回復の あとで「よびかける」（reachPlan）・きずな技の ゲージが たまったら 使う（finalPlan）。ほかは かわらない
// ・シミュレーター（tools/sim-final.mjs）の 知っている 人（b.knowsFinal）: よびかけるを 先に・前ぶれで 身を 守る（finalPlan）。
//   ノクト（本気）は ノクトの影・1回目の 知っている 人と おなじ（b.knowsNocto・b.knowsNocto1）
import { MONSTERS } from './data/monsters.js?v=a2abc3298a71';
import { NOCTO2, SOLITUS } from './data/monsters-final.js?v=a2abc3298a71';
import { NOCTO_COMPANION, NOCTO_GUEST } from './data/companions-castle.js?v=a2abc3298a71';
import { JOBS, jobBattlesForLevel } from './data/jobs.js?v=a2abc3298a71';
import { newCharacter, expForLevel, fullHeal } from './stats.js?v=a2abc3298a71';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub, effAtk, effMag } from './battle.js?v=a2abc3298a71';
import { bondTeams, breakTeam, crushBonds } from './battle-nocto.js?v=a2abc3298a71';
import { trap, trappedAllies } from './battle-earth.js?v=a2abc3298a71';

export { NOCTO2, SOLITUS };
export const CALL = 'call';
export const BOND = 'bond';
export const ALONE = 'alone';
export const ALONE_ID = 'm_sl_alone';
export const EAT_WATCH = 'm_sl_eat_watch';
export const EAT = 'm_sl_eat';
export const NIGHT_WATCH = 'm_sl_night_watch';
export const NIGHT = 'm_sl_night';
// 思い出の かけら（maps/memory.js の MEMORY_SHARD_FLAGS と おなじ。テストで たしかめる）・ピピの 手紙を わたした（A の フラグ）
export const SHARD_FLAGS = ['c5_ms1', 'c5_ms2', 'c5_ms3', 'c5_ms4', 'c5_ms5', 'c5_ms6'];
export const LETTER_FLAG = 'c5_letter_given';
export const BOND_NAME = 'みんなの星あかり';
export const BOND_MAX = 100;
// 手で 戦っている 家族が いる ときは、ゲージが たまってから 仲間が この 回数 動くまで、オートの 仲間は きずな技を 使わない（家族が 自分で おせる ように）
export const BOND_WAIT = 6;
export const VOID_BG = 'solitus_void';

const slConf = (m) => MONSTERS[m?.species]?.solitus || null;
const n2Conf = (m) => MONSTERS[m?.species]?.nocto2 || null;
export const solitusOf = (b) => b.enemies.find((e) => e.alive && slConf(e)) || null;
// ひとりに されて いる 人（status.rift の kind 'alone'）
export const aloneAllies = (b) => trappedAllies(b).filter((x) => x.status.rift.kind === ALONE);
const freeAllies = (b) => b.aliveAllies().filter((x) => !x.status?.rift);

// ───────────── はじめ（battle.js の constructor）─────────────
export function setupFinal(b) {
  for (const m of b.enemies) {
    if (!slConf(m)) continue;
    m.slPhase = 1;
    m.slActs = 0;
  }
}

// ───────────── 魔物の 番の はじめ（ai.js の decideMonster。earthAction の あと）─────────────
// 第2段階から: きずなを食べるの 前ぶれ（eat.every 回ごと・合体技を 見た あと）。第3段階: 終わらない夜の 前ぶれ（night.every 回ごと）
export function finalAction(b, m) {
  const conf = slConf(m);
  if (!conf || m.telegraph) return null;
  m.slActs = (m.slActs || 0) + 1;
  const ph = m.slPhase || 1;
  if (ph < 2) return null;
  const recentBig = [EAT_WATCH, EAT, NIGHT_WATCH, NIGHT].some((id) => m.recent.includes(id));
  // 合体技を 見た: 第2段階だけ（前の 大技から 2回 動いた あと）
  if (m.slDualSeen && ph === 2 && !recentBig && m.slActs >= 2) {
    m.slDualSeen = false;
    m.slActs = 0;
    return forced(m, EAT_WATCH);
  }
  if (ph === 2 && m.slActs >= (conf.eat?.every ?? 4)) {
    m.slActs = 0;
    return forced(m, EAT_WATCH);
  }
  if (ph === 3 && m.slActs >= (conf.night?.every ?? 5)) {
    m.slActs = 0;
    return forced(m, NIGHT_WATCH);
  }
  return null;
}
function forced(m, id) {
  m.used[id] = (m.used[id] || 0) + 1;
  m.recent.push(id);
  if (m.recent.length > 3) m.recent.shift();
  return { type: 'ability', id };
}

// 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）
//   sl1・sl23・sl3 … ソリトゥスの 段階 / slAlone … だれも ひとりで ない・動ける 仲間が 2人いじょう
export function finalCond(b, m, cond) {
  switch (cond) {
    case 'sl1': return (m.slPhase || 1) === 1;
    case 'sl23': return (m.slPhase || 1) >= 2;
    case 'sl3': return (m.slPhase || 1) === 3;
    case 'slAlone': return !aloneAllies(b).length && freeAllies(b).length >= 2;
    default: return null;
  }
}

// ───────────── 行動の はじめ（battle-ch5.js の foreseeCheck から）─────────────
// 合体技を 見た ソリトゥスは、次に きずなを食べるの 前ぶれ（第2段階だけ）
export function finalCheck(b, c, cmd) {
  if (c.side !== 'ally' || cmd?.type !== 'dual') return;
  const s = solitusOf(b);
  if (s && s.slPhase === 2) s.slDualSeen = true;
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function finalEffect(b, c, a, eff, ev, targets = []) {
  switch (eff.type) {
    case 'slAlone': isolate(b, c, eff, ev, targets); return true;
    case 'slMaw': maw(b, c, eff, ev, targets); return true;
    case 'slEat': eatBonds(b, c, ev); return true;
    case 'slNight': endlessNight(b, c, ev); return true;
    default: return false;
  }
}

// ひとりにする: 1人を 闇に とじこめる（合体技の よやくの 組の 人を ねらう。組の 手は ひきはなされる）
function isolate(b, c, eff, ev, targets) {
  const free = freeAllies(b);
  const teams = bondTeams(b);
  const team = teams.flatMap((tm) => tm.members).filter((x) => free.includes(x));
  let t = team.length ? b.rng.pick(team) : targets[0];
  if (!t || !t.alive || t.side === c.side || t.status?.rift) t = free.length ? b.rng.pick(free) : null;
  if (!t || free.length < 2) {
    ev.lines.push('しかし、闇はすぐにうすれた。');
    return;
  }
  ev.fx = { type: 'slAlone', anim: 'sl_alone', actor: c.id, targets: [t.id], side: 'enemy' };
  ev.lines.push(`${c.name}「${t.name}。おまえは、ひとりだ」`);
  if (eff.mult) b.physHit(c, t, { mult: eff.mult, acc: 1.3 }, ev, 'phys');
  if (!t.alive) return;
  const torn = teams.filter((tm) => tm.members.includes(t));
  trap(b, t, c, ALONE, ev, slConf(c)?.alone?.turns ?? 4);
  for (const tm of torn) {
    breakTeam(b, tm, ev);
    ev.lines.push(`${tm.members.map((x) => x.name).join('と')}の、つながろうとしていた手が、闇にさえぎられた！`);
  }
  if (torn.length) ev.n1Torn = torn.length;
  ev.slAlone = { who: t.id };
}

// 闇の口: 1人に 大きい・強くなる 力を 食べる
function maw(b, c, eff, ev, targets) {
  const t = targets.find((x) => x.alive) || b.rng.pick(b.aliveAllies());
  if (!t) return;
  ev.fx = { type: 'ability', anim: 'sl_maw', actor: c.id, targets: [t.id], side: 'enemy' };
  b.physHit(c, t, { mult: eff.mult ?? 1.6 }, ev, 'phys');
  if (t.alive && Object.keys(t.buffs || {}).length) {
    t.buffs = {};
    ev.lines.push(`${t.name}の強くなっていた力が、食べられてしまった！`);
    ev.upd.push(t);
  }
}

// きずなを食べる: よやくを しらべて（守れたか・くだかれたか）→ 身を 守らない 人の 強くなる 力を 食べる → みんなに ダメージ → 食べた ぶん 回復
function eatBonds(b, c, ev) {
  const conf = slConf(c)?.eat || {};
  const { broke, guarded } = crushBonds(b, ev, 'の合体技のよやくが、食べられてしまった！');
  const targets = b.aliveAllies();
  let eaten = broke * 2;
  const kept = [];
  for (const t of targets) {
    if (t.defending) {
      kept.push(t.name);
      continue;
    }
    const n = Object.keys(t.buffs || {}).length;
    if (!n) continue;
    t.buffs = {};
    eaten += n;
    ev.lines.push(`${t.name}の強くなっていた力が、食べられてしまった！`);
    ev.upd.push(t);
  }
  if (kept.length) ev.lines.push(`${kept.join('と')}は、身を守って、きずなを食べられなかった！`);
  ev.fx = { type: 'ability', anim: 'sl_eat', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: conf.mult ?? 1.35, ignoreDef: conf.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  if (eaten && c.alive) {
    const h = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * Math.min(conf.healCap ?? 0.03, (conf.heal ?? 0.008) * eaten)));
    if (h > 0) {
      c.hp += h;
      ev.lines.push(`${c.name}は、食べたきずなの力で、HPを${h}回復した…！`);
      (ev.results = ev.results || []).push({ id: c.id, heal: h });
      ev.upd.push(c);
    }
  }
  ev.slEat = { broke, guarded, eaten };
  ev.warn = true;
}

// 終わらない夜: みんなに 闇の 大技（身を 守ると 半分）
function endlessNight(b, c, ev) {
  const conf = slConf(c)?.night || {};
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'sl_night', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy' };
  for (const t of targets) {
    const r = b.calcMagic(c, t, { type: 'magic', element: 'dark', base: conf.base || [300, 340], thr: 99 });
    // calcMagic の 身を 守る（0.75）を 半分に
    const dmg = t.defending ? Math.round((r.dmg * 0.5) / 0.75) : r.dmg;
    if (r.resisted || dmg <= 0) {
      ev.lines.push(`${t.name}はダメージを受けない！`);
      continue;
    }
    b.damage(c, t, dmg, ev, { element: 'dark' });
  }
  ev.slNight = true;
  ev.warn = true;
}

// ───────────── 仲間の 補助が とどかない（battle.js の applyBuff）─────────────
// true … とどかない（ことばは ここで）
export function aloneBlock(c, t, ev) {
  if (t.status?.rift?.kind !== ALONE || !c || c === t || c.side !== t.side) return false;
  ev.lines.push(`${t.name}には、仲間の力がとどかない…！`);
  return true;
}

// ───────────── 新しい コマンド「よびかける」「家族の きずな技」（battle.js の validate・perform）─────────────
export function finalCmdOk(b, c, cmd) {
  if (cmd.type === CALL) {
    const t = b.get(cmd.target);
    const list = aloneAllies(b).filter((x) => x !== c);
    if (t ? !list.includes(t) : !list.length) return { ok: false, reason: 'よびかける相手がいない' };
    return { ok: true };
  }
  const s = solitusOf(b);
  if (!s || (s.slPhase || 1) < 3 || !s.slBond) return { ok: false, reason: 'まだ使えない' };
  if (s.slBond.gauge < BOND_MAX) return { ok: false, reason: 'きずなの光が、まだたまっていない' };
  return { ok: true };
}
export function finalCmd(b, c, cmd, ev) {
  if (cmd.type === CALL) return callOut(b, c, cmd, ev);
  return familyBond(b, c, ev);
}

// よびかける: ひとりの 仲間の 名前を よんで、すぐ もどす（もどった 人は ゲージ 50 から）
function callOut(b, c, cmd, ev) {
  ev.name = 'よびかける';
  let t = b.get(cmd.target);
  const list = aloneAllies(b).filter((x) => x !== c);
  if (!list.includes(t)) t = list[0] || null;
  if (!t) {
    ev.lines.push(`${c.name}はよびかけた。`, 'しかし、もうだれもひとりではない。');
    return;
  }
  ev.lines.push(`${c.name}は、${t.name}の名前を、大きな声でよんだ！`, `「${t.name}！ひとりじゃないよ！」`, `${t.name}は、その声にみちびかれて、闇の中からもどってきた！`);
  delete t.status.rift;
  t.atb = Math.max(t.atb || 0, 50);
  ev.fx = { type: 'slCall', anim: 'sl_call', actor: c.id, targets: [t.id], side: 'ally' };
  ev.n1Free = { who: t.id, by: c.id };
  ev.slCall = { who: t.id, by: c.id };
  ev.upd.push(t);
}

// 家族の きずな技（みんなの星あかり）: 出せる 人（生きていて、ひとりで ない）みんなの 力を あわせる
export function bondMembers(b) {
  return freeAllies(b);
}
// みつもり（シミュレーター・テスト。ダメージの もと）
export function bondPower(b, members, t) {
  const conf = slConf(t)?.bond || {};
  const sum = members.reduce((s, x) => s + Math.max(effAtk(x), effMag(x) * 1.15, (x.healPow || 0) * 1.05), 0);
  const raw = sum * (conf.k ?? 1.35) * (t.resist?.light ?? 1);
  return Math.round(Math.min(raw, t.maxHp * (conf.cap ?? 0.1)));
}
function familyBond(b, c, ev) {
  const s = solitusOf(b);
  const members = bondMembers(b);
  const conf = slConf(s)?.bond || {};
  const names = members.map((x) => x.name);
  ev.name = '家族のきずな技';
  ev.lines.push(`${names.join('・')}の、家族のきずな技！`, `「${BOND_NAME}」！！`, 'つないだ手から、星の光があふれ出す…！');
  ev.fx = { type: 'familyBond', anim: 'family_bond', actor: c.id, targets: s ? [s.id] : [], side: 'ally', ids: members.map((x) => x.id), names };
  ev.familyBond = { ids: members.map((x) => x.id), names };
  ev.extraLock = 2600;
  if (s) {
    s.slBond.gauge = 0;
    s.slBond.wait = 0;
    s.slBond.uses = (s.slBond.uses || 0) + 1;
    const dmg = Math.max(1, Math.round(bondPower(b, members, s) * b.rng.float(0.95, 1.05)));
    b.damage(c, s, dmg, ev, { element: 'light', bond: true });
    ev.familyBond.dmg = dmg;
    if (s.alive && Object.keys(s.buffs || {}).length) b.dispel(s, ev);
    ev.upd.push(s);
  }
  // みんなの HPを 回復・弱くなる 力を 消す
  ev.results = ev.results || [];
  for (const x of members) {
    if (!x.alive) continue;
    const h = Math.min(x.maxHp - x.hp, Math.round(x.maxHp * (conf.heal ?? 0.35)));
    if (h > 0) {
      x.hp += h;
      ev.results.push({ id: x.id, heal: h });
    }
    x.mp = Math.min(x.maxMp, x.mp + Math.round(x.maxMp * (conf.mp ?? 0)));
    x.debuffs = {};
    ev.upd.push(x);
  }
  ev.lines.push((conf.mp ?? 0) > 0 ? 'みんなの体に、あたたかい光がしみこんだ！（HPとMPが回復した）' : 'みんなの体に、あたたかい光がしみこんだ！');
}

// ───────────── こうどうの はじめ（battle-ch5.js の towerTurnStart から）─────────────
// 仲間が 動くと、きずな技の ゲージが たまる（第3段階）
export function finalTurnStart(b, c, ev, cmd) {
  if (c.side !== 'ally' || cmd?.type === 'incapacitated' || cmd?.type === BOND) return;
  const s = solitusOf(b);
  if (!s?.slBond) return;
  if (s.slBond.gauge >= BOND_MAX) {
    s.slBond.wait = (s.slBond.wait || 0) + 1;
    return;
  }
  const was = s.slBond.gauge;
  s.slBond.gauge = Math.min(BOND_MAX, was + (slConf(s)?.bond?.perAct ?? 7));
  if (s.slBond.gauge >= BOND_MAX) ev.bondReady = true;
  ev.upd.push(s);
}

// ───────────── ダメージ（battle.js の damage。earthDamage の あと）─────────────
// ひとりの 人への ソリトゥスの ダメージは alone.hurt ばい / ソリトゥスは 1回の 攻撃で 2つの 段階を とばない（第3段階の 前は たおれない）
export function finalDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0) return dmg;
  if (t.side === 'ally' && t.status?.rift?.kind === ALONE) {
    const conf = slConf(c);
    if (conf) {
      if (!ev.slHurtNote) {
        ev.slHurtNote = true;
        ev.lines.push(`（ひとりぼっちの${t.name}に、闇が強くくいこむ…！）`);
      }
      return Math.round(dmg * (conf.alone?.hurt ?? 1.25));
    }
  }
  const conf = slConf(t);
  if (!conf || t.side !== 'enemy') return dmg;
  const ph = t.slPhase || 1;
  if (ph >= 3) return dmg;
  const floor = ph === 1 ? Math.floor(t.maxHp * (conf.p3 ?? 0.34)) + 1 : 1;
  return Math.max(0, Math.min(dmg, t.hp - floor));
}

// ───────────── 段階・ことば（battle.js の checkPhase の さいご）─────────────
export function finalPhase(b, t, ev) {
  if (!t.alive) return;
  const n2 = n2Conf(t);
  if (n2 && !t.n2Heart && t.hp / t.maxHp <= (n2.heartAt ?? 0.5)) noctoHeart(b, t, ev);
  const conf = slConf(t);
  if (!conf) return;
  if ((t.slPhase || 1) === 1 && t.hp / t.maxHp < (conf.p2 ?? 0.67)) phaseTwo(b, t, ev);
  if (t.slPhase === 2 && t.hp / t.maxHp < (conf.p3 ?? 0.34)) phaseThree(b, t, ev);
}

// リーダーの フラグ（hooks.leaderFlag。シミュレーター・テストは b.leaderFlags）
export function leaderFlag(b, id) {
  if (b.leaderFlags) return !!b.leaderFlags[id];
  try {
    return !!b.hooks?.leaderFlag?.(id);
  } catch {
    return false;
  }
}
export function heartOf(b) {
  return { shards: SHARD_FLAGS.every((f) => leaderFlag(b, f)), letter: leaderFlag(b, LETTER_FLAG) };
}

// ノクト（本気）の HPが 半分: 思い出の かけら・ピピの 手紙で ことばが かわる
function noctoHeart(b, t, ev) {
  t.n2Heart = true;
  const { shards, letter } = heartOf(b);
  const lines = ['ノクト「…どうして、そんなふうに、ならんで立っていられるんだ…」'];
  if (shards) lines.push('みんなが集めた思い出のかけらが、ふわりと光った…！', 'ノクト「…それは、ぼくの…思い出…？」', 'ノクト「星祭りの夜…あたたかい手…わすれていた、はずなのに…」');
  if (letter) lines.push('ノクトのむねのあたりで、ピピの手紙が、かすかに光った…', 'ノクト「…ピピ。ぼくは、まだ…」');
  if (shards && letter) lines.push('ノクトの紋章の光が、ほんの少しだけ、やわらいだ…');
  if (!shards && !letter) lines.push('ノクト「ひとりでいい。ずっと、ひとりだったんだ…！」');
  ev.postLines = (ev.postLines || []).concat(lines);
  ev.n2Heart = { id: t.id, shards, letter };
  ev.upd.push(t);
}

// 第2段階: 背景が ひとりぼっちの闇に。きずなを食べるが 来る
function phaseTwo(b, t, ev) {
  t.slPhase = 2;
  t.slActs = Math.max(0, (slConf(t)?.eat?.every ?? 4) - 2);
  b.bg = VOID_BG;
  ev.bg = VOID_BG;
  ev.slPhase = { id: t.id, phase: 2 };
  ev.extraLock = Math.max(ev.extraLock || 0, 1800);
  ev.postLines = (ev.postLines || []).concat([
    `${t.name}の体が、闇にとけていく…！`, 'まわりの景色が、ひとりぼっちの闇にのみこまれた…！',
    `${t.name}「つながりなど、食べてしまえば、だれもがひとりだ」`,
    '（第2段階：きずなを食べる。前ぶれのあとは、身を守ろう！）',
  ]);
  ev.upd.push(t);
}

// 第3段階: ノクトが 加わる。ひとりの 人は もどる。家族の きずな技が 使える
function phaseThree(b, t, ev) {
  t.slPhase = 3;
  t.slActs = 0;
  t.slBond = { gauge: slConf(t)?.bond?.start ?? BOND_MAX, uses: 0 };
  const lines = [`${t.name}「なぜだ…なぜ、ひとりにならない…！」`, 'そのとき、闇の向こうから、だれかが手をのばした…！'];
  for (const x of aloneAllies(b)) {
    delete x.status.rift;
    lines.push(`${x.name}は、その手につかまって、闇の中からもどってきた！`);
    ev.upd.push(x);
  }
  const level = Math.max(NOCTO_GUEST.lv, ...b.allies.map((x) => x.lv || 1));
  const g = b.addAlly({ char: noctoGuestChar(level), kind: 'guest', auto: true, tactics: 'balanced' });
  g.atb = 60;
  g.n2Guest = true;
  ev.joined = (ev.joined || []).concat([pub(g)]);
  lines.push('ノクト「…ひとりに、させるものか」', 'ノクトが仲間に加わった！', 'ノクトの手の紋章が、初めて、あたたかく光った…！', `（家族のきずな技「${BOND_NAME}」が使えるようになった！だれでも使える）`);
  ev.postLines = (ev.postLines || []).concat(lines);
  ev.slPhase = { id: t.id, phase: 3, nocto: g.id };
  ev.extraLock = Math.max(ev.extraLock || 0, 2200);
  ev.upd.push(t, g);
}

// ゲストの ノクト（その 戦いだけ。魔剣士・職業Lv10・技は 仲間の ノクトと おなじ）
export function noctoGuestChar(level = NOCTO_GUEST.lv) {
  const def = NOCTO_COMPANION;
  const c = newCharacter({ id: 'guest_nocto', name: def.name, look: def.look, job: 'warrior' });
  delete c.jobs[c.job];
  c.job = def.job;
  c.level = level;
  c.exp = expForLevel(level);
  c.jobs[def.job] = { lv: NOCTO_GUEST.jobLv, b: jobBattlesForLevel(NOCTO_GUEST.jobLv, JOBS[def.job]?.tier || 0) };
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null, ...NOCTO_GUEST.gear };
  c.hirameki = [...def.skills];
  c.items = [];
  c.tactics = def.tactics;
  fullHeal(c);
  return c;
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
export function finalKill(b, t, ev) {
  if (t.side !== 'enemy' || !ev) return;
  if (n2Conf(t)) ev.postLines = (ev.postLines || []).concat(['ノクトは、紋章の手をおさえて、ひざをついた…。']);
  if (slConf(t)) ev.postLines = (ev.postLines || []).concat([`${t.name}の体から、闇が、ほどけていく…！`]);
}

// ───────────── オートの 仲間・知っている 人（battle-ch5.js の towerPlan から）─────────────
// ・だれでも（オートも）: きずな技の ゲージが たまったら 使う（b.slNoBond … シミュレーターで 使わない 人と くらべる とき）。
//   ゲストの ノクトは 使わない（家族の 技）。手で 戦っている 家族が いる ときは、たまってから BOND_WAIT 回 たつまで まつ（家族が 自分で おす）
// ・知っている 人（b.knowsFinal）: ひとりの 人に よびかける（回復より 先）・きずなを食べるの 前ぶれ（合体技の 組の 人と、先に 番が 来る 人）と
//   終わらない夜の 前ぶれ（先に 番が 来る 人）で 身を 守る（b.slNoGuard・b.slNoCall … 1つずつ はずして くらべる とき）
export function finalPlan(b, c) {
  if (c.side !== 'ally') return null;
  const s = solitusOf(b);
  if (!s) return null;
  if (s.slBond?.gauge >= BOND_MAX && !b.slNoBond && !c.status?.rift && !c.n2Guest) {
    const hands = b.allies.some((x) => x.alive && x.controller && !x.auto && !x.status?.rift);
    if (!hands || (s.slBond.wait || 0) >= BOND_WAIT) return { type: BOND };
  }
  if (!b.knowsFinal) return null;
  const mine = 100 / atbRate(c);
  const last = s.telegraph && (100 - s.atb) / atbRate(s) <= mine;
  if (!b.slNoGuard && s.telegraph === EAT) {
    const inTeam = bondTeams(b).some((tm) => tm.members.includes(c));
    if (inTeam || last) return { type: 'defend' };
  }
  if (!b.slNoGuard && s.telegraph === NIGHT && last) return { type: 'defend' };
  if (!b.slNoCall) {
    const t = aloneAllies(b).filter((x) => x !== c)[0];
    if (t) return { type: CALL, target: t.id };
  }
  return null;
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
// 敵: ソリトゥスの 段階・きずな技の ゲージ・前ぶれの 技（ノクト〈本気〉も）/ 味方: ゲストの ノクト
export function finalPub(c) {
  if (c.side === 'ally') return c.n2Guest ? { n2Guest: true } : {};
  const o = {};
  if (c.slPhase) {
    o.slPhase = c.slPhase;
    if (c.slBond) o.slBond = Math.round(c.slBond.gauge);
  }
  // 前ぶれが 終わった ときも null を おくる（がめんの わを 消す）
  if (c.slPhase || n2Conf(c)) o.tele = c.telegraph || null;
  return o;
}
