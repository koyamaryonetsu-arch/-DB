// 第87回 E班（4つの 合わせ）: 合体技は「頭打ちの あとの のび」（A班）の 外（docs/plan-balance-r87.md の 実装メモ E班）
//   合体技の 強さの 見つもり（skillEstimate → memberPower → dualPower）と 合体技の 回復（memberHeal）は、
//   A班の 前の 式（頭打ちで 止まる）で 計算する。ひとりで うつ 呪文・回復は A班の まま（のびる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { skillEstimate, memberPower, memberHeal, dualPower } from '../public/js/shared/battle-dual.js';
import { powScaleDual, powScaleOf, powScaleFor } from '../public/js/shared/pow-scale.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { makeRng } from '../public/js/shared/rng.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} ${a} ≒ ${b}`);
// A班の 前の 式（第86回まで）
const oldScale = (pow, e) => 1 + Math.max(0, Math.min(e.scaleCap ?? 1, ((pow || 0) - (e.thr ?? 20)) / 150));

function mk(job, name, lv = 20, jobLv = 6) {
  const c = newCharacter({ id: name, name, job });
  gainExp(c, expForLevel(lv));
  c.jobs[job].lv = jobLv;
  fullHeal(c);
  return c;
}

// ヒナ（魔法使い）と ミーナ（僧侶）
function duo() {
  const b = new Battle({ rng: makeRng(3), allies: [{ char: mk('mage', 'ヒナ') }, { char: mk('priest', 'ミーナ') }], enemies: ['kobushi'] });
  const tg = b.enemies[0];
  tg.resist = {};
  tg.defending = false;
  return { b, hina: b.allies[0], mina: b.allies[1], tg };
}

test('式: powScaleDual は A班の 前の 式（頭打ちで 止まる）', () => {
  for (const e of [{ thr: 34 }, { thr: 90 }, {}, { thr: 10, scaleCap: 1.6 }]) {
    for (const pow of [0, 50, 184, 240, 437, 900]) near(powScaleDual(pow, e), oldScale(pow, e), `thr ${e.thr} 魔力 ${pow}`);
  }
  // 味方でも 合体技の 見つもり（dualEst）は のびない・ふつうは のびる
  near(powScaleFor({ side: 'ally' }, 900, { thr: 90, dualEst: true }), 2);
  assert.ok(powScaleFor({ side: 'ally' }, 900, { thr: 90 }) > 2);
  near(powScaleOf(900, { thr: 90 }, true), powScaleFor({ side: 'ally' }, 900, { thr: 90 }));
});

test('合体技の 強さ: 魔力が 頭打ちを 大きく こえた 味方でも、A班の 前と 同じ 数（ひとりの 呪文は のびる）', () => {
  const { b, hina, tg } = duo();
  const id = 'merami';
  const e = ABILITIES[id].effect;
  hina.buffs = {};
  // 頭打ちちょうど（A班の 前は ここで 止まる）
  hina.mag = e.thr + 150;
  const capEst = skillEstimate(b, hina, id, tg);
  const capPow = memberPower(b, hina, [id], tg);
  const capSolo = b.calcMagic(hina, tg, { ...e, element: undefined }, 1, true).dmg;
  // 頭打ちの 手前（A班の 前と あとで 同じ 所）は 魔力に つれて のびる
  hina.mag = e.thr + 75;
  assert.ok(skillEstimate(b, hina, id, tg) < capEst, '頭打ちの 手前は 小さい');
  // 頭打ちを 大きく こえる（A班の 式なら ＋1.0 まで のびる 所）
  for (const mag of [e.thr + 300, e.thr + 600, e.thr + 1500]) {
    hina.mag = mag;
    assert.equal(skillEstimate(b, hina, id, tg), capEst, `見つもり 魔力 ${mag}`);
    assert.equal(memberPower(b, hina, [id], tg), capPow, `memberPower 魔力 ${mag}`);
    const solo = b.calcMagic(hina, tg, { ...e, element: undefined }, 1, true).dmg;
    assert.ok(solo > capSolo, `ひとりの 呪文は のびる（魔力 ${mag}: ${capSolo} → ${solo}）`);
  }
  // 合体技の ダメージの 見つもり（dualPower）も 同じ
  hina.mag = e.thr + 150;
  const part = { k: 1 };
  const d0 = dualPower(b, [hina], tg, part, 2);
  hina.mag = e.thr + 900;
  assert.equal(dualPower(b, [hina], tg, part, 2), d0);
});

test('合体技の 回復: 回復魔力が 頭打ちを 大きく こえても、A班の 前と 同じ 数（ひとりの 回復は のびる）', () => {
  const { mina } = duo();
  const id = 'behoimi';
  const e = ABILITIES[id].effect;
  const mid = (e.base[0] + e.base[1]) / 2;
  for (const pow of [e.thr + 75, e.thr + 150, e.thr + 450, e.thr + 1200]) {
    mina.healPow = pow;
    near(memberHeal(mina, [id]), mid * oldScale(pow, e), `回復魔力 ${pow}`);
  }
  mina.healPow = e.thr + 1200;
  near(powScaleFor(mina, mina.healPow, e), 3, 'ひとりの 回復は ＋1.0 まで のびる');
});
