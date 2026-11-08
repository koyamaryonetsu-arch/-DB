// 第65回 C: やりこみを 第2部の 強さに（物語の 敵が Lv68〜76 に なった）
// ・宝の地図 … 上限 Lv25 → 35。Lv26 からは 第5章〜第7章 第1幕の 魔物（TM_THEMES の deep）・主の 倍率（シミュレーターで 決めた）・
//   ランク10 の ★5（3だん）。宝箱の レア装備の 出やすさは Lv25 の まま（第64回: 装備が 手に入りすぎない ように）
// ・闘技場 … 伝説の部 ランク9（第6章クリア）・ランク10（第7章 第1幕の あと）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import {
  TM_LV_MAX, TM_DEEP_FROM, TM_THEMES, THEME_KEYS, TM_BOSS_POW, TM_CAVE_POW, TM_DEEP_POW, tmCavePow, tmPoolOf, enemyLvOf, bossLvOf, tmBossPow,
  ensureEncounterTable, dropMapLevel, nextMapLevel, parseFloorId, floorMapId, repairTreasureMaps, chestLoot, equipRankOf, caveInfo,
} from '../public/js/shared/data/treasure.js';
import {
  tmGearRank, tmGearStep, tmStepOf, tmRarityWeights, pickTmGear, rareIds, starsOf, rareWhereText, luckyShoesRate, TM_RARE_LV_CAP, TM_THEME_GROUPS,
} from '../public/js/shared/data/rare-loot.js';
import { TM_DEEP_K } from '../public/js/shared/data/items-rare.js';
import { buildTreasureFloor } from '../public/js/shared/maps/treasure-cave.js';
import {
  ARENA_RANKS, ARENA_MAX_RANK, ARENA_LEGEND_RANK, rankOpen, visibleRanks, noteClear, rankInfo,
} from '../public/js/shared/data/arena.js';
import { champOf, clearRewards } from '../public/js/shared/world/arena.js';
import { ARENA_BIG } from '../public/js/shared/battle-arena.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { newCharacter, itemCount } from '../public/js/shared/stats.js';
import { NEWS } from '../public/js/shared/data/news.js';
import { checkText } from '../tools/kanji-check.mjs';
import { makeRng } from '../public/js/shared/rng.js';

const EQ = ['weapon', 'armor', 'shield', 'head', 'acc'];
const MATS = ['iron_shard', 'beast_fang', 'magic_powder', 'silver_shard', 'star_shard', 'limit_stone'];
const speciesOf = (zone) => [...new Set(ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map(([sp]) => sp)))];

// ───────────── 宝の地図 ─────────────
// 第68回 C: 上限 35 → 40・Lv36 から 第7章の 魔物・だん13（test/tiers-r68.test.js）。ここは Lv35 までの きまりを 見る
test('宝の地図: 上限 Lv35（洞窟の 魔物は Lv79 から）。セーブ・ID・洞窟が Lv35 まで つかえる', () => {
  assert.equal(TM_LV_MAX, 40);
  assert.equal(TM_DEEP_FROM, 26);
  assert.ok(enemyLvOf(35, 1) >= 79);
  const tm = { seed: 123456, lv: 35, map: 'overworld', x: 40, y: 40 };
  const p = parseFloorId(floorMapId(tm, 2));
  assert.equal(p.lv, 35);
  assert.equal(parseFloorId(floorMapId({ ...tm, lv: TM_LV_MAX + 1 }, 1)), null, 'Lv41 は ない');
  const m = buildTreasureFloor(floorMapId(tm, 1));
  assert.ok(m && m.enemyCurve && m.enemyLv === enemyLvOf(35, 1));
  assert.equal(m.enemyPow, TM_DEEP_POW);
  assert.equal(buildTreasureFloor(floorMapId({ ...tm, lv: 25 }, 1)).enemyPow, TM_CAVE_POW, 'Lv25 までは 前の まま');
  assert.equal(tmCavePow(25), TM_CAVE_POW);
  assert.ok(TM_DEEP_POW > 0.9 && TM_DEEP_POW <= 1);
  const c = { treasureMaps: [{ seed: 9, lv: 35, map: 'overworld', x: 3, y: 4 }, { seed: 10, lv: 99, map: 'overworld', x: 3, y: 4 }] };
  repairTreasureMaps(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.lv), [35, TM_LV_MAX]);
});

test('拾う 地図の レベル: 第7章の 強い 魔物から Lv30 より 上の 地図が 自然に 出る（上限は 35）', () => {
  const rng = makeRng(65);
  const at = (eLv) => Array.from({ length: 300 }, () => dropMapLevel(rng, eLv));
  const ch7 = at(72);
  assert.ok(Math.min(...ch7) >= 30 && Math.max(...ch7) <= 33, `第7章 第1幕 Lv72: ${Math.min(...ch7)}〜${Math.max(...ch7)}`);
  assert.ok(at(76).some((x) => x >= 34), '第7章 第2幕 Lv76 から Lv34 も');
  assert.ok(Math.max(...at(99)) === TM_LV_MAX && Math.min(...at(99)) === TM_LV_MAX);
  // 主を たおした あとの 地図も 上限まで
  const next = Array.from({ length: 200 }, () => nextMapLevel(rng, TM_LV_MAX - 1));
  assert.ok(next.includes(TM_LV_MAX) && Math.max(...next) === TM_LV_MAX);
});

test('洞窟の 魔物: Lv26〜35 は その レベルに 合う 第5章〜第7章 第1幕の 魔物（物語の ボス・配合だけの 魔物は 出ない）', () => {
  // deep の 魔物は ふつうの 場所に 出る 魔物（宝の洞窟の 出現表で ない）
  const normal = new Set(Object.entries(ENCOUNTER_TABLES).filter(([z]) => !/^tm\d/.test(z)).flatMap(([z]) => speciesOf(z)));
  for (const th of THEME_KEYS) {
    const deep = TM_THEMES[th].deep;
    assert.ok(deep.length >= 12, th);
    for (const sp of deep) {
      const m = MONSTERS[sp];
      assert.ok(m, `${th}: ${sp}`);
      assert.ok(!m.boss && !m.tmBoss && !m.breedOnly && !m.rare && !sp.startsWith('tm_') && !sp.startsWith('ar_'), `${th}: ${sp} は ふつうの 魔物`);
      assert.ok(m.lv >= 40, `${th}: ${sp}（Lv${m.lv}）は 第5章から`);
      assert.ok(normal.has(sp), `${th}: ${sp} は 物語の 場所に 出る 魔物`);
      for (const a of m.actions || []) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
    }
  }
  for (let lv = TM_DEEP_FROM; lv <= 35; lv++) {
    const L = enemyLvOf(lv, 1);
    for (const th of THEME_KEYS) {
      const sps = speciesOf(ensureEncounterTable(lv, th));
      const pool = new Set(tmPoolOf(lv, th));
      assert.ok(sps.length >= 4, `地図Lv${lv} ${th}`);
      for (const sp of sps) {
        assert.ok(pool.has(sp) && TM_THEMES[th].deep.includes(sp), `地図Lv${lv} ${th}: ${sp}`);
        // その レベルに 近い 魔物（もとの レベルが 洞窟の 魔物より 12 より 下では ない・上すぎない）
        assert.ok(MONSTERS[sp].lv <= L + 1 && MONSTERS[sp].lv >= L - 12, `地図Lv${lv}（魔物Lv${L}）${th}: ${sp} Lv${MONSTERS[sp].lv}`);
      }
    }
  }
  // Lv25 までの 洞窟は 前と おなじ（deep は 入らない）
  for (const lv of [1, 10, 25]) {
    for (const th of THEME_KEYS) {
      assert.deepEqual(tmPoolOf(lv, th), TM_THEMES[th].pool);
      for (const sp of speciesOf(ensureEncounterTable(lv, th))) assert.ok(TM_THEMES[th].pool.includes(sp), `地図Lv${lv} ${th}: ${sp}`);
    }
  }
});

test('洞窟の 主: Lv26〜35 の 倍率（シミュレーターで 決めた 数・だんだん 小さく・Lv35 より 上は おなじ）', () => {
  // node tools/sim-boss.mjs 30 tm 26,28,30,32,35 … 主の レベル＋3 の 4人・その ころの 店・完全オートで 82〜88%
  assert.deepEqual(TM_BOSS_POW.slice(-5, -1), [[25, 0.66], [26, 0.74], [30, 0.74], [35, 0.73]]);
  assert.equal(TM_BOSS_POW[TM_BOSS_POW.length - 1][0], TM_LV_MAX);
  for (let i = 1; i < TM_BOSS_POW.length; i++) assert.ok(TM_BOSS_POW[i][0] > TM_BOSS_POW[i - 1][0], '地図の レベルの じゅん');
  for (const sp of Object.keys(MONSTERS_TM)) {
    for (let L = TM_DEEP_FROM; L < TM_LV_MAX; L++) assert.ok(tmBossPow(L + 1, sp) <= tmBossPow(L, sp), `${sp} Lv${L}`);
    assert.ok(tmBossPow(26, sp) >= 0.6 && tmBossPow(26, sp) <= 0.8, `${sp}: ${tmBossPow(26, sp)}`);
    assert.equal(tmBossPow(TM_LV_MAX + 3, sp), tmBossPow(TM_LV_MAX, sp));
  }
  // 主の レベル（いちばん 深い 洞窟）: Lv26 65.5・Lv35 83.5
  const deepest = (L) => [...Array(4000).keys()].find((x) => caveInfo(x, L).floors === 6);
  assert.equal(bossLvOf(deepest(26), 26), 65.5);
  assert.equal(bossLvOf(deepest(35), 35), 83.5);
});

test('宝箱の 装備: Lv26 から ランク10の ★5（3だん）。強さは だんで 上がり、物語の 宝箱の 少し あと', () => {
  assert.deepEqual([1, 4, 6, 8, 10, 12, 25].map(tmGearRank), [2, 4, 5, 6, 7, 8, 8], 'Lv25 までは 前の まま');
  for (let lv = 26; lv <= 35; lv++) assert.equal(tmGearRank(lv), 10);
  assert.deepEqual([25, 26, 29, 30, 32, 33, 35].map(tmGearStep), [8, 10, 10, 11, 11, 12, 12]);
  assert.ok(equipRankOf(35) <= 9, '店の 装備は ランク9まで');
  const deep = rareIds('tm').filter((id) => ITEMS[id].tmStep);
  assert.equal(deep.length, 24);
  for (const id of deep) {
    const it = ITEMS[id];
    assert.equal(it.rank, 10, id);
    assert.ok([10, 11, 12, 13].includes(it.tmStep), id);
    assert.equal(starsOf(id), 5, `${id} ★5`);
    assert.ok(it.rarity === 3 || it.rarity === 4, `${id}: レア度 3〜4（5 は ひみつのダンジョンだけ）`);
    assert.equal(rareWhereText(id), '宝の洞窟でしか手に入らない');
    assert.ok(it.desc && it.price === 0 && it.sell > 0, id);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], s);
  }
  // それぞれの 洞窟（土・氷・炎）に どの だんも 2つずつ
  for (const th of THEME_KEYS) {
    for (const step of [10, 11, 12]) {
      const n = deep.filter((id) => TM_THEME_GROUPS[th].includes(ITEMS[id].grp) && ITEMS[id].tmStep === step).length;
      assert.equal(n, 2, `${th} だん${step}`);
    }
  }
  // 強さ: だんが 上がるほど 強い（剣の めやす）・みどりの水の神殿の いちばん 強い 宝箱（1.12×1.62）より 下
  assert.ok(TM_DEEP_K[10] < TM_DEEP_K[11] && TM_DEEP_K[11] < TM_DEEP_K[12] && TM_DEEP_K[12] < 1.12 * 1.62);
  assert.ok(ITEMS.tmd_blizzard_sword.atk < ITEMS.c7t_temple_sword.atk);
  // 宝箱の えらびかた: その だんか 1つ下（ランク10・tm）。Lv25 では 出ない
  for (const lv of [26, 28, 30, 32, 33, 35]) {
    const S = tmGearStep(lv);
    for (const kind of ['normal', 'bossA']) {
      const ws = tmRarityWeights(lv, kind);
      assert.ok(ws.every((w) => w.k >= 3 && w.k <= 4), `Lv${lv} ${kind}`);
      for (let i = 0; i < 120; i++) {
        const theme = THEME_KEYS[i % 3];
        const word = TM_THEMES[theme].words[i % TM_THEMES[theme].words.length];
        const id = pickTmGear(makeRng(i * 13 + lv), lv, { theme, word }, kind);
        const it = ITEMS[id];
        assert.ok(it && it.src === 'tm' && it.rank === 10, `Lv${lv}: ${id}`);
        assert.ok(tmStepOf(it) <= S && tmStepOf(it) >= S - 2, `Lv${lv}: ${id} だん${tmStepOf(it)}`);
        assert.ok(TM_THEME_GROUPS[theme].includes(it.grp), `Lv${lv} ${theme}: ${id}`);
      }
    }
  }
  for (let i = 0; i < 200; i++) {
    const id = pickTmGear(makeRng(i), 25, { theme: 'earth', word: '岩' }, i % 2 ? 'bossA' : 'normal');
    assert.ok(!ITEMS[id].tmStep && ITEMS[id].rank <= 8, `Lv25: ${id}`);
  }
});

test('宝箱の レア装備の 出やすさは Lv25 の まま（第64回 ⑥d の へらしかたを まもる）', () => {
  assert.equal(TM_RARE_LV_CAP, 25);
  assert.equal(luckyShoesRate(35, 'bossA'), luckyShoesRate(25, 'bossA'));
  assert.equal(luckyShoesRate(35, 'normal'), luckyShoesRate(25, 'normal'));
  const rate = (lv, kind) => {
    let eq = 0, mat = 0, shop = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const r = chestLoot(makeRng(i * 31 + 7), lv, kind, { theme: THEME_KEYS[i % 3], word: '炎' });
      const it = ITEMS[r.item];
      if (EQ.includes(it?.type)) {
        eq++;
        if (it.src !== 'tm' && r.item !== 'koufuku_kutsu') shop++;
      }
      if (MATS.includes(r.item)) mat++;
    }
    return { eq: eq / N, mat: mat / N, shop: shop / N };
  };
  const a = rate(25, 'normal'), b = rate(35, 'normal');
  // ふつうの 宝箱: レア 14%（0.04＋0.004×25）＋ 店の 装備 5%・素材 10%
  assert.ok(Math.abs(a.eq - b.eq) < 0.02, `Lv25 ${a.eq} / Lv35 ${b.eq}`);
  assert.ok(b.eq < 0.21 && b.mat > 0.08, `Lv35 装備 ${b.eq}・素材 ${b.mat}`);
  // 主の 宝箱: 半分は レア・のこりは 素材（店の 装備は 出ない）
  const boss = rate(35, 'bossA');
  assert.ok(boss.eq > 0.44 && boss.eq < 0.56 && boss.shop === 0 && boss.mat > 0.44, JSON.stringify(boss));
});

// ───────────── 闘技場 ─────────────
test('闘技場: 伝説の部 ランク9（第6章クリア・Lv66）と ランク10（第7章 第1幕の あと・Lv74）', () => {
  assert.equal(ARENA_MAX_RANK, 11);
  assert.equal(ARENA_LEGEND_RANK, 8);
  assert.equal(rankInfo(ARENA_LEGEND_RANK).champ, '伝説のチャンピオン');
  const r9 = rankInfo(9), r10 = rankInfo(10);
  assert.deepEqual([r9.lv, r9.needFlag, r9.legend], [66, 'c6_clear', true]);
  assert.deepEqual([r10.lv, r10.needFlag, r10.legend], [74, 'c7_karim', true]);
  for (const R of [r9, r10]) {
    assert.equal(R.battles.length, 3);
    for (const s of [R.champ, R.hint, R.lockText]) assert.deepEqual(checkText(s), [], s);
    R.battles.forEach((enc, i) => {
      const e = FIXED_ENCOUNTERS[enc];
      assert.ok(e && e.arena && e.bg === 'arena' && e.canFlee === false && e.loseOk === true, enc);
      for (const [sp] of e.group) {
        const m = MONSTERS[sp];
        assert.ok(m, `${enc}: ${sp}`);
        for (const a of m.actions) if (a.id !== 'attack') assert.ok(ABILITIES[a.id], `${sp}: ${a.id}`);
        if (i < 2) assert.ok(!m.boss && !m.breedOnly, `${enc}: ${sp} は ふつうの 魔物`);
      }
      // 1・2戦目は 今 ある 魔物を ランクの レベルに（enemyLv）・3戦目は 王者
      if (i < 2) assert.ok(Math.abs(e.enemyLv - R.lv) <= 2, `${enc}: Lv${e.enemyLv}`);
      else assert.ok(e.boss && !e.enemyLv, enc);
    });
    const champ = MONSTERS[champOf(R.battles[2])];
    assert.ok(champ?.boss && champ.noBefriend, `ランク${R.rank}の 王者`);
    assert.ok(!Object.keys(MONSTERS).includes(champOf(R.battles[2])), '王者は 図鑑に 出ない');
    // え は 今の 魔物の え の 色がえ
    for (const [sp] of FIXED_ENCOUNTERS[R.battles[2]].group) {
      const m = MONSTERS[sp];
      assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえの え`);
      for (const s of [m.name, m.desc, ...(m.phases || []).flatMap((p) => p.msg || [])]) assert.deepEqual(checkText(s), [], s);
    }
  }
  assert.equal(champOf('ar10_3'), 'ar_regulus');
  // 王者たちの 技の ことば・大技は 知っている 人が 身を 守る
  for (const id of Object.keys(ABILITIES).filter((k) => /^m_ar(9|10)_/.test(k))) {
    const a = ABILITIES[id];
    for (const s of [a.name, a.cast, a.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
  for (const id of ['m_ar9_fire_blast', 'm_ar9_ice_blast', 'm_ar10_combo']) assert.ok(ARENA_BIG.has(id), id);
  // ふたごの 竜（ランク4と おなじ しくみ）・星の大王者（よろい＋合体技）
  assert.equal(MONSTERS.ar_fire_drake.arena.twin, 'ar_ice_drake');
  assert.equal(MONSTERS.ar_ice_drake.arena.twin, 'ar_fire_drake');
  assert.ok(MONSTERS.ar_regulus.arena.lead && MONSTERS.ar_regulus.arena.armor && MONSTERS.ar_regulus.arena.team === 'stars');
  assert.ok(['ar_altair', 'ar_vega'].every((id) => MONSTERS[id].arena.team === 'stars'));
});

test('闘技場の ごほうび: ランクごとに 強い アクセサリー 1つ（★5）・きたえる 素材・メダル。2回目からの ゴールドは 上がる', () => {
  const r8 = rankInfo(8);
  let prevGold = r8.repeatGold, prevMedals = r8.first.medals;
  for (const R of [rankInfo(9), rankInfo(10)]) {
    assert.equal(R.first.items.length, 1, `ランク${R.rank}: 強い 品は 1つ`);
    const id = R.first.items[0];
    const it = ITEMS[id];
    assert.equal(it.type, 'acc', id);
    assert.equal(starsOf(id), 5);
    assert.equal(rareWhereText(id), '闘技場のごほうびでしか手に入らない');
    assert.ok(it.price === 0 && it.sell > 0);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], s);
    assert.ok(R.first.mats.length >= 1 && R.first.mats.every(([m, n]) => MATS.includes(m) && ITEMS[m] && n > 0), `ランク${R.rank} 素材`);
    assert.ok(R.first.medals > prevMedals && R.repeatGold > prevGold, `ランク${R.rank}`);
    prevGold = R.repeatGold;
    prevMedals = R.first.medals;
  }
  // ボスの お守り（第7章 第1幕の オクタリア）より 強く ない
  const sum = (x) => Object.values(ITEMS[x].bonus || {}).reduce((a, v) => a + v, 0);
  assert.ok(sum('ar_twin_dragon_charm') < sum('ar_star_king_brooch') && sum('ar_star_king_brooch') < sum('c7t_witch_charm'));
  assert.ok(sum('ar_twin_dragon_charm') > sum('ar_legend_belt'));
  // clearRewards: はじめては 品・素材・メダル / 2回目からは ゴールドと メダル 1まい
  const c = newCharacter({ id: 't', name: 'ソラ', job: 'warrior', look: {} });
  c.gold = 0;
  const run = { world: { now: () => 1000, sendSelf() {}, markDirty() {} }, everyone: [{ char: c }] };
  const lines = JSON.stringify(clearRewards(run, 10));
  assert.equal(itemCount(c, 'ar_star_king_brooch'), 1);
  for (const [m, n] of rankInfo(10).first.mats) assert.equal(itemCount(c, m), n, m);
  assert.ok(lines.includes('星のかけらを8個'), lines);
  assert.equal(Object.keys(c.medalSpots).length, rankInfo(10).first.medals);
  clearRewards(run, 10);
  assert.equal(itemCount(c, 'ar_star_king_brooch'), 1, 'はじめての 品は 1回だけ');
  assert.equal(c.gold, rankInfo(10).repeatGold);
});

test('闘技場: ランク9・10 は 物語の フラグと 1つ前の ランクで 開く（それまでは 名前も 出さない）', () => {
  const flags = new Set(['c4_clear', 'c5_gaia', 'c5_nshadow', 'c5_nocto1']);
  const flag = (f) => flags.has(f);
  const c = { flags: {} };
  for (let n = 1; n <= 8; n++) noteClear(c, n, 1000 + n);
  assert.deepEqual(visibleRanks(flag), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(rankOpen(9, flag, c).why, 'story');
  flags.add('c6_clear');
  assert.deepEqual(visibleRanks(flag), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(rankOpen(9, flag, c).ok);
  flags.add('c7_karim');
  assert.equal(rankOpen(10, flag, c).why, 'prev');
  noteClear(c, 9, 2000);
  assert.ok(rankOpen(10, flag, c).ok);
  assert.deepEqual(visibleRanks(flag), ARENA_RANKS.map((R) => R.rank).filter((n) => n <= 10));
});

test('お知らせ: 第65回 C（宝の地図 Lv35・闘技場の ランク）', () => {
  const n = NEWS.find((x) => x.id === 'r65-tm-arena');
  assert.ok(n);
  assert.ok(n.title.length <= 14 && n.text.length <= 170, `${n.title.length} / ${n.text.length}`);
  for (const s of [n.title, n.text]) assert.deepEqual(checkText(s), [], s);
  // ネタバレなし（王者の 名前は 書かない）
  for (const w of ['レグルス', '竜', 'ヒート', 'クール']) assert.ok(!n.text.includes(w), w);
});
