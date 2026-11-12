// 第80回 C: やりこみの 上の 段を 第8章クリア（c8_solitus・Lv94 くらい）に 合わせる（docs/plan-ch8.md の 9-3 C班）
// ・モンスター闘技場 … 伝説の部の つづき ランクEX3（c8_solitus・おすすめ Lv96）
// ・宝の地図 … 上限 45 → 50（第8章クリアの あとだけ。それまでは 45）。Lv46 から 第8章 第2幕・第3幕の 魔物・主の 倍率・だん15 の ★5
// ・サファラ闘技場 … 伝説の部 ランク13（c8_solitus・おすすめ Lv96。時の大王者クロノガルド … 時の まきもどし）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { MONSTERS_C8B, C8B_MINIONS } from '../public/js/shared/data/monsters-c8b.js';
import { MONSTERS_C8C, C8C_MINIONS } from '../public/js/shared/data/monsters-c8c.js';
import { C8A_MINIONS } from '../public/js/shared/data/monsters-c8a.js';
import { C7I_MINIONS } from '../public/js/shared/data/monsters-c7i.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import {
  TM_LV_MAX, TM_LV_STORY_CAP, TM_LV_OPEN_FLAG, TM_C8_FROM, TM_END8_FROM, TM_END8_POW, TM_DEEP_POW, TM_THEMES, THEME_KEYS, TM_BOSS_POW,
  tmLvCap, tmPoolOf, tmBossPow, tmCavePow, enemyLvOf, bossLvOf, caveInfo, ensureEncounterTable, encounterZone, parseFloorId, floorMapId,
  repairTreasureMaps, dropMapLevel, nextMapLevel,
} from '../public/js/shared/data/treasure.js';
import { CURVE_LV_MAX, CURVE_SKIP } from '../public/js/shared/data/tm-curve.js';
import { tmGearStep, pickTmGear, rareIds, starsOf, rareWhereText, TM_THEME_GROUPS, TM_GEAR_C8, TM_GEAR_END8 } from '../public/js/shared/data/rare-loot.js';
import { TM_DEEP_K } from '../public/js/shared/data/items-rare.js';
import { C8C_K } from '../public/js/shared/data/items-c8c.js';
import { buildTreasureFloor } from '../public/js/shared/maps/treasure-cave.js';
import { grantTreasureMap } from '../public/js/shared/world/treasure.js';
import { ARENA_RANKS, rankInfo, rankOpen, visibleRanks, noteClear, rankLabel } from '../public/js/shared/data/arena.js';
import { champOf, clearRewards } from '../public/js/shared/world/arena.js';
import { ARENA_BIG, arenaDamage, arenaCond, arenaEffect, arenaAdjust, arenaPlan, rewindConf, warped } from '../public/js/shared/battle-arena.js';
import { MONARENA_RANKS, MONARENA_RANK_IDS, monRankInfo, monRankOpen, monRankLabel, monChampOf, noteMonClear } from '../public/js/shared/data/monarena.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, itemCount } from '../public/js/shared/stats.js';
import { shioriTracks } from '../public/js/shared/world/shiori.js';
import { checkText } from '../tools/kanji-check.mjs';
import { makeRng } from '../public/js/shared/rng.js';

const EQ = ['weapon', 'armor', 'shield', 'head', 'acc'];
const speciesOf = (zone) => [...new Set(ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map(([sp]) => sp)))];
const noBad = (s) => assert.deepEqual(checkText(s), [], s);
const sum = (id) => Object.values(ITEMS[id].bonus || {}).reduce((a, v) => a + v, 0);

// ───────────── 宝の地図 ─────────────
test('宝の地図: 上限 Lv50（洞窟の 魔物は Lv109 から・主は Lv113.5 まで）。ID・セーブ・洞窟が Lv50 まで つかえる', () => {
  assert.deepEqual([TM_LV_MAX, TM_LV_STORY_CAP, TM_LV_OPEN_FLAG, TM_END8_FROM], [50, 45, 'c8_solitus', 46]);
  assert.equal(enemyLvOf(50, 1), 109);
  const deepest = (L) => [...Array(4000).keys()].find((x) => caveInfo(x, L).floors === 6);
  assert.equal(bossLvOf(deepest(50), 50), 113.5);
  const tm = { seed: 8080, lv: 50, map: 'sea', x: 40, y: 40 };
  assert.equal(parseFloorId(floorMapId(tm, 5)).lv, 50);
  assert.equal(parseFloorId(floorMapId({ ...tm, lv: 51 }, 1)), null, 'Lv51 は ない');
  const m = buildTreasureFloor(floorMapId(tm, 1));
  assert.ok(m && m.enemyCurve && m.enemyLv === enemyLvOf(50, 1));
  assert.equal(m.enemyPow, TM_END8_POW, 'Lv46〜 は 0.9');
  assert.ok(TM_END8_POW < TM_DEEP_POW && TM_END8_POW >= 0.85);
  assert.equal(tmCavePow(45), TM_DEEP_POW, 'Lv45 までは 前の まま');
  // セーブ: Lv50 の 地図も そのまま（キャラの 上限は 手に入れる 時だけ）
  const c = { treasureMaps: [{ seed: 9, lv: 48, map: 'overworld', x: 3, y: 4 }, { seed: 10, lv: 90, map: 'sea', x: 3, y: 4 }] };
  repairTreasureMaps(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.lv), [48, 50]);
  // 拾う 地図の 式は もとの まま（強い 魔物ほど 高い）。主の あとの 地図で 上へ
  const rng = makeRng(80);
  const at = (eLv) => Array.from({ length: 300 }, () => dropMapLevel(rng, eLv));
  const last = at(95);
  assert.ok(Math.min(...last) >= 42 && Math.max(...last) <= 45, `Lv95: ${Math.min(...last)}〜${Math.max(...last)}`);
  const next = Array.from({ length: 200 }, () => nextMapLevel(rng, 49));
  assert.ok(next.includes(50) && Math.max(...next) === 50);
});

test('宝の地図: Lv46 から 上は 第8章クリアの あとだけ（拾う 地図・主の あとの 地図とも 45 で 止まる）', () => {
  const world = { rng: makeRng(1), now: () => 1000, markDirty() {} };
  const before = { id: 'a', name: 'ソラ', flags: { c1_clear: true, c2_ship: true }, treasureMaps: [] };
  const after = { id: 'b', name: 'ヒナ', flags: { c1_clear: true, c2_ship: true, c8_solitus: true }, treasureMaps: [] };
  assert.equal(tmLvCap(before), 45);
  assert.equal(tmLvCap(after), 50);
  assert.equal(tmLvCap(null), 45);
  for (const lv of [44, 46, 50]) {
    assert.equal(grantTreasureMap(world, before, { lv }).lv, Math.min(lv, 45), `第8章クリアの 前 Lv${lv}`);
    assert.equal(grantTreasureMap(world, after, { lv }).lv, lv, `第8章クリアの あと Lv${lv}`);
  }
});

test('冒険のしおり: 宝の地図の 分母は 物語に 合わせて 45 → 50', () => {
  const c = { id: 'p', name: 'ソラ', level: 94, flags: { c1_clear: true, tm_intro: true }, treasureMaps: [{ id: 'x', seed: 1, lv: 44, map: 'overworld', x: 3, y: 4 }] };
  const tm = () => shioriTracks(c).find((t) => t.id === 'tmap');
  assert.deepEqual([tm().now, tm().total], [44, 45]);
  c.flags.c8_solitus = true;
  assert.deepEqual([tm().now, tm().total], [44, 50]);
});

test('洞窟の 魔物: Lv46〜50 は 第8章 第2幕・第3幕の 魔物（end8）。10しゅは ぜんぶ 出る', () => {
  const okSet = new Set([...C8B_MINIONS, ...C8C_MINIONS, ...C8A_MINIONS, ...C7I_MINIONS]);
  const seen = new Set();
  for (const th of THEME_KEYS) {
    const list = TM_THEMES[th].end8;
    assert.ok(list.length >= 4 && list.length <= 6 && new Set(list).size === list.length, th);
    for (const sp of list) {
      const m = MONSTERS[sp];
      assert.ok(okSet.has(sp), `${th}: ${sp} は 第7章 第3幕・第8章の 手下の 魔物`);
      assert.ok(m && !m.boss && !m.breedOnly && !m.rare && !sp.startsWith('c8r'), `${th}: ${sp}`);
      for (const a of m.actions || []) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      if (MONSTERS_C8B[sp] || MONSTERS_C8C[sp]) seen.add(sp);
    }
  }
  assert.equal(seen.size, C8B_MINIONS.length + C8C_MINIONS.length, '第8章 第2幕・第3幕の 10しゅ ぜんぶ');
  for (let lv = TM_END8_FROM; lv <= TM_LV_MAX; lv++) {
    for (const th of THEME_KEYS) {
      assert.deepEqual(tmPoolOf(lv, th), TM_THEMES[th].end8);
      const sps = speciesOf(ensureEncounterTable(lv, th));
      assert.ok(sps.length >= 4, `地図Lv${lv} ${th}`);
      for (const sp of sps) assert.ok(TM_THEMES[th].end8.includes(sp), `地図Lv${lv} ${th}: ${sp}`);
    }
  }
  // Lv45 までは 第74回の まま
  for (const th of THEME_KEYS) assert.deepEqual(tmPoolOf(45, th), TM_THEMES[th].c8);
  assert.equal(TM_C8_FROM, 41);
});

test('第8章 第4幕の 魔物を 足す 口: end8 に ID を 書くだけ（まだ ない ID は 出ない・もとの レベルの 高い 6しゅ）', () => {
  const keep = TM_THEMES.lava.end8.slice();
  const zone = encounterZone(48, 'lava');
  const old = ENCOUNTER_TABLES[zone];
  try {
    delete ENCOUNTER_TABLES[zone];
    TM_THEMES.lava.end8.push('not_yet_mon', 'tonkachi_bro', 'sanbo');
    const sps = speciesOf(ensureEncounterTable(48, 'lava'));
    assert.ok(!sps.includes('not_yet_mon'));
    assert.ok(sps.length === 6 && sps.includes('dodeka_killer') && !sps.includes('sanbo'), sps.join(','));
  } finally {
    TM_THEMES.lava.end8.splice(0, TM_THEMES.lava.end8.length, ...keep);
    if (old) ENCOUNTER_TABLES[zone] = old;
    else delete ENCOUNTER_TABLES[zone];
  }
});

test('洞窟の 主: Lv46〜50 の 倍率（シミュレーターで 合わせた 数。だんだん 小さく）・めやすは Lv83 まで（第8章 第2幕の Lv83 の 魔物も 入れない）', () => {
  // node tools/sim-boss.mjs 30 tm 45,…,50 … 主の レベル＋3 の 4人・その ころの 店・完全オートで 86〜91%
  assert.deepEqual(TM_BOSS_POW.filter(([L]) => L >= 45), [[45, 0.65], [46, 0.64], [48, 0.62], [50, 0.61]]);
  assert.equal(TM_BOSS_POW[TM_BOSS_POW.length - 1][0], TM_LV_MAX);
  for (const sp of Object.keys(MONSTERS_TM)) {
    for (let L = 30; L < TM_LV_MAX; L++) assert.ok(tmBossPow(L + 1, sp) <= tmBossPow(L, sp), `${sp} Lv${L}`);
    assert.ok(tmBossPow(50, sp) >= 0.5 && tmBossPow(50, sp) <= 0.7, `${sp}: ${tmBossPow(50, sp)}`);
    assert.equal(tmBossPow(TM_LV_MAX + 5, sp), tmBossPow(TM_LV_MAX, sp));
  }
  assert.equal(CURVE_LV_MAX, 83);
  for (const sp of CURVE_SKIP) assert.ok(MONSTERS_C8B[sp] && MONSTERS[sp].lv <= CURVE_LV_MAX, sp);
  assert.ok(C8B_MINIONS.filter((sp) => MONSTERS[sp].lv <= CURVE_LV_MAX).every((sp) => CURVE_SKIP.has(sp)), '第8章 第2幕の Lv83 いかの 魔物は ぜんぶ 外す');
});

test('宝箱の 装備: Lv46〜50 は だん15 の ★5（土・氷・炎 2つずつ）。くろがねの 空中ようさいの 宝箱と おなじ くらい', () => {
  assert.deepEqual([TM_GEAR_C8, TM_GEAR_END8], [41, 46]);
  assert.deepEqual([41, 45, 46, 48, 50].map(tmGearStep), [14, 14, 15, 15, 15]);
  const s15 = rareIds('tm').filter((id) => ITEMS[id].tmStep === 15);
  assert.equal(s15.length, 6);
  for (const th of THEME_KEYS) assert.equal(s15.filter((id) => TM_THEME_GROUPS[th].includes(ITEMS[id].grp)).length, 2, th);
  for (const id of s15) {
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
  // 強さ: だん14 より 上・空中ようさいの いちばん 強い 宝箱（1.12×2.02）を こえない
  assert.ok(TM_DEEP_K[15] > TM_DEEP_K[14] && TM_DEEP_K[15] <= 1.12 * C8C_K[8] + 1e-9);
  assert.ok(ITEMS.tmd_red_dragon_axe.atk <= ITEMS.c8ct_iron_axe.atk);
  assert.ok(sum('tmd_flame_dragon_ring') > sum('tmd_phoenix_necklace') && sum('tmd_flame_dragon_ring') < sum('c8w_king_charm'), 'ボスの お守りより 弱い');
  for (let lv = 46; lv <= 50; lv++) {
    for (let i = 0; i < 60; i++) {
      const theme = THEME_KEYS[i % 3];
      const word = TM_THEMES[theme].words[i % TM_THEMES[theme].words.length];
      const it = ITEMS[pickTmGear(makeRng(i * 23 + lv), lv, { theme, word }, i % 2 ? 'bossA' : 'normal')];
      assert.ok(it && it.src === 'tm' && [14, 15].includes(it.tmStep), `Lv${lv}`);
      assert.ok(TM_THEME_GROUPS[theme].includes(it.grp), `Lv${lv} ${theme}`);
    }
  }
});

// ───────────── サファラ闘技場 ランク13 ─────────────
test('闘技場 ランク13: 第8章クリアで 開く・おすすめ Lv96・3連戦（1・2戦目は 第8章 第2幕・第3幕の 魔物・3戦目は 時の大王者）', () => {
  const R = rankInfo(13);
  assert.equal(ARENA_RANKS.length, 13);
  assert.deepEqual([R.lv, R.needFlag, R.legend, R.champ], [96, 'c8_solitus', true, '時の大王者クロノガルド']);
  assert.equal(rankLabel(13), '伝説の部・ランク13');
  for (const s of [R.champ, R.hint, R.lockText]) noBad(s);
  assert.ok(R.lockText.includes('第8章'));
  R.battles.forEach((enc, i) => {
    const e = FIXED_ENCOUNTERS[enc];
    assert.ok(e && e.arena && e.bg === 'arena' && e.canFlee === false && e.loseOk === true, enc);
    for (const [sp] of e.group) {
      const m = MONSTERS[sp];
      assert.ok(m, `${enc}: ${sp}`);
      for (const a of m.actions) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      if (i < 2) assert.ok(MONSTERS_C8B[sp] || MONSTERS_C8C[sp], `${enc}: ${sp} は 第8章 第2幕・第3幕の 魔物`);
    }
    if (i < 2) assert.ok(Math.abs(e.enemyLv - R.lv) <= 2, `${enc}: Lv${e.enemyLv}`);
    else assert.ok(e.boss && !e.enemyLv, enc);
  });
  assert.equal(champOf('ar13_3'), 'ar_chronos');
  for (const sp of ['ar_chronos', 'ar_clock_knight', 'ar_sand_fairy']) {
    const m = MONSTERS[sp];
    assert.ok(m.boss && m.noBefriend && !Object.keys(MONSTERS).includes(sp), `${sp}: 図鑑に 出ない 王者`);
    assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえの え`);
    assert.equal(m.resist.water, 1, `${sp}: 水は ふつう`);
    assert.ok(m.resist.bolt >= 1.2, `${sp}: 雷が よく 効く`);
    for (const s of [m.name, m.desc, ...(m.phases || []).flatMap((p) => p.msg || [])]) noBad(s);
  }
  assert.ok(MONSTERS.ar_chronos.arena.rewind && !MONSTERS.ar_clock_knight.arena && !MONSTERS.ar_sand_fairy.arena);
  for (const id of Object.keys(ABILITIES).filter((k) => /^m_ar13_/.test(k))) {
    const a = ABILITIES[id];
    for (const s of [a.name, a.cast, a.desc]) noBad(s);
  }
  assert.ok(ARENA_BIG.has('m_ar13_storm'));
  assert.equal(ABILITIES.m_ar13_inhale.effect.next, 'm_ar13_storm');
});

test('闘技場 ランク13 の ごほうび: ★5 の アクセ 1つ（ランク12 より 上・第3幕の ボスの お守りより 少し 上）・素材・メダル。2回目から ゴールド・メダル・限界の石', () => {
  const R = rankInfo(13), R12 = rankInfo(12);
  assert.deepEqual(R.first.items, ['ar_time_hourglass']);
  const it = ITEMS.ar_time_hourglass;
  assert.equal(it.type, 'acc');
  assert.equal(starsOf('ar_time_hourglass'), 5);
  assert.equal(rareWhereText('ar_time_hourglass'), '闘技場のごほうびでしか手に入らない');
  assert.ok(it.price === 0 && it.sell > 0 && ITEM_KANA.ar_time_hourglass);
  assert.ok(!(it.resist?.water < 1), '水に 強い 装備は 作らない');
  noBad(it.name);
  noBad(it.desc);
  // ランク12 の しんじゅより 強く、第8章 第3幕の いちばん 強い ボスの お守りより 少し 上（大きく こえない）
  assert.ok(sum('ar_deep_sea_pearl') < sum('ar_time_hourglass'));
  assert.ok(sum('ar_time_hourglass') > sum('c8w_king_charm') && sum('ar_time_hourglass') <= sum('c8w_king_charm') * 1.08);
  assert.ok(R.first.mats.some(([m]) => m === 'limit_stone') && R.first.mats.every(([m, n]) => ITEMS[m] && n > 0));
  assert.ok(R.first.medals > R12.first.medals && R.repeatGold > R12.repeatGold);
  assert.deepEqual(R.repeatMats, [['limit_stone', 1]]);
  const c = newCharacter({ id: 't', name: 'ソラ', job: 'warrior', look: {} });
  c.gold = 0;
  const run = { world: { now: () => 1000, sendSelf() {}, markDirty() {} }, everyone: [{ char: c }] };
  clearRewards(run, 13);
  assert.equal(itemCount(c, 'ar_time_hourglass'), 1);
  for (const [m, n] of R.first.mats) assert.equal(itemCount(c, m), n, m);
  const stones = itemCount(c, 'limit_stone');
  clearRewards(run, 13);
  assert.equal(itemCount(c, 'ar_time_hourglass'), 1, 'はじめての 品は 1回だけ');
  assert.equal(c.gold, R.repeatGold);
  assert.equal(itemCount(c, 'limit_stone'), stones + 1);
});

test('闘技場 ランク13 は 第8章クリアと ランク12 で 開く（それまでは 名前も 出さない）', () => {
  const flags = new Set(['c4_clear', 'c5_gaia', 'c5_nshadow', 'c5_nocto1', 'c6_clear', 'c7_karim', 'c7_clear', 'c8_hades', 'c8_bowser']);
  const flag = (f) => flags.has(f);
  const c = { flags: {} };
  for (let n = 1; n <= 11; n++) noteClear(c, n, 1000 + n);
  assert.ok(!visibleRanks(flag).includes(13));
  assert.equal(rankOpen(13, flag, c).why, 'story');
  flags.add('c8_solitus');
  assert.ok(visibleRanks(flag).includes(13));
  assert.equal(rankOpen(13, flag, c).why, 'prev');
  noteClear(c, 12, 2000);
  assert.ok(rankOpen(13, flag, c).ok);
});

test('時の大王者の しかけ: 砂時計を さかさまに すると、次の 番までの ダメージを まきもどす・ダメージを 受けないと 時が ゆがんで 大チャンス', () => {
  const me = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(me, expForLevel(94));
  fullHeal(me);
  const b = new Battle({ rng: makeRng(8), allies: [{ char: me, controller: 's1' }], enemies: ['ar_clock_knight', 'ar_chronos', 'ar_sand_fairy'], canFlee: false, boss: true });
  const p = b.allies[0];
  const king = b.enemies.find((e) => e.species === 'ar_chronos');
  const knight = b.enemies.find((e) => e.species === 'ar_clock_knight');
  const conf = MONSTERS.ar_chronos.arena.rewind;
  const ev = (ability) => ({ lines: [], upd: [], results: [], ability });
  const act = (m, n = 1) => { m.used = { ...(m.used || {}), attack: (m.used?.attack || 0) + n }; };
  assert.equal(rewindConf(knight), null, 'しかけは 王者だけ');
  assert.equal(arenaCond(b, king, 'arCanFlip'), true);
  assert.equal(arenaCond(b, king, 'arRewindReady'), false);
  // ふつうの 時は ダメージは そのまま
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, ev()), 1000);
  // 砂時計を さかさまに する → その 時の HP を おぼえる
  b.damage(p, king, 3000, ev(), { element: 'phys', phys: true });
  const hp0 = king.hp;
  act(king);
  const e1 = ev();
  assert.ok(arenaEffect(b, king, ABILITIES.m_ar13_flip, ABILITIES.m_ar13_flip.effect, e1));
  assert.equal(king.arMark, hp0);
  assert.ok(e1.lines.some((l) => l.includes('まきもどされて')), e1.lines.join(' / '));
  assert.equal(arenaCond(b, king, 'arCanFlip'), false);
  assert.equal(arenaCond(b, king, 'arRewindReady'), false, 'すぐには まきもどさない');
  // その 間の ダメージは、まきもどされる
  b.damage(p, king, 4000, ev(), { element: 'phys', phys: true });
  assert.equal(king.hp, hp0 - 4000);
  act(king, conf.ripe);
  assert.equal(arenaCond(b, king, 'arRewindReady'), true);
  const e2 = ev();
  arenaEffect(b, king, ABILITIES.m_ar13_rewind, ABILITIES.m_ar13_rewind.effect, e2);
  assert.equal(king.hp, hp0);
  assert.ok(e2.lines.some((l) => l.includes('まきもどった')) && e2.results.some((r) => r.id === king.id && r.heal === 4000), e2.lines.join(' / '));
  assert.equal(king.arMark, null);
  assert.equal(warped(king), false);
  // ダメージを 受けないで 待つ → 時が ゆがむ（openMult ばい・open 回 動く まで）
  arenaEffect(b, king, ABILITIES.m_ar13_flip, ABILITIES.m_ar13_flip.effect, ev());
  assert.equal(arenaDamage(b, p, knight, 1000, { element: 'phys' }, ev()), 1000, 'おともへの 攻撃は ふつう');
  act(king, conf.ripe);
  const e3 = ev();
  arenaEffect(b, king, ABILITIES.m_ar13_rewind, ABILITIES.m_ar13_rewind.effect, e3);
  assert.ok(e3.lines.some((l) => l.includes('今が大チャンス')), e3.lines.join(' / '));
  assert.equal(warped(king), true);
  assert.equal(arenaCond(b, king, 'arCanFlip'), false, 'ゆがんで いる 間は さかさまに しない');
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, ev()), Math.round(1000 * conf.openMult));
  act(king, conf.open);
  assert.equal(warped(king), false);
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, ev()), 1000);
  assert.equal(arenaCond(b, king, 'arCanFlip'), true);
  // 砂時計が さかさまで ない ときの まきもどしは 何も おこらない
  const e4 = ev();
  arenaEffect(b, king, ABILITIES.m_ar13_rewind, ABILITIES.m_ar13_rewind.effect, e4);
  assert.ok(e4.lines.some((l) => l.includes('何もおこらなかった')));
});

test('時の大王者: 知っている 人は 砂時計が さかさまの 間 王者を たたかない・王者だけ なら 身を 守る・ゆがんだら 王者を ねらう', () => {
  const me = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(me, expForLevel(94));
  fullHeal(me);
  const b = new Battle({ rng: makeRng(9), allies: [{ char: me, controller: 's1' }], enemies: ['ar_clock_knight', 'ar_chronos'], canFlee: false, boss: true });
  b.knowsArena = true;
  const p = b.allies[0];
  const king = b.enemies.find((e) => e.species === 'ar_chronos');
  const knight = b.enemies.find((e) => e.species === 'ar_clock_knight');
  const opts = () => [
    { cmd: { type: 'attack', target: king.id }, final: 100, score: 100, mp: 0 },
    { cmd: { type: 'attack', target: knight.id }, final: 100, score: 100, mp: 0 },
  ];
  king.arMark = king.hp;
  king.arMarkAt = 0;
  let o = opts();
  arenaAdjust(b, p, o);
  assert.ok(o[0].final < o[1].final * 0.1, '王者は たたかない');
  knight.alive = false;
  knight.hp = 0;
  assert.deepEqual(arenaPlan(b, p), { type: 'defend' });
  knight.alive = true;
  knight.hp = knight.maxHp;
  king.arMark = null;
  king.arWarpAt = Object.values(king.used || {}).reduce((s, n) => s + n, 0);
  o = opts();
  arenaAdjust(b, p, o);
  assert.ok(o[0].final > o[1].final, 'ゆがんだら 王者');
});

// ───────────── モンスター闘技場 ランクEX3 ─────────────
test('モンスター闘技場 ランクEX3: EX2 の つぎ・第8章クリアで 開く・おすすめ Lv96・王者は 色ちがい・くりかえして 装備は もらえない', () => {
  assert.deepEqual(MONARENA_RANK_IDS.slice(-3), ['EX', 'EX2', 'EX3']);
  const R = monRankInfo('EX3'), EX2 = monRankInfo('EX2');
  assert.deepEqual([R.lv, R.need, R.legend], [96, 'c8_solitus', true]);
  assert.equal(monRankLabel('EX3'), '伝説の部・ランクEX3');
  assert.ok(R.lv > EX2.lv && R.foeLv > EX2.foeLv);
  for (const s of [R.title, R.hint, R.lock]) noBad(s);
  assert.equal(R.fights.length, 3);
  for (const f of R.fights.slice(0, 2)) for (const sp of f) assert.ok(MONSTERS_C8B[sp] || MONSTERS_C8C[sp], `EX3: ${sp} は 第8章 第2幕・第3幕の 魔物`);
  const champ = MONSTERS[monChampOf(R)];
  assert.ok(champ?.variant && champ.noBefriend, '王者は 色ちがい');
  assert.ok(MONSTERS_C8B[champ.variant.base] || MONSTERS_C8C[champ.variant.base]);
  noBad(champ.name);
  assert.ok(R.hint.includes(champ.name), 'ヒントは 王者の 名前で');
  // ごほうび: SS〜EX2 と おなじ 形（色の石・限界の石・種）。装備は 入れない
  for (const [id, n] of R.first.items) assert.ok(ITEMS[id] && n > 0 && !EQ.includes(ITEMS[id].type), id);
  assert.ok(R.first.items.some(([id]) => id === 'limit_stone') && R.first.items.some(([id]) => id === 'color_stone'));
  assert.ok(R.first.medals >= EX2.first.medals && R.repeatGold > EX2.repeatGold && R.repeatMedal);
  assert.equal(MONARENA_RANKS[MONARENA_RANKS.length - 1], R);
  // 開く: c8_solitus と EX2
  const flags = new Set(['monster_bond', 'c1_clear', 'c2_clear', 'c3_clear', 'c4_clear', 'c5_gaia', 'c5_clear', 'c6_clear', 'c7_karim', 'c7_clear', 'c8_hades', 'c8_bowser']);
  const flag = (f) => flags.has(f);
  const c = {};
  for (const id of MONARENA_RANK_IDS.slice(0, -2)) noteMonClear(c, id, 1);
  assert.ok(monRankOpen('EX2', flag, c).ok);
  assert.equal(monRankOpen('EX3', flag, c).why, 'story');
  flags.add('c8_solitus');
  assert.equal(monRankOpen('EX3', flag, c).why, 'prev');
  noteMonClear(c, 'EX2', 2);
  assert.ok(monRankOpen('EX3', flag, c).ok);
});
