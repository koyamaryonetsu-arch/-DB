// 第41回: オートの 作戦
// ・同じ 名前の 技（大神官と 大賢者の ザオリク・ベホマズン など）は、どれか 1つを「使わない」に すると みんな 使わない
//   （前は ならびに 2つ 出て、1つだけ 切っても もう1つを 使っていた）
// ・ふつうの 魔物には 補助（バフ・じわじわ回復・ねむり など）を ほとんど 使わない。相手と こっちの 強さを くらべる（fightWeight）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, learnedAbilities } from '../public/js/shared/stats.js';
import { JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { Battle, autoOffFor } from '../public/js/shared/battle.js';
import { decideAlly, fightWeight, FIGHT_HARD } from '../public/js/shared/ai.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { Bot } from './helpers.js';

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});

// 大神官と 大賢者を きわめた 人（ザオリクと ベホマズンが 2つずつ）
function twoZaoriku() {
  const c = jobChar('daikenja', 60, 9, 'sage2');
  c.jobs.high_priest = { lv: JOB_MAX_LEVEL, b: 999 };
  const learned = learnedAbilities(c);
  assert.ok(learned.includes('hp_zaoriku') && learned.includes('dz_zaoriku'), 'ザオリクを 2つ 覚えている');
  return c;
}

test('同じ 名前の 技: 1つを 使わない に すると、戦いでは みんな 使わない', () => {
  const c = twoZaoriku();
  c.autoOff = ['hp_zaoriku'];
  const off = autoOffFor(c, learnedAbilities(c));
  assert.ok(off.includes('hp_zaoriku') && off.includes('dz_zaoriku'));
  // 死んだ 仲間が いても、どちらの ザオリクも えらばない
  for (let i = 0; i < 30; i++) {
    const mate = jobChar('hero', 60, 9, 'm');
    const b = new Battle({ rng: makeRng(i), allies: [{ char: c, auto: true, kind: 'support' }, { char: mate, auto: true, kind: 'support' }], enemies: ['pururin'], canFlee: false });
    b.allies[1].hp = 0; b.allies[1].alive = false;
    const cmd = decideAlly(b, b.allies[0]);
    assert.ok(!(cmd.type === 'ability' && /zaoriku/.test(cmd.id)), JSON.stringify(cmd));
  }
});

test('同じ 名前の 技: 作戦の 画面で 切りかえると、同じ 名前の 技も いっしょに かわる（サーバー）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay('priest');
  await bot.settle();
  const me = bot.s.char;
  gainExp(me, expForLevel(60) - me.exp);
  me.jobs.high_priest = { lv: JOB_MAX_LEVEL, b: 999 };
  me.jobs.daikenja = { lv: JOB_MAX_LEVEL, b: 999 };
  me.job = 'daikenja';
  assert.ok(learnedAbilities(me).includes('dz_behomazun') && learnedAbilities(me).includes('hp_behomazun'));
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', id: 'dz_behomazun', op: 'off' });
  assert.ok(me.autoOff.includes('dz_behomazun') && me.autoOff.includes('hp_behomazun'));
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', id: 'hp_behomazun', op: 'on' });
  assert.ok(!me.autoOff?.includes('dz_behomazun') && !me.autoOff?.includes('hp_behomazun'));
});

test('強さの くらべ: 同じ レベルの ふつうの 魔物は hard ではない・ボスは いつも hard・レベルが 足りないと hard', () => {
  const party = () => ['hero', 'high_priest', 'archmage', 'god_hand'].map((j, k) => jobChar(j, 58, 9, `p${k}`));
  const mk = (lv, enemies, boss = false) => {
    const ps = ['hero', 'high_priest', 'archmage', 'god_hand'].map((j, k) => jobChar(j, lv, 9, `p${k}`));
    return new Battle({ rng: makeRng(1), allies: ps.map((c) => ({ char: c, auto: true, kind: 'support' })), enemies, boss, canFlee: false });
  };
  assert.equal(fightWeight(mk(58, ['pururin', 'pururin'])).hard, false, 'とても 弱い 魔物');
  assert.equal(fightWeight(mk(58, ['moss_deer', 'moss_deer'])).hard, false, '同じ くらいの 魔物（千年前の フィールド）');
  assert.equal(fightWeight(mk(58, ['pururin'], true)).hard, true, 'ボス');
  const weak = fightWeight(mk(15, ['moss_deer', 'moss_deer']));
  assert.ok(weak.hard && weak.threat >= FIGHT_HARD.threat, `レベルが 足りない（threat ${weak.threat.toFixed(2)}）`);
  assert.ok(party().length === 4);
});

test('ふつうの 魔物には 補助を ほとんど 使わない（ボスには 使う）', () => {
  const SUP = new Set(['buff', 'regen', 'status']);
  const count = (boss) => {
    let sup = 0, all = 0;
    for (let i = 0; i < 40; i++) {
      const ps = ['hero', 'high_priest', 'archmage', 'star_diva'].map((j, k) => jobChar(j, 58, 9, `p${k}`));
      const b = new Battle({ rng: makeRng(i), allies: ps.map((c) => ({ char: c, auto: true, kind: 'support' })), enemies: ['moss_deer', 'moss_deer', 'moss_deer'], boss, canFlee: false });
      for (const a of b.allies) {
        const cmd = decideAlly(b, a);
        all++;
        if (cmd.type === 'ability' && SUP.has(prim(ABILITIES[cmd.id]).type)) sup++;
      }
    }
    return sup / all;
  };
  const field = count(false), boss = count(true);
  assert.ok(field < 0.05, `ふつうの 魔物 ${(field * 100).toFixed(0)}%`);
  assert.ok(boss > field, `ボス ${(boss * 100).toFixed(0)}% > ふつう`);
});
