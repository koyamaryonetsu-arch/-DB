// 第5章 Step 8「影の城」の 3人の まぼろしの たたかいの しかけ（battle.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・ストルムのまぼろし（monsters-phantom.js の castle.kind 'storm'）
//   前の しかけ（強く した）… 竜巻の 前ぶれ → 大竜巻（みんなに 物理の 大技。身を 守ると 半分）・嵐の兵の まぼろしを 2回 よぶ・HP25%で よろいが くだける
//   新しい しかけ「風のかべ」… まとうと、ストルムが wall.acts 回 動くまで、物理の 攻撃（ふつうの 攻撃・特技・魔法剣）は はばまれて
//                              ダメージ wall.cut ばい ＋ 当てた 人に 風の はね返し（さいだいHPの wall.back）。呪文・合体技は そのまま とどく
// ・イグニアのまぼろし（castle.kind 'ignia'）
//   前の しかけ … かげ火を よぶ・大炎の 前ぶれ・かげろう（まぼろし）
//   新しい しかけ「かげ火の力」… 大炎の とき、のこっている かげ火の まぼろしを ぜんぶ すいこんで、1体ごとに 大炎が fuel.per ぶん 強く なる
//                                 （すいこまれた かげ火は 消える。たおした ことには ならない）。前ぶれの 間に かげ火を たおせば 大炎は 弱い
// ・モルガナのまぼろし（castle.kind 'morgana'）
//   前の しかけ … まぼろしの 分身（battle-ch4.js。当てると 本物の キズが いえる）・水の衣（battle-temple.js。雷で はじける）・鏡写し
//   新しい しかけ「水かさ」… 本物が 動く たびに 水かさが 1 上がる（分身は 上げない）。tide.max で いっぱい → かならず 大波の 前ぶれ
//                             （2だん。battle-temple.js の 大波と おなじ。身を 守ると 半分）。前ぶれで 水かさは 0 に もどる。
//                             水の衣を 雷で はじくと 水かさが tide.down 下がる
// ・オートの 仲間（ふつう）は 何も かわらない。シミュレーター（tools/sim-phantom.mjs）の 知っている 人（b.knowsPhantom）は phantomPlan
import { MONSTERS } from './data/monsters.js?v=df2b5cb0d2d6';
import { ABILITIES } from './data/abilities.js?v=df2b5cb0d2d6';
import { PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA, PHANTOM_SOLDIER, PHANTOM_FLAME } from './data/monsters-phantom.js?v=df2b5cb0d2d6';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=df2b5cb0d2d6';
import { templeEffect } from './battle-temple.js?v=df2b5cb0d2d6';
import { mirrorPlan } from './battle-ch4.js?v=df2b5cb0d2d6';
import { bestHit } from './battle-earth.js?v=df2b5cb0d2d6';
import { actKind, dodgeCmd } from './battle-ch5.js?v=df2b5cb0d2d6';

export { PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA, PHANTOM_SOLDIER, PHANTOM_FLAME };
export const WALL = 'm_ps_wall';
export const TORNADO = 'm_ps_tornado';
export const TORNADO_CHARGE = 'm_ps_tornado_charge';
export const CALL = 'm_pi_call';
export const INFERNO = 'm_pi_inferno';
export const INFERNO_CHARGE = 'm_pi_inferno_charge';
export const WAVE_CHARGE = 'm_pm_wave_charge';
export const WAVE = 'm_pm_wave';
// ふつうの オートが まぼろしの 大技の 前に 身を 守る（HPが この わりあいより 少ない とき・この たしかさで）・月の鏡を 使う たしかさ
export const AUTO_GUARD = { hp: 0.8, chance: 0.6, mirror: 0.5 };
// まぼろしの 大技（知っている 人は、自分の 次の 番より 先に 来る ときは 身を 守る）
const BIG = new Set([TORNADO, INFERNO, WAVE]);

const confOf = (m) => MONSTERS[m?.species]?.castle || null;
const kindOf = (m) => confOf(m)?.kind || null;
const bossOf = (b, kind) => b.enemies.find((e) => e.alive && kindOf(e) === kind && !e.clone) || null;
export const flamesOf = (b) => b.enemies.filter((e) => e.alive && e.species === PHANTOM_FLAME);
const morganas = (b) => b.enemies.filter((e) => kindOf(e) === 'morgana');

// ───────────── はじめ（battle.js の constructor）─────────────
// まぼろしの 戦いの はじめの ことば（モルガナは まぼろしの 分身の ことば〈battle-ch4.js〉の あと）・水かさ
const INTRO = {
  storm: ['ストルムのまぼろしが、すがたをあらわした…！', '（影の城が写した、前よりも強いまぼろしだ…！）'],
  ignia: ['イグニアのまぼろしが、すがたをあらわした…！', '（影の城が写した、前よりも強いまぼろしだ…！）'],
  morgana: ['（影の城が写した、前よりも強いまぼろしだ…！）'],
};
export function setupPhantom(b) {
  const boss = b.enemies.find((e) => confOf(e));
  if (!boss) return;
  const conf = confOf(boss);
  if (conf.tide) {
    b.pmTide = { lv: 0, max: conf.tide.max ?? 6, down: conf.tide.down ?? 2 };
    syncTide(b);
  }
  if (INTRO[conf.kind]) b.emit({ t: 'msg', lines: INTRO[conf.kind].slice(), dur: 1300 });
}

// 水かさを 3人とも おなじに（がめんの 水の 高さ。どれが 本物か 分からない ように）
function syncTide(b, ev = null) {
  if (!b.pmTide) return;
  for (const x of morganas(b)) {
    x.tide = b.pmTide.lv;
    x.tideMax = b.pmTide.max;
    if (ev) ev.upd.push(x);
  }
}

// ───────────── 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）─────────────
//   psWall … 風のかべが ない・前ぶれで ない / psCalm … 風のかべが ない（竜巻は かべの あと）/ piCall … かげ火が 少ない /
//   piFuel … かげ火が いる / pmTide … 水かさが いっぱい（本物・前ぶれで ない。ふだんは phantomTurnStart が 前ぶれを 出す）
export function phantomCond(b, m, cond) {
  if (cond === 'psWall') return !m.windWall && !m.telegraph;
  if (cond === 'psCalm') return !m.windWall;
  if (cond === 'piCall') return flamesOf(b).length < (confOf(m)?.max ?? 3) && b.aliveEnemies().length < 7;
  if (cond === 'piFuel') return flamesOf(b).length > 0;
  if (cond === 'pmTide') return !!b.pmTide && !m.clone && b.pmTide.lv >= b.pmTide.max && !m.telegraph && !m.waveStage;
  return null;
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function phantomEffect(b, c, a, eff, ev, targets = []) {
  switch (eff.type) {
    case 'psWall': wallOn(b, c, ev); return true;
    case 'piCall': callFlames(b, c, ev); return true;
    case 'piInferno': inferno(b, c, eff, ev); return true;
    case 'pmWave': {
      // 大波の 前ぶれ（1だん目）。水かさは 0 に もどる
      templeEffect(b, c, a, { ...eff, type: 'wave' }, ev, targets);
      if (b.pmTide) {
        b.pmTide.lv = 0;
        syncTide(b, ev);
      }
      ev.pmTide = { lv: 0, full: true };
      return true;
    }
    default: return false;
  }
}

// 風のかべ
function wallOn(b, c, ev) {
  const conf = confOf(c)?.wall || {};
  c.windWall = { left: conf.acts ?? 2 };
  ev.lines.push('（物理の攻撃は、風のかべにはね返されそうだ…！呪文なら、とどくはず…！）');
  ev.fx = { type: 'psWall', anim: 'ps_wall', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.psWall = c.id;
  ev.warn = true;
  ev.upd.push(c);
}

// かげ火を よぶ
function callFlames(b, c, ev) {
  const conf = confOf(c) || {};
  const n = Math.min(conf.call ?? 2, (conf.max ?? 3) - flamesOf(b).length, 7 - b.aliveEnemies().length);
  if (n <= 0) {
    ev.lines.push('しかし、かげ火は来なかった。');
    return;
  }
  const added = b.addEnemies(Array(n).fill(PHANTOM_FLAME));
  for (const m of added) m.atb = b.rng.float(10, 40);
  ev.joined = (ev.joined || []).concat(added.map(pub));
  ev.lines.push(`${MONSTERS[PHANTOM_FLAME].name}が${n}体、あらわれた！（大炎のときに、すいこまれてしまう…！）`);
  ev.fx = { type: 'piCall', anim: 'pi_call', actor: c.id, targets: added.map((m) => m.id), side: 'enemy' };
  ev.piCall = added.map((m) => m.id);
}

// 大炎: のこっている かげ火を すいこんで 強く なる（すいこまれた かげ火は 消える）
function inferno(b, c, eff, ev) {
  const conf = confOf(c)?.fuel || {};
  const fl = flamesOf(b);
  for (const x of fl) vanish(b, x, ev);
  const fuel = fl.length;
  if (fuel) ev.lines.push(fuel > 1 ? `かげ火のまぼろし${fuel}体が、炎のつばさにすいこまれた！` : 'かげ火のまぼろしが、炎のつばさにすいこまれた！', '大炎のいきおいが、ますます強くなった！');
  else ev.lines.push('（かげ火がいないので、大炎のいきおいは弱い…！）');
  const mult = (eff.mult ?? 1.25) * (1 + (conf.per ?? 0.45) * fuel);
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'pi_inferno', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy', element: 'fire' };
  for (const t of targets) b.physHit(c, t, { mult, ignoreDef: eff.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'fire');
  ev.piInferno = { fuel };
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
// 風のかべの のこり・水かさが 上がる（本物の モルガナが 動く たび。動けない 番も）
export function phantomTurnStart(b, c, ev, cmd = null) {
  if (c.side !== 'enemy') return;
  if (c.windWall) {
    c.windWall.left--;
    if (c.windWall.left <= 0) {
      c.windWall = null;
      ev.lines.push(`${c.name}のまわりの風のかべが、消えた！`);
      ev.psWallEnd = c.id;
      ev.upd.push(c);
    }
  }
  if (b.pmTide && kindOf(c) === 'morgana' && !c.clone && b.pmTide.lv < b.pmTide.max && !c.telegraph) {
    b.pmTide.lv++;
    syncTide(b, ev);
    const { lv, max } = b.pmTide;
    ev.lines.push(lv >= max ? `広間の水かさが、いっぱいになった！（水かさ ${lv}/${max}）` : `広間の水かさが、また上がった…（水かさ ${lv}/${max}）`);
    ev.pmTide = { lv, full: lv >= max };
  }
  // 水かさが いっぱい: この 番は かならず 大波の 前ぶれ（ai.js の decideMonster が telegraph を 出す。動けない 番は 次の 番に）
  if (b.pmTide && kindOf(c) === 'morgana' && !c.clone && b.pmTide.lv >= b.pmTide.max && !c.telegraph && !c.waveStage && cmd?.type !== 'incapacitated') c.telegraph = WAVE_CHARGE;
}

// ───────────── ダメージ（battle.js の damage。earthDamage の あと）─────────────
// null … ここで おわり / 数 … その ダメージで つづける
export function phantomDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0 || t.side !== 'enemy' || c.side !== 'ally') return dmg;
  // 風のかべ: 物理の 攻撃は はばまれる（合体技は そのまま）。当てた 人に 風の はね返し（1回の 行動で 1回）
  if (t.windWall && info.phys && !ev.dual) {
    const conf = confOf(t)?.wall || {};
    dmg = Math.max(1, Math.round(dmg * (conf.cut ?? 0.15)));
    if (!ev.psBounce) {
      ev.psBounce = { by: t.id, on: c.id };
      ev.lines.push('風のかべに、はばまれた！');
      const who = b.get(c.id) || c;
      if (who.alive) {
        ev.lines.push(`風のかべが、${who.name}をはね返した！`);
        b.damage(t, who, Math.max(1, Math.round(who.maxHp * (conf.back ?? 0.12))), ev, { element: 'wind' });
      }
    }
  }
  // 水の衣を 雷で はじいた（battle-temple.js の templeDamage が ev.veilBreak）: 水かさが 下がる（1回の 行動で 1回）
  if (b.pmTide && ev.veilBreak === t.id && kindOf(t) === 'morgana' && !ev.pmTideDown) {
    ev.pmTideDown = true;
    const before = b.pmTide.lv;
    b.pmTide.lv = Math.max(0, before - b.pmTide.down);
    syncTide(b, ev);
    if (before > b.pmTide.lv) {
      (ev.postLines = ev.postLines || []).push(`水の衣がはじけて、広間の水かさが下がった！（水かさ ${b.pmTide.lv}/${b.pmTide.max}）`);
      ev.pmTide = { lv: b.pmTide.lv, down: true };
    }
  }
  return dmg;
}

// 味方の オートの みつもり（battle.js の calcPhys の estimate）: 風のかべの 間の 物理は 小さく 見る
//   （ふつうの オートも、ほかに よい 手が あれば 呪文や かべの ない 敵に かえる。物理しか ない 人は そのまま なぐって はね返される）
export function phantomEst(c, t) {
  if (!t?.windWall || !c || c.side === t.side) return 1;
  return confOf(t)?.wall?.cut ?? 0.15;
}

// ───────────── 知っている 人の オート（battle-ch5.js の towerPlan から。b.knowsPhantom）─────────────
// ・大技（大竜巻・大炎・大波）が 自分の 次の 番より 先に 来る: 身を 守る
// ・風のかべ: 物理の 攻撃の かわりに、呪文・回復・身を 守る（dodgeCmd）
// ・かげ火が いる: 攻撃は いちばん HPの 少ない かげ火へ（回復・生き返りは そのまま）
// （b.phNoGuard・b.phNoWall・b.phNoFlame … シミュレーターで 1つずつ はずして くらべる とき）
export function phantomPlan(b, c, decide) {
  if (c.side !== 'ally' || b.phInner) return null;
  const foes = b.aliveEnemies();
  const boss = foes.find((e) => confOf(e) && !e.clone) || foes.find((e) => confOf(e));
  if (!boss) return null;
  const mine = 100 / atbRate(c);
  const big = foes.find((e) => BIG.has(e.telegraph) && (100 - e.atb) / atbRate(e) <= mine);
  // ふつうの オート（家族が「オート」に した とき）も、まぼろしの 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  //   モルガナの まぼろしの 戦いでは、月の鏡の 光が もどって いれば ときどき 月の鏡を 使う（まぼろしの 分身を 消す）
  if (!b.knowsPhantom) {
    if (b.phNaive) return null;
    if (big && c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance)) return { type: 'defend' };
    if (kindOf(boss) === 'morgana' && b.rng.chance(AUTO_GUARD.mirror)) return mirrorPlan(b);
    return null;
  }
  // かげ火を たおせば 大炎は 弱い（たおせそうなら 守らずに たおす）
  const fl = flamesOf(b).sort((x, y) => x.hp - y.hp);
  if (big && !b.phNoGuard) {
    if (big.telegraph === INFERNO && fl.length === 1 && !b.phNoFlame) {
      const hit = bestHit(b, c, fl[0]);
      if (hit && hit.dmg >= fl[0].hp * 0.9) return hit.cmd;
    }
    return { type: 'defend' };
  }
  let cmd;
  b.phInner = true;
  try {
    cmd = decide(b, c);
  } finally {
    b.phInner = false;
  }
  const kind = actKind(cmd);
  const atFoe = cmd && (cmd.type === 'attack' || cmd.type === 'mahouken' || (cmd.type === 'ability' && (kind === 'phys' || kind === 'spell')));
  // 風のかべ: かべの ない 敵（嵐の兵の まぼろし）が いれば そちらを 攻撃・いなければ 呪文・回復・身を 守る
  if (boss.windWall && kind === 'phys' && atFoe && !b.phNoWall) {
    const t = b.get(cmd.target);
    const wide = cmd.type === 'ability' && ['enemies', 'group'].includes(ABILITIES[cmd.id]?.target);
    if (!t || t.windWall || wide) {
      const other = foes.filter((f) => !f.windWall && !f.clone).sort((x, y) => x.hp - y.hp)[0];
      return other ? { type: 'attack', target: other.id } : dodgeCmd(b, c, 'phys');
    }
  }
  // かげ火を 先に（いちばん ダメージの 大きい 攻撃で）
  if (fl.length && atFoe && !b.phNoFlame) {
    const hit = bestHit(b, c, fl[0]);
    if (hit) return hit.cmd;
  }
  return cmd;
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
// 敵: 風のかべ（windWall）・水かさ（tide・tideMax）
export function phantomPub(c) {
  if (c.side !== 'enemy') return {};
  const o = {};
  if (kindOf(c) === 'storm') o.windWall = c.windWall ? 1 : 0;
  if (c.tide !== undefined) {
    o.tide = c.tide;
    o.tideMax = c.tideMax;
  }
  return o;
}
