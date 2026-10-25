// 第5章 Step 2「星の塔」の たたかいの しかけ（battle.js・ai.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・見通しの目（星の番人アルゴス。monsters の foresee）:
//   「アルゴスの3つの目が、〇〇をじっと見ている…」で、その 人の 次の 行動の 種類（KINDS: 攻撃・呪文・回復・防御）を 読む。
//   読む 種類は、その 人が この 戦いで さいごに 使った 行動の 種類（まだ 何も して いなければ、職業と 技から いちばん しそうな もの）。
//   読まれた 人が 次に その 種類の 行動を そのまま 使うと（foreseeHit）:
//     攻撃（ふつうの 攻撃・特技・魔法剣）… かわされて、アルゴスの 反撃（foresee.counter ばい）
//     呪文（回復 いがい）… MPを はらって、はね返される（foresee.bounce ばい・さいだいHPの foresee.cap まで。ダメージの ない 呪文は かき消される）
//     回復（回復・生き返り・治す 技と 道具）… MPを はらって、かき消される（道具は へらない）
//     防御 … 守りを 見ぬかれて、身を 守れず 守備力が 下がる
//   ちがう 種類の 行動を すれば「読みが外れた！」で、アルゴスの こうどうゲージが foresee.daze へる（目が くらむ）。
//   読みは その 人の 次の 番まで（ねむり・マヒで 動けない 番が 来ても 消える）。HPが foresee.two より へると 2人を 同時に 読む
//   合体技（ミナデインも）・にげる・混乱した 時の 行動は 読まれない（読みは 消える）
// ・オートの 仲間: 読まれた 種類の 行動を さけて、ちがう 行動を えらぶ（towerPlan）。シミュレーター（tools/sim.js）の
//   b.argosNaive … 知らない 人（読まれても そのまま）／ b.knowsArgos … 知っている 人（星のさばきの 前に 身を 守る も）
import { MONSTERS } from './data/monsters.js?v=b4e31baa770b';
import { ABILITIES } from './data/abilities.js?v=b4e31baa770b';
import { abilityFor } from './ability-label.js?v=b4e31baa770b';
import { ITEMS } from './data/items.js?v=b4e31baa770b';
import { mpCost, penaltyFor } from './stats.js?v=b4e31baa770b';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=b4e31baa770b';
import { canUse } from './ai.js?v=b4e31baa770b';
// 第5章 Step 4: ガイアイーターの 多部位の 戦い（battle-gaia.js。ここから よぶ）
import { gaiaEffect, gaiaCond, gaiaKill, gaiaPlan, gaiaPub } from './battle-gaia.js?v=b4e31baa770b';
// 第5章 Step 5: ノクトの影（職業の まね・合体技の よやくを こわす。battle-nocto.js。ここから よぶ）
import { noctoCond, noctoEffect, noctoCheck, noctoKill, noctoPlan, noctoPub } from './battle-nocto.js?v=b4e31baa770b';
// 第5章 Step 6・7: ノクト（1回目）・大地の神殿の 魔物（かげぶんしん・地われ・まもる・おこる。battle-earth.js。ここから よぶ）
import { earthCond, earthEffect, earthKill, earthPlan, earthPub, earthTurnStart } from './battle-earth.js?v=b4e31baa770b';
// 第5章 Step 9: ノクト（本気）・魔王ソリトゥス（ひとりにする・よびかける・きずなを食べる・家族の きずな技。battle-final.js。ここから よぶ）
import { finalCond, finalEffect, finalCheck, finalKill, finalPlan, finalPub, finalTurnStart } from './battle-final.js?v=b4e31baa770b';
// 第5章 Step 8: 影の城の 3人の まぼろし（風のかべ・かげ火の力・水かさ。battle-phantom.js。ここから よぶ）
import { phantomCond, phantomEffect, phantomPlan, phantomPub, phantomTurnStart } from './battle-phantom.js?v=b4e31baa770b';
// 第2部 第6章 Step 1・2: サンドクロック（砂が落ちきると…）・ギアドン（まき戻し）。battle-ch6.js。ここから よぶ
import { ch6Cond, ch6Effect, ch6Plan, ch6Pub, ch6TurnStart } from './battle-ch6.js?v=b4e31baa770b';
// 第37回 A: サファラ闘技場の 王者の しかけ（チームの 合体技・属性の よろい）
import { arenaCond, arenaEffect } from './battle-arena.js?v=b4e31baa770b';

export const ARGOS = 'argos';
export const JUDGE = 'm_argos_judge';
export const KINDS = ['phys', 'spell', 'heal', 'guard'];
export const KIND_NAMES = { phys: '攻撃', spell: '呪文', heal: '回復', guard: '防御' };
// 回復の なかまの 技の こうか
const HEAL_TYPES = new Set(['heal', 'revive', 'reviveAll', 'cure', 'mpHeal', 'regen']);
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
const isSpell = (a) => !!a && (a.kind === 'spell' || !!a.spellLike);
const confOf = (m) => MONSTERS[m?.species]?.foresee || null;
// ことばで 使う みじかい 名前（星の番人アルゴス → アルゴス）
const shortName = (m) => (m.species === ARGOS ? 'アルゴス' : m.name);

// ───────────── 行動の 種類 ─────────────
// cmd の 種類（読まれない 行動は null）
export function actKind(cmd) {
  if (!cmd) return null;
  switch (cmd.type) {
    case 'attack': case 'mahouken': return 'phys';
    case 'defend': return 'guard';
    case 'item': return 'heal';
    case 'ability': {
      const a = ABILITIES[cmd.id];
      if (!a) return null;
      if (HEAL_TYPES.has(prim(a).type)) return 'heal';
      return isSpell(a) ? 'spell' : 'phys';
    }
    default: return null;
  }
}

// アルゴスが 読む 種類: さいごに 使った 行動の 種類。まだ なければ、職業と 技から いちばん しそうな もの
export function predictKind(c) {
  if (c.lastKind) return c.lastKind;
  const abs = (c.abilities || []).map((id) => ABILITIES[id]).filter(Boolean);
  const attackSpell = abs.some((a) => isSpell(a) && prim(a).type === 'magic' && FOES.has(a.target));
  const healSpell = abs.some((a) => HEAL_TYPES.has(prim(a).type) && prim(a).type === 'heal');
  if (attackSpell && (c.mag || 0) >= (c.atk || 0) * 0.9) return 'spell';
  if (healSpell && (c.healPow || 0) >= (c.atk || 0)) return 'heal';
  return 'phys';
}

// 読める 人（生きている・まだ 読まれていない・もう 行動を きめて ならんで いない・水のろうに いない）
function gazeTargets(b) {
  return b.aliveAllies().filter((x) => !x.foresee && !x.queued && !x.status?.prison);
}
// 今 何人を 同時に 読むか
function gazeCount(m) {
  const conf = confOf(m);
  return conf && m.hp / m.maxHp < (conf.two ?? 0) ? 2 : 1;
}
const readBy = (b, m) => b.allies.filter((x) => x.alive && x.foresee?.by === m.id);

// 魔物の こうどうの じょうけん（ai.js の condOk。'c5:' の あと）
export function towerCond(b, m, cond) {
  const g = gaiaCond(b, m, cond);
  if (g !== null) return g;
  const n = noctoCond(b, m, cond);
  if (n !== null) return n;
  const e = earthCond(b, m, cond);
  if (e !== null) return e;
  const fc = finalCond(b, m, cond);
  if (fc !== null) return fc;
  const ph = phantomCond(b, m, cond);
  if (ph !== null) return ph;
  const c6 = ch6Cond(b, m, cond);
  if (c6 !== null) return c6;
  const ar = arenaCond(b, m, cond);
  if (ar !== null) return ar;
  if (cond === 'gaze') return !!confOf(m) && readBy(b, m).length < gazeCount(m) && gazeTargets(b).length > 0;
  return true;
}

// ───────────── 技の こうか（battle.js の applyAbility の のこり）─────────────
export function towerEffect(b, c, a, eff, ev, targets = []) {
  if (gaiaEffect(b, c, a, eff, ev)) return true;
  if (noctoEffect(b, c, a, eff, ev)) return true;
  if (earthEffect(b, c, a, eff, ev, targets)) return true;
  if (finalEffect(b, c, a, eff, ev, targets)) return true;
  if (phantomEffect(b, c, a, eff, ev, targets)) return true;
  if (ch6Effect(b, c, a, eff, ev, targets)) return true;
  if (arenaEffect(b, c, a, eff, ev, targets)) return true;
  if (eff.type !== 'foresee') return false;
  foreseeStart(b, c, ev);
  return true;
}

function foreseeStart(b, c, ev) {
  const pool = gazeTargets(b);
  const want = Math.max(0, gazeCount(c) - readBy(b, c).length);
  const picks = [];
  while (picks.length < want && pool.length) {
    const t = b.rng.pick(pool);
    pool.splice(pool.indexOf(t), 1);
    picks.push(t);
  }
  if (!picks.length) {
    ev.lines.push('しかし、だれのことも見通せなかった。');
    return;
  }
  const A = shortName(c);
  for (const t of picks) {
    const kind = predictKind(t);
    t.foresee = { by: c.id, kind };
    ev.lines.push(`${A}の3つの目が、${t.name}をじっと見ている…`, `（${t.name}の次の「${KIND_NAMES[kind]}」が、読まれている…！）`);
    ev.upd.push(t);
  }
  ev.lines.push('（読まれた種類とはちがう行動をすれば、外れるはずだ…！）');
  ev.fx = { type: 'foresee', anim: 'foresee', actor: c.id, targets: picks.map((t) => t.id), kinds: picks.map((t) => t.foresee.kind), side: 'enemy' };
  ev.warn = true;
}

// ───────────── こうどうの はじめ（battle.js の executeNext）─────────────
// 動けない 番（ねむり・マヒ・水のろう）でも 読みは 消える。読んだ アルゴスが もう いなければ 消える
export function towerTurnStart(b, c, ev, cmd) {
  earthTurnStart(b, c, ev);
  finalTurnStart(b, c, ev, cmd);
  phantomTurnStart(b, c, ev, cmd);
  ch6TurnStart(b, c, ev, cmd);
  if (c.side !== 'ally' || !c.foresee) return;
  const by = b.get(c.foresee.by);
  if (!by?.alive || cmd?.type === 'incapacitated') {
    delete c.foresee;
    if (by?.alive) ev.lines.push(`${shortName(by)}の目が、${c.name}からはなれた。`);
    ev.upd.push(c);
  }
}

// ───────────── 行動の はじめ（battle.js の perform の さいしょ）─────────────
// 読まれた 種類と おなじ 行動なら しかえし（true … この 行動は ここで おわり）。ちがえば 外れ（false … ふつうに つづける）
export function foreseeCheck(b, c, cmd, ev) {
  if (c.side !== 'ally') return false;
  // ノクトの影は 合体技を 見ると 次に きずなくだきの 前ぶれ（battle-nocto.js）
  if (noctoCheck(b, c, cmd)) return true;
  // ソリトゥスも 合体技を 見ると 次に きずなを食べるの 前ぶれ（battle-final.js）
  finalCheck(b, c, cmd);
  const kind = cmd.confused ? null : actKind(cmd);
  const f = c.foresee;
  if (kind) c.lastKind = kind;
  if (!f) return false;
  delete c.foresee;
  ev.upd.push(c);
  const by = b.get(f.by);
  if (!by?.alive || !kind) return false;
  if (kind !== f.kind) {
    foreseeMiss(b, c, by, ev);
    return false;
  }
  return foreseeHit(b, c, cmd, ev, by, kind);
}

// 読みが 外れた: アルゴスの 目が くらむ（こうどうゲージが へる。もう 行動を きめて いる ときは そのまま）
function foreseeMiss(b, c, by, ev) {
  const conf = confOf(by) || {};
  const A = shortName(by);
  (ev.postLines = ev.postLines || []).push(`${A}の読みが外れた！`, `${A}の3つの目が、くらくらしている…！`);
  if (!by.queued && !by.ready) by.atb = Math.max(0, (by.atb || 0) - (conf.daze ?? 20));
  ev.foreseeMiss = { by: by.id, who: c.id };
  ev.upd.push(by);
}

// 読まれた 種類の 行動を そのまま 使った
function foreseeHit(b, c, cmd, ev, by, kind) {
  const conf = confOf(by) || {};
  const A = shortName(by);
  // 何を しようと したか（ふつうの 行動と おなじ はじめの ことば）
  // 使う 人 むけの 技の 名前・セリフ（男の子の 美少女戦士など。ability-label.js）
  const a = cmd.type === 'ability' ? abilityFor(cmd.id, c) : null;
  if (a) {
    // MPが たりない・呪文が ふうじられて いる: ふつうに しっぱい（読みは 消える）
    const cost = mpCost(c.penChar, cmd.id);
    if (cost > c.mp || (isSpell(a) && (c.status.silence || b.noSpells))) return false;
    c.mp -= cost;
    ev.name = a.name;
    ev.ability = cmd.id;
    const t = cmd.target ? b.get(cmd.target) : null;
    ev.lines.push(String(a.cast || `{a}は${a.name}を使った！`).replaceAll('{a}', c.name).replaceAll('{t}', t ? t.name : ''));
  } else if (cmd.type === 'attack' || cmd.type === 'mahouken') {
    ev.name = '攻撃';
    ev.lines.push(`${c.name}の攻撃！`);
  } else if (cmd.type === 'item') {
    const it = ITEMS[cmd.id];
    ev.name = it?.name || '道具';
    ev.lines.push(`${c.name}は${it?.name || '道具'}を使おうとした！`);
  } else {
    ev.name = '防御';
    ev.lines.push(`${c.name}は身を守ろうとした！`);
  }
  ev.fx = { type: 'foreseeHit', anim: 'foresee_hit', actor: c.id, by: by.id, kind, targets: [c.id], side: 'enemy' };
  ev.foreseeHit = { by: by.id, who: c.id, kind };
  ev.warn = true;
  if (kind === 'phys') {
    // かわして 反撃
    ev.lines.push(`しかし${A}は、3つの目で動きを見切っていた！`, `${A}は、ひらりとかわして反撃してきた！`);
    (ev.results = ev.results || []).push({ id: by.id, miss: true });
    const res = b.calcPhys(by, c, { mult: conf.counter ?? 1.3 });
    if (res.miss) {
      ev.lines.push(`${c.name}はひらりと身をかわした！`);
      ev.results.push({ id: c.id, miss: true });
    } else b.damage(by, c, res.dmg, ev, { element: 'phys' });
  } else if (kind === 'spell') {
    const e = a ? prim(a) : {};
    if ((e.type === 'magic' || e.type === 'gather' || e.type === 'deduce') && Array.isArray(e.base) && FOES.has(a.target)) {
      // はね返す（となえた 人に。1回で たおれない ように さいだいHPの cap まで）
      ev.lines.push(`しかし${A}の目が光り、呪文をはね返した！`);
      const k = conf.bounce ?? 0.6;
      const pow = penaltyFor(c.penChar, cmd.id).powMult;
      const res = b.calcMagic(c, c, { ...e, type: 'magic', base: e.base.map((v) => Math.max(1, Math.round(v * k))) }, pow);
      const dmg = Math.min(res.dmg, Math.max(1, Math.round(c.maxHp * (conf.cap ?? 0.32))));
      if (res.resisted || dmg <= 0) ev.lines.push(`${c.name}はダメージを受けない！`);
      else b.damage(c, c, dmg, ev, { element: e.element });
    } else ev.lines.push(`しかし呪文の力は、${A}の目にかき消された！`);
  } else if (kind === 'heal') {
    ev.lines.push(`しかし${A}の目が光り、回復の光をすいこんでしまった！`);
  } else {
    // 防御: 身を 守れず、守りが 下がる
    c.defending = false;
    ev.lines.push(`しかし${A}は、守りのすきを見ぬいていた！`);
    b.applyDebuff(by, c, { stat: 'def', mult: 0.75, chance: 1 }, ev);
  }
  ev.upd.push(c, by);
  return true;
}

// たおれた（battle.js の kill）: アルゴスが たおれると、読みも みんな 消える
export function towerKill(b, t, ev) {
  gaiaKill(b, t, ev);
  noctoKill(b, t, ev);
  earthKill(b, t, ev);
  finalKill(b, t, ev);
  if (t.side !== 'enemy' || !confOf(t)) return;
  for (const x of b.allies) {
    if (x.foresee?.by !== t.id) continue;
    delete x.foresee;
    if (ev) ev.upd.push(x);
  }
}

// ───────────── オートの 仲間・シミュレーター（ai.js の decideAlly の はじめ）─────────────
// 知っている 人（b.knowsArgos）は 星のさばきの 前に 身を 守る。読まれて いれば、読まれた 種類を さけて えらぶ
// （b.argosNaive … 知らない 人。読まれても そのまま）。decide … ai.js の decideAlly（さけた あとの えらびなおしに 使う）
export function towerPlan(b, c, decide) {
  if (c.side !== 'ally') return null;
  // ガイアイーター（知っている 人: しっぽ → 体 → 頭・大技の 前に 身を 守る。battle-gaia.js）
  const gp = gaiaPlan(b, c, decide);
  if (gp) return gp;
  // ノクトの影（知っている 人: きずなくだきの 前に 身を 守る・まねられた 人は 攻撃しない。battle-nocto.js）
  const np = noctoPlan(b, c, decide);
  if (np) return np;
  // ノクト（1回目。知っている 人: 影を 先に たおす・前ぶれで 身を 守る・手を のばす。battle-earth.js）
  const ep = earthPlan(b, c);
  if (ep) return ep;
  // 魔王ソリトゥス（だれでも: きずな技の ゲージが たまったら 使う。知っている 人: よびかける・前ぶれで 身を 守る。battle-final.js）
  const flp = finalPlan(b, c);
  if (flp) return flp;
  // 影の城の まぼろし（知っている 人: 大技の 前に 身を 守る・風のかべには 呪文・かげ火を 先に。battle-phantom.js）
  const pp = phantomPlan(b, c, decide);
  if (pp) return pp;
  // 第6章の ボス（知っている 人: 大砂流の 前ぶれに 氷・まき戻しの 間に 雷・ギアプレスの 前に 身を 守る。battle-ch6.js）
  const c6p = ch6Plan(b, c, decide);
  if (c6p) return c6p;
  if (b.knowsArgos && c.foresee?.kind !== 'guard') {
    const mine = 100 / atbRate(c);
    const j = b.aliveEnemies().find((e) => e.telegraph === JUDGE);
    if (j && (100 - j.atb) / atbRate(j) <= mine) return { type: 'defend' };
  }
  if (!c.foresee || b.argosNaive || b.fsInner) return null;
  let cmd;
  b.fsInner = true;
  try {
    cmd = decide(b, c);
  } finally {
    b.fsInner = false;
  }
  if (actKind(cmd) !== c.foresee.kind) return cmd;
  return dodgeCmd(b, c, c.foresee.kind);
}

// 読まれた 種類（kind）を さけた 行動: 攻撃・呪文・回復の うち いちばん よい もの。なければ 防御（防御を 読まれたら 攻撃）
export function dodgeCmd(b, c, kind) {
  const foes = b.aliveEnemies();
  const boss = foes.find((f) => f.boss) || foes.slice().sort((x, y) => y.hp - x.hp)[0];
  if (!boss) return { type: 'defend' };
  const opts = [];
  if (kind !== 'phys') {
    const r = b.calcPhys(c, boss, { mult: 1 }, 1, 'phys', true);
    opts.push({ cmd: { type: 'attack', target: boss.id }, score: r.dmg * r.hit });
  }
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const k = actKind({ type: 'ability', id });
    if (k === kind) continue;
    const e = prim(a);
    const pow = penaltyFor(c.penChar, id).powMult;
    if (k === 'spell' && e.type === 'magic' && FOES.has(a.target)) {
      const n = a.target === 'enemies' ? foes.length : a.target === 'group' ? foes.filter((f) => f.species === boss.species).length : 1;
      opts.push({ cmd: { type: 'ability', id, target: boss.id }, score: b.calcMagic(c, boss, e, pow, true).dmg * Math.min(n, 2) / (1 + mpCost(c.penChar, id) * 0.02) });
    }
    if (k === 'heal' && e.type === 'heal') {
      const hurt = b.aliveAllies().filter((x) => x.hp / x.maxHp < 0.5).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
      if (!hurt.length) continue;
      if (a.target === 'ally') opts.push({ cmd: { type: 'ability', id, target: hurt[0].id }, score: 9999 - mpCost(c.penChar, id) });
      else if (a.target === 'allies' && hurt.length >= 2) opts.push({ cmd: { type: 'ability', id }, score: 9998 });
    }
  }
  opts.sort((x, y) => y.score - x.score);
  if (opts[0] && opts[0].score > 0) return opts[0].cmd;
  return kind === 'guard' ? { type: 'attack', target: boss.id } : { type: 'defend' };
}

// ───────────── がめんへ ─────────────
// pub（battle.js）に まぜる: 読まれている 種類（味方だけ）
export function towerPub(c) {
  return c.side === 'ally' ? { foresee: c.foresee?.kind || null, ...noctoPub(c), ...earthPub(c), ...finalPub(c) } : { ...gaiaPub(c), ...noctoPub(c), ...earthPub(c), ...finalPub(c), ...phantomPub(c), ...ch6Pub(c) };
}
