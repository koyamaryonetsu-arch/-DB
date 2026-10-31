// 第51回 C2: 幻の職業 4つの とくべつな ちから（data/jobs-phantom-b.js・data/abilities-phantom-b.js）
//
// ・先読み（名探てい王。こうか yomi）: 敵に t.yomi = { by, mult, chance } を つける。読まれた 敵が つぎに 動こうと すると（perform の はじめ）
//   その 行動を つぶして（chance。ボスは 半分）、読んだ 人が 反撃する（ふつうの 攻撃の mult ばい。会心も 出る）。
//   つぶせなくても 反撃は する。読んだ 人が たおれている・ねむり・マヒ なら 読みは 消える。読みは 1回 使うと 消える
// ・バリア（銀河の女王。こうか barrier）: 仲間に t.barrier（すいとる ダメージの のこり）。回復と おなじ 式で 大きさを きめる。
//   強い ほうが のこる（かさならない）。敵からの ダメージを 先に すいとり、0 に なると われる
// ・二重呪文（大魔導王。こうか twinCast）: c.twinCast = { left, mult }。ダメージの 呪文を 使うと、おなじ 呪文が もう1度（mult ばい）出る。left 回まで
// ・剣気（天下むそうの剣聖。jobs.js の passive.critStack と こうか kenki）: 会心の一撃が 出るたびに c.kenki が 1だん 上がる（cap まで）。
//   1だんに つき 物理の ダメージが per、会心の 出やすさが rate 上がる。技の critScale は さらに 1だんに つき その ぶん 強く なる。戦いが おわると 0
// battle.js から よぶ: r51bEffect（applyAbility の こうか）・r51bPerform（perform の はじめ）・r51bAfterCast（技の あと）・
//   barrierDamage（damage の 中）・kenkiCrit・kenkiMult（calcPhys）・kenkiGain（physHit の 会心）・r51bPub（pub）
import { JOBS } from './data/jobs.js?v=7040d8c7ec18';
import { abilityRole } from './data/abilities.js?v=7040d8c7ec18';
import { evMods } from './skill-tier.js?v=7040d8c7ec18';

// 剣気の きまり（passive.critStack。剣聖で ない 人は null）
export const critStackOf = (c) => (c?.side === 'ally' ? JOBS[c.job]?.passive?.critStack || null : null);
const kenkiOf = (c) => Math.max(0, c?.kenki || 0);

// 会心の 出やすさに 足す 数
export function kenkiCrit(c) {
  const cs = critStackOf(c);
  return cs ? kenkiOf(c) * (cs.rate || 0) : 0;
}
// 物理の ダメージに かける 数（eff.critScale … 技の ぶん）
export function kenkiMult(c, eff = {}) {
  const cs = critStackOf(c);
  const n = kenkiOf(c);
  if (!cs || !n) return 1;
  return (1 + n * (cs.per || 0)) * (1 + n * (eff.critScale || 0));
}
// 剣気を add だん 上げる（会心・技 kenki）。へんじ: 上がった あとの だん
export function kenkiGain(c, ev, add = 1) {
  const cs = critStackOf(c);
  if (!cs || !c.alive) return 0;
  const was = kenkiOf(c);
  const now = Math.min(cs.cap || 10, was + add);
  if (now === was) return was;
  c.kenki = now;
  ev.lines.push(now >= (cs.cap || 10) ? `${c.name}の剣気が、天までとどいた！（${now}だん）` : `${c.name}の剣気が高まった！（${now}だん）`);
  ev.kenki = { id: c.id, lv: now };
  ev.upd.push(c);
  return now;
}

// バリア: 敵からの ダメージを すいとる。へんじ: のこりの ダメージ（ぜんぶ すいとったら null。ことばも ここで 出す）
export function barrierDamage(b, c, t, dmg, ev) {
  if (!(t.barrier > 0) || !(dmg > 0) || !c || c.side === t.side) return dmg;
  const take = Math.min(t.barrier, dmg);
  t.barrier -= take;
  if (t.barrier <= 0) delete t.barrier;
  ev.upd.push(t);
  if (take >= dmg) {
    ev.lines.push(`${t.name}のバリアが、ダメージをすいとった！`);
    ev.results = ev.results || [];
    ev.results.push({ id: t.id, dmg: 0, barrier: take });
    if (!t.barrier) ev.lines.push(`${t.name}のバリアがわれた！`);
    return null;
  }
  ev.lines.push(`${t.name}のバリアがわれた！`);
  return dmg - take;
}

// 技の こうか（yomi・barrier・twinCast・kenki）。ほかの こうかなら false
export function r51bEffect(b, c, a, eff, ev, targets) {
  switch (eff.type) {
    case 'yomi': {
      for (const t of targets) {
        if (!t.alive || t.fled || t.side === c.side) continue;
        t.yomi = { by: c.id, mult: eff.mult ?? 2, chance: eff.chance ?? 1 };
        ev.lines.push(`${c.name}は、${t.name}の次の行動を読んだ！`);
        ev.upd.push(t);
      }
      return true;
    }
    case 'barrier': {
      const pow = evMods(c, ev).healMul;
      for (const t of targets) {
        if (!t.alive) continue;
        const amt = b.healAmountOf(c, eff, pow);
        t.barrier = Math.max(t.barrier || 0, amt);
        ev.lines.push(`${t.name}は、星くずのバリアにつつまれた！`);
        ev.upd.push(t);
      }
      return true;
    }
    case 'twinCast': {
      c.twinCast = { left: Math.max(1, eff.n || 1), mult: eff.mult ?? 0.6 };
      ev.lines.push(`${c.name}は、2つの呪文を同時にとなえる構えだ！`);
      ev.upd.push(c);
      return true;
    }
    case 'kenki': {
      if (!critStackOf(c)) {
        if (!ev.inMulti) ev.lines.push('しかし何も起こらなかった！');
        return true;
      }
      kenkiGain(c, ev, eff.add || 1);
      return true;
    }
    default: return false;
  }
}

// 行動の はじめ: 先読みされて いたら つぶして 反撃（師しょうのまぼろしが 仲間を 読む ことも ある）。へんじ: つぶした（この 行動は おわり）
export function r51bPerform(b, c, cmd, ev) {
  const y = c.yomi;
  if (!y) return false;
  delete c.yomi;
  const by = b.get(y.by);
  if (!by?.alive || by.fled || by.status?.sleep || by.status?.paralyze) return false;
  // にげる・様子を 見るは そのまま
  if (!cmd || cmd.type === 'flee' || cmd.type === 'defend') return false;
  const stop = b.rng.chance(Math.min(1, (y.chance ?? 1) * (c.boss ? 0.5 : 1)));
  ev.lines.push(`${by.name}「読みどおりだ！」`);
  ev.yomiHit = { by: by.id, who: c.id, stop };
  const res = b.calcPhys(by, c, { mult: y.mult ?? 2 }, 1, 'phys');
  ev.fx = { type: 'ability', anim: 'ox_tk_yomi_hit', actor: by.id, targets: [c.id], side: by.side };
  if (res.miss) {
    ev.lines.push(`${c.name}はひらりと身をかわした！`);
    (ev.results = ev.results || []).push({ id: c.id, miss: true });
  } else {
    if (res.crit) ev.lines.push('会心の一撃！');
    b.damage(by, c, res.dmg, ev, { crit: res.crit, element: 'phys' });
  }
  if (!stop || !c.alive) {
    if (c.alive) ev.lines.push(`しかし${c.name}は、かまわず動いた！`);
    return !c.alive;
  }
  ev.lines.push(`${c.name}は、動きをつぶされた！`);
  return true;
}

// 技の あと: 二重呪文（ダメージの 呪文が もう1度）。apply … (powMult) => 技を もう1度 かける
export function r51bAfterCast(b, c, a, ev, pow, apply) {
  const tw = c.twinCast;
  if (!tw || !(tw.left > 0) || !c.alive) return false;
  if (!(a.kind === 'spell' || a.spellLike) || abilityRole(a) !== 'dmg') return false;
  if (!b.combatants.some((x) => x.alive && !x.fled && x.side !== c.side)) return false;
  tw.left--;
  if (tw.left <= 0) delete c.twinCast;
  ev.lines.push(`二重呪文！${a.name}が、もう1度！`);
  ev.twin = true;
  apply(pow * (tw.mult ?? 0.6));
  return true;
}

// たたかいの 画面に 出す もの（バリアの のこり・読まれている・剣気の だん）
export function r51bPub(c) {
  const out = {};
  if (c.barrier > 0) out.barrier = Math.round(c.barrier);
  if (c.yomi) out.yomi = true;
  if (c.kenki > 0) out.kenki = c.kenki;
  if (c.twinCast?.left > 0) out.twin = c.twinCast.left;
  return out;
}
