// 第101回 R1班: 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人か 3人）の 表 bare（battle-c9a.js の bareOf・pickPeople）
//   few より 先に きく・自動の 仲間が いる 時は きかない・ひとりは solo の まま・ゲスト（スピカ）は 数えない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { bareOf, pickPeople, peopleOf, trioConf, trialConf, mechaOf, hoshimoriOf } from '../public/js/shared/battle-c9a.js';
import { kingOf, kingConf } from '../public/js/shared/battle-c9b.js';
import { nazoOf, mechaOf9c } from '../public/js/shared/battle-c9c.js';
import { muConf } from '../public/js/shared/battle-c9d.js';
import { C9A_SUITORU, C9A_HOSHIMORI } from '../public/js/shared/data/monsters-c9a.js';
import { C9B_DEDEDON } from '../public/js/shared/data/monsters-c9b.js';
import { C9C_NAZOKAKE, C9C_HIKKURI } from '../public/js/shared/data/monsters-c9c.js';
import { C9D_MU } from '../public/js/shared/data/monsters-c9d.js';
import { ch9Party, CH9_IDS, LV9 } from '../tools/sim-ch9.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
function battle(boss, kinds) {
  const four = ch9Party(boss, LV9[boss]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? `p${i}` : null, auto: true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(5), boss: true, canFlee: false, allies, enemies: groupOf(CH9_IDS[boss]) });
}
const PP = ['player', 'player'];
const PPP = ['player', 'player', 'player'];

test('bareOf: 味方（ゲストを のぞく）が みんな 家族の キャラで 2人か 3人の 時だけ', () => {
  const al = (...k) => ({ allies: k.map((kind) => ({ kind })) });
  assert.equal(bareOf(al('player', 'player')), 2);
  assert.equal(bareOf(al('player', 'player', 'player')), 3);
  assert.equal(bareOf(al('player', 'player', 'guest')), 2, 'ゲストは 数えない');
  assert.equal(bareOf(al('player')), 0, 'ひとりは solo');
  assert.equal(bareOf(al('player', 'player', 'player', 'player')), 0, '4人');
  assert.equal(bareOf(al('player', 'support')), 0, '酒場・家族の 仲間');
  assert.equal(bareOf(al('player', 'player', 'monster')), 0, '魔物の 仲間');
  assert.equal(bareOf(null), 0);
  // えらぶ じゅん: solo → bare → few
  const c = { few: { hp: [1, 2, 3, 4, 5] }, bare: { hp: [20, 30] }, solo: { hp: 10 } };
  const b = (...k) => al(...k);
  assert.equal(pickPeople(c, b('player'), () => 1)('hp', 0), 10);
  assert.equal(pickPeople(c, b('player', 'player'), () => 2)('hp', 0), 20);
  assert.equal(pickPeople(c, b('player', 'player', 'player'), () => 3)('hp', 0), 30);
  assert.equal(pickPeople(c, b('player', 'player', 'support'), () => 2)('hp', 0), 2);
  assert.equal(pickPeople(c, b('player', 'player', 'player', 'player'), () => 4)('hp', 0), 4);
  assert.equal(pickPeople(c, null)('hp', 7), 7);
  // bare に ない キーは few
  assert.equal(pickPeople({ few: { atk: [1, 2, 3] }, bare: {} }, b('player', 'player'), () => 2)('atk', 0), 2);
});

test('第1章の ボス みんな: 人2人だけ・人3人だけ は bare・2人＋酒場は few・ひとりは solo', () => {
  const cases = [
    ['trio', C9A_SUITORU, 'c9a', (b) => mechaOf(b).maxHp],
    ['trial', C9A_HOSHIMORI, 'c9a', null],
    ['king', C9B_DEDEDON, 'c9b', (b) => kingOf(b).maxHp],
    ['riddle', C9C_NAZOKAKE, 'c9c', (b) => nazoOf(b).maxHp],
    ['trio2', C9C_HIKKURI, 'c9c', (b) => mechaOf9c(b).maxHp],
    ['mu', C9D_MU, 'c9d', (b) => b.enemies.find((e) => e.species === C9D_MU).maxHp],
  ];
  for (const [boss, sp, key, hpOf] of cases) {
    const c = MONSTERS[sp][key];
    assert.ok(c.bare, `${boss}: bare`);
    for (const [k, v] of Object.entries(c.bare)) assert.equal(v.length, 2, `${boss}.${k}`);
    if (!hpOf) continue;
    const base = MONSTERS[sp].hp;
    if (c.bare.hp) {
      assert.equal(hpOf(battle(boss, PP)), Math.round(base * c.bare.hp[0]), `${boss}: 2人だけ`);
      assert.equal(hpOf(battle(boss, PPP)), Math.round(base * c.bare.hp[1]), `${boss}: 3人だけ`);
    }
    assert.equal(hpOf(battle(boss, ['player', 'player', 'support', 'support'])), Math.round(base * c.few.hp[1]), `${boss}: 2人＋酒場2 は few`);
    assert.equal(hpOf(battle(boss, ['player'])), Math.round(base * c.solo.hp), `${boss}: ひとりは solo`);
  }
  // しくみの 数も bare（3人組の すいこむまでの 間・ためしの 夜明けの めもり・大王の 見る 間・ムウの ドーン）
  const t2 = battle('trio', PP);
  assert.equal(trioConf(mechaOf(t2), t2).wait, MONSTERS[C9A_SUITORU].c9a.bare.wait[0]);
  assert.equal(peopleOf(t2), 2);
  const h3 = battle('trial', PPP);
  assert.equal(trialConf(hoshimoriOf(h3), h3).dawn, MONSTERS[C9A_HOSHIMORI].c9a.bare.dawn[1]);
  assert.equal(hoshimoriOf(h3).c9h.max, MONSTERS[C9A_HOSHIMORI].c9a.bare.dawn[1]);
  const h3s = battle('trial', ['player', 'player', 'player', 'support']);
  assert.equal(trialConf(hoshimoriOf(h3s), h3s).dawn, MONSTERS[C9A_HOSHIMORI].c9a.few.dawn[2], '3人＋酒場1 は few');
  const k2 = battle('king', PP);
  assert.equal(kingConf(kingOf(k2), k2).watch, MONSTERS[C9B_DEDEDON].c9b.bare.watch[0]);
  const m3 = battle('mu', PPP);
  assert.equal(muConf(null, m3).doon.mult, MONSTERS[C9D_MU].c9d.doon.mult * MONSTERS[C9D_MU].c9d.bare.doonK[1]);
});

test('1人＋自動の 仲間3・ひとりだけ の 数は もとの まま（few の 1人め・solo）', () => {
  // 道具と 本物が 合って いる 遊び方なので 動かさない（docs/plan-sim-vs-real.md の 10）
  assert.deepEqual(MONSTERS[C9A_SUITORU].c9a.solo, { hp: 0.1, atk: 0.3, guard: 0.4, nozzle: 0.3, wait: 0, aim: 4 });
  assert.deepEqual(MONSTERS[C9A_HOSHIMORI].c9a.solo, { atk: 0.45, dawn: 10, every: 2 });
  assert.deepEqual(MONSTERS[C9B_DEDEDON].c9b.solo, { hp: 0.12, atk: 0.45, dish: 0.25, watch: 3, jump: 8, wait: 2 });
  assert.deepEqual(MONSTERS[C9C_NAZOKAKE].c9c.solo, { hp: 0.096, atk: 0.5, limit: 2, timeoutK: 4 });
  assert.deepEqual(MONSTERS[C9C_HIKKURI].c9c.solo, { hp: 0.077, atk: 0.42, boom: 4 });
  assert.deepEqual(MONSTERS[C9D_MU].c9d.solo, { hp: 0.11, atk: 0.3, beamEvery: 6, doonEvery: 99, wake: 0.6, wakeUp: 0.5 });
  const first = (c) => Object.fromEntries(Object.entries(c.few).map(([k, v]) => [k, v[0]]));
  assert.deepEqual(first(MONSTERS[C9A_SUITORU].c9a), { guard: 0.55, nozzle: 0.7, wait: 2, hp: 0.6, atk: 0.6 });
  assert.deepEqual(first(MONSTERS[C9A_HOSHIMORI].c9a), { dawn: 9, every: 1, two: 0.5, bwait: 0, atk: 1 });
  assert.deepEqual(first(MONSTERS[C9B_DEDEDON].c9b), { dish: 0.45, watch: 5, wait: 3, jump: 7, hp: 0.55, atk: 0.9 });
  assert.deepEqual(first(MONSTERS[C9C_NAZOKAKE].c9c), { hp: 0.45, atk: 1.6, limit: 2, timeoutK: 3.5 });
  assert.deepEqual(first(MONSTERS[C9C_HIKKURI].c9c), { hp: 0.55, atk: 1.35, boom: 3.5 });
  assert.deepEqual(first(MONSTERS[C9D_MU].c9d), { hp: 0.4, atk: 0.72, doonK: 0.5 });
  for (const [sp, hp, str] of [[C9A_SUITORU, 61600, 1700], [C9A_HOSHIMORI, 120000, 1665], [C9B_DEDEDON, 77000, 1800], [C9C_NAZOKAKE, 92500, 1940], [C9C_HIKKURI, 109000, 2240]]) {
    assert.equal(MONSTERS[sp].hp, hp, sp);
    assert.equal(MONSTERS[sp].str, str, sp);
  }
});
