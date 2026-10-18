// 第5章 Step 6・7「根の島・大地の神殿・ノクト（1回目）・みんなが集まる」B（戦い・品）
// 新しい 魔物（4しゅ。アニメの 敵ふう）・色ちがい・出現表（t5_root・t5_earth_up・t5_earth_low）・仲間・ノクト（nocto_1）と
// 新しい しくみ「かげぶんしん → ひとりぼっちの合体技」「地われ（動けない・回復を 受けられない）」「手をのばす（新しい コマンド）」
// 「HPが 半分で 戦いが 勝ちで 終わる（ピピの 手紙で ことばが かわる）」・まもり兵の「守る」・ダンゴムシの「おこる」・かおのない影の「のみこむ」・
// 知っている 人の オート・シミュレーション・品（ランク9の 店・神殿の 宝箱・ボスの 品・みんなが くれる ★5・れん金）・★の きまり・
// ボス級「天空のきょ兵」の 配合・絵・背景・エフェクト・がめん・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideMonster, decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, breedCandidates, breedOutcome, rankOf, recipeHint, RANK_BREED_LV } from '../public/js/shared/data/companions.js';
import { regionOf, starsOf, rarityOf, bossRareOf, isShopItem, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { starsFor, STARS_MAX } from '../public/js/shared/data/items-rare.js';
import { RECIPES } from '../public/js/shared/data/alchemy.js';
import { MONSTERS_EARTH, EARTH_HIDDEN, EARTH_MAT_DROPS, NOCTO1, NOCTO_CLONE } from '../public/js/shared/data/monsters-earth.js';
import { EARTH_ABILITIES } from '../public/js/shared/data/abilities-earth.js';
import { FRIENDS_EARTH } from '../public/js/shared/data/companions-earth.js';
import { ENCOUNTERS_EARTH, FIXED_EARTH, ZONE_BG_EARTH, EARTH_VARIANTS } from '../public/js/shared/data/encounters-earth.js';
import {
  ITEMS_EARTH, HANONO9_SHOP_WEAPONS, HANONO9_SHOP_ARMOR, HANONO9_SHOP_TOOLS, EARTH_TREASURE, GATHER_GIFTS, EARTH_RECIPES, EARTH_ITEM_KANA,
} from '../public/js/shared/data/items-earth.js';
import { HOSHIYOMI_SHOP_WEAPONS, HOSHIYOMI_SHOP_ARMOR } from '../public/js/shared/data/items-hoshiyomi.js';
import { MONSTERS_BOSS, FRIENDS_BOSS, MATERIAL_RECIPES } from '../public/js/shared/data/monsters-boss.js';
import {
  REACH, CLONES, RIFT_ID, COMBO_READY, COMBO, SWALLOW, PIPI_LETTER, BREAK_DEF, clonesOf, trappedAllies, reachPlan, earthPlan, bestHit, trap,
} from '../public/js/shared/battle-earth.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { nocto1Run, nocto1Party, NOCTO1_KIT } from '../tools/sim-nocto1.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { EARTH_BG, EARTH_DECOS, drawEarthBg, drawEarthFloorBg } from '../public/js/client/render/ch5-earth-bg.js';
import { playEarthFx } from '../public/js/client/render/battlefx-earth.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { EARTH_SCREEN_ANIMS, EARTH_ALLY_FX, EARTH_SFX, earthDraw, earthPresent, earthMarks, earthReachItem, trappedOthers } from '../public/js/client/battle-earth.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_EARTH).filter((id) => id !== NOCTO1);
const PARTY = (lv = 50) => [makeChar('warrior', lv, 10, 'せんし', 50), makeChar('priest', lv, 10, 'そうりょ', 50), makeChar('mage', lv, 10, 'まほう', 50), makeChar('monk', lv, 10, 'ぶとう', 50)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [NOCTO1], boss: opts.boss ?? true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  if (ev.postLines) ev.lines.push(...ev.postLines);
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
const dmgTo = (ev, t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
// 地われに 落とす（ノクトの 技を つかう）
function rift(b, m, t) {
  const ev = act(b, m, { type: 'ability', id: RIFT_ID, target: t.id });
  return ev;
}

// ───────────── データ ─────────────
test('魔物: 根の島・神殿の 新しい 魔物 4しゅ（Lv48〜50・空の レアの 地方 6）と ノクト（1回目）。そのままの 名前は 使わない', () => {
  assert.deepEqual(NEW.sort(), ['earth_pillbug', 'faceless_shade', 'root_sprite', 'sky_guard']);
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_EARTH[id]);
    assert.ok(m.lv >= 48 && m.lv <= 50, id);
    assert.equal(regionOf(id), 6, id);
    assert.ok(!m.boss, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(m.desc && m.desc.length > 10, id);
  }
  // アニメの 敵ふう: そのままの 名前は 使わない（魔物の 名前・仲間の よび名・技・品の 名前と 説明）
  const words = ['ロボット兵', 'ラピュタ', 'オーム', '王蟲', 'カオナシ', 'コダマ', 'こだま'];
  const texts = [
    ...[...NEW, NOCTO1, NOCTO_CLONE, 'ss_sky_giant'].flatMap((id) => [MONSTERS[id].name, MONSTERS[id].desc]),
    ...Object.values(FRIENDS_EARTH).flatMap((f) => [...f.names, f.note]), ...FRIENDS_BOSS.ss_sky_giant.names,
    ...Object.values(EARTH_ABILITIES).flatMap((a) => [a.name, a.desc, a.cast]),
    ...Object.values(ITEMS_EARTH).flatMap((it) => [it.name, it.desc]),
    ...EARTH_VARIANTS.map((v) => MONSTERS[v].name),
  ].join('|');
  for (const w of words) assert.ok(!texts.includes(w), w);
  // 弱点（15-4）: まもり兵は 雷・ダンゴムシは 炎・かおのない影は 光
  assert.ok(MONSTERS.sky_guard.resist.bolt >= 1.4 && MONSTERS.earth_pillbug.resist.fire >= 1.3 && MONSTERS.faceless_shade.resist.light >= 1.5);
  // かおのない影は お金が とても 多い・根っこのこびとは 足が 速い
  assert.ok(MONSTERS.faceless_shade.gold >= 3 * MONSTERS.sky_guard.gold);
  assert.ok(MONSTERS.root_sprite.agi > Math.max(...NEW.filter((id) => id !== 'root_sprite').map((id) => MONSTERS[id].agi)) * 1.5);
  // ノクト（1回目）
  const n = MONSTERS[NOCTO1];
  assert.ok(n.boss && n.turns === 2 && n.lv === 50 && n.nocto1);
  for (const a of n.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], a.id);
  assert.equal(ABILITIES[COMBO_READY].effect.next, COMBO);
  for (const id of [CLONES, RIFT_ID, COMBO, SWALLOW, 'm_sg_guard']) assert.ok(ABILITIES[id], id);
  for (const a of Object.values(EARTH_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  // ノクトの分身は 図鑑・魔物の 数に 入らない（数えない 形）
  assert.ok(MONSTERS[NOCTO_CLONE] === EARTH_HIDDEN[NOCTO_CLONE] && !Object.keys(MONSTERS).includes(NOCTO_CLONE));
});

test('落とす物: ノクトは 大地のかけらのお守り（1人 1つ・★5）と 黒い星のマント（ボスの 品・★5）を かならず・まれに ノクトの紋章（★5）。素材（大地の根・大地の光石）', () => {
  const bd = monsterDrops(NOCTO1).filter((d) => d.kind === 'boss');
  assert.deepEqual(bd.map((d) => d.item), ['nocto_earth_charm']);
  assert.ok(ITEMS.nocto_earth_charm.unique && ITEMS.nocto_earth_charm.type === 'acc');
  assert.equal(bossRareOf(NOCTO1), 'nocto_star_cloak');
  assert.equal(ITEMS.nocto_star_cloak.src, 'boss');
  const rare = monsterDrops(NOCTO1).find((d) => d.kind === 'rare');
  assert.equal(rare.item, 'nocto_crest');
  assert.ok(rare.n >= 3 && rare.n <= 8, 'まれに');
  assert.equal(rareWhereText('nocto_crest'), 'ボスがまれに落とす');
  for (const id of ['nocto_earth_charm', 'nocto_star_cloak', 'nocto_crest']) assert.equal(starsOf(id), 5, `${id}: ★5`);
  const rng = makeRng(5);
  let crest = 0;
  for (let i = 0; i < 400; i++) {
    const d = rollDrops(NOCTO1, rng);
    assert.ok(d.includes('nocto_earth_charm') && d.includes('nocto_star_cloak'));
    if (d.includes('nocto_crest')) crest++;
  }
  assert.ok(crest > 40 && crest < 140, `${crest}`);
  for (const id of NEW) {
    assert.ok(MAT_DROPS[id], id);
    assert.equal(MAT_DROPS[id], EARTH_MAT_DROPS[id]);
    assert.ok(['earth_root', 'earth_stone'].includes(MAT_DROPS[id][0]));
  }
  assert.equal(MAT_DROPS.root_sprite[0], 'earth_root');
  for (const id of ['earth_root', 'earth_stone']) assert.equal(ITEMS[id].type, 'mat');
  // 名前の 約束の earth_shard は もう 大事な物（大地の守り星のかけら）。こわして いない
  assert.equal(ITEMS.earth_shard.type, 'key');
});

test('仲間: 新しい 魔物 4しゅは 仲間に なる（1/12〜1/24・系統配合の 子には ならない）。ノクト・分身は ならない', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_EARTH[id]);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 12, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    for (const [, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!['sgGuard', 'n1Rift', 'n1Clones', 'n1Combo'].includes(ABILITIES[ab].effect.type), `${id}: ${ab}`);
    }
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.4, `${id}: ${sum}`);
  }
  assert.ok(!MONSTER_FRIENDS[NOCTO1] && !MONSTER_FRIENDS[NOCTO_CLONE]);
  assert.ok(MONSTER_FRIENDS.earth_pillbug.rate <= 1 / 20 && MONSTER_FRIENDS.faceless_shade.rate <= 1 / 20);
});

test('出現表と きまった 戦い: 名前の 約束（t5_root・t5_earth_up・t5_earth_low／nocto_1・背景 root_isle・earth_temple・earth_temple_deep・曲 nocto_1）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_EARTH), ['t5_root', 't5_earth_up', 't5_earth_low']);
  for (const [t, list] of Object.entries(ENCOUNTERS_EARTH)) {
    assert.equal(ENCOUNTER_TABLES[t], list);
    for (const e of list) for (const [sp, mn, mx] of e.group) {
      assert.ok(MONSTERS[sp], `${t}: ${sp}`);
      assert.ok(mn >= 0 && mx >= mn && mx <= 3);
    }
  }
  const sps = (t) => new Set(ENCOUNTERS_EARTH[t].flatMap((e) => e.group.map(([sp]) => sp)));
  assert.ok(sps('t5_root').has('root_sprite'));
  for (const id of ['sky_guard', 'root_sprite']) assert.ok(sps('t5_earth_up').has(id), id);
  for (const id of ['earth_pillbug', 'faceless_shade']) assert.ok(sps('t5_earth_low').has(id), id);
  for (const v of EARTH_VARIANTS) assert.ok(sps('t5_earth_low').has(v) && MONSTERS[v], v);
  assert.deepEqual(ZONE_BG_EARTH, { t5_root: 'root_isle', t5_earth_up: 'earth_temple', t5_earth_low: 'earth_temple_deep' });
  for (const [t, bg] of Object.entries(ZONE_BG_EARTH)) assert.equal(ZONE_BG[t], bg);
  const f = FIXED_ENCOUNTERS.nocto_1;
  assert.equal(f, FIXED_EARTH.nocto_1);
  assert.deepEqual(f.group, [[NOCTO1, 1, 1]]);
  assert.equal(f.bg, 'earth_temple_deep');
  assert.equal(f.bgm, 'nocto_1');
  assert.ok(f.boss && f.canFlee === false && !f.loseOk);
});

// ───────────── 品 ─────────────
test('ハネノの ランク9の 店（★1・きたえられない）: 武器 10しゅるい ぜんぶ・防具・道具。星読みの里の 店の 約1.08〜1.1倍', () => {
  const cats = HANONO9_SHOP_WEAPONS.map((id) => ITEMS[id].cat);
  assert.deepEqual(cats.sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  for (const id of [...HANONO9_SHOP_WEAPONS, ...HANONO9_SHOP_ARMOR]) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_EARTH[id]);
    assert.ok(it.price > 0 && it.rank === 9 && it.rarity === 0, id);
    assert.equal(starsOf(id), 1, `${id}: ★1`);
    assert.ok(isShopItem(id), id);
  }
  for (const id of HANONO9_SHOP_TOOLS) assert.ok(ITEMS[id] && ITEMS[id].price > 0, id);
  const same = (list, it) => ITEMS[list.find((id) => {
    const s = ITEMS[id];
    return s.type === it.type && (it.type !== 'weapon' || s.cat === it.cat) && (it.type !== 'armor' || s.armorType === it.armorType) && (it.type !== 'head' || !!s.helm === !!it.helm);
  })];
  for (const id of [...HANONO9_SHOP_WEAPONS, ...HANONO9_SHOP_ARMOR]) {
    const it = ITEMS[id], h = same([...HOSHIYOMI_SHOP_WEAPONS, ...HOSHIYOMI_SHOP_ARMOR], it);
    const k = (it.atk || it.def) / (h.atk || h.def);
    assert.ok(k >= 1.05 && k <= 1.14, `${id}: ${k.toFixed(3)}`);
  }
  for (const id of Object.keys(ITEMS_EARTH)) assert.ok(EARTH_ITEM_KANA[id], `${id} の よみがな`);
});

test('★の きまり: 店の 品は ★1。ランク8 ★4・9〜10 ★5・10より 上も ★5（★は 5まで。家族の 答え）', () => {
  assert.equal(STARS_MAX, 5);
  for (const [rank, s] of [[8, 4], [9, 5], [10, 5], [11, 5], [12, 5], [20, 5]]) assert.equal(starsFor({ type: 'weapon', rank, rarity: 3 }), s, `ランク${rank}`);
  assert.equal(starsFor({ type: 'weapon', rank: 11, rarity: 0, price: 100 }), 1, '店の 品は ★1');
});

test('神殿の 宝箱（EARTH_TREASURE）: 1〜8階に 1〜2こ。1〜3階 ランク8＝★4・4〜8階 ランク9〜10＝★5。深いほど めずらしく 強い。同じ ランクの 店の 品より 強い', () => {
  assert.deepEqual(Object.keys(EARTH_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  let lastRar = 0, lastRank = 0;
  const all = [];
  for (const [fl, ids] of Object.entries(EARTH_TREASURE)) {
    assert.ok(ids.length >= 1 && ids.length <= 2, fl);
    for (const id of ids) {
      const it = ITEMS[id];
      assert.ok(it && it.src === 'earth' && it.price === 0 && it.sell > 0, id);
      if (Number(fl) <= 3) assert.ok(it.rank === 8 && starsOf(id) === 4, `${id}: ★4（ランク8）`);
      else assert.ok(it.rank >= 9 && it.rank <= 10 && starsOf(id) === 5, `${id}: ★5（ランク9〜10）`);
      assert.equal(rareWhereText(id), '大地の神殿の宝箱でしか手に入らない');
      assert.ok(rarityOf(id) >= lastRar && it.rank >= lastRank, `${id}: めずらしさ・ランクが 下がらない`);
      all.push(id);
    }
    lastRar = Math.max(...ids.map(rarityOf));
    lastRank = Math.max(...ids.map((id) => ITEMS[id].rank));
  }
  assert.equal(new Set(all).size, all.length);
  // 同じ ランクの 店の 品（★1）より 強い（ランク8 … 星読みの里・ランク9 … ハネノ）
  const shop = [...HOSHIYOMI_SHOP_WEAPONS, ...HOSHIYOMI_SHOP_ARMOR, ...HANONO9_SHOP_WEAPONS, ...HANONO9_SHOP_ARMOR].map((id) => ITEMS[id]);
  const shopOf = (it) => shop.find((s) => s.rank === it.rank && s.type === it.type && (it.type !== 'weapon' || s.cat === it.cat) && (it.type !== 'armor' || s.armorType === it.armorType) && (it.type !== 'head' || !!s.helm === !!it.helm));
  for (const id of all) {
    const it = ITEMS[id], s = shopOf(it);
    if (!s) continue;
    assert.ok((it.atk || it.def) > (s.atk || s.def), `${id}: ${it.atk || it.def} <= ${s.atk || s.def}`);
  }
  // いちばん 下の 剣は ★5の 中でも 強い（★5の 中で あとから 出る 品ほど 強い）
  assert.ok(ITEMS.et_earth_sword.atk > ITEMS.mem_lightshadow_sword.atk);
});

test('みんなが くれる 品（GATHER_GIFTS）: ネフィ・サラ・バルガ・ミラ。ランク10 の ★5。ノクトの 品より 強い', () => {
  assert.deepEqual(Object.keys(GATHER_GIFTS).sort(), ['barga', 'mira', 'nefi', 'sara']);
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  for (const id of Object.values(GATHER_GIFTS)) {
    const it = ITEMS[id];
    assert.ok(it && it.rank === 10 && it.src === 'gift' && !(it.price > 0) && it.sell > 0, id);
    assert.equal(starsOf(id), 5, id);
    assert.ok(rarityOf(id) >= 4, id);
    assert.equal(rareWhereText(id), 'たくされた品（ほかでは手に入らない）');
  }
  // ノクトの 品より 強い（アクセサリーは ボーナスの 合計・マントは 守備力）
  assert.ok(bsum(ITEMS[GATHER_GIFTS.nefi]) > bsum(ITEMS.nocto_earth_charm) && bsum(ITEMS[GATHER_GIFTS.nefi]) > bsum(ITEMS.nocto_crest));
  assert.ok(ITEMS[GATHER_GIFTS.sara].def > ITEMS.nocto_star_cloak.def && ITEMS[GATHER_GIFTS.sara].armorType === 'cloth');
  assert.ok(ITEMS[GATHER_GIFTS.barga].atk > ITEMS.et_earth_sword.atk);
  assert.ok(ITEMS[GATHER_GIFTS.mira].bonus.heal > ITEMS.et_spring_staff.bonus.heal);
});

test('れん金: この 章の 素材（大地の根・大地の光石）の レシピ 3つ。★4（迷宮の 宝箱）→ ★5', () => {
  assert.equal(EARTH_RECIPES.length, 3);
  for (const r of EARTH_RECIPES) {
    assert.ok(RECIPES.includes(r), r.id);
    assert.equal(r.tier, 5);
    assert.ok(ITEMS[r.out], r.out);
    for (const i of r.ins) assert.ok(ITEMS[i], i);
    assert.ok(r.ins.some((i) => ['earth_root', 'earth_stone'].includes(i)));
  }
  for (const r of EARTH_RECIPES.filter((x) => ITEMS[x.out].src === 'alchemy')) {
    const from = r.ins.find((i) => ['weapon', 'armor'].includes(ITEMS[i].type));
    assert.equal(starsOf(from), 4, from);
    assert.equal(starsOf(r.out), 5, r.out);
    const k = ITEMS[r.out].type === 'weapon' ? 'atk' : 'def';
    assert.ok(ITEMS[r.out][k] > ITEMS[from][k], r.id);
    assert.equal(rareWhereText(r.out), 'れん金でしか作れない');
  }
});

test('天空のきょ兵: 天空のまもり兵 × 物質系の S ＋ 大地のかけらのお守り → ボス級（SS）。配合でしか 会えない・ランク配合では 生まれない', () => {
  const sk = 'ss_sky_giant';
  assert.ok(MONSTERS[sk] && MONSTERS[sk] === MONSTERS_BOSS[sk] && MONSTERS[sk].breedOnly && !MONSTERS[sk].boss);
  assert.equal(MONSTERS[sk].name, '天空のきょ兵');
  assert.equal(MONSTERS[sk].race, 'material');
  const f = MONSTER_FRIENDS[sk];
  assert.ok(f === FRIENDS_BOSS[sk] && f.rank === 'SS' && f.recipeOnly && f.materialOnly && f.rate === 0);
  for (const [, ab] of f.learn) assert.ok(ABILITIES[ab], ab);
  const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
  assert.ok(sum >= 7 && sum <= 8.7, `${sum}`);
  assert.equal(rankOf('sky_guard', MONSTERS), 'S');
  assert.ok(MATERIAL_RECIPES.some((r) => r.a === 'sky_guard' && r.item === 'nocto_earth_charm' && r.child === sk));
  const lv = (sp, level = 20) => ({ species: sp, level });
  const bag = { items: [{ id: 'nocto_earth_charm', n: 1 }] };
  // まもり兵 × 物質系の S（ひとりぼっちの人形・天空のまもり兵 どうし）。どちらを 1ぴきめに しても
  for (const [x, y] of [['sky_guard', 'lonely_doll'], ['lonely_doll', 'sky_guard'], ['sky_guard', 'sky_guard']]) {
    const o = breedOutcome(lv(x), lv(y), MONSTERS, bag);
    assert.equal(o.child, sk, `${x} × ${y}`);
    assert.equal(o.kind, 'material');
    assert.equal(o.item, 'nocto_earth_charm');
  }
  // まもり兵が いない・品が ない・ランク配合（S Lv30 × S Lv30）では 生まれない
  assert.ok(!breedCandidates(lv('lonely_doll'), lv('stone_keeper'), MONSTERS, bag).list.includes(sk));
  assert.ok(!breedCandidates(lv('sky_guard'), lv('lonely_doll'), MONSTERS, { items: [] }).list.includes(sk));
  const rank = breedCandidates(lv('sky_guard', RANK_BREED_LV), lv('lonely_doll', RANK_BREED_LV), MONSTERS);
  assert.ok(rank.items.some((it) => it.kind === 'rank') && !rank.list.includes(sk));
  assert.match(recipeHint(sk, MONSTERS), /配合でしか会えない/);
  assert.ok(MONSTER_ART[MONSTERS[sk].art], 'え');
});

// ───────────── たたかい: 地われ・手をのばす ─────────────
test('地われ: 1人が 落ちる（動けない・回復を 受けられない・ならんで いた 行動も なし）。がめんへ（status rift・trap）', () => {
  const { b, m, a } = battle({ seed: 7 });
  const t = a[1];
  t.queued = true;
  b.queue.push({ id: t.id, cmd: { type: 'attack' }, last: true });
  const ev = rift(b, m, t);
  const who = trappedAllies(b);
  assert.equal(who.length, 1);
  const x = who[0];
  assert.ok(x.status.rift && x.status.rift.kind === 'rift' && x.status.rift.turns === 3);
  assert.ok(!b.queue.some((q) => q.id === x.id) && !x.queued && !x.ready);
  assert.ok(ev.n1Trap && ev.n1Trap.who === x.id && has(ev, '地われに落ちてしまった'));
  assert.equal(pub(x).trap, 'rift');
  assert.ok(pub(x).status.includes('rift'));
  // 動けない（番が 来ても とばされる）
  x.atb = 100;
  b.onReady(x);
  assert.equal(b.queue.find((q) => q.id === x.id)?.cmd.type, 'incapacitated');
  b.queue = [];
  // 回復を 受けられない
  x.hp = 10;
  const h = evOf(a[0]);
  b.heal(a[0], x, { base: [100, 100], fixed: true }, h, 1);
  assert.equal(x.hp, 10);
  assert.ok(h.lines.some((l) => l.includes('回復がとどかない')));
  // もう だれかが 落ちて いる 時は、地われは えらばれない
  assert.equal(MONSTERS[NOCTO1].actions.filter((ac) => ac.id === RIFT_ID).every((ac) => ac.cond.includes('c5:n1Rift')), true);
});

test('手をのばす（新しい コマンド）: だれかが 落ちて いる 時だけ 使える。使うと すぐ もどる。ほうっておくと 3回 動けば 自分で もどる', () => {
  const { b, m, a } = battle({ seed: 8 });
  // だれも 落ちて いない
  assert.equal(b.validate(a[0], { type: REACH }).ok, false);
  rift(b, m, a[2]);
  const x = trappedAllies(b)[0];
  const helper = a.find((y) => y !== x);
  assert.equal(b.validate(helper, { type: REACH, target: x.id }).ok, true);
  assert.equal(b.validate(x, { type: REACH, target: x.id }).ok, false, '自分には 使えない');
  const ev = act(b, helper, { type: REACH, target: x.id });
  assert.ok(!x.status.rift && ev.n1Free?.who === x.id && ev.n1Free.by === helper.id);
  assert.ok(has(ev, 'に手をのばした') && has(ev, 'はい上がった'));
  assert.ok(x.atb >= 50, '少し 早く 番が 来る');
  // コマンドで（家族が えらぶ）
  rift(b, m, a[3]);
  const y = trappedAllies(b)[0];
  const p = a.find((z) => z !== y);
  p.controller = 'me';
  p.auto = false;
  p.ready = true;
  assert.ok(b.command(p.id, { type: REACH, target: y.id }, 'me').ok);
  assert.ok(b.queue.some((q) => q.id === p.id && q.cmd.type === REACH));
  b.queue = [];
  p.ready = false;
  // 3回 動くと 自分で もどる
  for (let i = 0; i < 3; i++) {
    const e = evOf(y);
    b.doIncapacitated(y, e);
    if (i < 2) assert.ok(y.status.rift && e.lines.some((l) => l.includes('手をのばしている')), `${i}`);
    else assert.ok(!y.status.rift && e.lines.some((l) => l.includes('自分の力で')));
  }
});

test('オートの 仲間: だれかが 落ちて いたら、回復の あとで「手をのばす」（かんたんで あぶなくない ので。ほかは かわらない）', () => {
  const { b, m, a } = battle({ seed: 9 });
  for (const x of a) x.hp = x.maxHp;
  assert.equal(reachPlan(b, a[0]), null);
  rift(b, m, a[1]);
  const x = trappedAllies(b)[0];
  const c = a.find((y) => y !== x);
  for (const y of a) y.hp = y.maxHp;
  assert.deepEqual(reachPlan(b, c), { type: REACH, target: x.id });
  const cmd = decideAlly(b, c);
  assert.equal(cmd.type, REACH);
  // 落ちて いる 人は 回復の 相手に えらばれない
  x.hp = 1;
  const pri = a.find((y) => y.job === 'priest' && y !== x);
  if (pri) {
    const c2 = decideAlly(b, pri);
    assert.ok(c2.type === REACH || c2.target !== x.id, JSON.stringify(c2));
  }
});

test('かおのない影の「のみこむ」: 地われと おなじ（手をのばすで もどる）。のみこんだ 影が たおれると、中の 人は 出てくる', () => {
  const { b, m, a } = battle({ seed: 12, enemies: ['faceless_shade', 'sky_guard'], boss: false });
  for (let i = 0; i < 20 && !trappedAllies(b).length; i++) act(b, m, { type: 'ability', id: SWALLOW, target: a[i % 4].id });
  const x = trappedAllies(b)[0];
  assert.ok(x && x.status.rift.kind === 'swallow' && x.status.rift.by === m.id);
  assert.equal(pub(x).trap, 'swallow');
  // もう 1人は のみこめない（この 影は もう のみこんで いる）
  assert.equal(b.enemies[0].actions.find((ac) => ac.id === SWALLOW).cond.includes('c5:fsSwallow'), true);
  m.hp = 1;
  const killer = a.find((y) => y !== x);
  const ev = evOf(killer);
  b.cur = ev;
  b.damage(killer, m, 50, ev, { element: 'phys' });
  assert.ok(!m.alive);
  assert.ok(!x.status.rift, '出てきた');
  assert.ok((ev.postLines || []).some((l) => l.includes('外に出てきた')));
});

// ───────────── たたかい: かげぶんしん・ひとりぼっちの合体技 ─────────────
test('かげぶんしん: 影（ノクトの分身）が 2体。そろって ノクトが 1回 動くと かならず 前ぶれ → 次の 番に ひとりぼっちの合体技（大技）', () => {
  const { b, m } = battle({ seed: 13 });
  m.n1Acts = 0;
  const ev = act(b, m, { type: 'ability', id: CLONES });
  const cl = clonesOf(b, m);
  assert.equal(cl.length, 2);
  assert.ok(cl.every((x) => x.species === NOCTO_CLONE && x.buffs.eva?.add > 0), 'かわしやすい');
  assert.ok(ev.n1Clones?.length === 2 && ev.joined?.length === 2 && has(ev, '2体、あらわれた'));
  // もう そろって いるので かげぶんしんは しない
  assert.ok(!MONSTERS[NOCTO1].actions.filter((x) => x.id === CLONES).some(() => b.enemies.filter((e) => e.alive && e.species === NOCTO_CLONE).length < 2));
  // 1回目は まだ。2回目で かならず 前ぶれ
  const c1 = decideMonster(b, m);
  assert.notEqual(c1.id, COMBO_READY);
  const c2 = decideMonster(b, m);
  assert.equal(c2.id, COMBO_READY);
  const tev = act(b, m, c2);
  assert.equal(m.telegraph, COMBO);
  assert.ok(has(tev, '同じかまえをとった'));
  const c3 = decideMonster(b, m);
  assert.equal(c3.id, COMBO);
  assert.ok(c3.big);
});

test('ひとりぼっちの合体技: みんなに 大きい（身を 守ると 半分）。影は のこる（たおすまで また ねらう）', () => {
  const sum = (def) => {
    let s = 0;
    for (let i = 0; i < 16; i++) {
      const { b, m, a } = battle({ seed: 60 + i });
      act(b, m, { type: 'ability', id: CLONES });
      a[1].defending = def;
      s += dmgTo(act(b, m, { type: 'ability', id: COMBO, big: true }), a[1]);
    }
    return s;
  };
  const open = sum(false), def = sum(true);
  assert.ok(def > 0 && def < open * 0.65, `${def} / ${open}`);
  const { b, m, a } = battle({ seed: 70 });
  act(b, m, { type: 'ability', id: CLONES });
  const ev = act(b, m, { type: 'ability', id: COMBO });
  assert.ok(ev.n1Combo && ev.results.filter((r) => r.dmg > 0).length >= 2);
  assert.ok(a.some((x) => (ev.results || []).some((r) => r.id === x.id)));
  assert.equal(clonesOf(b, m).length, 2, '影は のこる');
  // 影が そろって いなければ 出せない
  const { b: b2, m: m2 } = battle({ seed: 71 });
  const ev2 = act(b2, m2, { type: 'ability', id: COMBO });
  assert.ok(ev2.n1Break && has(ev2, '合体技は出せなかった'));
});

test('前ぶれの 間に 影を 1体 たおすと、かまえが くずれる（合体技は 出ない・ノクトの ゲージは 0 から・守備力が 下がる）', () => {
  const { b, m, a } = battle({ seed: 14 });
  act(b, m, { type: 'ability', id: CLONES });
  m.n1CloneAt = -5;
  act(b, m, decideMonster(b, m));
  assert.equal(m.telegraph, COMBO);
  m.atb = 80;
  const [c0] = clonesOf(b, m);
  c0.hp = 1;
  c0.buffs = {};
  let ev;
  for (let i = 0; i < 10 && c0.alive; i++) ev = act(b, a[0], { type: 'attack', target: c0.id });
  assert.ok(!c0.alive);
  assert.equal(m.telegraph, null);
  assert.equal(m.atb, 0);
  assert.equal(m.debuffs.def?.mult, BREAK_DEF);
  assert.ok(ev.n1Break && has(ev, 'かまえが、くずれた'));
  assert.notEqual(decideMonster(b, m).id, COMBO);
});

test('地われは 合体技の よやくの 組の 人を ねらい、組の みんなの 手を ひきはなす（よやくは こわれ、ゲージは 0 から）', () => {
  const { b, m, a } = battle({ seed: 15 });
  for (const x of a) { x.ready = false; x.atb = 30; }
  a[0].ready = true;
  a[0].atb = 100;
  const r = b.startDual(a[0], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[2].id, a[3].id], target: m.id });
  assert.ok(r.ok && a[0].waitDual, 'よやく');
  const ev = rift(b, m, a[3]);
  assert.ok(ev.n1Trap);
  assert.equal(a[0].waitDual, null, 'よやくが こわれた');
  assert.ok(ev.n1Torn === 1 && has(ev, 'ひきはなされた'));
  assert.ok(MONSTERS[NOCTO1].actions.some((x) => x.id === RIFT_ID && x.cond.includes('c5:nsBond')), 'よやくが ある ときは よく ねらう');
});

// ───────────── たたかい: HPが 半分で 終わる ─────────────
test('HPが 半分: 戦いは 勝ちで 終わる（たおした ことに なる。影も 消える・落ちて いた 人も もどる）。ピピの 手紙を 持っていると ことばが かわる', () => {
  for (const letter of [false, true]) {
    const { b, m, a } = battle({ seed: 16 });
    // ピピの 手紙（A の 大事な物）を 持っている 人（hooks.hasItem。テストでは ここで かわりに 決める）
    b.hooks.hasItem = (actor, id) => letter && id === PIPI_LETTER && actor === a[2];
    act(b, m, { type: 'ability', id: CLONES });
    rift(b, m, a[0]);
    m.hp = Math.round(m.maxHp * 0.5) + 10;
    const ev = act(b, a[1], { type: 'attack', target: m.id });
    // 1回で たおれる ほど 大きくても たおれない（HPは 1 のこる）
    assert.ok(!m.alive && ev.n1Stop && ev.n1Stop.letter === letter);
    assert.ok(b.killed.includes(NOCTO1), 'たおした ことに なる（経験値・品）');
    assert.equal(clonesOf(b, m).length, 0, '影も 消える');
    assert.equal(trappedAllies(b).length, 0, '落ちて いた 人も もどる');
    if (letter) {
      assert.ok(has(ev, 'ピピの、字だ') && has(ev, `${a[2].name}のふくろの中で`));
      assert.ok(!has(ev, '小手調べ'));
    } else {
      assert.ok(has(ev, 'ほんの小手調べだ') && !has(ev, 'ピピの'));
    }
    b.checkEnd();
    assert.equal(b.pendingEnd?.outcome, 'win');
  }
  // 1回の 大きな ダメージでも たおれない（HP半分で 止まる）
  const { b, m, a } = battle({ seed: 17 });
  const ev = evOf(a[0]);
  b.cur = ev;
  b.damage(a[0], m, m.maxHp * 2, ev, { element: 'phys' });
  assert.ok(ev.n1Stop && m.hp >= 1 && b.killed.includes(NOCTO1));
});

// ───────────── たたかい: まもり兵・ダンゴムシ・根っこのこびと ─────────────
test('天空のまもり兵: こわれかけると 1回だけ 仲間の 前に 立つ（次の 自分の 番まで、その 仲間への 攻撃を かわりに 受ける）', () => {
  const { b, a } = battle({ seed: 18, enemies: ['sky_guard', 'root_sprite'], boss: false });
  const [g, s] = b.enemies;
  const entry = MONSTERS.sky_guard.actions.find((x) => x.id === 'm_sg_guard');
  assert.equal(entry.limit, 1);
  const ev = act(b, g, { type: 'ability', id: 'm_sg_guard' });
  assert.equal(g.sgGuard?.target, s.id);
  assert.equal(pub(g).sgGuard, s.id);
  assert.ok(has(ev, 'の前に立った'));
  const hp0 = s.hp, ghp = g.hp;
  const hit = act(b, a[0], { type: 'attack', target: s.id });
  if (!(hit.results || []).some((r) => r.miss)) {
    assert.equal(s.hp, hp0, 'かばわれた');
    assert.ok(g.hp < ghp && has(hit, 'をかばった'));
  }
  // 次の 自分の 番で とける（battle-ch5.js の towerTurnStart → earthTurnStart）
  b.queue = [{ id: g.id, cmd: { type: 'attack', target: a[0].id }, last: true }];
  g.queued = true;
  b.executeNext();
  assert.equal(g.sgGuard, null);
  // まもり兵どうしで かばいあっても 1回だけ（止まらない ことは ない）
  const { b: b3, a: a3 } = battle({ seed: 19, enemies: ['sky_guard', 'sky_guard'], boss: false });
  const [g1, g2] = b3.enemies;
  g1.sgGuard = { target: g2.id };
  g2.sgGuard = { target: g1.id };
  const e3 = act(b3, a3[0], { type: 'attack', target: g1.id });
  assert.ok(Array.isArray(e3.lines));
});

test('大地のダンゴムシ: たたかれるほど おこる（目が 赤く・攻撃力アップ）。ねむって いる 間・1回で 大きい ダメージは おこらない。こうらで 物理が へる', () => {
  const conf = MONSTERS.earth_pillbug.anger;
  const { b, a } = battle({ seed: 20, enemies: ['earth_pillbug'], boss: false });
  const p = b.enemies[0];
  p.hp = p.maxHp = 999999;
  const ev0 = evOf(a[0]);
  for (let i = 0; i < conf.hits; i++) b.damage(a[0], p, 50, ev0, { element: 'phys' });
  assert.equal(p.anger, 1);
  assert.equal(p.buffs.atk?.mult, conf.atk[0]);
  assert.ok(ev0.pbAnger && (ev0.postLines || []).some((l) => l.includes('目が、赤くなった')));
  assert.equal(pub(p).anger, 1);
  for (let i = 0; i < conf.hits; i++) b.damage(a[0], p, 50, ev0, { element: 'phys' });
  assert.equal(p.anger, 2);
  assert.equal(p.buffs.atk.mult, conf.atk[1]);
  for (let i = 0; i < conf.hits * 3; i++) b.damage(a[0], p, 50, ev0, { element: 'phys' });
  assert.equal(p.anger, conf.atk.length, 'さいだいまで');
  // ねむっている 間は おこらない
  const { b: b2, a: a2 } = battle({ seed: 21, enemies: ['earth_pillbug'], boss: false });
  const q = b2.enemies[0];
  q.hp = q.maxHp = 999999;
  b2.rng = { chance: () => false, int: (x) => x, float: (x) => x, pick: (l) => l[0], next: () => 0.99, weighted: (l) => l[0] };
  q.status.sleep = { turns: 9 };
  for (let i = 0; i < conf.hits * 2; i++) b2.damage(a2[0], q, 50, evOf(a2[0]), { element: 'phys' });
  assert.ok(!q.anger, 'ねむって いる');
  // 1回で 大きい ダメージ
  const { b: b3, a: a3 } = battle({ seed: 22, enemies: ['earth_pillbug'], boss: false });
  const r = b3.enemies[0];
  r.hp = r.maxHp = 10000;
  for (let i = 0; i < conf.hits * 2; i++) {
    r.hp = r.maxHp;
    // こうらで へった あとの ダメージで きまる
    b3.damage(a3[0], r, Math.ceil((r.maxHp * conf.big) / MONSTERS.earth_pillbug.shell) + 10, evOf(a3[0]), { element: 'phys' });
  }
  assert.ok(!r.anger, '大きい 一撃');
  // こうら: 物理は shell ばい（呪文は そのまま）
  const { b: b4, a: a4 } = battle({ seed: 23, enemies: ['earth_pillbug'], boss: false });
  const s = b4.enemies[0];
  s.hp = s.maxHp = 999999;
  const e4 = evOf(a4[0]);
  b4.damage(a4[0], s, 1000, e4, { element: 'phys' });
  assert.equal(dmgTo(e4, s), Math.round(1000 * MONSTERS.earth_pillbug.shell));
  const e5 = evOf(a4[0]);
  b4.damage(a4[0], s, 1000, e5, { element: 'fire' });
  assert.equal(dmgTo(e5, s), 1000);
});

test('根っこのこびと: 1回 動いた あとは よく にげる（たおすと 大地の根）', () => {
  const { b } = battle({ seed: 24, enemies: ['root_sprite'], boss: false });
  const s = b.enemies[0];
  const flee = MONSTERS.root_sprite.actions.find((x) => x.id === 'm_flee');
  assert.ok(flee && flee.cond === 'c5:rsFlee' && flee.w >= 3);
  // はじめは にげない
  for (let i = 0; i < 20; i++) {
    s.recent = [];
    assert.notEqual(decideMonster(b, s).id, 'm_flee');
  }
  s.recent = ['attack'];
  let fled = 0;
  for (let i = 0; i < 60; i++) {
    s.recent = ['attack'];
    if (decideMonster(b, s).id === 'm_flee') fled++;
  }
  assert.ok(fled > 15, `${fled}`);
});

// ───────────── 知っている 人・シミュレーション ─────────────
test('知っている 人（knowsNocto1）: 前ぶれの 間は いちばん HPの 少ない 影を ねらう・間に 合わない 人は 身を 守る。ふつうの オートは かわらない', () => {
  const { b, m, a } = battle({ seed: 25 });
  act(b, m, { type: 'ability', id: CLONES });
  m.telegraph = COMBO;
  assert.equal(earthPlan(b, a[0]), null, 'ふつうは かわらない');
  b.knowsNocto1 = true;
  const [c0, c1] = clonesOf(b, m);
  c1.hp = 50;
  m.atb = 0;
  const cmd = earthPlan(b, a[0]);
  assert.ok(cmd && cmd.target === c1.id, JSON.stringify(cmd));
  assert.ok(bestHit(b, a[0], c1).dmg > 0);
  // 合体技が 先に 来て、影も たおせそうに ない
  c1.hp = c1.maxHp = 999999;
  c0.hp = c0.maxHp = 999999;
  m.atb = 99.9;
  assert.deepEqual(earthPlan(b, a[0]), { type: 'defend' });
});

test('シミュレーション: tools/sim-nocto1.mjs（超級職 4人。完全オート／知っている）。さいごまで 戦える・知っている 人は 合体技', () => {
  assert.deepEqual(nocto1Party(50).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const k of Object.values(NOCTO1_KIT)) for (const id of k) assert.ok(id === null || ITEMS[id], id);
  for (const know of [false, true]) {
    const r = nocto1Run(50, know, 5050);
    assert.ok(['win', 'lose'].includes(r.outcome), `${know}: ${r.outcome}`);
    assert.ok(r.summons >= 1 && r.traps >= 1, JSON.stringify(r));
    if (r.outcome === 'win') assert.equal(r.stopped, 1);
    if (know) assert.ok(r.duals > 0, '知っている 人は 合体技');
    else assert.equal(r.duals, 0);
  }
});

test('きまった 戦い nocto_1: 台本の ["battle", "nocto_1"] と おなじ（背景・曲・ボス）。さいごまで 動く', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(58), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'nocto_1');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'earth_temple_deep');
  assert.equal(start.snap.bgm, 'nocto_1');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.deepEqual(en.map((x) => x.species), [NOCTO1]);
  await ken.settle(60000);
  const outcome = await done;
  assert.ok(['win', 'lose'].includes(outcome), outcome);
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
    eye(cx, cy, r) { colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 4しゅと ノクト・ノクトの分身・天空のきょ兵（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  const ids = [...NEW, NOCTO1, NOCTO_CLONE, 'sky_giant'];
  for (const id of ids) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const max = [NOCTO1, 'sky_giant'].includes(id) ? 90 : 72;
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= max), `${id}: size`);
    assert.ok(d.size[1] + 2 <= BASE_Y);
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
  for (const v of EARTH_VARIANTS) assert.ok(MONSTER_ART[MONSTERS[v].art], v);
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_EARTH)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
  // ノクトと 分身 2体も ならぶ
  assert.ok((MONSTER_ART.nocto_1.size[0] + 2 * MONSTER_ART.nocto_clone.size[0] + 18) * 0.7 <= BW - 12);
});

test('絵: 戦いの 背景 3つ（根の島・大地の神殿・深い 階）と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(EARTH_BG).sort(), ['earth_temple', 'earth_temple_deep', 'root_isle']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(EARTH_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(EARTH_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawEarthBg(ctx, d, 78);
    drawEarthFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 120, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set([...Object.values(EARTH_ABILITIES).map((a) => a.anim), 'n1_reach'])];
  for (const a of own) {
    assert.equal(playEarthFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔・クモイ・星読みの エフェクトの あとに よばれる（battlefx-ch5.js → battlefx-kumoi.js → battlefx-hoshiyomi.js → battlefx-earth.js）
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playEarthFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of EARTH_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(EARTH_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(EARTH_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: 合体技の 前ぶれの 間だけ ノクトと 影の まわりに わ・おこった ダンゴムシの 目・地われの しるし・「手をのばす」の コマンド・バナー', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const nocto = { species: NOCTO1, alive: true, telegraph: false };
  const scene = { time: 100, enemies: () => [nocto] };
  const draw = (c) => { drawn.length = 0; earthDraw(scene, x, {}, c, 10, 10, 70, 86, 1); return drawn.length; };
  assert.equal(draw(nocto), 0);
  assert.equal(draw({ species: NOCTO_CLONE, alive: true }), 0);
  nocto.telegraph = true;
  assert.ok(draw(nocto) > 0);
  assert.ok(draw({ species: NOCTO_CLONE, alive: true }) > 0, '影にも わ');
  assert.equal(draw({ species: 'earth_pillbug', alive: true }), 0);
  assert.ok(draw({ species: 'earth_pillbug', alive: true, anger: 1 }) > 0, '赤い 目');
  assert.ok(draw({ species: 'v_red_earth_pillbug', alive: true, anger: 2 }) > 0, '色ちがいも');
  // 地われの しるし・コマンド
  const box = () => ({ box: { classList: { set: new Set(), toggle(k, on) { if (on) this.set.add(k); else this.set.delete(k); } }, dataset: {} } });
  const boxes = new Map([['a0', box()], ['a1', box()]]);
  const allies = [{ id: 'a0', name: 'ケン', alive: true, side: 'ally' }, { id: 'a1', name: 'ミカ', alive: true, side: 'ally', trap: 'rift' }];
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), c: new Map(allies.map((y) => [y.id, y])), fx: { play() {} }, allies: () => allies, statusBoxes: boxes, shake() {}, allyFx() {} };
  earthMarks(sc);
  assert.ok(boxes.get('a1').box.classList.set.has('n1-trap') && boxes.get('a1').box.dataset.trap === '地われの中');
  assert.ok(!boxes.get('a0').box.classList.set.has('n1-trap'));
  assert.deepEqual(trappedOthers(sc, allies[0]).map((y) => y.id), ['a1']);
  assert.equal(earthReachItem(sc, allies[0]).value, 'reach');
  assert.equal(earthReachItem(sc, allies[1]), null, '自分しか 落ちて いない');
  allies[1].trap = null;
  assert.equal(earthReachItem(sc, allies[0]), null, 'だれも 落ちて いない ときは 出ない');
  // バナー
  earthPresent(sc, { lines: [], n1Clones: ['e2', 'e3'] }, {}, null, null);
  earthPresent(sc, { lines: [] }, { type: 'telegraph' }, null, { species: NOCTO1 });
  earthPresent(sc, { lines: [], n1Break: true }, {}, null, null);
  earthPresent(sc, { lines: [], n1Trap: { who: 'a1', kind: 'rift' } }, {}, null, null);
  earthPresent(sc, { lines: [], n1Free: { who: 'a1', by: 'a0' } }, { type: 'n1Reach', targets: ['a1'] }, null, null);
  earthPresent(sc, { lines: [], n1Stop: { letter: true } }, {}, null, null);
  assert.deepEqual(banners.map((y) => y[1]), ['danger', 'danger', 'combo', 'danger', 'combo', 'combo']);
  assert.ok(banners[3][0].includes('ミカ') && banners[3][0].includes('手をのばす'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-earth.js', 'public/js/shared/data/abilities-earth.js', 'public/js/shared/data/items-earth.js',
    'public/js/shared/data/encounters-earth.js', 'public/js/shared/data/companions-earth.js', 'public/js/shared/battle-earth.js', 'public/js/client/battle-earth.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
