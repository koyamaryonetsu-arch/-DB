// 第87回 B班: むだな 能力を うつす（docs/plan-balance-r87.md の 1-2・3-B）
//   呪文を 覚えない 職業の 魔力は 1.0 に（下げた 分は HP・守り・MP へ。力と 素早さには 入れない）
//   名探てい・のぶドラは 能力は そのまま、魔力で うつ 技を 2つ いじょう に
//   力が むだな 7こ（1.2 を こえる 分の 半分）・回復が むだな 3こ（回復は 1.0 に）
//   どの 職業も 能力の 合計・perLv の 合計は 前と 同じ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { computeStats } from '../public/js/shared/stats.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { checkText } from '../tools/kanji-check.mjs';

const KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
const sum = (m) => KEYS.reduce((s, k) => s + (m[k] || 0), 0);
const parts = (e) => (e?.type === 'multi' ? e.parts || [] : e ? [e] : []);
// 魔力で うつ 技（呪文・推理。回復の 力で うつ 光は のぞく）
const magicSkill = (id) => parts(ABILITIES[id]?.effect).some((p) => (p.type === 'magic' || p.type === 'deduce') && Array.isArray(p.base) && p.stat !== 'heal');
const physSkill = (id) => parts(ABILITIES[id]?.effect).some((p) => p.type === 'phys');
const healSkill = (id) => parts(ABILITIES[id]?.effect).some((p) => ['heal', 'regen', 'revive', 'reviveAll', 'cure'].includes(p.type) || (p.type === 'magic' && p.stat === 'heal'));
const learns = (j) => JOBS[j].learn.map(([, a]) => a);

// 前の 能力（第86回まで）[hp, mp, str, def, agi, mag, heal] と perLv
const M = (hp, mp, str, def, agi, mag, heal) => ({ hp, mp, str, def, agi, mag, heal });
const BEFORE = {
  sword_master: M(1.45, 1.1, 1.65, 1.35, 1.3, 1.2, 1.0),
  shacho: M(1.35, 1.3, 1.25, 1.3, 1.1, 1.2, 1.25),
  nitoryu: M(1.45, 1.1, 1.55, 1.2, 1.45, 1.2, 1.0),
  highschooler: M(1.3, 1.2, 1.35, 1.15, 1.45, 1.2, 1.2),
  konoha: M(1.35, 1.15, 1.45, 1.05, 1.65, 1.2, 0.85),
  fullmetal: M(1.35, 1.2, 1.5, 1.3, 1.35, 1.25, 0.85),
  esports_king: M(1.25, 1.15, 1.45, 1.1, 1.6, 1.2, 0.8),
  hall_of_fame: M(1.6, 1.2, 1.85, 1.35, 1.6, 1.2, 1.05),
  kenshin: M(1.6, 1.2, 1.9, 1.4, 1.55, 1.4, 0.85),
  poke_master: M(1.55, 1.3, 1.55, 1.35, 1.6, 1.2, 1.25),
  kaichou: M(1.6, 1.35, 1.5, 1.5, 1.25, 1.25, 1.3),
  ano_kata: M(1.55, 1.45, 1.6, 1.3, 1.55, 1.35, 0.9),
  gekka: M(1.5, 1.35, 1.65, 1.25, 1.9, 1.3, 1.0),
  truth_gate: M(1.6, 1.4, 1.75, 1.5, 1.45, 1.5, 0.9),
  triple_face: M(1.55, 1.25, 1.75, 1.35, 1.85, 1.2, 0.9),
  game_god: M(1.55, 1.3, 1.65, 1.3, 1.75, 1.3, 0.95),
  dream_stadium: M(1.8, 1.5, 2.05, 1.65, 1.75, 1.2, 1.2),
  ryonetsu: M(1.3, 1.3, 1.3, 1.35, 1.15, 1.3, 1.3),
  facility_genius: M(1.45, 1.45, 1.25, 1.4, 1.2, 1.45, 1.5),
  hakaishin: M(1.7, 1.25, 1.95, 1.45, 1.55, 1.45, 0.85),
  smap: M(1.55, 1.5, 1.25, 1.3, 1.55, 1.45, 1.3),
  souri: M(1.55, 1.5, 1.3, 1.5, 1.2, 1.4, 1.35),
  detective_king: M(1.55, 1.75, 1.3, 1.4, 1.85, 1.9, 1.45),
  chaos_gunshi: M(1.45, 1.85, 1.5, 1.25, 1.55, 1.8, 1.45),
  career: M(1.35, 1.35, 1.15, 1.4, 1.05, 1.25, 1.3),
};
const NO_SPELL = ['sword_master', 'shacho', 'nitoryu', 'highschooler', 'konoha', 'fullmetal', 'esports_king', 'hall_of_fame', 'kenshin', 'poke_master', 'kaichou', 'ano_kata', 'gekka', 'truth_gate', 'triple_face', 'game_god', 'dream_stadium'];
const STR_WASTE = { ryonetsu: 1.25, facility_genius: 1.2, hakaishin: 1.6, smap: 1.2, souri: 1.25, detective_king: 1.25, chaos_gunshi: 1.35 };
const HEAL_WASTE = ['shacho', 'career', 'detective_king'];
const PERLV_SUM = { highschooler: 2.5, fullmetal: 2, esports_king: 2, kenshin: 3.5, gekka: 3, truth_gate: 2.5 };

test('第87回 B: 能力の 合計は 前と 同じ・0.05 きざみ・下げた 能力の 分は HP・守り・MP へ（力と 素早さは ふえない）', () => {
  for (const [id, old] of Object.entries(BEFORE)) {
    const m = JOBS[id].mods;
    assert.ok(Math.abs(sum(m) - sum(old)) < 1e-9, `${id}: 合計 ${sum(old)} → ${sum(m)}`);
    for (const k of KEYS) assert.ok(Math.abs(m[k] * 20 - Math.round(m[k] * 20)) < 1e-9, `${id} ${k} ${m[k]}`);
    assert.ok(m.str <= old.str && m.agi === old.agi, `${id}: 力と 素早さは ふやさない`);
    for (const k of ['hp', 'def', 'mp']) assert.ok(m[k] >= old[k], `${id} ${k}`);
    assert.ok(m.hp + m.def + m.mp > old.hp + old.def + old.mp, `${id}: HP・守り・MP が ふえた`);
  }
});

test('第87回 B: 呪文を 覚えない 職業の 魔力は 1.0 いか（魔剣士は 魔法剣で 魔力を 使うので のこす）', () => {
  for (const id of NO_SPELL) {
    assert.ok(!learns(id).some(magicSkill), `${id}: 呪文が ない`);
    assert.ok(JOBS[id].mods.mag <= 1.0, `${id}: 魔力 ${JOBS[id].mods.mag}`);
    assert.ok(!JOBS[id].perLv?.mag, `${id}: perLv に 魔力が ない`);
  }
  // ほかに、魔力が 1.2 いじょうで 魔力で うつ 技の ない 職業は 魔剣士だけ
  const left = ALL_JOBS.filter((id) => JOBS[id].mods.mag >= 1.2 && !learns(id).some(magicSkill));
  assert.deepEqual(left, ['magic_swordsman']);
  // perLv の 合計も かえない（魔力の 分は 守りへ）
  for (const [id, s] of Object.entries(PERLV_SUM)) assert.ok(Math.abs(Object.values(JOBS[id].perLv).reduce((a, b) => a + b, 0) - s) < 1e-9, id);
});

test('第87回 B: 力・回復が むだな 職業（1.2 を こえる 力の 半分・回復は 1.0）', () => {
  for (const [id, v] of Object.entries(STR_WASTE)) {
    assert.ok(!learns(id).some(physSkill), `${id}: 物理の 技が ない`);
    assert.equal(JOBS[id].mods.str, v, id);
  }
  for (const id of HEAL_WASTE) {
    assert.ok(!learns(id).some(healSkill), `${id}: 回復の 技が ない`);
    assert.equal(JOBS[id].mods.heal, 1.0, id);
  }
  // 大軍師は 魔力が いちばん（HP と MP を のぞく）・はかいと創造の神は もとの はかい神より 上の まま
  assert.ok(JOBS.chaos_gunshi.mods.mag > Math.max(JOBS.chaos_gunshi.mods.str, JOBS.chaos_gunshi.mods.agi, JOBS.chaos_gunshi.mods.def, JOBS.chaos_gunshi.mods.heal));
  for (const k of KEYS) assert.ok(JOBS.chaos_creator.mods[k] >= JOBS.hakaishin.mods[k], k);
});

// その 段の めやすの レベル（店の 装備）で、敵 1体に 当てた 時の ダメージ（tools/job-fit.mjs と 同じ はかり方）
function power(job, lv, rank) {
  const c = jobChar(job, lv, rank);
  const st = computeStats(c);
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, auto: true, kind: 'support', tactics: 'balanced' }], enemies: ['rockman'], canFlee: false });
  const tg = b.enemies[0]; tg.resist = {}; const me = b.allies[0];
  tg.dfn = tg.def = Math.round(st.atk * 0.4); tg.hp = tg.maxHp = 9999999;
  const out = {};
  for (const [, id] of JOBS[job].learn) {
    let e = 0;
    for (const p of parts(ABILITIES[id].effect)) {
      if (p.type === 'phys') e += b.calcPhys(me, tg, { ...p, element: undefined }, 1, 'phys', true).dmg * (p.hits || 1);
      else if ((p.type === 'magic' || p.type === 'deduce') && Array.isArray(p.base)) e += b.calcMagic(me, tg, { ...p, element: undefined }, 1, true).dmg * (p.hits || 1);
    }
    out[id] = e;
  }
  return out;
}

test('第87回 B: 名探てい・のぶドラは 能力は そのまま、魔力で うつ 技が 2つ いじょう（前より 弱く ならない・魔法の 職業を こえない）', () => {
  assert.deepEqual(JOBS.meitantei.mods, M(1.05, 1.25, 1.05, 0.95, 1.25, 1.35, 1.0));
  assert.deepEqual(JOBS.nobu_dora.mods, M(1.6, 1.6, 1.3, 1.5, 1.15, 1.5, 1.45));
  for (const id of ['meitantei', 'nobu_dora']) assert.ok(learns(id).filter(magicSkill).length >= 2, id);
  // 名探てい: キック・スケボーは 力の まま。犯人はあなたです は 光の 魔力の ダメージ ＋ 今までの 弱体
  assert.ok(physSkill('mt_kick') && physSkill('mt_skate'));
  const hn = parts(ABILITIES.mt_hannin.effect);
  assert.ok(hn.some((p) => p.type === 'magic' && p.element === 'light'));
  assert.ok(hn.some((p) => p.type === 'debuff' && p.stat === 'def') && hn.some((p) => p.type === 'atbSet'));
  assert.equal(ABILITIES.mt_hannin.mp, 8);
  // のぶドラ: ショックガンは 雷の 魔力・ひみつ道具大行進は 空気ほうが 魔力（名刀電光丸は 力）
  assert.ok(parts(ABILITIES.nd_shock.effect).some((p) => p.type === 'magic' && p.element === 'bolt'));
  assert.ok(parts(ABILITIES.nd_shock.effect).some((p) => p.type === 'atbSet'));
  const sig = parts(ABILITIES.nobu_dora_sig.effect);
  assert.ok(sig.some((p) => p.type === 'magic' && p.element === 'blast') && sig.some((p) => p.type === 'phys') && sig.some((p) => p.type === 'buff'));
  assert.equal(ABILITIES.nd_shock.mp, 18);
  assert.equal(ABILITIES.nobu_dora_sig.mp, 40);
  for (const id of ['mt_hannin', 'nd_shock', 'nobu_dora_sig']) assert.deepEqual(checkText(ABILITIES[id].desc), [], id);
  // 強さ（めやすの レベル）: 前の 力の 技より 強く、同じ 段の 魔法の 職業の いちばん 強い 技は こえない
  const mt = power('meitantei', 55, 8), nd = power('nobu_dora', 75, 10);
  assert.ok(mt.mt_hannin > mt.mt_kick, `犯人 ${mt.mt_hannin}`);
  assert.ok(nd.nd_shock >= 133 && nd.nobu_dora_sig >= 239, `ショック ${nd.nd_shock}・大行進 ${nd.nobu_dora_sig}`);
  const top = (o) => Math.max(...Object.values(o));
  assert.ok(top(mt) <= Math.min(top(power('archmage', 55, 8)), top(power('harry', 55, 8))));
  assert.ok(top(nd) <= Math.min(top(power('sennen_mage', 75, 10)), top(power('saiki', 75, 10))));
});
