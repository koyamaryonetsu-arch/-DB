// 第35回: 配合の 作りなおし（弱く ならない しくみ・配合の しゅるい・ボス級・血統）
//   data/companions.js（ランク・候補・＋）・shared/breed-calc.js（受けつぎ・めやす・血統）・world/breed.js（配合）・data/monsters-boss.js（ボス級）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  MONSTER_FRIENDS, RANKS, rankIdx, rankOf, breedCandidates, breedOutcome, breedPlus, monsterLevelCap, bossClassList, recipeHint,
  familyPool, BREED_RECIPES, MATERIAL_RECIPES, FOUR_RECIPES, RANK_BREED_LV, bestiaryOrder, ROSTER_MAX,
} from '../public/js/shared/data/companions.js';
import { MONSTERS_BOSS, FRIENDS_BOSS } from '../public/js/shared/data/monsters-boss.js';
import { inheritBonus, breedForecast, bareStats, powerScore, makeLineage } from '../public/js/shared/breed-calc.js';
import { computeStats, newMonsterCompanion, gainExp, expForLevel, learnedAbilities, itemCount, MAX_LEVEL } from '../public/js/shared/stats.js';
import { addMonsterCompanion, addMonsterEntry, tavernInfo, rollBefriend } from '../public/js/shared/world/party.js';
import { farewellList } from '../public/js/shared/world/farewell.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const lv = (species, level = 20, plus = 0, extra = {}) => ({ species, level, plus, ...extra });
const BOSS_OF = { ss_goldoon: 'goldoon', ss_kraken: 'giant_squid', ss_storm: 'storm_general', ss_ignia: 'flame_witch', ss_argos: 'argos', ss_gaia: 'gaia_eater', ss_oldra: 'old_dragon' };

async function solo(seed = 35) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(30) - c.exp);
  c.flags.monster_bond = true;
  return { world, bot, c };
}
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const companion = (c, key) => c.companions.find((e) => e.key === key);

// 第43回 A: ランクは「めずらしさ」（data/monster-ranks.js）。くわしくは test/monsters-r43a.test.js
test('ランク: すべての 仲間の 魔物に F〜SS。ボス級は SS・ほかは S まで（第43回 A から めずらしさで きまる）', () => {
  assert.deepEqual(RANKS, ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', '★']);
  for (const sp of Object.keys(MONSTER_FRIENDS)) {
    const r = rankOf(sp, MONSTERS);
    assert.ok(RANKS.includes(r), sp);
    if (MONSTER_FRIENDS[sp].rank === 'SS') assert.equal(r, 'SS');
    else assert.ok(rankIdx(sp, MONSTERS) <= 6, `${sp}: S まで`);
  }
  assert.equal(rankOf('pururin', MONSTERS), 'F');
  // 第5章の よく出る 魔物は もう S では ない
  assert.ok(rankIdx('gaia_larva', MONSTERS) < 6);
  // いかずちタイガー（夜だけ・滅多に）は S。親の 星形パンサーより 下がらない
  assert.ok(rankIdx('ikazuchi_tiger', MONSTERS) >= rankIdx('star_panther', MONSTERS));
});

test('弱く ならない: 子の ランクは 高いほうの 親と 同じか 1つ上（特定配合でも 下がる 子は さいご）。どちらの 親から えらんでも 同じ 候補・同じ ならび', () => {
  const sps = Object.keys(MONSTER_FRIENDS);
  const rng = makeRng(3);
  for (let i = 0; i < 600; i++) {
    const a = lv(sps[Math.floor(rng.next() * sps.length)], 10 + Math.floor(rng.next() * 40), Math.floor(rng.next() * 20));
    const b = lv(sps[Math.floor(rng.next() * sps.length)], 10 + Math.floor(rng.next() * 40), Math.floor(rng.next() * 20));
    const x = breedCandidates(a, b, MONSTERS), y = breedCandidates(b, a, MONSTERS);
    assert.deepEqual(x.list, y.list, `${a.species}＋${b.species}`);
    assert.ok(x.list.length >= 1);
    const hi = Math.max(rankIdx(a.species, MONSTERS), rankIdx(b.species, MONSTERS));
    assert.equal(x.hi, hi);
    // おすすめ（いちばん 上）は 下がらない
    assert.ok(x.items[0].rank >= hi, `${a.species}＋${b.species} → ${x.items[0].sp}`);
    for (const it of x.items) {
      if (['family', 'parent', 'same'].includes(it.kind)) assert.ok(it.rank === hi || it.rank === hi + 1, `${a.species}＋${b.species} → ${it.sp}`);
      if (it.rank < hi) assert.ok(x.items.indexOf(it) > x.items.findLastIndex((z) => z.rank >= hi), '下がる 子は さいご');
    }
    // ＋も 順番で かわらない
    assert.equal(breedPlus(a, b), breedPlus(b, a));
    assert.equal(breedOutcome(a, b, MONSTERS).plus, breedOutcome(b, a, MONSTERS).plus);
  }
});

test('＋値: 両親の ＋の 合計÷2 ＋ 両親の レベルで 少し。新生配合（同じ しゅぞく）は 大きく 上がる', () => {
  assert.equal(breedPlus(lv('wolf', 10, 0), lv('frog', 10, 0)), 2);
  assert.equal(breedPlus(lv('wolf', 30, 10), lv('frog', 30, 6)), 8 + 6);
  assert.equal(breedPlus(lv('wolf', 10, 0), lv('wolf', 10, 0), true), 5);
  assert.equal(breedPlus(lv('wolf', 30, 10), lv('wolf', 30, 6), true), 8 + 12);
  assert.equal(breedPlus(lv('wolf', 99, 99), lv('wolf', 99, 99), true), 99, '99まで');
  // 新生配合: 同じ しゅぞく 2ひき → 同じ しゅぞく が 候補に（kind 'same'）。＋が 大きい
  const o = breedOutcome(lv('wolf', 30, 4), lv('wolf', 30, 4), MONSTERS, null, 'wolf');
  assert.equal(o.kind, 'same');
  assert.equal(o.child, 'wolf');
  assert.ok(o.plus > breedOutcome(lv('wolf', 30, 4), lv('frog', 30, 4), MONSTERS).plus);
  // やせいでしか 仲間に ならない 魔物（第5章の 魔物）でも 新生配合が できる
  const g = breedCandidates(lv('gaia_larva', 20), lv('gaia_larva', 20), MONSTERS);
  assert.ok(g.items.some((it) => it.sp === 'gaia_larva' && it.kind === 'same'));
});

test('能力の 受けつぎ: 子の Lv1 の 能力に 両親の 今の 能力の 3/10ずつ（第43回 A。前は 1/4）。育てた 親ほど 強い 子', () => {
  const A = lv('wolf', 30, 5), B = lv('frog', 20, 0);
  const bonus = inheritBonus(A, B);
  const sa = bareStats(A), sb = bareStats(B);
  for (const k of ['hp', 'str', 'def', 'agi']) assert.equal(bonus[k], Math.round((sa[k] + sb[k]) * 0.3), k);
  const weak = inheritBonus(lv('wolf', 10), lv('frog', 10));
  assert.ok(bonus.str > weak.str);
  // 子の 能力に 足される（セーブの ch.bonus）
  const kid = { ...newMonsterCompanion({ id: 'k', species: 'wolf', level: 1 }), bonus };
  const plain = newMonsterCompanion({ id: 'p', species: 'wolf', level: 1 });
  assert.equal(computeStats(kid).str, computeStats(plain).str + bonus.str);
  // 何世代 くりかえしても ふくらみすぎない（受けつぎは 親の 6わり → 2.5倍で 止まる）
  let p = lv('wolf', 30, 0);
  for (let i = 0; i < 12; i++) p = { species: 'wolf', level: 30, plus: 0, bonus: inheritBonus(p, p) };
  const plainSt = bareStats(lv('wolf', 30));
  assert.ok(bareStats(p).str < plainSt.str * 2.55, `${bareStats(p).str} / ${plainSt.str}`);
});

test('配合前の めやす: 強いほうの 親の レベルまで 育てた 子と、強いほうの 親を くらべる（↑→↓）。弱く なる 時は down', () => {
  // 同じ しゅぞくを 育てなおす → 受けつぎぶん 強く なる
  const up = breedForecast(lv('wolf', 30, 0), lv('wolf', 30, 0), 'wolf', 10);
  assert.equal(up.trend, 'up');
  assert.ok(up.born.str > bareStats(lv('wolf', 1)).str);
  assert.equal(up.grownLv, 30);
  // とても 強い 親 ＋ 弱い 子 → 弱く なるかも
  const down = breedForecast(lv('ss_oldra', 60, 20), lv('pururin', 10), 'pururin', 2);
  assert.equal(down.trend, 'down');
  // ランクが 下がる 子（特定配合の 子など。一覧の さいご）は いつも down（赤い 字）
  const low = breedForecast(lv('silver_king', 40), lv('hedoron', 12), 'king_pururin', 5);
  assert.ok(low.lowRank);
  assert.equal(low.trend, 'down');
  assert.ok(!up.lowRank);
  // レベルの 上限
  assert.equal(up.cap, Math.min(MAX_LEVEL, 70 + 10 * rankIdx('wolf', MONSTERS) + 10));
});

test('レベルの 上限: ランク F で 70・ランクごとに +10・＋で 上がる（第43回 A。前は 50・+5）。150（MAX_LEVEL）は こえない。むかしの 仲間は 150まで', () => {
  const m = newMonsterCompanion({ id: 'x', species: 'pururin', level: 1 });
  assert.equal(m.ranked, 1);
  assert.equal(monsterLevelCap(m, MONSTERS), 70);
  assert.equal(monsterLevelCap({ ...m, plus: 12 }, MONSTERS), 82);
  assert.equal(monsterLevelCap({ ...m, species: 'ss_oldra', plus: 5 }, MONSTERS), 145);
  assert.equal(monsterLevelCap({ ...m, species: 'ss_oldra', plus: 30 }, MONSTERS), 150);
  assert.equal(monsterLevelCap({ ...m, species: 'ss_oldra' }, MONSTERS), 140);
  // 上限で 止まる
  gainExp(m, expForLevel(90));
  assert.equal(m.level, 70);
  // むかしの 仲間（ranked が ない）は 150まで
  const old = { ...newMonsterCompanion({ id: 'o', species: 'pururin', level: 1 }) };
  delete old.ranked;
  gainExp(old, expForLevel(90));
  assert.equal(old.level, 90);
  // 人間は かわらない
  assert.equal(monsterLevelCap({ level: 1 }, MONSTERS), 150);
});

test('ボス級（SS）: このゲームの ボス 7体。仲間として 使える 形（え・技・装備・強さは 少し おさえる）。配合でしか 生まれない', () => {
  // 第5章 Step 5 の 影の王・Step 6・7 の 天空のきょ兵（ボスの 仲間では ない 新しい ボス級）は test/ch5-hoshiyomi-battle.test.js・test/ch5-earth-battle.test.js
  const list = bossClassList(MONSTERS).filter((sp) => sp !== 'ss_shadow_king' && sp !== 'ss_sky_giant');
  assert.deepEqual(list.sort(), Object.keys(BOSS_OF).sort());
  for (const sp of list) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp], boss = MONSTERS[BOSS_OF[sp]];
    assert.ok(boss?.boss, `${sp}: もとの ボス`);
    assert.equal(m.name, boss.name);
    assert.equal(m.lv, boss.lv);
    assert.ok(m.breedOnly && !m.boss && f.breedOnly && f.recipeOnly && f.rate === 0, sp);
    assert.equal(MONSTERS_BOSS[sp], m);
    assert.equal(FRIENDS_BOSS[sp], f);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    const sum = Object.values(f.growth).reduce((a, b) => a + b, 0);
    assert.ok(sum >= 7 && sum <= 8.7, `${sp}: growth ${sum}`);
    for (const L of [1, 30, 80]) {
      const s = computeStats(newMonsterCompanion({ id: 'x', species: sp, level: L }));
      assert.ok(s.maxHp > 0 && s.atk > 0 && learnedAbilities(newMonsterCompanion({ id: 'x', species: sp, level: L })).length >= 1, `${sp} Lv${L}`);
    }
    // 系統配合・やせいでは 生まれない
    assert.ok(!familyPool(m.race, MONSTERS).includes(sp));
    // 図鑑: 配合だけの 魔物の ならび・ヒントは ？？？（配合でしか会えない）
    assert.ok(bestiaryOrder(MONSTERS).includes(sp));
    assert.match(recipeHint(sp, MONSTERS), /配合でしか会えない/);
    assert.ok(!recipeHint(sp, MONSTERS).includes(m.name));
  }
  // ボスの 品は ある
  for (const r of MATERIAL_RECIPES) assert.ok(ITEMS[r.item], r.item);
  for (const sp of list) assert.ok(MATERIAL_RECIPES.some((r) => r.child === sp), `${sp}: 素材配合`);
});

test('素材配合: ボスの 品 ＋ S ランク 2ひき → その ボス級（品が ふくろに ある とき だけ）。星見の目玉 ＋ 星くらげ ＋ 星見のペンダント → アルゴス', () => {
  const A = lv('gazer_eye', 12), B = lv('star_jelly', 12);
  assert.ok(!breedCandidates(A, B, MONSTERS, { items: [] }).list.includes('ss_argos'), '品が ないと 生まれない');
  const o = breedOutcome(A, B, MONSTERS, { items: [{ id: 'argos_pendant', n: 1 }] });
  assert.equal(o.child, 'ss_argos');
  assert.equal(o.kind, 'material');
  assert.equal(o.item, 'argos_pendant');
  assert.equal(o.rank, 'SS');
  // S ランクで ない 親では 生まれない（第43回 A: 第5章の 魔物は もう S では ない）
  assert.ok(!breedCandidates(lv('yeti', 20), lv('rock_mole', 20), MONSTERS, { items: [{ id: 'gaia_fang_charm', n: 1 }] }).list.includes('ss_gaia'));
  assert.ok(!breedCandidates(lv('sky_ray', 20), lv('rock_mole', 20), MONSTERS, { items: [{ id: 'gaia_fang_charm', n: 1 }] }).list.includes('ss_gaia'));
  assert.ok(breedCandidates(lv('ikazuchi_tiger', 20), lv('great_dragon', 20), MONSTERS, { items: [{ id: 'gaia_fang_charm', n: 1 }] }).list.includes('ss_gaia'));
});

test('ランク配合は ない（第43回 A）: S どうし・Lv60 でも 品が なければ ボス級は 生まれない', () => {
  const hi = breedCandidates(lv('shadow_mage', 60, 20), lv('clockwork_knight', 60, 20), MONSTERS);
  assert.ok(!hi.items.some((it) => it.kind === 'rank'));
  assert.ok(!hi.items.some((it) => MONSTER_FRIENDS[it.sp].rank === 'SS'));
  assert.equal(RANK_BREED_LV, 30, '数だけ のこす');
});

test('4体配合: 両親と 祖父母が みんな つちくいムカデ → ガイアイーター（血統を 記録）。ぷるりん ×4 → きらきらぷるりん', () => {
  const four = { lineage: { p: ['gaia_larva', 'gaia_larva'], g: [null, null] } };
  assert.ok(!breedCandidates(lv('gaia_larva', 12), lv('gaia_larva', 12), MONSTERS).list.includes('ss_gaia'), '祖父母が ちがう');
  assert.ok(!breedCandidates(lv('gaia_larva', 12, 0, four), lv('gaia_larva', 12), MONSTERS).list.includes('ss_gaia'), '片方だけ');
  const o = breedOutcome(lv('gaia_larva', 12, 0, four), lv('gaia_larva', 12, 0, four), MONSTERS);
  assert.equal(o.child, 'ss_gaia');
  assert.equal(o.kind, 'four');
  const p = breedOutcome(lv('pururin', 10, 0, { lineage: { p: ['pururin', 'pururin'] } }), lv('pururin', 10, 0, { lineage: { p: ['pururin', 'pururin'] } }), MONSTERS);
  assert.equal(p.child, 'kirakira');
  assert.equal(FOUR_RECIPES.length, 2);
  // 血統
  const L = makeLineage({ species: 'gaia_larva', lineage: { p: ['gaia_larva', 'gaia_larva'] } }, { species: 'rock_mole' });
  assert.deepEqual(L, { p: ['gaia_larva', 'rock_mole'], g: [['gaia_larva', 'gaia_larva'], null] });
});

test('特定配合（ふえた 組み合わせ）: 第4章・第5章の 強い 魔物も 配合で。親より ランクが 低い 子は 一覧の さいご（第43回 A: やせいの 子の ランクは めずらしさ）', () => {
  const R35 = BREED_RECIPES.slice(-7);
  for (const r of R35) {
    assert.ok(MONSTER_FRIENDS[r.a] && MONSTER_FRIENDS[r.b] && MONSTER_FRIENDS[r.child], r.child);
    const hi = Math.max(rankIdx(r.a, MONSTERS), rankIdx(r.b, MONSTERS));
    for (const [x, y] of [[r.a, r.b], [r.b, r.a]]) {
      const o = breedOutcome(lv(x), lv(y), MONSTERS);
      assert.ok(o.list.includes(r.child), r.child);
      if (rankIdx(r.child, MONSTERS) >= hi) assert.equal(o.child, r.child);
      else assert.equal(o.list[o.list.length - 1] === r.child || o.items.filter((it) => it.rank < hi).some((it) => it.sp === r.child), true, r.child);
    }
  }
});

test('ほんとうに 配合: 4体配合で ガイアイーター（新生配合で 血統を 作る）。受けつぎ・血統・ランクが セーブに のこる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(35);
  const breed = (a, b, child) => {
    bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b, child });
    const r = lastRes(bot);
    assert.ok(r.ok, r.text);
    return c.companions[c.companions.length - 1];
  };
  const make = () => {
    const a = addMonsterCompanion(world, bot.s, 'gaia_larva', 20), b = addMonsterCompanion(world, bot.s, 'gaia_larva', 20);
    const kid = breed(a.key, b.key, 'gaia_larva');
    assert.equal(kid.species, 'gaia_larva');
    assert.ok(kid.char.plus >= 5, '新生配合で ＋が 大きい');
    assert.deepEqual(kid.char.lineage.p, ['gaia_larva', 'gaia_larva']);
    assert.ok(kid.char.bonus.str > 0, '受けついだ 能力');
    kid.char.level = 12;
    return kid;
  };
  const k1 = make(), k2 = make();
  world.sendSelf(bot.s);
  // 酒場の 一覧（クライアント）でも 4体配合が 見える
  const roster = tavernInfo(world, bot.s).roster;
  const e1 = roster.find((e) => e.key === k1.key), e2 = roster.find((e) => e.key === k2.key);
  assert.equal(breedOutcome(e1, e2, MONSTERS, bot.char).child, 'ss_gaia');
  const pv = breedPreview(c, k1.key, k2.key);
  assert.equal(pv.child, 'ss_gaia');
  assert.equal(pv.rank, 'SS');
  assert.ok(pv.choices.length >= 2 && pv.choices.every((ch) => ['up', 'same', 'down'].includes(ch.trend)));
  const gaia = breed(k1.key, k2.key, 'ss_gaia');
  assert.equal(gaia.species, 'ss_gaia');
  assert.deepEqual(gaia.char.lineage, { p: ['gaia_larva', 'gaia_larva'], g: [['gaia_larva', 'gaia_larva'], ['gaia_larva', 'gaia_larva']] });
  assert.match(lastRes(bot).text, /ランクSS/);
  assert.equal(c.bestiary.ss_gaia.bred, 1);
  // 酒場の 一覧に 血統が とどく
  const info = tavernInfo(world, bot.s).roster.find((e) => e.key === gaia.key);
  assert.deepEqual(info.lineage, gaia.char.lineage);
  assert.ok(info.bonus && info.ranked === 1);
});

test('ほんとうに 配合: 素材配合は 品が なくなる（品が ないと できない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(36);
  const a = addMonsterCompanion(world, bot.s, 'gazer_eye', 12), b = addMonsterCompanion(world, bot.s, 'star_jelly', 12);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'ss_argos' });
  assert.ok(!lastRes(bot).ok, '品が ない');
  c.items.push({ id: 'argos_pendant', n: 1 });
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: a.key, b: b.key });
  assert.equal(lastRes(bot).preview.child, 'ss_argos');
  assert.equal(lastRes(bot).preview.itemName, ITEMS.argos_pendant.name);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'ss_argos' });
  const r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.equal(itemCount(c, 'argos_pendant'), 0);
  assert.ok(c.companions.some((e) => e.species === 'ss_argos'));
  assert.ok(!companion(c, a.key) && !companion(c, b.key));
});

test('画面の 文字（漢字の きまり・スペース）。monsters-boss.js・farewell.js は kanji-check の 対象', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['public/js/shared/data/monsters-boss.js', 'public/js/shared/world/farewell.js']) assert.ok(files.some((x) => x.endsWith(f)), f);
  for (const f of ['public/js/shared/data/monsters-boss.js', 'public/js/shared/data/companions.js', 'public/js/shared/world/breed.js', 'public/js/shared/world/farewell.js', 'public/js/client/ui/services.js']) {
    const r = checkFile(f).filter((x) => x.kind !== 'kana');
    assert.deepEqual(r, [], f);
  }
});

// ───────────── 仲間が いっぱいの ときの さよなら（world/farewell.js）─────────────
const fill = (c, n) => { while (c.companions.length < n) assert.ok(addMonsterEntry(c, c.companions.length % 2 ? 'pururin' : 'wolf', 1 + (c.companions.length % 7)).ok); };
const said = (bot, re, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));
const choicesOf = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((st) => st[0] === 'choice'));

test('さよなら: 人間の 仲間とも 別れられる。あとで 酒場で また さそえる（レベル1から・装備は ふくろへ）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(40);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard' });
  assert.ok(lastRes(bot).ok);
  const gard = companion(c, 'npc_gard');
  gainExp(gard.char, expForLevel(12));
  const weapon = gard.char.equip.weapon;
  const had = weapon ? itemCount(c, weapon) : 0;
  bot.send({ t: 'svc', kind: 'tavern', action: 'release', key: 'npc_gard' });
  const r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /また酒場でさそってね/);
  assert.ok(!companion(c, 'npc_gard') && !c.partyKeys.includes('npc_gard'));
  if (weapon) assert.equal(itemCount(c, weapon), had + 1, '装備は ふくろへ');
  const again = tavernInfo(world, bot.s).recruits.find((x) => x.key === 'npc_gard');
  assert.ok(again, '酒場で また さそえる');
  assert.equal(again.level, 1);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false });
  assert.equal(companion(c, 'npc_gard').char.level, 1);
});

test('さよなら: 酒場が いっぱいでも、だれかと さよならして 新しい 人間の 仲間を さそえる', { timeout: 60000 }, async () => {
  const { bot, c } = await solo(41);
  fill(c, ROSTER_MAX);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina' });
  assert.ok(!lastRes(bot).ok, 'いっぱい');
  const bye = farewellList(c)[0];
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina', farewell: bye.key });
  const r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /さよならした/);
  assert.ok(companion(c, 'npc_mina') && !companion(c, bye.key));
  assert.equal(c.companions.length, ROSTER_MAX);
  // さそえない 人の ときは さよならしない
  const before = c.companions.length;
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_nobody', farewell: c.companions[0].key });
  assert.ok(!lastRes(bot).ok);
  assert.equal(c.companions.length, before);
});

test('さよなら: 仲間が いっぱいでも 魔物は 仲間に なりたがる →「はい」→ だれと さよならするか えらぶ（やめるも できる）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(42);
  fill(c, ROSTER_MAX);
  // 戦いの おわり: いっぱいでも なりたがる
  let got = null;
  for (let i = 0; i < 200 && !got; i++) got = rollBefriend(world, c, ['pururin'], 5);
  assert.equal(got, 'pururin');
  // 「はい」→ さよならの 一覧（酒場で 待っている レベルの 低い 仲間が 先）→ 1ばんめ
  const list = farewellList(c);
  assert.equal(list.length, ROSTER_MAX);
  assert.ok(list[0].label.includes('Lv1'));
  let n = bot.msgs.length;
  // 第43回 C: 「はい」→ えらぶ文（あずかり所へ送る・だれかとさよならする・やめる。Lv10 の 組が ないので 配合は 出ない）→ さよならの 一覧
  const answers = [0, 1, 0];
  const orig = bot.onMsg.bind(bot);
  bot.onMsg = (m) => {
    if (m.t === 'script' && m.steps.at(-1)?.[0] === 'choice') bot.choice = answers.shift() ?? 0;
    orig(m);
  };
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  const ch = choicesOf(bot, n).find((st) => st[1] === 'だれとさよならする？');
  assert.ok(ch, 'だれと さよならするか 聞く');
  assert.equal(ch[2].length, ROSTER_MAX + 1, 'みんな ＋ もどる');
  assert.ok(said(bot, /仲間がいっぱいだ/, n));
  assert.ok(said(bot, /さよならした/, n));
  assert.ok(!companion(c, list[0].key), 'さよならした');
  assert.ok(c.companions.some((e) => e.species === 'koumorin'), '新しい 魔物が 入った');
  assert.equal(c.companions.length, ROSTER_MAX);
  // やめる（えらぶ文の さいご）: だれも かわらない
  n = bot.msgs.length;
  answers.push(0, 2);
  const keys = c.companions.map((e) => e.key).join();
  world.offerBefriend(bot.s, 'frog');
  await bot.settle();
  bot.onMsg = orig;
  assert.equal(c.companions.map((e) => e.key).join(), keys);
  assert.ok(said(bot, /さびしそうに去っていった/, n));
});
