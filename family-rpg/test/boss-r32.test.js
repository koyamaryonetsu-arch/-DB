// 2026年10月（第32回 A）: 第5章から先と やりこみの ボスを 強く（docs/plan-r31.md の 5）
//  ・めやす: 店の 装備だけ だと 勝率 3〜5割、レア装備を そろえて 仲間を 育てる（レベル＋3〜5）と 8〜9割（tools/sim-boss.mjs）
//  ・星の番人アルゴス（HP・攻撃・HP25%から 流星群）・古竜オルドラ（HP・攻撃）・宝の洞窟の 主（地図 Lv8 から tmBossPow）・
//    ひみつのダンジョンの 番人（40階から。強さの 数式は data/secret-guard.js の sdGuardStrength）
//  ・第1〜4章の ボスは 変えない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { scaleEnemy, tmBossPow, TM_POW_FROM, TM_LV_MAX, bossLvOf } from '../public/js/shared/data/treasure.js';
import { sdGuardian, sdGuardEncounter, SD_GUARDS } from '../public/js/shared/data/secret.js';
import { sdGuardStrength, SD_GUARD_POW, SD_GUARD_FROM } from '../public/js/shared/data/secret-guard.js';
import { enemyFromSpecies } from '../public/js/shared/battle.js';
import { argosRun, dragonRun, tmRun, sdRun } from '../tools/sim-boss.mjs';
import { checkText } from '../tools/kanji-check.mjs';

const wins = (f, n = 10) => [...Array(n).keys()].filter((i) => f(777 + i * 7919).outcome === 'win').length;

test('アルゴス: HP・攻撃力を 上げ、HP25%から 流星群（敵全体・光）。古竜オルドラも HP・攻撃力を 上げた', () => {
  const a = MONSTERS.argos;
  assert.ok(a.hp >= 11000 && a.str >= 196, `アルゴス HP${a.hp} 力${a.str}`);
  const last = a.phases[a.phases.length - 1];
  assert.equal(last.hpBelow, 0.25);
  assert.ok(last.addActions.some((x) => x.id === 'm_argos_meteor'));
  const m = ABILITIES.m_argos_meteor;
  assert.equal(m.target, 'enemies');
  assert.equal(m.effect.element, 'light');
  assert.equal(m.anim, 'star_light', '今ある エフェクト');
  for (const s of [m.name, m.desc, m.cast]) assert.deepEqual(checkText(s), [], s);
  const d = MONSTERS.old_dragon;
  assert.ok(d.hp >= 10000 && d.str >= 174, `古竜 HP${d.hp} 力${d.str}`);
});

test('第1〜4章の ボスは 変えない（第31回までの 数）', () => {
  const was = { goldoon: 1299, giant_squid: 2712, storm_general: 3520, flame_witch_true: 5800, armor_scorpion: 5600, mummy_king: 6500, zaid_demon: 5400, sand_whale: 7800, morgana: 4000, morgana_true: 7400 };
  for (const [id, hp] of Object.entries(was)) assert.equal(MONSTERS[id].hp, hp, id);
});

test('宝の洞窟の 主: 地図 Lv7 までは 今まで どおり。Lv8 から 上がり、Lv10〜12 は 主ごとに ならした 強さ', () => {
  for (const sp of Object.keys(MONSTERS_TM)) {
    for (let L = 1; L < TM_POW_FROM; L++) assert.equal(tmBossPow(L, sp), 1, `${sp} Lv${L}`);
    assert.ok(tmBossPow(8, sp) > 1 && tmBossPow(9, sp) > tmBossPow(8, sp) && tmBossPow(10, sp) > tmBossPow(9, sp), sp);
    assert.equal(tmBossPow(TM_LV_MAX, sp), tmBossPow(10, sp));
    assert.ok(tmBossPow(12, sp) >= 1.8 && tmBossPow(12, sp) <= 2.3, `${sp}: ${tmBossPow(12, sp)}`);
    assert.ok(MONSTERS_TM[sp].tmPow > 0);
  }
  // ゴーレム（手下を よぶ）は ひかえめ・パンサー（軽い）は 多め
  assert.ok(tmBossPow(12, 'tm_golem') < tmBossPow(12, 'tm_panther'));
  // scaleEnemy の pow: HP・攻撃・魔力は pow 倍、守りは その 平方根。ほうしゅうも 少し ふえる
  const base = scaleEnemy(enemyFromSpecies('tm_king'), 37.5);
  const up = scaleEnemy(enemyFromSpecies('tm_king'), 37.5, 2);
  assert.ok(Math.abs(up.maxHp / base.maxHp - 2) < 0.01 && Math.abs(up.atk / base.atk - 2) < 0.02);
  assert.ok(Math.abs(up.dfn / base.dfn - Math.SQRT2) < 0.03);
  assert.ok(up.rewardK > base.rewardK);
  // 1より 小さい 倍率は 弱く する（ほうしゅうは へらさない）
  const down = scaleEnemy(enemyFromSpecies('sand_whale'), 50, 0.9);
  const plain = scaleEnemy(enemyFromSpecies('sand_whale'), 50);
  assert.ok(down.maxHp < plain.maxHp && down.rewardK === plain.rewardK);
  assert.ok(bossLvOf(1, 12) > 30);
});

test('宝の洞窟の 主の 戦い（world/treasure.js）は 地図の レベルの 倍率で 強く なる', async () => {
  const src = await import('node:fs').then((fs) => fs.readFileSync(new URL('../public/js/shared/world/treasure.js', import.meta.url), 'utf8'));
  assert.ok(src.includes('enemyPow: tmBossPow(p.lv, cave.boss)'));
});

test('ひみつのダンジョンの 番人: 30階までは 今まで どおり、40階から 番人ごとの 倍率（強さの 数式は sdGuardStrength）', () => {
  for (const f of [10, 20, 30]) {
    const g = sdGuardStrength(f, sdGuardian(f));
    assert.deepEqual(g, { lv: f + 5, pow: 1 }, `${f}階`);
    const e = FIXED_ENCOUNTERS[sdGuardEncounter(f)];
    assert.equal(e.enemyLv, f + 5);
    assert.equal(e.enemyPow, 1);
  }
  assert.equal(SD_GUARD_FROM, 40);
  for (const sp of SD_GUARDS) assert.ok(SD_GUARD_POW[sp] > 0, `${sp}: 倍率`);
  for (const f of [40, 50, 90, 200]) {
    const sp = sdGuardian(f);
    const g = sdGuardStrength(f, sp);
    assert.equal(g.lv, f + 5);
    assert.equal(g.pow, SD_GUARD_POW[sp], `${f}階 ${sp}`);
    const e = FIXED_ENCOUNTERS[sdGuardEncounter(f)];
    assert.equal(e.enemyLv, g.lv);
    assert.equal(e.enemyPow, g.pow);
  }
  // 物語の ボス（もとが 強い）は ひかえめ、宝の洞窟の 主は 多め
  assert.ok(SD_GUARD_POW.flame_knight < SD_GUARD_POW.tm_knight);
  // 表に ない 番人（B が ふやす ばあい）も 強く なる
  assert.ok(sdGuardStrength(60, 'goldoon').pow > 1);
  assert.equal(sdGuardStrength(60, 'no_such').pow, 1);
});

test('シミュレーション（少しだけ）: レア装備で 育てた ほうが、店の 装備より はっきり 勝ちやすい', { timeout: 300000 }, () => {
  const a0 = wins((s) => argosRun(41, 'shop42', true, s));
  const a1 = wins((s) => argosRun(46, 'rare42', true, s));
  assert.ok(a1 > a0 && a1 >= 6, `アルゴス 店 ${a0}/10 → レア ${a1}/10`);
  const d0 = wins((s) => dragonRun(45, 'shop42', true, s));
  const d1 = wins((s) => dragonRun(49, 'rare42', true, s));
  assert.ok(d1 > d0 && d1 >= 6, `古竜 店 ${d0}/10 → レア ${d1}/10`);
  const t0 = wins((s) => tmRun(12, 'tm_dragon', 42, 'shop42', s));
  const t1 = wins((s) => tmRun(12, 'tm_dragon', 48, 'rare42', s));
  assert.ok(t1 > t0, `地図Lv12の 竜 店 ${t0}/10 → レア ${t1}/10`);
  const g0 = wins((s) => sdRun(50, 'tm_knight', 52, 'shop42', s));
  const g1 = wins((s) => sdRun(50, 'tm_knight', 57, 'rare42', s));
  assert.ok(g1 >= g0 && g1 >= 6, `50階の 番人 店 ${g0}/10 → レア ${g1}/10`);
});
