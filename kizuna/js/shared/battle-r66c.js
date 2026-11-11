// 第66回 C班: 伝説の職業（会長・働き方改革の星）の 戦いの とくべつな しくみ（docs/plan-r66-legend.md の C班）
// battle.js の applyAbility（case 'goldGuard'）と executeNext（行動の はじめ）から よぶ
//
//   { type: 'goldGuard', base, perLv, then }  … 会長の「黄金のボディーガード」: お金（base＋レベル×perLv ゴールド）を はらって then の 効き目
//        お金は hooks.spendGold（world/battles.js。たりなければ あるだけ）。たりない ときは はらった ぶんだけ 弱く なる（バフの 上がり方）
//        お金を もたない 人（敵の まぼろし・ためしの 戦い）は はらわずに 効く
//   jobs の passive.teiji（働き方改革の星）… 自分の 番の はじめに 最大HPの teiji の わりあいを 回復（定時で 帰って しっかり 休む）
import { JOBS } from './data/jobs.js?v=94ec7101b93e';

// 黄金のボディーガード（お金を はらって then を かける）
export function goldGuard(b, c, a, eff, ev, targets, powMult) {
  const want = Math.max(1, Math.round((eff.base || 40) + (c.lv || 1) * (eff.perLv || 0)));
  let paid = want;
  if (c.side === 'ally' && b.hooks?.spendGold) paid = b.hooks.spendGold(c, want) || 0;
  if (!paid) {
    ev.lines.push('しかしお金が足りない！');
    return;
  }
  if (c.side === 'ally' && b.hooks?.spendGold) ev.lines.push(`${paid}ゴールドをはらった！`);
  const then = eff.then;
  if (!then) return;
  // たりなかった ときは はらった ぶんだけ（バフの 上がり方を 小さく）
  const k = Math.min(1, paid / want);
  const part = then.mult > 1 && k < 1 ? { ...then, mult: 1 + (then.mult - 1) * k } : then;
  b.applyAbility(c, { ...a, effect: part }, null, ev, powMult, targets);
}

// 行動の はじめ: 定時で 帰って しっかり 休む（働き方改革の星。仲間の ときだけ）
export function r66cTurnStart(b, c, ev) {
  const rate = c?.side === 'ally' ? JOBS[c.job]?.passive?.teiji : 0;
  if (!rate || !c.alive || c.status?.rift || c.hp >= c.maxHp) return;
  const h = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(c.maxHp * rate)));
  c.hp += h;
  ev.lines.push(`${c.name}は、定時でしっかり休んだ。HPが${h}回復した！`);
  // 画面: 回復した 人の まどを みどりに 光らせる（client/battle.js。じわじわ回復と おなじ）
  (ev.regenHeal = ev.regenHeal || []).push({ id: c.id, heal: h });
  ev.upd.push(c);
}
