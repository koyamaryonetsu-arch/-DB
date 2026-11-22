// 第100回 V1班: はかる 道具（tools/sim-ch9.mjs の ch9Run）と 本当の 流れ（tools/real-boss.mjs）の 合わせ（docs/plan-sim-vs-real.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ch9Run, LV9 } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { realRun } from '../tools/real-boss.mjs';

test('道具: 人 1人ずつ べつの 手（本物と 同じ）・legacy は 前の 1つの 手', { timeout: 300000 }, () => {
  const hands = (opts) => {
    let out = null;
    ch9Run('colonel', LV9.colonel, 'know', 1, { party: 'p4', flags: ORDER_FLAGS.act3.colonel, ...opts, onEnd: (b) => { out = b.allies.filter((a) => a.kind === 'player').map((a) => a.controller); } });
    return out;
  };
  const now = hands({});
  assert.equal(now.length, 4);
  assert.equal(new Set(now).size, 4, '4人 べつべつ');
  assert.deepEqual([...new Set(hands({ legacy: true }))], ['sim'], 'legacy … 1つの 手');
  // 1人＋自動の 仲間は 手が 1つ（自動の 仲間は 手なし）
  let k1 = null;
  ch9Run('colonel', LV9.colonel, 'know', 1, { party: 'k1fam', flags: ORDER_FLAGS.act3.colonel, onEnd: (b) => { k1 = b.allies.map((a) => a.controller || null); } });
  assert.deepEqual(k1, ['sim', null, null, null]);
});

test('本物の 流れ: 1人＋家族の 仲間3 で たいさと 戦える（画面と 同じ 形の コマンドが はねかえされない）', { timeout: 300000 }, async () => {
  const r = await realRun('colonel', 'k1fam', 9090);
  assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
  assert.equal(r.rej, 0, 'はねかえされた コマンド');
  assert.equal(r.allies.length, 4);
  assert.equal(r.allies.filter((a) => a.controller).length, 1, '人は 1人');
  assert.ok(r.allies.slice(1).every((a) => a.kind === 'support' && a.auto), '家族の 仲間は 自動');
  assert.ok((r.sent.m10_utsuru || 0) + (r.sent.m9_teru || 0) > 0, 'しくみの コマンドを 送った');
});
