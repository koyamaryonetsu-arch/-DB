// 第38回 C: バフ・デバフ・かばう は「かかった 人の 行動の 回数」で 切れる・じわじわ回復は 行動の はじめに 回復（回数は 技の レベル）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub, BUFF_ACTS } from '../public/js/shared/battle.js';
import { skillLevel, skillLvOf, skillLvLeft, regenTimes, REGEN_BASE, SKILL_LV_USES, SKILL_LV_MAX } from '../public/js/shared/buff-acts.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { battleSkillText } from '../public/js/client/ui/skillinfo.js';
import { buffMarks, buffNames } from '../public/js/client/ui/info.js';
import { unitMarks } from '../public/js/client/battle-buffs.js';

function setup({ use = {} } = {}) {
  const chars = ['warrior', 'priest'].map((j, i) => {
    const c = newCharacter({ id: 'p' + i, name: ['ソラ', 'ミナ'][i], job: j });
    gainExp(c, expForLevel(30));
    fullHeal(c);
    c.mp = 999;
    c.skillUse = { ...use };
    return c;
  });
  const rng = makeRng(5);
  rng.chance = () => true;
  const b = new Battle({ rng, allies: chars.map((c, i) => ({ char: c, controller: 's' + i })), enemies: ['rockman'], canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 99999;
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return b;
}
const ev0 = () => ({ t: 'act', lines: [], upd: [] });
// u が 1回 行動する（ほかの 人の 番は まぜない）
function act(b, u, cmd = { type: 'defend' }) {
  b.queue = [];
  b.enqueue(u, cmd);
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}

test('技の レベル: 使った 回数で 1〜5（5・15・30・50回）', () => {
  assert.deepEqual(SKILL_LV_USES, [0, 5, 15, 30, 50]);
  assert.equal(SKILL_LV_MAX, 5);
  assert.equal(skillLvOf(0), 1);
  assert.equal(skillLvOf(4), 1);
  assert.equal(skillLvOf(5), 2);
  assert.equal(skillLvOf(15), 3);
  assert.equal(skillLvOf(29), 3);
  assert.equal(skillLvOf(30), 4);
  assert.equal(skillLvOf(50), 5);
  assert.equal(skillLvOf(999), 5);
  assert.equal(skillLevel({ hoimi: 16 }, 'hoimi'), 3);
  assert.equal(skillLevel(undefined, 'hoimi'), 1);
  assert.equal(skillLvLeft(12), 3, 'Lv3 まで あと 3回');
  assert.equal(skillLvLeft(50), null, 'Lv5 は いちばん上');
  // じわじわ回復の 回数: Lv1 3回 → Lv5 5回。道具・料理（合体技）は 3回
  assert.deepEqual([1, 2, 3, 4, 5].map(regenTimes), [3, 3, 4, 4, 5]);
  assert.equal(REGEN_BASE, 3);
});

test('バフは かかった 人が 3回 行動すると、3回めの おわりに 切れる（時間では 切れない）', () => {
  const b = setup();
  const [w, p] = b.allies;
  b.applyBuff(p, w, ABILITIES.baikiruto.effect, ev0());
  assert.equal(BUFF_ACTS, 3);
  assert.equal(w.buffs.atk.left, 3);
  // 時間が たっても 切れない（前の 版は 30びょう）
  b.advance(120000);
  b.queue = [];
  for (const x of b.combatants) Object.assign(x, { ready: false, queued: false, atb: 0 });
  assert.ok(w.buffs.atk, '時間では 切れない');
  // ほかの 人の 行動では へらない
  act(b, p);
  act(b, b.enemies[0], { type: 'ai' });
  assert.equal(w.buffs.atk.left, 3);
  act(b, w);
  assert.equal(w.buffs.atk.left, 2);
  act(b, w, { type: 'attack', target: b.enemies[0].id });
  assert.equal(w.buffs.atk.left, 1);
  const last = act(b, w);
  assert.equal(w.buffs.atk, undefined, '3回めの おわりに 切れる');
  assert.ok(last.lines.some((l) => l.includes('ソラの攻撃力が元にもどった')), last.lines.join('/'));
});

test('じぶんに かけた バフは、その 行動では へらない・かけ直すと 3回に もどる（かさねがけは 2だんかいまで）', () => {
  const b = setup();
  const [w] = b.allies;
  w.abilities = [...w.abilities, 'baikiruto'];
  w.penChar = { job: 'performer', jobs: { performer: { lv: 5 } } };
  act(b, w, { type: 'ability', id: 'baikiruto', target: w.id });
  assert.equal(w.buffs.atk.left, 3, 'かけた 行動では へらない');
  act(b, w);
  assert.equal(w.buffs.atk.left, 2);
  act(b, w, { type: 'ability', id: 'baikiruto', target: w.id });
  assert.equal(w.buffs.atk.lv, 2, '2だんかいめ');
  assert.equal(w.buffs.atk.left, 3, 'かけ直すと 3回に もどる');
  act(b, w, { type: 'ability', id: 'baikiruto', target: w.id });
  assert.equal(w.buffs.atk.lv, 2, '3回めは かさならない');
  assert.equal(w.buffs.atk.left, 3);
});

test('2回 行動する 敵は 1回ずつ 数える（デバフ）・防御も 1回の 行動', () => {
  const b = setup();
  const [w, p] = b.allies;
  const e = b.enemies[0];
  e.turns = 2;
  b.applyDebuff(w, e, { stat: 'def', mult: 0.75, chance: 1 }, ev0());
  assert.equal(e.debuffs.def.left, 3);
  b.queue = [];
  b.onReady(e); // 2回ぶん ならぶ
  assert.equal(b.queue.length, 2);
  b.executeNext();
  b.executeNext();
  assert.equal(e.debuffs.def.left, 1, '1回の 番で 2回 へる');
  b.queue = [];
  b.onReady(e);
  b.executeNext();
  assert.equal(e.debuffs.def, undefined, '3回めの 行動で 切れる');
  // 人が えらぶ 防御（すぐ 出る）も 1回の 行動
  b.applyBuff(p, w, ABILITIES.sukara.effect, ev0());
  const st = ABILITIES.sukara.effect.stat;
  w.ready = true;
  b.command(w.id, { type: 'defend' }, 's0');
  assert.equal(w.buffs[st].left, 2);
});

test('ずっと つづく こうか（ボスの 段階・おこった 攻撃力・空を とぶ かいひ）は 行動しても 切れない', () => {
  const b = setup();
  const e = b.enemies[0];
  e.buffs.atk = { mult: 1.5, left: Infinity };
  e.buffs.eva = { add: 0.1, left: Infinity };
  // 古い 形（left なし。前の 版の until）も ずっと
  e.debuffs.agi = { mult: 0.8, until: 1e12 };
  for (let i = 0; i < 6; i++) act(b, e, { type: 'ai' });
  assert.ok(e.buffs.atk && e.buffs.eva && e.debuffs.agi);
  assert.deepEqual(pub(e).buffLeft, {}, '数は 出さない');
  // 段階の こうか（monsters の phases。闘技場の 王者ガルムの 攻撃力）は left: Infinity
  const b2 = new Battle({ rng: makeRng(2), allies: [], enemies: ['ar_king'] });
  const k = b2.enemies[0];
  k.hp = Math.floor(k.maxHp * 0.4);
  b2.checkPhase(k, ev0());
  assert.equal(k.buffs.atk.left, Infinity);
  k.actions = [{ w: 1, id: 'm_nothing' }];
  for (let i = 0; i < 5; i++) act(b2, k, { type: 'ai' });
  assert.ok(k.buffs.atk, '段階の 攻撃力は ずっと');
});

test('かばう も 3回 行動する まで（仁王立ちの 守備力も）', () => {
  const b = setup();
  const [w, p] = b.allies;
  b.applyAbility(w, ABILITIES.kabau, { target: p.id }, ev0(), 1, [p]);
  assert.equal(w.cover.target, p.id);
  assert.equal(w.cover.left, 3);
  act(b, w);
  act(b, w);
  assert.ok(w.cover);
  assert.equal(pub(w).coverLeft, 1);
  act(b, w);
  assert.equal(w.cover, null);
  const nio = Object.keys(ABILITIES).find((k) => ABILITIES[k].effect?.type === 'cover' && ABILITIES[k].effect.defMult);
  b.applyAbility(w, ABILITIES[nio], {}, ev0(), 1, [w]);
  assert.equal(w.cover.target, 'all');
  assert.equal(w.buffs.def.left, 3);
});

test('じわじわ回復: かかった 人の 行動の はじめに 回復。回数は 技の レベル（Lv1 3回・Lv3 4回・Lv5 5回）', () => {
  for (const [n, times] of [[0, 3], [15, 4], [50, 5]]) {
    const b = setup({ use: { ck_soup: n } });
    const [w, p] = b.allies;
    p.abilities = [...p.abilities, 'ck_soup'];
    act(b, p, { type: 'ability', id: 'ck_soup', target: w.id });
    assert.equal(w.regen.left, times, `使った 回数 ${n}`);
    // 時間では 回復しない
    w.hp = 10;
    b.advance(8000);
    b.queue = [];
    for (const x of b.combatants) Object.assign(x, { ready: false, queued: false });
    assert.equal(w.hp, 10);
    let healed = 0;
    for (let i = 0; i < times; i++) {
      const hp0 = w.hp;
      const ev = act(b, w);
      assert.ok(w.hp > hp0, `${i + 1}回め`);
      assert.match(ev.lines[0], /ソラのHPが\d+回復した！/, '行動の はじめ（いちばん 上の 行）');
      assert.ok(ev.regenHeal?.[0]?.heal > 0);
      healed++;
    }
    assert.equal(w.regen, null, `${times}回で 消える`);
    const hp1 = w.hp;
    act(b, w);
    assert.equal(w.hp, hp1);
    assert.equal(healed, times);
  }
});

test('じわじわ回復: 合体技・敵・技の ない もの は 3回。強い ほう・多い ほうが のこる', () => {
  const b = setup({ use: { ck_soup: 50 } });
  const [w, p] = b.allies;
  const e = b.enemies[0];
  const eff = ABILITIES.ck_soup.effect;
  // 敵が かけた（技の レベルは ない）
  let ev = ev0();
  b.applyAbility(e, { effect: eff, target: 'self' }, {}, ev, 1, [e]);
  assert.equal(e.regen.left, 3);
  // 合体技の とちゅう（ev.dual）
  ev = { ...ev0(), ability: 'ck_soup', dual: { id: 'x' } };
  b.applyAbility(p, { effect: eff, target: 'ally' }, {}, ev, 1, [w]);
  assert.equal(w.regen.left, 3, '合体技は 3回');
  // 自分の 技（Lv5）で かけ直すと 多い ほう
  ev = { ...ev0(), ability: 'ck_soup' };
  b.applyAbility(p, { effect: eff, target: 'ally' }, {}, ev, 1, [w]);
  assert.equal(w.regen.left, 5);
  assert.equal(pub(w).regen, 5, '画面に のこりの 回数');
});

test('合体技: いっしょに 出した 仲間の バフも 1回 へる', () => {
  const b = setup();
  const [w, p] = b.allies;
  b.applyBuff(p, p, ABILITIES.baikiruto.effect, ev0());
  b.applyBuff(w, w, ABILITIES.baikiruto.effect, ev0());
  const held = [b.heldEffects(w), b.heldEffects(p)];
  const ev = { ...ev0(), dual: { m: [w.id, p.id] } };
  b.actEnd(w, held[0], ev);
  b.actEnd(p, held[1], ev);
  assert.equal(w.buffs.atk.left, 2);
  assert.equal(p.buffs.atk.left, 2);
});

test('画面: のこりの 回数の しるし（攻↑3・守↓↓2・回復4。ずっと つづく ものは 数なし）', () => {
  const b = setup();
  const [w, p] = b.allies;
  b.applyBuff(p, w, ABILITIES.baikiruto.effect, ev0());
  w.debuffs.def = { mult: 0.5, base: 0.75, lv: 2, left: 2 };
  w.regen = { amt: 9, left: 4 };
  const v = pub(w);
  assert.deepEqual(v.buffLeft, { '+atk': 3, '-def': 2 });
  assert.equal(v.regen, 4);
  assert.equal(buffNames(v.buffs, v.buffLeft), '攻↑3 守↓↓2');
  assert.deepEqual(unitMarks(v).map((m) => m.text), ['攻↑3', '守↓↓2', '回復4']);
  assert.deepEqual(buffMarks(['+eva'], {}).map((m) => m.text), ['かわ↑'], 'ずっと つづく ものは 数なし');
});

test('技の せつめいに 数を 出す（攻撃力1.3倍・3回行動のあいだ／毎ターンの初めにHP回復・4回）', () => {
  const pc = { job: 'performer', jobs: { performer: { lv: 1 } } };
  assert.match(battleSkillText('baikiruto', pc), /効果：攻撃力1\.3倍・3回行動のあいだ/);
  const cook = { job: 'cook', jobs: { cook: { lv: 1 } } };
  assert.match(battleSkillText('ck_soup', cook), /毎ターンの初めにHPを\d+〜\d+回復・3回/);
  assert.match(battleSkillText('ck_soup', cook, { lv: 3 }), /毎ターンの初めにHPを\d+〜\d+回復・4回/);
  assert.match(battleSkillText('ck_soup', cook, { lv: 3 }), /技Lv3/);
  assert.match(battleSkillText('ck_soup', { ...cook, skillUse: { ck_soup: 60 } }), /回復・5回/, 'skillUse からも');
});

test('セーブ: 技を 使った 回数（技の レベルの もと）は キャラごとに のこる。古い セーブは Lv1 から', () => {
  const c = repairChar({ id: 'x', name: 'ソラ', level: 10, skillUse: { hoimi: 20, '@atk': 3, bad: 'x' } });
  assert.deepEqual(c.skillUse, { hoimi: 20, '@atk': 3 });
  assert.equal(skillLevel(c.skillUse, 'hoimi'), 3);
  const old = repairChar({ id: 'y', name: 'ミナ', level: 5 });
  assert.deepEqual(old.skillUse, {});
  assert.equal(skillLevel(old.skillUse, 'hoimi'), 1);
  // 戦いの 中でも 使うと ふえて、画面に Lv が 出る（Lv2 いじょう）
  const b = setup({ use: { baikiruto: 4 } });
  const [w] = b.allies;
  w.abilities = [...w.abilities, 'baikiruto'];
  assert.equal(pub(w).slv.baikiruto, undefined);
  act(b, w, { type: 'ability', id: 'baikiruto', target: w.id });
  assert.equal(w.use.baikiruto, 5);
  assert.equal(pub(w).slv.baikiruto, 2);
});

test('調整: 強い ボスの ダメージ（data/boss-r38.js）・オートの 補助は ひかえめ（ai.js）', async () => {
  const { R38_BOSS_DMG, bossDmgRate } = await import('../public/js/shared/data/boss-r38.js');
  const { MONSTERS } = await import('../public/js/shared/data/monsters.js');
  const { BUFF_CHANCE, GUARD_BUFF_CHANCE } = await import('../public/js/shared/ai.js');
  for (const [sp, r] of Object.entries(R38_BOSS_DMG)) {
    assert.ok(MONSTERS[sp], `いる 魔物 ${sp}`);
    assert.ok(r >= 0.5 && r < 1, `${sp} ${r}`);
  }
  assert.equal(bossDmgRate(['gaia_tail', 'gaia_body', 'gaia_eater']), R38_BOSS_DMG.gaia_eater);
  assert.equal(bossDmgRate(['goblin']), 1, 'ふつうの 魔物は かわらない');
  const b = new Battle({ rng: makeRng(1), allies: [], enemies: ['nocto_1'] });
  assert.equal(b.bossDmg, R38_BOSS_DMG.nocto_1);
  assert.ok(BUFF_CHANCE.allies < 0.5 && BUFF_CHANCE.ally < 0.4 && BUFF_CHANCE.self < 0.3);
  assert.ok(GUARD_BUFF_CHANCE > 0);
});
