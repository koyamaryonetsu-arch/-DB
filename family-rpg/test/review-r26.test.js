// 第26回 家族の 見なおし
//   1. 魔物が 仲間に なる かくりつ（第4章・夜の 魔物も 仲間に なる）・仲間の粉
//   2. かめはめ波と 超かめはめ波（上位の 技は もとの 技の 職業レベルの 威力を うけつぐ）
//   3. 戦いの 呪文・特技・道具の せつめい（ui/skillinfo.js）
//   4. もらえる 経験値（0.6）・お金（0.7）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Battle } from '../public/js/shared/battle.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { MONSTER_FRIENDS, joinTier, familyPool } from '../public/js/shared/data/companions.js';
import { FRIENDS_CH4 } from '../public/js/shared/data/companions-ch4.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS, jobBattlesForLevel, jobAncestry } from '../public/js/shared/data/jobs.js';
import { SKILL_UPS } from '../public/js/shared/data/skill-ups.js';
import { POWDER, POWDER_ID, POWDER_SHOPS, powderLeft, powderLabel } from '../public/js/shared/data/friend-powder.js';
import { REWARD_EXP_RATE, REWARD_GOLD_RATE, rewardExp, rewardGold, scaleExp } from '../public/js/shared/data/difficulty.js';
import { fieldChestLoot } from '../public/js/shared/data/fieldchests.js';
import { sdBigReward } from '../public/js/shared/data/secret.js';
import { befriendChance, rollBefriend, BEFRIEND_CAP } from '../public/js/shared/world/party.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { newCharacter, expForLevel, gainExp, computeStats, fullHeal, penaltyFor, jobPower, JOB_POWER, mpCost, newMonsterCompanion } from '../public/js/shared/stats.js';
import { battleSkillText, battleItemText } from '../public/js/client/ui/skillinfo.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const sym = (group) => ({ id: 'r26' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false });

async function solo(seed = 26) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(15) - c.exp);
  c.hp = computeStats(c).maxHp;
  Object.assign(bot.s, { map: 'overworld', x: FIELD.x, y: FIELD.y });
  return { world, bot, c };
}
async function win(world, bot, ctx) {
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  bot.flushQueue?.();
}

// 出現表 1回の 戦いで 仲間に なりたがる かくりつ（さいごに たおした 仲間に なれる 魔物で 1回 ふる）
function zoneChance(z) {
  const t = ENCOUNTER_TABLES[z];
  const tw = t.reduce((s, e) => s + e.w, 0);
  let p = 0;
  for (const e of t) {
    const last = [...e.group].reverse().find(([sp]) => befriendChance({ companions: [{ kind: 'monster' }] }, sp) > 0);
    if (last) p += (e.w / tw) * befriendChance({ companions: [{ kind: 'monster' }] }, last[0]);
  }
  return p;
}

// ───────────── 1. 仲間に なる かくりつ ─────────────
test('仲間の かくりつ: どの 章の 出現表も 1回 5%くらい（10〜20回で 1回）。前は 第4章が 0%だった', () => {
  for (const z of Object.keys(ENCOUNTER_TABLES)) {
    if (z === 'rare' || z.startsWith('sd_') || z.startsWith('tm_')) continue;
    const p = zoneChance(z);
    assert.ok(p >= 0.045 && p <= 0.12, `${z}: ${(p * 100).toFixed(1)}%`);
    // 10回 戦えば 1回でも なりたがる かくりつ 35% いじょう
    assert.ok(1 - (1 - p) ** 10 >= 0.35, z);
  }
  for (const z of ['s_coast', 's_dune', 's_canal', 's_pyr2', 's_sdesert', 's_duna', 's_castle2', 's_sandsea', 't_b1_wet', 't_b2', 't_b3']) assert.ok(zoneChance(z) >= 0.05, z);
});

test('仲間の かくりつ: 第4章・夜の 魔物（25しゅ）が 仲間に なる。強い 魔物は 低め、黄金虫・ボスは ならない', () => {
  assert.equal(Object.keys(FRIENDS_CH4).length, 25);
  for (const [sp, f] of Object.entries(FRIENDS_CH4)) {
    assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss, sp);
    assert.equal(MONSTER_FRIENDS[sp], f);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 12, `${sp}: 1/${Math.round(1 / f.rate)}`);
    assert.ok(joinTier(sp), sp);
    assert.ok(f.names.length >= 4 && new Set(f.names).size === f.names.length && f.names.every((n) => n.length <= 8), sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    // 味方が 使えない しかけの 技（仲間を 呼ぶ・もぐる・はね返す・前ぶれ・構え）は 覚えない
    for (const [, id] of f.learn) assert.ok(!['callHelp', 'burrow', 'reflect', 'telegraph', 'stance', 'flee'].includes(ABILITIES[id].effect?.type), `${sp}: ${id}`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.6 && sum <= 7.5, `${sp}: growth ${sum}`); // いままでの はば（イエティ 5.85・岩男 5.95 など）
    // 系統配合の 子には ならない（今までの 配合の けっかを かえない）
    assert.ok(!familyPool(MONSTERS[sp].race, MONSTERS).includes(sp), sp);
  }
  assert.ok(FRIENDS_CH4.lamp_genie.rate < FRIENDS_CH4.sand_slime.rate, 'ランプの魔人（めずらしい）は 砂ぷるりんより 低い');
  assert.ok(FRIENDS_CH4.water_dragon.rate < FRIENDS_CH4.water_spirit.rate);
  assert.equal(befriendChance({}, 'gold_beetle'), 0, '黄金虫は ならない');
  assert.equal(befriendChance({}, 'morgana'), 0, 'ボスは ならない');
  // レベル1で 仲間に なって、育つ
  const m = newMonsterCompanion({ id: 'x', species: 'sand_slime', level: 10 });
  assert.ok(computeStats(m).maxHp > 30);
});

test('仲間の かくりつ: はじめての 仲間は 3倍・魔物使いや 仲間の粉で 倍・上限 0.5', () => {
  const none = { companions: [] }, some = { companions: [{ kind: 'monster' }] };
  assert.equal(befriendChance(some, 'pururin'), 1 / 10);
  const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a}`);
  near(befriendChance(none, 'pururin'), 3 / 10, 'はじめては 3倍');
  near(befriendChance(some, 'pururin', POWDER.mult), 2 / 10, '仲間の粉は 2倍');
  assert.equal(befriendChance(none, 'pururin', 4), BEFRIEND_CAP);
  assert.equal(BEFRIEND_CAP, 0.5);
});

test('仲間の粉: 道具屋で 売る（魔物の心に 目ざめた あと）。100G・10回・2倍', () => {
  const it = ITEMS[POWDER_ID];
  assert.ok(it && it.type === 'use' && it.field && !it.battle && it.price === 100, '道具');
  assert.match(it.desc, /2倍・10回の戦い/);
  assert.match(it.desc, /ひみつのダンジョン/);
  assert.deepEqual(POWDER, { mult: 2, battles: 10, max: 30 });
  for (const id of POWDER_SHOPS) {
    assert.ok(SHOPS[id] && SHOPS[id].kind === 'item', id);
    assert.ok(!shopItems(SHOPS[id], () => false).includes(POWDER_ID), `${id}: 目ざめる 前は 売らない`);
    assert.ok(shopItems(SHOPS[id], (f) => f === 'monster_bond').includes(POWDER_ID), `${id}: 目ざめた あと`);
  }
  assert.equal(powderLabel({ befriendBoost: 7 }), '仲間の粉\nのこり7回');
  assert.equal(powderLabel({}), '');
  assert.equal(powderLeft({ befriendBoost: 99 }), POWDER.max);
});

test('仲間の粉: 使う → 2倍で 10回。ひみつのダンジョン・目ざめる 前は 使えない（道具は へらない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo();
  c.items.push({ id: POWDER_ID, n: 4 });
  const use = () => { bot.send({ t: 'menu', action: 'useItem', id: POWDER_ID, ref: 'self' }); return lastMenu(bot); };
  const count = () => c.items.find((e) => e.id === POWDER_ID)?.n || 0;
  // 目ざめる 前
  let r = use();
  assert.equal(r.ok, false);
  assert.match(r.text, /魔物の心に目覚めていない/);
  assert.equal(count(), 4);
  c.flags.monster_bond = true;
  // ひみつのダンジョンの 中
  bot.s.map = 'sd_3';
  r = use();
  assert.equal(r.ok, false);
  assert.match(r.text, /ここでは魔物は仲間にならない/);
  assert.equal(count(), 4);
  bot.s.map = 'overworld';
  r = use();
  assert.ok(r.ok, r.text);
  assert.match(r.text, /ふりかけた/);
  assert.match(r.text, /10回の戦い/);
  assert.equal(c.befriendBoost, 10);
  assert.equal(count(), 3);
  assert.equal(bot.char.befriendBoost, 10, '画面の キャラにも とどく（フィールドの しるし）');
  // つづけて 使うと ふえる（30 まで）
  use();
  use();
  assert.equal(c.befriendBoost, 30);
  r = use();
  assert.equal(r.ok, false, 'もう 十分');
  assert.equal(count(), 1);
});

test('仲間の粉: 戦いの おわりで 2倍で ふる・1回 へる。ボス・ひみつのダンジョンでは へらない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(31);
  c.flags.monster_bond = true;
  c.companions = [];
  c.befriendBoost = 2;
  const seen = [];
  const chance = world.rng.chance.bind(world.rng);
  world.rng.chance = (p) => { seen.push(p); return p === 0.5 ? false : chance(p); };
  // 1回め（はじめての 仲間 3倍 × 粉 2倍 = 0.6 → 上限 0.5）
  await win(world, bot, startFieldBattle(world, bot.s, sym(['tsunousagi'])));
  assert.ok(seen.includes(0.5), `ふった かくりつ ${seen}`);
  assert.equal(c.befriendBoost, 1);
  const end = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end.lines.some((l) => /仲間の粉の力：のこり1回/.test(l)), end.lines.join('/'));
  // 仲間に なれる 魔物が いない 戦い（黄金虫 だけ）は 数えない
  await win(world, bot, startFieldBattle(world, bot.s, sym(['gold_beetle'])));
  assert.equal(c.befriendBoost, 1);
  // ひみつのダンジョンでは 仲間に ならないし、へらない
  bot.s.map = 'sd_3';
  await win(world, bot, startFieldBattle(world, bot.s, sym(['tsunousagi'])));
  assert.equal(c.befriendBoost, 1, 'へらない');
  assert.equal(c.companions.filter((e) => e.kind === 'monster').length, 0, '仲間に ならない');
  bot.s.map = 'overworld';
  // 2回め → 消える
  await win(world, bot, startFieldBattle(world, bot.s, sym(['tsunousagi'])));
  assert.equal(c.befriendBoost, undefined);
  const end2 = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end2.lines.some((l) => /仲間の粉の力が消えた/.test(l)));
  world.rng.chance = chance;
});

test('仲間が いっぱいの とき: なりたがったのに 入れない ことを 知らせる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(41);
  c.flags.monster_bond = true;
  const { addMonsterEntry } = await import('../public/js/shared/world/party.js');
  for (let i = 0; i < 30; i++) addMonsterEntry(c, 'pururin', 1);
  const chance = world.rng.chance.bind(world.rng);
  world.rng.chance = (p) => (p > 0 && p <= 0.5 && Math.abs(p - 1 / 10) < 1e-9 ? true : chance(p));
  await win(world, bot, startFieldBattle(world, bot.s, sym(['pururin'])));
  world.rng.chance = chance;
  const end = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end.lines.some((l) => /仲間になりたそうにしていたが、仲間がいっぱいだ/.test(l)), end.lines.join('/'));
  // rollBefriend は 今までどおり null
  const info = {};
  world.rng.chance = () => true;
  assert.equal(rollBefriend(world, c, ['pururin'], 1, info), null);
  assert.equal(info.full, 'pururin');
  world.rng.chance = chance;
});

// ───────────── 2. かめはめ波と 超かめはめ波 ─────────────
function mk(job, lv, jobs) {
  const c = newCharacter({ id: 'k', name: 'K', look: {}, job: 'warrior' });
  c.job = job;
  c.exp = expForLevel(lv);
  c.level = lv;
  c.jobs = {};
  for (const [j, l] of Object.entries(jobs)) c.jobs[j] = { lv: l, b: jobBattlesForLevel(l, JOBS[j].tier) };
  c.equip = { weapon: 'tiger_claw', armor: 'sandstorm_gi', shield: null, head: null, acc: null };
  fullHeal(c);
  return c;
}
function dmg(c, id, enemy = 'mummy_soldier') {
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, kind: 'support', auto: true }], enemies: [enemy], canFlee: false });
  const me = b.combatants.find((x) => x.side === 'ally');
  const t = b.combatants.find((x) => x.side === 'enemy');
  const e = ABILITIES[id].effect;
  const pm = penaltyFor(c, id).powMult;
  return b.calcPhys(me, t, e, pm, e.element || 'phys', true).dmg * (e.hits || 1);
}

test('かめはめ波: 同じ キャラで 超かめはめ波は 1.5倍 いじょう（スーパーサイヤ人に なった ばかりでも・きわめても）', () => {
  for (const ssLv of [1, 5, 10]) {
    const c = mk('super_saiyan', 32, { saiyan: 10, super_saiyan: ssLv });
    const k = dmg(c, 'sy_kamehameha'), s = dmg(c, 'sz_kame');
    assert.ok(s >= k * 1.5, `SS Lv${ssLv}: かめはめ波 ${k} → 超かめはめ波 ${s}`);
    // ビッグバンかめはめ波 も ビッグバンアタックの 1.5倍
    assert.ok(dmg(c, 'hi_bigbang_kame') >= dmg(c, 'sy_bigbang') * 1.45, `SS Lv${ssLv}: ビッグバン`);
    assert.ok(mpCost(c, 'sz_kame') > mpCost(c, 'sy_kamehameha'), 'MPも それなりに');
  }
  // 前は スーパーサイヤ人 Lv1 の 超かめはめ波（2.3倍）が、きわめた かめはめ波（2.2×1.36）より 弱かった
  const c1 = mk('super_saiyan', 32, { saiyan: 10, super_saiyan: 1 });
  assert.equal(jobPower(c1, 'sy_kamehameha'), 1 + JOB_POWER * 9);
  assert.equal(jobPower(c1, 'sz_kame'), 1 + JOB_POWER * 9, 'もとの 技の 職業レベルの 威力を うけつぐ');
});

test('かめはめ波: 上の 職業ほど 強い（かめはめ波 < 超 < スパーク < 極）。MP も 上がる', () => {
  const c = mk('ss3', 42, { saiyan: 10, super_saiyan: 10, ss2: 10, ss3: 1 });
  const chain = ['sy_kamehameha', 'sz_kame', 's2_kame', 's3_kame'];
  for (let i = 1; i < chain.length; i++) {
    const a = dmg(c, chain[i - 1]), b = dmg(c, chain[i]);
    assert.ok(b >= a * 1.25, `${ABILITIES[chain[i - 1]].name} ${a} → ${ABILITIES[chain[i]].name} ${b}`);
    assert.ok(ABILITIES[chain[i]].mp > ABILITIES[chain[i - 1]].mp);
  }
  assert.ok(dmg(c, 's2_final') > dmg(c, 'hi_bigbang_kame'), 'ファイナルかめはめ波 > ビッグバンかめはめ波');
});

test('上位の 技: もとの 技が ある・ひとめぐり しない・同じ 職業の 道・上の 技は 弱く ならない', () => {
  for (const [up, base] of Object.entries(SKILL_UPS)) {
    const a = ABILITIES[up], b = ABILITIES[base];
    assert.ok(a && b, `${up} ← ${base}`);
    assert.ok(jobAncestry(a.job).has(b.job), `${a.name}（${a.job}）の 道に ${b.name}（${b.job}）`);
    const seen = new Set([up]);
    for (let x = base; x; x = SKILL_UPS[x]) { assert.ok(!seen.has(x), `${up}: ひとめぐり`); seen.add(x); }
    // 1回あたりの 強さ（倍率・きほんの ダメージ）は もとの 技 いじょう
    const per = (s) => (s.effect.type === 'phys' ? s.effect.mult * (s.effect.hits || 1) : (s.effect.base[0] + s.effect.base[1]) / 2);
    if (a.effect.type === b.effect.type && ['phys', 'magic'].includes(a.effect.type)) assert.ok(per(a) > per(b), `${a.name} > ${b.name}`);
  }
  // 大魔道士に なった ばかりでも メラガイアーは メラゾーマより はっきり 強い（前は 1.14倍）
  const am = mk('archmage', 36, { mage: 10, priest: 10, sage: 10, magic_knight: 10, archmage: 1 });
  assert.ok(jobPower(am, 'am_meragaia') >= jobPower(am, 'merazoma'));
  // ロトの勇者: ギガクロスブレイク > ギガスラッシュ（前は 0.93倍）
  const lt = mk('loto_hero', 40, { hero: 10, battlemaster: 10, sage: 10, paladin: 10, loto_hero: 1 });
  assert.ok(dmg(lt, 'lt_gigacross', 'sand_crab') > dmg(lt, 'hr_gigaslash', 'sand_crab') * 1.3);
});

// ───────────── 3. 戦いの 技の せつめい ─────────────
test('技の せつめい: 相手・MP・威力の 目安・属性・効果（敵1体・自分・全体・道具）', () => {
  const pc = { job: 'super_saiyan', jobs: { saiyan: { lv: 10 }, super_saiyan: { lv: 1 } } };
  const k = battleSkillText('sz_kame', pc, { touch: true });
  assert.match(k, /MP14・敵1体/);
  assert.match(k, /威力：ふつうの攻撃の約4\.6倍/);
  assert.match(k, /かめはめ波の上位の技/);
  assert.match(k, /▶もう一度タップで使う/);
  assert.doesNotMatch(battleSkillText('sz_kame', pc), /タップ/, 'タッチで ない ときは 出さない');
  const aura = battleSkillText('sz_aura', pc);
  assert.match(aura, /自分/);
  assert.match(aura, /効果：攻撃力・素早さ×1\.3（35秒）/);
  assert.match(battleSkillText('sz_kikouha', pc), /敵全体/);
  const mage = { job: 'mage', jobs: { mage: { lv: 1 } } };
  const mera = battleSkillText('mera', mage);
  assert.match(mera, /炎属性/);
  assert.match(mera, /ダメージ約12〜16/);
  assert.match(battleSkillText('hoimi', mage), /HPを約\d+〜\d+回復/);
  assert.match(battleSkillText('hoimi', mage), /⚠僧侶の技/, '転職の ペナルティ');
  assert.match(battleSkillText('rariho', mage), /敵1グループ/);
  assert.match(battleSkillText('rariho', mage), /ねむりにする（50%）/);
  // どの 技でも 見出しと 相手が 出る（こわれない）
  for (const id of Object.keys(ABILITIES)) {
    const t = battleSkillText(id, { job: 'warrior', jobs: {} });
    assert.ok(/^【.+】/.test(t), id);
  }
  // 道具
  assert.match(battleItemText('herb'), /味方1人/);
  assert.match(battleItemText('herb'), /HPを約30〜40回復/);
  assert.match(battleItemText('revive_flower'), /生き返らせる/);
  assert.match(battleItemText('smoke_ball'), /にげる/);
  for (const [id, it] of Object.entries(ITEMS)) if (it.battle) assert.ok(battleItemText(id).length > 8, id);
});

test('技の せつめい: 戦いの 画面は 一覧の タップで せつめい → もう一度で 使う（tapConfirm）', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(src, /battleSkillText\(it\.value, pc, \{ touch: this\.touchUi\(\) \}\)/);
  assert.match(src, /battleItemText\(it\.value/);
  assert.equal((src.match(/, true\);\n/g) || []).length >= 2, true, '呪文・特技・道具の 一覧は tapConfirm');
  const dom = fs.readFileSync(new URL('../public/js/client/ui/dom.js', import.meta.url), 'utf8');
  assert.match(dom, /if \(moved && this\.tapConfirm\)/);
});

// ───────────── 4. 経験値と お金 ─────────────
test('経験値と お金: きほんの 倍率は 0.6・0.7。設定の 倍率は その 上に かかる', () => {
  assert.equal(REWARD_EXP_RATE, 0.6);
  assert.equal(REWARD_GOLD_RATE, 0.7);
  assert.equal(rewardExp(100), 60);
  assert.equal(rewardExp(1), 1, '0 で なければ 1 いじょう');
  assert.equal(rewardExp(0), 0);
  assert.equal(rewardGold(100), 70);
  assert.equal(scaleExp({ difficulty: { exp: 0.5 } }, rewardExp(100)), 30, '×0.5 の 設定なら 100 → 30');
  assert.equal(scaleExp({ difficulty: { exp: 0.75 } }, rewardExp(100)), 45);
  // 宝箱・ひみつのダンジョンの お金も 0.7
  assert.equal(sdBigReward(10).find((e) => e.gold).gold, rewardGold(1000));
  const rng = makeRng(5);
  for (let i = 0; i < 200; i++) {
    const l = fieldChestLoot('plains', rng);
    if (l.gold) assert.ok(l.gold <= Math.round(70 * 0.7), `野原の 宝箱 ${l.gold}`);
  }
});

test('経験値と お金: 戦いで もらう 量（ふつう）。職業の 修行は 今まで どおり', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(51);
  const e0 = c.exp, g0 = c.gold, b0 = c.jobs.warrior.b || 0;
  await win(world, bot, startFieldBattle(world, bot.s, sym(['wolf', 'wolf', 'skeleton'])));
  const base = MONSTERS.wolf.exp * 2 + MONSTERS.skeleton.exp;
  const gold = MONSTERS.wolf.gold * 2 + MONSTERS.skeleton.gold;
  assert.equal(c.exp - e0, rewardExp(base), `経験値 ${base} → ${rewardExp(base)}`);
  assert.equal(c.gold - g0, rewardGold(gold), `お金 ${gold} → ${rewardGold(gold)}`);
  assert.ok((c.jobs.warrior.b || 0) > b0, '職業の 修行は すすむ');
  const end = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end.lines.some((l) => l.includes(`${rewardExp(base)}ポイントの経験値`)));
});

test('第26回の 文: 使えない 漢字・スペースが ない', () => {
  const files = gameFiles().filter((f) => /companions-ch4|friend-powder|world\/powder|skill-ups|skillinfo/.test(f));
  assert.equal(files.length, 5);
  for (const f of files) assert.deepEqual(checkFile(f).filter((p) => p.kind !== 'kana'), [], f);
});
