// 第31回（担当B）: レベルアップの まとめ・酒場の 仲間は レベル1から・しあわせのぼうし・こうふくのくつ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { ITEMS, ITEM_KANA, itemKana } from '../public/js/shared/data/items.js';
import { ITEMS_R31, HAT_EXP_MULT, SHOE_STEPS, perkText } from '../public/js/shared/data/items-r31.js';
import { PRIZES, MEDAL_REWARDS } from '../public/js/shared/data/casino.js';
import { MEDAL_SPOTS } from '../public/js/shared/maps/casino.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { recruitNpc, companionOf, partyOf, TAVERN_JOIN_LEVEL, npcStartLevel } from '../public/js/shared/world/party.js';
import { grantWagon } from '../public/js/shared/world/wagon.js';
import { walkSteps, expHatMult, topLevel, hasPerk } from '../public/js/shared/world/perks.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { bestEquipPlan } from '../public/js/shared/equip-plan.js';
import { resultKind } from '../public/js/client/ui/result.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const sym = (group) => ({ id: 'r31' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false });

async function solo(seed = 31, lv = 15) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  if (lv > 1) gainExp(c, expForLevel(lv) - c.exp);
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
const lastEnd = (bot) => bot.msgs.filter((m) => m.t === 'battleEnd').pop();
const setLevel = (ch, lv) => { gainExp(ch, expForLevel(lv) - ch.exp); ch.hp = computeStats(ch).maxHp; };

test('レベルアップの まとめ: 1レベルずつ 出さない。自分と 仲間を 1人 1〜2行で 1画面に', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(31, 1);
  recruitNpc(world, bot.s, 'npc_mina', { force: true });
  // 経験値の 多い 魔物（ボスでは ない）
  const big = Object.keys(MONSTERS).filter((k) => !MONSTERS[k].boss && MONSTERS[k].exp > 0).sort((a, b) => MONSTERS[b].exp - MONSTERS[a].exp)[0];
  const mina = companionOf(c, 'npc_mina').char;
  assert.equal(mina.level, 1);
  const lv0 = c.level;
  await win(world, bot, startFieldBattle(world, bot.s, sym([big, big])));
  assert.ok(c.level >= lv0 + 2, `何レベルか 上がる（${lv0}→${c.level}）`);
  const end = lastEnd(bot);
  const L = end.lines;
  assert.ok(end.levelUp);
  assert.ok(!L.some((l) => /のレベルが\d+に上がった/.test(l)), `1レベルずつの 行は ない: ${L.join('/')}`);
  assert.ok(!L.some((l) => /^(HP|MP|力)\+/.test(l)), '強さだけの 行は ない');
  assert.ok(!L.some((l) => /技の威力が上がった/.test(l)), '職業レベルの 長い 行は ない');
  const mine = L.filter((l) => l.startsWith(`ナナ　`));
  assert.equal(mine.length, 1, '自分は 1行');
  assert.match(mine[0], new RegExp(`^ナナ　Lv${lv0}→${c.level}`));
  assert.equal(resultKind(mine[0]), 'level');
  const ms = L.filter((l) => l.startsWith('ミーナ　'));
  assert.equal(ms.length, 1, '仲間も 1行');
  assert.match(ms[0], new RegExp(`Lv1→${mina.level}`));
  // 覚えた 技は「覚えた：」の 1行に まとめる（1人 2行まで）
  for (const l of L.filter((x) => /覚えた/.test(x))) assert.match(l, /^覚えた：/);
  // 自分の 行は 経験値・お金の あと
  assert.ok(L.indexOf(mine[0]) > L.findIndex((l) => /経験値をかくとく/.test(l)));
});

test('酒場で 新しく 仲間に なる 人は レベル1から。ものがたりの 仲間（ルカ）と 今 いる 仲間は そのまま', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(32, 20);
  assert.equal(TAVERN_JOIN_LEVEL, 1);
  // 酒場の 一覧の レベル
  const info = openService(world, bot.s, 'tavern');
  for (const e of info.recruits) assert.equal(e.level, 1, e.key);
  const svc = (msg) => {
    serviceAction(world, bot.s, { kind: 'tavern', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  const r = svc({ action: 'recruit', key: 'npc_gard' });
  assert.ok(r.ok, r.text);
  assert.equal(companionOf(c, 'npc_gard').char.level, 1);
  assert.equal(companionOf(c, 'npc_gard').char.jobs.warrior.lv, 1);
  assert.ok(companionOf(c, 'npc_gard').char.hp > 0);
  // ものがたり（world/scripts.js の 'recruit' は force）
  recruitNpc(world, bot.s, 'npc_luca', { force: true });
  assert.equal(companionOf(c, 'npc_luca').char.level, 19, 'ものがたりの 仲間は 主人公の 1つ下');
  assert.equal(npcStartLevel(c, true), 19);
  // 今 いる 仲間の レベルは かわらない（酒場を 開きなおしても）
  setLevel(companionOf(c, 'npc_gard').char, 12);
  openService(world, bot.s, 'tavern');
  assert.equal(companionOf(c, 'npc_gard').char.level, 12);
});

test('しあわせのぼうし: 経験値2倍。パーティー（馬車も）で いちばん レベルが 高い 人には 効かない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(33, 15);
  grantWagon(c);
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin', 'npc_tina']) assert.ok(recruitNpc(world, bot.s, id, { force: true }).ok, id);
  assert.deepEqual(c.wagonKeys, ['npc_rin', 'npc_tina'], '4人めから 馬車');
  const ch = (k) => companionOf(c, k).char;
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin', 'npc_tina']) setLevel(ch(k), 10);
  const fight = async () => {
    const before = { me: c.exp, gard: ch('npc_gard').exp, mina: ch('npc_mina').exp, rin: ch('npc_rin').exp, tina: ch('npc_tina').exp };
    await win(world, bot, startFieldBattle(world, bot.s, sym(['wolf', 'wolf'])));
    return { me: c.exp - before.me, gard: ch('npc_gard').exp - before.gard, mina: ch('npc_mina').exp - before.mina, rin: ch('npc_rin').exp - before.rin, tina: ch('npc_tina').exp - before.tina };
  };
  const base = await fight();
  assert.ok(base.me > 0 && base.gard > 0 && base.rin > 0);
  // 主人公（Lv15）が いちばん 高い: 主人公の ぼうしは 効かない。仲間（Lv10）・馬車の 仲間の ぼうしは 効く
  c.equip.head = 'shiawase_boushi';
  ch('npc_gard').equip.head = 'shiawase_boushi';
  ch('npc_rin').equip.head = 'shiawase_boushi+1'; // きたえた ぼうしも 同じ
  let d = await fight();
  assert.equal(d.me, base.me, 'いちばん 高い 人は 2倍に ならない');
  assert.equal(d.gard, base.gard * HAT_EXP_MULT, '仲間は 2倍');
  assert.equal(d.mina, base.mina, 'ぼうしの ない 仲間は そのまま');
  assert.equal(d.rin, base.rin * HAT_EXP_MULT, '馬車の 仲間も 2倍');
  assert.equal(d.tina, base.tina);
  assert.ok(!lastEnd(bot).lines.some((l) => /しあわせのぼうしで2倍/.test(l)));
  // 馬車の 仲間が いちばん 高い（Lv30）→ 主人公の ぼうしも 効く
  setLevel(ch('npc_tina'), 30);
  d = await fight();
  assert.equal(d.me, base.me * HAT_EXP_MULT, '馬車の 仲間も くらべる');
  assert.ok(lastEnd(bot).lines.some((l) => l.includes(`${base.me * HAT_EXP_MULT}ポイントの経験値をかくとく！（しあわせのぼうしで2倍）`)), lastEnd(bot).lines.join('/'));
  // 同じ レベルが 何人も（主人公と ティナが Lv30）→ どちらも 効かない
  setLevel(c, 30);
  c.equip.head = 'shiawase_boushi';
  ch('npc_tina').equip.head = 'shiawase_boushi';
  assert.equal(topLevel([c, ch('npc_tina'), ch('npc_gard')]), 30);
  assert.equal(expHatMult(c, 30), 1);
  assert.equal(expHatMult(ch('npc_tina'), 30), 1);
  assert.equal(expHatMult(ch('npc_gard'), 30), HAT_EXP_MULT);
  assert.equal(expHatMult(ch('npc_mina'), 30), 1, 'ぼうしが なければ 1');
});

test('こうふくのくつ: 10歩 あるくごとに MPが 1 回復（つけた 人ごと・フィールドと ダンジョン・空は なし）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(34, 15);
  grantWagon(c);
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin']) recruitNpc(world, bot.s, id, { force: true });
  const ch = (k) => companionOf(c, k).char;
  const s = bot.s;
  const drain = () => { for (const x of [c, ch('npc_gard'), ch('npc_mina'), ch('npc_rin')]) x.mp = 0; };
  drain();
  // つけていない 人は 回復しない
  walkSteps(world, s, SHOE_STEPS * 3);
  assert.equal(c.mp, 0);
  c.equip.acc = 'koufuku_kutsu';
  ch('npc_mina').equip.acc = 'koufuku_kutsu';
  ch('npc_rin').equip.acc = 'koufuku_kutsu';
  assert.ok(hasPerk(c, 'walkMp'));
  for (let i = 0; i < SHOE_STEPS - 1; i++) walkSteps(world, s, 1);
  assert.equal(c.mp, 0, '9歩では まだ');
  walkSteps(world, s, 1);
  assert.equal(c.mp, 1, '10歩で 1');
  assert.equal(ch('npc_mina').mp, 1, 'パーティーの 仲間も');
  assert.equal(ch('npc_rin').mp, 1, '馬車の 仲間も（フィールド）');
  assert.equal(ch('npc_gard').mp, 0, 'つけていない 人は そのまま');
  walkSteps(world, s, 25);
  assert.equal(c.mp, 3, '35歩で 3');
  // 最大MPより 上には ならない
  c.mp = computeStats(c).maxMp;
  walkSteps(world, s, SHOE_STEPS);
  assert.equal(c.mp, computeStats(c).maxMp);
  // 死んでいる 人は 回復しない
  drain();
  ch('npc_mina').hp = 0;
  walkSteps(world, s, SHOE_STEPS);
  assert.equal(ch('npc_mina').mp, 0);
  ch('npc_mina').hp = 1;
  // 空を とんでいる 時は 歩いていない
  drain();
  s.flying = true;
  walkSteps(world, s, SHOE_STEPS);
  assert.equal(c.mp, 0);
  s.flying = false;
  // ダンジョン: 自分と パーティーは 回復。馬車は 入口で 待っている
  const dungeon = Object.keys(MAPS).find((k) => MAPS[k].kind === 'dungeon' && !MAPS[k].wagonOk && k === 'cave_b1');
  s.map = dungeon;
  drain();
  walkSteps(world, s, SHOE_STEPS);
  assert.equal(c.mp, 1);
  assert.equal(ch('npc_mina').mp, 1);
  assert.equal(ch('npc_rin').mp, 0, '洞窟では 馬車は いっしょに 歩かない');
  // 戦い・会話の 間（busy）は 数えない
  s.map = 'overworld';
  drain();
  s.busy = 'script';
  walkSteps(world, s, SHOE_STEPS * 2);
  assert.equal(c.mp, 0);
  s.busy = null;
});

test('こうふくのくつ: サーバーの 移動（1歩ずつ）で 数える。同じ マスの 中の 移動は 数えない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(35, 15);
  const s = bot.s;
  c.equip.acc = 'koufuku_kutsu';
  c.mp = 0;
  const map = MAPS[s.map];
  const x0 = Math.floor(s.x), y = Math.floor(s.y);
  // 歩ける となりの マスを 行ったり 来たり
  const sendMove = (x) => world.onMove(s, { x: x + 0.5, y: y + 0.5, dir: 'right', moving: true, seq: s.posSeq });
  let moved = 0;
  s.x = x0 + 0.5;
  s.y = y + 0.5;
  for (let i = 0; i < 20; i++) {
    const x = i % 2 ? x0 : x0 + 1;
    const before = Math.floor(s.x);
    sendMove(x);
    if (Math.floor(s.x) !== before) moved++;
    // 同じ マスの 中で 少し うごく
    world.onMove(s, { x: Math.floor(s.x) + 0.7, y: y + 0.5, dir: 'right', moving: true, seq: s.posSeq });
  }
  assert.ok(map && moved === 20, `歩けた ${moved}`);
  assert.equal(c.mp, 2, '20歩で 2');
});

test('しあわせのぼうし・こうふくのくつ: データ・景品・ごほうび・せつめい', () => {
  const hat = ITEMS.shiawase_boushi, shoe = ITEMS.koufuku_kutsu;
  assert.equal(hat.type, 'head');
  assert.equal(hat.perk, 'expHat');
  assert.equal(shoe.type, 'acc');
  assert.equal(shoe.perk, 'walkMp');
  assert.ok(!(hat.price > 0) && !(shoe.price > 0), '店では 売らない');
  for (const id of Object.keys(ITEMS_R31)) {
    assert.ok(ITEM_KANA[id], `${id} の 読み`);
    assert.ok(perkText(ITEMS[id]), `${id} の 力の せつめい`);
  }
  assert.equal(itemKana('shiawase_boushi'), 'しあわせのぼうし');
  assert.ok(PRIZES.some((p) => p.id === 'shiawase_boushi'), 'カジノの 景品');
  const r35 = MEDAL_REWARDS.find((r) => r.items.some(([id]) => id === 'koufuku_kutsu'));
  assert.equal(r35?.at, 35, 'メダル王の 35枚');
  // ごほうびは 少ない 順
  assert.deepEqual(MEDAL_REWARDS.map((r) => r.at), [...MEDAL_REWARDS.map((r) => r.at)].sort((a, b) => a - b));
  // 文字の きまり
  for (const f of ['public/js/shared/data/items-r31.js', 'public/js/shared/world/growth.js', 'public/js/shared/world/perks.js', 'public/js/client/ui/result.js']) {
    assert.deepEqual(checkFile(f), [], f);
  }
});

test('みんなさいきょう装備: ふしぎな 力の ある ぼうし・くつは はずさない', () => {
  const ch = { name: 'ナナ', job: 'warrior', level: 20, exp: 0, jobs: { warrior: { lv: 1, b: 0 } }, equip: { weapon: null, armor: null, shield: null, head: 'shiawase_boushi', acc: null }, look: {} };
  const bag = { items: [{ id: 'iron_helm', n: 1 }, { id: 'leather_hat', n: 1 }] };
  const plan = bestEquipPlan([{ key: 'self', char: ch }], bag);
  assert.ok(!plan.some((p) => p.changes.some((x) => x.slot === 'head')), JSON.stringify(plan));
});

test('メダル王: あとから ふえた ごほうび（35枚）は、もう 35枚 わたしていれば メダルが なくても もらえる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(36), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c2_ship = true;
  world.placeSession(bot.s, 'medal_castle', 8, 3.5, 'up', true);
  bot.s.busy = 'script';
  openService(world, bot.s, 'medalKing');
  // むかしの セーブ: 30か所 ＋ 大迷宮の 10枚を 見つけて、40枚 わたした（35枚の ごほうびは なかった）
  c.medalSpots = Object.fromEntries(MEDAL_SPOTS.map((sp) => [sp.id, 1]));
  for (let i = 1; i <= 10; i++) c.medalSpots[`lab_old_${i}`] = 1;
  c.medalsGiven = 40;
  c.medalRewards = { 5: true, 10: true, 15: true, 20: true, 25: true, 30: true, 40: true };
  const give = () => {
    serviceAction(world, bot.s, { kind: 'medal', action: 'give' });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let r = give();
  assert.equal(r.ok, true, r.text);
  assert.equal(r.gave, 0);
  assert.deepEqual(r.got.map((g) => g.at), [35]);
  assert.equal(itemCount(c, 'koufuku_kutsu'), 1);
  r = give();
  assert.equal(r.ok, false, 'もう ない');
  assert.equal(itemCount(c, 'koufuku_kutsu'), 1);
  assert.ok(partyOf(world, bot.s) || true);
});
