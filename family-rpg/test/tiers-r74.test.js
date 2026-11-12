// 第74回 C: やりこみの 上の 段を 第8章 第2幕クリア（c8_hades・Lv86 くらい）に 合わせる（docs/plan-ch8.md の 6-3 C班）
// ・モンスター闘技場 … 伝説の部の つづき ランクEX2（c8_hades・おすすめ Lv88）
// ・宝の地図 … 上限 40 → 45。Lv41 から 第8章（と 第7章 第3幕など）の 魔物・主の 倍率・だん14 の ★5・めやすを Lv83 で 止める
// ・サファラ闘技場 … 伝説の部 ランク12（c8_hades・おすすめ Lv88。深海の大王者リヴァイアス … あわの よろい）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { MONSTERS_C8A, C8A_MINIONS } from '../public/js/shared/data/monsters-c8a.js';
import { MONSTERS_C7I, C7I_MINIONS } from '../public/js/shared/data/monsters-c7i.js';
import { C7_MINIONS } from '../public/js/shared/data/monsters-c7.js';
import { C7S_MINIONS } from '../public/js/shared/data/monsters-c7s.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import {
  TM_LV_MAX, TM_C7_FROM, TM_C8_FROM, TM_DEEP_POW, TM_THEMES, THEME_KEYS, TM_BOSS_POW, tmPoolOf, tmBossPow, enemyLvOf, bossLvOf, caveInfo,
  ensureEncounterTable, encounterZone, parseFloorId, floorMapId, repairTreasureMaps, chestLoot, dropMapLevel, nextMapLevel,
} from '../public/js/shared/data/treasure.js';
import { CURVE_LV_MAX } from '../public/js/shared/data/tm-curve.js';
import { tmGearStep, tmGearRank, pickTmGear, rareIds, starsOf, rareWhereText, TM_THEME_GROUPS, TM_GEAR_C7, TM_GEAR_C8 } from '../public/js/shared/data/rare-loot.js';
import { TM_DEEP_K } from '../public/js/shared/data/items-rare.js';
import { buildTreasureFloor } from '../public/js/shared/maps/treasure-cave.js';
import { ARENA_RANKS, rankInfo, rankOpen, visibleRanks, noteClear, rankLabel } from '../public/js/shared/data/arena.js';
import { champOf, clearRewards } from '../public/js/shared/world/arena.js';
import { ARENA_BIG, arenaDamage, arenaCond, arenaEffect, bubbleConf } from '../public/js/shared/battle-arena.js';
import { MONARENA_RANKS, MONARENA_RANK_IDS, monRankInfo, monRankOpen, monRankLabel, monChampOf, noteMonClear } from '../public/js/shared/data/monarena.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, itemCount } from '../public/js/shared/stats.js';
import { checkText } from '../tools/kanji-check.mjs';
import { makeRng } from '../public/js/shared/rng.js';

const EQ = ['weapon', 'armor', 'shield', 'head', 'acc'];
const speciesOf = (zone) => [...new Set(ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map(([sp]) => sp)))];
const noBad = (s) => assert.deepEqual(checkText(s), [], s);
const sum = (id) => Object.values(ITEMS[id].bonus || {}).reduce((a, v) => a + v, 0);

// ───────────── 宝の地図 ─────────────
test('宝の地図: 上限 Lv45（洞窟の 魔物は Lv99 から・主は Lv103.5 まで）。ID・セーブ・洞窟が Lv45 まで つかえる', () => {
  assert.equal(TM_LV_MAX, 50); // 第80回 C: 45 → 50（test/tiers-r80.test.js）
  assert.equal(TM_C8_FROM, 41);
  assert.equal(enemyLvOf(45, 1), 99);
  const deepest = (L) => [...Array(4000).keys()].find((x) => caveInfo(x, L).floors === 6);
  assert.equal(bossLvOf(deepest(45), 45), 103.5);
  const tm = { seed: 7474, lv: 45, map: 'sea', x: 40, y: 40 };
  assert.equal(parseFloorId(floorMapId(tm, 4)).lv, 45);
  assert.equal(parseFloorId(floorMapId({ ...tm, lv: 51 }, 1)), null, 'Lv51 は ない（第80回 C: 上限 50）');
  const m = buildTreasureFloor(floorMapId(tm, 1));
  assert.ok(m && m.enemyCurve && m.enemyLv === enemyLvOf(45, 1));
  assert.equal(m.enemyPow, TM_DEEP_POW, 'Lv41〜 も deep と おなじ 0.95');
  const c = { treasureMaps: [{ seed: 9, lv: 43, map: 'overworld', x: 3, y: 4 }, { seed: 10, lv: 80, map: 'sea', x: 3, y: 4 }] };
  repairTreasureMaps(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.lv), [43, TM_LV_MAX]);
  // 第8章 第2幕の ころ（物語の 魔物 Lv83〜87）で Lv37〜40 の 地図・主の あとの 地図で Lv45 まで（もとの 式の まま）
  const rng = makeRng(74);
  const late = Array.from({ length: 300 }, () => dropMapLevel(rng, 86));
  assert.ok(Math.min(...late) >= 38 && Math.max(...late) <= 40, `Lv86: ${Math.min(...late)}〜${Math.max(...late)}`);
  const next = Array.from({ length: 200 }, () => nextMapLevel(rng, 44));
  assert.ok(next.includes(45) && Math.max(...next) === 46); // 第80回 C: 上限 50（第8章クリアの 前は 45 で 止まる。tmLvCap・test/tiers-r80.test.js）
});

test('洞窟の 魔物: Lv41〜45 は 第8章 第1幕・第7章 第3幕などの ふつうの 魔物（c8）。第8章 第1幕の 5しゅは ぜんぶ 出る', () => {
  const okSet = new Set([...C8A_MINIONS, ...C7I_MINIONS, ...C7_MINIONS, ...C7S_MINIONS]);
  const c8a = new Set();
  for (const th of THEME_KEYS) {
    const list = TM_THEMES[th].c8;
    assert.ok(list.length >= 4 && new Set(list).size === list.length, th);
    for (const sp of list) {
      const m = MONSTERS[sp];
      assert.ok(okSet.has(sp), `${th}: ${sp} は 第7章・第8章の 手下の 魔物`);
      assert.ok(m && !m.boss && !m.breedOnly && !m.rare, `${th}: ${sp}`);
      for (const a of m.actions || []) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      if (MONSTERS_C8A[sp]) c8a.add(sp);
    }
  }
  assert.equal(c8a.size, C8A_MINIONS.length, '第8章 第1幕の 魔物 5しゅ ぜんぶ');
  assert.ok(TM_THEMES.ice.c8.some((sp) => MONSTERS_C7I[sp]), '氷の 洞窟は 第7章 第3幕の 氷の 魔物（第8章 第2幕の 魔物は あとで 足す）');
  for (let lv = TM_C8_FROM; lv <= 45; lv++) { // 第80回 C: Lv46 からは end8（test/tiers-r80.test.js）
    for (const th of THEME_KEYS) {
      assert.deepEqual(tmPoolOf(lv, th), TM_THEMES[th].c8);
      const sps = speciesOf(ensureEncounterTable(lv, th));
      assert.ok(sps.length >= 4, `地図Lv${lv} ${th}`);
      for (const sp of sps) assert.ok(TM_THEMES[th].c8.includes(sp), `地図Lv${lv} ${th}: ${sp}`);
    }
  }
  // Lv40 までは 第68回の まま（第7章の 魔物）
  for (const th of THEME_KEYS) assert.deepEqual(tmPoolOf(40, th), TM_THEMES[th].c7);
  assert.equal(TM_C7_FROM, 36);
});

test('第8章 第2幕の 魔物を 足す 口: c8 に ID を 書くだけ（まだ ない ID は 出ない・もとの レベルの 高い 6しゅ）', () => {
  const keep = TM_THEMES.ice.c8.slice();
  const zone = encounterZone(44, 'ice');
  const old = ENCOUNTER_TABLES[zone];
  try {
    delete ENCOUNTER_TABLES[zone];
    TM_THEMES.ice.c8.push('c8b_not_yet', 'palace_guard', 'cobrar');
    const sps = speciesOf(ensureEncounterTable(44, 'ice'));
    assert.ok(!sps.includes('c8b_not_yet'));
    assert.ok(sps.length === 6 && sps.includes('palace_guard') && sps.includes('cobrar'), sps.join(','));
  } finally {
    TM_THEMES.ice.c8.splice(0, TM_THEMES.ice.c8.length, ...keep);
    if (old) ENCOUNTER_TABLES[zone] = old;
    else delete ENCOUNTER_TABLES[zone];
  }
});

test('洞窟の 主: Lv33〜45 の 倍率（シミュレーターで 合わせ直した 数。だんだん 小さく）・めやすは Lv83 まで', () => {
  // node tools/sim-boss.mjs 30 tm 33,…,45 … 主の レベル＋3 の 4人・その ころの 店・完全オートで 81〜92%
  assert.deepEqual(TM_BOSS_POW.filter(([L]) => L >= 33 && L <= 45), [[33, 0.70], [35, 0.70], [38, 0.70], [40, 0.68], [42, 0.67], [45, 0.65]]); // 第80回 C: Lv46〜 は test/tiers-r80.test.js
  assert.equal(TM_BOSS_POW[TM_BOSS_POW.length - 1][0], TM_LV_MAX);
  for (const sp of Object.keys(MONSTERS_TM)) {
    for (let L = 30; L < TM_LV_MAX; L++) assert.ok(tmBossPow(L + 1, sp) <= tmBossPow(L, sp), `${sp} Lv${L}`);
    assert.ok(tmBossPow(45, sp) >= 0.5 && tmBossPow(45, sp) <= 0.75, `${sp}: ${tmBossPow(45, sp)}`);
    assert.equal(tmBossPow(TM_LV_MAX + 5, sp), tmBossPow(TM_LV_MAX, sp));
  }
  // めやす（tm-curve.js）は Lv83 まで の 魔物で 作る（第8章 第1幕の 魔物まで。これより 上の 新しい 魔物で ずれない）
  assert.equal(CURVE_LV_MAX, 83);
  assert.ok(Math.max(...C8A_MINIONS.map((sp) => MONSTERS[sp].lv)) <= CURVE_LV_MAX);
});

test('宝箱の 装備: Lv41〜45 は だん14 の ★5（土・氷・炎 2つずつ）。月の王宮の 宝箱と おなじ くらい・出やすさは Lv25 の まま', () => {
  assert.deepEqual([TM_GEAR_C7, TM_GEAR_C8], [36, 41]);
  assert.deepEqual([36, 40, 41, 43, 45].map(tmGearStep), [13, 13, 14, 14, 14]);
  for (let lv = 41; lv <= 45; lv++) assert.equal(tmGearRank(lv), 10);
  const s14 = rareIds('tm').filter((id) => ITEMS[id].tmStep === 14);
  assert.equal(s14.length, 6);
  for (const th of THEME_KEYS) assert.equal(s14.filter((id) => TM_THEME_GROUPS[th].includes(ITEMS[id].grp)).length, 2, th);
  for (const id of s14) {
    const it = ITEMS[id];
    assert.ok(id.startsWith('tmd_'), id);
    assert.ok(EQ.includes(it.type) && it.rank === 10 && it.rarity === 4, id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), '宝の洞窟でしか手に入らない');
    assert.ok(it.desc && it.price === 0 && it.sell > 0 && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
    noBad(it.name);
    noBad(it.desc);
  }
  // 強さ: だん13 より 上・月の王宮の 地下迷宮の いちばん 強い 宝箱（1.12×1.86）より 下
  assert.ok(TM_DEEP_K[14] > TM_DEEP_K[13] && TM_DEEP_K[14] < 1.12 * 1.86);
  assert.ok(ITEMS.tmd_flame_king_sword.atk < ITEMS.c8at_palace_sword.atk);
  assert.ok(sum('tmd_phoenix_necklace') > sum('tmd_sun_shard_ring') && sum('tmd_phoenix_necklace') < sum('c8j_ruby_charm'), 'ボスの お守りより 弱い');
  // 宝箱の えらびかた: だん13〜14・その 洞窟の なかま
  for (let lv = 41; lv <= 45; lv++) {
    for (let i = 0; i < 90; i++) {
      const theme = THEME_KEYS[i % 3];
      const word = TM_THEMES[theme].words[i % TM_THEMES[theme].words.length];
      const id = pickTmGear(makeRng(i * 19 + lv), lv, { theme, word }, i % 2 ? 'bossA' : 'normal');
      const it = ITEMS[id];
      assert.ok(it && it.src === 'tm' && [13, 14].includes(it.tmStep), `Lv${lv}: ${id}`);
      assert.ok(TM_THEME_GROUPS[theme].includes(it.grp), `Lv${lv} ${theme}: ${id}`);
    }
  }
  // 第64回 ⑥d: 装備の 出やすさは Lv25 と おなじ（ふつうの 宝箱 2わり 弱・主の 宝箱 半分）
  const eqRate = (lv, kind) => {
    let n = 0;
    for (let i = 0; i < 3000; i++) if (EQ.includes(ITEMS[chestLoot(makeRng(i * 37 + 3), lv, kind, { theme: THEME_KEYS[i % 3], word: '岩' }).item]?.type)) n++;
    return n / 3000;
  };
  assert.ok(Math.abs(eqRate(45, 'normal') - eqRate(25, 'normal')) < 0.02 && eqRate(45, 'normal') < 0.21);
  assert.ok(eqRate(45, 'bossA') < 0.56);
});

// ───────────── サファラ闘技場 ランク12 ─────────────
test('闘技場 ランク12: 第8章 第2幕クリアで 開く・おすすめ Lv88・3連戦（1・2戦目は 第8章 第1幕の 魔物・3戦目は 深海の大王者）', () => {
  const R = rankInfo(12);
  assert.ok(ARENA_RANKS.length >= 12); // 第80回 C: ランク13
  assert.deepEqual([R.lv, R.needFlag, R.legend, R.champ], [88, 'c8_hades', true, '深海の大王者リヴァイアス']);
  assert.equal(rankLabel(12), '伝説の部・ランク12');
  for (const s of [R.champ, R.hint, R.lockText]) noBad(s);
  R.battles.forEach((enc, i) => {
    const e = FIXED_ENCOUNTERS[enc];
    assert.ok(e && e.arena && e.bg === 'arena' && e.canFlee === false && e.loseOk === true, enc);
    for (const [sp] of e.group) {
      const m = MONSTERS[sp];
      assert.ok(m, `${enc}: ${sp}`);
      for (const a of m.actions) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      if (i < 2) assert.ok(MONSTERS_C8A[sp], `${enc}: ${sp} は 第8章 第1幕の 魔物`);
    }
    if (i < 2) assert.ok(Math.abs(e.enemyLv - R.lv) <= 2, `${enc}: Lv${e.enemyLv}`);
    else assert.ok(e.boss && !e.enemyLv, enc);
  });
  assert.equal(champOf('ar12_3'), 'ar_leviathan');
  for (const sp of ['ar_leviathan', 'ar_bubble_crab', 'ar_glow_jelly']) {
    const m = MONSTERS[sp];
    assert.ok(m.boss && m.noBefriend && !Object.keys(MONSTERS).includes(sp), `${sp}: 図鑑に 出ない 王者`);
    assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえの え`);
    assert.equal(m.resist.water, 0.5, `${sp}: 水の 魔物`);
    assert.ok(m.resist.bolt >= 1.2, `${sp}: 雷が よく 効く`);
    for (const s of [m.name, m.desc, ...(m.phases || []).flatMap((p) => p.msg || [])]) noBad(s);
  }
  assert.ok(bubbleConf(MONSTERS.ar_leviathan) === null, 'しかけは 戦いの 中の 王者（species）で 見る');
  assert.ok(MONSTERS.ar_leviathan.arena.bubble && !MONSTERS.ar_bubble_crab.arena && !MONSTERS.ar_glow_jelly.arena);
  for (const id of Object.keys(ABILITIES).filter((k) => /^m_ar12_/.test(k))) {
    const a = ABILITIES[id];
    for (const s of [a.name, a.cast, a.desc]) noBad(s);
  }
  assert.ok(ARENA_BIG.has('m_ar12_maelstrom'));
  assert.equal(ABILITIES.m_ar12_inhale.effect.next, 'm_ar12_maelstrom');
});

test('闘技場 ランク12 の ごほうび: ★5 の アクセ 1つ・限界の石の 入った 素材・メダル。2回目から ゴールド・メダル・限界の石', () => {
  const R = rankInfo(12), R11 = rankInfo(11);
  assert.deepEqual(R.first.items, ['ar_deep_sea_pearl']);
  const it = ITEMS.ar_deep_sea_pearl;
  assert.equal(it.type, 'acc');
  assert.equal(starsOf('ar_deep_sea_pearl'), 5);
  assert.equal(rareWhereText('ar_deep_sea_pearl'), '闘技場のごほうびでしか手に入らない');
  assert.ok(it.price === 0 && it.sell > 0 && ITEM_KANA.ar_deep_sea_pearl);
  assert.ok(!(it.resist?.water < 1), '水に 強い 装備は 作らない');
  noBad(it.name);
  noBad(it.desc);
  // ランク11 の 北極星より 強く、第8章 第1幕の ボスの お守り（いちばん 強い ボスの お守り）より 弱い
  assert.ok(sum('ar_silver_north_star') < sum('ar_deep_sea_pearl'));
  assert.ok(sum('ar_deep_sea_pearl') < sum('c8p_feather_charm') && sum('ar_deep_sea_pearl') < sum('c8j_ruby_charm'));
  assert.ok(R.first.mats.some(([m]) => m === 'limit_stone') && R.first.mats.every(([m, n]) => ITEMS[m] && n > 0));
  assert.ok(R.first.medals > R11.first.medals && R.repeatGold > R11.repeatGold);
  assert.deepEqual(R.repeatMats, [['limit_stone', 1]]);
  const c = newCharacter({ id: 't', name: 'ソラ', job: 'warrior', look: {} });
  c.gold = 0;
  const run = { world: { now: () => 1000, sendSelf() {}, markDirty() {} }, everyone: [{ char: c }] };
  clearRewards(run, 12);
  assert.equal(itemCount(c, 'ar_deep_sea_pearl'), 1);
  for (const [m, n] of R.first.mats) assert.equal(itemCount(c, m), n, m);
  const stones = itemCount(c, 'limit_stone');
  clearRewards(run, 12);
  assert.equal(itemCount(c, 'ar_deep_sea_pearl'), 1, 'はじめての 品は 1回だけ');
  assert.equal(c.gold, R.repeatGold);
  assert.equal(itemCount(c, 'limit_stone'), stones + 1);
});

test('闘技場 ランク12 は 第8章 第2幕クリアと ランク11 で 開く（それまでは 名前も 出さない）', () => {
  const flags = new Set(['c4_clear', 'c5_gaia', 'c5_nshadow', 'c5_nocto1', 'c6_clear', 'c7_karim', 'c7_clear', 'c8_jafar']);
  const flag = (f) => flags.has(f);
  const c = { flags: {} };
  for (let n = 1; n <= 10; n++) noteClear(c, n, 1000 + n);
  assert.ok(!visibleRanks(flag).includes(12));
  assert.equal(rankOpen(12, flag, c).why, 'story');
  flags.add('c8_hades');
  assert.ok(visibleRanks(flag).includes(12));
  assert.equal(rankOpen(12, flag, c).why, 'prev');
  noteClear(c, 11, 2000);
  assert.ok(rankOpen(12, flag, c).ok);
});

test('深海の大王者の しかけ: あわが ある 間は 1回 当たるごとに 1つ はじけて ダメージ 0・ぜんぶ はじけると 大チャンス・また まとう・大うずしおは あわが 多いほど 強い', () => {
  const me = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(me, expForLevel(86));
  fullHeal(me);
  const b = new Battle({ rng: makeRng(5), allies: [{ char: me, controller: 's1' }], enemies: ['ar_bubble_crab', 'ar_leviathan', 'ar_glow_jelly'], canFlee: false, boss: true });
  const p = b.allies[0];
  const king = b.enemies.find((e) => e.species === 'ar_leviathan');
  const crab = b.enemies.find((e) => e.species === 'ar_bubble_crab');
  const conf = MONSTERS.ar_leviathan.arena.bubble;
  const ev = (ability) => ({ lines: [], upd: [], results: [], ability });
  // はじめは あわを max こ まとっている
  assert.equal(king.arBubble, conf.max);
  assert.equal(arenaCond(b, king, 'arBubbled'), true);
  assert.equal(crab.arBubble, undefined, 'しかけは 王者だけ');
  // どんな 攻撃も 1回で 1つ はじけて ダメージ なし（強い 攻撃でも 弱い 攻撃でも・どの 属性でも）
  const e1 = ev();
  assert.equal(arenaDamage(b, p, king, 99999, { element: 'bolt' }, e1), null);
  assert.equal(king.arBubble, conf.max - 1);
  assert.ok(e1.lines.some((l) => l.includes('あわが1つはじけて')), e1.lines.join(' / '));
  assert.ok(e1.results.some((r) => r.id === king.id && r.dmg === 0 && r.pop));
  // battle.js の damage から: HPは へらない
  const hp = king.hp;
  b.damage(p, king, 5000, ev(), { element: 'phys', phys: true });
  assert.equal(king.hp, hp);
  assert.equal(king.arBubble, conf.max - 2);
  // おともは ふつう
  assert.equal(arenaDamage(b, p, crab, 1000, { element: 'phys' }, ev()), 1000);
  // 大うずしお: あわが 多いほど 強い（bigBase ＋ bigPer × あわ）
  const big = ev('m_ar12_maelstrom');
  assert.equal(arenaDamage(b, king, p, 1000, { element: 'water' }, big), Math.round(1000 * (conf.bigBase + conf.bigPer * king.arBubble)));
  assert.ok(big.lines.some((l) => l.includes('うずがとても大きい')));
  assert.equal(arenaDamage(b, king, p, 1000, { element: 'water' }, ev('m_ar12_fang')), 1000, 'ふつうの 技は そのまま');
  // ぜんぶ はじけると 大チャンス（openMult ばい）
  while (king.arBubble > 1) arenaDamage(b, p, king, 10, { element: 'fire' }, ev());
  const e2 = ev();
  assert.equal(arenaDamage(b, p, king, 10, { element: 'fire' }, e2), null);
  assert.equal(king.arBubble, 0);
  assert.equal(arenaCond(b, king, 'arBubbled'), false);
  assert.ok(e2.postLines.some((l) => l.includes('今が大チャンス')), e2.postLines.join(' / '));
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, ev()), Math.round(1000 * conf.openMult));
  const small = ev('m_ar12_maelstrom');
  assert.equal(arenaDamage(b, king, p, 1000, { element: 'water' }, small), Math.round(1000 * conf.bigBase), 'あわが ない 時の 大うずしおは 小さい');
  assert.ok(small.lines.some((l) => l.includes('うずが小さい')));
  // また まとう: はじけて から wait 回 動いた あと
  assert.equal(arenaCond(b, king, 'arBubbleWait'), false, 'すぐには まとわない');
  king.used = { ...(king.used || {}), attack: (king.used?.attack || 0) + conf.wait };
  assert.equal(arenaCond(b, king, 'arBubbleWait'), true);
  const e3 = ev();
  assert.ok(arenaEffect(b, king, ABILITIES.m_ar12_rebubble, ABILITIES.m_ar12_rebubble.effect, e3));
  assert.equal(king.arBubble, conf.max);
  assert.ok(e3.lines.some((l) => l.includes('あわに、つつまれた')), e3.lines.join(' / '));
  assert.equal(arenaCond(b, king, 'arBubbleWait'), false);
  // もう ぜんぶ ある ときは 何も おこらない
  const e4 = ev();
  arenaEffect(b, king, ABILITIES.m_ar12_rebubble, ABILITIES.m_ar12_rebubble.effect, e4);
  assert.ok(e4.lines.some((l) => l.includes('何もおこらなかった')));
});

// ───────────── モンスター闘技場 ランクEX2 ─────────────
test('モンスター闘技場 ランクEX2: EX の つぎ・第8章 第2幕クリアで 開く・おすすめ Lv88・王者は 色ちがい・くりかえして 装備は もらえない', () => {
  assert.deepEqual(MONARENA_RANK_IDS.slice(-3, -1), ['EX', 'EX2']); // 第80回 C: EX3（test/tiers-r80.test.js）
  const R = monRankInfo('EX2'), EX = monRankInfo('EX');
  assert.deepEqual([R.lv, R.need, R.legend], [88, 'c8_hades', true]);
  assert.equal(monRankLabel('EX2'), '伝説の部・ランクEX2');
  assert.ok(R.lv > EX.lv && R.foeLv > EX.foeLv);
  for (const s of [R.title, R.hint, R.lock]) noBad(s);
  assert.equal(R.fights.length, 3);
  for (const f of R.fights.slice(0, 2)) for (const sp of f) assert.ok(MONSTERS_C8A[sp] || MONSTERS_C7I[sp], `EX2: ${sp} は 第8章 第1幕・第7章 第3幕の 魔物`);
  const champ = MONSTERS[monChampOf(R)];
  assert.ok(champ?.variant && champ.noBefriend, '王者は 色ちがい');
  assert.ok(MONSTERS_C8A[champ.variant.base]);
  noBad(champ.name);
  // ごほうび: SS・SSS・EX と おなじ 形（色の石・限界の石・種）。装備は 入れない
  for (const [id, n] of R.first.items) assert.ok(ITEMS[id] && n > 0 && !EQ.includes(ITEMS[id].type), id);
  assert.ok(R.first.items.some(([id]) => id === 'limit_stone') && R.first.items.some(([id]) => id === 'color_stone'));
  assert.ok(R.first.medals >= EX.first.medals && R.repeatGold > EX.repeatGold && R.repeatMedal);
  assert.equal(MONARENA_RANKS[MONARENA_RANKS.length - 2], R);
  // 開く: c8_hades と EX
  const flags = new Set(['monster_bond', 'c1_clear', 'c2_clear', 'c3_clear', 'c4_clear', 'c5_gaia', 'c5_clear', 'c6_clear', 'c7_karim', 'c7_clear', 'c8_jafar']);
  const flag = (f) => flags.has(f);
  const c = {};
  for (const id of MONARENA_RANK_IDS.slice(0, -3)) noteMonClear(c, id, 1);
  assert.ok(monRankOpen('EX', flag, c).ok);
  assert.equal(monRankOpen('EX2', flag, c).why, 'story');
  flags.add('c8_hades');
  assert.equal(monRankOpen('EX2', flag, c).why, 'prev');
  noteMonClear(c, 'EX', 2);
  assert.ok(monRankOpen('EX2', flag, c).ok);
});
