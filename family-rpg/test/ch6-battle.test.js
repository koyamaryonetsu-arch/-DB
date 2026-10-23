// 第2部 第6章 Step 1・2 B（戦い・品）
// 名前の 約束（docs/plan-ch6.md の 9）・新しい 魔物・出現表（t6_past_field・t6_shrine・t6_ruin_up・t6_ruin_low）・仲間・
// サンドクロック（砂が落ちきると…）と ギアドン（まきもどし）の しかけ・ふつうの オートと 知っている 人・シミュレーション・
// 品（千年前の 里の ランク10の 店・宝箱・ボスの 品・素材・れん金）・★の きまり・ゲストの ミナモ・絵・背景・エフェクト・がめん・文字
// A の マップ・台本は まだ ないので、きまった 戦いは startFixedBattle（台本の ['battle', id] と おなじ）で、
// 仮の 台本（['showMon', id] → ['battle', id]）は テストの 中で 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideMonster } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool } from '../public/js/shared/data/companions.js';
import { regionOf, starsOf, rarityOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { RECIPES } from '../public/js/shared/data/alchemy.js';
import { SHOPS, GUESTS, shopItems } from '../public/js/shared/data/shops.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { canEquip, computeStats } from '../public/js/shared/stats.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { MONSTERS_PAST, PAST_MAT_DROPS, PAST_BOSSES, SAND_CLOCK, GEARDON } from '../public/js/shared/data/monsters-past.js';
import { PAST_ABILITIES } from '../public/js/shared/data/abilities-past.js';
import { FRIENDS_PAST, MINAMO_GUEST } from '../public/js/shared/data/companions-past.js';
import { ENCOUNTERS_PAST, FIXED_PAST, ZONE_BG_PAST, PAST_VARIANTS } from '../public/js/shared/data/encounters-past.js';
import {
  ITEMS_PAST, PAST_SHOP_WEAPONS, PAST_SHOP_ARMOR, PAST_SHOP_TOOLS, PAST_TREASURE, PAST_RUIN_FLOORS, PAST_DROPS, PAST_RECIPES, PAST_ITEM_KANA, PAST_K,
} from '../public/js/shared/data/items-past.js';
import { SHOPS_PAST } from '../public/js/shared/data/shops-past.js';
// 第6章 Step 3・4 の 星めぐりの古道の 品（items-road.js。この 章の あとの 品なので くらべない）
import { ITEMS_ROAD } from '../public/js/shared/data/items-road.js';
import { HANONO9_SHOP_WEAPONS, HANONO9_SHOP_ARMOR } from '../public/js/shared/data/items-earth.js';
import { CASTLE_TREASURE } from '../public/js/shared/data/items-castle.js';
import { FALL, FALL_CHARGE, RECORD, REWIND, PRESS, AUTO_GUARD, ch6Plan, elemHit } from '../public/js/shared/battle-ch6.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { ch6Run, ch6Party, CH6_KIT, CH6_LV } from '../tools/sim-ch6.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { PAST_BG, PAST_DECOS, drawPastBg, drawPastFloorBg } from '../public/js/client/render/ch6-past-bg.js';
import { playCh6Fx } from '../public/js/client/render/battlefx-ch6.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { CH6_SCREEN_ANIMS, CH6_ALLY_FX, CH6_SFX, CH6_OWN_TELE, ch6Draw, ch6Present } from '../public/js/client/battle-ch6.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_PAST).filter((id) => !PAST_BOSSES.includes(id));
const FIELD = ['moss_deer', 'amber_moth', 'elder_sprout', 'toki_hare'];
const SHRINE = ['sand_sprite', 'glass_scorpion', 'sand_golem'];
const RUIN_UP = ['gear_beetle', 'ruin_sentinel', 'pendulum_bat'];
const RUIN_LOW = ['chrono_knight', 'rewind_ghost', 'clock_spider'];
const PARTY = (lv = 58) => [makeChar('warrior', lv, 10, 'せんし', 58), makeChar('priest', lv, 10, 'そうりょ', 58), makeChar('mage', lv, 10, 'まほう', 58), makeChar('monk', lv, 10, 'ぶとう', 58)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [SAND_CLOCK], boss: true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
// ボスの 1回の 行動（battle.js の executeNext。行動の はじめの towerTurnStart → ch6TurnStart も 動く）。cmd … 'ai' か 何も しない 技
function bossAct(b, m, cmd = { type: 'ability', id: 'm_pm_dazzled' }) {
  b.queue = [{ id: m.id, cmd, last: true }];
  m.queued = true;
  b.flush();
  b.executeNext();
  return b.flush().find((e) => e.t === 'act' && e.id === m.id);
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 9）: 出現表・きまった 戦い・背景・曲・店・宝箱・ゲスト', () => {
  for (const t of ['t6_past_field', 't6_shrine', 't6_ruin_up', 't6_ruin_low']) assert.equal(ENCOUNTER_TABLES[t], ENCOUNTERS_PAST[t], t);
  assert.deepEqual(ZONE_BG_PAST, { t6_past_field: 'past_field', t6_shrine: 'toki_shrine', t6_ruin_up: 'toki_ruin', t6_ruin_low: 'toki_ruin' });
  for (const [t, bg] of Object.entries(ZONE_BG_PAST)) assert.equal(ZONE_BG[t], bg);
  for (const id of ['sand_clock', 'geardon']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_PAST[id]);
    assert.deepEqual(f.group, [[id, 1, 1]], `${id}: 魔物の ID も おなじ`);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk, id);
    assert.equal(f.bgm, 'boss6', `${id}: 曲は A の boss6`);
  }
  assert.equal(FIXED_ENCOUNTERS.sand_clock.bg, 'toki_shrine');
  assert.equal(FIXED_ENCOUNTERS.geardon.bg, 'toki_ruin_boss');
  for (const bg of ['past_field', 'toki_shrine', 'toki_ruin', 'toki_ruin_boss']) assert.ok(battleBgSpec(bg) && PAST_BG[bg], bg);
  // 店（data/shops-past.js）と 品の ならび（data/items-past.js）
  assert.deepEqual(Object.keys(SHOPS_PAST), ['past_weapon', 'past_armor', 'past_item']);
  assert.equal(SHOPS_PAST.past_weapon.items, PAST_SHOP_WEAPONS);
  assert.equal(SHOPS_PAST.past_armor.items, PAST_SHOP_ARMOR);
  assert.equal(SHOPS_PAST.past_item.items, PAST_SHOP_TOOLS);
  for (const id of Object.keys(SHOPS_PAST)) assert.equal(SHOPS[id], SHOPS_PAST[id], `${id}: shops.js に まざる`);
  assert.deepEqual(Object.keys(PAST_TREASURE).sort(), ['overworld_past', 'toki_ruin', 'toki_shrine']);
  // ゲスト
  assert.equal(MINAMO_GUEST.name, 'ミナモ');
  assert.equal(GUESTS.minamo, MINAMO_GUEST);
});

// ───────────── 魔物 ─────────────
test('魔物: 新しい 13しゅ（フィールド 4・時のほこら 3・時のいせき 3＋3）。レベル・空の レアの 地方 6・弱点・技・せつめい', () => {
  assert.deepEqual(NEW.sort(), [...FIELD, ...SHRINE, ...RUIN_UP, ...RUIN_LOW].sort());
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_PAST[id]);
    assert.ok(!m.boss && m.desc && m.desc.length > 20, id);
    assert.equal(regionOf(id), 6, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    // 弱点が 1つ いじょう（1.3ばい いじょう）
    assert.ok(Object.values(m.resist).some((v) => v >= 1.3), `${id}: 弱点`);
  }
  // おすすめ Lv（plan-ch6.md の 8）: 時のほこら 56〜57・フィールド 57〜58・いせき 58〜60
  for (const id of SHRINE) assert.ok(MONSTERS[id].lv >= 56 && MONSTERS[id].lv <= 57, id);
  for (const id of FIELD) assert.ok(MONSTERS[id].lv >= 57 && MONSTERS[id].lv <= 58, id);
  for (const id of [...RUIN_UP, ...RUIN_LOW]) assert.ok(MONSTERS[id].lv >= 58 && MONSTERS[id].lv <= 60, id);
  // 時のほこらの 魔物は 氷が よく 効く（サンドクロックの しかけの 練習）
  for (const id of SHRINE) assert.ok(MONSTERS[id].resist.ice >= 1.3, id);
  // 技: 名前・せつめい・えんしゅつ・ことば
  for (const a of Object.values(PAST_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  // ボス
  for (const [id, lv, kind] of [[SAND_CLOCK, 58, 'sand'], [GEARDON, 61, 'gear']]) {
    const m = MONSTERS[id];
    assert.ok(m.boss && m.turns === 2 && m.lv === lv && m.ch6?.kind === kind, id);
    assert.ok(!MONSTER_FRIENDS[id], `${id}: 仲間に ならない`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
  }
  assert.equal(MONSTERS.sand_clock.name, 'サンドクロック');
  assert.equal(MONSTERS.geardon.name, 'ギアドン');
  // 色ちがい
  for (const v of PAST_VARIANTS) assert.ok(MONSTERS[v]?.variant && MONSTER_ART[MONSTERS[v].art], v);
});

test('落とす物: ボスは かならず 1人 1つの ★5（レア度3）と、いちばん めずらしい 色の ★5の 武器。第1部の さいごの ★5より 少し 強い', () => {
  for (const [id, [acc, weapon]] of Object.entries(PAST_DROPS)) {
    assert.deepEqual(MONSTERS[id].drops.boss, [acc], id);
    assert.deepEqual(MONSTERS[id].drops.rare, [weapon, 1], id);
    const rng = makeRng(4);
    for (let i = 0; i < 20; i++) {
      const got = rollDrops(id, rng);
      assert.ok(got.includes(acc) && got.includes(weapon), `${id}: かならず ${got}`);
    }
    assert.ok(monsterDrops(id).some((d) => d.item === acc && d.rate === 1));
    const a = ITEMS[acc], w = ITEMS[weapon];
    assert.ok(a.type === 'acc' && a.unique && a.rank === 10 && rarityOf(acc) === 3, acc);
    assert.ok(w.type === 'weapon' && w.rank === 10 && rarityOf(weapon) === 5 && !w.unique, weapon);
    for (const x of [acc, weapon]) {
      assert.equal(starsOf(x), 5, x);
      assert.equal(rareWhereText(x), '時の魔物からしか手に入らない');
      assert.ok(ITEMS[x].boss === id && ITEMS[x].src === 'pastboss');
    }
  }
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  const [sp, gc] = [ITEMS.p6_sand_pendant, ITEMS.p6_gear_charm];
  assert.ok(bsum(ITEMS.solitus_bond_star) < bsum(sp) && bsum(sp) < bsum(gc), 'アクセサリー: きずなの星 < 砂時計のペンダント < 大歯車のお守り');
  // ときをきざむ剣は 今までで いちばん 強い 剣（Step 3・4 の 古道の 品は のぞく）
  const swords = Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === 'sword' && !it.base && !ITEMS_ROAD[id]);
  const top = swords.sort((x, y) => y[1].atk - x[1].atk)[0];
  assert.equal(top[0], 'p6_tick_sword');
  assert.ok(ITEMS.p6_tick_sword.atk > ITEMS.solitus_dawn_sword.atk && ITEMS.p6_tick_sword.atk > ITEMS.p6_ruin_sword.atk);
  // 砂時計のつえは 今までで いちばん 強い つえ
  const staves = Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === 'staff' && !it.base && !ITEMS_ROAD[id]).sort((x, y) => y[1].atk - x[1].atk);
  assert.equal(staves[0][0], 'p6_sand_staff');
  // 素材（時の砂・古い歯車）
  for (const id of NEW) {
    assert.equal(MAT_DROPS[id], PAST_MAT_DROPS[id], id);
    assert.equal(MAT_DROPS[id][0], [...RUIN_UP, ...RUIN_LOW].includes(id) ? 'p6_old_gear' : 'p6_time_sand', id);
  }
  for (const m of ['p6_time_sand', 'p6_old_gear']) assert.equal(ITEMS[m].type, 'mat');
});

test('仲間: 新しい 13しゅは 仲間に なる（1/14〜1/24・系統配合の 子には ならない）。ボスは ならない', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_PAST[id], id);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 14, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    assert.ok(f.names.length >= 3 && f.note, id);
    for (const [, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!['scFall', 'gdRecord', 'gdRewind', 'telegraph'].includes(ABILITIES[ab].effect.type), `${id}: ${ab}`);
    }
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.3, `${id}: ${sum}`);
  }
  for (const id of ['sand_golem', 'ruin_sentinel', 'chrono_knight', 'moss_deer']) assert.ok(MONSTER_FRIENDS[id].rate <= 1 / 20, id);
});

test('出現表: どの 表も 今の 魔物が いる・数は 0〜3。階ごとに ちがう 組（今の 魔物も 少し）', () => {
  const sps = (t) => new Set(ENCOUNTERS_PAST[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const list of Object.values(ENCOUNTERS_PAST)) {
    for (const e of list) {
      assert.ok(e.w > 0);
      for (const [sp, mn, mx] of e.group) {
        assert.ok(MONSTERS[sp], sp);
        assert.ok(mn >= 0 && mx >= mn && mx <= 3);
      }
      assert.ok(e.group.some(([, mn]) => mn >= 1), '1体は かならず 出る');
    }
  }
  for (const [t, ids] of [['t6_past_field', FIELD], ['t6_shrine', SHRINE], ['t6_ruin_up', RUIN_UP], ['t6_ruin_low', RUIN_LOW]]) for (const id of ids) assert.ok(sps(t).has(id), `${t}: ${id}`);
  assert.ok(sps('t6_past_field').has('root_sprite'), '根っこのこびと');
  assert.ok(sps('t6_ruin_up').has('clockwork_guard'), 'からくりの守り手（むかしの 勇者の 時代の からくり）');
  for (const id of RUIN_LOW) assert.ok(!sps('t6_ruin_up').has(id), `${id} は 下の 階だけ`);
});

// ───────────── サンドクロック ─────────────
test('サンドクロック: 動く たびに 砂が 落ちる → 落ちきると かならず 前ぶれ → 大砂流（身を 守ると 半分）。おわると 砂は いっぱい', () => {
  const { b, m, a } = battle({ seed: 21 });
  m.hp = m.maxHp = 999999;
  const conf = MONSTERS[SAND_CLOCK].ch6.sand;
  assert.deepEqual([m.sand.lv, m.sand.max], [conf.max, conf.max]);
  assert.equal(pub(m).sand, conf.max);
  assert.equal(pub(m).sandMax, conf.max);
  for (let i = conf.max - 1; i >= 1; i--) {
    const ev = bossAct(b, m);
    assert.equal(m.sand.lv, i);
    assert.equal(ev.scSand.lv, i);
    if (i === 1) assert.ok(has(ev, 'あと1つ'), 'あと1つで 知らせる');
  }
  // 砂が 0: かならず 最後の砂（前ぶれ）
  const ev0 = bossAct(b, m, { type: 'ai' });
  assert.equal(m.sand.lv, 0);
  assert.equal(ev0.ability, FALL_CHARGE);
  assert.equal(m.telegraph, FALL);
  assert.ok(pub(m).telegraph);
  // 大砂流: 身を 守った 人は 半分くらい
  a[1].defending = true;
  for (const x of a) x.hp = x.maxHp = 99999;
  const ev = bossAct(b, m, { type: 'ai' });
  assert.equal(ev.ability, FALL);
  assert.ok(ev.scFall && has(ev, 'ひっくり返った'));
  assert.equal(m.sand.lv, m.sand.max, '砂は また いっぱい');
  assert.equal(m.telegraph, null);
  const dmg = (t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
  assert.ok(dmg(a[0]) > 0 && dmg(a[1]) > 0);
  // そうりょ（守り 低め）が 身を 守ると、せんしより 小さい
  assert.ok(dmg(a[1]) < dmg(a[0]), `${dmg(a[1])} < ${dmg(a[0])}`);
});

test('サンドクロック: 氷を 当てると 砂が こおって もどる（1回の 行動で 1回）。前ぶれの 間に 氷を 当てると 大砂流は 止まる', () => {
  const { b, m, a } = battle({ seed: 22 });
  m.hp = m.maxHp = 999999;
  const conf = MONSTERS[SAND_CLOCK].ch6.sand;
  m.sand.lv = 2;
  const e1 = evOf(a[2]);
  b.damage(a[2], m, 100, e1, { element: 'ice' });
  b.damage(a[2], m, 100, e1, { element: 'ice' });
  assert.equal(m.sand.lv, 2 + conf.ice, '1回の 行動で 1回だけ');
  assert.ok(e1.scBack && has(e1, '上にもどった'));
  // 氷で ない ダメージは かわらない
  const e2 = evOf(a[0]);
  b.damage(a[0], m, 100, e2, { element: 'fire' });
  assert.equal(m.sand.lv, 2 + conf.ice);
  // 砂が いっぱいの ときは もどらない
  m.sand.lv = m.sand.max;
  const e3 = evOf(a[2]);
  b.damage(a[2], m, 100, e3, { element: 'ice' });
  assert.equal(m.sand.lv, m.sand.max);
  // 前ぶれの 間: 止まる（砂は stopTo）
  m.sand.lv = 0;
  m.telegraph = FALL;
  const e4 = evOf(a[2]);
  b.damage(a[2], m, 100, e4, { element: 'ice' });
  assert.equal(m.telegraph, null);
  assert.equal(m.sand.lv, conf.stopTo);
  assert.ok(e4.scStop === m.id && has(e4, '止まった'));
  // 敵どうしの 氷では 止まらない
  m.telegraph = FALL;
  const e5 = evOf(m);
  b.damage(m, m, 100, e5, { element: 'ice' });
  assert.equal(m.telegraph, FALL);
});

test('サンドクロック: HPが へると 砂の いっぱいが へる（はやく 落ちきる）', () => {
  const { b, m } = battle({ seed: 23 });
  const conf = MONSTERS[SAND_CLOCK].ch6.sand;
  m.hp = Math.floor(m.maxHp * (conf.fastAt - 0.05));
  const ev = bossAct(b, m);
  assert.equal(m.sand.max, conf.fast);
  assert.equal(m.sand.lv, conf.fast - 1);
  assert.ok(has(ev, 'はやくなった'));
});

// ───────────── ギアドン ─────────────
test('ギアドン: gear.every 回 動くと かならず 時を覚える → wind 回で まきもどし（覚えた ときの HPまで もどる）', () => {
  const { b, m, a } = battle({ seed: 31, enemies: [GEARDON] });
  const conf = MONSTERS[GEARDON].ch6.gear;
  for (let i = 1; i < conf.every; i++) {
    bossAct(b, m);
    assert.equal(m.gear.count, i);
    assert.equal(m.telegraph, null);
  }
  const ev = bossAct(b, m, { type: 'ai' });
  assert.equal(ev.ability, RECORD);
  assert.ok(ev.gdRecord && has(ev, '雷の攻撃を2回'));
  assert.equal(m.gear.rec, m.hp);
  assert.equal(m.gear.left, conf.wind);
  assert.equal(pub(m).gearRec, 1);
  // 覚えて いる 間は ギアプレスの 前ぶれを しない
  assert.equal(decideMonster.length, 2);
  const rec = m.gear.rec;
  // キズを つける（雷で ない）
  const e1 = evOf(a[0]);
  b.damage(a[0], m, 3000, e1, { element: 'phys' });
  assert.equal(m.hp, rec - 3000);
  assert.ok(!e1.gdSpark && !e1.gdBolt);
  for (let i = conf.wind - 1; i >= 1; i--) {
    const e = bossAct(b, m);
    assert.equal(m.gear.left, i);
    assert.ok(has(e, 'まきもどしまで'));
  }
  const ev2 = bossAct(b, m, { type: 'ai' });
  assert.equal(ev2.ability, REWIND);
  assert.equal(ev2.gdRewind.heal, 3000);
  assert.equal(m.hp, rec, '覚えた ときの HPに もどる');
  assert.equal(m.gear.rec, null);
  assert.equal(m.gear.count, 0);
});

test('ギアドン: 覚えて いる 間に 雷を 2回（1回の 行動で 1回）当てると 大歯車が こわれる（まきもどしは 止まり、よろめいて 守りが 下がる）', () => {
  const { b, m, a } = battle({ seed: 32, enemies: [GEARDON] });
  const conf = MONSTERS[GEARDON].ch6.gear;
  // 覚えて いない 間の 雷は 数えない
  const e0 = evOf(a[0]);
  b.damage(a[0], m, 100, e0, { element: 'bolt' });
  assert.ok(!e0.gdSpark);
  m.telegraph = RECORD;
  bossAct(b, m, { type: 'ai' });
  assert.ok(m.gear.rec !== null);
  const e1 = evOf(a[0]);
  b.damage(a[0], m, 100, e1, { element: 'bolt' });
  b.damage(a[0], m, 100, e1, { element: 'bolt' });
  assert.equal(m.gear.hits, 1, '1回の 行動で 1回');
  assert.ok(e1.gdSpark && has(e1, 'あと1回'));
  assert.equal(pub(m).gearHits, 1);
  m.queued = true;
  b.queue = [{ id: m.id, cmd: { type: 'ai' }, last: true }];
  m.atb = 50;
  const e2 = evOf(a[1]);
  b.damage(a[1], m, 100, e2, { element: 'bolt' });
  assert.equal(conf.need, 2);
  assert.ok(e2.gdBreak === m.id && has(e2, 'くだけて'));
  assert.equal(m.gear.rec, null);
  assert.equal(m.atb, 0);
  assert.ok(!m.queued && !b.queue.some((q) => q.id === m.id), 'ならんでいた 行動は とりやめ');
  assert.equal(m.debuffs.def.mult, conf.cut);
  assert.equal(m.debuffs.def.left, 3, '3回 行動の 間');
  assert.equal(pub(m).gearRec, 0);
});

test('ギアドン: ギアプレスの 前ぶれ（覚えて いる 間は 出ない）・HPが へると 覚えるのが はやく なる', () => {
  const { b, m } = battle({ seed: 33, enemies: [GEARDON] });
  const conf = MONSTERS[GEARDON].ch6.gear;
  const press = MONSTERS[GEARDON].actions.find((x) => x.id === 'm6_gd_press_charge');
  assert.ok(press.cond.includes('c5:gdIdle'));
  assert.equal(ABILITIES.m6_gd_press_charge.effect.next, PRESS);
  m.gear.rec = m.hp;
  for (let i = 0; i < 40; i++) {
    m.recent = [];
    m.telegraph = null;
    const cmd = decideMonster(b, m);
    assert.notEqual(cmd.id, 'm6_gd_press_charge');
  }
  m.gear.rec = null;
  m.hp = Math.floor(m.maxHp * (conf.fastAt - 0.05));
  m.gear.count = conf.fastEvery - 1;
  m.telegraph = null;
  bossAct(b, m);
  assert.equal(m.telegraph, RECORD, `HPが へると ${conf.fastEvery}回ごと`);
});

// ───────────── オート ─────────────
test('ふつうの オート: 大砂流・ギアプレスが 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る。知っている 人は 氷・雷を 使う', () => {
  const decide = () => ({ type: 'attack', target: 'e1' });
  // ふつうの オート
  let guards = 0, full = 0;
  for (let s = 0; s < 40; s++) {
    const { b, m, a } = battle({ seed: 100 + s });
    m.telegraph = FALL;
    m.atb = 99;
    a[0].hp = Math.floor(a[0].maxHp * 0.5);
    if (ch6Plan(b, a[0], decide)?.type === 'defend') guards++;
    a[0].hp = a[0].maxHp;
    if (ch6Plan(b, a[0], decide)?.type === 'defend') full++;
  }
  assert.ok(guards > 10 && guards < 40, `HPが へっている: ${guards}/40（${AUTO_GUARD.chance}）`);
  assert.equal(full, 0, 'HPが ある ときは 守らない');
  // シミュレーターの しかけを 知らない 人（c6Naive）は 守らない
  const n = battle({ seed: 7 });
  n.b.c6Naive = true;
  n.m.telegraph = FALL;
  n.m.atb = 99;
  n.a[0].hp = 1;
  assert.equal(ch6Plan(n.b, n.a[0], decide), null);
  // 知っている 人: 前ぶれ → 氷（まほう）・氷が ない 人は 身を 守る（せんし）
  const k = battle({ seed: 8 });
  k.b.knowsCh6 = true;
  k.m.telegraph = FALL;
  const ice = ch6Plan(k.b, k.a[2], decide);
  assert.equal(ice.type, 'ability');
  assert.equal(ABILITIES[ice.id].effect.element, 'ice');
  assert.equal(ch6Plan(k.b, k.a[0], decide).type, 'defend');
  // 砂が のこり 1つ: 氷で もどす
  k.m.telegraph = null;
  k.m.sand.lv = 1;
  assert.equal(ABILITIES[ch6Plan(k.b, k.a[2], decide).id].effect.element, 'ice');
  // 砂が ある ときは ふつう
  k.m.sand.lv = 4;
  assert.deepEqual(ch6Plan(k.b, k.a[2], decide), decide());
  // ギアドン: 覚えて いる 間は 雷（勇者）
  const hero = jobChar('hero', 61, 10, '勇者');
  const g = battle({ seed: 9, enemies: [GEARDON], party: [hero, ...PARTY(61).slice(1)] });
  g.b.knowsCh6 = true;
  g.m.gear.rec = g.m.hp;
  const bolt = ch6Plan(g.b, g.a[0], decide);
  assert.equal(ABILITIES[bolt.id].effect.type === 'multi' ? ABILITIES[bolt.id].effect.parts[0].element : ABILITIES[bolt.id].effect.element, 'bolt');
  assert.equal(elemHit(g.b, g.a[1], g.m, 'bolt'), null, 'そうりょは 雷が ない');
});

// ───────────── シミュレーション ─────────────
test('シミュレーション: tools/sim-ch6.mjs（超級職 4人・その ころの ★装備）。どちらも さいごまで 戦える・しかけが 動く', { timeout: 300000 }, () => {
  for (const boss of ['sand', 'gear']) {
    assert.deepEqual(ch6Party(boss, CH6_LV[boss]).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
    for (const [job, k] of Object.entries(CH6_KIT[boss])) for (const id of k) assert.ok(id === null || (ITEMS[id] && canEquip(job, id)), `${boss} ${job}: ${id}`);
  }
  const auto = ch6Run('sand', 58, false, 6060);
  assert.ok(['win', 'lose'].includes(auto.outcome));
  assert.ok(auto.falls >= 1, '知らない 人には 大砂流が 来る');
  assert.equal(auto.duals, 0);
  const know = ch6Run('sand', 58, true, 6060);
  assert.ok(['win', 'lose'].includes(know.outcome));
  assert.ok(know.stops >= 1 && know.duals > 0, JSON.stringify(know));
  const g = ch6Run('gear', 61, true, 6060);
  assert.ok(['win', 'lose'].includes(g.outcome));
  assert.ok(g.records >= 1 && g.breaks >= 1, JSON.stringify(g));
  const gn = ch6Run('gear', 61, true, 6060, { skip: 'trick' });
  assert.ok(gn.rewinds >= 1 && gn.breaks === 0, JSON.stringify(gn));
  // ギアドンの 装備は サンドクロックの 品と 時のいせきの 宝を 使う
  assert.ok(CH6_KIT.gear.daikenja.includes('p6_sand_pendant') && CH6_KIT.gear.hero.includes('p6_ruin_sword'));
});

test('きまった 戦い sand_clock・geardon: 台本の ["showMon", id] → ["battle", id] と おなじ（背景・曲・ボス）。さいごまで 動く', { timeout: 180000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(61), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  for (const [id, bg] of [['sand_clock', 'toki_shrine'], ['geardon', 'toki_ruin_boss']]) {
    ken.s.busy = null;
    const done = startFixedBattle(world, ken.s, [ken.s], id);
    const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
    assert.equal(start.snap.bg, bg);
    assert.equal(start.snap.bgm, 'boss6');
    assert.equal(start.snap.boss, true);
    assert.equal(start.snap.canFlee, false);
    const en = start.snap.combatants.filter((x) => x.side === 'enemy');
    assert.deepEqual(en.map((x) => x.species), [id]);
    if (id === 'sand_clock') assert.ok(en[0].sand === 6 && en[0].sandMax === 6);
    else assert.ok(en[0].gearRec === 0 && en[0].gearNeed === 2);
    await ken.settle(60000);
    const outcome = await done;
    assert.ok(['win', 'lose'].includes(outcome), outcome);
  }
});

// ───────────── 品 ─────────────
test('千年前の 里の 店（ランク10・★1）: 武器 10しゅるい・防具（よろい・マント・ローブ・道着・たて・かぶと・ぼうし）・道具（キメラのつばさは ない）', () => {
  const cats = PAST_SHOP_WEAPONS.map((id) => ITEMS[id].cat);
  assert.deepEqual([...new Set(cats)].sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  const slots = PAST_SHOP_ARMOR.map((id) => { const it = ITEMS[id]; return it.type === 'armor' ? it.armorType : it.type === 'head' ? (it.helm ? 'helm' : 'hat') : it.type; });
  assert.deepEqual(slots.sort(), ['cloth', 'gi', 'hat', 'heavy', 'helm', 'robe', 'shield']);
  for (const id of [...PAST_SHOP_WEAPONS, ...PAST_SHOP_ARMOR]) {
    const it = ITEMS[id];
    assert.ok(it.rank === 10 && it.price > 0 && !it.star && !it.unique && !it.src, id);
    assert.equal(rarityOf(id), 0, id);
    assert.equal(starsOf(id), 1, `${id}: 店の 品は ★1`);
    assert.ok(ITEM_KANA[id], id);
    assert.ok(!it.name.includes('伝説'));
  }
  // ハネノの ランク9の 店の おなじ 種類より 強い（1.1〜1.25ばい）
  const power = (it) => (it.type === 'weapon' ? it.atk : it.def);
  const key = (it) => (it.type === 'weapon' ? it.cat : it.type === 'armor' ? it.armorType : it.type === 'head' ? (it.helm ? 'helm' : 'hat') : it.type);
  for (const id of [...PAST_SHOP_WEAPONS, ...PAST_SHOP_ARMOR]) {
    const old = [...HANONO9_SHOP_WEAPONS, ...HANONO9_SHOP_ARMOR].find((o) => ITEMS[o].type === ITEMS[id].type && key(ITEMS[o]) === key(ITEMS[id]));
    const r = power(ITEMS[id]) / power(ITEMS[old]);
    assert.ok(r >= 1.1 && r <= 1.25, `${id}: ${r.toFixed(2)}`);
  }
  for (const id of PAST_SHOP_TOOLS) assert.ok(ITEMS[id]?.type === 'use' && ITEMS[id].price > 0, id);
  assert.ok(!PAST_SHOP_TOOLS.includes('return_wing'), '千年前では キメラのつばさが 使えない');
  assert.ok(PAST_SHOP_TOOLS.includes('p6_honey'));
  assert.deepEqual(shopItems(SHOPS.past_weapon), PAST_SHOP_WEAPONS);
});

test('宝箱（PAST_TREASURE）: 時のほこら 6・時のいせき 14・千年前の フィールド 6。ぜんぶ ランク10の ★5（オレンジ）。あとの 所ほど 強い・影の城より 強い', () => {
  assert.equal(PAST_TREASURE.toki_shrine.length, 6);
  assert.equal(PAST_TREASURE.toki_ruin.length, 14);
  assert.equal(PAST_TREASURE.overworld_past.length, 6);
  const all = Object.values(PAST_TREASURE).flat();
  assert.equal(new Set(all).size, all.length, 'かさならない');
  for (const id of all) {
    const it = ITEMS[id];
    assert.ok(it && it.rank === 10 && it.src === 'past' && !(it.price > 0) && it.sell > 0, id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rarityOf(id), 4, id);
    assert.equal(rareWhereText(id), '千年前の宝箱でしか手に入らない');
    assert.ok(ITEM_KANA[id] && it.desc, id);
  }
  assert.deepEqual(Object.values(PAST_RUIN_FLOORS).flat(), PAST_TREASURE.toki_ruin);
  // 武器の 種類は ぜんぶ（剣・オノ・短剣・やり・ツメ・ムチ・つえ・おうぎ・ブーメラン・バット）
  const cats = new Set(all.filter((id) => ITEMS[id].type === 'weapon').map((id) => ITEMS[id].cat));
  assert.equal(cats.size, 10);
  // 防具の 部位（よろい・たて・頭・アクセ）も
  for (const t of ['armor', 'shield', 'head', 'acc']) assert.ok(all.some((id) => ITEMS[id].type === t), t);
  // 強さの かけ算: ほこら < フィールド ≦ いせき（深い 階ほど）。影の城の 12階（1.27）より 上（いせき）
  assert.ok(Math.max(...PAST_K.toki_shrine) <= Math.min(...PAST_K.overworld_past));
  assert.ok(Math.max(...PAST_K.overworld_past) <= PAST_K.toki_ruin[1]);
  for (let f = 2; f <= 7; f++) assert.ok(PAST_K.toki_ruin[f] > PAST_K.toki_ruin[f - 1]);
  assert.ok(PAST_K.toki_ruin[1] > 1.27);
  // 時のいせきの 剣は 影の城の 剣・夜明けの星の剣より 強い
  assert.ok(ITEMS.p6_ruin_sword.atk > ITEMS[CASTLE_TREASURE[12][0]].atk && ITEMS.p6_ruin_sword.atk > ITEMS.solitus_dawn_sword.atk);
  // 名前の 色（めずらしさ）が 同じ ランクの 店の 品より 強い
  for (const id of all) {
    const it = ITEMS[id];
    if (it.type !== 'weapon') continue;
    const shop = PAST_SHOP_WEAPONS.find((s) => ITEMS[s].cat === it.cat);
    assert.ok(it.atk > ITEMS[shop].atk, id);
  }
});

test('★の きまり・れん金・読みがな: ランク10は ★5（店の 品は ★1）。素材の レシピ 3つ', () => {
  for (const [id, it] of Object.entries(ITEMS_PAST)) {
    if (!['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) continue;
    assert.equal(starsOf(id), it.price > 0 ? 1 : 5, id);
    assert.ok(PAST_ITEM_KANA[id], id);
  }
  assert.equal(PAST_RECIPES.length, 3);
  for (const r of PAST_RECIPES) {
    assert.ok(RECIPES.includes(r) && r.tier === 5, r.id);
    for (const i of r.ins) assert.ok(ITEMS[i], i);
    assert.ok(r.ins.some((i) => ['p6_time_sand', 'p6_old_gear'].includes(i)));
    if (ITEMS[r.out].type !== 'use') {
      const from = r.ins.find((i) => ['weapon', 'armor'].includes(ITEMS[i].type));
      const k = ITEMS[r.out].type === 'weapon' ? 'atk' : 'def';
      assert.ok(ITEMS[r.out][k] > ITEMS[from][k], r.id);
      assert.equal(starsOf(r.out), 5);
    }
  }
});

// ───────────── ミナモ ─────────────
test('ゲストの ミナモ（MINAMO_GUEST）: 星読みの むすめ・回復が とくい。その 子だけの 技（ひらめき技）・装備・レベルは パーティーに 合わせる', () => {
  const g = MINAMO_GUEST;
  assert.ok(g.id === 'guest_minamo' && JOBS[g.job] && g.tactics === 'heal' && g.minLevel >= 56);
  assert.ok(g.look && g.look.hcol && g.look.style);
  assert.equal(g.skills.length, 4);
  for (const id of g.skills) {
    const a = ABILITIES[id];
    assert.ok(a && ['spell', 'skill'].includes(a.kind) && a.kana && a.mp > 0, id);
    assert.ok(!a.noAuto, id);
  }
  const types = g.skills.map((id) => ABILITIES[id].effect.type);
  assert.ok(types.filter((t) => t === 'heal').length >= 2, '回復が とくい');
  for (const [slot, id] of Object.entries(g.gear)) {
    assert.ok(ITEMS[id] && canEquip(g.job, id), `${slot}: ${id}`);
    assert.ok(PAST_SHOP_WEAPONS.includes(id) || PAST_SHOP_ARMOR.includes(id), `${id}: 里の 店の 品`);
  }
  // world/party.js の guestChar と おなじ 作り方（レベルは パーティーの いちばん 高い レベル）
  const c = makeNpcSupportChar({ ...g }, 59);
  assert.equal(c.level, 59);
  assert.deepEqual(c.hirameki, g.skills);
  assert.equal(c.equip.weapon, g.gear.weapon);
  const s = computeStats(c);
  assert.ok(s.maxHp > 350 && s.heal > 150, JSON.stringify({ hp: s.maxHp, heal: s.heal }));
  // 戦いの 中で 技を 使える（オートの 回復）
  const party = [...PARTY(58).slice(0, 3), c];
  const b = new Battle({ rng: makeRng(5), allies: party.map((ch) => ({ char: ch, kind: 'support', auto: true, tactics: ch.tactics || 'balanced' })), enemies: ['sand_golem'] });
  const mi = b.allies[3];
  for (const id of g.skills) assert.ok(mi.abilities.includes(id), id);
});

// ───────────── 仮の 台本（A の 台本が まだ ないので テストの 中で）─────────────
test('仮の 台本: ["showMon", "sand_clock"] → ["battle", "sand_clock"] で サンドクロックの 戦いが 始まり、さいごまで 動く', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(62), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  runSteps(world, ken.s, [['showMon', 'sand_clock'], ['battle', 'sand_clock']]);
  await ken.settle(60000);
  const shown = ken.msgs.filter((x) => x.t === 'script').some((x) => JSON.stringify(x).includes('"showMon","sand_clock"'));
  assert.ok(shown, 'showMon で サンドクロックの 絵');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.ok(start, '戦いが 始まる');
  assert.equal(start.snap.bg, 'toki_shrine');
  assert.ok(start.snap.combatants.some((x) => x.species === 'sand_clock'));
  assert.ok(ken.msgs.some((x) => x.t === 'battleEnd' || x.t === 'battleResult' || (x.t === 'battle' && x.end)) || !world.battles.size, 'さいごまで');
});

// ───────────── 絵 ─────────────
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) { colors.add(c); for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]); },
    eye(cx, cy, r) { colors.add('#ffffff'); colors.add('#1a1026'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 13しゅと ボス 2体（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of [...NEW, ...PAST_BOSSES]) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const boss = PAST_BOSSES.includes(id);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= (boss ? 130 : 72)), `${id}: size`);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    const [W, H] = d.size;
    const k = Math.min(1, 20 / Math.max(W, H));
    for (const [w, h] of [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))]]) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.deepEqual([...s.colors].filter((c) => !pal.has(String(c).toLowerCase())), [], `${id} f${f}: パレットに ない いろ`);
        assert.deepEqual(outside(s.pts, w, h), [], `${id} f${f} ${w}×${h}: はみだし`);
      }
    }
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${id}: コマで うごく`);
    const used = new Set([...a.colors, ...b.colors].map((c) => c.toLowerCase()));
    assert.deepEqual(d.pal.filter((c) => !used.has(c.toLowerCase())), [], `${id}: つかわない いろ`);
  }
  // ボスは 大きく（台本の showMon でも）・地面の 線に おさまる
  for (const id of PAST_BOSSES) {
    assert.ok(MONSTER_ART[id].size[0] >= 96 && MONSTER_ART[id].size[1] + 2 <= BASE_Y, id);
    assert.ok(MONSTER_ART[id].npc > 0, `${id}: フィールドの 大きな NPC にも`);
  }
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_PAST)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
});

test('絵: 戦いの 背景 4つ と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(PAST_BG).sort(), ['past_field', 'toki_ruin', 'toki_ruin_boss', 'toki_shrine']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(PAST_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(PAST_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawPastBg(ctx, d, 78);
    drawPastFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 120, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(PAST_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none'))];
  for (const a of own) {
    assert.equal(playCh6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔・…・影の城の エフェクトの あとに よばれる（battlefx-ch5.js → … → battlefx-earth.js → battlefx-ch6.js）
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playCh6Fx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of CH6_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(CH6_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(CH6_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: 砂の 目もり・大砂流の 前ぶれの うず・まきもどしの わと 雷の 目もり・バナー（前ぶれの バナーは 自分で）', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 100 };
  const draw = (c) => { drawn.length = 0; ch6Draw(scene, x, {}, c, 10, 10, 100, 112, 1); return drawn.length; };
  assert.equal(draw({ species: 'moss_deer', alive: true }), 0);
  const sc = { species: SAND_CLOCK, alive: true, sand: 3, sandMax: 6 };
  const plain = draw(sc);
  assert.ok(plain > 0);
  sc.telegraph = true;
  assert.ok(draw(sc) > plain, '前ぶれの うず');
  const gd = { species: GEARDON, alive: true, gearRec: 0, gearLeft: 0, gearHits: 0, gearNeed: 2 };
  const g0 = draw(gd);
  gd.gearRec = 1;
  gd.gearLeft = 2;
  assert.ok(draw(gd) > g0, 'まきもどしの わ');
  assert.ok(CH6_OWN_TELE.has(SAND_CLOCK) && CH6_OWN_TELE.has(GEARDON));
  const banners = [];
  const s2 = { game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), shake() {} };
  ch6Present(s2, { lines: [] }, { type: 'telegraph' }, null, { species: SAND_CLOCK });
  ch6Present(s2, { lines: [], scSand: { lv: 1 } }, {}, null, null);
  ch6Present(s2, { lines: [], scStop: 'e1' }, {}, null, null);
  ch6Present(s2, { lines: [], scBack: { lv: 3 } }, {}, null, null);
  ch6Present(s2, { lines: [] }, { type: 'telegraph' }, null, { species: GEARDON });
  ch6Present(s2, { lines: [], gdRecord: { need: 2 } }, {}, null, null);
  ch6Present(s2, { lines: [], gdSpark: { left: 1 } }, {}, null, null);
  ch6Present(s2, { lines: [], gdBreak: 'e1' }, {}, null, null);
  ch6Present(s2, { lines: [], gdRewind: { heal: 500 } }, {}, null, null);
  assert.deepEqual(banners.map((y) => y[1]), ['danger', 'danger', 'combo', 'combo', 'danger', 'danger', 'combo', 'combo', 'danger']);
  assert.ok(banners[0][0].includes('氷') && banners[5][0].includes('雷を2回') && banners[8][0].includes('500'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-past.js', 'public/js/shared/data/abilities-past.js', 'public/js/shared/data/items-past.js', 'public/js/shared/data/shops-past.js',
    'public/js/shared/data/encounters-past.js', 'public/js/shared/data/companions-past.js', 'public/js/shared/battle-ch6.js', 'public/js/client/battle-ch6.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  // 名前が ほかの 品と かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    if (ITEMS_PAST[id]) assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}`);
    names.set(it.name, id);
  }
});
