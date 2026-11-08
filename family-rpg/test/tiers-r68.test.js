// 第68回 C: やりこみの 上の 段を 第7章クリア（c7_clear・Lv80 くらい）に 合わせる（docs/plan-ch7.md の 8-3 C班）
// ・モンスター闘技場 … 伝説の部の つづき ランクEX（c7_clear・おすすめ Lv84）
// ・宝の地図 … 上限 35 → 40。Lv36 から 第7章の 魔物だけ・主の 倍率・だん13 の ★5
// ・サファラ闘技場 … 伝説の部 ランク11（c7_clear・おすすめ Lv82。白銀の大王者ボレアス … こおる・とける）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { MONSTERS_C7, C7_MINIONS } from '../public/js/shared/data/monsters-c7.js';
import { MONSTERS_C7S, C7S_MINIONS } from '../public/js/shared/data/monsters-c7s.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import {
  TM_LV_MAX, TM_C7_FROM, TM_DEEP_POW, TM_THEMES, THEME_KEYS, TM_BOSS_POW, tmPoolOf, tmBossPow, enemyLvOf, bossLvOf, caveInfo,
  ensureEncounterTable, parseFloorId, floorMapId, repairTreasureMaps, chestLoot, dropMapLevel,
} from '../public/js/shared/data/treasure.js';
import { tmGearStep, tmGearRank, pickTmGear, rareIds, starsOf, rareWhereText, TM_THEME_GROUPS, TM_GEAR_C7 } from '../public/js/shared/data/rare-loot.js';
import { TM_DEEP_K } from '../public/js/shared/data/items-rare.js';
import { buildTreasureFloor } from '../public/js/shared/maps/treasure-cave.js';
import { ARENA_RANKS, rankInfo, rankOpen, visibleRanks, noteClear, rankLabel } from '../public/js/shared/data/arena.js';
import { champOf, clearRewards } from '../public/js/shared/world/arena.js';
import { ARENA_BIG, arenaDamage, arenaCond, arenaEffect } from '../public/js/shared/battle-arena.js';
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
test('宝の地図: 上限 Lv40（洞窟の 魔物は Lv89 から・主は Lv93.5 まで）。ID・セーブ・洞窟が Lv40 まで つかえる', () => {
  assert.equal(TM_LV_MAX, 40);
  assert.equal(TM_C7_FROM, 36);
  assert.equal(enemyLvOf(40, 1), 89);
  const deepest = (L) => [...Array(4000).keys()].find((x) => caveInfo(x, L).floors === 6);
  assert.equal(bossLvOf(deepest(40), 40), 93.5);
  const tm = { seed: 4242, lv: 40, map: 'overworld', x: 40, y: 40 };
  assert.equal(parseFloorId(floorMapId(tm, 3)).lv, 40);
  assert.equal(parseFloorId(floorMapId({ ...tm, lv: 41 }, 1)), null, 'Lv41 は ない');
  const m = buildTreasureFloor(floorMapId(tm, 1));
  assert.ok(m && m.enemyCurve && m.enemyLv === enemyLvOf(40, 1));
  assert.equal(m.enemyPow, TM_DEEP_POW, 'Lv36〜 も 第65回の deep と おなじ 0.95');
  const c = { treasureMaps: [{ seed: 9, lv: 38, map: 'overworld', x: 3, y: 4 }, { seed: 10, lv: 70, map: 'sea', x: 3, y: 4 }] };
  repairTreasureMaps(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.lv), [38, 40]);
  // 第7章クリアの ころ（物語の 魔物 Lv76〜80）で Lv34〜37 の 地図が 自然に 出る（もとの 式の まま）
  const rng = makeRng(68);
  const at = (eLv) => Array.from({ length: 300 }, () => dropMapLevel(rng, eLv));
  const late = at(80);
  assert.ok(Math.min(...late) >= 35 && Math.max(...late) <= 37, `Lv80: ${Math.min(...late)}〜${Math.max(...late)}`);
});

test('洞窟の 魔物: Lv36〜40 は 第7章（第1幕・第2幕）の ふつうの 魔物だけ。それぞれの 洞窟に 5しゅ', () => {
  const c7 = new Set([...C7_MINIONS, ...C7S_MINIONS]);
  const used = new Set();
  for (const th of THEME_KEYS) {
    const list = TM_THEMES[th].c7;
    assert.ok(list.length >= 4, th);
    for (const sp of list) {
      const m = MONSTERS[sp];
      assert.ok(c7.has(sp) && (MONSTERS_C7[sp] || MONSTERS_C7S[sp]), `${th}: ${sp} は 第7章の 魔物`);
      assert.ok(m && !m.boss && !m.breedOnly && !m.rare, `${th}: ${sp}`);
      for (const a of m.actions || []) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      assert.ok(!used.has(sp), `${sp} は 1つの 洞窟だけ`);
      used.add(sp);
    }
  }
  assert.equal(used.size, c7.size, '第7章の 魔物 15しゅ ぜんぶ');
  for (let lv = TM_C7_FROM; lv <= TM_LV_MAX; lv++) {
    for (const th of THEME_KEYS) {
      assert.deepEqual(tmPoolOf(lv, th), TM_THEMES[th].c7);
      const sps = speciesOf(ensureEncounterTable(lv, th));
      assert.ok(sps.length >= 4, `地図Lv${lv} ${th}`);
      for (const sp of sps) assert.ok(TM_THEMES[th].c7.includes(sp), `地図Lv${lv} ${th}: ${sp}`);
    }
  }
  // Lv35 までは 前と おなじ（deep の 魔物）
  for (const th of THEME_KEYS) assert.ok(tmPoolOf(35, th).length > TM_THEMES[th].c7.length);
});

test('洞窟の 主: Lv36〜40 の 倍率（シミュレーターで 決めた 数。だんだん 小さく・Lv40 より 上は おなじ）', () => {
  // node tools/sim-boss.mjs 30 tm 35,36,37,38,39,40 … 主の レベル＋3 の 4人・その ころの 店・完全オートで 83〜91%
  assert.deepEqual(TM_BOSS_POW.slice(-2), [[35, 0.73], [40, 0.71]]);
  for (const sp of Object.keys(MONSTERS_TM)) {
    for (let L = 35; L < TM_LV_MAX; L++) assert.ok(tmBossPow(L + 1, sp) <= tmBossPow(L, sp), `${sp} Lv${L}`);
    assert.ok(tmBossPow(40, sp) >= 0.6 && tmBossPow(40, sp) <= 0.8, `${sp}: ${tmBossPow(40, sp)}`);
    assert.equal(tmBossPow(45, sp), tmBossPow(40, sp));
  }
});

test('宝箱の 装備: Lv36〜40 は だん13 の ★5（土・氷・炎 2つずつ）。物語の 灯台の 宝箱と おなじ くらい・出やすさは Lv25 の まま', () => {
  assert.equal(TM_GEAR_C7, 36);
  assert.deepEqual([33, 35, 36, 38, 40].map(tmGearStep), [12, 12, 13, 13, 13]);
  for (let lv = 36; lv <= 40; lv++) assert.equal(tmGearRank(lv), 10);
  const s13 = rareIds('tm').filter((id) => ITEMS[id].tmStep === 13);
  assert.equal(s13.length, 6);
  for (const th of THEME_KEYS) assert.equal(s13.filter((id) => TM_THEME_GROUPS[th].includes(ITEMS[id].grp)).length, 2, th);
  for (const id of s13) {
    const it = ITEMS[id];
    assert.ok(id.startsWith('tmd_'), id);
    assert.ok(EQ.includes(it.type) && it.rank === 10 && it.rarity === 4, id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), '宝の洞窟でしか手に入らない');
    assert.ok(it.desc && it.price === 0 && it.sell > 0 && ITEM_KANA[id], id);
    noBad(it.name);
    noBad(it.desc);
  }
  // 強さ: だん12 より 上・しずむ前の島の灯台の いちばん 強い 宝箱（1.12×1.70）より 下
  assert.ok(TM_DEEP_K[13] > TM_DEEP_K[12] && TM_DEEP_K[13] < 1.12 * 1.7);
  assert.ok(sum('tmd_sun_shard_ring') < sum('c7l_hook_charm'), 'ボスの お守りより 弱い');
  // 宝箱の えらびかた: だん12〜13・その 洞窟の なかま
  for (let lv = 36; lv <= 40; lv++) {
    for (let i = 0; i < 90; i++) {
      const theme = THEME_KEYS[i % 3];
      const word = TM_THEMES[theme].words[i % TM_THEMES[theme].words.length];
      const id = pickTmGear(makeRng(i * 17 + lv), lv, { theme, word }, i % 2 ? 'bossA' : 'normal');
      const it = ITEMS[id];
      assert.ok(it && it.src === 'tm' && [12, 13].includes(it.tmStep), `Lv${lv}: ${id}`);
      assert.ok(TM_THEME_GROUPS[theme].includes(it.grp), `Lv${lv} ${theme}: ${id}`);
    }
  }
  // 第64回 ⑥d: 装備の 出やすさは Lv25 と おなじ（ふつうの 宝箱 2わり 弱・主の 宝箱 半分）
  const eqRate = (lv, kind) => {
    let n = 0;
    for (let i = 0; i < 3000; i++) if (EQ.includes(ITEMS[chestLoot(makeRng(i * 31 + 5), lv, kind, { theme: THEME_KEYS[i % 3], word: '氷' }).item]?.type)) n++;
    return n / 3000;
  };
  assert.ok(Math.abs(eqRate(40, 'normal') - eqRate(25, 'normal')) < 0.02 && eqRate(40, 'normal') < 0.21);
  assert.ok(eqRate(40, 'bossA') < 0.56);
});

// ───────────── サファラ闘技場 ランク11 ─────────────
test('闘技場 ランク11: 第7章クリアで 開く・おすすめ Lv82・3連戦（1・2戦目は 第7章の 魔物・3戦目は 白銀の大王者）', () => {
  const R = rankInfo(11);
  assert.equal(ARENA_RANKS.length, 11);
  assert.deepEqual([R.lv, R.needFlag, R.legend, R.champ], [82, 'c7_clear', true, '白銀の大王者ボレアス']);
  assert.equal(rankLabel(11), '伝説の部・ランク11');
  for (const s of [R.champ, R.hint, R.lockText]) noBad(s);
  R.battles.forEach((enc, i) => {
    const e = FIXED_ENCOUNTERS[enc];
    assert.ok(e && e.arena && e.bg === 'arena' && e.canFlee === false && e.loseOk === true, enc);
    for (const [sp] of e.group) {
      const m = MONSTERS[sp];
      assert.ok(m, `${enc}: ${sp}`);
      for (const a of m.actions) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
      if (i < 2) assert.ok(MONSTERS_C7[sp] || MONSTERS_C7S[sp], `${enc}: ${sp} は 第7章の 魔物`);
    }
    if (i < 2) assert.ok(Math.abs(e.enemyLv - R.lv) <= 2, `${enc}: Lv${e.enemyLv}`);
    else assert.ok(e.boss && !e.enemyLv, enc);
  });
  assert.equal(champOf('ar11_3'), 'ar_boreas');
  for (const sp of ['ar_boreas', 'ar_snowman', 'ar_snow_kid']) {
    const m = MONSTERS[sp];
    assert.ok(m.boss && m.noBefriend && !Object.keys(MONSTERS).includes(sp), `${sp}: 図鑑に 出ない 王者`);
    assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえの え`);
    for (const s of [m.name, m.desc, ...(m.phases || []).flatMap((p) => p.msg || [])]) noBad(s);
  }
  assert.ok(MONSTERS.ar_boreas.arena.frost && MONSTERS.ar_snowman.arena.frostHelp && MONSTERS.ar_snow_kid.arena.frostHelp);
  for (const id of Object.keys(ABILITIES).filter((k) => /^m_ar11_/.test(k))) {
    const a = ABILITIES[id];
    for (const s of [a.name, a.cast, a.desc]) noBad(s);
  }
  assert.ok(ARENA_BIG.has('m_ar11_blizzard'));
  assert.equal(ABILITIES.m_ar11_inhale.effect.next, 'm_ar11_blizzard');
});

test('闘技場 ランク11 の ごほうび: ★5 の アクセ 1つ・限界の石の 入った 素材・メダル。2回目から ゴールド・メダル・限界の石', () => {
  const R = rankInfo(11), R10 = rankInfo(10);
  assert.deepEqual(R.first.items, ['ar_silver_north_star']);
  const it = ITEMS.ar_silver_north_star;
  assert.equal(it.type, 'acc');
  assert.equal(starsOf('ar_silver_north_star'), 5);
  assert.equal(rareWhereText('ar_silver_north_star'), '闘技場のごほうびでしか手に入らない');
  assert.ok(it.price === 0 && it.sell > 0 && ITEM_KANA.ar_silver_north_star);
  noBad(it.name);
  noBad(it.desc);
  // ランク10 の ブローチより 強く、第7章 第2幕の ボスの お守りより 弱い
  assert.ok(sum('ar_star_king_brooch') < sum('ar_silver_north_star') && sum('ar_silver_north_star') < sum('c7l_hook_charm'));
  assert.ok(R.first.mats.some(([m]) => m === 'limit_stone') && R.first.mats.every(([m, n]) => ITEMS[m] && n > 0));
  assert.ok(R.first.medals > R10.first.medals && R.repeatGold > R10.repeatGold);
  assert.deepEqual(R.repeatMats, [['limit_stone', 1]]);
  const c = newCharacter({ id: 't', name: 'ソラ', job: 'warrior', look: {} });
  c.gold = 0;
  const run = { world: { now: () => 1000, sendSelf() {}, markDirty() {} }, everyone: [{ char: c }] };
  clearRewards(run, 11);
  assert.equal(itemCount(c, 'ar_silver_north_star'), 1);
  for (const [m, n] of R.first.mats) assert.equal(itemCount(c, m), n, m);
  const stones = itemCount(c, 'limit_stone');
  clearRewards(run, 11);
  assert.equal(itemCount(c, 'ar_silver_north_star'), 1, 'はじめての 品は 1回だけ');
  assert.equal(c.gold, R.repeatGold);
  assert.equal(itemCount(c, 'limit_stone'), stones + 1);
});

test('闘技場 ランク11 は 第7章クリアと ランク10 で 開く（それまでは 名前も 出さない）', () => {
  const flags = new Set(['c4_clear', 'c5_gaia', 'c5_nshadow', 'c5_nocto1', 'c6_clear', 'c7_karim']);
  const flag = (f) => flags.has(f);
  const c = { flags: {} };
  for (let n = 1; n <= 9; n++) noteClear(c, n, 1000 + n);
  assert.ok(!visibleRanks(flag).includes(11));
  assert.equal(rankOpen(11, flag, c).why, 'story');
  flags.add('c7_clear');
  assert.ok(visibleRanks(flag).includes(11));
  assert.equal(rankOpen(11, flag, c).why, 'prev');
  noteClear(c, 10, 2000);
  assert.ok(rankOpen(11, flag, c).ok);
});

test('白銀の大王者の しかけ: こおっている 間は 炎 いがい 効きにくい・炎で とける（大ふぶきも 止まる）・雪の子が また こおらせる', () => {
  const me = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(me, expForLevel(80));
  fullHeal(me);
  const b = new Battle({ rng: makeRng(3), allies: [{ char: me, controller: 's1' }], enemies: ['ar_snowman', 'ar_boreas', 'ar_snow_kid'], canFlee: false, boss: true });
  const p = b.allies[0];
  const king = b.enemies.find((e) => e.species === 'ar_boreas');
  const kid = b.enemies.find((e) => e.species === 'ar_snow_kid');
  const conf = MONSTERS.ar_boreas.arena.frost;
  const ev = () => ({ lines: [], upd: [], results: [] });
  // はじめは こおっている（炎の 効きぐあいが 上がって 見える）
  assert.equal(king.arFrozen, true);
  assert.ok(king.resist.fire >= 1.5);
  assert.equal(arenaCond(b, king, 'arFrozen'), true);
  // 炎 いがいは cut ばい
  const e1 = ev();
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, e1), Math.round(1000 * conf.cut));
  assert.ok(e1.lines.some((l) => l.includes('こおった体')), e1.lines.join(' / '));
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'ice' }, ev()), Math.round(1000 * conf.cut));
  // 雪の子は ふつう（しかけは 王者だけ）
  assert.equal(arenaDamage(b, p, kid, 1000, { element: 'phys' }, ev()), 1000);
  // 炎の ダメージが たまると とける。大ふぶきの 前ぶれも 止まる
  king.telegraph = 'm_ar11_blizzard';
  const need = Math.ceil(king.maxHp * conf.melt);
  const e2 = ev();
  assert.equal(arenaDamage(b, p, king, need - 1, { element: 'fire' }, e2), need - 1);
  assert.equal(king.arFrozen, true, 'まだ とけない');
  const e3 = ev();
  arenaDamage(b, p, king, 10, { element: 'fire' }, e3);
  assert.equal(king.arFrozen, false);
  assert.equal(king.telegraph, null, '大ふぶきが 止まる');
  assert.ok(e3.postLines.some((l) => l.includes('とけた')) && e3.postLines.some((l) => l.includes('止まった')), e3.postLines.join(' / '));
  assert.equal(king.resist.fire, MONSTERS.ar_boreas.resist.fire, '炎の 効きぐあいは もとに');
  // とけている 間は thawMult ばい
  assert.equal(arenaDamage(b, p, king, 1000, { element: 'phys' }, ev()), Math.round(1000 * conf.thawMult));
  // 大ふぶきの 前ぶれは こおっている 時だけ
  assert.equal(arenaCond(b, king, 'arFrozen'), false);
  // 雪の子: とけた 王者を こおらせる
  assert.equal(arenaCond(b, kid, 'arKingThawed'), true);
  assert.equal(arenaCond(b, king, 'arThawWait'), false, 'すぐには 自分で こおらない');
  const e4 = ev();
  assert.ok(arenaEffect(b, kid, ABILITIES.m_ar11_snow_breath, ABILITIES.m_ar11_snow_breath.effect, e4));
  assert.equal(king.arFrozen, true);
  assert.ok(e4.lines.some((l) => l.includes(kid.name)), e4.lines.join(' / '));
  assert.equal(arenaCond(b, kid, 'arKingThawed'), false);
  // 自分で こおる: とけて から wait 回 動いた あと
  arenaDamage(b, p, king, need + 10, { element: 'fire' }, ev());
  assert.equal(king.arFrozen, false);
  king.used = { ...(king.used || {}), attack: (king.used?.attack || 0) + conf.wait };
  assert.equal(arenaCond(b, king, 'arThawWait'), true);
  arenaEffect(b, king, ABILITIES.m_ar11_refreeze, ABILITIES.m_ar11_refreeze.effect, ev());
  assert.equal(king.arFrozen, true);
});

// ───────────── モンスター闘技場 ランクEX ─────────────
test('モンスター闘技場 ランクEX: SSS の つぎ・第7章クリアで 開く・おすすめ Lv84・王者は 色ちがい・くりかえして 装備は もらえない', () => {
  assert.deepEqual(MONARENA_RANK_IDS.slice(-3), ['SS', 'SSS', 'EX']);
  const R = monRankInfo('EX'), S3 = monRankInfo('SSS');
  assert.deepEqual([R.lv, R.need, R.legend], [84, 'c7_clear', true]);
  assert.equal(monRankLabel('EX'), '伝説の部・ランクEX');
  assert.ok(R.lv > S3.lv && R.foeLv >= S3.foeLv);
  for (const s of [R.title, R.hint, R.lock]) noBad(s);
  assert.equal(R.fights.length, 3);
  for (const f of R.fights.slice(0, 2)) for (const sp of f) assert.ok(MONSTERS_C7[sp] || MONSTERS_C7S[sp], `EX: ${sp} は 第7章の 魔物`);
  const champ = MONSTERS[monChampOf(R)];
  assert.ok(champ?.variant && champ.noBefriend, '王者は 色ちがい');
  assert.ok(MONSTERS_C7[champ.variant.base] || MONSTERS_C7S[champ.variant.base]);
  noBad(champ.name);
  // ごほうび: SS・SSS と おなじ 形（色の石・限界の石・種）。装備は 入れない
  for (const [id, n] of R.first.items) assert.ok(ITEMS[id] && n > 0 && !EQ.includes(ITEMS[id].type), id);
  assert.ok(R.first.items.some(([id]) => id === 'limit_stone') && R.first.items.some(([id]) => id === 'color_stone'));
  assert.ok(R.first.medals >= S3.first.medals && R.repeatGold > S3.repeatGold && R.repeatMedal);
  assert.equal(MONARENA_RANKS[MONARENA_RANKS.length - 1], R);
  // 開く: c7_clear と SSS
  const flags = new Set(['monster_bond', 'c1_clear', 'c2_clear', 'c3_clear', 'c4_clear', 'c5_gaia', 'c5_clear', 'c6_clear', 'c7_karim']);
  const flag = (f) => flags.has(f);
  const c = {};
  for (const id of MONARENA_RANK_IDS.slice(0, -2)) noteMonClear(c, id, 1);
  assert.equal(monRankOpen('EX', flag, c).why, 'story');
  flags.add('c7_clear');
  assert.equal(monRankOpen('EX', flag, c).why, 'prev');
  noteMonClear(c, 'SSS', 2);
  assert.ok(monRankOpen('EX', flag, c).ok);
});
