// たたかいの AI（モンスター と サポートなかま）
import { ABILITIES, isAttackSpell, isSwordSkill } from './data/abilities.js';
import { mpCost, penaltyFor, weaponOk } from './stats.js';

// さくせん
export const TACTICS = {
  balanced: { name: 'バッチリがんばれ', healAt: 0.5, mpWeight: 0.04, buffs: true },
  aggressive: { name: 'ガンガンいこうぜ', healAt: 0.33, mpWeight: 0.015, buffs: false },
  heal: { name: 'いのちだいじに', healAt: 0.68, mpWeight: 0.05, buffs: true },
  nomp: { name: 'じゅもんせつやく', healAt: 0.4, mpWeight: 0.5, buffs: false },
};

// ───────────── モンスター ─────────────
export function decideMonster(b, m) {
  const foes = b.aliveAllies();
  if (m.telegraph) {
    const id = m.telegraph;
    m.telegraph = null;
    return { type: 'ability', id, target: pickFoe(b, foes)?.id };
  }
  const friends = b.aliveEnemies();
  const cands = m.actions.filter((a) => {
    if (a.limit && (m.used[a.id] || 0) >= a.limit) return false;
    if (a.id !== 'attack') {
      const ab = ABILITIES[a.id];
      if (!ab) return false;
      if (ab.kind !== 'monster' && (ab.mp || 0) > m.mp) return false;
      if ((ab.kind === 'spell') && m.status.silence) return false;
    }
    if (!a.cond) return true;
    if (a.cond.startsWith('hpBelow:')) return m.hp / m.maxHp < parseFloat(a.cond.split(':')[1]);
    if (a.cond === 'allyHurt') return friends.some((f) => f.hp / f.maxHp < 0.7);
    if (a.cond === 'callHelp') return friends.length < 4 && (m.helpCalls || 0) < 2;
    if (a.cond.startsWith('notRecent:')) return !m.recent.includes(a.cond.split(':')[1]);
    return true;
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

function pickFoe(b, foes) {
  if (!foes.length) return null;
  return b.rng.pick(foes);
}

// ───────────── サポートなかま・オート ─────────────
export function decideAlly(b, c) {
  const tac = TACTICS[c.tactics] || TACTICS.balanced;
  const allies = b.aliveAllies();
  const dead = b.allies.filter((x) => !x.alive && !x.fled);
  const foes = b.aliveEnemies();
  if (!foes.length) return { type: 'defend' };
  const can = (id) => canUse(b, c, id);

  // 1) きずな技（にんげんが いない ときだけ）
  if (b.bond >= 100 && !b.humans().some((h) => h.alive)) {
    const t = strongestFoe(foes);
    return { type: 'bond', target: t.id };
  }

  // 2) しんだ なかまを いきかえらせる
  if (dead.length && can('zao')) {
    return { type: 'ability', id: 'zao', target: dead[0].id };
  }

  // 3) かいふく
  const healCmd = chooseHeal(b, c, tac, allies);
  if (healCmd) return healCmd;

  // 4) じょうたい いじょうを なおす
  for (const a of allies) {
    if ((a.status.sleep || a.status.paralyze || a.status.confuse) && a !== c) {
      if (can('kiariku')) return { type: 'ability', id: 'kiariku', target: a.id };
      if (can('zameha_dance')) return { type: 'ability', id: 'zameha_dance' };
    }
    if (a.status.poison && can('kiarii') && a.hp / a.maxHp < 0.8 && b.rng.chance(0.5)) {
      return { type: 'ability', id: 'kiarii', target: a.id };
    }
  }

  // 5) ボスの 大わざに そなえる
  const telegraphing = foes.some((f) => f.telegraph);
  if (telegraphing && c.hp / c.maxHp < 0.6 && b.rng.chance(0.75)) return { type: 'defend' };

  // 6) ほじょ呪文
  const tough = b.boss || foes.reduce((s, f) => s + f.hp, 0) > 180;
  if (tac.buffs && tough) {
    const buff = chooseBuff(b, c, allies);
    if (buff) return buff;
  }
  if (tac.buffs && !b.boss && foes.length >= 3 && b.rng.chance(0.2)) {
    for (const id of ['rariho', 'madoromi', 'manusa', 'medapani']) {
      if (can(id)) {
        const t = foes.find((f) => !f.status.sleep && !f.status.confuse && !f.status.blind);
        if (t) return { type: 'ability', id, target: t.id };
      }
    }
  }

  // 7) こうげき
  return chooseAttack(b, c, tac, foes);
}

export function canUse(b, c, id) {
  const a = ABILITIES[id];
  if (!a || !c.abilities.includes(id)) return false;
  if ((a.kind === 'spell' || a.spellLike) && c.status.silence) return false;
  if (!weaponOk(a, c.weaponCat)) return false;
  return mpCost(c.penChar, id) <= c.mp;
}

function chooseHeal(b, c, tac, allies) {
  const hurt = allies.filter((a) => a.hp / a.maxHp < tac.healAt);
  if (!hurt.length) return null;
  const can = (id) => canUse(b, c, id);
  const partyHeals = ['behomara', 'iyashi_mai', 'hustle'].filter(can);
  if (hurt.length >= 2 && partyHeals.length) return { type: 'ability', id: partyHeals[0] };
  hurt.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  const t = hurt[0];
  const deficit = t.maxHp - t.hp;
  const singles = ['behoimi', 'hoimi'].filter(can);
  if (singles.length) {
    // たりなさに あわせて えらぶ
    const pick = deficit > 60 && singles.includes('behoimi') ? 'behoimi' : (singles.includes('hoimi') ? 'hoimi' : singles[0]);
    return { type: 'ability', id: pick, target: t.id };
  }
  if (partyHeals.length && t.hp / t.maxHp < 0.35) return { type: 'ability', id: partyHeals[0] };
  return null;
}

function chooseBuff(b, c, allies) {
  const can = (id) => canUse(b, c, id);
  const rng = b.rng;
  if (can('piorimu') && allies.filter((a) => !a.buffs.agi).length >= Math.ceil(allies.length / 2) && rng.chance(0.55)) {
    return { type: 'ability', id: 'piorimu' };
  }
  if (can('sukuruto') && allies.filter((a) => !a.buffs.def).length >= 2 && rng.chance(0.5)) {
    return { type: 'ability', id: 'sukuruto' };
  }
  if (can('baikiruto') && rng.chance(0.5)) {
    const best = allies.filter((a) => !a.buffs.atk).sort((x, y) => y.atk - x.atk)[0];
    if (best && best.atk > 25) return { type: 'ability', id: 'baikiruto', target: best.id };
  }
  if (can('tatakai_uta') && allies.filter((a) => !a.buffs.atk).length >= 2 && rng.chance(0.4)) {
    return { type: 'ability', id: 'tatakai_uta' };
  }
  if (can('sukara') && rng.chance(0.3)) {
    const t = allies.filter((a) => !a.buffs.def).sort((x, y) => x.dfn - y.dfn)[0];
    if (t) return { type: 'ability', id: 'sukara', target: t.id };
  }
  if (can('ouen') && b.bond < 80 && rng.chance(0.25)) return { type: 'ability', id: 'ouen' };
  if ((can('chikaratame') || can('kiaitame')) && b.boss && c.charge <= 1 && rng.chance(0.25)) {
    return { type: 'ability', id: can('kiaitame') ? 'kiaitame' : 'chikaratame' };
  }
  return null;
}

function strongestFoe(foes) {
  return foes.slice().sort((x, y) => (y.boss - x.boss) || (y.hp - x.hp))[0];
}

// こうげきの えらびかた: きたいダメージ ÷ MPの おもさ
function chooseAttack(b, c, tac, foes) {
  const opts = [];
  const value = (t, dmg) => {
    const eff = Math.min(dmg, t.hp);
    return eff + (dmg >= t.hp ? 8 + t.atk / 3 : 0) + (t.boss ? eff * 0.2 : 0);
  };
  // ふつうの こうげき
  for (const t of foes) {
    const r = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
    opts.push({ cmd: { type: 'attack', target: t.id }, score: value(t, r.dmg * r.hit), mp: 0 });
  }
  for (const id of c.abilities) {
    const a = ABILITIES[id];
    if (!a || !canUse(b, c, id)) continue;
    const eff = a.effect;
    if (eff.type !== 'phys' && eff.type !== 'magic') continue;
    const mp = mpCost(c.penChar, id);
    const pow = penaltyFor(c.penChar, id).powMult;
    const est = (t) => {
      if (eff.type === 'phys') {
        const r = b.calcPhys(c, t, eff, pow, eff.element || 'phys', true);
        return r.dmg * r.hit * (eff.hits || 1);
      }
      return b.calcMagic(c, t, eff, pow, true).dmg;
    };
    if (a.target === 'enemies') {
      let total = 0;
      if (eff.random) {
        // ランダムに あたる ので へいきん
        const per = foes.reduce((s, t) => s + est(t) / (eff.hits || 1), 0) / foes.length;
        total = per * (eff.hits || 1);
      } else {
        for (const t of foes) total += value(t, est(t));
      }
      opts.push({ cmd: { type: 'ability', id, target: foes[0].id }, score: total, mp });
    } else if (a.target === 'group') {
      for (const t of foes) {
        const grp = foes.filter((x) => x.species === t.species);
        const total = grp.reduce((s, g) => s + value(g, est(g)), 0);
        opts.push({ cmd: { type: 'ability', id, target: t.id }, score: total, mp });
      }
    } else if (a.target === 'enemy') {
      for (const t of foes) opts.push({ cmd: { type: 'ability', id, target: t.id }, score: value(t, est(t)), mp });
    }
  }
  // 魔法剣
  if (c.abilities.includes('mahouken') && weaponOk({ weapon: 'blade' }, c.weaponCat) && !c.status.silence) {
    for (const sp of c.abilities.filter(isAttackSpell)) {
      for (const sk of c.abilities.filter(isSwordSkill)) {
        const mp = mpCost(c.penChar, sp) + mpCost(c.penChar, sk);
        if (mp > c.mp) continue;
        const spA = ABILITIES[sp], skA = ABILITIES[sk];
        const spPow = penaltyFor(c.penChar, sp).powMult, skPow = penaltyFor(c.penChar, sk).powMult;
        for (const t of foes) {
          const r = b.calcPhys(c, t, { ...skA.effect, element: spA.effect.element }, skPow, spA.effect.element, true);
          const m = b.calcMagic(c, t, spA.effect, spPow, true);
          opts.push({ cmd: { type: 'mahouken', spell: sp, skill: sk, target: t.id }, score: value(t, r.dmg * r.hit + m.dmg * 0.6), mp });
        }
      }
    }
  }
  for (const o of opts) {
    const mpRatio = c.maxMp ? c.mp / c.maxMp : 0;
    // MPが すくない ときは より せつやく
    const w = tac.mpWeight * (mpRatio < 0.3 ? 3 : 1);
    o.final = o.score / (1 + o.mp * w * 10) * b.rng.float(0.9, 1.1);
  }
  opts.sort((x, y) => y.final - x.final);
  return opts[0]?.cmd || { type: 'attack', target: foes[0].id };
}
