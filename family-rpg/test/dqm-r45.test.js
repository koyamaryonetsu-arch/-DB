// 第45回（ドラクエふう D1。docs/plan-breed-new.md の 7-1 の 2回目）: ドラクエふうの 魔物 11しゅ（配合だけ）
//   data/monsters-dqm.js・data/companions-dqm.js・data/abilities-dqm.js・data/items-dqm.js
//   S の 特定配合（どちらも Lv50 いじょう）・素材配合（四季のこよみ・竜王のしるし）・ゴールドぷるりん（お金）・ひとくい箱（会心）・図鑑の ならび
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import {
  MONSTER_FRIENDS, RANKS, rankOf, rankIdx, breedCandidates, breedOutcome, familyPool, monsterLevelCap, recipeHint, breedRumors,
  bestiaryOrder, bestiaryKnow, bestiaryAfter, BREED_RECIPES, MATERIAL_RECIPES, EVOLVE_FROM, rankUpNeed, bossClassList,
} from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { MONSTERS_DQM } from '../public/js/shared/data/monsters-dqm.js';
import {
  FRIENDS_DQM, RECIPES_DQM, MATERIAL_RECIPES_DQM, TREASURE_KIN, DQM_S_LV, DQM_KEY_CHILD, dqKeyDue,
} from '../public/js/shared/data/companions-dqm.js';
import { FIRE_KIN } from '../public/js/shared/data/companions-pokemon.js';
import { DQM_ABILITIES } from '../public/js/shared/data/abilities-dqm.js';
import { DQM_ITEMS } from '../public/js/shared/data/items-dqm.js';
import { PRIZES, MEDAL_REWARDS } from '../public/js/shared/data/casino.js';
import { ARENA_RANKS } from '../public/js/shared/data/arena.js';
import { SD_OPEN_FLAG, SD_KOYOMI_FLOOR, SD_MEW_FLOOR, sdFloorId, sdKeyRewards, sdBigReward } from '../public/js/shared/data/secret.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { powerScore } from '../public/js/shared/breed-calc.js';
import { computeStats, newMonsterCompanion, gainExp, expForLevel, learnedAbilities, addItem, hasKeyItem } from '../public/js/shared/stats.js';
import { addMonsterCompanion, growCompanion } from '../public/js/shared/world/party.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { clearRewards } from '../public/js/shared/world/arena.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { upgradeSave, repairChar } from '../public/js/shared/world/save.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { wildRecruits } from '../tools/gen-monster-ranks.mjs';
import { Bot } from './helpers.js';

// 名前の 約束（絵の 係 D2 と おなじ）
const DQM = {
  queen_pururin: ['ぷるりんクイーン', 'slime', 'B'], gold_pururin: ['ゴールドぷるりん', 'slime', 'B'],
  rose_queen: ['ローズクイーン', 'plant', 'A'], yggdra_child: ['せかいじゅの子', 'plant', 'S'],
  lantern_ghost: ['ランタンゴースト', 'undead', 'B'], skeleton_king: ['がいこつ王', 'undead', 'S'],
  koyomi_spirit: ['こよみのせいれい', 'spirit', 'S'],
  killer_karakuri: ['キラーからくり', 'material', 'A'], hitokui_box: ['ひとくい箱', 'material', 'B'],
  petit_devil: ['プチデビ', 'demon', 'C'], ryuou_grandson: ['竜王のまご', 'dragon', 'S'],
};
const IDS = Object.keys(DQM);
const D2_ANIMS = ['dq_gold_rain', 'dq_rose_storm', 'dq_world_tree', 'dq_lantern', 'dq_bone_king', 'dq_seasons', 'dq_killer_slash', 'dq_chomp', 'dq_dragon_lord'];
// 看板の 技（その しゅぞくが 覚える）
const SIGNATURE = {
  gold_pururin: 'dq_gold_rain', rose_queen: 'dq_rose_storm', yggdra_child: 'dq_world_tree', lantern_ghost: 'dq_lantern', skeleton_king: 'dq_bone_king',
  koyomi_spirit: 'dq_seasons', killer_karakuri: 'dq_killer_slash', hitokui_box: 'dq_chomp', ryuou_grandson: 'dq_dragon_lord',
};
const lv = (species, level = 20, plus = 0, extra = {}) => ({ species, level, plus, ...extra });
const power = (sp, level = 60, plus = 10) => powerScore(computeStats({ species: sp, level, plus, ranked: 1, seeds: {}, equip: {} }));
const median = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const gsum = (sp) => Object.values(MONSTER_FRIENDS[sp].growth).reduce((a, b) => a + b, 0);
const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

async function solo(seed = 45, level = 30, job = 'warrior') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.hp = computeStats(c).maxHp;
  return { world, bot, c };
}
const join = (world, bot, sp, level) => {
  const r = addMonsterCompanion(world, bot.s, sp, level);
  assert.ok(r.ok, r.reason);
  const c = world.data.characters[bot.char.id];
  return c.companions.find((e) => e.key === r.key);
};
const sayTexts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say').map((s) => s[2]));

// ───────────── データ ─────────────
test('ドラクエふう 11しゅ: 名前の 約束（しゅぞくID・名前・系統）。配合だけ（やせい・系統配合では 生まれない）・ランクは 手で きめる', () => {
  assert.deepEqual(Object.keys(MONSTERS_DQM).sort(), IDS.slice().sort());
  assert.deepEqual(Object.keys(FRIENDS_DQM).sort(), IDS.slice().sort());
  const names = new Set(Object.entries(MONSTERS).filter(([sp]) => !DQM[sp]).map(([, m]) => m.name));
  for (const sp of IDS) {
    const [name, race, rank] = DQM[sp];
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_DQM[sp], sp);
    assert.equal(f, FRIENDS_DQM[sp], sp);
    assert.equal(m.name, name, sp);
    assert.ok(!names.has(m.name), `${m.name}: 名前が かぶらない`);
    assert.equal(m.race, race, `${sp} の 系統`);
    assert.ok(m.breedOnly && !m.boss && f.breedOnly && f.recipeOnly && f.rate === 0, sp);
    assert.equal(f.rank, rank, `${sp} の ランク`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.ok(!MONSTER_RANKS[sp], `${sp}: やせいの ランクの 表には 入らない`);
    assert.ok(!wildRecruits().includes(sp), sp);
    assert.ok(!familyPool(m.race, MONSTERS).includes(sp), `${sp}: 系統配合では 生まれない`);
    assert.ok(!bossClassList(MONSTERS).includes(sp), `${sp}: SS では ない`);
    // 敵としても 出せる 形（数字・技・説明）
    assert.ok(m.lv > 12 && m.hp > 0 && m.str > 0 && m.def > 0 && m.agi > 0 && m.desc && Array.isArray(m.actions), sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(f.names.length >= 4 && f.names.every((n) => n.length <= 8), sp);
    assert.ok(f.note, sp);
    const st = computeStats(newMonsterCompanion({ id: 'x', species: sp, level: 10 }));
    assert.ok(st.maxHp > 30 && st.maxHp < 200 && st.atk > 15 && st.atk < 90, sp);
    assert.ok(learnedAbilities(newMonsterCompanion({ id: 'x', species: sp, level: 10 })).length >= 2, sp);
    if (SIGNATURE[sp]) assert.ok(f.learn.some(([, id]) => id === SIGNATURE[sp]), `${sp}: 看板の 技 ${SIGNATURE[sp]}`);
  }
  // 敵の キラーからくりは 2回行動
  assert.equal(MONSTERS.killer_karakuri.turns, 2);
  // レベルの 上限（ランクで きまる）
  assert.equal(monsterLevelCap({ species: 'petit_devil', ranked: 1, level: 1 }, MONSTERS), 100);
  assert.equal(monsterLevelCap({ species: 'rose_queen', ranked: 1, level: 1 }, MONSTERS), 120);
  assert.equal(monsterLevelCap({ species: 'ryuou_grandson', ranked: 1, level: 1, plus: 5 }, MONSTERS), 135);
});

test('強さ（Lv60・＋10・装備なし）: B 1000〜1100・A 1150〜1250・S 1250〜1350（SS より 下）。S の まん中は 人の 1.1倍まで', () => {
  const band = { C: [930, 1000], B: [1000, 1100], A: [1150, 1250], S: [1250, 1350] };
  for (const sp of IDS) {
    const p = power(sp);
    const [lo, hi] = band[DQM[sp][2]];
    assert.ok(p >= lo && p <= hi, `${sp}（${DQM[sp][2]}）: ${Math.round(p)}`);
  }
  const ss = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTER_FRIENDS[sp].rank === 'SS' && MONSTERS[sp]).map((sp) => power(sp));
  const maxS = Math.max(...IDS.filter((sp) => DQM[sp][2] === 'S').map((sp) => power(sp)));
  assert.ok(maxS < median(ss) * 1.05, `S ${Math.round(maxS)} は SS（まん中 ${Math.round(median(ss))}）より 上に ならない`);
  // ランク S の まん中（test/monsters-r43a.test.js と おなじ）
  const S = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp] && MONSTER_FRIENDS[sp].rank !== 'SS' && rankOf(sp, MONSTERS) === 'S').map((sp) => power(sp));
  assert.ok(median(S) <= 1088 * 1.1, `S ${median(S)}`);
  // のびかたの 合計（ボス級 SS は 7〜8.7）
  for (const sp of IDS) assert.ok(gsum(sp) <= 8.2, `${sp}: ${gsum(sp)}`);
});

test('技: dq_〜（abilities-dqm.js）。看板の 技の えんしゅつは 名前の 約束（D2）。強さの 上限', () => {
  for (const [id, a] of Object.entries(DQM_ABILITIES)) {
    assert.ok(id.startsWith('dq_'), id);
    assert.equal(ABILITIES[id], a, id);
    assert.ok(a.kind === 'monster' && a.name && a.kana && a.desc && a.cast && a.anim && a.effect?.type && a.target, id);
    const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
    for (const e of parts) {
      if (e.type === 'magic') assert.ok(e.base[1] <= 180, a.name);
      if (e.type === 'phys') assert.ok(e.mult * (e.hits || 1) <= 2.6, a.name);
      if (e.type === 'buff' && a.target === 'allies') assert.ok(e.mult <= 1.35, a.name);
    }
  }
  const used = new Set(Object.values(DQM_ABILITIES).map((a) => a.anim));
  for (const an of D2_ANIMS) assert.ok(used.has(an), an);
  for (const [sp, id] of Object.entries(SIGNATURE)) assert.ok(ABILITIES[id].anim.startsWith('dq_'), `${sp}: ${id}`);
  // 四季の めぐり: 4回（春・夏・秋・冬）。合わせて 全体の おうぎ（180）くらい
  const seasons = ABILITIES.dq_seasons.effect.parts;
  assert.equal(seasons.length, 4);
  assert.ok(seasons.reduce((s, e) => s + e.base[1], 0) <= 180);
  // 竜王へんしん: 自分が 強く なって（竜の すがた）、敵全体に 大きな 炎の 息
  const dl = ABILITIES.dq_dragon_lord.effect.parts;
  assert.ok(dl.some((e) => e.type === 'buff' && e.target === 'self'));
  assert.ok(dl.some((e) => e.type === 'magic' && e.element === 'fire' && e.breath && e.base[0] >= 140));
  // キラーからくり: 2回こうげき（キラーれんぎりは Lv1 から）
  assert.equal(ABILITIES.dq_killer_slash.effect.hits, 2);
  assert.ok(!ABILITIES.dq_killer_slash.effect.random);
  assert.deepEqual(MONSTER_FRIENDS.killer_karakuri.learn[0], [1, 'dq_killer_slash']);
  // ひとくい箱: 会心が 出やすい かみつき
  assert.ok(ABILITIES.dq_chomp.effect.critBonus >= 0.2);
});

// ───────────── とくちょう ─────────────
test('ひとくい箱: 会心が 出やすい（しゅぞくの crit。装備の 会心に たす）。ほかの 魔物は かわらない', () => {
  const box = newMonsterCompanion({ id: 'x', species: 'hitokui_box', level: 20 });
  assert.equal(computeStats(box).crit, 0.08);
  box.equip.weapon = null;
  assert.equal(computeStats(newMonsterCompanion({ id: 'y', species: 'mimic', level: 20 })).crit, 0);
  for (const sp of IDS) if (sp !== 'hitokui_box') assert.equal(computeStats(newMonsterCompanion({ id: 'z', species: sp, level: 20 })).crit, 0, sp);
});

test('ゴールドぷるりん: パーティーに いると 戦いの あとの お金が ふえる（1.3倍。職業の お金の 倍率と おなじ しくみ）', { timeout: 90000 }, async () => {
  assert.deepEqual(MONSTER_FRIENDS.gold_pururin.passive, { gold: 1.3 });
  const goldOf = async (withGold) => {
    const { world, bot, c } = await solo(7, 40);
    join(world, bot, withGold ? 'gold_pururin' : 'queen_pururin', 30);
    bot.s.map = 'overworld';
    bot.s.x = FIELD.x;
    bot.s.y = FIELD.y;
    const g0 = c.gold;
    startFieldBattle(world, bot.s, { id: `gold${withGold}`, sp: 'wolf', group: ['wolf', 'wolf', 'wolf'], zone: 'outskirts', table: 'outskirts', busy: false });
    await bot.settle(8000);
    assert.equal(bot.battles.at(-1)?.outcome, 'win');
    return c.gold - g0;
  };
  const plain = await goldOf(false), rich = await goldOf(true);
  assert.ok(plain > 0, `${plain}`);
  assert.ok(rich > plain, `${rich} > ${plain}`);
  assert.ok(Math.abs(rich / plain - 1.3) < 0.15, `${rich} / ${plain}`);
});

// ───────────── 生まれかた ─────────────
test('配合: どちらを 1ぴきめに しても 同じ。親は 中ごろ〜あとの 家族が そろえられる 魔物', () => {
  const PAIRS = [
    ['king_pururin', 'pururin_knight', 'queen_pururin'],
    ['king_pururin', 'mimic', 'gold_pururin'], ['king_pururin', 'gold_golem', 'gold_pururin'],
    ['mandra', 'koakuma', 'rose_queen'], ['chibi_treant', 'gargoyle', 'rose_queen'],
    ['skeleton', 'fire_imp', 'lantern_ghost'], ['bone_dragon', 'chibi_dragon', 'lantern_ghost'],
    ['clockwork_knight', 'golem', 'killer_karakuri'], ['clockwork_knight', 'mimic', 'killer_karakuri'],
    ['mimic', 'rockman', 'hitokui_box'], ['golem', 'gold_golem', 'hitokui_box'],
    ['koakuma', 'pururin', 'petit_devil'], ['demon_knight', 'king_pururin', 'petit_devil'],
  ];
  for (const [a, b, child] of PAIRS) {
    const x = breedCandidates(lv(a), lv(b), MONSTERS), y = breedCandidates(lv(b), lv(a), MONSTERS);
    assert.ok(x.list.includes(child), `${a}＋${b} → ${child}`);
    assert.deepEqual(x.list, y.list, `${a}＋${b}: どちら向きでも 同じ`);
    assert.equal(breedOutcome(lv(a), lv(b), MONSTERS, null, child).child, child);
    assert.ok(['special', 'recipe'].includes(breedOutcome(lv(a), lv(b), MONSTERS, null, child).kind), child);
  }
  // 宝の 魔物・ほのおの 魔物の 一覧
  assert.ok(TREASURE_KIN.any.every((sp) => MONSTER_FRIENDS[sp] && MONSTERS[sp]), '宝の魔物は みんな 仲間に なる 魔物');
  assert.ok(RECIPES_DQM.some((r) => r.b === FIRE_KIN && r.child === 'lantern_ghost'));
  // 弱い 悪魔（Dランクより 下）では ローズクイーンは 生まれない・ちがう 系統の 組み合わせでも 生まれない
  const weakDemon = Object.keys(MONSTER_FRIENDS).find((sp) => MONSTERS[sp]?.race === 'demon' && rankIdx(sp, MONSTERS) < 2);
  assert.ok(weakDemon, '弱い 悪魔');
  assert.ok(!breedCandidates(lv('mandra'), lv(weakDemon), MONSTERS).list.includes('rose_queen'), weakDemon);
  for (const [a, b, child] of [['wolf', 'fire_imp', 'lantern_ghost'], ['wolf', 'mimic', 'hitokui_box'], ['pururin', 'mimic', 'gold_pururin'], ['buriki', 'golem', 'killer_karakuri']]) {
    assert.ok(!breedCandidates(lv(a), lv(b), MONSTERS).list.includes(child), `${a}＋${b} から ${child} は 生まれない`);
  }
  // 前からの 組み合わせの おすすめは かわらない
  assert.ok(breedCandidates(lv('kirakira'), lv('king_pururin'), MONSTERS).list.includes('silver_king'));
  assert.ok(breedCandidates(lv('golem'), lv('clockwork_knight'), MONSTERS).list.includes('gold_golem'));
  assert.equal(breedOutcome(lv('skeleton'), lv('goblin'), MONSTERS).child, 'demon_knight');
  assert.equal(breedOutcome(lv('pururin'), lv('ice_pururin'), MONSTERS).child, 'king_pururin');
  // R35 の 7つは BREED_RECIPES の さいごの まま（test/breed-r35.test.js）
  assert.deepEqual(BREED_RECIPES.slice(-7).map((r) => r.child), ['cloud_wyvern', 'star_jelly', 'gazer_eye', 'sky_serpent', 'rock_mole', 'haniwa_soldier', 'lamp_genie']);
  for (const r of RECIPES_DQM) assert.ok(BREED_RECIPES.includes(r));
  // 親（しゅぞくID）は どれも 手に 入る（やせいで 仲間に なる・配合・進化で 生まれる）
  const born = new Set([...BREED_RECIPES, ...MATERIAL_RECIPES].map((r) => r.child));
  const reachable = (sp) => MONSTER_FRIENDS[sp]?.rate > 0 || born.has(sp) || !!EVOLVE_FROM[sp]
    || (MONSTER_FRIENDS[sp]?.breedOnly && !MONSTER_FRIENDS[sp].recipeOnly);
  for (const r of RECIPES_DQM) for (const s of [r.a, r.b]) {
    if (typeof s === 'string') assert.ok(reachable(s), `${r.child}: ${s}`);
    else if (s.any) assert.ok(s.any.some(reachable), `${r.child}: ${s.label}`);
  }
});

test('S の 特定配合（せかいじゅの子・がいこつ王）: どちらの 親も Lv50 いじょう（2ひきで 100 ＝ A → S の「1つ上」と おなじ）', () => {
  assert.equal(DQM_S_LV, 50);
  assert.equal(rankUpNeed(5), 2 * DQM_S_LV);
  // 特定配合の 子は A まで。S は この 2つ（Lv50 の じょうけん つき）だけ
  for (const r of RECIPES_DQM) {
    const rk = rankIdx(r.child, MONSTERS);
    if (rk > 5) {
      assert.equal(r.minLv, DQM_S_LV, r.child);
      assert.ok(typeof r.a === 'string' && typeof r.b === 'string', `${r.child}: しゅぞくID の 組み合わせ`);
    } else assert.ok(!r.minLv, r.child);
  }
  assert.deepEqual(RECIPES_DQM.filter((r) => r.minLv).map((r) => r.child).sort(), ['skeleton_king', 'yggdra_child']);
  for (const [a, b, child] of [['venusaur', 'chibi_treant', 'yggdra_child'], ['gengar', 'demon_knight', 'skeleton_king']]) {
    for (const [la, lb, ok] of [[50, 50, true], [60, 52, true], [49, 50, false], [50, 49, false], [80, 20, false]]) {
      const x = breedCandidates(lv(a, la), lv(b, lb), MONSTERS), y = breedCandidates(lv(b, lb), lv(a, la), MONSTERS);
      assert.equal(x.list.includes(child), ok, `${a} Lv${la}＋${b} Lv${lb}`);
      assert.deepEqual(x.list, y.list);
    }
    const o = breedOutcome(lv(a, 50), lv(b, 50), MONSTERS);
    assert.equal(o.child, child, 'いちばん 上（おすすめ）');
    assert.equal(o.rank, 'S');
    assert.equal(o.kind, 'special');
  }
  assert.equal(recipeHint('yggdra_child', MONSTERS), 'フシギバナ ＋ ちびトレント（どちらもLv50以上）');
  assert.equal(recipeHint('skeleton_king', MONSTERS), 'ゲンガー ＋ 悪魔の騎士（どちらもLv50以上）');
});

test('ほんとうに 配合: がいこつ王（ゲンガー Lv50 ＋ 悪魔の騎士 Lv50）。Lv49 では 候補に ない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(3, 60);
  const a = join(world, bot, 'gengar', 49), b = join(world, bot, 'demon_knight', 50);
  assert.ok(!breedPreview(c, a.key, b.key).choices.some((x) => x.sp === 'skeleton_king'));
  assert.equal(breedPreview(c, a.key, b.key, 'skeleton_king').ok, false);
  growCompanion(a.char, expForLevel(50) - a.char.exp);
  assert.equal(a.char.level, 50);
  const pv = breedPreview(c, a.key, b.key, 'skeleton_king');
  assert.ok(pv.ok && pv.rank === 'S' && pv.kind === 'special', JSON.stringify(pv.reason || pv.rank));
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'skeleton_king' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.at(-1);
  assert.equal(kid.species, 'skeleton_king');
  assert.equal(kid.char.level, 1);
  assert.equal(kid.char.name, 'がいこつ王');
  assert.equal(bestiaryKnow(c)('skeleton_king'), 2);
});

// ───────────── 素材配合・大事な物 ─────────────
test('素材配合: こよみのせいれい（せいれい系 2ひき ＋ 四季のこよみ）・竜王のまご（ドラゴン系 2ひき ＋ 竜王のしるし）', () => {
  for (const id of ['koyomi_book', 'ryuou_seal']) {
    const it = ITEMS[id];
    assert.equal(it, DQM_ITEMS[id]);
    assert.ok(it.type === 'key' && !it.price && ITEM_KANA[id], id);
    // 店・カジノ・メダル王では 手に 入らない
    for (const [shop, list] of Object.entries(SHOPS)) assert.ok(!JSON.stringify(list).includes(`"${id}"`), `${shop}: ${id}`);
    assert.ok(!PRIZES.some((p) => p.id === id) && !MEDAL_REWARDS.some((m) => m.items.some(([x]) => x === id)), id);
  }
  assert.deepEqual(DQM_KEY_CHILD, { koyomi_book: 'koyomi_spirit', ryuou_seal: 'ryuou_grandson' });
  for (const r of MATERIAL_RECIPES_DQM) assert.ok(MATERIAL_RECIPES.includes(r));
  const kit = (item) => ({ items: [], keyItems: [item] });
  for (const [a, b] of [['water_spirit', 'lamp'], ['snow_wisp', 'aurora_spirit'], ['star_jelly', 'star_jelly']]) {
    for (const [x, y] of [[a, b], [b, a]]) {
      const o = breedOutcome(lv(x), lv(y), MONSTERS, kit('koyomi_book'));
      assert.equal(o.child, 'koyomi_spirit', `${x}＋${y}`);
      assert.equal(o.kind, 'material');
      assert.equal(o.item, 'koyomi_book');
      assert.equal(o.rank, 'S');
    }
    assert.ok(!breedCandidates(lv(a), lv(b), MONSTERS, { items: [], keyItems: [] }).list.includes('koyomi_spirit'), '品が ないと 生まれない');
  }
  for (const [a, b] of [['chibi_dragon', 'great_dragon'], ['charmander', 'thunder_dragon']]) {
    const o = breedOutcome(lv(a), lv(b), MONSTERS, kit('ryuou_seal'));
    assert.equal(o.child, 'ryuou_grandson', `${a}＋${b}`);
    assert.equal(o.kind, 'material');
    assert.equal(o.rank, 'S');
    assert.ok(!breedCandidates(lv(a), lv(b), MONSTERS, kit('koyomi_book')).list.includes('ryuou_grandson'), 'ちがう 品');
  }
  assert.ok(!breedCandidates(lv('water_spirit'), lv('chibi_dragon'), MONSTERS, kit('koyomi_book')).list.includes('koyomi_spirit'), 'ちがう 系統');
  assert.ok(!breedCandidates(lv('water_spirit'), lv('chibi_dragon'), MONSTERS, kit('ryuou_seal')).list.includes('ryuou_grandson'), 'ちがう 系統');
  assert.equal(recipeHint('koyomi_spirit', MONSTERS), '四季のこよみ ＋ せいれい系2ひき');
  assert.equal(recipeHint('ryuou_grandson', MONSTERS), '竜王のしるし ＋ ドラゴン系2ひき');
});

test('大事な物は 1人 1つ: まだ 持っていない・その 子を 生んだ ことが ない 人だけ もらえる（dqKeyDue）', () => {
  const c = { keyItems: [], bestiary: {} };
  assert.equal(dqKeyDue(c, 'koyomi_book'), true);
  assert.equal(dqKeyDue({ ...c, keyItems: ['koyomi_book'] }, 'koyomi_book'), false, 'もう 持っている');
  assert.equal(dqKeyDue({ keyItems: [], bestiary: { koyomi_spirit: { bred: 1 } } }, 'koyomi_book'), false, 'もう 生んだ');
  assert.equal(dqKeyDue({ keyItems: [], bestiary: { koyomi_spirit: { seen: 3 } } }, 'koyomi_book'), true, '見た だけ');
  assert.equal(dqKeyDue({ keyItems: [], bestiary: { koyomi_spirit: { bred: 1 } } }, 'ryuou_seal'), true);
  assert.equal(dqKeyDue(c, 'mew_gene'), false);
  // ひみつのダンジョン 40階（黄金の古代の階の はじめ。ミュウの 50階とは べつ）
  assert.equal(SD_KOYOMI_FLOOR, 40);
  assert.notEqual(SD_KOYOMI_FLOOR, SD_MEW_FLOOR);
  assert.deepEqual(sdKeyRewards(40, c), [{ item: 'koyomi_book', n: 1 }]);
  for (let f = 5; f <= 200; f += 5) if (f !== 40) assert.deepEqual(sdKeyRewards(f, c), [], `${f}階`);
  assert.deepEqual(sdKeyRewards(40, { keyItems: ['koyomi_book'], bestiary: {} }), []);
  for (let f = 5; f <= 200; f += 5) assert.ok(!sdBigReward(f).some((e) => e.item === 'koyomi_book' || e.item === 'ryuou_seal'), `${f}階`);
  // 闘技場: 伝説の部 ランク8 だけ
  assert.deepEqual(ARENA_RANKS.filter((R) => R.key).map((R) => [R.rank, R.key]), [[8, 'ryuou_seal']]);
  assert.ok(!ARENA_RANKS.some((R) => R.first.items.includes('ryuou_seal')));
});

test('四季のこよみ: ひみつのダンジョン 地下40階の 休み所の 宝箱（1人 1回。前の 版で 40階の ごほうびを もらった 人も 次の ちょうせんで）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(40), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf(SD_OPEN_FLAG) + 1)) c.flags[f] = true;
  gainExp(c, expForLevel(60) - c.exp);
  c.hp = 9999;
  const open = async (run) => {
    const m = MAPS[sdFloorId(40)];
    world.placeSession(bot.s, m.id, m.sd.arrive.x, m.sd.arrive.y, 'up', true);
    await bot.settle();
    c.sd = { ...(c.sd || { best: 0, got: [], tries: 1 }), run };
    const n = m.npcs.find((x) => x.id === 'sd_chest');
    world.placeSession(bot.s, m.id, n.x + 0.5, n.y + 1.5, 'up', true);
    await bot.settle();
    const from = bot.msgs.length;
    await bot.talk('sd_chest');
    return sayTexts(bot, from);
  };
  // はじめて 着いた（大きな ごほうび と いっしょに）
  let t = await open({ f: 40, took: [] });
  assert.ok(t.some((x) => x.includes('初めて着いたごほうび') && x.includes('四季のこよみ')), t.join('|'));
  assert.ok(hasKeyItem(c, 'koyomi_book'));
  // 持っている あいだは もう 入っていない
  t = await open({ f: 40, took: [] });
  assert.ok(!t.some((x) => x.includes('四季のこよみ')));
  // 前の 版で 40階の ごほうびを もらった 人（持っていない・生んで いない）: 小さな ごほうびと いっしょに
  c.keyItems = c.keyItems.filter((k) => k !== 'koyomi_book');
  assert.ok(c.sd.got.includes(40));
  t = await open({ f: 40, took: [] });
  assert.ok(t.some((x) => !x.includes('初めて') && x.includes('四季のこよみ')), t.join('|'));
  // こよみのせいれいを 生んだ あとは もらえない
  c.keyItems = c.keyItems.filter((k) => k !== 'koyomi_book');
  c.bestiary = { ...(c.bestiary || {}), koyomi_spirit: { bred: 1, friend: 1 } };
  t = await open({ f: 40, took: [] });
  assert.ok(!t.some((x) => x.includes('四季のこよみ')));
  assert.ok(!hasKeyItem(c, 'koyomi_book'));
});

test('竜王のしるし: 闘技場の 伝説の部 ランク8 を 勝ちぬくと（1人 1つ。前に 勝ちぬいた 人も 次に 勝ちぬいた 時）。ドラゴン 2ひきと 配合 → 竜王のまご', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(8, 60);
  const run = { world, everyone: [bot.s] };
  // ランク7 では もらえない
  clearRewards(run, 7);
  assert.ok(!hasKeyItem(c, 'ryuou_seal'));
  let lines = clearRewards(run, 8);
  assert.ok(hasKeyItem(c, 'ryuou_seal'), 'はじめて 勝ちぬいた');
  assert.ok(lines.some((st) => st[0] === 'say' && /竜王のしるしを手に入れた/.test(st[2])));
  assert.ok(c.items.some((e) => e.id === 'ar_legend_belt'), '前からの ごほうびも');
  // 持っている あいだは 2回目でも ふえない（文も 出ない）
  lines = clearRewards(run, 8);
  assert.ok(!lines.some((st) => st[0] === 'say' && /竜王のしるし/.test(st[2])));
  assert.equal(c.keyItems.filter((k) => k === 'ryuou_seal').length, 1);
  // 前の 版で 勝ちぬいた 人（持っていない）: 2回目からの 勝ちぬきで
  c.keyItems = c.keyItems.filter((k) => k !== 'ryuou_seal');
  clearRewards(run, 8);
  assert.ok(hasKeyItem(c, 'ryuou_seal'));
  // ほんとうに 配合（大事な物は なくなる → もう もらえない）
  const a = join(world, bot, 'chibi_dragon', 20), b = join(world, bot, 'charmander', 15);
  const pv = breedPreview(c, a.key, b.key);
  assert.ok(pv.ok && pv.child === 'ryuou_grandson' && pv.kind === 'material' && pv.itemName === '竜王のしるし' && pv.rank === 'S');
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'ryuou_grandson' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.at(-1);
  assert.equal(kid.species, 'ryuou_grandson');
  assert.equal(kid.char.name, '竜王のまご');
  assert.equal(hasKeyItem(c, 'ryuou_seal'), false, 'なくなった');
  assert.equal(dqKeyDue(c, 'ryuou_seal'), false);
  clearRewards(run, 8);
  assert.equal(hasKeyItem(c, 'ryuou_seal'), false, 'もう もらえない');
  assert.ok(learnedAbilities(kid.char).includes('m_bite'));
});

// ───────────── 図鑑・うわさ ─────────────
test('図鑑: 近い 魔物の すぐ うしろ（キングぷるりん → ぷるりんクイーン・フシギバナ → せかいじゅの子 など）。ヒント・酒場の うわさ', () => {
  const order = bestiaryOrder(MONSTERS);
  assert.equal(order.length, Object.keys(MONSTERS).length);
  assert.equal(new Set(order).size, order.length);
  const at = (sp) => order.indexOf(sp);
  const LINES = [
    ['king_pururin', 'queen_pururin'], ['silver_king', 'gold_pururin'], ['mandra', 'rose_queen'], ['venusaur', 'yggdra_child'],
    ['gengar', 'lantern_ghost', 'skeleton_king'], ['aurora_spirit', 'koyomi_spirit'], ['gold_golem', 'killer_karakuri'],
    ['mimic', 'hitokui_box'], ['demon_knight', 'petit_devil'], ['thunder_dragon', 'ryuou_grandson'],
  ];
  for (const line of LINES) for (let i = 1; i < line.length; i++) assert.equal(at(line[i]), at(line[0]) + i, line.join('→'));
  for (const sp of IDS) {
    const to = bestiaryAfter(sp);
    assert.ok(to && MONSTERS[to]?.breedOnly, `${sp}: うしろに ならぶ 魔物（配合だけの 魔物）`);
  }
  // 進化の ならびは そのまま（フシギダネ → フシギソウ → フシギバナ → せかいじゅの子）
  assert.equal(at('ivysaur'), at('bulbasaur') + 1);
  assert.equal(at('venusaur'), at('bulbasaur') + 2);
  const firstBoss = order.findIndex((sp) => MONSTERS[sp].boss);
  const firstBreed = order.findIndex((sp) => MONSTERS[sp].breedOnly);
  for (const sp of IDS) assert.ok(at(sp) > firstBreed && at(sp) < firstBoss, sp);
  // ヒント
  assert.equal(recipeHint('queen_pururin', MONSTERS), 'キングぷるりん ＋ ぷるりん騎士');
  assert.equal(recipeHint('gold_pururin', MONSTERS), 'キングぷるりん ＋ 宝の魔物');
  assert.equal(recipeHint('rose_queen', MONSTERS), '植物系 ＋ 悪魔系（Dランク以上）');
  assert.equal(recipeHint('lantern_ghost', MONSTERS), 'ゾンビ系 ＋ ほのおの魔物');
  assert.equal(recipeHint('killer_karakuri', MONSTERS), 'からくり騎士 ＋ 物質系');
  assert.equal(recipeHint('hitokui_box', MONSTERS), '物質系 ＋ 宝の魔物');
  assert.equal(recipeHint('petit_devil', MONSTERS), '悪魔系 ＋ スライム系');
  // 酒場の うわさ: 見たことが ない ドラクエふうの 魔物の ヒントも 出る
  const rumors = breedRumors({ bestiary: {}, kills: {} }, MONSTERS, 999);
  for (const sp of IDS) assert.ok(rumors.includes(recipeHint(sp, MONSTERS)), sp);
  const known = Object.fromEntries(IDS.map((sp) => [sp, { seen: 1 }]));
  const r2 = breedRumors({ bestiary: known, kills: {} }, MONSTERS, 999);
  assert.ok(!r2.includes('四季のこよみ ＋ せいれい系2ひき'));
  void RANKS;
});

// ───────────── セーブ ─────────────
test('セーブ: ドラクエふうの 仲間・大事な物が のこる（読みなおし・引っこしコード）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(9);
  const keys = [];
  for (const sp of ['gold_pururin', 'killer_karakuri', 'yggdra_child']) {
    const e = join(world, bot, sp, 12);
    e.char.plus = 7;
    keys.push(e.key);
  }
  addItem(c, 'koyomi_book', 1);
  addItem(c, 'ryuou_seal', 1);
  const raw = JSON.parse(JSON.stringify(world.data));
  const c2 = upgradeSave(raw).data.characters[c.id];
  repairChar(c2, c.id);
  for (const [i, sp] of ['gold_pururin', 'killer_karakuri', 'yggdra_child'].entries()) {
    const e2 = c2.companions.find((x) => x.key === keys[i]);
    assert.equal(e2.species, sp);
    assert.equal(e2.char.species, sp);
    assert.equal(e2.char.plus, 7);
  }
  assert.ok(c2.keyItems.includes('koyomi_book') && c2.keyItems.includes('ryuou_seal'));
  const r = parseCode(exportCode(c));
  assert.ok(r.ok, r.reason);
  for (const [i, sp] of ['gold_pururin', 'killer_karakuri', 'yggdra_child'].entries()) {
    assert.equal(r.char.companions.find((x) => x.key === keys[i]).species, sp);
  }
  assert.ok(r.char.keyItems.includes('koyomi_book') && r.char.keyItems.includes('ryuou_seal'));
});

// ───────────── 漢字 ─────────────
test('漢字の きまり: 新しい ファイルの ゲームの 文字（使えない 漢字・スペース なし）', () => {
  const files = [
    'public/js/shared/data/monsters-dqm.js', 'public/js/shared/data/companions-dqm.js', 'public/js/shared/data/abilities-dqm.js',
    'public/js/shared/data/items-dqm.js',
  ];
  const all = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of files) {
    assert.ok(all.some((x) => x.endsWith(f)), `${f} は gameFiles に ある`);
    const bad = checkFile(all.find((x) => x.endsWith(f))).filter((r) => r.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  for (const id of Object.keys(DQM_ITEMS)) assert.ok(ITEMS[id] && ITEM_KANA[id], id);
});
