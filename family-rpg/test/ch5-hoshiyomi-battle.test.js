// 第5章 Step 5「星読みの里・ノクトの思い出の迷宮」B（戦い・品）
// 新しい 魔物（8しゅ。アニメの 敵ふうを ふくむ）・出現表（t5_village・t5_memory・t5_memory_deep）・仲間・ノクトの影（nocto_shadow）と
// 新しい しくみ「職業の まね」（まねた 人の 技・まねられた 人の 攻撃は 見切られて 半分）「きずなくだき」（合体技の よやくを こわす。守れば 防げる）・
// 知っている 人の オート・シミュレーション・品（里の 店・迷宮の 宝箱・ボスの 品・れん金）・ボス級「影の王」の 配合・絵・背景・エフェクト・がめん・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideMonster } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, breedCandidates, breedOutcome, rankOf, recipeHint, RANK_BREED_LV, RANKS } from '../public/js/shared/data/companions.js';
import { regionOf, starsOf, rarityOf, bossRareOf, isShopItem, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { RECIPES } from '../public/js/shared/data/alchemy.js';
import { MONSTERS_HOSHIYOMI, HOSHIYOMI_MAT_DROPS, NOCTO } from '../public/js/shared/data/monsters-hoshiyomi.js';
import { HOSHIYOMI_ABILITIES } from '../public/js/shared/data/abilities-hoshiyomi.js';
import { FRIENDS_HOSHIYOMI } from '../public/js/shared/data/companions-hoshiyomi.js';
import { ENCOUNTERS_HOSHIYOMI, FIXED_HOSHIYOMI, ZONE_BG_HOSHIYOMI, HOSHIYOMI_VARIANTS } from '../public/js/shared/data/encounters-hoshiyomi.js';
import {
  ITEMS_HOSHIYOMI, HOSHIYOMI_SHOP_WEAPONS, HOSHIYOMI_SHOP_ARMOR, HOSHIYOMI_SHOP_TOOLS, MEMORY_TREASURE, HOSHIYOMI_RECIPES, HOSHIYOMI_ITEM_KANA,
} from '../public/js/shared/data/items-hoshiyomi.js';
import { KUMOI_SHOP_WEAPONS } from '../public/js/shared/data/items-kumoi.js';
import { MONSTERS_BOSS, FRIENDS_BOSS, MATERIAL_RECIPES } from '../public/js/shared/data/monsters-boss.js';
import { MIMIC, BOND_WATCH, BOND_BREAK, bondTeams, noctoPlan, supportCmd, harmful } from '../public/js/shared/battle-nocto.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { noctoRun, noctoParty, NOCTO_KIT } from '../tools/sim-nocto.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { HOSHIYOMI_BG, HOSHIYOMI_DECOS, drawHoshiyomiBg, drawHoshiyomiFloorBg } from '../public/js/client/render/ch5-hoshiyomi-bg.js';
import { playHoshiyomiFx } from '../public/js/client/render/battlefx-hoshiyomi.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { NOCTO_SCREEN_ANIMS, NOCTO_ALLY_FX, NOCTO_SFX, noctoDraw, noctoPresent } from '../public/js/client/battle-nocto.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_HOSHIYOMI).filter((id) => id !== NOCTO);
const VILLAGE = ['black_agent', 'star_owl', 'stardust_slime'];
const MEMORY = ['lonely_ghost', 'lonely_doll', 'kage_boushi'];
const DEEP = ['soul_eater', 'homunculus_shade'];
const PARTY = (lv = 47) => [makeChar('warrior', lv, 10, 'せんし', 48), makeChar('priest', lv, 10, 'そうりょ', 48), makeChar('mage', lv, 10, 'まほう', 48), makeChar('monk', lv, 10, 'ぶとう', 48)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [NOCTO], boss: true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
const dmgTo = (ev, t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);

// ───────────── データ ─────────────
test('魔物: 里の まわり 3・迷宮 1〜3階 3・4〜6階 2 の 新しい 魔物 8しゅ（Lv45〜48・空の レアの 地方 6）と ノクトの影。技も ぜんぶ ある', () => {
  assert.deepEqual(NEW.sort(), [...VILLAGE, ...MEMORY, ...DEEP].sort());
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_HOSHIYOMI[id]);
    assert.ok(m.lv >= 45 && m.lv <= 48, id);
    assert.equal(regionOf(id), 6, id);
    assert.ok(!m.boss, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(m.desc && m.desc.length > 10, id);
  }
  // 深い 階ほど 強い（経験値も 多い）
  const avg = (ids, k) => ids.reduce((s, id) => s + MONSTERS[id][k], 0) / ids.length;
  assert.ok(avg(DEEP, 'hp') > avg(MEMORY, 'hp') && avg(DEEP, 'exp') > avg(MEMORY, 'exp'));
  // アニメの 敵ふう: そのままの 名前は 使わない。光が よく 効く（たましいすい・ひとがたの影）
  const names = NEW.map((id) => MONSTERS[id].name).join('');
  for (const w of ['ディメンター', '吸魂鬼', 'ホムンクルス', 'ジン', 'ウォッカ', '黒の組織']) assert.ok(!names.includes(w), w);
  assert.ok(MONSTERS.soul_eater.resist.light >= 1.5 && MONSTERS.homunculus_shade.resist.light > 1);
  assert.ok(MONSTERS.homunculus_shade.actions.some((a) => ABILITIES[a.id]?.effect.type === 'regen'), 'ひとがたの影は じわじわ 回復');
  // ノクトの影
  const n = MONSTERS[NOCTO];
  assert.ok(n.boss && n.turns === 2 && n.lv >= 47);
  for (const a of n.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], a.id);
  assert.ok(ABILITIES[MIMIC] && ABILITIES[BOND_WATCH].effect.next === BOND_BREAK && ABILITIES[BOND_BREAK].effect.type === 'nsBondBreak');
  for (const a of Object.values(HOSHIYOMI_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
});

test('落とす物: ノクトの影は 影星のペンダント（1人 1つ）と 影のマントを かならず。ふつうの 魔物は よく・レア・素材（星の砂・影のしずく）', () => {
  const bd = monsterDrops(NOCTO).filter((d) => d.kind === 'boss');
  assert.deepEqual(bd.map((d) => d.item), ['shade_pendant']);
  assert.ok(ITEMS.shade_pendant.unique && ITEMS.shade_pendant.type === 'acc');
  assert.equal(bossRareOf(NOCTO), 'shade_cloak');
  for (const id of NEW) {
    assert.ok(MAT_DROPS[id], id);
    assert.equal(MAT_DROPS[id], HOSHIYOMI_MAT_DROPS[id]);
    assert.ok(['star_sand', 'shade_drop'].includes(MAT_DROPS[id][0]));
  }
  for (const id of ['star_sand', 'shade_drop']) assert.equal(ITEMS[id].type, 'mat');
});

test('仲間: 新しい 魔物 8しゅは 仲間に なる（1/12〜1/24・系統配合の 子には ならない・覚える 技は ある）。ノクトの影は ならない', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_HOSHIYOMI[id]);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 12, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    for (const [, ab] of f.learn) assert.ok(ABILITIES[ab], `${id}: ${ab}`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.4, `${id}: ${sum}`);
    assert.ok(!f.learn.some(([, ab]) => ab.startsWith('m_ns_')), id);
  }
  assert.ok(!MONSTER_FRIENDS[NOCTO]);
  // 深い 階の 2しゅは めったに ならない
  for (const id of DEEP) assert.ok(MONSTER_FRIENDS[id].rate <= 1 / 20);
});

test('出現表と きまった 戦い: 名前の 約束（t5_village・t5_memory・t5_memory_deep／nocto_shadow・背景 hoshiyomi・memory・memory_deep・曲 nocto_shadow）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_HOSHIYOMI), ['t5_village', 't5_memory', 't5_memory_deep']);
  for (const [t, list] of Object.entries(ENCOUNTERS_HOSHIYOMI)) {
    assert.equal(ENCOUNTER_TABLES[t], list);
    for (const e of list) for (const [sp, mn, mx] of e.group) {
      assert.ok(MONSTERS[sp], `${t}: ${sp}`);
      assert.ok(mn >= 0 && mx >= mn && mx <= 3);
    }
  }
  const sps = (t) => new Set(ENCOUNTERS_HOSHIYOMI[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const id of VILLAGE) assert.ok(sps('t5_village').has(id));
  for (const id of MEMORY) assert.ok(sps('t5_memory').has(id));
  for (const id of DEEP) assert.ok(sps('t5_memory_deep').has(id));
  for (const v of HOSHIYOMI_VARIANTS) assert.ok(sps('t5_memory_deep').has(v) && MONSTERS[v], v);
  assert.deepEqual(ZONE_BG_HOSHIYOMI, { t5_village: 'hoshiyomi', t5_memory: 'memory', t5_memory_deep: 'memory_deep' });
  for (const [t, bg] of Object.entries(ZONE_BG_HOSHIYOMI)) assert.equal(ZONE_BG[t], bg);
  const f = FIXED_ENCOUNTERS.nocto_shadow;
  assert.equal(f, FIXED_HOSHIYOMI.nocto_shadow);
  assert.deepEqual(f.group, [[NOCTO, 1, 1]]);
  assert.equal(f.bg, 'memory_deep');
  assert.equal(f.bgm, 'nocto_shadow');
  assert.ok(f.boss && f.canFlee === false && !f.loseOk);
});

test('里の 店（ランク8の 上の ほう・★1・きたえられない）: 武器は 10しゅるい ぜんぶ・防具・道具。ハネノの 店より 少し 強い', () => {
  const cats = HOSHIYOMI_SHOP_WEAPONS.map((id) => ITEMS[id].cat);
  assert.deepEqual(cats.sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  for (const id of [...HOSHIYOMI_SHOP_WEAPONS, ...HOSHIYOMI_SHOP_ARMOR]) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_HOSHIYOMI[id]);
    assert.ok(it.price > 0 && it.rank === 8 && it.rarity === 0, id);
    assert.equal(starsOf(id), 1, `${id}: ★1`);
    assert.ok(isShopItem(id), id);
  }
  for (const id of HOSHIYOMI_SHOP_TOOLS) assert.ok(ITEMS[id] && ITEMS[id].price > 0, id);
  const byCat = (list, cat) => ITEMS[list.find((id) => ITEMS[id].cat === cat)];
  for (const cat of ['sword', 'axe', 'claw', 'bat']) assert.ok(byCat(HOSHIYOMI_SHOP_WEAPONS, cat).atk > byCat(KUMOI_SHOP_WEAPONS, cat).atk, cat);
  assert.ok(ITEMS.hoshi_konpeito.effect.type === 'mpHeal');
  for (const id of Object.keys(ITEMS_HOSHIYOMI)) assert.ok(HOSHIYOMI_ITEM_KANA[id], `${id} の よみがな`);
});

test('迷宮の 宝箱（MEMORY_TREASURE）: 1〜6階に 1〜2こ・そこだけの 品（ランク8 なので ★4）。深い 階ほど めずらしく 強い。店の 品より 強い', () => {
  assert.deepEqual(Object.keys(MEMORY_TREASURE).map(Number), [1, 2, 3, 4, 5, 6]);
  let last = 0;
  const all = [];
  for (const [fl, ids] of Object.entries(MEMORY_TREASURE)) {
    assert.ok(ids.length >= 1 && ids.length <= 2, fl);
    for (const id of ids) {
      const it = ITEMS[id];
      assert.ok(it && it.src === 'memory' && it.rank === 8 && it.price === 0 && it.sell > 0, id);
      assert.equal(starsOf(id), 4, `${id}: ★4（ランク8）`);
      assert.equal(rareWhereText(id), '迷宮の宝箱でしか手に入らない');
      assert.ok(rarityOf(id) >= last, `${id}: めずらしさが 下がらない`);
      all.push(id);
    }
    last = Math.max(...ids.map(rarityOf));
  }
  assert.equal(new Set(all).size, all.length);
  assert.equal(rarityOf(MEMORY_TREASURE[1][0]), 2);
  assert.equal(rarityOf(MEMORY_TREASURE[6][0]), 4);
  // 同じ 種類の 店の 品（★1）より 強い
  const shopOf = (it) => [...HOSHIYOMI_SHOP_WEAPONS, ...HOSHIYOMI_SHOP_ARMOR].map((id) => ITEMS[id]).find((s) => s.type === it.type && (it.type !== 'weapon' || s.cat === it.cat) && (it.type !== 'armor' || s.armorType === it.armorType) && (it.type !== 'head' || !!s.helm === !!it.helm));
  for (const id of all) {
    const it = ITEMS[id], s = shopOf(it);
    if (!s) continue;
    assert.ok((it.atk || it.def) >= (s.atk || s.def), `${id}: ${it.atk || it.def} < ${s.atk || s.def}`);
  }
});

test('れん金: この章の 素材（星の砂・影のしずく）の レシピ 3つ。影のマント → 夜明けのマント・星読みのつえ → 星読みの大づえ', () => {
  assert.equal(HOSHIYOMI_RECIPES.length, 3);
  for (const r of HOSHIYOMI_RECIPES) {
    assert.ok(RECIPES.includes(r), r.id);
    assert.ok(ITEMS[r.out], r.out);
    for (const i of r.ins) assert.ok(ITEMS[i], i);
    assert.ok(r.ins.some((i) => ['star_sand', 'shade_drop'].includes(i)));
  }
  assert.equal(ITEMS.dawn_cloak.src, 'alchemy');
  assert.ok(ITEMS.dawn_cloak.def > ITEMS.shade_cloak.def);
  assert.ok(ITEMS.hoshi_great_staff.bonus.mag > ITEMS.hoshi_staff.bonus.mag);
});

test('影の王: たましいすい × ひとがたの影（か 悪魔系の S ＋ S）＋ 影星のペンダント → ボス級（SS）。配合でしか 会えない・ランク配合では 生まれない', () => {
  const sk = 'ss_shadow_king';
  assert.ok(MONSTERS[sk] && MONSTERS[sk] === MONSTERS_BOSS[sk] && MONSTERS[sk].breedOnly && !MONSTERS[sk].boss);
  assert.equal(MONSTERS[sk].name, '影の王');
  const f = MONSTER_FRIENDS[sk];
  assert.ok(f === FRIENDS_BOSS[sk] && f.rank === 'SS' && f.recipeOnly && f.materialOnly && f.rate === 0);
  for (const [, ab] of f.learn) assert.ok(ABILITIES[ab], ab);
  // 第43回 A: ランクは めずらしさ（たましいすい・ひとがたの影は S では ない。この 2ひきの 組み合わせは ランクを とわない）
  assert.ok(RANKS.includes(rankOf('soul_eater', MONSTERS)) && RANKS.includes(rankOf('homunculus_shade', MONSTERS)));
  assert.ok(MATERIAL_RECIPES.some((r) => r.a === 'soul_eater' && r.b === 'homunculus_shade' && r.item === 'shade_pendant' && r.child === sk));
  const lv = (sp, level = 20) => ({ species: sp, level });
  const bag = { items: [{ id: 'shade_pendant', n: 1 }] };
  // どちらを 1ぴきめに しても おなじ・いちばん 上
  for (const [x, y] of [['soul_eater', 'homunculus_shade'], ['homunculus_shade', 'soul_eater']]) {
    const o = breedOutcome(lv(x), lv(y), MONSTERS, bag);
    assert.equal(o.child, sk);
    assert.equal(o.kind, 'material');
    assert.equal(o.item, 'shade_pendant');
    assert.equal(o.rank, 'SS');
  }
  // 悪魔系の S ＋ S ランク でも（かげの魔道士 ＋ からくり騎士。第43回 A: 黒ずくめの追っ手・星読みフクロウは もう S では ない）
  assert.ok(breedCandidates(lv('shadow_mage'), lv('clockwork_knight'), MONSTERS, bag).list.includes(sk));
  assert.ok(!breedCandidates(lv('black_agent'), lv('star_owl'), MONSTERS, bag).list.includes(sk));
  // 品が ない・ランク配合（S Lv30 × S Lv30）では 生まれない
  assert.ok(!breedCandidates(lv('soul_eater'), lv('homunculus_shade'), MONSTERS, { items: [] }).list.includes(sk));
  const rank = breedCandidates(lv('soul_eater', RANK_BREED_LV), lv('homunculus_shade', RANK_BREED_LV), MONSTERS);
  assert.ok(!rank.items.some((it) => it.kind === 'rank') && !rank.list.includes(sk));
  assert.match(recipeHint(sk, MONSTERS), /配合でしか会えない/);
  assert.ok(MONSTER_ART[MONSTERS[sk].art], 'え');
});

// ───────────── たたかい: 職業の まね ─────────────
test('はじめ: ノクトの影は だれか 1人（人を 先に）の すがたと 職業を まねる。まねた 人の 技（回復を のぞく）を おぼえる。がめんへ（mimic・nsMimicked）', () => {
  const { b, m, a } = battle();
  assert.ok(m.mimic, 'まねている');
  const t = b.get(m.mimic.of);
  assert.ok(a.includes(t) && t.nsMimicked && !t.mon);
  assert.equal(m.mimic.job, t.job);
  assert.ok(m.abilities.length > 0 && m.abilities.every((id) => t.abilities.includes(id)));
  for (const id of m.abilities) assert.ok(!['heal', 'revive', 'cure', 'regen'].includes(ABILITIES[id].effect.type === 'multi' ? ABILITIES[id].effect.parts[0].type : ABILITIES[id].effect.type), id);
  assert.equal(a.filter((x) => x.nsMimicked).length, 1);
  assert.deepEqual(pub(m).mimic.name, t.name);
  assert.equal(pub(t).nsMimicked, true);
  const start = b.events.find((e) => e.t === 'msg' && e.fx?.type === 'nsMimic');
  assert.ok(start && start.lines.some((l) => l.includes('すがたと職業をまねた')));
});

test('まね: mimicEvery 回 動くと かならず「影のまね」（ちがう 人を まねる）。まねた 人の 技を 使う ことが ある', () => {
  const { b, m } = battle({ seed: 5 });
  const conf = MONSTERS[NOCTO].nocto;
  const first = m.mimic.of;
  let cmd;
  for (let i = 0; i <= conf.mimicEvery; i++) cmd = decideMonster(b, m);
  assert.equal(cmd.id, MIMIC);
  const ev = act(b, m, cmd);
  assert.notEqual(m.mimic.of, first, 'ちがう 人');
  assert.ok(has(ev, 'すがたと職業をまねた'));
  assert.ok(ev.nsMimic && ev.nsMimic.who === m.mimic.of);
  assert.equal(b.allies.filter((x) => x.nsMimicked).length, 1);
  // まねた 人の 技（何回か えらぶと 出る）
  let copied = 0;
  for (let i = 0; i < 40; i++) {
    m.nsActs = 0;
    const c = decideMonster(b, m);
    if (c.nsMimic) {
      copied++;
      assert.ok(m.abilities.includes(c.id), c.id);
    }
  }
  assert.ok(copied > 5 && copied < 35, `${copied}`);
});

test('見切り: まねられた 人の 攻撃は ダメージが 半分（ことばは さいしょの 数回）。ほかの 人・合体技は そのまま', () => {
  const { b, m, a } = battle({ seed: 9 });
  const who = b.get(m.mimic.of);
  const other = a.find((x) => x !== who && x.atk > 100) || a.find((x) => x !== who);
  b.rng = makeRng(1);
  const hit = (c) => {
    const saved = { atk: c.atk };
    c.atk = 400;
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      m.hp = m.maxHp;
      b.rng = makeRng(100 + i);
      sum += dmgTo(act(b, c, { type: 'attack', target: m.id }), m);
    }
    Object.assign(c, saved);
    return sum;
  };
  const dw = hit(who), dx = hit(other);
  assert.ok(dw > 0 && dw < dx * 0.65, `${dw} / ${dx}`);
  b.nsSaid = 0;
  const ev = act(b, who, { type: 'attack', target: m.id });
  assert.ok(ev.nsSeen || ev.results.some((r) => r.miss), 'みきられた');
  if (ev.nsSeen) assert.ok(has(ev, '動きを知っている'));
  assert.ok(harmful({ type: 'attack' }) && !harmful({ type: 'defend' }) && !harmful({ type: 'ability', id: 'hoimi' }));
});

// ───────────── たたかい: きずなくだき ─────────────
test('前ぶれ: 合体技を 見た 影は、次に かならず「きずなくだき」の 前ぶれ。その 次の 番に きずなくだき（大技）', () => {
  const { b, m, a } = battle({ seed: 11 });
  m.nsActs = 0;
  // 合体技（ミナデイン）を 出した
  act(b, a[0], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[2].id, a[3].id], target: m.id });
  const c1 = decideMonster(b, m);
  assert.equal(c1.id, BOND_WATCH);
  const ev = act(b, m, c1);
  assert.equal(m.telegraph, BOND_BREAK);
  assert.ok(has(ev, 'きずなを、じっとにらんでいる'));
  const c2 = decideMonster(b, m);
  assert.equal(c2.id, BOND_BREAK);
  assert.ok(c2.big);
  // 合体技を 見なければ、前ぶれは まれ（つづけては しない）
  const c3 = decideMonster(b, m);
  assert.notEqual(c3.id, BOND_BREAK);
});

test('きずなくだき: 合体技の よやくは、組の だれも 身を 守って いないと くだかれる（ゲージ 0・影が 強く なる）。守って いれば 守れる。身を 守ると ダメージ 半分', () => {
  for (const guard of [false, true]) {
    const { b, m, a } = battle({ seed: 21 });
    m.atk = 300;
    // a[0] が a[1] と よやく（a[1] の ゲージは まだ）
    for (const x of a) { x.ready = false; x.atb = 30; }
    a[0].ready = true;
    a[0].atb = 100;
    const r = b.startDual(a[0], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[2].id, a[3].id], target: m.id });
    assert.ok(r.ok && r.waiting, 'よやく');
    assert.ok(a[0].waitDual);
    assert.equal(bondTeams(b).length, 1);
    if (guard) a[2].defending = true;
    const atkBefore = m.buffs.atk;
    const ev = act(b, m, { type: 'ability', id: BOND_BREAK, big: true });
    assert.ok(ev.nsBond);
    if (guard) {
      assert.ok(a[0].waitDual, '守れた');
      assert.deepEqual(ev.nsBond.guarded, [a[2].id]);
      assert.equal(ev.nsBond.broke, 0);
      assert.ok(has(ev, 'きずなを守りぬいた'));
      assert.equal(m.buffs.atk, atkBefore);
    } else {
      assert.equal(a[0].waitDual, null, 'くだかれた');
      assert.equal(a[0].atb, 0);
      assert.ok(a.every((x) => x.dualTarget !== a[0].id));
      assert.equal(ev.nsBond.broke, 1);
      assert.ok(has(ev, '合体技のよやくが、くだかれた'));
      assert.ok(m.buffs.atk, '影が 強く なる');
    }
    assert.ok(ev.results.filter((x) => x.dmg > 0).length >= 2, 'みんなに ダメージ');
  }
  // 身を 守ると 半分くらい
  const sum = (def) => {
    let s = 0;
    for (let i = 0; i < 20; i++) {
      const { b, m, a } = battle({ seed: 40 + i });
      a[1].defending = def;
      s += dmgTo(act(b, m, { type: 'ability', id: BOND_BREAK }), a[1]);
    }
    return s;
  };
  const open = sum(false), def = sum(true);
  assert.ok(def < open * 0.65, `${def} / ${open}`);
});

test('ならんで 出る のを まっている 合体技も くだかれる（だれも 守って いない とき）', () => {
  const { b, m, a } = battle({ seed: 31 });
  for (const x of a) { x.ready = true; x.atb = 100; x.queued = false; }
  const r = b.startDual(a[0], { type: 'dual', id: 'dt_minadein', partner: a[1].id, partners: [a[1].id, a[2].id, a[3].id], target: m.id });
  assert.ok(r.ok && !r.waiting);
  assert.ok(b.queue.some((q) => q.cmd?.type === 'dual'));
  const ev = act(b, m, { type: 'ability', id: BOND_BREAK });
  assert.equal(ev.nsBond.broke, 1);
  assert.ok(!b.queue.some((q) => q.cmd?.type === 'dual'));
  assert.ok(a.every((x) => !x.queued && !x.dualWith && x.atb === 0));
});

test('オートの 仲間（ふつう）は 何も かわらない。知っている 人（knowsNocto）は 前ぶれで 身を 守り、まねられた 人は 攻撃の かわりに 回復・強くする 技・防御', () => {
  const { b, m, a } = battle({ seed: 13 });
  const who = b.get(m.mimic.of);
  assert.equal(noctoPlan(b, who, () => ({ type: 'attack', target: m.id })), null, 'ふつうは かわらない');
  b.knowsNocto = true;
  const alt = noctoPlan(b, who, () => ({ type: 'attack', target: m.id }));
  assert.ok(alt && !harmful(alt), JSON.stringify(alt));
  assert.deepEqual(supportCmd(b, who).type === 'ability' || supportCmd(b, who).type === 'defend', true);
  // 前ぶれ: 番が 先に 来る 人・合体技の 組の 人は 身を 守る
  const other = a.find((x) => x !== who);
  m.telegraph = BOND_BREAK;
  m.atb = 99;
  assert.deepEqual(noctoPlan(b, other, () => ({ type: 'attack', target: m.id })), { type: 'defend' });
  m.atb = 0;
  other.atb = 0;
  b.nsNoGuard = false;
  // 番が あとで、組でも ない ときは ふつう
  const plain = noctoPlan(b, other, () => ({ type: 'attack', target: m.id }));
  assert.ok(plain === null || plain.type === 'defend');
});

test('シミュレーション: tools/sim-nocto.mjs（超級職 4人。完全オート／知っている）。さいごまで 戦える・知っている 人は 合体技', () => {
  assert.deepEqual(noctoParty(47).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const k of Object.values(NOCTO_KIT)) for (const id of k) assert.ok(id === null || ITEMS[id], id);
  for (const know of [false, true]) {
    const r = noctoRun(47, know, 4747);
    assert.ok(['win', 'lose'].includes(r.outcome), `${know}: ${r.outcome}`);
    assert.ok(r.mimics >= 1);
    if (know) assert.ok(r.duals > 0 && r.bonds > 0, '知っている 人は 合体技 → きずなくだき');
    else assert.equal(r.duals, 0);
  }
});

test('きまった 戦い nocto_shadow: 台本の ["battle", "nocto_shadow"] と おなじ（背景・曲・ボス・まね）。さいごまで 動く', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(57), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'nocto_shadow');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'memory_deep');
  assert.equal(start.snap.bgm, 'nocto_shadow');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.deepEqual(en.map((x) => x.species), [NOCTO]);
  assert.equal(en[0].mimic.job, 'warrior');
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

test('絵: 新しい 魔物 8しゅと ノクトの影・影の王（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  const ids = [...NEW, NOCTO, 'shadow_king'];
  for (const id of ids) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const max = id === NOCTO || id === 'shadow_king' ? 90 : 70;
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
    if (MONSTERS[id]?.flying) assert.ok(W > H, `${id}: とぶ 魔物は よこに ひろい`);
  }
  // 色ちがい（深い 階）も 絵が ある
  for (const v of HOSHIYOMI_VARIANTS) assert.ok(MONSTER_ART[MONSTERS[v].art], v);
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_HOSHIYOMI)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
});

test('絵: 戦いの 背景 3つ（星読みの里の 夜空・思い出の迷宮・深い 階）と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(HOSHIYOMI_BG).sort(), ['hoshiyomi', 'memory', 'memory_deep']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(HOSHIYOMI_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(HOSHIYOMI_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawHoshiyomiBg(ctx, d, 78);
    drawHoshiyomiFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 120, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(HOSHIYOMI_ABILITIES).map((a) => a.anim))];
  for (const a of own) {
    assert.equal(playHoshiyomiFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔・クモイの エフェクトの あとに よばれる（battlefx-ch5.js → battlefx-kumoi.js → battlefx-hoshiyomi.js）
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playHoshiyomiFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of NOCTO_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(NOCTO_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(NOCTO_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: きずなくだきの 前ぶれの 間だけ 影の まわりに わ。まねた・くだかれた・守りぬいた ときの バナー', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 100 };
  const draw = (c) => { drawn.length = 0; noctoDraw(scene, x, {}, c, 10, 10, 72, 84, 1); return drawn.length; };
  assert.equal(draw({ species: NOCTO, alive: true, telegraph: false }), 0);
  assert.ok(draw({ species: NOCTO, alive: true, telegraph: true }) > 0);
  assert.equal(draw({ species: 'argos', alive: true, telegraph: true }), 0);
  const banners = [];
  const who = { id: 'a1', name: 'ケン', side: 'ally' };
  const sc = { game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), c: new Map([['a1', who]]), fx: { play() {} }, allies: () => [], statusBoxes: new Map() };
  noctoPresent(sc, { lines: [], nsMimic: { who: 'a1' } }, {}, null, null);
  noctoPresent(sc, { lines: [] }, { type: 'telegraph' }, null, { species: NOCTO });
  noctoPresent(sc, { lines: [], nsBond: { broke: 1, guarded: [] } }, {}, null, null);
  noctoPresent(sc, { lines: [], nsBond: { broke: 0, guarded: ['a1'] } }, {}, null, null);
  assert.deepEqual(banners.map((b) => b[1]), ['danger', 'danger', 'danger', 'combo']);
  assert.ok(banners[0][0].includes('ケン'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-hoshiyomi.js', 'public/js/shared/data/abilities-hoshiyomi.js', 'public/js/shared/data/items-hoshiyomi.js',
    'public/js/shared/data/encounters-hoshiyomi.js', 'public/js/shared/data/companions-hoshiyomi.js', 'public/js/shared/battle-nocto.js', 'public/js/client/battle-nocto.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((x) => x.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
