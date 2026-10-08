// 第23回: 強さの もとは キャラの レベル。職業レベルは 少しの 補正
import test from 'node:test';
import assert from 'node:assert/strict';
import { newCharacter, computeStats, expForLevel, JOB_BOOST, LEVEL_AFFINITY_MAX, PER_LV_CAP, baseStats } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';

function make(job, level, jl, extraJobs = []) {
  const c = newCharacter({ id: 'g', name: 'ミナ', job });
  c.exp = expForLevel(level);
  c.level = level;
  c.jobs[job] = { lv: jl, b: 999 };
  for (const j of extraJobs) c.jobs[j] = { lv: 10, b: 999 };
  return computeStats(c);
}

test('職業レベル 1→10 で のびる 得意な つよさは ひかえめ（前は 4わり いじょう）', () => {
  assert.equal(JOB_BOOST, 0.02);
  const a = make('warrior', 25, 1).str, b = make('warrior', 25, 10).str;
  assert.ok(b / a < 1.2, `戦士の 力 J1 ${a} → J10 ${b}`);
  const m1 = make('mage', 25, 1).mag, m10 = make('mage', 25, 10).mag;
  assert.ok(m10 / m1 < 1.45, `魔法使いの 魔力 J1 ${m1} → J10 ${m10}`);
});

test('キャラの レベルが 上がると 得意な つよさも のびる（Lv21 で 上げ止まり）', () => {
  const r = (lv) => make('warrior', lv, 1).str / (baseStats(lv).str * JOBS.warrior.mods.str);
  assert.ok(Math.abs(r(1) - 1) < 0.02);
  assert.ok(Math.abs(r(21) - (1 + LEVEL_AFFINITY_MAX)) < 0.02, `Lv21 ${r(21)}`);
  assert.ok(Math.abs(r(40) - (1 + LEVEL_AFFINITY_MAX)) < 0.02, `Lv40 ${r(40)}`);
  assert.ok(make('warrior', 30, 1).str > make('warrior', 20, 10).str, 'Lv30・J1 の ほうが Lv20・J10 より 力が 強い');
});

test('ずっと残る ボーナスは、たくさんの 職業を きわめても レベルの つよさの 6わりまで', () => {
  const magJobs = Object.keys(JOBS).filter((j) => JOBS[j].perLv?.mag);
  assert.ok(magJobs.length >= 3);
  const lv = 20;
  const s = make('warrior', lv, 1, magJobs);
  const plain = make('warrior', lv, 1);
  assert.ok(s.mag - plain.mag <= baseStats(lv).mag * PER_LV_CAP + 1, `魔力の ボーナス ${s.mag - plain.mag}`);
});
