// たたかいの AI（モンスター と サポートなかま）
import { ABILITIES, isAttackSpell, isSwordSkill } from './data/abilities.js?v=cf427a2667f8';
import { mpCost, penaltyFor, weaponOk, comboAllowed } from './stats.js?v=cf427a2667f8';

// さくせん
export const TACTICS = {
  balanced: { name: 'バッチリがんばれ', healAt: 0.5, mpWeight: 0.04, buffs: true },
  aggressive: { name: 'ガンガンいこうぜ', healAt: 0.33, mpWeight: 0.015, buffs: false },
  heal: { name: 'いのちだいじに', healAt: 0.68, mpWeight: 0.05, buffs: true },
  nomp: { name: 'じゅもんせつやく', healAt: 0.4, mpWeight: 0.5, buffs: false },
  // なかま だけ: じぶんで コマンドを えらぶ（オートの ときは バッチリがんばれ）
  manual: { name: 'めいれいさせろ', healAt: 0.5, mpWeight: 0.04, buffs: true, manual: true },
};

// ───────────── モンスター ─────────────
export function decideMonster(b, m) {
  const foes = b.aliveAllies();
  if (m.telegraph) {
    const id = m.telegraph;
    m.telegraph = null;
    m.chant = null;
    return { type: 'ability', id, target: pickFoe(b, foes)?.id };
  }
  const friends = b.aliveEnemies();
  const cands = m.actions.filter((a) => {
    if (a.limit && (m.used[a.id] || 0) >= a.limit) return false;
    if (a.id !== 'attack') {
      const ab = ABILITIES[a.id];
      if (!ab) return false;
      if (ab.kind !== 'monster' && (ab.mp || 0) > m.mp) return false;
      if ((ab.kind === 'spell') && (m.status.silence || b.noSpells)) return false;
    }
    if (!a.cond) return true;
    // cond は 1つ か ならべた もの（ぜんぶ あてはまる とき）
    return (Array.isArray(a.cond) ? a.cond : [a.cond]).every((cond) => condOk(b, m, friends, cond));
  });
  const choice = cands.length ? b.rng.weighted(cands) : { id: 'attack' };
  m.used[choice.id] = (m.used[choice.id] || 0) + 1;
  m.recent.push(choice.id);
  if (m.recent.length > 3) m.recent.shift();
  if (choice.id === 'attack') return { type: 'attack', target: pickFoe(b, foes)?.id };
  const ab = ABILITIES[choice.id];
  let target;
  if (ab.target === 'ally') {
    target = friends.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]?.id;
  } else if (ab.target === 'enemy' || ab.target === 'group') {
    target = pickFoe(b, foes)?.id;
  }
  return { type: 'ability', id: choice.id, target };
}

// 魔物の こうどうの じょうけん
function condOk(b, m, friends, cond) {
  if (cond.startsWith('hpBelow:')) return m.hp / m.maxHp < parseFloat(cond.split(':')[1]);
  if (cond === 'allyHurt') return friends.some((f) => f.hp / f.maxHp < 0.7);
  if (cond === 'callHelp') return friends.length < 4 && (m.helpCalls || 0) < 2;
  if (cond.startsWith('notRecent:')) return !m.recent.includes(cond.split(':')[1]);
  // deadFriend:しゅるい … その しゅるいの なかまが たおれて いる（よみがえりの呪文）
  if (cond.startsWith('deadFriend:')) {
    const sp = cond.split(':')[1];
    return b.enemies.some((e) => e !== m && !e.alive && !e.fled && e.species === sp);
  }
  return true;
}

// 敵が ねらう 相手: ドラクエと おなじく 先頭ほど ねらわれやすい（ならびかえの 意味）
const FRONT_WEIGHT = [1.45, 1.15, 0.95, 0.8];
function pickFoe(b, foes) {
  if (!foes.length) return null;
  if (foes.length === 1 || foes[0].side !== 'ally') return b.rng.pick(foes);
  const row = foes.slice().sort((x, y) => (x.slot ?? 0) - (y.slot ?? 0));
  const ws = row.map((_, i) => FRONT_WEIGHT[Math.min(i, FRONT_WEIGHT.length - 1)]);
  let r = b.rng.next() * ws.reduce((a, x) => a + x, 0);
  for (let i = 0; i < row.length; i++) {
    r -= ws[i];
    if (r < 0) return row[i];
  }
  return row[row.length - 1];
}

// ───────────── サポートなかま・オート ─────────────
export function decideAlly(b, c) {
  const tac = TACTICS[c.tactics] || TACTICS.balanced;
  const allies = b.aliveAllies();
  const dead = b.allies.filter((x) => !x.alive && !x.fled);
  const foes = b.aliveEnemies();
  if (!foes.length) return { type: 'defend' };
  const mine = usable(b, c);

  // 1) きずな技（にんげんが いない ときだけ）
  if (b.bond >= 100 && !b.humans().some((h) => h.alive)) {
    const t = strongestFoe(foes);
    return { type: 'bond', target: t.id };
  }

  // 2) しんだ なかまを いきかえらせる（ふたり いじょうなら みんなを いきかえらせる わざ）
  if (dead.length) {
    const revs = mine.filter(({ a }) => a.effect.type === 'revive');
    const all = revs.find(({ a }) => a.target === 'deadAllies');
    if (all && dead.length >= 2) return { type: 'ability', id: all.id };
    const one = revs.filter(({ a }) => a.target === 'deadAlly').sort((x, y) => (y.a.effect.hpRatio || 0) - (x.a.effect.hpRatio || 0))[0];
    if (one) return { type: 'ability', id: one.id, target: dead[0].id };
  }

  // 3) かいふく
  const healCmd = chooseHeal(b, c, tac, allies, mine);
  if (healCmd) return healCmd;

  // 4) じょうたい いじょうを なおす
  const cures = mine.filter(({ a }) => a.effect.type === 'cure');
  const needs = (a, st) => a.effect.statuses.includes(st);
  const stuck = allies.filter((a) => a !== c && (a.status.sleep || a.status.paralyze || a.status.confuse));
  if (stuck.length) {
    const st = (x) => (x.status.sleep ? 'sleep' : x.status.paralyze ? 'paralyze' : 'confuse');
    const allCure = cures.find(({ a }) => a.target === 'allies' && stuck.every((x) => needs(a, st(x))));
    if (allCure && stuck.length >= 2) return { type: 'ability', id: allCure.id };
    const one = cures.find(({ a }) => a.target === 'ally' && needs(a, st(stuck[0])));
    if (one) return { type: 'ability', id: one.id, target: stuck[0].id };
    if (allCure) return { type: 'ability', id: allCure.id };
  }
  const poisoned = allies.find((a) => a.status.poison && a.hp / a.maxHp < 0.8);
  if (poisoned && b.rng.chance(0.5)) {
    const cure = cures.find(({ a }) => a.target === 'ally' && needs(a, 'poison'));
    if (cure) return { type: 'ability', id: cure.id, target: poisoned.id };
  }

  // 5) ボスの 大わざに そなえる
  const telegraphing = foes.some((f) => f.telegraph);
  if (telegraphing && c.hp / c.maxHp < 0.6 && b.rng.chance(0.75)) return { type: 'defend' };

  // MPが へってきたら まりょくを あつめる
  if (c.maxMp && c.mp / c.maxMp < 0.25) {
    const mpUp = mine.find(({ a }) => a.effect.type === 'mpHeal' && a.target === 'self');
    if (mpUp && b.rng.chance(0.6)) return { type: 'ability', id: mpUp.id };
  }

  // 6) ほじょ（つよい てきの とき）
  const tough = b.boss || foes.reduce((s, f) => s + f.hp, 0) > 180;
  if (tac.buffs && tough) {
    const buff = chooseBuff(b, c, allies, mine);
    if (buff) return buff;
  }
  // てきが おおい ときは ねむらせたり こんらんさせたり
  if (tac.buffs && !b.boss && foes.length >= 3 && b.rng.chance(0.2)) {
    const st = mine.filter(({ a }) => a.effect.type === 'status' && ['enemies', 'group', 'enemy'].includes(a.target) && a.effect.status !== 'poison');
    const t = foes.find((f) => !f.status.sleep && !f.status.confuse && !f.status.blind && !f.status.paralyze);
    if (st.length && t) {
      const pick = st.sort((x, y) => (y.a.target === 'enemies') - (x.a.target === 'enemies'))[0];
      return { type: 'ability', id: pick.id, target: t.id };
    }
  }

  // 7) こうげき
  return chooseAttack(b, c, tac, foes);
}

export function canUse(b, c, id) {
  const a = ABILITIES[id];
  if (!a || !c.abilities.includes(id)) return false;
  if (a.hidden) return false;
  if ((a.kind === 'spell' || a.spellLike) && c.status.silence) return false;
  // 呪文が ふうじられた 場所（王家のピラミッド 2階）
  if ((a.kind === 'spell' || a.spellLike || a.effect?.type === 'mahouken') && b?.noSpells) return false;
  if (a.kind === 'combo' && c.side === 'ally' && c.penChar && !comboAllowed(c.penChar, id)) return false;
  if (!weaponOk(a, c.weaponCat)) return false;
  return mpCost(c.penChar, id) <= c.mp;
}

// オートで 使って よい 技か（作戦の「オートで使う技」で「使わない」に した 技は えらばない）
const autoOk = (c, id) => !c.autoOff?.includes(id);

// いま つかえる わざ（{ id, a }）
function usable(b, c) {
  const out = [];
  for (const id of c.abilities || []) if (autoOk(c, id) && canUse(b, c, id)) out.push({ id, a: ABILITIES[id] });
  return out;
}

// だいたい どれくらい かいふくするか
function healAmount(c, a) {
  const [mn, mx] = a.effect.base;
  const base = (mn + mx) / 2;
  if (a.effect.fixed) return base;
  return base * (1 + Math.max(0, Math.min(1, ((c.healPow || 0) - (a.effect.thr ?? 20)) / 150)));
}

function chooseHeal(b, c, tac, allies, mine) {
  const hurt = allies.filter((a) => a.hp / a.maxHp < tac.healAt);
  if (!hurt.length) return null;
  const heals = mine.filter(({ a }) => a.effect.type === 'heal');
  if (!heals.length) return null;
  const mpw = (x) => 1 + mpCost(c.penChar, x.id) * tac.mpWeight;
  const partyHeals = heals.filter(({ a }) => a.target === 'allies');
  if (hurt.length >= 2 && partyHeals.length) {
    const deficit = hurt.reduce((s, a) => s + (a.maxHp - a.hp), 0) / hurt.length;
    // たりなさに ちかい ものを えらぶ（むだに おおきい わざは つかわない）
    const best = partyHeals.slice().sort((x, y) => Math.abs(healAmount(c, x.a) - deficit) * mpw(x) - Math.abs(healAmount(c, y.a) - deficit) * mpw(y))[0];
    return { type: 'ability', id: best.id };
  }
  hurt.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  const t = hurt[0];
  const deficit = t.maxHp - t.hp;
  const singles = heals.filter(({ a }) => a.target === 'ally' || (a.target === 'self' && t === c));
  if (singles.length) {
    const enough = singles.filter((x) => healAmount(c, x.a) >= deficit * 0.6);
    const pool = enough.length ? enough : singles;
    const pick = pool.slice().sort((x, y) => (enough.length ? mpCost(c.penChar, x.id) - mpCost(c.penChar, y.id) : healAmount(c, y.a) - healAmount(c, x.a)))[0];
    return { type: 'ability', id: pick.id, target: t.id };
  }
  if (partyHeals.length && t.hp / t.maxHp < 0.35) return { type: 'ability', id: partyHeals[0].id };
  return null;
}

// ほじょ: まだ かかっていない つよく なる わざを えらぶ
function chooseBuff(b, c, allies, mine) {
  const rng = b.rng;
  const buffs = mine.filter(({ a }) => a.effect.type === 'buff');
  const stat = (a) => a.effect.stats || [a.effect.stat];
  const lacking = (x, a) => stat(a).some((st) => !x.buffs[st]);
  for (const { id, a } of buffs.sort(() => rng.float(-1, 1))) {
    if (a.target === 'allies') {
      if (allies.filter((x) => lacking(x, a)).length >= Math.ceil(allies.length / 2) && rng.chance(0.5)) return { type: 'ability', id };
    } else if (a.target === 'ally') {
      const st = stat(a);
      const pool = allies.filter((x) => lacking(x, a));
      const t = st.includes('atk') ? pool.sort((x, y) => y.atk - x.atk)[0] : pool.sort((x, y) => x.dfn - y.dfn)[0];
      if (t && rng.chance(0.4) && (!st.includes('atk') || t.atk > 25)) return { type: 'ability', id, target: t.id };
    } else if (a.target === 'self') {
      if (lacking(c, a) && rng.chance(0.3)) return { type: 'ability', id };
    }
  }
  const bond = mine.find(({ a }) => a.effect.type === 'bondUp');
  if (bond && b.bond < 80 && rng.chance(0.25)) return { type: 'ability', id: bond.id };
  const charge = mine.find(({ a }) => a.effect.type === 'charge');
  if (charge && b.boss && c.charge <= 1 && rng.chance(0.25)) return { type: 'ability', id: charge.id };
  return null;
}

function strongestFoe(foes) {
  return foes.slice().sort((x, y) => (y.boss - x.boss) || (y.hp - x.hp))[0];
}

// 反撃の構えを している 敵（物理で こうげきすると 反撃される。battle.js の stance）
// b.ignoreStance: 構えを 気にしない（tools/sim.js で「気づかない 人」の つよさを はかる）
const countering = (t, b) => !b?.ignoreStance && t?.stance?.kind === 'counter';

// よみがえりの呪文を となえて いる 敵（ためた ダメージで 呪文が とぎれる。battle.js の chant）
// b.ignoreChant: 呪文に 気づかない（tools/sim.js で「気づかない 人」の つよさを はかる）
const chanting = (t, b) => !b?.ignoreChant && !!t?.chant;

// こうげきの えらびかた: きたいダメージ ÷ MPの おもさ
// 反撃の構えの 敵に 物理で あたる こうげきは えらばない（呪文・ほかの 敵。なければ 防御して まつ）
// 呪文を となえて いる 敵は、とぎれさせる ために ねらう（オートの 仲間も かしこく）
function chooseAttack(b, c, tac, foes) {
  const opts = [];
  const value = (t, dmg) => {
    const eff = Math.min(dmg, t.hp);
    const stop = chanting(t, b) ? Math.min(dmg, Math.max(0, t.chant.need - t.chant.dmg)) * 3 + 40 : 0;
    // b.focusBoss … ボスを ねらう（ボスが たおれると 手下も くずれる ことを 知っている 人。tools/sim.js）
    return eff + (dmg >= t.hp ? 8 + t.atk / 3 : 0) + (t.boss ? eff * (b.focusBoss ? 1.2 : 0.2) : 0) + stop;
  };
  // ふつうの こうげき（ムチは グループ、ブーメランは 全体に とどく。battle.js の attackPlan）
  for (const t of foes) {
    const plan = b.attackPlan ? b.attackPlan(c, t.id) : [{ t, mult: 1 }];
    const score = plan.reduce((s, p) => {
      const r = b.calcPhys(c, p.t, { mult: p.mult }, 1, 'phys', true);
      return s + value(p.t, r.dmg * r.hit);
    }, 0);
    opts.push({ cmd: { type: 'attack', target: t.id }, score, mp: 0, risky: plan.some((p) => countering(p.t, b)) });
  }
  for (const id of c.abilities) {
    const a = ABILITIES[id];
    if (!a || !autoOk(c, id) || !canUse(b, c, id)) continue;
    const eff = a.effect;
    if (eff.type !== 'phys' && eff.type !== 'magic' && eff.type !== 'drainHp') continue;
    if (eff.recoil && c.hp / c.maxHp < 0.5) continue; // もろばぎりは HPが すくない ときは つかわない
    const mp = mpCost(c.penChar, id);
    const pow = penaltyFor(c.penChar, id).powMult;
    const est = (t) => {
      if (eff.type === 'phys' || eff.type === 'drainHp') {
        const r = b.calcPhys(c, t, eff, pow, eff.element || 'phys', true);
        return r.dmg * r.hit * (eff.hits || 1);
      }
      return b.calcMagic(c, t, eff, pow, true).dmg;
    };
    const phys = eff.type === 'phys' || eff.type === 'drainHp';
    if (a.target === 'enemies') {
      let total = 0;
      if (eff.random) {
        // ランダムに あたる ので へいきん
        const per = foes.reduce((s, t) => s + est(t) / (eff.hits || 1), 0) / foes.length;
        total = per * (eff.hits || 1);
      } else {
        for (const t of foes) total += value(t, est(t));
      }
      opts.push({ cmd: { type: 'ability', id, target: foes[0].id }, score: total, mp, risky: phys && foes.some((t) => countering(t, b)) });
    } else if (a.target === 'group') {
      for (const t of foes) {
        const grp = foes.filter((x) => x.species === t.species);
        const total = grp.reduce((s, g) => s + value(g, est(g)), 0);
        opts.push({ cmd: { type: 'ability', id, target: t.id }, score: total, mp, risky: phys && grp.some((g) => countering(g, b)) });
      }
    } else if (a.target === 'enemy') {
      for (const t of foes) opts.push({ cmd: { type: 'ability', id, target: t.id }, score: value(t, est(t)), mp, risky: phys && countering(t, b) });
    }
  }
  // 魔法剣
  if (c.abilities.includes('mahouken') && autoOk(c, 'mahouken') && weaponOk({ weapon: 'blade' }, c.weaponCat) && !c.status.silence && !b.noSpells) {
    for (const sp of c.abilities.filter((id) => isAttackSpell(id) && autoOk(c, id))) {
      for (const sk of c.abilities.filter((id) => isSwordSkill(id) && autoOk(c, id))) {
        const mp = mpCost(c.penChar, sp) + mpCost(c.penChar, sk);
        if (mp > c.mp) continue;
        const spA = ABILITIES[sp], skA = ABILITIES[sk];
        const spPow = penaltyFor(c.penChar, sp).powMult, skPow = penaltyFor(c.penChar, sk).powMult;
        for (const t of foes) {
          const r = b.calcPhys(c, t, { ...skA.effect, element: spA.effect.element }, skPow, spA.effect.element, true);
          const m = b.calcMagic(c, t, spA.effect, spPow, true);
          opts.push({ cmd: { type: 'mahouken', spell: sp, skill: sk, target: t.id }, score: value(t, r.dmg * r.hit + m.dmg * 0.6), mp, risky: countering(t, b) });
        }
      }
    }
  }
  for (const o of opts) {
    const mpRatio = c.maxMp ? c.mp / c.maxMp : 0;
    // MPが すくない ときは より せつやく
    const w = tac.mpWeight * (mpRatio < 0.3 ? 3 : 1);
    o.final = o.score / (1 + o.mp * w * 10) * b.rng.float(0.9, 1.1) * (o.risky ? 0.05 : 1);
  }
  opts.sort((x, y) => y.final - x.final);
  // 物理しか ない ときに 反撃の構えの 敵しか いない: 防御して 構えが とけるのを まつ
  if (opts[0]?.risky) return { type: 'defend' };
  return opts[0]?.cmd || { type: 'attack', target: foes[0].id };
}
