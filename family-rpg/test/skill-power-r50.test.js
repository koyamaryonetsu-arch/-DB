// 第50回 N1: 技・呪文の 威力の 目安（物理は ふつうの 攻撃の 何倍か・魔力の 呪文は 今の 魔力での ダメージ・回復は 今の 回復魔力で）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { newCharacter, gainExp, expForLevel, fullHeal, computeStats, penaltyFor } from '../public/js/shared/stats.js';
import { skillPower, powStats, powScale, fmtMult } from '../public/js/shared/skill-power.js';
import { skillPowerLine, battleSkillText, skillEffectText } from '../public/js/client/ui/skillinfo.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';

function mk(job, lv = 30, extra = {}) {
  const c = newCharacter({ id: 'p_' + job, name: 'ソラ', job });
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  return Object.assign(c, extra);
}

test('物理: ふつうの 攻撃の 何倍か（威力×1.5）', () => {
  const w = mk('warrior');
  const p = skillPower('daichi', w);
  assert.equal(p.parts.length, 1);
  assert.equal(p.parts[0].type, 'phys');
  assert.ok(Math.abs(p.parts[0].mult - 1.5) < 1e-9);
  assert.equal(p.text, '威力×1.5');
  assert.equal(skillPowerLine('daichi', w), '威力×1.5');
  assert.equal(fmtMult(1), '1.0');
  assert.equal(fmtMult(0.55), '0.55');
});

test('物理: 何回も 当たる 技は 回数も（威力×0.55×4回）', () => {
  const w = mk('warrior');
  const t = skillPowerLine('tsurugimai', w);
  assert.match(t, /^威力×0\.55×4回（ランダム）$/);
  const p = skillPower('tsurugimai', w).parts[0];
  assert.equal(p.hits, 4);
  assert.ok(p.random);
});

test('転職の ペナルティ: 本職で ない 技は 威力が 下がり、本来の 倍率も 出す', () => {
  const m = mk('mage');
  const pen = penaltyFor(m, 'daichi');
  assert.ok(pen.penalized && pen.powMult < 1);
  const p = skillPower('daichi', m);
  assert.ok(p.penalized);
  assert.ok(Math.abs(p.parts[0].mult - 1.5 * pen.powMult) < 1e-9);
  assert.match(p.text, /^威力×[\d.]+（本来×1\.5）$/);
  // 呪文でも ダメージが へる
  const w = mk('warrior');
  w.equip = {};
  const st = { mag: 80, heal: 40 };
  const own = skillPower('mera', { job: 'mage', jobs: {} }, { st }).parts[0];
  const off = skillPower('mera', { job: 'warrior', jobs: {} }, { st }).parts[0];
  assert.ok(off.max < own.max, `${off.max} < ${own.max}`);
});

test('魔力の 呪文: 今の 魔力が 高いほど ダメージの 目安が 上がる（耐性は 考えない）', () => {
  const lo = skillPower('merami', { job: 'mage', jobs: {} }, { st: { mag: 20, heal: 0 } }).parts[0];
  const hi = skillPower('merami', { job: 'mage', jobs: {} }, { st: { mag: 120, heal: 0 } }).parts[0];
  assert.equal(lo.type, 'magic');
  assert.ok(hi.min > lo.min && hi.max > lo.max);
  const e = ABILITIES.merami.effect;
  assert.equal(hi.max, Math.round(e.base[1] * powScale(120, e)));
  assert.match(skillPowerLine('merami', { job: 'mage', jobs: {}, pow: { mag: 120, heal: 0 } }), /^今の魔力でダメージ約\d+〜\d+$/);
  // レベルが 上がると（セーブの キャラから 計算）
  const m10 = mk('mage', 10), m50 = mk('mage', 50);
  assert.ok(powStats(m50).mag > powStats(m10).mag);
  assert.ok(skillPower('merami', m50).parts[0].max > skillPower('merami', m10).parts[0].max);
  assert.equal(powStats(m50).mag, computeStats(m50).mag);
});

test('魔力の 呪文: 戦いの みつもり（calcMagic）と おなじ しき', () => {
  const mage = mk('mage', 40);
  const rng = makeRng(3);
  const b = new Battle({ rng, allies: [{ char: mage, controller: 's0' }], enemies: ['rockman'], canFlee: true });
  const c = b.allies[0];
  const t = b.enemies[0];
  t.resist = {};
  t.defending = false;
  const pow = pub(c).pow;
  assert.ok(pow && pow.mag === Math.round(c.mag), '戦いの pub に 今の 魔力');
  const est = b.calcMagic(c, t, ABILITIES.merami.effect, 1, true).dmg;
  const p = skillPower('merami', { ...pub(c).pc, pow }).parts[0];
  assert.ok(est >= p.min - 1 && est <= p.max + 1, `${p.min}〜${p.max} に ${est}`);
  // 戦いの せつめいも 今の 魔力で
  assert.match(battleSkillText('merami', { ...pub(c).pc, pow }), /威力：今の魔力でダメージ約\d+〜\d+/);
});

test('回復: 今の 回復魔力で どれくらい 回復するか', () => {
  const lo = skillPower('hoimi', { job: 'priest', jobs: {} }, { st: { mag: 0, heal: 20 } }).parts[0];
  const hi = skillPower('hoimi', { job: 'priest', jobs: {} }, { st: { mag: 0, heal: 140 } }).parts[0];
  assert.equal(hi.type, 'heal');
  assert.ok(hi.max > lo.max);
  const pr = mk('priest', 30);
  assert.match(skillPowerLine('hoimi', pr), /^今の回復魔力で約\d+〜\d+回復$/);
  assert.match(skillEffectText('hoimi', pr), /今の回復魔力でHPを約\d+〜\d+回復/);
  // 魔力の わからない ときは もとの 目安
  assert.match(battleSkillText('hoimi', { job: 'priest', jobs: {} }), /HPを約26〜34回復/);
});

test('補助の 技は 効果の 文（数の かわりに）', () => {
  const w = mk('warrior');
  assert.match(skillPowerLine('baikiruto', w), /攻撃力1\.3倍/);
  assert.equal(skillPower('baikiruto', w).text, '');
});

test('すべての 技で こわれない（セーブの キャラ・戦いの pc・人 なし）', () => {
  const chars = [mk('warrior'), mk('mage', 60), { job: 'priest', jobs: {}, pow: { mag: 50, heal: 90 } }, null];
  for (const id of Object.keys(ABILITIES)) {
    for (const c of chars) {
      const p = skillPower(id, c);
      assert.equal(typeof p.text, 'string', id);
      for (const x of p.parts) {
        if (x.type === 'phys') assert.ok(Number.isFinite(x.mult), id);
        else assert.ok(Number.isFinite(x.min) && Number.isFinite(x.max) && x.min <= x.max, id);
      }
      assert.equal(typeof skillPowerLine(id, c), 'string', id);
    }
  }
});

test('メニュー: オートで 使う 技・呪文と技の 一覧に 威力と MP', () => {
  const src = readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  const auto = src.slice(src.indexOf('autoSkillsView(key) {'), src.indexOf('// ───── クエスト ─────'));
  assert.match(auto, /skillPowerLine\(id, c/);
  assert.match(auto, /MP\$\{mpCost\(c, id\)\}/);
  assert.match(auto, /sk-pow/);
  const sk = src.slice(src.indexOf('skillsView(active, who'), src.indexOf('autoSkillsView(key) {'));
  assert.match(sk, /skillPowerLine\(id, c/);
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.menu \.item \.sk-pow \{/);
  const bsrc = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(bsrc, /pow: a\.pow/);
});
