// 第44回（ポケモン P1。docs/plan-breed-new.md の 2 の C・D と 7-1）: ポケモンの 魔物 19しゅ・進化（レベル・石）・かわらずのいし・ミュウ
//   data/monsters-pokemon.js・data/companions-pokemon.js・data/abilities-pokemon.js・data/items-pokemon.js
//   world/evolve.js（みまもる／とめる・石）・stats.js の gainExp（進化の 用意）・world/scripts.js の checkEvolve・world.js の tick
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  MONSTER_FRIENDS, RANKS, rankOf, rankIdx, breedCandidates, breedOutcome, familyPool, monsterLevelCap, recipeHint, breedRumors,
  bestiaryOrder, bestiaryKnow, BREED_RECIPES, MATERIAL_RECIPES, EVOLVE_FROM, evolveTargets, levelEvolveTo, stoneEvolveTo, evolveNote,
} from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { MONSTERS_POKEMON } from '../public/js/shared/data/monsters-pokemon.js';
import { FRIENDS_POKEMON, RECIPES_POKEMON, MEW_PARENTS } from '../public/js/shared/data/companions-pokemon.js';
import { POKEMON_ABILITIES } from '../public/js/shared/data/abilities-pokemon.js';
import { POKEMON_ITEMS } from '../public/js/shared/data/items-pokemon.js';
import { PRIZES, MEDAL_REWARDS, prizesFor } from '../public/js/shared/data/casino.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { sdBigReward, SD_MEW_FLOOR } from '../public/js/shared/data/secret.js';
import {
  computeStats, newMonsterCompanion, gainExp, expForLevel, learnedAbilities, canEquip, canEquipChar, itemCount, addItem, hasKeyItem,
} from '../public/js/shared/stats.js';
import { addMonsterCompanion, addMonsterEntry, growCompanion, partyOf } from '../public/js/shared/world/party.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { evolveEntry, evolvedName, pendingEvolve } from '../public/js/shared/world/evolve.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { upgradeSave, repairChar } from '../public/js/shared/world/save.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { wildRecruits } from '../tools/gen-monster-ranks.mjs';
import { Bot, tickN } from './helpers.js';

const POKEMON = {
  pikachu: 'beast', raichu: 'beast', charmander: 'dragon', charmeleon: 'dragon', charizard: 'dragon',
  squirtle: 'material', wartortle: 'material', blastoise: 'material', bulbasaur: 'plant', ivysaur: 'plant', venusaur: 'plant',
  eevee: 'beast', flareon: 'beast', vaporeon: 'beast', jolteon: 'beast', umbreon: 'beast', snorlax: 'beast', gengar: 'undead', mew: 'spirit',
};
const IDS = Object.keys(POKEMON);
const RANK_OF = {
  pikachu: 'C', raichu: 'B', charmander: 'D', charmeleon: 'B', charizard: 'A', squirtle: 'D', wartortle: 'B', blastoise: 'A',
  bulbasaur: 'D', ivysaur: 'B', venusaur: 'A', eevee: 'C', flareon: 'B', vaporeon: 'B', jolteon: 'B', umbreon: 'B', snorlax: 'B', gengar: 'B', mew: 'SS',
};
const P2_ANIMS = ['pk_spark', 'pk_thunder', 'pk_quick', 'pk_ember', 'pk_flame', 'pk_water', 'pk_hydro', 'pk_leaf', 'pk_solar', 'pk_shadow', 'pk_psychic', 'pk_bodyslam'];
const gsum = (sp) => Object.values(MONSTER_FRIENDS[sp].growth).reduce((a, b) => a + b, 0);
const lv = (species, level = 20, plus = 0, extra = {}) => ({ species, level, plus, ...extra });
const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

async function solo(seed = 44, level = 30) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.hp = computeStats(c).maxHp;
  return { world, bot, c };
}
// 仲間の 魔物を パーティーに（level … その レベルの はじめ）
const join = (world, bot, sp, level) => {
  const r = addMonsterCompanion(world, bot.s, sp, level);
  assert.ok(r.ok, r.reason);
  const c = world.data.characters[bot.char.id];
  return c.companions.find((e) => e.key === r.key);
};
const toLevel = (ch, L) => growCompanion(ch, expForLevel(L) - ch.exp);
const scripts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script' && !m.spectator);
const choicesOf = (bot, from = 0) => scripts(bot, from).flatMap((m) => m.steps.filter((st) => st[0] === 'choice'));
const said = (bot, re, from = 0) => scripts(bot, from).some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

// ───────────── データ ─────────────
test('ポケモン 19しゅ: 名前の 約束（しゅぞくID・系統）。配合と 進化だけ（やせい・系統配合では 生まれない）・ランクは 手で きめる', () => {
  assert.deepEqual(Object.keys(MONSTERS_POKEMON).sort(), IDS.slice().sort());
  assert.deepEqual(Object.keys(FRIENDS_POKEMON).sort(), IDS.slice().sort());
  const names = new Set();
  for (const sp of IDS) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_POKEMON[sp], sp);
    assert.equal(f, FRIENDS_POKEMON[sp], sp);
    assert.equal(m.race, POKEMON[sp], `${sp} の 系統`);
    assert.ok(m.breedOnly && !m.boss && f.breedOnly && f.recipeOnly && f.rate === 0, sp);
    assert.equal(f.rank, RANK_OF[sp], `${sp} の ランク`);
    assert.equal(rankOf(sp, MONSTERS), RANK_OF[sp], sp);
    assert.ok(!MONSTER_RANKS[sp], `${sp}: やせいの ランクの 表には 入らない`);
    assert.ok(!wildRecruits().includes(sp), sp);
    assert.ok(!familyPool(m.race, MONSTERS).includes(sp), `${sp}: 系統配合では 生まれない`);
    // 敵としても 出せる 形（数字・技・説明）
    assert.ok(m.lv > 0 && m.hp > 0 && m.str > 0 && m.def > 0 && m.agi > 0 && m.desc && Array.isArray(m.actions), sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(f.names.length >= 4 && f.names.every((n) => n.length <= 8), sp);
    assert.ok(!names.has(m.name), m.name);
    names.add(m.name);
    // 名前の カタカナは そのまま（本物の 名前）
    assert.match(m.name, /^[ァ-ヶー]+$/, m.name);
  }
  assert.equal(MONSTERS.pikachu.name, 'ピカチュウ');
  assert.equal(MONSTERS.charizard.name, 'リザードン');
  assert.equal(MONSTERS.mew.name, 'ミュウ');
  // レベルの 上限（ランクで きまる）
  assert.equal(monsterLevelCap({ species: 'charmander', ranked: 1, level: 1 }, MONSTERS), 90);
  assert.equal(monsterLevelCap({ species: 'charizard', ranked: 1, level: 1 }, MONSTERS), 120);
  assert.equal(monsterLevelCap({ species: 'mew', ranked: 1, level: 1, plus: 5 }, MONSTERS), 145);
});

test('強さ: 進化すると のびかたが 大きい（さいごの すがたが いちばん）・カビゴンは HP・ゲンガーは 魔力・ミュウは どれも 高い', () => {
  for (const [a, b, c] of [['pikachu', 'raichu'], ['charmander', 'charmeleon', 'charizard'], ['squirtle', 'wartortle', 'blastoise'], ['bulbasaur', 'ivysaur', 'venusaur']]) {
    assert.ok(gsum(b) > gsum(a), `${a} → ${b}`);
    if (c) assert.ok(gsum(c) > gsum(b), `${b} → ${c}`);
  }
  for (const sp of ['flareon', 'vaporeon', 'jolteon', 'umbreon']) assert.ok(gsum(sp) > gsum('eevee'), sp);
  const hp = (sp) => MONSTER_FRIENDS[sp].growth.hp;
  assert.ok(IDS.every((sp) => sp === 'snorlax' || hp(sp) < hp('snorlax')), 'カビゴンの HP');
  assert.ok(MONSTER_FRIENDS.gengar.growth.mag >= 1.5);
  const mew = Object.values(MONSTER_FRIENDS.mew.growth);
  assert.ok(mew.every((v) => v === mew[0]) && mew[0] > 1.2, 'ミュウは どれも 同じで 高い');
  // ボス級（SS）の のびかたの はば（7〜8.7）。さいごの すがた（A）は 今の A・S の いちばん 上くらいまで
  assert.ok(gsum('mew') <= 8.7);
  for (const sp of IDS) if (sp !== 'mew') assert.ok(gsum(sp) <= 8.05, `${sp}: ${gsum(sp)}`);
  for (const sp of IDS) {
    const st = computeStats(newMonsterCompanion({ id: 'x', species: sp, level: 10 }));
    assert.ok(st.maxHp > 30 && st.maxHp < 200 && st.atk > 15 && st.atk < 80, sp);
    assert.ok(learnedAbilities(newMonsterCompanion({ id: 'x', species: sp, level: 10 })).length >= 2, sp);
  }
});

test('技: pk_〜（abilities-pokemon.js）。えんしゅつは 名前の 約束（P2）。進化しても 前の すがたの 技を 覚えている', () => {
  for (const [id, a] of Object.entries(POKEMON_ABILITIES)) {
    assert.ok(id.startsWith('pk_'), id);
    assert.equal(ABILITIES[id], a, id);
    assert.ok(a.kind === 'monster' && a.name && a.kana && a.desc && a.cast && a.anim && a.effect?.type && a.target, id);
  }
  const anim = (id) => ABILITIES[id].anim;
  assert.equal(anim('pk_thundershock'), 'pk_spark');
  for (const id of ['pk_thunderbolt', 'pk_thunder']) assert.equal(anim(id), 'pk_thunder');
  assert.equal(anim('pk_quickattack'), 'pk_quick');
  assert.equal(anim('pk_ember'), 'pk_ember');
  for (const id of ['pk_flamethrower', 'pk_fireblast']) assert.equal(anim(id), 'pk_flame');
  assert.equal(anim('pk_watergun'), 'pk_water');
  assert.equal(anim('pk_hydropump'), 'pk_hydro');
  assert.equal(anim('pk_razorleaf'), 'pk_leaf');
  assert.equal(anim('pk_solarbeam'), 'pk_solar');
  assert.equal(anim('pk_shadowball'), 'pk_shadow');
  assert.equal(anim('pk_psychic'), 'pk_psychic');
  for (const id of ['pk_bodyslam', 'pk_gigaimpact']) assert.equal(anim(id), 'pk_bodyslam');
  const used = new Set(Object.values(POKEMON_ABILITIES).map((a) => a.anim));
  for (const a of P2_ANIMS) assert.ok(used.has(a), a);
  // 名前の 約束の 技
  const names = Object.fromEntries(Object.values(POKEMON_ABILITIES).map((a) => [a.name, true]));
  for (const n of ['でんきショック', '10まんボルト', 'かみなり', 'でんこうせっか', 'ひのこ', 'かえんほうしゃ', 'だいもんじ', 'みずでっぽう', 'ハイドロポンプ', 'はっぱカッター', 'ソーラービーム', 'シャドーボール', 'サイコキネシス', 'のしかかり', 'ギガインパクト']) assert.ok(names[n], n);
  // 強さの 上限（系統の おうぎ。1体 の 魔法 180・全体 の 魔法 180・物理 1体 2.6）
  for (const a of Object.values(POKEMON_ABILITIES)) {
    if (a.effect.type === 'magic') assert.ok(a.effect.base[1] <= 180, a.name);
    if (a.effect.type === 'phys') assert.ok(a.effect.mult * (a.effect.hits || 1) <= 2.6, a.name);
  }
  // 進化しても 前の すがたの 技は のこる（learn に ふくむ）
  for (const sp of IDS) {
    const from = EVOLVE_FROM[sp];
    if (!from || MONSTER_FRIENDS[from].stones) continue;
    const mine = new Set(MONSTER_FRIENDS[sp].learn.map(([, id]) => id));
    for (const [, id] of MONSTER_FRIENDS[from].learn) if (!(from === 'pikachu' && id === 'pk_thunder')) assert.ok(mine.has(id), `${sp} は ${id} も`);
  }
});

// ───────────── 生まれかた ─────────────
test('配合: どちらを 1ぴきめに しても 同じ（ピカチュウ・ヒトカゲ・ゼニガメ・フシギダネ・イーブイ・カビゴン・ゲンガー）。弱い 親では 生まれない', () => {
  const PAIRS = [
    ['wolf', 'thunder_imp', 'pikachu'], ['ikazuchi_tiger', 'frog', 'pikachu'],
    ['lava_lizard', 'hinezumi', 'charmander'], ['sea_serpent', 'fire_imp', 'charmander'],
    ['coral_golem', 'marine_slime', 'squirtle'], ['buriki', 'armor_crab', 'squirtle'],
    ['karamizuta', 'nemuri', 'bulbasaur'], ['toge_saboten', 'donguri', 'bulbasaur'],
    ['wolf', 'hana_pururin', 'eevee'], ['frog', 'king_pururin', 'eevee'],
    ['wolf', 'king_pururin', 'snorlax'],
    ['shadow_flame', 'koakuma', 'gengar'], ['headless', 'demon_knight', 'gengar'],
  ];
  for (const [a, b, child] of PAIRS) {
    const x = breedCandidates(lv(a), lv(b), MONSTERS), y = breedCandidates(lv(b), lv(a), MONSTERS);
    assert.ok(x.list.includes(child), `${a}＋${b} → ${child}`);
    assert.deepEqual(x.list, y.list, `${a}＋${b}: どちら向きでも 同じ`);
    assert.equal(breedOutcome(lv(a), lv(b), MONSTERS, null, child).child, child);
  }
  // おすすめ（いちばん 上）に なる 組
  assert.equal(breedOutcome(lv('wolf'), lv('thunder_imp'), MONSTERS).child, 'pikachu');
  assert.equal(breedOutcome(lv('lava_lizard'), lv('hinezumi'), MONSTERS).child, 'charmander');
  assert.equal(breedOutcome(lv('coral_golem'), lv('marine_slime'), MONSTERS).child, 'squirtle');
  assert.equal(breedOutcome(lv('wolf'), lv('king_pururin'), MONSTERS).child, 'snorlax');
  assert.equal(breedOutcome(lv('shadow_flame'), lv('koakuma'), MONSTERS).child, 'gengar');
  // 弱い 親（ランク E より 下）・ちがう 系統では 生まれない。前からの 組み合わせは かわらない
  for (const [a, b, child] of [['wolf', 'pururin', 'eevee'], ['skeleton', 'goblin', 'gengar'], ['donguri', 'kobushi', 'bulbasaur'], ['wolf', 'fire_imp', 'charmander'], ['frog', 'wolf', 'pikachu']]) {
    assert.ok(!breedCandidates(lv(a), lv(b), MONSTERS).list.includes(child), `${a}＋${b} から ${child} は 生まれない`);
  }
  assert.equal(breedOutcome(lv('skeleton'), lv('goblin'), MONSTERS).child, 'demon_knight');
  assert.equal(breedOutcome(lv('rockman'), lv('armor_crab'), MONSTERS).child, 'golem');
  assert.equal(breedOutcome(lv('chibi_dragon'), lv('sea_serpent'), MONSTERS).child, 'great_dragon');
  assert.equal(breedOutcome(lv('pururin'), lv('ice_pururin'), MONSTERS).child, 'king_pururin');
  // 進化した すがた・ミュウは 配合の レシピでは 生まれない（進化・素材配合だけ）
  const kids = new Set(BREED_RECIPES.map((r) => r.child));
  for (const sp of IDS) if (EVOLVE_FROM[sp] || sp === 'mew') assert.ok(!kids.has(sp), sp);
  for (const r of RECIPES_POKEMON) assert.ok(BREED_RECIPES.includes(r));
  // ヒント
  assert.equal(recipeHint('pikachu', MONSTERS), 'けもの系 ＋ かみなりの魔物');
  assert.equal(recipeHint('charmander', MONSTERS), 'ドラゴン系 ＋ ほのおの魔物');
  assert.equal(recipeHint('squirtle', MONSTERS), '物質系 ＋ 水の魔物');
  assert.equal(recipeHint('snorlax', MONSTERS), 'けもの系 ＋ キングぷるりん');
  assert.match(recipeHint('gengar', MONSTERS), /^ゾンビ系（Dランク以上） ＋ 悪魔系（Dランク以上）$/);
});

test('ほんとうに 配合: ヒトカゲが 生まれる（Lv1・追いつき・図鑑）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(1);
  const a = join(world, bot, 'lava_lizard', 20), b = join(world, bot, 'hinezumi', 16);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'charmander' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.at(-1);
  assert.equal(kid.species, 'charmander');
  assert.equal(kid.char.level, 1);
  assert.equal(kid.char.name, 'ヒトカゲ');
  assert.equal(kid.char.catchUp, 15);
  assert.equal(bestiaryKnow(c)('charmander'), 2);
});

// ───────────── レベルで 進化 ─────────────
test('レベルで 進化: 戦いで Lv25 → けっかの あとで「…おや？」→ みまもる → リザード（レベル・＋・受けついだ 物は そのまま）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(2, 40);
  const e = join(world, bot, 'charmander', 24);
  const ch = e.char;
  ch.name = 'ヒトカゲ';
  ch.plus = 12;
  ch.bonus = { str: 7, hp: 11 };
  ch.inherit = ['hoimi', 'mera'];
  ch.seeds = { str: 3 };
  ch.lineage = { p: ['lava_lizard', 'hinezumi'], g: [null, null] };
  ch.parents = ['トカゲ', 'ネズミ'];
  ch.catchUp = 30;
  ch.exp = expForLevel(25) - 1;
  ch.hp = 1;
  ch.mp = 0;
  assert.ok(partyOf(world, bot.s).supports.some((x) => x.char === ch), 'パーティーに いる');
  const n = bot.msgs.length;
  startFieldBattle(world, bot.s, { id: 'evo1', sp: 'wolf', group: ['wolf', 'wolf'], zone: 'outskirts', table: 'outskirts', busy: false });
  await bot.settle(8000);
  assert.equal(bot.battles.at(-1)?.outcome, 'win');
  const ask = choicesOf(bot, n).find((st) => st[2].includes('みまもる'));
  assert.ok(ask, '「みまもる」「とめる」');
  assert.deepEqual(ask[2], ['みまもる', 'とめる']);
  assert.ok(said(bot, /…おや？\nヒトカゲのようすが…！/, n));
  // けっかの あと（けっかの まどより あと）に たずねる
  const iEnd = bot.msgs.findIndex((m, i) => i >= n && m.t === 'battleEnd');
  const iAsk = bot.msgs.findIndex((m, i) => i >= n && m.t === 'script' && m.steps.some((st) => st[0] === 'choice' && st[2].includes('みまもる')));
  assert.ok(iEnd >= 0 && iAsk > iEnd);
  assert.ok(said(bot, /ヒトカゲはリザードに進化した！/, n));
  assert.ok(scripts(bot, n).some((m) => m.steps.some((st) => st[0] === 'flash')), '白く 光る');
  assert.equal(e.species, 'charmeleon');
  assert.equal(ch.species, 'charmeleon');
  assert.equal(ch.name, 'リザード', 'もとの しゅぞくの 名前の ままなので 新しい 名前');
  assert.ok(ch.level >= 25);
  assert.equal(ch.plus, 12);
  assert.deepEqual(ch.bonus, { str: 7, hp: 11 });
  assert.deepEqual(ch.inherit, ['hoimi', 'mera']);
  assert.deepEqual(ch.seeds, { str: 3 });
  assert.deepEqual(ch.lineage, { p: ['lava_lizard', 'hinezumi'], g: [null, null] });
  assert.deepEqual(ch.parents, ['トカゲ', 'ネズミ']);
  assert.equal(ch.catchUp, 30);
  assert.equal(ch.evolveTo, undefined);
  const st = computeStats(ch);
  assert.equal(ch.hp, st.maxHp, 'HP 満タン');
  assert.equal(ch.mp, st.maxMp, 'MP 満タン');
  assert.ok(learnedAbilities(ch).includes('hoimi') && learnedAbilities(ch).includes('pk_flamethrower'));
  assert.equal(bestiaryKnow(c)('charmeleon'), 2, '図鑑に のる');
  assert.equal(c.bestiary.charmeleon.evolved, 1);
  // 進化は 1回だけ（もう たずねない）
  const m = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(choicesOf(bot, m).length, 0);
  assert.ok(!bot.s.busy);
});

test('とめる: 進化しない → 次に レベルが 上がった ときに また たずねる。自分で つけた 名前は そのまま', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(3);
  const e = join(world, bot, 'pikachu', 24);
  e.char.name = 'ライライ';
  toLevel(e.char, 25);
  assert.equal(e.char.evolveTo, 'raichu');
  bot.choice = 1;
  let n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.ok(said(bot, /進化が止まった/, n));
  assert.equal(e.species, 'pikachu');
  assert.equal(e.char.evolveTo, undefined);
  assert.equal(pendingEvolve(c), null);
  // レベルが 上がらない うちは たずねない
  n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(choicesOf(bot, n).length, 0);
  // 次の レベル
  toLevel(e.char, 26);
  assert.equal(e.char.evolveTo, 'raichu');
  bot.choice = 0;
  n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.ok(said(bot, /ライライはライチュウに進化した！/, n));
  assert.equal(e.species, 'raichu');
  assert.equal(e.char.name, 'ライライ', '自分で つけた 名前');
  assert.equal(e.char.level, 26);
});

test('名前: もとの しゅぞくの 名前・はじめの 名前の 一覧の ときだけ かわる。2つ 進化を まとめて（Lv55 の ヒトカゲ → リザード → リザードン）', { timeout: 60000 }, async () => {
  assert.equal(evolvedName('ヒトカゲ', 'charmander', 'charmeleon'), 'リザード');
  assert.equal(evolvedName(MONSTER_FRIENDS.charmander.names[1], 'charmander', 'charmeleon'), MONSTER_FRIENDS.charmeleon.names[1]);
  assert.equal(evolvedName('ポチ', 'charmander', 'charmeleon'), 'ポチ');
  const { world, bot, c } = await solo(4, 60);
  const e = join(world, bot, 'charmander', 54);
  assert.equal(e.char.name, MONSTER_FRIENDS.charmander.names[0], 'はじめの 名前の 一覧');
  toLevel(e.char, 55);
  assert.equal(e.char.evolveTo, 'charmeleon');
  const n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(choicesOf(bot, n).filter((st) => st[2].includes('みまもる')).length, 2, 'つづけて たずねる');
  assert.equal(e.species, 'charizard');
  assert.equal(e.char.name, MONSTER_FRIENDS.charizard.names[0], '一覧の 同じ ばんごうの 名前');
  assert.ok(said(bot, new RegExp(`${MONSTER_FRIENDS.charmeleon.names[0]}はリザードンに進化した！`), n));
  assert.equal(bestiaryKnow(c)('charizard'), 2);
});

test('装備: 新しい すがたで 装備できない 物は ふくろへ（フシギソウの ぼうし → フシギバナは かぶれない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(5, 60);
  const e = join(world, bot, 'ivysaur', 49);
  assert.ok(canEquipChar(e.char, 'leather_hat'));
  e.char.equip.head = 'leather_hat';
  e.char.equip.weapon = 'leather_whip';
  const before = itemCount(c, 'leather_hat');
  toLevel(e.char, 50);
  const n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(e.species, 'venusaur');
  assert.equal(e.char.equip.head, null);
  assert.equal(e.char.equip.weapon, 'leather_whip', 'ムチは そのまま');
  assert.equal(itemCount(c, 'leather_hat'), before + 1, 'ふくろへ');
  assert.ok(said(bot, /ふくろにしまった/, n));
  // evolveEntry の かえりち
  const d = newMonsterCompanion({ id: 'x', species: 'wartortle', level: 50 });
  d.equip.head = 'iron_helm';
  const r = evolveEntry(c, { key: 'zz', kind: 'monster', species: 'wartortle', char: d }, 'blastoise');
  assert.deepEqual(r.stowed, ['iron_helm']);
  assert.equal(d.species, 'blastoise');
});

test('かわらずのいし: 魔物だけ 装備できる。装備していると レベルで 進化しない（はずすと 次の レベルで）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(6);
  assert.ok(ITEMS.everstone.type === 'acc' && ITEMS.everstone.monsterOnly && ITEM_KANA.everstone);
  assert.equal(canEquip('warrior', 'everstone'), false, '人は 装備できない');
  assert.equal(canEquipChar(c, 'everstone'), false);
  const e = join(world, bot, 'squirtle', 24);
  assert.equal(canEquipChar(e.char, 'everstone'), true);
  addItem(c, 'everstone', 1);
  bot.send({ t: 'menu', action: 'equip', id: 'everstone', who: e.key });
  assert.equal(e.char.equip.acc, 'everstone', lastMenu(bot)?.text);
  bot.send({ t: 'menu', action: 'equip', id: 'everstone', who: 'self' });
  assert.notEqual(c.equip.acc, 'everstone');
  toLevel(e.char, 27);
  assert.equal(e.char.level, 27);
  assert.equal(e.char.evolveTo, undefined);
  assert.equal(levelEvolveTo(e.char), null);
  let n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(choicesOf(bot, n).length, 0);
  // 用意の あとで 装備した とき も たずねない（用意を 消す）
  e.char.evolveTo = 'wartortle';
  assert.equal(pendingEvolve(c), null);
  assert.equal(e.char.evolveTo, undefined);
  // はずすと 次の レベルで
  bot.send({ t: 'menu', action: 'unequip', who: e.key, slot: 'acc' });
  assert.equal(e.char.equip.acc, null);
  toLevel(e.char, 28);
  assert.equal(e.char.evolveTo, 'wartortle');
  n = bot.msgs.length;
  bot.s.evoCheck = true;
  await bot.settle();
  assert.equal(e.species, 'wartortle');
});

// ───────────── 石で 進化 ─────────────
test('石で 進化: イーブイに 4つの 石（ブースター・シャワーズ・サンダース・ブラッキー）。使うと なくなる。ほかの 魔物・人には 効かない（へらない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(7);
  const STONES = { fire_stone: 'flareon', water_stone: 'vaporeon', thunder_stone: 'jolteon', moon_stone: 'umbreon' };
  for (const [id, to] of Object.entries(STONES)) {
    const it = ITEMS[id];
    assert.ok(it.type === 'use' && it.field && !it.battle && it.effect.type === 'evoStone' && ITEM_KANA[id], id);
    assert.equal(stoneEvolveTo('eevee', id), to);
    assert.equal(stoneEvolveTo('pikachu', id), null);
  }
  assert.match(evolveNote('eevee'), /ほのおのいし・みずのいし・かみなりのいし・つきのいしで進化する/);
  // ほかの 魔物・人には 使えない
  const pika = join(world, bot, 'pikachu', 10);
  addItem(c, 'fire_stone', 2);
  bot.send({ t: 'menu', action: 'useItem', id: 'fire_stone', ref: `sup:${pika.key}` });
  assert.equal(lastMenu(bot).ok, false);
  bot.send({ t: 'menu', action: 'useItem', id: 'fire_stone', ref: 'self' });
  assert.equal(lastMenu(bot).ok, false);
  assert.equal(itemCount(c, 'fire_stone'), 2, 'へらない');
  assert.equal(pika.species, 'pikachu');
  // イーブイ
  for (const [id, to] of Object.entries(STONES)) {
    const e = join(world, bot, 'eevee', 20);
    e.char.name = 'イーブイ';
    e.char.plus = 5;
    addItem(c, id, 1);
    const have = itemCount(c, id);
    bot.send({ t: 'menu', action: 'useItem', id, ref: `sup:${e.key}` });
    const r = lastMenu(bot);
    assert.ok(r.ok, r.text);
    assert.match(r.text, new RegExp(`イーブイは${MONSTERS[to].name}に進化した！`));
    assert.equal(e.species, to);
    assert.equal(e.char.name, MONSTERS[to].name);
    assert.equal(e.char.level, 20);
    assert.equal(e.char.plus, 5);
    assert.equal(itemCount(c, id), have - 1, '石は なくなる');
    assert.equal(bestiaryKnow(c)(to), 2);
    // 進化した あとは もう 石で かわらない
    addItem(c, id, 1);
    bot.send({ t: 'menu', action: 'useItem', id, ref: `sup:${e.key}` });
    assert.equal(lastMenu(bot).ok, false);
    // パーティーを あける
    c.partyKeys = c.partyKeys.filter((k) => k !== e.key);
    world.sendSelf(bot.s);
  }
});

test('石・かわらずのいしの 手に入れかた: カジノの 景品（第2章クリアの あと）・メダル王（45まい）・宝の地図の 宝箱（石）', () => {
  const STONES = ['fire_stone', 'water_stone', 'thunder_stone', 'moon_stone'];
  for (const id of [...STONES, 'everstone']) {
    const p = PRIZES.find((x) => x.id === id);
    assert.ok(p && p.need === 'c2_clear' && p.coins >= 500 && p.coins <= 3000, id);
    assert.ok(!prizesFor({}).some((x) => x.id === id), `${id}: はじめは ならばない`);
    assert.ok(prizesFor({ c2_clear: true }).some((x) => x.id === id), id);
    assert.ok(MEDAL_REWARDS.some((r) => r.items.some(([x]) => x === id)), `${id}: メダル王`);
  }
  const got = new Map();
  for (let i = 0; i < 6000; i++) {
    const r = chestLoot(makeRng(i), 1 + (i % 12), 'normal');
    if (r.item) got.set(r.item, (got.get(r.item) || 0) + 1);
  }
  for (const id of STONES) assert.ok((got.get(id) || 0) > 3, `${id}: 宝箱 ${got.get(id) || 0}`);
  const stones = STONES.reduce((a, id) => a + (got.get(id) || 0), 0);
  assert.ok(stones < 6000 * 0.05, `めずらしい ${stones}`);
  // 地図 Lv1・2 には 出ない
  for (let i = 0; i < 3000; i++) assert.ok(!STONES.includes(chestLoot(makeRng(i), 1 + (i % 2), 'normal').item));
});

// ───────────── ミュウ ─────────────
test('ミュウ: 進化した ポケモン 2ひき（リザードン・フシギバナ・カメックス・ライチュウ）＋ ふしぎないでんし（ひみつのダンジョン 50階で 1回だけ）', { timeout: 60000 }, async () => {
  assert.deepEqual(MEW_PARENTS.slice().sort(), ['blastoise', 'charizard', 'raichu', 'venusaur']);
  assert.ok(ITEMS.mew_gene.type === 'key' && ITEM_KANA.mew_gene);
  assert.ok(MATERIAL_RECIPES.some((r) => r.child === 'mew' && r.item === 'mew_gene'));
  // 50階の 大きな ごほうびに 1つ（ほかの 階には ない）
  assert.equal(SD_MEW_FLOOR, 50);
  assert.ok(sdBigReward(50).some((e) => e.item === 'mew_gene'));
  for (let f = 5; f <= 200; f += 5) if (f !== 50) assert.ok(!sdBigReward(f).some((e) => e.item === 'mew_gene'), `${f}階`);
  const key = { items: [], keyItems: ['mew_gene'] };
  for (const a of MEW_PARENTS) for (const b of MEW_PARENTS) {
    const o = breedOutcome(lv(a, 50), lv(b, 50), MONSTERS, key);
    assert.equal(o.child, 'mew', `${a}＋${b}`);
    assert.equal(o.kind, 'material');
    assert.equal(o.rank, 'SS');
  }
  assert.ok(!breedCandidates(lv('charizard', 50), lv('venusaur', 50), MONSTERS, { items: [], keyItems: [] }).list.includes('mew'), '品が ないと 生まれない');
  assert.ok(!breedCandidates(lv('charizard', 50), lv('great_dragon', 50), MONSTERS, key).list.includes('mew'), 'ちがう 親');
  assert.ok(!breedCandidates(lv('charmeleon', 50), lv('ivysaur', 50), MONSTERS, key).list.includes('mew'), '進化の とちゅう');
  assert.match(recipeHint('mew', MONSTERS), /ふしぎないでんし/);
  // ほんとうに 配合（大事な物は なくなる。2つめは もらえない）
  const { world, bot, c } = await solo(8, 60);
  const a = join(world, bot, 'charizard', 52), b = join(world, bot, 'raichu', 40);
  assert.ok(!breedPreview(c, a.key, b.key, 'mew').ok, 'まだ 品が ない');
  addItem(c, 'mew_gene', 1);
  addItem(c, 'mew_gene', 1);
  assert.equal(c.keyItems.filter((k) => k === 'mew_gene').length, 1, '大事な物は 1つ');
  const pv = breedPreview(c, a.key, b.key);
  assert.ok(pv.ok && pv.child === 'mew' && pv.kind === 'material' && pv.itemName === 'ふしぎないでんし');
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'mew' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.at(-1);
  assert.equal(kid.species, 'mew');
  assert.equal(kid.char.name, 'ミュウ');
  assert.equal(hasKeyItem(c, 'mew_gene'), false, 'なくなった');
  assert.equal(kid.char.catchUp, 39);
});

// ───────────── 図鑑 ─────────────
test('図鑑: 進化の 前と 後は となり（ヒトカゲ → リザード → リザードン・イーブイ → 4つ）。見るまでは ？？？。ヒント「Lv25で進化」', () => {
  const order = bestiaryOrder(MONSTERS);
  assert.equal(order.length, Object.keys(MONSTERS).length);
  assert.equal(new Set(order).size, order.length);
  const at = (sp) => order.indexOf(sp);
  for (const line of [['pikachu', 'raichu'], ['charmander', 'charmeleon', 'charizard'], ['squirtle', 'wartortle', 'blastoise'], ['bulbasaur', 'ivysaur', 'venusaur'], ['eevee', 'flareon', 'vaporeon', 'jolteon', 'umbreon']]) {
    for (let i = 1; i < line.length; i++) assert.equal(at(line[i]), at(line[0]) + i, line.join('→'));
  }
  // 配合だけの 魔物の ならび（ボスより 前）
  const firstBoss = order.findIndex((sp) => MONSTERS[sp].boss);
  for (const sp of IDS) assert.ok(at(sp) < firstBoss, sp);
  // 進化の すがた
  assert.deepEqual(evolveTargets('charmander'), ['charmeleon']);
  assert.deepEqual(evolveTargets('eevee'), ['flareon', 'vaporeon', 'jolteon', 'umbreon']);
  assert.equal(EVOLVE_FROM.charizard, 'charmeleon');
  assert.equal(EVOLVE_FROM.umbreon, 'eevee');
  assert.equal(recipeHint('charmeleon', MONSTERS), 'ヒトカゲがLv25で進化');
  assert.equal(recipeHint('charizard', MONSTERS), 'リザードがLv50で進化');
  assert.equal(recipeHint('raichu', MONSTERS), 'ピカチュウがLv25で進化');
  assert.equal(recipeHint('vaporeon', MONSTERS), 'イーブイにみずのいしを使う');
  assert.equal(evolveNote('charmander'), 'Lv25で進化する');
  assert.equal(evolveNote('charmeleon'), 'Lv50で進化する');
  assert.equal(evolveNote('charizard'), '');
  assert.equal(evolveNote('snorlax'), '');
  // 見るまでは ？？？（図鑑で 知らない）
  const know = bestiaryKnow({ bestiary: { charmander: { friend: 1 } } });
  assert.equal(know('charmander'), 2);
  assert.equal(know('charmeleon'), 0);
  // 酒場の うわさ: 配合で 生まれる ポケモンは 出る・進化した すがたは 出ない（ヒントが 進化なので）
  const rumors = breedRumors({ bestiary: {}, kills: {} }, MONSTERS, 99);
  assert.ok(rumors.includes('けもの系 ＋ かみなりの魔物'));
  assert.ok(!rumors.some((t) => /で進化|を使う/.test(t)));
});

// ───────────── セーブ ─────────────
test('セーブ: 進化の 用意（evolveTo）・進化した しゅぞく・ふしぎないでんしが のこる（読みなおし・引っこしコード）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(9);
  const e = join(world, bot, 'bulbasaur', 24);
  toLevel(e.char, 25);
  assert.equal(e.char.evolveTo, 'ivysaur');
  const f = join(world, bot, 'eevee', 12);
  addItem(c, 'moon_stone', 1);
  bot.send({ t: 'menu', action: 'useItem', id: 'moon_stone', ref: `sup:${f.key}` });
  assert.equal(f.species, 'umbreon');
  addItem(c, 'mew_gene', 1);
  addItem(c, 'everstone', 1);
  const raw = JSON.parse(JSON.stringify(world.data));
  const c2 = upgradeSave(raw).data.characters[c.id];
  repairChar(c2, c.id);
  const e2 = c2.companions.find((x) => x.key === e.key), f2 = c2.companions.find((x) => x.key === f.key);
  assert.equal(e2.char.evolveTo, 'ivysaur');
  assert.equal(f2.species, 'umbreon');
  assert.equal(f2.char.species, 'umbreon');
  assert.ok(c2.keyItems.includes('mew_gene'));
  assert.equal(itemCount(c2, 'everstone'), 1);
  const code = exportCode(c);
  const r = parseCode(code);
  assert.ok(r.ok, r.reason);
  const e3 = r.char.companions.find((x) => x.key === e.key), f3 = r.char.companions.find((x) => x.key === f.key);
  assert.equal(e3.char.evolveTo, 'ivysaur');
  assert.equal(f3.species, 'umbreon');
  assert.equal(f3.char.species, 'umbreon');
  // 読みなおした あと（ログイン）で たずねる
  const saved = JSON.parse(JSON.stringify(world.data));
  const world2 = new GameWorld({ offline: true, rng: makeRng(10), rateLimit: false, data: saved });
  const bot2 = new Bot(world2, 'ユイ');
  bot2.send({ t: 'hello' });
  bot2.send({ t: 'play', id: c.id });
  await bot2.settle();
  assert.ok(said(bot2, /…おや？/), 'ログインした あとで たずねる');
  assert.equal(world2.data.characters[c.id].companions.find((x) => x.key === e.key).species, 'ivysaur');
});

// ───────────── 家族 ─────────────
test('家族で 遊ぶ: えらぶ 文は もちぬしだけ（ほかの 人には 出ない。進化したら お知らせ）', { timeout: 90000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(12), checkPassword: () => true, rateLimit: false });
  const bots = [];
  for (const [i, name] of ['パパ', 'ユイ'].entries()) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay(['warrior', 'mage'][i]);
    await b.settle();
    bots.push(b);
  }
  bots[0].send({ t: 'party', action: 'invite', sid: bots[1].s.id });
  bots[1].send({ t: 'party', action: 'accept' });
  for (const b of bots) {
    b.s.map = 'overworld';
    b.s.x = FIELD.x;
    b.s.y = FIELD.y;
  }
  assert.equal(partyOf(world, bots[0].s), partyOf(world, bots[1].s), '同じ パーティー');
  const yui = world.data.characters[bots[1].char.id];
  const add = addMonsterEntry(yui, 'charmander', 24);
  const e = yui.companions.find((x) => x.key === add.key);
  e.char.name = 'ヒトカゲ';
  toLevel(e.char, 25);
  assert.equal(e.char.evolveTo, 'charmeleon');
  const n0 = bots[0].msgs.length, n1 = bots[1].msgs.length;
  for (const b of bots) b.s.evoCheck = true;
  for (let i = 0; i < 400 && (bots.some((b) => b.s.busy || b.queue.length) || i < 5); i++) {
    for (const b of bots) b.flushQueue();
    await tickN(world, 1);
  }
  assert.ok(choicesOf(bots[1], n1).some((st) => st[2].includes('みまもる')), 'ユイには 出る');
  assert.ok(!bots[0].msgs.slice(n0).some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'choice')), 'パパには えらぶ 文が 出ない');
  assert.equal(e.species, 'charmeleon');
  assert.ok(bots[0].msgs.slice(n0).some((m) => m.t === 'toast' && /ユイのヒトカゲがリザードに進化した！/.test(m.text)), 'パパには お知らせ');
  assert.ok(!bots[0].s.busy && !bots[1].s.busy);
});

// ───────────── 漢字 ─────────────
test('漢字の きまり: 新しい ファイルの ゲームの 文字（使えない 漢字・スペース なし）', () => {
  const files = [
    'public/js/shared/data/monsters-pokemon.js', 'public/js/shared/data/companions-pokemon.js', 'public/js/shared/data/abilities-pokemon.js',
    'public/js/shared/data/items-pokemon.js', 'public/js/shared/world/evolve.js',
  ];
  const all = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of files) {
    assert.ok(all.some((x) => x.endsWith(f)), `${f} は gameFiles に ある`);
    const bad = checkFile(all.find((x) => x.endsWith(f))).filter((r) => r.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  for (const id of Object.keys(POKEMON_ITEMS)) assert.ok(ITEMS[id] && ITEM_KANA[id], id);
  void RANKS; void rankIdx;
});
