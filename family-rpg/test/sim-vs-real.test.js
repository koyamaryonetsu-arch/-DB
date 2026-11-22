// 第100回 V1班: はかる 道具（tools/sim-ch9.mjs の ch9Run）と 本当の 流れ（tools/real-boss.mjs）の 合わせ（docs/plan-sim-vs-real.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ch9Run, LV9 } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { realRun } from '../tools/real-boss.mjs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { CH9_IDS, ch9Allies, MODES9 } from '../tools/sim-ch9.mjs';
import { easyBase, easyCmd } from '../tools/sim-easy.mjs';

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

// 第101回 R3班: かんたんな 人（tools/sim-easy.mjs。第3部の ボス 全部）
function easyBattle(boss = 'colonel') {
  const list = ch9Allies(boss, LV9[boss], 'p4');
  const allies = list.map((x, i) => ({ char: x.char, kind: 'player', controller: `h${i}`, auto: false }));
  const enemies = FIXED_ENCOUNTERS[CH9_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(1), boss: true, canFlee: false, allies, enemies, hooks: { leaderFlag: (f) => ORDER_FLAGS.act3[boss]?.includes(f) } });
}
const kindOf = (cmd) => (cmd.type === 'ability' ? ABILITIES[cmd.id].effect?.type : cmd.type);

test('かんたんな 人: たおれた 仲間を 生き返らせる（easy0 は しない）・HP 4わり いかで 回復・ほかは 強い こうげき（HPの 多い 敵）', () => {
  const b = easyBattle();
  const pri = b.allies.find((a) => a.job === 'high_priest');
  const hero = b.allies.find((a) => a.job === 'hero');
  // ふだん: こうげき（技か「戦う」）・ねらいは HPの いちばん 多い 敵
  const top = b.aliveEnemies().slice().sort((x, y) => y.hp - x.hp)[0];
  const c0 = easyBase(b, hero);
  assert.ok(c0.type === 'attack' || ['phys', 'magic', 'multi'].includes(kindOf(c0)), JSON.stringify(c0));
  if (c0.target) assert.equal(c0.target, top.id);
  // HP 4わり いか: 回復
  hero.hp = Math.round(hero.maxHp * 0.3);
  assert.equal(kindOf(easyBase(b, pri)), 'heal');
  // たおれた 仲間: 生き返らせる（easy0 は 生き返らせない）
  b.kill(hero);
  const rv = easyBase(b, pri);
  assert.ok(['revive', 'reviveAll'].includes(kindOf(rv)), JSON.stringify(rv));
  assert.ok(!['revive', 'reviveAll'].includes(kindOf(easyBase(b, pri, { revive: false }))));
  // MP が ない: 回復も 技も 使えない →「戦う」
  for (const a of b.allies) a.mp = 0;
  const g = b.allies.find((a) => a.job === 'god_hand');
  assert.equal(easyBase(b, g).type, 'attack');
});

test('かんたんな 人: しくみの コマンドは 知って いる 人と 同じ（たいさ … 光った 石に いれば うつる か てらす）', () => {
  const b = easyBattle();
  assert.ok(b.c10c, 'たいさの 戦い');
  let seen = 0;
  for (let t = 0; t < 6000 && !b.over && !seen; t++) {
    b.tick(50);
    for (const a of b.allies) {
      if (!a.ready || !a.alive) continue;
      const cmd = easyCmd(b, a);
      if (cmd.type === 'ability' && ['m10_utsuru', 'm9_teru'].includes(cmd.id)) seen++;
      b.command(a.id, cmd, a.controller);
    }
  }
  assert.ok(seen > 0, 'うつる・てらすを 出した');
  // 道具の やり方 easy・easy0 は 足すが、Object.keys(MODES9) には 出さない
  assert.ok(MODES9.easy && MODES9.easy0);
  assert.deepEqual(Object.keys(MODES9), ['auto', 'blind', 'know']);
});

test('本物の 流れ: かんたんな 人（1人＋酒場3）が たいさで しくみの コマンドを 出す・はねかえされない', { timeout: 300000 }, async () => {
  const r = await realRun('colonel', 'k1npc', 9090, { human: 'easy' });
  assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
  assert.equal(r.rej, 0, 'はねかえされた コマンド');
  assert.ok((r.sent.m10_utsuru || 0) + (r.sent.m9_teru || 0) > 0, 'しくみの コマンドを 送った');
  assert.ok(!Object.keys(r.sent).includes('dual'), '合体技は しない');
});
