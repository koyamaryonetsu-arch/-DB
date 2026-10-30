// 第53回: 配合で 生まれる 魔物を ふやす（docs/plan-r53-breed-more.md の 2-1 A〜D）
//   A. 系統まぜ配合（data/breed-mix.js・companions.js の mixPool）/ B. まだ 見ていない 魔物を 先に / C. 1つ下の ランクも 候補に
//   D. 色の石で 色ちがいの 仲間（world/breed.js・data/variants.js の colorKinds・colorMon・stats.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import {
  MONSTER_FRIENDS, RANKS, rankIdx, breedCandidates, breedOutcome, breedResult, mixPool, recipeHint, bestiaryKnow, EVOLVE_FROM,
} from '../public/js/shared/data/companions.js';
import { MIX_TABLE, mixKey, COLOR_STONE, MIX_RUMOR } from '../public/js/shared/data/breed-mix.js';
import { colorKinds, colorMon, VARIANT_KINDS, variantId } from '../public/js/shared/data/variants.js';
import { PRIZES } from '../public/js/shared/data/casino.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { computeStats, gainExp, expForLevel, addItem, itemCount } from '../public/js/shared/stats.js';
import { addMonsterEntry, tavernInfo } from '../public/js/shared/world/party.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { exportCode, parseCode, slimChar4, unslimChar4 } from '../public/js/shared/world/transfer.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const RACES = ['slime', 'beast', 'plant', 'demon', 'spirit', 'undead', 'material', 'dragon'];
const PAIRS = RACES.flatMap((a, i) => RACES.slice(i + 1).map((b) => [a, b]));
const lv = (species, level = 20, plus = 0) => ({ species, level, plus });
const RANK_S = RANKS.indexOf('S');

async function solo(seed = 53) {
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

test('A: 28通りの 系統の 組み合わせ みんなに まぜの 子（いくつもの ランク）。表の 魔物は みんな 2つの 系統の どちらか', () => {
  assert.equal(PAIRS.length, 28);
  assert.equal(Object.keys(MIX_TABLE).length, 28);
  for (const [a, b] of PAIRS) {
    assert.ok(MIX_TABLE[mixKey(a, b)], `${a}+${b} の 表`);
    const pool = mixPool(a, b, MONSTERS);
    const ranks = new Set(pool.map((sp) => rankIdx(sp, MONSTERS)));
    assert.ok(pool.length >= 6, `${a}+${b}: ${pool.length}しゅ`);
    assert.ok(ranks.size >= 4, `${a}+${b}: ランク ${[...ranks].map((r) => RANKS[r]).join('')}`);
    assert.deepEqual(mixPool(b, a, MONSTERS), pool, 'どちら向きでも 同じ');
    // 表に 書いた 魔物は みんな のこる（書きまちがいが ない）
    assert.equal(pool.length, new Set(MIX_TABLE[mixKey(a, b)]).size, `${a}+${b}`);
    for (const sp of pool) {
      const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
      assert.ok([a, b].includes(m.race), `${a}+${b} → ${sp}（${m.race}）`);
      // SS・ボス・メタル・きまった 組み合わせ だけの 魔物・進化の すがたは 入らない
      assert.ok(!m.boss && !m.metal && !f.recipeOnly && !EVOLVE_FROM[sp] && rankIdx(sp, MONSTERS) <= RANK_S, sp);
    }
  }
  assert.deepEqual(mixPool('beast', 'beast', MONSTERS), [], '同じ 系統は まぜ配合 なし');
  // 例: けもの×ドラゴン → 竜の けもの・けものの 竜。スライム×物質 → こうせきぷるりん。植物×ゾンビ → まぼろしの花
  assert.ok(mixPool('beast', 'dragon', MONSTERS).includes('axe_rider'));
  assert.ok(mixPool('slime', 'material', MONSTERS).includes('ore_slime'));
  assert.ok(mixPool('plant', 'undead', MONSTERS).includes('mirage_flower'));
});

test('A: まぜの 子は ちがう 系統の 親 どうしの 時だけ。ランクは 高いほうの 親（育てると 1つ上・えらぶだけなら 1つ下）。SS は 生まれない', () => {
  const sps = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp]);
  const rng = makeRng(53);
  let mixSeen = 0;
  for (let i = 0; i < 1500; i++) {
    const a = lv(sps[Math.floor(rng.next() * sps.length)], 10 + Math.floor(rng.next() * 60), Math.floor(rng.next() * 30));
    const b = lv(sps[Math.floor(rng.next() * sps.length)], 10 + Math.floor(rng.next() * 60), Math.floor(rng.next() * 30));
    const x = breedCandidates(a, b, MONSTERS);
    assert.deepEqual(x.list, breedCandidates(b, a, MONSTERS).list, 'どちらを 1ぴきめに しても 同じ');
    const same = MONSTERS[a.species].race === MONSTERS[b.species].race;
    for (const it of x.items.filter((z) => z.kind === 'mix')) {
      mixSeen++;
      assert.ok(!same, `${a.species}＋${b.species}: 同じ 系統で まぜ`);
      assert.ok(it.rank <= RANK_S && it.rank !== RANKS.indexOf('SS'), `SS は まぜで 生まれない: ${it.sp}`);
      assert.ok(it.rank >= x.hi - 1 && it.rank <= x.hi + (x.up ? 1 : 0), `${a.species}＋${b.species} → ${it.sp}`);
    }
    assert.ok(x.items[0].rank >= x.hi, 'おすすめは 下がらない');
  }
  assert.ok(mixSeen > 500, `まぜの 子 ${mixSeen}`);
  // S どうし（とても 育てた 親）でも まぜで SS は 生まれない
  const o = breedCandidates(lv('great_dragon', 99, 99), lv('shadow_mage', 99, 99), MONSTERS);
  assert.ok(o.up);
  assert.ok(!o.items.some((it) => it.kind === 'mix' && rankIdx(it.sp, MONSTERS) > RANK_S));
  assert.ok(o.items.some((it) => it.kind === 'mix' && it.sp === 'axe_rider'), '悪魔×ドラゴン → アックスライダー');
  // 例: フロストドレイク（ドラゴン D）＋ はなぷるりん（スライム D）→ 水竜（まぜ）。特定配合は 今までどおり 先
  const fd = breedCandidates(lv('frost_drake', 12), lv('hana_pururin', 12), MONSTERS);
  assert.equal(fd.items.find((it) => it.sp === 'water_dragon')?.kind, 'mix');
  const sp = breedCandidates(lv('rockman', 12), lv('armor_crab', 12), MONSTERS);
  assert.deepEqual([sp.items[0].sp, sp.items[0].kind], ['golem', 'special'], '特定配合（岩男＋よろいガニ）は そのまま いちばん 上');
  assert.ok(sp.items.some((it) => it.kind === 'mix'));
});

test('A: 図鑑の ヒント・酒場の うわさに まぜ配合', () => {
  assert.equal(recipeHint('ore_slime', MONSTERS), 'スライム系 ＋ 物質系');
  assert.equal(recipeHint('moss_deer', MONSTERS), 'けもの系 ＋ 植物系');
  assert.equal(recipeHint('axe_rider', MONSTERS), '悪魔の騎士 ＋ ドラゴン系', '特定配合の ヒントが 先');
  assert.match(MIX_RUMOR, /ちがう系統どうしでも/);
  const all = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['public/js/shared/data/breed-mix.js', 'public/js/shared/world/breed.js', 'public/js/client/ui/services.js']) {
    const file = all.find((x) => x.endsWith(f));
    assert.ok(file, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(file).filter((r) => r.kind !== 'kana'), [], f);
  }
});

test('B: 同じ ランクの 候補が いくつも ある 時は、図鑑で まだ 見ていない 魔物が おすすめ（ランクは 下げない）', () => {
  const A = lv('frost_drake', 12), B = lv('soul_eater', 12);
  const base = breedCandidates(A, B, MONSTERS);
  assert.equal(breedResult('frost_drake', 'soul_eater', MONSTERS), base.list[0], 'キャラが ない 時は いつも 同じ');
  assert.equal(breedCandidates(A, B, MONSTERS).list.join(), base.list.join(), 'きまった ならび');
  const top = base.items.filter((it) => it.rank === base.items[0].rank && ['mix', 'family', 'parent'].includes(it.kind));
  assert.ok(top.length >= 3, `同じ ランクの 候補 ${top.length}`);
  assert.equal(top[0].kind, 'mix', 'まぜの 子が 先');
  // いちばん 上を 仲間に した → 次の 見ていない 子が おすすめ
  const c = { bestiary: { [top[0].sp]: { bred: 1, friend: 1 } }, kills: {} };
  const o = breedOutcome(A, B, MONSTERS, c);
  assert.equal(o.child, top[1].sp);
  assert.equal(bestiaryKnow(c)(o.child), 0);
  assert.equal(rankIdx(o.child, MONSTERS), top[0].rank, 'ランクは 下げない');
  assert.ok(o.list.includes(top[0].sp), '見た 子も えらべる');
  // 見たことが ある だけ（1）は 仲間に した（2）より 先
  const c2 = { bestiary: Object.fromEntries(top.map((it, i) => [it.sp, i === 0 ? { seen: 1 } : { friend: 1 }])), kills: {} };
  assert.equal(breedOutcome(A, B, MONSTERS, c2).child, top[0].sp);
  // まぜの 子 どうしは 親の 組み合わせで きまる じゅん（親が かわると おすすめも かわる ことが ある）
  const tops = new Set();
  for (const s of ['slime', 'beast', 'plant', 'spirit', 'undead', 'material', 'demon']) {
    for (const x of Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp]?.race === s && rankIdx(sp, MONSTERS) === 2).slice(0, 3)) {
      tops.add(breedResult('frost_drake', x, MONSTERS));
    }
  }
  assert.ok(tops.size >= 5, `フロストドレイクの 子 ${tops.size}しゅ`);
});

test('C: 1つ下の ランクも えらべる（おすすめには ならない・しるし・＋と めやすも 出る）', async () => {
  // はぐれウルフ（E）＋ 闇コウモリ（F）: Lv10 どうしは 1つ上に ならない
  const x = breedCandidates(lv('wolf', 10), lv('dark_bat', 10), MONSTERS);
  assert.equal(x.up, false);
  const low = x.items.filter((it) => it.rank < x.hi);
  assert.ok(low.length >= 5, `1つ下 ${low.length}`);
  assert.ok(low.every((it) => it.rank === x.hi - 1 && ['family', 'mix'].includes(it.kind) || it.kind === 'special' || it.kind === 'recipe'));
  assert.ok(x.items[0].rank >= x.hi);
  assert.ok(x.items.indexOf(low[0]) > x.items.findLastIndex((it) => it.rank >= x.hi), '下の ランクは さいご');
  // 酒場の みほん（world/breed.js の breedPreview）
  const { c } = await solo(531);
  const a = addMonsterEntry(c, 'wolf', 10).key, b = addMonsterEntry(c, 'dark_bat', 10).key;
  const pv = breedPreview(c, a, b);
  assert.ok(pv.ok, pv.reason);
  assert.ok(!pv.choices[0].low);
  const lows = pv.choices.filter((ch) => ch.low);
  assert.ok(lows.length >= 5);
  for (const ch of lows) assert.ok(Number.isFinite(ch.plus) && ['up', 'same', 'down'].includes(ch.trend), ch.sp);
  const pl = breedPreview(c, a, b, lows[0].sp);
  assert.ok(pl.ok && pl.child === lows[0].sp && pl.trend);
});

test('D: 色の石 … 手に入る 所（カジノの 景品・宝の洞窟の 宝箱・きらきらぷるりんが まれに）', () => {
  assert.deepEqual(MAT_DROPS.kirakira, [COLOR_STONE, 4]);
  assert.equal(ITEMS[COLOR_STONE].name, '色の石');
  assert.equal(ITEMS[COLOR_STONE].type, 'mat');
  assert.ok(PRIZES.some((p) => p.id === COLOR_STONE));
  let found = 0;
  for (let i = 0; i < 400 && !found; i++) if (chestLoot(makeRng(i), 5, 'bossB').item === COLOR_STONE) found++;
  assert.ok(found, '宝の洞窟の 宝箱');
});

test('D: 色の石で 色ちがいの 仲間（色の石は 配合できた 時だけ なくなる）。強さ・属性・図鑑・セーブ・引っこしコード', { timeout: 60000 }, async () => {
  assert.deepEqual(colorKinds('water_dragon'), ['dark', 'shadow', 'red', 'gold']);
  assert.deepEqual(colorKinds('frost_drake'), [], '色ちがいが ない 魔物');
  assert.equal(colorMon('water_dragon', 'red'), variantId('water_dragon', 'red'));
  assert.equal(colorMon('water_dragon', '__proto__'), 'water_dragon');
  assert.equal(colorMon(null, 'red'), undefined);
  const { world, bot, c } = await solo(532);
  const a = addMonsterEntry(c, 'frost_drake', 20).key, b = addMonsterEntry(c, 'hana_pururin', 20).key;
  const breed = (extra) => {
    bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b, child: 'water_dragon', ...extra });
    return lastRes(bot);
  };
  // 色の石が ない
  let pv = breedPreview(c, a, b, 'water_dragon');
  assert.equal(pv.stone, 0);
  assert.deepEqual(pv.colors.map((x) => x.kind), ['dark', 'shadow', 'red', 'gold']);
  assert.equal(pv.colors.find((x) => x.kind === 'red').name, 'レッド水竜');
  let r = breed({ color: 'red' });
  assert.ok(!r.ok && /色の石/.test(r.text), r.text);
  assert.equal(c.companions.filter((e) => e.key === a || e.key === b).length, 2, '親は そのまま');
  addItem(c, COLOR_STONE, 2);
  // 色ちがいが ない しゅるい（ぜんまい）は だめ。石は へらない
  r = breed({ color: 'clock' });
  assert.ok(!r.ok);
  assert.equal(itemCount(c, COLOR_STONE), 2);
  pv = breedPreview(c, a, b, 'water_dragon');
  assert.equal(pv.stone, 2);
  r = breed({ color: 'red' });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /色の石/);
  assert.equal(itemCount(c, COLOR_STONE), 1, '1つ なくなる');
  const e = c.companions.find((x) => x.species === 'water_dragon');
  assert.equal(e.char.color, 'red');
  assert.equal(e.char.name, 'レッド水竜');
  assert.equal(c.bestiary.water_dragon.color_red, 1);
  // 強さ: 色ちがいの 倍率の 半分。属性は 色ちがいの きまり（レッド … 火に 強い・氷に 弱い）
  const plain = computeStats({ ...e.char, color: undefined });
  const red = computeStats(e.char);
  assert.ok(red.maxHp > plain.maxHp && red.str > plain.str, `${red.maxHp} > ${plain.maxHp}`);
  assert.ok(red.maxHp < plain.maxHp * VARIANT_KINDS.red.k.hp, 'もとの 色ちがいより 弱め');
  assert.ok((red.resist.fire ?? 1) <= 0.5 && (red.resist.ice ?? 1) >= 1.25, JSON.stringify(red.resist));
  assert.deepEqual(computeStats({ ...e.char, color: '__proto__' }).maxHp, plain.maxHp, 'へんな color は ふつう');
  // 酒場・戦いの 絵
  const ti = tavernInfo(world, bot.s);
  assert.equal(ti.roster.find((x) => x.key === e.key).color, 'red');
  // セーブ（JSON で もどして repairChar）
  const saved = JSON.parse(JSON.stringify(c));
  repairChar(saved, saved.id);
  assert.equal(saved.companions.find((x) => x.key === e.key).char.color, 'red');
  // 引っこしコード（KIZUNA-2〜4）
  const p = parseCode(exportCode(c));
  assert.ok(p.ok, p.reason);
  assert.equal(p.char.companions.find((x) => x.key === e.key).char.color, 'red');
  assert.equal(p.char.bestiary.water_dragon.color_red, 1);
  const k4 = unslimChar4(JSON.parse(JSON.stringify(slimChar4(c))));
  assert.equal(k4.companions.find((x) => x.key === e.key).char.color, 'red');
  assert.equal(k4.bestiary.water_dragon.color_red, 1);
  // 色ちがいが ない 子に 色の石を 使おうと しても だめ（石は のこる）
  const a2 = addMonsterEntry(c, 'frost_drake', 20).key, b2 = addMonsterEntry(c, 'frost_drake', 20).key;
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a2, b: b2, child: 'frost_drake', color: 'red' });
  assert.ok(!lastRes(bot).ok);
  assert.equal(itemCount(c, COLOR_STONE), 1);
  // 使わなければ ふつうの 子（石は へらない）
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a2, b: b2, child: 'frost_drake' });
  assert.ok(lastRes(bot).ok);
  assert.equal(itemCount(c, COLOR_STONE), 1);
  assert.ok(!c.companions.find((x) => x.species === 'frost_drake').char.color);
});
