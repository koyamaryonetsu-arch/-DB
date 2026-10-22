// 第40回: 宝の地図の 敵が 弱すぎた（家族の 声）
// ・洞窟の 魔物は、その レベルの ふつうの 魔物と おなじ くらいの 強さ（data/tm-curve.js の めやす × TM_CAVE_POW）
// ・地図の レベルの 上限 12 → 25（第2部の ころの 家族に 合う 地図が 出る）
// ・主も めやすで 強くして、倍率（tmBossPow）を 合わせ直した
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { refStat, curveK } from '../public/js/shared/data/tm-curve.js';
import {
  scaleEnemy, enemyLvOf, TM_LV_MAX, TM_CAVE_POW, THEME_KEYS, ensureEncounterTable, dropMapLevel, floorMapId, scaledRewardBonus, repairTreasureMaps,
} from '../public/js/shared/data/treasure.js';
import { buildTreasureFloor } from '../public/js/shared/maps/treasure-cave.js';
import { enemyFromSpecies } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';

test('めやす: レベルが 上がるほど 強く（へらない）・とても 高い レベルも 出せる', () => {
  for (const key of ['hp', 'str', 'def', 'mag', 'agi', 'exp', 'gold']) {
    for (let L = 1; L < 99; L++) assert.ok(refStat(key, L + 1) >= refStat(key, L), `${key} Lv${L}`);
    assert.ok(Number.isFinite(refStat(key, 99)) && refStat(key, 99) > refStat(key, 60));
  }
  assert.ok(curveK('hp', 10, 30) > 3);
  assert.equal(curveK('str', 20, 20), 1);
});

test('洞窟の 魔物は、その レベルの ふつうの 魔物と おなじ くらい（前は 高い レベルほど 弱かった）', () => {
  for (const lv of [4, 8, 12, 16, 20, TM_LV_MAX]) {
    const L = enemyLvOf(lv, 1);
    for (const th of THEME_KEYS) {
      const zone = ensureEncounterTable(lv, th);
      const sps = [...new Set(ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map((g) => g[0])))];
      const hp = [], atk = [];
      for (const sp of sps) {
        const m = scaleEnemy(enemyFromSpecies(sp), L, 1, { curve: true });
        assert.equal(m.lv, Math.round(L));
        hp.push(m.maxHp / refStat('hp', L));
        atk.push(m.atk / refStat('str', L));
      }
      const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
      // もとの 魔物の 得意・苦手は のこるので 1体ずつは ばらつく。洞窟ぜんたいで めやすの 6わり〜1.6倍
      assert.ok(avg(hp) > 0.6 && avg(hp) < 1.6, `地図Lv${lv} ${th} HP ${avg(hp).toFixed(2)}`);
      assert.ok(avg(atk) > 0.6 && avg(atk) < 1.6, `地図Lv${lv} ${th} 攻撃 ${avg(atk).toFixed(2)}`);
    }
  }
  // 前の 強くしかた（curve なし）より 強い
  const L = enemyLvOf(12, 1);
  const old = scaleEnemy(enemyFromSpecies('coral_golem'), L);
  const now = scaleEnemy(enemyFromSpecies('coral_golem'), L, 1, { curve: true });
  assert.ok(now.maxHp > old.maxHp * 1.2 && now.atk >= old.atk);
});

test('ほうしゅう: その レベルの ふつうの 魔物と おなじ くらいの 経験値・ゴールド', () => {
  const L = 50;
  const m = scaleEnemy(enemyFromSpecies('goblin'), L, 1, { curve: true });
  m.side = 'enemy'; m.alive = false; m.species = 'goblin';
  const { exp, gold } = scaledRewardBonus({ combatants: [m] });
  const total = exp + MONSTERS.goblin.exp;
  assert.ok(total > refStat('exp', L) * 0.5 && total < refStat('exp', L) * 2, `経験値 ${total}`);
  assert.ok(gold + MONSTERS.goblin.gold > 0);
});

test('洞窟の マップ: その レベルの めやすで 強くする しるし（enemyCurve）と 少し 手ごわい 倍率', () => {
  const tm = { seed: 12345, lv: 20, map: 'overworld', x: 40, y: 40 };
  const m = buildTreasureFloor(floorMapId(tm, 1));
  assert.ok(m && m.enemyCurve === true && m.enemyPow === TM_CAVE_POW && TM_CAVE_POW > 1);
  assert.equal(m.enemyLv, enemyLvOf(20, 1));
});

test('地図の レベル: 上限 25。強い 魔物と 戦うと 高い 地図が 出る・セーブの Lv25 の 地図も そのまま', () => {
  assert.equal(TM_LV_MAX, 25);
  assert.ok(enemyLvOf(TM_LV_MAX, 1) >= 58);
  const rng = makeRng(4);
  const lvs = Array.from({ length: 200 }, () => dropMapLevel(rng, 58));
  assert.ok(Math.max(...lvs) <= TM_LV_MAX && lvs.filter((x) => x >= 20).length > 150);
  const c = { treasureMaps: [{ seed: 9, lv: 25, map: 'overworld', x: 3, y: 4 }, { seed: 10, lv: 40, map: 'overworld', x: 3, y: 4 }] };
  repairTreasureMaps(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.lv), [25, 25]);
  assert.ok(buildTreasureFloor(floorMapId({ seed: 9, lv: 25, map: 'overworld', x: 3, y: 4 }, 2)), 'Lv25 の 洞窟が 作れる');
});

test('ほかの 場所（ひみつのダンジョン・大迷宮・たのまれごと）は 前の 強くしかたの まま', () => {
  const base = scaleEnemy(enemyFromSpecies('goblin'), 40);
  const again = scaleEnemy(enemyFromSpecies('goblin'), 40, 1, { curve: false });
  assert.equal(base.maxHp, again.maxHp);
  assert.equal(base.rewardExpK, undefined);
});
