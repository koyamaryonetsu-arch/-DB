// 第51回 C3: 幻の職業（宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神）の 新しい 技の 効果
// battle.js の applyAbility の さいご（default）から phantomCEffect、damage() から phantomCDamage を よぶ
//
//   { type: 'scold', chance, stop, atk, msg, failMsg }  … しかる（宇宙一のおかん）: 敵は 反省して しばらく 動かない
//        stop … 行動ゲージを マイナスに する 量（100 で ふだんの 1回ぶん 長く まつ。ボスは 半分・効きにくい）。atk … 攻撃力を 下げる 倍率
//   { type: 'erase', below, msg }                        … 消す（はかいと創造の神）: 前の ダメージの あと HPが 最大の below いかの 敵を 消す（ボス・メタルは 消えない）
//   { type: 'regear', mult }                             … 装備を 作りかえる: 仲間 それぞれの 装備が 1つ 新しく なり、その 強さが 上がる（バフ）
//   { type: 'crowd', add, spend }                        … 観客（夢のスタジアム鉄道）: 使った 人の 観客を ふやす（5まで）・spend で 使いきる
//        技に crowd: 0.1 … 観客 1つに つき ダメージ ＋10%（phantomCDamage）
//   天気（weather・weatherStrike）は battle-weather.js
import { mirageHit } from './battle-ch4.js?v=a5c15ff5e061';
import { ABILITIES } from './data/abilities.js?v=a5c15ff5e061';
import { weatherEffect, weatherDamage } from './battle-weather.js?v=a5c15ff5e061';
import { stackBuff } from './battle.js?v=a5c15ff5e061';

export const CROWD_MAX = 5;
// 作りかえる 装備（え らぶのは 運しだい）
export const REGEAR = [
  { part: '武器', name: 'ぴかぴかの伝説の剣', stat: 'atk' },
  { part: 'よろい', name: '星のかがやくよろい', stat: 'def' },
  { part: 'くつ', name: '風よりも速いくつ', stat: 'agi' },
  { part: 'つえ', name: '銀河の光のつえ', stat: 'mag' },
  { part: 'ぼうし', name: '天才のひらめきぼうし', stat: 'mag' },
  { part: 'たて', name: 'こわれないにじのたて', stat: 'def' },
];
const fmt = (s, c, t) => String(s).replaceAll('{a}', c.name).replaceAll('{t}', t ? t.name : '');

export function phantomCEffect(b, c, a, eff, ev, targets = [], powMult = 1) {
  switch (eff.type) {
    case 'scold': return scold(b, c, eff, ev, targets, powMult);
    case 'erase': return erase(b, c, eff, ev, targets);
    case 'regear': return regear(b, c, eff, ev, targets, powMult);
    case 'crowd': return crowd(c, eff, ev);
    default: return weatherEffect(b, c, a, eff, ev, targets, powMult);
  }
}

// しかる: 反省して 動かない（ゲージを マイナスに）＋ 攻撃力が 下がる
function scold(b, c, eff, ev, targets, powMult) {
  for (const t of targets) {
    if (!t.alive || t.fled || t.side === c.side) continue;
    if (mirageHit(b, c, t, ev)) continue;
    const ch = (eff.chance ?? 0.6) * (t.resist?.atb ?? 1) * (t.boss ? 0.5 : 1) * (0.6 + 0.4 * Math.min(1, powMult));
    if (!b.rng.chance(ch)) {
      ev.lines.push(fmt(eff.failMsg || '{t}は、ぷいっとそっぽを向いた…', c, t));
      continue;
    }
    const stop = (eff.stop ?? 100) * (t.boss ? 0.5 : 1);
    if (t.side === 'enemy') {
      b.queue = b.queue.filter((q) => q.id !== t.id);
      t.queued = false;
      t.ready = false;
      t.atb = Math.min(t.atb || 0, 0) - stop;
    } else if (!t.ready && !t.queued) t.atb = 0;
    t.hansei = true;
    ev.lines.push(fmt(eff.msg || '{t}は、しかられて反省している…（しばらく動けない）', c, t));
    if (eff.atk) {
      stackBuff(t.debuffs, 'atk', eff.atk);
      ev.lines.push(`${t.name}の攻撃力が下がった！`);
    }
    ev.upd.push(t);
  }
  return true;
}

// 消す: ダメージの あと 弱った 敵を まっさらに
function erase(b, c, eff, ev, targets) {
  for (const t of targets) {
    if (!t.alive || t.fled || t.side === c.side || t.boss || t.metal) continue;
    if (t.hp > t.maxHp * (eff.below ?? 0.25)) continue;
    const d = t.hp;
    t.hp = 0;
    ev.lines.push(fmt(eff.msg || '{t}は、まっさらに消えて、何もなかったことになった！', c, t));
    (ev.results = ev.results || []).push({ id: t.id, dmg: d });
    ev.dealt = (ev.dealt || 0) + d;
    ev.lines.push(...b.kill(t, null, ev));
    ev.upd.push(t);
  }
  return true;
}

// 装備を 作りかえる: 1人に 1つ（運しだい）。強さは バフ（applyBuff）
function regear(b, c, eff, ev, targets, powMult) {
  for (const t of targets) {
    if (!t.alive) continue;
    const g = b.rng.pick(REGEAR);
    ev.lines.push(`${t.name}の${g.part}が、${g.name}に作りかえられた！`);
    b.applyBuff(c, t, { type: 'buff', stats: [g.stat], mult: eff.mult ?? 1.35 }, ev, powMult);
    (ev.regear = ev.regear || []).push({ id: t.id, stat: g.stat });
  }
  return true;
}

// 観客: ふやす・使いきる
function crowd(c, eff, ev) {
  if (eff.spend) {
    if (c.crowd) ev.lines.push(`${c.crowd * 2}万人の観客が、いっせいに立ち上がった！`);
    c.crowd = 0;
    return true;
  }
  const was = c.crowd || 0;
  c.crowd = Math.min(CROWD_MAX, was + (eff.add ?? 1));
  ev.lines.push(c.crowd === was ? 'スタンドは、もう満員だ！' : c.crowd >= CROWD_MAX ? `スタンドが${c.crowd * 2}万人の観客で満員になった！` : `スタンドに${c.crowd * 2}万人の観客が集まった！`);
  return true;
}

// ダメージ: 天気（battle-weather.js）と 観客（技の crowd）
export function phantomCDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || !c) return dmg;
  dmg = weatherDamage(b, c, t, dmg, info);
  const per = c.crowd && c.side !== t.side ? ABILITIES[ev?.ability]?.crowd : 0;
  if (per > 0) dmg = Math.max(1, Math.round(dmg * (1 + per * c.crowd)));
  return dmg;
}
