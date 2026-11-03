// 第64回: 魔物の 体当たりは 系統ごとに 大きく わかりやすく（client/render/enemyfx.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTS, RACE_MOVE, physMove, enemyActKind, actPose } from '../public/js/client/render/enemyfx.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';

test('第64回: 系統ごとの 動き（空を とぶ 魔物は 急降下）', () => {
  const sp = (pred) => Object.keys(MONSTERS).find((k) => pred(MONSTERS[k]));
  assert.equal(physMove({ species: sp((m) => m.race === 'slime' && !m.flying) }), 'hop');
  assert.equal(physMove({ species: sp((m) => m.race === 'beast' && !m.flying) }), 'pounce');
  assert.equal(physMove({ species: sp((m) => m.flying) }), 'dive');
  assert.equal(physMove({ species: sp((m) => m.race === 'dragon' && !m.flying) }), 'rear');
  assert.equal(physMove({ species: 'nai' }), 'lunge');
  for (const r of new Set(Object.values(MONSTERS).map((m) => m.race))) assert.ok(RACE_MOVE[r], `${r} の 動き`);
  for (const k of new Set([...Object.values(RACE_MOVE), 'dive'])) assert.ok(ACTS[k], k);
  // 通常攻撃と 体当たりの 技
  const beast = sp((m) => m.race === 'beast' && !m.flying);
  assert.equal(enemyActKind({ type: 'attack' }, null, { species: beast }), 'pounce');
  assert.equal(enemyActKind({ type: 'ability', anim: 'quake' }, { effect: { type: 'phys' } }, { species: beast }), 'jump');
});

test('第64回: 動きは 大きい（1.3倍 いじょうに 近づく か 大きく 動く）・こわれた 数に ならない', () => {
  for (const kind of [...new Set([...Object.values(RACE_MOVE), 'dive', 'lunge', 'big'])]) {
    for (const boss of [false, true]) {
      const a = { kind, dur: ACTS[kind].dur, boss, age: 0 };
      let maxS = 0, maxD = 0;
      for (let i = 0; i <= 50; i++) {
        const P = actPose(a, (a.dur * i) / 50);
        for (const v of [P.dx, P.dy, P.sx, P.sy]) assert.ok(Number.isFinite(v), `${kind} ${i}`);
        assert.ok(P.sx > 0.5 && P.sy > 0.5 && P.sx < 2.2 && P.sy < 2.2, `${kind}: 大きさ ${P.sx} ${P.sy}`);
        maxS = Math.max(maxS, P.sx, P.sy);
        maxD = Math.max(maxD, Math.abs(P.dx), Math.abs(P.dy));
      }
      assert.ok(maxS >= 1.25 || maxD >= 20, `${kind}: わかりやすく（大きさ ${maxS.toFixed(2)}・うごき ${maxD.toFixed(0)}）`);
      // さいごは もとの 場所・大きさに もどる
      const E = actPose(a, a.dur);
      assert.ok(Math.abs(E.dx) < 1 && Math.abs(E.dy) < 1 && Math.abs(E.sx - 1) < 0.05 && Math.abs(E.sy - 1) < 0.05, `${kind}: もどる ${JSON.stringify(E)}`);
    }
  }
});
