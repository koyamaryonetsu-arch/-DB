// 第51回 C1: 幻の職業（海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI）の たたかいの しかけ（docs/plan-r51-phantom.md）
//
// 物理の 技（effect.type 'phys'）に 1つ 足すと、強さが かわる（battle.js の phys の さいしょで phantomAPhys を よぶ）
//   crew: 0.3   … 海賊王。生きている 仲間（自分も 入れる）が 1人 ふえるごとに 威力 +30%（4人で ×1.9）
//   ki: 0.45    … 伝説の超勇者。ためた 気（c.ki。0〜KI_MAX）1つごとに 威力 +45%。使うと 気は 0 に もどる
//   dance: 1    … 日の火影。影分身（c.clones）1人ごとに 当たる 回数が dance 回 ふえる。
//                 make … 分身が これより 少なければ この 人数まで 出す・consume … まい終わると 分身は 消える（ほかは のこりの 回数が 1 へる）
// 物理で ない こうか（battle-ch5.js の towerEffect から よぶ）
//   kiCharge { add, max }   … 気を ためる（c.ki）
//   clones { n, uses }      … 影分身を 出す（c.clones = { n, left }。分身の 技を uses 回 使うと 消える）
//   autoBoost { acts }      … 天才しせつ管理者AIの 自動最適化を 強くする（c.autoBoost。自分の 行動 acts 回）
// 行動の はじめ（battle-ch5.js の towerTurnStart から よぶ）
//   天才しせつ管理者AI（jobs の passive.autoOpt）… 自分の 番の たびに、仲間全員の 力を 1つ じゅんばんに 上げる（自動最適化）
import { JOBS } from './data/jobs.js?v=bf896afe56a6';
import { stackBuff } from './battle.js?v=bf896afe56a6';
import { BUFF_ACTS } from './buff-acts.js?v=bf896afe56a6';

export const KI_MAX = 3;
export const CLONE_MAX = 6;
// 自動最適化で 上げる じゅん
export const OPT_STATS = ['atk', 'def', 'agi', 'mag'];
const STAT_NAMES = { atk: '攻撃力', def: '守備力', agi: '素早さ', mag: '魔力' };

const aliveAllies = (b, c) => b.sideOf(c, true).filter((x) => x.alive);

// 物理の 技の 強さを かえて、ふつうの phys として 出す
export function phantomAPhys(b, c, a, cmd, ev, powMult, targets) {
  const { crew, ki, dance, make, consume, ...rest } = a.effect;
  const eff = { ...rest };
  if (crew) {
    const n = aliveAllies(b, c).length;
    eff.mult = (eff.mult || 1) * (1 + crew * Math.max(0, n - 1));
    ev.lines.push(n >= 2 ? `仲間${n}人の力が、1つになった！` : 'ひとりでも、王の心は折れない！');
    ev.crew = n;
  }
  if (ki) {
    const lv = Math.max(0, Math.min(KI_MAX, c.ki || 0));
    eff.mult = (eff.mult || 1) * (1 + ki * lv);
    if (lv) ev.lines.push(`ためた気を、${lv}だんかいぶん全て解き放つ！`);
    c.ki = 0;
    ev.ki = lv;
    ev.upd.push(c);
  }
  if (dance) {
    if (make && (c.clones?.n || 0) < make) makeClones(c, make, 1, ev);
    const n = c.clones?.n || 0;
    eff.hits = (eff.hits || 1) + dance * n;
    if (n) ev.lines.push(`影分身${n}人も、いっしょにまう！`);
    ev.clones = n;
    if (c.clones) {
      c.clones.left--;
      if (consume || c.clones.left <= 0) {
        c.clones = null;
        ev.postLines = (ev.postLines || []).concat(n ? ['分身たちは、火の粉になって消えた。'] : []);
      }
    }
    ev.upd.push(c);
  }
  b.applyAbility(c, { ...a, effect: eff }, cmd, ev, powMult, targets);
}

function makeClones(c, n, uses, ev) {
  const k = Math.max(1, Math.min(CLONE_MAX, n));
  c.clones = { n: Math.max(k, c.clones?.n || 0), left: Math.max(uses, c.clones?.left || 0) };
  ev.lines.push(`${c.name}の影分身が、${c.clones.n}人あらわれた！`);
  ev.upd.push(c);
}

// 物理で ない こうか（true … ここで あつかった）
export function phantomAEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'kiCharge': {
      const max = eff.max || KI_MAX;
      const was = c.ki || 0;
      c.ki = Math.min(max, was + (eff.add || 1));
      ev.lines.push(c.ki > was ? `${c.name}の気が、${c.ki}だんかいまでたまった！` : `${c.name}の気は、もういっぱいだ！`);
      ev.ki = c.ki;
      ev.upd.push(c);
      return true;
    }
    case 'clones': {
      makeClones(c, eff.n || 4, eff.uses || 3, ev);
      return true;
    }
    case 'autoBoost': {
      c.autoBoost = { left: eff.acts || 4 };
      ev.lines.push(`${c.name}は、自動最適化を全力モードにした！`);
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// 自動最適化の 強さ（全力モードの 間は 強い）
export function autoOptConf(c) {
  const p = JOBS[c?.job]?.passive?.autoOpt;
  if (!p || c.side !== 'ally') return null;
  const boost = !!c.autoBoost;
  return { base: boost ? p.boost || 1.25 : p.base || 1.15, heal: boost ? p.heal || 0.06 : 0, mp: boost ? p.mp || 2 : 0, boost };
}

// 行動の はじめ: 天才しせつ管理者AIの 自動最適化（自分の 番の たび。ねむり・マヒで 動けない 番は しない）
export function phantomATurnStart(b, c, ev, cmd) {
  if (!c.alive || cmd?.type === 'incapacitated') return;
  const conf = autoOptConf(c);
  if (!conf) return;
  const st = OPT_STATS[(c.autoOptI || 0) % OPT_STATS.length];
  c.autoOptI = (c.autoOptI || 0) + 1;
  const allies = aliveAllies(b, c);
  for (const t of allies) {
    if (!t.buffs) t.buffs = {};
    stackBuff(t.buffs, st, conf.base, BUFF_ACTS, 1);
    if (conf.heal) {
      const h = Math.min(t.maxHp - t.hp, Math.max(1, Math.round(t.maxHp * conf.heal)));
      if (h > 0) t.hp += h;
    }
    if (conf.mp && t.maxMp) t.mp = Math.min(t.maxMp, t.mp + conf.mp);
    ev.upd.push(t);
  }
  ev.lines.push(`AIが、仲間全員の${STAT_NAMES[st]}を自動で最適化した！${conf.boost ? '（HPとMPも少し回復）' : ''}`);
  ev.autoOpt = { by: c.id, stat: st, boost: conf.boost, ids: allies.map((t) => t.id) };
  if (c.autoBoost) {
    c.autoBoost.left--;
    if (c.autoBoost.left <= 0) c.autoBoost = null;
  }
}
