// 第101回 R3班: 第3部の ボスに 負けた 時の ひとこと ③（だれも 生き返らせて いない → すぐ 生き返らせよう）・
//   第1章の ボスの 自動の 仲間は、人が えらんで いる 時だけ しくみを 使う（battle-c10a.js の someoneChooses と 同じ きまり）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/encounters.js';
import { PARTY_NOTE, PARTY_NOTE_MAX } from '../public/js/shared/data/boss-hints.js';
import { partyNote, bossHintAfter, bossHintSteps } from '../public/js/shared/world/boss-hints.js';
import { c9Life } from '../public/js/shared/battle-c9a.js';
import { c9aPlan } from '../public/js/shared/battle-c9a.js';
import { kingOf, dishesOf } from '../public/js/shared/battle-c9b.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { CH9_IDS, LV9, ch9Allies } from '../tools/sim-ch9.mjs';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const A = (id, kind = 'player', alive = true) => ({ id, kind, alive, name: id });
// 戦いの ふり: 味方の いきしにを かえながら c9Life を よぶ（本物は battle-c9a.js の c9aAfter が 行動 ごとに よぶ）
function life(steps) {
  const b = { allies: steps[0].map(([id, kind]) => A(id, kind)) };
  for (const st of steps) {
    st.forEach(([, , alive], i) => { b.allies[i].alive = alive !== false; });
    c9Life(b);
  }
  return b;
}

test('数える: たおれた 人・生き返った 回数（ゲストは 数えない）', () => {
  const b = life([
    [['a', 'player'], ['b', 'player'], ['g', 'guest']],
    [['a', 'player', false], ['b', 'player'], ['g', 'guest', false]],
    [['a', 'player'], ['b', 'player', false], ['g', 'guest', false]],
  ]);
  assert.deepEqual([...b.c9life.died].sort(), ['a', 'b']);
  assert.equal(b.c9life.revives, 1);
});

test('ひとこと ③: 生き返らせた 回数 0・たおれた 人 2人 いじょう の 時だけ（2つまで）', () => {
  const P4 = [A('a'), A('b'), A('c'), A('d')];
  const dead2 = life([[['a', 'player', false], ['b', 'player', false], ['c', 'player'], ['d', 'player']]]);
  assert.equal(partyNote('c9b_king', P4, dead2), PARTY_NOTE.revive, '4人・だれも 生き返らせて いない');
  const dead1 = life([[['a', 'player', false], ['b', 'player'], ['c', 'player'], ['d', 'player']]]);
  assert.equal(partyNote('c9b_king', P4, dead1), '', 'たおれたのは 1人');
  const revived = life([[['a', 'player', false], ['b', 'player', false]], [['a', 'player'], ['b', 'player', false]]]);
  assert.equal(partyNote('c9b_king', P4, revived), '', '1回 生き返らせた');
  // 4人で いどもう と いっしょ（2つまで。行を わけて 1つの ことばに）
  const two = [A('a'), A('b')];
  assert.equal(partyNote('c10c_colonel', two, dead2), `${PARTY_NOTE.few}\n${PARTY_NOTE.revive}`);
  assert.equal(PARTY_NOTE_MAX, 2);
  // 第3部で ない 戦い・数えて いない 戦い（c9life なし）は 出ない
  assert.equal(partyNote('c8_bowser', P4, dead2), '');
  assert.equal(partyNote('c9b_king', P4, { allies: P4 }), '');
});

test('負けた 時: ヒントの あとに 生き返らせの ひとこと', () => {
  const s = { id: 's1', char: { name: 'ソラ' } };
  const world = { parties: new Map([['p1', { leader: 's1' }]]) };
  const battle = life([[['a', 'player', false], ['b', 'player', false], ['c', 'player', false], ['d', 'player', false]]]);
  bossHintAfter(world, { opts: { fixed: 'c9a_trio', boss: true }, partyId: 'p1', map: 'c9a_crater', actorMap: {}, battle }, [s], 'lose');
  assert.equal(s.bossHint.note, PARTY_NOTE.revive);
  assert.equal(bossHintSteps(s.bossHint, null).at(-1)[2], PARTY_NOTE.revive);
});

test('ひとこと ③ の 文: 子どもが 読める', () => {
  assert.ok(PARTY_NOTE.revive.length <= 45 && !/[ 　]/.test(PARTY_NOTE.revive));
  const files = gameFiles();
  for (const f of ['public/js/shared/data/boss-hints.js', 'public/js/shared/world/boss-hints.js']) {
    const full = files.find((y) => y.endsWith(f));
    assert.ok(full, f);
    assert.deepEqual(checkFile(full), [], f);
  }
});

// 大王: 1人＋家族の 仲間3。皿を 見て いる 時の 自動の 仲間の えらび方
function kingBattle(auto) {
  const list = ch9Allies('king', LV9.king, 'k1fam');
  const allies = list.map((x) => (x.know ? { char: x.char, kind: 'player', controller: 'h0', auto } : { char: x.char, kind: 'support', auto: true, tactics: 'balanced' }));
  const enemies = FIXED_ENCOUNTERS[CH9_IDS.king].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(1), boss: true, canFlee: false, allies, enemies });
}
test('大王: 自動の 仲間が 皿を ねらうのは、人が えらんで いる 時だけ（完全オートでは 使わない）', () => {
  const dishHits = (auto) => {
    const b = kingBattle(auto);
    const king = kingOf(b);
    const dish = dishesOf(b).find((d) => d.alive);
    assert.ok(king?.c9k && dish, '大王と 皿');
    king.c9k.watch = dish.id;
    const sup = b.allies.find((a) => a.kind === 'support');
    let n = 0;
    for (let i = 0; i < 30; i++) {
      const cmd = c9aPlan(b, sup, decideAlly);
      if (cmd?.target === dish.id) n++;
    }
    return n;
  };
  assert.equal(dishHits(true), 0, '完全オート（人が えらんで いない）');
  assert.ok(dishHits(false) > 0, '人が えらんで いる（3回に 1回）');
});
